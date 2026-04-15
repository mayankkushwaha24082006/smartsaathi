// ===== MEDICINES MODULE =====
async function loadMedicines() {
    const grid = document.getElementById('medicineGrid');
    if (!grid) return;
    grid.innerHTML = `<div style="text-align:center;padding:32px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);"></i></div>`;
  
    try {
      const result = await apiCall('/medicines?active=true');
      if (!result.ok) { showToast('Failed to load medicines', 'error'); return; }
      const medicines = result.data.medicines || [];
  
      if (medicines.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-pills"></i><h3>No medicines added yet</h3><p>Click "Add Medicine" to get started</p></div>`;
        return;
      }
  
      grid.innerHTML = medicines.map(med => renderMedicineCard(med)).join('');
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-wifi-slash"></i><p>Failed to load. Check your connection.</p></div>`;
    }
  }
  
  function renderMedicineCard(med) {
    const categoryIcons = { tablet: '💊', capsule: '💉', syrup: '🍶', drops: '💧', cream: '🧴', inhaler: '💨', injection: '💉', other: '🏥' };
    const icon = categoryIcons[med.category] || '💊';
    const times = med.reminderTimes.map(rt => `
      <div class="time-pill ${rt.taken ? 'taken' : ''}" onclick="markTaken('${med._id}', '${rt.time}', this)" title="${rt.taken ? 'Mark as not taken' : 'Mark as taken'}">
        ${rt.taken ? '<i class="fas fa-check"></i>' : '<i class="far fa-clock"></i>'}
        ${formatTime(rt.time)}
      </div>`).join('');
  
    return `
      <div class="medicine-card" style="border-top-color:${med.color};" id="med-${med._id}">
        <div class="medicine-card-header">
          <div>
            <div class="medicine-name">${icon} ${med.name}</div>
            <div class="medicine-dosage"><i class="fas fa-capsules"></i> ${med.dosage}</div>
          </div>
          <div class="medicine-actions">
            <button class="medicine-action-btn edit" onclick="openEditMedicineModal('${med._id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="medicine-action-btn delete" onclick="deleteMedicine('${med._id}', '${med.name}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="medicine-times">${times}</div>
        <div class="medicine-meta">
          <span><i class="fas fa-redo" style="color:var(--primary);"></i> ${med.frequency.replace('_', ' ')}</span>
          ${med.instructions ? `<span><i class="fas fa-info-circle" style="color:var(--text-muted);"></i> ${med.instructions}</span>` : ''}
          ${med.prescribedBy ? `<span><i class="fas fa-user-md" style="color:var(--secondary);"></i> ${med.prescribedBy}</span>` : ''}
        </div>
      </div>`;
  }
  
  async function markTaken(medicineId, time, el) {
    try {
      const result = await apiCall(`/medicines/${medicineId}/taken`, 'PATCH', { time });
      if (!result.ok) { showToast('Update failed', 'error'); return; }
      const pill = el.closest('.time-pill');
      if (pill) pill.classList.toggle('taken');
      showToast(result.data.message, 'success');
      loadDashboardStats();
    } catch (err) {
      showToast('Update failed', 'error');
    }
  }
  
  async function deleteMedicine(id, name) {
    const confirmed = await confirmAction(`Delete "${name}"? This will also remove all its reminders.`);
    if (!confirmed) return;
    try {
      const result = await apiCall(`/medicines/${id}`, 'DELETE');
      if (!result.ok) { showToast('Delete failed', 'error'); return; }
      showToast(`${name} deleted`, 'success');
      loadMedicines();
      loadDashboardStats();
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  }
  
  function openAddMedicineModal() {
    renderMedicineModal(null);
  }
  
  async function openEditMedicineModal(id) {
    const result = await apiCall(`/medicines/${id}`);
    if (!result.ok) { showToast('Failed to load medicine', 'error'); return; }
    renderMedicineModal(result.data.medicine);
  }
  
  function renderMedicineModal(medicine) {
    const isEdit = !!medicine;
    const m = medicine || {};
  
    // Default reminder times based on frequency
    const defaultTimes = [{ time: '08:00', label: 'Morning' }];
  
    const container = document.getElementById('modalsContainer');
    container.innerHTML = `
      <div class="modal-overlay" id="medicineModal" onclick="handleModalClick(event)">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title"><i class="fas fa-pills" style="color:var(--primary);"></i> ${isEdit ? 'Edit Medicine' : 'Add Medicine'}</div>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="form-group">
            <label><i class="fas fa-pills"></i> Medicine Name *</label>
            <input type="text" id="mName" placeholder="E.g. Metformin, Amlodipine..." value="${m.name || ''}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label><i class="fas fa-tablets"></i> Dosage *</label>
              <input type="text" id="mDosage" placeholder="E.g. 500mg, 1 tablet" value="${m.dosage || ''}" />
            </div>
            <div class="form-group">
              <label><i class="fas fa-capsules"></i> Category</label>
              <select id="mCategory">
                ${['tablet','capsule','syrup','drops','cream','inhaler','injection','other'].map(c => `<option value="${c}" ${m.category === c ? 'selected' : ''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label><i class="fas fa-redo"></i> Frequency</label>
            <select id="mFrequency" onchange="updateTimesFromFrequency()">
              <option value="once_daily" ${m.frequency === 'once_daily' ? 'selected' : ''}>Once Daily</option>
              <option value="twice_daily" ${m.frequency === 'twice_daily' ? 'selected' : ''}>Twice Daily</option>
              <option value="thrice_daily" ${m.frequency === 'thrice_daily' ? 'selected' : ''}>Thrice Daily</option>
              <option value="four_times" ${m.frequency === 'four_times' ? 'selected' : ''}>Four Times Daily</option>
              <option value="weekly" ${m.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="as_needed" ${m.frequency === 'as_needed' ? 'selected' : ''}>As Needed</option>
            </select>
          </div>
          <div class="form-group">
            <label><i class="fas fa-clock"></i> Reminder Times</label>
            <div id="reminderTimesContainer" style="display:flex;flex-direction:column;gap:8px;">
              ${(m.reminderTimes || defaultTimes).map((rt, i) => renderTimeRow(rt, i)).join('')}
            </div>
            <button type="button" onclick="addTimeRow()" class="btn btn-outline btn-sm mt-1" style="width:auto;">
              <i class="fas fa-plus"></i> Add Time
            </button>
          </div>
          <div class="form-group">
            <label><i class="fas fa-info-circle"></i> Instructions (Optional)</label>
            <input type="text" id="mInstructions" placeholder="E.g. Take with meals, Avoid alcohol" value="${m.instructions || ''}" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-user-md"></i> Prescribed By (Optional)</label>
            <input type="text" id="mPrescribedBy" placeholder="Doctor's name" value="${m.prescribedBy || ''}" />
          </div>
          <div style="display:flex;gap:12px;margin-top:8px;">
            <button class="btn btn-outline w-full" onclick="closeModal()"><i class="fas fa-times"></i> Cancel</button>
            <button class="btn btn-primary w-full" onclick="saveMedicine('${m._id || ''}')">
              <i class="fas fa-save"></i> ${isEdit ? 'Save Changes' : 'Add Medicine'}
            </button>
          </div>
        </div>
      </div>`;
  }
  
  function renderTimeRow(rt, idx) {
    const labels = ['Morning', 'Afternoon', 'Evening', 'Night'];
    return `
      <div class="time-row" style="display:flex;gap:8px;align-items:center;" data-idx="${idx}">
        <input type="time" value="${rt.time || '08:00'}" style="flex:1;padding:10px;border:2px solid var(--border);border-radius:var(--radius-sm);font-size:0.9rem;font-weight:700;" class="time-input" />
        <select style="flex:1;padding:10px;border:2px solid var(--border);border-radius:var(--radius-sm);font-size:0.9rem;" class="label-input">
          ${labels.map(l => `<option value="${l}" ${rt.label === l ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <button onclick="removeTimeRow(this)" style="background:rgba(229,57,53,0.1);color:var(--danger);border:none;padding:8px 10px;border-radius:8px;cursor:pointer;">
          <i class="fas fa-times"></i>
        </button>
      </div>`;
  }
  
  function addTimeRow() {
    const container = document.getElementById('reminderTimesContainer');
    const idx = container.children.length;
    const times = ['08:00', '13:00', '18:00', '21:00'];
    const labels = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const div = document.createElement('div');
    div.innerHTML = renderTimeRow({ time: times[idx] || '08:00', label: labels[idx] || 'Morning' }, idx);
    container.appendChild(div.firstElementChild);
  }
  
  function removeTimeRow(btn) {
    const container = document.getElementById('reminderTimesContainer');
    if (container.children.length <= 1) { showToast('At least one reminder time required', 'warning'); return; }
    btn.closest('.time-row').remove();
  }
  
  function updateTimesFromFrequency() {
    const freq = document.getElementById('mFrequency').value;
    const presets = {
      once_daily: [{ time: '08:00', label: 'Morning' }],
      twice_daily: [{ time: '08:00', label: 'Morning' }, { time: '20:00', label: 'Night' }],
      thrice_daily: [{ time: '08:00', label: 'Morning' }, { time: '13:00', label: 'Afternoon' }, { time: '20:00', label: 'Night' }],
      four_times: [{ time: '07:00', label: 'Morning' }, { time: '12:00', label: 'Afternoon' }, { time: '17:00', label: 'Evening' }, { time: '21:00', label: 'Night' }],
    };
    const times = presets[freq];
    if (times) {
      const container = document.getElementById('reminderTimesContainer');
      container.innerHTML = times.map((rt, i) => renderTimeRow(rt, i)).join('');
    }
  }
  
  async function saveMedicine(existingId) {
    const name = document.getElementById('mName').value.trim();
    const dosage = document.getElementById('mDosage').value.trim();
    const category = document.getElementById('mCategory').value;
    const frequency = document.getElementById('mFrequency').value;
    const instructions = document.getElementById('mInstructions').value.trim();
    const prescribedBy = document.getElementById('mPrescribedBy').value.trim();
  
    if (!name) { showToast('Medicine name is required', 'error'); return; }
    if (!dosage) { showToast('Dosage is required', 'error'); return; }
  
    const timeRows = document.querySelectorAll('.time-row');
    const reminderTimes = [...timeRows].map(row => ({
      time: row.querySelector('.time-input').value,
      label: row.querySelector('.label-input').value
    }));
  
    if (reminderTimes.length === 0) { showToast('Add at least one reminder time', 'error'); return; }
  
    const colors = ['#1a6fc4', '#e53935', '#00b894', '#f4b400', '#7c3aed', '#fd7043'];
    const color = colors[Math.floor(Math.random() * colors.length)];
  
    const payload = { name, dosage, category, frequency, instructions, prescribedBy, reminderTimes, color };
  
    const btn = document.querySelector('#medicineModal .btn-primary');
    setButtonLoading(btn, true, 'Saving...');
  
    try {
      const endpoint = existingId ? `/medicines/${existingId}` : '/medicines';
      const method = existingId ? 'PUT' : 'POST';
      const result = await apiCall(endpoint, method, payload);
      setButtonLoading(btn, false);
  
      if (!result.ok) {
        const msg = result.data.errors ? result.data.errors[0].msg : result.data.message;
        showToast(msg, 'error'); return;
      }
  
      showToast(result.data.message, 'success');
      closeModal();
      loadMedicines();
      loadDashboardStats();
    } catch (err) {
      setButtonLoading(btn, false);
      showToast('Save failed. Please try again.', 'error');
    }
  }
  
  function closeModal() {
    const container = document.getElementById('modalsContainer');
    if (container) container.innerHTML = '';
  }
  
  function handleModalClick(e) {
    if (e.target === e.currentTarget) closeModal();
  }
  
  window.loadMedicines = loadMedicines;
  window.markTaken = markTaken;
  window.deleteMedicine = deleteMedicine;
  window.openAddMedicineModal = openAddMedicineModal;
  window.openEditMedicineModal = openEditMedicineModal;
  window.saveMedicine = saveMedicine;
  window.addTimeRow = addTimeRow;
  window.removeTimeRow = removeTimeRow;
  window.updateTimesFromFrequency = updateTimesFromFrequency;
  window.closeModal = closeModal;
  window.handleModalClick = handleModalClick;