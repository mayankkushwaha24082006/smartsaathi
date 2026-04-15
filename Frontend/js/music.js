// ===== MUSIC PLAYER MODULE =====
// Using YouTube embed + Web Audio API generated music

const PLAYLIST = [
  { title: 'Morning Meditation', artist: 'Calm Vibes', emoji: '🌅', duration: 180,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { title: 'Peaceful Nature', artist: 'Nature Sounds', emoji: '🌿', duration: 200,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb6b35761.mp3' },
  { title: 'Gentle Piano', artist: 'Relaxing Piano', emoji: '🎹', duration: 210,
    url: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b32e57b9.mp3' },
  { title: 'Healing Melody', artist: 'Sound Therapy', emoji: '✨', duration: 195,
    url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3' },
  { title: 'Calm Breeze', artist: 'Wellness Beats', emoji: '💨', duration: 220,
    url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b4a8517.mp3' },
  { title: 'Deep Relaxation', artist: 'Meditation Music', emoji: '🧘', duration: 240,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { title: 'Sleep Well', artist: 'Dreamscape', emoji: '🌙', duration: 260,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/17/audio_b7e4f5e7d0.mp3' },
  { title: 'Morning Joy', artist: 'Indian Classical', emoji: '🌸', duration: 190,
    url: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_e4f94f6a74.mp3' }
];

let currentTrack = 0;
let isPlaying = false;
let isLoop = false;
let volume = 0.7;
let audioPlayer = null;
let musicInitialized = false;
let useGeneratedMusic = false;
let genMusicContext = null;
let genMusicSource = null;

// ===== GENERATED MUSIC (fallback when URLs fail) =====
function createGeneratedMusic(type) {
  try {
    if (genMusicContext) { genMusicContext.close(); }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    genMusicContext = new AudioContext();

    const patterns = {
      0: [261.63, 329.63, 392.00, 523.25], // C major
      1: [293.66, 369.99, 440.00, 587.33], // D major
      2: [329.63, 415.30, 493.88, 659.25], // E major
      3: [349.23, 440.00, 523.25, 698.46], // F major
      4: [392.00, 493.88, 587.33, 783.99], // G major
    };

    const notes = patterns[type % 5];
    let time = genMusicContext.currentTime;
    const noteLen = 0.8;
    const gap = 0.1;

    const playNote = (freq, start, dur) => {
      const osc = genMusicContext.createOscillator();
      const gain = genMusicContext.createGain();
      const filter = genMusicContext.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.value = 1500;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(genMusicContext.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume * 0.3, start + 0.05);
      gain.gain.setValueAtTime(volume * 0.3, start + dur - 0.1);
      gain.gain.linearRampToValueAtTime(0, start + dur);

      osc.start(start);
      osc.stop(start + dur);
    };

    // Play looping pattern
    const scheduleMelody = () => {
      const now = genMusicContext.currentTime;
      for (let i = 0; i < 4; i++) {
        playNote(notes[i], now + i * (noteLen + gap), noteLen);
        playNote(notes[i] * 0.5, now + i * (noteLen + gap), noteLen); // bass
      }
    };

    scheduleMelody();
    // Repeat every 4 seconds
    const repeatInterval = setInterval(() => {
      if (!isPlaying || !useGeneratedMusic) {
        clearInterval(repeatInterval);
        return;
      }
      scheduleMelody();
    }, 4000);

    return repeatInterval;
  } catch(e) {
    console.error('Generated music error:', e);
  }
}

function stopGeneratedMusic() {
  if (genMusicContext) {
    try { genMusicContext.close(); } catch(e) {}
    genMusicContext = null;
  }
}

// ===== INIT PLAYER =====
function initMusicPlayer() {
  if (musicInitialized) { renderPlaylist(); return; }
  musicInitialized = true;

  audioPlayer = new Audio();
  audioPlayer.volume = volume;

  audioPlayer.addEventListener('ended', () => {
    if (isLoop) {
      audioPlayer.currentTime = 0;
      audioPlayer.play().catch(e => {});
    } else {
      nextTrack();
    }
  });

  audioPlayer.addEventListener('timeupdate', () => {
    if (useGeneratedMusic) return;
    const duration = audioPlayer.duration || PLAYLIST[currentTrack].duration;
    const current = audioPlayer.currentTime;
    const pct = duration ? (current / duration) * 100 : 0;
    const fill = document.getElementById('musicProgressFill');
    const currentEl = document.getElementById('musicCurrent');
    const durationEl = document.getElementById('musicDuration');
    if (fill) fill.style.width = Math.min(pct, 100) + '%';
    if (currentEl) currentEl.textContent = formatDuration(Math.floor(current));
    if (durationEl && audioPlayer.duration) durationEl.textContent = formatDuration(Math.floor(audioPlayer.duration));
  });

  audioPlayer.addEventListener('error', () => {
    console.log('URL failed, switching to generated music');
    useGeneratedMusic = true;
    showToast('🎵 Streaming unavailable — playing generated music', 'info', 3000);
    if (isPlaying) {
      stopGeneratedMusic();
      createGeneratedMusic(currentTrack);
      startFakeProgress();
    }
  });

  audioPlayer.addEventListener('canplay', () => {
    useGeneratedMusic = false;
  });

  renderPlaylist();
  selectTrack(0);
}

let fakeProgressInterval = null;
let fakeSeconds = 0;

function startFakeProgress() {
  if (fakeProgressInterval) clearInterval(fakeProgressInterval);
  const track = PLAYLIST[currentTrack];
  fakeProgressInterval = setInterval(() => {
    if (!isPlaying) { clearInterval(fakeProgressInterval); return; }
    fakeSeconds++;
    const pct = (fakeSeconds / track.duration) * 100;
    const fill = document.getElementById('musicProgressFill');
    const currentEl = document.getElementById('musicCurrent');
    if (fill) fill.style.width = Math.min(pct, 100) + '%';
    if (currentEl) currentEl.textContent = formatDuration(fakeSeconds);
    if (fakeSeconds >= track.duration) {
      clearInterval(fakeProgressInterval);
      fakeSeconds = 0;
      if (!isLoop) nextTrack();
      else { fakeSeconds = 0; startFakeProgress(); }
    }
  }, 1000);
}

function renderPlaylist() {
  const container = document.getElementById('musicPlaylist');
  if (!container) return;
  container.innerHTML = PLAYLIST.map((track, i) => `
    <div class="playlist-item ${i === currentTrack ? 'active' : ''}" onclick="selectTrack(${i})" style="cursor:pointer;">
      <div class="playlist-icon">${track.emoji}</div>
      <div class="playlist-info">
        <div class="playlist-name">${track.title}</div>
        <div class="playlist-duration">${track.artist} · ${formatDuration(track.duration)}</div>
      </div>
      ${i === currentTrack && isPlaying ? '<i class="fas fa-volume-up" style="color:#5ee7d0;font-size:0.85rem;margin-left:auto;"></i>' : ''}
    </div>`).join('');
}

function selectTrack(idx) {
  currentTrack = idx;
  fakeSeconds = 0;
  useGeneratedMusic = false;
  const track = PLAYLIST[idx];

  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('musicTitle', track.title);
  el('musicArtist', track.artist);
  el('musicDuration', formatDuration(track.duration));
  el('musicCurrent', '0:00');
  el('musicDisc', track.emoji);

  const fill = document.getElementById('musicProgressFill');
  if (fill) fill.style.width = '0%';

  stopGeneratedMusic();
  if (fakeProgressInterval) clearInterval(fakeProgressInterval);

  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.src = track.url;
    audioPlayer.load();
    if (isPlaying) {
      audioPlayer.play().catch(() => {
        useGeneratedMusic = true;
        createGeneratedMusic(currentTrack);
        startFakeProgress();
      });
    }
  }
  renderPlaylist();
}

function togglePlay() {
  if (!audioPlayer) initMusicPlayer();
  isPlaying = !isPlaying;

  if (isPlaying) {
    if (useGeneratedMusic) {
      stopGeneratedMusic();
      createGeneratedMusic(currentTrack);
      startFakeProgress();
      showToast(`🎵 Playing: ${PLAYLIST[currentTrack].title}`, 'success', 2000);
    } else {
      if (!audioPlayer.src || audioPlayer.src === window.location.href) {
        audioPlayer.src = PLAYLIST[currentTrack].url;
        audioPlayer.load();
      }
      audioPlayer.play().then(() => {
        showToast(`🎵 Playing: ${PLAYLIST[currentTrack].title}`, 'success', 2000);
      }).catch(() => {
        useGeneratedMusic = true;
        createGeneratedMusic(currentTrack);
        startFakeProgress();
        showToast(`🎵 Playing: ${PLAYLIST[currentTrack].title}`, 'success', 2000);
      });
    }
  } else {
    audioPlayer.pause();
    stopGeneratedMusic();
    if (fakeProgressInterval) clearInterval(fakeProgressInterval);
  }

  updatePlayBtn();
  renderPlaylist();
}

function updatePlayBtn() {
  const btn = document.getElementById('playPauseBtn');
  const disc = document.getElementById('musicDisc');
  if (btn) btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
  if (disc) {
    if (isPlaying) disc.classList.add('playing');
    else disc.classList.remove('playing');
  }
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % PLAYLIST.length;
  fakeSeconds = 0;
  selectTrack(currentTrack);
  if (isPlaying) {
    if (useGeneratedMusic) { stopGeneratedMusic(); createGeneratedMusic(currentTrack); startFakeProgress(); }
    else audioPlayer.play().catch(() => { useGeneratedMusic = true; createGeneratedMusic(currentTrack); startFakeProgress(); });
  }
  updatePlayBtn();
}

function prevTrack() {
  if (audioPlayer && !useGeneratedMusic && audioPlayer.currentTime > 3) {
    audioPlayer.currentTime = 0; return;
  }
  currentTrack = (currentTrack - 1 + PLAYLIST.length) % PLAYLIST.length;
  fakeSeconds = 0;
  selectTrack(currentTrack);
  if (isPlaying) {
    if (useGeneratedMusic) { stopGeneratedMusic(); createGeneratedMusic(currentTrack); startFakeProgress(); }
    else audioPlayer.play().catch(() => { useGeneratedMusic = true; createGeneratedMusic(currentTrack); startFakeProgress(); });
  }
  updatePlayBtn();
}

function toggleLoop() {
  isLoop = !isLoop;
  const btn = document.getElementById('loopBtn');
  if (btn) {
    btn.style.color = isLoop ? '#5ee7d0' : '';
    btn.style.background = isLoop ? 'rgba(94,231,208,0.2)' : '';
  }
  showToast(isLoop ? '🔁 Loop enabled' : 'Loop disabled', 'info', 1500);
}

function setVolume(val) {
  volume = parseFloat(val);
  if (audioPlayer) audioPlayer.volume = volume;
}

function seekMusic(e) {
  const bar = document.getElementById('musicProgressBar');
  if (!bar) return;
  const rect = bar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  if (!useGeneratedMusic && audioPlayer && audioPlayer.duration) {
    audioPlayer.currentTime = pct * audioPlayer.duration;
  } else {
    fakeSeconds = Math.floor(pct * PLAYLIST[currentTrack].duration);
  }
}

function formatDuration(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

window.initMusicPlayer = initMusicPlayer;
window.selectTrack = selectTrack;
window.togglePlay = togglePlay;
window.nextTrack = nextTrack;
window.prevTrack = prevTrack;
window.toggleLoop = toggleLoop;
window.setVolume = setVolume;
window.seekMusic = seekMusic;