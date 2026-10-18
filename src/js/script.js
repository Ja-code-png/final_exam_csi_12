/**
 * Global Scripts - Safe School
 * Xử lý các hiệu ứng UI, Scroll, Animation toàn cục
 */

import './chatbot.js';

document.addEventListener('DOMContentLoaded', () => {
  // === 1. Navbar Scroll Effect ===
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // === 2. Intersection Observer cho Animation (Stagger & Fade) ===
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        // Ngừng observe sau khi đã hiện (chạy 1 lần)
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Quan sát các thẻ có class stagger (như danh sách feature, blog)
  document.querySelectorAll('.stagger > *').forEach(el => {
    observer.observe(el);
  });
  
  // Quan sát các thẻ có class animate-fade-in-up
  document.querySelectorAll('.animate-fade-in-up').forEach(el => {
    observer.observe(el);
  });

  // === 3. Mobile Menu Toggle ===
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (mobileToggle && sidebar && overlay) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
});
