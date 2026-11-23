(function () {
  'use strict';
  if (!(window.AE && window.gsap && window.ScrollTrigger)) return;
  AE.ready(function () {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', function () {
      AE.$$('.hm-about .hm-par, .hm-mv .hm-par').forEach(function (frame) {
        var pic = frame.querySelector('img, .slot');
        if (!pic) return;
        gsap.fromTo(pic, { yPercent: -6, scale: 1.14 }, {
          yPercent: 6, scale: 1.14, ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
        });
      });
    });
    var band = document.querySelector('.hm-pt');
    var cores = band ? AE.$$('.hm-pt-lines path', band) : [];
    if (cores.length && window.DrawSVGPlugin) {
      gsap.from(cores, {
        drawSVG: '0%', duration: 1.8, ease: 'power2.inOut', stagger: 0.14,
        scrollTrigger: { trigger: band, start: 'top 75%', once: true }
      });
    }
    });
  });
})();
