const $=s=>document.querySelector(s);
const R=n=>'₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const dt=t=>new Date(t).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const inv=b=>'INV-'+String(b.no).padStart(4,'0');
const r2=n=>Math.round(n*100)/100;
let db,me=null,tab='home',authMode='login',cart={},filt='today',q='',bq='';

/* ---------- storage (everything is saved in this browser) ---------- */
function load(){try{db=JSON.parse(localStorage.getItem('si_db'))}catch(e){}db=db||{users:[],products:[],bills:[]}}
function save(){try{localStorage.setItem('si_db',JSON.stringify(db));return true}catch(e){return false}}
const P=()=>db.products.filter(p=>p.uid===me.id);
const B=()=>db.bills.filter(b=>b.uid===me.id);
const low=()=>P().filter(p=>p.qty<=p.th).sort((a,b)=>a.qty-b.qty);
async function hash(p,s){if(!window.crypto||!crypto.subtle)return btoa(s+':'+p);const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s+':'+p));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',2200)}
function dlg(h){const d=$('#dlg');if(h===undefined){d.close();return}d.innerHTML=h;if(!d.open)d.showModal()}
const err=m=>{const e=$('#err');if(e)e.textContent=m;return false};

/* ---------- login / registration ---------- */
function authHTML(){const L=authMode==='login';return`<div class="auth"><div class="logo">📦</div><h2>${L?'Welcome back':'Create your account'}</h2><p class="mu">${L?'Login to manage your shop':'Set up your shop in a minute'}</p>${L?'':'<input id="as" placeholder="Shop name"><input id="ao" placeholder="Owner name">'}<input id="ae" type="email" placeholder="Email"><input id="ap" type="password" placeholder="Password${L?'':' (min 6 characters)'}">${L?'':'<input id="ac" type="password" placeholder="Confirm password">'}<p id="err" class="err"></p><button style="width:100%" onclick="auth()">${L?'Login':'Create account'}</button><p>${L?'No account yet?':'Already registered?'} <a href="#" onclick="authMode='${L?'register':'login'}';render();return false">${L?'Register':'Login'}</a></p></div>`}
async function auth(){const e=$('#ae').value.trim().toLowerCase(),p=$('#ap').value;
if(authMode==='login'){const u=db.users.find(x=>x.email===e);if(!u||u.h!==await hash(p,u.salt))return err('Wrong email or password.');start(u)}
else{const s=$('#as').value.trim(),o=$('#ao').value.trim();if(!s||!o)return err('Enter your shop name and your name.');if(!e.includes('@'))return err('Enter a valid email.');if(p.length<6)return err('Password must be at least 6 characters.');if(p!==$('#ac').value)return err('Passwords do not match.');if(db.users.some(x=>x.email===e))return err('An account already exists with this email.');const salt=uid(),u={id:uid(),shop:s,owner:o,email:e,salt,h:await hash(p,salt),th:5};db.users.push(u);if(!save())return err('Could not save. Browser storage may be blocked.');start(u)}}
function start(u){me=u;try{localStorage.setItem('si_me',u.id)}catch(x){}tab='home';render()}
function logout(){me=null;cart={};try{localStorage.removeItem('si_me')}catch(x){}authMode='login';render()}

/* ---------- main frame ---------- */
const NAV=[['home','🏠','Home'],['products','📦','Products'],['billing','🧾','Billing'],['sales','📈','Sales'],['settings','⚙️','Settings']];
const TITLE={home:'Dashboard',products:'Products',billing:'New bill',sales:'Sales history',alerts:'Low-stock alerts',settings:'Settings'};
function go(t){tab=t;render();scrollTo(0,0)}
function render(){const a=$('#app');if(!me){a.innerHTML=authHTML();return}
a.innerHTML=`<header><h1>${TITLE[tab]}</h1><button class="hb sm" onclick="go('alerts')">🔔 ${low().length}</button></header><main>${V[tab]()}</main>${tab==='billing'?'<div id="cb">'+cbHTML()+'</div>':''}<nav>${NAV.map(([k,i,l])=>`<button class="${tab===k?'on':''}" onclick="go('${k}')"><span>${i}</span>${l}</button>`).join('')}</nav>`}
const chip=p=>p.qty<=0?'<span class="chip out">Out of stock</span>':p.qty<=p.th?`<span class="chip low">Low: ${p.qty}</span>`:`<span class="chip ok">${p.qty} in stock</span>`;

/* ---------- dashboard ---------- */
function home(){const t0=new Date();t0.setHours(0,0,0,0);const all=B(),tb=all.filter(x=>x.at>=t0.getTime()),sum=a=>a.reduce((s,x)=>s+x.total,0),ps=P(),lw=low();
return`<div class="hero"><small>Welcome back,</small><h2>${esc(me.shop)}</h2><small>Stock value (at selling price)</small><div class="big">${R(ps.reduce((s,p)=>s+p.price*p.qty,0))}</div></div>
<div class="grid"><div class="card"><small class="mu">Today’s sales</small><b>${R(sum(tb))}</b><small class="mu">${tb.length} bill(s)</small></div><div class="card"><small class="mu">Total sales</small><b>${R(sum(all))}</b><small class="mu">${all.length} bill(s)</small></div><div class="card"><small class="mu">Products</small><b>${ps.length}</b><small class="mu">in your shop</small></div><div class="card click" onclick="go('alerts')"><small class="mu">Low stock</small><b class="${lw.length?'out':'ok'}">${lw.length}</b><small class="mu">${lw.length?'Tap to view':'All stocked'}</small></div></div>
<div class="row" style="margin-bottom:14px"><button style="flex:1" onclick="go('billing')">New bill</button><button class="o" style="flex:1" onclick="editP()">Add product</button></div>
${ps.length?'':'<div class="card">You have no products yet. Tap “Add product” to add your first product with its price and stock.</div>'}
${lw.length?`<h3>Low-stock items</h3>${lw.slice(0,3).map(p=>`<div class="card row"><b>${esc(p.name)}</b>${chip(p)}</div>`).join('')}`:''}
<h3>Recent sales</h3>${all.length?[...all].sort((a,b)=>b.at-a.at).slice(0,5).map(billRow).join(''):'<div class="card mu">No sales yet. Make your first bill from the Billing tab.</div>'}`}

/* ---------- products ---------- */
function productsView(){return`<input id="q" placeholder="Search products" value="${esc(q)}" oninput="q=this.value;plist()"><button style="width:100%;margin-bottom:12px" onclick="editP()">+ Add product</button><div id="plist">${plistHTML()}</div>`}
function plistHTML(){const s=q.trim().toLowerCase(),l=P().filter(p=>!s||(p.name+' '+p.cat).toLowerCase().includes(s));
if(!l.length)return`<p class="mu">${P().length?'No product matches your search.':'No products yet. Tap “Add product” to add your first one.'}</p>`;
return l.sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<div class="card"><div class="row"><div><b>${esc(p.name)}</b><br><small class="mu">${R(p.price)}${p.cat?' · '+esc(p.cat):''}</small></div>${chip(p)}</div><div class="acts"><button class="o sm" onclick="editP('${p.id}')">Edit</button><button class="o sm" onclick="stockD('${p.id}')">Update stock</button><button class="d sm" onclick="delD('${p.id}')">Delete</button></div></div>`).join('')}
function plist(){$('#plist').innerHTML=plistHTML()}
function editP(id){const p=id?P().find(x=>x.id===id):null;
dlg(`<h3>${p?'Edit':'Add'} product</h3><label>Product name</label><input id="fn" value="${esc(p?p.name:'')}"><label>Category (optional)</label><input id="fc" value="${esc(p?p.cat:'')}"><label>Selling price (₹)</label><input id="fp" type="number" min="0" step="0.01" inputmode="decimal" value="${p?p.price:''}">${p?`<p class="mu">Current stock: ${p.qty}. Use “Update stock” to change it.</p>`:'<label>Opening stock</label><input id="fq" type="number" min="0" step="1" inputmode="numeric">'}<label>Low-stock alert level (alert when stock is this number or less)</label><input id="ft" type="number" min="0" step="1" inputmode="numeric" value="${p?p.th:me.th}"><p id="err" class="err"></p><div class="row"><button class="o" onclick="dlg()">Cancel</button><button onclick="saveP('${id||''}')">Save</button></div>`)}
function saveP(id){const n=$('#fn').value.trim(),c=$('#fc').value.trim(),pr=parseFloat($('#fp').value),th=parseInt($('#ft').value);
if(!n)return err('Enter the product name.');if(!(pr>0))return err('Enter a valid price.');if(!(th>=0))return err('Enter the alert level (0 or more).');
if(id){Object.assign(P().find(x=>x.id===id),{name:n,cat:c,price:r2(pr),th})}
else{const qn=parseInt($('#fq').value);if(!(qn>=0))return err('Enter the stock quantity (0 or more).');db.products.push({id:uid(),uid:me.id,name:n,cat:c,price:r2(pr),qty:qn,th})}
if(!save())return err('Could not save.');dlg();toast('Product saved');render()}
function delD(id){const p=P().find(x=>x.id===id);dlg(`<h3>Delete product?</h3><p>“${esc(p.name)}” will be removed. Old bills will not change.</p><div class="row"><button class="o" onclick="dlg()">Cancel</button><button onclick="delP('${id}')">Delete</button></div>`)}
function delP(id){db.products=db.products.filter(p=>!(p.id===id&&p.uid===me.id));save();dlg();toast('Product deleted');render()}
function stockD(id){const p=P().find(x=>x.id===id);dlg(`<h3>Update stock</h3><p><b>${esc(p.name)}</b><br>Current stock: ${p.qty}</p><select id="sm"><option value="1">Add stock</option><option value="-1">Remove stock</option></select><input id="sq" type="number" min="1" step="1" inputmode="numeric" placeholder="Quantity"><p id="err" class="err"></p><div class="row"><button class="o" onclick="dlg()">Cancel</button><button onclick="applyStock('${id}')">Update</button></div>`)}
function applyStock(id){const p=P().find(x=>x.id===id),n=parseInt($('#sq').value);if(!(n>0))return err('Enter a quantity greater than 0.');const ch=n*parseInt($('#sm').value);if(p.qty+ch<0)return err(`Cannot remove ${n}. Only ${p.qty} in stock.`);p.qty+=ch;save();dlg();toast('Stock updated');render()}

/* ---------- billing ---------- */
const cartItems=()=>Object.entries(cart).map(([id,n])=>({p:P().find(x=>x.id===id),n})).filter(x=>x.p);
function billingView(){return`<input id="bq" placeholder="Search product to add" value="${esc(bq)}" oninput="bq=this.value;bl()"><div id="bl">${blHTML()}</div>`}
function blHTML(){if(!P().length)return'<p class="mu">Add some products first (Products tab), then come back to make a bill.</p>';
const s=bq.trim().toLowerCase(),l=P().filter(p=>!s||p.name.toLowerCase().includes(s)).sort((a,b)=>a.name.localeCompare(b.name));
return l.length?l.map(p=>{const n=cart[p.id]||0;return`<div class="card row"><div><b>${esc(p.name)}</b><br><small class="mu">${R(p.price)} · Stock: ${p.qty}</small></div>${p.qty<=0?'<span class="chip out">Out of stock</span>':n?`<div class="qty"><button class="o sm" onclick="cadd('${p.id}',-1)">−</button><b>${n}</b><button class="o sm" onclick="cadd('${p.id}',1)">+</button></div>`:`<button class="o sm" onclick="cadd('${p.id}',1)">+ Add</button>`}</div>`}).join(''):'<p class="mu">No product matches your search.</p>'}
function cadd(id,d){const p=P().find(x=>x.id===id),n=(cart[id]||0)+d;if(n>p.qty){toast(`Only ${p.qty} of ${p.name} in stock`);return}if(n<=0)delete cart[id];else cart[id]=n;bl()}
function bl(){$('#bl').innerHTML=blHTML();$('#cb').innerHTML=cbHTML()}
function cbHTML(){const it=cartItems();if(!it.length)return'';return`<div class="cbar"><div><small class="mu">${it.reduce((s,x)=>s+x.n,0)} item(s) in cart</small><br><b>${R(it.reduce((s,x)=>s+x.p.price*x.n,0))}</b></div><button onclick="checkout()">Checkout</button></div>`}
function checkout(){const it=cartItems();dlg(`<h3>Confirm bill</h3>${it.map(({p,n})=>`<div class="line"><span>${esc(p.name)} × ${n}</span><span>${R(p.price*n)}</span></div>`).join('')}<div class="line" style="border-top:1px solid var(--bd);margin-top:6px;padding-top:10px"><b>Total</b><b>${R(it.reduce((s,x)=>s+x.p.price*x.n,0))}</b></div><label>Customer name (optional)</label><input id="cu"><label>Payment</label><select id="py"><option>Cash</option><option>UPI</option><option>Card</option></select><p id="err" class="err"></p><div class="row"><button class="o" onclick="dlg()">Cancel</button><button onclick="sell()">Confirm and save bill</button></div>`)}
/* Sale is all-or-nothing: stock is checked first, then bill + stock change are applied together. If saving fails, everything is rolled back. */
function sell(){const it=cartItems();if(!it.length)return err('The cart is empty.');
for(const{p,n}of it)if(n>p.qty)return err(`Not enough stock for “${p.name}”. Available: ${p.qty}, requested: ${n}.`);
const snap=JSON.stringify(db),items=it.map(({p,n})=>({pid:p.id,name:p.name,price:p.price,qty:n}));
it.forEach(({p,n})=>{p.qty-=n});
const bill={id:uid(),uid:me.id,no:Math.max(0,...B().map(b=>b.no))+1,cust:$('#cu').value.trim()||'Walk-in Customer',pay:$('#py').value,items,total:r2(items.reduce((s,i)=>s+i.price*i.qty,0)),at:Date.now()};
db.bills.push(bill);
if(!save()){db=JSON.parse(snap);me=db.users.find(u=>u.id===me.id);return err('Could not save the bill. Nothing was changed.')}
cart={};render();showBill(bill.id)}

/* ---------- sales history and bill details ---------- */
const billRow=b=>`<div class="card click" onclick="showBill('${b.id}')"><div class="row"><div><b>${inv(b)} · ${esc(b.cust)}</b><br><small class="mu">${dt(b.at)} · ${b.items.reduce((s,i)=>s+i.qty,0)} item(s) · ${b.pay}</small></div><b>${R(b.total)}</b></div></div>`;
function salesView(){const n=new Date();n.setHours(0,0,0,0);const from=filt==='today'?n.getTime():filt==='week'?n.getTime()-6*864e5:0,l=B().filter(b=>b.at>=from).sort((a,b)=>b.at-a.at);
return`<div class="chips">${[['today','Today'],['week','Last 7 days'],['all','All']].map(([k,t])=>`<button class="${filt===k?'':'o'} sm" onclick="filt='${k}';render()">${t}</button>`).join('')}</div><div class="hero"><small>Total sales</small><div class="big">${R(l.reduce((s,b)=>s+b.total,0))}</div><small>${l.length} bill(s)</small></div>${l.length?l.map(billRow).join(''):'<p class="mu">No sales in this period. Create a bill from the Billing tab.</p>'}`}
function showBill(id){const b=B().find(x=>x.id===id);dlg(`<h3>${esc(me.shop)}</h3><div class="line"><span class="mu">Bill</span><b>${inv(b)}</b></div><div class="line"><span class="mu">Date</span><span>${dt(b.at)}</span></div><div class="line"><span class="mu">Customer</span><span>${esc(b.cust)}</span></div><div class="line"><span class="mu">Payment</span><span>${b.pay}</span></div><hr style="border:0;border-top:1px solid var(--bd)">${b.items.map(i=>`<div class="line"><span>${esc(i.name)}<br><small class="mu">${R(i.price)} × ${i.qty}</small></span><span>${R(i.price*i.qty)}</span></div>`).join('')}<hr style="border:0;border-top:1px solid var(--bd)"><div class="line"><b>Total</b><b style="font-size:20px;color:var(--pr)">${R(b.total)}</b></div><div class="row" style="margin-top:12px"><button onclick="dlg()">Close</button></div>`)}

/* ---------- low-stock alerts and settings ---------- */
function alertsView(){const l=low();if(!l.length)return'<div class="card"><b>All good!</b><p class="mu">No product is at or below its low-stock level.</p></div>';
return l.map(p=>`<div class="card row"><div><b>${esc(p.name)}</b><br><small class="${p.qty<=0?'out':'low'}">${p.qty<=0?'Out of stock':'Only '+p.qty+' left'} · alert level ${p.th}</small></div><button class="sm" onclick="stockD('${p.id}')">Restock</button></div>`).join('')}
function settingsView(){return`<div class="card"><h3>${esc(me.shop)}</h3><span class="mu">${esc(me.email)}</span></div><div class="card"><label>Shop name</label><input id="sn" value="${esc(me.shop)}"><label>Default low-stock level (used for new products)</label><input id="st" type="number" min="0" step="1" value="${me.th}"><p id="err" class="err"></p><button onclick="saveS()">Save settings</button></div><div class="card"><p class="mu">Smart Inventory 1.0 · data is saved in this browser only.</p><button class="d" style="padding-left:0" onclick="logout()">Logout</button></div>`}
function saveS(){const n=$('#sn').value.trim(),t=parseInt($('#st').value);if(!n)return err('Enter the shop name.');if(!(t>=0))return err('Enter a number (0 or more).');me.shop=n;me.th=t;save();toast('Settings saved');render()}

const V={home,products:productsView,billing:billingView,sales:salesView,alerts:alertsView,settings:settingsView};
load();try{me=db.users.find(u=>u.id===localStorage.getItem('si_me'))||null}catch(e){}
render();
