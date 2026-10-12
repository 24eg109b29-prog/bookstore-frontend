// Base API configuration: supports standalone deployments (Vercel/Netlify/GitHub Pages) and same-origin
const BACKEND_URL = window.BACKEND_URL || localStorage.getItem("BACKEND_URL") || "";
const API = `${BACKEND_URL}/api`;
const state = { books: [], cart: new Map(), search: "", category: "", sort: "featured" };
const $ = (id) => document.getElementById(id);
const rupees = (n) => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n || 0));
let toastTimer;
function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
async function request(url, options={}) {
  const response = await fetch(url, {headers:{"Content-Type":"application/json", ...(options.headers||{})}, ...options});
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const body = await response.json(); message = body.detail || body.message || body.error || message; } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}
async function loadBooks() {
  try {
    state.books = await request(`${API}/books`);
    const categories = [...new Set(state.books.map(b=>b.category).filter(Boolean))].sort();
    $("categoryFilter").innerHTML = '<option value="">All categories</option>' + categories.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    renderBooks();
  } catch (error) {
    let extraTip = "";
    if (window.location.protocol.startsWith("http") && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && !BACKEND_URL) {
      extraTip = `<br><br><button onclick="const u=prompt('Enter your deployed Backend URL (e.g. https://your-backend.onrender.com):'); if(u){localStorage.setItem('BACKEND_URL', u.trim().replace(/\\/$/,'')); location.reload();}" style="padding:8px 14px;cursor:pointer;border-radius:4px;border:1px solid #72815c;background:#2d4939;color:white;font-weight:600;font-size:12px;">🔗 Connect Backend URL</button>`;
    }
    $("bookGrid").innerHTML = `<div class="no-results">Could not load books. Make sure the backend server is running.<br><small>${escapeHtml(error.message)}</small>${extraTip}</div>`;
    $("bookTotal").textContent = "Connection issue";
  }
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function bookCover(book, index) {
  const colors = ["#49624b","#a34f36","#43566b","#806548","#6a5b7b","#426d70"];
  const color = colors[Math.abs(index) % colors.length];
  const title = escapeHtml(book.title);
  const author = escapeHtml(book.author);
  const fallback = `<div class="cover-fallback" style="--cover:${color}"><strong>${title}</strong><small>${author}</small></div>`;
  if (!book.coverUrl) return fallback;
  return `<img loading="lazy" src="${escapeHtml(book.coverUrl)}" alt="Cover of ${title}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" /><div class="cover-fallback" style="--cover:${color}; display:none;"><strong>${title}</strong><small>${author}</small></div>`;
}
function visibleBooks() {
  let list = state.books.filter(b => {
    const q = state.search.toLowerCase();
    return (!q || [b.title,b.author,b.category].some(v=>String(v||"").toLowerCase().includes(q))) && (!state.category || b.category===state.category);
  });
  if (state.sort==="price-low") list.sort((a,b)=>a.price-b.price);
  if (state.sort==="price-high") list.sort((a,b)=>b.price-a.price);
  if (state.sort==="title") list.sort((a,b)=>a.title.localeCompare(b.title));
  return list;
}
function renderBooks() {
  const list = visibleBooks(); $("bookTotal").textContent = `${list.length} book${list.length===1?"":"s"} to explore`;
  if (!list.length) { $("bookGrid").innerHTML='<div class="no-results">No books found. Try another search.</div>'; return; }
  $("bookGrid").innerHTML = list.map(book => {
    const index = state.books.findIndex(b=>b.id===book.id), inCart = state.cart.get(book.id)?.quantity || 0;
    return `<article class="book-card"><div class="cover-wrap">${bookCover(book,index)}<span class="category-pill">${escapeHtml(book.category)}</span></div><div class="book-info"><div class="book-title-row"><h3 class="book-title">${escapeHtml(book.title)}</h3><span class="price">${rupees(book.price)}</span></div><p class="author">by ${escapeHtml(book.author)}</p><p class="description">${escapeHtml(book.description || "A great addition to your bookshelf.")}</p><div class="book-actions"><span class="stock">${book.stock>0?`${book.stock} in stock`:"Out of stock"}</span><button class="add-button" data-add="${book.id}" ${book.stock<=inCart?"disabled":""}>${book.stock<=inCart?"Unavailable":inCart?"Add another +":"＋ Add to cart"}</button></div></div></article>`;
  }).join("");
}
function cartQuantity() { return [...state.cart.values()].reduce((sum,item)=>sum+item.quantity,0); }
function cartTotal() { return [...state.cart.values()].reduce((sum,item)=>sum+item.book.price*item.quantity,0); }
function updateCart() {
  $("cartCount").textContent=cartQuantity(); $("cartTotal").textContent=rupees(cartTotal()); $("checkoutTotal").textContent=rupees(cartTotal());
  const items=[...state.cart.values()];
  if (!items.length) $("cartItems").innerHTML='<div class="empty-cart">Your cart is waiting for a good story.<br><br>Add a book to get started.</div>';
  else $("cartItems").innerHTML=items.map(({book,quantity})=>`<div class="cart-row"><div class="mini-cover">${bookCover(book,state.books.findIndex(b=>b.id===book.id))}</div><div><h3>${escapeHtml(book.title)}</h3><small>${rupees(book.price)} each</small><div class="quantity"><button data-qty="${book.id}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${quantity}</span><button data-qty="${book.id}" data-delta="1" aria-label="Increase quantity" ${quantity>=book.stock?"disabled":""}>＋</button></div></div><span class="line-price">${rupees(book.price*quantity)}</span></div>`).join("");
  renderBooks();
}
function addToCart(id) {
  const book=state.books.find(b=>b.id===Number(id)); if(!book)return;
  const item=state.cart.get(book.id);
  if ((item?.quantity||0)>=book.stock) return toast("No more stock available for this book.");
  state.cart.set(book.id,{book,quantity:(item?.quantity||0)+1}); updateCart(); toast("Added to your cart.");
}
function changeQuantity(id,delta) {
  const item=state.cart.get(Number(id)); if(!item)return;
  const next=item.quantity+delta;
  if(next<=0) state.cart.delete(Number(id));
  else if(next<=item.book.stock) item.quantity=next;
  updateCart();
}
function openCart() {$("cartOverlay").classList.remove("hidden"); updateCart();}
function closeCart() {$("cartOverlay").classList.add("hidden");}
$("bookGrid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)addToCart(b.dataset.add);});
$("cartItems").addEventListener("click",e=>{const b=e.target.closest("[data-qty]");if(b)changeQuantity(b.dataset.qty,Number(b.dataset.delta));});
$("searchInput").addEventListener("input",e=>{state.search=e.target.value;renderBooks();});
$("categoryFilter").addEventListener("change",e=>{state.category=e.target.value;renderBooks();});
$("sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderBooks();});
$("cartToggle").addEventListener("click",openCart); $("closeCart").addEventListener("click",closeCart);
$("cartOverlay").addEventListener("click",e=>{if(e.target===$("cartOverlay"))closeCart();});
$("checkoutButton").addEventListener("click",()=>{
  if(!state.cart.size)return toast("Add at least one book first.");
  closeCart(); $("checkoutMessage").textContent=""; $("checkoutOverlay").classList.remove("hidden");
});
$("closeCheckout").addEventListener("click",()=>$("checkoutOverlay").classList.add("hidden"));
$("checkoutOverlay").addEventListener("click",e=>{if(e.target===$("checkoutOverlay"))$("checkoutOverlay").classList.add("hidden");});
$("checkoutForm").addEventListener("submit",async e=>{
  e.preventDefault(); const button=e.target.querySelector("button[type=submit]"); button.disabled=true; button.textContent="Placing order…";
  const form=new FormData(e.target);
  const payload={customerName:form.get("customerName"),email:form.get("email"),address:form.get("address"),items:[...state.cart.values()].map(({book,quantity})=>({bookId:book.id,quantity}))};
  try {
    const order=await request(`${API}/orders`,{method:"POST",body:JSON.stringify(payload)});
    $("checkoutMessage").innerHTML=`<strong>Order placed successfully!</strong><br>Your order number is <strong>#${order.id}</strong>. Total: <strong>${rupees(order.total)}</strong>.`;
    state.cart.clear(); updateCart(); e.target.reset(); await loadBooks();
    button.textContent="Order placed ✓"; toast(`Order #${order.id} placed`);
    setTimeout(()=>{$("checkoutOverlay").classList.add("hidden");button.disabled=false;button.innerHTML='Place order · <span id="checkoutTotal">₹0</span>';updateCart();},2800);
  } catch(error) {
    $("checkoutMessage").textContent=`Could not place order: ${error.message}. Please review your cart and try again.`;
    button.disabled=false; button.innerHTML='Place order · <span id="checkoutTotal">₹0</span>';
  }
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCart();$("checkoutOverlay").classList.add("hidden");}});
updateCart(); loadBooks();
