// ===== DISEASE MODULE =====
let selectedSymptoms = [];

async function loadSymptomSuggestions() {
  try {
    const result = await apiCall('/disease/symptoms-list');
    if (!result.ok) return;
    const suggestions = result.data.symptoms?.slice(0, 20) || [];
    const container = document.getElementById('symptomSuggestions');
    if (container) {
      container.innerHTML = suggestions.map(s =>
        `<div class="suggestion-chip" onclick="addSymptomFromSuggestion('${s}')">${s}</div>`
      ).join('');
    }

    // Setup enter key
    const input = document.getElementById('symptomInput');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addSymptom(); }
      });
    }
  } catch (err) { /* silent */ }
}

function addSymptom() {
  const input = document.getElementById('symptomInput');
  const val = input.value.trim().toLowerCase();
  if (!val) return;
  if (selectedSymptoms.includes(val)) { showToast('Symptom already added', 'warning'); input.value = ''; return; }
  if (selectedSymptoms.length >= 15) { showToast('Maximum 15 symptoms allowed', 'warning'); return; }
  selectedSymptoms.push(val);
  input.value = '';
  renderSymptomTags();
}

function addSymptomFromSuggestion(symptom) {
  if (selectedSymptoms.includes(symptom)) return;
  if (selectedSymptoms.length >= 15) { showToast('Maximum 15 symptoms allowed', 'warning'); return; }
  selectedSymptoms.push(symptom);
  renderSymptomTags();
}

function removeSymptom(symptom) {
  selectedSymptoms = selectedSymptoms.filter(s => s !== symptom);
  renderSymptomTags();
}

function clearSymptoms() {
  selectedSymptoms = [];
  renderSymptomTags();
  document.getElementById('predictionResults').innerHTML = `
    <div class="empty-state"><i class="fas fa-stethoscope"></i><h3>Enter Symptoms</h3><p>Add your symptoms and click Analyze to see possible conditions</p></div>`;
}

function renderSymptomTags() {
  const container = document.getElementById('symptomTags');
  if (!container) return;
  if (selectedSymptoms.length === 0) {
    container.innerHTML = '<span style="color:var(--text-light);font-size:0.85rem;padding:4px;">Your symptoms will appear here...</span>';
    return;
  }
  container.innerHTML = selectedSymptoms.map(s =>
    `<div class="symptom-tag">${s}<button onclick="removeSymptom('${s}')"><i class="fas fa-times"></i></button></div>`
  ).join('');
}

async function predictDisease() {
  if (selectedSymptoms.length === 0) { showToast('Please add at least one symptom', 'error'); return; }

  const btn = document.getElementById('predictBtn');
  setButtonLoading(btn, true, 'Analyzing...');

  try {
    const result = await apiCall('/disease/predict', 'POST', { symptoms: selectedSymptoms });
    setButtonLoading(btn, false);

    if (!result.ok) { showToast(result.data.message, 'error'); return; }

    const { predictions, disclaimer, seekImmediateCare, emergencyMessage } = result.data;
    const container = document.getElementById('predictionResults');

    if (predictions.length === 0) {
      container.innerHTML = `<div class="card"><p style="color:var(--text-muted);">${result.data.disclaimer}</p></div>`;
      return;
    }

    let html = '';

    if (emergencyMessage) {
      html += `<div style="background:var(--danger);color:white;border-radius:var(--radius-sm);padding:14px;margin-bottom:12px;font-weight:800;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-exclamation-triangle" style="font-size:1.4rem;"></i> ${emergencyMessage}
      </div>`;
    }

    html += predictions.map(p => `
      <div class="prediction-card ${p.urgency === 'critical' ? 'critical' : p.urgency === 'high' ? 'high-urgency' : ''}">
        <div class="prediction-header">
          <div class="prediction-name">${p.emoji} ${p.name}</div>
          <span class="badge ${p.urgency === 'critical' || p.urgency === 'high' ? 'badge-danger' : p.urgency === 'medium' ? 'badge-warning' : 'badge-success'}">
            ${p.urgency.toUpperCase()}
          </span>
        </div>
        <div class="confidence-bar-wrap">
          <div class="confidence-label">
            <span>Symptom Match</span>
            <span style="color:var(--primary);font-weight:900;">${p.confidence}%</span>
          </div>
          <div class="confidence-bar">
            <div class="confidence-fill" style="width:${p.confidence}%;background:${p.confidence > 60 ? 'linear-gradient(90deg,var(--danger),#ff6b6b)' : 'linear-gradient(90deg,var(--primary),var(--secondary))'}"></div>
          </div>
        </div>
        <div class="prediction-advice"><i class="fas fa-info-circle" style="color:var(--primary);"></i> ${p.advice}</div>
        <div class="prediction-meta">
          <span class="badge badge-purple"><i class="fas fa-user-md"></i> ${p.specialist}</span>
          ${p.prevention ? `<span style="font-size:0.8rem;color:var(--text-muted);"><i class="fas fa-shield-alt" style="color:var(--secondary);"></i> ${p.prevention}</span>` : ''}
        </div>
      </div>`).join('');

    html += `<div style="background:#fff9e6;border-left:4px solid var(--warning);padding:12px;border-radius:var(--radius-sm);font-size:0.82rem;color:#856404;margin-top:8px;">
      <i class="fas fa-exclamation-triangle"></i> ${disclaimer}
    </div>`;

    container.innerHTML = html;

    // Animate confidence bars
    setTimeout(() => {
      document.querySelectorAll('.confidence-fill').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => bar.style.width = width, 50);
      });
    }, 100);

  } catch (err) {
    setButtonLoading(btn, false);
    showToast('Analysis failed. Please try again.', 'error');
  }
}

window.loadSymptomSuggestions = loadSymptomSuggestions;
window.addSymptom = addSymptom;
window.addSymptomFromSuggestion = addSymptomFromSuggestion;
window.removeSymptom = removeSymptom;
window.clearSymptoms = clearSymptoms;
window.predictDisease = predictDisease;