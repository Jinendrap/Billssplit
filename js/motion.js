/* =========================================================================
   MOTION SYSTEM — one consolidated set of helpers used by every screen.
   Every animation here exists to signal hierarchy, cause-and-effect, a state
   change, continuity between screens, or a small moment of delight — nothing
   is decorative-only. All of it prefers transform/opacity (GPU-friendly),
   respects prefers-reduced-motion, and degrades to instant/static output if
   GSAP hasn't loaded (e.g. offline CDN failure) so the app never breaks.
   ========================================================================= */
function prefersReducedMotion(){
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// entrance stagger for a group of siblings appearing together (list rows, chips) —
// signals CONTINUITY: "this whole group just arrived as one unit."
function animateOnce(selector){
  const els = document.querySelectorAll(selector);
  if(!els.length || typeof gsap === 'undefined' || prefersReducedMotion()) return;
  gsap.fromTo(els, {opacity:0, y:14}, {opacity:1, y:0, duration:0.45, ease:'power3.out', stagger:0.06});
}

// a subtle top-level settle applied once per screen/tab render — signals
// CONTINUITY between navigations without making the user wait.
function transitionScreen(selector){
  const el = document.querySelector(selector);
  if(!el || typeof gsap === 'undefined' || prefersReducedMotion()) return;
  gsap.fromTo(el, {opacity:0, y:8}, {opacity:1, y:0, duration:0.3, ease:'power2.out'});
}

// Numbers persist their last-seen value in this map (survives re-renders,
// since Firestore snapshots fully rebuild the DOM). First appearance counts
// up from 0 once scrolled into view; every value AFTER that animates from
// its previous amount to the new one immediately — this is what makes
// ₹500 → ₹350 read as a smooth transition instead of a jump cut.
const numberMemory = {};
function tweenNumber(el, prefix, from, to, duration, writer){
  writer = writer || ((val)=>{ el.textContent = prefix + fmt(val); });
  if(typeof gsap === 'undefined' || prefersReducedMotion() || from===to){
    writer(to);
    return;
  }
  const obj = {val: from};
  gsap.to(obj, {val:to, duration: duration||0.6, ease:'power3.out', onUpdate:()=> writer(obj.val)});
}
function animateAmount(el, key, target, prefix){
  if(!el) return;
  prefix = prefix || '₹';
  const known = key && Object.prototype.hasOwnProperty.call(numberMemory, key);
  const from = known ? numberMemory[key] : 0;
  if(key) numberMemory[key] = target;
  if(!known && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion()){
    ScrollTrigger.create({ trigger: el, start:'top 92%', once:true, onEnter: ()=> tweenNumber(el, prefix, 0, target) });
  } else {
    tweenNumber(el, prefix, from, target);
  }
}

// One scoped GSAP context for the Split tab's scroll-reveal entrance.
// Using a context (revert on re-render) instead of a global ScrollTrigger
// kill means other screens' triggers are never touched by accident.
// This ONLY runs on a genuine tab switch (see isTabSwitchRender) — running
// it on every Firestore-triggered data refresh was what made the whole
// receipts list fade out/in (flicker) every time someone toggled an item.
let splitTabCtx = null;
function initSplitEntranceAnimations(){
  if(splitTabCtx){ splitTabCtx.revert(); splitTabCtx = null; }
  const receiptEls = document.querySelectorAll('.receipts .receipt');
  if(typeof gsap === 'undefined') return;
  const build = ()=>{
    if(typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion()){
      receiptEls.forEach(el=>{
        gsap.fromTo(el, {opacity:0, y:32}, {opacity:1, y:0, duration:0.55, ease:'power3.out',
          scrollTrigger:{trigger:el, start:'top 90%', toggleActions:'play none none reverse'}});
      });
    } else {
      gsap.set(receiptEls, {opacity:1, y:0});
    }
  };
  if(typeof gsap.context === 'function'){ splitTabCtx = gsap.context(build); } else { build(); }
}

// Updates every total/subtotal number on the Split tab, tweening from its
// previously-remembered value to the new one. This runs on EVERY render
// (data refresh or tab switch alike) — smoothly animating a changed total
// is the intended feature (see tweenNumber/numberMemory), it's just the
// entrance fade above that needed to stop replaying on every data tick.
function updateSplitAmounts(){
  const amountEls = document.querySelectorAll('[data-final],[data-final-head]');
  if(typeof gsap === 'undefined'){
    amountEls.forEach(el=>{ const t=parseFloat(el.dataset.final ?? el.dataset.finalHead)||0; el.textContent='₹'+fmt(t); if(el.dataset.key) numberMemory[el.dataset.key]=t; });
    return;
  }
  amountEls.forEach(el=>{
    const target = parseFloat(el.dataset.final ?? el.dataset.finalHead)||0;
    animateAmount(el, el.dataset.key, target);
  });
}

// A brief collapse-and-fade for a row about to be deleted (item, charge,
// discount), used right before the Firestore delete that would otherwise
// make it vanish abruptly on the next re-render. Resolves immediately if
// there's nothing to animate (no GSAP, reduced motion, or no element) so
// the calling delete function always proceeds either way.
function collapseRow(row){
  return new Promise(resolve=>{
    if(!row || typeof gsap === 'undefined' || prefersReducedMotion()){ resolve(); return; }
    gsap.to(row, {
      opacity:0, height:0, marginBottom:0, paddingTop:0, paddingBottom:0,
      duration:0.26, ease:'power2.in', overflow:'hidden',
      onComplete:resolve
    });
  });
}

// shared-item avatar stack — a quick, tactile "pop" that communicates the
// cost just got divided, without a full-row re-animation.
function animateSharedSummaries(){
  document.querySelectorAll('.shared-summary').forEach(box=>{
    const avatars = box.querySelectorAll('.shared-avatars .avatar');
    if(!avatars.length || typeof gsap === 'undefined' || prefersReducedMotion()) return;
    gsap.fromTo(avatars, {scale:0, opacity:0}, {scale:1, opacity:1, duration:0.32, stagger:0.05, ease:'back.out(2.2)'});
  });
}

// Charges tab's live receipt-total preview — numbers animate from their
// previous value immediately (no scroll-gating needed, the card is always
// on-screen when the tab is open).
function animateCalcPreview(){
  document.querySelectorAll('.calc-preview [data-key]').forEach(el=>{
    const target = parseFloat(el.dataset.amt)||0;
    const prefix = el.dataset.prefix || '₹';
    const key = el.dataset.key;
    const known = Object.prototype.hasOwnProperty.call(numberMemory, key);
    const from = known ? numberMemory[key] : 0;
    numberMemory[key] = target;
    tweenNumber(el, prefix, from, target, 0.5);
  });
}
