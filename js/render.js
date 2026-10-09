function render(){
  preserveScroll(_render);
}
function _render(){
  const content = document.getElementById('content');

  if(CONFIG_IS_MISSING){
    lastRenderedTab = null;
    document.body.classList.remove('landing-mode');
    content.innerHTML = `
      <div class="config-warning">
        <b>⚠ Firebase isn't connected yet.</b><br>
        Open <code>js/firebase-service.js</code> and paste your Firebase project
        config into the <code>firebaseConfig</code> object near the top of the file.
        Once that's done, refresh this page and everything below will come alive.
      </div>
      <div class="card"><div class="empty">Waiting for Firebase config…</div></div>`;
    return;
  }

  if(!billId){ lastRenderedTab = null; renderLanding(); return; }
  if(!bill){
    lastRenderedTab = null;
    if(billNotFound){
      content.innerHTML = `
        <div class="card">
          <div class="people-empty">
            <div class="big-icon">🔍</div>
            <p>We couldn't find this bill. The link may be mistyped, or the bill may no longer exist.</p>
            <button class="btn-primary" style="margin-top:16px;" onclick="goHome()">Start a new bill</button>
          </div>
        </div>`;
    } else {
      content.innerHTML = `
        <div class="card">
          <div class="people-empty">
            <span class="spinner" style="width:20px;height:20px;border-width:3px;margin:0 0 10px;"></span>
            <p>Loading your bill…</p>
          </div>
        </div>`;
    }
    return;
  }
  if(!myPersonId || !bill.people[myPersonId]){ lastRenderedTab = null; renderJoin(); return; }

  renderMain();
}

