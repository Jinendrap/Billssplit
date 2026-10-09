/* =========================================================================
   UTILS — small, pure, dependency-free helpers used across every module.
   ========================================================================= */
const COLORS = ["#1B4332","#B3261E","#5C594E","#8A6D3B","#3A5A80","#7A4E9E","#2E6F6E","#9E4E63"];
function colorFor(i){ return COLORS[i % COLORS.length]; }
function initials(name){ return name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function fmt(n){ return (Math.round((n||0)*100)/100).toFixed(2); }
function newId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

// Every id from newId() starts with an 8-character base36 timestamp. This recovers
// approximate creation order even for items that predate the explicit `order` field —
// so already-created bills get fixed too, not just new ones.
function orderOf(id, obj){
  if(typeof obj.order === 'number') return obj.order;
  const guess = parseInt(id.slice(0,8), 36);
  return isNaN(guess) ? 0 : guess;
}
