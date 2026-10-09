/* ---------- SPLIT TAB ---------- */
function renderSplitTab(){
  const people = bill.people || {};
  const items = bill.items || {};
  const charges = bill.charges || {};
  const discounts = bill.discounts || {};

  if(Object.keys(people).length===0 || Object.keys(items).length===0){
    document.getElementById('tabContent').innerHTML = `
      <div class="card">
        <div class="people-empty">
          <div class="big-icon">🧮</div>
          <p>Add people and items first — the split appears here the moment both exist.</p>
        </div>
      </div>`;
    return;
  }
  const {subtotals, chargeTotals, discountTotals, finals, billSubtotal, billDiscount, billTotal, billChargeBreakdown, billDiscountBreakdown} = calculate();
  const grandTotal = Object.values(finals).reduce((a,b)=>a+b,0);
  const sortedItems = Object.entries(items).sort((a,b)=>orderOf(a[0],a[1])-orderOf(b[0],b[1])).map(([iid,it])=>it);

  const receipts = Object.entries(people).sort((a,b)=>orderOf(a[0],a[1])-orderOf(b[0],b[1])).map(([pid,p])=>{
    const myItems = sortedItems.filter(it=>Object.keys(it.sharedWith||{}).includes(pid));
    const itemLines = myItems.map(it=>{
      const n = Object.keys(it.sharedWith||{}).length;
      const share = it.price/n;
      const label = n>1 ? `${it.name} (split ${n}-way)` : it.name;
      return `<div class="rline"><span>${label}</span><span class="dots"></span><span class="amt">₹${fmt(share)}</span></div>`;
    }).join('');
    const chargeLines = Object.values(charges).map(c=>{
      const val = chargeTotals[pid][c.label]||0;
      if(val===0) return '';
      return `<div class="rline"><span>${c.label}</span><span class="dots"></span><span class="amt">₹${fmt(val)}</span></div>`;
    }).join('');
    const discountLines = Object.values(discounts).map(d=>{
      const val = discountTotals[pid][d.label]||0;
      if(val===0) return '';
      return `<div class="rline" style="color:var(--pine);"><span>${d.label}</span><span class="dots"></span><span class="amt" style="color:var(--pine);">−₹${fmt(val)}</span></div>`;
    }).join('');
    return `
    <div class="receipt">
      <div class="receipt-head">
        <div class="receipt-head-id"><span class="avatar" style="background:${p.color}">${initials(p.name)}</span><span class="name">${p.name}</span></div>
        <span class="head-total" data-final-head="${finals[pid]}" data-key="split-head-${pid}">₹0.00</span>
      </div>
      ${itemLines || '<div class="rline"><span>No items selected</span></div>'}
      <div class="rdiv"></div>
      <div class="rline"><span>Subtotal</span><span class="dots"></span><span class="amt">₹${fmt(subtotals[pid])}</span></div>
      ${chargeLines}
      ${discountLines}
      <div class="rdiv"></div>
      <div class="rtotal"><span>Total due</span><span class="amt" data-final="${finals[pid]}" data-key="split-total-${pid}">₹0.00</span></div>
    </div>`;
  }).join('');

  document.getElementById('tabContent').innerHTML = `
    <div class="card">
      <h2>The split</h2>
      <p class="sub">Updates live as everyone checks off their items.${billDiscount>0 ? ' Discount applied.' : ''}</p>
      <p class="section-label">YOUR SHARE</p>
      <div class="receipts">${receipts}</div>
    </div>

    <div class="card bill-totals-card">
      <p class="section-label">BILL TOTALS <span class="section-label-note">— the whole bill, everyone included</span></p>
      <div class="rline"><span>Subtotal</span><span class="dots"></span><span class="amt">₹${fmt(billSubtotal)}</span></div>
      ${Object.entries(billChargeBreakdown).map(([label,amt])=>`
        <div class="rline"><span>${label}</span><span class="dots"></span><span class="amt">₹${fmt(amt)}</span></div>`).join('')}
      ${Object.entries(billDiscountBreakdown).map(([label,amt])=>`
        <div class="rline" style="color:var(--pine);"><span>${label}</span><span class="dots"></span><span class="amt" style="color:var(--pine);">−₹${fmt(amt)}</span></div>`).join('')}
      <div class="rdiv"></div>
      <div class="rtotal"><span>Total bill</span><span class="amt" data-final="${billTotal}" data-key="split-bill-total">₹0.00</span></div>
    </div>

    <div class="grand-total-card">
      <p class="gt-label">EVERYONE'S TOTAL</p>
      <div class="gt-value" id="grandTotalNum" data-final="${grandTotal}" data-key="split-grand-total">₹0.00</div>
    </div>`;

  // The receipt-reveal entrance only plays on a genuine tab switch — a
  // Firestore refresh while already on this tab (e.g. someone else toggles
  // an item) should never re-fade the whole receipts list back in.
  if(isTabSwitchRender){
    initSplitEntranceAnimations();
    transitionScreen('#tabContent');
  }
  // Totals always tween smoothly from their previous value to the new one,
  // on every render — this is the intended animated-number feature and is
  // independent of the entrance fade above.
  updateSplitAmounts();
}
