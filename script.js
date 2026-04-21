(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var canAnimate = !reduceMotion;
  var canDesktopFX = canAnimate && finePointer;

  // ---------- 1. Year stamp ----------
  (function () {
    var y = document.getElementById('year');
    if (!y) return;
    var now = new Date();
    y.textContent = now.getFullYear();
    if (y.tagName === 'TIME') y.setAttribute('datetime', String(now.getFullYear()));
  })();

  // ---------- 2. Reveal observer (with stagger via --reveal-i) ----------
  (function () {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || !canAnimate) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('is-visible');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  // ---------- 3. Shared rAF ticker ----------
  var tickers = [];
  var ticking = false;
  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      for (var i = 0; i < tickers.length; i++) {
        try { tickers[i](); } catch (e) {}
      }
    });
  }
  function addTicker(fn) { tickers.push(fn); }

  // ---------- 4. Nav state machine: compact + section-aware dot ----------
  (function () {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var hero = document.querySelector('.hero');
    var contact = document.querySelector('.contact');
    var links = Array.prototype.slice.call(nav.querySelectorAll('.nav-link'));
    var dot = nav.querySelector('.nav-dot');

    // Compact-on-scroll
    function updateCompact() {
      if (!hero) return;
      var heroBottom = hero.getBoundingClientRect().bottom;
      var compact = heroBottom < 60;
      nav.classList.toggle('is-compact', compact);
      if (contact) {
        var cr = contact.getBoundingClientRect();
        var overDark = cr.top < 80 && cr.bottom > 80;
        nav.classList.toggle('is-dark', compact && overDark);
      }
    }

    // Section-aware dot indicator
    var sections = links
      .map(function (a) {
        var id = a.getAttribute('data-nav');
        var el = id ? document.getElementById(id) : null;
        return el ? { el: el, link: a } : null;
      })
      .filter(Boolean);

    function positionDot(link) {
      if (!dot || !link) return;
      var navRect = nav.getBoundingClientRect();
      var r = link.getBoundingClientRect();
      var cx = r.left - navRect.left + r.width / 2;
      dot.style.left = cx + 'px';
    }

    function setActive(link) {
      links.forEach(function (a) { a.classList.toggle('is-active', a === link); });
      if (link) {
        nav.classList.add('has-active');
        positionDot(link);
      } else {
        nav.classList.remove('has-active');
      }
    }

    if ('IntersectionObserver' in window && sections.length) {
      var activeMap = new Map();
      var secObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          activeMap.set(entry.target, entry.intersectionRatio);
        });
        var best = null, bestRatio = 0;
        sections.forEach(function (s) {
          var r = activeMap.get(s.el) || 0;
          if (r > bestRatio) { bestRatio = r; best = s; }
        });
        setActive(best ? best.link : null);
      }, { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-30% 0px -50% 0px' });
      sections.forEach(function (s) { secObs.observe(s.el); });
    }

    // Keep dot centered on resize / compact transition
    window.addEventListener('resize', function () {
      var active = nav.querySelector('.nav-link.is-active');
      if (active) positionDot(active);
    }, { passive: true });

    addTicker(updateCompact);
    window.addEventListener('scroll', schedule, { passive: true });
    updateCompact();
  })();

  // ---------- 5. Hero scroll effects: parallax + title fade + scroll ring ----------
  (function () {
    var heroMedia = document.querySelector('.hero-media img');
    var heroTitle = document.querySelector('.hero-title');
    var scrollLink = document.querySelector('.hero-scroll');
    var ringProgress = document.querySelector('.scroll-ring-progress');
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var RING_CIRC = 113.097;

    function updateHero() {
      var y = window.scrollY || window.pageYOffset || 0;
      var heroH = hero.offsetHeight || window.innerHeight;
      var progress = Math.min(1, Math.max(0, y / heroH));
      var docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var docProgress = Math.min(1, Math.max(0, y / docH));

      // Parallax (desktop / motion-allowed only)
      if (heroMedia && canDesktopFX) {
        var travel = Math.min(80, y * 0.12);
        heroMedia.style.transform = 'translate3d(0,' + travel + 'px, 0) scale(1)';
      }

      // Title fade + blur retreat
      if (heroTitle && canAnimate) {
        var op = Math.max(0, 1 - progress * 1.3);
        heroTitle.style.opacity = op;
        if (canDesktopFX) {
          heroTitle.style.filter = 'blur(' + (progress * 4).toFixed(2) + 'px)';
        }
      }

      // Scroll ring progress
      if (ringProgress) {
        var offset = RING_CIRC * (1 - docProgress);
        ringProgress.style.strokeDashoffset = offset.toFixed(2);
      }
      if (scrollLink) {
        scrollLink.classList.toggle('is-hidden', progress > 0.85);
      }
    }

    addTicker(updateHero);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    updateHero();
  })();

  // ---------- 6. Magnetic hero CTA + cursor-follow glow ----------
  (function () {
    if (!canDesktopFX) return;
    var cta = document.querySelector('.hero-cta');
    var hero = document.querySelector('.hero');
    var glow = document.querySelector('.hero-glow');
    var title = document.querySelector('.hero-title');
    if (!hero) return;

    var mouseX = 0, mouseY = 0;
    var glowX = 0, glowY = 0;
    var ctaX = 0, ctaY = 0, ctaTX = 0, ctaTY = 0;
    var hovering = false;

    function onMove(e) {
      var rect = hero.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      hovering = true;
      hero.classList.add('is-hovering');

      if (cta) {
        var cRect = cta.getBoundingClientRect();
        var cx = cRect.left + cRect.width / 2 - rect.left;
        var cy = cRect.top + cRect.height / 2 - rect.top;
        var dx = mouseX - cx;
        var dy = mouseY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var radius = 110;
        if (dist < radius) {
          var pull = (1 - dist / radius) * 8;
          ctaTX = (dx / Math.max(1, dist)) * pull;
          ctaTY = (dy / Math.max(1, dist)) * pull;
        } else {
          ctaTX = 0; ctaTY = 0;
        }
      }
      schedule();
    }
    function onLeave() {
      hovering = false;
      hero.classList.remove('is-hovering');
      ctaTX = 0; ctaTY = 0;
      schedule();
    }

    addTicker(function () {
      // Ease glow + cta toward targets
      glowX += (mouseX - glowX) * 0.18;
      glowY += (mouseY - glowY) * 0.18;
      ctaX += (ctaTX - ctaX) * 0.18;
      ctaY += (ctaTY - ctaY) * 0.18;

      if (glow) {
        glow.style.transform = 'translate3d(' + glowX.toFixed(1) + 'px,' + glowY.toFixed(1) + 'px, 0)';
      }
      if (cta) {
        cta.style.transform = 'translate3d(' + ctaX.toFixed(1) + 'px,' + ctaY.toFixed(1) + 'px, 0)';
      }
      if (hovering && (Math.abs(mouseX - glowX) > 0.2 || Math.abs(ctaTX - ctaX) > 0.2)) {
        schedule();
      }
    });

    hero.addEventListener('mousemove', onMove, { passive: true });
    hero.addEventListener('mouseleave', onLeave, { passive: true });
    // Subdue glow on title edges by nudging blend
    if (title) {
      title.addEventListener('mouseenter', function () { hero.classList.add('is-hovering'); });
    }
  })();

  // ---------- 7. Email copy-to-clipboard with toast swap ----------
  (function () {
    var email = document.querySelector('.contact-email');
    if (!email) return;
    var addr = email.getAttribute('data-copy') || '[removed]';
    var timer = null;

    email.addEventListener('click', function (e) {
      // Let modifier-clicks follow the link as normal mailto:
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      e.preventDefault();
      navigator.clipboard.writeText(addr).then(function () {
        email.classList.add('is-copied');
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
          email.classList.remove('is-copied');
        }, 1400);
      }).catch(function () {
        window.location.href = 'mailto:' + addr;
      });
    });
  })();

  // ---------- 8. Smooth-scroll for asterisk anchor and footer back-to-top ----------
  // (honors prefers-reduced-motion via native smooth behavior; already set in CSS)
})();
