// ===== REMINDERS MODULE =====
async function loadReminders() {
  const list = document.getElementById('reminderList');
  if (!list) return;
  list.innerHTML = `<div style="text-align:center;padding:32px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);"></i></div>`;

  try {
    const result = await apiCall('/medicines/reminders/today');
    if (!result.ok) { showToast('Failed to load reminders', 'error'); return; }
    const reminders = result.data.reminders || [];
    const now = new Date().toTimeString().slice(0, 5);

    if (reminders.length === 0) {
      list.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-check"></i><h3>No reminders set</h3><p>Add medicines with reminder times to see them here</p></div>`;
      return;
    }

    const taken = reminders.filter(r => r.taken);
    const upcoming = reminders.filter(r => !r.taken && r.time >= now);
    const missed = reminders.filter(r => !r.taken && r.time < now);

    let html = '';

    if (upcoming.length > 0) {
      html += `<div style="font-size:0.8rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:8px 0 8px;padding-left:4px;">⏰ Upcoming (${upcoming.length})</div>`;
      html += upcoming.map(r => renderReminderItem(r, 'upcoming', now)).join('');
    }

    if (missed.length > 0) {
      html += `<div style="font-size:0.8rem;font-weight:800;color:var(--danger);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;padding-left:4px;">⚠️ Missed (${missed.length})</div>`;
      html += missed.map(r => renderReminderItem(r, 'past', now)).join('');
    }

    if (taken.length > 0) {
      html += `<div style="font-size:0.8rem;font-weight:800;color:var(--success);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;padding-left:4px;">✅ Taken (${taken.length})</div>`;
      html += taken.map(r => renderReminderItem(r, 'taken', now)).join('');
    }

    list.innerHTML = html;
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-wifi-slash"></i><p>Failed to load reminders</p></div>`;
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
          ? `<button onclick="toggleTaken('${r.medicineId}','${r.time}')" class="btn btn-sm btn-outline" style="color:var(--success);border-color:var(--success);"><i class="fas fa-check"></i> Taken</button>`
          : r.time < now
          ? `<button onclick="toggleTaken('${r.medicineId}','${r.time}')" class="btn btn-sm" style="background:rgba(229,57,53,0.1);color:var(--danger);"><i class="fas fa-times"></i> Missed</button>`
          : `<button onclick="toggleTaken('${r.medicineId}','${r.time}')" class="btn btn-sm btn-primary"><i class="fas fa-check"></i> Take Now</button>`
        }
      </div>
    </div>`;
}

async function toggleTaken(medicineId, time) {
  try {
    const result = await apiCall(`/medicines/${medicineId}/taken`, 'PATCH', { time });
    if (!result.ok) { showToast('Update failed', 'error'); return; }
    showToast(result.data.message, 'success');
    loadReminders();
    loadDashboardStats();
  } catch (err) {
    showToast('Update failed', 'error');
  }
}

window.loadReminders = loadReminders;
window.toggleTaken = toggleTaken;
