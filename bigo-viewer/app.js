// ==========================================
// BIGO LIVE Viewer - Application Logic
// Uses window.open() for real page visits
// (iframes blocked by X-Frame-Options)
// ==========================================

// State
let isRunning = false;
let isPaused = false;
let openedWindows = []; // { id, windowRef, url, status }
let loadedCount = 0;
let batchTimeout = null;
let currentBatchIndex = 0;
let currentViewMode = 'grid';

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
    currentViewMode = mode;
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

// Apply grid classes while preserving view mode
function applyGridClasses(sizeClass) {
    viewerGrid.className = 'viewer-grid';
    if (sizeClass) viewerGrid.classList.add('size-' + sizeClass);
    if (currentViewMode === 'list') viewerGrid.classList.add('list-view');
}

// Count active (non-closed) windows
function getActiveCount() {
    let count = 0;
    openedWindows.forEach(w => {
        if (w.windowRef && !w.windowRef.closed) {
            count++;
        }
    });
    return count;
}

// Update Stats
function updateStats() {
    const activeCount = getActiveCount();
    activeCountEl.textContent = activeCount;
    loadedCountEl.textContent = loadedCount;
    
    if (isRunning && !isPaused) {
        statusIndicator.textContent = 'يعمل';
        statusIndicator.style.color = '#22c55e';
    } else if (isPaused) {
        statusIndicator.textContent = 'متوقف';
        statusIndicator.style.color = '#f59e0b';
    } else if (activeCount > 0) {
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
    progressText.textContent = `جاري فتح النوافذ... (${current}/${total})`;
    
    if (current >= total) {
        progressText.textContent = 'تم فتح جميع النوافذ!';
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

// Create Window Card Element (visual representation in the grid)
function createWindowCard(index) {
    const size = iframeSizeSelect.value;
    const wrapper = document.createElement('div');
    wrapper.className = `iframe-wrapper size-${size}`;
    wrapper.id = `frame-${index}`;
    wrapper.dataset.index = index;
    
    const header = document.createElement('div');
    header.className = 'iframe-header';
    
    const numSpan = document.createElement('span');
    numSpan.className = 'iframe-number';
    numSpan.textContent = '#' + (index + 1);
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'iframe-status';
    statusDiv.id = `status-${index}`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'iframe-close';
    closeBtn.title = 'إغلاق';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function() { removeFrame(index); });
    
    header.appendChild(numSpan);
    header.appendChild(statusDiv);
    header.appendChild(closeBtn);
    
    const body = document.createElement('div');
    body.className = 'window-card-body';
    body.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span class="window-card-text">نافذة مفتوحة</span>';
    
    wrapper.appendChild(header);
    wrapper.appendChild(body);
    
    return wrapper;
}

// Open a single viewer window
function openViewerWindow(url, index) {
    const uniqueUrl = url + (url.includes('?') ? '&' : '?') + '_v=' + index + '_' + Date.now();
    
    // Open a real browser window/tab
    const windowRef = window.open(uniqueUrl, '_blank');
    
    const windowData = {
        id: `frame-${index}`,
        windowRef: windowRef,
        url: uniqueUrl,
        status: windowRef ? 'opened' : 'blocked'
    };
    
    openedWindows.push(windowData);
    
    // Create visual card in grid
    const card = createWindowCard(index);
    viewerGrid.appendChild(card);
    
    // Update status indicator
    const statusEl = document.getElementById(`status-${index}`);
    if (windowRef) {
        if (statusEl) statusEl.classList.add('loaded');
        loadedCount++;
    } else {
        if (statusEl) statusEl.classList.add('error');
    }
    
    updateStats();
    return windowRef;
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
    if (openedWindows.length > 0) {
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
    
    // Apply grid size while preserving view mode
    const size = iframeSizeSelect.value;
    applyGridClasses(size);
    
    // Capture and store run parameters
    const batchSize = parseInt(batchSizeInput.value) || 10;
    const batchDelay = (parseInt(batchDelayInput.value) || 2) * 1000;
    runParams = { url, totalCount: count, batchSize, batchDelay };
    
    showToast(`بدء فتح ${count} نافذة... (يرجى السماح بالنوافذ المنبثقة)`, 'info');
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
        stopBtn.disabled = true;
        showToast(`تم فتح جميع النوافذ (${totalCount})`, 'success');
        updateStats();
        return;
    }
    
    const currentBatch = Math.min(batchSize, remaining);
    let blockedCount = 0;
    
    for (let i = 0; i < currentBatch; i++) {
        const frameIndex = currentBatchIndex + i;
        const windowRef = openViewerWindow(url, frameIndex);
        if (!windowRef) blockedCount++;
    }
    
    if (blockedCount > 0) {
        showToast(`تم حظر ${blockedCount} نوافذ - يرجى السماح بالنوافذ المنبثقة في المتصفح`, 'error');
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
        stopBtn.disabled = true;
        showToast(`تم فتح جميع النوافذ (${totalCount})`, 'success');
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

// Stop Viewer - close all opened windows
function stopViewer() {
    isRunning = false;
    isPaused = false;
    clearTimeout(batchTimeout);
    loadedCount = 0;
    
    // Close all opened windows
    openedWindows.forEach(w => {
        if (w.windowRef && !w.windowRef.closed) {
            try { w.windowRef.close(); } catch (e) { /* ignore */ }
        }
    });
    
    // Update card statuses
    document.querySelectorAll('.iframe-status').forEach(el => {
        el.classList.remove('loaded');
        el.classList.add('error');
    });
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.querySelector('span').textContent = 'إيقاف مؤقت';
    progressContainer.style.display = 'none';
    
    showToast('تم إغلاق جميع النوافذ', 'warning');
    updateStats();
}

// Remove Single Window (guarded against double-click)
function removeFrame(index) {
    const card = document.getElementById(`frame-${index}`);
    if (card && !card.dataset.removing) {
        card.dataset.removing = 'true';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        setTimeout(() => {
            // Close the actual browser window
            const windowData = openedWindows.find(w => w.id === `frame-${index}`);
            if (windowData && windowData.windowRef && !windowData.windowRef.closed) {
                try { windowData.windowRef.close(); } catch (e) { /* ignore */ }
            }
            
            const statusEl = card.querySelector('.iframe-status');
            const wasLoaded = statusEl && statusEl.classList.contains('loaded');
            card.remove();
            openedWindows = openedWindows.filter(w => w.id !== `frame-${index}`);
            if (wasLoaded && loadedCount > 0) loadedCount--;
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
    runParams = null;
    
    // Close all opened windows
    openedWindows.forEach(w => {
        if (w.windowRef && !w.windowRef.closed) {
            try { w.windowRef.close(); } catch (e) { /* ignore */ }
        }
    });
    openedWindows = [];
    
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
    
    // Reset grid classes while preserving view mode
    applyGridClasses(null);
    
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

// Periodically check window status (detect manually closed windows)
setInterval(() => {
    let changed = false;
    openedWindows.forEach(w => {
        const idx = w.id.replace('frame-', '');
        const statusEl = document.getElementById('status-' + idx);
        if (w.windowRef && w.windowRef.closed && statusEl && statusEl.classList.contains('loaded')) {
            statusEl.classList.remove('loaded');
            statusEl.classList.add('error');
            if (loadedCount > 0) loadedCount--;
            changed = true;
        }
    });
    if (changed) updateStats();
}, 5000);

// Initialize
loadSettings();
updateStats();
