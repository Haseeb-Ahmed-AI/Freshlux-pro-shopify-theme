/**
 * FreshLux Theme - Main JavaScript
 * Premium Grocery Store Theme
 */

(function () {
  'use strict';

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const FreshLux = {
    /**
     * Debounce function
     */
    debounce(fn, wait) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    /**
     * Throttle function
     */
    throttle(fn, limit) {
      let inThrottle;
      return function (...args) {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },

    /**
     * Format money
     */
    formatMoney(cents, format) {
      if (typeof cents === 'string') {
        cents = cents.replace('.', '');
      }
      let value = '';
      const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      const formatString = format || window.theme?.moneyFormat || '${{amount}}';

      function formatWithDelimiters(number, precision = 2, thousands = ',', decimal = '.') {
        if (isNaN(number) || number == null) {
          return 0;
        }
        number = (number / 100.0).toFixed(precision);
        const parts = number.split('.');
        const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`);
        const centsAmount = parts[1] ? decimal + parts[1] : '';
        return dollarsAmount + centsAmount;
      }

      switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
          value = formatWithDelimiters(cents, 2);
          break;
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
      }

      return formatString.replace(placeholderRegex, value);
    },

    /**
     * Fetch configuration for AJAX requests
     */
    fetchConfig(type = 'json') {
      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: `application/${type}`,
        },
      };
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'success', duration = 3000) {
      const existingNotification = document.querySelector('.notification');
      if (existingNotification) {
        existingNotification.remove();
      }

      const notification = document.createElement('div');
      notification.className = `notification notification--${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);

      requestAnimationFrame(() => {
        notification.classList.add('is-visible');
      });

      setTimeout(() => {
        notification.classList.remove('is-visible');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    },

    /**
     * Get cookie value
     */
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    },

    /**
     * Set cookie value
     */
    setCookie(name, value, days = 365) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax`;
    },
  };

  // ============================================
  // CART FUNCTIONALITY
  // ============================================

  class Cart {
    constructor() {
      this.cartDrawer = document.querySelector('[data-cart-drawer]');
      this.cartOverlay = document.querySelector('[data-cart-overlay]');
      this.cartCount = document.querySelectorAll('[data-cart-count]');
      this.cartTotal = document.querySelectorAll('[data-cart-total]');
      this.cartItems = document.querySelector('[data-cart-items]');

      this.bindEvents();
    }

    bindEvents() {
      document.addEventListener('click', (e) => {
        // Open cart drawer
        if (e.target.closest('[data-cart-trigger]')) {
          e.preventDefault();
          this.openDrawer();
        }

        // Close cart drawer
        if (e.target.closest('[data-cart-close]') || e.target.matches('[data-cart-overlay]')) {
          this.closeDrawer();
        }

        // Add to cart
        if (e.target.closest('[data-add-to-cart]')) {
          e.preventDefault();
          const button = e.target.closest('[data-add-to-cart]');
          this.addToCart(button);
        }

        // Remove from cart
        if (e.target.closest('[data-cart-remove]')) {
          e.preventDefault();
          const button = e.target.closest('[data-cart-remove]');
          const key = button.dataset.cartRemove;
          this.updateQuantity(key, 0);
        }
      });

      // Quantity changes
      document.addEventListener('change', (e) => {
        if (e.target.matches('[data-cart-quantity]')) {
          const input = e.target;
          const key = input.dataset.cartQuantity;
          const quantity = parseInt(input.value, 10);
          this.updateQuantity(key, quantity);
        }
      });
    }

    async addToCart(button) {
      const form = button.closest('form');
      const formData = form ? new FormData(form) : new FormData();

      if (!form) {
    const variantId = button.dataset.variantId;
    const quantity = button.dataset.quantity || 1;
    formData.append('id', variantId);
    formData.append('quantity', quantity);
  }

  button.classList.add('loading');
  button.disabled = true;

  try {
    const response = await fetch(window.routes.cart_add_url, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();

    if (response.status !== 200 || data.status === 422) {
      FreshLux.showNotification(data.description || 'Could not add item', 'error');
      return;
    }

    await this.refreshCart()
FreshLux.showNotification('Item added to cart ✓', 'success');

  } catch (error) {
    console.error('Error adding to cart:', error);
    FreshLux.showNotification('Could not add item', 'error');
  } finally {
    button.classList.remove('loading');
    button.disabled = false;
  }
}


    async updateQuantity(key, quantity) {
      try {
        const response = await fetch(window.routes.cart_change_url, {
          ...FreshLux.fetchConfig(),
          body: JSON.stringify({
            id: key,
            quantity: quantity,
          }),
        });

        const cart = await response.json();
        await this.refreshCart()
        FreshLux.showNotification('Item added to cart ✓', 'success');
        if (quantity === 0) {
          FreshLux.showNotification('Item removed from cart', 'success');
        }
      } catch (error) {
        console.error('Error updating cart:', error);
        FreshLux.showNotification('Could not update cart', 'error');
      }
    }

    async refreshCart() {
  try {
    // Get cart JSON first
    const response = await fetch('/cart.js');
    const cart = await response.json();

    // Update header count
    this.cartCount.forEach(el => {
      el.textContent = cart.item_count;
      el.classList.toggle('hidden', cart.item_count === 0);
    });

    // Update totals
    this.cartTotal.forEach(el => {
      el.textContent = FreshLux.formatMoney(cart.total_price);
    });

    // Shopify official bundled sections
    const sections = ['cart-drawer', 'main-cart'];

    const sectionResponse = await fetch(`/cart?sections=${sections.join(',')}`);
    const sectionData = await sectionResponse.json();

    // Replace Drawer Section
    if (sectionData['cart-drawer']) {
      const drawerWrapper = document.querySelector('[data-cart-drawer]').closest('section, div');
      if (drawerWrapper) {
        drawerWrapper.outerHTML = sectionData['cart-drawer'];
      }
    }

    // Replace Cart Page Section
    if (sectionData['main-cart']) {
      const cartSection = document.querySelector('.section-cart');
      if (cartSection) {
        cartSection.outerHTML = sectionData['main-cart'];
      }
    }

  } catch (err) {
    console.error('Cart refresh failed:', err);
  }
}

    openDrawer() {
      if (this.cartDrawer) {
        this.cartDrawer.classList.add('is-active');
        this.cartOverlay?.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      }
    }

    closeDrawer() {
      if (this.cartDrawer) {
        this.cartDrawer.classList.remove('is-active');
        this.cartOverlay?.classList.remove('is-active');
        document.body.style.overflow = '';
      }
    }
  }

  // ============================================
  // QUICK ADD MODAL
  // ============================================

  class QuickAdd {
    constructor() {
      this.modal = document.querySelector('[data-quick-add-modal]');
      this.modalContent = document.querySelector('[data-quick-add-content]');
      this.overlay = document.querySelector('[data-quick-add-overlay]');

      this.bindEvents();
    }

    bindEvents() {
      document.addEventListener('click', (e) => {
        // Open quick add modal
        if (e.target.closest('[data-quick-add]')) {
          e.preventDefault();
          const button = e.target.closest('[data-quick-add]');
          const productUrl = button.dataset.quickAdd;
          this.open(productUrl);
        }

        // Close modal
        if (
          e.target.closest('[data-quick-add-close]') ||
          e.target.matches('[data-quick-add-overlay]')
        ) {
          this.close();
        }
      });

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal?.classList.contains('is-active')) {
          this.close();
        }
      });
    }

    async open(productUrl) {
      if (!this.modal || !this.modalContent) return;

      this.modal.classList.add('is-active');
      this.overlay?.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      this.modalContent.innerHTML = '<div class="loading" style="min-height: 200px;"></div>';

      try {
        const response = await fetch(`${productUrl}?section_id=quick-add-product`);
        const html = await response.text();
        this.modalContent.innerHTML = html;
      } catch (error) {
        console.error('Error loading quick add:', error);
        this.modalContent.innerHTML = '<p>Could not load product. Please try again.</p>';
      }
    }

    close() {
      if (this.modal) {
        this.modal.classList.remove('is-active');
        this.overlay?.classList.remove('is-active');
        document.body.style.overflow = '';
      }
    }
  }

  // ============================================
  // MEGA MENU
  // ============================================

  class MegaMenu {
    constructor() {
      this.menus = document.querySelectorAll('[data-mega-menu]');
      this.bindEvents();
    }

    bindEvents() {
      this.menus.forEach((menu) => {
        const trigger = menu.querySelector('[data-mega-menu-trigger]');
        const content = menu.querySelector('[data-mega-menu-content]');

        if (trigger && content) {
          // Desktop: hover
          menu.addEventListener('mouseenter', () => {
            this.closeAll();
            content.classList.add('is-active');
          });

          menu.addEventListener('mouseleave', () => {
            content.classList.remove('is-active');
          });

          // Keyboard navigation
          trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              content.classList.toggle('is-active');
            }
          });
        }
      });

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('[data-mega-menu]')) {
          this.closeAll();
        }
      });
    }

    closeAll() {
      document.querySelectorAll('[data-mega-menu-content]').forEach((content) => {
        content.classList.remove('is-active');
      });
    }
  }

  // ============================================
  // PRODUCT FILTERS
  // ============================================

  class ProductFilters {
    constructor() {
      this.container = document.querySelector('[data-filters]');
      this.form = document.querySelector('[data-filters-form]');
      this.resultsContainer = document.querySelector('[data-products-grid]');
      this.activeFiltersContainer = document.querySelector('[data-active-filters]');

      if (this.form) {
        this.bindEvents();
      }
    }

    bindEvents() {
      // Filter changes
      this.form.addEventListener('change', FreshLux.debounce(() => this.applyFilters(), 300));

      // Clear all filters
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-clear-filters]')) {
          e.preventDefault();
          this.clearFilters();
        }

        // Remove single filter
        if (e.target.closest('[data-remove-filter]')) {
          e.preventDefault();
          const button = e.target.closest('[data-remove-filter]');
          const filterName = button.dataset.removeFilter;
          this.removeFilter(filterName);
        }

        // Toggle filter drawer on mobile
        if (e.target.closest('[data-filters-toggle]')) {
          e.preventDefault();
          this.container?.classList.toggle('is-active');
          document.body.style.overflow = this.container?.classList.contains('is-active')
            ? 'hidden'
            : '';
        }

        // Close filter drawer
        if (e.target.closest('[data-filters-close]')) {
          this.container?.classList.remove('is-active');
          document.body.style.overflow = '';
        }
      });
    }

    async applyFilters() {
      const formData = new FormData(this.form);
      const params = new URLSearchParams(formData);
      const url = `${window.location.pathname}?${params.toString()}`;

      // Update URL
      window.history.pushState({}, '', url);

      // Show loading state
      this.resultsContainer?.classList.add('loading');

      try {
        const response = await fetch(`${url}&section_id=collection-products`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Update products grid
        const newProducts = doc.querySelector('[data-products-grid]');
        if (newProducts && this.resultsContainer) {
          this.resultsContainer.innerHTML = newProducts.innerHTML;
        }

        // Update active filters
        const newActiveFilters = doc.querySelector('[data-active-filters]');
        if (newActiveFilters && this.activeFiltersContainer) {
          this.activeFiltersContainer.innerHTML = newActiveFilters.innerHTML;
        }

        // Update product count
        const newCount = doc.querySelector('[data-products-count]');
        const currentCount = document.querySelector('[data-products-count]');
        if (newCount && currentCount) {
          currentCount.textContent = newCount.textContent;
        }
      } catch (error) {
        console.error('Error applying filters:', error);
      } finally {
        this.resultsContainer?.classList.remove('loading');
      }
    }

    removeFilter(filterName) {
      const input = this.form.querySelector(`[name="${filterName}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = false;
        } else {
          input.value = '';
        }
        this.applyFilters();
      }
    }

    clearFilters() {
      this.form.reset();
      this.applyFilters();
    }
  }

  // ============================================
  // LAYOUT TOGGLE (Grid/List)
  // ============================================

  class LayoutToggle {
    constructor() {
      this.container = document.querySelector('[data-products-grid]');
      this.toggleButtons = document.querySelectorAll('[data-layout-toggle]');
      this.cookieName = 'freshlux_layout';

      this.init();
    }

    init() {
      // Set initial layout from cookie
      const savedLayout = FreshLux.getCookie(this.cookieName);
      if (savedLayout) {
        this.setLayout(savedLayout);
      }

      this.bindEvents();
    }

    bindEvents() {
      this.toggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const layout = button.dataset.layoutToggle;
          this.setLayout(layout);
          FreshLux.setCookie(this.cookieName, layout);
        });
      });
    }

    setLayout(layout) {
      if (!this.container) return;

      this.container.classList.remove('layout-grid', 'layout-list');
      this.container.classList.add(`layout-${layout}`);

      this.toggleButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.layoutToggle === layout);
      });
    }
  }

  // ============================================
  // DELIVERY SCHEDULER
  // ============================================

  class DeliveryScheduler {
    constructor() {
      this.container = document.querySelector('[data-delivery-scheduler]');
      this.dateInput = document.querySelector('[data-delivery-date]');
      this.timeSlots = document.querySelectorAll('[data-delivery-time]');
      this.selectedDateDisplay = document.querySelector('[data-selected-date]');
      this.selectedTimeDisplay = document.querySelector('[data-selected-time]');

      if (this.container) {
        this.init();
      }
    }

    init() {
      // Set minimum date to tomorrow
      if (this.dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.dateInput.min = tomorrow.toISOString().split('T')[0];

        // Set max date to 14 days from now
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 14);
        this.dateInput.max = maxDate.toISOString().split('T')[0];
      }

      this.bindEvents();
    }

    bindEvents() {
      // Date selection
      this.dateInput?.addEventListener('change', (e) => {
        const date = new Date(e.target.value);
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

        if (this.selectedDateDisplay) {
          this.selectedDateDisplay.textContent = formattedDate;
        }

        // Update available time slots based on date
        this.updateTimeSlots(date);

        // Save to cart attributes
        this.saveToCart();
      });

      // Time slot selection
      this.timeSlots.forEach((slot) => {
        slot.addEventListener('click', () => {
          this.timeSlots.forEach((s) => s.classList.remove('is-selected'));
          slot.classList.add('is-selected');

          if (this.selectedTimeDisplay) {
            this.selectedTimeDisplay.textContent = slot.dataset.deliveryTime;
          }

          this.saveToCart();
        });
      });
    }

    updateTimeSlots(date) {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      this.timeSlots.forEach((slot) => {
        const time = slot.dataset.deliveryTime;
        // Disable early morning slots on weekends
        if (isWeekend && time.includes('AM') && parseInt(time) < 10) {
          slot.classList.add('is-disabled');
          slot.disabled = true;
        } else {
          slot.classList.remove('is-disabled');
          slot.disabled = false;
        }
      });
    }

    async saveToCart() {
      const date = this.dateInput?.value;
      const selectedSlot = document.querySelector('[data-delivery-time].is-selected');
      const time = selectedSlot?.dataset.deliveryTime;

      if (!date || !time) return;

      try {
        await fetch(window.routes.cart_update_url, {
          ...FreshLux.fetchConfig(),
          body: JSON.stringify({
            attributes: {
              'Delivery Date': date,
              'Delivery Time': time,
            },
          }),
        });
      } catch (error) {
        console.error('Error saving delivery details:', error);
      }
    }
  }

  // ============================================
  // QUANTITY SELECTOR
  // ============================================

  class QuantitySelector {
    constructor() {
      this.bindEvents();
    }

    bindEvents() {
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-quantity-minus]')) {
          const container = e.target.closest('.quantity-selector');
          const input = container?.querySelector('[data-quantity-input]');
          if (input) {
            const min = parseInt(input.min, 10) || 1;
            const current = parseInt(input.value, 10);
            if (current > min) {
              input.value = current - 1;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }

        if (e.target.closest('[data-quantity-plus]')) {
          const container = e.target.closest('.quantity-selector');
          const input = container?.querySelector('[data-quantity-input]');
          if (input) {
            const max = parseInt(input.max, 10) || 9999;
            const current = parseInt(input.value, 10);
            if (current < max) {
              input.value = current + 1;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }
      });
    }
  }

  // ============================================
  // MOBILE MENU
  // ============================================

  class MobileMenu {
    constructor() {
      this.menu = document.querySelector('[data-mobile-menu]');
      this.overlay = document.querySelector('[data-mobile-menu-overlay]');
      this.bindEvents();
    }

    bindEvents() {
      document.addEventListener('click', (e) => {
        // Open menu
        if (e.target.closest('[data-mobile-menu-open]')) {
          e.preventDefault();
          this.open();
        }

        // Close menu
        if (
          e.target.closest('[data-mobile-menu-close]') ||
          e.target.matches('[data-mobile-menu-overlay]')
        ) {
          this.close();
        }

        // Toggle submenu
        if (e.target.closest('[data-mobile-submenu-toggle]')) {
          e.preventDefault();
          const toggle = e.target.closest('[data-mobile-submenu-toggle]');
          const submenu = toggle.nextElementSibling;
          toggle.classList.toggle('is-active');
          submenu?.classList.toggle('is-active');
        }
      });
    }

    open() {
      this.menu?.classList.add('is-active');
      this.overlay?.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }

    close() {
      this.menu?.classList.remove('is-active');
      this.overlay?.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  }

  // ============================================
  // SEARCH
  // ============================================

  class Search {
    constructor() {
      this.searchDrawer = document.querySelector('[data-search-drawer]');
      this.searchInput = document.querySelector('[data-search-input]');
      this.searchResults = document.querySelector('[data-search-results]');
      this.overlay = document.querySelector('[data-search-overlay]');

      this.bindEvents();
    }

    bindEvents() {
      document.addEventListener('click', (e) => {
        // Open search
        if (e.target.closest('[data-search-open]')) {
          e.preventDefault();
          this.open();
        }

        // Close search
        if (e.target.closest('[data-search-close]') || e.target.matches('[data-search-overlay]')) {
          this.close();
        }
      });

      // Predictive search
      this.searchInput?.addEventListener(
        'input',
        FreshLux.debounce((e) => {
          this.search(e.target.value);
        }, 300)
      );

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.searchDrawer?.classList.contains('is-active')) {
          this.close();
        }
      });
    }

    open() {
      this.searchDrawer?.classList.add('is-active');
      this.overlay?.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      this.searchInput?.focus();
    }

    close() {
      this.searchDrawer?.classList.remove('is-active');
      this.overlay?.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    async search(query) {
      if (!query || query.length < 2) {
        if (this.searchResults) {
          this.searchResults.innerHTML = '';
        }
        return;
      }

      try {
        const response = await fetch(
          `${window.routes.predictive_search_url}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=8&section_id=predictive-search`
        );
        const html = await response.text();

        if (this.searchResults) {
          this.searchResults.innerHTML = html;
        }
      } catch (error) {
        console.error('Error searching:', error);
      }
    }
  }

  // ============================================
  // INITIALIZE
  // ============================================

  document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    window.FreshLux = FreshLux;
    window.freshluxCart = new Cart();
    new QuickAdd();
    new MegaMenu();
    new ProductFilters();
    new LayoutToggle();
    new DeliveryScheduler();
    new QuantitySelector();
    new MobileMenu();
    new Search();

    // Remove no-js class
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('js');
  });
})();
