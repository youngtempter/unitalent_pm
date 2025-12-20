/**
 * jQuery Interactive Elements
 * Mobile menu, modals, tabs, smooth scroll, form validation
 */

$(document).ready(function() {
  'use strict';

  // ============================================
  // Mobile Menu Toggle
  // ============================================
  $('.mobile-menu-btn, #mobileMenuBtn').on('click', function() {
    const menu = $('#mobileMenu, .mobile-menu');
    const btn = $(this);
    
    menu.slideToggle(300, function() {
      if (menu.is(':visible')) {
        menu.addClass('active');
        btn.addClass('active');
        $('body').css('overflow', 'hidden');
      } else {
        menu.removeClass('active');
        btn.removeClass('active');
        $('body').css('overflow', '');
      }
    });
    
    // Toggle hamburger icon
    btn.find('svg').toggleClass('rotate-90');
  });

  // Close mobile menu when clicking close button or overlay
  $('.mobile-menu-close, .mobile-menu-overlay').on('click', function() {
    const menu = $('#mobileMenu, .mobile-menu');
    menu.slideUp(300);
    $('.mobile-menu-btn, #mobileMenuBtn').removeClass('active');
    $('body').css('overflow', '');
  });

  // Close mobile menu when clicking a link
  $('.mobile-menu a').on('click', function() {
    const menu = $('#mobileMenu, .mobile-menu');
    menu.slideUp(300);
    $('.mobile-menu-btn, #mobileMenuBtn').removeClass('active');
    $('body').css('overflow', '');
  });

  // ============================================
  // Modal Functionality
  // ============================================
  $('.modal-trigger, [data-modal]').on('click', function(e) {
    e.preventDefault();
    const target = $(this).data('modal') || $(this).data('target') || $(this).attr('href');
    const modal = $(target);
    
    if (modal.length) {
      modal.fadeIn(300);
      $('body').css('overflow', 'hidden');
      modal.find('.modal-content').addClass('animate-modal-in');
    }
  });

  $('.modal-close, .modal-overlay').on('click', function(e) {
    if ($(this).hasClass('modal-overlay') || $(this).hasClass('modal-close')) {
      const modal = $(this).closest('.modal');
      modal.fadeOut(300);
      $('body').css('overflow', '');
      modal.find('.modal-content').removeClass('animate-modal-in');
    }
  });

  // Close modal on Escape key
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape') {
      $('.modal:visible').fadeOut(300);
      $('body').css('overflow', '');
    }
  });

  // ============================================
  // Tab Functionality
  // ============================================
  $('.tab-btn, [data-tab]').on('click', function(e) {
    e.preventDefault();
    const tabId = $(this).data('tab') || $(this).attr('href');
    const tabContainer = $(this).closest('.tabs-container');
    
    if (tabContainer.length) {
      // Update active tab button
      tabContainer.find('.tab-btn').removeClass('active');
      $(this).addClass('active');
      
      // Show corresponding tab content
      tabContainer.find('.tab-content').hide();
      $(tabId).fadeIn(300);
    } else {
      // Global tabs (not in container)
      $('.tab-btn').removeClass('active');
      $(this).addClass('active');
      $('.tab-content').hide();
      $(tabId).fadeIn(300);
    }
  });

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  $('a[href^="#"]').on('click', function(e) {
    const target = $(this.getAttribute('href'));
    
    if (target.length && target.offset()) {
      e.preventDefault();
      const offset = 80; // Account for fixed header
      
      $('html, body').animate({
        scrollTop: target.offset().top - offset
      }, 600, 'swing');
    }
  });

  // ============================================
  // Form Validation with jQuery
  // ============================================
  $('form').on('submit', function(e) {
    let isValid = true;
    const form = $(this);
    
    // Clear previous errors
    form.find('.error-message').remove();
    form.find('.error').removeClass('error');
    
    // Validate required fields
    form.find('input[required], textarea[required], select[required]').each(function() {
      const field = $(this);
      const value = field.val().trim();
      
      if (!value) {
        isValid = false;
        field.addClass('error');
        field.after('<span class="error-message text-rose-400 text-xs mt-1 block">This field is required</span>');
      }
    });
    
    // Email validation
    form.find('input[type="email"]').each(function() {
      const field = $(this);
      const email = field.val().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (email && !emailRegex.test(email)) {
        isValid = false;
        field.addClass('error');
        field.after('<span class="error-message text-rose-400 text-xs mt-1 block">Please enter a valid email</span>');
      }
    });
    
    // Password strength (if password field exists)
    form.find('input[type="password"]').each(function() {
      const field = $(this);
      const password = field.val();
      
      if (password && password.length < 8) {
        isValid = false;
        field.addClass('error');
        field.after('<span class="error-message text-rose-400 text-xs mt-1 block">Password must be at least 8 characters</span>');
      }
    });
    
    if (!isValid) {
      e.preventDefault();
      // Scroll to first error
      const firstError = form.find('.error').first();
      if (firstError.length) {
        $('html, body').animate({
          scrollTop: firstError.offset().top - 100
        }, 400);
        firstError.focus();
      }
    }
  });

  // Remove error on input
  $('input, textarea, select').on('input change', function() {
    $(this).removeClass('error');
    $(this).next('.error-message').remove();
  });

  // ============================================
  // Scroll Animations (Fade In on Scroll)
  // ============================================
  function checkScrollAnimations() {
    $('.fade-in-on-scroll, .animate-on-scroll').each(function() {
      const element = $(this);
      const elementTop = element.offset().top;
      const elementBottom = elementTop + element.outerHeight();
      const viewportTop = $(window).scrollTop();
      const viewportBottom = viewportTop + $(window).height();
      
      if (elementBottom > viewportTop && elementTop < viewportBottom) {
        if (!element.hasClass('animated')) {
          element.addClass('animated');
          element.css('animation-delay', element.data('delay') || '0s');
        }
      }
    });
  }

  // Check on scroll and on load
  $(window).on('scroll', checkScrollAnimations);
  checkScrollAnimations();

  // ============================================
  // Accordion Functionality
  // ============================================
  $('.accordion-header').on('click', function() {
    const accordion = $(this).closest('.accordion-item');
    const content = accordion.find('.accordion-content');
    const isActive = accordion.hasClass('active');
    
    // Close all accordions in the same container
    accordion.siblings('.accordion-item').removeClass('active').find('.accordion-content').slideUp(300);
    
    // Toggle current accordion
    if (isActive) {
      accordion.removeClass('active');
      content.slideUp(300);
    } else {
      accordion.addClass('active');
      content.slideDown(300);
    }
  });

  // ============================================
  // Dropdown Menus
  // ============================================
  $('.dropdown-trigger').on('click', function(e) {
    e.stopPropagation();
    const dropdown = $(this).next('.dropdown-menu');
    
    // Close other dropdowns
    $('.dropdown-menu').not(dropdown).fadeOut(200);
    
    // Toggle current dropdown
    dropdown.fadeToggle(200);
  });

  // Close dropdowns when clicking outside
  $(document).on('click', function(e) {
    if (!$(e.target).closest('.dropdown-trigger, .dropdown-menu').length) {
      $('.dropdown-menu').fadeOut(200);
    }
  });

  // ============================================
  // Loading States for Buttons
  // ============================================
  $('.btn-loading').on('click', function() {
    const btn = $(this);
    const originalText = btn.html();
    
    btn.prop('disabled', true);
    btn.html('<span class="spinner"></span> Loading...');
    
    // Re-enable after 3 seconds (or remove this if you handle it in your AJAX)
    setTimeout(function() {
      btn.prop('disabled', false);
      btn.html(originalText);
    }, 3000);
  });

  // ============================================
  // Tooltip Functionality
  // ============================================
  $('[data-tooltip]').hover(
    function() {
      const tooltip = $('<div class="tooltip">' + $(this).data('tooltip') + '</div>');
      $('body').append(tooltip);
      
      const element = $(this);
      const offset = element.offset();
      tooltip.css({
        top: offset.top - tooltip.outerHeight() - 10,
        left: offset.left + (element.outerWidth() / 2) - (tooltip.outerWidth() / 2)
      });
      
      tooltip.fadeIn(200);
    },
    function() {
      $('.tooltip').fadeOut(200, function() {
        $(this).remove();
      });
    }
  );

  // ============================================
  // Image Lazy Loading Animation
  // ============================================
  $('img[data-src]').each(function() {
    const img = $(this);
    const src = img.data('src');
    
    img.on('load', function() {
      $(this).addClass('fade-in');
    });
    
    if (src) {
      img.attr('src', src);
    }
  });

  // ============================================
  // Back to Top Button
  // ============================================
  $(window).on('scroll', function() {
    if ($(this).scrollTop() > 300) {
      $('.back-to-top').fadeIn(300);
    } else {
      $('.back-to-top').fadeOut(300);
    }
  });

  $('.back-to-top').on('click', function(e) {
    e.preventDefault();
    $('html, body').animate({
      scrollTop: 0
    }, 600, 'swing');
  });

  // ============================================
  // Card Hover Effects Enhancement
  // ============================================
  $('.card-hover').hover(
    function() {
      $(this).addClass('card-hover-active');
    },
    function() {
      $(this).removeClass('card-hover-active');
    }
  );

  // ============================================
  // Counter Animation (for stats)
  // ============================================
  function animateCounter(element) {
    const target = parseInt(element.data('target') || element.text());
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(function() {
      current += increment;
      if (current >= target) {
        element.text(target);
        clearInterval(timer);
      } else {
        element.text(Math.floor(current));
      }
    }, 16);
  }

  // Animate counters when they come into view
  $('.counter').each(function() {
    const counter = $(this);
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounter(counter);
          observer.unobserve(entry.target);
        }
      });
    });
    
    observer.observe(this);
  });

  console.log('✅ jQuery interactions loaded successfully');
});

