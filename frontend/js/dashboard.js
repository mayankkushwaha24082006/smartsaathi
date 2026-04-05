// ===== DASHBOARD MAIN =====
let currentSection = 'home';

window.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  if (!token) { window.location.href = '/'; return; }

  await loadUserData();
  updateClock();
  setInterval(updateClock, 60000);
  showSection('home');
  initReminderChecker();
});

async function loadUserData() {
  try {
    const result = await apiCall('/auth/me');
    if (!result.ok) { logout(); return; }
    const user = result.data.user;
    setUser(user);
    renderUserInfo(user);
    await loadDashboardStats();
  } catch (err) {
    console.error('Load user error:', err);
  }
}

function renderUserInfo(user) {
  const initials = getInitials(user.name);
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('sidebarAvatar', initials);
  el('sidebarName', user.name);
  el('sidebarAge', `Age: ${user.age || '--'} | ${user.gender || '--'}`);

  // Update time-based greeting
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  el('welcomeGreeting', `${greeting}, ${user.name.split(' ')[0]}! 🙏`);
  el('welcomeDate', getCurrentDate());
}

async function loadDashboardStats() {
  try {
    const [medsResult, remResult] = await Promise.all([
      apiCall('/medicines?active=true'),
      apiCall('/medicines/reminders/today')
    ]);

    const user = getUser();
    const contacts = user?.emergencyContacts?.length || 0;

    let totalMeds = 0, takenCount = 0, upcomingCount = 0;

    if (medsResult.ok) {
      totalMeds = medsResult.data.medicines?.length || 0;
      document.getElementById('statMeds').textContent = totalMeds;
      document.getElementById('wsTotalMeds').textContent = totalMeds;
      const badge = document.getElementById('medBadge');
      if (totalMeds > 0) { badge.textContent = totalMeds; badge.classList.remove('hidden'); }
    }

    if (remResult.ok) {
      const reminders = remResult.data.reminders || [];
      const now = new Date().toTimeString().slice(0, 5);
      takenCount = reminders.filter(r => r.taken).length;
      upcomingCount = reminders.filter(r => !r.taken && r.time >= now).length;

      document.getElementById('statTaken').textContent = takenCount;
      document.getElementById('statUpcoming').textContent = upcomingCount;
      document.getElementById('wsTodayTaken').textContent = takenCount;
      document.getElementById('wsUpcoming').textContent = upcomingCount;

      // Show notification dot if upcoming
      if (upcomingCount > 0) {
        document.querySelectorAll('.notification-dot').forEach(d => d.style.display = 'block');
      }

      renderHomeReminders(reminders.slice(0, 4));
    }

    document.getElementById('statContacts').textContent = contacts;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function renderHomeReminders(reminders) {
  const container = document.getElementById('homeReminders');
  if (!reminders || reminders.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:20px;"><i class="fas fa-check-circle" style="font-size:2rem;color:var(--success);"></i><p>All caught up for today! ✅</p></div>`;
    return;
  }
  const now = new Date().toTimeString().slice(0, 5);
  container.innerHTML = reminders.map(r => `
    <div class="reminder-item ${r.taken ? 'taken' : r.time < now ? 'past' : 'upcoming'}">
      <div class="reminder-time">${formatTime(r.time)}</div>
      <div class="reminder-info">
        <div class="reminder-name">${r.medicineName}</div>
        <div class="reminder-dosage">${r.dosage} · ${r.label}</div>
      </div>
      <div class="reminder-status">
        ${r.taken ? '<span class="badge badge-success"><i class="fas fa-check"></i> Taken</span>' : 
          r.time < now ? '<span class="badge badge-danger">Missed</span>' : 
          '<span class="badge badge-warning">Pending</span>'}
      </div>
    </div>`).join('');
}

function showSection(name) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const section = document.getElementById(`section-${name}`);
  if (section) { section.classList.remove('hidden'); section.classList.add('fade-in'); }

  const navItem = document.querySelector(`[data-section="${name}"]`);
  if (navItem) navItem.classList.add('active');

  const titles = {
    home: 'Dashboard', medicines: 'My Medicines', reminders: "Today's Reminders",
    disease: 'Disease Check', sos: 'SOS Emergency', music: 'Music Player',
    chatbot: 'AI Chatbot', profile: 'My Profile', voice: 'Voice Assistant'
  };
  const el = document.getElementById('topbarTitle');
  if (el) el.textContent = titles[name] || 'SmartSaathi';

  currentSection = name;

  // Load section-specific data
  if (name === 'home') loadDashboardStats();
  else if (name === 'medicines') loadMedicines();
  else if (name === 'reminders') loadReminders();
  else if (name === 'disease') loadSymptomSuggestions();
  else if (name === 'sos') loadSOSData();
  else if (name === 'music') initMusicPlayer();
  else if (name === 'chatbot') initChatbot();
  else if (name === 'profile') loadProfile();

  // Close sidebar on mobile
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 900) {
    sidebar.classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('hidden');
  }
}

function updateClock() {
  const el = document.getElementById('currentTimeDisplay');
  const el2 = document.getElementById('reminderCurrentTime');
  const time = getCurrentTime();
  if (el) el.textContent = time;
  if (el2) el2.textContent = time;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('hidden');
}

// Reminder notification checker
function initReminderChecker() {
  checkUpcomingReminders();
  setInterval(checkUpcomingReminders, 60000);
}

async function checkUpcomingReminders() {
  try {
    const result = await apiCall('/reminders/upcoming');
    if (!result.ok) return;
    const reminders = result.data.reminders || [];
    const soonReminders = reminders.filter(r => !r.taken && r.minutesUntil >= 0 && r.minutesUntil <= 15);
    soonReminders.forEach(r => {
      if (r.minutesUntil === 0) showToast(`💊 Time to take ${r.medicineName} (${r.dosage})!`, 'warning', 8000);
      else if (r.minutesUntil <= 5) showToast(`⏰ ${r.medicineName} due in ${r.minutesUntil} minute(s)!`, 'info', 6000);
    });
  } catch (err) { /* silent */ }
}

function logout() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
  localStorage.removeItem(CONFIG.USER_KEY);
  showToast('Logged out successfully', 'success');
  setTimeout(() => window.location.href = '/', 800);
}

window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.loadDashboardStats = loadDashboardStats;
