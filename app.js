const $ = id => document.getElementById(id);
const STORAGE_KEY = "bargainFinderUK.v1";
const shops = [
  ["Amazon UK", q => `https://www.amazon.co.uk/s?k=${encodeURIComponent(q)}`],
  ["eBay UK", q => `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(q)}`],
  ["Google Shopping", q => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`],
  ["Argos", q => `https://www.argos.co.uk/search/${encodeURIComponent(q).replace(/%20/g,"-")}/`],
  ["Tesco", q => `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(q)}`],
  ["OnBuy", q => `https://www.onbuy.com/gb/search/?query=${encodeURIComponent(q)}`]
];
let items = load();
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch(e){return []}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(items));render()}
function money(n){return "£"+Number(n).toFixed(2)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

function doSearch(){
  const q=$("searchInput").value.trim();
  if(!q){$("searchInput").focus();return}
  const box=$("searchLinks");box.innerHTML="";
  shops.forEach(([name,url])=>{
    const a=document.createElement("a");a.className="shop-link";a.href=url(q);a.target="_blank";a.rel="noopener noreferrer";
    a.innerHTML=`${escapeHtml(name)} <span>Search ↗</span>`;box.appendChild(a);
  });
  box.hidden=false;
}
$("searchBtn").addEventListener("click",doSearch);
$("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")doSearch()});

$("watchForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("productName").value.trim(), price=Number($("currentPrice").value), target=$("targetPrice").value===""?null:Number($("targetPrice").value);
  if(!name||!Number.isFinite(price)||price<0)return;
  if(target!==null&&(!Number.isFinite(target)||target<0))return;
  items.unshift({id:Date.now(),name,price,target,history:[{price,date:new Date().toISOString()}]});
  $("watchForm").reset();save();
});
function updatePrice(id){
  const item=items.find(x=>x.id===id);if(!item)return;
  const value=prompt("Enter the new price you found (£):",item.price.toFixed(2));
  if(value===null)return;
  const price=Number(value);if(!Number.isFinite(price)||price<0){alert("Please enter a valid price.");return}
  item.price=price;item.history.push({price,date:new Date().toISOString()});save();
}
function updateTarget(id){
  const item=items.find(x=>x.id===id);if(!item)return;
  const value=prompt("Set your target price in pounds. Leave blank to remove the target:",item.target??"");
  if(value===null)return;
  if(value.trim()==="")item.target=null;
  else{const n=Number(value);if(!Number.isFinite(n)||n<0){alert("Please enter a valid target.");return}item.target=n}
  save();
}
function removeItem(id){if(confirm("Remove this product from your price watch?")){items=items.filter(x=>x.id!==id);save()}}
function render(){
  $("watchCount").textContent=`${items.length} saved`;
  $("emptyState").hidden=items.length>0;
  $("watchList").innerHTML=items.map(item=>{
    const reached=item.target!==null&&item.price<=item.target;
    const lowest=Math.min(...item.history.map(h=>h.price));
    const date=new Date(item.history[item.history.length-1].date).toLocaleDateString("en-GB");
    return `<article class="watch-card">
      <div class="watch-top"><strong>${escapeHtml(item.name)}</strong><span class="counter">Updated ${date}</span></div>
      <div class="prices"><span>Latest: <b>${money(item.price)}</b></span><span>Lowest recorded: <b>${money(lowest)}</b></span><span>Target: <b>${item.target===null?"Not set":money(item.target)}</b></span></div>
      <div class="status ${reached?"":"warn"}">${reached?"✓ Target reached — this price is at or below your target.":item.target===null?"Set a target to track your goal.":"Waiting for "+money(item.target)+" or less."}</div>
      <div class="card-actions"><button class="small-btn" onclick="updatePrice(${item.id})">Update price</button><button class="small-btn" onclick="updateTarget(${item.id})">Change target</button><button class="small-btn delete-btn" onclick="removeItem(${item.id})">Remove</button></div>
      <div class="history">Price records: ${item.history.map(h=>money(h.price)).join(" → ")}</div>
    </article>`;
  }).join("");
}
window.updatePrice=updatePrice;window.updateTarget=updateTarget;window.removeItem=removeItem;
render();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
