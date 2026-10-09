/* ---------- calculation ---------- */
// Distributes `amountTotal` for a single charge/discount across people, either
// proportional to each person's share of the item subtotal ('proportional',
// the default — matches "split by items"), or split flat-equal across
// everyone on the bill ('equal').
function distribute(amountTotal, splitMethod, people, subtotals, billSubtotal){
  const pids = Object.keys(people);
  const out = {};
  if(splitMethod === 'equal'){
    const each = pids.length ? amountTotal / pids.length : 0;
    pids.forEach(pid=>{ out[pid] = each; });
  } else {
    pids.forEach(pid=>{
      const proportion = billSubtotal>0 ? (subtotals[pid]/billSubtotal) : (pids.length ? 1/pids.length : 0);
      out[pid] = amountTotal*proportion;
    });
  }
  return out;
}

function calculate(){
  const people = bill.people || {};
  const items = bill.items || {};
  const charges = bill.charges || {};
  const discounts = bill.discounts || {};
  const subtotals = {}; Object.keys(people).forEach(pid=>subtotals[pid]=0);
  // billSubtotal: the ENTIRE bill — every item, whether or not anyone has
  // claimed it yet. This is what "Bill subtotal" should always display, and
  // it's the base that percentage taxes/charges (which apply to the whole
  // order, not just the items someone happens to have picked so far) are
  // computed from.
  // assignedSubtotal: only items at least one person has claimed — the pool
  // that charges/discounts get proportionally divided across, unchanged
  // from before. An item nobody's claimed yet still shows up in the bill
  // total, it just can't be shared out to a person until someone claims it.
  let billSubtotal = 0;
  let assignedSubtotal = 0;

  Object.values(items).forEach(item=>{
    billSubtotal += item.price;
    const sharedWith = Object.keys(item.sharedWith||{});
    if(sharedWith.length===0) return;
    assignedSubtotal += item.price;
    const share = item.price / sharedWith.length;
    sharedWith.forEach(pid=>{ if(subtotals[pid]!==undefined) subtotals[pid]+=share; });
  });

  const chargeTotals = {}; Object.keys(people).forEach(pid=>chargeTotals[pid]={});
  const billChargeBreakdown = {}; // per-charge bill-level total, e.g. {"GST": 64.5} — for the Bill Totals panel
  let billCharges = 0;
  Object.values(charges).forEach(charge=>{
    const amountTotal = charge.type==='percent' ? billSubtotal*(charge.value/100) : charge.value;
    billCharges += amountTotal;
    billChargeBreakdown[charge.label] = amountTotal;
    const shares = distribute(amountTotal, charge.splitMethod || 'proportional', people, subtotals, assignedSubtotal);
    Object.keys(people).forEach(pid=>{ chargeTotals[pid][charge.label] = shares[pid] || 0; });
  });

  const discountTotals = {}; Object.keys(people).forEach(pid=>discountTotals[pid]={});
  const billDiscountBreakdown = {};
  let billDiscount = 0;
  Object.values(discounts).forEach(discount=>{
    const amountTotal = discount.type==='percent' ? billSubtotal*(discount.value/100) : discount.value;
    billDiscount += amountTotal;
    billDiscountBreakdown[discount.label] = amountTotal;
    const shares = distribute(amountTotal, discount.splitMethod || 'proportional', people, subtotals, assignedSubtotal);
    Object.keys(people).forEach(pid=>{ discountTotals[pid][discount.label] = shares[pid] || 0; });
  });

  const finals = {};
  Object.keys(people).forEach(pid=>{
    const chargeSum = Object.values(chargeTotals[pid]).reduce((a,b)=>a+b,0);
    const discountSum = Object.values(discountTotals[pid]).reduce((a,b)=>a+b,0);
    finals[pid] = subtotals[pid]+chargeSum-discountSum;
  });

  // billTotal: the full bill's own bottom line — subtotal + every charge -
  // every discount, independent of who's claimed what so far. This is what
  // "Total bill" should show; it is NOT the same number as summing
  // participants' `finals` when items are still unclaimed.
  const billTotal = billSubtotal + billCharges - billDiscount;

  return {subtotals, chargeTotals, discountTotals, finals, billSubtotal, billCharges, billDiscount, billTotal, billChargeBreakdown, billDiscountBreakdown};
}
