/* ---------- JOIN (bill exists, this device hasn't picked an identity) ---------- */
function renderJoin(){
  document.body.classList.remove('landing-mode');
  const existing = bill.people || {};
  const names = Object.entries(existing).sort((a,b)=>orderOf(a[0],a[1])-orderOf(b[0],b[1]));
  // A bill with nobody on it yet is one this device just created (startNewBill
  // redirects straight here) — that's a genuinely different moment than
  // opening someone else's shared link, so it gets its own wording instead
  // of the "Join this bill" copy meant for an existing, shared bill.
  const isNewBill = names.length === 0;
  document.getElementById('content').innerHTML = `
    <div class="card glass glass-strong">
      <h2>${isNewBill ? 'Start your bill' : 'Join this bill'}</h2>
      <p class="sub">${isNewBill ? "You're setting this one up — what should we call you?" : 'Are you already on this bill, or joining for the first time?'}</p>
      ${names.length ? `
        <div class="assign-label">Tap your name</div>
        <div class="chip-list" style="margin-bottom:18px;">
          ${names.map(([pid,p])=>`
            <button class="chip" style="cursor:pointer" onclick="claimIdentity('${pid}')">
              <span class="avatar" style="background:${p.color}">${initials(p.name)}</span>${p.name}
            </button>`).join('')}
        </div>
        <div class="divider-or">— or —</div>
      ` : ''}
      <div class="add-row">
        <input type="text" id="joinName" placeholder="${isNewBill ? 'Your name' : 'Type your name'}" aria-label="Your name" onkeydown="if(event.key==='Enter'){joinAsNew()}">
        <button class="btn-primary" id="joinBtn" onclick="joinAsNew()">${isNewBill ? "Let's go" : "I'm new here"}</button>
      </div>
    </div>`;
}

function claimIdentity(pid){
  myPersonId = pid;
  localStorage.setItem('billsplit_identity_' + billId, pid);
  render();
}

async function joinAsNew(){
  const input = document.getElementById('joinName');
  const btn = document.getElementById('joinBtn');
  const name = input.value.trim();
  if(!name){
    input.classList.add('input-error');
    input.placeholder = 'Type your name to continue';
    input.focus();
    if(typeof gsap !== 'undefined' && !prefersReducedMotion()){
      gsap.fromTo(input, {x:0}, {x:6, duration:0.06, repeat:3, yoyo:true, onComplete:()=>gsap.set(input,{x:0})});
    }
    return;
  }
  input.classList.remove('input-error');
  const count = Object.keys(bill.people || {}).length;
  const isNewBill = count === 0;
  if(btn){ btn.disabled = true; btn.textContent = isNewBill ? 'Setting up…' : 'Joining…'; }
  try{
    const pid = newId();
    await safeUpdate({
      [`people.${pid}`]: {name, color: colorFor(count), order: Date.now()}
    });
    claimIdentity(pid);
  }catch(err){
    // safeUpdate already surfaced a toast; just restore the button so they can retry
    if(btn){ btn.disabled = false; btn.textContent = isNewBill ? "Let's go" : "I'm new here"; }
  }
}
