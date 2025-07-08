// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxSb0_2wy3bpsmYKnkcickxicfbxS_tJE",
  authDomain: "agenda-hub-29cdf.firebaseapp.com",
  projectId: "agenda-hub-29cdf",
  storageBucket: "agenda-hub-29cdf.appspot.com",
  messagingSenderId: "468479098020",
  appId: "1:468479098020:web:04e105930492013c733a31",
  measurementId: "G-4W34JS8K93"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
