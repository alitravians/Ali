// ==========================================
// BIGO LIVE Viewer - Application Logic
// ==========================================

// State
let isRunning = false;
let isPaused = false;
let activeFrames = [];
let loadedCount = 0;
let batchTimeout = null;
let currentBatchIndex = 0;

// Stored run parameters (captured at start, used on resume)
let runParams = null;

// DOM Elements
const streamUrlInput = document.getElementById('streamUrl');
const windowCountInput = document.getElementById('windowCount');
const batchSizeInput = document.getElementById('batchSize');
const batchDelayInput = document.getElementById('batchDelay');
const iframeSizeSelect = document.getElementById('iframeSize');
const muteFramesCheckbox = document.getElementById('muteFrames');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const viewerGrid = document.getElementById('viewerGrid');
const activeCountEl = document.getElementById('activeCount');
const loadedCountEl = document.getElementById('loadedCount');
const statusIndicator = document.getElementById('statusIndicator');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const advancedToggle = document.getElementById('advancedToggle');
const advancedSettings = document.getElementById('advancedSettings');

// Advanced Settings Toggle
advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedSettings.classList.toggle('open');
});

// View Mode
function setViewMode(mode) {
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    
    if (mode === 'grid') {
        viewerGrid.classList.remove('list-view');
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
    } else {
        viewerGrid.classList.add('list-view');
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
    }
}

// Update Stats
function updateStats() {
    activeCountEl.textContent = activeFrames.length;
    loadedCountEl.textContent = loadedCount;
    
    if (isRunning && !isPaused) {
        statusIndicator.textContent = 'يعمل';
        statusIndicator.style.color = '#22c55e';
    } else if (isPaused) {
        statusIndicator.textContent = 'متوقف';
        statusIndicator.style.color = '#f59e0b';
    } else if (activeFrames.length > 0) {
        statusIndicator.textContent = 'مكتمل';
        statusIndicator.style.color = '#00d4ff';
    } else {
        statusIndicator.textContent = '--';
        statusIndicator.style.color = '';
    }
}

// Update Progress
function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    progressFill.style.width = percent + '%';
    progressPercent.textContent = percent + '%';
    progressText.textContent = `جاري التحميل... (${current}/${total})`;
    
    if (current >= total) {
        progressText.textContent = 'تم التحميل بالكامل!';
    }
}

// Show Toast
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Normalize URL
function normalizeUrl(url) {
    url = url.trim();
    if (!url) return null;
    
    // If it's already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // If it's just a BIGO ID
    if (/^\d+$/.test(url)) {
        return `https://www.bigo.tv/${url}`;
    }
    
    // Add https if missing
    return `https://${url}`;
}

// Create Iframe Element
function createIframeElement(url, index) {
    const size = iframeSizeSelect.value;
    const wrapper = document.createElement('div');
    wrapper.className = `iframe-wrapper size-${size}`;
    wrapper.id = `frame-${index}`;
    wrapper.dataset.index = index;
    
    wrapper.innerHTML = `
        <div class="iframe-header">
            <span class="iframe-number">#${index + 1}</span>
            <div class="iframe-status" id="status-${index}"></div>
            <button class="iframe-close" onclick="removeFrame(${index})" title="إغلاق">&times;</button>
        </div>
    `;
    
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    
    if (muteFramesCheckbox.checked) {
        iframe.setAttribute('allow', 'autoplay');
        iframe.setAttribute('muted', '');
    }
    
    iframe.addEventListener('load', () => {
        const statusEl = document.getElementById(`status-${index}`);
        if (statusEl) {
            statusEl.classList.add('loaded');
        }
        loadedCount++;
        updateStats();
    });
    
    iframe.addEventListener('error', () => {
        const statusEl = document.getElementById(`status-${index}`);
        if (statusEl) {
            statusEl.classList.add('error');
        }
    });
    
    wrapper.appendChild(iframe);
    return wrapper;
}

// Start Viewer
function startViewer() {
    const url = normalizeUrl(streamUrlInput.value);
    const count = parseInt(windowCountInput.value) || 100;
    
    if (!url) {
        showToast('الرجاء إدخال رابط البث', 'error');
        streamUrlInput.focus();
        return;
    }
    
    if (count < 1 || count > 500) {
        showToast('عدد النوافذ يجب أن يكون بين 1 و 500', 'error');
        windowCountInput.focus();
        return;
    }
    
    // Clear previous if any
    if (activeFrames.length > 0) {
        clearAll();
    }
    
    isRunning = true;
    isPaused = false;
    loadedCount = 0;
    currentBatchIndex = 0;
    
    // Update UI
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    progressContainer.style.display = 'block';
    
    // Remove empty state
    const emptyState = viewerGrid.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    // Apply grid size
    const size = iframeSizeSelect.value;
    viewerGrid.className = 'viewer-grid size-' + size;
    
    // Capture and store run parameters
    const batchSize = parseInt(batchSizeInput.value) || 10;
    const batchDelay = (parseInt(batchDelayInput.value) || 2) * 1000;
    runParams = { url, totalCount: count, batchSize, batchDelay };
    
    showToast(`بدء تحميل ${count} نافذة...`, 'info');
    updateStats();
    
    loadBatch(url, count, batchSize, batchDelay);
}

// Load Batch
function loadBatch(url, totalCount, batchSize, batchDelay) {
    if (!isRunning || isPaused) return;
    
    const remaining = totalCount - currentBatchIndex;
    if (remaining <= 0) {
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        showToast(`تم تحميل جميع النوافذ (${totalCount})`, 'success');
        updateStats();
        return;
    }
    
    const currentBatch = Math.min(batchSize, remaining);
    
    for (let i = 0; i < currentBatch; i++) {
        const frameIndex = currentBatchIndex + i;
        // Add cache-busting parameter to make each request unique
        const uniqueUrl = url + (url.includes('?') ? '&' : '?') + '_v=' + frameIndex + '_' + Date.now();
        const frameEl = createIframeElement(uniqueUrl, frameIndex);
        viewerGrid.appendChild(frameEl);
        activeFrames.push(frameEl);
    }
    
    currentBatchIndex += currentBatch;
    updateProgress(currentBatchIndex, totalCount);
    updateStats();
    
    // Schedule next batch
    if (currentBatchIndex < totalCount) {
        batchTimeout = setTimeout(() => {
            loadBatch(url, totalCount, batchSize, batchDelay);
        }, batchDelay);
    } else {
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        showToast(`تم تحميل جميع النوافذ (${totalCount})`, 'success');
        updateStats();
    }
}

// Pause Viewer
function pauseViewer() {
    if (!isRunning) return;
    
    if (isPaused) {
        // Resume using stored run parameters
        isPaused = false;
        pauseBtn.querySelector('span').textContent = 'إيقاف مؤقت';
        showToast('تم استئناف التحميل', 'info');
        
        loadBatch(runParams.url, runParams.totalCount, runParams.batchSize, runParams.batchDelay);
    } else {
        // Pause
        isPaused = true;
        clearTimeout(batchTimeout);
        pauseBtn.querySelector('span').textContent = 'استئناف';
        showToast('تم إيقاف التحميل مؤقتاً', 'warning');
    }
    
    updateStats();
}

// Stop Viewer
function stopViewer() {
    isRunning = false;
    isPaused = false;
    clearTimeout(batchTimeout);
    
    // Remove all iframes but keep wrappers visible
    activeFrames.forEach(frame => {
        const iframe = frame.querySelector('iframe');
        if (iframe) iframe.remove();
        const status = frame.querySelector('.iframe-status');
        if (status) {
            status.classList.remove('loaded');
            status.classList.add('error');
        }
    });
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.querySelector('span').textContent = 'إيقاف مؤقت';
    progressContainer.style.display = 'none';
    
    showToast('تم إيقاف جميع النوافذ', 'warning');
    updateStats();
}

// Remove Single Frame
function removeFrame(index) {
    const frame = document.getElementById(`frame-${index}`);
    if (frame) {
        frame.style.opacity = '0';
        frame.style.transform = 'scale(0.8)';
        setTimeout(() => {
            frame.remove();
            activeFrames = activeFrames.filter(f => f.id !== `frame-${index}`);
            if (loadedCount > 0) loadedCount--;
            updateStats();
        }, 300);
    }
}

// Clear All
function clearAll() {
    isRunning = false;
    isPaused = false;
    clearTimeout(batchTimeout);
    currentBatchIndex = 0;
    loadedCount = 0;
    activeFrames = [];
    runParams = null;
    
    viewerGrid.innerHTML = `
        <div class="empty-state">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <h3>لا توجد نوافذ نشطة</h3>
            <p>أدخل رابط البث وعدد النوافذ ثم اضغط "بدء التشغيل"</p>
        </div>
    `;
    
    viewerGrid.className = 'viewer-grid';
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.querySelector('span').textContent = 'إيقاف مؤقت';
    progressContainer.style.display = 'none';
    
    updateStats();
    showToast('تم مسح جميع النوافذ', 'info');
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Enter to start
    if (e.key === 'Enter' && !isRunning && document.activeElement.tagName === 'INPUT') {
        startViewer();
    }
    // Escape to stop
    if (e.key === 'Escape' && isRunning) {
        stopViewer();
    }
    // Space to pause/resume (when not in input)
    if (e.key === ' ' && isRunning && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        pauseViewer();
    }
});

// Load saved settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('bigoViewerSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            if (settings.url) streamUrlInput.value = settings.url;
            if (settings.count) windowCountInput.value = settings.count;
            if (settings.batchSize) batchSizeInput.value = settings.batchSize;
            if (settings.batchDelay) batchDelayInput.value = settings.batchDelay;
            if (settings.iframeSize) iframeSizeSelect.value = settings.iframeSize;
            if (settings.muteFrames !== undefined) muteFramesCheckbox.checked = settings.muteFrames;
        } catch (e) {
            // Ignore parse errors
        }
    }
}

// Save settings to localStorage
function saveSettings() {
    const settings = {
        url: streamUrlInput.value,
        count: windowCountInput.value,
        batchSize: batchSizeInput.value,
        batchDelay: batchDelayInput.value,
        iframeSize: iframeSizeSelect.value,
        muteFrames: muteFramesCheckbox.checked
    };
    localStorage.setItem('bigoViewerSettings', JSON.stringify(settings));
}

// Auto-save settings on change
[streamUrlInput, windowCountInput, batchSizeInput, batchDelayInput, iframeSizeSelect, muteFramesCheckbox].forEach(el => {
    el.addEventListener('change', saveSettings);
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') {
        el.addEventListener('input', saveSettings);
    }
});

// Initialize
loadSettings();
updateStats();
