(() => {
  const DISPLAY_MS_FOR_NON_TIMED = 5000;

  const setupEl = document.getElementById('setup');
  const stageEl = document.getElementById('stage');
  const mediaWrap = document.getElementById('mediaWrap');
  const folderInput = document.getElementById('folderInput');
  const pickBtn = document.getElementById('pickBtn');
  const startBtn = document.getElementById('startBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusEl = document.getElementById('status');
  const hud = document.getElementById('hud');
  const nowPlaying = document.getElementById('nowPlaying');
  const audioOverlay = document.getElementById('audioOverlay');
  const audioTitle = document.getElementById('audioTitle');

  let playlist = [];
  let idx = 0;
  let timer = null;
  let paused = false;
  let currentVideo = null;
  let currentAudio = null;

  function getExtension(name) {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
  }

  function classify(file) {
    const extension = getExtension(file.name);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) return 'image';
    if (['mp3', 'm4a', 'aac', 'wav', 'ogg'].includes(extension)) return 'audio';
    if (['mp4', 'm4v', 'mov', 'webm'].includes(extension)) return 'video';
    if (['html', 'htm'].includes(extension)) return 'html';
    return null;
  }

  function clearTimers() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function stopPlayback() {
    if (currentVideo) {
      currentVideo.pause();
      currentVideo.src = '';
      currentVideo.load();
      currentVideo = null;
    }
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio.load();
      currentAudio = null;
    }
  }

  function revokeAllURLs() {
    for (const item of playlist) {
      if (item.url) {
        URL.revokeObjectURL(item.url);
      }
    }
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  async function buildPlaylist(files) {
    revokeAllURLs();
    playlist = [];
    idx = 0;
    paused = false;

    const list = Array.from(files);
    list.sort((a, b) => {
      const ap = a.webkitRelativePath || a.name;
      const bp = b.webkitRelativePath || b.name;
      return ap.localeCompare(bp, undefined, { numeric: true, sensitivity: 'base' });
    });

    for (const file of list) {
      const type = classify(file);
      if (!type) continue;
      const item = {
        name: file.webkitRelativePath || file.name,
        file,
        type
      };
      if (type === 'html') {
        item.text = await file.text();
      } else {
        item.url = URL.createObjectURL(file);
      }
      playlist.push(item);
    }
    return playlist.length;
  }

  function showSetup() {
    clearTimers();
    stopPlayback();
    mediaWrap.innerHTML = '';
    audioOverlay.style.display = 'none';
    hud.style.display = 'none';
    stageEl.style.display = 'none';
    setupEl.style.display = 'grid';
  }

  function showStage() {
    setupEl.style.display = 'none';
    stageEl.style.display = 'block';
    hud.style.display = 'flex';
  }

  function updateHUD() {
    if (!playlist.length) {
      nowPlaying.textContent = '';
      return;
    }
    const item = playlist[idx];
    nowPlaying.textContent =
      `${idx + 1}/${playlist.length} — ${item.name} (${item.type})${paused ? ' — PAUSED' : ''}`;
  }

  function scheduleAdvance(ms) {
    clearTimers();
    if (paused) return;
    timer = setTimeout(() => next(), ms);
  }

  async function renderItem() {
    clearTimers();
    stopPlayback();
    mediaWrap.innerHTML = '';
    audioOverlay.style.display = 'none';

    if (!playlist.length) return;

    const item = playlist[idx];
    updateHUD();

    if (item.type === 'image') {
      const img = document.createElement('img');
      img.alt = item.name;
      img.src = item.url;
      mediaWrap.appendChild(img);
      scheduleAdvance(DISPLAY_MS_FOR_NON_TIMED);
      return;
    }

    if (item.type === 'html') {
      const iframe = document.createElement('iframe');
      iframe.setAttribute(
        'sandbox',
        'allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-popups'
      );
      iframe.srcdoc = item.text || '';
      mediaWrap.appendChild(iframe);
      scheduleAdvance(DISPLAY_MS_FOR_NON_TIMED);
      return;
    }

    if (item.type === 'video') {
      const video = document.createElement('video');
      video.src = item.url;
      video.autoplay = true;
      video.playsInline = true;
      video.controls = true;
      video.preload = 'auto';
      video.addEventListener('ended', () => {
        if (!paused) next();
      });
      video.addEventListener('error', () => {
        if (!paused) next();
      });
      currentVideo = video;
      mediaWrap.appendChild(video);
      try {
        await video.play();
      } catch (error) {
        console.warn('Video autoplay blocked or failed:', error);
      }
      return;
    }

    if (item.type === 'audio') {
      audioOverlay.style.display = 'flex';
      audioTitle.textContent = item.name;
      const audio = document.createElement('audio');
      audio.src = item.url;
      audio.autoplay = true;
      audio.controls = true;
      audio.preload = 'auto';
      audio.addEventListener('ended', () => {
        if (!paused) next();
      });
      audio.addEventListener('error', () => {
        if (!paused) next();
      });
      currentAudio = audio;
      mediaWrap.appendChild(audio);
      try {
        await audio.play();
      } catch (error) {
        console.warn('Audio autoplay blocked or failed:', error);
      }
      return;
    }
  }

  function next() {
    if (!playlist.length) return;
    idx = (idx + 1) % playlist.length;
    renderItem();
  }

  function prev() {
    if (!playlist.length) return;
    idx = (idx - 1 + playlist.length) % playlist.length;
    renderItem();
  }

  function togglePause() {
    paused = !paused;
    updateHUD();
    if (paused) {
      clearTimers();
      if (currentVideo) currentVideo.pause();
      if (currentAudio) currentAudio.pause();
      return;
    }
    if (currentVideo) {
      currentVideo.play().catch(() => {});
      return;
    }
    if (currentAudio) {
      currentAudio.play().catch(() => {});
      return;
    }
    scheduleAdvance(DISPLAY_MS_FOR_NON_TIMED);
  }

  function endShow() {
    showSetup();
    setStatus(playlist.length ? `Ready: ${playlist.length} items loaded.` : 'No folder selected.');
  }

  pickBtn.addEventListener('click', () => {
    folderInput.click();
  });

  folderInput.addEventListener('change', async () => {
    const files = folderInput.files;
    if (!files || !files.length) {
      setStatus('No folder selected.');
      startBtn.disabled = true;
      clearBtn.disabled = true;
      return;
    }
    setStatus('Scanning folder...');
    startBtn.disabled = true;
    clearBtn.disabled = true;
    const count = await buildPlaylist(files);
    if (!count) {
      setStatus('Folder selected, but no supported media found.');
      startBtn.disabled = true;
      clearBtn.disabled = false;
      return;
    }
    setStatus(`Folder loaded: ${count} items ready.`);
    startBtn.disabled = false;
    clearBtn.disabled = false;
  });

  startBtn.addEventListener('click', async () => {
    if (!playlist.length) return;
    showStage();
    idx = 0;
    paused = false;
    await renderItem();
  });

  clearBtn.addEventListener('click', () => {
    revokeAllURLs();
    playlist = [];
    idx = 0;
    paused = false;
    folderInput.value = '';
    startBtn.disabled = true;
    clearBtn.disabled = true;
    setStatus('Cleared. No folder selected.');
  });

  window.addEventListener('keydown', (event) => {
    const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    if (event.code === 'Space') {
      event.preventDefault();
      togglePause();
    } else if (event.code === 'ArrowRight') {
      event.preventDefault();
      next();
    } else if (event.code === 'ArrowLeft') {
      event.preventDefault();
      prev();
    } else if (event.code === 'Escape') {
      event.preventDefault();
      endShow();
    }
  });

  showSetup();
})();
