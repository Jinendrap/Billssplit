/* =========================================================================
   1) PASTE YOUR FIREBASE CONFIG BELOW (see setup instructions).
   Everything else in this file works as soon as this object is filled in.
   ========================================================================= */
const firebaseConfig = {
  /* [ADD Here]*/
};
/* ========================================================================= */

const CONFIG_IS_MISSING = firebaseConfig.apiKey.includes("PASTE_YOUR");

let db = null;
if(!CONFIG_IS_MISSING){
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}
