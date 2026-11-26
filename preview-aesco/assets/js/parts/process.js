(function () {
  'use strict';
  var root = document.querySelector('.pc');
  if (!root) return;
  var view = root.querySelector('.pc-view');
  var track = root.querySelector('.pc-track');
  var steps = [].slice.call(root.querySelectorAll('.pc-step'));
  var names = [].slice.call(root.querySelectorAll('.pc-names li'));
  var now = root.querySelector('.pc-now');
  var fill = root.querySelector('.pc-fill');
  var n = steps.length;
  var WIDE = '(min-width: 900px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';
  if (!view || !track || !n) return;
  function syncFocus() {
    var scrolls = !root.classList.contains('pc-on') && view.scrollWidth > view.clientWidth + 2;
    if (scrolls) {
      view.setAttribute('tabindex', '0');
      view.setAttribute('role', 'region');
      view.setAttribute('aria-label', 'The six stages, scroll sideways to see them all');
    } else {
      view.removeAttribute('tabindex');
      view.removeAttribute('role');
      view.removeAttribute('aria-label');
    }
  }
  syncFocus();
  window.addEventListener('load', syncFocus);
  window.addEventListener('resize', syncFocus);
  var last = -1;
  function setStep(p) {
    var i = Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
    if (fill) fill.style.transform = 'scaleX(' + ((p * (n - 1) + 1) / n).toFixed(4) + ')';
    if (i === last) return;
    last = i;
    if (now) now.textContent = (i < 9 ? '0' : '') + (i + 1);
    names.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
    steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
  }
  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();
    mm.add(WIDE, function () {
      root.classList.add('pc-on');
      syncFocus();
      steps.forEach(function (s) { s.classList.add('in'); });
      ScrollTrigger.create({ trigger: root, start: 'top bottom+=900', once: true, onEnter: function () {
        [].slice.call(root.querySelectorAll('img[loading="lazy"]')).forEach(function (im) { im.loading = 'eager'; });
      } });
      function dist() { return Math.max(0, track.offsetWidth - view.clientWidth); }
      var move = gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: function () { return '+=' + dist(); },
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) { setStep(self.progress); },
          onRefresh: function (self) { setStep(self.progress); }
        }
      });
      steps.forEach(function (s) {
        var par = s.querySelector('.pc-par');
        if (!par) return;
        gsap.fromTo(par, { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: s, containerAnimation: move, start: 'left right', end: 'right left', scrub: true }
        });
      });
      setStep(0);
      return function () {
        root.classList.remove('pc-on');
        last = -1;
        if (fill) fill.style.transform = '';
        steps.forEach(function (s) { s.classList.remove('is-on'); });
        syncFocus();
      };
    });
  }
  if (window.AE && AE.ready) AE.ready(init);
})();
