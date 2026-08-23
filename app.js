// =========================================================
// ⚡ AwaisX - Ultra-Fast Universal Media Downloader
// 14 August Pakistan Independence Day Special Edition 🇵🇰
// Engineered with ❤️ by Awais
// =========================================================

let currentVideoData = null;
let currentPlatformFilter = 'all';

// In-Memory Client Cache for instant sub-second response
const clientCache = new Map();

// --- Clipboard Copy Helper ---
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

// --- Cinematic Splash Screen ---
const welcomeSplash = document.getElementById('welcomeSplash');
const btnSkipIntro = document.getElementById('btnSkipIntro');

function closeSplash() {
  if (welcomeSplash) {
    welcomeSplash.classList.add('hidden');
    setTimeout(() => {
      welcomeSplash.style.display = 'none';
    }, 600);
  }
}

if (btnSkipIntro) {
  btnSkipIntro.addEventListener('click', closeSplash);
}

setTimeout(() => {
  closeSplash();
}, 2000);

// --- Desktop Dynamic Ambient Parallax Animation ---
const backgroundGlow = document.getElementById('backgroundGlow');
const glowSpheres = document.querySelectorAll('.glow-sphere');

if (window.innerWidth > 768 && backgroundGlow) {
  window.addEventListener('mousemove', (e) => {
    const xRatio = (e.clientX / window.innerWidth - 0.5) * 25;
    const yRatio = (e.clientY / window.innerHeight - 0.5) * 25;
    glowSpheres.forEach((sphere, index) => {
      const factor = (index + 1) * 0.6;
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
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const btnClearHistory = document.getElementById('btnClearHistory');
const historyCountBadge = document.getElementById('historyCountBadge');

// Drawer & Modals
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');

const modalAbout = document.getElementById('modalAbout');
const modalCopyright = document.getElementById('modalCopyright');
const modalQr = document.getElementById('modalQr');

const btnNavAbout = document.getElementById('btnNavAbout');
const btnNavCopyright = document.getElementById('btnNavCopyright');
const btnNavQr = document.getElementById('btnNavQr');
const btnNavExe = document.getElementById('btnNavExe');
const btnPwaInstall = document.getElementById('btnPwaInstall');

const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// --- Helper Functions ---
function showToast(msg) {
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function showError(title, msg) {
  if (!errorBox) return;
  errorTitle.textContent = title || 'Error';
  errorMessage.textContent = msg || 'Something went wrong.';
  errorBox.style.display = 'flex';
}

function hideError() {
  if (errorBox) errorBox.style.display = 'none';
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return 'HD Quality';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'HD';
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

// --- Platform Auto-Detection & Real Brand Colors ---
const PLATFORM_MAP = {
  youtube: {
    name: 'YouTube',
    icon: 'fa-brands fa-youtube',
    color: '#ff0000',
    hint: '🔴 YouTube detected. 4K, 1080p, 720p, Shorts & 320kbps MP3 ready!'
  },
  instagram: {
    name: 'Instagram',
    icon: 'fa-brands fa-instagram',
    color: '#dc2743',
    hint: '📸 Instagram detected. Reels, Stories & Posts video ready!'
  },
  tiktok: {
    name: 'TikTok',
    icon: 'fa-brands fa-tiktok',
    color: '#25f4ee',
    hint: '✨ TikTok detected. Direct download with 100% NO WATERMARK!'
  },
  facebook: {
    name: 'Facebook',
    icon: 'fa-brands fa-facebook',
    color: '#1877f2',
    hint: '🔵 Facebook detected. HD Videos & Reels download ready!'
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
    name: 'Universal Downloader',
    icon: 'fa-solid fa-bolt',
    color: '#00f2fe',
    hint: '⚡ AwaisX universal engine. Paste any video or MP3 link to download.'
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
        showToast('Link pasted!');
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
    
    if (currentPlatformFilter === 'youtube') {
      urlInput.placeholder = 'Paste YouTube video, Shorts, or playlist link...';
    } else if (currentPlatformFilter === 'instagram') {
      urlInput.placeholder = 'Paste Instagram Reel, Post, or IGTV link...';
    } else if (currentPlatformFilter === 'tiktok') {
      urlInput.placeholder = 'Paste TikTok video link (No Watermark)...';
    } else {
      urlInput.placeholder = 'Paste any video or audio link here (e.g. YouTube, TikTok, Instagram Reel)...';
    }
    urlInput.focus();
  });
});

// =========================================================
// 🚀 100% IN-TOOL DIRECT STREAMING DOWNLOAD CONTROLLER
// (NO EXTERNAL REDIRECTS, NO BROKEN LINKS, SAVES DIRECTLY)
// =========================================================
function triggerDownload(videoData, opt) {
  const isAudio = opt.isAudio ? 'true' : 'false';
  const formatId = opt.formatId || (opt.isAudio ? 'bestaudio/best' : 'best');
  const ext = opt.ext || (opt.isAudio ? 'mp3' : 'mp4');
  const rawTitle = videoData.title || 'AwaisX_Media';
  const cleanTitle = rawTitle.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80).trim();
  const url = videoData.originalUrl;
  const directUrl = opt.directUrl || '';

  showToast(`⚡ Starting download: "${cleanTitle.slice(0, 25)}..." [${ext.toUpperCase()}]`);

  // Direct CDN URL available (e.g. TikTok No-Watermark)
  if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http') && videoData.platform === 'tiktok') {
    fetch(directUrl)
      .then(res => {
        if (!res.ok) throw new Error('Direct fetch fallback');
        return res.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = `${cleanTitle}.${ext}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
        }, 2000);
        showToast('✅ Download completed directly!');
      })
      .catch(() => {
        // Fallback to backend download proxy
        const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&formatId=${encodeURIComponent(formatId)}&title=${encodeURIComponent(cleanTitle)}&ext=${ext}&isAudio=${isAudio}&directUrl=${encodeURIComponent(directUrl)}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.setAttribute('download', `${cleanTitle}.${ext}`);
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 1500);
        showToast('🚀 Downloading directly to your device...');
      });
    return;
  }

  // Standard In-Tool Streaming Download (YouTube 4K/1080p/720p/MP3, Instagram Reels, Facebook HD)
  const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&formatId=${encodeURIComponent(formatId)}&title=${encodeURIComponent(cleanTitle)}&ext=${ext}&isAudio=${isAudio}&directUrl=${encodeURIComponent(directUrl)}`;

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.setAttribute('download', `${cleanTitle}.${ext}`);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    showToast('✅ Direct download initiated! Check your Downloads folder.');
  }, 1200);
}

// --- Fetch Video Information ---
async function fetchVideoInfo() {
  const url = urlInput.value.trim();
  if (!url) {
    showError('Empty Input', 'Please paste a valid video URL.');
    return;
  }

  btnText.style.display = 'none';
  btnLoader.style.display = 'inline-flex';
  btnFetch.disabled = true;
  hideError();

  const platform = detectPlatformFrontend(url);

  // Check client cache
  if (clientCache.has(url)) {
    const cached = clientCache.get(url);
    renderVideoResult(cached);
    btnText.style.display = 'inline-flex';
    btnLoader.style.display = 'none';
    btnFetch.disabled = false;
    return;
  }

  let videoData = null;

  // 1. Try local/backend server first (Supercharged yt-dlp Core)
  try {
    const res = await fetch('/api/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.data) {
        videoData = json.data;
      }
    }
  } catch (err) {
    console.warn('[Backend /api/info fallback]:', err.message);
  }

  // 2. High-Speed Fallback Direct Extractor (Zero External Redirects!)
  if (!videoData) {
    try {
      if (platform === 'tiktok') {
        const ttRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const ttJson = await ttRes.json();
        if (ttJson && ttJson.code === 0 && ttJson.data) {
          const d = ttJson.data;
          videoData = {
            title: d.title || 'TikTok Video',
            uploader: d.author ? (d.author.nickname || d.author.unique_id) : 'TikTok Creator',
            durationFormatted: formatDuration(d.duration),
            platform: 'tiktok',
            platformName: 'TikTok No-Watermark',
            thumbnail: d.cover || d.origin_cover,
            originalUrl: url,
            videoOptions: [
              {
                quality: '✨ HD Video (No Watermark)',
                ext: 'mp4',
                filesize: d.size ? formatBytes(d.size) : 'HD Quality',
                directUrl: d.play,
                formatId: 'direct'
              },
              {
                quality: '💧 Video (With Watermark)',
                ext: 'mp4',
                filesize: d.wm_size ? formatBytes(d.wm_size) : 'Standard Quality',
                directUrl: d.wmplay || d.play,
                formatId: 'direct'
              }
            ],
            audioOptions: [
              {
                quality: '🎵 Original Sound / MP3',
                ext: 'mp3',
                isAudio: true,
                filesize: 'Audio MP3',
                directUrl: d.music || (d.music_info ? d.music_info.play : null),
                formatId: 'direct'
              }
            ]
          };
        }
      } else if (platform === 'youtube') {
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
        const vidId = ytMatch ? ytMatch[1] : '';
        let ytTitle = 'YouTube Video';
        let ytAuthor = 'YouTube Creator';
        let thumbUrl = vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

        try {
          const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
          const noembedJson = await noembedRes.json();
          if (noembedJson && noembedJson.title) {
            ytTitle = noembedJson.title;
            ytAuthor = noembedJson.author_name || 'YouTube Creator';
          }
        } catch (e) {}

        videoData = {
          title: ytTitle,
          uploader: ytAuthor,
          durationFormatted: 'Full HD',
          platform: 'youtube',
          platformName: 'YouTube HD & MP3',
          thumbnail: thumbUrl,
          originalUrl: url,
          videoOptions: [
            {
              quality: '🚀 1080p Full HD Video (MP4)',
              ext: 'mp4',
              filesize: 'Full HD 1080p',
              formatId: 'b[height<=1080]/best[height<=1080]/best'
            },
            {
              quality: '🎥 720p HD Video (MP4)',
              ext: 'mp4',
              filesize: 'HD 720p',
              formatId: '18/b[height<=720]/best[height<=720]/best'
            },
            {
              quality: '📱 360p Fast Mobile Video (MP4)',
              ext: 'mp4',
              filesize: 'Fast 360p',
              formatId: 'best[height<=360]/best'
            }
          ],
          audioOptions: [
            {
              quality: '🎵 High Quality MP3 (320kbps)',
              ext: 'mp3',
              isAudio: true,
              filesize: '320kbps Audio',
              formatId: 'bestaudio/best'
            },
            {
              quality: '🎶 M4A Audio (AAC Standard)',
              ext: 'm4a',
              isAudio: true,
              filesize: 'Standard Audio',
              formatId: 'bestaudio[ext=m4a]/bestaudio/best'
            }
          ]
        };
      } else if (platform === 'instagram') {
        videoData = {
          title: 'Instagram Reel Video',
          uploader: 'Instagram Creator',
          durationFormatted: 'Reel Video',
          platform: 'instagram',
          platformName: 'Instagram Reels & Posts',
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          originalUrl: url,
          videoOptions: [
            {
              quality: '📸 HD Reel Video (MP4)',
              ext: 'mp4',
              filesize: 'Full HD',
              formatId: 'best'
            }
          ],
          audioOptions: [
            {
              quality: '🎵 Reel Audio Track (MP3)',
              ext: 'mp3',
              isAudio: true,
              filesize: 'Audio Track',
              formatId: 'bestaudio/best'
            }
          ]
        };
      } else {
        videoData = {
          title: `${platform.toUpperCase()} Video Stream`,
          uploader: 'Content Creator',
          durationFormatted: 'HD Media',
          platform: platform,
          platformName: platform.toUpperCase(),
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          originalUrl: url,
          videoOptions: [
            {
              quality: '🚀 Best Quality Video (MP4)',
              ext: 'mp4',
              filesize: 'Full HD',
              formatId: 'best'
            }
          ],
          audioOptions: [
            {
              quality: '🎵 Extracted Sound (MP3)',
              ext: 'mp3',
              isAudio: true,
              filesize: 'Audio Track',
              formatId: 'bestaudio/best'
            }
          ]
        };
      }
    } catch (e) {
      console.error('[Fallback Engine Error]:', e);
    }
  }

  if (videoData) {
    clientCache.set(url, videoData);
    currentVideoData = videoData;
    renderVideoResult(videoData);
    saveToHistory(videoData);
    showToast('Download links ready!');
  } else {
    showError('Fetch Failed', 'Could not process video link. Please verify URL is public and valid.');
  }

  btnText.style.display = 'inline-flex';
  btnLoader.style.display = 'none';
  btnFetch.disabled = false;
}

btnFetch.addEventListener('click', fetchVideoInfo);
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    fetchVideoInfo();
  }
});

// --- Render Video Data in UI ---
function renderVideoResult(data) {
  mediaTitle.textContent = data.title || 'Video';
  mediaAuthor.querySelector('span').textContent = data.uploader || 'Creator';
  mediaDuration.textContent = data.durationFormatted || 'HD Video';
  mediaThumbnail.src = data.thumbnail || '';

  const p = PLATFORM_MAP[data.platform] || PLATFORM_MAP.general;
  mediaPlatform.innerHTML = `<i class="${p.icon}" style="color: ${p.color};"></i> ${data.platformName || p.name}`;

  if (data.viewCount) {
    mediaViews.style.display = 'flex';
    mediaViews.querySelector('span').textContent = `${data.viewCount} views`;
  } else {
    mediaViews.style.display = 'none';
  }

  // 1-Click Quick Action Buttons
  quickButtons.innerHTML = '';

  const bestVid = data.videoOptions && data.videoOptions[0];
  if (bestVid) {
    const vidBtn = document.createElement('button');
    vidBtn.className = 'btn-fast-dl';
    vidBtn.innerHTML = '<i class="fa-solid fa-video"></i> Download Best HD Video (MP4)';
    vidBtn.onclick = () => triggerDownload(data, bestVid);
    quickButtons.appendChild(vidBtn);
  }

  const bestAud = data.audioOptions && data.audioOptions[0];
  if (bestAud) {
    const audBtn = document.createElement('button');
    audBtn.className = 'btn-fast-dl btn-fast-audio';
    audBtn.innerHTML = '<i class="fa-solid fa-music"></i> Download High Quality MP3';
    audBtn.onclick = () => triggerDownload(data, bestAud);
    quickButtons.appendChild(audBtn);
  }

  // Populate Video Formats Table
  videoFormatsList.innerHTML = '';
  if (data.videoOptions && data.videoOptions.length > 0) {
    data.videoOptions.forEach((opt) => {
      const row = document.createElement('div');
      row.className = 'format-row';
      row.innerHTML = `
        <div class="fmt-info">
          <span class="fmt-badge">${opt.ext.toUpperCase()}</span>
          <div>
            <div class="fmt-name">${opt.quality}</div>
            <div class="fmt-size">${opt.filesize || 'HD'}</div>
          </div>
        </div>
        <button class="btn-row-dl">
          <i class="fa-solid fa-download"></i> Download MP4
        </button>
      `;
      row.querySelector('.btn-row-dl').onclick = () => triggerDownload(data, opt);
      videoFormatsList.appendChild(row);
    });
  }

  // Populate Audio Formats Table
  audioFormatsList.innerHTML = '';
  if (data.audioOptions && data.audioOptions.length > 0) {
    data.audioOptions.forEach((opt) => {
      const row = document.createElement('div');
      row.className = 'format-row';
      row.innerHTML = `
        <div class="fmt-info">
          <span class="fmt-badge fmt-badge-audio">${opt.ext.toUpperCase()}</span>
          <div>
            <div class="fmt-name">${opt.quality}</div>
            <div class="fmt-size">${opt.filesize || 'Audio'}</div>
          </div>
        </div>
        <button class="btn-row-dl btn-row-dl-audio">
          <i class="fa-solid fa-download"></i> Download MP3
        </button>
      `;
      row.querySelector('.btn-row-dl').onclick = () => triggerDownload(data, opt);
      audioFormatsList.appendChild(row);
    });
  }

  resultSection.style.display = 'block';
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- History Storage Management ---
function loadHistory() {
  try {
    const saved = localStorage.getItem('awaisx_download_history');
    if (saved) {
      const list = JSON.parse(saved);
      renderHistory(list);
    }
  } catch (e) {}
}

function saveToHistory(item) {
  try {
    let list = [];
    const saved = localStorage.getItem('awaisx_download_history');
    if (saved) list = JSON.parse(saved);
    list = list.filter(i => i.originalUrl !== item.originalUrl);
    list.unshift({
      title: item.title,
      platform: item.platform,
      thumbnail: item.thumbnail,
      originalUrl: item.originalUrl,
      timestamp: Date.now()
    });
    if (list.length > 20) list = list.slice(0, 20);
    localStorage.setItem('awaisx_download_history', JSON.stringify(list));
    renderHistory(list);
  } catch (e) {}
}

function renderHistory(list) {
  if (!historyList) return;
  historyList.innerHTML = '';
  if (!list || list.length === 0) {
    if (historyEmpty) historyEmpty.style.display = 'block';
    if (historyCountBadge) historyCountBadge.textContent = '0';
    return;
  }
  if (historyEmpty) historyEmpty.style.display = 'none';
  if (historyCountBadge) historyCountBadge.textContent = list.length;

  list.forEach(item => {
    const p = PLATFORM_MAP[item.platform] || PLATFORM_MAP.general;
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <img src="${item.thumbnail || ''}" alt="thumb" class="history-thumb">
      <div class="history-details">
        <div class="history-item-title">${item.title || 'Video'}</div>
        <div class="history-item-meta"><i class="${p.icon}" style="color: ${p.color};"></i> ${p.name}</div>
      </div>
      <button class="btn-history-re" title="Re-download video"><i class="fa-solid fa-download"></i></button>
    `;
    el.querySelector('.btn-history-re').onclick = () => {
      urlInput.value = item.originalUrl;
      updatePlatformUI(detectPlatformFrontend(item.originalUrl));
      fetchVideoInfo();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    historyList.appendChild(el);
  });
}

if (btnClearHistory) {
  btnClearHistory.onclick = () => {
    localStorage.removeItem('awaisx_download_history');
    renderHistory([]);
    showToast('Download history cleared.');
  };
}

loadHistory();

// --- FAQ Accordion Logic ---
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const q = item.querySelector('.faq-question');
  if (q) {
    q.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  }
});

// --- Mobile Slide-Out Drawer ---
if (mobileMenuToggle && mobileDrawerOverlay) {
  mobileMenuToggle.addEventListener('click', () => {
    mobileDrawerOverlay.classList.add('active');
  });
}

if (drawerCloseBtn && mobileDrawerOverlay) {
  drawerCloseBtn.addEventListener('click', () => {
    mobileDrawerOverlay.classList.remove('active');
  });
}

if (mobileDrawerOverlay) {
  mobileDrawerOverlay.addEventListener('click', (e) => {
    if (e.target === mobileDrawerOverlay) {
      mobileDrawerOverlay.classList.remove('active');
    }
  });
}

// --- Modals Setup ---
function setupModal(triggerBtn, modalEl) {
  if (!triggerBtn || !modalEl) return;
  triggerBtn.addEventListener('click', () => {
    modalEl.classList.add('active');
    if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove('active');
  });
  const closeBtn = modalEl.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modalEl.classList.remove('active');
    });
  }
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) modalEl.classList.remove('active');
  });
}

setupModal(btnNavAbout, modalAbout);
setupModal(btnNavCopyright, modalCopyright);
setupModal(btnNavQr, modalQr);

// Drawer modal triggers
setupModal(document.getElementById('drawerNavAbout'), modalAbout);
setupModal(document.getElementById('drawerNavCopyright'), modalCopyright);
setupModal(document.getElementById('drawerNavQr'), modalQr);

// Mobile QR Code Generation
if (btnNavQr || document.getElementById('drawerNavQr')) {
  const qrContainer = document.getElementById('qrCodeContainer');
  const qrUrlText = document.getElementById('qrUrlText');
  const generateQr = () => {
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      const targetUrl = window.location.href;
      new QRCode(qrContainer, {
        text: targetUrl,
        width: 180,
        height: 180,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
      if (qrUrlText) qrUrlText.textContent = targetUrl;
    }
  };
  if (btnNavQr) btnNavQr.addEventListener('click', generateQr);
  const dQr = document.getElementById('drawerNavQr');
  if (dQr) dQr.addEventListener('click', generateQr);
}

// Native Windows Desktop .EXE Download
const handleExeDownload = () => {
  showToast('Starting AwaisX Native Windows .EXE download...');
  window.location.href = '/api/download-exe';
};

if (btnNavExe) btnNavExe.addEventListener('click', handleExeDownload);
const drawerNavExe = document.getElementById('drawerNavExe');
if (drawerNavExe) drawerNavExe.addEventListener('click', handleExeDownload);

// PWA Install Prompt Support
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (btnPwaInstall) btnPwaInstall.style.display = 'inline-flex';
});

if (btnPwaInstall) {
  btnPwaInstall.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('AwaisX added to Home Screen!');
      }
      deferredPrompt = null;
    } else {
      showToast('To install: Click browser menu ➔ "Add to Home Screen"');
    }
  });
}
