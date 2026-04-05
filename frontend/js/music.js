// ===== MUSIC PLAYER MODULE =====
const PLAYLIST = [
  { title: 'Morning Raaga', artist: 'Wellness Beats', emoji: '🌅', duration: 240, url: null },
  { title: 'Peaceful Om', artist: 'Meditation Music', emoji: '🕉️', duration: 300, url: null },
  { title: 'Nature Sounds', artist: 'Calming Nature', emoji: '🌿', duration: 280, url: null },
  { title: 'Gentle Piano', artist: 'Relaxing Piano', emoji: '🎹', duration: 210, url: null },
  { title: 'Bhajan Bliss', artist: 'Devotional Music', emoji: '🙏', duration: 320, url: null },
  { title: 'Flute Melody', artist: 'Indian Classical', emoji: '🎵', duration: 260, url: null },
  { title: 'Healing Sounds', artist: 'Sound Therapy', emoji: '✨', duration: 350, url: null },
  { title: 'Sleep Melody', artist: 'Dreamscape', emoji: '🌙', duration: 400, url: null },
];

let currentTrack = 0;
let isPlaying = false;
let isLoop = false;
let volume = 0.7;
let progressInterval = null;
let currentSeconds = 0;
let audio = null;
let musicInitialized = false;

function initMusicPlayer() {
  if (musicInitialized) { renderPlaylist(); return; }
  musicInitialized = true;
  renderPlaylist();
  selectTrack(0);
}

function renderPlaylist() {
  const container = document.getElementById('musicPlaylist');
  if (!container) return;
  container.innerHTML = PLAYLIST.map((track, i) => `
    <div class="playlist-item ${i === currentTrack ? 'active' : ''}" onclick="selectTrack(${i})">
      <div class="playlist-icon">${track.emoji}</div>
      <div class="playlist-info">
        <div class="playlist-name">${track.title}</div>
        <div class="playlist-duration">${track.artist} · ${formatDuration(track.duration)}</div>
      </div>
      ${i === currentTrack && isPlaying ? '<i class="fas fa-volume-up" style="color:#5ee7d0;font-size:0.8rem;"></i>' : ''}
    </div>`).join('');
}

function selectTrack(idx) {
  currentTrack = idx;
  currentSeconds = 0;
  const track = PLAYLIST[idx];

  // Update UI
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('musicTitle', track.title);
  el('musicArtist', track.artist);
  el('musicDuration', formatDuration(track.duration));
  el('musicCurrent', '0:00');
  el('musicDisc', track.emoji);

  const fill = document.getElementById('musicProgressFill');
  if (fill) fill.style.width = '0%';

  renderPlaylist();
  if (isPlaying) startPlayback();
}

function togglePlay() {
  isPlaying = !isPlaying;
  const btn = document.getElementById('playPauseBtn');
  const disc = document.getElementById('musicDisc');

  if (isPlaying) {
    btn.innerHTML = '<i class="fas fa-pause"></i>';
    disc?.classList.add('playing');
    startPlayback();
    showToast(`🎵 Playing: ${PLAYLIST[currentTrack].title}`, 'success', 2000);
  } else {
    btn.innerHTML = '<i class="fas fa-play"></i>';
    disc?.classList.remove('playing');
    stopPlayback();
  }
}

function startPlayback() {
  stopPlayback(); // Clear any existing interval
  const track = PLAYLIST[currentTrack];

  progressInterval = setInterval(() => {
    currentSeconds++;
    const pct = (currentSeconds / track.duration) * 100;
    const fill = document.getElementById('musicProgressFill');
    const currentEl = document.getElementById('musicCurrent');
    if (fill) fill.style.width = Math.min(pct, 100) + '%';
    if (currentEl) currentEl.textContent = formatDuration(currentSeconds);

    if (currentSeconds >= track.duration) {
      currentSeconds = 0;
      if (isLoop) {
        // Loop same track
        startPlayback();
      } else {
        nextTrack();
      }
    }
  }, 1000);
}

function stopPlayback() {
  if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % PLAYLIST.length;
  currentSeconds = 0;
  selectTrack(currentTrack);
  if (isPlaying) startPlayback();
}

function prevTrack() {
  if (currentSeconds > 5) { currentSeconds = 0; startPlayback(); return; }
  currentTrack = (currentTrack - 1 + PLAYLIST.length) % PLAYLIST.length;
  currentSeconds = 0;
  selectTrack(currentTrack);
  if (isPlaying) startPlayback();
}

function toggleLoop() {
  isLoop = !isLoop;
  const btn = document.getElementById('loopBtn');
  if (btn) {
    btn.style.color = isLoop ? '#5ee7d0' : '';
    btn.style.background = isLoop ? 'rgba(94,231,208,0.2)' : '';
  }
  showToast(isLoop ? 'Loop enabled 🔁' : 'Loop disabled', 'info', 1500);
}

function setVolume(val) {
  volume = parseFloat(val);
  // Would set audio.volume if real audio was playing
}

function seekMusic(e) {
  const bar = document.getElementById('musicProgressBar');
  if (!bar) return;
  const rect = bar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  const track = PLAYLIST[currentTrack];
  currentSeconds = Math.floor(pct * track.duration);
  const fill = document.getElementById('musicProgressFill');
  const currentEl = document.getElementById('musicCurrent');
  if (fill) fill.style.width = (pct * 100) + '%';
  if (currentEl) currentEl.textContent = formatDuration(currentSeconds);
  if (isPlaying) startPlayback();
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
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
