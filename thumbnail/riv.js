/**
 * Rive Thumbnail Generator for Eagle
 *
 * 渲染方式（参考 Eagle 3D Format Extension 的实现模式）：
 *   Eagle 的缩略图脚本运行在 Electron 渲染进程中，可直接访问 DOM。
 *   因此我们可以：创建 <canvas> → 加载 Rive 运行时 → 渲染状态机第一帧 → toBlob() 截图。
 *
 * .riv 文件：渲染状态机（或动画）第一帧作为缩略图
 * .rev 文件：生成 SVG 占位缩略图（编辑器备份文件，运行时无法加载）
 */

const fs = require('fs');
const path = require('path');
const { FileFormat, parseRiveFile, generateThumbnail } = require('./../js/rive-util.js');

// Rive 运行时文件路径（相对于插件根目录）
// Rive 运行时 CDN URL（测试方案 - 需要网络连接）
const RIVE_CDN_URL = 'https://unpkg.com/@rive-app/webgl2@2.35.0';
const MAX_SIZE = 400;
const RENDER_TIMEOUT = 10000;

/**
 * 加载 Rive 运行时（首次加载后缓存到 window.rive，后续复用）
 */
function loadRiveRuntime() {
    if (typeof window !== 'undefined' && window.rive) {
        console.log('[Rive Thumbnail] Rive 运行时已缓存');
        return Promise.resolve();
    }

    console.log('[Rive Thumbnail] 开始从 CDN 加载 Rive 运行时...');
    console.log('[Rive Thumbnail] CDN URL:', RIVE_CDN_URL);

    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = RIVE_CDN_URL;
        s.onload = () => {
            console.log('[Rive Thumbnail] Rive 运行时加载成功');
            resolve();
        };
        s.onerror = () => {
            console.error('[Rive Thumbnail] Rive 运行时加载失败');
            reject(new Error('Failed to load Rive runtime from CDN'));
        };
        document.head.appendChild(s);
    });
}

/**
 * 按画板比例计算缩略图尺寸（不超过 MAX_SIZE）
 */
function fitSize(w, h) {
    if (w <= 0 || h <= 0) return { w: MAX_SIZE, h: MAX_SIZE };
    if (w <= MAX_SIZE && h <= MAX_SIZE) return { w, h };
    const scale = Math.min(MAX_SIZE / w, MAX_SIZE / h);
    return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

/**
 * 渲染 .riv 文件状态机的第一帧
 *
 * 流程：
 *   1. 加载 Rive 运行时（有缓存）
 *   2. 在 DOM 中创建离屏 <canvas>
 *   3. 用 buffer 加载 .riv 文件
 *   4. 获取画板尺寸，按比例调整 canvas
 *   5. 优先播放第一个状态机，否则播放第一个动画
 *   6. 等待10帧渲染后 toBlob() 截图
 *   7. 写入 dest 路径
 */
async function renderFirstFrame(src, dest) {
    await loadRiveRuntime();

    // 读取 .riv 文件为 ArrayBuffer
    const fileBuffer = fs.readFileSync(src);
    const arrayBuffer = new Uint8Array(fileBuffer).buffer;

    // 创建离屏 canvas 并挂载到 DOM（Rive 需要 canvas 在 DOM 中）
    const canvas = document.createElement('canvas');
    canvas.width = MAX_SIZE;
    canvas.height = MAX_SIZE;
    canvas.style.cssText = 'position:fixed;top:-9999px;left:-9999px;pointer-events:none;opacity:0;';
    document.body.appendChild(canvas);

    // 预先创建 WebGL2 上下文，启用 preserveDrawingBuffer 以支持 toBlob()
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });

    try {
        const result = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                doCleanup();
                reject(new Error('Render timeout'));
            }, RENDER_TIMEOUT);

            let inst = null;

            function doCleanup() {
                clearTimeout(timer);
                if (inst) { try { inst.cleanup(); } catch (e) { /* ignore */ } }
            }

            inst = new rive.Rive({
                buffer: arrayBuffer,
                canvas: canvas,
                autoplay: false,
                layout: new rive.Layout({
                    fit: rive.Fit.Contain,
                    alignment: rive.Alignment.Center,
                }),
                onLoad: () => {
                    try {
                        // 获取画板真实尺寸
                        const bounds = inst.bounds;
                        const artW = bounds ? Math.round(bounds.maxX - bounds.minX) : MAX_SIZE;
                        const artH = bounds ? Math.round(bounds.maxY - bounds.minY) : MAX_SIZE;
                        const { w, h } = fitSize(artW, artH);

                        console.log('[Rive Thumbnail] 画板尺寸:', { artW, artH, thumbnailW: w, thumbnailH: h });

                        // 按画板比例调整 canvas 尺寸
                        canvas.width = w;
                        canvas.height = h;
                        canvas.style.width = w + 'px';
                        canvas.style.height = h + 'px';
                        inst.resizeDrawingSurfaceToCanvas();

                        // 优先播放第一个状态机，其次第一个动画
                        const sms = inst.stateMachineNames || [];
                        const anims = inst.animationNames || [];

                        if (sms.length > 0) {
                            inst.play(sms[0]);
                            console.log('[Rive Thumbnail] 播放状态机:', sms[0]);
                        } else if (anims.length > 0) {
                            inst.play(anims[0]);
                            console.log('[Rive Thumbnail] 播放动画:', anims[0]);
                        } else {
                            inst.play();
                            console.log('[Rive Thumbnail] 播放默认动画');
                        }

                        // 等待更多帧让 WebGL2 管线完成羽化/模糊等效果的合成
                        // 增加到 60 帧，确保复杂效果完全渲染
                        let frames = 0;
                        const WAIT_FRAMES = 60;
                        function waitFrame() {
                            frames++;
                            if (frames < WAIT_FRAMES) {
                                requestAnimationFrame(waitFrame);
                                return;
                            }

                            console.log('[Rive Thumbnail] 渲染完成，帧数:', frames);

                            // 在 rAF 回调中直接截图（此时 Rive 刚完成本帧绘制，drawingBuffer 有效）
                            try {
                                canvas.toBlob((blob) => {
                                    doCleanup();
                                    if (!blob) {
                                        reject(new Error('toBlob returned null'));
                                        return;
                                    }
                                    console.log('[Rive Thumbnail] 截图成功，大小:', blob.size);
                                    blob.arrayBuffer().then(buf => {
                                        resolve({
                                            width: w,
                                            height: h,
                                            data: Buffer.from(buf),
                                        });
                                    });
                                }, 'image/png');
                            } catch (e) {
                                console.error('[Rive Thumbnail] 截图失败:', e);
                                doCleanup();
                                reject(e);
                            }
                        }
                        requestAnimationFrame(waitFrame);
                    } catch (e) {
                        console.error('[Rive Thumbnail] 渲染过程出错:', e);
                        doCleanup();
                        reject(e);
                    }
                },
                onLoadError: () => {
                    doCleanup();
                    reject(new Error('Rive file load failed'));
                },
            });
        });

        // 写入 PNG 文件
        fs.writeFileSync(dest, result.data);
        return { width: result.width, height: result.height };
    } finally {
        // 清理 DOM
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
}

module.exports = async ({ src, dest, item }) => {
    console.log('[Rive Thumbnail] 开始生成缩略图:', src);

    const info = parseRiveFile(src);

    if (!info.isValid) {
        throw new Error('Invalid Rive file');
    }

    console.log('[Rive Thumbnail] 文件信息:', {
        format: info.format,
        width: info.width,
        height: info.height,
        isRev: info.format === FileFormat.REV
    });

    // .rev 文件：运行时无法加载，使用占位缩略图
    if (info.format === FileFormat.REV) {
        console.log('[Rive Thumbnail] .rev 文件，使用占位缩略图');
        await generateThumbnail(src, dest, info);
        item.width = info.width || 500;
        item.height = info.height || 500;
        item.noViewer = true;
        return item;
    }

    // .riv 文件：渲染状态机第一帧作为真实缩略图
    try {
        console.log('[Rive Thumbnail] .riv 文件，尝试真实渲染');
        const dims = await renderFirstFrame(src, dest);
        item.width = dims.width;
        item.height = dims.height;
        console.log('[Rive Thumbnail] 渲染成功:', dims);
    } catch (e) {
        console.error('[Rive Thumbnail] 渲染失败，降级到占位缩略图:', e.message);
        // 渲染失败（离线、文件损坏等），降级到 SVG 占位缩略图
        await generateThumbnail(src, dest, info);
        item.width = info.width || 500;
        item.height = info.height || 500;
    }

    return item;
};
