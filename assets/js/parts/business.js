(function () {
  'use strict';
  function run() {
    var AE = window.AE;
    if (!AE || !AE.gsap) return;
    var root = document.querySelector('.bz-proc');
    if (!root) return;
    var list = root.querySelector('.bz-steps');
    var steps = AE.$$('.bz-step', root);
    if (!list || !steps.length) return;
    var mm = gsap.matchMedia();
    mm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)' }, function (ctx) {
      var wide = ctx.conditions.wide, gap = 0.42;
      var tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: list, start: 'top 78%', once: true }
      });
      steps.forEach(function (s, i) {
        var at = i * gap;
        tl.from(s.querySelector('.bz-step-n'), { scale: 0.55, autoAlpha: 0, duration: 0.4 }, at)
          .from(s.querySelector('.bz-step-b'), { y: 18, autoAlpha: 0, duration: 0.5 }, at + 0.08);
        var link = s.querySelector('.bz-link');
        if (link) {
          tl.from(link, wide ? { scaleX: 0, duration: gap, ease: 'none' }
                             : { scaleY: 0, duration: gap, ease: 'none' }, at + 0.2);
        }
      });
    });
  }
  if (window.AE && window.AE.ready) window.AE.ready(run);
})();
