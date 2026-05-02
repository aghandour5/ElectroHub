/**
 * ElectroHub — Global App Script
 * Handles: Auth state, Cart badge, Quick View, Wishlist,
 *          Featured Products swiper, Toast notifications.
 */

// ── TOAST UTILITY ────────────────────────────
function showToast(message, type = 'success') {
  // Clear any existing toasts to prevent stacking
  $('#toast-wrap').empty();

  const icon = type === 'success' // Choose icon based on type
    ? '<i class="fas fa-check-circle" style="color:#10b981;"></i>' // Green check for success
    : '<i class="fas fa-exclamation-circle" style="color:var(--coral);"></i>'; // Red exclamation for error

  const toastHtml = `
    <div class="toast-msg ${type}">
      <div class="toast-content">
        ${icon}
        <span>${message}</span>
      </div>
      <i class="fas fa-times toast-close"></i>
    </div>
  `;

  const toast = $(toastHtml);
  $('#toast-wrap').append(toast);

  // Close button functionality
  toast.find('.toast-close').on('click', function () {
    toast.addClass('hiding');
    setTimeout(() => toast.remove(), 400);
  });

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (toast.parent().length) {
      toast.addClass('hiding');
      setTimeout(() => toast.remove(), 400);
    }
  }, 4000);
}
window.showToast = showToast; // Expose globally for use in other scripts

// ── IMAGE UTILITY ─────────────────────────────
function getImageUrl(path) {
  if (!path) return '/images/placeholder.png';
  if (path.startsWith('http')) return path; // Allow absolute URLs (e.g., from cloud storage)
  return '/images/' + path;
}
window.getImageUrl = getImageUrl;

function getRatingHtml(reviewsData) {
  let html = '';
  const reviews = reviewsData || [];
  const count = reviews.length;
  if (count > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / count; // Calculate average rating, initially s=0, r iterates through reviews
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(avg)) html += '<i class="fas fa-star"></i>';
      else if (i === Math.ceil(avg) && avg % 1 !== 0) html += '<i class="fas fa-star-half-alt"></i>';
      else html += '<i class="far fa-star"></i>';
    }
    html += `<span class="text-muted ms-2">(${count})</span>`;
  } else {
    for (let i = 1; i <= 5; i++) html += '<i class="far fa-star"></i>';
    html += `<span class="text-muted ms-2">(0)</span>`;
  }
  return html;
}
window.getRatingHtml = getRatingHtml;

function formatOrderId(id) {
  return 'ORD-' + String(id).padStart(4, '0'); // Example: 23 becomes ORD-0023
}
window.formatOrderId = formatOrderId;

// ── AUTH STATE ────────────────────────────────
function checkAuthState() {
  $.get('/api/auth/me').done(function (res) {
    const loginBtn = $('#nav-account-login');
    const userBtn = $('#nav-account-user');

    // Remove admin button if present
    $('#admin-nav-btn').remove();

    if (res.isAuthenticated) {
      const user = res.user;
      localStorage.setItem('electrohub_user', JSON.stringify(user));
      $('html').addClass('is-logged-in');

      userBtn
        .attr('title', 'My Account — ' + user.name)
        .find('i').attr('class', 'fas fa-user');

      if (user.role === 'admin') {
        const adminBtn = $('<a href="/admin.html" class="icon-btn" id="admin-nav-btn" title="Admin Dashboard" style="font-size:1.3rem; color:var(--coral); text-decoration:none; display:flex; align-items:center; justify-content:center; width:40px; height:40px; margin-right:8px;"><i class="fas fa-tachometer-alt"></i></a>');
        userBtn.before(adminBtn);
      }

      loadNotifications();

      // Mobile Drawer
      const mobileLogin = $('#mobile-nav-auth-login');
      const mobileUser = $('#mobile-nav-auth-user');
      if (mobileLogin.length) {
        // Classes handled by CSS html.is-logged-in
      }
    } else {
      localStorage.removeItem('electrohub_user');
      $('html').removeClass('is-logged-in');
      
      // Mobile Drawer
      const mobileLogin = $('#mobile-nav-auth-login');
      const mobileUser = $('#mobile-nav-auth-user');
    }
  });
}
window.checkAuthState = checkAuthState;

function loadNotifications() {
  $.get('/api/notifications').done(function (res) {
    const unread = res.unreadCount || 0;
    localStorage.setItem('electrohub_unread_count', unread);
    updateNotificationIcon(unread);
  }).fail(function () {
    const cached = localStorage.getItem('electrohub_unread_count') || 0;
    updateNotificationIcon(cached);
  });
}
window.loadNotifications = loadNotifications;

function updateNotificationIcon(unread) {
  const badge = $('#nav-notifications-count');
  if (badge.length) {
    badge.text(unread).css('display', 'flex'); // Show badge if it exists, even if count is 0 (to indicate "no notifications")
  }
  
  const onNotificationPage = window.location.pathname.includes('profile.html') && window.location.hash === '#notifications';
  const icon = $('#nav-notifications-btn i');
  
  if (unread > 0 || onNotificationPage) {
    icon.removeClass('far').addClass('fas text-coral'); // far is outline, fas is solid
    $('html').addClass('has-notifications');
  } else {
    icon.removeClass('fas text-coral').addClass('far');
    $('html').removeClass('has-notifications');
  }
}
window.addEventListener('hashchange', loadNotifications); // Reload notifications when navigating to/from notifications section in profile

// ── CART STATE & SYNC ─────────────────────────
window.globalCart = [];

function updateCartBadge() {
  $.get('/api/cart').done(function (res) {
    const items = res.items || [];
    window.globalCart = items;
    const count = items.length;
    localStorage.setItem('electrohub_cart_count', count);
    updateCartIcon(count);

    // Trigger a global event so other components (like shop grid) can re-render if needed
    $(document).trigger('cartUpdated', [window.globalCart]);
  });
}

function updateCartIcon(count) {
  $('#nav-cart-count').text(count).css('display', 'flex');

  const onCartPage = window.location.pathname.includes('cart.html');
  const icon = $('a[href="cart.html"] i');

  if (count > 0 || onCartPage) {
    icon.addClass('fas text-coral').removeClass('far icon-stroke');
    $('html').addClass('has-cart-items');
  } else {
    icon.addClass('fas icon-stroke').removeClass('far text-coral');
    $('html').removeClass('has-cart-items');
  }

  // Update Mobile Drawer
  const mobileCartLink = $('#mobile-nav-cart');
  if (mobileCartLink.length) {
    mobileCartLink.html(`<i class="fas ${count > 0 || onCartPage ? 'text-coral' : 'icon-stroke'} fa-shopping-bag"></i> Cart (${count})`);
  }
}
window.updateCartBadge = updateCartBadge;

function getCartButtonHtml(productId, stock = 1) {
  const item = window.globalCart.find(i => i.product_id === parseInt(productId));
  if (item) {
    return `
      <div class="qty-ctrl-mini" data-id="${productId}" style="display:flex; align-items:center; background:var(--bg-soft); border-radius:30px; padding:4px; gap:12px; border:1px solid var(--border);">
        <button class="btn-qty-mini minus" style="width:32px; height:32px; border-radius:50%; border:none; background:#fff; color:var(--charcoal); display:flex; align-items:center; justify-content:center; font-weight:bold; box-shadow:var(--shadow-sm);"><i class="fas fa-minus" style="font-size:0.7rem;"></i></button>
        <span class="qty-val" style="font-weight:700; font-size:0.95rem; min-width:14px; text-align:center;">${item.quantity}</span>
        <button class="btn-qty-mini plus" style="width:32px; height:32px; border-radius:50%; border:none; background:#0062FF; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; box-shadow:var(--shadow-sm);"><i class="fas fa-plus" style="font-size:0.7rem;"></i></button>
      </div>`;
  }
  
  if (stock <= 0) {
    return `
      <button class="btn btn-secondary rounded-pill px-3 py-2 disabled" style="font-size:0.75rem; background:#f1f5f9; color:#94a3b8; border:1px solid #e2e8f0; cursor:not-allowed; height:44px; display:flex; align-items:center; justify-content:center; font-weight:700;" disabled>
        Out of Stock
      </button>`;
  }

  return `
    <button class="btn btn-primary rounded-circle shadow-none add-to-cart-btn" data-id="${productId}" style="width:44px; height:44px; display:flex; align-items:center; justify-content:center; background:#0062FF; border:none;">
        <i class="fas fa-shopping-cart"></i>
    </button>`;
}
window.getCartButtonHtml = getCartButtonHtml;

// ── QUICK VIEW ────────────────────────────────
let currentQvProductId = null;
let currentQvQty = 1;

$(document).on('click', '.quick-view-btn', function () {
  // Walk up to the nearest element carrying data-id (handles clicks on child <i> stars)
  const $trigger = $(this).closest('[data-id]').length ? $(this).closest('[data-id]') : $(this);
  const id = $trigger.data('id');
  const showReviewsOnOpen = $trigger.data('show-reviews') === true || String($trigger.data('show-reviews')) === 'true';
  if (!id) return; // guard: nothing to open
  currentQvProductId = id;
  currentQvQty = 1;
  $('#qv-qty').text(1);

  // Show modal immediately with loader
  const modal = $('#quickViewModal');
  const loader = $('#qv-loader');
  const content = $('#qv-content-wrap');

  loader.removeClass('hidden');
  content.removeClass('visible');
  modal.modal('show');

  // Store flag for use inside the $.get callback
  $(document).data('qv-show-reviews', showReviewsOnOpen);

  $.get('/api/products/' + id).done(function (p) {
    $('#qv-img').attr('src', getImageUrl(p.image_path));
    $('#qv-cat').text(p.category_name || '');
    $('#qv-name').text(p.name);
    $('#qv-price').text('$' + parseFloat(p.price).toFixed(2));
    $('#qv-desc').text(p.description || 'Premium device crafted for performance and longevity.');
    $('#qv-stock').text(p.stock > 0 ? p.stock + ' in stock' : 'Out of stock');

    // Quantity controls in modal
    const cartWrapper = $('#qv-cart-btn-wrapper');
    if (cartWrapper.length) {
      cartWrapper.html(getCartButtonHtml(p.id, p.stock));
    }

    // Initialize Wishlist Button
    const isWished = isInWishlist(p.id);
    $('#qv-wishlist-btn').data('id', p.id).toggleClass('active', isWished);
    $('#qv-wishlist-btn i').attr('class', isWished ? 'fas fa-heart' : 'far fa-heart');

    // Render Specs
    const specsContainer = $('#qv-specs-container');
    const specsGrid = $('#qv-specs-grid');
    if (p.specs && Object.keys(p.specs).length > 0) {
      let specsHtml = '';
      for (const [key, value] of Object.entries(p.specs)) {
        specsHtml += `
          <div class="spec-item">
            <span style="display:block;color:var(--muted);font-size:.7rem;font-weight:600;text-transform:uppercase;">${key}</span>
            <span style="color:var(--charcoal);font-weight:500;">${value}</span>
          </div>`;
      }
      specsGrid.html(specsHtml);
      specsContainer.show();
    } else {
      specsContainer.hide();
    }

    // Render Product-Specific Reviews
    const reviewsContainer = $('#qv-reviews-container');
    const reviewsList = $('#qv-reviews-list');
    const toggleBtn = $('#qv-toggle-reviews');
    const qvRatingStars = $('#qv-rating-stars');

    reviewsContainer.hide(); // Reset view

    if (p.reviews_data && p.reviews_data.length > 0) {
      // Calculate Average Rating
      const avgRating = p.reviews_data.reduce((sum, rev) => sum + rev.rating, 0) / p.reviews_data.length;
      let globalStars = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(avgRating)) {
          globalStars += '<i class="fas fa-star" style="color:#f59e0b;"></i>';
        } else if (i === Math.ceil(avgRating) && avgRating % 1 !== 0) {
          globalStars += '<i class="fas fa-star-half-alt" style="color:#f59e0b;"></i>';
        } else {
          globalStars += '<i class="far fa-star" style="color:#f59e0b;"></i>';
        }
      }
      qvRatingStars.html(globalStars);
      const reviewWord = p.reviews_data.length === 1 ? 'review' : 'reviews';
      toggleBtn.text(`(${p.reviews_data.length} ${reviewWord})`).show();

      let reviewsHtml = '';
      p.reviews_data.forEach(rev => {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
          stars += `<i class="${i <= rev.rating ? 'fas' : 'far'} fa-star" style="color:var(--coral); font-size:.7rem;"></i>`;
        }
        reviewsHtml += `
          <div class="mb-3 border-bottom pb-2">
            <div class="d-flex justify-content-between mb-1">
              <strong style="font-size:.85rem;">${rev.author}</strong>
              <div class="stars-mini">${stars}</div>
            </div>
            <p class="text-muted mb-0" style="font-size:.8rem; line-height:1.4;">${rev.text}</p>
          </div>
        `;
      });
      reviewsList.html(reviewsHtml);
    } else {
      qvRatingStars.html('<i class="far fa-star" style="color:var(--muted);"></i>'.repeat(5));
      toggleBtn.hide();
    }

    // Toggle Reviews Section
    const toggleReviews = function () {
      if (!reviewsContainer.is(':visible')) {
        reviewsContainer.slideDown();
        setTimeout(() => {
          reviewsContainer[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
      } else {
        reviewsContainer.slideUp();
      }
    };

    toggleBtn.off('click').on('click', toggleReviews);
    $('#qv-rating-stars').css('cursor', 'pointer').off('click').on('click', toggleReviews);

    // Auto-show reviews if triggered from star click on product card
    if ($(document).data('qv-show-reviews')) {
      $(document).data('qv-show-reviews', false);
      setTimeout(toggleReviews, 600);
    }

    // Check Review Eligibility
    const reviewFormContainer = $('#qv-review-form-container');
    reviewFormContainer.hide();

    $.get(`/api/products/${id}/review-eligibility`).done(function (res) {
      if (res.canReview) {
        reviewFormContainer.fadeIn();
        initReviewForm(id);
      }
    });

    // Data ready: Hide loader, Show content
    setTimeout(() => {
      loader.addClass('hidden');
      content.addClass('visible');
    }, 100);

  }).fail(() => {
    modal.modal('hide');
    showToast('Could not load product details.', 'error');
  });
});

// Global Review Rating State
let selectedReviewRating = 5;

$(document).on('mouseover', '.qv-review-star-input', function () {
  const val = parseInt($(this).attr('data-val'));
  $('.qv-review-star-input').each(function () {
    const starVal = parseInt($(this).attr('data-val'));
    if (starVal <= val) {
      $(this).addClass('fas').removeClass('far');
    } else {
      $(this).addClass('far').removeClass('fas');
    }
  });
});

$(document).on('mouseout', '.qv-review-star-input', function () {
  $('.qv-review-star-input').each(function () {
    const starVal = parseInt($(this).attr('data-val'));
    if (starVal <= selectedReviewRating) {
      $(this).addClass('fas').removeClass('far');
    } else {
      $(this).addClass('far').removeClass('fas');
    }
  });
});

$(document).on('click', '.qv-review-star-input', function () {
  selectedReviewRating = $(this).data('val');
  showToast(`Rating set to ${selectedReviewRating} stars`);
});

function initReviewForm(productId) {
  selectedReviewRating = 5; // Reset to default
  $('.qv-review-star-input').each(function () {
    $(this).toggleClass('fas', $(this).data('val') <= 5).toggleClass('far', $(this).data('val') > 5);
  });

  $('#qv-submit-review').off('click').on('click', function () {
    const text = $('#qv-review-text').val().trim();
    if (!text) return showToast('Please write a comment.', 'error');

    const btn = $(this);
    btn.prop('disabled', true).text('Submitting...');

    $.ajax({
      url: `/api/products/${productId}/review`,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ rating: selectedReviewRating, text }),
      success: function (res) {
        showToast('Thank you for your review! ⭐');
        // Permanently hide the review form
        $('#qv-review-form-container').fadeOut(400, function () {
          $('#qv-review-text').val('');
          $(this).remove(); // Remove from DOM so it can't reappear
        });
        // Reload just the reviews list for this product without re-opening modal
        setTimeout(() => {
          $.get('/api/products/' + productId).done(function (p) {
            if (!p || !p.reviews_data || !p.reviews_data.length) return;
            let rHtml = '';
            p.reviews_data.forEach(rev => {
              let stars = '';
              for (let i = 1; i <= 5; i++) {
                stars += `<i class="${i <= rev.rating ? 'fas' : 'far'} fa-star" style="color:var(--coral); font-size:.7rem;"></i>`;
              }
              rHtml += `
                <div class="mb-3 border-bottom pb-2">
                  <div class="d-flex justify-content-between mb-1">
                    <strong style="font-size:.85rem;">${rev.author}</strong>
                    <div class="stars-mini">${stars}</div>
                  </div>
                  <p class="text-muted mb-0" style="font-size:.8rem; line-height:1.4;">${rev.text}</p>
                </div>`;
            });
            $('#qv-reviews-list').html(rHtml);
            const rWord = p.reviews_data.length === 1 ? 'review' : 'reviews';
            $('#qv-toggle-reviews').text(`(${p.reviews_data.length} ${rWord})`).show();
            // Auto-show the reviews section
            $('#qv-reviews-container').slideDown();
          });
        }, 600);
      },
      error: function (err) {
        showToast(err.responseJSON?.error || 'Failed to submit review.', 'error');
      },
      complete: function () {
        btn.prop('disabled', false).text('Submit Review');
      }
    });
  });
}

$(document).on('click', '#qv-qty-plus', function () { if (currentQvQty < 99) { currentQvQty++; $('#qv-qty').text(currentQvQty); } });
$(document).on('click', '#qv-qty-minus', function () { if (currentQvQty > 1) { currentQvQty--; $('#qv-qty').text(currentQvQty); } });

$(document).on('click', '#qv-add-btn', function () {
  const id = $(this).data('id') || currentQvProductId;
  addToCart(id, currentQvQty, function () {
    $('#quickViewModal').modal('hide');
  });
});

// ── GLOBAL MODAL SCROLL LOCK ──────────────────
$(document).on('show.bs.modal', '.modal', function () {
  const scrollY = window.scrollY;
  document.body.style.top = `-${scrollY}px`; // Lock body scroll by fixing its position and offsetting to current scroll
  document.body.classList.add('modal-open-lock'); // This class should set overflow:hidden and position:fixed to prevent background scrolling while modal is open
});

$(document).on('hidden.bs.modal', '.modal', function () {
  const scrollY = parseInt(document.body.style.top || '0') * -1;
  document.body.classList.remove('modal-open-lock');
  document.body.style.top = '';

  // Disable smooth scrolling temporarily to prevent "jumping"
  const html = document.documentElement;
  const originalScroll = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';

  window.scrollTo(0, scrollY);

  // Restore original behavior
  setTimeout(() => {
    html.style.scrollBehavior = originalScroll;
  }, 10);
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
  if (id) {
    addToCart(id, 1, () => {
      // Re-render the container of this button
      const parent = $(this).parent();
      parent.html(getCartButtonHtml(id));
    });
  }
});

$(document).on('click', '.btn-qty-mini', function (e) {
  e.stopPropagation();
  const ctrl = $(this).closest('.qty-ctrl-mini');
  const id = ctrl.data('id');
  const valSpan = ctrl.find('.qty-val');
  let currentQty = parseInt(valSpan.text());

  if ($(this).hasClass('plus')) {
    currentQty++;
  } else {
    currentQty--;
  }

  $.ajax({
    url: '/api/cart/update',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ product_id: id, quantity: currentQty }),
    success: function () {
      updateCartBadge();
      if (currentQty <= 0) {
        ctrl.parent().html(getCartButtonHtml(id));
      } else {
        valSpan.text(currentQty);
      }
    }
  });
});

// ── WISHLIST TOGGLE ───────────────────────────
function isInWishlist(id) {
  const w = getStoredWishlist();
  return w.some(item => String(item) === String(id));
}
window.isInWishlist = isInWishlist;

function getStoredWishlist() {
  let w = [];
  try {
    w = JSON.parse(localStorage.getItem('electrohub_wishlist') || '[]');
  } catch (error) {
    w = [];
  }

  if (!Array.isArray(w)) w = [];
  const cleanW = [...new Set(w.map(String))]
    .map(item => item.trim())
    .filter(item => item && item !== 'null' && item !== 'undefined');

  localStorage.setItem('electrohub_wishlist', JSON.stringify(cleanW));
  return cleanW;
}
window.getStoredWishlist = getStoredWishlist;

function updateWishlistBadge() {
  const w = getStoredWishlist();
  const count = w.length;
  const badge = $('#nav-wishlist-count');
  badge.text(count).css('display', 'flex');
  
  const onWishlistPage = window.location.pathname.includes('wishlist.html');
  const icon = $('a[href="wishlist.html"] i');
  if (count > 0 || onWishlistPage) {
    icon.removeClass('far').addClass('fas text-coral');
    $('html').addClass('has-wishlist-items');
  } else {
    icon.removeClass('fas text-coral').addClass('far');
    $('html').removeClass('has-wishlist-items');
  }
}
window.updateWishlistBadge = updateWishlistBadge;

$(document).on('click', '.wishlist-toggle, #qv-wishlist-btn', function (e) {
  e.stopPropagation();
  const btn = $(this);
  const id = btn.data('id');
  if (!id) return; // Prevent errors if id is missing

  let w = getStoredWishlist();
  const icon = btn.find('i');
  const isActive = w.some(item => String(item) === String(id));

  if (isActive) {
    w = w.filter(item => String(item) !== String(id));
    icon.removeClass('fas text-coral').addClass('far');
    btn.removeClass('active');
    showToast('Removed from wishlist.', 'error');
  } else {
    w.push(id);
    icon.removeClass('far').addClass('fas text-coral');
    btn.addClass('active');
    showToast('Added to wishlist! ❤️', 'success');
  }
  // Normalize to unique strings and filter out invalid values
  const cleanW = [...new Set(w.map(String))].filter(item => item && item !== 'null' && item !== 'undefined');
  localStorage.setItem('electrohub_wishlist', JSON.stringify(cleanW));
  updateWishlistBadge();
});

// ── FEATURED PRODUCTS (Homepage Swiper) ───────
function loadFeaturedProducts() {
  const container = $('#featured-products-wrap');
  if (!container.length) return; // Guard: No container found, likely not on homepage

  container.html('<div class="swiper-slide text-center py-5"><div class="spinner-border" style="color:var(--coral);"></div></div>'); // Show loader while fetching

  $.get('/api/products').done(function (products) {
    if (!products.length) {
      container.html('<div class="swiper-slide text-center text-muted py-5">No products found.</div>');
      return;
    }
    let html = '';
    products.slice(0, 8).forEach(p => { // Limit to 8 products for the swiper
      html += `
            <div class="swiper-slide">
                <div class="product-card h-100 bg-white" style="border:1px solid var(--border); border-radius:16px; overflow:hidden;">
                <div class="product-img-box" style="padding:24px; position:relative; background:#fff;">
                    ${(p.is_new || p.is_featured) ? '<span class="product-badge text-bg-primary" style="background:#0062FF !important; border-radius:4px; padding:4px 8px; font-size:0.7rem; font-weight:bold; position:absolute; top:16px; left:16px; z-index:2; color:#fff;">NEW</span>' : ''}
                    <button class="wishlist-toggle icon-btn shadow-none ${isInWishlist(p.id) ? 'active' : ''}" data-id="${p.id}" style="position:absolute; top:8px; right:8px; background:transparent; border:none; z-index:2; font-size:1.2rem; color:var(--muted); width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
                    <i class="${isInWishlist(p.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <img src="${getImageUrl(p.image_path)}" alt="${p.name}" draggable="false" style="width:100%; height:200px; object-fit:contain; transition:transform 0.3s ease;">
                    <div class="product-hover-actions">
                    <button class="btn btn-light rounded-pill px-3 py-2 fw-bold quick-view-btn shadow-sm text-dark" data-id="${p.id}" title="Quick view" style="font-size:0.85rem;"><i class="fas fa-search me-1"></i> Quick View</button>
                    </div>
                </div>
                <div class="product-body p-4 pt-2 d-flex flex-column" style="text-align:left;">
                    <div class="product-category text-muted mb-1" style="font-size:0.85rem;">${p.category_name || 'Electronics'}</div>
                    <div class="product-name fw-bold mb-2" title="${p.name}" style="font-size:1.1rem; line-height:1.3; color:var(--charcoal);">
                    <a href="javascript:void(0)" class="quick-view-btn text-dark text-decoration-none" data-id="${p.id}">${p.name}</a>
                    </div>
                    <div class="d-flex align-items-center mb-1 quick-view-btn" data-id="${p.id}" data-show-reviews="true" style="font-size:0.8rem; color:#f59e0b; cursor:pointer;">
                      ${getRatingHtml(p.reviews_data)}
                    </div>
                    ${p.stock > 0 && p.stock < 10 ? `<div class="mt-1 mb-2" style="font-size:0.75rem; color:#ef4444; font-weight:700;"><i class="fas fa-fire-alt me-1"></i> Only ${p.stock} left in stock!</div>` : ''}
                    <div class="d-flex justify-content-between align-items-center mt-auto pt-2">
                    <div class="product-price fw-bold" style="font-size:1.25rem;">$${parseFloat(p.price).toFixed(2)}</div>
                    <div class="cart-btn-wrapper">
                      ${getCartButtonHtml(p.id, p.stock)}
                    </div>
                    </div>
                </div>
                </div>
            </div>`;
    });
    container.html(html);

    new Swiper('.featured-swiper', {
      slidesPerView: 1.5,
      spaceBetween: 16,
      pagination: { el: '.featured-pagination', clickable: true },
      navigation: {
        nextEl: '.swiper-button-next.featured-nav-btn',
        prevEl: '.swiper-button-prev.featured-nav-btn',
      },
      autoplay: { delay: 4000, disableOnInteraction: false },
      breakpoints: {
        576: { slidesPerView: 2, spaceBetween: 20 },
        768: { slidesPerView: 3, spaceBetween: 20 },
        1200: { slidesPerView: 4, spaceBetween: 24 }
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

    // 4. Fill navbar dropdown
    const navDropdown = $('#nav-shop-dropdown');
    if (navDropdown.length) {
      let navHtml = '<li><a class="dropdown-item" href="shop.html">All Products</a></li><li><hr class="dropdown-divider"></li>';
      categories.forEach(cat => {
        navHtml += `<li><a class="dropdown-item" href="shop.html?category=${cat.slug}">${cat.name}</a></li>`;
      });
      navDropdown.html(navHtml);
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
  const burgerBtn = document.getElementById('burger-btn');
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-drawer-overlay');
  const closeBtn = document.getElementById('drawer-close-btn');

  if (!burgerBtn || !drawer) return;

  // ── AUTO-HIGHLIGHT ACTIVE LINK ──────────
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const currentHash = window.location.hash;
  const navLinks = drawer.querySelectorAll('.mobile-nav a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentHash && href.includes(currentHash))) {
      link.classList.add('active');
    } else if (currentPath === 'index.html' && href === 'index.html') {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    burgerBtn.classList.add('open');
    const scrollY = window.scrollY;
    document.body.style.top = '-' + scrollY + 'px';
    document.body.classList.add('drawer-open');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    burgerBtn.classList.remove('open');
    const scrollY = parseInt(document.body.style.top || '0') * -1;
    document.body.classList.remove('drawer-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
  }

  burgerBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
}

// ── SHOP FILTER DRAWER ───────────────────────
function initShopFilterDrawer() {
  const filterBtn = document.getElementById('mobile-filter-btn');
  const sidebar = document.getElementById('filter-sidebar');
  const overlay = document.getElementById('mobile-filter-overlay');
  const closeBtn = document.getElementById('close-filter-btn');

  if (!filterBtn || !sidebar || !overlay) return;

  function openFilters() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    const scrollY = window.scrollY;
    document.body.style.top = '-' + scrollY + 'px';
    document.body.classList.add('drawer-open');
  }

  function closeFilters() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    const scrollY = parseInt(document.body.style.top || '0') * -1;
    document.body.classList.remove('drawer-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
  }

  filterBtn.addEventListener('click', openFilters);
  closeBtn.addEventListener('click', closeFilters);
  overlay.addEventListener('click', closeFilters);
}

// ── TESTIMONIALS ──────────────────────────────
function loadTestimonials() {
  const testimonialsWrap = $('#testimonials-wrap');
  if (!testimonialsWrap.length) return;

  // Loading state
  testimonialsWrap.html('<div class="swiper-slide text-center py-5 w-100"><div class="spinner-border" style="color:var(--coral);"></div></div>');

  $.get('/api/products/testimonials/all').done(function (data) {
    let html = '';
    // Randomize the order of reviews on every refresh
    data.sort(() => Math.random() - 0.5);
    data.forEach(t => {
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        stars += `<i class="${i <= t.rating ? 'fas' : 'far'} fa-star"></i>`;
      }
      html += `
        <div class="swiper-slide">
          <div class="review-card" style="position:relative; background: #fff; padding: 36px 32px; border-radius: 16px; height: 100%;">
            <i class="fas fa-quote-right" style="position:absolute; top: 32px; right: 32px; font-size: 1.8rem; color: var(--coral);"></i>
            <div class="reviewer-avatar mb-4" style="background:#e0f2fe; color: var(--coral); width:56px; height:56px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-weight:600;">${t.avatar_initials}</div>
            <p style="color:var(--charcoal); margin-bottom:32px; font-size:.95rem; line-height:1.6; font-weight: 500;">
              ${t.message}
            </p>
            <div style="font-weight:600; color:var(--charcoal); font-size:.95rem;">${t.name}</div>
            <div style="font-size:.8rem; color:var(--muted); margin-bottom: 8px;">${t.role}</div>
            <div class="review-stars text-coral" style="font-size: .85rem;">
              ${stars}
            </div>
          </div>
        </div>`;
    });
    testimonialsWrap.html(html);

    // Init Testimonials Swiper
    new Swiper('.testimonials-swiper', {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      speed: 900,
      pagination: {
        el: '.testimonials-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next.testimonials-nav-btn',
        prevEl: '.swiper-button-prev.testimonials-nav-btn',
      },
      observer: true,
      observeParents: true,
      watchSlidesProgress: true,
      breakpoints: {
        768: { slidesPerView: 2, spaceBetween: 30 },
        1024: { slidesPerView: 4, spaceBetween: 30 },
      },
    });
  }).fail(() => console.error('Failed to load testimonials.'));
}

function loadAuthTestimonial() {
  const card = $('#auth-testimonial-card');
  if (!card.length) return;

  $.get('/api/products/testimonials/all').done(function (data) {
    if (!data || !data.length) {
      card.css('opacity', '1');
      return;
    }
    // Pick one random review
    const t = data[Math.floor(Math.random() * data.length)];
    
    $('#auth-reviewer-avatar').text(t.avatar_initials);
    $('#auth-reviewer-name').text(t.name);
    
    // Generate a realistic "Member since" year based on the record date
    const baseYear = new Date(t.created_at || Date.now()).getFullYear();
    const joinYear = baseYear - (Math.floor(Math.random() * 5) + 1); // 1-5 years ago
    $('#auth-reviewer-role').text(`Member since ${joinYear}`);
    
    $('#auth-review-text').text(`"${t.message}"`);
    
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="${i <= t.rating ? 'fas' : 'far'} fa-star"></i> `;
    }
    $('#auth-review-stars').html(stars);

    // Fade in
    card.css('opacity', '1');
  }).fail(function() {
    card.css('opacity', '1'); // Show whatever is there if API fails
  });
}

// ── LIVE SEARCH ───────────────────────────────
function initLiveSearch() {
  const searchInputs = $('#global-search, #mobile-search-input, #shop-search');
  if (!searchInputs.length) return;

  // Ensure parent has relative position for dropdown alignment
  $('.header-search-bar').css('position', 'relative').css('overflow', 'visible');
  $('.mobile-search').css('position', 'relative');

  // Inject suggestion containers if they don't exist
  searchInputs.each(function () {
    const input = $(this);
    if (!input.parent().find('.search-results-dropdown').length) {
      input.after('<div class="search-results-dropdown"></div>');
    }
  });

  let debounceTimer;
  searchInputs.on('input', function () {
    const input = $(this);
    const dropdown = input.parent().find('.search-results-dropdown');
    const query = input.val().trim();

    clearTimeout(debounceTimer);
    if (query.length < 2) {
      dropdown.removeClass('show').empty();
      return;
    }

    debounceTimer = setTimeout(() => {
      $.get('/api/products', { search: query }).done(function (products) {
        if (!products.length) {
          dropdown.html('<div class="p-3 text-center text-muted" style="font-size:0.85rem;">No products found for "' + query + '"</div>').addClass('show');
          return;
        }

        let html = '';
        products.slice(0, 6).forEach(p => {
          html += `
            <a href="javascript:void(0)" class="search-suggestion-item quick-view-btn" data-id="${p.id}">
              <img src="${getImageUrl(p.image_path)}" class="ss-img">
              <div class="ss-info">
                <span class="ss-name">${p.name}</span>
                 <span class="ss-price">$${parseFloat(p.price).toFixed(2)}</span>
              </div>
            </a>`;
        });

        html += `<a href="shop.html?search=${encodeURIComponent(query)}" class="ss-view-all">View all results <i class="fas fa-arrow-right ms-1"></i></a>`;

        dropdown.html(html).addClass('show');
      });
    }, 300);
  });

  // Close dropdown on click outside
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.header-search-bar, .mobile-search').length) {
      $('.search-results-dropdown').removeClass('show');
    }
  });

  // Re-enable Quick View for search results since they are dynamically added
  $(document).on('click', '.search-suggestion-item', function () {
    $('.search-results-dropdown').removeClass('show');
  });

  // Handle Enter key for search
  searchInputs.on('keydown', function (e) {
    if (e.key === 'Enter') {
      const query = $(this).val().trim();
      if (query) {
        // If we're on the shop page and using the shop-search input, just trigger filters and blur
        if (window.location.pathname.includes('shop.html') && $(this).attr('id') === 'shop-search') {
          $(this).blur();
          return;
        }
        window.location.href = 'shop.html?search=' + encodeURIComponent(query);
      }
    }
  });
}

// ── NEWSLETTER ────────────────────────────────
function initNewsletter() {
  const form = $('.footer-newsletter');
  if (!form.length) return;

  const input = $('#newsletter-email');
  const btn = form.find('button');

  btn.on('click', function (e) {
    e.preventDefault();
    const email = input.val().trim();

    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    btn.prop('disabled', true).text('Subscribing...');

    $.ajax({
      url: '/api/newsletter/subscribe',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ email }),
      success: function (res) {
        showToast(res.message, 'success');
        input.val('');
      },
      error: function (err) {
        showToast(err.responseJSON?.message || 'Failed to subscribe.', 'error');
      },
      complete: function () {
        btn.prop('disabled', false).text('Subscribe');
      }
    });
  });
}

// ── NAVBAR INSTANT STATE ──────────────────────
function initNavbarIcons() {
  // 1. Notifications
  const cachedUnread = parseInt(localStorage.getItem('electrohub_unread_count') || '0');
  updateNotificationIcon(cachedUnread);

  // 2. Cart
  const cachedCart = parseInt(localStorage.getItem('electrohub_cart_count') || '0');
  updateCartIcon(cachedCart);

  // 3. Wishlist
  updateWishlistBadge(); // Already reads from localStorage
}

// ── INIT ──────────────────────────────────────
$(document).ready(function () {
  $.ajaxSetup({ cache: false });
  initNavbarIcons(); // Run immediately to prevent flicker
  checkAuthState();
  updateCartBadge();
  updateWishlistBadge();
  loadFeaturedProducts();
  loadCategories();
  loadTestimonials();
  loadAuthTestimonial();
  initNewsletter();
  initBackToTop();
  updateCopyrightYear();
  initBurgerMenu();
  initShopFilterDrawer();
  initLiveSearch();
  initStickyHeader();

  // Global Cart Update Listeners
  $(document).on('cartUpdated', function () {
    // Instead of re-loading everything (which causes flicker), 
    // just update all visible cart buttons to match the new cart state.
    $('.cart-btn-wrapper').each(function () {
      const id = $(this).closest('.product-card').find('.add-to-cart-btn, .qty-ctrl-mini').data('id');
      if (id) {
        $(this).html(getCartButtonHtml(id));
      }
    });

    // Update Quick View modal if it's open
    if ($('#quickViewModal').hasClass('show') && window.currentQvProductId) {
      $('#qv-cart-btn-wrapper').html(getCartButtonHtml(window.currentQvProductId));
    }
  });
});

// Force refresh when navigating back/forward (handles browser cache)
window.addEventListener('pageshow', function (event) {
  if (typeof checkAuthState === 'function') checkAuthState();
  if (typeof updateCartBadge === 'function') updateCartBadge();
  if (typeof updateWishlistBadge === 'function') updateWishlistBadge();
});

function initStickyHeader() {
  const header = $('.site-header');
  if (!header.length) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    const currentScrollY = window.scrollY;

    // Toggle "scrolled" state for shadow/background
    if (currentScrollY > 10) {
      header.addClass('scrolled');
    } else {
      header.removeClass('scrolled');
    }

    // Handle show/hide on scroll direction change
    if (currentScrollY > 150) { // Only hide after some initial scroll
      if (currentScrollY > lastScrollY) {
        // Scrolling down
        header.addClass('hide');
      } else {
        // Scrolling up
        header.removeClass('hide');
      }
    } else {
      // Near top - always show
      header.removeClass('hide');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  $(window).on('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  });
}
