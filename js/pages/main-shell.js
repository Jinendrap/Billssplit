/* ---------- MAIN APP ---------- */
function renderMain(){
  document.body.classList.remove('landing-mode');
  const people = bill.people || {};
  const me = people[myPersonId];
  const shareUrl = window.location.href;
  const idx = TAB_ORDER.indexOf(activeTab);

  // A Firestore snapshot fires on every single write — including ones this
  // same tab just made (select/unselect an item, add/edit/delete a charge,
  // etc). Previously every one of those rebuilt the ENTIRE shell (share-bar
  // + tabs + tabContent container) from scratch, which is what destroyed
  // and recreated DOM nodes that didn't need to change and set up the
  // flicker/jump. Now the shell is only rebuilt the first time we enter the
  // main screen, or when the user actually switches tabs — a same-tab data
  // refresh leaves the share-bar/tabs alone and only updates #tabContent
  // via the active tab's own renderer below.
  const shellMissing = !document.getElementById('tabsBar');
  isTabSwitchRender = shellMissing || lastRenderedTab !== activeTab;
  lastRenderedTab = activeTab;

  if(isTabSwitchRender){
    document.getElementById('content').innerHTML = `
      <div class="share-bar glass">
        <span class="who-badge"><span class="avatar" style="background:${me.color}">${initials(me.name)}</span>You: ${me.name}</span>
        <button class="switch-link" onclick="switchIdentity()">Not you? Switch</button>
        <input type="text" id="shareLink" readonly aria-label="Bill share link" value="${shareUrl}" onclick="this.select()">
        <button class="btn-small" id="copyBtn" onclick="copyShareLink(this)">Copy link</button>
      </div>
      <div class="tabs glass" id="tabsBar" role="tablist" aria-label="Bill sections">
        <div class="tab-indicator" id="tabIndicator" aria-hidden="true"></div>
        <button class="tab ${activeTab==='people'?'active':''}" role="tab" aria-selected="${activeTab==='people'}" onclick="setTab('people')">People</button>
        <button class="tab ${activeTab==='items'?'active':''}" role="tab" aria-selected="${activeTab==='items'}" onclick="setTab('items')">Items</button>
        <button class="tab ${activeTab==='charges'?'active':''}" role="tab" aria-selected="${activeTab==='charges'}" onclick="setTab('charges')">Charges</button>
        <button class="tab ${activeTab==='split'?'active':''}" role="tab" aria-selected="${activeTab==='split'}" onclick="setTab('split')">Split</button>
      </div>
      <div id="tabContent"></div>
      <div class="footer-nav">
        <button class="btn-ghost" onclick="goBack()" ${idx===0 ? 'style="visibility:hidden"' : ''}>← Back</button>
        <button class="btn-primary" onclick="goNext()" ${idx===TAB_ORDER.length-1 ? 'style="visibility:hidden"' : ''}>Next →</button>
      </div>
    `;
    positionTabIndicator();
  }

  if(activeTab==='items') renderItemsTab();
  if(activeTab==='charges') renderChargesTab();
  if(activeTab==='split') renderSplitTab();
  if(activeTab==='people') renderPeopleTab();
}

// Slides the little background pill under the active tab. Purely visual —
// setTab()/activeTab/TAB_ORDER (the actual navigation state) are untouched.
function positionTabIndicator(){
  const bar = document.getElementById('tabsBar');
  const indicator = document.getElementById('tabIndicator');
  const activeBtn = bar && bar.querySelector('.tab.active');
  if(!bar || !indicator || !activeBtn) return;
  indicator.style.left = activeBtn.offsetLeft + 'px';
  indicator.style.width = activeBtn.offsetWidth + 'px';
}
window.addEventListener('resize', ()=>{ if(document.getElementById('tabsBar')) positionTabIndicator(); });

function setTab(tab){ activeTab = tab; renderMain(); }

function goBack(){
  const idx = TAB_ORDER.indexOf(activeTab);
  if(idx > 0){ activeTab = TAB_ORDER[idx-1]; renderMain(); }
}
function goNext(){
  const idx = TAB_ORDER.indexOf(activeTab);
  if(idx < TAB_ORDER.length-1){ activeTab = TAB_ORDER[idx+1]; renderMain(); }
}

function switchIdentity(){
  localStorage.removeItem('billsplit_identity_' + billId);
  myPersonId = null;
  render();
}

function goHome(){
  // Full reload to the base URL (no ?bill=...) — cleanest way to guarantee
  // a fresh landing screen with no leftover state.
  window.location.href = window.location.origin + window.location.pathname;
}

function copyShareLink(btn){
  const el = document.getElementById('shareLink');
  el.select();
  const flash = (ok)=>{
    if(!btn) return;
    const original = btn.textContent;
    btn.textContent = ok ? 'Copied ✓' : 'Copy failed';
    btn.classList.toggle('btn-small-success', ok);
    setTimeout(()=>{ btn.textContent = original; btn.classList.remove('btn-small-success'); }, 1600);
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(el.value).then(()=>flash(true)).catch(()=>{
      // fall back to the older execCommand approach if the async Clipboard API is blocked
      try{ document.execCommand('copy'); flash(true); }catch(e){ flash(false); }
    });
  } else {
    try{ document.execCommand('copy'); flash(true); }catch(e){ flash(false); }
  }
}
