// Muallim — kirish sahifasi uchun kichik interaktivlik
(function () {
  'use strict';

  var root = document.documentElement;

  document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('.site-header');
    var nav = document.getElementById('site-nav');
    var toggle = document.querySelector('.nav-toggle');
    var toggleLabel = toggle && toggle.querySelector('.visually-hidden');
    var themeBtn = document.querySelector('.theme-toggle');

    // --- Mobil menyu ---
    function setMenu(open) {
      if (!toggle || !nav) return;
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (toggleLabel) toggleLabel.textContent = open ? 'Menyuni yopish' : 'Menyuni ochish';
    }

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        setMenu(toggle.getAttribute('aria-expanded') !== 'true');
      });

      // Havola bosilganda menyuni yopish
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
      });

      // Esc tugmasi bilan yopish
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          setMenu(false);
          toggle.focus();
        }
      });

      // Katta ekranga o'tilganda holatni tiklash
      window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) {
        if (mq.matches) setMenu(false);
      });
    }

    // --- Sahifa aylantirilganda header soyasi ---
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // --- Yorug'/tungi rejim ---
    if (themeBtn) {
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

      var isDark = function () {
        var t = root.getAttribute('data-theme');
        return t ? t === 'dark' : systemDark.matches;
      };

      var syncLabel = function () {
        themeBtn.setAttribute('aria-pressed', String(isDark()));
      };

      themeBtn.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('muallim-theme', next); } catch (e) {}
        syncLabel();
      });

      systemDark.addEventListener('change', syncLabel);
      syncLabel();
    }

    // --- Joriy yil ---
    var year = document.querySelector('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  });
})();
