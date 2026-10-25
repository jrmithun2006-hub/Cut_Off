const firebaseConfig = { 
  apiKey: "AIzaSyAjpxICETdQIvuw3mMt2pBDeOQDT10TH6U", 
  authDomain: "cutoff-subscriptions.firebaseapp.com", 
  databaseURL: "https://cutoff-subscriptions-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "cutoff-subscriptions", 
  storageBucket: "cutoff-subscriptions.firebasestorage.app", 
  messagingSenderId: "239564142815", 
  appId: "1:239564142815:web:44a6577763a691ba0a516a" 
}; 
firebase.initializeApp(firebaseConfig); 
window.auth = firebase.auth(); 
window.database = firebase.database(); 
