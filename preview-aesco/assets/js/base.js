(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var AE = window.AE = window.AE || {};
  AE.reduced = !!mq.matches;
  AE.gsap = !AE.reduced && !!(window.gsap && window.ScrollTrigger);
  var queue = AE._q || [];
  AE.ready = function (fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } };
  if (AE.gsap) {
    var plugins = [window.ScrollTrigger];
    if (window.SplitText) plugins.push(window.SplitText);
    if (window.DrawSVGPlugin) plugins.push(window.DrawSVGPlugin);
    gsap.registerPlugin.apply(gsap, plugins);
  }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }
  AE.$$ = $$;
  var menuBt = d.querySelector('.menu-bt'), nav = d.querySelector('.nav');
  if (menuBt && nav) {
    nav.id = 'main-nav';
    menuBt.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBt.setAttribute('aria-expanded', open);
      menuBt.textContent = open ? 'Close' : 'Menu';
      d.body.style.overflow = open ? 'hidden' : '';
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { menuBt.click(); menuBt.focus(); }
    });
  }
  $$('.sub-bt').forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.parentNode, open = li.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
    });
  });
  var hdr = d.querySelector('.hdr'), ticking = false;
  function onScroll() {
    if (hdr) hdr.classList.toggle('stuck', (window.scrollY || 0) > 20);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  var rv = $$('.rv');
  function showAll() { rv.forEach(function (el) { el.classList.add('in'); }); }
  if (AE.reduced || !('IntersectionObserver' in window)) showAll();
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
    setTimeout(showAll, 4000);
  }
  if (AE.gsap && window.SplitText) {
    $$('[data-split]').forEach(function (el) {
      var st = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 110, duration: .9, ease: 'power3.out', stagger: .08,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        } });
      el._split = st;
    });
  }
  var counters = $$('[data-count]');
  if (counters.length && !AE.reduced && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, end = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '';
        var from = parseFloat(el.getAttribute('data-from') || '0'), t0 = null;
        cio.unobserve(el);
        (function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / 1400, 1), v = from + (end - from) * (1 - Math.pow(1 - p, 3));
          el.textContent = Math.round(v) + suf;
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }
  $$('.acc-q').forEach(function (q) {
    var item = q.closest('.acc-item'), a = d.getElementById(q.getAttribute('aria-controls'));
    if (!a) return;
    if (q.getAttribute('aria-expanded') === 'true') item.classList.add('open');
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') !== 'true';
      q.setAttribute('aria-expanded', open);
      if (open) {
        a.style.height = a.scrollHeight + 'px';
        item.classList.add('open');
        setTimeout(function () { if (q.getAttribute('aria-expanded') === 'true') a.style.height = 'auto'; }, 360);
      } else {
        a.style.height = a.scrollHeight + 'px';
        requestAnimationFrame(function () { a.style.height = '0px'; item.classList.remove('open'); });
      }
    });
  });
  $$('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = $$('[required]', f).filter(function (el) {
        var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        return !ok;
      });
      var msg = f.querySelector('.form-msg');
      if (!msg) { msg = d.createElement('p'); msg.className = 'form-msg'; msg.setAttribute('role', 'status'); f.appendChild(msg); }
      msg.hidden = false;
      if (bad.length) { msg.textContent = 'Please fill in the marked fields.'; bad[0].focus(); return; }
      msg.textContent = 'Thank you. This is the preview site, so nothing was sent. On the live site this goes straight to AESCO.';
    });
  });
  if (AE.gsap) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  queue.forEach(AE.ready);
})();
