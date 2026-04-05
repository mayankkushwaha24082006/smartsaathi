// ===== REMINDERS MODULE WITH BULLETPROOF ALARM =====
let notifiedReminders = new Set();
let reminderCheckInterval = null;
let alarmAudioContext = null;
let alarmRepeatInterval = null;
let alarmCountdownInterval = null;

// ===== STEP 1: PLAY ONE MELODY BURST =====
function playAlarmMelody() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn('Web Audio API not supported');
      return;
    }

    // Create fresh context each time
    const ctx = new AudioContext();

    const master = ctx.createGain();
    master.gain.value = 1.0;
    master.connect(ctx.destination);

    const notes = [
      { freq: 523.25, t: 0.00, dur: 0.20 },
      { freq: 659.25, t: 0.25, dur: 0.20 },
      { freq: 783.99, t: 0.50, dur: 0.20 },
      { freq: 1046.5, t: 0.75, dur: 0.45 },
      { freq: 783.99, t: 1.30, dur: 0.20 },
      { freq: 1046.5, t: 1.55, dur: 0.60 },
    ];

    notes.forEach(({ freq, t, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(master);
      const start = ctx.currentTime + t;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.9, start + 0.02);
      gain.gain.setValueAtTime(0.9, start + dur - 0.05);
      gain.gain.linearRampToValueAtTime(0, start + dur);
      osc.start(start);
      osc.stop(start + dur + 0.1);
    });

    // Close context after melody finishes
    setTimeout(() => { try { ctx.close(); } catch(e){} }, 3000);

  } catch(e) {
    console.error('playAlarmMelody error:', e);
  }
}

// ===== STEP 2: RING EVERY 5 SECONDS FOR 2 MINUTES =====
function startAlarmRinging() {
  stopAlarmRinging(); // Clear any previous alarm

  // Play immediately
  playAlarmMelody();
  console.log('🔔 Alarm started - will ring for 2 minutes');

  // Repeat every 5 seconds
  alarmRepeatInterval = setInterval(() => {
    playAlarmMelody();
    console.log('🔔 Alarm ring...');
  }, 5000);

  // Stop after exactly 2 minutes
  setTimeout(() => {
    stopAlarmRinging();
    console.log('🔕 Alarm stopped after 2 minutes');
    // Auto close popup if still showing
    const popup = document.getElementById('alarmPopup');
    if (popup) {
      popup.style.opacity = '0';
      setTimeout(() => { if (popup.parentNode) popup.parentNode.removeChild(popup); }, 500);
    }
  }, 120000);
}

function stopAlarmRinging() {
  if (alarmRepeatInterval) {
    clearInterval(alarmRepeatInterval);
    alarmRepeatInterval = null;
  }
  if (alarmCountdownInterval) {
    clearInterval(alarmCountdownInterval);
    alarmCountdownInterval = null;
  }
}

// ===== STEP 3: SHOW POPUP =====
function showAlarmPopup(reminder) {
  // Remove existing popup
  const old = document.getElementById('alarmPopup');
  if (old) old.remove();

  startAlarmRinging();

  // Vibrate
  if (navigator.vibrate) navigator.vibrate([500,200,500,200,500,200,500]);

  let secondsLeft = 120;

  const popup = document.createElement('div');
  popup.id = 'alarmPopup';
  popup.innerHTML = `
    <div style="
      position:fixed;inset:0;background:rgba(0,0,0,0.88);
      z-index:999999;display:flex;align-items:center;justify-content:center;
    ">
      <div style="
        background:white;border-radius:28px;padding:36px 28px;
        text-align:center;max-width:380px;width:92%;
        box-shadow:0 30px 80px rgba(0,0,0,0.5);
        position:relative;
        animation:zoomIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
      ">

        <!-- Countdown badge -->
        <div id="alarmCountdown" style="
          position:absolute;top:14px;right:14px;
          background:#fee2e2;color:#dc2626;
          border-radius:20px;padding:5px 12px;
          font-size:0.8rem;font-weight:800;
          border:2px solid #fca5a5;
        ">2:00</div>

        <!-- Bell -->
        <div style="
          width:110px;height:110px;border-radius:50%;
          background:linear-gradient(135deg,#1a6fc4,#00b894);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 18px;
          animation:ringPulse 1s ease infinite;
        ">
          <span style="font-size:3.2rem;animation:bellRing 0.4s ease infinite;">🔔</span>
        </div>

        <div style="font-size:0.7rem;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">
          Medicine Reminder
        </div>

        <h2 style="font-size:1.8rem;font-weight:900;color:#111827;margin-bottom:10px;">
          💊 ${reminder.medicineName}
        </h2>

        <div style="
          background:#eff6ff;border-radius:12px;padding:12px 20px;
          margin:0 0 12px;display:inline-block;
          font-weight:700;color:#1d4ed8;font-size:0.95rem;
        ">
          ${reminder.dosage} &nbsp;·&nbsp; ${formatTime(reminder.time)}
          ${reminder.label ? `&nbsp;·&nbsp; ${reminder.label}` : ''}
        </div>

        ${reminder.instructions ? `
          <p style="color:#6b7280;font-size:0.85rem;margin-bottom:10px;">
            📋 ${reminder.instructions}
          </p>` : ''}

        <p style="color:#6b7280;font-size:0.9rem;margin:10px 0 24px;line-height:1.5;">
          Time to take your medicine!<br>
          <strong style="color:#111827;">Please don't skip your dose 💪</strong>
        </p>

        <!-- Buttons -->
        <div style="display:flex;gap:10px;margin-bottom:10px;">
          <button onclick="snoozeAlarm('${reminder.medicineId}','${reminder.time}')" style="
            flex:1;padding:14px 8px;border-radius:14px;
            background:#f3f4f6;color:#374151;border:2px solid #e5e7eb;
            font-size:0.88rem;font-weight:700;cursor:pointer;
          ">
            ⏰<br><span style="font-size:0.78rem;">Snooze 5min</span>
          </button>
          <button onclick="dismissAlarm('${reminder.medicineId}','${reminder.time}',true)" style="
            flex:2;padding:14px 8px;border-radius:14px;
            background:linear-gradient(135deg,#00b894,#059669);
            color:white;border:none;
            font-size:1rem;font-weight:800;cursor:pointer;
            box-shadow:0 4px 15px rgba(0,184,148,0.4);
          ">
            ✅<br>Mark as Taken
          </button>
        </div>

        <button onclick="dismissAlarm('${reminder.medicineId}','${reminder.time}',false)" style="
          width:100%;padding:10px;border-radius:10px;
          background:transparent;color:#9ca3af;border:1px solid #e5e7eb;
          font-size:0.82rem;cursor:pointer;
        ">
          ✕ Dismiss Alarm
        </button>
      </div>
    </div>

    <style>
      @keyframes ringPulse {
        0%,100%{box-shadow:0 0 0 0 rgba(26,111,196,0.5);}
        50%{box-shadow:0 0 0 24px rgba(26,111,196,0);}
      }
      @keyframes bellRing {
        0%,100%{transform:rotate(0);}
        20%{transform:rotate(-20deg);}
        40%{transform:rotate(20deg);}
        60%{transform:rotate(-12deg);}
        80%{transform:rotate(12deg);}
      }
      @keyframes zoomIn {
        from{opacity:0;transform:scale(0.8);}
        to{opacity:1;transform:scale(1);}
      }
    </style>
  `;

  document.body.appendChild(popup);

  // Countdown timer
  const countdownEl = document.getElementById('alarmCountdown');
  alarmCountdownInterval = setInterval(() => {
    secondsLeft--;
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    if (countdownEl) {
      countdownEl.textContent = `${m}:${s.toString().padStart(2,'0')}`;
      if (secondsLeft <= 30) {
        countdownEl.style.background = '#dc2626';
        countdownEl.style.color = 'white';
      }
    }
    if (secondsLeft <= 0) {
      clearInterval(alarmCountdownInterval);
    }
  }, 1000);
}

function snoozeAlarm(medicineId, time) {
  stopAlarmRinging();
  const popup = document.getElementById('alarmPopup');
  if (popup) popup.remove();
  showToast('⏰ Snoozed 5 minutes — alarm will ring again!', 'info', 4000);
  setTimeout(() => {
    notifiedReminders.delete(`${medicineId}_${time}`);
  }, 5 * 60 * 1000);
}

async function dismissAlarm(medicineId, time, markTaken) {
  stopAlarmRinging();
  const popup = document.getElementById('alarmPopup');
  if (popup) popup.remove();

  if (markTaken) {
    try {
      const result = await apiCall(`/medicines/${medicineId}/taken`, 'PATCH', { time });
      if (result && result.ok) {
        showToast('✅ Medicine marked as taken! Well done! 💪', 'success', 4000);
        if (typeof loadReminders === 'function') loadReminders();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
      }
    } catch(e) { console.error(e); }
  } else {
    showToast('⚠️ Alarm dismissed. Remember to take your medicine!', 'warning', 4000);
  }
}

// ===== ALARM CHECKER — runs every 30 seconds for accuracy =====
async function startReminderAlarmChecker() {
  console.log('✅ Reminder alarm checker started');
  await checkAndAlarm();
  // Check every 30 seconds (more accurate than 60)
  reminderCheckInterval = setInterval(checkAndAlarm, 30000);
}

async function checkAndAlarm() {
  try {
    const token = localStorage.getItem(CONFIG ? CONFIG.TOKEN_KEY : 'ss_token');
    if (!token) return;

    const result = await apiCall('/medicines/reminders/today');
    if (!result || !result.ok) return;

    const reminders = result.data.reminders || [];
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hh}:${mm}`;

    reminders.forEach(reminder => {
      if (reminder.taken) return;

      const key = `${reminder.medicineId}_${reminder.time}`;

      // Match current time OR within last 2 minutes (in case checker was delayed)
      const [rh, rm] = reminder.time.split(':').map(Number);
      const [ch, cm] = [parseInt(hh), parseInt(mm)];
      const diffMins = (ch * 60 + cm) - (rh * 60 + rm);

      if (diffMins >= 0 && diffMins <= 2 && !notifiedReminders.has(key)) {
        console.log(`🔔 Medicine due: ${reminder.medicineName} at ${reminder.time}`);
        notifiedReminders.add(key);
        showAlarmPopup(reminder);
      }
    });
  } catch(e) {
    console.error('checkAndAlarm error:', e);
  }
}

// ===== TEST ALARM FUNCTION (for testing without waiting) =====
function testAlarm() {
  const testReminder = {
    medicineId: 'test123',
    medicineName: 'Test Medicine',
    dosage: '500mg',
    time: new Date().toTimeString().slice(0,5),
    label: 'Morning',
    instructions: 'Take with water'
  };
  showAlarmPopup(testReminder);
}

// ===== LOAD REMINDERS PAGE =====
async function loadReminders() {
  const list = document.getElementById('reminderList');
  if (!list) return;

  list.innerHTML = `
    <div style="text-align:center;padding:40px;">
      <i class="fas fa-spinner fa-spin" style="font-size:2.5rem;color:var(--primary);"></i>
      <p style="margin-top:12px;color:var(--text-muted);font-weight:600;">Loading reminders...</p>
    </div>`;

  try {
    const result = await apiCall('/medicines/reminders/today');
    if (!result || !result.ok) {
      list.innerHTML = `<div class="empty-state"><i class="fas fa-wifi-slash"></i><p>Failed to load reminders.</p></div>`;
      return;
    }

    const reminders = result.data.reminders || [];
    const now = new Date().toTimeString().slice(0, 5);

    if (reminders.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-check" style="color:var(--success);font-size:3.5rem;margin-bottom:16px;"></i>
          <h3>No reminders set</h3>
          <p>Add medicines with reminder times to see them here</p>
        </div>`;
      return;
    }

    const upcoming = reminders.filter(r => !r.taken && r.time >= now);
    const missed   = reminders.filter(r => !r.taken && r.time < now);
    const taken    = reminders.filter(r => r.taken);

    let html = '';

    if (upcoming.length > 0) {
      html += `<div style="font-size:0.78rem;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:1px;margin:8px 0 10px;padding-left:4px;">⏰ Upcoming (${upcoming.length})</div>`;
      html += upcoming.map(r => renderReminderItem(r, 'upcoming', now)).join('');
    }
    if (missed.length > 0) {
      html += `<div style="font-size:0.78rem;font-weight:800;color:var(--danger);text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px;padding-left:4px;">⚠️ Missed (${missed.length})</div>`;
      html += missed.map(r => renderReminderItem(r, 'past', now)).join('');
    }
    if (taken.length > 0) {
      html += `<div style="font-size:0.78rem;font-weight:800;color:var(--success);text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px;padding-left:4px;">✅ Taken Today (${taken.length})</div>`;
      html += taken.map(r => renderReminderItem(r, 'taken', now)).join('');
    }

    list.innerHTML = html;
  } catch(err) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load reminders</p></div>`;
  }
}

function renderReminderItem(r, cls, now) {
  return `
    <div class="reminder-item ${cls}">
      <div class="reminder-time">${formatTime(r.time)}</div>
      <div class="reminder-info">
        <div class="reminder-name">${r.medicineName}</div>
        <div class="reminder-dosage">${r.dosage} · ${r.label}${r.instructions ? ` · ${r.instructions}` : ''}</div>
      </div>
      <div class="reminder-status">
        ${r.taken
          ? `<button onclick="toggleTaken('${r.medicineId}','${r.time}')" class="btn btn-sm" style="background:rgba(46,204,113,0.1);color:var(--success);border:1px solid rgba(46,204,113,0.3);"><i class="fas fa-check"></i> Taken</button>`
          : r.time < now
          ? `<button onclick="toggleTaken('${r.medicineId}','${r.time}')" class="btn btn-sm btn-danger"><i class="fas fa-exclamation"></i> Take Now</button>`
          : `<button onclick="toggleTaken('${r.medicineId}','${r.time}')" class="btn btn-sm btn-primary"><i class="fas fa-check"></i> Take Now</button>`
        }
      </div>
    </div>`;
}

async function toggleTaken(medicineId, time) {
  try {
    const result = await apiCall(`/medicines/${medicineId}/taken`, 'PATCH', { time });
    if (!result || !result.ok) { showToast('Update failed', 'error'); return; }
    showToast(result.data.message, 'success');
    loadReminders();
    if (typeof loadDashboardStats === 'function') loadDashboardStats();
  } catch(err) { showToast('Update failed', 'error'); }
}

// Export all functions
window.loadReminders = loadReminders;
window.toggleTaken = toggleTaken;
window.dismissAlarm = dismissAlarm;
window.snoozeAlarm = snoozeAlarm;
window.startReminderAlarmChecker = startReminderAlarmChecker;
window.testAlarm = testAlarm;