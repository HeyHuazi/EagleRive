/**
 * Data Binding module for Rive ViewModel
 */

const DataBinding = (function() {
    let currentVMI = null;

    /**
     * Get property descriptors with multiple fallback strategies
     */
    function getPropertyDescriptors(vmi, vmName) {
        let props = [];

        // Strategy 1: Direct from ViewModelInstance
        try { props = vmi.properties; } catch (e) { console.warn('[Rive] vmi.properties failed:', e); }
        if (props && props.length) {
            console.log('[Rive] 属性来源: vmi.properties, 数量:', props.length);
            return props;
        }

        // Strategy 2: From ViewModel object
        try {
            let vm = null;
            if (vmName) {
                try { vm = window.riveInstance.viewModelByName(vmName); } catch (e2) {}
            }
            if (!vm) {
                try { vm = window.riveInstance.defaultViewModel(); } catch (e2) {}
            }
            if (vm) {
                try { props = vm.properties; } catch (e2) {}
                if (props && props.length) {
                    console.log('[Rive] 属性来源: vm.properties, 数量:', props.length);
                    return props;
                }
            }
        } catch (e) { console.warn('[Rive] vm.properties failed:', e); }

        // Strategy 3: Try to get from runtime
        try {
            const rt = vmi._runtimeInstance || vmi.runtimeInstance || vmi.nativeInstance;
            if (rt && typeof rt.getProperties === 'function') {
                const raw = rt.getProperties();
                if (raw && raw.length) {
                    console.log('[Rive] 属性来源: runtime.getProperties(), 数量:', raw.length);
                    return Array.prototype.map.call(raw, function(p) {
                        return { name: p.name, type: p.type };
                    });
                }
            }
        } catch (e) { console.warn('[Rive] runtime.getProperties failed:', e); }

        return [];
    }

    /**
     * Populate ViewModel dropdown
     */
    function populateViewModel(riveInstance) {
        const sel = document.getElementById('vmSelect');
        const box = document.getElementById('vmProps');
        const vmSection = document.getElementById('vmSection');
        box.innerHTML = '';
        currentVMI = null;

        function hideVM() {
            vmSection.style.display = 'none';
        }

        if (!riveInstance) {
            sel.innerHTML = '<option value="">无视图模型</option>';
            hideVM();
            return;
        }

        let count = 0;
        try { count = riveInstance.viewModelCount || 0; } catch (e) {
            console.warn('[Rive] viewModelCount error:', e);
        }
        console.log('[Rive] viewModelCount:', count);

        // Check autoBind default instance
        let autoVMI = null;
        try { autoVMI = riveInstance.viewModelInstance; } catch (e) {}
        console.log('[Rive] autoBind viewModelInstance:', autoVMI ? '已绑定' : '未绑定');

        if (!count && !autoVMI) {
            sel.innerHTML = '<option value="">无视图模型</option>';
            hideVM();
            return;
        }

        vmSection.style.display = '';

        // Get ViewModel name list
        const vmInfos = [];
        for (let i = 0; i < count; i++) {
            try {
                const vm = riveInstance.viewModelByIndex(i);
                const name = vm && vm.name ? vm.name : '视图模型 ' + i;
                console.log('[Rive] viewModelByIndex(' + i + '):', name, vm ? '有效' : '无效');
                vmInfos.push({ name: name, index: i });
            } catch (e) {
                console.warn('[Rive] viewModelByIndex(' + i + ') error:', e);
                vmInfos.push({ name: '视图模型 ' + i, index: i });
            }
        }

        // If count=0 but has autoVMI, use defaultViewModel to get name
        if (!vmInfos.length && autoVMI) {
            let defName = '默认视图模型';
            try {
                const defVM = riveInstance.defaultViewModel();
                if (defVM && defVM.name) defName = defVM.name;
            } catch (e) {}
            vmInfos.push({ name: defName, index: -1 });
        }

        sel.innerHTML = vmInfos.map(function(info) {
            return '<option value="' + RiveUtils.escapeAttr(info.name) + '" data-idx="' + info.index + '">' +
                   RiveUtils.escapeAttr(info.name) + '</option>';
        }).join('');

        sel.onchange = function() {
            if (sel.value) loadVMProperties(riveInstance, sel.value);
        };

        if (vmInfos.length) loadVMProperties(riveInstance, vmInfos[0].name);
    }

    /**
     * Load ViewModel properties
     */
    function loadVMProperties(riveInstance, vmName) {
        const box = document.getElementById('vmProps');
        box.innerHTML = '';
        currentVMI = null;

        try {
            let vmi = null;

            // Strategy 1: Use autoBind default instance
            try { vmi = riveInstance.viewModelInstance; } catch (e) {
                console.warn('[Rive] R.viewModelInstance error:', e);
            }

            // Strategy 2: Get by name → defaultInstance → bind
            if (!vmi) {
                console.log('[Rive] autoBind 未获取到实例，尝试手动实例化');
                let vm = null;
                try { vm = riveInstance.viewModelByName(vmName); } catch (e) {}
                if (!vm) { try { vm = riveInstance.defaultViewModel(); } catch (e) {} }
                if (vm) {
                    console.log('[Rive] 获取到 ViewModel:', vm.name || vmName);
                    let inst = null;
                    try { inst = vm.defaultInstance(); } catch (e) {
                        console.warn('[Rive] vm.defaultInstance() failed:', e);
                    }
                    if (!inst) {
                        try { inst = vm.instance(); } catch (e) {
                            console.warn('[Rive] vm.instance() failed:', e);
                        }
                    }
                    if (inst) {
                        try { riveInstance.bindViewModelInstance(inst); } catch (e) {
                            console.warn('[Rive] bindViewModelInstance failed:', e);
                        }
                        vmi = inst;
                    }
                }
            }

            console.log('[Rive] loadVMProperties:', vmName, '| vmi:', vmi ? '有实例' : '无实例');

            if (!vmi) {
                box.innerHTML = '<div class="empty">无法加载视图模型实例</div>';
                return;
            }

            currentVMI = vmi;
            renderVMProperties(vmi, vmName, box, 0);
        } catch (e) {
            console.error('[Rive] loadVMProperties error:', e);
            box.innerHTML = '<div class="empty">错误：' + RiveUtils.escapeAttr(e.message || e) + '</div>';
        }
    }

    /**
     * Render ViewModel properties (supports nested ViewModels)
     */
    function renderVMProperties(vmi, vmName, container, depth) {
        const propDescs = getPropertyDescriptors(vmi, depth === 0 ? vmName : null);
        console.log('[Rive] renderVMProperties:', vmName, '| depth:', depth, '| props:', propDescs.length);

        if (!propDescs.length) {
            container.innerHTML += '<div class="empty">暂无属性</div>';
            return;
        }

        // Group by type
        const groups = {
            triggers: [], bools: [], nums: [], strs: [],
            colors: [], enums: [], lists: [], viewModels: []
        };

        for (let idx = 0; idx < propDescs.length; idx++) {
            const pd = propDescs[idx];
            const pname = pd.name;
            const ptype = normalizeType(pd.type);

            switch (ptype) {
                case 'trigger':
                    try {
                        const t = vmi.trigger(pname);
                        if (t) groups.triggers.push({ name: pname, acc: t });
                    } catch (e) { console.warn('[Rive] trigger accessor failed:', pname, e); }
                    break;
                case 'boolean':
                    try {
                        const b = vmi.boolean(pname);
                        if (b) groups.bools.push({ name: pname, acc: b });
                    } catch (e) { console.warn('[Rive] boolean accessor failed:', pname, e); }
                    break;
                case 'number':
                    try {
                        const n = vmi.number(pname);
                        if (n) groups.nums.push({ name: pname, acc: n });
                    } catch (e) { console.warn('[Rive] number accessor failed:', pname, e); }
                    break;
                case 'string':
                    try {
                        const s = vmi.string(pname);
                        if (s) groups.strs.push({ name: pname, acc: s });
                    } catch (e) { console.warn('[Rive] string accessor failed:', pname, e); }
                    break;
                case 'color':
                    try {
                        const c = vmi.color(pname);
                        if (c) groups.colors.push({ name: pname, acc: c });
                    } catch (e) { console.warn('[Rive] color accessor failed:', pname, e); }
                    break;
                case 'enum':
                    try {
                        const en = vmi.enum(pname);
                        if (en) groups.enums.push({ name: pname, acc: en });
                    } catch (e) { console.warn('[Rive] enum accessor failed:', pname, e); }
                    break;
                case 'list':
                    try {
                        const l = vmi.list(pname);
                        if (l) groups.lists.push({ name: pname, acc: l });
                    } catch (e) { console.warn('[Rive] list accessor failed:', pname, e); }
                    break;
                case 'viewModel':
                    try {
                        const vmChild = vmi.viewModel(pname);
                        if (vmChild) groups.viewModels.push({ name: pname, acc: vmChild });
                    } catch (e) { console.warn('[Rive] viewModel accessor failed:', pname, e); }
                    break;
                default:
                    console.warn('[Rive] 未知属性类型:', pname, 'type=', pd.type, 'normalized=', ptype);
                    break;
            }
        }

        let html = '';
        const prefix = depth > 0 ? 'd' + depth + '-' : '';

        // Render triggers
        if (groups.triggers.length) {
            html += '<div class="sm-type-group"><div class="sm-type-hd">触发器 <span class="sm-type-badge">' +
                    groups.triggers.length + '</span></div><div class="trigger-grid">';
            groups.triggers.forEach(function(t) {
                html += '<button class="trigger-btn" data-vm-trg="' + RiveUtils.escapeAttr(t.name) + '">' +
                        RiveUtils.escapeAttr(t.name) + '</button>';
            });
            html += '</div></div>';
        }

        // Render booleans
        if (groups.bools.length) {
            html += '<div class="sm-type-group"><div class="sm-type-hd">布尔值 <span class="sm-type-badge">' +
                    groups.bools.length + '</span></div>';
            groups.bools.forEach(function(b) {
                let val = false;
                try { val = b.acc.value; } catch (e) {}
                html += '<div class="icard"><div class="sw-row"><span class="icard-label" style="margin:0">' +
                        RiveUtils.escapeAttr(b.name) +
                        '</span><label class="sw"><input type="checkbox" data-vm-bool="' +
                        RiveUtils.escapeAttr(b.name) + '"' + (val ? ' checked' : '') +
                        '><span class="sw-track"></span></label></div></div>';
            });
            html += '</div>';
        }

        // Render numbers
        if (groups.nums.length) {
            html += '<div class="sm-type-group"><div class="sm-type-hd">数值 <span class="sm-type-badge">' +
                    groups.nums.length + '</span></div>';
            groups.nums.forEach(function(n) {
                let val = 0;
                try { val = n.acc.value; } catch (e) {}
                html += '<div class="icard"><label class="icard-label">' + RiveUtils.escapeAttr(n.name) +
                        '</label><input type="number" class="ninput" data-vm-num="' +
                        RiveUtils.escapeAttr(n.name) + '" value="' + val + '" step="any"></div>';
            });
            html += '</div>';
        }

        // Render strings
        if (groups.strs.length) {
            html += '<div class="sm-type-group"><div class="sm-type-hd">字符串 <span class="sm-type-badge">' +
                    groups.strs.length + '</span></div>';
            groups.strs.forEach(function(s) {
                let val = '';
                try { val = s.acc.value || ''; } catch (e) {}
                html += '<div class="icard"><label class="icard-label">' + RiveUtils.escapeAttr(s.name) +
                        '</label><input type="text" class="sinput" data-vm-str="' +
                        RiveUtils.escapeAttr(s.name) + '" value="' + RiveUtils.escapeAttr(val) + '"></div>';
            });
            html += '</div>';
        }

        // Render colors
        if (groups.colors.length) {
            html += '<div class="sm-type-group"><div class="sm-type-hd">颜色 <span class="sm-type-badge">' +
                    groups.colors.length + '</span></div>';
            groups.colors.forEach(function(c) {
                let val = 0xFF000000;
                try { val = c.acc.value; } catch (e) {}
                const hex = RiveUtils.riveColorToHex(val);
                html += '<div class="icard"><label class="icard-label">' + RiveUtils.escapeAttr(c.name) + '</label>' +
                        '<div class="color-row">' +
                        '<div class="color-swatch" style="background:' + hex + '" data-vm-cswatch="' +
                        RiveUtils.escapeAttr(c.name) + '">' +
                        '<input type="color" data-vm-color="' + RiveUtils.escapeAttr(c.name) + '" value="' + hex + '">' +
                        '</div>' +
                        '<span class="color-hex" data-vm-chex="' + RiveUtils.escapeAttr(c.name) + '">' +
                        hex.toUpperCase() + '</span>' +
                        '</div></div>';
            });
            html += '</div>';
        }

        // Render enums
        if (groups.enums.length) {
            html += '<div class="sm-type-group"><div class="sm-type-hd">枚举 <span class="sm-type-badge">' +
                    groups.enums.length + '</span></div>';
            groups.enums.forEach(function(en) {
                let val = '';
                let options = [];
                try { val = en.acc.value || ''; } catch (e) {}
                try { options = en.acc.values || []; } catch (e) {}
                html += '<div class="icard"><label class="icard-label">' + RiveUtils.escapeAttr(en.name) + '</label>';
                if (options.length) {
                    html += '<select class="sel" data-vm-enum="' + RiveUtils.escapeAttr(en.name) + '">';
                    options.forEach(function(opt) {
                        html += '<option value="' + RiveUtils.escapeAttr(opt) + '"' +
                                (opt === val ? ' selected' : '') + '>' + RiveUtils.escapeAttr(opt) + '</option>';
                    });
                    html += '</select>';
                } else {
                    html += '<input type="text" class="sinput" data-vm-enum="' +
                            RiveUtils.escapeAttr(en.name) + '" value="' + RiveUtils.escapeAttr(val) + '">';
                }
                html += '</div>';
            });
            html += '</div>';
        }

        // Render lists
        if (groups.lists.length) {
            html += '<div class="sm-type-group"><div class="sm-type-hd">列表 <span class="sm-type-badge">' +
                    groups.lists.length + '</span></div>';
            groups.lists.forEach(function(l) {
                let size = 0;
                try { size = l.acc.size || 0; } catch (e) {}
                html += '<div class="icard"><span class="icard-label">' + RiveUtils.escapeAttr(l.name) +
                        '</span><span class="info-value" style="font-size:13px">' + size + ' 项</span></div>';
            });
            html += '</div>';
        }

        // Render nested ViewModels
        if (groups.viewModels.length) {
            html += '<div class="sm-type-group"><div class="sm-type-hd">嵌套视图模型 <span class="sm-type-badge">' +
                    groups.viewModels.length + '</span></div>';
            groups.viewModels.forEach(function(vm) {
                let childCount = 0;
                try { childCount = vm.acc.properties ? vm.acc.properties.length : 0; } catch (e) {}
                html += '<div class="icard"><span class="icard-label">' + RiveUtils.escapeAttr(vm.name) +
                        '</span><span class="info-value" style="font-size:13px">' + childCount + ' 个属性</span>';
                html += '<div class="vm-nested" data-vm-nested="' + RiveUtils.escapeAttr(vm.name) + '"></div>';
                html += '</div>';
            });
            html += '</div>';
        }

        if (!html) {
            container.innerHTML += '<div class="empty">暂无支持的属性</div>';
            return;
        }

        container.innerHTML = html;
        bindVMEvents(vmi, container);

        // Recursively render nested ViewModels (max 3 levels)
        if (depth < 3) {
            groups.viewModels.forEach(function(vm) {
                const nestedContainer = container.querySelector('[data-vm-nested="' + vm.name + '"]');
                if (nestedContainer && vm.acc) {
                    renderVMProperties(vm.acc, vm.name, nestedContainer, depth + 1);
                }
            });
        }
    }

    /**
     * Bind ViewModel property control events
     */
    function bindVMEvents(vmi, box) {
        // Triggers
        box.querySelectorAll('[data-vm-trg]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                try {
                    const t = vmi.trigger(btn.dataset.vmTrg);
                    if (t) {
                        t.trigger ? t.trigger() : (t.fire ? t.fire() : null);
                    }
                } catch (e) { console.warn('[Rive] VM trigger error:', btn.dataset.vmTrg, e); }
            });
        });

        // Booleans
        box.querySelectorAll('[data-vm-bool]').forEach(function(el) {
            el.addEventListener('change', function() {
                try {
                    const b = vmi.boolean(el.dataset.vmBool);
                    if (b) b.value = el.checked;
                } catch (e) { console.warn('[Rive] VM boolean error:', el.dataset.vmBool, e); }
            });
        });

        // Numbers
        box.querySelectorAll('[data-vm-num]').forEach(function(el) {
            el.addEventListener('input', function() {
                try {
                    const n = vmi.number(el.dataset.vmNum);
                    if (n) n.value = parseFloat(el.value) || 0;
                } catch (e) { console.warn('[Rive] VM number error:', el.dataset.vmNum, e); }
            });
        });

        // Strings
        box.querySelectorAll('[data-vm-str]').forEach(function(el) {
            el.addEventListener('input', function() {
                try {
                    const s = vmi.string(el.dataset.vmStr);
                    if (s) s.value = el.value;
                } catch (e) { console.warn('[Rive] VM string error:', el.dataset.vmStr, e); }
            });
        });

        // Colors
        box.querySelectorAll('[data-vm-color]').forEach(function(el) {
            el.addEventListener('input', function() {
                const name = el.dataset.vmColor;
                try {
                    const c = vmi.color(name);
                    if (c) c.value = RiveUtils.hexToRiveColor(el.value);
                } catch (e) { console.warn('[Rive] VM color error:', name, e); }
                const swatch = box.querySelector('[data-vm-cswatch="' + name + '"]');
                if (swatch) swatch.style.background = el.value;
                const hexLabel = box.querySelector('[data-vm-chex="' + name + '"]');
                if (hexLabel) hexLabel.textContent = el.value.toUpperCase();
            });
        });

        // Enums (support both select and input elements)
        box.querySelectorAll('[data-vm-enum]').forEach(function(el) {
            const evtName = el.tagName === 'SELECT' ? 'change' : 'input';
            el.addEventListener(evtName, function() {
                try {
                    const en = vmi.enum(el.dataset.vmEnum);
                    if (en) en.value = el.value;
                } catch (e) { console.warn('[Rive] VM enum error:', el.dataset.vmEnum, e); }
            });
        });
    }

    return {
        populateViewModel,
        loadVMProperties,
        renderVMProperties,
        bindVMEvents,
        getCurrentVMI: () => currentVMI
    };
})();
