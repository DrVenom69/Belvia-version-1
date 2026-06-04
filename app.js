// Global Application State
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('belvia_cart')) || [],
  customModel: null
};

// Routing Table mapping hashes to template render functions
const routes = {
  '#home': renderHome,
  '#shop': renderShop,
  '#product-details': renderProductDetails,
  '#custom-print': renderCustomPrint,
  '#bulk-orders': renderBulkOrders
};

// Initialize Application
async function init() {
  await loadProducts();
  window.addEventListener('hashchange', router);
  router();
  initCartUI();
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

// Router Swapper Function
function router() {
  const hash = window.location.hash || '#home';
  const cleanHash = hash.split('?')[0];
  const renderFn = routes[cleanHash] || renderHome;

  const viewOutlet = document.getElementById('app-router-view');
  
  // Apply route transitions
  viewOutlet.classList.remove('fade-in');
  void viewOutlet.offsetWidth; // Trigger reflow
  
  // Render layout content
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
    splineContainer.style.opacity = '0.05'; // subtle watermark background
    splineContainer.style.transform = 'translate(-50%, -45%) scale(0.8)';
  }
}

// Cart Drawer View Controller
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

// View Renderer Functions
function renderHome() {
  return `
    <section class="hero-text-wrap">
      <h1>PRECISION FABRICATION<br><span class="highlight">LUXURY DIMENSIONS</span></h1>
      <p class="subtitle">Premium customized prints, custom design tools, and bulk additive manufacturing.</p>
      <div class="hero-actions">
        <a href="#shop" class="primary-btn">Explore Catalog</a>
        <a href="#custom-print" class="secondary-btn">Custom Print Estimator</a>
      </div>
    </section>

    <!-- Categories Grid -->
    <section class="section-wrap">
      <h2 class="section-title">PRODUCT CATEGORIES</h2>
      <div class="categories-grid">
        ${['Keychains', 'Home Decor', 'Desk Accessories', 'Gaming Accessories', 'Figures & Collectibles', 'Functional Prints'].map(cat => `
          <div class="category-card" onclick="window.location.hash = '#shop?cat=${encodeURIComponent(cat)}'">
            <h3>${cat}</h3>
            <span>Explore Options &rarr;</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderShop(hash) {
  const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const filterCat = params.get('cat');
  
  const filtered = filterCat 
    ? state.products.filter(p => p.category === filterCat)
    : state.products;

  return `
    <div class="shop-header">
      <h2>${filterCat ? filterCat.toUpperCase() : 'BELVIA CATALOG'}</h2>
      <p class="subtitle">MakerWorld-inspired print designs optimized for commercial orders.</p>
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
              <span class="price">From $${p.startingPrice.toFixed(2)}</span>
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

function renderProductDetails(hash) {
  const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const id = params.get('id');
  const product = state.products.find(p => p.id === id);

  if (!product) return `<p>Product not found.</p>`;

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
              ${product.colors.map(col => `
                <button class="color-dot ${col}" onclick="selectColor(this, '${col}')"></button>
              `).join('')}
            </div>
          </div>

          <div class="config-group">
            <label>Material Specification</label>
            <div class="material-options">
              ${product.materials.map(mat => `
                <button class="option-pill" onclick="selectMaterial(this, '${mat}')">${mat}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="detail-pricing">
          <div class="price-breakdown">
            <span>Base Cost: $${product.startingPrice}</span>
            <span>Est. Print Time: ${product.printTimeMinutes} min</span>
          </div>
          <button onclick="addToCart('${product.id}')" class="primary-btn">ADD TO CART</button>
        </div>
      </div>
    </div>
  `;
}

function renderCustomPrint() {
  return `
    <!-- RYVOP Inspired Step-by-Step Custom Dashboard -->
    <div class="custom-dashboard">
      <!-- Steps Navigation -->
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
        <!-- Configuration Control Panel -->
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

        <!-- History/Sidebar -->
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

// State Action Logic
function updateCartCount() {
  const count = state.cart.reduce((acc, item) => acc + item.quantity, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
}

function addToCart(productId, color = 'belvia-gold', material = 'PLA') {
  const existing = state.cart.find(c => c.id === productId && c.color === color && c.material === material);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ id: productId, color, material, quantity: 1 });
  }
  localStorage.setItem('belvia_cart', JSON.stringify(state.cart));
  updateCartCount();
  alert('Added to cart!');
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  if (state.cart.length === 0) {
    container.innerHTML = `<p class="empty-msg">Your cart is currently empty.</p>`;
    document.getElementById('cart-subtotal').textContent = '$0.00';
    return;
  }
  
  let total = 0;
  container.innerHTML = state.cart.map(item => {
    const prod = state.products.find(p => p.id === item.id);
    if (!prod) return '';
    const itemTotal = prod.startingPrice * item.quantity;
    total += itemTotal;
    return `
      <div class="cart-item">
        <div>
          <h4>${prod.title}</h4>
          <p>${item.material} // ${item.color} (x${item.quantity})</p>
        </div>
        <span>$${itemTotal.toFixed(2)}</span>
      </div>
    `;
  }).join('');
  
  document.getElementById('cart-subtotal').textContent = `$${total.toFixed(2)}`;
}

// Configurator Interactive Mock logic
function requestQuote() {
  alert('STL Model uploaded! Estimated Print Time: 2h 45m. Estimated Quote: $22.50. Request submitted.');
}

window.onload = init;
