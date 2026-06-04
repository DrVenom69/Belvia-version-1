// Global Application State
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('belvia_cart')) || [],
  wishlist: JSON.parse(localStorage.getItem('belvia_wishlist')) || ['belvia-neon-keychain'], // Seed default wishlist item
  activeCoupon: null,
  activeStoryIndex: 0,
  storyInterval: null,
  chatThread: [
    { sender: 'support', text: 'Hey bro! Welcome to Belvia Support. How can we help you with your 3D print projects today?' }
  ],
  orderHistory: [
    {
      id: "ORD-9481",
      date: "2026-06-01",
      item: "Minimalist Tag Keychain (TPU // Belvia Gold)",
      price: 5.99,
      status: "delivered",
      tracking: "done"
    },
    {
      id: "ORD-7284",
      date: "2026-06-03",
      item: "Geometric Fox Figurine (PLA // Matte Black)",
      price: 24.99,
      status: "processing",
      tracking: "current"
    }
  ]
};

// V2 Routing Table
const routes = {
  '#home': renderHome,
  '#ready-prints': renderReadyPrints,
  '#product-details': renderProductDetails,
  '#custom-print': renderCustomPrint,
  '#bulk-orders': renderBulkOrders,
  '#portfolio': renderPortfolio,
  '#pre-orders': renderPreOrders,
  '#account': renderAccount
};

// Social Story Reviews database
const socialStories = [
  { userId: "iffat", userName: "Iffat Rylan", initial: "IR", rating: 5, text: "Awesome keychains bro! The gold paint matches my toolhead perfectly.", tag: "Minimalist Tag Keychain" },
  { userId: "mkbhd", userName: "MKBHD", initial: "M", rating: 5, text: "The geometric lines on this fox decor are incredibly crisp. Matte filaments look insanely clean.", tag: "Geometric Fox Figurine" },
  { userId: "crafty", userName: "CraftyMaker", initial: "C", rating: 4.8, text: "Super fast turnaround time on my custom order. Will buy bulk next time.", tag: "Custom Printing Services" }
];

// Initialize Application V2
async function init() {
  await loadProducts();
  window.addEventListener('hashchange', router);
  router();
  initCartUI();
  initShellUI();
  updateCartCount();
}

async function loadProducts() {
  try {
    const res = await fetch('./data/products.json');
    state.products = await res.json();
  } catch (err) {
    console.error('Failed to load products database:', err);
  }
}

// Router Swapper V2
function router() {
  const hash = window.location.hash || '#home';
  const cleanHash = hash.split('?')[0];
  const renderFn = routes[cleanHash] || renderHome;

  const viewOutlet = document.getElementById('app-router-view');
  
  viewOutlet.classList.remove('fade-in');
  void viewOutlet.offsetWidth; // Trigger reflow
  
  viewOutlet.innerHTML = renderFn(hash);
  viewOutlet.classList.add('fade-in');

  // Sync Nav active state
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === cleanHash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Adjust Spline persistent container visibility based on page
  const splineContainer = document.getElementById('spline-hero-container');
  if (cleanHash === '#home') {
    splineContainer.style.opacity = '1';
    splineContainer.style.transform = 'translate(-50%, -45%) scale(1)';
  } else {
    splineContainer.style.opacity = '0.03'; // subtle watermark background
    splineContainer.style.transform = 'translate(-50%, -45%) scale(0.7)';
  }
}

// Setup Shell Dropdown, Coupons, and Chat UI Handlers
function initShellUI() {
  // Profile dropdown toggle
  const profileToggle = document.getElementById('profile-toggle-btn');
  const profileDropdown = document.getElementById('profile-menu-dropdown');
  
  profileToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    profileDropdown.classList.remove('open');
  });

  // Support Chat bubble toggle
  const chatBubble = document.getElementById('chat-toggle-btn');
  const chatClose = document.getElementById('chat-close-btn-widget');
  const chatWindow = document.getElementById('chat-window');

  chatBubble.addEventListener('click', () => {
    chatWindow.classList.add('open');
  });

  chatClose.addEventListener('click', () => {
    chatWindow.classList.remove('open');
  });

  // Chat message submission
  const chatInput = document.getElementById('chat-input-field');
  const chatSend = document.getElementById('chat-send-btn');
  
  const sendMessage = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    state.chatThread.push({ sender: 'user', text });
    chatInput.value = '';
    renderChatMessages();
    
    // Simulate support response
    setTimeout(() => {
      let reply = "Got it! Our printing queue is active. Let me consult our lab supervisor for you.";
      if (text.toLowerCase().includes('materials') || text.toLowerCase().includes('filament')) {
        reply = "We offer PLA, PETG, ABS, and TPU. For outdoor items, I recommend PETG. For phone cases, TPU.";
      } else if (text.toLowerCase().includes('coupon') || text.toLowerCase().includes('discount')) {
        reply = "You can try using coupon code BELVIA10 for a 10% discount on ready prints!";
      }
      state.chatThread.push({ sender: 'support', text: reply });
      renderChatMessages();
    }, 1000);
  };

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Coupon apply
  const couponBtn = document.getElementById('coupon-apply-btn');
  couponBtn.addEventListener('click', () => {
    const input = document.getElementById('coupon-input');
    applyCouponCode(input.value.trim());
  });
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  container.innerHTML = state.chatThread.map(m => `
    <div class="msg ${m.sender}-msg">
      <p>${m.text}</p>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

// Coupon Validator
function applyCouponCode(code) {
  const msgEl = document.getElementById('coupon-message');
  if (code.toUpperCase() === 'BELVIA10') {
    state.activeCoupon = { code: 'BELVIA10', factor: 0.1 };
    msgEl.innerHTML = `<span style="color:#22c55e;">Coupon BELVIA10 applied! (10% Off)</span>`;
  } else if (code.toUpperCase() === 'GOLDENFOX') {
    state.activeCoupon = { code: 'GOLDENFOX', factor: 0.15 };
    msgEl.innerHTML = `<span style="color:#22c55e;">Coupon GOLDENFOX applied! (15% Off)</span>`;
  } else {
    state.activeCoupon = null;
    msgEl.innerHTML = `<span style="color:#ef4444;">Invalid coupon code.</span>`;
  }
  renderCartItems();
}

// Shopping Cart sidebar panel toggle
function initCartUI() {
  const cartToggle = document.getElementById('cart-toggle-btn');
  const cartClose = document.getElementById('cart-close-btn');
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');

  cartToggle.addEventListener('click', () => {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('show');
    renderCartItems();
  });

  const closeCart = () => {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('show');
  };

  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
}

// View Renderer Functions V2

function renderHome() {
  const featured = state.products.filter(p => !p.isPreOrder).slice(0, 2);
  
  return `
    <!-- Instagram Story Highlights -->
    <div class="stories-container">
      ${socialStories.map((story, idx) => `
        <div class="story-circle" onclick="openStoryViewer(${idx})">
          <div class="story-avatar-border">
            <div class="story-avatar-img">${story.initial}</div>
          </div>
          <span>${story.userName}</span>
        </div>
      `).join('')}
    </div>

    <!-- Hero Section Content -->
    <section class="hero-text-wrap">
      <h1>PRECISION FABRICATION<br><span class="highlight">LUXURY DIMENSIONS</span></h1>
      <p class="subtitle">Customized 3D creations, rapid STL estimator, and industrial pre-order components.</p>
      <div class="hero-actions">
        <a href="#ready-prints" class="primary-btn">Ready Prints</a>
        <a href="#custom-print" class="secondary-btn">STL Upload Estimator</a>
      </div>
    </section>

    <!-- Homepage Media Video and Making Photo Gallery Section -->
    <section class="section-wrap" style="padding-top: 1rem;">
      <h2 class="section-title">THE BELVIA LAB IN ACTION</h2>
      <div class="media-gallery-container">
        <div class="video-container-card">
          <div class="mock-video-wrapper">
            <button class="mock-video-play-btn" onclick="alert('Playing FDM Calibration process timelapse...')">▶</button>
            <div style="position:absolute; bottom:1rem; left:1rem; font-size:0.8rem; color:#fff;">TIMELAPSE: Fox Figurine Print (ABS)</div>
          </div>
        </div>
        <div class="photo-gallery-row">
          <div class="photo-gallery-card" style="background: url('https://images.unsplash.com/photo-1615840287214-7fe58a8b668f?q=80&w=400') center/cover no-repeat;"></div>
          <div class="photo-gallery-card" style="background: url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400') center/cover no-repeat;"></div>
          <div class="photo-gallery-card" style="background: url('https://images.unsplash.com/photo-1535813547-99c456a41d4a?q=80&w=400') center/cover no-repeat;"></div>
          <div class="photo-gallery-card" style="background: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400') center/cover no-repeat;"></div>
        </div>
      </div>
    </section>

    <!-- Featured Ready Prints Preview -->
    <section class="section-wrap">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
        <h2 class="section-title" style="margin-bottom:0;">FEATURED READY PRINTS</h2>
        <a href="#ready-prints" style="color:var(--accent-gold); font-size:0.9rem; font-weight:700;">View All Ready Prints &rarr;</a>
      </div>
      <div class="product-grid">
        ${featured.map(p => `
          <div class="product-card">
            <div class="card-img-placeholder" style="background: url('${p.images[0]}') center/cover no-repeat; height: 200px;"></div>
            <div class="card-info">
              <span class="card-cat">${p.category}</span>
              <h3>${p.title}</h3>
              <div class="card-specs">
                <span>Weight: ${p.weightGrams}g</span>
                <span>Time: ${p.printTimeMinutes}m</span>
              </div>
              <div class="card-footer-row">
                <span class="price">$${p.startingPrice.toFixed(2)}</span>
                <a href="#product-details?id=${p.id}" class="card-detail-btn" style="border-color:var(--accent-gold); color:var(--accent-gold);">Configure & Buy</a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Social Stories Slideshow Viewer overlay -->
    <div id="stories-viewer" class="stories-viewer">
      <div class="viewer-content" id="viewer-content">
        <!-- Fills via Javascript -->
      </div>
    </div>
  `;
}

function renderReadyPrints(hash) {
  const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const filterCat = params.get('cat');
  
  const readyProducts = state.products.filter(p => !p.isPreOrder);
  const filtered = filterCat 
    ? readyProducts.filter(p => p.category === filterCat)
    : readyProducts;

  return `
    <div class="shop-header">
      <h2>READY TO SHIP PRINTS</h2>
      <p class="subtitle">Browse and purchase 3D models available for immediate dispatch.</p>
    </div>

    <div class="product-grid">
      ${filtered.map(p => `
        <div class="product-card">
          <div class="card-img-placeholder" style="background: url('${p.images[0]}') center/cover no-repeat; height: 200px;"></div>
          <div class="card-info">
            <span class="card-cat">${p.category}</span>
            <h3>${p.title}</h3>
            <div class="card-specs">
              <span>Weight: ${p.weightGrams}g</span>
              <span>Time: ${p.printTimeMinutes}m</span>
            </div>
            <div class="card-footer-row">
              <span class="price">$${p.startingPrice.toFixed(2)}</span>
              <div class="card-btns">
                <a href="#product-details?id=${p.id}" class="card-detail-btn">Configure</a>
                <button onclick="addToCart('${p.id}', '${p.colors[0]}', '${p.materials[0]}')" class="card-buy-btn">Buy Now</button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPreOrders(hash) {
  const preOrderProducts = state.products.filter(p => p.isPreOrder);
  
  return `
    <div class="shop-header">
      <h2>IMPORTED GOODS (PRE-ORDER ONLY)</h2>
      <p class="subtitle" style="color:#f5af19;">Note: These components are ordered on-demand. Delivery times range from 2-4 weeks.</p>
    </div>

    <div class="product-grid">
      ${preOrderProducts.map(p => `
        <div class="product-card" style="border-color:#b8810e;">
          <div class="card-img-placeholder" style="background: url('${p.images[0]}') center/cover no-repeat; height: 200px; position:relative;">
            <div style="position:absolute; top:10px; right:10px; background:#b8810e; font-size:0.65rem; padding:0.25rem 0.5rem; border-radius:4px; font-weight:700;">PRE-ORDER ONLY</div>
          </div>
          <div class="card-info">
            <span class="card-cat" style="color:#b8810e;">${p.category}</span>
            <h3>${p.title}</h3>
            <div class="card-specs">
              <span>Imported Component</span>
              <span>No custom colors</span>
            </div>
            <div class="card-footer-row">
              <span class="price">$${p.startingPrice.toFixed(2)}</span>
              <div class="card-btns">
                <a href="#product-details?id=${p.id}" class="card-detail-btn">Configure</a>
                <button onclick="addToCart('${p.id}', '${p.colors[0]}', '${p.materials[0]}')" class="card-buy-btn" style="background:#b8810e;">Pre-Order Now</button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderProductDetails(hash) {
  const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const id = params.get('id');
  const product = state.products.find(p => p.id === id);

  if (!product) return `<p>Product not found.</p>`;
  
  const reviewsList = product.reviews && product.reviews.length > 0
    ? product.reviews.map(r => `
        <div style="border-bottom:1px solid var(--border-color); padding:1rem 0;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">
            <strong>${r.userName} ${r.verified ? '<span style="color:#22c55e;">[Verified Customer]</span>' : ''}</strong>
            <span style="color:var(--accent-gold);">${'★'.repeat(Math.round(r.rating))}</span>
          </div>
          <p style="font-size:0.85rem; color:var(--text-secondary);">${r.comment}</p>
          <span style="font-size:0.7rem; color:var(--text-muted);">${r.date}</span>
        </div>
      `).join('')
    : `<p style="color:var(--text-muted); font-size:0.85rem;">No reviews yet. Be the first to configure and review this item!</p>`;

  const wishlistBtnClass = state.wishlist.includes(product.id) ? 'wishlist-active' : '';
  const wishlistBtnText = state.wishlist.includes(product.id) ? '♥ Wishlisted' : '♡ Add to Wishlist';

  return `
    <div class="detail-container">
      <div class="detail-gallery">
        <div class="main-preview-img" style="background: url('${product.images[0]}') center/cover no-repeat; height: 350px;"></div>
      </div>
      <div class="detail-info">
        <span class="card-cat">${product.category}</span>
        <h2>${product.title}</h2>
        <p class="desc">${product.description}</p>
        
        <div class="detail-config">
          <div class="config-group">
            <label>Color Selection</label>
            <div class="color-options">
              ${product.colors.map((col, idx) => `
                <button class="color-dot ${col} ${idx === 0 ? 'active' : ''}" onclick="selectColor(this, '${col}')"></button>
              `).join('')}
            </div>
          </div>

          <div class="config-group">
            <label>Material Specification</label>
            <div class="material-options">
              ${product.materials.map((mat, idx) => `
                <button class="option-pill ${idx === 0 ? 'active' : ''}" onclick="selectMaterial(this, '${mat}')">${mat}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="detail-pricing">
          <div class="price-breakdown">
            <span>Base Cost: $${product.startingPrice}</span>
            <span>Est. Print Time: ${product.printTimeMinutes} min</span>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button onclick="addToCart('${product.id}')" class="primary-btn" style="flex:1;">
              ${product.isPreOrder ? 'PRE-ORDER NOW' : 'ADD TO CART'}
            </button>
            <button onclick="toggleWishlist('${product.id}')" class="secondary-btn ${wishlistBtnClass}">${wishlistBtnText}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Verified Customer Reviews Section -->
    <section class="section-wrap" style="max-width: 900px; margin: 0 auto; border-top: 1px solid var(--border-color); margin-top:3rem;">
      <h3 class="section-title">Verified Customer Reviews</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-top:1.5rem;">
        <div>
          <h4>Customer Feedback</h4>
          <div style="margin-top:1rem;">${reviewsList}</div>
        </div>
        <div class="review-form-box">
          <h4>Leave a Review</h4>
          <form onsubmit="event.preventDefault(); addReview('${product.id}');" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
            <div class="form-group">
              <label>Your Name</label>
              <input type="text" id="review-name" required placeholder="John Doe">
            </div>
            <div class="form-group">
              <label>Rating</label>
              <select id="review-rating">
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
              </select>
            </div>
            <div class="form-group">
              <label>Review Comment</label>
              <textarea id="review-comment" rows="3" required placeholder="Write your review here..."></textarea>
            </div>
            <button type="submit" class="primary-btn">Submit Verified Review</button>
          </form>
        </div>
      </div>
    </section>
  `;
}

function renderPortfolio() {
  return `
    <div class="shop-header">
      <h2>PORTFOLIO SHOWCASE</h2>
      <p class="subtitle">A gallery of completed projects, customer custom orders, and real-world 3D prints.</p>
    </div>
    
    <div class="portfolio-grid">
      <div class="portfolio-card">
        <div class="portfolio-img" style="background: url('https://images.unsplash.com/photo-1615840287214-7fe58a8b668f?q=80&w=400')"></div>
        <div class="portfolio-info">
          <h4>Fox Statue (Matte ABS)</h4>
          <p>Layer Height: 0.16mm // Time: 4h // Gold highlight finishes matching Belvia Fox Logo.</p>
        </div>
      </div>
      <div class="portfolio-card">
        <div class="portfolio-img" style="background: url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400')"></div>
        <div class="portfolio-info">
          <h4>Custom Toolhead Frame (PETG Carbon)</h4>
          <p>Layer Height: 0.12mm // Strong infill structure configured for print head mods.</p>
        </div>
      </div>
      <div class="portfolio-card">
        <div class="portfolio-img" style="background: url('https://images.unsplash.com/photo-1535813547-99c456a41d4a?q=80&w=400')"></div>
        <div class="portfolio-info">
          <h4>Custom Name Keychains (TPU Flexible)</h4>
          <p>Layer Height: 0.20mm // Batch printing order completed for corporate marketing events.</p>
        </div>
      </div>
    </div>
  `;
}

function renderAccount(hash) {
  const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const tab = params.get('tab') || 'profile';

  return `
    <div class="account-container">
      <div class="account-sidebar-menu">
        <div class="account-btn-tab ${tab === 'profile' ? 'active' : ''}" onclick="window.location.hash = '#account?tab=profile'">User Profile</div>
        <div class="account-btn-tab ${tab === 'orders' ? 'active' : ''}" onclick="window.location.hash = '#account?tab=orders'">My Orders</div>
        <div class="account-btn-tab ${tab === 'wishlist' ? 'active' : ''}" onclick="window.location.hash = '#account?tab=wishlist'">Wishlist</div>
        <div class="account-btn-tab ${tab === 'settings' ? 'active' : ''}" onclick="window.location.hash = '#account?tab=settings'">Preferences</div>
      </div>
      <div class="account-content-pane">
        ${renderAccountTabContent(tab)}
      </div>
    </div>
  `;
}

function renderAccountTabContent(tab) {
  if (tab === 'profile') {
    return `
      <h3>User Profile Information</h3>
      <p class="subtitle">Manage default shipping addresses and preferences.</p>
      <form onsubmit="event.preventDefault(); alert('Profile Saved!');" style="display:flex; flex-direction:column; gap:1rem; margin-top:1.5rem;">
        <div class="form-row">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" value="Iffat Rylan" required>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" value="iffat@belvia.com" required>
          </div>
        </div>
        <div class="form-group">
          <label>Default Shipping Address</label>
          <textarea rows="3" placeholder="123 Printing Lane, Filament City" required>123 Printing Lane, Filament City</textarea>
        </div>
        <button type="submit" class="primary-btn" style="width:150px;">Save Profile</button>
      </form>
    `;
  }
  
  if (tab === 'orders') {
    return `
      <h3>My Orders & Shipping Status</h3>
      <p class="subtitle">Track active print parameters and package delivery tracing.</p>
      <div style="display:flex; flex-direction:column; gap:2rem; margin-top:1.5rem;">
        ${state.orderHistory.map(o => `
          <div style="border:1px solid var(--border-color); border-radius:var(--border-radius); padding:1.5rem; background:rgba(0,0,0,0.15);">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; margin-bottom:1rem;">
              <div>
                <strong>Order: ${o.id}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">Placed: ${o.date}</div>
              </div>
              <span style="font-size:0.8rem; background:rgba(245,175,25,0.1); color:var(--accent-gold); padding:0.25rem 0.5rem; border-radius:4px; font-weight:bold; height:max-content; text-transform:uppercase;">
                ${o.status}
              </span>
            </div>
            <div style="font-size:0.9rem;">${o.item} // Total: $${o.price.toFixed(2)}</div>
            
            <div class="tracking-wrapper">
              <strong>Delivery Tracking</strong>
              <div class="tracking-steps">
                <div class="tracking-step done">
                  <div class="track-node">✓</div>
                  <span>Confirmed</span>
                </div>
                <div class="tracking-step ${o.tracking === 'done' || o.tracking === 'current' ? 'done' : ''}">
                  <div class="track-node">⚒</div>
                  <span>Printing</span>
                </div>
                <div class="tracking-step ${o.tracking === 'done' ? 'done' : (o.tracking === 'current' ? 'current' : '')}">
                  <div class="track-node">✈</div>
                  <span>Shipping</span>
                </div>
                <div class="tracking-step ${o.tracking === 'done' ? 'done' : ''}">
                  <div class="track-node">🏠</div>
                  <span>Delivered</span>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  if (tab === 'wishlist') {
    const list = state.products.filter(p => state.wishlist.includes(p.id));
    if (list.length === 0) {
      return `
        <h3>Wishlist</h3>
        <p class="subtitle">Your wishlist is currently empty.</p>
      `;
    }
    return `
      <h3>Wishlist</h3>
      <p class="subtitle">Items you have saved for later printing.</p>
      <div class="wishlist-grid">
        ${list.map(p => `
          <div class="wish-card">
            <div class="wish-card-img" style="background-image:url('${p.images[0]}');"></div>
            <div class="wish-card-body">
              <h4>${p.title}</h4>
              <span style="font-size:0.8rem; color:var(--accent-gold); font-weight:700;">$${p.startingPrice.toFixed(2)}</span>
            </div>
            <div class="wish-card-footer">
              <span class="wish-btn-remove" onclick="toggleWishlist('${p.id}')">&times;</span>
              <button onclick="addToCart('${p.id}')" class="wish-btn-add">Add to Cart</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (tab === 'settings') {
    return `
      <h3>Account Preferences</h3>
      <p class="subtitle">Configure website visual preferences and default filament settings.</p>
      <div style="display:flex; flex-direction:column; gap:1.25rem; margin-top:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
          <div>
            <strong>Brand Accents Mode</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">Toggle custom golden/amber brand theme.</div>
          </div>
          <button class="option-pill active">Gold Mode</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
          <div>
            <strong>Auto-download STL validations</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">Perform local tool path validation checks.</div>
          </div>
          <input type="checkbox" checked style="width:20px; height:20px;">
        </div>
      </div>
    `;
  }
}

// Configurator Interactive Mock logic
function renderCustomPrint() {
  return `
    <div class="custom-dashboard">
      <div class="dashboard-steps">
        <div class="step-badge active">
          <span class="badge-num">1</span>
          <span>Upload File</span>
        </div>
        <div class="step-badge">
          <span class="badge-num">2</span>
          <span>Parameters</span>
        </div>
        <div class="step-badge">
          <span class="badge-num">3</span>
          <span>Quote Payment</span>
        </div>
      </div>

      <div class="dashboard-layout">
        <div class="panel configurator-panel">
          <h3>Add Your 3D Model</h3>
          <p class="subtitle">Upload STL, 3MF, or OBJ files for rapid tooling estimation.</p>

          <div class="drop-zone" id="drop-zone">
            <div class="drop-icon">&#8682;</div>
            <p>Drag and drop your file here, or <span class="highlight">browse</span></p>
            <span class="file-limits">Maximum size: 50MB</span>
            <input type="file" id="file-input" style="display:none;" accept=".stl,.3mf,.obj">
          </div>

          <div class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label>Print Technology</label>
                <select id="print-tech">
                  <option value="FDM">Fused Deposition Modeling (FDM)</option>
                  <option value="SLA">Stereolithography (SLA)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Layer Resolution</label>
                <select id="print-res">
                  <option value="high">0.12mm (Fine)</option>
                  <option value="standard" selected>0.16mm (Standard)</option>
                  <option value="draft">0.20mm (Draft)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Material</label>
                <select id="print-material">
                  <option value="PLA">PLA (Matte Premium)</option>
                  <option value="PETG">PETG (Industrial Grade)</option>
                  <option value="ABS">ABS (Engineering Strong)</option>
                  <option value="TPU">TPU (Elastic Rubber)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Color</label>
                <select id="print-color">
                  <option value="matte-black">Matte Black</option>
                  <option value="belvia-gold">Belvia Gold</option>
                  <option value="white">White</option>
                </select>
              </div>
            </div>

            <button class="save-config-btn" onclick="requestQuote()">Estimate & Submit Print Job</button>
          </div>
        </div>

        <div class="panel history-panel">
          <h3>Print History & Active Jobs</h3>
          <div class="history-list">
            <div class="history-card">
              <div class="status-badge pending">Awaiting Confirmation</div>
              <h4>fox-decoration-base.stl</h4>
              <p>PLA // Matte Black // 120g</p>
              <div class="card-footer">
                <span>Ref: #728461</span>
                <span>$24.50</span>
              </div>
            </div>
            <div class="history-card completed">
              <div class="status-badge complete">Ready to Ship</div>
              <h4>keychain-custom-names.3mf</h4>
              <p>TPU // Belvia Gold // 15g</p>
              <div class="card-footer">
                <span>Ref: #569856</span>
                <span>$5.99</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBulkOrders() {
  return `
    <div class="bulk-container">
      <h2>Bulk Production Quotes</h2>
      <p class="subtitle">High volume keychains, custom business branding, or corporate merchandise.</p>
      <form class="bulk-form" onsubmit="event.preventDefault(); alert('Request Submitted! Our team will contact you within 12 hours.');">
        <div class="form-group">
          <label>Company/Event Name</label>
          <input type="text" required placeholder="Belvia Labs">
        </div>
        <div class="form-group">
          <label>Estimated Quantity</label>
          <input type="number" required min="50" value="100">
        </div>
        <div class="form-group">
          <label>Project Details / Specifications</label>
          <textarea required rows="5" placeholder="Specify color quantities, design parameters, and delivery timeline..."></textarea>
        </div>
        <button type="submit" class="primary-btn">Request Bulk Quotation</button>
      </form>
    </div>
  `;
}

// Interactive Story highlights player logic
window.openStoryViewer = function(idx) {
  state.activeStoryIndex = idx;
  const viewer = document.getElementById('stories-viewer');
  viewer.classList.add('active');
  renderStorySlide();
  
  if (state.storyInterval) clearInterval(state.storyInterval);
  let progress = 0;
  state.storyInterval = setInterval(() => {
    progress += 2;
    const progressFill = document.querySelector('.viewer-progress-fill');
    if (progressFill) progressFill.style.width = progress + '%';
    
    if (progress >= 100) {
      progress = 0;
      if (state.activeStoryIndex < socialStories.length - 1) {
        state.activeStoryIndex++;
        renderStorySlide();
      } else {
        closeStoryViewer();
      }
    }
  }, 100);
};

window.closeStoryViewer = function() {
  if (state.storyInterval) clearInterval(state.storyInterval);
  const viewer = document.getElementById('stories-viewer');
  if (viewer) viewer.classList.remove('active');
};

function renderStorySlide() {
  const story = socialStories[state.activeStoryIndex];
  const content = document.getElementById('viewer-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="viewer-progress-bar-row">
      ${socialStories.map((s, idx) => `
        <div class="viewer-progress-track">
          <div class="viewer-progress-fill" style="width: ${idx < state.activeStoryIndex ? '100%' : (idx === state.activeStoryIndex ? '0%' : '0%')};"></div>
        </div>
      `).join('')}
    </div>
    <div class="viewer-header">
      <div class="viewer-user-avatar">${story.initial}</div>
      <div class="viewer-user-details">
        <h4>${story.userName}</h4>
        <span>Verified Buyer</span>
      </div>
      <span class="viewer-close" onclick="closeStoryViewer()">&times;</span>
    </div>
    <div class="viewer-body">
      <div class="viewer-stars">${'★'.repeat(Math.floor(story.rating))}</div>
      <p class="viewer-text">"${story.text}"</p>
      <span class="viewer-product-tag">${story.tag}</span>
    </div>
  `;
}

// Interactive Review forms
window.addReview = function(productId) {
  const name = document.getElementById('review-name').value;
  const rating = parseInt(document.getElementById('review-rating').value);
  const comment = document.getElementById('review-comment').value;

  const product = state.products.find(p => p.id === productId);
  if (product) {
    if (!product.reviews) product.reviews = [];
    product.reviews.unshift({
      userName: name,
      rating,
      comment,
      verified: true,
      date: new Date().toISOString().split('T')[0]
    });
    product.reviewCount = product.reviews.length;
    alert('Thank you! Your verified review has been submitted.');
    router();
  }
};

// Wishlist trigger operations
window.toggleWishlist = function(productId) {
  const idx = state.wishlist.indexOf(productId);
  if (idx > -1) {
    state.wishlist.splice(idx, 1);
    alert('Item removed from wishlist.');
  } else {
    state.wishlist.push(productId);
    alert('Item added to wishlist.');
  }
  localStorage.setItem('belvia_wishlist', JSON.stringify(state.wishlist));
  router();
};

// E-commerce Action Logic
window.updateCartCount = function() {
  const count = state.cart.reduce((acc, item) => acc + item.quantity, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
};

window.addToCart = function(productId, color = null, material = null) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  if (!color) {
    const activeColorDot = document.querySelector('.color-dot.active');
    if (activeColorDot) {
      const classes = Array.from(activeColorDot.classList);
      color = classes.find(c => c !== 'color-dot' && c !== 'active') || 'belvia-gold';
    } else {
      color = product.colors[0] || 'belvia-gold';
    }
  }
  
  if (!material) {
    const activeMaterialPill = document.querySelector('.option-pill.active');
    material = activeMaterialPill ? activeMaterialPill.textContent.trim() : (product.materials[0] || 'PLA');
  }

  const existing = state.cart.find(c => c.id === productId && c.color === color && c.material === material);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ id: productId, color, material, quantity: 1 });
  }
  localStorage.setItem('belvia_cart', JSON.stringify(state.cart));
  updateCartCount();
  alert(`Added to cart: ${color} // ${material}`);
};

window.renderCartItems = function() {
  const container = document.getElementById('cart-items');
  const discountRow = document.getElementById('coupon-discount-row');
  const finalRow = document.getElementById('final-total-row');

  if (state.cart.length === 0) {
    container.innerHTML = `<p class="empty-msg">Your cart is currently empty.</p>`;
    document.getElementById('cart-subtotal').textContent = '$0.00';
    discountRow.style.display = 'none';
    finalRow.style.display = 'none';
    return;
  }
  
  let total = 0;
  container.innerHTML = state.cart.map(item => {
    const prod = state.products.find(p => p.id === item.id);
    if (!prod) return '';
    const itemTotal = prod.startingPrice * item.quantity;
    total += itemTotal;
    return `
      <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding: 0.5rem 0; border-bottom:1px solid var(--border-color);">
        <div>
          <h4 style="font-size:0.9rem;">${prod.title} ${prod.isPreOrder ? '<span style="color:#b8810e; font-size:0.7rem;">(Pre-Order)</span>' : ''}</h4>
          <p style="font-size:0.75rem; color:var(--text-secondary);">${item.material} // ${item.color} (x${item.quantity})</p>
        </div>
        <span style="font-size:0.85rem; font-weight:700;">$${itemTotal.toFixed(2)}</span>
      </div>
    `;
  }).join('');
  
  document.getElementById('cart-subtotal').textContent = `$${total.toFixed(2)}`;

  // Apply Coupon Calculations
  if (state.activeCoupon) {
    const discount = total * state.activeCoupon.factor;
    const finalTotal = total - discount;
    
    document.getElementById('cart-discount').textContent = `-$${discount.toFixed(2)}`;
    document.getElementById('cart-final-total').textContent = `$${finalTotal.toFixed(2)}`;
    
    discountRow.style.display = 'flex';
    finalRow.style.display = 'flex';
  } else {
    discountRow.style.display = 'none';
    finalRow.style.display = 'none';
  }
};

window.selectColor = function(element, color) {
  element.parentNode.querySelectorAll('.color-dot').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
};

window.selectMaterial = function(element, material) {
  element.parentNode.querySelectorAll('.option-pill').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
};

window.requestQuote = function() {
  alert('STL Model uploaded! Estimated Print Time: 2h 45m. Estimated Quote: $22.50. Request submitted.');
};

window.onload = init;
