/* ---------- ITEMS TAB ---------- */
function renderItemsTab(){
  const items = bill.items || {};
  const people = bill.people || {};
  const itemEntries = Object.entries(items).sort((a,b)=>orderOf(a[0],a[1])-orderOf(b[0],b[1]));

  document.getElementById('tabContent').innerHTML = `
    <div class="card">
      <h2>What's on the bill?</h2>
      <p class="sub">Add each item and its price below.</p>

      <div class="scan-box">
        <div class="scan-text">
          <b>📷 Scan a receipt</b>
          <span>Reads it right on your phone — nothing is uploaded anywhere</span>
        </div>
        <label id="scanFileBtn" class="file-btn" onpointerdown="prewarmOcr()">
          Choose photo
          <input type="file" accept="image/*" capture="environment" onchange="scanReceipt(event)">
        </label>
      </div>
      <div id="scanStatus" class="scan-status"></div>
      <div class="divider-or">or add manually</div>

      <div class="form-grid">
        <input type="text" id="itemName" placeholder="Item name" aria-label="Item name">
        <input type="number" id="itemPrice" placeholder="Price" min="0" step="0.01" aria-label="Price">
        <button class="btn-primary" onclick="addItem()">Add</button>
      </div>

      ${itemEntries.length>0 && Object.keys(people).length>0 ? `
      <button class="btn-ghost" style="width:100%;margin-bottom:16px;" onclick="splitAllWithEveryone()">🍽️ Split everything with everyone</button>
      ` : ''}

      <div id="itemsList">
        ${itemEntries.length===0 ? `
          <div class="people-empty">
            <div class="big-icon">🧾</div>
            <p>Nothing on the bill yet. Scan a receipt or add the first item above.</p>
          </div>
        ` : itemEntries.map(([iid,item])=>{
          const sharedWith = Object.keys(item.sharedWith||{});
          const chips = Object.entries(people).sort((a,b)=>orderOf(a[0],a[1])-orderOf(b[0],b[1])).map(([pid,p])=>{
            const sel = sharedWith.includes(pid);
            return `<button class="assign-chip ${sel?'selected':''}" onclick="claimItem(this,'${iid}','${pid}',${sel})">
              <span class="avatar" style="background:${p.color};width:16px;height:16px;font-size:9px;">${initials(p.name)}</span>${p.name}
            </button>`;
          }).join('');
          const warn = sharedWith.length===0 ? `<div class="warn">⚠ No one assigned yet — this item won't be counted.</div>` : '';

          // when 2+ people share an item, spell out the division instead of leaving it to small text
          const sharedSummary = sharedWith.length>1 ? `
            <div class="shared-summary">
              <div class="shared-avatars">
                ${sharedWith.map(pid=>{
                  const p = people[pid]; if(!p) return '';
                  return `<span class="avatar" style="background:${p.color}" title="${p.name}">${initials(p.name)}</span>`;
                }).join('')}
              </div>
              <span class="shared-text">Shared by ${sharedWith.length} people</span>
              <span class="shared-each">₹${fmt(item.price/sharedWith.length)} each</span>
            </div>` : '';

          if(editingItemId === iid){
            return `
            <div class="item-row">
              <div class="edit-row">
                <input type="text" id="editName-${iid}" value="${item.name.replace(/"/g,'&quot;')}">
                <input type="number" id="editPrice-${iid}" value="${item.price}" min="0" step="0.01">
              </div>
              <div style="display:flex;gap:8px;">
                <button class="btn-small" onclick="saveEditItem('${iid}')">Save</button>
                <button class="btn-small outline" onclick="cancelEditItem()">Cancel</button>
              </div>
            </div>`;
          }

          return `
          <div class="item-row">
            <div class="item-top">
              <span class="item-name">${item.name}</span>
              <div class="item-actions">
                <span class="item-price">₹${fmt(item.price)}</span>
                <button class="icon-btn" aria-label="Edit ${item.name.replace(/"/g,'&quot;')}" title="Edit" onclick="startEditItem('${iid}')">✏️</button>
                <button class="remove-item" aria-label="Remove ${item.name.replace(/"/g,'&quot;')}" onclick="removeItem(this,'${iid}')">✕</button>
              </div>
            </div>
            <div class="assign-label">Who had this?</div>
            <div class="assign-chips">
              ${chips}
              <button class="btn-small outline" onclick="assignAll('${iid}')">Split with all</button>
            </div>
            ${sharedSummary}
            ${warn}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  // Only replay the list entrance + shared-avatar pop on a genuine tab
  // switch. Firestore-triggered refreshes (someone claims/unclaims an item,
  // adds/edits/deletes one) rebuild #itemsList in place without re-fading
  // it — that fade-out/in on every toggle was the flicker.
  if(isTabSwitchRender){
    animateOnce('#itemsList .item-row');
    animateSharedSummaries();
    transitionScreen('#tabContent');
  }
}

function startEditItem(iid){ editingItemId = iid; preserveScroll(renderItemsTab); }
function cancelEditItem(){ editingItemId = null; preserveScroll(renderItemsTab); }
async function saveEditItem(iid){
  const nameEl = document.getElementById(`editName-${iid}`);
  const priceEl = document.getElementById(`editPrice-${iid}`);
  const name = nameEl.value.trim();
  const price = parseFloat(priceEl.value);
  nameEl.classList.toggle('input-error', !name);
  priceEl.classList.toggle('input-error', isNaN(price) || price < 0);
  if(!name || isNaN(price) || price < 0) return;
  editingItemId = null;
  await safeUpdate({
    [`items.${iid}.name`]: name,
    [`items.${iid}.price`]: price
  });
}

async function addItem(){
  const nameEl = document.getElementById('itemName');
  const priceEl = document.getElementById('itemPrice');
  const name = nameEl.value.trim();
  const price = parseFloat(priceEl.value);
  nameEl.classList.toggle('input-error', !name);
  priceEl.classList.toggle('input-error', isNaN(price) || price < 0);
  if(!name || isNaN(price) || price < 0) return;
  const iid = newId();
  await safeUpdate({
    [`items.${iid}`]: {name, price, sharedWith:{}, order: Date.now()}
  });
  // items list re-renders from the live snapshot in a moment, but clear the
  // inputs immediately so the form feels ready for the next item right away
  nameEl.value = ''; priceEl.value = ''; nameEl.classList.remove('input-error'); priceEl.classList.remove('input-error');
}
async function removeItem(btn, iid){
  // A quick collapse-and-fade before the Firestore round-trip resolves, so
  // deleting a row reads as a deliberate removal instead of an abrupt
  // disappearance on the next re-render.
  await collapseRow(btn && btn.closest('.item-row'));
  await safeUpdate({
    [`items.${iid}`]: firebase.firestore.FieldValue.delete()
  });
}
// A quick "claimed" pulse on the exact chip that was tapped, fired instantly
// (before the Firestore round-trip resolves) — cause and effect should feel
// immediate even though the real state change arrives a moment later via
// the snapshot listener and a full re-render.
function claimItem(btn, iid, pid, currentlySelected){
  if(btn && typeof gsap !== 'undefined' && !prefersReducedMotion()){
    gsap.fromTo(btn, {scale:1}, {scale:1.14, duration:0.12, ease:'power2.out', yoyo:true, repeat:1});
  }
  toggleAssign(iid, pid, currentlySelected);
}
async function toggleAssign(iid, pid, currentlySelected){
  const path = `items.${iid}.sharedWith.${pid}`;
  await safeUpdate({
    [path]: currentlySelected ? firebase.firestore.FieldValue.delete() : true
  });
}
async function assignAll(iid){
  const people = bill.people || {};
  const update = {};
  Object.keys(people).forEach(pid=>{ update[`items.${iid}.sharedWith.${pid}`] = true; });
  await safeUpdate(update);
}

async function splitAllWithEveryone(){
  const people = bill.people || {};
  const items = bill.items || {};
  const update = {};
  Object.keys(items).forEach(iid=>{
    Object.keys(people).forEach(pid=>{
      update[`items.${iid}.sharedWith.${pid}`] = true;
    });
  });
  await safeUpdate(update);
}

/* ---------- receipt scanning (runs entirely on-device via PaddleOCR — free, no account, no upload) ---------- */
function setScanStatus(msg, cls){
  const el = document.getElementById('scanStatus');
  if(!el) return;
  el.className = 'scan-status ' + (cls||'');
  el.innerHTML = msg;
}

// The OCR model is only downloaded once someone shows intent to scan — not on every page load.
// prewarmOcr() kicks this off the instant a finger touches "Choose photo", so the model downloads
// in the background while the camera opens and the person frames their shot — by the time they
// confirm a photo, the model is often already sitting in memory ready to go.
let ocrEnginePromise = null;
let ocrReady = false;
async function getOcrEngine(){
  if(!ocrEnginePromise){
    ocrEnginePromise = (async () => {
      const { PaddleOCR } = await import('https://cdn.jsdelivr.net/npm/@paddleocr/paddleocr-js/+esm');
      const engine = await PaddleOCR.create({ lang: 'en', ocrVersion: 'PP-OCRv5', ortOptions: { backend: 'auto' } });
      ocrReady = true;
      return engine;
    })();
  }
  return ocrEnginePromise;
}
function prewarmOcr(){
  getOcrEngine().catch(()=>{ ocrEnginePromise = null; }); // let a real scan attempt retry if the prewarm silently failed
}

// Shrinks huge phone photos to a manageable size before OCR — keeps on-device inference fast.
function loadImageToCanvas(file, maxDim=1800){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let {width, height} = img;
      if(width > height && width > maxDim){ height = Math.round(height*(maxDim/width)); width = maxDim; }
      else if(height > maxDim){ width = Math.round(width*(maxDim/height)); height = maxDim; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
    img.src = url;
  });
}

// Lines that are almost never a purchasable item, wherever they appear.
const JUNK_LINE_PATTERNS = [
  /^ph\s*:?\s*\d/i, /\bgst\b/i, /\bfssai\b/i, /\bbill\s*no\b/i, /\btable\b/i,
  /^dine\s*in$/i, /^takeaway$/i, /\bwaiter\b/i, /^w\s*:/i, /^t\s*:/i,
  /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/, /^\d{1,2}:\d{2}/, /^no\s*:/i,
  /thank\s*you/i, /visit\s*again/i, /^particulars?$/i, /^qty$/i, /^rate/i, /^amount$/i,
  /^grand\s*total/i, /^sub\s*total/i, /^total$/i, /invoice/i, /order\s*id/i
];
function looksLikeJunk(text){ return JUNK_LINE_PATTERNS.some(re => re.test(text.trim())); }

// A row is a horizontal band of OCR boxes that sit at roughly the same height —
// this recovers table rows/columns that a flat top-to-bottom text list would scramble.
function groupIntoRows(items){
  const withY = items.map(it => {
    const ys = it.poly.map(p => p[1]);
    const xs = it.poly.map(p => p[0]);
    return { text: it.text.trim(), score: it.score, yTop: Math.min(...ys), yBot: Math.max(...ys), xLeft: Math.min(...xs) };
  }).filter(it => it.text.length > 0);
  withY.sort((a,b)=> a.yTop - b.yTop);

  const rows = [];
  for(const box of withY){
    const boxMid = (box.yTop + box.yBot) / 2;
    const boxH = box.yBot - box.yTop;
    let row = rows.find(r => Math.abs(r.mid - boxMid) < Math.max(boxH, r.h) * 0.6);
    if(row){
      row.boxes.push(box);
      row.mid = (row.mid * row.boxes.length + boxMid) / (row.boxes.length + 1);
      row.h = Math.max(row.h, boxH);
    } else {
      rows.push({ mid: boxMid, h: boxH, boxes: [box] });
    }
  }
  return rows.map(r => {
    r.boxes.sort((a,b)=> a.xLeft - b.xLeft);
    return r.boxes;
  });
}

// Turns the raw, row-grouped OCR text into a best-guess item list. Multi-line names and
// numbers that landed on a separate row (both common on real receipts) get stitched together;
// anything before the column header or after "SubTotal", plus obvious junk, gets dropped.
function extractItemsFromRows(rows){
  const NUM_RE = /^\d+[.,]?\d*$/;
  const NUM_ONLY_RE = /^[\d.,]+$/;
  const NUM_TOKEN_RE = /\d+[.,]?\d*/g;

  let headerIdx = rows.findIndex(row => {
    const joined = row.map(b=>b.text).join(' ').toLowerCase();
    return /particular|item|description/.test(joined) && /qty|rate|amount|price/.test(joined);
  });
  let subtotalIdx = rows.findIndex(row => /sub\s*total/i.test(row.map(b=>b.text).join(' ')));
  if(subtotalIdx === -1) subtotalIdx = rows.length;
  const start = headerIdx === -1 ? 0 : headerIdx + 1;

  const items = [];
  let pendingName = [];

  for(let i = start; i < subtotalIdx; i++){
    const row = rows[i];
    const nameParts = [];
    const numbers = [];
    for(const box of row){
      const t = box.text.trim();
      if(!t || looksLikeJunk(t)) continue;
      if(NUM_RE.test(t.replace(',', '.'))){
        numbers.push(parseFloat(t.replace(',', '.')));
      } else if(NUM_ONLY_RE.test(t) && t.match(NUM_TOKEN_RE)?.length > 1){
        // OCR sometimes merges two adjacent numbers into one box with no space, e.g. "1.0449.0"
        t.match(NUM_TOKEN_RE).forEach(n => numbers.push(parseFloat(n.replace(',', '.'))));
      } else {
        nameParts.push(t); // includes "+1 X" style modifier lines as-is
      }
    }
    const rowName = nameParts.join(' ').trim();

    if(numbers.length === 0){
      if(rowName) pendingName.push(rowName);
      continue;
    }

    // Amount is almost always the largest number on the row (qty is a small multiplier).
    const price = Math.max(...numbers);
    let name = rowName;
    if(pendingName.length){ name = (pendingName.join(' ') + (name ? ' ' + name : '')).trim(); pendingName = []; }

    // Numbers with no name at all (name never arrived, e.g. a stray total-like row) get skipped.
    if(name && price > 0){
      items.push({ name, price });
    }
  }
  return items;
}

let scanInProgress = false;
async function scanReceipt(event){
  const file = event.target.files[0];
  if(!file) return;
  event.target.value = ''; // allow re-selecting the same file on a retry
  if(scanInProgress) return; // ignore a second photo picked while one is still processing
  scanInProgress = true;
  document.getElementById('scanFileBtn')?.classList.add('disabled');

  try{
    if(!ocrReady) setScanStatus('<span class="spinner"></span>Loading the on-device OCR model (first scan only)…', 'loading');
    else setScanStatus('<span class="spinner"></span>Reading your receipt…', 'loading');
    const [ocr, canvas] = await Promise.all([getOcrEngine(), loadImageToCanvas(file)]);

    setScanStatus('<span class="spinner"></span>Reading your receipt…', 'loading');
    const [result] = await ocr.predict(canvas);
    const rawItems = result.items || [];
    if(rawItems.length === 0){
      setScanStatus("Couldn't find any text in that photo — try a clearer, flatter, well-lit shot, or add items manually below.", 'error');
      return;
    }

    const rows = groupIntoRows(rawItems);
    const items = extractItemsFromRows(rows);

    if(items.length === 0){
      setScanStatus("Read the photo but couldn't confidently pick out item rows — try a clearer shot, or add items manually below.", 'error');
      return;
    }

    const baseOrder = Date.now();
    const update = {};
    items.forEach((it, idx)=>{ update[`items.${newId()}`] = {name: it.name, price: it.price, sharedWith:{}, order: baseOrder + idx}; });
    await safeUpdate(update);
    setScanStatus(`✓ Found ${items.length} item${items.length!==1?'s':''} on-device. Please check names and prices below — OCR can misread a character or split a row — then remove any junk lines before assigning.`, 'success');
  } catch(err){
    console.error('Receipt scan error:', err);
    setScanStatus(err.message || 'Something went wrong reading that photo.', 'error');
  } finally {
    scanInProgress = false;
    document.getElementById('scanFileBtn')?.classList.remove('disabled');
  }
}
