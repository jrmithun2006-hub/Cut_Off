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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const auth = firebase.auth();
const database = firebase.database();
const firestore = firebase.firestore(); // If you decide to use Firestore later

// Export for use in other files
window.auth = auth;
window.database = database;
window.firestore = firestore;