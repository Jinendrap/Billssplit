/* ---------- PEOPLE TAB ---------- */
function renderPeopleTab(){
  const people = bill.people || {};
  const list = Object.entries(people).sort((a,b)=>orderOf(a[0],a[1])-orderOf(b[0],b[1]));
  const count = list.length;
  document.getElementById('tabContent').innerHTML = `
    <div class="card">
      <h2>Everyone on this bill</h2>
      <p class="sub">Anyone can add themselves by opening the share link.</p>
      ${count>0 ? `<p class="people-count"><b>${count}</b> ${count===1?'person':'people'} at the table</p>` : ''}
      ${count===0 ? `
        <div class="people-empty">
          <div class="big-icon">🍽️</div>
          <p>No one's joined yet. Share the link above and the first person to open it shows up here.</p>
        </div>
      ` : `
        <div class="chip-list">
          ${list.map(([pid,p])=>`
            <div class="chip ${pid===myPersonId?'me':''}">
              <span class="avatar" style="background:${p.color}">${initials(p.name)}</span>
              ${p.name}${pid===myPersonId?' (you)':''}
            </div>`).join('')}
        </div>
      `}
    </div>`;
  // Only fade the chips in on a genuine tab switch — not every time someone
  // else joins the bill and this tab happens to be open.
  if(isTabSwitchRender){
    animateOnce('.chip-list .chip');
    transitionScreen('#tabContent');
  }
}
