// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBlN3hKrkqsBTnmKW5F-0-qvQSoFvj0oyc",
    authDomain: "mine-coin-e3872.firebaseapp.com",
    projectId: "mine-coin-e3872",
    storageBucket: "mine-coin-e3872.firebasestorage.app",
    messagingSenderId: "256440351138",
    appId: "1:256440351138:web:115b88bbdfa22e4e6d1afb",
    measurementId: "G-1LZGHYECD6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const db = getFirestore(app);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
}); const storage = getStorage(app);

export { db, auth, storage };