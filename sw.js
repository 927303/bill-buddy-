const C='bb-v7',A=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
const P='Basic ₹9/mo · Medium ₹50/6 mo · Advanced ₹100/yr',PH='Basic ₹9/माह · Medium ₹50/6 माह · Advanced ₹100/वर्ष',PG='Basic ₹9/mahina · Medium ₹50/6 mahine · Advanced ₹100/saal';
const T={en:{ov:'Overdue',up:'Upcoming',tr:'Your free trial ends on {d}. Choose a plan: '+P,su:'Your subscription ends on {d}. Renew now: '+P,ex:'Your plan expired on {d}. Renew to keep your reminders: '+P},
hi:{ov:'बकाया',up:'आने वाले',tr:'आपका फ्री ट्रायल {d} को खत्म हो रहा है। प्लान चुनें: '+PH,su:'आपकी सदस्यता {d} को खत्म हो रही है। अभी रिन्यू करें: '+PH,ex:'आपका प्लान {d} को खत्म हो गया। रिन्यू करें: '+PH},
hg:{ov:'Overdue',up:'Aane wale',tr:'Aapka free trial {d} ko khatam ho raha hai. Plan chuno: '+PG,su:'Aapka subscription {d} ko khatam ho raha hai. Abhi renew karo: '+PG,ex:'Aapka plan {d} ko khatam ho gaya. Reminders chalte rakhne ke liye renew karo: '+PG}};
function buildNotes(s,now){const L=T[s.lang]||T.en,m=new Date(now);m.setHours(0,0,0,0);const td=m.getFullYear()+'-'+String(m.getMonth()+1).padStart(2,'0')+'-'+String(m.getDate()).padStart(2,'0'),sent=s.sent||{},out=[],p=s.plan||{},end=new Date(p.end),fm=x=>new Date(x).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),days=Math.ceil((end-now)/864e5);let st=p.st;if((st==='trial'||st==='active')&&end<=now)st='expired';
if(st==='expired'){if(!sent.ex||(m-new Date(sent.ex+'T00:00'))/864e5>=3)out.push({key:'ex',title:'Bill Buddy ⏰',body:L.ex.replace('{d}',fm(end)),go:'plans'})}
else{const ov=[],up=[];(s.bills||[]).forEach(b=>{const d=Math.round((new Date(b.due+'T00:00')-m)/864e5);if(d<0)ov.push(b.n);else if(d<=b.rem)up.push(b.n)});
if(ov.length&&sent.ov!==td)out.push({key:'ov',title:'Bill Buddy ⚠️',body:L.ov+' ('+ov.length+'): '+ov.slice(0,3).join(', '),go:'bills'});
if(up.length&&sent.up!==td)out.push({key:'up',title:'Bill Buddy 🔔',body:L.up+' ('+up.length+'): '+up.slice(0,3).join(', '),go:'bills'});
if(st==='trial'&&days<=2&&sent.tr!==td)out.push({key:'tr',title:'Bill Buddy 🎁',body:L.tr.replace('{d}',fm(end)),go:'plans'});
if(st==='active'&&days<=3&&sent.su!==td)out.push({key:'su',title:'Bill Buddy ⭐',body:L.su.replace('{d}',fm(end)),go:'plans'})}
return{notes:out,td}}
if(typeof module!=='undefined')module.exports={buildNotes};
if(typeof self!=='undefined'&&self.addEventListener){
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.url.includes('version.json')||e.request.url.includes('supabase.co'))return;e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request)))});
self.addEventListener('notificationclick',e=>{e.notification.close();const go=e.action||(e.notification.data&&e.notification.data.go)||'';e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{if(l.length){l[0].focus();l[0].postMessage({go});return}return clients.openWindow('./'+(go?'?go='+go:''))}))});
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('bbdb',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=rej});
async function runRemind(){try{const db=await idb(),snap=await new Promise(r=>{const g=db.transaction('kv').objectStore('kv').get('snap');g.onsuccess=()=>r(g.result);g.onerror=()=>r(null)});if(!snap)return;const{notes,td}=buildNotes(snap,Date.now());for(const n of notes){await self.registration.showNotification(n.title,{body:n.body,icon:'icon-192.png',badge:'icon-192.png',tag:n.key,data:{go:n.go},actions:n.go==='plans'?[{action:'plans',title:'Plans'}]:[]});snap.sent=snap.sent||{};snap.sent[n.key]=td}if(notes.length)db.transaction('kv','readwrite').objectStore('kv').put(snap,'snap')}catch(e){}}
self.addEventListener('periodicsync',e=>{if(e.tag==='bb-remind')e.waitUntil(runRemind())})}
