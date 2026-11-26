(function () {
  'use strict';
  var root = document.querySelector('.hs');
  if (!root) return;
  root.classList.add('hs-photo');
  Array.prototype.slice.call(root.querySelectorAll('.hs-link')).forEach(function (link) {
    link.addEventListener('focus', function () {
      var card = link.closest('.hs-cap');
      if (card) card.classList.add('is-reading');
    });
    link.addEventListener('blur', function () {
      var card = link.closest('.hs-cap');
      if (card) card.classList.remove('is-reading');
    });
  });
}());
