BillSplit

Split restaurant and grocery bills item by item, not evenly. Share one link, everyone claims what they had, and the totals update live on every phone. No accounts, no app installs.

Features
Link-based sessions: create a bill, share the URL (?bill=<id>), and anyone can join from their own device.
Self-claim items: tap your name chip on each item. Select multiple people to share a dish; the price splits evenly among them.
Split everything with everyone: one tap shares all items across the group (still editable per item).
Charges: add tax, GST, service charge, or delivery fee as a flat amount or a percentage. Each is allocated proportionally to what each person ordered.
Live split view: a per-person itemized receipt with items, subtotal, share of each charge, and total due.
Editable items: fix names or prices after the fact.
Mobile-first: rows wrap properly on narrow screens.
No-account identity: pick a name on first open; it's remembered per bill in localStorage. Use "Not you? Switch" on shared devices.
Tech stack
Layer	Choice
Frontend	Single index.html (plain HTML/CSS/JS, no build step)
Realtime data	Firebase Firestore (free tier)
Hosting	Netlify (free tier, static)
Data model

One Firestore document per bill in the bills collection:

bills/{billId}
├── people:  { personId: { name, color, order } }
├── items:   { itemId:   { name, price, sharedWith: { personId: true }, order } }
├── charges: { chargeId: { label, type: "flat" | "percent", value } }
└── createdAt

order is a timestamp used only to keep display order stable.

Setup
1. Firebase
Go to console.firebase.google.com and create a project.
Build → Firestore Database → Create (test mode).
Publish these rules so they don't expire after 30 days:
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
Register a Web App and copy the config object into firebaseConfig near the top of index.html.
2. Deploy to Netlify

Either drag index.html into app.netlify.com/drop, or:

bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
3. Run locally

Open index.html in a browser (or serve the folder with any static server).

Receipt scanning (currently disabled)

Scanning code is still in index.html (scanReceipt, OPENROUTER_API_KEY, SCAN_MODEL) but is not wired to any UI control. To re-enable:

Get a free key at openrouter.ai/keys and set OPENROUTER_API_KEY.
Add a file input in the Items tab that calls scanReceipt(event).

Note: an API key placed in client-side code is visible to anyone who loads the page.

Limitations
No security: Firestore rules are open and there is no auth. Anyone with the link can act as anyone. Intended for trusted friend groups; don't store sensitive data.
No payments: it calculates who owes what, but doesn't move money.
No bill history: losing the link means losing access.
Free-tier caps: Firebase and Netlify limits apply.
Roadmap ideas
Re-enable receipt scanning
"Your bills" list per device
Tighter Firestore rules
UPI / payment link generation on the Split tab
Custom domain
Cleanup

netlify.toml and netlify/functions/scanReceipt.js are leftovers from an earlier approach and can be deleted.
