/* ---------- app-level state ---------- */
let billId = new URLSearchParams(window.location.search).get('bill');
let myPersonId = null;
let bill = null;          // live document data from Firestore
let billNotFound = false; // true only once Firestore confirms the doc doesn't exist
let activeTab = 'items';
let unsubscribe = null;
let editingItemId = null; // item currently being edited, or null
let editingChargeId = null;   // charge currently open for editing, or null
let editingDiscountId = null; // discount currently open for editing, or null
const TAB_ORDER = ['people','items','charges','split'];

/* ---------- render tracking (flicker fix) ----------
   lastRenderedTab remembers which tab's shell+content was last fully built.
   isTabSwitchRender is set fresh by renderMain() on every call and tells the
   individual tab renderers whether this render is a genuine navigation
   (screen just opened, or the user switched tabs) vs. a Firestore snapshot
   refreshing the SAME tab in place. Entrance animations should only ever
   play on the former — replaying them on every data update is what caused
   the visible flicker/jump on every select/add/edit/delete. */
let lastRenderedTab = null;
let isTabSwitchRender = false;
