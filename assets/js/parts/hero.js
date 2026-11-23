(function () {
  'use strict';
  var root = document.querySelector('.hx');
  if (!root) return;
  var AE = window.AE || {};
  var reduced = !!AE.reduced;
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var run = AE.ready || function (fn) { fn(); };
  function all(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  run(function () {
    var slides = all('.hx-slide'), caps = all('.hx-cap'), bars = all('.hx-bar');
    var n = slides.length;
    if (n < 2) return;
    var capsBox = root.querySelector('.hx-caps'), side = root.querySelector('.hx-side');
    var playBt = root.querySelector('.hx-play');
    var DUR = 6000, cur = 0, elapsed = 0, last = 0, raf = 0, outTimer = 0;
    var stopped = reduced, hover = false, focused = false, inView = true;
    root.classList.add('hx-live');
    if (!reduced) root.classList.add('hx-moving');
    function fill() {
      bars.forEach(function (b, i) {
        var p = i < cur ? 1 : (i === cur ? Math.min(elapsed / DUR, 1) : 0);
        var f = b.querySelector('b');
        if (f) f.style.transform = 'scaleX(' + p + ')';
      });
    }
    function show(i, byUser) {
      i = (i + n) % n;
      elapsed = 0;
      if (i === cur) { fill(); return; }
      if (capsBox) capsBox.setAttribute('aria-live', byUser ? 'polite' : 'off');
      var old = slides[cur];
      slides.forEach(function (s) { s.classList.remove('is-out'); });
      old.classList.remove('is-on');
      old.classList.add('is-out');
      old.setAttribute('aria-hidden', 'true');
      slides[i].classList.add('is-on');
      slides[i].removeAttribute('aria-hidden');
      caps[cur].classList.remove('is-on');
      caps[i].classList.add('is-on');
      bars[cur].classList.remove('is-on');
      bars[cur].removeAttribute('aria-current');
      bars[i].classList.add('is-on');
      bars[i].setAttribute('aria-current', 'true');
      clearTimeout(outTimer);
      outTimer = setTimeout(function () { old.classList.remove('is-out'); }, 1500);
      cur = i;
      fill();
    }
    function running() { return !reduced && !stopped && !hover && !focused && inView && !document.hidden; }
    function loop(t) {
      raf = 0;
      if (!running()) { last = 0; return; }
      if (last) elapsed += Math.min(t - last, 100);
      last = t;
      if (elapsed >= DUR) show(cur + 1, false); else fill();
      raf = requestAnimationFrame(loop);
    }
    function sync() {
      root.classList.toggle('hx-stopped', stopped || reduced);
      if (playBt) {
        playBt.disabled = reduced;
        playBt.setAttribute('aria-label', reduced ? 'Automatic slides disabled by reduced motion' : (stopped ? 'Play the slides' : 'Pause the slides'));
      }
      if (running() && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    }
    var prev = root.querySelector('.hx-prev'), next = root.querySelector('.hx-next');
    if (prev) prev.addEventListener('click', function () { show(cur - 1, true); sync(); });
    if (next) next.addEventListener('click', function () { show(cur + 1, true); sync(); });
    if (playBt) playBt.addEventListener('click', function () { stopped = !stopped; sync(); });
    bars.forEach(function (b, i) { b.addEventListener('click', function () { show(i, true); sync(); }); });
    if (side) {
      side.addEventListener('mouseenter', function () { hover = true; });
      side.addEventListener('mouseleave', function () { hover = false; sync(); });
    }
    root.addEventListener('focusin', function (e) {
      var kb = true;
      try { kb = e.target.matches(':focus-visible'); } catch (err) { kb = true; }
      if (kb) focused = true;
    });
    root.addEventListener('focusout', function (e) {
      if (!e.relatedTarget || !root.contains(e.relatedTarget)) { focused = false; sync(); }
    });
    document.addEventListener('visibilitychange', sync);
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', function () {
      reduced = motionQuery.matches;
      root.classList.toggle('hx-moving', !reduced);
      sync();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        sync();
      }, { threshold: 0.25 }).observe(root);
    }
    fill();
    sync();
  });
  run(function () {
    if (!(window.gsap && window.ScrollTrigger)) { root.classList.add('hx-ready'); return; }
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('hx-ready');
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {
    var copy = root.querySelector('.hx-copy'), h1 = root.querySelector('.hx-h1');
    var media = root.querySelector('.hx-media'), bg = root.querySelector('.hx-bg');
    var inner = root.querySelector('.hx-in'), side = root.querySelector('.hx-side');
    var lbl = copy.querySelector('.lbl'), rest = all('.hx-lead, .hx-bts'), facts = all('.hx-facts li');
    root.classList.add('hx-ready');
    function withRise(o) {
      var r = { y: 0, opacity: 1, duration: .9, ease: 'power3.out' };
      for (var k in o) r[k] = o[k];
      return r;
    }
    gsap.fromTo(media, { scale: 1.12 }, { scale: 1, duration: 2.6, ease: 'power2.out' });
    if (lbl) gsap.fromTo(lbl, { y: 16, opacity: 0 }, withRise({ delay: .1 }));
    var split = null;
    if (window.SplitText) {
      split = SplitText.create(h1, { type: 'lines', mask: 'lines', linesClass: 'hx-ln', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: .1, delay: .2 });
        } });
    } else {
      gsap.fromTo(h1, { y: 30, opacity: 0 }, withRise({ delay: .2 }));
    }
    gsap.fromTo(rest, { y: 26, opacity: 0 }, withRise({ delay: .65, stagger: .12 }));
    gsap.fromTo(side, { y: 26, opacity: 0 }, withRise({ delay: .95 }));
    gsap.fromTo(facts, { y: 20, opacity: 0 }, withRise({ delay: 1.05, stagger: .08 }));
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
      trigger: root,
      start: function () { return 'top ' + root.offsetTop + 'px'; },
      end: 'bottom top',
      scrub: .6,
      invalidateOnRefresh: true
    } })
      .to(inner, { y: -120, duration: 1 }, 0)
      .to(inner, { opacity: 0, duration: .7 }, 0)
      .to(bg, { scale: 1.08, duration: 1 }, 0);
    return function () { if (split) split.revert(); };
    });
  });
})();
