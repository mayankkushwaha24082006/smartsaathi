// ===== SOS MODULE =====
async function loadSOSData() {
    const user = getUser();
    if (!user) return;
  
    // Render emergency contacts
    const contactsList = document.getElementById('sosContactsList');
    if (contactsList) {
      const contacts = user.emergencyContacts || [];
      if (contacts.length === 0) {
        contactsList.innerHTML = `<div class="empty-state" style="padding:20px;"><i class="fas fa-user-plus" style="font-size:2rem;"></i><p>Add emergency contacts in your profile</p></div>`;
      } else {
        contactsList.innerHTML = contacts.map(c => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:8px;">
            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:1rem;">
              ${getInitials(c.name)}
            </div>
            <div style="flex:1;">
              <div style="font-weight:800;font-size:0.95rem;">${c.name}</div>
              <div style="font-size:0.82rem;color:var(--text-muted);">${c.relation} · +91 ${c.phone}</div>
            </div>
            <a href="tel:+91${c.phone}" class="btn btn-sm" style="background:rgba(46,204,113,0.1);color:var(--success);border:1px solid rgba(46,204,113,0.2);">
              <i class="fas fa-phone"></i>
            </a>
          </div>`).join('');
      }
    }
  
    // Load SOS history
    try {
      const result = await apiCall('/sos/history');
      if (!result.ok) return;
      const historyEl = document.getElementById('sosHistory');
      const history = result.data.history || [];
      if (historyEl) {
        if (history.length === 0) {
          historyEl.innerHTML = `<div class="empty-state" style="padding:20px;"><i class="fas fa-check-circle" style="font-size:2rem;color:var(--success);"></i><p>No SOS alerts sent recently</p></div>`;
        } else {
          historyEl.innerHTML = history.slice(0, 5).map(s => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:var(--radius-sm);background:var(--bg);margin-bottom:6px;">
              <div style="width:36px;height:36px;border-radius:50%;background:rgba(229,57,53,0.1);display:flex;align-items:center;justify-content:center;color:var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div style="flex:1;">
                <div style="font-weight:700;font-size:0.85rem;">${s.message || 'Emergency Alert'}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);">${timeAgo(s.createdAt)} · ${s.alertsSent?.length || 0} contacts notified</div>
              </div>
              <span class="badge ${s.status === 'resolved' ? 'badge-success' : 'badge-danger'}">${s.status}</span>
            </div>`).join('');
        }
      }
    } catch (err) { /* silent */ }
  }
  
  async function triggerSOS() {
    const user = getUser();
    const contacts = user?.emergencyContacts || [];
  
    if (contacts.length === 0) {
      const proceed = await confirmAction('⚠️ You have no emergency contacts added. Add contacts in your profile for SOS alerts to work properly.\n\nProceed anyway?');
      if (!proceed) { showSection('profile'); return; }
    } else {
      const confirmed = await confirmAction(`🚨 This will send an emergency alert to ${contacts.length} contact(s).\n\nAre you sure you want to trigger SOS?`);
      if (!confirmed) return;
    }
  
    const btn = document.getElementById('sosBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><span>Sending Alert...</span>`;
      btn.style.background = 'linear-gradient(135deg, #757575, #9e9e9e)';
    }
  
    try {
      // Try to get location
      let locationData = {};
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
          locationData = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (e) { /* no location */ }
      }
  
      const result = await apiCall('/sos/trigger', 'POST', {
        ...locationData,
        message: 'EMERGENCY! I need immediate help!'
      });
  
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>SOS HELP</span>`;
        btn.style.background = '';
      }
  
      if (!result.ok) { showToast(result.data.message, 'error'); return; }
  
      showToast(`🚨 ${result.data.message}`, 'warning', 8000);
      loadSOSData();
  
      // Show success dialog
      const container = document.getElementById('modalsContainer');
      container.innerHTML = `
        <div class="modal-overlay" onclick="this.remove()">
          <div class="modal" style="max-width:380px;text-align:center;">
            <div style="font-size:4rem;margin-bottom:12px;">🚨</div>
            <h2 style="color:var(--danger);font-size:1.4rem;font-weight:900;margin-bottom:8px;">SOS Alert Sent!</h2>
            <p style="color:var(--text-muted);margin-bottom:16px;">${result.data.message}</p>
            <div style="background:#fff5f5;border-radius:var(--radius-sm);padding:12px;margin-bottom:20px;">
              ${(result.data.contacts || []).map(c => `<div style="font-size:0.9rem;font-weight:600;">✅ ${c.name}</div>`).join('')}
            </div>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px;">Emergency numbers: <strong>112</strong> · Ambulance: <strong>102</strong></p>
            <button class="btn btn-primary w-full" onclick="this.closest('.modal-overlay').remove()">OK, Stay Safe</button>
          </div>
        </div>`;
  
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>SOS HELP</span>`;
        btn.style.background = '';
      }
      showToast('SOS failed. Please call 112 directly!', 'error', 8000);
    }
  }
  
  window.loadSOSData = loadSOSData;
  window.triggerSOS = triggerSOS;