(function () {
  'use strict';
  var d = document, root = d.documentElement, me = d.currentScript;
  var btn = d.querySelector('[data-chat-open]');
  if (!btn || !d.querySelector || !window.matchMedia) return;
  var D, Q, panel, scrim, log, chips, form, input, inLabel, focusTo = null, busy = false, isOpen = false, hideT;
  var state = { mode: 'menu', step: 0, ans: {} };
  var motionMq = matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return motionMq.matches; }
  var SVG = {
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h13M12 5l7 7-7 7"/>',
    wa: '<path d="M3 21l1.6-4.7A9 9 0 1 1 8 19.6L3 21z"/><path d="M9 9.5c.3 1.6 1.4 3.5 3.5 4.6.6.3 1.2.1 1.6-.3l.6-.7-1.6-1-.8.6c-.9-.4-1.7-1.2-2.1-2.1l.6-.8-1-1.6-.7.6c-.3.3-.4.6-.1.7z"/>',
    call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>'
  };
  function svg(name, size, cls) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + SVG[name] + '</svg>';
  }
  function el(tag, cls, text) {
    var e = d.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function ready() {
    D = window.AE_CHAT; Q = D.quote;
    btn.insertAdjacentHTML('beforeend', svg('x', 22, 'aec-dock-x')); // shown while the chat is open
    btn.classList.add('ready');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () { if (isOpen) close(true); else open(); });
  }
  if (window.AE_CHAT) ready();
  else {
    var s = d.createElement('script');
    s.src = me && me.src ? me.src.replace(/chat\.js(\?|$)/, 'chat-data.js$1') : 'assets/js/chat-data.js';
    s.onload = function () { if (window.AE_CHAT) ready(); };
    d.head.appendChild(s);
  }
  function build() {
    scrim = el('div', 'aec-scrim'); scrim.hidden = true;
    panel = el('div', 'aec');
    panel.id = 'aec-panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'aec-title'); panel.setAttribute('aria-describedby', 'aec-sub');
    panel.innerHTML =
      '<div class="aec-head"><div class="aec-head-t"><h2 class="aec-title" id="aec-title"></h2><p class="aec-sub" id="aec-sub"></p></div>' +
      '<button class="aec-x" type="button">' + svg('x', 22) + '</button></div>' +
      '<div class="aec-log" role="log" aria-live="polite" aria-relevant="additions" tabindex="-1"></div>' +
      '<div class="aec-chips" role="group"></div>' +
      '<form class="aec-form" novalidate><label class="aec-sr" for="aec-in"></label>' +
      '<input class="aec-in" id="aec-in" type="text" maxlength="200" autocomplete="off" enterkeyhint="send">' +
      '<button class="aec-send" type="submit">' + svg('arrow', 20) + '</button></form>';
    panel.querySelector('.aec-title').textContent = D.ui.title;
    panel.querySelector('.aec-sub').textContent = D.ui.sub;
    panel.querySelector('.aec-x').setAttribute('aria-label', D.ui.close);
    panel.querySelector('.aec-send').setAttribute('aria-label', D.ui.send);
    log = panel.querySelector('.aec-log'); log.setAttribute('aria-label', D.ui.log);
    chips = panel.querySelector('.aec-chips'); chips.setAttribute('aria-label', D.ui.chips);
    form = panel.querySelector('.aec-form'); input = panel.querySelector('.aec-in');
    inLabel = panel.querySelector('.aec-sr');
    setInput(D.ui.input, 'off');
    d.body.appendChild(scrim); d.body.appendChild(panel);
    btn.setAttribute('aria-controls', panel.id);
    panel.querySelector('.aec-x').addEventListener('click', function () { close(true); });
    scrim.addEventListener('click', function () { close(true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); typed(); });
    panel.addEventListener('keydown', trap);
    d.addEventListener('keydown', function (e) { if (isOpen && e.key === 'Escape') { e.preventDefault(); close(true); } });
    d.addEventListener('pointerdown', function (e) {
      if (isOpen && !panel.contains(e.target) && !btn.contains(e.target) && e.target !== scrim) close(false);
    });
    window.addEventListener('resize', fit);
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', fit);
      visualViewport.addEventListener('scroll', fit);
    }
    botSay(D.topics.greet);
    setChips(D.topics.greet.chips);
  }
  function fit() {
    if (!isOpen) return;
    var dock = d.querySelector('.dock'), vv = window.visualViewport, kb = 0;
    var was = panel.classList.contains('aec-kb');
    if (dock) panel.style.setProperty('--aec-above', Math.round(window.innerHeight - dock.getBoundingClientRect().top + 8) + 'px');
    if (vv && vv.scale < 1.01) kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    panel.classList.toggle('aec-kb', kb > 80);
    if (kb > 80) {
      panel.style.setProperty('--aec-kb', Math.round(kb) + 'px');
      panel.style.setProperty('--aec-vh', Math.round(vv.height) + 'px');
    }
    if (was !== kb > 80) scrollDown(true); // the log just changed height: keep the newest message in view
  }
  function open() {
    if (!panel) build();
    clearTimeout(hideT);
    isOpen = true;
    panel.hidden = false; scrim.hidden = false;
    fit();
    void panel.offsetWidth;
    panel.classList.add('is-in'); scrim.classList.add('is-in');
    root.classList.add('aec-open');
    btn.setAttribute('aria-expanded', 'true');
    focusNext(false);
    scrollDown(true);
  }
  function close(restore) {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('is-in'); scrim.classList.remove('is-in');
    root.classList.remove('aec-open');
    btn.setAttribute('aria-expanded', 'false');
    hideT = setTimeout(function () { panel.hidden = true; scrim.hidden = true; }, reduced() ? 0 : 220);
    if (restore) btn.focus();
  }
  function trap(e) {
    if (e.key !== 'Tab') return;
    var f = [].slice.call(panel.querySelectorAll('a[href], button:not([disabled]), input'))
      .filter(function (x) { return x.getClientRects().length; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], at = f.indexOf(d.activeElement);
    if (e.shiftKey && (at <= 0)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (at === -1 || at === f.length - 1)) { e.preventDefault(); first.focus(); }
  }
  function scrollDown(instant) {
    var m = log.lastElementChild;
    if (!m) return;
    var top = m.offsetHeight > log.clientHeight - 24 ? m.offsetTop - 12 : log.scrollHeight;
    if (log.scrollTo && !instant && !reduced()) log.scrollTo({ top: top, behavior: 'smooth' });
    else log.scrollTop = top;
  }
  function fill(text, vars) {
    return String(text).replace(/\{(\w+)\}/g, function (_, k) { return (vars && vars[k]) || state.ans[k] || ''; });
  }
  function botSay(t, extraActs, vars) {
    var m = el('div', 'aec-msg aec-bot');
    (t.say || []).forEach(function (p) { m.appendChild(el('p', null, fill(p, vars))); });
    if (t.list) {
      var ul = el('ul', 'aec-links');
      t.list.forEach(function (l) {
        var a = el('a'); a.href = l.h;
        a.appendChild(el('span', null, l.t));
        a.insertAdjacentHTML('beforeend', svg('arrow', 16));
        var li = el('li'); li.appendChild(a); ul.appendChild(li);
      });
      m.appendChild(ul);
    }
    if (t.bullets) {
      var bl = el('ul', 'aec-bul');
      t.bullets.forEach(function (b) { bl.appendChild(el('li', null, b)); });
      m.appendChild(bl);
    }
    if (t.rows) {
      var dl = el('dl', 'aec-sum');
      t.rows.forEach(function (r) { dl.appendChild(el('dt', null, r[0])); dl.appendChild(el('dd', null, r[1])); });
      m.appendChild(dl);
    }
    if (t.opts) {
      var ol = el('ul', 'aec-opts');
      t.opts.forEach(function (o) {
        var b = el('button', null, o.t);
        b.type = 'button';
        b.addEventListener('click', function () { if (!busy) o.fn(); });
        var li = el('li'); li.appendChild(b); ol.appendChild(li);
      });
      m.appendChild(ol);
    }
    if (t.after) m.appendChild(el('p', null, t.after));
    var acts = (t.acts || []).concat(extraActs || []);
    if (acts.length) {
      var row = el('div', 'aec-acts');
      acts.forEach(function (x) {
        var a = el('a', 'aec-act aec-act-' + x.k);
        a.href = x.h;
        if (x.k === 'wa') { a.target = '_blank'; a.rel = 'noopener'; }
        if (SVG[x.k]) a.insertAdjacentHTML('beforeend', svg(x.k, 18));
        a.appendChild(el('span', null, x.t));
        row.appendChild(a);
      });
      m.appendChild(row);
    }
    if (t.note) m.appendChild(el('p', 'aec-note', t.note));
    log.appendChild(m);
    scrollDown();
    return m;
  }
  function userSay(text) {
    var m = el('div', 'aec-msg aec-me');
    m.appendChild(el('p', null, text));
    log.appendChild(m);
    scrollDown();
  }
  function reply(fn, keepInput) {
    var hadInput = keepInput || d.activeElement === input, dots = null;
    if (!hadInput) log.focus({ preventScroll: true });
    setChips([]);
    busy = true;
    function done() {
      busy = false;
      if (dots && dots.parentNode) dots.parentNode.removeChild(dots);
      fn();
      scrollDown(); // again, now the reply buttons below have taken their space
      if (isOpen) focusNext(hadInput);
    }
    if (reduced()) { done(); return; }
    dots = el('div', 'aec-msg aec-bot aec-typing');
    dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(dots);
    scrollDown();
    setTimeout(done, 550);
  }
  function focusNext(stayInInput) {
    var step = state.mode === 'quote' && Q.steps[state.step], c = chips.querySelector('button');
    var opt = log.lastElementChild && log.lastElementChild.querySelector('.aec-opts button');
    var go = focusTo || (step ? (step.chips ? opt : input) : stayInInput ? input : c) || input;
    focusTo = null;
    go.focus({ preventScroll: true });
  }
  function setChips(list) {
    chips.textContent = '';
    list.forEach(function (c) {
      var b = el('button', 'aec-chip');
      b.type = 'button';
      if (typeof c === 'string') {
        b.textContent = D.labels[c.split(':')[0]] || c;
        b.addEventListener('click', function () { if (busy) return; userSay(b.textContent); route(c); });
      } else {
        b.textContent = c.t;
        if (c.k === 'quiet') b.className += ' aec-chip-quiet';
        b.addEventListener('click', function () { if (busy) return; c.fn(); });
      }
      chips.appendChild(b);
    });
  }
  function route(id, vars) {
    if (id === 'quote' || id.indexOf('quote:') === 0) return startQuote(id.split(':')[1]);
    var t = D.topics[id];
    if (!t) return;
    reply(function () { botSay(t, null, vars); setChips(t.chips || []); });
  }
  function stateIn(joined) {
    for (var i = 0; i < D.states.length; i++) if (joined.indexOf(' ' + D.states[i][0] + ' ') > -1) return D.states[i];
    return null;
  }
  function matchText(text) {
    var s = text.toLowerCase().replace(/in[\s-]+house/g, 'inhouse');
    var toks = s.split(/[^a-z0-9]+/).filter(Boolean), joined = ' ' + toks.join(' ') + ' ';
    var best = null, bestN = 0, prod = null, prodN = 0, quoteN = 0;
    D.match.forEach(function (r) {
      var n = 0;
      r.words.forEach(function (w) {
        var hit = w.indexOf(' ') > -1 ? joined.indexOf(' ' + w + ' ') > -1
          : w.slice(-1) === '*' ? toks.some(function (t) { return t.indexOf(w.slice(0, -1)) === 0; })
          : toks.indexOf(w) > -1;
        if (hit) n += r.w;
      });
      if (n > bestN) { best = r.to; bestN = n; }
      if (r.to.indexOf('prod-') === 0 && n > prodN) { prod = r.to.slice(5); prodN = n; }
      if (r.to === 'quote') quoteN = n;
    });
    if (quoteN && prod) return 'quote:' + prod;
    if (best === 'reach') {
      var st = stateIn(joined);
      if (st) return { id: st[2] ? 'reach-yes' : 'reach-no', vars: { s: st[1] } };
    }
    return best;
  }
  function typed() {
    if (busy) return;
    var text = input.value.replace(/\s+/g, ' ').trim();
    if (state.mode === 'quote') return answer(text, text);
    if (!text) { input.focus(); return; }
    input.value = '';
    userSay(text);
    var id = matchText(text);
    if (id && id.id) return route(id.id, id.vars);
    if (id) return route(id);
    reply(function () {
      botSay(D.fallback, [
        { t: D.ui.askWa, h: 'https://wa.me/' + D.wa + '?text=' + encodeURIComponent('Hello AESCO, ' + text), k: 'wa' },
        { t: D.labels.call, h: D.tel, k: 'call' }
      ]);
      setChips(D.fallback.chips);
    }, true);
  }
  function setInput(label, auto) {
    inLabel.textContent = label;
    input.placeholder = label;
    input.setAttribute('autocomplete', auto || 'off');
  }
  function startQuote(slug) {
    state = { mode: 'quote', step: 0, ans: {} };
    if (slug && D.names[slug]) state.ans.product = D.names[slug];
    reply(function () { ask(fill(state.ans.product ? Q.startFor : Q.start)); });
  }
  function ask(lead) {
    while (Q.steps[state.step] && state.ans[Q.steps[state.step].key] != null) state.step++;
    var step = Q.steps[state.step];
    if (!step) return summary();
    var opts = (step.chips || []).map(function (v) { return { t: v, fn: function () { answer(v, v); } }; });
    botSay({ say: lead ? [lead, step.ask] : [step.ask], opts: opts.length ? opts : null });
    setInput(step.label, step.auto);
    var list = [];
    if (step.optional) list.push({ t: step.skip, fn: function () { answer('', step.skip); } });
    list.push({ t: Q.cancel, k: 'quiet', fn: cancelQuote });
    setChips(list);
  }
  function answer(value, shown) {
    var step = Q.steps[state.step];
    if (!step) return;
    value = String(value).slice(0, 120);
    if (!value && (!step.optional || state.other)) {
      botSay({ say: [(state.other && step.otherNeed) || step.need] });
      input.focus();
      return;
    }
    input.value = '';
    dropOpts();
    userSay(shown || step.skip);
    if (step.other && value === step.other && !state.other) {
      state.other = true;
      reply(function () {
        botSay({ say: [step.otherAsk] });
        setChips([{ t: Q.cancel, k: 'quiet', fn: cancelQuote }]);
      });
      return;
    }
    state.other = false;
    state.ans[step.key] = value;
    state.step++;
    reply(function () { ask(); });
  }
  function dropOpts() {
    [].slice.call(log.querySelectorAll('.aec-opts')).forEach(function (o) { o.parentNode.removeChild(o); });
  }
  function cancelQuote() {
    dropOpts();
    userSay(Q.cancel);
    state = { mode: 'menu', step: 0, ans: {} };
    setInput(D.ui.input, 'off');
    reply(function () { botSay({ say: [Q.cancelled] }); setChips(D.topics.menu.chips); });
  }
  function summary() {
    var a = state.ans, rows = [], lines = [Q.waHead];
    ['name', 'product', 'size', 'city'].forEach(function (k) {
      var v = a[k] || Q.none;
      rows.push([Q.fields[k], v]);
      lines.push(Q.fields[k] + ': ' + v);
    });
    state = { mode: 'menu', step: 0, ans: {} };
    setInput(D.ui.input, 'off');
    var m = botSay({
      say: [Q.summary], rows: rows, note: Q.note,
      acts: [{ t: Q.send, h: 'https://wa.me/' + D.wa + '?text=' + encodeURIComponent(lines.join('\n')), k: 'wa' },
             { t: Q.callInstead, h: D.tel, k: 'call' }]
    });
    focusTo = m.querySelector('.aec-act-wa');
    setChips([{ t: Q.restart, fn: function () { userSay(Q.restart); startQuote(); } }, 'menu']);
  }
})();
