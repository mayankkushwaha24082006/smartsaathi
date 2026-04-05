// ===== PROFILE MODULE =====
async function loadProfile() {
    try {
      const result = await apiCall('/users/profile');
      if (!result.ok) return;
      const user = result.data.user;
      setUser(user);
      renderProfile(user);
    } catch (err) { /* silent */ }
  }
  
  function renderProfile(user) {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val || '-'; };
    const initials = getInitials(user.name);
  
    el('profileAvatar', initials);
    el('profileName', user.name);
    el('profilePhone', `+91 ${user.phone}`);
    el('profileAge', `${user.age || '-'} years, ${user.gender || '-'}`);
    el('profileBlood', user.bloodGroup || '-');
    el('profileDoctor', user.doctorName || 'Not set');
  
    // Medical conditions
    const condList = document.getElementById('conditionsList');
    if (condList) {
      const conds = user.medicalConditions || [];
      if (conds.length === 0) {
        condList.innerHTML = `<div class="empty-state" style="padding:20px;"><i class="fas fa-clipboard-list" style="font-size:2rem;"></i><p>No conditions added</p></div>`;
      } else {
        condList.innerHTML = conds.map(c => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:6px;">
            <div>
              <div style="font-weight:800;font-size:0.9rem;">${c.name}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);">${c.since ? `Since ${c.since}` : ''} · <span class="badge badge-${c.severity === 'severe' ? 'danger' : c.severity === 'moderate' ? 'warning' : 'success'}">${c.severity}</span></div>
            </div>
            <button onclick="deleteCondition('${c._id}')" class="btn btn-sm" style="background:rgba(229,57,53,0.1);color:var(--danger);"><i class="fas fa-times"></i></button>
          </div>`).join('');
      }
    }
  
    // Emergency contacts
    const contList = document.getElementById('contactsList');
    if (contList) {
      const contacts = user.emergencyContacts || [];
      if (contacts.length === 0) {
        contList.innerHTML = `<div class="empty-state" style="padding:20px;"><i class="fas fa-users" style="font-size:2rem;"></i><p>No contacts added</p></div>`;
      } else {
        contList.innerHTML = contacts.map(c => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:6px;">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:0.85rem;">
              ${getInitials(c.name)}
            </div>
            <div style="flex:1;">
              <div style="font-weight:800;font-size:0.9rem;">${c.name}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);">${c.relation} · +91 ${c.phone}</div>
            </div>
            <button onclick="deleteContact('${c._id}')" class="btn btn-sm" style="background:rgba(229,57,53,0.1);color:var(--danger);"><i class="fas fa-times"></i></button>
          </div>`).join('');
      }
    }
  }
  
  function openEditProfileModal() {
    const user = getUser();
    if (!user) return;
    const container = document.getElementById('modalsContainer');
    container.innerHTML = `
      <div class="modal-overlay" id="profileModal" onclick="handleModalClick(event)">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title"><i class="fas fa-user-edit" style="color:var(--primary);"></i> Edit Profile</div>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="form-group">
            <label><i class="fas fa-user"></i> Full Name</label>
            <input type="text" id="editName" value="${user.name || ''}" placeholder="Your name" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label><i class="fas fa-birthday-cake"></i> Age</label>
              <input type="number" id="editAge" value="${user.age || ''}" placeholder="Age" />
            </div>
            <div class="form-group">
              <label><i class="fas fa-venus-mars"></i> Gender</label>
              <select id="editGender">
                <option value="">Select</option>
                <option value="male" ${user.gender === 'male' ? 'selected' : ''}>Male</option>
                <option value="female" ${user.gender === 'female' ? 'selected' : ''}>Female</option>
                <option value="other" ${user.gender === 'other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label><i class="fas fa-tint"></i> Blood Group</label>
              <select id="editBloodGroup">
                <option value="">Select</option>
                ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => `<option value="${b}" ${user.bloodGroup === b ? 'selected' : ''}>${b}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label><i class="fas fa-envelope"></i> Email</label>
              <input type="email" id="editEmail" value="${user.email || ''}" placeholder="your@email.com" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label><i class="fas fa-user-md"></i> Doctor Name</label>
              <input type="text" id="editDoctor" value="${user.doctorName || ''}" placeholder="Dr. Name" />
            </div>
            <div class="form-group">
              <label><i class="fas fa-phone"></i> Doctor Phone</label>
              <input type="tel" id="editDoctorPhone" value="${user.doctorPhone || ''}" placeholder="10-digit number" maxlength="10" />
            </div>
          </div>
          <div class="form-group">
            <label><i class="fas fa-map-marker-alt"></i> Address</label>
            <input type="text" id="editAddress" value="${user.address || ''}" placeholder="Your address" />
          </div>
          <div style="display:flex;gap:12px;">
            <button class="btn btn-outline w-full" onclick="closeModal()"><i class="fas fa-times"></i> Cancel</button>
            <button class="btn btn-primary w-full" onclick="saveProfile()"><i class="fas fa-save"></i> Save Profile</button>
          </div>
        </div>
      </div>`;
  }
  
  async function saveProfile() {
    const payload = {
      name: document.getElementById('editName').value.trim(),
      age: parseInt(document.getElementById('editAge').value) || undefined,
      gender: document.getElementById('editGender').value,
      bloodGroup: document.getElementById('editBloodGroup').value,
      email: document.getElementById('editEmail').value.trim(),
      doctorName: document.getElementById('editDoctor').value.trim(),
      doctorPhone: document.getElementById('editDoctorPhone').value.trim(),
      address: document.getElementById('editAddress').value.trim(),
    };
  
    // Remove empty values
    Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
  
    const btn = document.querySelector('#profileModal .btn-primary');
    setButtonLoading(btn, true, 'Saving...');
  
    try {
      const result = await apiCall('/users/profile', 'PUT', payload);
      setButtonLoading(btn, false);
      if (!result.ok) { showToast(result.data.message, 'error'); return; }
      setUser(result.data.user);
      showToast('Profile updated! ✅', 'success');
      closeModal();
      loadProfile();
      renderUserInfo(result.data.user);
    } catch (err) {
      setButtonLoading(btn, false);
      showToast('Update failed', 'error');
    }
  }
  
  function openAddContactModal() {
    const container = document.getElementById('modalsContainer');
    container.innerHTML = `
      <div class="modal-overlay" onclick="handleModalClick(event)">
        <div class="modal" style="max-width:420px;">
          <div class="modal-header">
            <div class="modal-title"><i class="fas fa-user-plus" style="color:var(--primary);"></i> Add Emergency Contact</div>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="form-group">
            <label><i class="fas fa-user"></i> Contact Name *</label>
            <input type="text" id="cName" placeholder="Full name" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-phone"></i> Mobile Number *</label>
            <div class="phone-input-wrapper">
              <span class="phone-prefix">+91</span>
              <input type="tel" id="cPhone" placeholder="10-digit number" maxlength="10" />
            </div>
          </div>
          <div class="form-group">
            <label><i class="fas fa-heart"></i> Relation</label>
            <select id="cRelation">
              <option>Family</option><option>Spouse</option><option>Son</option>
              <option>Daughter</option><option>Brother</option><option>Sister</option>
              <option>Friend</option><option>Neighbour</option><option>Doctor</option>
            </select>
          </div>
          <div style="display:flex;gap:12px;">
            <button class="btn btn-outline w-full" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary w-full" onclick="saveContact()"><i class="fas fa-save"></i> Add Contact</button>
          </div>
        </div>
      </div>`;
  }
  
  async function saveContact() {
    const name = document.getElementById('cName').value.trim();
    const phone = document.getElementById('cPhone').value.trim();
    const relation = document.getElementById('cRelation').value;
  
    if (!name) { showToast('Contact name required', 'error'); return; }
    if (!isValidPhone(phone)) { showToast('Enter a valid 10-digit number', 'error'); return; }
  
    try {
      const result = await apiCall('/users/emergency-contacts', 'POST', { name, phone, relation });
      if (!result.ok) { showToast(result.data.message, 'error'); return; }
      setUser({ ...getUser(), emergencyContacts: result.data.contacts });
      showToast('Emergency contact added! ✅', 'success');
      closeModal();
      loadProfile();
    } catch (err) {
      showToast('Failed to add contact', 'error');
    }
  }
  
  async function deleteContact(id) {
    const confirmed = await confirmAction('Remove this emergency contact?');
    if (!confirmed) return;
    try {
      const result = await apiCall(`/users/emergency-contacts/${id}`, 'DELETE');
      if (!result.ok) { showToast('Failed to remove', 'error'); return; }
      setUser({ ...getUser(), emergencyContacts: result.data.contacts });
      showToast('Contact removed', 'success');
      loadProfile();
    } catch (err) {
      showToast('Failed to remove contact', 'error');
    }
  }
  
  function openAddConditionModal() {
    const container = document.getElementById('modalsContainer');
    container.innerHTML = `
      <div class="modal-overlay" onclick="handleModalClick(event)">
        <div class="modal" style="max-width:420px;">
          <div class="modal-header">
            <div class="modal-title"><i class="fas fa-heartbeat" style="color:var(--danger);"></i> Add Medical Condition</div>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="form-group">
            <label><i class="fas fa-stethoscope"></i> Condition Name *</label>
            <input type="text" id="condName" placeholder="E.g. Diabetes, Hypertension..." />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label><i class="fas fa-calendar"></i> Since (Year)</label>
              <input type="text" id="condSince" placeholder="E.g. 2018" maxlength="4" />
            </div>
            <div class="form-group">
              <label><i class="fas fa-exclamation-circle"></i> Severity</label>
              <select id="condSeverity">
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>
          <div style="display:flex;gap:12px;">
            <button class="btn btn-outline w-full" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary w-full" onclick="saveCondition()"><i class="fas fa-save"></i> Add Condition</button>
          </div>
        </div>
      </div>`;
  }
  
  async function saveCondition() {
    const name = document.getElementById('condName').value.trim();
    const since = document.getElementById('condSince').value.trim();
    const severity = document.getElementById('condSeverity').value;
  
    if (!name) { showToast('Condition name required', 'error'); return; }
  
    try {
      const result = await apiCall('/users/medical-conditions', 'POST', { name, since, severity });
      if (!result.ok) { showToast(result.data.message, 'error'); return; }
      showToast('Medical condition added! ✅', 'success');
      closeModal();
      loadProfile();
    } catch (err) {
      showToast('Failed to add condition', 'error');
    }
  }
  
  async function deleteCondition(id) {
    const confirmed = await confirmAction('Remove this medical condition?');
    if (!confirmed) return;
    try {
      const result = await apiCall(`/users/medical-conditions/${id}`, 'DELETE');
      if (!result.ok) { showToast('Failed to remove', 'error'); return; }
      showToast('Condition removed', 'success');
      loadProfile();
    } catch (err) {
      showToast('Failed to remove condition', 'error');
    }
  }
  
  window.loadProfile = loadProfile;
  window.openEditProfileModal = openEditProfileModal;
  window.saveProfile = saveProfile;
  window.openAddContactModal = openAddContactModal;
  window.saveContact = saveContact;
  window.deleteContact = deleteContact;
  window.openAddConditionModal = openAddConditionModal;
  window.saveCondition = saveCondition;
  window.deleteCondition = deleteCondition;