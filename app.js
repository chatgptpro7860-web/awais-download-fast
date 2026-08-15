// Awais Download Fast - Frontend Logic
// Special 14 August Independence Day Edition 🇵🇰

let currentVideoData = null;
let currentPlatformFilter = 'all';

// In-Memory Client Cache for ultra-fast response
const clientCache = new Map();

// --- Bulletproof Copy to Clipboard Helper ---
async function copyToClipboard(text) {
  if (!text) return false;
  
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {}
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Clipboard fallback failed:', err);
    return false;
  }
}

// --- Cinematic Welcome Splash Screen ---
const welcomeSplash = document.getElementById('welcomeSplash');
const btnSkipIntro = document.getElementById('btnSkipIntro');

function closeSplash() {
  if (welcomeSplash) {
    welcomeSplash.classList.add('hidden');
    setTimeout(() => {
      welcomeSplash.style.display = 'none';
    }, 800);
  }
}

if (btnSkipIntro) {
  btnSkipIntro.addEventListener('click', closeSplash);
}

// Auto fade out after 2.5 seconds
setTimeout(() => {
  closeSplash();
}, 2500);

// --- Desktop Dynamic Ambient Parallax Animation ---
const backgroundGlow = document.getElementById('backgroundGlow');
const glowSpheres = document.querySelectorAll('.glow-sphere');

if (window.innerWidth > 768 && backgroundGlow) {
  window.addEventListener('mousemove', (e) => {
    const xRatio = (e.clientX / window.innerWidth - 0.5) * 30;
    const yRatio = (e.clientY / window.innerHeight - 0.5) * 30;

    glowSpheres.forEach((sphere, index) => {
      const factor = (index + 1) * 0.7;
      sphere.style.transform = `translate(${xRatio * factor}px, ${yRatio * factor}px)`;
    });
  });
}

// --- DOM Elements ---
const urlInput = document.getElementById('urlInput');
const btnClear = document.getElementById('btnClear');
const btnPaste = document.getElementById('btnPaste');
const btnFetch = document.getElementById('btnFetch');
const btnText = btnFetch.querySelector('.btn-text');
const btnLoader = btnFetch.querySelector('.btn-loader');
const detectedPlatformIcon = document.getElementById('detectedPlatformIcon');
const platformHint = document.getElementById('platformHint');

const errorBox = document.getElementById('errorBox');
const errorTitle = document.getElementById('errorTitle');
const errorMessage = document.getElementById('errorMessage');

const resultSection = document.getElementById('resultSection');
const mediaThumbnail = document.getElementById('mediaThumbnail');
const mediaDuration = document.getElementById('mediaDuration');
const mediaPlatform = document.getElementById('mediaPlatform');
const mediaTitle = document.getElementById('mediaTitle');
const mediaAuthor = document.getElementById('mediaAuthor');
const mediaViews = document.getElementById('mediaViews');
const quickButtons = document.getElementById('quickButtons');
const videoFormatsList = document.getElementById('videoFormatsList');
const audioFormatsList = document.getElementById('audioFormatsList');

const tabButtons = document.querySelectorAll('.tab-btn');
const fmtTabs = document.querySelectorAll('.fmt-tab');

// Desktop Header & Modals
const btnDownloadAppModal = document.getElementById('btnDownloadAppModal');
const downloadAppModal = document.getElementById('downloadAppModal');
const btnCloseDownloadApp = document.getElementById('btnCloseDownloadApp');
const btnPwaInstall = document.getElementById('btnPwaInstall');
const appApiUrlInput = document.getElementById('appApiUrlInput');
const btnCopyAppUrl = document.getElementById('btnCopyAppUrl');

const btnAbout = document.getElementById('btnAbout');
const aboutModal = document.getElementById('aboutModal');
const btnCloseAbout = document.getElementById('btnCloseAbout');

const btnCopyright = document.getElementById('btnCopyright');
const copyrightModal = document.getElementById('copyrightModal');
const btnCloseCopyright = document.getElementById('btnCloseCopyright');

const btnMobileQr = document.getElementById('btnMobileQr');
const qrModal = document.getElementById('qrModal');
const btnCloseQr = document.getElementById('btnCloseQr');
const networkUrlInput = document.getElementById('networkUrlInput');
const btnCopyNetworkUrl = document.getElementById('btnCopyNetworkUrl');
const qrcodeContainer = document.getElementById('qrcode');

const btnApiDocs = document.getElementById('btnApiDocs');
const apiModal = document.getElementById('apiModal');
const btnCloseApi = document.getElementById('btnCloseApi');

const btnHistory = document.getElementById('btnHistory');
const historyBadge = document.getElementById('historyBadge');
const historyDrawer = document.getElementById('historyDrawer');
const btnCloseHistory = document.getElementById('btnCloseHistory');
const btnClearHistory = document.getElementById('btnClearHistory');
const historyList = document.getElementById('historyList');

// Mobile Drawer Elements
const btnMobileMenu = document.getElementById('btnMobileMenu');
const mobileDrawer = document.getElementById('mobileDrawer');
const btnCloseMobileDrawer = document.getElementById('btnCloseMobileDrawer');
const btnDrawerDownloadApp = document.getElementById('btnDrawerDownloadApp');
const btnDrawerAbout = document.getElementById('btnDrawerAbout');
const btnDrawerCopyright = document.getElementById('btnDrawerCopyright');
const btnDrawerMobileQr = document.getElementById('btnDrawerMobileQr');
const btnDrawerHistory = document.getElementById('btnDrawerHistory');
const btnDrawerApiDocs = document.getElementById('btnDrawerApiDocs');

// Footer Links
const footerAboutLink = document.getElementById('footerAboutLink');
const footerCopyrightLink = document.getElementById('footerCopyrightLink');
const footerApiLink = document.getElementById('footerApiLink');
const footerDownloadLink = document.getElementById('footerDownloadLink');

const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// --- PWA Service Worker & Install Prompt ---
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (btnPwaInstall) {
    btnPwaInstall.innerHTML = '<i class="fa-solid fa-mobile-screen-button"></i> 1-Tap Install Mobile App (Ready)';
  }
});

// --- Platform Auto-Detection ---
const PLATFORM_MAP = {
  youtube: {
    name: 'YouTube',
    icon: 'fa-brands fa-youtube',
    color: '#ff0000',
    hint: '🔴 YouTube detected. Ready for 4K, 1080p, Shorts, or 320kbps MP3.'
  },
  instagram: {
    name: 'Instagram',
    icon: 'fa-brands fa-instagram',
    color: '#e1306c',
    hint: '📸 Instagram detected. Ready for Reels, Posts & Stories.'
  },
  tiktok: {
    name: 'TikTok',
    icon: 'fa-brands fa-tiktok',
    color: '#00f2fe',
    hint: '✨ TikTok detected. Direct ultra-fast download with No Watermark.'
  },
  facebook: {
    name: 'Facebook',
    icon: 'fa-brands fa-facebook',
    color: '#1877f2',
    hint: '🔵 Facebook detected. Ready for HD Watch & Reels.'
  },
  twitter: {
    name: 'Twitter/X',
    icon: 'fa-brands fa-x-twitter',
    color: '#ffffff',
    hint: '🐦 Twitter/X video link detected.'
  },
  pinterest: {
    name: 'Pinterest',
    icon: 'fa-brands fa-pinterest',
    color: '#e60023',
    hint: '📌 Pinterest video link detected.'
  },
  general: {
    name: 'Universal',
    icon: 'fa-solid fa-link',
    color: '#00f2fe',
    hint: '🌐 Universal link detected. Compatible with 1000+ websites.'
  }
};

function detectPlatformFrontend(url) {
  if (!url || typeof url !== 'string') return 'general';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/i.test(url)) return 'tiktok';
  if (/facebook\.com|fb\.watch/i.test(url)) return 'facebook';
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter';
  if (/pinterest\.com|pin\.it/i.test(url)) return 'pinterest';
  return 'general';
}

function updatePlatformUI(platformKey) {
  const p = PLATFORM_MAP[platformKey] || PLATFORM_MAP.general;
  detectedPlatformIcon.innerHTML = `<i class="${p.icon}" style="color: ${p.color};"></i>`;
  platformHint.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${p.hint}`;
}

urlInput.addEventListener('input', () => {
  const val = urlInput.value.trim();
  btnClear.style.display = val ? 'inline-flex' : 'none';
  const platform = detectPlatformFrontend(val);
  updatePlatformUI(platform);
});

btnClear.addEventListener('click', () => {
  urlInput.value = '';
  btnClear.style.display = 'none';
  updatePlatformUI('general');
  urlInput.focus();
});

btnPaste.addEventListener('click', async () => {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        btnClear.style.display = 'inline-flex';
        const platform = detectPlatformFrontend(urlInput.value);
        updatePlatformUI(platform);
        showToast('Link pasted from clipboard!');
        fetchVideoInfo();
      }
    } else {
      urlInput.focus();
      showToast('Please press Ctrl+V to paste your link.');
    }
  } catch (err) {
    urlInput.focus();
  }
});

// Platform filter tabs
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPlatformFilter = btn.getAttribute('data-platform');
  });
});

// Format tabs (Video vs Audio)
fmtTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    fmtTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const fmt = tab.getAttribute('data-fmt');
    if (fmt === 'video') {
      videoFormatsList.style.display = 'flex';
      audioFormatsList.style.display = 'none';
    } else {
      videoFormatsList.style.display = 'none';
      audioFormatsList.style.display = 'flex';
    }
  });
});

// --- Fetch Video Information ---
async function fetchVideoInfo() {
  const url = urlInput.value.trim();
  if (!url) {
    showError('Empty Input', 'Please paste a valid video URL.');
    return;
  }

  // Optimistic UI Loading State
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline-flex';
  btnFetch.disabled = true;
  hideError();

  // 1. Check client-side fast cache
  if (clientCache.has(url)) {
    const cached = clientCache.get(url);
    renderVideoResult(cached);
    btnText.style.display = 'inline-flex';
    btnLoader.style.display = 'none';
    btnFetch.disabled = false;
    return;
  }

  try {
    const res = await fetch('/api/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const json = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.error || 'Unable to extract download formats.');
    }

    clientCache.set(url, json.data);
    currentVideoData = json.data;
    renderVideoResult(json.data);
    saveToHistory(json.data);
    showToast('Download links ready!');
  } catch (err) {
    showError('Fetch Failed', err.message || 'Could not fetch video. Check link or connectivity.');
  } finally {
    btnText.style.display = 'inline-flex';
    btnLoader.style.display = 'none';
    btnFetch.disabled = false;
  }
}

btnFetch.addEventListener('click', fetchVideoInfo);
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    fetchVideoInfo();
  }
});

// --- Render Video Data ---
function renderVideoResult(data) {
  mediaTitle.textContent = data.title || 'Video';
  mediaAuthor.querySelector('span').textContent = data.uploader || 'Creator';
  mediaDuration.textContent = data.durationFormatted || '0:00';
  mediaThumbnail.src = data.thumbnail || '';

  const p = PLATFORM_MAP[data.platform] || PLATFORM_MAP.general;
  mediaPlatform.innerHTML = `<i class="${p.icon}"></i> ${data.platformName || p.name}`;

  if (data.viewCount) {
    mediaViews.style.display = 'flex';
    mediaViews.querySelector('span').textContent = `${data.viewCount} views`;
  } else {
    mediaViews.style.display = 'none';
  }

  // Quick 1-Click Action Buttons
  quickButtons.innerHTML = '';

  const bestVid = data.videoOptions && data.videoOptions[0];
  if (bestVid) {
    const dlVidUrl = buildDownloadUrl(data.originalUrl, bestVid, data.title, false);
    const vidBtn = document.createElement('a');
    vidBtn.href = dlVidUrl;
    vidBtn.className = 'btn-fast-dl';
    vidBtn.innerHTML = '<i class="fa-solid fa-video"></i> Best Video (MP4)';
    quickButtons.appendChild(vidBtn);
  }

  const bestAud = data.audioOptions && data.audioOptions[0];
  if (bestAud) {
    const dlAudUrl = buildDownloadUrl(data.originalUrl, bestAud, data.title, true);
    const audBtn = document.createElement('a');
    audBtn.href = dlAudUrl;
    audBtn.className = 'btn-fast-dl';
    audBtn.innerHTML = '<i class="fa-solid fa-music"></i> Audio Only (MP3)';
    quickButtons.appendChild(audBtn);
  }

  // Populate Video Formats Table
  videoFormatsList.innerHTML = '';
  if (data.videoOptions && data.videoOptions.length > 0) {
    data.videoOptions.forEach((opt) => {
      const row = document.createElement('div');
      row.className = 'format-row';
      const dlUrl = buildDownloadUrl(data.originalUrl, opt, data.title, false);
      row.innerHTML = `
        <div class="fmt-info">
          <span class="fmt-badge">${opt.ext.toUpperCase()}</span>
          <span class="fmt-name">${opt.quality}</span>
          <span class="fmt-size">${opt.filesize || 'HD'}</span>
        </div>
        <a href="${dlUrl}" class="btn-row-dl" download>
          <i class="fa-solid fa-download"></i> Download
        </a>
      `;
      videoFormatsList.appendChild(row);
    });
  }

  // Populate Audio Formats Table
  audioFormatsList.innerHTML = '';
  if (data.audioOptions && data.audioOptions.length > 0) {
    data.audioOptions.forEach((opt) => {
      const row = document.createElement('div');
      row.className = 'format-row';
      const dlUrl = buildDownloadUrl(data.originalUrl, opt, data.title, true);
      row.innerHTML = `
        <div class="fmt-info">
          <span class="fmt-badge">${opt.ext.toUpperCase()}</span>
          <span class="fmt-name">${opt.quality}</span>
          <span class="fmt-size">${opt.filesize || 'Audio'}</span>
        </div>
        <a href="${dlUrl}" class="btn-row-dl" download>
          <i class="fa-solid fa-download"></i> Download MP3
        </a>
      `;
      audioFormatsList.appendChild(row);
    });
  }

  resultSection.style.display = 'block';
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildDownloadUrl(url, option, title, isAudio) {
  if (option.directUrl) {
    return `/api/download?directUrl=${encodeURIComponent(option.directUrl)}&title=${encodeURIComponent(title)}&ext=${option.ext}&isAudio=${isAudio}`;
  }
  return `/api/download?url=${encodeURIComponent(url)}&formatId=${encodeURIComponent(option.formatId || '')}&title=${encodeURIComponent(title)}&ext=${option.ext}&isAudio=${isAudio}`;
}

// --- Error & Toast Notifications ---
function showError(title, msg) {
  errorTitle.textContent = title;
  errorMessage.textContent = msg;
  errorBox.style.display = 'flex';
}

function hideError() {
  errorBox.style.display = 'none';
}

function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// --- Download History ---
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('awais_dl_history') || '[]');
  } catch (e) {
    return [];
  }
}

function saveToHistory(item) {
  const list = getHistory();
  const filtered = list.filter(i => i.originalUrl !== item.originalUrl);
  filtered.unshift({
    title: item.title,
    thumbnail: item.thumbnail,
    originalUrl: item.originalUrl,
    platform: item.platform,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  const limited = filtered.slice(0, 20);
  localStorage.setItem('awais_dl_history', JSON.stringify(limited));
  updateHistoryBadge();
}

function updateHistoryBadge() {
  const count = getHistory().length;
  if (historyBadge) historyBadge.textContent = count;
}

function renderHistoryList() {
  const list = getHistory();
  historyList.innerHTML = '';
  if (list.length === 0) {
    historyList.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px 0;"><i class="fa-solid fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No downloads yet.</div>';
    return;
  }

  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <img src="${item.thumbnail || ''}" class="history-thumb" alt="thumb">
      <div class="history-details">
        <div class="history-title">${item.title}</div>
        <div class="history-time">${item.time} &bull; ${item.platform}</div>
      </div>
      <button class="input-inline-btn" title="Reload link"><i class="fa-solid fa-arrow-rotate-right"></i></button>
    `;
    el.querySelector('button').addEventListener('click', () => {
      urlInput.value = item.originalUrl;
      historyDrawer.style.display = 'none';
      fetchVideoInfo();
    });
    historyList.appendChild(el);
  });
}

// --- Modals Management ---
let qrInstance = null;

async function loadNetworkInfo() {
  try {
    const res = await fetch('/api/network-info');
    const data = await res.json();
    if (networkUrlInput) networkUrlInput.value = data.networkUrl;
    if (appApiUrlInput) appApiUrlInput.value = data.downloadExeUrl || data.downloadAppUrl;

    if (qrcodeContainer && !qrInstance) {
      qrcodeContainer.innerHTML = '';
      qrInstance = new QRCode(qrcodeContainer, {
        text: data.networkUrl,
        width: 180,
        height: 180,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  } catch (err) {
    console.warn('Network info unavailable:', err);
  }
}

// Modal Triggers
function openModal(modal) {
  if (modal) modal.style.display = 'flex';
}
function closeModal(modal) {
  if (modal) modal.style.display = 'none';
}

if (btnDownloadAppModal) btnDownloadAppModal.addEventListener('click', () => { loadNetworkInfo(); openModal(downloadAppModal); });
if (btnDrawerDownloadApp) btnDrawerDownloadApp.addEventListener('click', () => { mobileDrawer.style.display = 'none'; loadNetworkInfo(); openModal(downloadAppModal); });
if (btnCloseDownloadApp) btnCloseDownloadApp.addEventListener('click', () => closeModal(downloadAppModal));
if (footerDownloadLink) footerDownloadLink.addEventListener('click', () => { loadNetworkInfo(); openModal(downloadAppModal); });

if (btnAbout) btnAbout.addEventListener('click', () => openModal(aboutModal));
if (btnDrawerAbout) btnDrawerAbout.addEventListener('click', () => { mobileDrawer.style.display = 'none'; openModal(aboutModal); });
if (btnCloseAbout) btnCloseAbout.addEventListener('click', () => closeModal(aboutModal));
if (footerAboutLink) footerAboutLink.addEventListener('click', () => openModal(aboutModal));

if (btnCopyright) btnCopyright.addEventListener('click', () => openModal(copyrightModal));
if (btnDrawerCopyright) btnDrawerCopyright.addEventListener('click', () => { mobileDrawer.style.display = 'none'; openModal(copyrightModal); });
if (btnCloseCopyright) btnCloseCopyright.addEventListener('click', () => closeModal(copyrightModal));
if (footerCopyrightLink) footerCopyrightLink.addEventListener('click', () => openModal(copyrightModal));

if (btnMobileQr) btnMobileQr.addEventListener('click', () => { loadNetworkInfo(); openModal(qrModal); });
if (btnDrawerMobileQr) btnDrawerMobileQr.addEventListener('click', () => { mobileDrawer.style.display = 'none'; loadNetworkInfo(); openModal(qrModal); });
if (btnCloseQr) btnCloseQr.addEventListener('click', () => closeModal(qrModal));

if (btnApiDocs) btnApiDocs.addEventListener('click', () => openModal(apiModal));
if (btnDrawerApiDocs) btnDrawerApiDocs.addEventListener('click', () => { mobileDrawer.style.display = 'none'; openModal(apiModal); });
if (btnCloseApi) btnCloseApi.addEventListener('click', () => closeModal(apiModal));
if (footerApiLink) footerApiLink.addEventListener('click', () => openModal(apiModal));

if (btnHistory) btnHistory.addEventListener('click', () => { renderHistoryList(); historyDrawer.style.display = 'flex'; });
if (btnDrawerHistory) btnDrawerHistory.addEventListener('click', () => { mobileDrawer.style.display = 'none'; renderHistoryList(); historyDrawer.style.display = 'flex'; });
if (btnCloseHistory) btnCloseHistory.addEventListener('click', () => { historyDrawer.style.display = 'none'; });

if (btnClearHistory) {
  btnClearHistory.addEventListener('click', () => {
    localStorage.removeItem('awais_dl_history');
    renderHistoryList();
    updateHistoryBadge();
    showToast('Download history cleared.');
  });
}

// Mobile Menu Drawer
if (btnMobileMenu) btnMobileMenu.addEventListener('click', () => { mobileDrawer.style.display = 'flex'; });
if (btnCloseMobileDrawer) btnCloseMobileDrawer.addEventListener('click', () => { mobileDrawer.style.display = 'none'; });

// Copy Network URLs
if (btnCopyNetworkUrl) {
  btnCopyNetworkUrl.addEventListener('click', async () => {
    const success = await copyToClipboard(networkUrlInput.value);
    if (success) showToast('Network WiFi URL copied!');
  });
}

if (btnCopyAppUrl) {
  btnCopyAppUrl.addEventListener('click', async () => {
    const success = await copyToClipboard(appApiUrlInput.value);
    if (success) showToast('Direct .EXE download link copied!');
  });
}

// 1-Tap PWA Installation
if (btnPwaInstall) {
  btnPwaInstall.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Thank you for installing Awais Download Fast!');
      }
      deferredPrompt = null;
    } else {
      showToast('To install on Mobile: tap browser menu (⋮) -> "Add to Home screen" / "Install app"');
    }
  });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
  if (e.target === mobileDrawer) {
    mobileDrawer.style.display = 'none';
  }
  if (e.target === historyDrawer) {
    historyDrawer.style.display = 'none';
  }
});

// Initialize on page load
updateHistoryBadge();
loadNetworkInfo();
