/* ---------- toast + write-safety wrapper ----------
   Every Firestore write in the app now routes through safeUpdate() instead of
   calling db.collection(...).update(...) directly, so a dropped connection
   shows a clean message instead of a silent failure or a raw error in the
   console alone. Console still gets the real error for debugging. */
function showToast(msg, kind){
  const host = document.getElementById('toastHost');
  if(!host) return;
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' toast-' + kind : '');
  el.textContent = msg;
  host.appendChild(el);
  if(typeof gsap !== 'undefined' && !prefersReducedMotion()){
    gsap.fromTo(el, {opacity:0, y:14}, {opacity:1, y:0, duration:0.3, ease:'power2.out'});
  }
  setTimeout(()=>{
    if(typeof gsap !== 'undefined' && !prefersReducedMotion()){
      gsap.to(el, {opacity:0, y:8, duration:0.25, ease:'power2.in', onComplete:()=> el.remove()});
    } else {
      el.remove();
    }
  }, 3200);
}
/* ---------- scroll/focus preservation ----------
   Every data change (add/edit/delete an item, toggle who had it, add/edit a
   charge, etc.) goes to Firestore, and the live listener rebuilds the
   affected screen's innerHTML from scratch — there's no partial DOM patch
   here. Rebuilding innerHTML replaces the focused input and can leave the
   browser (especially mobile, once a focused field/keyboard closes) jumping
   back to the top of the page. Rather than papering over every individual
   call site, every re-render that can happen as a *result* of a user
   action while they're mid-scroll goes through this: capture where they
   were and what had focus, let the render happen, then put both back. */
function preserveScroll(fn){
  const scrollX = window.scrollX, scrollY = window.scrollY;
  const active = document.activeElement;
  let restoreId = null, selStart = null, selEnd = null;
  if(active && active.id && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')){
    restoreId = active.id;
    if(typeof active.selectionStart === 'number'){ selStart = active.selectionStart; selEnd = active.selectionEnd; }
  }
  fn();
  const restore = ()=>{
    window.scrollTo(scrollX, scrollY);
    if(restoreId){
      const el = document.getElementById(restoreId);
      if(el && typeof el.focus === 'function'){
        el.focus({preventScroll:true});
        if(selStart !== null && typeof el.setSelectionRange === 'function'){
          try{ el.setSelectionRange(selStart, selEnd); }catch(e){}
        }
      }
    }
  };
  restore();
  // Some mobile browsers adjust scroll asynchronously (e.g. once a virtual
  // keyboard finishes closing) after the DOM mutation above — reassert on
  // the next frame so that adjustment doesn't win.
  requestAnimationFrame(restore);
}

async function safeUpdate(updates){
  try{
    return await db.collection('bills').doc(billId).update(updates);
  }catch(err){
    console.error('BillSplit: Firestore update failed', err);
    showToast("Couldn't save that — check your connection and try again.", 'error');
    throw err;
  }
}
