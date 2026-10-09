/* ---------- CHARGES TAB (+ discounts) ----------
   Editing a charge/discount used to write straight to Firestore on every
   field's onchange — no explicit edit state, no confirmation step. That
   meant even finishing one field triggered a full Firestore round trip and
   re-render while the row might still be mid-edit. This now mirrors the
   Items tab's edit pattern: tap ✏️ to open a row for editing, make changes
   locally (chargeDraft/discountDraft — no writes yet), then tap Done to
   commit everything in a single write, or Cancel to discard. */
function renderChargesTab(){
  const charges = bill.charges || {};
  const discounts = bill.discounts || {};
  const chargeEntries = Object.entries(charges);
  const discountEntries = Object.entries(discounts);
  const esc = (s) => String(s ?? '').replace(/"/g,'&quot;');

  const splitToggle = (kind, id, method) => `
    <button type="button" class="split-toggle ${method==='equal'?'equal':''}" aria-pressed="${method==='equal'}" aria-label="Split ${method==='equal'?'equally':'by items'} — tap to switch" onclick="setSplitMethod('${kind}','${id}','${method==='equal'?'proportional':'equal'}')">
      ${method==='equal' ? 'EQUALLY' : 'BY ITEMS'}
    </button>`;

  const chargeRow = (cid, c) => {
    if(editingChargeId === cid && chargeDraft){
      return `
      <div class="charge-row">
        <div class="edit-row" style="flex:1 1 220px;">
          <input type="text" id="editChargeLabel-${cid}" value="${esc(chargeDraft.label)}" aria-label="Charge label" oninput="chargeDraft.label=this.value">
          <input type="number" id="editChargeValue-${cid}" value="${chargeDraft.value}" min="0" step="0.01" aria-label="Charge amount" oninput="chargeDraft.value=this.value">
        </div>
        <div class="toggle-type">
          <button type="button" class="${chargeDraft.type==='percent'?'active':''}" aria-label="Percent" aria-pressed="${chargeDraft.type==='percent'}" onclick="setEditChargeType('${cid}','percent')">%</button>
          <button type="button" class="${chargeDraft.type==='flat'?'active':''}" aria-label="Flat amount" aria-pressed="${chargeDraft.type==='flat'}" onclick="setEditChargeType('${cid}','flat')">₹</button>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn-small" onclick="saveEditCharge('${cid}')">Done</button>
          <button class="btn-small outline" onclick="cancelEditCharge()">Cancel</button>
        </div>
      </div>`;
    }
    return `
      <div class="charge-row">
        <span class="item-name" style="flex:1 1 160px;font-size:14px;">${esc(c.label)}</span>
        <span class="item-price">${c.type==='percent' ? esc(c.value)+'%' : '₹'+fmt(c.value)}</span>
        ${splitToggle('charges', cid, c.splitMethod || 'proportional')}
        <div class="item-actions">
          <button class="icon-btn" aria-label="Edit ${esc(c.label)}" title="Edit" onclick="startEditCharge('${cid}')">✏️</button>
          <button class="remove-item" aria-label="Remove ${esc(c.label)}" onclick="removeCharge(this,'${cid}')">✕</button>
        </div>
      </div>`;
  };

  const discountRow = (did, d) => {
    if(editingDiscountId === did && discountDraft){
      return `
      <div class="charge-row">
        <div class="edit-row" style="flex:1 1 220px;">
          <input type="text" id="editDiscountLabel-${did}" value="${esc(discountDraft.label)}" aria-label="Discount label" oninput="discountDraft.label=this.value">
          <input type="number" id="editDiscountValue-${did}" value="${discountDraft.value}" min="0" step="0.01" aria-label="Discount amount" oninput="discountDraft.value=this.value">
        </div>
        <div class="toggle-type">
          <button type="button" class="${discountDraft.type==='percent'?'active':''}" aria-label="Percent" aria-pressed="${discountDraft.type==='percent'}" onclick="setEditDiscountType('${did}','percent')">%</button>
          <button type="button" class="${discountDraft.type==='flat'?'active':''}" aria-label="Flat amount" aria-pressed="${discountDraft.type==='flat'}" onclick="setEditDiscountType('${did}','flat')">₹</button>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn-small" onclick="saveEditDiscount('${did}')">Done</button>
          <button class="btn-small outline" onclick="cancelEditDiscount()">Cancel</button>
        </div>
      </div>`;
    }
    return `
      <div class="charge-row">
        <span class="item-name" style="flex:1 1 160px;font-size:14px;">${esc(d.label)}</span>
        <span class="item-price">${d.type==='percent' ? esc(d.value)+'%' : '₹'+fmt(d.value)}</span>
        ${splitToggle('discounts', did, d.splitMethod || 'proportional')}
        <div class="item-actions">
          <button class="icon-btn" aria-label="Edit ${esc(d.label)}" title="Edit" onclick="startEditDiscount('${did}')">✏️</button>
          <button class="remove-item" aria-label="Remove ${esc(d.label)}" onclick="removeDiscount(this,'${did}')">✕</button>
        </div>
      </div>`;
  };

  document.getElementById('tabContent').innerHTML = `
    <div class="card">
      <h2>Taxes & other charges</h2>
      <p class="sub">Split "by items" (based on how much each person ordered) or "equally" across everyone — tap the label on any row to switch. Tap ✏️ to edit a charge.</p>
      <div class="preset-row">
        <button class="btn-small" onclick="addPreset('GST','percent',5)">+ GST 5%</button>
        <button class="btn-small" onclick="addPreset('Service Charge','percent',10)">+ Service charge 10%</button>
        <button class="btn-small" onclick="addPreset('Delivery Fee','flat',0)">+ Delivery fee</button>
      </div>
      <div id="chargesList">
        ${chargeEntries.length===0 ? `
          <div class="people-empty">
            <div class="big-icon">🧾</div>
            <p>No taxes or charges yet — add GST, service charge, or delivery fee above.</p>
          </div>` : chargeEntries.map(([cid,c])=>chargeRow(cid,c)).join('')}
      </div>
      <div class="add-row" style="margin-top:14px;">
        <input type="text" id="chargeName" placeholder="Charge name" aria-label="Charge name">
        <button class="btn-primary" onclick="addCharge()">Add charge</button>
      </div>
    </div>

    <div class="card">
      <h2>Discount</h2>
      <p class="sub">A flat amount or percentage off, split "by items" or "equally" — same toggle as charges above. Tap ✏️ to edit a discount.</p>
      <div class="preset-row">
        <button class="btn-small" onclick="addDiscountPreset('10% off','percent',10)">− 10% off</button>
        <button class="btn-small" onclick="addDiscountPreset('Flat discount','flat',100)">− ₹100 off</button>
      </div>
      <div id="discountsList">
        ${discountEntries.length===0 ? `
          <div class="people-empty">
            <div class="big-icon">🏷️</div>
            <p>No discount applied — add one above if the bill has a deal or coupon.</p>
          </div>` : discountEntries.map(([did,d])=>discountRow(did,d)).join('')}
      </div>
      <div class="add-row" style="margin-top:14px;">
        <input type="text" id="discountName" placeholder="Discount name" aria-label="Discount name">
        <button class="btn-primary" onclick="addDiscount()">Add discount</button>
      </div>
    </div>

    ${(() => {
      // read-only preview of where the bill stands right now — reuses calculate()
      // exactly as the Split tab does; adds no new state, just makes the math visible here too.
      const items = bill.items || {};
      if(Object.keys(items).length===0) return '';
      const {billSubtotal, billCharges, billDiscount, billTotal} = calculate();
      const grand = billTotal;
      return `
      <div class="card">
        <h2>Receipt total</h2>
        <p class="sub">This is the bill total before it's divided up on the Split tab.</p>
        <div class="calc-preview">
          <div class="calc-line"><span>Subtotal</span><span data-key="calc-subtotal" data-amt="${billSubtotal}">₹0.00</span></div>
          ${billCharges>0 ? `<div class="calc-line"><span>Taxes & charges</span><span data-key="calc-charges" data-amt="${billCharges}">₹0.00</span></div>` : ''}
          ${billDiscount>0 ? `<div class="calc-line discount"><span>Discount</span><span data-key="calc-discount" data-amt="${billDiscount}" data-prefix="−₹">−₹0.00</span></div>` : ''}
          <div class="calc-div"></div>
          <div class="calc-total"><span>Total</span><span data-key="calc-total" data-amt="${grand}">₹0.00</span></div>
        </div>
      </div>`;
    })()}`;

  // The row-entrance fade only replays on a genuine tab switch — not on
  // every Firestore refresh from adding/editing/removing a charge or
  // discount, which was previously re-fading the whole list each time.
  if(isTabSwitchRender){
    animateOnce('#chargesList .charge-row, #discountsList .charge-row');
    transitionScreen('#tabContent');
  }
  // The receipt-total preview's numbers always tween smoothly — that's the
  // intended animated-value feature, independent of the entrance fade above.
  animateCalcPreview();
}

async function addPreset(label,type,value){
  await safeUpdate({[`charges.${newId()}`]: {label,type,value,splitMethod:'proportional'}});
}
async function addCharge(){
  const name = document.getElementById('chargeName').value.trim();
  if(!name) return;
  await safeUpdate({[`charges.${newId()}`]: {label:name, type:'flat', value:0, splitMethod:'proportional'}});
}
async function removeCharge(btn, cid){
  if(editingChargeId === cid){ editingChargeId = null; chargeDraft = null; }
  await collapseRow(btn && btn.closest('.charge-row'));
  await safeUpdate({[`charges.${cid}`]: firebase.firestore.FieldValue.delete()});
}

/* ---------- charge editing: open with ✏️, commit with Done, discard with Cancel ---------- */
let chargeDraft = null; // {label, type, value} — local, uncommitted edits for the open charge row
function startEditCharge(cid){
  const c = (bill.charges || {})[cid];
  if(!c) return;
  editingChargeId = cid;
  chargeDraft = {label:c.label, type:c.type, value:c.value};
  preserveScroll(renderChargesTab);
}
function cancelEditCharge(){
  editingChargeId = null;
  chargeDraft = null;
  preserveScroll(renderChargesTab);
}
function setEditChargeType(cid, type){
  if(!chargeDraft) return;
  chargeDraft.type = type;
  preserveScroll(renderChargesTab);
}
async function saveEditCharge(cid){
  // Guard against the row having been removed (e.g. by someone else) while
  // this device still had it open for editing.
  if(!(bill.charges || {})[cid]){ editingChargeId = null; chargeDraft = null; render(); return; }
  const labelEl = document.getElementById(`editChargeLabel-${cid}`);
  const valueEl = document.getElementById(`editChargeValue-${cid}`);
  const label = labelEl.value.trim();
  const value = parseFloat(valueEl.value);
  labelEl.classList.toggle('input-error', !label);
  valueEl.classList.toggle('input-error', isNaN(value) || value < 0);
  if(!label || isNaN(value) || value < 0) return;
  const type = chargeDraft.type;
  editingChargeId = null;
  chargeDraft = null;
  // One single write commits label + type + value together — Done never
  // creates a new entry, it always updates this existing charge's fields.
  await safeUpdate({
    [`charges.${cid}.label`]: label,
    [`charges.${cid}.type`]: type,
    [`charges.${cid}.value`]: value
  });
}

/* ---------- discounts (mirror of charges, subtracted instead of added) ---------- */
async function addDiscountPreset(label,type,value){
  await safeUpdate({[`discounts.${newId()}`]: {label,type,value,splitMethod:'proportional'}});
}
async function addDiscount(){
  const name = document.getElementById('discountName').value.trim();
  if(!name) return;
  await safeUpdate({[`discounts.${newId()}`]: {label:name, type:'flat', value:0, splitMethod:'proportional'}});
}
async function removeDiscount(btn, did){
  if(editingDiscountId === did){ editingDiscountId = null; discountDraft = null; }
  await collapseRow(btn && btn.closest('.charge-row'));
  await safeUpdate({[`discounts.${did}`]: firebase.firestore.FieldValue.delete()});
}

/* ---------- discount editing: same Done/Cancel pattern as charges ---------- */
let discountDraft = null; // {label, type, value} — local, uncommitted edits for the open discount row
function startEditDiscount(did){
  const d = (bill.discounts || {})[did];
  if(!d) return;
  editingDiscountId = did;
  discountDraft = {label:d.label, type:d.type, value:d.value};
  preserveScroll(renderChargesTab);
}
function cancelEditDiscount(){
  editingDiscountId = null;
  discountDraft = null;
  preserveScroll(renderChargesTab);
}
function setEditDiscountType(did, type){
  if(!discountDraft) return;
  discountDraft.type = type;
  preserveScroll(renderChargesTab);
}
async function saveEditDiscount(did){
  if(!(bill.discounts || {})[did]){ editingDiscountId = null; discountDraft = null; render(); return; }
  const labelEl = document.getElementById(`editDiscountLabel-${did}`);
  const valueEl = document.getElementById(`editDiscountValue-${did}`);
  const label = labelEl.value.trim();
  const value = parseFloat(valueEl.value);
  labelEl.classList.toggle('input-error', !label);
  valueEl.classList.toggle('input-error', isNaN(value) || value < 0);
  if(!label || isNaN(value) || value < 0) return;
  const type = discountDraft.type;
  editingDiscountId = null;
  discountDraft = null;
  await safeUpdate({
    [`discounts.${did}.label`]: label,
    [`discounts.${did}.type`]: type,
    [`discounts.${did}.value`]: value
  });
}

/* ---------- shared: flip a charge or discount between "by items" and "equally" ---------- */
async function setSplitMethod(kind, id, method){
  await safeUpdate({[`${kind}.${id}.splitMethod`]: method});
}
