(function () {
  'use strict';
  var root = document.querySelector('.hs');
  if (!root || !(window.gsap && window.ScrollTrigger)) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);
  var ORDER = ['service', 'mains', 'panel', 'rooms', 'appliances', 'pump'];
  var STEPS = ORDER.length;   // one timeline second per step
  var FINAL = STEPS;          // the warm finale starts here
  var SPAN = STEPS + 0.6;     // timeline length = screens of scroll while pinned
  var LIT = 0.6;              // point inside a step when its fittings switch on
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(sel)); }
  function one(sel) { return root.querySelector(sel); }
  var stage = one('.hs-stage');
  var svg = one('.hs-svg');
  var caps = $$('.hs-cap');
  var endCard = one('.hs-end');
  var ticks = $$('.hs-tick');
  var fills = $$('.hs-fill');
  var water = one('.hs-water');
  var hint = one('.hs-hint');
  if (!stage || !svg || !endCard || caps.length !== STEPS) return;
  var circuits = ORDER.map(function (id) {
    var g = one('.hs-c[data-c="' + id + '"]');
    return {
      id: id, group: g,
      wires: $$('.hs-w', g), pulses: $$('.hs-p', g), flows: $$('.hs-f', g),
      fits: $$('.hs-fit[data-c="' + id + '"]'),
      tag: one('.hs-tag[data-c="' + id + '"]')
    };
  });
  function machines() {
    var by = {}, restores = [];
    function add(id, tw) { (by[id] = by[id] || []).push(tw); }
    function owner(el) { var f = el.closest('.hs-fit'); return f ? f.getAttribute('data-c') : ''; }
    $$('.hs-fan').forEach(function (fan) {
      var x = parseFloat(fan.getAttribute('data-x'));
      var blades = $$('.hs-blade', fan).map(function (b) {
        return { el: b, ph: parseFloat(b.getAttribute('data-ph')) || 0, t0: b.getAttribute('transform') };
      });
      var st = { a: 0 };
      add(fan.getAttribute('data-c'), gsap.to(st, {
        a: Math.PI * 2, duration: 0.85, ease: 'none', repeat: -1, paused: true,
        onUpdate: function () {
          blades.forEach(function (b) {
            var k = Math.cos(st.a + b.ph);
            b.el.setAttribute('transform', 'matrix(' + k.toFixed(3) + ' 0 0 1 ' + (x * (1 - k)).toFixed(2) + ' 0)');
          });
        }
      }));
      restores.push(function () { blades.forEach(function (b) { b.el.setAttribute('transform', b.t0); }); });
    });
    $$('[data-spin]').forEach(function (el) {
      add(owner(el), gsap.to(el, {
        rotation: 360, svgOrigin: el.getAttribute('data-spin'),
        duration: parseFloat(el.getAttribute('data-dur')) || 1, ease: 'none', repeat: -1, paused: true
      }));
    });
    $$('[data-blink]').forEach(function (el) {
      add(owner(el), gsap.to(el, { opacity: 0.15, duration: 0.5, ease: 'steps(1)', repeat: -1, yoyo: true, paused: true }));
    });
    var air = $$('.hs-air path');
    if (air.length) {
      var at = gsap.timeline({ repeat: -1, paused: true });
      air.forEach(function (p, k) {
        at.fromTo(p, { opacity: 0, y: -2 }, { opacity: 0.9, y: 3, duration: 0.5, ease: 'sine.out', immediateRender: false }, k * 0.25)
          .to(p, { opacity: 0, y: 8, duration: 0.5, ease: 'sine.in' }, k * 0.25 + 0.5);
      });
      add(owner(air[0]), at);
    }
    $$('.hs-flow').forEach(function (p) {
      add(owner(p), gsap.fromTo(p, { strokeDashoffset: 0 },
        { strokeDashoffset: -56, duration: 0.7, ease: 'none', repeat: -1, paused: true, immediateRender: false }));
    });
    circuits.forEach(function (c) {
      if (!c.flows.length) return;
      add(c.id, gsap.fromTo(c.flows, { strokeDashoffset: 0 },
        { strokeDashoffset: -94, duration: 1.3, ease: 'none', repeat: -1, paused: true, immediateRender: false }));
    });
    return { by: by, restore: function () { restores.forEach(function (f) { f(); }); } };
  }
  function runner(by) {
    var lit = {}, seen = false;
    function apply() {
      ORDER.forEach(function (id) {
        var go = seen && lit[id] && !root.classList.contains('hs-user-paused') && !document.hidden;
        (by[id] || []).forEach(function (tw) { if (go) tw.play(); else tw.pause(); });
      });
    }
    root.addEventListener('hs:motion', apply);
    document.addEventListener('visibilitychange', apply);
    return {
      lit: function (id, on) { if (lit[id] !== on) { lit[id] = on; apply(); } },
      seen: function (on) { if (seen !== on) { seen = on; apply(); } },
      destroy: function () {
        root.removeEventListener('hs:motion', apply);
        document.removeEventListener('visibilitychange', apply);
      }
    };
  }
  function watch(target, run) {
    var st = ScrollTrigger.create({
      trigger: target, start: 'top bottom', end: 'bottom top',
      onToggle: function (self) { run.seen(self.isActive); }
    });
    run.seen(st.isActive);
  }
  function desktop() {
    root.classList.add('hs-live');
    caps.concat(endCard).forEach(function (c) { c.classList.remove('rv'); });
    var m = machines(), run = runner(m.by);
    var state = ORDER.map(function () { return { lit: false, dim: false }; });
    var finalOn = false, cur = null;
    circuits.forEach(function (c) {
      gsap.set(c.wires, { drawSVG: '0% 0%' });
      gsap.set(c.pulses, { drawSVG: '0% 0%', opacity: 0 });
      if (c.tag) gsap.set(c.tag, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' });
    });
    gsap.set(caps.slice(1).concat(endCard), { autoAlpha: 0, y: 18 });
    gsap.set(fills, { scaleX: 0 });
    if (water) gsap.set(water, { scaleY: 0.3, svgOrigin: '770 214' });
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: sync,
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * 3.8); },
        pin: true,
        pinSpacing: true,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
    circuits.forEach(function (c, i) {
      tl.addLabel('step' + (i + 1), i);
      if (i > 0) {
        tl.to(caps[i - 1], { autoAlpha: 0, y: -18, duration: 0.16 }, i)
          .fromTo(caps[i], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.2, immediateRender: false }, i + 0.08);
      }
      tl.to(fills[i], { scaleX: 1, duration: 1 }, i);
      if (c.tag) tl.to(c.tag, { opacity: 1, scale: 1, duration: 0.12 }, i + 0.04);
      c.wires.forEach(function (w, k) {
        var o = parseFloat(w.getAttribute('data-o')) || 0;
        var at = i + 0.08 + o * 0.22, dur = 0.34 - o * 0.08;
        tl.to(w, { drawSVG: '0% 100%', duration: dur }, at);
        var p = c.pulses[k];
        if (!p) return;
        var len = DrawSVGPlugin.getLength(p), seg = Math.min(46, len * 0.4);
        tl.fromTo(p, { drawSVG: '0 0', opacity: 1 },
          { drawSVG: (len - seg) + ' ' + len, duration: dur, immediateRender: false }, at)
          .to(p, { opacity: 0, duration: 0.05 }, at + dur);
      });
    });
    if (water) tl.to(water, { scaleY: 1, duration: 0.6 }, STEPS - 1 + LIT);
    tl.addLabel('all', FINAL)
      .to(caps[STEPS - 1], { autoAlpha: 0, y: -18, duration: 0.16 }, FINAL)
      .fromTo(endCard, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.2, immediateRender: false }, FINAL + 0.08);
    if (hint) tl.to(hint, { autoAlpha: 0, duration: 0.16 }, FINAL);
    var d = tl.duration();
    if (d < SPAN) tl.to({}, { duration: SPAN - d }, d);
    function sync() {
      var t = tl.time();
      var fin = t >= FINAL;
      var step = Math.max(0, Math.min(STEPS - 1, Math.floor(t)));
      circuits.forEach(function (c, i) {
        var s = state[i];
        var lit = t >= i + LIT;
        var dim = lit && !fin && step > i;
        if (lit !== s.lit) {
          s.lit = lit;
          c.group.classList.toggle('is-on', lit);
          c.fits.forEach(function (f) { f.classList.toggle('is-on', lit); });
          run.lit(c.id, lit);
        }
        if (dim !== s.dim) {
          s.dim = dim;
          c.group.classList.toggle('is-dim', dim);
          c.fits.forEach(function (f) { f.classList.toggle('is-dim', dim); });
        }
      });
      if (fin !== finalOn) { finalOn = fin; root.classList.toggle('is-final', fin); }
      var active = fin ? -1 : step;
      if (active !== cur) {
        cur = active;
        ticks.forEach(function (b, i) {
          b.classList.toggle('is-on', i === active);
          b.classList.toggle('is-done', active === -1 || i < active);
          if (i === active) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        });
      }
    }
    function go(e) {
      var i = parseInt(e.currentTarget.getAttribute('data-i'), 10) || 0;
      var st = tl.scrollTrigger;
      var y = st.start + (st.end - st.start) * ((i + 0.85) / tl.duration());
      window.scrollTo({ top: Math.round(y), behavior: 'smooth' });
    }
    ticks.forEach(function (b) { b.addEventListener('click', go); });
    watch(root, run);
    sync();
    return function () {
      ticks.forEach(function (b) {
        b.removeEventListener('click', go);
        b.classList.remove('is-on', 'is-done');
        b.removeAttribute('aria-current');
      });
      run.destroy();
      m.restore();
      root.classList.remove('hs-live', 'is-final');
      $$('.is-on, .is-dim').forEach(function (el) { el.classList.remove('is-on', 'is-dim'); });
      caps.concat(endCard).forEach(function (c) { c.classList.add('rv', 'in'); });
    };
  }
  function narrow() {
    var m = machines(), run = runner(m.by);
    ORDER.forEach(function (id) { run.lit(id, true); });
    watch(svg, run);
    return function () { run.destroy(); m.restore(); };
  }
  gsap.matchMedia().add({
    motion: '(prefers-reduced-motion: no-preference)',
    wide: '(min-width: 900px) and (min-height: 560px)',
    small: '(max-width: 899.98px), (max-height: 559.98px)'
  }, function (ctx) {
    if (!ctx.conditions.motion) return;
    if (ctx.conditions.wide && window.DrawSVGPlugin) return desktop();
    return narrow();
  });
})();
