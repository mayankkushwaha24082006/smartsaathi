// ===== VOICE ASSISTANT MODULE =====
let recognition = null;
let isListening = false;

function openVoiceAssistant() {
  const modal = document.getElementById('voiceModal');
  if (modal) modal.classList.remove('hidden');
}

function closeVoiceModal() {
  const modal = document.getElementById('voiceModal');
  if (modal) modal.classList.add('hidden');
  stopListening();
}

function toggleVoiceListening() {
  if (isListening) stopListening();
  else startListening();
}

function startListening() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('Voice recognition not supported in this browser. Try Chrome!', 'error');
    document.getElementById('voiceStatus').textContent = '❌ Not supported in this browser';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-IN';

  recognition.onstart = () => {
    isListening = true;
    document.getElementById('voiceMicBtn').classList.add('listening');
    document.getElementById('voiceWave').classList.add('active');
    document.getElementById('voiceTranscript').textContent = 'Listening... Speak now!';
    document.getElementById('voiceStatus').textContent = '🎙️ Microphone is active';
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    document.getElementById('voiceTranscript').textContent = transcript;
    if (event.results[event.resultIndex].isFinal) {
      processVoiceCommand(transcript.toLowerCase().trim());
    }
  };

  recognition.onerror = (event) => {
    document.getElementById('voiceStatus').textContent = `❌ Error: ${event.error}`;
    stopListening();
  };

  recognition.onend = () => stopListening();

  recognition.start();
}

function stopListening() {
  isListening = false;
  const micBtn = document.getElementById('voiceMicBtn');
  const wave = document.getElementById('voiceWave');
  if (micBtn) micBtn.classList.remove('listening');
  if (wave) wave.classList.remove('active');
  if (recognition) { try { recognition.stop(); } catch (e) {} }
  document.getElementById('voiceStatus').textContent = '';
}

function processVoiceCommand(command) {
  const transcript = document.getElementById('voiceTranscript');
  const status = document.getElementById('voiceStatus');

  let response = '';
  let action = null;

  if (/add medicine|new medicine/.test(command)) {
    response = '✅ Opening Add Medicine form...';
    action = () => { closeVoiceModal(); openAddMedicineModal(); };
  } else if (/medicine|my medicine|show medicine/.test(command)) {
    response = '✅ Opening your medicines...';
    action = () => { closeVoiceModal(); showSection('medicines'); };
  } else if (/reminder|check reminder/.test(command)) {
    response = '✅ Opening your reminders...';
    action = () => { closeVoiceModal(); showSection('reminders'); };
  } else if (/check disease|disease|symptoms|check symptoms/.test(command)) {
    response = '✅ Opening Disease Check...';
    action = () => { closeVoiceModal(); showSection('disease'); };
  } else if (/play music|music|song|relax/.test(command)) {
    response = '✅ Opening Music Player...';
    action = () => { closeVoiceModal(); showSection('music'); setTimeout(() => togglePlay(), 500); };
  } else if (/sos|emergency|help me|call sos|danger/.test(command)) {
    response = '🚨 Triggering SOS Emergency Alert!';
    action = () => { closeVoiceModal(); triggerSOS(); };
  } else if (/chatbot|chat|talk|assistant/.test(command)) {
    response = '✅ Opening Saathi Chatbot...';
    action = () => { closeVoiceModal(); showSection('chatbot'); };
  } else if (/dashboard|home|go home/.test(command)) {
    response = '✅ Going to Dashboard...';
    action = () => { closeVoiceModal(); showSection('home'); };
  } else if (/profile|my profile/.test(command)) {
    response = '✅ Opening your profile...';
    action = () => { closeVoiceModal(); showSection('profile'); };
  } else if (/logout|sign out|exit/.test(command)) {
    response = '✅ Logging you out...';
    action = () => logout();
  } else {
    // Forward to chatbot
    response = `🤔 I heard: "${command}" - Let me ask Saathi...`;
    action = () => {
      closeVoiceModal();
      showSection('chatbot');
      setTimeout(() => {
        const input = document.getElementById('chatInput');
        if (input) { input.value = command; }
        sendChatMessage();
      }, 500);
    };
  }

  if (transcript) transcript.textContent = `"${command}"`;
  if (status) status.textContent = response;
  speakResponse(response.replace(/[✅🚨🤔]/g, ''));

  if (action) setTimeout(action, 1500);
}

// Text-to-Speech feedback
function speakResponse(text) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// Speak notification
function speakNotification(text) {
  const user = getUser();
  if (user?.voiceEnabled !== false) speakResponse(text);
}

window.openVoiceAssistant = openVoiceAssistant;
window.closeVoiceModal = closeVoiceModal;
window.toggleVoiceListening = toggleVoiceListening;
window.speakNotification = speakNotification;
window.processVoiceCommand = processVoiceCommand;