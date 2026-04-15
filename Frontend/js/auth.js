// ===== AUTH LOGIC =====
let otpTimerInterval = null;

window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  if (token) {
    window.location.href = '/dashboard';
    return;
  }
  setTimeout(() => {
    const screen = document.getElementById('loadingScreen');
    if (screen) {
      screen.classList.add('fade-out');
      setTimeout(() => { screen.style.display = 'none'; showLanding(); }, 500);
    }
  }, 2200);
});

function showLanding() {
  toggle('landingPage', true);
  toggle('authSection', false);
}

function showAuth(mode) {
  toggle('landingPage', false);
  toggle('authSection', true);
  toggleAuth(mode);
}

function toggleAuth(mode) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (mode === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  }
}

async function sendOTP(type) {
  const phoneInput = document.getElementById(type === 'login' ? 'loginPhone' : 'regPhone');
  const phone = phoneInput.value.trim();

  if (!isValidPhone(phone)) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    phoneInput.focus();
    return;
  }

  if (type === 'register') {
    const name = document.getElementById('regName').value.trim();
    const age = document.getElementById('regAge').value;
    if (!name || name.length < 2) { showToast('Please enter your full name', 'error'); return; }
    if (!age || age < 1 || age > 120) { showToast('Please enter a valid age', 'error'); return; }
  }

  const btn = document.querySelector('.btn-otp');
  if (btn) setButtonLoading(btn, true, 'Sending OTP...');

  try {
    const result = await apiCall('/auth/send-otp', 'POST', { phone, purpose: type === 'register' ? 'register' : 'login' });
    if (btn) setButtonLoading(btn, false);

    if (!result.ok) {
      const msg = result.data.errors ? result.data.errors[0].msg : result.data.message;
      showToast(msg, 'error');
      return;
    }

    showToast(result.data.message, 'success');

    // Show dev OTP if available
    if (result.data.devOTP) {
      if (type === 'login') {
        const devDisplay = document.getElementById('devOtpDisplay');
        const devVal = document.getElementById('devOtpValue');
        if (devDisplay && devVal) { devVal.textContent = result.data.devOTP; devDisplay.classList.remove('hidden'); }
      } else {
        const devDisplay = document.getElementById('regDevOtpDisplay');
        const devVal = document.getElementById('regDevOtpValue');
        if (devDisplay && devVal) { devVal.textContent = result.data.devOTP; devDisplay.classList.remove('hidden'); }
      }
    }

    const otpSection = document.getElementById(type === 'login' ? 'loginOtpSection' : 'regOtpSection');
    otpSection.classList.remove('hidden');
    setupOTPInputs(otpSection);
    setTimeout(() => { const first = otpSection.querySelector('.otp-digit'); if (first) first.focus(); }, 100);

    const timerEl = document.getElementById(type === 'login' ? 'loginOtpTimer' : 'regOtpTimer');
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    otpTimerInterval = startOTPTimer(timerEl, CONFIG.OTP_TIMER, () => {
      const resendBtn = document.getElementById('resendLoginOtp');
      if (resendBtn) resendBtn.disabled = false;
    });

    setTimeout(() => {
      const resendBtn = document.getElementById('resendLoginOtp');
      if (resendBtn) resendBtn.disabled = false;
    }, 30000);

  } catch (err) {
    if (btn) setButtonLoading(btn, false);
    showToast('Network error. Please check your connection.', 'error');
  }
}

async function verifyLogin() {
  const phone = document.getElementById('loginPhone').value.trim();
  const otpSection = document.getElementById('loginOtpSection');
  const otp = getOTPValue(otpSection);

  if (otp.length !== 6) { showToast('Please enter the 6-digit OTP', 'error'); return; }

  const btn = otpSection.querySelector('.btn-verify');
  setButtonLoading(btn, true, 'Verifying...');

  try {
    const result = await apiCall('/auth/login', 'POST', { phone, otp });
    setButtonLoading(btn, false);

    if (!result.ok) {
      const msg = result.data.errors ? result.data.errors[0].msg : result.data.message;
      showToast(msg, 'error');
      return;
    }

    localStorage.setItem(CONFIG.TOKEN_KEY, result.data.token);
    setUser(result.data.user);
    showToast(result.data.message, 'success');
    setTimeout(() => { window.location.href = '/dashboard'; }, 1000);

  } catch (err) {
    setButtonLoading(btn, false);
    showToast('Login failed. Please try again.', 'error');
  }
}

async function verifyRegister() {
  const phone = document.getElementById('regPhone').value.trim();
  const name = document.getElementById('regName').value.trim();
  const age = document.getElementById('regAge').value;
  const gender = document.getElementById('regGender').value;
  const bloodGroup = document.getElementById('regBloodGroup').value;
  const otpSection = document.getElementById('regOtpSection');
  const otp = getOTPValue(otpSection);

  if (otp.length !== 6) { showToast('Please enter the 6-digit OTP', 'error'); return; }

  const btn = otpSection.querySelector('.btn-verify');
  setButtonLoading(btn, true, 'Creating Account...');

  try {
    const result = await apiCall('/auth/register', 'POST', { phone, name, age: parseInt(age), gender, bloodGroup, otp });
    setButtonLoading(btn, false);

    if (!result.ok) {
      const msg = result.data.errors ? result.data.errors[0].msg : result.data.message;
      showToast(msg, 'error');
      return;
    }

    localStorage.setItem(CONFIG.TOKEN_KEY, result.data.token);
    setUser(result.data.user);
    showToast(result.data.message, 'success');
    setTimeout(() => { window.location.href = '/dashboard'; }, 1000);

  } catch (err) {
    setButtonLoading(btn, false);
    showToast('Registration failed. Please try again.', 'error');
  }
}

window.showLanding = showLanding;
window.showAuth = showAuth;
window.toggleAuth = toggleAuth;
window.sendOTP = sendOTP;
window.verifyLogin = verifyLogin;
window.verifyRegister = verifyRegister;