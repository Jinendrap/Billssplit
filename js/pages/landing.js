/* ---------- LANDING (no bill yet) ----------
   This is the only cinematic/scroll-driven screen in the app. It renders once
   per page load (starting a bill or opening a link is a full navigation, see
   startNewBill/goHome), so its ScrollTrigger instances never need to coexist
   with — or be cleaned up against — the working app's own render() calls. */
function renderLanding(){
  document.body.classList.add('landing-mode');
  document.getElementById('content').innerHTML = `
    <section class="hero-cinematic">
      <div class="hero-drop hero-drop-1"></div>
      <div class="hero-drop hero-drop-2"></div>
      <div class="hero-drop hero-drop-3"></div>

      <div class="hero-grid">
        <div class="hero-copy">
          <p class="hero-eyebrow">One receipt, everyone's share</p>
          <h1 class="hero-headline">
            <span class="line line-messy"><span>Bills are messy.</span></span>
            <span class="line line-clean"><span>Splitting them <em>shouldn't be</em>.</span></span>
          </h1>
          <p class="hero-sub">Snap the receipt, share one link, and everyone checks off exactly what they had. BillSplit works out who owes what — down to the tax.</p>
          <div class="cta-wrap">
            <div class="cta-glow"></div>
            <button class="btn-primary btn-hero" style="position:relative;" onclick="startNewBill(this)">Start a new bill</button>
          </div>
          <p class="scroll-hint" onclick="document.querySelector('.story-flow').scrollIntoView({behavior:'smooth'})">See how it works ↓</p>
        </div>

        <div class="hero-receipt-wrap">
          <div class="receipt-hero">
            <div class="rh-brand">TRATTORIA LUNA</div>
            <div class="rh-sub">Table 4 · 8:42 PM</div>
            <div class="rh-line"><span>Margherita Pizza</span><span>₹450.00</span></div>
            <div class="rh-line"><span>Truffle Fries</span><span>₹320.00</span></div>
            <div class="rh-line"><span>Iced Latte ×2</span><span>₹240.00</span></div>
            <div class="rh-line"><span>Tiramisu</span><span>₹280.00</span></div>
            <div class="rh-div"></div>
            <div class="rh-line"><span>Subtotal</span><span>₹1,290.00</span></div>
            <div class="rh-line"><span>GST + Service</span><span>₹193.50</span></div>
            <div class="rh-div"></div>
            <div class="rh-total"><span>Total</span><span>₹1,483.50</span></div>
            <div class="rh-stamp">SPLIT</div>
          </div>
        </div>
      </div>
    </section>

    <section class="story-flow">
      <div class="story-step">
        <span class="story-num">01</span>
        <div class="story-body">
          <h3>Upload the bill</h3>
          <p>Snap a photo of the receipt right on your phone — nothing gets typed, nothing gets uploaded anywhere.</p>
          <div class="story-visual">
            <div class="sv-receipt">
              <div>Margherita Pizza&nbsp;&nbsp;₹450</div>
              <div>Truffle Fries&nbsp;&nbsp;₹320</div>
              <div>Iced Latte ×2&nbsp;&nbsp;₹240</div>
            </div>
          </div>
        </div>
      </div>

      <div class="story-step">
        <span class="story-num">02</span>
        <div class="story-body">
          <h3>BillSplit reads the items</h3>
          <p>Each line becomes its own item — name and price, ready to check over and correct if needed.</p>
          <div class="story-visual">
            <span class="sv-chip">Margherita Pizza · ₹450</span>
            <span class="sv-chip">Truffle Fries · ₹320</span>
            <span class="sv-chip">Tiramisu · ₹280</span>
          </div>
        </div>
      </div>

      <div class="story-step">
        <span class="story-num">03</span>
        <div class="story-body">
          <h3>People join</h3>
          <p>Share one link. Everyone who opens it adds their name — no accounts, no app to install.</p>
          <div class="story-visual">
            <span class="sv-chip"><span class="dot" style="background:#173226"></span>Asha</span>
            <span class="sv-chip"><span class="dot" style="background:#B4552F"></span>Rohan</span>
            <span class="sv-chip"><span class="dot" style="background:#8A6D3B"></span>Imp</span>
          </div>
        </div>
      </div>

      <div class="story-step">
        <span class="story-num">04</span>
        <div class="story-body">
          <h3>Everyone taps what they had</h3>
          <p>Shared dishes just get multiple taps — BillSplit divides them evenly, automatically.</p>
          <div class="story-visual">
            <span class="sv-chip">Truffle Fries</span>
            <span class="sv-link"><span class="dash"></span></span>
            <span class="sv-chip"><span class="dot" style="background:#173226"></span>Asha</span>
            <span class="sv-chip"><span class="dot" style="background:#B4552F"></span>Rohan</span>
          </div>
        </div>
      </div>

      <div class="story-step">
        <span class="story-num">05</span>
        <div class="story-body">
          <h3>Final amounts, instantly</h3>
          <p>Taxes and charges get allocated fairly. Everyone sees exactly what they owe — live, on their own phone.</p>
          <div class="story-visual">
            <span class="sv-total" data-count-target="494.50"><span class="cur">₹</span>0.00</span>
          </div>
        </div>
      </div>
    </section>

    <section class="final-cta">
      <p class="hero-eyebrow">Ready to split?</p>
      <h2>Start a new bill<span class="arrow">→</span></h2>
      <div class="cta-wrap">
        <div class="cta-glow"></div>
        <button class="btn-primary btn-hero" style="position:relative;" onclick="startNewBill(this)">Start a new bill</button>
      </div>
    </section>`;
  initLandingAnimations();
}

/* ---------- landing motion: one orchestrated entrance + a scroll-driven narrative ---------- */
function initLandingAnimations(){
  if(typeof gsap === 'undefined'){
    // no-JS-animation fallback: just fill in the count-up target so the number isn't stuck at 0
    document.querySelectorAll('.sv-total[data-count-target]').forEach(el=>{
      el.innerHTML = '<span class="cur">₹</span>' + fmt(parseFloat(el.dataset.countTarget));
    });
    return;
  }
  if(typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  const reduced = prefersReducedMotion();

  // hero entrance — a single orchestrated sequence, not scattered fades
  const tl = gsap.timeline({defaults:{ease:'power3.out'}});
  if(reduced){
    tl.set(['.hero-eyebrow','.hero-headline .line span','.receipt-hero','.hero-sub','.hero-cinematic .cta-wrap','.scroll-hint'], {opacity:1, y:0, yPercent:0, scale:1});
  } else {
    tl.fromTo('.hero-eyebrow', {opacity:0, y:10}, {opacity:1, y:0, duration:0.5})
      .fromTo('.hero-headline .line span', {yPercent:110}, {yPercent:0, duration:0.7, stagger:0.08}, '-=0.2')
      .fromTo('.receipt-hero', {opacity:0, y:26, rotate:-2.5, scale:0.96}, {opacity:1, y:0, rotate:-2.5, scale:1, duration:0.65}, '-=0.5')
      .fromTo('.hero-sub', {opacity:0, y:10}, {opacity:1, y:0, duration:0.5}, '-=0.35')
      .fromTo('.hero-cinematic .cta-wrap', {opacity:0, y:10}, {opacity:1, y:0, duration:0.45}, '-=0.3')
      .fromTo('.scroll-hint', {opacity:0}, {opacity:1, duration:0.4}, '-=0.15');
  }

  // gentle parallax drift on the hero receipt as the page scrolls — a single subtle touch, not constant motion
  if(typeof ScrollTrigger !== 'undefined' && !reduced){
    gsap.to('.receipt-hero', {
      y: -30, ease:'none',
      scrollTrigger:{trigger:'.hero-cinematic', start:'top top', end:'bottom top', scrub:0.6}
    });
  }

  // very restrained pointer-reactive tilt on the hero receipt — desktop/precise-pointer only,
  // a single quickTo interpolator (cheap: no rAF loop runs while the pointer is still)
  if(!reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    const hero = document.querySelector('.hero-cinematic');
    const receipt = document.querySelector('.receipt-hero');
    if(hero && receipt){
      const rotY = gsap.quickTo(receipt, 'rotationY', {duration:0.5, ease:'power3.out'});
      const rotX = gsap.quickTo(receipt, 'rotationX', {duration:0.5, ease:'power3.out'});
      hero.addEventListener('pointermove', e=>{
        const r = hero.getBoundingClientRect();
        rotY(((e.clientX - r.left)/r.width - 0.5) * 8);
        rotX(-((e.clientY - r.top)/r.height - 0.5) * 8);
      });
      hero.addEventListener('pointerleave', ()=>{ rotY(0); rotX(0); });
    }
  }

  if(typeof ScrollTrigger === 'undefined') return;

  // story steps reveal one at a time as they enter view
  gsap.utils.toArray('.story-step').forEach(step=>{
    gsap.fromTo(step, {opacity: reduced?1:0, y: reduced?0:34}, {
      opacity:1, y:0, duration:0.6, ease:'power3.out',
      scrollTrigger:{trigger:step, start:'top 82%', toggleActions:'play none none reverse'}
    });
    gsap.fromTo(step.querySelectorAll('.story-visual > *'), {opacity: reduced?1:0, y: reduced?0:10}, {
      opacity:1, y:0, duration:0.4, stagger:0.08, ease:'power2.out',
      scrollTrigger:{trigger:step, start:'top 75%', toggleActions:'play none none reverse'}
    });
  });

  // the demo total counts up once its step is in view
  document.querySelectorAll('.sv-total[data-count-target]').forEach(el=>{
    const target = parseFloat(el.dataset.countTarget) || 0;
    const curEl = el.querySelector('.cur');
    const curHtml = curEl ? curEl.outerHTML : '<span class="cur">₹</span>';
    ScrollTrigger.create({
      trigger: el, start:'top 85%', once:true,
      onEnter: ()=> tweenNumber(el, '', 0, target, 0.9, val=>{ el.innerHTML = curHtml + fmt(val); })
    });
  });

  // final CTA
  gsap.fromTo('.final-cta > *', {opacity: reduced?1:0, y: reduced?0:24}, {
    opacity:1, y:0, duration:0.55, stagger:0.1, ease:'power3.out',
    scrollTrigger:{trigger:'.final-cta', start:'top 80%', toggleActions:'play none none reverse'}
  });
}

async function startNewBill(btn){
  if(btn){ btn.disabled = true; btn.dataset.originalText = btn.textContent; btn.textContent = 'Setting up your bill…'; }
  try{
    const id = newId();
    await db.collection('bills').doc(id).set({
      people:{}, items:{}, charges:{}, discounts:{}, createdAt: Date.now()
    });
    const url = new URL(window.location.href);
    url.searchParams.set('bill', id);
    window.location.href = url.toString();
  }catch(err){
    console.error('BillSplit: failed to create bill', err);
    showToast("Couldn't start a new bill — check your connection and try again.", 'error');
    if(btn){ btn.disabled = false; btn.textContent = btn.dataset.originalText || 'Start a new bill'; }
  }
}
