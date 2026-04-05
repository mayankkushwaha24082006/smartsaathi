// ===== UTILITY FUNCTIONS =====

// Toast Notification
function showToast(message, type = 'info', duration = 4000) {
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body && method !== 'GET') options.body = JSON.stringify(body);

  const response = await fetch(CONFIG.API_BASE + endpoint, options);
  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.href = '/';
    return;
  }

  return { ok: response.ok, status: response.status, data };
}

// Get stored user
function getUser() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.USER_KEY));
  } catch { return null; }
}

// Set stored user
function setUser(user) {
  localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
}

// Format time (24h -> 12h)
function formatTime(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

// Format date
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Format relative time
function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Loading state for button
function setButtonLoading(btn, loading, text = '') {
  if (loading) {
    btn.disabled = true;
    btn._originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text || 'Please wait...'}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._originalHTML || text;
  }
}

// Get avatar initials
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Validate Indian phone number
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// Confirm dialog
function confirmAction(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:380px;">
        <div style="text-align:center;padding:8px 0;">
          <i class="fas fa-question-circle" style="font-size:3rem;color:var(--warning);margin-bottom:16px;display:block;"></i>
          <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:8px;">Confirm Action</h3>
          <p style="color:var(--text-muted);margin-bottom:24px;">${message}</p>
          <div style="display:flex;gap:12px;justify-content:center;">
            <button class="btn btn-outline" id="cancelBtn">Cancel</button>
            <button class="btn btn-danger" id="confirmBtn">Confirm</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirmBtn').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#cancelBtn').onclick = () => { overlay.remove(); resolve(false); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

// OTP input auto-tab
function setupOTPInputs(container) {
  const inputs = container.querySelectorAll('.otp-digit');
  inputs.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      const value = e.target.value.replace(/\D/g, '');
      input.value = value;
      if (value && idx < inputs.length - 1) inputs[idx + 1].focus();
      if (value) input.classList.add('filled');
      else input.classList.remove('filled');
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx - 1].focus();
    });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      paste.split('').forEach((char, i) => {
        if (inputs[i]) { inputs[i].value = char; inputs[i].classList.add('filled'); }
      });
      const lastFilled = Math.min(paste.length, inputs.length - 1);
      inputs[lastFilled].focus();
    });
  });
}

// Get OTP value from inputs
function getOTPValue(container) {
  return [...container.querySelectorAll('.otp-digit')].map(i => i.value).join('');
}

// OTP Timer
function startOTPTimer(timerEl, seconds, onExpire) {
  let remaining = seconds;
  const spanEl = timerEl.querySelector('span');
  const interval = setInterval(() => {
    remaining--;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    if (spanEl) spanEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    if (remaining <= 0) {
      clearInterval(interval);
      timerEl.innerHTML = '<span style="color:var(--danger)">OTP expired. Request a new one.</span>';
      if (onExpire) onExpire();
    }
  }, 1000);
  return interval;
}

// Show/hide element
function toggle(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden', !show);
}

// Current time string
function getCurrentTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Current date string
function getCurrentDate() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

window.showToast = showToast;
window.apiCall = apiCall;
window.getUser = getUser;
window.setUser = setUser;
window.formatTime = formatTime;
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.setButtonLoading = setButtonLoading;
window.getInitials = getInitials;
window.isValidPhone = isValidPhone;
window.confirmAction = confirmAction;
window.setupOTPInputs = setupOTPInputs;
window.getOTPValue = getOTPValue;
window.startOTPTimer = startOTPTimer;
window.toggle = toggle;
window.getCurrentTime = getCurrentTime;
window.getCurrentDate = getCurrentDate;
