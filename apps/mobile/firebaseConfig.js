import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA96OS-Cb9_-HynPFCFx1CXAHVFvv1sWbY",
  authDomain: "veto-app-f04c7.firebaseapp.com",
  projectId: "veto-app-f04c7",
  storageBucket: "veto-app-f04c7.firebasestorage.app",
  messagingSenderId: "819326713548",
  appId: "1:819326713548:web:5eebd303ed6d5baa76cc69",
  measurementId: "G-LYC1RGSVJ3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
