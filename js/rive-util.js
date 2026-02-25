/**
 * Rive Utility Module
 * 用于处理 Rive 文件的工具函数
 *
 * 支持两种文件格式：
 * - .riv (Runtime) — 运行时导出文件，可被 @rive-app/canvas 加载
 * - .rev (Editor)  — 编辑器备份文件，仅可拖入 Rive 编辑器恢复，运行时无法加载
 */

const fs = require('fs');
const path = require('path');

// Rive Runtime 二进制格式标识（.riv 文件头部 4 字节）
const RIVE_MAGIC = 'RIVE';

// .rev 文件特征：头部不是 "RIVE"，但文件内包含 "ART" 标记
const REV_ART_MARKER = 'ART';

// Rive 核心对象 typeKey（来源于 rive-cpp artboard_base.hpp）
// 旧版 typeKey = 23（Backboard），新版 Artboard typeKey = 1 或 105
const ARTBOARD_TYPE_KEYS = [1, 105];

// Rive 核心属性 propertyKey（来源于 rive-cpp layout_component_base.hpp）
const WIDTH_PROPERTY_KEYS = [7, 207];   // LayoutComponentBase::widthPropertyKey
const HEIGHT_PROPERTY_KEYS = [8, 208];  // LayoutComponentBase::heightPropertyKey
const NAME_PROPERTY_KEYS = [4, 203];    // ComponentBase::namePropertyKey

// 运行时内置的属性类型映射（不在 ToC 中但运行时已知的属性）
// ft: 0=uint(varuint), 1=string(varuint+bytes), 2=double(float32), 3=color(varuint)
const KNOWN_PROPERTY_FIELD_TYPES = {
    4: 1,   // ComponentBase::namePropertyKey = string
    5: 0,   // ComponentBase::parentIdPropertyKey = uint
    7: 2,   // LayoutComponentBase::widthPropertyKey = double
    8: 2,   // LayoutComponentBase::heightPropertyKey = double
    11: 2,  // ArtboardBase::originXPropertyKey = double
    12: 2,  // ArtboardBase::originYPropertyKey = double
    13: 2,  // NodeBase::xPropertyKey = double
    14: 2,  // NodeBase::yPropertyKey = double
    15: 2,  // TransformComponentBase::rotation = double
    16: 2,  // TransformComponentBase::scaleX = double
    17: 2,  // TransformComponentBase::scaleY = double
    18: 2,  // opacity = double
    19: 0,  // DrawableBase::blendModeValue = uint
    20: 0,  // DrawableBase::drawableFlags = uint
    196: 0, // LayoutComponentBase::clipPropertyKey = uint (bool)
    236: 0, // ArtboardBase::defaultStateMachineIdPropertyKey = uint
};

/**
 * 文件格式类型
 */
const FileFormat = {
    UNKNOWN: 'unknown',
    RIV: 'riv',       // Runtime 格式，可预览
    REV: 'rev',       // Editor 备份格式，不可预览
};

/**
 * 读取 LEB128 编码的无符号整数
 */
function readVarUint(buffer, offset) {
    let result = 0;
    let shift = 0;
    let pos = offset;

    while (pos < buffer.length) {
        const byte = buffer[pos];
        result |= (byte & 0x7F) << shift;
        pos++;
        if ((byte & 0x80) === 0) break;
        shift += 7;
        if (shift > 35) break;
    }

    return { value: result, bytesRead: pos - offset };
}

/**
 * 读取 Rive 字符串（LEB128 长度前缀 + UTF-8 内容）
 */
function readString(buffer, offset) {
    const { value: length, bytesRead } = readVarUint(buffer, offset);
    let pos = offset + bytesRead;

    if (pos + length > buffer.length) {
        return { value: '', bytesRead: bytesRead + length };
    }

    const str = buffer.slice(pos, pos + length).toString('utf-8');
    return { value: str, bytesRead: bytesRead + length };
}

/**
 * 检测文件是否为 .rev 格式
 * .rev 文件头部不是 "RIVE"，但在前 16 字节内包含 "ART" 标记
 */
function detectRevFormat(buffer) {
    // .rev 文件特征：前 4 字节不是 RIVE，但头部包含 ART
    const header16 = buffer.slice(0, 16).toString('ascii');
    return header16.includes(REV_ART_MARKER);
}

/**
 * 解析 Rive 文件信息
 *
 * @param {string} src - 文件路径
 * @returns {{ format: string, isValid: boolean, majorVersion: number, minorVersion: number, width: number, height: number, artboardName: string, fileSize: number }}
 */
function parseRiveFile(src) {
    const result = {
        format: FileFormat.UNKNOWN,
        isValid: false,
        majorVersion: 0,
        minorVersion: 0,
        width: 0,
        height: 0,
        artboardName: '',
        fileSize: 0,
    };

    try {
        if (!fs.existsSync(src)) return result;

        const stats = fs.statSync(src);
        result.fileSize = stats.size;

        // 读取文件头部（需要足够大以跨过嵌入资源找到 Artboard 对象）
        const fd = fs.openSync(src, 'r');
        const headerSize = Math.min(stats.size, 65536);
        const buffer = Buffer.alloc(headerSize);
        fs.readSync(fd, buffer, 0, headerSize, 0);
        fs.closeSync(fd);

        // 检测格式
        const magic = buffer.slice(0, 4).toString('ascii');

        if (magic === RIVE_MAGIC) {
            // ===== .riv Runtime 格式 =====
            result.format = FileFormat.RIV;
            result.isValid = true;

            let pos = 4;

            const major = readVarUint(buffer, pos);
            result.majorVersion = major.value;
            pos += major.bytesRead;

            const minor = readVarUint(buffer, pos);
            result.minorVersion = minor.value;
            pos += minor.bytesRead;

            const fingerprint = readVarUint(buffer, pos);
            pos += fingerprint.bytesRead;

            // ===== Rive 7+ Table of Contents =====
            // 格式参考 rive-cpp runtime_header.hpp：
            //   1. 属性键列表（varuint，以 0 结尾）
            //   2. 位数组（每 4 个属性占一个 uint32 LE，每属性 2 位表示后备类型）
            //      ft: 0=uint(varuint), 1=string(varuint+bytes), 2=double(float32), 3=color(varuint)
            const tocFieldIndex = {};

            if (result.majorVersion >= 7) {
                try {
                    // 读取属性键列表
                    const tocKeys = [];
                    while (pos < buffer.length) {
                        const k = readVarUint(buffer, pos);
                        pos += k.bytesRead;
                        if (k.value === 0) break;
                        tocKeys.push(k.value);
                    }

                    // 读取位数组：每次读取 uint32（4 字节 LE），每 2 位一个属性，16 属性/uint32
                    let currentInt = 0;
                    let currentBit = 8; // 初始值 8 触发首次 uint32 读取
                    for (const propKey of tocKeys) {
                        if (currentBit === 8) {
                            if (pos + 4 > buffer.length) break;
                            currentInt = buffer.readUInt32LE(pos);
                            pos += 4;
                            currentBit = 0;
                        }
                        tocFieldIndex[propKey] = (currentInt >> currentBit) & 3;
                        currentBit += 2;
                    }
                } catch (e) { /* continue without ToC */ }
            }

            // 获取属性的后备类型（优先 ToC，其次运行时内置映射）
            function getFieldType(propKey) {
                if (tocFieldIndex[propKey] !== undefined) return tocFieldIndex[propKey];
                if (KNOWN_PROPERTY_FIELD_TYPES[propKey] !== undefined) return KNOWN_PROPERTY_FIELD_TYPES[propKey];
                return -1;
            }

            // 跳过一个属性值
            function skipPropertyValue(propKey) {
                const ft = getFieldType(propKey);
                if (ft === -1) return false;
                if (ft === 0 || ft === 3) { // uint 或 color = varuint
                    const v = readVarUint(buffer, pos);
                    pos += v.bytesRead;
                } else if (ft === 1) { // string = varuint 长度 + bytes
                    const len = readVarUint(buffer, pos);
                    pos += len.bytesRead + len.value;
                } else if (ft === 2) { // double = float32 (4 bytes)
                    pos += 4;
                }
                return true;
            }

            // ===== 遍历对象，查找第一个 Artboard =====
            try {
                let safetyLimit = 300;
                let found = false;

                while (pos < buffer.length && safetyLimit-- > 0 && !found) {
                    const typeId = readVarUint(buffer, pos);
                    pos += typeId.bytesRead;
                    if (typeId.value === 0) continue;

                    const isArtboard = ARTBOARD_TYPE_KEYS.includes(typeId.value);
                    let ok = true;

                    // 遍历对象的属性
                    while (pos < buffer.length) {
                        const propKey = readVarUint(buffer, pos);
                        pos += propKey.bytesRead;
                        if (propKey.value === 0) break;

                        if (isArtboard && NAME_PROPERTY_KEYS.includes(propKey.value)) {
                            const name = readString(buffer, pos);
                            result.artboardName = name.value;
                            pos += name.bytesRead;
                        } else if (isArtboard && WIDTH_PROPERTY_KEYS.includes(propKey.value)) {
                            if (pos + 4 <= buffer.length) {
                                result.width = Math.round(buffer.readFloatLE(pos));
                            }
                            pos += 4;
                        } else if (isArtboard && HEIGHT_PROPERTY_KEYS.includes(propKey.value)) {
                            if (pos + 4 <= buffer.length) {
                                result.height = Math.round(buffer.readFloatLE(pos));
                            }
                            pos += 4;
                        } else {
                            if (!skipPropertyValue(propKey.value)) {
                                ok = false;
                                break;
                            }
                        }
                    }

                    if (isArtboard && result.width > 0 && result.height > 0) {
                        found = true;
                    }
                    if (!ok) break;
                }
            } catch (e) { /* keep what we have */ }

        } else if (detectRevFormat(buffer)) {
            // ===== .rev Editor 备份格式 =====
            result.format = FileFormat.REV;
            result.isValid = true;
            // .rev 格式无法用运行时解析尺寸，保留 0
        } else {
            // 通过文件扩展名兜底判断
            const ext = path.extname(src).toLowerCase();
            if (ext === '.rev') {
                result.format = FileFormat.REV;
                result.isValid = true;
            }
        }

    } catch (e) { /* file read failed */ }

    return result;
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 转义 XML 特殊字符
 */
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * 生成 .riv 运行时文件的缩略图
 */
function buildRivSvg(ext, displayName, displayDimensions, displaySize) {
    return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="50%" stop-color="#16213e"/>
      <stop offset="100%" stop-color="#0f3460"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e94560"/>
      <stop offset="100%" stop-color="#ff6b6b"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e94560" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#533483" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="175" r="72" fill="none" stroke="url(#ring)" stroke-width="2"/>
  <circle cx="200" cy="175" r="56" fill="none" stroke="url(#ring)" stroke-width="1" stroke-dasharray="8 4"/>
  <circle cx="200" cy="175" r="40" fill="url(#accent)" opacity="0.9"/>
  <polygon points="190,155 190,195 220,175" fill="white" opacity="0.95"/>
  <rect x="160" y="236" width="80" height="24" rx="12" fill="url(#accent)" opacity="0.85"/>
  <text x="200" y="252" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">.${ext} 文件</text>
  <text x="200" y="295" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="600" fill="white" text-anchor="middle" opacity="0.95">${escapeXml(displayName)}</text>
  <text x="200" y="318" font-family="Arial,Helvetica,sans-serif" font-size="11" fill="white" text-anchor="middle" opacity="0.5">${displayDimensions}${displayDimensions && displaySize ? '  ·  ' : ''}${displaySize}</text>
  <text x="200" y="375" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle" opacity="0.3" letter-spacing="3">RIVE</text>
</svg>`;
}

/**
 * 生成 .rev 编辑器备份文件的缩略图
 * 使用不同的配色方案以区分，并标注"Editor File"
 */
function buildRevSvg(displayName, displaySize) {
    return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1c1c1c"/>
      <stop offset="100%" stop-color="#2d2d2d"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect x="20" y="20" width="360" height="360" rx="12" fill="none" stroke="#444" stroke-width="1" stroke-dasharray="6 4"/>
  <!-- 文件图标 -->
  <g transform="translate(160, 100)">
    <rect x="0" y="0" width="56" height="68" rx="4" fill="#3a3a3a" stroke="#555" stroke-width="1"/>
    <path d="M36,0 L56,20 L36,20 Z" fill="#4a4a4a"/>
    <rect x="10" y="32" width="36" height="3" rx="1.5" fill="#666"/>
    <rect x="10" y="40" width="28" height="3" rx="1.5" fill="#555"/>
    <rect x="10" y="48" width="32" height="3" rx="1.5" fill="#555"/>
  </g>
  <!-- REV 标签 -->
  <rect x="152" y="186" width="96" height="28" rx="14" fill="#f59e0b" opacity="0.9"/>
  <text x="200" y="205" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">.REV 文件</text>
  <!-- 说明 -->
  <text x="200" y="245" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#999" text-anchor="middle">Rive 编辑器备份</text>
  <text x="200" y="264" font-family="Arial,Helvetica,sans-serif" font-size="10" fill="#666" text-anchor="middle">在 Rive 编辑器中打开以预览</text>
  <!-- 文件名 -->
  <text x="200" y="305" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="600" fill="white" text-anchor="middle" opacity="0.9">${escapeXml(displayName)}</text>
  <!-- 文件大小 -->
  <text x="200" y="326" font-family="Arial,Helvetica,sans-serif" font-size="11" fill="white" text-anchor="middle" opacity="0.4">${displaySize}</text>
  <!-- 底部品牌 -->
  <text x="200" y="375" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle" opacity="0.2" letter-spacing="3">RIVE</text>
</svg>`;
}

/**
 * 生成缩略图
 * @param {string} src - 源文件路径
 * @param {string} dest - 目标 PNG 文件路径
 * @param {{ format: string, width: number, height: number, fileSize: number }} info - 文件信息
 */
async function generateThumbnail(src, dest, info) {
    const fileName = path.basename(src);
    const ext = path.extname(src).toLowerCase().replace('.', '').toUpperCase();
    const displaySize = formatFileSize(info.fileSize);
    const displayName = fileName.length > 24 ? fileName.substring(0, 21) + '...' : fileName;
    const displayDimensions = (info.width > 0 && info.height > 0) ? `${info.width} × ${info.height}` : '';

    let svg;
    if (info.format === FileFormat.REV) {
        svg = buildRevSvg(displayName, displaySize);
    } else {
        svg = buildRivSvg(ext, displayName, displayDimensions, displaySize);
    }

    try {
        const sharp = require('sharp');
        await sharp(Buffer.from(svg)).png().toFile(dest);
    } catch (err) {
        const minimalPng = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
            0xAE, 0x42, 0x60, 0x82,
        ]);
        fs.writeFileSync(dest, minimalPng);
    }
}

module.exports = {
    FileFormat,
    parseRiveFile,
    generateThumbnail,
    formatFileSize,
};
