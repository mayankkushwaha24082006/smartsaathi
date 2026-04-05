// ===== CHATBOT MODULE =====
let chatInitialized = false;

function initChatbot() {
  if (chatInitialized) return;
  chatInitialized = true;
  const messagesEl = document.getElementById('chatMessages');
  if (!messagesEl) return;

  const user = getUser();
  const name = user?.name?.split(' ')[0] || 'there';

  addBotMessage(`Namaste ${name}! 🙏 I'm **Saathi**, your AI health companion.\n\nI'm here to help you with medicines, health tips, and more. What can I do for you today?`);
}

function addBotMessage(text, action = null) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = 'message bot';
  msg.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div>
      <div class="message-bubble">${formatChatText(text)}</div>
      <div class="message-time">${getCurrentTime()}</div>
      ${action ? `<button onclick="handleChatAction('${action}')" class="btn btn-sm btn-outline mt-1" style="font-size:0.8rem;">
        <i class="fas fa-arrow-right"></i> Open ${action}
      </button>` : ''}
    </div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function addUserMessage(text) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = 'message user';
  msg.innerHTML = `
    <div>
      <div class="message-bubble">${text}</div>
      <div class="message-time" style="text-align:right;">${getCurrentTime()}</div>
    </div>
    <div class="message-avatar" style="background:linear-gradient(135deg,var(--secondary),var(--primary));">👤</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function addTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'message bot';
  typing.id = 'typingIndicator';
  typing.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-bubble" style="padding:12px 16px;">
      <span style="display:flex;gap:4px;align-items:center;">
        <span style="width:8px;height:8px;background:var(--text-muted);border-radius:50%;animation:blink 1s infinite;"></span>
        <span style="width:8px;height:8px;background:var(--text-muted);border-radius:50%;animation:blink 1s infinite 0.2s;"></span>
        <span style="width:8px;height:8px;background:var(--text-muted);border-radius:50%;animation:blink 1s infinite 0.4s;"></span>
      </span>
    </div>`;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
  return typing;
}

function formatChatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '• ');
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  input.style.height = 'auto';
  addUserMessage(message);

  const typing = addTypingIndicator();

  try {
    const result = await apiCall('/chatbot/message', 'POST', { message });
    typing.remove();

    if (!result.ok) {
      addBotMessage('Sorry, I am having trouble right now. Please try again shortly.');
      return;
    }

    const { response, action, urgent } = result.data;
    addBotMessage(response, action);

    if (urgent) showToast('⚠️ Urgent health alert from Saathi!', 'warning', 6000);
    if (action === 'music') setTimeout(() => showSection('music'), 1500);
  } catch (err) {
    typing.remove();
    addBotMessage('Sorry, I cannot connect right now. Please check your connection and try again.');
  }
}

function handleChatAction(action) {
  if (action === 'medicines') showSection('medicines');
  else if (action === 'disease') showSection('disease');
  else if (action === 'sos') showSection('sos');
  else if (action === 'music') showSection('music');
}

function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
}

function sendSuggestion(text) {
  const input = document.getElementById('chatInput');
  if (input) { input.value = text; }
  sendChatMessage();
}

function clearChat() {
  const container = document.getElementById('chatMessages');
  if (container) { container.innerHTML = ''; chatInitialized = false; initChatbot(); }
}

window.initChatbot = initChatbot;
window.sendChatMessage = sendChatMessage;
window.handleChatKeydown = handleChatKeydown;
window.sendSuggestion = sendSuggestion;
window.clearChat = clearChat;
window.handleChatAction = handleChatAction;