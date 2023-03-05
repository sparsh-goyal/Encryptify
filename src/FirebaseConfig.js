// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDe8lHayscXRWyl328zJwyObpHjk46lkRo",
  authDomain: "encriptify-a1938.firebaseapp.com",
  projectId: "encriptify-a1938",
  storageBucket: "encriptify-a1938.appspot.com",
  messagingSenderId: "228723211733",
  appId: "1:228723211733:web:ccb97927f5964a7918d15c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
