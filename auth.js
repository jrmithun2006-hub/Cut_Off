// Auth state management
let authInitialized = false;

// DOM Elements
const googleLoginBtn = document.getElementById('googleLogin');
const phoneLoginBtn = document.getElementById('phoneLogin');
const sendOTPBtn = document.getElementById('sendOTP');
const verifyOTPBtn = document.getElementById('verifyOTP');
const backBtn = document.getElementById('backToOptions');
const phoneForm = document.getElementById('phone-form');
const otpInput = document.getElementById('otp-input');
const errorDiv = document.getElementById('error');
const loginOptions = document.getElementById('login-options');

// Initialize authentication
function initAuth() {
  if (authInitialized) return;
  
  // Check current auth state
  auth.onAuthStateChanged(handleAuthStateChange);
  
  // Setup event listeners
  setupEventListeners();
  
  authInitialized = true;
}

// Handle auth state changes
function handleAuthStateChange(user) {
  if (user) {
    // User is signed in
    localStorage.setItem('userEmail', user.email || user.phoneNumber);
    localStorage.setItem('userId', user.uid);
    localStorage.setItem('userDisplayName', user.displayName || 'User');
    
    // Smooth transition to dashboard
    fadeOutPage(() => {
      window.location.href = 'dashboard.html';
    });
  } else {
    // User is signed out
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userDisplayName');
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Google Login
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
  }
  
  // Phone Login
  if (phoneLoginBtn) {
    phoneLoginBtn.addEventListener('click', showPhoneForm);
  }
  
  // Send OTP
  if (sendOTPBtn) {
    sendOTPBtn.addEventListener('click', handleSendOTP);
  }
  
  // Verify OTP
  if (verifyOTPBtn) {
    verifyOTPBtn.addEventListener('click', handleVerifyOTP);
  }
  
  // Back button
  if (backBtn) {
    backBtn.addEventListener('click', hidePhoneForm);
  }
}

// Handle Google Login
async function handleGoogleLogin() {
  try {
    showLoading(googleLoginBtn, 'Connecting...');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await auth.signInWithPopup(provider);
    
    // Success animation
    animateSuccess(googleLoginBtn);
    showMessage('Login successful! Redirecting...', 'success');
    
  } catch (error) {
    console.error('Google login error:', error);
    showMessage(getAuthErrorMessage(error), 'error');
    resetButton(googleLoginBtn, 'Continue with Google');
  }
}

// Show phone form with animation
function showPhoneForm() {
  if (!phoneForm || !loginOptions) return;
  
  // Animate out login options
  loginOptions.style.animation = 'slideOutLeft 0.3s forwards';
  
  setTimeout(() => {
    loginOptions.style.display = 'none';
    phoneForm.style.display = 'block';
    phoneForm.style.animation = 'slideInRight 0.3s forwards';
    
    // Initialize reCAPTCHA after form is visible
    setTimeout(initializeRecaptcha, 300);
  }, 300);
}

// Hide phone form with animation
function hidePhoneForm() {
  if (!phoneForm || !loginOptions) return;
  
  // Clear any existing reCAPTCHA
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    window.recaptchaVerifier = null;
  }
  
  // Reset OTP input
  otpInput.classList.remove('active');
  document.getElementById('verificationCode').value = '';
  document.getElementById('phoneNumber').value = '';
  
  // Animate back to login options
  phoneForm.style.animation = 'slideOutRight 0.3s forwards';
  
  setTimeout(() => {
    phoneForm.style.display = 'none';
    loginOptions.style.display = 'flex';
    loginOptions.style.animation = 'slideInLeft 0.3s forwards';
    showMessage('', 'clear');
  }, 300);
}

// Initialize reCAPTCHA
function initializeRecaptcha() {
  const recaptchaContainer = document.getElementById('recaptcha-container');
  if (!recaptchaContainer) return;
  
  // Clear previous reCAPTCHA
  recaptchaContainer.innerHTML = '';
  
  try {
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'normal',
      callback: function(response) {
        console.log('reCAPTCHA solved');
        document.getElementById('sendOTP').disabled = false;
      },
      'expired-callback': function() {
        console.log('reCAPTCHA expired');
        document.getElementById('sendOTP').disabled = true;
        showMessage('Security check expired. Please try again.', 'error');
      }
    });
    
    window.recaptchaVerifier.render().then(function(widgetId) {
      console.log('reCAPTCHA widget rendered:', widgetId);
    }).catch(function(error) {
      console.error('reCAPTCHA render error:', error);
      showMessage('Security check failed to load. Please refresh.', 'error');
    });
    
  } catch (error) {
    console.error('reCAPTCHA initialization error:', error);
    showMessage('Security system error. Please refresh page.', 'error');
  }
}

// Handle Send OTP
async function handleSendOTP() {
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  
  // Validate phone number
  if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
    showMessage('Please enter a valid phone number with country code (e.g., +919876543210)', 'error');
    return;
  }
  
  if (!window.recaptchaVerifier) {
    showMessage('Security check not loaded. Please refresh.', 'error');
    return;
  }
  
  try {
    showLoading(sendOTPBtn, 'Sending OTP...');
    
    const confirmationResult = await auth.signInWithPhoneNumber(
      phoneNumber, 
      window.recaptchaVerifier
    );
    
    window.confirmationResult = confirmationResult;
    
    // Show OTP input with animation
    otpInput.classList.add('active');
    otpInput.style.animation = 'fadeInUp 0.3s forwards';
    sendOTPBtn.style.display = 'none';
    
    showMessage('OTP sent successfully! Check your SMS.', 'success');
    document.getElementById('verificationCode').focus();
    
  } catch (error) {
    console.error('Send OTP error:', error);
    showMessage(getAuthErrorMessage(error), 'error');
    resetButton(sendOTPBtn, 'Send OTP');
    
    // Reset reCAPTCHA on certain errors
    if (error.code === 'auth/invalid-recaptcha') {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setTimeout(initializeRecaptcha, 1000);
    }
  }
}

// Handle Verify OTP
async function handleVerifyOTP() {
  const code = document.getElementById('verificationCode').value.trim();
  
  if (!code || code.length !== 6) {
    showMessage('Please enter 6-digit OTP', 'error');
    return;
  }
  
  if (!window.confirmationResult) {
    showMessage('OTP session expired. Please request new OTP.', 'error');
    return;
  }
  
  try {
    showLoading(verifyOTPBtn, 'Verifying...');
    
    const result = await window.confirmationResult.confirm(code);
    const user = result.user;
    
    // Success animation
    animateSuccess(verifyOTPBtn);
    showMessage('Phone verified successfully!', 'success');
    
    // Store user info
    localStorage.setItem('userEmail', user.phoneNumber);
    localStorage.setItem('userId', user.uid);
    localStorage.setItem('userDisplayName', 'Phone User');
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    
    if (error.code === 'auth/invalid-verification-code') {
      showMessage('Invalid OTP. Please check and try again.', 'error');
      // Shake animation for wrong OTP
      document.getElementById('verificationCode').classList.add('shake');
      setTimeout(() => {
        document.getElementById('verificationCode').classList.remove('shake');
      }, 500);
    } else {
      showMessage(getAuthErrorMessage(error), 'error');
    }
    
    resetButton(verifyOTPBtn, 'Verify OTP');
  }
}

// Helper Functions

function isValidPhoneNumber(phone) {
  // Basic validation for international numbers
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

function getAuthErrorMessage(error) {
  const errorMessages = {
    'auth/popup-blocked': 'Popup blocked by browser. Please allow popups for this site.',
    'auth/popup-closed-by-user': 'Login popup was closed. Please try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-phone-number': 'Invalid phone number format. Use +91 followed by 10 digits.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/captcha-check-failed': 'Security check failed. Please refresh and try again.',
    'auth/session-expired': 'Session expired. Please try again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'Phone login is not enabled. Contact support.',
    'auth/quota-exceeded': 'Daily quota exceeded. Try again tomorrow.'
  };
  
  return errorMessages[error.code] || error.message || 'Authentication failed. Please try again.';
}

function showMessage(message, type = 'info') {
  if (!errorDiv) return;
  
  errorDiv.textContent = message;
  errorDiv.className = 'message';
  
  if (type === 'success') {
    errorDiv.classList.add('success');
  } else if (type === 'error') {
    errorDiv.classList.add('error');
  } else if (type === 'clear') {
    errorDiv.textContent = '';
    errorDiv.className = 'message';
  }
  
  if (message) {
    errorDiv.style.display = 'block';
    errorDiv.style.animation = 'fadeIn 0.3s forwards';
  } else {
    errorDiv.style.display = 'none';
  }
}

function showLoading(button, text = 'Loading...') {
  if (!button) return;
  
  const originalText = button.textContent;
  button.dataset.originalText = originalText;
  button.innerHTML = `<span class="spinner"></span> ${text}`;
  button.disabled = true;
}

function resetButton(button, text = null) {
  if (!button) return;
  
  const originalText = text || button.dataset.originalText || 'Continue';
  button.innerHTML = originalText;
  button.disabled = false;
}

function animateSuccess(element) {
  if (!element) return;
  
  element.classList.add('success-animation');
  setTimeout(() => {
    element.classList.remove('success-animation');
  }, 1000);
}

function fadeOutPage(callback) {
  document.body.style.animation = 'fadeOut 0.5s forwards';
  setTimeout(callback, 500);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);