// src/firebase.js

// Import the functions for the Firebase services used in your application.
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// This object was provided by the Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyD7KOGlVw2lvUh1dZCytr00wsXXXXXXXXX",
  authDomain: "XXXXXXXXX.firebaseapp.com",
  projectId: "kadu-academy",
  storageBucket: "XXXXXXXXX.firebasestorage.app",
  messagingSenderId: "216690XXXXXXXXX",
  appId: "1:21669021948:web:7479893bea8bff2bXXXXXXXXX",
  measurementId: "G-90V23VPWTX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize the services required by your app
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export the initialized services so they can be used throughout your application.
export {
  auth,
  db,
  storage,
  analytics
};
