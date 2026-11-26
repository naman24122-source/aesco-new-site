(function () {
  'use strict';
  var d = document;
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  each(d.querySelectorAll('.pd-gal'), function (gal) {
    var shots = gal.querySelectorAll('.pd-shot'), thumbs = gal.querySelectorAll('.pd-th');
    if (shots.length < 2 || shots.length !== thumbs.length) return;
    var cur = 0, timer = null;
    gal.classList.add('pd-on');
    function show(i) {
      if (i === cur) return;
      var prev = shots[cur];
      each(shots, function (s) { s.classList.remove('was-on'); });
      prev.classList.remove('is-on');
      prev.classList.add('was-on');
      shots[i].classList.add('is-on');
      thumbs[cur].setAttribute('aria-pressed', 'false');
      thumbs[i].setAttribute('aria-pressed', 'true');
      clearTimeout(timer);
      timer = setTimeout(function () { prev.classList.remove('was-on'); }, 650);
      cur = i;
    }
    each(thumbs, function (b, i) {
      b.addEventListener('click', function () { show(i); });
      b.addEventListener('keydown', function (e) {
        var n = thumbs.length, to = null;
        if (e.key === 'ArrowRight') to = (i + 1) % n;
        else if (e.key === 'ArrowLeft') to = (i - 1 + n) % n;
        if (to === null) return;
        e.preventDefault();
        thumbs[to].focus();
        show(to);
      });
    });
  });
})();
