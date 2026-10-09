/* =========================================================================
   1) PASTE YOUR FIREBASE CONFIG BELOW (see setup instructions).
   Everything else in this file works as soon as this object is filled in.
   ========================================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyC8YfY62Osk76Um_IUjLSTEWQ_uySwU__U",
  authDomain: "billssplit-25259.firebaseapp.com",
  projectId: "billssplit-25259",
  storageBucket: "billssplit-25259.firebasestorage.app",
  messagingSenderId: "922331013618",
  appId: "1:922331013618:web:abf21ad15b6d12b13c8b6b",
  measurementId: "G-CNBJVF5XHB"
};
/* ========================================================================= */

const CONFIG_IS_MISSING = firebaseConfig.apiKey.includes("PASTE_YOUR");

let db = null;
if(!CONFIG_IS_MISSING){
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}
