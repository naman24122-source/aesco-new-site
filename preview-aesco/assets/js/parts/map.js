(function () {
  'use strict';
  var root = document.querySelector('.mp');
  if (!root) return;
  function $$(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  var chips = $$('.mp-chip');
  function chipFor(id) { return chips.filter(function (c) { return c.getAttribute('data-state') === id; })[0]; }
  function pressed(id) { var c = chipFor(id); return !!c && c.getAttribute('aria-pressed') === 'true'; }
  function hot(id, on) {
    var st = document.getElementById(id), c = chipFor(id);
    if (on === false && pressed(id)) on = true;
    if (st && root.contains(st)) st.classList.toggle('mp-hot', on);
    if (c) c.classList.toggle('mp-hot', on);
  }
  chips.forEach(function (c) {
    var id = c.getAttribute('data-state');
    c.addEventListener('mouseenter', function () { hot(id, true); });
    c.addEventListener('mouseleave', function () { hot(id, false); });
    c.addEventListener('focus', function () { hot(id, true); });
    c.addEventListener('blur', function () { hot(id, false); });
    c.addEventListener('click', function () {
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      hot(id, false);
    });
  });
  $$('.mp-st.mp-on').forEach(function (st) {
    st.addEventListener('mouseenter', function () { hot(st.id, true); });
    st.addEventListener('mouseleave', function () { hot(st.id, false); });
  });
  if (!(window.gsap && window.ScrollTrigger && window.DrawSVGPlugin)) return;
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {
  var card = root.querySelector('.mp-card'), map = root.querySelector('.mp-map');
  var outline = root.querySelector('.mp-outline'), isles = root.querySelector('.mp-isles');
  var states = $$('.mp-st'), on = $$('.mp-st.mp-on');
  var drop = root.querySelector('.mp-drop'), tag = root.querySelector('.mp-tag');
  var rings = $$('.mp-ring');
  if (!card || !map || !outline || !isles || !states.length) return;
  var tl, pulse;
  try {
    var o = (map.getAttribute('data-origin') || '0 0').split(' ').map(Number);
    var dist = new Map();
    states.forEach(function (st) {
      var b = st.getBBox(), dx = b.x + b.width / 2 - o[0], dy = b.y + b.height / 2 - o[1];
      dist.set(st, dx * dx + dy * dy);
    });
    var order = states.slice().sort(function (a, b) { return dist.get(a) - dist.get(b); });
    var off = states.filter(function (s) { return on.indexOf(s) < 0; })[0];
    var grey = off ? getComputedStyle(off).fill : '#e6e0db';
    var red = on.length ? getComputedStyle(on[0]).fill : grey;
    pulse = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.5 });
    rings.forEach(function (r, i) {
      pulse.fromTo(r, { scale: 0.15, opacity: 0.7 },
        { scale: 1, opacity: 0, duration: 2.1, ease: 'power1.out', immediateRender: false }, i * 0.6);
    });
    gsap.set(outline, { drawSVG: '50% 50%' });
    gsap.set(isles, { drawSVG: '0%' });
    gsap.set(states, { opacity: 0 });
    gsap.set(on, { fill: grey });
    gsap.set(drop, { y: -56, opacity: 0 });
    gsap.set(tag, { x: -8, opacity: 0 });
    tl = gsap.timeline({ paused: true, onComplete: function () { if (inView && !document.hidden) pulse.play(0); started = true; } });
    tl.to(outline, { drawSVG: '0% 100%', duration: 1.8, ease: 'power1.inOut' }, 0)
      .to(isles, { drawSVG: '100%', duration: 0.6, ease: 'power1.out' }, 1.3)
      .to(order, { opacity: 1, duration: 0.45, ease: 'power1.out', stagger: 0.03 }, 0.25)
      .to(on, { fill: red, duration: 0.6, ease: 'power2.out', stagger: 0.12, clearProps: 'fill' }, 1.5)
      .to(drop, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 1.6)
      .to(tag, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 2.2);
  } catch (e) {
    if (tl) tl.progress(1).kill();
    gsap.set([outline, isles, drop, tag].concat(states), { clearProps: 'all' });
    if (window.console) console.error(e);
    return;
  }
  var inView = false, started = false;
  ScrollTrigger.create({
    trigger: card, start: 'top 78%', once: true,
    onEnter: function () { tl.play(); }
  });
  ScrollTrigger.create({
    trigger: card, start: 'top bottom', end: 'bottom top',
    onToggle: function (self) {
      inView = self.isActive;
      if (!started) return;
      if (inView && !document.hidden) pulse.resume(); else pulse.pause();
    }
  });
  function visibility() { if (started && inView && !document.hidden) pulse.resume(); else pulse.pause(); }
  document.addEventListener('visibilitychange', visibility);
  return function () { document.removeEventListener('visibilitychange', visibility); };
  });
})();
