const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const archiver = require('archiver');
let BIN_PATH = path.join(__dirname, 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
let BIN_DIR = path.join(__dirname, 'bin');
let ensureEngine = async () => BIN_PATH;
try {
  const engine = require('./scripts/init-engine');
  BIN_PATH = engine.BIN_PATH;
  BIN_DIR = engine.BIN_DIR;
  ensureEngine = engine.ensureEngine;
} catch (e) {}

let compileExe = () => false;
try {
  compileExe = require('./scripts/build-exe').compileExe;
} catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;

// In-Memory Fast Cache (TTL: 15 minutes) for ultra-fast sub-second response
const metadataCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCached(key) {
  const item = metadataCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    metadataCache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  if (metadataCache.size > 500) {
    const firstKey = metadataCache.keys().next().value;
    metadataCache.delete(firstKey);
  }
  metadataCache.set(key, { timestamp: Date.now(), data });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from both public and root directory
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));
app.use(express.static(__dirname, { maxAge: '1h' }));

// Detect video platform
function detectPlatform(url) {
  if (!url || typeof url !== 'string') return 'general';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/i.test(url)) return 'tiktok';
  if (/facebook\.com|fb\.watch/i.test(url)) return 'facebook';
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter';
  if (/pinterest\.com|pin\.it/i.test(url)) return 'pinterest';
  if (/reddit\.com|redd\.it/i.test(url)) return 'reddit';
  return 'general';
}

// Format duration helper
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

// Format bytes helper
function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return 'HD';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Sanitize filename
function sanitizeFilename(name) {
  if (!name) return 'AwaisX_Media';
  return name.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 100).trim();
}

// Get Local IPv4 Address
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// --- TikTok Specialized Fast Extractor ---
async function fetchTikTokDirect(url) {
  try {
    const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (res.data && res.data.code === 0 && res.data.data) {
      const d = res.data.data;
      return {
        success: true,
        data: {
          title: d.title || 'TikTok Video',
          id: d.id,
          durationFormatted: formatDuration(d.duration),
          durationSeconds: d.duration || 0,
          uploader: d.author ? (d.author.nickname || d.author.unique_id) : 'TikTok User',
          platform: 'tiktok',
          platformName: 'TikTok No-Watermark',
          thumbnail: d.cover || d.origin_cover,
          originalUrl: url,
          webpageUrl: url,
          viewCount: d.play_count ? d.play_count.toLocaleString() : null,
          videoOptions: [
            {
              quality: '✨ HD Video (No Watermark)',
              height: 1080,
              ext: 'mp4',
              formatId: 'direct',
              filesize: d.size ? formatBytes(d.size) : 'HD Quality',
              directUrl: d.play
            },
            {
              quality: '💧 Video (With Watermark)',
              height: 720,
              ext: 'mp4',
              formatId: 'direct',
              filesize: d.wm_size ? formatBytes(d.wm_size) : 'Standard Quality',
              directUrl: d.wmplay || d.play
            }
          ],
          audioOptions: [
            {
              quality: '🎵 Original TikTok Sound / MP3',
              ext: 'mp3',
              formatId: 'direct',
              isAudio: true,
              filesize: 'Audio MP3',
              directUrl: d.music || (d.music_info ? d.music_info.play : null)
            }
          ]
        }
      };
    }
  } catch (err) {
    console.warn('[TikTok Fast Extractor Fallback]:', err.message);
  }
  return null;
}

// API: Health Check
app.get('/api/health', (req, res) => {
  const engineExists = fs.existsSync(BIN_PATH);
  res.json({
    status: 'ok',
    app: 'AwaisX',
    edition: '14 August Pakistan Independence Day Edition 🇵🇰',
    version: '1.0.0',
    developer: 'Awais',
    engineInstalled: engineExists,
    platform: process.platform,
    time: new Date().toISOString()
  });
});

// API: About Details
app.get('/api/about', (req, res) => {
  res.json({
    app: 'AwaisX',
    developer: 'Awais',
    launchDate: '2026-08-14 (14 August - Pakistan Independence Day)',
    celebration: '🇵🇰 Official 14 August Independence Day Special Release 🇵🇰',
    version: '1.0.0 Pro',
    license: 'MIT / Free for Personal Use',
    mission: 'High-speed, unrestricted, watermark-free video and MP3 media downloader for everyone worldwide.',
    supportedPlatforms: ['YouTube', 'Instagram Reels & Stories', 'TikTok (No Watermark)', 'Facebook', 'Twitter/X', 'Pinterest', 'Reddit', 'Vimeo', '1000+ Websites'],
    features: [
      '4K, 1080p, 720p 60fps HD Video Extraction',
      'High-Bitrate 320kbps MP3 Audio Conversion',
      'TikTok No-Watermark Direct Engine',
      'Native Windows .EXE Desktop Launcher (Zero Zip Extraction)',
      '1-Tap Mobile PWA Installable App for Android & iPhone',
      'Local WiFi Network Sharing with QR Code',
      'Ultra-Fast In-Memory Cache with Sub-Second Processing',
      'Zero Ads, Zero Popups, 100% Free Forever'
    ]
  });
});

// API: Copyright Claim & DMCA Policy
app.get('/api/copyright', (req, res) => {
  res.json({
    title: 'Copyright Notice & DMCA Policy',
    developer: 'Awais',
    disclaimer: 'AwaisX is a media transformation and personal backup utility tool. It does not host, store, or pirate any copyrighted media on its servers. All audio/video streams are fetched directly from original content distribution networks via public protocols.',
    fairUse: 'This service complies with Section 107 of the US Copyright Act and international fair use guidelines for personal archiving, educational analysis, and non-commercial fair use.',
    dmcaCompliance: 'If you are a copyright owner or an agent thereof and believe that any content made accessible through this tool infringes upon your copyright, you may submit a takedown request to block specific URL patterns.',
    contactEmail: 'contact.awaisx@gmail.com'
  });
});

// API: Direct Native Windows EXE Download
app.get('/api/download-exe', (req, res) => {
  const exePath = path.join(__dirname, 'Awais-Download-Fast.exe');
  const binExePath = path.join(BIN_DIR, 'Awais-Download-Fast.exe');

  let targetPath = null;
  if (fs.existsSync(exePath)) {
    targetPath = exePath;
  } else if (fs.existsSync(binExePath)) {
    targetPath = binExePath;
  } else {
    compileExe();
    if (fs.existsSync(exePath)) targetPath = exePath;
  }

  if (targetPath && fs.existsSync(targetPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="AwaisX-Launcher.exe"');
    res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
    fs.createReadStream(targetPath).pipe(res);
  } else {
    res.redirect('/api/download-installer/windows');
  }
});

// API: Network Info & Mobile Link
app.get('/api/network-info', (req, res) => {
  const ip = getLocalNetworkIp();
  res.json({
    localIp: ip,
    port: PORT,
    edition: '14 August Independence Day Edition 🇵🇰',
    localUrl: `http://localhost:${PORT}`,
    networkUrl: `http://${ip}:${PORT}`,
    downloadExeUrl: `http://${ip}:${PORT}/api/download-exe`,
    downloadAppUrl: `http://${ip}:${PORT}/api/download-app`,
    downloadInstallerUrl: `http://${ip}:${PORT}/api/download-installer/windows`,
    hostname: os.hostname()
  });
});

// API: Extract Video Information & Formats
app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'Please enter a valid video link.' });
    }

    const trimmedUrl = url.trim();

    // Check fast in-memory cache first
    const cachedData = getCached(trimmedUrl);
    if (cachedData) {
      console.log(`[Cache Hit] Instant response for: ${trimmedUrl.slice(0, 50)}...`);
      return res.json(cachedData);
    }

    const platform = detectPlatform(trimmedUrl);

    // If TikTok, use instant direct no-watermark API
    if (platform === 'tiktok') {
      const tiktokData = await fetchTikTokDirect(trimmedUrl);
      if (tiktokData) {
        setCache(trimmedUrl, tiktokData);
        return res.json(tiktokData);
      }
    }

    // Ensure engine binary exists
    if (!fs.existsSync(BIN_PATH)) {
      await ensureEngine();
    }

    // yt-dlp extraction args with player clients
    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      '--no-check-certificates',
      '--extractor-args', 'youtube:player_client=ios,android,mweb,web',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      trimmedUrl
    ];

    execFile(BIN_PATH, args, { maxBuffer: 1024 * 1024 * 60 }, async (error, stdout, stderr) => {
      if (error) {
        console.error('[Extract Info Error]:', stderr || error.message);

        if (platform === 'tiktok') {
          const directData = await fetchTikTokDirect(trimmedUrl);
          if (directData) {
            setCache(trimmedUrl, directData);
            return res.json(directData);
          }
        }

        return res.status(500).json({
          success: false,
          error: 'Could not fetch video information. Please ensure the link is public, accessible, and valid.'
        });
      }

      try {
        const rawInfo = JSON.parse(stdout);
        const rawFormats = rawInfo.formats || [];
        const videoOptions = [];
        const audioOptions = [];

        // Resolutions
        const heightLabels = [
          { height: 2160, label: '4K Ultra HD (2160p)' },
          { height: 1440, label: '2K Quad HD (1440p)' },
          { height: 1080, label: 'Full HD (1080p)' },
          { height: 720, label: 'HD (720p)' },
          { height: 480, label: 'SD (480p)' },
          { height: 360, label: 'Fast (360p)' }
        ];

        heightLabels.forEach(({ height, label }) => {
          const match = rawFormats.find(f => f.height === height && (f.vcodec !== 'none' || f.ext === 'mp4'));
          if (match) {
            videoOptions.push({
              quality: label,
              height: height,
              ext: 'mp4',
              formatId: `b[height<=${height}]/best[height<=${height}]/bestvideo[height<=${height}]+bestaudio/best`,
              filesize: match.filesize || match.filesize_approx ? formatBytes(match.filesize || match.filesize_approx) : 'HD',
              directUrl: match.url || null
            });
          }
        });

        // Best Video Option
        videoOptions.unshift({
          quality: '🚀 Best Video (Highest Quality MP4)',
          height: rawInfo.height || 1080,
          ext: 'mp4',
          formatId: 'b/best[ext=mp4]/bestvideo+bestaudio/best',
          filesize: 'Full Quality',
          directUrl: null
        });

        // 720p standard fallback
        if (!videoOptions.some(v => v.height === 720)) {
          videoOptions.push({
            quality: 'HD (720p MP4)',
            height: 720,
            ext: 'mp4',
            formatId: '18/b[height<=720]/best[height<=720]/best',
            filesize: 'Standard HD',
            directUrl: null
          });
        }

        // Audio options
        audioOptions.push({
          quality: '🎵 High Quality MP3 (320kbps Audio)',
          ext: 'mp3',
          formatId: 'bestaudio/best',
          isAudio: true,
          filesize: '320kbps HQ'
        });

        audioOptions.push({
          quality: '🎶 M4A Audio (AAC Standard)',
          ext: 'm4a',
          formatId: 'bestaudio[ext=m4a]/bestaudio/best',
          isAudio: true,
          filesize: 'Standard'
        });

        let bestThumbnail = rawInfo.thumbnail;
        if (Array.isArray(rawInfo.thumbnails) && rawInfo.thumbnails.length > 0) {
          bestThumbnail = rawInfo.thumbnails[rawInfo.thumbnails.length - 1].url || rawInfo.thumbnail;
        }

        const responsePayload = {
          success: true,
          data: {
            title: rawInfo.title || 'Video',
            id: rawInfo.id,
            durationFormatted: formatDuration(rawInfo.duration),
            durationSeconds: rawInfo.duration || 0,
            uploader: rawInfo.uploader || rawInfo.channel || rawInfo.creator || 'Creator',
            platform: platform,
            platformName: rawInfo.extractor_key || platform.toUpperCase(),
            thumbnail: bestThumbnail,
            originalUrl: trimmedUrl,
            webpageUrl: rawInfo.webpage_url || trimmedUrl,
            viewCount: rawInfo.view_count ? rawInfo.view_count.toLocaleString() : null,
            videoOptions: videoOptions,
            audioOptions: audioOptions
          }
        };

        setCache(trimmedUrl, responsePayload);
        res.json(responsePayload);
      } catch (parseErr) {
        console.error('[Parse Info JSON Error]:', parseErr);
        res.status(500).json({ success: false, error: 'Failed to process video stream data.' });
      }
    });
  } catch (err) {
    console.error('[Server Error /api/info]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Stream & Download Video / Audio
app.get('/api/download', async (req, res) => {
  try {
    const { url, directUrl, formatId, isAudio, title, ext } = req.query;

    if (!url && !directUrl) {
      return res.status(400).send('Missing video URL parameter.');
    }

    const cleanTitle = sanitizeFilename(title || 'AwaisX_Media');
    const fileExt = ext || (isAudio === 'true' ? 'mp3' : 'mp4');
    const filename = `${cleanTitle}.${fileExt}`;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', isAudio === 'true' ? 'audio/mpeg' : 'video/mp4');

    // 1. Direct CDN streaming if directUrl is provided (e.g. TikTok No-Watermark)
    if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
      try {
        const streamRes = await axios({
          method: 'get',
          url: directUrl,
          responseType: 'stream',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        streamRes.data.pipe(res);
        return;
      } catch (directErr) {
        console.warn('[Direct Stream Failed, falling back to yt-dlp]:', directErr.message);
      }
    }

    // 2. yt-dlp core streaming
    if (!fs.existsSync(BIN_PATH)) {
      await ensureEngine();
    }

    const formatSelector = formatId && formatId !== 'direct'
      ? formatId 
      : (isAudio === 'true' ? 'bestaudio/best' : 'b/18/best[height<=720]/best[ext=mp4]/best');

    const downloadArgs = [
      '--no-warnings',
      '--no-playlist',
      '--no-check-certificates',
      '--extractor-args', 'youtube:player_client=ios,android,mweb,web',
      '-f', formatSelector,
      '-o', '-',
      url
    ];

    console.log(`[Download Streaming] "${cleanTitle}" (${formatSelector})`);

    const child = spawn(BIN_PATH, downloadArgs);

    child.stdout.pipe(res);

    child.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('[download]') || msg.includes('ERROR')) {
        console.log(`[Stream]: ${msg.trim()}`);
      }
    });

    child.on('error', (err) => {
      console.error('[Download Stream Spawn Error]:', err);
      if (!res.headersSent) {
        res.status(500).send('Download stream failed.');
      }
    });

    req.on('close', () => {
      child.kill('SIGINT');
    });

  } catch (err) {
    console.error('[Server Error /api/download]:', err);
    if (!res.headersSent) {
      res.status(500).send(`Download error: ${err.message}`);
    }
  }
});

// Root fallback to index.html
app.get('*', (req, res) => {
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  const rootIndex = path.join(__dirname, 'index.html');
  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  } else if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  res.send('<h1>AwaisX is active!</h1>');
});

// Start Server on 0.0.0.0 for LAN & Mobile accessibility
if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalNetworkIp();
    console.log(`
=====================================================
  ⚡ AWAISX - UNIVERSAL MEDIA DOWNLOADER ⚡
  🇵🇰 14 AUGUST INDEPENDENCE DAY SPECIAL EDITION 🇵🇰
=====================================================
  💻 PC / Desktop:   http://localhost:${PORT}
  📱 Mobile / WiFi:  http://${localIp}:${PORT}
=====================================================
  YouTube Bot-Bypass, TikTok No-Watermark & Insta Ready!
=====================================================
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Port Warning] Port ${PORT} is already in use.`);
    } else {
      console.error('[Server Error]:', err);
    }
  });
}

module.exports = app;
