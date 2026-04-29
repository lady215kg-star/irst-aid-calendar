# irst-aid-calendar
FirstAid
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAw0gQQ7wht2-K2UfPNPfBimtp93QSkTXs",
  authDomain: "first-aid-app-563c2.firebaseapp.com",
  projectId: "first-aid-app-563c2",
  storageBucket: "first-aid-app-563c2.firebasestorage.app",
  messagingSenderId: "974895823548",
  appId: "1:974895823548:web:643d6304a89e25c5a2aeb9",
  measurementId: "G-BSDTRPSS37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);