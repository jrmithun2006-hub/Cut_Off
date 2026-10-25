# APPENDICES
## (Source Code)
### Source Code and Project Structure
**Repository:** https://github.com/jrmithun2006-hub/Cut_Off  
**Hosting Domain:** https://cutoff-subscriptions.web.app  
**Platform Architecture:** Web Application (HTML5, Vanilla CSS3, JavaScript ES6+, Google Firebase, EmailJS)

---

### 1. Project Structure
```text
Cut_Off/
|-- index.html                       # Entry portal, authentication forms (Email, Google, Phone OTP)
|-- dashboard.html                   # Main application interface with dynamic dashboard & analytics
|-- auth.js                          # Firebase Authentication controller & reCAPTCHA handlers
|-- dashboard.js                     # Core business logic, Cut-off calculators, RTDB sync & scheduler
|-- firebase-config.js               # Cloud Firebase client SDK configuration & service export
|-- database.rules.json              # Firebase Realtime Database authorization & security rules
|-- firebase.json                    # Firebase hosting deployment & URL routing specifications
|-- .firebaserc                      # Firebase project target binding (cutoff-subscriptions)
|-- .gitignore                       # Git ignore list for logs, local caches, and environments
|-- style.css                        # Global styling tokens, micro-animations, and dark mode rules
`-- public/                          # Production distribution directory
    |-- index.html                   # Minified landing page
    |-- dashboard.html               # Minified dashboard UI
    |-- auth.js, dashboard.js        # Production JavaScript bundles
    |-- firebase-config.js           # Production Firebase configuration
    `-- style.css                    # Production stylesheet
```

---

### 2. Package Installation & Deployment Setup
```bash
# 1. Install Firebase CLI globally
npm install -g firebase-tools

# 2. Authenticate CLI with Google Account
firebase login

# 3. Test locally using Firebase Hosting local emulator
firebase serve --only hosting

# 4. Deploy production build to Firebase Cloud
firebase deploy --only hosting,database

# 5. Push version updates to GitHub
git add .
git commit -m "Update project modules"
git push -u origin main
```

---

### 3. Firebase Connection (`firebase-config.js`)
```javascript
// Firebase Configuration File
const firebaseConfig = {
    apiKey: "AIzaSyAjpxICETdQIvuw3mMt2pBDeOQDT10TH6U",
    authDomain: "cutoff-subscriptions.firebaseapp.com",
    databaseURL: "https://cutoff-subscriptions-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cutoff-subscriptions",
    storageBucket: "cutoff-subscriptions.firebasestorage.app",
    messagingSenderId: "239564142815",
    appId: "1:239564142815:web:44a6577763a691ba0a516a"
};

// Initialize Firebase SDK
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const auth = firebase.auth();
const database = firebase.database();
const firestore = firebase.firestore();

// Export for global browser window scope
window.auth = auth;
window.database = database;
window.firestore = firestore;
```

---

### 4. Email Notification Service Configuration (`dashboard.js` & `dashboard.html`)
```javascript
// EmailJS Notification Service Settings
const EMAIL_CONFIG = {
    SERVICE_ID: 'service_5uhyx4s',      // EmailJS Service Identifier
    TEMPLATE_ID: 'template_ug4laxg',    // EmailJS Dynamic Template Identifier
    PUBLIC_KEY: 'bcMSvUiDIm1CPzsoa',    // Client Public API Key
    NOTIFICATION_DAYS: [7, 5, 3, 1, 0] // Pre-expiry trigger intervals (in days)
};

// Initialize EmailJS Client SDK
(function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
        console.log("EmailJS initialized successfully");
    }
})();
```

---

### 5. Environment & Cloud Configuration
```text
VITE_FIREBASE_API_KEY=AIzaSyAjpxICETdQIvuw3mMt2pBDeOQDT10TH6U
VITE_FIREBASE_AUTH_DOMAIN=cutoff-subscriptions.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://cutoff-subscriptions-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=cutoff-subscriptions
VITE_FIREBASE_STORAGE_BUCKET=cutoff-subscriptions.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=239564142815
VITE_FIREBASE_APP_ID=1:239564142815:web:44a6577763a691ba0a516a
EMAILJS_SERVICE_ID=service_5uhyx4s
EMAILJS_TEMPLATE_ID=template_ug4laxg
EMAILJS_PUBLIC_KEY=bcMSvUiDIm1CPzsoa
```

---

### 6. Subscription Data Model (`subscriptions/{userId}/{subscriptionId}`)
```javascript
// Realtime Database Subscription Node Structure
const subscriptionSchema = {
    id: String,           // Auto-generated unique push key
    userId: String,       // Firebase Authentication UID (Owner)
    name: String,         // Subscription / Service Name (Required)
    platform: String,     // Provider Platform (e.g., Netflix, AWS, Coursera)
    startDate: String,    // Subscription commencement date (YYYY-MM-DD)
    endDate: String,      // Cut-off expiration date (YYYY-MM-DD)
    email: String,        // Notification recipient email address
    mobile: String,       // Optional contact / SMS recipient
    cost: Number,         // Recurring fee / cost value
    notes: String,        // Operational remarks / subscription identifiers
    createdAt: String,    // ISO 8601 creation timestamp
    updatedAt: String     // ISO 8601 last update timestamp
};
```

---

### 7. Email Notification Log & Preferences Model
```javascript
// Email Audit Log Node Schema (`emailLogs/{userId}/{logId}`)
const emailLogSchema = {
    subscriptionId: String,   // Reference to target subscription
    subscriptionName: String, // Cached subscription title
    email: String,            // Destination email
    daysLeft: Number,         // Computed days remaining at time of dispatch
    sentAt: String,           // ISO 8601 timestamp of dispatch
    status: "sent" | "failed",// Operational status
    error: String             // Diagnostics (if dispatch failed)
};

// User Preference Schema (`userPreferences/{userId}`)
const userPreferencesSchema = {
    emailNotifications: Boolean, // Master notification switch
    notify7Days: Boolean,        // 7-day alert flag
    notify3Days: Boolean,        // 3-day alert flag
    notify1Day: Boolean,         // 24-hour urgency alert flag
    updatedAt: String
};
```

---

### 8. Authentication Service (`auth.js` & `index.html`)
```javascript
// Email & Password Registration
async function handleSignup(name, email, password) {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    await user.updateProfile({ displayName: name });
    await database.ref('users/' + user.uid).set({
        name: name,
        email: email,
        createdAt: new Date().toISOString()
    });
    return user;
}

// Google OAuth Popup Authentication
async function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    
    await database.ref('users/' + user.uid).set({
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        isGoogleUser: true,
        updatedAt: new Date().toISOString()
    });
    return user;
}

// Auth Error Message Parser
function getAuthErrorMessage(error) {
    switch (error?.code) {
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/user-not-found':
            return 'No user found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/popup-blocked':
            return 'Login popup blocked by browser. Please allow popups.';
        default:
            return error.message || 'Authentication failed.';
    }
}
```

---

### 9. Route Guard & Session Persistence (`dashboard.js`)
```javascript
// Protected Session Guard
async function checkAuthentication() {
    currentUserId = localStorage.getItem('cutoff_user');
    const userEmail = localStorage.getItem('cutoff_email');

    // Reject unauthenticated access
    if (!currentUserId || !userEmail) {
        window.location.href = 'index.html';
        return;
    }

    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                localStorage.clear();
                window.location.href = 'index.html';
                return;
            }
            currentUser = user;
            resolve(user);
        });
    });
}
```

---

### 10. User-Scoped Realtime Database Paths (`dashboard.js`)
```javascript
// User Data Collections
export function getUserNodeRef(database, userId) {
    return database.ref(`users/${userId}`);
}

// User-Scoped Subscription Collection
export function getUserSubscriptionsRef(database, userId) {
    return database.ref(`subscriptions/${userId}`);
}

// User-Scoped Notification Audit Logs
export function getUserEmailLogsRef(database, userId) {
    return database.ref(`emailLogs/${userId}`);
}
```

---

### 11. Database Security & Access Control Rules (`database.rules.json`)
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid"
      }
    },
    "subscriptions": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "emailLogs": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid"
      }
    }
  }
}
```

---

### 12. Cut-Off Expiry Days Calculation (`dashboard.js`)
```javascript
// Compute days remaining until expiration cutoff date
function getDaysLeft(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Classify status based on remaining days threshold
function getStatus(endDate) {
    const daysLeft = getDaysLeft(endDate);
    if (daysLeft <= 0) return 'Expired';
    if (daysLeft <= 7) return 'Expiring Soon';
    return 'Active';
}

// Format date into localized human-readable representation
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
```

---

### 13. Automated Email Notification Dispatcher (`dashboard.js`)
```javascript
// Dispatch automated alert email via EmailJS
async function sendEmailNotification(subscription, daysLeft) {
    if (!subscription.email) return false;

    try {
        const templateParams = {
            to_email: subscription.email,
            subscription_name: subscription.name,
            platform: subscription.platform || 'General Service',
            days_left: daysLeft,
            end_date: formatDate(subscription.endDate),
            start_date: formatDate(subscription.startDate),
            user_email: subscription.email,
            notification_date: new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }),
            notification_time: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit'
            })
        };

        const response = await emailjs.send(
            EMAIL_CONFIG.SERVICE_ID,
            EMAIL_CONFIG.TEMPLATE_ID,
            templateParams
        );

        // Record successful dispatch into audit log
        if (currentUserId) {
            await database.ref(`emailLogs/${currentUserId}`).push({
                subscriptionId: subscription.id,
                subscriptionName: subscription.name,
                email: subscription.email,
                daysLeft: daysLeft,
                sentAt: new Date().toISOString(),
                status: 'sent'
            });
        }
        return true;
    } catch (error) {
        console.error('Email notification failed:', error);
        return false;
    }
}

// Background scheduler evaluating subscription cutoffs
function checkAndSendNotifications() {
    subscriptions.forEach(subscription => {
        const daysLeft = getDaysLeft(subscription.endDate);
        if (EMAIL_CONFIG.NOTIFICATION_DAYS.includes(daysLeft)) {
            sendEmailNotification(subscription, daysLeft);
        }
    });
}
```

---

### 14. Real-time Cloud Synchronization & Event Listeners (`dashboard.js`)
```javascript
// Real-time synchronization listener for cloud database changes
function setupRealtimeListener() {
    if (!currentUserId) return;

    database.ref(`subscriptions/${currentUserId}`).on('value', (snapshot) => {
        subscriptions = [];

        if (!snapshot.exists()) {
            elements.noSubscriptions.style.display = 'block';
            elements.subscriptionsList.innerHTML = '';
            updateStats();
            return;
        }

        elements.noSubscriptions.style.display = 'none';
        snapshot.forEach((childSnapshot) => {
            const sub = childSnapshot.val();
            sub.id = childSnapshot.key;
            subscriptions.push(sub);
        });

        renderSubscriptions();
        updateStats();
    });
}
```

---

### 15. Real-Time Search & Multi-Criteria Filtering Engine (`dashboard.js`)
```javascript
function applyFilters(subscriptionsList) {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const filterStatus = elements.filterStatus.value;

    return subscriptionsList.filter(sub => {
        // Full text match across name, platform, notes and email
        const matchesSearch =
            sub.name.toLowerCase().includes(searchTerm) ||
            (sub.platform && sub.platform.toLowerCase().includes(searchTerm)) ||
            (sub.notes && sub.notes.toLowerCase().includes(searchTerm)) ||
            sub.email.toLowerCase().includes(searchTerm);

        if (!matchesSearch) return false;

        // Status threshold evaluation
        const daysLeft = getDaysLeft(sub.endDate);
        switch (filterStatus) {
            case 'active':
                return daysLeft > 0;
            case 'expiring':
                return daysLeft > 0 && daysLeft <= 7;
            case 'expired':
                return daysLeft <= 0;
            default:
                return true;
        }
    }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
}
```

---

### 16. CSV Export & Data Portability Engine (`dashboard.js`)
```javascript
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
        'Status': getStatus(sub.endDate)
    }));

    // Convert JSON to RFC 4180 compliant CSV format
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(header => {
            const cell = row[header];
            return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
        }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    // Trigger instant browser file download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cutoff-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
```
