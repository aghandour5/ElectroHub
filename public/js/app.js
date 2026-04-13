/**
 * ElectroHub — Global App Script
 * Handles: Auth state, Cart badge, Quick View, Wishlist,
 *          Featured Products swiper, Toast notifications.
 */

// ── TOAST UTILITY ────────────────────────────
function showToast(message, type = 'success') {
  const icon = type === 'success'
    ? '<i class="fas fa-check-circle" style="color:#4ade80;"></i>'
    : '<i class="fas fa-exclamation-circle" style="color:var(--coral);"></i>';
  const toast = $(`<div class="toast-msg ${type}">${icon} ${message}</div>`);
  $('#toast-wrap').append(toast);
  setTimeout(() => toast.remove(), 3500);
}
window.showToast = showToast;

// ── AUTH STATE ────────────────────────────────
function checkAuthState() {
  $.get('/api/auth/me').done(function (res) {
    if (res.isAuthenticated) {
      const user = res.user;
      const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      $('#nav-account')
        .attr('href', '/profile.html')
        .attr('title', 'My Account — ' + user.name)
        .html('<i class="fas fa-user"></i>');

      if (user.role === 'admin') {
        if ($('#admin-nav-btn').length === 0) {
          const adminBtn = $('<a href="/admin.html" class="icon-btn" id="admin-nav-btn" title="Admin Dashboard" style="color:var(--coral);"><i class="fas fa-tachometer-alt"></i></a>');
          $('#nav-account').before(adminBtn);
        }
      }
    } else {
      $('#nav-account').attr('href', '/login.html').attr('title', 'Sign In');
    }
  });
}
window.checkAuthState = checkAuthState;

// ── CART BADGE ────────────────────────────────
function updateCartBadge() {
  $.get('/api/cart').done(function (res) {
    const count = res.items ? res.items.length : 0;
    $('#nav-cart-count').text(count > 0 ? count : '');
  });
}
window.updateCartBadge = updateCartBadge;

// ── QUICK VIEW ────────────────────────────────
let currentQvProductId = null;
let currentQvQty = 1;

$(document).on('click', '.quick-view-btn', function () {
  const id = $(this).data('id');
  currentQvProductId = id;
  currentQvQty = 1;
  $('#qv-qty').text(1);

  $.get('/api/products/' + id).done(function (p) {
    $('#qv-img').attr('src', '/images/' + p.image_path);
    $('#qv-cat').text(p.category_name || '');
    $('#qv-name').text(p.name);
    $('#qv-price').text('$' + parseFloat(p.price).toFixed(2));
    $('#qv-desc').text(p.description || 'Premium device crafted for performance and longevity.');
    $('#qv-stock').text(p.stock > 0 ? p.stock + ' in stock' : 'Out of stock');
    $('#qv-add-btn').data('id', p.id).prop('disabled', p.stock === 0);
    $('#quickViewModal').modal('show');
  }).fail(() => showToast('Could not load product details.', 'error'));
});

$(document).on('click', '#qv-qty-plus',  function () { if (currentQvQty < 99) { currentQvQty++; $('#qv-qty').text(currentQvQty); } });
$(document).on('click', '#qv-qty-minus', function () { if (currentQvQty > 1)  { currentQvQty--; $('#qv-qty').text(currentQvQty); } });

$(document).on('click', '#qv-add-btn', function () {
  const id = $(this).data('id') || currentQvProductId;
  addToCart(id, currentQvQty, function () {
    $('#quickViewModal').modal('hide');
  });
});

// ── ADD TO CART ───────────────────────────────
function addToCart(productId, qty, onSuccess) {
  $.ajax({
    url: '/api/cart/add', type: 'POST', contentType: 'application/json',
    data: JSON.stringify({ product_id: productId, quantity: qty || 1 }),
    success: function (res) {
      updateCartBadge();
      showToast('Product added to cart! 🛒', 'success');
      if (typeof onSuccess === 'function') onSuccess(res);
    },
    error: function (err) {
      showToast(err.responseJSON?.error || 'Failed to add to cart.', 'error');
    }
  });
}
window.addToCart = addToCart;

$(document).on('click', '.add-to-cart-btn', function (e) {
  e.stopPropagation();
  const id = $(this).data('id');
  if (id) addToCart(id, 1);
});

// ── WISHLIST TOGGLE ───────────────────────────
$(document).on('click', '.wishlist-toggle, #qv-wishlist-btn', function (e) {
  e.stopPropagation();
  const btn = $(this);
  const icon = btn.find('i');
  const isActive = icon.hasClass('fas');
  icon.toggleClass('far fas');
  btn.toggleClass('active');
  showToast(isActive ? 'Removed from wishlist.' : 'Added to wishlist! ❤️', isActive ? 'error' : 'success');
});

// ── FEATURED PRODUCTS (Homepage Swiper) ───────
function loadFeaturedProducts() {
  const container = $('#featured-products-wrap');
  if (!container.length) return;

  container.html('<div class="swiper-slide text-center py-5"><div class="spinner-border" style="color:var(--coral);"></div></div>');

  $.get('/api/products').done(function (products) {
    if (!products.length) {
      container.html('<div class="swiper-slide text-center text-muted py-5">No products found.</div>');
      return;
    }
    let html = '';
    products.slice(0, 8).forEach(p => {
      const badge = (p.is_new || p.is_featured) ? '<span class="product-badge">NEW</span>' : '';
      html += `
      <div class="swiper-slide">
        <div class="product-card h-100">
          <div class="product-img-box">
            ${badge}
            <img src="/images/${p.image_path}" alt="${p.name}" draggable="false">
            <div class="product-hover-actions">
              <button class="prod-act-btn add-to-cart-btn" data-id="${p.id}" title="Add to cart"><i class="fas fa-shopping-cart"></i></button>
              <button class="prod-act-btn quick-view-btn" data-id="${p.id}" title="Quick view"><i class="fas fa-arrow-right" style="transform:rotate(-45deg);"></i></button>
            </div>
          </div>
          <div class="product-body">
            <div class="product-header">
              <div class="product-name" title="${p.name}"><a href="#">${p.name}</a></div>
              <div class="product-price">$${parseFloat(p.price).toFixed(2)}</div>
            </div>
            <div class="product-footer">
              <div class="product-category">${p.category_name || ''}</div>
              <div class="product-swatches"><i class="fas fa-circle"></i> <i class="fas fa-circle" style="color:var(--muted-lt);"></i> <i class="far fa-circle" style="color:var(--muted-lt);"></i></div>
            </div>
          </div>
        </div>
      </div>`;
    });
    container.html(html);

    new Swiper('.featured-swiper', {
      slidesPerView: 1,
      spaceBetween: 20,
      allowTouchMove: false,   // disable drag/swipe
      simulateTouch: false,    // prevent mouse-drag simulation
      pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: true },
      autoplay: { delay: 4000, disableOnInteraction: false },
      breakpoints: {
        576: { slidesPerView: 2 },
        768: { slidesPerView: 3 },
        1200: { slidesPerView: 4 }
      }
    });
  }).fail(() => {
    container.html('<div class="swiper-slide text-muted py-4">Could not load products.</div>');
  });
}

// ── CATEGORIES ────────────────────────────────
function loadCategories() {
  const dropdowns = $('.search-cat-dropdown');
  const sidebar = $('#sidebar-categories');

  $.get('/api/products/categories/all').done(function (categories) {
    // 1. Fill header dropdowns
    if (dropdowns.length) {
      let dropHtml = '<option value="">All Categories</option>';
      categories.forEach(cat => {
        dropHtml += `<option value="${cat.slug}">${cat.name}</option>`;
      });
      dropdowns.html(dropHtml);
    }

    // 2. Fill sidebar (Shop page)
    if (sidebar.length) {
      let sideHtml = `
        <div class="form-check">
          <input class="form-check-input cat-filter" type="checkbox" id="cat-all" value="" checked>
          <label class="form-check-label d-flex justify-content-between" for="cat-all">All <span class="filter-count">—</span></label>
        </div>`;
      categories.forEach(cat => {
        sideHtml += `
        <div class="form-check">
          <input class="form-check-input cat-filter" type="checkbox" id="cat-${cat.slug}" value="${cat.slug}">
          <label class="form-check-label d-flex justify-content-between" for="cat-${cat.slug}">${cat.name} <span class="filter-count">—</span></label>
        </div>`;
      });
      sidebar.html(sideHtml);

      // Trigger pre-filter if URL has category
      const urlParams = new URLSearchParams(window.location.search);
      const urlCat = urlParams.get('category') || '';
      if (urlCat) {
        $('.cat-filter[value="' + urlCat + '"]').prop('checked', true);
        $('#cat-all').prop('checked', false);
        // Dispatch change event to trigger shop filters
        $('.cat-filter[value="' + urlCat + '"]').trigger('change');
      }
    }

    // 3. Fill footer categories
    const footerCats = $('#footer-categories');
    if (footerCats.length) {
      let footerHtml = '<li><a href="shop.html">All Products</a></li>';
      categories.forEach(cat => {
        footerHtml += `<li><a href="shop.html?category=${cat.slug}">${cat.name}</a></li>`;
      });
      footerCats.html(footerHtml);
    }
  });
}
window.loadCategories = loadCategories;

// ── BACK TO TOP ─────────────────────────────
function initBackToTop() {
  const btn = $('<button id="back-to-top" title="Go to top"><i class="fas fa-arrow-up"></i></button>');
  $('body').append(btn);

  $(window).on('scroll', function () {
    if ($(window).scrollTop() > 400) btn.addClass('show');
    else btn.removeClass('show');
  });

  btn.on('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── DYNAMIC COPYRIGHT ─────────────────────────
function updateCopyrightYear() {
  const currentYear = new Date().getFullYear();
  $('.footer-bottom span:first').html(`&copy; ${currentYear} ElectroHub &middot; Ali Ghandour. All rights reserved.`);
}

// ── BURGER MENU ───────────────────────────────
function initBurgerMenu() {
  const burgerBtn   = document.getElementById('burger-btn');
  const drawer      = document.getElementById('mobile-drawer');
  const overlay     = document.getElementById('mobile-drawer-overlay');
  const closeBtn    = document.getElementById('drawer-close-btn');

  if (!burgerBtn || !drawer) return; // not on a page with the drawer

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    burgerBtn.classList.add('open');
    // iOS-safe scroll lock: freeze body at current position
    const scrollY = window.scrollY;
    document.body.style.top = '-' + scrollY + 'px';
    document.body.classList.add('drawer-open');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    burgerBtn.classList.remove('open');
    // Restore scroll position
    const scrollY = parseInt(document.body.style.top || '0') * -1;
    document.body.classList.remove('drawer-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
  }

  burgerBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
}

// ── INIT ──────────────────────────────────────
$(document).ready(function () {
  checkAuthState();
  updateCartBadge();
  loadFeaturedProducts();
  loadCategories();
  initBackToTop();
  updateCopyrightYear();
  initBurgerMenu();
});
