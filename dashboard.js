// ===== CONFIGURATION =====
const EMAILJS_CONFIG = {
  serviceId: 'service_5uhyx4s',      // Your Service ID
  templateId: 'template_ug4laxg',    // Your Template ID
  userId: 'bcMSvUiDIm1CPzsoa'        // Your Public Key
};

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let editId = null;
let subscriptions = [];
let deleteCandidateId = null;
let sortDirection = 'asc'; // 'asc' or 'desc'
let currentFilter = 'all';
let currentSearch = '';

// ===== DOM ELEMENTS =====
const elements = {
  // Forms and inputs
  form: document.getElementById('subscriptionForm'),
  name: document.getElementById('name'),
  platform: document.getElementById('platform'),
  startDate: document.getElementById('startDate'),
  endDate: document.getElementById('endDate'),
  email: document.getElementById('email'),
  mobile: document.getElementById('mobile'),
  notes: document.getElementById('notes'),
  
  // Buttons
  submitBtn: document.getElementById('submitBtn'),
  cancelEditBtn: document.getElementById('cancelEdit'),
  logoutBtn: document.getElementById('logoutBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  exportBtn: document.getElementById('exportBtn'),
  addFirstBtn: document.getElementById('addFirstBtn'),
  clearSearch: document.getElementById('clearSearch'),
  sortToggle: document.getElementById('sortToggle'),
  
  // Filters
  searchInput: document.getElementById('searchInput'),
  filterStatus: document.getElementById('filterStatus'),
  
  // Display elements
  subscriptionsList: document.getElementById('subscriptionsList'),
  noSubscriptions: document.getElementById('noSubscriptions'),
  loadingSubscriptions: document.getElementById('loadingSubscriptions'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  userEmail: document.getElementById('userEmail'),
  userName: document.getElementById('userName'),
  welcomeName: document.getElementById('welcomeName'),
  
  // Stats
  totalSubscriptions: document.getElementById('totalSubscriptions'),
  expiringSoon: document.getElementById('expiringSoon'),
  notificationCount: document.getElementById('notificationCount'),
  showingCount: document.getElementById('showingCount'),
  totalCount: document.getElementById('totalCount'),
  filterStats: document.getElementById('filterStats'),
  
  // Toast and modals
  toast: document.getElementById('toast'),
  confirmModal: document.getElementById('confirmModal'),
  confirmMessage: document.getElementById('confirmMessage'),
  confirmCancel: document.getElementById('confirmCancel'),
  confirmDelete: document.getElementById('confirmDelete'),
  settingsModal: document.getElementById('settingsModal'),
  saveSettings: document.getElementById('saveSettings'),
  closeSettings: document.getElementById('closeSettings')
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  try {
    showLoadingOverlay();
    
    // Check authentication
    await checkAuthentication();
    
    // Initialize EmailJS
    initializeEmailJS();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize date inputs
    initializeDateInputs();
    
    // Load user data
    await loadUserData();
    
    // Load subscriptions
    await loadSubscriptions();
    
    // Setup real-time listener
    setupRealtimeListener();
    
    // Check for notifications
    checkNotifications();
    
    hideLoadingOverlay();
    
    // Show welcome animation
    setTimeout(() => {
      showToast('Welcome to Cutoff! 🎉', 'success');
    }, 500);
    
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to load app. Please refresh.', 'error');
    hideLoadingOverlay();
  }
}

// ===== AUTHENTICATION =====
async function checkAuthentication() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      
      currentUser = user;
      console.log('User authenticated:', user.uid);
      resolve();
    });
  });
}

function handleLogout() {
  showLoading(elements.logoutBtn, 'Logging out...');
  
  auth.signOut()
    .then(() => {
      localStorage.clear();
      window.location.href = 'index.html';
    })
    .catch((error) => {
      console.error('Logout error:', error);
      showToast('Logout failed. Please try again.', 'error');
      resetButton(elements.logoutBtn, 'Logout');
    });
}

// ===== EMAILJS =====
function initializeEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.warn('EmailJS not loaded, retrying...');
    setTimeout(initializeEmailJS, 1000);
    return;
  }
  
  try {
    emailjs.init(EMAILJS_CONFIG.userId);
    console.log('EmailJS initialized successfully');
  } catch (error) {
    console.error('EmailJS initialization error:', error);
  }
}

async function sendEmailNotification(subscription, daysLeft) {
  if (!subscription.email) {
    console.warn('No email address for subscription:', subscription.name);
    return false;
  }
  
  if (typeof emailjs === 'undefined') {
    console.error('EmailJS not loaded');
    return false;
  }
  
  try {
    const templateParams = {
      subscription_name: subscription.name,
      platform: subscription.platform || 'Unknown Platform',
      days_left: daysLeft,
      end_date: formatDate(subscription.endDate),
      start_date: formatDate(subscription.startDate),
      email: subscription.email,
      mobile: subscription.mobile || '',
      notification_date: new Date().toLocaleDateString(),
      subscription_id: subscription.id
    };
    
    console.log('Sending email with params:', templateParams);
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );
    
    console.log('Email sent successfully:', response);
    return true;
    
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

// ===== USER DATA =====
async function loadUserData() {
  if (!currentUser) return;
  
  // Update UI with user info
  const email = currentUser.email || currentUser.phoneNumber;
  const name = currentUser.displayName || email.split('@')[0] || 'User';
  
  elements.userEmail.textContent = email;
  elements.userName.textContent = name;
  elements.welcomeName.textContent = name;
  
  // Load user preferences
  await loadUserPreferences();
}

async function loadUserPreferences() {
  if (!currentUser) return;
  
  try {
    const snapshot = await database.ref(`userPreferences/${currentUser.uid}`).once('value');
    const preferences = snapshot.val() || {};
    
    // Apply preferences to UI
    if (elements.emailNotifications) {
      elements.emailNotifications.checked = preferences.emailNotifications !== false;
    }
    if (elements.notify7Days) {
      elements.notify7Days.checked = preferences.notify7Days !== false;
    }
    if (elements.notify3Days) {
      elements.notify3Days.checked = preferences.notify3Days !== false;
    }
    if (elements.notify1Day) {
      elements.notify1Day.checked = preferences.notify1Day !== false;
    }
    
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

async function saveUserPreferences() {
  if (!currentUser) return;
  
  const preferences = {
    emailNotifications: elements.emailNotifications?.checked || true,
    notify7Days: elements.notify7Days?.checked || false,
    notify3Days: elements.notify3Days?.checked || true,
    notify1Day: elements.notify1Day?.checked || true,
    updatedAt: new Date().toISOString()
  };
  
  try {
    await database.ref(`userPreferences/${currentUser.uid}`).set(preferences);
    showToast('Settings saved successfully!', 'success');
    hideModal(elements.settingsModal);
  } catch (error) {
    console.error('Error saving preferences:', error);
    showToast('Failed to save settings.', 'error');
  }
}

// ===== SUBSCRIPTIONS =====
async function loadSubscriptions() {
  if (!currentUser) return;
  
  showLoading(elements.refreshBtn, 'Refreshing...');
  elements.loadingSubscriptions.style.display = 'block';
  
  try {
    const snapshot = await database.ref(`subscriptions/${currentUser.uid}`).once('value');
    subscriptions = [];
    
    snapshot.forEach((childSnapshot) => {
      const sub = childSnapshot.val();
      sub.id = childSnapshot.key;
      subscriptions.push(sub);
    });
    
    // Update stats
    updateStats();
    
    // Render subscriptions
    renderSubscriptions();
    
    resetButton(elements.refreshBtn, '🔄');
    elements.loadingSubscriptions.style.display = 'none';
    
  } catch (error) {
    console.error('Error loading subscriptions:', error);
    showToast('Failed to load subscriptions.', 'error');
    resetButton(elements.refreshBtn, '🔄');
    elements.loadingSubscriptions.style.display = 'none';
  }
}

function setupRealtimeListener() {
  if (!currentUser) return;
  
  const ref = database.ref(`subscriptions/${currentUser.uid}`);
  
  ref.on('child_added', (snapshot) => {
    const sub = snapshot.val();
    sub.id = snapshot.key;
    
    const existingIndex = subscriptions.findIndex(s => s.id === sub.id);
    if (existingIndex === -1) {
      subscriptions.push(sub);
      
      // Animate new card
      const card = createSubscriptionCard(sub);
      card.style.animation = 'bounceIn 0.6s';
      elements.subscriptionsList.prepend(card);
      
      updateStats();
      updateFilterStats();
    }
  });
  
  ref.on('child_changed', (snapshot) => {
    const sub = snapshot.val();
    sub.id = snapshot.key;
    
    const index = subscriptions.findIndex(s => s.id === sub.id);
    if (index !== -1) {
      subscriptions[index] = sub;
      
      // Update the specific card
      const card = document.querySelector(`.sub-card[data-id="${sub.id}"]`);
      if (card) {
        card.style.animation = 'pulse 0.5s';
        setTimeout(() => {
          card.outerHTML = createSubscriptionCard(sub).outerHTML;
        }, 500);
      }
      
      updateStats();
      updateFilterStats();
    }
  });
  
  ref.on('child_removed', (snapshot) => {
    const id = snapshot.key;
    subscriptions = subscriptions.filter(s => s.id !== id);
    
    // Animate removal
    const card = document.querySelector(`.sub-card[data-id="${id}"]`);
    if (card) {
      card.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => {
        card.remove();
        updateStats();
        updateFilterStats();
      }, 300);
    }
  });
}

// ===== FORM HANDLING =====
function initializeDateInputs() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  elements.startDate.min = today;
  elements.endDate.min = today;
  
  // Set default dates
  elements.startDate.value = today;
  elements.endDate.value = tomorrowStr;
  
  // Auto-set end date when start date changes
  elements.startDate.addEventListener('change', function() {
    if (this.value) {
      const startDate = new Date(this.value);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // Default 30-day subscription
      
      const endDateStr = endDate.toISOString().split('T')[0];
      elements.endDate.value = endDateStr;
      elements.endDate.min = this.value;
    }
  });
  
  // Validate end date is after start date
  elements.endDate.addEventListener('change', function() {
    const startDate = new Date(elements.startDate.value);
    const endDate = new Date(this.value);
    
    if (endDate < startDate) {
      showToast('End date must be after start date', 'error');
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      this.value = newEndDate.toISOString().split('T')[0];
    }
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!currentUser) {
    showToast('Please log in first.', 'error');
    return;
  }
  
  // Validate form
  if (!validateForm()) {
    return;
  }
  
  const subscription = {
    userId: currentUser.uid,
    name: elements.name.value.trim(),
    platform: elements.platform.value.trim(),
    startDate: elements.startDate.value,
    endDate: elements.endDate.value,
    email: elements.email.value.trim(),
    mobile: elements.mobile.value.trim(),
    notes: elements.notes.value.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    showLoading(elements.submitBtn, editId ? 'Updating...' : 'Adding...');
    
    if (editId) {
      // Update existing subscription
      await database.ref(`subscriptions/${currentUser.uid}/${editId}`).update(subscription);
      showToast('Subscription updated successfully! ✨', 'success');
    } else {
      // Add new subscription
      const newRef = database.ref(`subscriptions/${currentUser.uid}`).push();
      subscription.id = newRef.key;
      await newRef.set(subscription);
      
      // Schedule email notifications
      scheduleEmailNotifications(subscription);
      
      showToast('Subscription added successfully! 🎉', 'success');
      
      // Scroll to the new card
      setTimeout(() => {
        const newCard = document.querySelector(`.sub-card[data-id="${subscription.id}"]`);
        if (newCard) {
          newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          newCard.classList.add('new');
          setTimeout(() => newCard.classList.remove('new'), 2000);
        }
      }, 500);
    }
    
    // Reset form
    resetForm();
    
  } catch (error) {
    console.error('Error saving subscription:', error);
    showToast('Failed to save subscription. Please try again.', 'error');
    resetButton(elements.submitBtn, editId ? 'Update Subscription' : 'Add Subscription');
  }
}

function validateForm() {
  const errors = [];
  
  if (!elements.name.value.trim()) {
    errors.push('Subscription name is required');
    elements.name.classList.add('shake');
  }
  
  if (!elements.startDate.value) {
    errors.push('Start date is required');
    elements.startDate.classList.add('shake');
  }
  
  if (!elements.endDate.value) {
    errors.push('End date is required');
    elements.endDate.classList.add('shake');
  }
  
  if (!elements.email.value.trim()) {
    errors.push('Email is required');
    elements.email.classList.add('shake');
  } else if (!isValidEmail(elements.email.value)) {
    errors.push('Please enter a valid email address');
    elements.email.classList.add('shake');
  }
  
  if (elements.mobile.value.trim() && !isValidPhone(elements.mobile.value)) {
    errors.push('Please enter a valid phone number');
    elements.mobile.classList.add('shake');
  }
  
  // Remove shake animation after delay
  setTimeout(() => {
    [elements.name, elements.startDate, elements.endDate, elements.email, elements.mobile].forEach(
      el => el.classList.remove('shake')
    );
  }, 500);
  
  if (errors.length > 0) {
    showToast(errors[0], 'error');
    return false;
  }
  
  return true;
}

function resetForm() {
  elements.form.reset();
  cancelEdit();
  initializeDateInputs();
  resetButton(elements.submitBtn, 'Add Subscription');
}

// ===== SUBSCRIPTION CRUD =====
window.editSubscription = function(id) {
  const sub = subscriptions.find(s => s.id === id);
  if (!sub) return;
  
  editId = id;
  
  // Fill form with subscription data
  elements.name.value = sub.name;
  elements.platform.value = sub.platform || '';
  elements.startDate.value = sub.startDate;
  elements.endDate.value = sub.endDate;
  elements.email.value = sub.email;
  elements.mobile.value = sub.mobile || '';
  elements.notes.value = sub.notes || '';
  
  // Update UI
  elements.submitBtn.innerHTML = '<span>✏️</span> Update Subscription';
  elements.cancelEditBtn.style.display = 'block';
  
  // Scroll to form
  document.querySelector('.form-card').scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
  
  // Highlight form
  elements.form.parentElement.style.animation = 'pulse 1s';
  setTimeout(() => {
    elements.form.parentElement.style.animation = '';
  }, 1000);
};

function cancelEdit() {
  editId = null;
  elements.cancelEditBtn.style.display = 'none';
  elements.submitBtn.innerHTML = '<span>➕</span> Add Subscription';
}

window.deleteSubscription = function(id) {
  const sub = subscriptions.find(s => s.id === id);
  if (!sub) return;
  
  deleteCandidateId = id;
  elements.confirmMessage.textContent = `Are you sure you want to delete "${sub.name}"? This action cannot be undone.`;
  showModal(elements.confirmModal);
};

async function confirmDelete() {
  if (!deleteCandidateId || !currentUser) return;
  
  try {
    showLoading(elements.confirmDelete, 'Deleting...');
    
    await database.ref(`subscriptions/${currentUser.uid}/${deleteCandidateId}`).remove();
    
    // Also remove any scheduled notifications for this subscription
    await removeScheduledNotifications(deleteCandidateId);
    
    showToast('Subscription deleted successfully!', 'success');
    hideModal(elements.confirmModal);
    
    deleteCandidateId = null;
    resetButton(elements.confirmDelete, 'Delete');
    
  } catch (error) {
    console.error('Error deleting subscription:', error);
    showToast('Failed to delete subscription.', 'error');
    resetButton(elements.confirmDelete, 'Delete');
  }
}

async function removeScheduledNotifications(subscriptionId) {
  if (!currentUser) return;
  
  try {
    const snapshot = await database.ref('notificationQueue').once('value');
    const updates = {};
    
    snapshot.forEach((childSnapshot) => {
      const notification = childSnapshot.val();
      if (notification.subscriptionId === subscriptionId && notification.userId === currentUser.uid) {
        updates[childSnapshot.key] = null;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await database.ref('notificationQueue').update(updates);
    }
  } catch (error) {
    console.error('Error removing notifications:', error);
  }
}

// ===== EMAIL NOTIFICATIONS SCHEDULING =====
function scheduleEmailNotifications(subscription) {
  if (!currentUser) return;
  
  const endDate = new Date(subscription.endDate);
  const now = new Date();
  const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  
  // Check if we should schedule notifications
  if (daysLeft <= 0) return;
  
  // Schedule notifications for these days before expiry
  const notificationDays = [7, 3, 1];
  
  notificationDays.forEach(day => {
    if (daysLeft > day) {
      const notificationDate = new Date(endDate);
      notificationDate.setDate(notificationDate.getDate() - day);
      
      // Only schedule if notification is in the future
      if (notificationDate > now) {
        const notification = {
          subscriptionId: subscription.id,
          userId: currentUser.uid,
          email: subscription.email,
          subscriptionName: subscription.name,
          platform: subscription.platform || 'Unknown',
          endDate: subscription.endDate,
          startDate: subscription.startDate,
          mobile: subscription.mobile || '',
          notificationDate: notificationDate.toISOString(),
          daysBefore: day,
          sent: false,
          createdAt: new Date().toISOString()
        };
        
        // Store in notification queue
        database.ref('notificationQueue').push(notification)
          .catch(error => console.error('Error scheduling notification:', error));
      }
    }
  });
}

async function checkNotifications() {
  if (!currentUser) return;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  try {
    const snapshot = await database.ref('notificationQueue')
      .orderByChild('notificationDate')
      .startAt(today + 'T00:00:00.000Z')
      .endAt(today + 'T23:59:59.999Z')
      .once('value');
    
    let notificationsCount = 0;
    const notificationPromises = [];
    
    snapshot.forEach((childSnapshot) => {
      const notification = childSnapshot.val();
      
      // Check if notification is for current user and not sent yet
      if (notification.userId === currentUser.uid && !notification.sent) {
        notificationsCount++;
        
        // Send email notification
        notificationPromises.push(
          sendEmailNotification(notification, notification.daysBefore)
            .then(success => {
              if (success) {
                // Mark as sent
                return childSnapshot.ref.update({ 
                  sent: true, 
                  sentAt: new Date().toISOString() 
                });
              }
              return Promise.resolve();
            })
        );
      }
    });
    
    // Update notification count
    elements.notificationCount.textContent = notificationsCount;
    
    // Send all notifications in parallel
    if (notificationPromises.length > 0) {
      Promise.all(notificationPromises)
        .then(() => {
          console.log(`Sent ${notificationPromises.length} notifications`);
        })
        .catch(error => {
          console.error('Error sending notifications:', error);
        });
    }
    
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// ===== RENDERING =====
function renderSubscriptions() {
  if (!elements.subscriptionsList) return;
  
  elements.subscriptionsList.innerHTML = '';
  
  if (subscriptions.length === 0) {
    elements.noSubscriptions.style.display = 'block';
    elements.filterStats.style.display = 'none';
    return;
  }
  
  elements.noSubscriptions.style.display = 'none';
  elements.filterStats.style.display = 'block';
  
  // Apply filters and sorting
  let filtered = applyFilters(subscriptions);
  filtered = sortSubscriptions(filtered);
  
  // Create and append cards
  filtered.forEach((sub, index) => {
    const card = createSubscriptionCard(sub);
    card.style.animationDelay = `${index * 0.05}s`;
    elements.subscriptionsList.appendChild(card);
  });
  
  // Update filter stats
  updateFilterStats();
}

function createSubscriptionCard(sub) {
  const daysLeft = getDaysLeft(sub.endDate);
  const isExpired = daysLeft <= 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;
  
  // Determine status and color
  let statusText, statusColor, cardClass = '';
  
  if (isExpired) {
    statusText = 'Expired';
    statusColor = '#DC2626';
    cardClass = 'expired';
  } else if (daysLeft <= 1) {
    statusText = 'Tomorrow';
    statusColor = '#DC2626';
    cardClass = 'expiring';
  } else if (daysLeft <= 3) {
    statusText = `${daysLeft} days`;
    statusColor = '#EA580C';
    cardClass = 'expiring';
  } else if (daysLeft <= 7) {
    statusText = `${daysLeft} days`;
    statusColor = '#D97706';
    cardClass = 'expiring';
  } else {
    statusText = `${daysLeft} days`;
    statusColor = '#4C6EF5';
  }
  
  const card = document.createElement('div');
  card.className = `sub-card ${cardClass}`;
  card.dataset.id = sub.id;
  
  card.innerHTML = `
    <div class="sub-main">
      <div class="sub-header">
        <div class="sub-title-block">
          <h3 class="sub-name">${escapeHtml(sub.name)}</h3>
          ${sub.platform ? `<p class="platform">${escapeHtml(sub.platform)}</p>` : ''}
        </div>
        <span class="days" style="background-color: ${statusColor}15; color: ${statusColor}">
          ${statusText}
        </span>
      </div>

      <div class="sub-info">
        <div class="sub-row">
          <span class="sub-label">Period</span>
          <span class="sub-value">${formatDate(sub.startDate)} → ${formatDate(sub.endDate)}</span>
        </div>
        <div class="sub-row">
          <span class="sub-label">Email</span>
          <span class="sub-value">${escapeHtml(sub.email)}</span>
        </div>
        ${sub.mobile ? `
        <div class="sub-row">
          <span class="sub-label">Mobile</span>
          <span class="sub-value">${escapeHtml(sub.mobile)}</span>
        </div>` : ''}
        ${sub.notes ? `
        <div class="sub-row">
          <span class="sub-label">Notes</span>
          <span class="sub-value">${escapeHtml(sub.notes)}</span>
        </div>` : ''}
      </div>
    </div>

    <div class="card-actions">
      <button class="edit-btn" onclick="editSubscription('${sub.id}')">
        <span>✏️</span>
        Edit
      </button>
      <button class="delete-btn" onclick="deleteSubscription('${sub.id}')">
        <span>🗑️</span>
        Delete
      </button>
    </div>
  `;
  
  return card;
}

function applyFilters(subscriptionsList) {
  const searchTerm = currentSearch.toLowerCase();
  const statusFilter = currentFilter;
  
  return subscriptionsList.filter(sub => {
    // Search filter
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchTerm) ||
      (sub.platform && sub.platform.toLowerCase().includes(searchTerm)) ||
      (sub.notes && sub.notes.toLowerCase().includes(searchTerm)) ||
      sub.email.toLowerCase().includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    // Status filter
    const daysLeft = getDaysLeft(sub.endDate);
    
    switch (statusFilter) {
      case 'active':
        return daysLeft > 0;
      case 'expiring':
        return daysLeft > 0 && daysLeft <= 7;
      case 'expired':
        return daysLeft <= 0;
      default:
        return true;
    }
  });
}

function sortSubscriptions(subscriptionsList) {
  return subscriptionsList.sort((a, b) => {
    const dateA = new Date(a.endDate);
    const dateB = new Date(b.endDate);
    
    if (sortDirection === 'asc') {
      return dateA - dateB; // Oldest first
    } else {
      return dateB - dateA; // Newest first
    }
  });
}

function updateStats() {
  const total = subscriptions.length;
  const expiring = subscriptions.filter(sub => {
    const daysLeft = getDaysLeft(sub.endDate);
    return daysLeft > 0 && daysLeft <= 7;
  }).length;
  
  elements.totalSubscriptions.textContent = total;
  elements.expiringSoon.textContent = expiring;
  elements.totalCount.textContent = total;
}

function updateFilterStats() {
  const filtered = applyFilters(subscriptions);
  elements.showingCount.textContent = filtered.length;
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Form submission
  elements.form.addEventListener('submit', handleFormSubmit);
  
  // Cancel edit
  elements.cancelEditBtn.addEventListener('click', cancelEdit);
  
  // Logout
  elements.logoutBtn.addEventListener('click', handleLogout);
  
  // Refresh
  elements.refreshBtn.addEventListener('click', loadSubscriptions);
  
  // Add first subscription
  elements.addFirstBtn?.addEventListener('click', () => {
    document.querySelector('.form-card').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  });
  
  // Search and filter
  elements.searchInput.addEventListener('input', handleSearch);
  elements.filterStatus.addEventListener('change', handleFilterChange);
  elements.clearSearch.addEventListener('click', clearSearch);
  elements.sortToggle.addEventListener('click', toggleSort);
  
  // Export
  elements.exportBtn.addEventListener('click', exportSubscriptions);
  
  // Modal actions
  elements.confirmCancel.addEventListener('click', () => hideModal(elements.confirmModal));
  elements.confirmDelete.addEventListener('click', confirmDelete);
  elements.saveSettings.addEventListener('click', saveUserPreferences);
  elements.closeSettings.addEventListener('click', () => hideModal(elements.settingsModal));
  
  // Close modals on background click
  [elements.confirmModal, elements.settingsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal(modal);
      }
    });
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleSearch(e) {
  currentSearch = e.target.value;
  elements.clearSearch.style.display = currentSearch ? 'block' : 'none';
  renderSubscriptions();
}

function handleFilterChange(e) {
  currentFilter = e.target.value;
  renderSubscriptions();
}

function clearSearch() {
  elements.searchInput.value = '';
  currentSearch = '';
  elements.clearSearch.style.display = 'none';
  renderSubscriptions();
}

function toggleSort() {
  sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  elements.sortToggle.innerHTML = `
    <span>${sortDirection === 'asc' ? '📅' : '📆'}</span>
    ${sortDirection === 'asc' ? 'Oldest First' : 'Newest First'}
  `;
  elements.sortToggle.dataset.sort = sortDirection;
  renderSubscriptions();
}

// ===== EXPORT FUNCTIONALITY =====
function exportSubscriptions() {
  if (subscriptions.length === 0) {
    showToast('No subscriptions to export.', 'info');
    return;
  }
  
  const data = subscriptions.map(sub => ({
    'Subscription Name': sub.name,
    'Platform': sub.platform || '',
    'Start Date': formatDate(sub.startDate),
    'End Date': formatDate(sub.endDate),
    'Days Left': getDaysLeft(sub.endDate),
    'Email': sub.email,
    'Mobile': sub.mobile || '',
    'Notes': sub.notes || '',
    'Status': getStatus(sub.endDate)
  }));
  
  // Convert to CSV
  const csv = convertToCSV(data);
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cutoff-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showToast('Subscriptions exported successfully!', 'success');
}

function convertToCSV(data) {
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const cell = row[header];
      return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// ===== UTILITY FUNCTIONS =====
function getDaysLeft(endDate) {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatus(endDate) {
  const daysLeft = getDaysLeft(endDate);
  if (daysLeft <= 0) return 'Expired';
  if (daysLeft <= 7) return 'Expiring Soon';
  return 'Active';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidPhone(phone) {
  const re = /^\+[1-9]\d{1,14}$/;
  return re.test(phone);
}

function showToast(message, type = 'success') {
  const toast = elements.toast;
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showLoading(element, text = 'Loading...') {
  if (!element) return;
  
  const originalHTML = element.innerHTML;
  element.dataset.originalHTML = originalHTML;
  element.innerHTML = `<span class="spinner dark"></span> ${text}`;
  element.disabled = true;
}

function resetButton(element, text = null) {
  if (!element) return;
  
  const originalHTML = text || element.dataset.originalHTML || element.textContent;
  element.innerHTML = originalHTML;
  element.disabled = false;
}

function showLoadingOverlay() {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.remove('hidden');
  }
}

function hideLoadingOverlay() {
  if (elements.loadingOverlay) {
    setTimeout(() => {
      elements.loadingOverlay.classList.add('hidden');
      setTimeout(() => {
        elements.loadingOverlay.style.display = 'none';
      }, 300);
    }, 500);
  }
}

function showModal(modal) {
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + F to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    elements.searchInput.focus();
  }
  
  // Escape to close modals
  if (e.key === 'Escape') {
    hideModal(elements.confirmModal);
    hideModal(elements.settingsModal);
  }
  
  // Ctrl/Cmd + N to add new subscription
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    if (!editId) {
      elements.form.scrollIntoView({ behavior: 'smooth' });
      elements.name.focus();
    }
  }
}

// ===== INITIAL RENDER =====
// Start periodic notification checks (every hour)
setInterval(checkNotifications, 60 * 60 * 1000);

// Check notifications on page load
setTimeout(checkNotifications, 2000);