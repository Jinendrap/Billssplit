/* ---------- boot ---------- */
function boot(){
  if(CONFIG_IS_MISSING){ render(); return; }

  if(billId){
    myPersonId = localStorage.getItem('billsplit_identity_' + billId);
    unsubscribe = db.collection('bills').doc(billId).onSnapshot(snap=>{
      if(!snap.exists){ bill = null; billNotFound = true; render(); return; }
      billNotFound = false;
      bill = snap.data();
      render();
    }, err=>{
      console.error('BillSplit: Firestore connection failed', err);
      document.getElementById('content').innerHTML = `
        <div class="card">
          <div class="people-empty">
            <div class="big-icon">⚠️</div>
            <p>Couldn't connect to Firebase. Check your connection, or the app's Firestore config, and try reloading.</p>
          </div>
        </div>`;
    });
  } else {
    render();
  }
}
boot();
