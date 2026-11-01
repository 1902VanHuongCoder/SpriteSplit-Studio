// State
let appState = {
    imageWidth: 1024,
    imageHeight: 765,
    imageBytesLoaded: false,
    previewTransparent: null,
    
    // Auto View State
    autoParts: [],
    selectedAutoId: null,
    autoViewMode: 'bbox', // 'bbox' | 'alpha'
    autoZoom: 1,
    autoPanX: 0,
    autoPanY: 0,
    autoIsDragging: false,
    autoDragStartX: 0,
    autoDragStartY: 0,

    // Manual View State
    manualParts: [],
    selectedManualId: null,
    manualZoom: 1,
    manualPanX: 0,
    manualPanY: 0,
    manualIsPanning: false,
    manualPanStartX: 0,
    manualPanStartY: 0,
    
    // Manual Drawing Selection
    isDrawingCrop: false,
    cropStartX: 0,
    cropStartY: 0,
    currentCrop: null, // { x, y, w, h }
    manualPartCounter: 1,

    currentTab: 'auto', // 'auto' | 'manual' | 'inspect'
    lastExportData: null,
    debounceTimer: null,
    customOutputDir: localStorage.getItem('spriteSplit_outputDir') || '',
    defaultOutputDir: '',

    // Inspect View State (Tab 3)
    inspectLayers: [],
    inspectWidth: 0,
    inspectHeight: 0,
    inspectFilename: '',
    inspectZoom: 1,
    inspectPanX: 0,
    inspectPanY: 0,
    inspectSoloId: null,
    inspectBgMode: 'black',
    inspectUndoStack: [],
    inspectRedoStack: [],

    // Animation & Pivot Studio State (Tab 4)
    animLayers: [],
    animImageCache: {},
    animAlphaCanvases: {},
    animWidth: 1024,
    animHeight: 765,
    animFilename: '',
    selectedAnimId: null,
    animStageMode: 'rig', // 'rig' | 'play'
    animIsPlaying: false,
    animCurrentTime: 0,
    animLastFrameTs: 0,
    animRafId: null,
    animZoom: 1,
    animPanX: 0,
    animPanY: 0,
    clickToSetPivot: false,
    testPivotRotation: 0,
    animConfig: {
        preset: 'idle',
        speed: 1.0,
        intensity: 1.0,
        duration: 3.0,
        fps: 24,
        auto_blink: true,
        lip_sync: false,
        head_sway: true,
        head_sway_amp: 6.0,
        blink_interval: 2.8,
        talk_speed: 6.0,
        export_bg: 'dark'
    }
};

// DOM Elements - Top Navigation
const btnNavAuto = document.getElementById('btnNavAuto');
const btnNavManual = document.getElementById('btnNavManual');
const btnNavInspect = document.getElementById('btnNavInspect');
const btnNavAnim = document.getElementById('btnNavAnim');
const autoView = document.getElementById('autoView');
const manualView = document.getElementById('manualView');
const inspectView = document.getElementById('inspectView');
const animView = document.getElementById('animView');

// AUTO VIEW DOM
const mainImage = document.getElementById('mainImage');
const svgOverlay = document.getElementById('svgOverlay');
const canvasContainer = document.getElementById('canvasContainer');
const canvasViewport = document.getElementById('canvasViewport');
const layersList = document.getElementById('layersList');
const partsCountBadge = document.getElementById('partsCountBadge');
const canvasStats = document.getElementById('canvasStats');
const valProcessTime = document.getElementById('valProcessTime');
const sliderThreshold = document.getElementById('sliderThreshold');
const valThreshold = document.getElementById('valThreshold');
const sliderMinArea = document.getElementById('sliderMinArea');
const valMinArea = document.getElementById('valMinArea');
const sliderMergeDist = document.getElementById('sliderMergeDist');
const valMergeDist = document.getElementById('valMergeDist');
const toggleFeather = document.getElementById('toggleFeather');
const checkSelectAll = document.getElementById('checkSelectAll');
const btnModeBbox = document.getElementById('btnModeBbox');
const btnModeAlpha = document.getElementById('btnModeAlpha');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnZoomReset = document.getElementById('btnZoomReset');
const btnExport = document.getElementById('btnExport');

const tabSampleAuto = document.getElementById('tabSampleAuto');
const tabUploadAuto = document.getElementById('tabUploadAuto');
const dropzoneAuto = document.getElementById('dropzoneAuto');
const fileInputAuto = document.getElementById('fileInputAuto');
const infoDimensionsAuto = document.getElementById('infoDimensionsAuto');
const infoFilenameAuto = document.getElementById('infoFilenameAuto');

// MANUAL VIEW DOM
const manualMainImage = document.getElementById('manualMainImage');
const manualSvgOverlay = document.getElementById('manualSvgOverlay');
const manualCanvasContainer = document.getElementById('manualCanvasContainer');
const manualCanvasViewport = document.getElementById('manualCanvasViewport');
const valCropCoords = document.getElementById('valCropCoords');
const valCropSize = document.getElementById('valCropSize');
const manualSelectionBadge = document.getElementById('manualSelectionBadge');
const inputManualPartName = document.getElementById('inputManualPartName');
const btnExtractManual = document.getElementById('btnExtractManual');
const manualPartsCountBadge = document.getElementById('manualPartsCountBadge');
const manualLayersList = document.getElementById('manualLayersList');
const manualEmptyPlaceholder = document.getElementById('manualEmptyPlaceholder');
const btnClearManualParts = document.getElementById('btnClearManualParts');
const valManualTotalCount = document.getElementById('valManualTotalCount');
const btnExportManual = document.getElementById('btnExportManual');
const btnManualZoomIn = document.getElementById('btnManualZoomIn');
const btnManualZoomOut = document.getElementById('btnManualZoomOut');
const btnManualZoomReset = document.getElementById('btnManualZoomReset');
const manualCanvasStats = document.getElementById('manualCanvasStats');

// Modal Elements
const exportModal = document.getElementById('exportModal');
const modalSummary = document.getElementById('modalSummary');
const btnOpenFolder = document.getElementById('btnOpenFolder');
const btnDownloadPsd = document.getElementById('btnDownloadPsd');
const btnDownloadZip = document.getElementById('btnDownloadZip');
const btnCloseModal = document.getElementById('btnCloseModal');

// Output Folder Selector Elements
const inputFolderPathAuto = document.getElementById('inputFolderPathAuto');
const btnBrowseFolderAuto = document.getElementById('btnBrowseFolderAuto');
const btnResetFolderAuto = document.getElementById('btnResetFolderAuto');

const inputFolderPathManual = document.getElementById('inputFolderPathManual');
const btnBrowseFolderManual = document.getElementById('btnBrowseFolderManual');
const btnResetFolderManual = document.getElementById('btnResetFolderManual');

// INSPECT VIEW DOM (Tab 3)
const dropzoneInspect = document.getElementById('dropzoneInspect');
const fileInputInspect = document.getElementById('fileInputInspect');
const infoDimensionsInspect = document.getElementById('infoDimensionsInspect');
const infoFilenameInspect = document.getElementById('infoFilenameInspect');
const inspectStatusBadge = document.getElementById('inspectStatusBadge');

const btnDefringe1px = document.getElementById('btnDefringe1px');
const btnDefringe2px = document.getElementById('btnDefringe2px');
const btnInspectUndo = document.getElementById('btnInspectUndo');
const btnInspectRedo = document.getElementById('btnInspectRedo');
const inspectTargetBadge = document.getElementById('inspectTargetBadge');
const targetLayerBox = document.getElementById('targetLayerBox');
const targetLayerName = document.getElementById('targetLayerName');
const inspectLayersCountBadge = document.getElementById('inspectLayersCountBadge');
const btnInspectShowAll = document.getElementById('btnInspectShowAll');
const btnInspectHideAll = document.getElementById('btnInspectHideAll');
const inspectLayersList = document.getElementById('inspectLayersList');
const inspectEmptyPlaceholder = document.getElementById('inspectEmptyPlaceholder');

const inspectCanvasStats = document.getElementById('inspectCanvasStats');
const inspectCanvasViewport = document.getElementById('inspectCanvasViewport');
const inspectCanvasContainer = document.getElementById('inspectCanvasContainer');
const btnInspectZoomIn = document.getElementById('btnInspectZoomIn');
const btnInspectZoomOut = document.getElementById('btnInspectZoomOut');
const btnInspectZoomReset = document.getElementById('btnInspectZoomReset');

const valInspectVisibleCount = document.getElementById('valInspectVisibleCount');
const inputFolderPathInspect = document.getElementById('inputFolderPathInspect');
const btnBrowseFolderInspect = document.getElementById('btnBrowseFolderInspect');
const btnResetFolderInspect = document.getElementById('btnResetFolderInspect');
const btnExportInspect = document.getElementById('btnExportInspect');

// ==========================================
// Initialization
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // Không tự động load sample.png - để người dùng chủ động tải ảnh
    canvasStats.textContent = 'Sẵn sàng - Vui lòng tải ảnh lên';
    manualCanvasStats.textContent = 'Chưa có ảnh - Vui lòng chọn ảnh';
    setupTopNav();
    setupAutoViewEvents();
    setupManualViewEvents();
    setupInspectViewEvents();
    setupAnimViewEvents();
    initFolderSelection();

    window.addEventListener('resize', () => {
        if (appState.currentTab === 'auto') {
            fitAutoCanvas();
        } else if (appState.currentTab === 'manual') {
            fitManualCanvas();
        } else if (appState.currentTab === 'inspect') {
            fitInspectCanvas();
        } else if (appState.currentTab === 'anim') {
            fitAnimCanvas();
        }
    });
});

function setupTopNav() {
    btnNavAuto.addEventListener('click', () => {
        appState.currentTab = 'auto';
        stopAnimLoop();
        btnNavAuto.classList.add('active');
        btnNavManual.classList.remove('active');
        btnNavInspect.classList.remove('active');
        if (btnNavAnim) btnNavAnim.classList.remove('active');
        autoView.style.display = 'flex';
        manualView.style.display = 'none';
        inspectView.style.display = 'none';
        if (animView) animView.style.display = 'none';
        
        requestAnimationFrame(() => {
            fitAutoCanvas();
        });
    });

    btnNavManual.addEventListener('click', () => {
        appState.currentTab = 'manual';
        stopAnimLoop();
        btnNavManual.classList.add('active');
        btnNavAuto.classList.remove('active');
        btnNavInspect.classList.remove('active');
        if (btnNavAnim) btnNavAnim.classList.remove('active');
        autoView.style.display = 'none';
        manualView.style.display = 'flex';
        inspectView.style.display = 'none';
        if (animView) animView.style.display = 'none';
        syncManualViewImage();
        
        requestAnimationFrame(() => {
            fitManualCanvas();
        });
    });

    btnNavInspect.addEventListener('click', () => {
        appState.currentTab = 'inspect';
        stopAnimLoop();
        btnNavInspect.classList.add('active');
        btnNavAuto.classList.remove('active');
        btnNavManual.classList.remove('active');
        if (btnNavAnim) btnNavAnim.classList.remove('active');
        autoView.style.display = 'none';
        manualView.style.display = 'none';
        inspectView.style.display = 'flex';
        if (animView) animView.style.display = 'none';
        
        requestAnimationFrame(() => {
            fitInspectCanvas();
            setTimeout(fitInspectCanvas, 60);
        });
    });

    if (btnNavAnim) {
        btnNavAnim.addEventListener('click', () => {
            appState.currentTab = 'anim';
            btnNavAnim.classList.add('active');
            btnNavAuto.classList.remove('active');
            btnNavManual.classList.remove('active');
            btnNavInspect.classList.remove('active');
            autoView.style.display = 'none';
            manualView.style.display = 'none';
            inspectView.style.display = 'none';
            animView.style.display = 'flex';

            // Nếu Tab 4 chưa có dữ liệu mà Tab 3 đã tải PSD, tự động nạp sang để tiện làm việc ngay
            if (appState.animLayers.length === 0 && appState.inspectLayers.length > 0) {
                importPsdFromTab3ToAnim();
            }

            requestAnimationFrame(() => {
                fitAnimCanvas();
                renderAnimStageFrame();
                setTimeout(() => {
                    fitAnimCanvas();
                    renderAnimStageFrame();
                }, 60);
            });
        });
    }
}

function loadSampleImage() {
    canvasStats.textContent = 'Đang tải ảnh mẫu...';
    fetch('/api/load-sample')
        .then(res => res.json())
        .then(data => {
            handleDataReceived(data);
        })
        .catch(err => {
            console.error(err);
            canvasStats.textContent = 'Lỗi tải ảnh mẫu';
        });
}

function handleDataReceived(data) {
    appState.imageWidth = data.width;
    appState.imageHeight = data.height;
    appState.autoParts = data.parts;
    appState.previewTransparent = data.preview_transparent;
    appState.imageBytesLoaded = true;

    infoDimensionsAuto.textContent = `${data.width} x ${data.height} px`;
    if (data.filename) infoFilenameAuto.textContent = data.filename;
    if (data.process_time) valProcessTime.textContent = `${data.process_time}s`;
    
    partsCountBadge.textContent = `${data.parts.length} bộ phận`;
    canvasStats.textContent = `Đã nhận diện: ${data.parts.length} bộ phận • ${data.width}x${data.height} px`;

    // Thiết lập kích thước Canvas Auto
    canvasContainer.style.width = `${data.width}px`;
    canvasContainer.style.height = `${data.height}px`;
    mainImage.style.width = `${data.width}px`;
    mainImage.style.height = `${data.height}px`;
    svgOverlay.style.width = `${data.width}px`;
    svgOverlay.style.height = `${data.height}px`;
    svgOverlay.setAttribute('viewBox', `0 0 ${data.width} ${data.height}`);
    svgOverlay.setAttribute('preserveAspectRatio', 'none');

    // Thiết lập kích thước Canvas Manual
    manualCanvasContainer.style.width = `${data.width}px`;
    manualCanvasContainer.style.height = `${data.height}px`;
    manualMainImage.style.width = `${data.width}px`;
    manualMainImage.style.height = `${data.height}px`;
    manualSvgOverlay.style.width = `${data.width}px`;
    manualSvgOverlay.style.height = `${data.height}px`;
    manualSvgOverlay.setAttribute('viewBox', `0 0 ${data.width} ${data.height}`);
    manualSvgOverlay.setAttribute('preserveAspectRatio', 'none');

    updateDisplayImageAuto();
    syncManualViewImage();
    renderAutoLayersList();
    renderAutoSvgOverlay();
    renderManualLayersList();
    renderManualSvgOverlay();

    requestAnimationFrame(() => {
        if (appState.currentTab === 'auto') {
            fitAutoCanvas();
        } else {
            fitManualCanvas();
        }
    });
}

function syncManualViewImage() {
    if (appState.previewTransparent) {
        manualMainImage.src = appState.previewTransparent;
    }
}

// ==========================================
// AUTO VIEW LOGIC
// ==========================================
function updateDisplayImageAuto() {
    if (appState.autoViewMode === 'alpha' && appState.previewTransparent) {
        mainImage.src = appState.previewTransparent;
        svgOverlay.style.display = 'none';
    } else {
        if (appState.previewTransparent) {
            mainImage.src = appState.previewTransparent;
        }
        svgOverlay.style.display = 'block';
    }
}

function renderAutoLayersList() {
    layersList.innerHTML = '';
    
    appState.autoParts.forEach(part => {
        const item = document.createElement('div');
        item.className = `layer-item ${part.id === appState.selectedAutoId ? 'active' : ''}`;
        item.dataset.id = part.id;

        item.innerHTML = `
            <input type="checkbox" class="part-check" ${part.enabled ? 'checked' : ''} />
            <div class="layer-thumb-box">
                <img src="${part.thumbnail}" alt="${part.name}" />
            </div>
            <input type="text" class="layer-name-input" value="${part.name}" />
            <span class="layer-size-badge">${part.w}x${part.h}</span>
            <button type="button" class="btn-delete-part" title="Xóa bộ phận này">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;

        const btnDel = item.querySelector('.btn-delete-part');
        if (btnDel) {
            btnDel.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = appState.autoParts.findIndex(p => p.id === part.id);
                if (idx !== -1) {
                    appState.autoParts.splice(idx, 1);
                    if (partsCountBadge) partsCountBadge.textContent = `${appState.autoParts.length} bộ phận`;
                    if (appState.selectedAutoId === part.id) appState.selectedAutoId = null;
                    renderAutoLayersList();
                    renderAutoSvgOverlay();
                }
            });
        }

        const chk = item.querySelector('.part-check');
        chk.addEventListener('change', (e) => {
            part.enabled = e.target.checked;
            renderAutoSvgOverlay();
        });

        const nameInput = item.querySelector('.layer-name-input');
        nameInput.addEventListener('input', (e) => {
            part.name = e.target.value;
        });

        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                selectAutoPart(part.id);
            }
        });

        layersList.appendChild(item);
    });
}

function renderAutoSvgOverlay() {
    svgOverlay.innerHTML = '';

    appState.autoParts.forEach(part => {
        if (!part.enabled) return;

        const isSelected = part.id === appState.selectedAutoId;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.dataset.id = part.id;
        g.style.cursor = 'pointer';

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', part.x);
        rect.setAttribute('y', part.y);
        rect.setAttribute('width', part.w);
        rect.setAttribute('height', part.h);
        rect.setAttribute('class', `bbox-rect ${isSelected ? 'selected' : ''}`);

        const badgeW = 22;
        const badgeH = 14;
        const badgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        badgeRect.setAttribute('x', part.x);
        badgeRect.setAttribute('y', Math.max(0, part.y - 15));
        badgeRect.setAttribute('width', badgeW);
        badgeRect.setAttribute('height', badgeH);
        badgeRect.setAttribute('class', 'bbox-badge');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', part.x + badgeW / 2);
        text.setAttribute('y', Math.max(0, part.y - 15) + 10.5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'bbox-text');
        text.textContent = part.id;

        g.appendChild(rect);
        g.appendChild(badgeRect);
        g.appendChild(text);

        g.addEventListener('click', (e) => {
            e.stopPropagation();
            selectAutoPart(part.id);
        });

        svgOverlay.appendChild(g);
    });
}

function selectAutoPart(id) {
    appState.selectedAutoId = id;

    document.querySelectorAll('#layersList .layer-item').forEach(el => {
        if (parseInt(el.dataset.id) === id) {
            el.classList.add('active');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            el.classList.remove('active');
        }
    });

    document.querySelectorAll('#svgOverlay .bbox-rect').forEach(el => {
        el.classList.remove('selected');
    });
    const selectedG = document.querySelector(`#svgOverlay g[data-id="${id}"] .bbox-rect`);
    if (selectedG) {
        selectedG.classList.add('selected');
    }
}

function setupAutoViewEvents() {
    btnModeBbox.addEventListener('click', () => {
        appState.autoViewMode = 'bbox';
        btnModeBbox.classList.add('active');
        btnModeAlpha.classList.remove('active');
        updateDisplayImageAuto();
    });

    btnModeAlpha.addEventListener('click', () => {
        appState.autoViewMode = 'alpha';
        btnModeAlpha.classList.add('active');
        btnModeBbox.classList.remove('active');
        updateDisplayImageAuto();
    });

    sliderThreshold.addEventListener('input', (e) => {
        valThreshold.textContent = e.target.value;
        triggerAutoReprocess();
    });

    sliderMinArea.addEventListener('input', (e) => {
        valMinArea.textContent = `${e.target.value} px`;
        triggerAutoReprocess();
    });

    sliderMergeDist.addEventListener('input', (e) => {
        valMergeDist.textContent = `${e.target.value} px`;
        triggerAutoReprocess();
    });

    toggleFeather.addEventListener('change', () => {
        triggerAutoReprocess();
    });

    checkSelectAll.addEventListener('change', (e) => {
        const checked = e.target.checked;
        appState.autoParts.forEach(p => p.enabled = checked);
        renderAutoLayersList();
        renderAutoSvgOverlay();
    });

    if (tabSampleAuto) {
        tabSampleAuto.addEventListener('click', () => {
            tabSampleAuto.classList.add('active');
            if (tabUploadAuto) tabUploadAuto.classList.remove('active');
            dropzoneAuto.style.display = 'none';
            document.getElementById('sourceTypeBadgeAuto').textContent = 'Mẫu có sẵn';
            loadSampleImage();
        });
    }

    if (tabUploadAuto) {
        tabUploadAuto.addEventListener('click', () => {
            tabUploadAuto.classList.add('active');
            if (tabSampleAuto) tabSampleAuto.classList.remove('active');
            dropzoneAuto.style.display = 'block';
            document.getElementById('sourceTypeBadgeAuto').textContent = 'Ảnh tùy chọn';
        });
    }

    
    // Clear / Reset Auto Workspace
    const btnClearAuto = document.getElementById('btnClearAutoWorkspace');
    if (btnClearAuto) {
        btnClearAuto.addEventListener('click', () => {
            appState.imageWidth = 0;
            appState.imageHeight = 0;
            appState.autoParts = [];
            appState.previewTransparent = null;
            appState.imageBytesLoaded = false;
            appState.selectedAutoId = null;
            
            if (infoDimensionsAuto) infoDimensionsAuto.textContent = '0 x 0 px';
            if (infoFilenameAuto) infoFilenameAuto.textContent = 'Chưa chọn file';
            if (valProcessTime) valProcessTime.textContent = '0.00s';
            if (partsCountBadge) partsCountBadge.textContent = '0 bộ phận';
            if (canvasStats) canvasStats.textContent = 'Kéo thả hoặc tải ảnh nhân vật để bắt đầu quét';
            
            mainImage.src = '';
            mainImage.style.display = 'none';
            svgOverlay.innerHTML = '';
            if (layersList) {
                layersList.innerHTML = '<div style="text-align: center; padding: 30px 10px; color: var(--text-muted); font-size: 12px;">Chưa có bộ phận nào. Hãy tải ảnh lên để bắt đầu quét!</div>';
            }
            if (fileInputAuto) fileInputAuto.value = '';
            if (dropzoneAuto) dropzoneAuto.style.display = 'block';
        });
    }

    dropzoneAuto.addEventListener('click', () => fileInputAuto.click());
    fileInputAuto.addEventListener('change', (e) => {
        if (e.target.files.length > 0) uploadFile(e.target.files[0]);
    });

    btnExport.addEventListener('click', () => handleExportParts(appState.autoParts, 'auto_character'));

    btnZoomIn.addEventListener('click', () => zoomAtViewportCenter(1.25, canvasViewport, () => appState.autoZoom, z => appState.autoZoom = z, () => ({ x: appState.autoPanX, y: appState.autoPanY }), (px, py) => { appState.autoPanX = px; appState.autoPanY = py; }, updateAutoTransform));
    btnZoomOut.addEventListener('click', () => zoomAtViewportCenter(0.8, canvasViewport, () => appState.autoZoom, z => appState.autoZoom = z, () => ({ x: appState.autoPanX, y: appState.autoPanY }), (px, py) => { appState.autoPanX = px; appState.autoPanY = py; }, updateAutoTransform));
    btnZoomReset.addEventListener('click', () => fitAutoCanvas());

    canvasViewport.addEventListener('wheel', (e) => {
        zoomAtCursor(e, canvasViewport, () => appState.autoZoom, z => appState.autoZoom = z, () => ({ x: appState.autoPanX, y: appState.autoPanY }), (px, py) => { appState.autoPanX = px; appState.autoPanY = py; }, updateAutoTransform);
    }, { passive: false });

    canvasViewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('.bbox-rect') || e.target.closest('.floating-zoom')) return;
        appState.autoIsDragging = true;
        appState.autoDragStartX = e.clientX - appState.autoPanX;
        appState.autoDragStartY = e.clientY - appState.autoPanY;
        canvasViewport.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!appState.autoIsDragging) return;
        appState.autoPanX = e.clientX - appState.autoDragStartX;
        appState.autoPanY = e.clientY - appState.autoDragStartY;
        updateAutoTransform();
    });

    window.addEventListener('mouseup', () => {
        if (appState.autoIsDragging) {
            appState.autoIsDragging = false;
            canvasViewport.style.cursor = 'default';
        }
    });
}

function fitAutoCanvas() {
    fitCanvasToViewport(canvasViewport, (z, px, py) => {
        appState.autoZoom = z;
        appState.autoPanX = px;
        appState.autoPanY = py;
        updateAutoTransform();
    });
}

function updateAutoTransform() {
    canvasContainer.style.transform = `translate(${appState.autoPanX}px, ${appState.autoPanY}px) scale(${appState.autoZoom})`;
}

function triggerAutoReprocess() {
    clearTimeout(appState.debounceTimer);
    document.getElementById('reprocessIndicator').textContent = 'Đang xử lý...';
    
    appState.debounceTimer = setTimeout(() => {
        fetch('/api/reprocess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bg_threshold: parseInt(sliderThreshold.value),
                min_area: parseInt(sliderMinArea.value),
                merge_distance: parseInt(sliderMergeDist.value),
                feather_edges: toggleFeather.checked
            })
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById('reprocessIndicator').textContent = 'Đã cập nhật';
            handleDataReceived(data);
        })
        .catch(err => {
            console.error(err);
            document.getElementById('reprocessIndicator').textContent = 'Lỗi xử lý';
        });
    }, 250);
}

function uploadFile(file) {
    canvasStats.textContent = `Đang tải lên ${file.name}...`;
    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        handleDataReceived(data);
    })
    .catch(err => {
        console.error(err);
        canvasStats.textContent = 'Lỗi tải ảnh lên!';
    });
}

// =========================================================================
// MANUAL CROP & SEPARATION LOGIC
// =========================================================================

function setupManualViewEvents() {
    const btnUploadManualImage = document.getElementById('btnUploadManualImage');
    const fileInputManual = document.getElementById('fileInputManual');
    if (btnUploadManualImage && fileInputManual) {
        btnUploadManualImage.addEventListener('click', () => fileInputManual.click());
        fileInputManual.addEventListener('change', (e) => {
            if (e.target.files.length > 0) uploadFile(e.target.files[0]);
        });
    }
    // Quick Name Suggestion Pills
    document.querySelectorAll('.quick-name-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            inputManualPartName.value = pill.dataset.name;
        });
    });

    // Clear All Manual Parts
    btnClearManualParts.addEventListener('click', () => {
        if (appState.manualParts.length === 0) return;
        if (confirm('Bạn có chắc muốn xóa tất cả các bộ phận đã khoanh thủ công?')) {
            appState.manualParts = [];
            renderManualLayersList();
            renderManualSvgOverlay();
        }
    });

    // Extract Button Click
    btnExtractManual.addEventListener('click', handleExtractManualPart);

    // Export Manual Button
    btnExportManual.addEventListener('click', () => {
        if (appState.manualParts.length === 0) {
            alert('Chưa có bộ phận nào trong danh sách khoanh vùng thủ công! Hãy khoanh vùng trên ảnh trước.');
            return;
        }
        handleExportParts(appState.manualParts, 'manual_character');
    });

    // Zoom Controls
    btnManualZoomIn.addEventListener('click', () => zoomAtViewportCenter(1.25, manualCanvasViewport, () => appState.manualZoom, z => appState.manualZoom = z, () => ({ x: appState.manualPanX, y: appState.manualPanY }), (px, py) => { appState.manualPanX = px; appState.manualPanY = py; }, updateManualTransform));
    btnManualZoomOut.addEventListener('click', () => zoomAtViewportCenter(0.8, manualCanvasViewport, () => appState.manualZoom, z => appState.manualZoom = z, () => ({ x: appState.manualPanX, y: appState.manualPanY }), (px, py) => { appState.manualPanX = px; appState.manualPanY = py; }, updateManualTransform));
    btnManualZoomReset.addEventListener('click', () => fitManualCanvas());

    manualCanvasViewport.addEventListener('wheel', (e) => {
        zoomAtCursor(e, manualCanvasViewport, () => appState.manualZoom, z => appState.manualZoom = z, () => ({ x: appState.manualPanX, y: appState.manualPanY }), (px, py) => { appState.manualPanX = px; appState.manualPanY = py; }, updateManualTransform);
    }, { passive: false });

    // Ngăn chặn menu chuột phải trên canvas để cho phép pan mượt bằng chuột phải
    manualCanvasViewport.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Mouse Dragging to Draw Selection Box on Canvas
    setupManualCanvasDrawing();
}

function fitManualCanvas() {
    fitCanvasToViewport(manualCanvasViewport, (z, px, py) => {
        appState.manualZoom = z;
        appState.manualPanX = px;
        appState.manualPanY = py;
        updateManualTransform();
    });
}

function updateManualTransform() {
    manualCanvasContainer.style.transform = `translate(${appState.manualPanX}px, ${appState.manualPanY}px) scale(${appState.manualZoom})`;
}

function setupManualCanvasDrawing() {
    manualCanvasViewport.addEventListener('mousedown', (e) => {
        // Chuột phải (2) hoặc chuột giữa (1) hoặc giữ Space / Shift / Ctrl: Chuyển sang Pan (kéo khung nhìn)
        if (e.button === 1 || e.button === 2 || e.shiftKey || e.ctrlKey || e.altKey) {
            e.preventDefault();
            appState.manualIsPanning = true;
            appState.manualPanStartX = e.clientX - appState.manualPanX;
            appState.manualPanStartY = e.clientY - appState.manualPanY;
            manualCanvasViewport.style.cursor = 'grabbing';
            return;
        }

        // Bỏ qua nếu click vào nút zoom nổi
        if (e.target.closest('.floating-zoom')) return;

        // Chỉ vẽ khung với chuột trái (button === 0)
        if (e.button !== 0) return;

        // Bắt đầu vẽ khung chọn - tọa độ chuẩn xác tuyệt đối đã được clamp [0, imageWidth] và [0, imageHeight]
        const pt = getCanvasImageCoords(e, manualCanvasContainer);
        appState.isDrawingCrop = true;
        appState.cropStartX = pt.x;
        appState.cropStartY = pt.y;
        appState.currentCrop = { x: pt.x, y: pt.y, w: 0, h: 0 };

        valCropCoords.textContent = `X: ${pt.x}, Y: ${pt.y}`;
        valCropSize.textContent = `0 x 0 px`;
        manualSelectionBadge.textContent = 'Đang kéo chọn...';
        manualSelectionBadge.style.color = '#f97316';

        renderManualSvgOverlay();
    });

    window.addEventListener('mousemove', (e) => {
        // Xử lý Pan
        if (appState.manualIsPanning) {
            appState.manualPanX = e.clientX - appState.manualPanStartX;
            appState.manualPanY = e.clientY - appState.manualPanStartY;
            updateManualTransform();
            return;
        }

        // Xử lý Vẽ Khung
        if (!appState.isDrawingCrop) return;

        const pt = getCanvasImageCoords(e, manualCanvasContainer);
        const curX = pt.x;
        const curY = pt.y;

        const rx = Math.min(appState.cropStartX, curX);
        const ry = Math.min(appState.cropStartY, curY);
        const rw = Math.abs(curX - appState.cropStartX);
        const rh = Math.abs(curY - appState.cropStartY);

        appState.currentCrop = { x: rx, y: ry, w: rw, h: rh };

        valCropCoords.textContent = `X: ${rx}, Y: ${ry}`;
        valCropSize.textContent = `${rw} x ${rh} px`;

        if (rw >= 10 && rh >= 10) {
            btnExtractManual.disabled = false;
            manualSelectionBadge.textContent = 'Đã chọn vùng';
            manualSelectionBadge.style.color = '#ea580c';
        } else {
            btnExtractManual.disabled = true;
            manualSelectionBadge.textContent = 'Vùng quá nhỏ';
            manualSelectionBadge.style.color = 'var(--text-muted)';
        }

        renderManualSvgOverlay();
    });

    window.addEventListener('mouseup', () => {
        if (appState.manualIsPanning) {
            appState.manualIsPanning = false;
            manualCanvasViewport.style.cursor = 'crosshair';
        }
        if (appState.isDrawingCrop) {
            appState.isDrawingCrop = false;
            if (appState.currentCrop && appState.currentCrop.w >= 10 && appState.currentCrop.h >= 10) {
                btnExtractManual.disabled = false;
                manualSelectionBadge.textContent = 'Đã chọn vùng';
                manualSelectionBadge.style.color = '#ea580c';
            }
        }
    });
}

function getCanvasImageCoords(e, container) {
    const rect = container.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0 || !appState.imageWidth || !appState.imageHeight) {
        return { x: 0, y: 0 };
    }
    const scaleX = rect.width / appState.imageWidth;
    const scaleY = rect.height / appState.imageHeight;
    let x = Math.round((e.clientX - rect.left) / scaleX);
    let y = Math.round((e.clientY - rect.top) / scaleY);
    // Luôn luôn giới hạn tọa độ trong phạm vi ảnh [0, imageWidth] và [0, imageHeight]
    x = Math.max(0, Math.min(x, appState.imageWidth));
    y = Math.max(0, Math.min(y, appState.imageHeight));
    return { x, y };
}

function handleExtractManualPart() {
    if (!appState.currentCrop || appState.currentCrop.w < 10 || appState.currentCrop.h < 10) return;

    const originalBtnText = btnExtractManual.innerHTML;
    btnExtractManual.innerHTML = `
        <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tách nền...
    `;
    btnExtractManual.disabled = true;

    const partName = inputManualPartName.value.trim() || `Bộ phận ${appState.manualPartCounter}`;

    fetch('/api/extract-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            x: appState.currentCrop.x,
            y: appState.currentCrop.y,
            w: appState.currentCrop.w,
            h: appState.currentCrop.h,
            name: partName,
            bg_threshold: 240,
            feather_edges: true
        })
    })
    .then(res => res.json())
    .then(data => {
        btnExtractManual.innerHTML = originalBtnText;
        btnExtractManual.disabled = true;

        const newPart = {
            id: appState.manualPartCounter++,
            name: data.name,
            x: data.x,
            y: data.y,
            w: data.w,
            h: data.h,
            area: data.area,
            thumbnail: data.thumbnail,
            enabled: true
        };

        appState.manualParts.push(newPart);
        appState.currentCrop = null;
        manualSelectionBadge.textContent = 'Đã thêm vào danh sách';
        manualSelectionBadge.style.color = '#10b981';

        renderManualLayersList();
        renderManualSvgOverlay();
        suggestNextPartName(partName);
    })
    .catch(err => {
        console.error(err);
        btnExtractManual.innerHTML = originalBtnText;
        btnExtractManual.disabled = false;
        alert('Có lỗi xảy ra khi tách bộ phận!');
    });
}

function suggestNextPartName(current) {
    const sequence = [
        "Đầu (Head)", "Thân áo (Torso)", "Tay trái (Left Arm)", 
        "Tay phải (Right Arm)", "Chân trái (Left Leg)", "Chân phải (Right Leg)", 
        "Mắt (Eyes)", "Miệng (Mouth)"
    ];
    const idx = sequence.indexOf(current);
    if (idx !== -1 && idx + 1 < sequence.length) {
        inputManualPartName.value = sequence[idx + 1];
    } else {
        inputManualPartName.value = `Bộ phận ${appState.manualPartCounter}`;
    }
}

function renderManualLayersList() {
    manualLayersList.innerHTML = '';
    const total = appState.manualParts.length;

    manualPartsCountBadge.textContent = `${total} bộ phận`;
    valManualTotalCount.textContent = `${total} bộ phận`;

    if (total === 0) {
        manualLayersList.innerHTML = `
            <div id="manualEmptyPlaceholder" style="text-align: center; padding: 30px 10px; color: var(--text-muted); font-size: 12px;">
                Chưa có bộ phận nào.<br>Hãy khoanh vùng trên ảnh để thêm vào danh sách!
            </div>
        `;
        return;
    }

    appState.manualParts.forEach((part, index) => {
        const item = document.createElement('div');
        item.className = `layer-item ${part.id === appState.selectedManualId ? 'active' : ''}`;
        item.dataset.id = part.id;

        item.innerHTML = `
            <input type="checkbox" class="part-check" ${part.enabled ? 'checked' : ''} />
            <div class="layer-thumb-box">
                <img src="${part.thumbnail}" alt="${part.name}" />
            </div>
            <input type="text" class="layer-name-input" value="${part.name}" />
            <span class="layer-size-badge">${part.w}x${part.h}</span>
            <button class="btn-delete-part" title="Xóa bộ phận này">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;

        const chk = item.querySelector('.part-check');
        chk.addEventListener('change', (e) => {
            part.enabled = e.target.checked;
            renderManualSvgOverlay();
        });

        const nameInput = item.querySelector('.layer-name-input');
        nameInput.addEventListener('input', (e) => {
            part.name = e.target.value;
            renderManualSvgOverlay();
        });

        const btnDelete = item.querySelector('.btn-delete-part');
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            appState.manualParts.splice(index, 1);
            renderManualLayersList();
            renderManualSvgOverlay();
        });

        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT' && !e.target.closest('.btn-delete-part')) {
                selectManualPart(part.id);
            }
        });

        manualLayersList.appendChild(item);
    });
}

function selectManualPart(id) {
    appState.selectedManualId = id;
    document.querySelectorAll('#manualLayersList .layer-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.id) === id);
    });
    renderManualSvgOverlay();
}

function renderManualSvgOverlay() {
    manualSvgOverlay.innerHTML = '';

    // 1. Vẽ các bộ phận đã được tách trước đó
    appState.manualParts.forEach(part => {
        if (!part.enabled) return;

        const isSelected = part.id === appState.selectedManualId;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.dataset.id = part.id;
        g.style.cursor = 'pointer';

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', part.x);
        rect.setAttribute('y', part.y);
        rect.setAttribute('width', part.w);
        rect.setAttribute('height', part.h);
        rect.setAttribute('class', `manual-part-rect ${isSelected ? 'selected' : ''}`);

        // Badge tên bộ phận
        const labelText = part.name;
        const badgeW = Math.max(28, labelText.length * 6.5 + 10);
        const badgeH = 16;
        
        const badgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        badgeRect.setAttribute('x', part.x);
        badgeRect.setAttribute('y', Math.max(0, part.y - 18));
        badgeRect.setAttribute('width', badgeW);
        badgeRect.setAttribute('height', badgeH);
        badgeRect.setAttribute('fill', isSelected ? '#ea580c' : '#10b981');
        badgeRect.setAttribute('rx', '3');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', part.x + badgeW / 2);
        text.setAttribute('y', Math.max(0, part.y - 18) + 11.5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'bbox-text');
        text.setAttribute('font-size', '9.5px');
        text.textContent = labelText;

        g.appendChild(rect);
        g.appendChild(badgeRect);
        g.appendChild(text);

        g.addEventListener('click', (e) => {
            e.stopPropagation();
            selectManualPart(part.id);
        });

        manualSvgOverlay.appendChild(g);
    });

    // 2. Vẽ khung chữ nhật đang vẽ dở (Active Crop Rectangle)
    if (appState.currentCrop && appState.currentCrop.w > 0 && appState.currentCrop.h > 0) {
        const c = appState.currentCrop;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.style.pointerEvents = 'none';

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', c.x);
        rect.setAttribute('y', c.y);
        rect.setAttribute('width', c.w);
        rect.setAttribute('height', c.h);
        rect.setAttribute('class', 'crop-drawing-rect');

        // Tag kích thước nổi
        const sizeTagW = 80;
        const sizeTagH = 18;
        const tagRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tagRect.setAttribute('x', c.x);
        tagRect.setAttribute('y', Math.max(0, c.y - 20));
        tagRect.setAttribute('width', sizeTagW);
        tagRect.setAttribute('height', sizeTagH);
        tagRect.setAttribute('fill', '#f97316');
        tagRect.setAttribute('rx', '4');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', c.x + sizeTagW / 2);
        text.setAttribute('y', Math.max(0, c.y - 20) + 12.5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'bbox-text');
        text.setAttribute('font-size', '10px');
        text.textContent = `${c.w} × ${c.h}`;

        g.appendChild(rect);
        g.appendChild(tagRect);
        g.appendChild(text);

        manualSvgOverlay.appendChild(g);
    }
}

// ==========================================
// EXPORT HANDLING (Common)
// ==========================================
async function handleExportParts(partsList, baseName = 'character_parts') {
    const enabledParts = partsList.filter(p => p.enabled !== false);
    if (enabledParts.length === 0) {
        alert('Chưa có bộ phận nào được chọn để xuất! Vui lòng chọn ít nhất 1 bộ phận.');
        return;
    }

    // 1. Luôn mở hộp thoại chọn thư mục Windows để người dùng chọn nơi lưu file theo ý muốn
    let targetFolder = appState.customOutputDir;

    try {
        const res = await fetch('/api/select-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_path: targetFolder || appState.defaultOutputDir || '',
                title: 'Chọn thư mục trên máy tính để lưu file xuất PNG & PSD'
            })
        });
        const folderData = await res.json();
        
        // Nếu người dùng hủy hộp thoại (nhấn Cancel hoặc Esc):
        if (!folderData.folder) {
            // Hủy thao tác xuất file, không xuất vào thư mục mặc định ngoài ý muốn
            return;
        }

        targetFolder = folderData.folder;
        appState.customOutputDir = targetFolder;
        localStorage.setItem('spriteSplit_outputDir', targetFolder);
        syncOutputFolderDisplays();
    } catch (err) {
        console.warn('Không thể mở hộp thoại chọn thư mục:', err);
    }

    // 2. Hiển thị modal tiến trình
    exportModal.classList.add('show');
    modalSummary.innerHTML = `
        Đang xuất <strong>${enabledParts.length} bộ phận</strong> vào thư mục:<br>
        <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 11.5px; display: inline-block; margin: 6px 0; word-break: break-all;">
            ${targetFolder}
        </code><br>
        Vui lòng đợi trong giây lát...
    `;

    // 3. Gửi yêu cầu xuất file vào đúng thư mục người dùng đã chọn
    const payload = {
        parts: enabledParts,
        base_name: baseName,
        bg_threshold: 240,
        feather_edges: true,
        output_dir: targetFolder
    };

    fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        appState.lastExportData = data;
        modalSummary.innerHTML = `
            Đã xuất thành công <strong>${data.total_parts} bộ phận</strong> vào thư mục máy tính của bạn:<br>
            <code style="background: #ecfdf5; color: #047857; font-weight: 600; padding: 6px 10px; border-radius: 6px; font-size: 12px; display: inline-block; margin: 8px 0; word-break: break-all;">
                ${data.output_dir}
            </code><br>
            • File PSD: <strong>${data.total_parts} Layers</strong> hoàn chỉnh không bị che bởi raster mask, mở trực tiếp trên Photopea / Photoshop.<br>
            • Thư mục <code>png_parts/</code> chứa đầy đủ từng file ảnh PNG trong suốt.
        `;
    })
    .catch(err => {
        console.error(err);
        alert('Có lỗi xảy ra trong quá trình xuất file!');
    });
}

// ==========================================
// OUTPUT FOLDER SELECTION LOGIC
// ==========================================
function initFolderSelection() {
    fetch('/api/default-output-dir')
        .then(res => res.json())
        .then(data => {
            appState.defaultOutputDir = data.default_dir || '';
            syncOutputFolderDisplays();
        })
        .catch(() => {
            syncOutputFolderDisplays();
        });

    const btnBrowseFolderAnim = document.getElementById('btnBrowseFolderAnim');
    const btnResetFolderAnim = document.getElementById('btnResetFolderAnim');

    [btnBrowseFolderAuto, btnBrowseFolderManual, btnBrowseFolderInspect, btnBrowseFolderAnim].forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', handleChooseFolder);
    });

    [btnResetFolderAuto, btnResetFolderManual, btnResetFolderInspect, btnResetFolderAnim].forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            appState.customOutputDir = '';
            localStorage.removeItem('spriteSplit_outputDir');
            syncOutputFolderDisplays();
        });
    });
}

function handleChooseFolder() {
    fetch('/api/select-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_path: appState.customOutputDir || appState.defaultOutputDir })
    })
    .then(res => res.json())
    .then(data => {
        if (data.folder) {
            appState.customOutputDir = data.folder;
            localStorage.setItem('spriteSplit_outputDir', data.folder);
            syncOutputFolderDisplays();
        }
    })
    .catch(err => {
        console.error('Error selecting folder:', err);
    });
}

function syncOutputFolderDisplays() {
    const displayPath = appState.customOutputDir || appState.defaultOutputDir || 'output/';
    const isCustom = !!appState.customOutputDir;

    const inputFolderPathAnim = document.getElementById('inputFolderPathAnim');
    [inputFolderPathAuto, inputFolderPathManual, inputFolderPathInspect, inputFolderPathAnim].forEach(input => {
        if (!input) return;
        input.value = displayPath;
        input.title = isCustom ? `Thư mục tùy chọn: ${displayPath}` : `Thư mục mặc định: ${displayPath}`;
        if (isCustom) {
            input.style.color = '#ea580c';
            input.style.fontWeight = '600';
        } else {
            input.style.color = 'var(--text-secondary)';
            input.style.fontWeight = 'normal';
        }
    });

    [btnResetFolderAuto, btnResetFolderManual].forEach(btn => {
        if (!btn) return;
        btn.style.display = isCustom ? 'inline-block' : 'none';
    });
}

// ==========================================
// VIEWPORT & CANVAS MATH UTILS
// ==========================================

// Căn giữa Canvas trong Viewport và tính toán tỷ lệ zoom phù hợp nhất
function fitCanvasToViewport(viewportEl, callback) {
    if (!viewportEl) return;
    const vpW = viewportEl.clientWidth;
    const vpH = viewportEl.clientHeight;
    if (vpW <= 50 || vpH <= 50 || !appState.imageWidth || !appState.imageHeight) return;

    const padding = 30;
    const availW = Math.max(50, vpW - padding * 2);
    const availH = Math.max(50, vpH - padding * 2);
    const scaleX = availW / appState.imageWidth;
    const scaleY = availH / appState.imageHeight;
    const zoom = Math.min(scaleX, scaleY, 1.0);

    const renderedW = appState.imageWidth * zoom;
    const renderedH = appState.imageHeight * zoom;
    const panX = Math.round((vpW - renderedW) / 2);
    const panY = Math.round((vpH - renderedH) / 2);

    callback(zoom, panX, panY);
}

// Phóng to / Thu nhỏ giữ nguyên tâm Viewport
function zoomAtViewportCenter(factor, viewportEl, getZoom, setZoom, getPan, setPan, updateTransform) {
    const rect = viewportEl.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const oldZoom = getZoom();
    const newZoom = Math.min(Math.max(oldZoom * factor, 0.1), 5.0);
    if (newZoom === oldZoom) return;

    const oldPan = getPan();
    const ratio = newZoom / oldZoom;
    const newPanX = Math.round(centerX - (centerX - oldPan.x) * ratio);
    const newPanY = Math.round(centerY - (centerY - oldPan.y) * ratio);

    setZoom(newZoom);
    setPan(newPanX, newPanY);
    updateTransform();
}

// Phóng to / Thu nhỏ lăn chuột giữ nguyên điểm dưới con trỏ
function zoomAtCursor(e, viewportEl, getZoom, setZoom, getPan, setPan, updateTransform) {
    e.preventDefault();
    const rect = viewportEl.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const oldZoom = getZoom();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(Math.max(oldZoom * factor, 0.1), 5.0);
    if (newZoom === oldZoom) return;

    const oldPan = getPan();
    const ratio = newZoom / oldZoom;
    const newPanX = Math.round(cursorX - (cursorX - oldPan.x) * ratio);
    const newPanY = Math.round(cursorY - (cursorY - oldPan.y) * ratio);

    setZoom(newZoom);
    setPan(newPanX, newPanY);
    updateTransform();
}

// Modal Buttons setup
btnCloseModal.addEventListener('click', () => {
    exportModal.classList.remove('show');
});

btnOpenFolder.addEventListener('click', () => {
    if (appState.lastExportData && appState.lastExportData.output_dir) {
        fetch('/api/open-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: appState.lastExportData.output_dir })
        });
    }
});

btnDownloadPsd.addEventListener('click', () => {
    if (appState.lastExportData) {
        window.location.href = `/api/download-psd/${appState.lastExportData.export_id}`;
    }
});

btnDownloadZip.addEventListener('click', () => {
    if (appState.lastExportData) {
        window.location.href = `/api/download-zip/${appState.lastExportData.export_id}`;
    }
});

// ==========================================
// TAB 3: PSD INSPECTOR ON DARK BACKGROUND
// ==========================================
function setupInspectViewEvents() {
    // 1. PSD File Upload
    dropzoneInspect.addEventListener('click', () => {
        fileInputInspect.click();
    });

    fileInputInspect.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            uploadPsdFile(e.target.files[0]);
        }
    });

    dropzoneInspect.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneInspect.classList.add('drag-over');
    });

    dropzoneInspect.addEventListener('dragleave', () => {
        dropzoneInspect.classList.remove('drag-over');
    });

    dropzoneInspect.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneInspect.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadPsdFile(e.dataTransfer.files[0]);
        }
    });

    // 2. Background Picker (Dark Mode)
    setupInspectBgPicker();

    // 3. Canvas Interactions (Zoom, Pan)
    setupInspectCanvasInteractions();

    // 4. Defringe Buttons
    btnDefringe1px.addEventListener('click', () => triggerDefringe(1));
    btnDefringe2px.addEventListener('click', () => triggerDefringe(2));

    // 4b. Undo & Redo History Buttons & Keyboard Shortcuts
    if (btnInspectUndo) btnInspectUndo.addEventListener('click', handleInspectUndo);
    if (btnInspectRedo) btnInspectRedo.addEventListener('click', handleInspectRedo);

    window.addEventListener('keydown', (e) => {
        if (appState.currentTab !== 'inspect') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
            e.preventDefault();
            handleInspectUndo();
        } else if ((e.ctrlKey || e.metaKey) && ((e.key === 'y' || e.key === 'Y') || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))) {
            e.preventDefault();
            handleInspectRedo();
        }
    });

    // 5. Show / Hide All Layers
    btnInspectShowAll.addEventListener('click', () => {
        appState.inspectSoloId = null;
        appState.inspectLayers.forEach(l => {
            l.visible = true;
            const imgEl = document.getElementById(`inspectImgLayer_${l.id}`);
            if (imgEl) imgEl.style.display = 'block';
        });
        renderInspectLayersList();
        updateInspectVisibleCount();
    });

    btnInspectHideAll.addEventListener('click', () => {
        appState.inspectSoloId = null;
        appState.inspectLayers.forEach(l => {
            l.visible = false;
            const imgEl = document.getElementById(`inspectImgLayer_${l.id}`);
            if (imgEl) imgEl.style.display = 'none';
        });
        renderInspectLayersList();
        updateInspectVisibleCount();
    });

    // 6. Export Inspected PSD
    btnExportInspect.addEventListener('click', handleExportInspectedPsd);
}

function uploadPsdFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.psd')) {
        alert('Vui lòng chọn file định dạng Adobe Photoshop (.psd)!');
        return;
    }

    inspectStatusBadge.textContent = 'Đang tải...';
    inspectCanvasStats.textContent = 'Đang phân tích các layer trong file PSD...';

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload-psd', {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error('Không thể phân tích file PSD');
        return res.json();
    })
    .then(data => {
        handlePsdLoaded(data);
    })
    .catch(err => {
        console.error(err);
        alert('Lỗi tải file PSD: ' + err.message);
        inspectStatusBadge.textContent = 'Lỗi';
        inspectCanvasStats.textContent = 'Tải PSD thất bại';
    });
}

function handlePsdLoaded(data) {
    appState.inspectLayers = data.layers || [];
    appState.inspectWidth = data.width || 1024;
    appState.inspectHeight = data.height || 765;
    appState.inspectFilename = data.filename || 'character.psd';
    appState.inspectSoloId = null;
    appState.inspectUndoStack = [];
    appState.inspectRedoStack = [];
    updateUndoRedoButtons();

    infoDimensionsInspect.textContent = `${appState.inspectWidth} x ${appState.inspectHeight} px`;
    infoFilenameInspect.textContent = appState.inspectFilename;
    inspectStatusBadge.textContent = `${appState.inspectLayers.length} layer`;
    inspectLayersCountBadge.textContent = `${appState.inspectLayers.length} layer`;
    inspectCanvasStats.textContent = `Đã nạp ${appState.inspectLayers.length} layer (${appState.inspectWidth}x${appState.inspectHeight}px)`;

    renderInspectCanvas();
    renderInspectLayersList();
    updateInspectVisibleCount();

    if (appState.inspectLayers.length > 0) {
        selectInspectLayer(appState.inspectLayers[0].id);
    }

    requestAnimationFrame(() => {
        fitInspectCanvas();
        setTimeout(fitInspectCanvas, 60);
    });
}

function selectInspectLayer(id) {
    if (appState.selectedInspectId === id) {
        appState.selectedInspectId = null;
    } else {
        appState.selectedInspectId = id;
    }

    const allItems = inspectLayersList.querySelectorAll('.inspect-layer-item');
    allItems.forEach(el => el.classList.remove('active-selected'));

    const allImgs = inspectCanvasContainer.querySelectorAll('.inspect-layer-img');
    allImgs.forEach(el => el.classList.remove('selected-layer-on-canvas'));

    if (appState.selectedInspectId) {
        const activeItem = document.getElementById(`inspectLayerItem_${appState.selectedInspectId}`);
        if (activeItem) {
            activeItem.classList.add('active-selected');
        }
        const activeImg = document.getElementById(`inspectImgLayer_${appState.selectedInspectId}`);
        if (activeImg) {
            activeImg.classList.add('selected-layer-on-canvas');
            const lyr = appState.inspectLayers.find(l => l.id === appState.selectedInspectId);
            if (lyr && !lyr.visible) {
                lyr.visible = true;
                activeImg.style.display = 'block';
                renderInspectLayersList();
                updateInspectVisibleCount();
            }
        }
        const lyr = appState.inspectLayers.find(l => l.id === appState.selectedInspectId);
        if (lyr) {
            inspectCanvasStats.innerHTML = `Đang chọn: <strong>${lyr.name}</strong> (${lyr.w}×${lyr.h}px tại x:${lyr.x}, y:${lyr.y})`;
            if (inspectTargetBadge) {
                inspectTargetBadge.textContent = lyr.name;
                inspectTargetBadge.style.background = '#fff7ed';
                inspectTargetBadge.style.color = '#c2410c';
            }
            if (targetLayerBox) targetLayerBox.classList.add('has-target');
            if (targetLayerName) targetLayerName.innerHTML = `Đang chọn: <strong>${lyr.name}</strong> (${lyr.w}×${lyr.h}px)`;
            if (btnDefringe1px) btnDefringe1px.textContent = `🪄 Khử viền 1px: "${lyr.name}"`;
            if (btnDefringe2px) btnDefringe2px.textContent = `✨ Khử viền 2px: "${lyr.name}"`;
        }
    } else {
        inspectCanvasStats.textContent = `Sẵn sàng kiểm tra • ${appState.inspectLayers.length} layer`;
        if (inspectTargetBadge) {
            inspectTargetBadge.textContent = 'Chưa chọn';
            inspectTargetBadge.style.background = '#f1f5f9';
            inspectTargetBadge.style.color = 'var(--text-secondary)';
        }
        if (targetLayerBox) targetLayerBox.classList.remove('has-target');
        if (targetLayerName) targetLayerName.textContent = 'Click layer cần khử viền';
        if (btnDefringe1px) btnDefringe1px.textContent = '🪄 Khử viền 1px (Layer đang chọn)';
        if (btnDefringe2px) btnDefringe2px.textContent = '✨ Khử viền 2px (Triệt để)';
    }
}

function renderInspectCanvas() {
    inspectCanvasContainer.innerHTML = '';
    inspectCanvasContainer.style.width = `${appState.inspectWidth}px`;
    inspectCanvasContainer.style.height = `${appState.inspectHeight}px`;

    appState.inspectLayers.forEach(lyr => {
        const img = document.createElement('img');
        const isSelected = (appState.selectedInspectId === lyr.id);
        img.className = 'inspect-layer-img' + (isSelected ? ' selected-layer-on-canvas' : '');
        img.id = `inspectImgLayer_${lyr.id}`;
        img.src = lyr.image;
        img.style.left = `${lyr.x}px`;
        img.style.top = `${lyr.y}px`;
        img.style.width = `${lyr.w}px`;
        img.style.height = `${lyr.h}px`;
        img.style.display = lyr.visible ? 'block' : 'none';
        img.style.opacity = (lyr.opacity !== undefined ? lyr.opacity / 255 : 1);
        img.title = `${lyr.name} (${lyr.w}×${lyr.h}px)`;
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            selectInspectLayer(lyr.id);
        });
        inspectCanvasContainer.appendChild(img);
    });
}

function renderInspectLayersList() {
    inspectLayersList.innerHTML = '';
    if (!appState.inspectLayers || appState.inspectLayers.length === 0) {
        inspectEmptyPlaceholder.style.display = 'block';
        return;
    }
    inspectEmptyPlaceholder.style.display = 'none';

    // Hiển thị danh sách từ trên xuống dưới
    const reversed = [...appState.inspectLayers].reverse();

    reversed.forEach(lyr => {
        const item = document.createElement('div');
        const isSelected = (appState.selectedInspectId === lyr.id);
        item.className = 'inspect-layer-item' + (lyr.visible ? '' : ' hidden-layer') + (isSelected ? ' active-selected' : '');
        item.id = `inspectLayerItem_${lyr.id}`;

        item.addEventListener('click', () => {
            selectInspectLayer(lyr.id);
        });

        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'btn-layer-eye';
        eyeBtn.title = lyr.visible ? 'Ẩn layer này' : 'Hiện layer này';
        eyeBtn.innerHTML = lyr.visible
            ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
            : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

        eyeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleInspectLayerVisibility(lyr.id);
        });

        const thumb = document.createElement('img');
        thumb.className = 'inspect-layer-thumb';
        thumb.id = `inspectThumbLayer_${lyr.id}`;
        thumb.src = lyr.image;
        thumb.alt = lyr.name;

        const meta = document.createElement('div');
        meta.className = 'inspect-layer-meta';
        const title = document.createElement('div');
        title.className = 'inspect-layer-title';
        title.textContent = lyr.name;
        title.title = lyr.name;
        const coords = document.createElement('div');
        coords.className = 'inspect-layer-coords';
        coords.textContent = `x:${lyr.x}, y:${lyr.y} • ${lyr.w}×${lyr.h}px`;
        meta.appendChild(title);
        meta.appendChild(coords);

        const soloBtn = document.createElement('button');
        soloBtn.className = 'btn-layer-solo' + (appState.inspectSoloId === lyr.id ? ' active' : '');
        soloBtn.textContent = 'Soi riêng';
        soloBtn.title = 'Chỉ hiển thị riêng bộ phận này trên nền tối';
        soloBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleInspectSolo(lyr.id);
        });

        item.appendChild(eyeBtn);
        item.appendChild(thumb);
        item.appendChild(meta);
        item.appendChild(soloBtn);

        inspectLayersList.appendChild(item);
    });
}

function toggleInspectLayerVisibility(id) {
    const lyr = appState.inspectLayers.find(l => l.id === id);
    if (!lyr) return;
    lyr.visible = !lyr.visible;
    const imgEl = document.getElementById(`inspectImgLayer_${lyr.id}`);
    if (imgEl) {
        imgEl.style.display = lyr.visible ? 'block' : 'none';
    }
    renderInspectLayersList();
    updateInspectVisibleCount();
}

function toggleInspectSolo(id) {
    if (appState.inspectSoloId === id) {
        // Hủy chế độ soi riêng: phục hồi tất cả
        appState.inspectSoloId = null;
        appState.inspectLayers.forEach(lyr => {
            lyr.visible = true;
            const imgEl = document.getElementById(`inspectImgLayer_${lyr.id}`);
            if (imgEl) imgEl.style.display = 'block';
        });
    } else {
        appState.inspectSoloId = id;
        appState.inspectLayers.forEach(lyr => {
            lyr.visible = (lyr.id === id);
            const imgEl = document.getElementById(`inspectImgLayer_${lyr.id}`);
            if (imgEl) imgEl.style.display = (lyr.id === id) ? 'block' : 'none';
        });
    }
    renderInspectLayersList();
    updateInspectVisibleCount();
}

function updateInspectVisibleCount() {
    const visibleCount = appState.inspectLayers.filter(l => l.visible).length;
    if (valInspectVisibleCount) {
        valInspectVisibleCount.textContent = `${visibleCount} layer`;
    }
}

function updateUndoRedoButtons() {
    if (btnInspectUndo) {
        btnInspectUndo.disabled = (!appState.inspectUndoStack || appState.inspectUndoStack.length === 0);
    }
    if (btnInspectRedo) {
        btnInspectRedo.disabled = (!appState.inspectRedoStack || appState.inspectRedoStack.length === 0);
    }
}

function pushInspectHistory() {
    if (!appState.inspectUndoStack) appState.inspectUndoStack = [];
    // Lưu bản sao trạng thái ảnh của các layer
    const snapshot = appState.inspectLayers.map(l => ({
        id: l.id,
        image: l.image
    }));
    appState.inspectUndoStack.push(snapshot);
    if (appState.inspectUndoStack.length > 25) {
        appState.inspectUndoStack.shift();
    }
    appState.inspectRedoStack = [];
    updateUndoRedoButtons();
}

function handleInspectUndo() {
    if (!appState.inspectUndoStack || appState.inspectUndoStack.length === 0) return;

    // Lưu trạng thái hiện tại vào Redo stack
    const currentSnapshot = appState.inspectLayers.map(l => ({
        id: l.id,
        image: l.image
    }));
    if (!appState.inspectRedoStack) appState.inspectRedoStack = [];
    appState.inspectRedoStack.push(currentSnapshot);

    // Lấy trạng thái trước đó từ Undo stack
    const prevSnapshot = appState.inspectUndoStack.pop();
    applyHistorySnapshot(prevSnapshot);
    updateUndoRedoButtons();
    inspectCanvasStats.innerHTML = '↩️ <strong>Đã hoàn tác (Undo)</strong> thao tác khử viền!';
}

function handleInspectRedo() {
    if (!appState.inspectRedoStack || appState.inspectRedoStack.length === 0) return;

    // Lưu trạng thái hiện tại vào Undo stack
    const currentSnapshot = appState.inspectLayers.map(l => ({
        id: l.id,
        image: l.image
    }));
    appState.inspectUndoStack.push(currentSnapshot);

    // Lấy trạng thái từ Redo stack
    const nextSnapshot = appState.inspectRedoStack.pop();
    applyHistorySnapshot(nextSnapshot);
    updateUndoRedoButtons();
    inspectCanvasStats.innerHTML = '↪️ <strong>Đã làm lại (Redo)</strong> thao tác vừa hoàn tác!';
}

function applyHistorySnapshot(snapshot) {
    snapshot.forEach(item => {
        const lyr = appState.inspectLayers.find(l => l.id === item.id);
        if (lyr) {
            lyr.image = item.image;
            const imgEl = document.getElementById(`inspectImgLayer_${lyr.id}`);
            if (imgEl) imgEl.src = item.image;
            const thumbEl = document.getElementById(`inspectThumbLayer_${lyr.id}`);
            if (thumbEl) thumbEl.src = item.image;
        }
    });

    // Đồng bộ lại server để xuất file luôn chuẩn
    fetch('/api/sync-psd-layers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layers: appState.inspectLayers })
    }).catch(err => console.error('Lỗi sync layer:', err));
}

function triggerDefringe(insetPx) {
    if (!appState.inspectLayers || appState.inspectLayers.length === 0) {
        alert('Chưa có file PSD nào được tải lên để khử viền!');
        return;
    }

    if (!appState.selectedInspectId) {
        alert('Vui lòng click chọn 1 layer trong danh sách hoặc trên màn hình để khử viền riêng layer đó!');
        return;
    }

    const targetLyr = appState.inspectLayers.find(l => l.id === appState.selectedInspectId);
    if (!targetLyr) return;

    // Lưu lịch sử để Undo trước khi khử viền
    pushInspectHistory();

    inspectCanvasStats.innerHTML = `Đang khử viền (${insetPx}px) cho layer <strong>${targetLyr.name}</strong>...`;

    fetch('/api/defringe-psd-layers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            inset_px: insetPx,
            layer_id: appState.selectedInspectId
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('Không thể xử lý khử viền');
        return res.json();
    })
    .then(data => {
        appState.inspectLayers = data.layers || [];
        const updatedLyr = appState.inspectLayers.find(l => l.id === appState.selectedInspectId);
        if (updatedLyr) {
            const imgEl = document.getElementById(`inspectImgLayer_${updatedLyr.id}`);
            if (imgEl) imgEl.src = updatedLyr.image;
            const thumbEl = document.getElementById(`inspectThumbLayer_${updatedLyr.id}`);
            if (thumbEl) thumbEl.src = updatedLyr.image;
        }
        updateUndoRedoButtons();
        inspectCanvasStats.innerHTML = `✨ Đã khử viền (${insetPx}px) cho layer <strong>"${targetLyr.name}"</strong> thành công! (Nhấn Ctrl+Z để Undo)`;
    })
    .catch(err => {
        console.error(err);
        alert('Lỗi khử viền: ' + err.message);
        // Hoàn tác lại lịch sử nếu lỗi
        if (appState.inspectUndoStack && appState.inspectUndoStack.length > 0) {
            appState.inspectUndoStack.pop();
            updateUndoRedoButtons();
        }
        inspectCanvasStats.textContent = 'Khử viền thất bại';
    });
}

function setupInspectBgPicker() {
    const bgButtons = document.querySelectorAll('.dark-bg-picker .bg-pick-btn');
    bgButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            bgButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const bgMode = btn.dataset.bg || 'black';
            appState.inspectBgMode = bgMode;
            inspectCanvasViewport.className = `canvas-viewport canvas-viewport-dark bg-${bgMode}`;
        });
    });
}

function setupInspectCanvasInteractions() {
    // Mouse wheel zoom at cursor
    inspectCanvasViewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = inspectCanvasViewport.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
        const newZoom = Math.min(Math.max(0.1, appState.inspectZoom * zoomFactor), 8);
        const ratio = newZoom / appState.inspectZoom;

        appState.inspectPanX = Math.round(cursorX - (cursorX - appState.inspectPanX) * ratio);
        appState.inspectPanY = Math.round(cursorY - (cursorY - appState.inspectPanY) * ratio);
        appState.inspectZoom = newZoom;
        updateInspectTransform();
    }, { passive: false });

    // Drag to pan
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    inspectCanvasViewport.addEventListener('mousedown', (e) => {
        if (e.button === 0 || e.button === 1) {
            isPanning = true;
            startX = e.clientX - appState.inspectPanX;
            startY = e.clientY - appState.inspectPanY;
            inspectCanvasViewport.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        appState.inspectPanX = e.clientX - startX;
        appState.inspectPanY = e.clientY - startY;
        updateInspectTransform();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            inspectCanvasViewport.style.cursor = 'grab';
        }
    });

    // Floating zoom controls
    btnInspectZoomIn.addEventListener('click', () => zoomInspectAtCenter(1.25));
    btnInspectZoomOut.addEventListener('click', () => zoomInspectAtCenter(0.8));
    btnInspectZoomReset.addEventListener('click', () => fitInspectCanvas());
}

function zoomInspectAtCenter(factor) {
    const rect = inspectCanvasViewport.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newZoom = Math.min(Math.max(0.1, appState.inspectZoom * factor), 8);
    const ratio = newZoom / appState.inspectZoom;
    appState.inspectPanX = Math.round(cx - (cx - appState.inspectPanX) * ratio);
    appState.inspectPanY = Math.round(cy - (cy - appState.inspectPanY) * ratio);
    appState.inspectZoom = newZoom;
    updateInspectTransform();
}

function fitInspectCanvas() {
    if (!inspectCanvasViewport || !appState.inspectWidth || !appState.inspectHeight) return;
    const vpW = inspectCanvasViewport.clientWidth;
    const vpH = inspectCanvasViewport.clientHeight;
    if (vpW <= 50 || vpH <= 50) {
        setTimeout(fitInspectCanvas, 60);
        return;
    }

    const padding = 30;
    const availW = Math.max(50, vpW - padding * 2);
    const availH = Math.max(50, vpH - padding * 2);
    const scaleX = availW / appState.inspectWidth;
    const scaleY = availH / appState.inspectHeight;
    const zoom = Math.min(scaleX, scaleY, 1.0);

    const renderedW = appState.inspectWidth * zoom;
    const renderedH = appState.inspectHeight * zoom;
    appState.inspectZoom = zoom;
    appState.inspectPanX = Math.round((vpW - renderedW) / 2);
    appState.inspectPanY = Math.round((vpH - renderedH) / 2);
    updateInspectTransform();
}

function updateInspectTransform() {
    if (!inspectCanvasContainer) return;
    inspectCanvasContainer.style.transform = `translate(${appState.inspectPanX}px, ${appState.inspectPanY}px) scale(${appState.inspectZoom})`;
}

async function handleExportInspectedPsd() {
    if (!appState.inspectLayers || appState.inspectLayers.length === 0) {
        alert('Chưa có dữ liệu PSD nào để xuất! Vui lòng nạp file PSD trước.');
        return;
    }
    const visibleCount = appState.inspectLayers.filter(l => l.visible !== false).length;
    if (visibleCount === 0) {
        alert('Tất cả các layer đang bị ẩn! Vui lòng bật hiển thị ít nhất 1 layer để xuất.');
        return;
    }

    let targetFolder = appState.customOutputDir;
    try {
        const res = await fetch('/api/select-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_path: targetFolder || appState.defaultOutputDir || '',
                title: 'Chọn thư mục trên máy tính để lưu file PSD & PNG đã kiểm tra'
            })
        });
        const folderData = await res.json();
        if (!folderData.folder) {
            return;
        }
        targetFolder = folderData.folder;
        appState.customOutputDir = targetFolder;
        localStorage.setItem('spriteSplit_outputDir', targetFolder);
        syncOutputFolderDisplays();
    } catch (err) {
        console.warn('Không thể mở hộp thoại chọn thư mục:', err);
    }

    exportModal.classList.add('show');
    modalSummary.innerHTML = `
        Đang xuất <strong>${visibleCount} layer đã khử viền</strong> vào thư mục:<br>
        <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 11.5px; display: inline-block; margin: 6px 0; word-break: break-all;">
            ${targetFolder}
        </code><br>
        Vui lòng đợi trong giây lát...
    `;

    const baseName = (appState.inspectFilename || 'character').replace(/\.[^/.]+$/, '');
    fetch('/api/export-inspected-psd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            output_dir: targetFolder,
            base_name: baseName
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('Xuất file thất bại');
        return res.json();
    })
    .then(data => {
        appState.lastExportData = data;
        modalSummary.innerHTML = `
            Đã xuất thành công <strong>${data.total_parts} layer sạch viền</strong> vào thư mục máy tính của bạn:<br>
            <code style="background: #ecfdf5; color: #047857; font-weight: 600; padding: 6px 10px; border-radius: 6px; font-size: 12px; display: inline-block; margin: 8px 0; word-break: break-all;">
                ${data.output_dir}
            </code><br>
            • File PSD sạch viền: Mở trực tiếp trên Photopea / Photoshop.<br>
            • Thư mục <code>png_parts/</code> chứa từng file PNG trong suốt không còn viền trắng trên nền đen.
        `;
    })
    .catch(err => {
        console.error(err);
        modalSummary.innerHTML = `<span style="color: #dc2626; font-weight: 600;">Lỗi khi xuất file: ${err.message}</span>`;
    });
}



// =========================================================
// TAB 4: 2D CHARACTER ANIMATION & PIVOT RIGGING STUDIO
// (Tích hợp 17 Chuẩn Tên & 18 Preset từ Funny Animation Assistant)
// =========================================================
const ROLE_LABELS_VI = {
    body: '👕 Thân [Body]',
    head: '🙂 Đầu [Head]',
    face: '😊 Khuôn Mặt [Face]',
    hair: '💇 Tóc/Mũ [Hair]',
    expression: '🎭 Biểu Cảm [Expression]',
    arm_left: '💪 Tay Trái [Left Arm]',
    arm_right: '🤚 Tay Phải [Right Arm]',
    arm_upper_left: '🦾 Bắp Tay T [Left Upper Arm]',
    arm_lower_left: '🤜 Cẳng Tay T [Left Lower Arm]',
    arm_upper_right: '🦾 Bắp Tay P [Right Upper Arm]',
    arm_lower_right: '🤛 Cẳng Tay P [Right Lower Arm]',
    leg_left: '🦵 Chân Trái [Left Leg]',
    leg_right: '🦶 Chân Phải [Right Leg]',
    leg_thigh_left: '🦵 Đùi Trái [Left Thigh]',
    leg_calf_left: '👟 Bắp Chân T [Left Calf]',
    leg_thigh_right: '🦵 Đùi Phải [Right Thigh]',
    leg_calf_right: '👟 Bắp Chân P [Right Calf]',
    eye_open: '👁️ Mắt Mở',
    eye_closed: '😌 Mắt Nhắm',
    eye_extra: '😲 Mắt Phụ',
    mouth_closed: '😶 Miệng Đóng',
    mouth_half: '😮 Miệng Vừa',
    mouth_open: '😃 Miệng Mở To',
    mouth_extra: '😬 Miệng Phụ',
    head_prop: '💧 Phụ Kiện Đầu',
    custom: '✨ Tự Do'
};

const ROLE_TO_FUNNY_NAME_JS = {
    body: 'Body',
    head: 'Head',
    expression: 'Expression',
    face: 'Face',
    hair: 'Hair',
    arm_left: 'Left Arm',
    arm_right: 'Right Arm',
    arm_upper_left: 'Left Upper Arm',
    arm_lower_left: 'Left Lower Arm',
    arm_upper_right: 'Right Upper Arm',
    arm_lower_right: 'Right Lower Arm',
    leg_left: 'Left Leg',
    leg_right: 'Right Leg',
    leg_thigh_left: 'Left Thigh',
    leg_calf_left: 'Left Calf',
    leg_thigh_right: 'Right Thigh',
    leg_calf_right: 'Right Calf',
    leg_upper_left: 'Left Thigh',
    leg_lower_left: 'Left Calf',
    leg_upper_right: 'Right Thigh',
    leg_lower_right: 'Right Calf',
    foot_left: 'Left Foot',
    foot_right: 'Right Foot'
};

// Catalog 18 Preset Animation chuẩn từ Funny Animation Assistant + Talk
const FUNNY_PRESET_CATALOG_JS = {
    walk: {
        duration: 800, loopMode: 'loop',
        requiredParts: ['Body', 'Left Leg', 'Right Leg'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, y: 0, easing: 'easeInOut' },
                { time: 200, y: -6, easing: 'easeInOut' },
                { time: 400, y: 0, easing: 'easeInOut' },
                { time: 600, y: -6, easing: 'easeInOut' },
                { time: 800, y: 0 }
            ]},
            { targetName: 'Left Leg', type: 'transform', keyframes: [
                { time: 0, rotation: 25, easing: 'easeInOut' },
                { time: 400, rotation: -25, easing: 'easeInOut' },
                { time: 800, rotation: 25 }
            ]},
            { targetName: 'Right Leg', type: 'transform', keyframes: [
                { time: 0, rotation: -25, easing: 'easeInOut' },
                { time: 400, rotation: 25, easing: 'easeInOut' },
                { time: 800, rotation: -25 }
            ]},
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -18, easing: 'easeInOut' },
                { time: 400, rotation: 18, easing: 'easeInOut' },
                { time: 800, rotation: -18 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 18, easing: 'easeInOut' },
                { time: 400, rotation: -18, easing: 'easeInOut' },
                { time: 800, rotation: 18 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, easing: 'easeInOut' },
                { time: 200, y: -3, easing: 'easeInOut' },
                { time: 400, y: 0, easing: 'easeInOut' },
                { time: 600, y: -3, easing: 'easeInOut' },
                { time: 800, y: 0 }
            ]}
        ]
    },
    run: {
        duration: 500, loopMode: 'loop',
        requiredParts: ['Body', 'Left Leg', 'Right Leg'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, y: 0, rotation: 8, easing: 'easeInOut' },
                { time: 125, y: -14, rotation: 8, easing: 'easeInOut' },
                { time: 250, y: 0, rotation: 8, easing: 'easeInOut' },
                { time: 375, y: -14, rotation: 8, easing: 'easeInOut' },
                { time: 500, y: 0, rotation: 8 }
            ]},
            { targetName: 'Left Leg', type: 'transform', keyframes: [
                { time: 0, rotation: 42, easing: 'easeInOut' },
                { time: 250, rotation: -42, easing: 'easeInOut' },
                { time: 500, rotation: 42 }
            ]},
            { targetName: 'Right Leg', type: 'transform', keyframes: [
                { time: 0, rotation: -42, easing: 'easeInOut' },
                { time: 250, rotation: 42, easing: 'easeInOut' },
                { time: 500, rotation: -42 }
            ]},
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -38, easing: 'easeInOut' },
                { time: 250, rotation: 38, easing: 'easeInOut' },
                { time: 500, rotation: -38 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 38, easing: 'easeInOut' },
                { time: 250, rotation: -38, easing: 'easeInOut' },
                { time: 500, rotation: 38 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, rotation: 4, easing: 'easeInOut' },
                { time: 125, y: -5, rotation: 4, easing: 'easeInOut' },
                { time: 250, y: 0, rotation: 4, easing: 'easeInOut' },
                { time: 375, y: -5, rotation: 4, easing: 'easeInOut' },
                { time: 500, y: 0, rotation: 4 }
            ]}
        ]
    },
    walk_detailed: {
        duration: 800, loopMode: 'loop',
        requiredParts: ['Body', 'Left Thigh', 'Left Calf', 'Right Thigh', 'Right Calf'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, y: 0, easing: 'easeInOut' },
                { time: 200, y: -6, easing: 'easeInOut' },
                { time: 400, y: 0, easing: 'easeInOut' },
                { time: 600, y: -6, easing: 'easeInOut' },
                { time: 800, y: 0 }
            ]},
            { targetName: 'Left Thigh', type: 'transform', keyframes: [
                { time: 0, rotation: 22, easing: 'easeInOut' },
                { time: 200, rotation: 5, easing: 'easeInOut' },
                { time: 400, rotation: -20, easing: 'easeInOut' },
                { time: 600, rotation: 0, easing: 'easeInOut' },
                { time: 800, rotation: 22 }
            ]},
            { targetName: 'Left Calf', type: 'transform', keyframes: [
                { time: 0, rotation: -5, easing: 'easeInOut' },
                { time: 200, rotation: -30, easing: 'easeInOut' },
                { time: 400, rotation: -8, easing: 'easeInOut' },
                { time: 600, rotation: 0, easing: 'easeInOut' },
                { time: 800, rotation: -5 }
            ]},
            { targetName: 'Right Thigh', type: 'transform', keyframes: [
                { time: 0, rotation: -20, easing: 'easeInOut' },
                { time: 200, rotation: 0, easing: 'easeInOut' },
                { time: 400, rotation: 22, easing: 'easeInOut' },
                { time: 600, rotation: 5, easing: 'easeInOut' },
                { time: 800, rotation: -20 }
            ]},
            { targetName: 'Right Calf', type: 'transform', keyframes: [
                { time: 0, rotation: -8, easing: 'easeInOut' },
                { time: 200, rotation: 0, easing: 'easeInOut' },
                { time: 400, rotation: -5, easing: 'easeInOut' },
                { time: 600, rotation: -30, easing: 'easeInOut' },
                { time: 800, rotation: -8 }
            ]},
            { targetName: 'Left Upper Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -15, easing: 'easeInOut' },
                { time: 400, rotation: 15, easing: 'easeInOut' },
                { time: 800, rotation: -15 }
            ]},
            { targetName: 'Left Lower Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -10, easing: 'easeInOut' },
                { time: 400, rotation: -25, easing: 'easeInOut' },
                { time: 800, rotation: -10 }
            ]},
            { targetName: 'Right Upper Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 15, easing: 'easeInOut' },
                { time: 400, rotation: -15, easing: 'easeInOut' },
                { time: 800, rotation: 15 }
            ]},
            { targetName: 'Right Lower Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -25, easing: 'easeInOut' },
                { time: 400, rotation: -10, easing: 'easeInOut' },
                { time: 800, rotation: -25 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, easing: 'easeInOut' },
                { time: 200, y: -3, easing: 'easeInOut' },
                { time: 400, y: 0, easing: 'easeInOut' },
                { time: 600, y: -3, easing: 'easeInOut' },
                { time: 800, y: 0 }
            ]}
        ]
    },
    run_detailed: {
        duration: 500, loopMode: 'loop',
        requiredParts: ['Body', 'Left Thigh', 'Left Calf', 'Right Thigh', 'Right Calf'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, y: 0, rotation: 8, easing: 'easeInOut' },
                { time: 125, y: -14, rotation: 8, easing: 'easeInOut' },
                { time: 250, y: 0, rotation: 8, easing: 'easeInOut' },
                { time: 375, y: -14, rotation: 8, easing: 'easeInOut' },
                { time: 500, y: 0, rotation: 8 }
            ]},
            { targetName: 'Left Thigh', type: 'transform', keyframes: [
                { time: 0, rotation: 38, easing: 'easeInOut' },
                { time: 125, rotation: 10, easing: 'easeInOut' },
                { time: 250, rotation: -35, easing: 'easeInOut' },
                { time: 375, rotation: 5, easing: 'easeInOut' },
                { time: 500, rotation: 38 }
            ]},
            { targetName: 'Left Calf', type: 'transform', keyframes: [
                { time: 0, rotation: -10, easing: 'easeInOut' },
                { time: 125, rotation: -55, easing: 'easeInOut' },
                { time: 250, rotation: -15, easing: 'easeInOut' },
                { time: 375, rotation: 0, easing: 'easeInOut' },
                { time: 500, rotation: -10 }
            ]},
            { targetName: 'Right Thigh', type: 'transform', keyframes: [
                { time: 0, rotation: -35, easing: 'easeInOut' },
                { time: 125, rotation: 5, easing: 'easeInOut' },
                { time: 250, rotation: 38, easing: 'easeInOut' },
                { time: 375, rotation: 10, easing: 'easeInOut' },
                { time: 500, rotation: -35 }
            ]},
            { targetName: 'Right Calf', type: 'transform', keyframes: [
                { time: 0, rotation: -15, easing: 'easeInOut' },
                { time: 125, rotation: 0, easing: 'easeInOut' },
                { time: 250, rotation: -10, easing: 'easeInOut' },
                { time: 375, rotation: -55, easing: 'easeInOut' },
                { time: 500, rotation: -15 }
            ]},
            { targetName: 'Left Upper Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -32, easing: 'easeInOut' },
                { time: 250, rotation: 32, easing: 'easeInOut' },
                { time: 500, rotation: -32 }
            ]},
            { targetName: 'Left Lower Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -20, easing: 'easeInOut' },
                { time: 250, rotation: -45, easing: 'easeInOut' },
                { time: 500, rotation: -20 }
            ]},
            { targetName: 'Right Upper Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 32, easing: 'easeInOut' },
                { time: 250, rotation: -32, easing: 'easeInOut' },
                { time: 500, rotation: 32 }
            ]},
            { targetName: 'Right Lower Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -45, easing: 'easeInOut' },
                { time: 250, rotation: -20, easing: 'easeInOut' },
                { time: 500, rotation: -45 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, rotation: 4, easing: 'easeInOut' },
                { time: 125, y: -5, rotation: 4, easing: 'easeInOut' },
                { time: 250, y: 0, rotation: 4, easing: 'easeInOut' },
                { time: 375, y: -5, rotation: 4, easing: 'easeInOut' },
                { time: 500, y: 0, rotation: 4 }
            ]}
        ]
    },
    wave: {
        duration: 1200, loopMode: 'loop',
        requiredParts: ['Right Arm'],
        tracks: [
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 250, rotation: -120, easing: 'easeInOut' },
                { time: 450, rotation: -95, easing: 'easeInOut' },
                { time: 650, rotation: -125, easing: 'easeInOut' },
                { time: 850, rotation: -95, easing: 'easeInOut' },
                { time: 1000, rotation: -115, easing: 'easeIn' },
                { time: 1200, rotation: 0 }
            ]},
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeInOut' },
                { time: 250, rotation: -2, easing: 'easeInOut' },
                { time: 650, rotation: -3, easing: 'easeInOut' },
                { time: 1200, rotation: 0 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeInOut' },
                { time: 300, rotation: 5, easing: 'easeInOut' },
                { time: 700, rotation: 3, easing: 'easeInOut' },
                { time: 1200, rotation: 0 }
            ]}
        ]
    },
    wave_left: {
        duration: 1200, loopMode: 'loop',
        requiredParts: ['Left Arm'],
        tracks: [
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 250, rotation: 120, easing: 'easeInOut' },
                { time: 450, rotation: 95, easing: 'easeInOut' },
                { time: 650, rotation: 125, easing: 'easeInOut' },
                { time: 850, rotation: 95, easing: 'easeInOut' },
                { time: 1000, rotation: 115, easing: 'easeIn' },
                { time: 1200, rotation: 0 }
            ]},
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeInOut' },
                { time: 250, rotation: 2, easing: 'easeInOut' },
                { time: 650, rotation: 3, easing: 'easeInOut' },
                { time: 1200, rotation: 0 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeInOut' },
                { time: 300, rotation: -5, easing: 'easeInOut' },
                { time: 700, rotation: -3, easing: 'easeInOut' },
                { time: 1200, rotation: 0 }
            ]}
        ]
    },
    point_right: {
        duration: 600, loopMode: 'forwards',
        requiredParts: ['Right Arm'],
        tracks: [
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 350, rotation: -95, easing: 'easeInOut' },
                { time: 600, rotation: -85 }
            ]},
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 600, rotation: -2 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 600, rotation: 3 }
            ]}
        ]
    },
    hands_up: {
        duration: 800, loopMode: 'forwards',
        requiredParts: ['Left Arm', 'Right Arm'],
        tracks: [
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 500, rotation: 150, easing: 'easeInOut' },
                { time: 800, rotation: 140 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 500, rotation: -150, easing: 'easeInOut' },
                { time: 800, rotation: -140 }
            ]},
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, y: 0, easing: 'easeOut' },
                { time: 500, y: -8, easing: 'easeInOut' },
                { time: 800, y: -4 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, easing: 'easeOut' },
                { time: 500, y: -5, easing: 'easeInOut' },
                { time: 800, y: -3 }
            ]}
        ]
    },
    nod: {
        duration: 800, loopMode: 'loop',
        requiredParts: ['Head'],
        tracks: [
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, rotation: 0, easing: 'easeInOut' },
                { time: 200, y: 8, rotation: 8, easing: 'easeInOut' },
                { time: 400, y: -2, rotation: -2, easing: 'easeInOut' },
                { time: 600, y: 6, rotation: 6, easing: 'easeInOut' },
                { time: 800, y: 0, rotation: 0 }
            ]}
        ]
    },
    shake_head: {
        duration: 800, loopMode: 'loop',
        requiredParts: ['Head'],
        tracks: [
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, x: 0, rotation: 0, easing: 'easeInOut' },
                { time: 160, x: -10, rotation: -6, easing: 'easeInOut' },
                { time: 360, x: 10, rotation: 6, easing: 'easeInOut' },
                { time: 560, x: -8, rotation: -4, easing: 'easeInOut' },
                { time: 700, x: 6, rotation: 3, easing: 'easeInOut' },
                { time: 800, x: 0, rotation: 0 }
            ]}
        ]
    },
    bow: {
        duration: 1200, loopMode: 'loop',
        requiredParts: ['Body', 'Head'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, rotation: 0, y: 0, easing: 'easeInOut' },
                { time: 400, rotation: 25, y: 12, easing: 'easeInOut' },
                { time: 800, rotation: 25, y: 12, easing: 'easeInOut' },
                { time: 1200, rotation: 0, y: 0 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, rotation: 0, y: 0, easing: 'easeInOut' },
                { time: 400, rotation: 35, y: 18, easing: 'easeInOut' },
                { time: 800, rotation: 35, y: 18, easing: 'easeInOut' },
                { time: 1200, rotation: 0, y: 0 }
            ]},
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeInOut' },
                { time: 400, rotation: 15, easing: 'easeInOut' },
                { time: 800, rotation: 15, easing: 'easeInOut' },
                { time: 1200, rotation: 0 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeInOut' },
                { time: 400, rotation: -15, easing: 'easeInOut' },
                { time: 800, rotation: -15, easing: 'easeInOut' },
                { time: 1200, rotation: 0 }
            ]}
        ]
    },
    jump: {
        duration: 900, loopMode: 'loop',
        requiredParts: ['Body'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, y: 0, scaleY: 1, easing: 'easeIn' },
                { time: 180, y: 14, scaleY: 0.92, easing: 'easeOut' },
                { time: 450, y: -60, scaleY: 1.06, easing: 'easeIn' },
                { time: 720, y: 10, scaleY: 0.94, easing: 'easeOut' },
                { time: 900, y: 0, scaleY: 1 }
            ]},
            { targetName: 'Left Leg', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeIn' },
                { time: 180, rotation: 15, easing: 'easeOut' },
                { time: 450, rotation: -20, easing: 'easeIn' },
                { time: 720, rotation: 10, easing: 'easeOut' },
                { time: 900, rotation: 0 }
            ]},
            { targetName: 'Right Leg', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeIn' },
                { time: 180, rotation: -15, easing: 'easeOut' },
                { time: 450, rotation: 20, easing: 'easeIn' },
                { time: 720, rotation: -10, easing: 'easeOut' },
                { time: 900, rotation: 0 }
            ]},
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 180, rotation: -20, easing: 'easeOut' },
                { time: 450, rotation: 130, easing: 'easeIn' },
                { time: 720, rotation: 15, easing: 'easeOut' },
                { time: 900, rotation: 0 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 180, rotation: 20, easing: 'easeOut' },
                { time: 450, rotation: -130, easing: 'easeIn' },
                { time: 720, rotation: -15, easing: 'easeOut' },
                { time: 900, rotation: 0 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, easing: 'easeIn' },
                { time: 180, y: 8, easing: 'easeOut' },
                { time: 450, y: -65, easing: 'easeIn' },
                { time: 720, y: 6, easing: 'easeOut' },
                { time: 900, y: 0 }
            ]}
        ]
    },
    idle: {
        duration: 2000, loopMode: 'loop',
        requiredParts: ['Body'],
        tracks: [
            { targetName: 'Body', type: 'effect', effect: { type: 'breathe', intensity: 0.025, speed: 1 } },
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, easing: 'easeInOut' },
                { time: 1000, y: -2, easing: 'easeInOut' },
                { time: 2000, y: 0 }
            ]}
        ]
    },
    float: {
        duration: 2000, loopMode: 'loop',
        requiredParts: ['Body'],
        tracks: [
            { targetName: 'Body', type: 'effect', effect: { type: 'float', amplitude: 8, speed: 1 } },
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -5, easing: 'easeInOut' },
                { time: 1000, rotation: 5, easing: 'easeInOut' },
                { time: 2000, rotation: -5 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 5, easing: 'easeInOut' },
                { time: 1000, rotation: -5, easing: 'easeInOut' },
                { time: 2000, rotation: 5 }
            ]}
        ]
    },
    head_sway: {
        duration: 2400, loopMode: 'loop',
        requiredParts: ['Body'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, rotation: -3, x: -4, easing: 'easeInOut' },
                { time: 1200, rotation: 3, x: 4, easing: 'easeInOut' },
                { time: 2400, rotation: -3, x: -4 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, rotation: -5, easing: 'easeInOut' },
                { time: 1200, rotation: 5, easing: 'easeInOut' },
                { time: 2400, rotation: -5 }
            ]}
        ]
    },
    tremble: {
        duration: 300, loopMode: 'loop',
        requiredParts: ['Body'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, x: -4, y: 0, easing: 'linear' },
                { time: 75, x: 4, y: -1, easing: 'linear' },
                { time: 150, x: -3, y: 1, easing: 'linear' },
                { time: 225, x: 3, y: 0, easing: 'linear' },
                { time: 300, x: -4, y: 0 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, x: -5, rotation: -2, easing: 'linear' },
                { time: 75, x: 5, rotation: 2, easing: 'linear' },
                { time: 150, x: -4, rotation: -3, easing: 'linear' },
                { time: 225, x: 4, rotation: 3, easing: 'linear' },
                { time: 300, x: -5, rotation: -2 }
            ]},
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: -4, easing: 'linear' },
                { time: 150, rotation: 4, easing: 'linear' },
                { time: 300, rotation: -4 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 4, easing: 'linear' },
                { time: 150, rotation: -4, easing: 'linear' },
                { time: 300, rotation: 4 }
            ]}
        ]
    },
    shock: {
        duration: 700, loopMode: 'loop',
        requiredParts: ['Body', 'Head'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, y: 0, scaleX: 1, scaleY: 1, easing: 'easeOut' },
                { time: 150, y: -18, scaleX: 1.12, scaleY: 1.12, easing: 'easeInOut' },
                { time: 350, y: 4, scaleX: 0.96, scaleY: 0.96, easing: 'easeOut' },
                { time: 500, y: -4, scaleX: 1.03, scaleY: 1.03, easing: 'easeInOut' },
                { time: 700, y: 0, scaleX: 1, scaleY: 1 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, scaleX: 1, scaleY: 1, easing: 'easeOut' },
                { time: 150, y: -22, scaleX: 1.15, scaleY: 1.15, easing: 'easeInOut' },
                { time: 400, y: 2, scaleX: 0.97, scaleY: 0.97, easing: 'easeOut' },
                { time: 700, y: 0, scaleX: 1, scaleY: 1 }
            ]},
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 150, rotation: 60, easing: 'easeInOut' },
                { time: 500, rotation: -5, easing: 'easeOut' },
                { time: 700, rotation: 0 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 150, rotation: -60, easing: 'easeInOut' },
                { time: 500, rotation: 5, easing: 'easeOut' },
                { time: 700, rotation: 0 }
            ]},
            { targetName: 'Left Leg', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 150, rotation: -12, easing: 'easeInOut' },
                { time: 700, rotation: 0 }
            ]},
            { targetName: 'Right Leg', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeOut' },
                { time: 150, rotation: 12, easing: 'easeInOut' },
                { time: 700, rotation: 0 }
            ]}
        ]
    },
    collapsed: {
        duration: 900, loopMode: 'forwards',
        requiredParts: ['Body', 'Head'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, y: 0, scaleY: 1, rotation: 0, easing: 'easeIn' },
                { time: 500, y: 35, scaleY: 0.85, rotation: 8, easing: 'easeOut' },
                { time: 700, y: 28, scaleY: 0.9, rotation: 5, easing: 'easeInOut' },
                { time: 900, y: 30, scaleY: 0.88, rotation: 6 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, rotation: 0, easing: 'easeIn' },
                { time: 500, y: 45, rotation: 20, easing: 'easeOut' },
                { time: 900, y: 40, rotation: 18 }
            ]},
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, y: 0, easing: 'easeIn' },
                { time: 500, rotation: 25, y: 30, easing: 'easeOut' },
                { time: 900, rotation: 20, y: 28 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, y: 0, easing: 'easeIn' },
                { time: 500, rotation: -25, y: 30, easing: 'easeOut' },
                { time: 900, rotation: -20, y: 28 }
            ]},
            { targetName: 'Left Leg', type: 'transform', keyframes: [
                { time: 0, scaleY: 1, y: 0, easing: 'easeIn' },
                { time: 500, scaleY: 0.75, y: 15, easing: 'easeOut' },
                { time: 900, scaleY: 0.78, y: 12 }
            ]},
            { targetName: 'Right Leg', type: 'transform', keyframes: [
                { time: 0, scaleY: 1, y: 0, easing: 'easeIn' },
                { time: 500, scaleY: 0.75, y: 15, easing: 'easeOut' },
                { time: 900, scaleY: 0.78, y: 12 }
            ]}
        ]
    },
    talk: {
        duration: 1200, loopMode: 'loop',
        requiredParts: ['Body', 'Head'],
        tracks: [
            { targetName: 'Body', type: 'transform', keyframes: [
                { time: 0, y: 0, rotation: 0, easing: 'easeInOut' },
                { time: 300, y: -3, rotation: -1.5, easing: 'easeInOut' },
                { time: 600, y: 0, rotation: 1.2, easing: 'easeInOut' },
                { time: 900, y: -2.5, rotation: -1.0, easing: 'easeInOut' },
                { time: 1200, y: 0, rotation: 0 }
            ]},
            { targetName: 'Head', type: 'transform', keyframes: [
                { time: 0, y: 0, rotation: 0, easing: 'easeInOut' },
                { time: 300, y: 2, rotation: 4.5, easing: 'easeInOut' },
                { time: 600, y: -2, rotation: -3.5, easing: 'easeInOut' },
                { time: 900, y: 1.5, rotation: 3.0, easing: 'easeInOut' },
                { time: 1200, y: 0, rotation: 0 }
            ]},
            { targetName: 'Left Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeInOut' },
                { time: 400, rotation: 22, easing: 'easeInOut' },
                { time: 800, rotation: 8, easing: 'easeInOut' },
                { time: 1200, rotation: 0 }
            ]},
            { targetName: 'Right Arm', type: 'transform', keyframes: [
                { time: 0, rotation: 0, easing: 'easeInOut' },
                { time: 400, rotation: -16, easing: 'easeInOut' },
                { time: 800, rotation: -4, easing: 'easeInOut' },
                { time: 1200, rotation: 0 }
            ]}
        ]
    }
};

// Preset Aliases & Global Window Exports
FUNNY_PRESET_CATALOG_JS.wave_right = FUNNY_PRESET_CATALOG_JS.wave;
FUNNY_PRESET_CATALOG_JS.raise_both_hands = FUNNY_PRESET_CATALOG_JS.hands_up;
FUNNY_PRESET_CATALOG_JS.scared = FUNNY_PRESET_CATALOG_JS.shock || FUNNY_PRESET_CATALOG_JS.tremble;
FUNNY_PRESET_CATALOG_JS.breathe = FUNNY_PRESET_CATALOG_JS.idle;

window.ROLE_TO_FUNNY_NAME_JS = ROLE_TO_FUNNY_NAME_JS;
window.FUNNY_PRESET_CATALOG_JS = FUNNY_PRESET_CATALOG_JS;
window.resolvePresetTrackForRoleJS = resolvePresetTrackForRoleJS;
window.interpolatePropJS = interpolatePropJS;


// ==========================================
// SpriteSplit Animation Project (.sps) Save / Open / Restore
// ==========================================
async function saveAnimProjectToFile() {
    if (!appState.animLayers || appState.animLayers.length === 0) {
        alert('Chưa có layer nào để lưu thiết lập!');
        return;
    }

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');

    const serializedLayers = appState.animLayers.map(lyr => {
        let b64 = '';
        const img = appState.animImageCache[lyr.id];
        if (img && img.width > 0 && img.height > 0) {
            offCanvas.width = img.width;
            offCanvas.height = img.height;
            offCtx.clearRect(0, 0, img.width, img.height);
            offCtx.drawImage(img, 0, 0);
            b64 = offCanvas.toDataURL('image/png');
        }
        return {
            ...lyr,
            image_data: b64
        };
    });

    const projectData = {
        version: "1.0",
        format: "spritesplit_rig_setup",
        timestamp: Date.now(),
        filename: appState.animFilename || 'character.psd',
        canvas_width: appState.animCanvasWidth || 1024,
        canvas_height: appState.animCanvasHeight || 1024,
        config: { ...appState.animConfig },
        layers: serializedLayers
    };

    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeBase = (appState.animFilename ? appState.animFilename.replace(/\.[^/.]+$/, "") : "character") + "_rig_setup.sps";
    a.href = url;
    a.download = safeBase;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    saveAnimSessionToLocalStorage();
}

function openAnimProjectFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.layers || !Array.isArray(data.layers)) {
                alert('File thiết lập không hợp lệ hoặc thiếu dữ liệu layers!');
                return;
            }

            appState.animFilename = data.filename || 'imported_character.psd';
            appState.animCanvasWidth = data.canvas_width || 1024;
            appState.animCanvasHeight = data.canvas_height || 1024;
            if (data.config) {
                appState.animConfig = { ...appState.animConfig, ...data.config };
                syncAnimConfigControlsToUI();
            }

            appState.animLayers = data.layers.map(lyr => {
                const { image_data, ...rest } = lyr;
                return rest;
            });

            appState.animImageCache = {};
            const loadPromises = data.layers.map(lyr => {
                return new Promise((resolve) => {
                    if (lyr.image_data) {
                        const img = new Image();
                        img.onload = () => {
                            appState.animImageCache[lyr.id] = img;
                            resolve();
                        };
                        img.onerror = () => resolve();
                        img.src = lyr.image_data;
                    } else {
                        resolve();
                    }
                });
            });

            await Promise.all(loadPromises);

            const badge = document.getElementById('animStatusBadge');
            if (badge) badge.textContent = `${appState.animLayers.length} layer`;
            renderAnimLayersList();
            populateAnimParentSelect();
            if (appState.animLayers.length > 0) {
                selectAnimLayer(appState.animLayers[0].id);
            }
            renderAnimStageFrame();
            saveAnimSessionToLocalStorage();
            alert(`Đã nạp thành công thiết lập nhân vật: ${appState.animLayers.length} layer!`);
        } catch (err) {
            console.error('Lỗi đọc file thiết lập:', err);
            alert('Lỗi đọc file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function saveAnimSessionToLocalStorage() {
    try {
        if (!appState.animLayers || appState.animLayers.length === 0) return;
        const lightweightLayers = appState.animLayers.map(l => ({ ...l }));
        const sessionData = {
            filename: appState.animFilename,
            canvas_width: appState.animCanvasWidth,
            canvas_height: appState.animCanvasHeight,
            config: appState.animConfig,
            layers: lightweightLayers
        };
        localStorage.setItem('spritesplit_anim_session_meta', JSON.stringify(sessionData));
    } catch (e) {
    }
}

function restoreAnimSession() {
    try {
        const raw = localStorage.getItem('spritesplit_anim_session_meta');
        if (!raw) {
            alert('Không tìm thấy phiên làm việc trước đó trong bộ nhớ trình duyệt.');
            return;
        }
        const data = JSON.parse(raw);
        if (!data.layers || data.layers.length === 0) {
            alert('Phiên làm việc trước đó không có dữ liệu layer.');
            return;
        }

        const hasImages = appState.animLayers && Object.keys(appState.animImageCache || {}).length > 0;
        if (!hasImages) {
            alert('Phiên làm việc trước đó được lưu thông số, nhưng bộ nhớ ảnh đã bị xóa sau khi tải lại trang.\nVui lòng tải lại file PSD hoặc mở file .sps đã lưu để khôi phục đầy đủ cả ảnh!');
            return;
        }

        appState.animLayers = data.layers;
        if (data.config) {
            appState.animConfig = { ...appState.animConfig, ...data.config };
            syncAnimConfigControlsToUI();
        }
        renderAnimLayersList();
        populateAnimParentSelect();
        if (appState.animLayers.length > 0) {
            selectAnimLayer(appState.animLayers[0].id);
        }
        renderAnimStageFrame();
        alert('Đã khôi phục các thông số tâm neo & khớp nối gần nhất!');
    } catch (e) {
        alert('Không thể khôi phục: ' + e.message);
    }
}

function syncAnimConfigControlsToUI() {
    const cfg = appState.animConfig;
    if (!cfg) return;
    const sliderSpeed = document.getElementById('sliderAnimSpeed');
    const valSpeed = document.getElementById('valAnimSpeed');
    if (sliderSpeed && cfg.speed !== undefined) {
        sliderSpeed.value = cfg.speed;
        if (valSpeed) valSpeed.textContent = `${parseFloat(cfg.speed).toFixed(1)}x`;
    }
    const sliderIntensity = document.getElementById('sliderAnimIntensity');
    const valIntensity = document.getElementById('valAnimIntensity');
    if (sliderIntensity && cfg.intensity !== undefined) {
        sliderIntensity.value = cfg.intensity;
        if (valIntensity) valIntensity.textContent = `${Math.round(cfg.intensity * 100)}%`;
    }
    const checkBlink = document.getElementById('checkAnimAutoBlink');
    if (checkBlink && cfg.auto_blink !== undefined) checkBlink.checked = !!cfg.auto_blink;
    const checkLip = document.getElementById('checkAnimLipSync');
    if (checkLip && cfg.lip_sync !== undefined) checkLip.checked = !!cfg.lip_sync;
    const checkSway = document.getElementById('checkAnimHeadSway');
    if (checkSway && cfg.head_sway !== undefined) checkSway.checked = !!cfg.head_sway;
    const sliderSwayAmp = document.getElementById('sliderAnimHeadSwayAmp');
    const valSwayAmp = document.getElementById('valAnimHeadSwayAmp');
    if (sliderSwayAmp && cfg.head_sway_amp !== undefined) {
        sliderSwayAmp.value = cfg.head_sway_amp;
        if (valSwayAmp) valSwayAmp.textContent = `${parseFloat(cfg.head_sway_amp).toFixed(1)}°`;
    }
}

function setupAnimViewEvents() {
    const btnSaveAnimProject = document.getElementById('btnSaveAnimProject');
    const btnOpenAnimProject = document.getElementById('btnOpenAnimProject');
    const fileInputAnimProject = document.getElementById('fileInputAnimProject');
    const btnRestoreAnimSession = document.getElementById('btnRestoreAnimSession');

    if (btnSaveAnimProject) {
        btnSaveAnimProject.addEventListener('click', () => saveAnimProjectToFile());
    }
    if (btnOpenAnimProject && fileInputAnimProject) {
        btnOpenAnimProject.addEventListener('click', () => fileInputAnimProject.click());
        fileInputAnimProject.addEventListener('change', (e) => {
            if (e.target.files.length > 0) openAnimProjectFromFile(e.target.files[0]);
        });
    }
    if (btnRestoreAnimSession) {
        btnRestoreAnimSession.addEventListener('click', () => restoreAnimSession());
    }

    const dropzoneAnim = document.getElementById('dropzoneAnim');
    const fileInputAnim = document.getElementById('fileInputAnim');
    const btnImportFromTab3 = document.getElementById('btnImportFromTab3');
    const btnSnapExpressions = document.getElementById('btnSnapExpressions');
    const btnSpreadLayers = document.getElementById('btnSpreadLayers');
    const btnAutoAssembleRig = document.getElementById('btnAutoAssembleRig');
    const btnResetOriginalLayout = document.getElementById('btnResetOriginalLayout');

    const selectAnimLayerRole = document.getElementById('selectAnimLayerRole');
    const selectAnimLayerParent = document.getElementById('selectAnimLayerParent');
    const sliderTestPivotRot = document.getElementById('sliderTestPivotRot');
    const valTestPivotRot = document.getElementById('valTestPivotRot');
    const btnResetTestRot = document.getElementById('btnResetTestRot');

    const sliderLayerScale = document.getElementById('sliderLayerScale');
    const valLayerScale = document.getElementById('valLayerScale');
    const btnResetLayerScale = document.getElementById('btnResetLayerScale');

    const sliderLayerSwing = document.getElementById('sliderLayerSwing');
    const valLayerSwing = document.getElementById('valLayerSwing');
    const sliderLayerMoveY = document.getElementById('sliderLayerMoveY');
    const sliderLayerMoveX = document.getElementById('sliderLayerMoveX');
    const valLayerMoveY = document.getElementById('valLayerMoveY');
    const btnResetLayerMotion = document.getElementById('btnResetLayerMotion');

    const toggleAnimBlink = document.getElementById('toggleAnimBlink');
    const toggleAnimLipSync = document.getElementById('toggleAnimLipSync');
    const toggleAnimHeadSway = document.getElementById('toggleAnimHeadSway');
    const sliderAnimSpeed = document.getElementById('sliderAnimSpeed');
    const valAnimSpeed = document.getElementById('valAnimSpeed');
    const sliderAnimIntensity = document.getElementById('sliderAnimIntensity');
    const valAnimIntensity = document.getElementById('valAnimIntensity');
    const selectAnimDuration = document.getElementById('selectAnimDuration');
    const selectAnimFps = document.getElementById('selectAnimFps');

    const btnAnimShowAll = document.getElementById('btnAnimShowAll');
    const btnAnimHideAll = document.getElementById('btnAnimHideAll');
    const btnAnimModeRig = document.getElementById('btnAnimModeRig');
    const btnAnimModePlay = document.getElementById('btnAnimModePlay');
    const btnClickToSetPivot = document.getElementById('btnClickToSetPivot');
    const valClickPivotState = document.getElementById('valClickPivotState');
    const checkShowPivots = document.getElementById('checkShowPivots');

    const btnAnimPlayToggle = document.getElementById('btnAnimPlayToggle');
    const sliderAnimTimeline = document.getElementById('sliderAnimTimeline');
    const btnAnimZoomIn = document.getElementById('btnAnimZoomIn');
    const btnAnimZoomOut = document.getElementById('btnAnimZoomOut');
    const btnAnimZoomReset = document.getElementById('btnAnimZoomReset');
    const btnExportAnim = document.getElementById('btnExportAnim');

    if (!dropzoneAnim) return;

    // 1. Upload PSD
    dropzoneAnim.addEventListener('click', () => fileInputAnim.click());
    fileInputAnim.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            uploadAnimPsdFile(e.target.files[0]);
        }
    });
    dropzoneAnim.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneAnim.classList.add('drag-over');
    });
    dropzoneAnim.addEventListener('dragleave', () => {
        dropzoneAnim.classList.remove('drag-over');
    });
    dropzoneAnim.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneAnim.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadAnimPsdFile(e.dataTransfer.files[0]);
        }
    });

    // 2. Quick Import from Tab 3 & Rigging Helpers
    btnImportFromTab3.addEventListener('click', importPsdFromTab3ToAnim);
    btnSnapExpressions.addEventListener('click', snapFacialExpressionsToMain);
    if (btnSpreadLayers) btnSpreadLayers.addEventListener('click', spreadAnimLayersGrid);
    btnAutoAssembleRig.addEventListener('click', autoAssembleCharacterRig);
    btnResetOriginalLayout.addEventListener('click', resetToOriginalPsdLayout);

    window.addEventListener('resize', () => {
        if (appState.currentTab === 'anim') {
            renderAnimStageFrame();
        }
    });

    // 3. Role & Parent Change
    selectAnimLayerRole.addEventListener('change', () => {
        const lyr = getSelectedAnimLayer();
        if (!lyr) return;
        lyr.role = selectAnimLayerRole.value;
        lyr.funny_name = ROLE_TO_FUNNY_NAME_JS[lyr.role] || '';
        const defPiv = getDefaultPivotForRoleJS(lyr.role, lyr.w, lyr.h);
        lyr.pivot_x = defPiv.px;
        lyr.pivot_y = defPiv.py;
        updateSelectedAnimLayerUI();
        updateFunnyNameCheckUI();
        renderAnimLayersList();
        renderAnimStageFrame();
    });

    selectAnimLayerParent.addEventListener('change', () => {
        const lyr = getSelectedAnimLayer();
        if (!lyr) return;
        const val = selectAnimLayerParent.value;
        lyr.parent_id = val ? parseInt(val, 10) : null;
        renderAnimStageFrame();
    });

    // 4. 9-Point Quick Pivot Buttons
    document.querySelectorAll('.pivot-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lyr = getSelectedAnimLayer();
            if (!lyr) {
                alert('Hãy click chọn 1 bộ phận trước khi đặt nhanh vị trí Pivot!');
                return;
            }
            const fx = parseFloat(btn.dataset.px || '0.5');
            const fy = parseFloat(btn.dataset.py || '0.5');
            lyr.pivot_x = Math.round(lyr.w * fx);
            lyr.pivot_y = Math.round(lyr.h * fy);
            updateSelectedAnimLayerUI();
            renderAnimStageFrame();
        });
    });

    // 5. Test Pivot Rotation Slider
    sliderTestPivotRot.addEventListener('input', () => {
        appState.testPivotRotation = parseFloat(sliderTestPivotRot.value) || 0;
        valTestPivotRot.textContent = `${appState.testPivotRotation}°`;
        if (appState.animStageMode !== 'rig') {
            setAnimStageMode('rig');
        } else {
            renderAnimStageFrame();
        }
    });

    btnResetTestRot.addEventListener('click', () => {
        // appState.testPivotRotation = 0; (Persist rotation)
        sliderTestPivotRot.value = 0;
        valTestPivotRot.textContent = '0°';
        renderAnimStageFrame();
    });

    // 6. Per-Layer Motion Sliders
    sliderLayerSwing.addEventListener('input', () => {
        const lyr = getSelectedAnimLayer();
        if (!lyr) return;
        if (!lyr.motion) lyr.motion = {};
        lyr.motion.swing_rot = parseFloat(sliderLayerSwing.value) || 0;
        valLayerSwing.textContent = `${lyr.motion.swing_rot}°`;
        renderAnimStageFrame();
    });

    const updateMoveSliders = () => {
        const lyr = getSelectedAnimLayer();
        if (!lyr) return;
        if (!lyr.motion) lyr.motion = {};
        lyr.motion.move_y = parseFloat(sliderLayerMoveY.value) || 0;
        lyr.motion.move_x = parseFloat(sliderLayerMoveX.value) || 0;
        valLayerMoveY.textContent = `Y:${lyr.motion.move_y} / X:${lyr.motion.move_x}px`;
        renderAnimStageFrame();
    };
    sliderLayerMoveY.addEventListener('input', updateMoveSliders);
    sliderLayerMoveX.addEventListener('input', updateMoveSliders);

    btnResetLayerMotion.addEventListener('click', () => {
        const lyr = getSelectedAnimLayer();
        if (!lyr) return;
        lyr.motion = {
            base_rot: 0,
            swing_rot: 0,
            speed_mult: 1.0,
            phase_deg: 0,
            move_x: 0,
            move_y: 0,
            scale_x: 1.0,
            scale_y: 1.0
        };
        updateSelectedAnimLayerUI();
        renderAnimStageFrame();
    });

    // 7a. Category Filter Tabs for 18 Preset Animations
    document.querySelectorAll('#animPresetCategoryTabs .preset-cat-pill').forEach(catBtn => {
        catBtn.addEventListener('click', () => {
            document.querySelectorAll('#animPresetCategoryTabs .preset-cat-pill').forEach(b => {
                b.classList.remove('active');
                b.style.background = '#f8fafc';
                b.style.color = '#475569';
                b.style.borderColor = '#e2e8f0';
                b.style.fontWeight = '400';
            });
            catBtn.classList.add('active');
            catBtn.style.background = '#fff7ed';
            catBtn.style.color = '#c2410c';
            catBtn.style.borderColor = '#fdba74';
            catBtn.style.fontWeight = '600';

            const cat = catBtn.dataset.cat || 'all';
            document.querySelectorAll('#animPresetGrid .anim-preset-btn').forEach(btn => {
                const btnCat = btn.dataset.cat || 'all';
                if (cat === 'all' || btnCat === cat || btnCat === 'all') {
                    btn.style.display = 'flex';
                } else {
                    btn.style.display = 'none';
                }
            });
        });
    });

    // 7b. Animation Presets & Global Controls
    document.querySelectorAll('#animPresetGrid .anim-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#animPresetGrid .anim-preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const preset = btn.dataset.preset || 'idle';
            appState.animConfig.preset = preset;

            if (preset === 'talk') {
                appState.animConfig.lip_sync = true;
                toggleAnimLipSync.checked = true;
            } else {
                if (!toggleAnimLipSync.dataset.userManualChecked) {
                    appState.animConfig.lip_sync = false;
                    toggleAnimLipSync.checked = false;
                }
            }
            setAnimStageMode('play');
        });
    });

    toggleAnimBlink.addEventListener('change', () => {
        appState.animConfig.auto_blink = toggleAnimBlink.checked;
        renderAnimStageFrame();
    });

    toggleAnimLipSync.addEventListener('change', () => {
        appState.animConfig.lip_sync = toggleAnimLipSync.checked;
        toggleAnimLipSync.dataset.userManualChecked = toggleAnimLipSync.checked ? 'true' : '';
        renderAnimStageFrame();
    });

    toggleAnimHeadSway.addEventListener('change', () => {
        appState.animConfig.head_sway = toggleAnimHeadSway.checked;
        renderAnimStageFrame();
    });

    sliderAnimSpeed.addEventListener('input', () => {
        appState.animConfig.speed = parseFloat(sliderAnimSpeed.value) || 1.0;
        valAnimSpeed.textContent = `${appState.animConfig.speed.toFixed(1)}x`;
    });

    sliderAnimIntensity.addEventListener('input', () => {
        appState.animConfig.intensity = parseFloat(sliderAnimIntensity.value) || 1.0;
        valAnimIntensity.textContent = `${appState.animConfig.intensity.toFixed(1)}x`;
        renderAnimStageFrame();
    });

    selectAnimDuration.addEventListener('change', () => {
        const dur = parseFloat(selectAnimDuration.value) || 3.0;
        appState.animConfig.duration = dur;
        sliderAnimTimeline.max = dur;
        updateTimelineLabel();
    });

    selectAnimFps.addEventListener('change', () => {
        appState.animConfig.fps = parseInt(selectAnimFps.value, 10) || 24;
        updateTimelineLabel();
    });

    // 8. Show / Hide / Delete Layers
    btnAnimShowAll.addEventListener('click', () => {
        appState.animLayers.forEach(l => l.visible = true);
        updateFunnyNameCheckUI();
        renderAnimLayersList();
        updateAnimActiveCount();
        renderAnimStageFrame();
    });

    btnAnimHideAll.addEventListener('click', () => {
        appState.animLayers.forEach(l => l.visible = false);
        updateFunnyNameCheckUI();
        renderAnimLayersList();
        updateAnimActiveCount();
        renderAnimStageFrame();
    });

    const btnAnimDeleteSelected = document.getElementById('btnAnimDeleteSelected');
    if (btnAnimDeleteSelected) {
        btnAnimDeleteSelected.addEventListener('click', () => {
            if (appState.selectedAnimId) {
                deleteAnimLayer(appState.selectedAnimId);
            }
        });
    }

    const btnAnimDuplicateSelected = document.getElementById('btnAnimDuplicateSelected');
    if (btnAnimDuplicateSelected) {
        btnAnimDuplicateSelected.addEventListener('click', () => {
            if (appState.selectedAnimId) {
                duplicateAnimLayer(appState.selectedAnimId);
            }
        });
    }

    if (sliderLayerScale) {
        sliderLayerScale.addEventListener('input', () => {
            const lyr = getSelectedAnimLayer();
            if (!lyr) return;
            const sc = parseFloat(sliderLayerScale.value) || 1.0;
            if (!lyr.motion) lyr.motion = {};
            lyr.scale = sc;
            lyr.motion.scale_x = sc;
            lyr.motion.scale_y = sc;
            if (valLayerScale) valLayerScale.textContent = `${sc.toFixed(2)}x`;
            renderAnimStageFrame();
        });
    }

    if (btnResetLayerScale) {
        btnResetLayerScale.addEventListener('click', () => {
            const lyr = getSelectedAnimLayer();
            if (!lyr) return;
            lyr.scale = 1.0;
            if (!lyr.motion) lyr.motion = {};
            lyr.motion.scale_x = 1.0;
            lyr.motion.scale_y = 1.0;
            if (sliderLayerScale) sliderLayerScale.value = 1.0;
            if (valLayerScale) valLayerScale.textContent = '1.00x';
            renderAnimStageFrame();
        });
    }

    const btnAnimDeleteHidden = document.getElementById('btnAnimDeleteHidden');
    if (btnAnimDeleteHidden) {
        btnAnimDeleteHidden.addEventListener('click', () => {
            deleteHiddenAnimLayers();
        });
    }

    const btnAnimUndoDelete = document.getElementById('btnAnimUndoDelete');
    if (btnAnimUndoDelete) {
        btnAnimUndoDelete.addEventListener('click', () => {
            undoDeleteAnimLayer();
        });
    }

    // 9. Stage Mode Switch (Setup Rig vs Play Animation)
    btnAnimModeRig.addEventListener('click', () => setAnimStageMode('rig'));
    btnAnimModePlay.addEventListener('click', () => setAnimStageMode('play'));

    btnClickToSetPivot.addEventListener('click', () => {
        appState.clickToSetPivot = !appState.clickToSetPivot;
        btnClickToSetPivot.classList.toggle('active', appState.clickToSetPivot);
        valClickPivotState.textContent = appState.clickToSetPivot ? 'BẬT' : 'TẮT';
    });

    checkShowPivots.addEventListener('change', () => renderAnimStageFrame());

    // 10. Stage Background Mode
    document.querySelectorAll('.anim-stage-bg-pills .stage-bg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.anim-stage-bg-pills .stage-bg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const bg = btn.dataset.bg || 'checker';
            const vp = document.getElementById('animCanvasViewport');
            vp.classList.remove('stage-bg-dark', 'stage-bg-green', 'stage-bg-white');
            if (bg !== 'checker') {
                vp.classList.add(`stage-bg-${bg}`);
            }
            appState.animConfig.export_bg = (bg === 'checker') ? 'dark' : bg;
            renderAnimStageFrame();
        });
    });

    // 11. Timeline Play/Pause & Scrubber
    btnAnimPlayToggle.addEventListener('click', () => {
        if (appState.animIsPlaying) {
            stopAnimLoop();
        } else {
            setAnimStageMode('play');
        }
    });

    sliderAnimTimeline.addEventListener('input', () => {
        stopAnimLoop();
        appState.animCurrentTime = parseFloat(sliderAnimTimeline.value) || 0;
        updateTimelineLabel();
        renderAnimStageFrame();
    });

    // 12. Zoom & Canvas Mouse Interactions
    btnAnimZoomIn.addEventListener('click', () => zoomAnimAtCenter(1.25));
    btnAnimZoomOut.addEventListener('click', () => zoomAnimAtCenter(0.8));
    btnAnimZoomReset.addEventListener('click', () => fitAnimCanvas());

    setupAnimStageMouseInteractions();

    // 13. Export Animation Button
    btnExportAnim.addEventListener('click', handleExportCharacterAnimation);
}

function getDefaultPivotForRoleJS(role, w, h) {
    w = Math.max(1, w);
    h = Math.max(1, h);
    if (role === 'head' || role === 'face') return { px: Math.round(w * 0.5), py: Math.round(h * 0.88) };
    if (role === 'body') return { px: Math.round(w * 0.5), py: Math.round(h * 0.82) };
    if (role === 'arm_left' || role === 'arm_upper_left') return { px: Math.round(w * 0.72), py: Math.round(h * 0.14) };
    if (role === 'arm_lower_left') return { px: Math.round(w * 0.62), py: Math.round(h * 0.12) };
    if (role === 'arm_right' || role === 'arm_upper_right') return { px: Math.round(w * 0.28), py: Math.round(h * 0.14) };
    if (role === 'arm_lower_right') return { px: Math.round(w * 0.38), py: Math.round(h * 0.12) };
    if (['leg_left', 'leg_right', 'leg_thigh_left', 'leg_thigh_right', 'leg_calf_left', 'leg_calf_right'].includes(role)) {
        return { px: Math.round(w * 0.5), py: Math.round(h * 0.12) };
    }
    if (role === 'hair') return { px: Math.round(w * 0.5), py: Math.round(h * 0.25) };
    return { px: Math.round(w * 0.5), py: Math.round(h * 0.5) };
}

function updateFunnyNameCheckUI() {
    const box = document.getElementById('funnyNameCheckBox');
    const txt = document.getElementById('funnyNameCheckText');
    if (!box || !txt) return;

    const visLayers = (appState.animLayers || []).filter(l => l.visible);
    if (visLayers.length === 0) {
        txt.innerHTML = 'Chưa có bộ phận nào đang bật.';
        return;
    }

    const matchedNames = new Set();
    visLayers.forEach(l => {
        const fn = ROLE_TO_FUNNY_NAME_JS[l.role];
        if (fn) matchedNames.add(fn);
        if (['mouth_closed', 'eye_open'].includes(l.role)) matchedNames.add('Expression');
    });

    const list = Array.from(matchedNames);
    if (list.length > 0) {
        box.style.background = '#f0fdf4';
        box.style.borderColor = '#bbf7d0';
        box.style.color = '#166534';
        txt.innerHTML = `Đã khớp <strong>${list.length} tên chuẩn</strong> (<code>${list.join('</code>, <code>')}</code>) • Sẵn sàng xuất <code>.anime</code> & <code>.paulto</code>!`;
    } else {
        box.style.background = '#fffbeb';
        box.style.borderColor = '#fde68a';
        box.style.color = '#92400e';
        txt.innerHTML = 'Hãy chọn vai trò (Thân, Đầu, Tay, Chân...) cho các layer để kích hoạt 18 Preset của Funny Animation.';
    }
}

function uploadAnimPsdFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.psd')) {
        alert('Vui lòng chọn file định dạng Photoshop (.psd)!');
        return;
    }
    const animStatusBadge = document.getElementById('animStatusBadge');
    const animCanvasStats = document.getElementById('animCanvasStats');
    animStatusBadge.textContent = 'Đang nạp...';
    animCanvasStats.textContent = 'Đang tách bộ phận & khởi tạo điểm neo Pivot...';

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload-anim-psd', {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error('Không thể đọc file PSD');
        return res.json();
    })
    .then(data => {
        loadAnimRigData(data);
    })
    .catch(err => {
        console.error(err);
        alert('Lỗi nạp file PSD: ' + err.message);
        animStatusBadge.textContent = 'Lỗi';
    });
}

function importPsdFromTab3ToAnim() {
    fetch('/api/import-from-inspect')
        .then(res => {
            if (!res.ok) throw new Error('Chưa có file PSD nào ở Tab 3. Hãy tải file PSD lên trước!');
            return res.json();
        })
        .then(data => {
            loadAnimRigData(data);
        })
        .catch(err => {
            alert(err.message);
        });
}

function loadAnimRigData(data) {
    stopAnimLoop();
    appState.animWidth = data.width || 2000;
    appState.animHeight = data.height || 1600;
    appState.animFilename = data.filename || 'character.psd';
    appState.animLayers = (data.layers || []).map((l, idx) => ({
        ...l,
        pos_x: (l.pos_x !== undefined) ? l.pos_x : l.x,
        pos_y: (l.pos_y !== undefined) ? l.pos_y : l.y,
        z_index: (l.z_index !== undefined) ? l.z_index : idx,
        motion: l.motion || {
            base_rot: 0,
            swing_rot: 0,
            speed_mult: 1.0,
            phase_deg: 0,
            move_x: 0,
            move_y: 0,
            scale_x: 1.0,
            scale_y: 1.0
        }
    }));

    appState.animDeletedHistory = [];
    appState.animInitialLayersSnapshot = JSON.parse(JSON.stringify(appState.animLayers));
    updateAnimUndoDeleteBtn();

    document.getElementById('animStatusBadge').textContent = `${appState.animLayers.length} layer`;
    document.getElementById('animLayersCountBadge').textContent = `${appState.animLayers.length} layer`;
    document.getElementById('animEmptyPlaceholder').style.display = appState.animLayers.length ? 'none' : 'block';

    appState.animImageCache = {};
    appState.animAlphaCanvases = {};
    let loadedCount = 0;

    appState.animLayers.forEach(lyr => {
        const img = new Image();
        img.onload = () => {
            appState.animImageCache[lyr.id] = img;
            const off = document.createElement('canvas');
            off.width = Math.max(1, lyr.w);
            off.height = Math.max(1, lyr.h);
            const octx = off.getContext('2d', { willReadFrequently: true });
            octx.drawImage(img, 0, 0);
            appState.animAlphaCanvases[lyr.id] = octx;

            loadedCount++;
            if (loadedCount === appState.animLayers.length) {
                fitAnimCanvas();
                renderAnimStageFrame();
            }
        };
        img.src = lyr.image;
    });

    if (appState.animLayers.length > 0) {
        appState.selectedAnimId = appState.animLayers[0].id;
    } else {
        appState.selectedAnimId = null;
    }

    populateParentSelectDropdown();
    updateSelectedAnimLayerUI();
    updateFunnyNameCheckUI();
    renderAnimLayersList();
    updateAnimActiveCount();

    const statsEl = document.getElementById('animCanvasStats');
    if (statsEl) {
        statsEl.textContent = `Đã nạp ${appState.animLayers.length} bộ phận • Sân khấu 2D không giới hạn`;
    }

    requestAnimationFrame(() => {
        fitAnimCanvas();
        renderAnimStageFrame();
    });
}

function getSelectedAnimLayer() {
    if (!appState.selectedAnimId) return null;
    return appState.animLayers.find(l => l.id === appState.selectedAnimId) || null;
}

function selectAnimLayer(id) {
    appState.selectedAnimId = id;
    // appState.testPivotRotation = 0; (Persist rotation)
    const sliderTestPivotRot = document.getElementById('sliderTestPivotRot');
    const valTestPivotRot = document.getElementById('valTestPivotRot');
    if (sliderTestPivotRot) sliderTestPivotRot.value = 0;
    if (valTestPivotRot) valTestPivotRot.textContent = '0°';

    populateParentSelectDropdown();
    updateSelectedAnimLayerUI();
    renderAnimLayersList();
    renderAnimStageFrame();
}

function populateParentSelectDropdown() {
    const selectParent = document.getElementById('selectAnimLayerParent');
    if (!selectParent) return;
    const currentLyr = getSelectedAnimLayer();
    selectParent.innerHTML = '<option value="">-- Độc lập (Không gắn khớp cha) --</option>';
    if (!currentLyr) return;

    appState.animLayers.forEach(l => {
        if (l.id === currentLyr.id) return;
        const opt = document.createElement('option');
        opt.value = String(l.id);
        opt.textContent = `${l.name} (${ROLE_LABELS_VI[l.role] || l.role})`;
        if (currentLyr.parent_id === l.id) {
            opt.selected = true;
        }
        selectParent.appendChild(opt);
    });
}

function updateSelectedAnimLayerUI() {
    const lyr = getSelectedAnimLayer();
    const badge = document.getElementById('animSelectedLayerBadge');
    const box = document.getElementById('animTargetLayerBox');
    const nameEl = document.getElementById('animTargetLayerName');
    const roleSelect = document.getElementById('selectAnimLayerRole');
    const parentSelect = document.getElementById('selectAnimLayerParent');
    const valPivotCoords = document.getElementById('valPivotCoords');

    const sliderLayerSwing = document.getElementById('sliderLayerSwing');
    const valLayerSwing = document.getElementById('valLayerSwing');
    const sliderLayerMoveY = document.getElementById('sliderLayerMoveY');
    const sliderLayerMoveX = document.getElementById('sliderLayerMoveX');
    const valLayerMoveY = document.getElementById('valLayerMoveY');
    const sliderLayerScale = document.getElementById('sliderLayerScale');
    const valLayerScale = document.getElementById('valLayerScale');

    const btnDelSelected = document.getElementById('btnAnimDeleteSelected');
    const btnDupSelected = document.getElementById('btnAnimDuplicateSelected');

    if (!lyr) {
        if (badge) badge.textContent = 'Chưa chọn';
        if (box) box.classList.remove('has-target');
        if (nameEl) nameEl.textContent = 'Click chọn bộ phận trên màn hình hoặc danh sách';
        if (valPivotCoords) valPivotCoords.textContent = 'Pivot: (0, 0)';
        if (btnDelSelected) btnDelSelected.style.display = 'none';
        if (btnDupSelected) btnDupSelected.style.display = 'none';
        return;
    }

    if (btnDelSelected) btnDelSelected.style.display = 'inline-block';
    if (btnDupSelected) btnDupSelected.style.display = 'inline-block';

    if (badge) {
        badge.textContent = lyr.name;
        badge.style.background = '#fff7ed';
        badge.style.color = '#c2410c';
    }
    if (box) box.classList.add('has-target');
    const stdTag = ROLE_TO_FUNNY_NAME_JS[lyr.role] ? ` <span style="color:#15803d; font-weight:700;">[${ROLE_TO_FUNNY_NAME_JS[lyr.role]}]</span>` : '';
    if (nameEl) {
        nameEl.innerHTML = `Đang chỉnh: <strong>${lyr.name}</strong>${stdTag}`;
    }
    if (roleSelect) roleSelect.value = lyr.role || 'custom';
    if (parentSelect) parentSelect.value = lyr.parent_id ? String(lyr.parent_id) : '';
    if (valPivotCoords) {
        valPivotCoords.textContent = `Pivot: (${Math.round(lyr.pivot_x)}, ${Math.round(lyr.pivot_y)}) px`;
    }

    const m = lyr.motion || {};
    const lyrScale = (lyr.scale !== undefined) ? lyr.scale : (m.scale_x !== undefined ? m.scale_x : 1.0);
    if (sliderLayerScale) sliderLayerScale.value = lyrScale;
    if (valLayerScale) valLayerScale.textContent = `${parseFloat(lyrScale).toFixed(2)}x`;

    if (sliderLayerSwing) sliderLayerSwing.value = m.swing_rot || 0;
    if (valLayerSwing) valLayerSwing.textContent = `${m.swing_rot || 0}°`;
    if (sliderLayerMoveY) sliderLayerMoveY.value = m.move_y || 0;
    if (sliderLayerMoveX) sliderLayerMoveX.value = m.move_x || 0;
    if (valLayerMoveY) valLayerMoveY.textContent = `Y:${m.move_y || 0} / X:${m.move_x || 0}px`;

    const sliderRot = document.getElementById('sliderAnimLayerRotation');
    const valRot = document.getElementById('valAnimLayerRotation');
    const curRot = lyr.rotation || 0;
    if (sliderRot) sliderRot.value = Math.round(curRot);
    if (valRot) valRot.textContent = `${Math.round(curRot)}°`;

    const btnFlipH = document.getElementById('btnAnimFlipH');
    const btnFlipV = document.getElementById('btnAnimFlipV');
    if (btnFlipH) btnFlipH.classList.toggle('active', !!lyr.flip_x);
    if (btnFlipV) btnFlipV.classList.toggle('active', !!lyr.flip_y);
}

function renderAnimLayersList() {
    const listEl = document.getElementById('animLayersList');
    const emptyEl = document.getElementById('animEmptyPlaceholder');
    if (!listEl) return;

    listEl.innerHTML = '';
    if (!appState.animLayers || appState.animLayers.length === 0) {
        if (emptyEl) {
            emptyEl.style.display = 'block';
            listEl.appendChild(emptyEl);
        }
        return;
    }

    const sortedDesc = [...appState.animLayers].sort((a, b) => (b.z_index || 0) - (a.z_index || 0));

    sortedDesc.forEach(lyr => {
        const item = document.createElement('div');
        const isSelected = (appState.selectedAnimId === lyr.id);
        item.className = 'inspect-layer-item' + (lyr.visible ? '' : ' hidden-layer') + (isSelected ? ' active-selected' : '');

        item.addEventListener('click', () => {
            selectAnimLayer(lyr.id);
        });

        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'btn-layer-eye';
        eyeBtn.title = lyr.visible ? 'Ẩn layer này' : 'Hiện layer này';
        eyeBtn.innerHTML = lyr.visible
            ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
            : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

        eyeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            lyr.visible = !lyr.visible;
            updateFunnyNameCheckUI();
            renderAnimLayersList();
            updateAnimActiveCount();
            renderAnimStageFrame();
        });

        const thumb = document.createElement('img');
        thumb.className = 'inspect-layer-thumb';
        thumb.src = lyr.image;
        thumb.alt = lyr.name;

        const meta = document.createElement('div');
        meta.className = 'inspect-layer-meta';
        const title = document.createElement('div');
        title.className = 'inspect-layer-title';
        title.textContent = lyr.name;
        const sub = document.createElement('div');
        sub.innerHTML = `<span class="anim-role-tag">${ROLE_LABELS_VI[lyr.role] || lyr.role}</span> <span style="font-size:10.5px; color:var(--text-muted);">Pivot:(${Math.round(lyr.pivot_x)},${Math.round(lyr.pivot_y)})</span>`;
        meta.appendChild(title);
        meta.appendChild(sub);

        const zBtns = document.createElement('div');
        zBtns.className = 'anim-z-btns';
        const btnUp = document.createElement('button');
        btnUp.className = 'btn-layer-z';
        btnUp.textContent = '▲';
        btnUp.title = 'Đưa layer lên trên 1 lớp';
        btnUp.addEventListener('click', (e) => {
            e.stopPropagation();
            moveAnimLayerZOrder(lyr.id, 1);
        });

        const btnDown = document.createElement('button');
        btnDown.className = 'btn-layer-z';
        btnDown.textContent = '▼';
        btnDown.title = 'Hạ layer xuống dưới 1 lớp';
        btnDown.addEventListener('click', (e) => {
            e.stopPropagation();
            moveAnimLayerZOrder(lyr.id, -1);
        });

        const btnDup = document.createElement('button');
        btnDup.className = 'btn-layer-z';
        btnDup.textContent = '📋';
        btnDup.title = 'Nhân bản (Duplicate) layer này';
        btnDup.style.color = '#15803d';
        btnDup.style.borderColor = '#bbf7d0';
        btnDup.style.background = '#f0fdf4';
        btnDup.addEventListener('click', (e) => {
            e.stopPropagation();
            duplicateAnimLayer(lyr.id);
        });

        const btnDel = document.createElement('button');
        btnDel.className = 'btn-layer-z';
        btnDel.textContent = '🗑️';
        btnDel.title = 'Xóa bỏ layer không sử dụng này khỏi dự án';
        btnDel.style.color = '#dc2626';
        btnDel.style.borderColor = '#fecaca';
        btnDel.style.background = '#fef2f2';
        btnDel.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteAnimLayer(lyr.id);
        });

        zBtns.appendChild(btnUp);
        zBtns.appendChild(btnDown);
        zBtns.appendChild(btnDup);
        zBtns.appendChild(btnDel);

        item.appendChild(eyeBtn);
        item.appendChild(thumb);
        item.appendChild(meta);
        item.appendChild(zBtns);
        listEl.appendChild(item);
    });
}

function moveAnimLayerZOrder(id, dir) {
    const sorted = [...appState.animLayers].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));
    sorted.forEach((l, i) => l.z_index = i);
    const idx = sorted.findIndex(l => l.id === id);
    if (idx === -1) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const tmp = sorted[idx].z_index;
    sorted[idx].z_index = sorted[swapIdx].z_index;
    sorted[swapIdx].z_index = tmp;
    renderAnimLayersList();
    renderAnimStageFrame();
}

function updateAnimActiveCount() {
    const el = document.getElementById('valAnimActiveCount');
    if (!el) return;
    const cnt = appState.animLayers.filter(l => l.visible).length;
    el.textContent = `${cnt} layer`;
}

function pushAnimDeleteHistory() {
    if (!appState.animDeletedHistory) appState.animDeletedHistory = [];
    appState.animDeletedHistory.push({
        layers: JSON.parse(JSON.stringify(appState.animLayers)),
        selectedId: appState.selectedAnimId
    });
    if (appState.animDeletedHistory.length > 25) {
        appState.animDeletedHistory.shift();
    }
    updateAnimUndoDeleteBtn();
}

function updateAnimUndoDeleteBtn() {
    const btn = document.getElementById('btnAnimUndoDelete');
    if (!btn) return;
    const count = (appState.animDeletedHistory || []).length;
    btn.disabled = count === 0;
    btn.textContent = count > 0 ? `↩️ Khôi phục (${count})` : '↩️ Khôi phục';
}

function refreshAfterAnimLayerChange(statusMsg) {
    const total = appState.animLayers.length;
    const statusBadge = document.getElementById('animStatusBadge');
    const countBadge = document.getElementById('animLayersCountBadge');
    const emptyEl = document.getElementById('animEmptyPlaceholder');
    if (statusBadge) statusBadge.textContent = `${total} layer`;
    if (countBadge) countBadge.textContent = `${total} layer`;
    if (emptyEl) emptyEl.style.display = total ? 'none' : 'block';

    populateParentSelectDropdown();
    updateSelectedAnimLayerUI();
    updateFunnyNameCheckUI();
    renderAnimLayersList();
    updateAnimActiveCount();
    renderAnimStageFrame();

    if (statusMsg) {
        const statsEl = document.getElementById('animCanvasStats');
        if (statsEl) statsEl.textContent = statusMsg;
    }
}

function duplicateAnimLayer(id) {
    const src = (appState.animLayers || []).find(l => l.id === id);
    if (!src) return;

    pushAnimDeleteHistory();

    // Generate new unique ID
    const maxId = appState.animLayers.reduce((max, l) => Math.max(max, l.id || 0), 0);
    const newId = maxId + 1;

    // Determine default role & name for the duplicate
    let newName = src.name + '_copy';
    let newRole = src.role || 'custom';
    if (src.role === 'arm_left') {
        newRole = 'arm_right';
        newName = src.name.replace(/left|trái/i, 'phải') || (src.name + '_right');
    } else if (src.role === 'arm_right') {
        newRole = 'arm_left';
        newName = src.name.replace(/right|phải/i, 'trái') || (src.name + '_left');
    } else if (src.role === 'leg_left') {
        newRole = 'leg_right';
        newName = src.name.replace(/left|trái/i, 'phải') || (src.name + '_right');
    } else if (src.role === 'leg_right') {
        newRole = 'leg_left';
        newName = src.name.replace(/right|phải/i, 'trái') || (src.name + '_left');
    }

    const newLayer = {
        ...JSON.parse(JSON.stringify(src)),
        id: newId,
        name: newName,
        role: newRole,
        funny_name: ROLE_TO_FUNNY_NAME_JS[newRole] || '',
        pos_x: src.pos_x + 35,
        pos_y: src.pos_y + 20,
        z_index: (src.z_index || 0) + 1,
        visible: true
    };

    // Share image & alpha canvas in cache
    if (appState.animImageCache[src.id]) {
        appState.animImageCache[newId] = appState.animImageCache[src.id];
    }
    if (appState.animAlphaCanvases[src.id]) {
        appState.animAlphaCanvases[newId] = appState.animAlphaCanvases[src.id];
    }

    appState.animLayers.push(newLayer);
    selectAnimLayer(newId);
    refreshAfterAnimLayerChange(`📋 Đã nhân bản "${src.name}" thành "${newName}". Bạn có thể đổi vai trò (Role) hoặc kéo vị trí ngay.`);
}

function deleteAnimLayer(id) {
    const target = (appState.animLayers || []).find(l => l.id === id);
    if (!target) return;

    pushAnimDeleteHistory();

    const fallbackParentId = target.parent_id || null;
    appState.animLayers.forEach(l => {
        if (l.parent_id === id) {
            l.parent_id = (fallbackParentId !== l.id) ? fallbackParentId : null;
        }
    });

    appState.animLayers = appState.animLayers.filter(l => l.id !== id);

    if (appState.selectedAnimId === id) {
        const nextVis = appState.animLayers.find(l => l.visible) || appState.animLayers[0] || null;
        appState.selectedAnimId = nextVis ? nextVis.id : null;
    }

    refreshAfterAnimLayerChange(`🗑️ Đã xóa bỏ layer "${target.name}" • Còn lại ${appState.animLayers.length} layer (Bấm "↩️ Khôi phục" hoặc Ctrl+Z nếu xóa nhầm).`);
}

function deleteHiddenAnimLayers() {
    const hiddenLayers = (appState.animLayers || []).filter(l => !l.visible);
    if (hiddenLayers.length === 0) {
        alert('Hiện không có layer nào đang ẩn! Bạn có thể bấm biểu tượng con mắt 👁️ ở những layer không dùng rồi bấm nút này để xóa gọn.');
        return;
    }

    pushAnimDeleteHistory();

    const hiddenIds = new Set(hiddenLayers.map(l => l.id));
    appState.animLayers.forEach(l => {
        if (l.parent_id && hiddenIds.has(l.parent_id)) {
            l.parent_id = null;
        }
    });

    appState.animLayers = appState.animLayers.filter(l => l.visible);

    if (!appState.animLayers.some(l => l.id === appState.selectedAnimId)) {
        appState.selectedAnimId = appState.animLayers.length > 0 ? appState.animLayers[0].id : null;
    }

    refreshAfterAnimLayerChange(`🗑️ Đã xóa ${hiddenLayers.length} layer ẩn không sử dụng • Còn lại ${appState.animLayers.length} layer.`);
}

function undoDeleteAnimLayer() {
    if (!appState.animDeletedHistory || appState.animDeletedHistory.length === 0) return;
    const prev = appState.animDeletedHistory.pop();
    appState.animLayers = prev.layers;
    appState.selectedAnimId = prev.selectedId;
    updateAnimUndoDeleteBtn();
    refreshAfterAnimLayerChange(`↩️ Đã khôi phục lại layer vừa xóa • Hiện có ${appState.animLayers.length} layer.`);
}

// =========================================================
// SMART RIGGING HELPERS (SPREAD GRID, AUTO-ASSEMBLE, SNAP)
// =========================================================
function spreadAnimLayersGrid() {
    if (!appState.animLayers || appState.animLayers.length === 0) {
        alert('Chưa có layer nào! Hãy tải file PSD lên trước.');
        return;
    }
    stopAnimLoop();
    if (appState.animStageMode !== 'rig') setAnimStageMode('rig');

    const visibleLayers = appState.animLayers.filter(l => l.visible);
    const targets = visibleLayers.length > 0 ? visibleLayers : appState.animLayers;
    const count = targets.length;
    const cols = Math.max(2, Math.ceil(Math.sqrt(count * 1.3)));
    const gapX = 48;
    const gapY = 56;

    const roleOrder = {
        head: 1, face: 2, hair: 3, body: 4,
        arm_left: 5, arm_upper_left: 6, arm_lower_left: 7,
        arm_right: 8, arm_upper_right: 9, arm_lower_right: 10,
        leg_left: 11, leg_thigh_left: 12, leg_calf_left: 13,
        leg_right: 14, leg_thigh_right: 15, leg_calf_right: 16,
        expression: 17, eye_open: 18, eye_closed: 19, eye_extra: 20,
        mouth_closed: 21, mouth_half: 22, mouth_open: 23, mouth_extra: 24,
        head_prop: 25, custom: 26
    };
    const ordered = [...targets].sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));

    const startX = 200;
    let curY = 200;

    for (let r = 0; r < Math.ceil(ordered.length / cols); r++) {
        const rowItems = ordered.slice(r * cols, (r + 1) * cols);
        const rowMaxH = Math.max(...rowItems.map(item => item.h));
        let curX = startX;
        rowItems.forEach(item => {
            item.pos_x = Math.round(curX);
            item.pos_y = Math.round(curY + (rowMaxH - item.h) / 2);
            curX += item.w + gapX;
        });
        curY += rowMaxH + gapY;
    }

    updateSelectedAnimLayerUI();
    renderAnimLayersList();
    fitAnimCanvas();
    renderAnimStageFrame();
    const statsEl = document.getElementById('animCanvasStats');
    if (statsEl) {
        statsEl.textContent = '🧩 Đã dàn đều tất cả bộ phận thành lưới rõ ràng! Hãy kéo từng bộ phận để ghép hoặc chỉnh Pivot.';
    }
}

function snapFacialExpressionsToMain() {
    if (!appState.animLayers || appState.animLayers.length === 0) {
        alert('Chưa có layer nào! Hãy tải file PSD lên trước.');
        return;
    }

    const eyeLayers = appState.animLayers.filter(l => ['eye_open', 'eye_closed', 'eye_extra'].includes(l.role));
    const mainEye = eyeLayers.find(l => l.role === 'eye_open') || eyeLayers[0];
    if (mainEye) {
        const cx = mainEye.pos_x + mainEye.w / 2;
        const cy = mainEye.pos_y + mainEye.h / 2;
        eyeLayers.forEach(l => {
            if (l.id !== mainEye.id) {
                l.pos_x = Math.round(cx - l.w / 2);
                l.pos_y = Math.round(cy - l.h / 2);
            }
            l.pivot_x = Math.round(l.w / 2);
            l.pivot_y = Math.round(l.h / 2);
        });
    }

    const mouthLayers = appState.animLayers.filter(l => ['mouth_closed', 'mouth_half', 'mouth_open', 'mouth_extra'].includes(l.role));
    const mainMouth = mouthLayers.find(l => l.role === 'mouth_closed') || mouthLayers[0];
    if (mainMouth) {
        const cx = mainMouth.pos_x + mainMouth.w / 2;
        const cy = mainMouth.pos_y + mainMouth.h / 2;
        mouthLayers.forEach(l => {
            if (l.id !== mainMouth.id) {
                l.pos_x = Math.round(cx - l.w / 2);
                l.pos_y = Math.round(cy - l.h / 2);
            }
            l.pivot_x = Math.round(l.w / 2);
            l.pivot_y = Math.round(l.h / 2);
        });
    }

    updateSelectedAnimLayerUI();
    renderAnimLayersList();
    renderAnimStageFrame();
    document.getElementById('animCanvasStats').textContent = '✨ Đã căn trùng khít vị trí các biểu cảm Mắt & Miệng!';
}

function autoAssembleCharacterRig() {
    if (!appState.animLayers || appState.animLayers.length === 0) {
        alert('Chưa có layer nào! Hãy tải file PSD lên trước.');
        return;
    }

    const body = appState.animLayers.find(l => l.role === 'body');
    const head = appState.animLayers.find(l => l.role === 'head');
    if (!body && !head) {
        alert('Để tự động lắp ghép, hãy chọn ít nhất 1 layer có vai trò "Thân (Body)" hoặc "Đầu (Head)"!');
        return;
    }

    appState.animLayers.forEach(l => {
        const low = (l.name || '').toLowerCase();
        if (low.includes('mau') || low.includes('reference') || low.includes('full')) {
            if (l.role === 'custom') {
                l.visible = false;
            }
        }
    });

    const stageCx = 1000;
    const stageCy = 800;

    if (body) {
        body.pos_x = Math.round(stageCx - body.w / 2);
        body.pos_y = Math.round(stageCy - body.h * 0.35);
        body.pivot_x = Math.round(body.w * 0.5);
        body.pivot_y = Math.round(body.h * 0.82);
        body.z_index = 20;
    }

    if (head) {
        if (body) {
            head.pos_x = Math.round(body.pos_x + body.w / 2 - head.w / 2);
            head.pos_y = Math.round(body.pos_y - head.h + 16);
            head.parent_id = body.id;
        } else {
            head.pos_x = Math.round(stageCx - head.w / 2);
            head.pos_y = Math.round(stageCy - head.h / 2);
        }
        head.pivot_x = Math.round(head.w * 0.5);
        head.pivot_y = Math.round(head.h * 0.88);
        head.z_index = 30;
    }

    // Tay trái & Tay phải (Hỗ trợ cả 1 khớp và 2 khớp Upper / Lower Arm)
    const armL = appState.animLayers.find(l => l.role === 'arm_left');
    if (armL && body) {
        armL.pos_x = Math.round(body.pos_x - armL.w * 0.52);
        armL.pos_y = Math.round(body.pos_y + body.h * 0.04);
        armL.pivot_x = Math.round(armL.w * 0.75);
        armL.pivot_y = Math.round(armL.h * 0.14);
        armL.parent_id = body.id;
        armL.z_index = 15;
    }
    const upperArmL = appState.animLayers.find(l => l.role === 'arm_upper_left');
    const lowerArmL = appState.animLayers.find(l => l.role === 'arm_lower_left');
    if (upperArmL && body) {
        upperArmL.pos_x = Math.round(body.pos_x - upperArmL.w * 0.52);
        upperArmL.pos_y = Math.round(body.pos_y + body.h * 0.04);
        upperArmL.pivot_x = Math.round(upperArmL.w * 0.72);
        upperArmL.pivot_y = Math.round(upperArmL.h * 0.14);
        upperArmL.parent_id = body.id;
        upperArmL.z_index = 15;
        if (lowerArmL) {
            lowerArmL.pos_x = Math.round(upperArmL.pos_x);
            lowerArmL.pos_y = Math.round(upperArmL.pos_y + upperArmL.h * 0.82);
            lowerArmL.pivot_x = Math.round(lowerArmL.w * 0.62);
            lowerArmL.pivot_y = Math.round(lowerArmL.h * 0.12);
            lowerArmL.parent_id = upperArmL.id;
            lowerArmL.z_index = 16;
        }
    }

    const armR = appState.animLayers.find(l => l.role === 'arm_right');
    if (armR && body) {
        armR.pos_x = Math.round(body.pos_x + body.w - armR.w * 0.48);
        armR.pos_y = Math.round(body.pos_y + body.h * 0.04);
        armR.pivot_x = Math.round(armR.w * 0.25);
        armR.pivot_y = Math.round(armR.h * 0.14);
        armR.parent_id = body.id;
        armR.z_index = 25;
    }
    const upperArmR = appState.animLayers.find(l => l.role === 'arm_upper_right');
    const lowerArmR = appState.animLayers.find(l => l.role === 'arm_lower_right');
    if (upperArmR && body) {
        upperArmR.pos_x = Math.round(body.pos_x + body.w - upperArmR.w * 0.48);
        upperArmR.pos_y = Math.round(body.pos_y + body.h * 0.04);
        upperArmR.pivot_x = Math.round(upperArmR.w * 0.28);
        upperArmR.pivot_y = Math.round(upperArmR.h * 0.14);
        upperArmR.parent_id = body.id;
        upperArmR.z_index = 25;
        if (lowerArmR) {
            lowerArmR.pos_x = Math.round(upperArmR.pos_x);
            lowerArmR.pos_y = Math.round(upperArmR.pos_y + upperArmR.h * 0.82);
            lowerArmR.pivot_x = Math.round(lowerArmR.w * 0.38);
            lowerArmR.pivot_y = Math.round(lowerArmR.h * 0.12);
            lowerArmR.parent_id = upperArmR.id;
            lowerArmR.z_index = 26;
        }
    }

    // Chân trái & Chân phải (Hỗ trợ cả 1 khớp và 2 khớp Thigh / Calf)
    const legL = appState.animLayers.find(l => l.role === 'leg_left');
    const legR = appState.animLayers.find(l => l.role === 'leg_right');
    if (legL && !legR && body) {
        legL.pos_x = Math.round(body.pos_x + body.w * 0.5 - legL.w * 0.5);
        legL.pos_y = Math.round(body.pos_y + body.h - 14);
        legL.pivot_x = Math.round(legL.w * 0.5);
        legL.pivot_y = Math.round(legL.h * 0.12);
        legL.parent_id = body.id;
        legL.z_index = 10;
    } else {
        if (legL && body) {
            legL.pos_x = Math.round(body.pos_x + body.w * 0.28 - legL.w * 0.5);
            legL.pos_y = Math.round(body.pos_y + body.h - 14);
            legL.pivot_x = Math.round(legL.w * 0.5);
            legL.pivot_y = Math.round(legL.h * 0.12);
            legL.parent_id = body.id;
            legL.z_index = 10;
        }
        if (legR && body) {
            legR.pos_x = Math.round(body.pos_x + body.w * 0.72 - legR.w * 0.5);
            legR.pos_y = Math.round(body.pos_y + body.h - 14);
            legR.pivot_x = Math.round(legR.w * 0.5);
            legR.pivot_y = Math.round(legR.h * 0.12);
            legR.parent_id = body.id;
            legR.z_index = 11;
        }
    }

    const thighL = appState.animLayers.find(l => l.role === 'leg_thigh_left');
    const calfL = appState.animLayers.find(l => l.role === 'leg_calf_left');
    if (thighL && body) {
        thighL.pos_x = Math.round(body.pos_x + body.w * 0.28 - thighL.w * 0.5);
        thighL.pos_y = Math.round(body.pos_y + body.h - 14);
        thighL.pivot_x = Math.round(thighL.w * 0.5);
        thighL.pivot_y = Math.round(thighL.h * 0.12);
        thighL.parent_id = body.id;
        thighL.z_index = 10;
        if (calfL) {
            calfL.pos_x = Math.round(thighL.pos_x + thighL.w * 0.5 - calfL.w * 0.5);
            calfL.pos_y = Math.round(thighL.pos_y + thighL.h * 0.85);
            calfL.pivot_x = Math.round(calfL.w * 0.5);
            calfL.pivot_y = Math.round(calfL.h * 0.12);
            calfL.parent_id = thighL.id;
            calfL.z_index = 11;
        }
    }

    const thighR = appState.animLayers.find(l => l.role === 'leg_thigh_right');
    const calfR = appState.animLayers.find(l => l.role === 'leg_calf_right');
    if (thighR && body) {
        thighR.pos_x = Math.round(body.pos_x + body.w * 0.72 - thighR.w * 0.5);
        thighR.pos_y = Math.round(body.pos_y + body.h - 14);
        thighR.pivot_x = Math.round(thighR.w * 0.5);
        thighR.pivot_y = Math.round(thighR.h * 0.12);
        thighR.parent_id = body.id;
        thighR.z_index = 12;
        if (calfR) {
            calfR.pos_x = Math.round(thighR.pos_x + thighR.w * 0.5 - calfR.w * 0.5);
            calfR.pos_y = Math.round(thighR.pos_y + thighR.h * 0.85);
            calfR.pivot_x = Math.round(calfR.w * 0.5);
            calfR.pivot_y = Math.round(calfR.h * 0.12);
            calfR.parent_id = thighR.id;
            calfR.z_index = 13;
        }
    }

    // Mắt, Miệng, Khuôn mặt, Tóc, Phụ kiện mặt gắn lên Đầu
    if (head) {
        const faceCenterX = head.pos_x + head.w * 0.52;
        const eyeCenterY = head.pos_y + head.h * 0.55;
        const mouthCenterY = head.pos_y + head.h * 0.76;

        appState.animLayers.forEach(l => {
            if (l.role === 'face' || l.role === 'expression') {
                l.pos_x = Math.round(faceCenterX - l.w / 2);
                l.pos_y = Math.round(head.pos_y + head.h * 0.62 - l.h / 2);
                l.pivot_x = Math.round(l.w / 2);
                l.pivot_y = Math.round(l.h / 2);
                l.parent_id = head.id;
                l.z_index = 38;
            } else if (['eye_open', 'eye_closed', 'eye_extra'].includes(l.role)) {
                l.pos_x = Math.round(faceCenterX - l.w / 2);
                l.pos_y = Math.round(eyeCenterY - l.h / 2);
                l.pivot_x = Math.round(l.w / 2);
                l.pivot_y = Math.round(l.h / 2);
                l.parent_id = head.id;
                l.z_index = 40;
            } else if (['mouth_closed', 'mouth_half', 'mouth_open', 'mouth_extra'].includes(l.role)) {
                l.pos_x = Math.round(faceCenterX - l.w / 2);
                l.pos_y = Math.round(mouthCenterY - l.h / 2);
                l.pivot_x = Math.round(l.w / 2);
                l.pivot_y = Math.round(l.h / 2);
                l.parent_id = head.id;
                l.z_index = 41;
            } else if (l.role === 'hair') {
                const lowName = (l.name || '').toLowerCase();
                l.pos_x = Math.round(head.pos_x + head.w / 2 - l.w / 2);
                l.pos_y = Math.round(head.pos_y - 5);
                l.pivot_x = Math.round(l.w / 2);
                l.pivot_y = Math.round(l.h * 0.25);
                l.parent_id = head.id;
                l.z_index = (lowName.includes('sau') || lowName.includes('back')) ? 5 : 45;
            } else if (l.role === 'head_prop') {
                l.pos_x = Math.round(head.pos_x + head.w * 0.78);
                l.pos_y = Math.round(head.pos_y + head.h * 0.35);
                l.pivot_x = Math.round(l.w / 2);
                l.pivot_y = Math.round(l.h / 2);
                l.parent_id = head.id;
                l.z_index = 46;
            }
        });
    }

    updateSelectedAnimLayerUI();
    updateFunnyNameCheckUI();
    renderAnimLayersList();
    fitAnimCanvas();
    renderAnimStageFrame();
    document.getElementById('animCanvasStats').textContent = '🧲 Đã tự động lắp ghép các bộ phận và căn khung nhìn toàn nhân vật!';
}

function resetToOriginalPsdLayout() {
    stopAnimLoop();
    if (appState.animInitialLayersSnapshot && appState.animInitialLayersSnapshot.length > 0) {
        appState.animLayers = JSON.parse(JSON.stringify(appState.animInitialLayersSnapshot));
        appState.animDeletedHistory = [];
        updateAnimUndoDeleteBtn();
    }
    appState.animLayers.forEach(l => {
        l.pos_x = l.x;
        l.pos_y = l.y;
        l.visible = true;
    });
    if (!appState.animLayers.some(l => l.id === appState.selectedAnimId)) {
        appState.selectedAnimId = appState.animLayers.length > 0 ? appState.animLayers[0].id : null;
    }
    refreshAfterAnimLayerChange('↺ Đã khôi phục toàn bộ layer và vị trí gốc của file PSD.');
    fitAnimCanvas();
    renderAnimStageFrame();
}

// =========================================================
// 2D MATRIX & POSE COMPUTATION (100% MATCH WITH PYTHON & FUNNY ANIMATION)
// =========================================================
function applyEasingJS(t, easing = 'linear') {
    t = Math.max(0.0, Math.min(1.0, t));
    if (easing === 'easeIn') return t * t;
    if (easing === 'easeOut') return t * (2.0 - t);
    if (easing === 'easeInOut') return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t;
    return t;
}

function interpolatePropJS(keyframes, prop, localMs, defaultVal) {
    const pts = keyframes.filter(kf => kf[prop] !== undefined && kf[prop] !== null);
    if (pts.length === 0) return defaultVal;
    if (localMs <= pts[0].time) return pts[0][prop];
    if (localMs >= pts[pts.length - 1].time) return pts[pts.length - 1][prop];

    for (let i = 0; i < pts.length - 1; i++) {
        const k0 = pts[i];
        const k1 = pts[i + 1];
        if (localMs >= k0.time && localMs <= k1.time) {
            const span = k1.time - k0.time;
            if (span <= 1e-6) return k1[prop];
            const rawP = (localMs - k0.time) / span;
            const easedP = applyEasingJS(rawP, k0.easing || 'linear');
            return k0[prop] + (k1[prop] - k0[prop]) * easedP;
        }
    }
    return pts[pts.length - 1][prop];
}

function resolvePresetTrackForRoleJS(presetDef, role) {
    const funnyName = ROLE_TO_FUNNY_NAME_JS[role];
    if (!funnyName || !presetDef || !presetDef.tracks) return [];

    const direct = presetDef.tracks.filter(tr => tr.targetName === funnyName);
    if (direct.length > 0) return direct;

    const coarseMap = {
        'Left Upper Arm': 'Left Arm',
        'Right Upper Arm': 'Right Arm',
        'Left Thigh': 'Left Leg',
        'Right Thigh': 'Right Leg'
    };
    if (coarseMap[funnyName]) {
        return presetDef.tracks.filter(tr => tr.targetName === coarseMap[funnyName]);
    }

    const fineMap = {
        'Left Arm': 'Left Upper Arm',
        'Right Arm': 'Right Upper Arm',
        'Left Leg': 'Left Thigh',
        'Right Leg': 'Right Thigh'
    };
    if (fineMap[funnyName]) {
        return presetDef.tracks.filter(tr => tr.targetName === fineMap[funnyName]);
    }

    return [];
}

function makeTransformMatrixJS(px, py, dx, dy, rotDeg, sx, sy) {
    const rad = rotDeg * Math.PI / 180.0;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const a = cosA * sx;
    const b = -sinA * sy;
    const c = sinA * sx;
    const d = cosA * sy;

    const tx = px + dx - (a * px + b * py);
    const ty = py + dy - (c * px + d * py);

    return [
        [a, b, tx],
        [c, d, ty],
        [0, 0, 1]
    ];
}

function multiplyMat3JS(A, B) {
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

function resolveFacialStatesJS(layers, t, animCfg, isRigMode) {
    const autoBlink = !!animCfg.auto_blink;
    const blinkInterval = Math.max(0.8, parseFloat(animCfg.blink_interval || 2.8));
    const blinkDuration = 0.16;

    const preset = animCfg.preset || 'idle';
    const lipSync = (preset === 'talk') || (!!animCfg.lip_sync);
    const speed = Math.max(0.2, parseFloat(animCfg.speed || 1.0));

    const cyclePos = t % blinkInterval;
    const isBlinking = (!isRigMode) && autoBlink && (cyclePos > (blinkInterval - blinkDuration));

    let talkPhase = 0;
    if (!isRigMode && lipSync) {
        // Nhịp thoại tự nhiên (Human speech cadence):
        // Câu nói kéo dài ~1.7s, sau đó có khoảng dừng lấy hơi tự nhiên ~0.7s
        const phraseCycle = (t * speed) % 2.4;
        if (phraseCycle < 1.7) {
            const syllFreq = 2.4 * Math.PI * speed;
            const wave = Math.sin(syllFreq * t) * 0.7 + Math.sin(syllFreq * 0.5 * t) * 0.3;
            talkPhase = Math.max(0, Math.min(1, (wave + 0.15) * 1.3));
        } else {
            talkPhase = 0; // Ngắt nghỉ giữa câu: miệng ngậm đóng tự nhiên
        }
    }

    const eyeOpenLayers = layers.filter(l => l.visible && l.role === 'eye_open');
    const eyeClosedLayers = layers.filter(l => l.visible && l.role === 'eye_closed');
    const allEyeLayers = [...eyeOpenLayers, ...eyeClosedLayers];

    const singleEyeMode = (eyeClosedLayers.length === 0);
    let activeEyeId = null;
    if (!singleEyeMode && allEyeLayers.length > 0) {
        if (isBlinking && eyeClosedLayers.length > 0) {
            activeEyeId = eyeClosedLayers[0].id;
        } else if (eyeOpenLayers.length > 0) {
            activeEyeId = eyeOpenLayers[0].id;
        } else {
            activeEyeId = allEyeLayers[0].id;
        }
    }

    const mouthClosed = layers.filter(l => l.visible && l.role === 'mouth_closed');
    const mouthHalf = layers.filter(l => l.visible && l.role === 'mouth_half');
    const mouthOpen = layers.filter(l => l.visible && l.role === 'mouth_open');
    const allMouths = [...mouthClosed, ...mouthHalf, ...mouthOpen];

    const singleMouthMode = (allMouths.length <= 1);
    let activeMouthId = null;
    if (!singleMouthMode && allMouths.length > 0) {
        let targetList;
        if (!lipSync || isRigMode || talkPhase < 0.15) {
            targetList = mouthClosed.length ? mouthClosed : (mouthHalf.length ? mouthHalf : mouthOpen);
        } else if (talkPhase < 0.65) {
            targetList = mouthHalf.length ? mouthHalf : (mouthOpen.length ? mouthOpen : mouthClosed);
        } else {
            targetList = mouthOpen.length ? mouthOpen : (mouthHalf.length ? mouthHalf : mouthClosed);
        }
        activeMouthId = targetList[0].id;
    }

    return { activeEyeId, activeMouthId, singleEyeMode, singleMouthMode, isBlinking, talkPhase };
}

function computeLayerLocalPoseJS(layer, t, animCfg, facialState, isRigMode) {
    if (!layer.visible) {
        return { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, renderVisible: false };
    }

    const lyrScale = (layer.scale !== undefined) ? parseFloat(layer.scale) : (layer.motion?.scale_x !== undefined ? parseFloat(layer.motion.scale_x) : 1.0);

    const layerRot = parseFloat(layer.rotation || 0);
    const flipX = layer.flip_x ? -1 : 1;
    const flipY = layer.flip_y ? -1 : 1;
    if (isRigMode) {
        return { dx: 0, dy: 0, rot: layerRot, sx: lyrScale * flipX, sy: lyrScale * flipY, renderVisible: true };
    }

    const role = layer.role || 'custom';

    if (['eye_open', 'eye_closed', 'eye_extra'].includes(role)) {
        if (role === 'eye_extra') {
            const hasOpen = appState.animLayers.some(l => l.visible && l.role === 'eye_open');
            if (hasOpen) return { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, renderVisible: false };
        } else if (!facialState.singleEyeMode && facialState.activeEyeId !== null && layer.id !== facialState.activeEyeId) {
            return { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, renderVisible: false };
        }
    }

    if (['mouth_closed', 'mouth_half', 'mouth_open', 'mouth_extra'].includes(role)) {
        if (role === 'mouth_extra') {
            const hasClosed = appState.animLayers.some(l => l.visible && l.role === 'mouth_closed');
            if (hasClosed) return { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, renderVisible: false };
        } else if (!facialState.singleMouthMode && facialState.activeMouthId !== null && layer.id !== facialState.activeMouthId) {
            return { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, renderVisible: false };
        }
    }

    const preset = animCfg.preset || 'idle';
    const speed = parseFloat(animCfg.speed || 1.0);
    const intensity = parseFloat(animCfg.intensity || 1.0);
    const autoBlink = !!animCfg.auto_blink;
    const lipSync = (!!animCfg.lip_sync) || (preset === 'talk');
    const headSway = !!animCfg.head_sway;
    const swayAmp = parseFloat(animCfg.head_sway_amp || 6.0);

    let dx = 0, dy = 0, rot = layerRot, sx = flipX, sy = flipY;
    const omega = 2.0 * Math.PI * speed;
    const timeMs = t * 1000.0 * speed;

    // 1. Nội suy từ Catalog 18 Preset của Funny Animation Assistant
    const presetDef = FUNNY_PRESET_CATALOG_JS[preset];
    if (presetDef && preset !== 'custom') {
        const durMs = Math.max(1.0, presetDef.duration || 1000);
        const loopMode = presetDef.loopMode || 'loop';
        let localMs;
        if (loopMode === 'forwards') {
            const cycleMs = durMs + 500.0;
            localMs = Math.min(durMs, timeMs % cycleMs);
        } else {
            localMs = timeMs % durMs;
        }

        const matchedTracks = resolvePresetTrackForRoleJS(presetDef, role);
        matchedTracks.forEach(tr => {
            if (tr.type === 'transform' && tr.keyframes) {
                const tx = interpolatePropJS(tr.keyframes, 'x', localMs, 0.0);
                const ty = interpolatePropJS(tr.keyframes, 'y', localMs, 0.0);
                const trot = interpolatePropJS(tr.keyframes, 'rotation', localMs, 0.0);
                const tsx = interpolatePropJS(tr.keyframes, 'scaleX', localMs, 1.0);
                const tsy = interpolatePropJS(tr.keyframes, 'scaleY', localMs, 1.0);

                dx += tx * intensity;
                dy += ty * intensity;
                rot += trot * intensity;
                sx *= (1.0 + (tsx - 1.0) * intensity);
                sy *= (1.0 + (tsy - 1.0) * intensity);
            } else if (tr.type === 'effect' && tr.effect) {
                const eff = tr.effect;
                if (eff.type === 'breathe') {
                    const effInt = (eff.intensity || 0.025) * intensity;
                    const effSpd = eff.speed || 1.0;
                    const wave = Math.sin(timeMs * 0.003 * effSpd);
                    sy *= (1.0 + wave * effInt);
                    sx *= (1.0 - wave * effInt * 0.4);
                    dy += wave * 2.5 * intensity;
                } else if (eff.type === 'float') {
                    const amp = (eff.amplitude || 8.0) * intensity;
                    const effSpd = eff.speed || 1.0;
                    dy += Math.sin(timeMs * 0.002 * effSpd) * amp;
                }
            }
        });
    }

    if (headSway && preset !== 'head_sway' && role === 'head') {
        rot += Math.sin(omega * t * 0.9) * swayAmp * intensity;
    }

    if (autoBlink && facialState.singleEyeMode && ['eye_open', 'expression'].includes(role) && facialState.isBlinking) {
        sy *= 0.12;
    }

    if (lipSync && facialState.singleMouthMode && ['mouth_closed', 'mouth_half', 'mouth_open'].includes(role)) {
        sy *= (0.65 + 0.65 * facialState.talkPhase);
        sx *= (1.0 - 0.08 * facialState.talkPhase);
    }

    const m = layer.motion || {};
    const baseRot = parseFloat(m.base_rot || 0);
    const swingRot = parseFloat(m.swing_rot || 0);
    const speedMult = parseFloat(m.speed_mult || 1.0);
    const phaseRad = (parseFloat(m.phase_deg || 0)) * Math.PI / 180.0;
    const moveX = parseFloat(m.move_x || 0);
    const moveY = parseFloat(m.move_y || 0);
    const customWave = Math.sin(omega * speedMult * t + phaseRad);
    rot += baseRot + swingRot * customWave;
    dx += moveX * customWave;
    dy += moveY * customWave;
    sx *= lyrScale;
    sy *= lyrScale;

    return { dx, dy, rot, sx, sy, renderVisible: true };
}

function renderAnimStageFrame() {
    const vp = document.getElementById('animCanvasViewport');
    const canvas = document.getElementById('animStageCanvas');
    if (!canvas || !vp) return;

    const dpr = window.devicePixelRatio || 1;
    const vpW = Math.max(100, vp.clientWidth);
    const vpH = Math.max(100, vp.clientHeight);
    const targetW = Math.round(vpW * dpr);
    const targetH = Math.round(vpH * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!appState.animLayers || appState.animLayers.length === 0) return;

    const zoom = Math.max(0.05, appState.animZoom || 1.0);
    const panX = appState.animPanX || 0;
    const panY = appState.animPanY || 0;
    const invZoom = 1.0 / zoom;

    const isRigMode = (appState.animStageMode === 'rig');
    const t = isRigMode ? 0 : appState.animCurrentTime;
    const facialState = resolveFacialStatesJS(appState.animLayers, t, appState.animConfig, isRigMode);

    const layerMap = {};
    const localPoses = {};
    const localMatrices = {};

    appState.animLayers.forEach(lyr => {
        layerMap[lyr.id] = lyr;
        const pose = computeLayerLocalPoseJS(lyr, t, appState.animConfig, facialState, isRigMode);
        localPoses[lyr.id] = pose;
        const px = lyr.pos_x + lyr.pivot_x;
        const py = lyr.pos_y + lyr.pivot_y;
        localMatrices[lyr.id] = makeTransformMatrixJS(px, py, pose.dx, pose.dy, pose.rot, pose.sx, pose.sy);
    });

    const worldMatrices = {};
    function getWorldMatrix(lid, depth = 0) {
        if (worldMatrices[lid]) return worldMatrices[lid];
        const lyr = layerMap[lid];
        if (!lyr || depth > 5) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const mLocal = localMatrices[lid];
        const pid = lyr.parent_id;
        let mWorld = mLocal;
        if (pid && layerMap[pid] && pid !== lid) {
            const mParent = getWorldMatrix(pid, depth + 1);
            mWorld = multiplyMat3JS(mParent, mLocal);
        }
        worldMatrices[lid] = mWorld;
        return mWorld;
    }

    const visibleLayers = appState.animLayers.filter(l => l.visible);
    if (visibleLayers.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        visibleLayers.forEach(l => {
            minX = Math.min(minX, l.pos_x);
            minY = Math.min(minY, l.pos_y);
            maxX = Math.max(maxX, l.pos_x + l.w);
            maxY = Math.max(maxY, l.pos_y + l.h);
        });
        const pad = 60;
        ctx.save();
        ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panX, dpr * panY);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1.5 * invZoom;
        ctx.setLineDash([8 * invZoom, 6 * invZoom]);
        ctx.strokeRect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);
        ctx.setLineDash([]);
        ctx.restore();
    }

    const sortedLayers = [...appState.animLayers].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));

    sortedLayers.forEach(lyr => {
        const pose = localPoses[lyr.id];
        if (!pose || !pose.renderVisible) return;
        const img = appState.animImageCache[lyr.id];
        if (!img) return;

        const mWorld = getWorldMatrix(lyr.id);
        const tPos = [
            [1, 0, lyr.pos_x],
            [0, 1, lyr.pos_y],
            [0, 0, 1]
        ];
        const mFinal = multiplyMat3JS(mWorld, tPos);

        ctx.save();
        ctx.globalAlpha = (lyr.opacity !== undefined) ? (lyr.opacity / 255.0) : 1.0;
        ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panX, dpr * panY);
        ctx.transform(mFinal[0][0], mFinal[1][0], mFinal[0][1], mFinal[1][1], mFinal[0][2], mFinal[1][2]);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
    });

    const showPivotsEl = document.getElementById('checkShowPivots');
    const showPivots = showPivotsEl ? showPivotsEl.checked : true;
    if (!showPivots) return;

    ctx.save();
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panX, dpr * panY);

    const worldPivots = {};
    appState.animLayers.forEach(lyr => {
        const mW = getWorldMatrix(lyr.id);
        const px = lyr.pos_x + lyr.pivot_x;
        const py = lyr.pos_y + lyr.pivot_y;
        worldPivots[lyr.id] = {
            x: mW[0][0] * px + mW[0][1] * py + mW[0][2],
            y: mW[1][0] * px + mW[1][1] * py + mW[1][2]
        };
    });

    appState.animLayers.forEach(lyr => {
        if (!lyr.visible || !lyr.parent_id || !worldPivots[lyr.parent_id]) return;
        const p1 = worldPivots[lyr.parent_id];
        const p2 = worldPivots[lyr.id];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.55)';
        ctx.lineWidth = 2 * invZoom;
        ctx.setLineDash([5 * invZoom, 4 * invZoom]);
        ctx.stroke();
        ctx.setLineDash([]);
    });

    const selLyr = getSelectedAnimLayer();
    if (selLyr && selLyr.visible) {
        const mWorld = getWorldMatrix(selLyr.id);
        const tPos = [[1, 0, selLyr.pos_x], [0, 1, selLyr.pos_y], [0, 0, 1]];
        const mFinal = multiplyMat3JS(mWorld, tPos);
        ctx.save();
        ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panX, dpr * panY);
        ctx.transform(mFinal[0][0], mFinal[1][0], mFinal[0][1], mFinal[1][1], mFinal[0][2], mFinal[1][2]);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2 * invZoom;
        ctx.setLineDash([6 * invZoom, 4 * invZoom]);
        ctx.strokeRect(0, 0, selLyr.w, selLyr.h);

        // Rotation Handle above top-center of selected layer
        const topMidX = selLyr.w / 2;
        const topMidY = 0;
        const rotHandleLocalY = -24 * invZoom;
        ctx.beginPath();
        ctx.moveTo(topMidX, topMidY);
        ctx.lineTo(topMidX, rotHandleLocalY);
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1.5 * invZoom;
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(topMidX, rotHandleLocalY, 6.5 * invZoom, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2.5 * invZoom;
        ctx.stroke();

        ctx.restore();

        // Calculate world coordinates of the rotation handle
        const rHX = mFinal[0][0] * topMidX + mFinal[0][1] * rotHandleLocalY + mFinal[0][2];
        const rHY = mFinal[1][0] * topMidX + mFinal[1][1] * rotHandleLocalY + mFinal[1][2];
        appState.animRotHandlePos = { x: rHX, y: rHY };
    }

    sortedLayers.forEach(lyr => {
        if (!lyr.visible) return;
        const isSelected = (appState.selectedAnimId === lyr.id);
        const pose = localPoses[lyr.id];
        if (!isSelected && (!pose || !pose.renderVisible)) return;

        const wp = worldPivots[lyr.id];
        const r = (isSelected ? 10 : 5.5) * invZoom;

        ctx.beginPath();
        ctx.arc(wp.x, wp.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(249, 115, 22, 0.28)' : 'rgba(15, 23, 42, 0.35)';
        ctx.fill();
        ctx.lineWidth = (isSelected ? 2.5 : 1.5) * invZoom;
        ctx.strokeStyle = isSelected ? '#ea580c' : '#ffffff';
        ctx.stroke();

        if (isSelected) {
            const crossLen = 15 * invZoom;
            ctx.beginPath();
            ctx.moveTo(wp.x - crossLen, wp.y);
            ctx.lineTo(wp.x + crossLen, wp.y);
            ctx.moveTo(wp.x, wp.y - crossLen);
            ctx.lineTo(wp.x, wp.y + crossLen);
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 2 * invZoom;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(wp.x, wp.y, (isSelected ? 3.5 : 2) * invZoom, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#ffffff' : '#38bdf8';
        ctx.fill();
    });

    ctx.restore();
}

// =========================================================
// STAGE MODE, PLAYBACK LOOP & MOUSE DRAGGING (PIVOT / PART)
// =========================================================
function setAnimStageMode(mode) {
    appState.animStageMode = mode;
    const btnRig = document.getElementById('btnAnimModeRig');
    const btnPlay = document.getElementById('btnAnimModePlay');
    const stats = document.getElementById('animCanvasStats');

    if (mode === 'play') {
        if (btnRig) btnRig.classList.remove('active');
        if (btnPlay) btnPlay.classList.add('active');
        if (stats) stats.textContent = 'Chạy diễn hoạt';
        startAnimLoop();
    } else {
        stopAnimLoop();
        if (btnRig) btnRig.classList.add('active');
        if (btnPlay) btnPlay.classList.remove('active');
        if (stats) stats.textContent = 'Đặt tâm Pivot';
        appState.animCurrentTime = 0;
        updateTimelineLabel();
        renderAnimStageFrame();
    }
}

function startAnimLoop() {
    if (appState.animIsPlaying) return;
    appState.animIsPlaying = true;
    appState.animLastFrameTs = performance.now();

    const btnPlayToggle = document.getElementById('btnAnimPlayToggle');
    if (btnPlayToggle) {
        btnPlayToggle.textContent = '⏸️ Dừng';
        btnPlayToggle.classList.add('playing');
    }

    function tick(now) {
        if (!appState.animIsPlaying) return;
        const dt = Math.min(0.1, (now - appState.animLastFrameTs) / 1000.0);
        appState.animLastFrameTs = now;

        const dur = Math.max(0.5, parseFloat(appState.animConfig.duration || 3.0));
        appState.animCurrentTime = (appState.animCurrentTime + dt) % dur;

        const sliderTimeline = document.getElementById('sliderAnimTimeline');
        if (sliderTimeline) sliderTimeline.value = appState.animCurrentTime.toFixed(2);
        updateTimelineLabel();

        renderAnimStageFrame();
        appState.animRafId = requestAnimationFrame(tick);
    }

    appState.animRafId = requestAnimationFrame(tick);
}

function stopAnimLoop() {
    appState.animIsPlaying = false;
    if (appState.animRafId) {
        cancelAnimationFrame(appState.animRafId);
        appState.animRafId = null;
    }
    const btnPlayToggle = document.getElementById('btnAnimPlayToggle');
    if (btnPlayToggle) {
        btnPlayToggle.textContent = '▶️ Chạy';
        btnPlayToggle.classList.remove('playing');
    }
}

function updateTimelineLabel() {
    const lbl = document.getElementById('valAnimTimelineLabel');
    if (!lbl) return;
    const dur = parseFloat(appState.animConfig.duration || 3.0);
    const fps = parseInt(appState.animConfig.fps || 24, 10);
    const curFrame = Math.min(Math.round(dur * fps), Math.floor(appState.animCurrentTime * fps) + 1);
    lbl.textContent = `${appState.animCurrentTime.toFixed(2)}s / ${dur.toFixed(2)}s (Frame ${curFrame})`;
}

function getAllDescendantIds(parentId) {
    const result = [];
    const visited = new Set([parentId]);
    const queue = [parentId];
    while (queue.length > 0) {
        const curr = queue.shift();
        appState.animLayers.forEach(l => {
            if (l.parent_id === curr && !visited.has(l.id)) {
                visited.add(l.id);
                result.push(l.id);
                queue.push(l.id);
            }
        });
    }
    return result;
}

function setupAnimStageMouseInteractions() {
    const vp = document.getElementById('animCanvasViewport');
    if (!vp) return;

    let dragMode = null;
    let dragTargetLayer = null;
    let startStageX = 0;
    let startStageY = 0;
    let startClientX = 0;
    let startClientY = 0;
    let initialPivotX = 0;
    let initialPivotY = 0;
    let startAngle = 0;
    let initialLayerRot = 0;
    let initialPositions = {};

    function toStageCoords(clientX, clientY) {
        const rect = vp.getBoundingClientRect();
        return {
            x: (clientX - rect.left - appState.animPanX) / appState.animZoom,
            y: (clientY - rect.top - appState.animPanY) / appState.animZoom
        };
    }

    vp.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = vp.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        const newZoom = Math.min(Math.max(0.08, appState.animZoom * factor), 8.0);
        const ratio = newZoom / appState.animZoom;

        appState.animPanX = Math.round(cursorX - (cursorX - appState.animPanX) * ratio);
        appState.animPanY = Math.round(cursorY - (cursorY - appState.animPanY) * ratio);
        appState.animZoom = newZoom;
        renderAnimStageFrame();
    }, { passive: false });

    vp.addEventListener('mousedown', (e) => {
        if (e.target.closest('.floating-zoom')) return;

        if (e.button === 1 || e.button === 2) {
            dragMode = 'pan';
            startClientX = e.clientX - appState.animPanX;
            startClientY = e.clientY - appState.animPanY;
            vp.style.cursor = 'grabbing';
            return;
        }

        if (e.button !== 0) return;

        const pt = toStageCoords(e.clientX, e.clientY);
        startStageX = pt.x;
        startStageY = pt.y;

        const hitRadius = 15.0 / Math.max(0.15, appState.animZoom);

        const selLyr = getSelectedAnimLayer();
        if (appState.clickToSetPivot && selLyr) {
            if (appState.animStageMode !== 'rig') setAnimStageMode('rig');
            selLyr.pivot_x = Math.round(pt.x - selLyr.pos_x);
            selLyr.pivot_y = Math.round(pt.y - selLyr.pos_y);
            updateSelectedAnimLayerUI();
            renderAnimLayersList();
            renderAnimStageFrame();
            dragMode = 'pivot';
            dragTargetLayer = selLyr;
            initialPivotX = selLyr.pivot_x;
            initialPivotY = selLyr.pivot_y;
            return;
        }

        if (selLyr && selLyr.visible && appState.animRotHandlePos) {
            const hDist = Math.hypot(pt.x - appState.animRotHandlePos.x, pt.y - appState.animRotHandlePos.y);
            if (hDist <= 14 * invZoom) {
                if (appState.animStageMode !== 'rig') setAnimStageMode('rig');
                dragMode = 'rotate';
                dragTargetLayer = selLyr;
                initialLayerRot = selLyr.rotation || 0;
                const wp = (worldPivots && worldPivots[selLyr.id]) ? worldPivots[selLyr.id] : { x: selLyr.pos_x + selLyr.pivot_x, y: selLyr.pos_y + selLyr.pivot_y };
                startAngle = Math.atan2(pt.y - wp.y, pt.x - wp.x) * 180 / Math.PI;
                vp.style.cursor = 'grab';
                return;
            }
        }

        if (selLyr && selLyr.visible) {
            const px = selLyr.pos_x + selLyr.pivot_x;
            const py = selLyr.pos_y + selLyr.pivot_y;
            if (Math.hypot(pt.x - px, pt.y - py) <= hitRadius) {
                if (appState.animStageMode !== 'rig') setAnimStageMode('rig');
                dragMode = 'pivot';
                dragTargetLayer = selLyr;
                initialPivotX = selLyr.pivot_x;
                initialPivotY = selLyr.pivot_y;
                vp.style.cursor = 'crosshair';
                return;
            }
        }

        const sortedDesc = [...appState.animLayers].sort((a, b) => (b.z_index || 0) - (a.z_index || 0));
        for (const lyr of sortedDesc) {
            if (!lyr.visible) continue;
            const px = lyr.pos_x + lyr.pivot_x;
            const py = lyr.pos_y + lyr.pivot_y;
            if (Math.hypot(pt.x - px, pt.y - py) <= hitRadius * 0.85) {
                if (appState.animStageMode !== 'rig') setAnimStageMode('rig');
                selectAnimLayer(lyr.id);
                dragMode = 'pivot';
                dragTargetLayer = lyr;
                initialPivotX = lyr.pivot_x;
                initialPivotY = lyr.pivot_y;
                vp.style.cursor = 'crosshair';
                return;
            }
        }

        let hitPart = null;
        for (const lyr of sortedDesc) {
            if (!lyr.visible) continue;
            if (pt.x >= lyr.pos_x && pt.x <= lyr.pos_x + lyr.w && pt.y >= lyr.pos_y && pt.y <= lyr.pos_y + lyr.h) {
                const octx = appState.animAlphaCanvases[lyr.id];
                if (octx) {
                    const lx = Math.floor(pt.x - lyr.pos_x);
                    const ly = Math.floor(pt.y - lyr.pos_y);
                    try {
                        const alpha = octx.getImageData(lx, ly, 1, 1).data[3];
                        if (alpha > 10) {
                            hitPart = lyr;
                            break;
                        }
                    } catch (_) {
                        hitPart = lyr;
                        break;
                    }
                } else {
                    hitPart = lyr;
                    break;
                }
            }
        }

        if (!hitPart) {
            const bboxHits = sortedDesc.filter(lyr =>
                lyr.visible &&
                pt.x >= lyr.pos_x && pt.x <= lyr.pos_x + lyr.w &&
                pt.y >= lyr.pos_y && pt.y <= lyr.pos_y + lyr.h
            );
            if (bboxHits.length > 0) {
                bboxHits.sort((a, b) => (a.w * a.h) - (b.w * b.h));
                hitPart = bboxHits[0];
            }
        }

        if (hitPart) {
            if (appState.animStageMode !== 'rig') setAnimStageMode('rig');
            selectAnimLayer(hitPart.id);
            dragMode = 'part';
            dragTargetLayer = hitPart;
            initialPositions = {};
            appState.animLayers.forEach(l => {
                initialPositions[l.id] = { x: l.pos_x, y: l.pos_y };
            });
            vp.style.cursor = 'move';
            return;
        }

        dragMode = 'pan';
        startClientX = e.clientX - appState.animPanX;
        startClientY = e.clientY - appState.animPanY;
        vp.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!dragMode) return;

        if (dragMode === 'pan') {
            appState.animPanX = e.clientX - startClientX;
            appState.animPanY = e.clientY - startClientY;
            renderAnimStageFrame();
            return;
        }

        const pt = toStageCoords(e.clientX, e.clientY);
        const dx = pt.x - startStageX;
        const dy = pt.y - startStageY;

        if (dragMode === 'rotate' && dragTargetLayer) {
            const wp = (worldPivots && worldPivots[dragTargetLayer.id]) ? worldPivots[dragTargetLayer.id] : { x: dragTargetLayer.pos_x + dragTargetLayer.pivot_x, y: dragTargetLayer.pos_y + dragTargetLayer.pivot_y };
            const currentAngle = Math.atan2(pt.y - wp.y, pt.x - wp.x) * 180 / Math.PI;
            let delta = currentAngle - startAngle;
            let newAngle = Math.round((initialLayerRot + delta) % 360);
            while (newAngle > 180) newAngle -= 360;
            while (newAngle < -180) newAngle += 360;
            dragTargetLayer.rotation = newAngle;
            const sliderRot = document.getElementById('sliderAnimLayerRotation');
            const valRot = document.getElementById('valAnimLayerRotation');
            if (sliderRot) sliderRot.value = newAngle;
            if (valRot) valRot.textContent = `${newAngle}°`;
            renderAnimStageFrame();
            return;
        } else if (dragMode === 'pivot' && dragTargetLayer) {
            dragTargetLayer.pivot_x = Math.round(initialPivotX + dx);
            dragTargetLayer.pivot_y = Math.round(initialPivotY + dy);
            updateSelectedAnimLayerUI();
            renderAnimStageFrame();
        } else if (dragMode === 'part' && dragTargetLayer) {
            const moveChildrenEl = document.getElementById('checkMoveChildrenWithParent');
            const moveChildren = moveChildrenEl ? moveChildrenEl.checked : true;

            const startPos = initialPositions[dragTargetLayer.id];
            if (startPos) {
                dragTargetLayer.pos_x = Math.round(startPos.x + dx);
                dragTargetLayer.pos_y = Math.round(startPos.y + dy);
            }

            if (moveChildren) {
                const descIds = getAllDescendantIds(dragTargetLayer.id);
                descIds.forEach(cid => {
                    const childLyr = appState.animLayers.find(l => l.id === cid);
                    const cStart = initialPositions[cid];
                    if (childLyr && cStart) {
                        childLyr.pos_x = Math.round(cStart.x + dx);
                        childLyr.pos_y = Math.round(cStart.y + dy);
                    }
                });
            }
            renderAnimStageFrame();
        }
    });

    window.addEventListener('mouseup', () => {
        if (dragMode) {
            if (dragMode === 'pivot' || dragMode === 'part') {
                renderAnimLayersList();
            }
            dragMode = null;
            dragTargetLayer = null;
            vp.style.cursor = 'default';
        }
    });

    vp.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('keydown', (e) => {
        if (appState.currentTab !== 'anim') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            if (appState.animDeletedHistory && appState.animDeletedHistory.length > 0) {
                e.preventDefault();
                undoDeleteAnimLayer();
                return;
            }
        }

        const selLyr = getSelectedAnimLayer();
        if (!selLyr) return;

        if (e.key === 'Delete') {
            e.preventDefault();
            deleteAnimLayer(selLyr.id);
            return;
        }

        const step = e.shiftKey ? 10 : 1;
        let moved = false;
        if (e.key === 'ArrowLeft') { selLyr.pos_x -= step; moved = true; }
        else if (e.key === 'ArrowRight') { selLyr.pos_x += step; moved = true; }
        else if (e.key === 'ArrowUp') { selLyr.pos_y -= step; moved = true; }
        else if (e.key === 'ArrowDown') { selLyr.pos_y += step; moved = true; }

        if (moved) {
            e.preventDefault();
            renderAnimStageFrame();
        }
    });
}

function fitAnimCanvas() {
    const vp = document.getElementById('animCanvasViewport');
    if (!vp) return;
    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;
    if (vpW <= 50 || vpH <= 50) return;

    const visibleLayers = (appState.animLayers || []).filter(l => l.visible);
    const targets = visibleLayers.length > 0 ? visibleLayers : (appState.animLayers || []);

    if (targets.length === 0) {
        appState.animZoom = 1.0;
        appState.animPanX = 0;
        appState.animPanY = 0;
        renderAnimStageFrame();
        return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    targets.forEach(l => {
        minX = Math.min(minX, l.pos_x);
        minY = Math.min(minY, l.pos_y);
        maxX = Math.max(maxX, l.pos_x + l.w);
        maxY = Math.max(maxY, l.pos_y + l.h);
    });

    const contentW = Math.max(100, (maxX - minX) + 120);
    const contentH = Math.max(100, (maxY - minY) + 120);
    const centerX = (minX + maxX) / 2.0;
    const centerY = (minY + maxY) / 2.0;

    const padding = 48;
    const availW = Math.max(80, vpW - padding * 2);
    const availH = Math.max(80, vpH - padding * 2);
    const zoom = Math.min(availW / contentW, availH / contentH, 1.5);

    appState.animZoom = zoom;
    appState.animPanX = Math.round(vpW / 2.0 - centerX * zoom);
    appState.animPanY = Math.round(vpH / 2.0 - centerY * zoom);
    renderAnimStageFrame();
}

function zoomAnimAtCenter(factor) {
    const vp = document.getElementById('animCanvasViewport');
    if (!vp) return;
    const cx = vp.clientWidth / 2;
    const cy = vp.clientHeight / 2;
    const newZoom = Math.min(Math.max(0.08, appState.animZoom * factor), 8.0);
    const ratio = newZoom / appState.animZoom;
    appState.animPanX = Math.round(cx - (cx - appState.animPanX) * ratio);
    appState.animPanY = Math.round(cy - (cy - appState.animPanY) * ratio);
    appState.animZoom = newZoom;
    renderAnimStageFrame();
}

function updateAnimTransform() {
    renderAnimStageFrame();
}

// =========================================================
// EXPORT MULTI-FORMAT ANIMATION & FUNNY ANIMATION PACKAGE
// =========================================================
async function handleExportCharacterAnimation() {
    const activeLayers = (appState.animLayers || []).filter(l => l.visible !== false);
    if (!appState.animLayers || appState.animLayers.length === 0 || activeLayers.length === 0) {
        alert('Chưa có bộ phận nhân vật nào đang hiển thị để xuất Animation! Hãy nạp file PSD hoặc bật ít nhất 1 layer.');
        return;
    }

    let targetFolder = appState.customOutputDir;
    try {
        const res = await fetch('/api/select-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_path: targetFolder || appState.defaultOutputDir || '',
                title: 'Chọn thư mục lưu Gói Funny Animation (.anime / .paulto) & Video / GIF / PNG'
            })
        });
        const folderData = await res.json();
        if (!folderData.folder) {
            return;
        }
        targetFolder = folderData.folder;
        appState.customOutputDir = targetFolder;
        localStorage.setItem('spriteSplit_outputDir', targetFolder);
        syncOutputFolderDisplays();
    } catch (err) {
        console.warn('Folder dialog warning:', err);
    }

    const totalFrames = Math.round(appState.animConfig.duration * appState.animConfig.fps);
    exportModal.classList.add('show');
    modalSummary.innerHTML = `
        Đang kết xuất <strong>Gói dự án Funny Animation (.anime / .paulto)</strong> & <strong>${totalFrames} khung hình (${appState.animConfig.fps} FPS)</strong> vào thư mục:<br>
        <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 11.5px; display: inline-block; margin: 6px 0; word-break: break-all;">
            ${targetFolder}
        </code><br>
        Đang đóng gói nhân vật CompositeCharacter, gắn 18 Preset Animation, tạo PNG Sequence, Sprite Sheet, GIF và MP4...
    `;

    const baseName = (appState.animFilename || 'character').replace(/\.[^/.]+$/, '') + '_' + (appState.animConfig.preset || 'anim');

    fetch('/api/export-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            layers: activeLayers,
            width: appState.animWidth,
            height: appState.animHeight,
            anim_config: appState.animConfig,
            output_dir: targetFolder,
            base_name: baseName
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('Xuất Animation thất bại');
        return res.json();
    })
    .then(data => {
        appState.lastExportData = data;
        const stdPartsText = (data.funny_standardized_parts && data.funny_standardized_parts.length > 0)
            ? data.funny_standardized_parts.join(', ')
            : 'Tự động';
        modalSummary.innerHTML = `
            Đã xuất thành công trọn bộ <strong>Funny Animation Project</strong> & <strong>${data.total_frames} Frames (${data.fps} FPS)</strong> tại:<br>
            <code style="background: #ecfdf5; color: #047857; font-weight: 600; padding: 6px 10px; border-radius: 6px; font-size: 12px; display: inline-block; margin: 8px 0; word-break: break-all;">
                ${data.output_dir}
            </code><br>
            <div style="text-align: left; font-size: 12px; line-height: 1.65; margin-top: 6px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                🌟 <strong>Dành riêng cho Funny Animation Assistant:</strong><br>
                • <strong>Thư mục <code>funny_animation_project/</code> (chứa file <code>.anime</code>):</strong> Mở trực tiếp bằng <em>Open Project</em> trong Funny Animation Assistant — có sẵn nhân vật trên sân khấu, gắn <strong>${data.funny_presets_count || 18} Preset Animation</strong> trong Action Library, tâm xoay khớp (Pivot) & chuẩn tên (<code>${stdPartsText}</code>).<br>
                • <strong>Gói <code>_funny_animation.paulto</code>:</strong> Dùng tính năng <em>Import Project Package (.paulto)</em>.<br>
                • <strong>File <code>funny_animation_project/config.json</code> (ver2.0.0):</strong> Bấm nút <code>📥 Import</code> ngay trong <em>Composite Character Editor</em> để nhập nhanh cây nhân vật.<br>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 6px 0;">
                🎬 <strong>Đa định dạng thông dụng khác:</strong><br>
                • <strong><code>png_sequence/</code></strong>, <strong>Sprite Sheet (<code>.png</code> + <code>.json</code>)</strong>, <strong>Ảnh động <code>.gif</code></strong> & <strong>Video <code>.mp4</code></strong>.
            </div>
        `;
    })
    .catch(err => {
        console.error(err);
        modalSummary.innerHTML = `<span style="color: #dc2626; font-weight: 600;">Lỗi khi xuất Animation: ${err.message}</span>`;
    });
}

