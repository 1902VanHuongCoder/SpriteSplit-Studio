/**
 * SpriteSplit Studio - Vector SVG Rig & Animation Studio (Tab 5)
 * Hỗ trợ bóc tách, gắn khớp xương phân cấp (Skeletal Rigging),
 * đặt tâm xoay Pivot, diễn hoạt chuyển động mượt mà và xuất đa định dạng
 * dựa trên chuẩn vector SVG và 18 Preset của Funny Animation Assistant.
 */

(function () {
    'use strict';

    // State quản lý riêng cho Tab 5
    const svgState = {
        filename: 'nhan_vat_rig.svg',
        title: 'Nhân vật Học sinh (Nam)',
        svgDoc: null,
        rawSvgString: '',
        viewBox: { x: 0, y: 0, w: 680, h: 340 },
        nodes: [],            // Danh sách các node xương/bộ phận
        nodeMap: {},          // Map id -> node
        selectedId: null,     // Node id đang chọn
        stageMode: 'anim',    // 'rig' hoặc 'anim'
        isPlaying: true,
        currentTime: 0,       // Thời gian hiện tại (giây)
        lastFrameTime: null,
        animFrameId: null,
        pivotsData: null,     // Dữ liệu pivots.json nếu có
        config: {
            preset: 'walk',
            speed: 1.0,
            intensity: 1.0,
            auto_blink: true,
            lip_sync: true,
            head_sway: false
        },
        zoom: 1.0,
        panX: 0,
        panY: 0,
        isPanning: false,
        panStartX: 0,
        panStartY: 0,
        isDraggingPivot: false,
        dragPivotNode: null,
        testRotations: {},    // Góc xoay thử nghiệm { id: degrees }
        scales: {}            // Tỉ lệ scale { id: factor }
    };

    // Chuẩn mapping vai trò SVG sang Funny Animation
    const SVG_ROLE_LABELS = {
        'body': '👕 Thân [Body]',
        'head': '🙂 Đầu [Head]',
        'arm_upper_left': '🦾 Bắp tay T [Left Upper Arm]',
        'arm_lower_left': '🤜 Cẳng tay T [Left Lower Arm]',
        'arm_left': '💪 Cánh tay T nguyên',
        'arm_upper_right': '🦾 Bắp tay P [Right Upper Arm]',
        'arm_lower_right': '🤛 Cẳng tay P [Right Lower Arm]',
        'arm_right': '🤚 Cánh tay P nguyên',
        'leg_upper_left': '🦿 Đùi T [Left Thigh]',
        'leg_lower_left': '🦶 Bắp chuối T [Left Calf]',
        'leg_left': '🦵 Cẳng chân T nguyên',
        'foot_left': '👟 Bàn chân T [Left Foot]',
        'leg_upper_right': '🦿 Đùi P [Right Thigh]',
        'leg_lower_right': '🦶 Bắp chuối P [Right Calf]',
        'leg_right': '🦵 Cẳng chân P nguyên',
        'foot_right': '👟 Bàn chân P [Right Foot]',
        'eye_open': '👁️ Mắt mở',
        'eye_closed': '😌 Mắt nhắm',
        'eye_extra': '😳 Mắt trợn / khác',
        'mouth_closed': '👄 Miệng ngậm',
        'mouth_half': '😮 Miệng hé',
        'mouth_open': '🗣️ Miệng mở to',
        'hair': '💇 Tóc / Mái',
        'expression': '🎭 Biểu cảm gộp',
        'custom': '✨ Tùy chỉnh'
    };

    // Tự động nhận diện Role từ ID node
    function detectSvgRole(id) {
        if (!id) return 'custom';
        const s = id.toLowerCase().replace(/[\s\-_]+/g, '_');

        if (s.includes('head') || s.includes('face') || s === 'dau' || s === 'mat_nhan_vat') return 'head';
        if (s.includes('torso') || s === 'body' || s === 'upper_body' || s === 'figure' || s === 'dress' || s === 'than' || s === 'than_nguoi' || s === 'ao') return 'body';
        if (s.includes('neck') || s === 'co') return 'neck';
        if (s.includes('hair') || s.includes('fringe') || s === 'toc' || s.includes('mai')) return 'hair';

        // Tay Trái
        if (s === 'arm_l' || s === 'arm_left' || s === 'sleeve_l' || s === 'upper_arm_l' || s === 'upper_arm_left' || s === 'shoulder_l' || s === 'bap_tay_trai' || s === 'tay_trai') return 'arm_upper_left';
        if (s === 'forearm_l' || s === 'forearm_left' || s === 'elbow_l' || s === 'elbow_left' || s === 'hand_l' || s === 'hand_left' || s === 'wrist_l' || s === 'cang_tay_trai') return 'arm_lower_left';

        // Tay Phải
        if (s === 'arm_r' || s === 'arm_right' || s === 'sleeve_r' || s === 'upper_arm_r' || s === 'upper_arm_right' || s === 'shoulder_r' || s === 'bap_tay_phai' || s === 'tay_phai') return 'arm_upper_right';
        if (s === 'forearm_r' || s === 'forearm_right' || s === 'elbow_r' || s === 'elbow_right' || s === 'hand_r' || s === 'hand_right' || s === 'wrist_r' || s === 'cang_tay_phai') return 'arm_lower_right';

        // Chân Trái
        if (s === 'leg_l' || s === 'leg_left' || s === 'thigh_l' || s === 'thigh_left' || s === 'hip_l' || s === 'dui_trai' || s === 'chan_trai') return 'leg_upper_left';
        if (s === 'shin_l' || s === 'shin_left' || s === 'knee_l' || s === 'knee_left' || s === 'calf_l' || s === 'calf_left' || s === 'bap_chan_trai') return 'leg_lower_left';
        if (s === 'foot_l' || s === 'foot_left' || s === 'shoe_l' || s === 'shoe_left' || s === 'ankle_l' || s === 'ban_chan_trai') return 'foot_left';

        // Chân Phải
        if (s === 'leg_r' || s === 'leg_right' || s === 'thigh_r' || s === 'thigh_right' || s === 'hip_r' || s === 'dui_phai' || s === 'chan_phai') return 'leg_upper_right';
        if (s === 'shin_r' || s === 'shin_right' || s === 'knee_r' || s === 'knee_right' || s === 'calf_r' || s === 'calf_right' || s === 'bap_chan_phai') return 'leg_lower_right';
        if (s === 'foot_r' || s === 'foot_right' || s === 'shoe_r' || s === 'shoe_right' || s === 'ankle_r' || s === 'ban_chan_phai') return 'foot_right';

        // Mắt & Miệng
        if (s.includes('eye_open') || s.includes('eyes_open') || s.includes('eye_empty') || s.includes('eyes_empty') || s.includes('eye_base')) return 'eye_open';
        if (s.includes('eye_closed') || s.includes('eyes_closed')) return 'eye_closed';
        if (s.includes('eye_wide') || s.includes('eyes_wide') || s.includes('eye_extra')) return 'eye_extra';
        if (s.includes('mouth_neutral') || s.includes('mouth_flat') || s.includes('mouth_closed')) return 'mouth_closed';
        if (s.includes('mouth_faint') || s.includes('mouth_half')) return 'mouth_half';
        if (s.includes('mouth_scared') || s.includes('mouth_open')) return 'mouth_open';

        return 'custom';
    }

    // Chuẩn mapping vai trò SVG sang Funny Animation Part Names
    const SVG_ROLE_TO_FUNNY_NAME = {
        'body': 'Body',
        'torso': 'Body',
        'head': 'Head',
        'arm_upper_left': 'Left Upper Arm',
        'arm_lower_left': 'Left Lower Arm',
        'arm_left': 'Left Arm',
        'arm_upper_right': 'Right Upper Arm',
        'arm_lower_right': 'Right Lower Arm',
        'arm_right': 'Right Arm',
        'leg_upper_left': 'Left Thigh',
        'leg_lower_left': 'Left Calf',
        'leg_left': 'Left Leg',
        'foot_left': 'Left Foot',
        'leg_upper_right': 'Right Thigh',
        'leg_lower_right': 'Right Calf',
        'leg_right': 'Right Leg',
        'foot_right': 'Right Foot',
        'hair': 'Hair',
        'expression': 'Expression'
    };

    // Lấy Preset Definition từ window hoặc catalog dự phòng
    function getSvgPresetDef(presetKey) {
        const cat = (window.FUNNY_PRESET_CATALOG_JS && typeof window.FUNNY_PRESET_CATALOG_JS === 'object')
            ? window.FUNNY_PRESET_CATALOG_JS
            : (typeof FUNNY_PRESET_CATALOG_JS !== 'undefined' ? FUNNY_PRESET_CATALOG_JS : null);

        if (!cat) return null;
        if (cat[presetKey]) return cat[presetKey];

        const aliases = {
            'wave_right': 'wave',
            'raise_both_hands': 'hands_up',
            'scared': 'shock',
            'breathe': 'idle'
        };
        if (aliases[presetKey] && cat[aliases[presetKey]]) {
            return cat[aliases[presetKey]];
        }
        return null;
    }

    // Nội suy giá trị thuộc tính qua danh sách keyframes
    function interpolatePropSvg(keyframes, prop, localMs, defaultVal) {
        if (!keyframes || !Array.isArray(keyframes) || keyframes.length === 0) return defaultVal;
        const pts = keyframes.filter(kf => kf[prop] !== undefined && kf[prop] !== null);
        if (pts.length === 0) return defaultVal;
        if (localMs <= pts[0].time) return pts[0][prop];
        if (localMs >= pts[pts.length - 1].time) return pts[pts.length - 1][prop];

        for (let i = 0; i < pts.length - 1; i++) {
            const kfA = pts[i];
            const kfB = pts[i + 1];
            if (localMs >= kfA.time && localMs <= kfB.time) {
                const segDur = kfB.time - kfA.time;
                if (segDur <= 0.0001) return kfB[prop];
                let t = (localMs - kfA.time) / segDur;
                const easing = kfA.easing || 'linear';
                if (easing === 'easeInOut') {
                    t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                } else if (easing === 'easeIn') {
                    t = t * t;
                } else if (easing === 'easeOut') {
                    t = t * (2 - t);
                }
                return kfA[prop] + (kfB[prop] - kfA[prop]) * t;
            }
        }
        return defaultVal;
    }

    // Khớp track animation thông minh cho từng node xương SVG (hỗ trợ phân cấp 1 khớp & 2 khớp)
    function resolvePresetTrackForSvgNode(presetDef, node) {
        if (!presetDef || !presetDef.tracks || !node) return [];

        // Nếu node con có cùng vai trò với node cha trực tiếp, node cha đã xoay rồi -> node con không xoay lặp lại
        if (node.parentId && svgState.nodeMap[node.parentId]) {
            const pRole = svgState.nodeMap[node.parentId].role;
            if (pRole === node.role && pRole !== 'custom') {
                return [];
            }
        }

        const role = node.role;
        const funnyName = SVG_ROLE_TO_FUNNY_NAME[role] || '';

        // 1. Trùng khớp trực tiếp funnyName
        if (funnyName) {
            const direct = presetDef.tracks.filter(tr => tr.targetName === funnyName);
            if (direct.length > 0) return direct;
        }

        // 2. Trùng khớp theo ID node
        const idDirect = presetDef.tracks.filter(tr => tr.targetName === node.id || tr.targetName.toLowerCase() === node.id.toLowerCase());
        if (idDirect.length > 0) return idDirect;

        // 3. Fallback cho bộ phận 2 khớp (Thigh/Calf & Upper/Lower Arm) từ preset 1 khớp (Leg, Arm)
        if (funnyName === 'Left Upper Arm') {
            const armTr = presetDef.tracks.filter(tr => tr.targetName === 'Left Arm');
            if (armTr.length > 0) return armTr;
        }
        if (funnyName === 'Right Upper Arm') {
            const armTr = presetDef.tracks.filter(tr => tr.targetName === 'Right Arm');
            if (armTr.length > 0) return armTr;
        }
        if (funnyName === 'Left Lower Arm') {
            const armTr = presetDef.tracks.filter(tr => tr.targetName === 'Left Arm');
            if (armTr.length > 0) {
                return armTr.map(tr => ({
                    ...tr,
                    keyframes: tr.keyframes.map(kf => ({
                        ...kf,
                        rotation: kf.rotation !== undefined ? kf.rotation * 0.35 : undefined
                    }))
                }));
            }
        }
        if (funnyName === 'Right Lower Arm') {
            const armTr = presetDef.tracks.filter(tr => tr.targetName === 'Right Arm');
            if (armTr.length > 0) {
                return armTr.map(tr => ({
                    ...tr,
                    keyframes: tr.keyframes.map(kf => ({
                        ...kf,
                        rotation: kf.rotation !== undefined ? kf.rotation * 0.35 : undefined
                    }))
                }));
            }
        }
        if (funnyName === 'Left Thigh') {
            const legTr = presetDef.tracks.filter(tr => tr.targetName === 'Left Leg');
            if (legTr.length > 0) return legTr;
        }
        if (funnyName === 'Right Thigh') {
            const legTr = presetDef.tracks.filter(tr => tr.targetName === 'Right Leg');
            if (legTr.length > 0) return legTr;
        }
        if (funnyName === 'Left Calf') {
            const legTr = presetDef.tracks.filter(tr => tr.targetName === 'Left Leg');
            if (legTr.length > 0) {
                return legTr.map(tr => ({
                    ...tr,
                    keyframes: tr.keyframes.map(kf => ({
                        ...kf,
                        rotation: kf.rotation !== undefined ? (kf.rotation > 0 ? -kf.rotation * 0.75 : 0) : undefined
                    }))
                }));
            }
        }
        if (funnyName === 'Right Calf') {
            const legTr = presetDef.tracks.filter(tr => tr.targetName === 'Right Leg');
            if (legTr.length > 0) {
                return legTr.map(tr => ({
                    ...tr,
                    keyframes: tr.keyframes.map(kf => ({
                        ...kf,
                        rotation: kf.rotation !== undefined ? (kf.rotation > 0 ? -kf.rotation * 0.75 : 0) : undefined
                    }))
                }));
            }
        }

        // 4. Fallback cho bộ phận 1 khớp từ preset 2 khớp chi tiết
        if (funnyName === 'Left Arm') {
            const upperTr = presetDef.tracks.filter(tr => tr.targetName === 'Left Upper Arm');
            if (upperTr.length > 0) return upperTr;
        }
        if (funnyName === 'Right Arm') {
            const upperTr = presetDef.tracks.filter(tr => tr.targetName === 'Right Upper Arm');
            if (upperTr.length > 0) return upperTr;
        }
        if (funnyName === 'Left Leg') {
            const thighTr = presetDef.tracks.filter(tr => tr.targetName === 'Left Thigh');
            if (thighTr.length > 0) return thighTr;
        }
        if (funnyName === 'Right Leg') {
            const thighTr = presetDef.tracks.filter(tr => tr.targetName === 'Right Thigh');
            if (thighTr.length > 0) return thighTr;
        }

        return [];
    }


    // Khởi tạo toàn bộ sự kiện của Tab 5
    function initSvgStudio() {
        console.log('[SvgStudio] Initializing Vector SVG Studio...');

        // 1. Gắn sự kiện chuyển Tab 5 từ Navbar chính
        const btnNavSvgAnim = document.getElementById('btnNavSvgAnim');
        const svgAnimView = document.getElementById('svgAnimView');
        if (btnNavSvgAnim) {
            btnNavSvgAnim.addEventListener('click', () => {
                if (window.appState) {
                    window.appState.currentTab = 'svgAnim';
                    if (typeof window.stopAnimLoop === 'function') window.stopAnimLoop();
                }

                // Xóa active khỏi các tab khác
                ['btnNavAuto', 'btnNavManual', 'btnNavInspect', 'btnNavAnim'].forEach(id => {
                    const btn = document.getElementById(id);
                    if (btn) btn.classList.remove('active');
                });
                ['autoView', 'manualView', 'inspectView', 'animView'].forEach(id => {
                    const v = document.getElementById(id);
                    if (v) v.style.display = 'none';
                });

                btnNavSvgAnim.classList.add('active');
                if (svgAnimView) svgAnimView.style.display = 'flex';

                // Nếu chưa có nhân vật SVG nào, tự nạp ví dụ 1
                if (!svgState.svgDoc) {
                    loadSvgExample('nhan_vat');
                }

                requestAnimationFrame(() => {
                    fitSvgCanvas();
                    startSvgAnimLoop();
                });
            });
        }

        // Cập nhật các tab 1-4 để ẩn Tab 5 khi được click
        ['btnNavAuto', 'btnNavManual', 'btnNavInspect', 'btnNavAnim'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (btnNavSvgAnim) btnNavSvgAnim.classList.remove('active');
                    if (svgAnimView) svgAnimView.style.display = 'none';
                    stopSvgAnimLoop();
                });
            }
        });

        // 2. Setup Card 1: Nạp file SVG & Quick Examples
        const dropzone = document.getElementById('dropzoneSvgAnim');
        const fileInput = document.getElementById('fileInputSvgAnim');
        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());
            dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
            dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) handleSvgFileUpload(e.dataTransfer.files[0]);
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) handleSvgFileUpload(e.target.files[0]);
            });
        }

        const btnEx1 = document.getElementById('btnSvgLoadEx1');
        if (btnEx1) btnEx1.addEventListener('click', () => loadSvgExample('nhan_vat'));
        const btnEx2 = document.getElementById('btnSvgLoadEx2');
        if (btnEx2) btnEx2.addEventListener('click', () => loadSvgExample('ma_nu'));

        // Save & Open Project
        const btnSaveProject = document.getElementById('btnSaveSvgProject');
        const btnOpenProject = document.getElementById('btnOpenSvgProject');
        const fileInputProject = document.getElementById('fileInputSvgProject');
        if (btnSaveProject) btnSaveProject.addEventListener('click', saveSvgProject);
        if (btnOpenProject && fileInputProject) {
            btnOpenProject.addEventListener('click', () => fileInputProject.click());
            fileInputProject.addEventListener('change', (e) => {
                if (e.target.files.length > 0) openSvgProject(e.target.files[0]);
            });
        }

        // 3. Setup Card 2: Pivot & Hierarchy Controls
        setupCard2Controls();

        // 4. Setup Card 4: Layer list actions
        const btnShowAll = document.getElementById('btnSvgShowAll');
        const btnHideAll = document.getElementById('btnSvgHideAll');
        const btnResetPivots = document.getElementById('btnSvgResetPivots');
        if (btnShowAll) {
            btnShowAll.addEventListener('click', () => {
                svgState.nodes.forEach(n => { n.visible = true; if (n.elem) n.elem.style.display = ''; });
                renderSvgLayersTree();
            });
        }
        if (btnHideAll) {
            btnHideAll.addEventListener('click', () => {
                svgState.nodes.forEach(n => { n.visible = false; if (n.elem) n.elem.style.display = 'none'; });
                renderSvgLayersTree();
            });
        }
        if (btnResetPivots) {
            btnResetPivots.addEventListener('click', () => {
                svgState.nodes.forEach(n => { n.pivotX = n.defaultPivotX; n.pivotY = n.defaultPivotY; });
                updateCard2Inputs();
                renderSvgStageFrame();
            });
        }

        // 5. Setup Card 3: 18 Presets Catalog
        renderSvgPresetsCatalog();
        setupCard3Controls();

        // 6. Setup Stage (Right Panel) Controls
        setupStageControls();

        // 7. Setup Export Actions
        setupExportActions();
    }

    // Nạp nhân vật mẫu từ server
    function loadSvgExample(exampleId) {
        const badge = document.getElementById('svgAnimStatusBadge');
        if (badge) badge.textContent = 'Đang tải...';

        fetch(`/api/load-svg-example/${exampleId}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    svgState.filename = data.filename;
                    svgState.title = data.title;
                    svgState.pivotsData = data.pivots;
                    parseAndBuildSvgRig(data.svg_content, data.pivots, data.title);
                    if (badge) badge.textContent = `${svgState.nodes.length} khớp xương`;
                } else {
                    alert('Lỗi nạp ví dụ: ' + (data.detail || 'Không xác định'));
                }
            })
            .catch(err => {
                console.error(err);
                alert('Không thể kết nối đến máy chủ để nạp ví dụ.');
            });
    }

    // Tải file SVG do người dùng upload
    function handleSvgFileUpload(file) {
        if (!file.name.endsWith('.svg')) {
            alert('Vui lòng chọn file vector định dạng .svg!');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            svgState.filename = file.name;
            svgState.title = file.name.replace(/\.svg$/i, '');
            parseAndBuildSvgRig(content, null, svgState.title);
            const badge = document.getElementById('svgAnimStatusBadge');
            if (badge) badge.textContent = `${svgState.nodes.length} khớp`;
        };
        reader.readAsText(file);
    }

    // Trích xuất bản đồ Pivot từ các group <g id="pivots">, markers hoặc thuộc tính data-pivot
    function extractSvgPivotsMap(doc, svgElem) {
        const pivotsMap = {};
        if (!doc) return pivotsMap;

        function registerPivotInMap(map, name, x, y) {
            if (!name) return;
            const entry = { x: parseFloat(x), y: parseFloat(y) };
            map[name] = entry;
            map[name.toLowerCase()] = entry;
            map[name.toLowerCase().replace(/[\s\-_]+/g, '_')] = entry;
            map[name.toLowerCase().replace(/[\s\-_]+/g, '-')] = entry;
        }

        // 1. Quét các group định nghĩa pivots / joints / skeleton / markers (hỗ trợ mọi DOM parser)
        const allGroups = doc.querySelectorAll('g');
        const pivotGroups = [];
        allGroups.forEach(g => {
            const gid = (g.getAttribute('id') || '').toLowerCase();
            const gcls = (g.getAttribute('class') || '').toLowerCase();
            if (gid.includes('pivot') || gid.includes('joint') || gid.includes('skeleton') || gid.includes('marker') ||
                gcls.includes('pivot') || gcls.includes('joint') || gcls.includes('skeleton')) {
                pivotGroups.push(g);
            }
        });

        pivotGroups.forEach(pGroup => {
            const markers = pGroup.children.length > 0 ? Array.from(pGroup.children) : [pGroup];
            markers.forEach(marker => {
                let targetName = '';

                // Tìm tên khớp trong thẻ con <title>
                for (let i = 0; i < marker.children.length; i++) {
                    const cTag = (marker.children[i].tagName || '').toLowerCase();
                    if (cTag === 'title' && marker.children[i].textContent) {
                        targetName = marker.children[i].textContent.trim();
                        break;
                    }
                }
                if (!targetName) {
                    const titleEl = marker.querySelector ? marker.querySelector('title') : null;
                    if (titleEl && titleEl.textContent) targetName = titleEl.textContent.trim();
                }

                // Tìm tên trong data-target, data-bone, data-joint, data-for
                if (!targetName) {
                    targetName = marker.getAttribute('data-target') ||
                                 marker.getAttribute('data-bone') ||
                                 marker.getAttribute('data-joint') ||
                                 marker.getAttribute('data-for') || '';
                }

                // Tìm tên trong ID với tiền tố pivot- / joint-
                if (!targetName && marker.getAttribute('id')) {
                    targetName = marker.getAttribute('id').replace(/^(pivot|joint|marker)[_\-:]+/i, '').trim();
                }

                let cx = null, cy = null;

                // Tìm circle con hoặc chính marker
                const mTag = (marker.tagName || '').toLowerCase();
                let geomEl = (mTag === 'circle' || mTag === 'ellipse' || mTag === 'rect' || mTag === 'line') ? marker : null;
                if (!geomEl) {
                    for (let i = 0; i < marker.children.length; i++) {
                        const ct = (marker.children[i].tagName || '').toLowerCase();
                        if (ct === 'circle' || ct === 'ellipse' || ct === 'rect' || ct === 'line') {
                            geomEl = marker.children[i];
                            break;
                        }
                    }
                }

                if (geomEl) {
                    const gTag = (geomEl.tagName || '').toLowerCase();
                    if (gTag === 'circle' || gTag === 'ellipse') {
                        const cX = parseFloat(geomEl.getAttribute('cx'));
                        const cY = parseFloat(geomEl.getAttribute('cy'));
                        if (!isNaN(cX) && !isNaN(cY)) { cx = cX; cy = cY; }
                    } else if (gTag === 'rect') {
                        const rX = parseFloat(geomEl.getAttribute('x')) || 0;
                        const rY = parseFloat(geomEl.getAttribute('y')) || 0;
                        const rW = parseFloat(geomEl.getAttribute('width')) || 0;
                        const rH = parseFloat(geomEl.getAttribute('height')) || 0;
                        cx = rX + rW / 2;
                        cy = rY + rH / 2;
                    } else if (gTag === 'line') {
                        const x1 = parseFloat(geomEl.getAttribute('x1')) || 0;
                        const y1 = parseFloat(geomEl.getAttribute('y1')) || 0;
                        const x2 = parseFloat(geomEl.getAttribute('x2')) || 0;
                        const y2 = parseFloat(geomEl.getAttribute('y2')) || 0;
                        cx = (x1 + x2) / 2;
                        cy = (y1 + y2) / 2;
                    }
                }

                if (targetName && cx !== null && cy !== null) {
                    registerPivotInMap(pivotsMap, targetName, cx, cy);
                }
            });
        });

        // 2. Quét regex trực tiếp từ rawSvgString để đảm bảo 100% không bị sót do XML namespace hay parser
        const rawSvg = svgState.rawSvgString || '';
        if (rawSvg) {
            const pivotBlockMatch = rawSvg.match(/<g[^>]+id=["']pivots["'][^>]*>([\s\S]*?)<\/g>\s*<\/svg>/i)
                                 || rawSvg.match(/<g[^>]+id=["'][^"']*pivot[^"']*["'][^>]*>([\s\S]*?)<\/g>/i);
            if (pivotBlockMatch) {
                const blockContent = pivotBlockMatch[1];
                const markerRegex = /<g[^>]*>([\s\S]*?)<\/g>/gi;
                let mm;
                while ((mm = markerRegex.exec(blockContent)) !== null) {
                    const block = mm[1];
                    const titleM = block.match(/<title>([^<]+)<\/title>/i);
                    const circleM = block.match(/<circle[^>]+cx=["']([^"']+)["'][^>]+cy=["']([^"']+)["']/i);
                    if (titleM && circleM) {
                        registerPivotInMap(pivotsMap, titleM[1].trim(), parseFloat(circleM[1]), parseFloat(circleM[2]));
                    }
                }
            }
        }

        // 3. Quét toàn bộ các phần tử có data-pivot="x,y" trong doc
        doc.querySelectorAll('[data-pivot]').forEach(el => {
            const dp = el.getAttribute('data-pivot');
            const id = el.getAttribute('id');
            if (dp && id) {
                const parts = dp.split(/[\s,]+/).map(Number);
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    registerPivotInMap(pivotsMap, id, parts[0], parts[1]);
                }
            }
        });

        return pivotsMap;
    }

    // Ước tính Bounding Box hình học cho phần tử SVG khi không có pivot định nghĩa trước
    function computeElementBBox(node) {
        if (!node) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let found = false;

        const geoms = node.querySelectorAll('rect, circle, ellipse, line, polygon, path');
        const selfTag = node.tagName ? node.tagName.toLowerCase() : '';
        const allElements = (selfTag && ['rect', 'circle', 'ellipse', 'line', 'polygon', 'path'].includes(selfTag))
            ? [node, ...geoms] : geoms;

        allElements.forEach(el => {
            const tag = el.tagName.toLowerCase();
            if (tag === 'rect') {
                const x = parseFloat(el.getAttribute('x')) || 0;
                const y = parseFloat(el.getAttribute('y')) || 0;
                const w = parseFloat(el.getAttribute('width')) || 0;
                const h = parseFloat(el.getAttribute('height')) || 0;
                minX = Math.min(minX, x); minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
                found = true;
            } else if (tag === 'circle') {
                const cx = parseFloat(el.getAttribute('cx')) || 0;
                const cy = parseFloat(el.getAttribute('cy')) || 0;
                const r = parseFloat(el.getAttribute('r')) || 0;
                minX = Math.min(minX, cx - r); minY = Math.min(minY, cy - r);
                maxX = Math.max(maxX, cx + r); maxY = Math.max(maxY, cy + r);
                found = true;
            } else if (tag === 'ellipse') {
                const cx = parseFloat(el.getAttribute('cx')) || 0;
                const cy = parseFloat(el.getAttribute('cy')) || 0;
                const rx = parseFloat(el.getAttribute('rx')) || 0;
                const ry = parseFloat(el.getAttribute('ry')) || 0;
                minX = Math.min(minX, cx - rx); minY = Math.min(minY, cy - ry);
                maxX = Math.max(maxX, cx + rx); maxY = Math.max(maxY, cy + ry);
                found = true;
            } else if (tag === 'line') {
                const x1 = parseFloat(el.getAttribute('x1')) || 0;
                const y1 = parseFloat(el.getAttribute('y1')) || 0;
                const x2 = parseFloat(el.getAttribute('x2')) || 0;
                const y2 = parseFloat(el.getAttribute('y2')) || 0;
                minX = Math.min(minX, x1, x2); minY = Math.min(minY, y1, y2);
                maxX = Math.max(maxX, x1, x2); maxY = Math.max(maxY, y1, y2);
                found = true;
            } else if (tag === 'path') {
                const d = el.getAttribute('d') || '';
                const nums = d.match(/-?\d+(?:\.\d+)?/g);
                if (nums && nums.length >= 2) {
                    for (let i = 0; i < nums.length; i += 2) {
                        const px = parseFloat(nums[i]);
                        const py = parseFloat(nums[i + 1]);
                        if (!isNaN(px) && !isNaN(py)) {
                            minX = Math.min(minX, px); minY = Math.min(minY, py);
                            maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
                            found = true;
                        }
                    }
                }
            }
        });

        if (found && isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
            return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
        }
        return null;
    }

    // Phân tích cú pháp SVG và dựng cây khớp xương
    function parseAndBuildSvgRig(svgString, pivotsData, title) {
        svgState.rawSvgString = svgString;
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');

        const parserError = doc.querySelector('parsererror');
        if (parserError) {
            alert('File SVG không đúng định dạng XML!');
            return;
        }

        svgState.svgDoc = doc;
        // Loai bo tat ca the <rect>/<path> nen canvas / mat dat de chi hien thi nhan vat (giong Tab 4)
        doc.querySelectorAll('rect, path, polygon, g').forEach(el => {
            const id = (el.getAttribute('id') || '').toLowerCase();
            const fill = (el.getAttribute('fill') || '').toLowerCase();
            if (id && /(ground|mat_dat|floor|bg|background|nen_dat|matdat)/i.test(id)) {
                el.remove();
                return;
            }
            if (id && (/(^|_|-)(pivots|joints|markers|skeleton_layer|rig_markers)($|_|-)/i.test(id) || id === 'pivots' || id === 'joints')) {
                el.remove();
                return;
            }
            if (el.tagName.toLowerCase() === 'rect') {
                const w = parseFloat(el.getAttribute('width')) || 0;
                const h = parseFloat(el.getAttribute('height')) || 0;
                const y = parseFloat(el.getAttribute('y')) || 0;
                if ((w >= svgState.viewBox.w * 0.6 && h >= svgState.viewBox.h * 0.15 && y >= svgState.viewBox.h * 0.35) ||
                    (w >= svgState.viewBox.w * 0.75 && h >= svgState.viewBox.h * 0.5) ||
                    fill === '#2b3135' || fill === '#3a342e' || fill === '#1c2630') {
                    el.remove();
                }
            }
        });
        const svgElem = doc.querySelector('svg');
        if (!svgElem) return;

        // Đọc viewBox
        const vbAttr = svgElem.getAttribute('viewBox');
        if (vbAttr) {
            const parts = vbAttr.trim().split(/[\s,]+/).map(Number);
            if (parts.length === 4) {
                svgState.viewBox = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
            }
        } else {
            const w = parseFloat(svgElem.getAttribute('width')) || 680;
            const h = parseFloat(svgElem.getAttribute('height')) || 340;
            svgState.viewBox = { x: 0, y: 0, w: w, h: h };
        }
        // Trích xuất Pivot Map từ các group <g id="pivots"> hoặc data-pivot trong file SVG
        const docPivotsMap = extractSvgPivotsMap(doc, svgElem);

        // Đọc pivots.json dự phòng nếu có
        const pivotsRel = (pivotsData && pivotsData.pivots_relative_to_center) ? pivotsData.pivots_relative_to_center : {};
        const centerX = (pivotsData && pivotsData.canvas_center_x !== undefined) ? pivotsData.canvas_center_x : (svgState.viewBox.w / 2);

        // Duyệt tìm các group <g> có ID hoặc data-pivot
        const nodes = [];
        const nodeMap = {};

        function walk(node, parentId = '', depth = 0) {
            const nid = node.getAttribute('id') || '';
            const pivotAttr = node.getAttribute('data-pivot') || '';
            const tag = node.tagName.toLowerCase();
            const disp = node.getAttribute('display') || '';

            // Bỏ qua các nhóm định nghĩa pivot / joints / marker, không coi là khớp nhân vật
            if (nid && (/(^|_|-)(pivots|joints|markers|skeleton_layer|rig_markers)($|_|-)/i.test(nid) || nid.toLowerCase() === 'pivots' || nid.toLowerCase() === 'joints')) {
                return;
            }

            // Nếu node là thẻ <g> có id hoặc có data-pivot (hoặc thẻ đồ họa có id rõ ràng)
            if (nid && (tag === 'g' || tag === 'path' || tag === 'circle' || tag === 'rect' || tag === 'polygon' || tag === 'ellipse')) {
                let px = null;
                let py = null;

                // 1. data-pivot trực tiếp trên element
                if (pivotAttr) {
                    const pParts = pivotAttr.split(/[\s,]+/).map(s => parseFloat(s.trim()));
                    if (pParts.length >= 2 && !isNaN(pParts[0]) && !isNaN(pParts[1])) {
                        px = pParts[0];
                        py = pParts[1];
                    }
                }

                // 2. data-pivot-x & data-pivot-y
                if (px === null && node.hasAttribute('data-pivot-x') && node.hasAttribute('data-pivot-y')) {
                    const pvx = parseFloat(node.getAttribute('data-pivot-x'));
                    const pvy = parseFloat(node.getAttribute('data-pivot-y'));
                    if (!isNaN(pvx) && !isNaN(pvy)) { px = pvx; py = pvy; }
                }

                // 3. Tra cứu trong docPivotsMap trích xuất từ <g id="pivots">
                if (px === null) {
                    const keys = [
                        nid,
                        nid.toLowerCase(),
                        nid.toLowerCase().replace(/[\s\-_]+/g, '_'),
                        nid.toLowerCase().replace(/[\s\-_]+/g, '-')
                    ];
                    for (const k of keys) {
                        if (docPivotsMap[k]) {
                            px = docPivotsMap[k].x;
                            py = docPivotsMap[k].y;
                            break;
                        }
                    }
                }

                // 4. Tra cứu theo Semantic Aliases (thigh -> leg, shin -> knee, upper_arm -> arm, forearm -> elbow, torso -> upper_body)
                if (px === null) {
                    const s = nid.toLowerCase().replace(/[\s\-_]+/g, '_');
                    const aliases = [];
                    if (s.includes('thigh')) aliases.push(s.replace('thigh', 'leg'));
                    if (s.includes('shin')) aliases.push(s.replace('shin', 'knee'));
                    if (s.includes('upper_arm')) aliases.push(s.replace('upper_arm', 'arm'));
                    if (s.includes('forearm')) aliases.push(s.replace('forearm', 'elbow'));
                    if (s.includes('torso')) aliases.push('upper_body', 'upper-body', 'body');
                    for (const ak of aliases) {
                        if (docPivotsMap[ak]) {
                            px = docPivotsMap[ak].x;
                            py = docPivotsMap[ak].y;
                            break;
                        }
                    }
                }

                // 5. pivotsRel từ external pivots.json
                if (px === null && pivotsRel[nid]) {
                    const rel = pivotsRel[nid];
                    px = rel[0] + centerX;
                    py = rel[1];
                }

                // 6. Kế thừa từ Pivot của khớp Cha nếu Cha là khớp điều khiển trực tiếp
                if (px === null && parentId && nodeMap[parentId] && nodeMap[parentId].pivotX !== undefined) {
                    const pNode = nodeMap[parentId];
                    const s = nid.toLowerCase().replace(/[\s\-_]+/g, '_');
                    const ps = parentId.toLowerCase().replace(/[\s\-_]+/g, '_');
                    if ((s.includes('thigh') && ps.includes('leg')) ||
                        (s.includes('shin') && ps.includes('knee')) ||
                        (s.includes('upper_arm') && ps.includes('arm')) ||
                        (s.includes('forearm') && ps.includes('elbow')) ||
                        (s.includes('torso') && (ps.includes('upper_body') || ps === 'body')) ||
                        (s.includes('hair') && ps.includes('head')) ||
                        (s.includes('fringe') && ps.includes('head'))) {
                        px = pNode.pivotX;
                        py = pNode.pivotY;
                    }
                }

                // 7. Bounding Box hình học thông minh
                if (px === null) {
                    const bbox = computeElementBBox(node);
                    if (bbox) {
                        const r = detectSvgRole(nid);
                        if (r === 'foot_left' || r === 'foot_right') {
                            px = bbox.x + bbox.w / 2;
                            py = bbox.y; // Cổ chân
                        } else if (['arm_upper_left', 'arm_upper_right', 'arm_lower_left', 'arm_lower_right', 'leg_upper_left', 'leg_upper_right', 'leg_lower_left', 'leg_lower_right'].includes(r)) {
                            px = bbox.x + bbox.w / 2;
                            py = bbox.y + Math.min(15, bbox.h * 0.1); // Đầu khớp chi
                        } else if (r === 'head') {
                            px = bbox.x + bbox.w / 2;
                            py = bbox.y + bbox.h; // Cổ
                        } else if (r === 'body') {
                            px = bbox.x + bbox.w / 2;
                            py = bbox.y + bbox.h * 0.85; // Khớp hông
                        } else {
                            px = bbox.x + bbox.w / 2;
                            py = bbox.y + bbox.h / 2;
                        }
                    }
                }

                // 8. Fallback cuối cùng
                if (px === null || isNaN(px)) px = centerX;
                if (py === null || isNaN(py)) py = svgState.viewBox.h / 2;

                const role = detectSvgRole(nid);
                const isHiddenByDefault = (disp === 'none');

                const boneNode = {
                    id: nid,
                    name: nid,
                    tag: tag,
                    parentId: parentId,
                    pivotX: Math.round(px * 10) / 10,
                    pivotY: Math.round(py * 10) / 10,
                    defaultPivotX: Math.round(px * 10) / 10,
                    defaultPivotY: Math.round(py * 10) / 10,
                    role: role,
                    scale: 1.0,
                    testRot: 0,
                    visible: !isHiddenByDefault,
                    defaultDisplay: disp,
                    depth: depth,
                    elem: null
                };

                nodes.push(boneNode);
                nodeMap[nid] = boneNode;
            }

            const currParent = (nid && tag === 'g') ? nid : parentId;
            const nextDepth = (nid && tag === 'g') ? depth + 1 : depth;

            for (let i = 0; i < node.children.length; i++) {
                walk(node.children[i], currParent, nextDepth);
            }
        }

        walk(svgElem);
        svgState.nodes = nodes;
        svgState.nodeMap = nodeMap;

        // Đổ danh sách khớp cha vào dropdown Card 2
        populateSvgParentSelect();

        // Render danh sách layer cây khớp bên Card 4
        renderSvgLayersTree();

        // Inject SVG vào sân khấu
        injectSvgToStage(svgString);

        // Chọn node đầu tiên nếu có
        if (nodes.length > 0) {
            selectSvgNode(nodes[0].id);
        }

        // Tự động căn vừa khung hình
        fitSvgCanvas();
    }

    // Đưa SVG vào DOM thực tế trên sân khấu
    function injectSvgToStage(svgString) {
        const wrapper = document.getElementById('svgStageWrapper');
        if (!wrapper) return;
        wrapper.innerHTML = svgString;

        const liveSvg = wrapper.querySelector('svg');
        if (!liveSvg) return;
        liveSvg.querySelectorAll('rect, path, polygon, g').forEach(el => {
            const id = (el.getAttribute('id') || '').toLowerCase();
            const fill = (el.getAttribute('fill') || '').toLowerCase();
            if (id && /(ground|mat_dat|floor|bg|background|nen_dat|matdat)/i.test(id)) {
                el.remove();
                return;
            }
            if (id && (/(^|_|-)(pivots|joints|markers|skeleton_layer|rig_markers)($|_|-)/i.test(id) || id === 'pivots' || id === 'joints')) {
                el.remove();
                return;
            }
            if (el.tagName.toLowerCase() === 'rect') {
                const w = parseFloat(el.getAttribute('width')) || 0;
                const h = parseFloat(el.getAttribute('height')) || 0;
                const y = parseFloat(el.getAttribute('y')) || 0;
                if ((w >= svgState.viewBox.w * 0.6 && h >= svgState.viewBox.h * 0.15 && y >= svgState.viewBox.h * 0.35) ||
                    (w >= svgState.viewBox.w * 0.75 && h >= svgState.viewBox.h * 0.5) ||
                    fill === '#2b3135' || fill === '#3a342e' || fill === '#1c2630') {
                    el.remove();
                }
            }
        });

        liveSvg.id = 'svgLiveStage';
        liveSvg.style.width = `${svgState.viewBox.w}px`;
        liveSvg.style.height = `${svgState.viewBox.h}px`;
        liveSvg.style.display = 'block';
        liveSvg.style.overflow = 'visible';
        liveSvg.setAttribute('overflow', 'visible');



        // Gắn con trỏ element thật vào mỗi boneNode
        svgState.nodes.forEach(n => {
            const el = liveSvg.querySelector(`#${CSS.escape(n.id)}`);
            n.elem = el;
            if (el) {
                el.style.transformOrigin = '';
                el.style.transition = 'none';
                el.style.cursor = 'pointer';

                // Click trực tiếp trên hình để chọn khớp
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectSvgNode(n.id);
                });
            }
        });

        // Thiết lập kích thước overlay
        const overlay = document.getElementById('svgRigOverlay');
        if (overlay) {
            overlay.setAttribute('viewBox', `${svgState.viewBox.x} ${svgState.viewBox.y} ${svgState.viewBox.w} ${svgState.viewBox.h}`);
            overlay.style.width = `${svgState.viewBox.w}px`;
            overlay.style.height = `${svgState.viewBox.h}px`;
            overlay.style.overflow = 'visible';
            overlay.setAttribute('overflow', 'visible');
        }

        renderSvgStageFrame();
    }

    // Chọn 1 node trên giao diện
    function selectSvgNode(nodeId) {
        svgState.selectedId = nodeId;
        const node = svgState.nodeMap[nodeId];

        // Highlight trong cây layer
        const treeItems = document.querySelectorAll('.svg-tree-node');
        treeItems.forEach(el => {
            if (el.dataset.id === nodeId) el.classList.add('selected');
            else el.classList.remove('selected');
        });

        if (!node) return;

        // Cập nhật Card 2
        const targetBadge = document.getElementById('svgAnimSelectedBadge');
        const targetName = document.getElementById('svgAnimTargetName');
        const inputX = document.getElementById('inputSvgPivotX');
        const inputY = document.getElementById('inputSvgPivotY');
        const selectRole = document.getElementById('selectSvgAnimRole');
        const selectParent = document.getElementById('selectSvgAnimParent');
        const sliderScale = document.getElementById('sliderSvgLayerScale');
        const valScale = document.getElementById('valSvgLayerScale');
        const sliderRot = document.getElementById('sliderSvgTestRot');
        const valRot = document.getElementById('valSvgTestRot');

        if (targetBadge) targetBadge.textContent = node.id;
        if (targetName) targetName.textContent = `${node.id} (${node.role})`;
        if (inputX) inputX.value = Math.round(node.pivotX);
        if (inputY) inputY.value = Math.round(node.pivotY);
        if (selectRole) selectRole.value = node.role || 'custom';
        if (selectParent) selectParent.value = node.parentId || '';

        const sc = svgState.scales[node.id] || node.scale || 1.0;
        if (sliderScale) sliderScale.value = sc;
        if (valScale) valScale.textContent = `${sc.toFixed(2)}x`;

        const rot = svgState.testRotations[node.id] || node.testRot || 0;
        if (sliderRot) sliderRot.value = rot;
        if (valRot) valRot.textContent = `${Math.round(rot)}°`;

        renderSvgStageFrame();
    }

    // Setup tương tác điều khiển Card 2
    function setupCard2Controls() {
        const inputX = document.getElementById('inputSvgPivotX');
        const inputY = document.getElementById('inputSvgPivotY');
        const selectRole = document.getElementById('selectSvgAnimRole');
        const selectParent = document.getElementById('selectSvgAnimParent');
        const sliderScale = document.getElementById('sliderSvgLayerScale');
        const valScale = document.getElementById('valSvgLayerScale');
        const btnResetScale = document.getElementById('btnResetSvgLayerScale');
        const sliderRot = document.getElementById('sliderSvgTestRot');
        const valRot = document.getElementById('valSvgTestRot');
        const btnResetRot = document.getElementById('btnResetSvgTestRot');

        if (inputX) {
            inputX.addEventListener('input', () => {
                const node = svgState.nodeMap[svgState.selectedId];
                if (!node) return;
                node.pivotX = parseFloat(inputX.value) || 0;
                renderSvgStageFrame();
            });
        }
        if (inputY) {
            inputY.addEventListener('input', () => {
                const node = svgState.nodeMap[svgState.selectedId];
                if (!node) return;
                node.pivotY = parseFloat(inputY.value) || 0;
                renderSvgStageFrame();
            });
        }
        if (selectRole) {
            selectRole.addEventListener('change', () => {
                const node = svgState.nodeMap[svgState.selectedId];
                if (!node) return;
                node.role = selectRole.value;
                renderSvgLayersTree();
            });
        }
        if (selectParent) {
            selectParent.addEventListener('change', () => {
                const node = svgState.nodeMap[svgState.selectedId];
                if (!node) return;
                node.parentId = selectParent.value;
                renderSvgLayersTree();
                renderSvgStageFrame();
            });
        }
        if (sliderScale) {
            sliderScale.addEventListener('input', () => {
                const node = svgState.nodeMap[svgState.selectedId];
                if (!node) return;
                const sc = parseFloat(sliderScale.value) || 1.0;
                svgState.scales[node.id] = sc;
                node.scale = sc;
                if (valScale) valScale.textContent = `${sc.toFixed(2)}x`;
                renderSvgStageFrame();
            });
        }
        if (btnResetScale) {
            btnResetScale.addEventListener('click', () => {
                const node = svgState.nodeMap[svgState.selectedId];
                if (!node) return;
                svgState.scales[node.id] = 1.0;
                node.scale = 1.0;
                if (sliderScale) sliderScale.value = 1.0;
                if (valScale) valScale.textContent = '1.00x';
                renderSvgStageFrame();
            });
        }
        if (sliderRot) {
            sliderRot.addEventListener('input', () => {
                const node = svgState.nodeMap[svgState.selectedId];
                if (!node) return;
                const rot = parseFloat(sliderRot.value) || 0;
                svgState.testRotations[node.id] = rot;
                node.testRot = rot;
                if (valRot) valRot.textContent = `${Math.round(rot)}°`;
                renderSvgStageFrame();
            });
        }
        if (btnResetRot) {
            btnResetRot.addEventListener('click', () => {
                const node = svgState.nodeMap[svgState.selectedId];
                if (!node) return;
                svgState.testRotations[node.id] = 0;
                node.testRot = 0;
                if (sliderRot) sliderRot.value = 0;
                if (valRot) valRot.textContent = '0°';
                renderSvgStageFrame();
            });
        }
    }

    // Đổ danh sách khớp cha
    function populateSvgParentSelect() {
        const sel = document.getElementById('selectSvgAnimParent');
        if (!sel) return;
        sel.innerHTML = '<option value="">(Không có - Khớp độc lập)</option>';
        svgState.nodes.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n.id;
            opt.textContent = `${n.id} [${n.role}]`;
            sel.appendChild(opt);
        });
    }

    // Render danh sách layer cây khớp bên Card 4
    function renderSvgLayersTree() {
        const container = document.getElementById('svgAnimLayersList');
        const badge = document.getElementById('svgAnimLayersCountBadge');
        if (!container) return;

        if (svgState.nodes.length === 0) {
            container.innerHTML = `
                <div class="empty-parts-tip">
                    Chưa có dữ liệu Vector SVG.<br>
                    Hãy nhấn <strong>"⚡ Ví dụ 1: Học sinh"</strong> để bắt đầu!
                </div>
            `;
            if (badge) badge.textContent = '0 khớp';
            return;
        }

        if (badge) badge.textContent = `${svgState.nodes.length} khớp`;
        container.innerHTML = '';

        svgState.nodes.forEach(n => {
            const div = document.createElement('div');
            div.className = 'svg-tree-node' + (svgState.selectedId === n.id ? ' selected' : '');
            div.dataset.id = n.id;

            // Indentation
            const indent = document.createElement('span');
            indent.className = 'svg-tree-indent';
            indent.style.width = `${Math.min(n.depth * 14, 42)}px`;

            // Nút mắt ẩn/hiện
            const eyeBtn = document.createElement('span');
            eyeBtn.style.cursor = 'pointer';
            eyeBtn.style.fontSize = '12px';
            eyeBtn.textContent = n.visible ? '👁️' : '🕶️';
            eyeBtn.title = n.visible ? 'Ẩn bộ phận này' : 'Hiện bộ phận này';
            eyeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                n.visible = !n.visible;
                if (n.elem) n.elem.style.display = n.visible ? '' : 'none';
                eyeBtn.textContent = n.visible ? '👁️' : '🕶️';
            });

            // Tên bộ phận
            const nameSpan = document.createElement('span');
            nameSpan.style.flex = '1';
            nameSpan.style.overflow = 'hidden';
            nameSpan.style.textOverflow = 'ellipsis';
            nameSpan.style.whiteSpace = 'nowrap';
            nameSpan.textContent = n.id;

            // Nhãn vai trò
            const roleBadge = document.createElement('span');
            roleBadge.className = 'svg-role-badge';
            roleBadge.textContent = n.role;

            div.appendChild(indent);
            div.appendChild(eyeBtn);
            div.appendChild(nameSpan);
            div.appendChild(roleBadge);

            div.addEventListener('click', () => selectSvgNode(n.id));
            container.appendChild(div);
        });
    }

    // Render 18 Preset Catalog trong Card 3
    function renderSvgPresetsCatalog() {
        const grid = document.getElementById('svgPresetGrid');
        if (!grid) return;

        // Định nghĩa 18 preset khớp với Funny Animation Assistant
        const PRESETS = [
            { id: 'idle', name: 'Thở nhẹ nhàng', icon: '🧘', cat: 'basic' },
            { id: 'walk', name: 'Bước đi (Chuẩn)', icon: '🚶', cat: 'action' },
            { id: 'run', name: 'Chạy bộ nhanh', icon: '🏃', cat: 'action' },
            { id: 'walk_detailed', name: 'Bước đi (2 Khớp)', icon: '🚶‍♂️', cat: 'action' },
            { id: 'run_detailed', name: 'Chạy bộ (2 Khớp)', icon: '🏃‍♂️', cat: 'action' },
            { id: 'wave_right', name: 'Vẫy tay phải', icon: '👋', cat: 'action' },
            { id: 'wave_left', name: 'Vẫy tay trái', icon: '🙋', cat: 'action' },
            { id: 'point_right', name: 'Chỉ tay phải', icon: '👉', cat: 'action' },
            { id: 'raise_both_hands', name: 'Giơ 2 tay đầu hàng', icon: '🙌', cat: 'action' },
            { id: 'nod', name: 'Gật đầu đồng ý', icon: '🙆', cat: 'emotion' },
            { id: 'shake_head', name: 'Lắc đầu từ chối', icon: '🙅', cat: 'emotion' },
            { id: 'bow', name: 'Cúi chào lịch sự', icon: '🙇', cat: 'basic' },
            { id: 'jump', name: 'Nhảy bật lên', icon: '🦘', cat: 'action' },
            { id: 'scared', name: 'Sợ hãi run rẩy', icon: '😨', cat: 'emotion' },
            { id: 'talk', name: 'Nói chuyện cử động', icon: '🗣️', cat: 'basic' },
            { id: 'head_sway', name: 'Nghiêng đầu nhẹ', icon: '🙂', cat: 'basic' },
            { id: 'breathe', name: 'Thở phập phồng', icon: '💨', cat: 'basic' },
            { id: 'float', name: 'Bay bổng lơ lửng', icon: '🎈', cat: 'action' }
        ];

        grid.innerHTML = '';
        PRESETS.forEach(p => {
            const card = document.createElement('div');
            card.className = 'anim-preset-card' + (svgState.config.preset === p.id ? ' active' : '');
            card.dataset.id = p.id;
            card.dataset.cat = p.cat;

            const iconSpan = document.createElement('span');
            iconSpan.className = 'anim-preset-icon';
            iconSpan.textContent = p.icon;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'anim-preset-name';
            nameSpan.textContent = p.name;

            card.appendChild(iconSpan);
            card.appendChild(nameSpan);

            card.addEventListener('click', () => {
                document.querySelectorAll('#svgPresetGrid .anim-preset-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                svgState.config.preset = p.id;
                const badge = document.getElementById('svgAnimActivePresetBadge');
                if (badge) badge.textContent = `Đang chọn: ${p.name}`;
                renderSvgStageFrame();
            });

            grid.appendChild(card);
        });

        // Tabs phân loại
        const tabs = document.querySelectorAll('#svgPresetCategoryTabs .tab-btn');
        tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                tabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cat = btn.dataset.category;
                document.querySelectorAll('#svgPresetGrid .anim-preset-card').forEach(card => {
                    if (cat === 'all' || card.dataset.cat === cat) card.style.display = 'flex';
                    else card.style.display = 'none';
                });
            });
        });
    }

    // Cài đặt điều khiển tốc độ & biên độ
    function setupCard3Controls() {
        const sliderSpeed = document.getElementById('sliderSvgAnimSpeed');
        const valSpeed = document.getElementById('valSvgAnimSpeed');
        if (sliderSpeed) {
            sliderSpeed.addEventListener('input', () => {
                svgState.config.speed = parseFloat(sliderSpeed.value) || 1.0;
                if (valSpeed) valSpeed.textContent = `${svgState.config.speed.toFixed(1)}x`;
            });
        }

        const sliderIntensity = document.getElementById('sliderSvgAnimIntensity');
        const valIntensity = document.getElementById('valSvgAnimIntensity');
        if (sliderIntensity) {
            sliderIntensity.addEventListener('input', () => {
                svgState.config.intensity = parseFloat(sliderIntensity.value) || 1.0;
                if (valIntensity) valIntensity.textContent = `${Math.round(svgState.config.intensity * 100)}%`;
            });
        }

        const checkBlink = document.getElementById('checkSvgAutoBlink');
        if (checkBlink) checkBlink.addEventListener('change', () => svgState.config.auto_blink = checkBlink.checked);

        const checkLip = document.getElementById('checkSvgLipSync');
        if (checkLip) checkLip.addEventListener('change', () => svgState.config.lip_sync = checkLip.checked);

        const checkSway = document.getElementById('checkSvgHeadSway');
        if (checkSway) checkSway.addEventListener('change', () => svgState.config.head_sway = checkSway.checked);
    }

    // Thiết lập các điều khiển trên Sân khấu (Right Panel)
    function setupStageControls() {
        const btnRig = document.getElementById('btnSvgModeRig');
        const btnAnim = document.getElementById('btnSvgModeAnim');
        if (btnRig && btnAnim) {
            btnRig.addEventListener('click', () => {
                btnRig.classList.add('active');
                btnAnim.classList.remove('active');
                svgState.stageMode = 'rig';
                renderSvgStageFrame();
            });
            btnAnim.addEventListener('click', () => {
                btnAnim.classList.add('active');
                btnRig.classList.remove('active');
                svgState.stageMode = 'anim';
                renderSvgStageFrame();
            });
        }

        const btnPlay = document.getElementById('btnSvgPlayPause');
        const iconPlay = document.getElementById('iconSvgPlay');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                svgState.isPlaying = !svgState.isPlaying;
                if (iconPlay) {
                    iconPlay.innerHTML = svgState.isPlaying
                        ? '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>'
                        : '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
                }
            });
        }

        const btnResetTime = document.getElementById('btnSvgResetTime');
        if (btnResetTime) {
            btnResetTime.addEventListener('click', () => {
                svgState.currentTime = 0;
                renderSvgStageFrame();
            });
        }

        const sliderTime = document.getElementById('sliderSvgTimeline');
        if (sliderTime) {
            sliderTime.addEventListener('input', () => {
                svgState.currentTime = (parseFloat(sliderTime.value) / 1000.0) * 3.0; // 3 giây
                renderSvgStageFrame();
            });
        }

        const selectBg = document.getElementById('selectSvgBgMode');
        const viewport = document.getElementById('svgStageViewport');
        if (selectBg && viewport) {
            selectBg.addEventListener('change', () => {
                const mode = selectBg.value;
                if (mode === 'dark') viewport.style.background = '#1e293b';
                else if (mode === 'white') viewport.style.background = '#ffffff';
                else if (mode === 'transparent') viewport.style.background = 'none';
                else if (mode === 'grid') viewport.style.background = 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 20px 20px';
            });
        }

        const checkShowPivots = document.getElementById('checkSvgShowPivots');
        if (checkShowPivots) checkShowPivots.addEventListener('change', renderSvgStageFrame);

        // Zoom & Pan
        const btnIn = document.getElementById('btnSvgZoomIn');
        const btnOut = document.getElementById('btnSvgZoomOut');
        const btnReset = document.getElementById('btnSvgZoomReset');
        if (btnIn) btnIn.addEventListener('click', () => zoomSvg(1.25));
        if (btnOut) btnOut.addEventListener('click', () => zoomSvg(0.8));
        if (btnReset) btnReset.addEventListener('click', () => fitSvgCanvas());

        if (viewport) {
            viewport.addEventListener('wheel', (e) => {
                e.preventDefault();
                const factor = e.deltaY < 0 ? 1.15 : 0.85;
                zoomSvg(factor);
            }, { passive: false });

            viewport.addEventListener('mousedown', (e) => {
                if (e.target.closest('.floating-zoom') || e.target.classList.contains('svg-pivot-handle')) return;
                svgState.isPanning = true;
                svgState.panStartX = e.clientX - svgState.panX;
                svgState.panStartY = e.clientY - svgState.panY;
                viewport.style.cursor = 'grabbing';
            });

            window.addEventListener('mousemove', (e) => {
                if (svgState.isPanning) {
                    svgState.panX = e.clientX - svgState.panStartX;
                    svgState.panY = e.clientY - svgState.panStartY;
                    updateSvgTransform();
                } else if (svgState.isDraggingPivot && svgState.dragPivotNode) {
                    // Kéo rê trực tiếp Pivot trên sân khấu
                    const node = svgState.dragPivotNode;
                    const rect = viewport.getBoundingClientRect();
                    const mouseStageX = (e.clientX - rect.left - svgState.panX) / svgState.zoom;
                    const mouseStageY = (e.clientY - rect.top - svgState.panY) / svgState.zoom;

                    node.pivotX = Math.round(mouseStageX);
                    node.pivotY = Math.round(mouseStageY);

                    const inputX = document.getElementById('inputSvgPivotX');
                    const inputY = document.getElementById('inputSvgPivotY');
                    if (inputX) inputX.value = node.pivotX;
                    if (inputY) inputY.value = node.pivotY;

                    renderSvgStageFrame();
                }
            });

            window.addEventListener('mouseup', () => {
                svgState.isPanning = false;
                svgState.isDraggingPivot = false;
                svgState.dragPivotNode = null;
                if (viewport) viewport.style.cursor = 'default';
            });
        }
    }

    function zoomSvg(factor) {
        svgState.zoom = Math.max(0.1, Math.min(6.0, svgState.zoom * factor));
        updateSvgTransform();
    }

    function fitSvgCanvas() {
        const vp = document.getElementById('svgStageViewport');
        if (!vp) return;
        const pad = 50;
        const availW = vp.clientWidth - pad * 2;
        const availH = vp.clientHeight - pad * 2;

        // Tinh toan bounding box cua nhan vat de zoom/can giua san khau chuan nhu Tab 4
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        if (svgState.nodes.length > 0) {
            svgState.nodes.forEach(n => {
                minX = Math.min(minX, n.pivotX - 35);
                minY = Math.min(minY, n.pivotY - 45);
                maxX = Math.max(maxX, n.pivotX + 35);
                maxY = Math.max(maxY, n.pivotY + 45);
            });
        } else {
            minX = 300; minY = 60; maxX = 380; maxY = 270;
        }

        const charW = Math.max(80, maxX - minX);
        const charH = Math.max(120, maxY - minY);
        const charCenterX = (minX + maxX) / 2;
        const charCenterY = (minY + maxY) / 2;

        const scale = Math.min(availW / charW, availH / charH, 2.2);
        svgState.zoom = Math.max(0.5, Math.min(scale, 2.2));
        svgState.panX = (vp.clientWidth / 2) - (charCenterX * svgState.zoom);
        svgState.panY = (vp.clientHeight / 2) - (charCenterY * svgState.zoom);
        updateSvgTransform();
    }

    function updateSvgTransform() {
        const container = document.getElementById('svgStageContainer');
        if (!container) return;
        container.style.transform = `translate(${svgState.panX}px, ${svgState.panY}px) scale(${svgState.zoom})`;
    }

    // Animation Loop 60 FPS
    function startSvgAnimLoop() {
        if (svgState.animFrameId) cancelAnimationFrame(svgState.animFrameId);
        svgState.lastFrameTime = performance.now();

        function loop(now) {
            const dt = (now - svgState.lastFrameTime) / 1000.0;
            svgState.lastFrameTime = now;

            if (svgState.isPlaying && svgState.stageMode === 'anim') {
                svgState.currentTime += dt * svgState.config.speed;
                const timeSlider = document.getElementById('sliderSvgTimeline');
                const timeDisplay = document.getElementById('valSvgTimeDisplay');
                if (timeSlider) {
                    const normTime = (svgState.currentTime % 3.0) / 3.0;
                    timeSlider.value = Math.round(normTime * 1000);
                }
                if (timeDisplay) {
                    timeDisplay.textContent = `${(svgState.currentTime % 3.0).toFixed(2)}s`;
                }
            }

            renderSvgStageFrame();
            svgState.animFrameId = requestAnimationFrame(loop);
        }

        svgState.animFrameId = requestAnimationFrame(loop);
    }

    function stopSvgAnimLoop() {
        if (svgState.animFrameId) {
            cancelAnimationFrame(svgState.animFrameId);
            svgState.animFrameId = null;
        }
    }

    // Tính toán biến đổi và render sân khấu SVG
        // ========================================================
    // Ma trận 2D Affine (3x3) & Giải phương trình Forward Kinematics (FK)
    // ========================================================
    function makeMat3Svg(px, py, dx, dy, rotDeg, sx, sy) {
        const rad = (rotDeg || 0) * Math.PI / 180.0;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        const a = cosA * (sx !== undefined ? sx : 1.0);
        const b = -sinA * (sy !== undefined ? sy : 1.0);
        const c = sinA * (sx !== undefined ? sx : 1.0);
        const d = cosA * (sy !== undefined ? sy : 1.0);

        const tx = px + (dx || 0) - (a * px + b * py);
        const ty = py + (dy || 0) - (c * px + d * py);

        return [
            [a, b, tx],
            [c, d, ty],
            [0, 0, 1]
        ];
    }

    function mulMat3Svg(A, B) {
        const out = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 1]
        ];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                out[r][c] = A[r][0] * B[0][c] + A[r][1] * B[1][c] + A[r][2] * B[2][c];
            }
        }
        return out;
    }

    function invMat3Svg(M) {
        const a = M[0][0], b = M[0][1], tx = M[0][2];
        const c = M[1][0], d = M[1][1], ty = M[1][2];
        const det = a * d - b * c;
        if (Math.abs(det) < 1e-12) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const invDet = 1.0 / det;
        return [
            [d * invDet, -b * invDet, (b * ty - d * tx) * invDet],
            [-c * invDet, a * invDet, (c * tx - a * ty) * invDet],
            [0, 0, 1]
        ];
    }

    // Render từng Frame Animation trên Sân khấu Vector SVG bằng Forward Kinematics (FK)
    function renderSvgStageFrame() {
        if (!svgState.svgDoc || svgState.nodes.length === 0) return;

        const t = (svgState.stageMode === 'rig') ? 0 : svgState.currentTime;
        const isRig = (svgState.stageMode === 'rig');
        const cfg = svgState.config;
        const preset = cfg.preset || 'walk';
        const intensity = cfg.intensity || 1.0;
        const speed = cfg.speed || 1.0;

        // Trạng thái chớp mắt & nhép miệng
        const isBlinking = cfg.auto_blink && ((t % 3.2) < 0.18);
        const talkPhase = (t * 8.0) % 1.0; // Chu kỳ nhép miệng nhanh khi nói

        // Lấy cấu hình Preset chuyển động
        const presetDef = getSvgPresetDef(preset);

        // 1. Tính toán Local Pose & Local Transform Matrix cho từng node
        const localMatrices = {};
        const localPoses = {};

        svgState.nodes.forEach(node => {
            if (!node.elem) return;

            // Xử lý ẩn/hiện nếu bị tắt trong cây layer
            if (!node.visible) {
                node.elem.style.display = 'none';
                return;
            }

            // Xử lý đổi trạng thái Mắt (Blinking)
            if (cfg.auto_blink) {
                if (node.role === 'eye_open') {
                    node.elem.style.display = isBlinking ? 'none' : '';
                } else if (node.role === 'eye_closed') {
                    node.elem.style.display = isBlinking ? '' : 'none';
                }
            }

            // Xử lý đổi trạng thái Miệng (Lip-sync khi talk)
            if (cfg.lip_sync && (preset === 'talk' || preset === 'scared')) {
                if (node.role === 'mouth_closed') {
                    node.elem.style.display = (talkPhase < 0.35) ? '' : 'none';
                } else if (node.role === 'mouth_half') {
                    node.elem.style.display = (talkPhase >= 0.35 && talkPhase < 0.7) ? '' : 'none';
                } else if (node.role === 'mouth_open') {
                    node.elem.style.display = (talkPhase >= 0.7) ? '' : 'none';
                }
            }

            let rot = 0;
            let dx = 0;
            let dy = 0;
            let userScale = svgState.scales[node.id] || node.scale || 1.0;
            let sx = userScale;
            let sy = userScale;

            if (isRig) {
                // Trong Rig mode: dùng góc test rotation đang kéo
                rot = svgState.testRotations[node.id] || 0;
            } else {
                // Trong Animation mode: tính toán từ solver động
                if (presetDef) {
                    const tracks = resolvePresetTrackForSvgNode(presetDef, node);
                    const durMs = Math.max(1.0, presetDef.duration || 1000);
                    const localMs = (t * 1000.0 * speed) % durMs;

                    tracks.forEach(tr => {
                        if (tr.type === 'transform' && tr.keyframes) {
                            const trot = interpolatePropSvg(tr.keyframes, 'rotation', localMs, 0.0);
                            const tx = interpolatePropSvg(tr.keyframes, 'x', localMs, 0.0);
                            const ty = interpolatePropSvg(tr.keyframes, 'y', localMs, 0.0);
                            const tsx = interpolatePropSvg(tr.keyframes, 'scaleX', localMs, 1.0);
                            const tsy = interpolatePropSvg(tr.keyframes, 'scaleY', localMs, 1.0);

                            rot += trot * intensity;
                            dx += tx * intensity;
                            dy += ty * intensity;
                            sx *= (1.0 + (tsx - 1.0) * intensity);
                            sy *= (1.0 + (tsy - 1.0) * intensity);
                        } else if (tr.type === 'effect' && tr.effect) {
                            const eff = tr.effect;
                            if (eff.type === 'breathe' && (node.role === 'torso' || node.role === 'body')) {
                                const wave = Math.sin(t * 5.0 * speed) * (eff.intensity || 0.04) * intensity;
                                sy *= (1.0 + wave);
                                sx *= (1.0 - wave * 0.4);
                            } else if (eff.type === 'float' && (!node.parentId || node.parentId === 'character' || node.id === 'body')) {
                                dy += Math.sin(t * 3.0 * speed) * (eff.amplitude || 8.0) * intensity;
                            }
                        }
                    });

                    // Chống trùng lặp Bobbing Y nếu torso nằm trong body
                    if (node.id === 'torso' && node.parentId && svgState.nodeMap[node.parentId] && svgState.nodeMap[node.parentId].role === 'body') {
                        dx = 0;
                        dy = 0;
                    }
                }

                // Nghiêng đầu tự nhiên
                if (cfg.head_sway && node.role === 'head') {
                    rot += Math.sin(t * 3.5 * speed) * 6.0 * intensity;
                }
            }

            localPoses[node.id] = { rot, dx, dy, sx, sy };
            localMatrices[node.id] = makeMat3Svg(node.pivotX, node.pivotY, dx, dy, rot, sx, sy);
        });

        // 2. Tính toán World Matrix cho từng node theo cây phả hệ khớp (FK)
        const worldMatrices = {};
        function getWorldMatrixSvg(nid, depth = 0) {
            if (worldMatrices[nid]) return worldMatrices[nid];
            const node = svgState.nodeMap[nid];
            if (!node || depth > 8) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            const mLoc = localMatrices[nid] || makeMat3Svg(node.pivotX, node.pivotY, 0, 0, 0, 1, 1);
            const pid = node.parentId;
            let mWorld = mLoc;
            if (pid && svgState.nodeMap[pid] && pid !== nid && pid !== 'character' && pid !== 'figure' && pid !== 'root') {
                const mParent = getWorldMatrixSvg(pid, depth + 1);
                mWorld = mulMat3Svg(mParent, mLoc);
            }
            worldMatrices[nid] = mWorld;
            return mWorld;
        }

        svgState.nodes.forEach(n => getWorldMatrixSvg(n.id));

        // 3. Áp dụng ma trận transform lên từng phần tử SVG DOM
        svgState.nodes.forEach(node => {
            if (!node.elem || !node.visible) return;

            // Tìm phần tử cha gần nhất trong cây DOM cũng là một node đang hoạt họa
            let domParentNode = null;
            let currEl = node.elem.parentElement;
            while (currEl && currEl.tagName && currEl.tagName.toLowerCase() !== 'svg') {
                const pId = currEl.getAttribute('id');
                if (pId && svgState.nodeMap[pId] && pId !== node.id) {
                    domParentNode = svgState.nodeMap[pId];
                    break;
                }
                currEl = currEl.parentElement;
            }

            const mWorld = worldMatrices[node.id] || [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            let mApply = mWorld;
            if (domParentNode) {
                const mParentWorld = worldMatrices[domParentNode.id] || [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
                mApply = mulMat3Svg(invMat3Svg(mParentWorld), mWorld);
            }

            // Gán SVG matrix(a, b, c, d, e, f)
            // Trong đó SVG matrix: [a c e; b d f; 0 0 1]
            const a = Number(mApply[0][0].toFixed(5));
            const b = Number(mApply[1][0].toFixed(5));
            const c = Number(mApply[0][1].toFixed(5));
            const d = Number(mApply[1][1].toFixed(5));
            const e = Number(mApply[0][2].toFixed(3));
            const f = Number(mApply[1][2].toFixed(3));

            node.elem.setAttribute('transform', `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`);
        });

        // 4. Vẽ overlay khung xương & điểm Pivot khớp 100% với World Pose
        drawSvgRigOverlay(worldMatrices);
    }

    // Vẽ overlay khung xương (Bone lines) và các nút Pivot trên canvas
    function drawSvgRigOverlay(worldMatrices) {
        const overlay = document.getElementById('svgRigOverlay');
        const checkShow = document.getElementById('checkSvgShowPivots');
        if (!overlay) return;

        if (!checkShow || !checkShow.checked) {
            overlay.innerHTML = '';
            return;
        }

        let svgMarkup = '';

        // Tọa độ thực tế theo Forward Kinematics (FK)
        const worldPositions = {};
        svgState.nodes.forEach(node => {
            const mW = (worldMatrices && worldMatrices[node.id]) ? worldMatrices[node.id] : [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            const wx = mW[0][0] * node.pivotX + mW[0][1] * node.pivotY + mW[0][2];
            const wy = mW[1][0] * node.pivotX + mW[1][1] * node.pivotY + mW[1][2];
            worldPositions[node.id] = { x: wx, y: wy };
        });

        // Đường nối xương giữa Con và Cha
        svgState.nodes.forEach(node => {
            if (!node.visible || !node.parentId) return;
            const parent = svgState.nodeMap[node.parentId];
            if (!parent || !parent.visible) return;

            const pPos = worldPositions[parent.id] || { x: parent.pivotX, y: parent.pivotY };
            const nPos = worldPositions[node.id] || { x: node.pivotX, y: node.pivotY };

            const dDist = Math.hypot(nPos.x - pPos.x, nPos.y - pPos.y);
            if (dDist >= 1.5) {
                svgMarkup += `
                    <line x1="${pPos.x.toFixed(1)}" y1="${pPos.y.toFixed(1)}" x2="${nPos.x.toFixed(1)}" y2="${nPos.y.toFixed(1)}"
                          stroke="#0284c7" stroke-width="2.5" stroke-dasharray="4,3" opacity="0.8" />
                `;
            }
        });

        // Điểm Pivot dạng tâm ngắm (Reticle)
        svgState.nodes.forEach(node => {
            if (!node.visible) return;
            const isSel = (svgState.selectedId === node.id);
            const color = isSel ? '#f59e0b' : '#38bdf8';
            const r = isSel ? 7 : 5;
            const pos = worldPositions[node.id] || { x: node.pivotX, y: node.pivotY };

            svgMarkup += `
                <g class="svg-pivot-handle" data-id="${node.id}" style="pointer-events: all; cursor: grab;">
                    <circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
                    <line x1="${(pos.x - r - 3).toFixed(1)}" y1="${pos.y.toFixed(1)}" x2="${(pos.x + r + 3).toFixed(1)}" y2="${pos.y.toFixed(1)}" stroke="${color}" stroke-width="1.5" />
                    <line x1="${pos.x.toFixed(1)}" y1="${(pos.y - r - 3).toFixed(1)}" x2="${pos.x.toFixed(1)}" y2="${(pos.y + r + 3).toFixed(1)}" stroke="${color}" stroke-width="1.5" />
                </g>
            `;
        });

        overlay.innerHTML = svgMarkup;

        // Bắt sự kiện kéo Pivot trực tiếp
        overlay.querySelectorAll('.svg-pivot-handle').forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const nid = el.dataset.id;
                selectSvgNode(nid);
                svgState.isDraggingPivot = true;
                svgState.dragPivotNode = svgState.nodeMap[nid];
            });
        });
    }

    function setupExportActions() {
        const btnSvg = document.getElementById('btnSvgExportAnimatedSvg');
        const btnGif = document.getElementById('btnSvgExportGif');
        const btnMp4 = document.getElementById('btnSvgExportMp4');
        const btnPng = document.getElementById('btnSvgExportPng');
        const btnPackage = document.getElementById('btnSvgExportFunnyPackage');

        if (btnSvg) btnSvg.addEventListener('click', exportStandaloneAnimatedSvg);
        if (btnGif) btnGif.addEventListener('click', () => exportSvgToRaster('gif'));
        if (btnMp4) btnMp4.addEventListener('click', () => exportSvgToRaster('mp4'));
        if (btnPng) btnPng.addEventListener('click', () => exportSvgToRaster('png_zip'));
        if (btnPackage) btnPackage.addEventListener('click', () => exportFunnyAnimationPackageFromSvg('paulto'));
    }

    // Xuất file SVG hoạt họa độc lập có nhúng CSS @keyframes
    function exportStandaloneAnimatedSvg() {
        if (!svgState.svgDoc) {
            alert('Chưa có nhân vật SVG nào được nạp!');
            return;
        }

        const cloneSvg = svgState.svgDoc.cloneNode(true).querySelector('svg');
        const preset = svgState.config.preset || 'walk';
        const presetDef = getSvgPresetDef(preset);

        let cssKeyframes = `\n/* Auto-generated Skeletal Vector Animation by SpriteSplit Studio */\n`;
        const durMs = presetDef ? (presetDef.duration || 1000) : 1000;
        const durSec = (durMs / 1000.0).toFixed(2);

        svgState.nodes.forEach(node => {
            if (!presetDef) return;
            const tracks = resolvePresetTrackForSvgNode(presetDef, node);
            if (tracks.length === 0) return;

            const kfName = `anim_${node.id}_${preset}`;
            let kfContent = `@keyframes ${kfName} {\n`;

            for (let percent = 0; percent <= 100; percent += 10) {
                const localMs = (percent / 100.0) * durMs;
                let rot = 0, dx = 0, dy = 0;
                tracks.forEach(tr => {
                    if (tr.type === 'transform' && tr.keyframes) {
                        rot += interpolatePropSvg(tr.keyframes, 'rotation', localMs, 0.0);
                        dx += interpolatePropSvg(tr.keyframes, 'x', localMs, 0.0);
                        dy += interpolatePropSvg(tr.keyframes, 'y', localMs, 0.0);
                    }
                });

                const px = node.pivotX;
                const py = node.pivotY;
                const tf = `translate(${dx}px, ${dy}px) translate(${px}px, ${py}px) rotate(${rot}deg) translate(${-px}px, ${-py}px)`;
                kfContent += `  ${percent}% { transform: ${tf}; }\n`;
            }
            kfContent += `}\n`;
            kfContent += `#${node.id} { animation: ${kfName} ${durSec}s infinite ease-in-out; transform-origin: ${node.pivotX}px ${node.pivotY}px; }\n`;
            cssKeyframes += kfContent;        });

        // Nhúng <style> vào SVG
        const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        styleEl.textContent = cssKeyframes;
        cloneSvg.insertBefore(styleEl, cloneSvg.firstChild);

        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(cloneSvg);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${svgState.title || 'character'}_animated.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Đã xuất thành công file Vector SVG Hoạt Họa Độc Lập! Bạn có thể kéo thả vào trình duyệt, Figma hoặc nhúng vào website để chạy tự động.');
    }

    // Trích xuất từng bộ phận SVG thành các Layer PNG độ phân giải cao (3x HD) kèm tọa độ & tâm xoay Pivot chính xác
    async function extractSvgLayersForExport(upscale = 3.0) {
        const srcSvg = svgState.svgDoc ? svgState.svgDoc.querySelector('svg') : null;
        if (!srcSvg) return [];

        const vb = svgState.viewBox || { x: 0, y: 0, w: 680, h: 340 };
        const measureSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        measureSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        measureSvg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
        measureSvg.setAttribute('width', vb.w);
        measureSvg.setAttribute('height', vb.h);
        measureSvg.style.position = 'fixed';
        measureSvg.style.left = '-9999px';
        measureSvg.style.top = '-9999px';
        measureSvg.style.visibility = 'hidden';
        measureSvg.style.pointerEvents = 'none';

        const origDefs = srcSvg.querySelector('defs');
        if (origDefs) {
            measureSvg.appendChild(origDefs.cloneNode(true));
        }
        document.body.appendChild(measureSvg);

        const shapeSelector = 'rect, circle, ellipse, path, polygon, polyline, line, image, text, use';
        const allDocGraphics = Array.from(srcSvg.querySelectorAll(shapeSelector));
        const serializer = new XMLSerializer();
        const rawItems = [];

        try {
            for (const node of svgState.nodes) {
                const origG = srcSvg.querySelector(`#${CSS.escape(node.id)}`);
                if (!origG) continue;

                // Chỉ lấy các hình đồ họa thuộc trực tiếp về khớp này (không nằm trong khớp con)
                const ownGraphics = allDocGraphics.filter(el => {
                    if (!origG.contains(el)) return false;
                    let cur = el.parentElement;
                    while (cur && cur !== origG) {
                        if (cur.tagName && cur.tagName.toLowerCase() === 'g' && cur.id && svgState.nodeMap[cur.id]) {
                            return false;
                        }
                        cur = cur.parentElement;
                    }
                    return true;
                });

                if (ownGraphics.length === 0) continue;
                const firstDomIdx = allDocGraphics.indexOf(ownGraphics[0]);

                const cloneG = origG.cloneNode(true);
                cloneG.removeAttribute('transform');
                cloneG.removeAttribute('display');
                cloneG.style.display = '';
                cloneG.querySelectorAll('g[id]').forEach(subG => {
                    if (subG !== cloneG && svgState.nodeMap[subG.id]) {
                        subG.remove();
                    }
                });
                cloneG.querySelectorAll('[display="none"]').forEach(hEl => {
                    hEl.removeAttribute('display');
                });

                measureSvg.appendChild(cloneG);
                let bbox;
                try {
                    bbox = cloneG.getBBox();
                } catch (e) {
                    bbox = { x: node.pivotX - 20, y: node.pivotY - 20, width: 40, height: 40 };
                }
                measureSvg.removeChild(cloneG);

                if (bbox.width <= 0.1 && bbox.height <= 0.1) continue;

                const pad = 4;
                const rx = bbox.x - pad;
                const ry = bbox.y - pad;
                const rw = Math.max(4, bbox.width + pad * 2);
                const rh = Math.max(4, bbox.height + pad * 2);
                const wPx = Math.max(2, Math.round(rw * upscale));
                const hPx = Math.max(2, Math.round(rh * upscale));

                const partSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                partSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                partSvg.setAttribute('viewBox', `${rx} ${ry} ${rw} ${rh}`);
                partSvg.setAttribute('width', wPx);
                partSvg.setAttribute('height', hPx);
                if (origDefs) partSvg.appendChild(origDefs.cloneNode(true));
                partSvg.appendChild(cloneG);

                const svgStr = serializer.serializeToString(partSvg);
                const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);

                const dataUrl = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const c = document.createElement('canvas');
                        c.width = wPx;
                        c.height = hPx;
                        const ctx = c.getContext('2d');
                        ctx.clearRect(0, 0, wPx, hPx);
                        ctx.drawImage(img, 0, 0, wPx, hPx);
                        URL.revokeObjectURL(url);
                        resolve(c.toDataURL('image/png'));
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        resolve('');
                    };
                    img.src = url;
                });

                if (!dataUrl) continue;
                rawItems.push({
                    node,
                    firstDomIdx,
                    rx,
                    ry,
                    rw,
                    rh,
                    wPx,
                    hPx,
                    dataUrl
                });
            }
        } finally {
            if (measureSvg.parentNode) {
                measureSvg.parentNode.removeChild(measureSvg);
            }
        }

        // Sắp xếp theo đúng thứ tự vẽ (Painter's Algorithm) từ dưới lên trên trong DOM SVG
        rawItems.sort((a, b) => a.firstDomIdx - b.firstDomIdx);

        const roleCompatMap = {
            'leg_upper_left': 'leg_thigh_left',
            'leg_lower_left': 'leg_calf_left',
            'leg_upper_right': 'leg_thigh_right',
            'leg_lower_right': 'leg_calf_right'
        };

        const nodeIdToLayerId = {};
        rawItems.forEach((item, idx) => {
            nodeIdToLayerId[item.node.id] = idx + 1;
        });

        let bodyLayerId = null;
        for (let i = 0; i < rawItems.length; i++) {
            const r = roleCompatMap[rawItems[i].node.role] || rawItems[i].node.role;
            if (r === 'body') {
                bodyLayerId = i + 1;
                break;
            }
        }

        const exprRoles = new Set(['eye_open', 'eye_closed', 'eye_extra', 'mouth_closed', 'mouth_half', 'mouth_open']);

        return rawItems.map((item, idx) => {
            const lid = idx + 1;
            const node = item.node;
            const mappedRole = roleCompatMap[node.role] || node.role || 'custom';

            // Tìm parent_id gần nhất có hình đồ họa
            let resolvedParentId = null;
            let curPid = node.parentId;
            let guard = 0;
            while (curPid && guard < 10) {
                guard++;
                if (nodeIdToLayerId[curPid] && nodeIdToLayerId[curPid] !== lid) {
                    resolvedParentId = nodeIdToLayerId[curPid];
                    break;
                }
                const pNode = svgState.nodeMap[curPid];
                curPid = pNode ? pNode.parentId : null;
            }
            if (!resolvedParentId && bodyLayerId && lid !== bodyLayerId) {
                resolvedParentId = bodyLayerId;
            }

            // Luôn bật visible=true cho các layer biểu cảm mắt/miệng để bộ đóng gói Paul To Animation
            // tự động thiết lập trạng thái nghỉ và sinh VisibilityTrack cho Chớp mắt & Nhép miệng
            const isVis = exprRoles.has(mappedRole) ? true : (node.visible !== false);

            return {
                id: lid,
                name: node.id,
                role: mappedRole,
                pos_x: Math.round(item.rx * upscale * 100) / 100,
                pos_y: Math.round(item.ry * upscale * 100) / 100,
                w: item.wPx,
                h: item.hPx,
                pivot_x: Math.round((node.pivotX - item.rx) * upscale * 100) / 100,
                pivot_y: Math.round((node.pivotY - item.ry) * upscale * 100) / 100,
                parent_id: resolvedParentId,
                visible: isVis,
                z_index: lid,
                opacity: 255,
                scale: svgState.scales[node.id] || node.scale || 1.0,
                image: item.dataUrl
            };
        });
    }

    // Xuất trọn gói dự án Paul To Animation (.character.json, .paulto, .anime, config.json) & GIF / MP4 / PNG Sequence
    async function exportSvgToRaster(format) {
        await exportFunnyAnimationPackageFromSvg(format);
    }

    async function exportFunnyAnimationPackageFromSvg(formatMode = 'paulto') {
        if (!svgState.svgDoc || svgState.nodes.length === 0) {
            alert('Chưa có nhân vật SVG nào được nạp!');
            return;
        }

        const appSt = window.appState || {};
        let targetFolder = appSt.customOutputDir || localStorage.getItem('spriteSplit_outputDir') || '';
        try {
            const res = await fetch('/api/select-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_path: targetFolder || appSt.defaultOutputDir || '',
                    title: 'Chọn thư mục lưu Gói Paul To Animation (.character.json / .paulto / .anime) & Video / GIF'
                })
            });
            const folderData = await res.json();
            if (!folderData.folder) {
                return;
            }
            targetFolder = folderData.folder;
            if (window.appState) window.appState.customOutputDir = targetFolder;
            localStorage.setItem('spriteSplit_outputDir', targetFolder);
        } catch (err) {
            console.warn('Folder dialog warning:', err);
        }

        const expModal = document.getElementById('exportModal');
        const modSummary = document.getElementById('modalSummary');
        if (expModal && modSummary) {
            expModal.classList.add('show');
            modSummary.innerHTML = `
                Đang trích xuất các bộ phận <strong>Vector SVG (Độ nét cao 3x HD)</strong> và đóng gói <strong>Paul To Animation Project</strong> vào thư mục:<br>
                <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 11.5px; display: inline-block; margin: 6px 0; word-break: break-all;">
                    ${targetFolder}
                </code><br>
                Đang tính toán hệ thống khớp xương Forward Kinematics (FK), gắn trọn bộ 18+ Preset Animation, Chớp mắt & Nhép miệng...
            `;
        }

        try {
            const upscale = 3.0;
            const layers = await extractSvgLayersForExport(upscale);
            if (!layers || layers.length === 0) {
                throw new Error('Không tìm thấy bộ phận đồ họa nào trong file SVG!');
            }

            const vb = svgState.viewBox || { w: 680, h: 340 };
            const rawBase = (svgState.filename || svgState.title || 'svg_character').replace(/\.[^/.]+$/, '');
            const baseName = `${rawBase}_${svgState.config.preset || 'walk'}`;

            const durSelect = document.getElementById('selectSvgExportDuration');
            const chosenDuration = durSelect ? (parseFloat(durSelect.value) || 2.4) : 2.4;

            const animCfg = {
                preset: svgState.config.preset || 'walk',
                speed: svgState.config.speed || 1.0,
                intensity: svgState.config.intensity || 1.0,
                auto_blink: svgState.config.auto_blink !== false,
                lip_sync: svgState.config.lip_sync !== false,
                head_sway: !!svgState.config.head_sway,
                duration: chosenDuration,
                fps: 24
            };

            const res = await fetch('/api/export-animation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    layers: layers,
                    width: Math.round(vb.w * upscale),
                    height: Math.round(vb.h * upscale),
                    anim_config: animCfg,
                    output_dir: targetFolder,
                    base_name: baseName
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Xuất gói Paul To Animation thất bại');
            }

            const data = await res.json();
            if (window.appState) {
                window.appState.lastExportData = data;
            }

            const stdPartsText = (data.funny_standardized_parts && data.funny_standardized_parts.length > 0)
                ? data.funny_standardized_parts.join(', ')
                : 'Tự động';

            if (modSummary) {
                modSummary.innerHTML = `
                    Đã xuất thành công trọn bộ <strong>Vector SVG -> Paul To Animation Project</strong> (${layers.length} bộ phận, ${data.total_frames} Frames) tại:<br>
                    <code style="background: #ecfdf5; color: #047857; font-weight: 600; padding: 6px 10px; border-radius: 6px; font-size: 12px; display: inline-block; margin: 8px 0; word-break: break-all;">
                        ${data.output_dir}
                    </code><br>
                    <div style="text-align: left; font-size: 12px; line-height: 1.65; margin-top: 6px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        🌟 <strong>Cách Import vào Paul To Animation (Hoạt động 100% các khớp & điệu bộ):</strong><br>
                        • <strong>Cách 1 (Import nhân vật vào dự án đang mở):</strong> Trong Paul To Animation, vào mục <em>Characters (Quản lý nhân vật) -> Import</em> và chọn file <strong><code>${baseName}.character.json</code></strong> (hoặc <code>funny_animation_project/config.json</code>) — nhân vật có sẵn toàn bộ bộ phận, tâm xoay Pivot và <strong>${data.funny_presets_count || 19} điệu bộ (Animation List)</strong> đã khóa khớp FK!<br>
                        • <strong>Cách 2 (Mở thành dự án mới):</strong> Dùng <em>Mở Thư Mục Dự Án</em> chọn thư mục <strong><code>funny_animation_project/</code></strong> hoặc dùng <em>Mở Gói (.paulto)</em> chọn file <strong><code>${baseName}_funny_animation.paulto</code></strong>.<br>
                        • <strong>Chuẩn hóa khớp:</strong> <code>${stdPartsText}</code>.<br>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 6px 0;">
                        🎬 <strong>Định dạng kèm theo:</strong> <code>png_sequence/</code>, Sprite Sheet, Ảnh động <code>.gif</code> & Video <code>.mp4</code>.
                    </div>
                `;
            }
        } catch (err) {
            console.error(err);
            if (modSummary) {
                modSummary.innerHTML = `<span style="color: #dc2626; font-weight: 600;">Lỗi khi xuất gói Paul To Animation: ${err.message}</span>`;
            } else {
                alert('Lỗi khi xuất gói Paul To Animation: ' + err.message);
            }
        }
    }

    // Lưu thiết lập dự án SVG (.spsvg)
    function saveSvgProject() {
        if (!svgState.svgDoc) {
            alert('Chưa có dữ liệu để lưu!');
            return;
        }

        const project = {
            format: 'spritesplit_svg_rig_project',
            version: '1.0',
            title: svgState.title,
            filename: svgState.filename,
            viewBox: svgState.viewBox,
            config: svgState.config,
            svgString: svgState.rawSvgString,
            nodes: svgState.nodes.map(n => ({
                id: n.id,
                role: n.role,
                parentId: n.parentId,
                pivotX: n.pivotX,
                pivotY: n.pivotY,
                scale: n.scale,
                testRot: n.testRot,
                visible: n.visible
            }))
        };

        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${svgState.title || 'character'}_rig_setup.spsvg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Mở thiết lập dự án SVG (.spsvg)
    function openSvgProject(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.svgString) {
                    alert('File .spsvg không hợp lệ hoặc thiếu dữ liệu SVG!');
                    return;
                }
                svgState.title = data.title || 'ImportedSvg';
                svgState.filename = data.filename || 'character.svg';
                if (data.config) svgState.config = { ...svgState.config, ...data.config };

                parseAndBuildSvgRig(data.svgString, null, svgState.title);

                // Khôi phục lại các pivot & role đã chỉnh sửa
                if (data.nodes && Array.isArray(data.nodes)) {
                    data.nodes.forEach(saved => {
                        const n = svgState.nodeMap[saved.id];
                        if (n) {
                            if (saved.pivotX !== undefined) n.pivotX = saved.pivotX;
                            if (saved.pivotY !== undefined) n.pivotY = saved.pivotY;
                            if (saved.role) n.role = saved.role;
                            if (saved.parentId !== undefined) n.parentId = saved.parentId;
                            if (saved.scale !== undefined) n.scale = saved.scale;
                            if (saved.testRot !== undefined) n.testRot = saved.testRot;
                            if (saved.visible !== undefined) n.visible = saved.visible;
                        }
                    });
                    renderSvgLayersTree();
                    if (svgState.selectedId) selectSvgNode(svgState.selectedId);
                }

                alert(`Đã nạp thành công thiết lập nhân vật: ${data.title}!`);
            } catch (err) {
                alert('Lỗi đọc file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // Tự động khởi chạy khi trang đã sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSvgStudio);
    } else {
        initSvgStudio();
    }

    // Xuất ra window để các module khác dễ dàng tương tác
    window.svgStudio = {
        loadSvgExample,
        fitSvgCanvas,
        startSvgAnimLoop,
        stopSvgAnimLoop
    };

})();

