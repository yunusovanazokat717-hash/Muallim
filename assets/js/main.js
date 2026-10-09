// Muallim — kirish sahifasi: menyu, mavzu, ustoz personaji, animatsiyalar va «Sinab ko'ring» darsi
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var Ovoz = function () { return window.MuallimOvoz || null; };

  // Lug'at: «Sinab ko'ring» bo'limidagi 1-dars parchasi
  var LUGAT = {
    haza:    { tl: 'hāzā', uz: 'bu', izoh: "Ko'rsatish olmoshi — muzakkar (erkak jinsidagi) narsaga: هَذَا كِتَابٌ — «Bu kitob»." },
    kitab:   { tl: 'kitābun', uz: 'kitob', izoh: "Muzakkar ot. Oxiridagi «-un» (tanvin) so'z noaniq ekanini bildiradi. Ko'pligi: كُتُبٌ (kutubun)." },
    hazihi:  { tl: 'hāzihi', uz: 'bu', izoh: "Ko'rsatish olmoshi — muannas (ayol jinsidagi) narsaga: هَذِهِ مِسْطَرَةٌ — «Bu chizg'ich»." },
    mistara: { tl: 'misṭaratun', uz: "chizg'ich", izoh: "Muannas ot: oxiridagi ة (ta marbuta) ayol jinsi belgisi. ط — qalin «t»." },
    ayna:    { tl: 'ayna', uz: 'qayerda?', izoh: "Joy haqidagi so'roq so'zi: أَيْنَ الْقَلَمُ؟ — «Qalam qayerda?»." },
    sabbura: { tl: 'as-sabbūratu', uz: 'doska', izoh: "س — «quyosh harfi»: «al-» dagi «l» o'qilmaydi, س ikkilanadi: as-sabbūratu." },
    xuz:     { tl: 'xuzi', uz: 'ol!', izoh: "Buyruq fe'li (أَخَذَ — «oldi»). Asli خُذْ, keyingi «al-» bilan ulanganda oxiri «-i» bo'ladi." },
    qalam:   { tl: 'al-qalama', uz: 'qalamni', izoh: "Oxiridagi «-a» — tushum kelishigi: «qalamni ol». ق — chuqur, bo'g'izdan aytiladigan «q»." },
    hati:    { tl: 'hāti', uz: 'ber! (keltir!)', izoh: "Buyruq: «menga ber, olib kel». خُذِ ning teskarisi: خُذْ — «ol», هَاتِ — «ber»." },
    kurrasa: { tl: 'al-kurrāsata', uz: 'daftarni', izoh: "Muannas ot (ة bilan tugaydi). Oxiridagi «-a» — tushum kelishigi: «daftarni ber»." }
  };

  // =====================================================================
  //  USTOZ: 9 ta qiyofa (assets/img/ustoz/*.png) — gapirish, ko'z qisish, kayfiyat
  // =====================================================================
  var MOODS = ['tabassum', 'gapiradi', 'salom', 'kuladi', 'oylaydi', 'korsatadi', 'xavotir', 'kozqisadi', 'hayron'];
  var preloaded = {};

  function Ustoz(img) {
    var base = img.getAttribute('src').replace(/[^/]+\.png$/, '');
    if (!preloaded[base]) {
      preloaded[base] = true;
      MOODS.forEach(function (m) { var i = new Image(); i.src = base + m + '.png'; });
    }
    var rest = img.dataset.mood || 'tabassum';
    var talkTimer = null, idleTimer = null, flashTimer = null;

    function set(m) { if (img.dataset.now !== m) { img.src = base + m + '.png'; img.dataset.now = m; } }

    var api = {
      el: img,
      mood: function (m, ms) {
        clearTimeout(flashTimer);
        set(m);
        if (ms) flashTimer = setTimeout(function () { if (!talkTimer) set(rest); }, ms);
        else rest = m;
      },
      talk: function (on) {
        clearInterval(talkTimer); talkTimer = null;
        if (!on || reduceMotion) { set(rest); return; }
        var open = false;
        talkTimer = setInterval(function () {
          open = !open;
          set(open ? 'gapiradi' : (Math.random() < 0.25 ? 'kuladi' : 'tabassum'));
        }, 150 + Math.random() * 60);
      },
      idle: function () {
        if (reduceMotion) return;
        clearTimeout(idleTimer);
        (function loop() {
          idleTimer = setTimeout(function () {
            if (!talkTimer && img.dataset.now === rest) { set('kozqisadi'); setTimeout(function () { if (!talkTimer) set(rest); }, 650); }
            loop();
          }, 5200 + Math.random() * 4000);
        })();
      }
    };
    img.dataset.now = rest;
    return api;
  }

  // Ko'pikka yozuvni harfma-harf «yozish»
  function typeInto(el, text, done) {
    if (reduceMotion) { el.textContent = text; if (done) done(); return; }
    el.textContent = '';
    var t = document.createTextNode(''), caret = document.createElement('i');
    caret.className = 'caret';
    el.append(t, caret);
    var i = 0;
    (function step() {
      t.data = text.slice(0, ++i);
      if (i < text.length) setTimeout(step, /[.,!?—]/.test(text[i - 1]) ? 160 : 28);
      else { setTimeout(function () { caret.remove(); }, 900); if (done) done(); }
    })();
  }

  function speak(text, opts) {
    var O = Ovoz();
    opts = opts || {};
    if (!O) { if (opts.onEnd) opts.onEnd(); return false; }
    O.unlock();
    var ok = O.speak(text, opts);
    if (!ok && opts.onEnd) opts.onEnd();
    return ok;
  }

  // =====================================================================
  //  KINO-DARS namoyishi: 3 qadam; o'zi aylanadi, ▶ bosilsa ovoz bilan
  // =====================================================================
  var KINO = [
    {
      title: '1. Jarr harfi nima?',
      lines: [['فِي الْبَيْتِ', 'fil-bayti', 'uyda'], ['مِنَ الْبَيْتِ', 'minal-bayti', 'uydan']],
      say: "Jarr harfi ismdan oldin keladi va o'zbekchadagi «-da», «-dan», «-ga» qo'shimchalari vazifasini bajaradi. Masalan, فِي الْبَيْتِ — «uyda»."
    },
    {
      title: '2. Asosiy qoida: kasra',
      lines: [['الْبَيْتُ', 'al-baytu', 'uy'], ['فِي الْبَيْتِ', 'fil-bayti', 'uyda']],
      say: "Jarr harfidan keyingi ismning oxiri kasra bilan o'qiladi: الْبَيْتُ — al-baytu, lekin فِي الْبَيْتِ — fil-bayti."
    },
    {
      title: '3. Misol: uydan maktabga',
      lines: [['مِنَ الْبَيْتِ إِلَى الْمَدْرَسَةِ', 'minal-bayti ilal-madrasati', 'uydan maktabga']],
      say: "Ikkita jarr harfi bir jumlada: مِنْ — «-dan», إِلَى — «-ga». مِنَ الْبَيْتِ إِلَى الْمَدْرَسَةِ — «uydan maktabga»."
    }
  ];

  function initKino() {
    var box = document.getElementById('kino');
    if (!box) return;
    var stepEl = document.getElementById('kino-step');
    var linesEl = document.getElementById('kino-lines');
    var sub = document.getElementById('kino-sub');
    var segs = document.getElementById('kino-segs');
    var count = document.getElementById('kino-count');
    var play = document.getElementById('kino-play');
    var u = Ustoz(document.getElementById('kino-ustoz'));
    var idx = 0, timer = null, playing = false, visible = false, run = 0;

    KINO.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'kino-seg';
      b.setAttribute('aria-label', (i + 1) + '-qadam');
      b.innerHTML = '<i></i>';
      b.addEventListener('click', function () { show(i, playing); });
      segs.appendChild(b);
    });

    function esc(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
    function arWrap(s) { return esc(s).replace(/([؀-ۿ]+(?:\s[؀-ۿ]+)*)/g, '<span lang="ar" dir="rtl">$1</span>'); }

    function show(i, withVoice) {
      run++;
      var my = run;
      clearTimeout(timer);
      var O = Ovoz(); if (O) O.stop();
      u.talk(false);
      idx = i;
      var st = KINO[i];
      stepEl.textContent = st.title;
      linesEl.innerHTML = st.lines.map(function (l, k) {
        return '<li style="--k:' + k + '"><span class="kl-ar" lang="ar" dir="rtl">' + esc(l[0]) + '</span><span class="kl-tl">' + esc(l[1]) + '</span><span class="kl-uz">' + esc(l[2]) + '</span></li>';
      }).join('');
      sub.innerHTML = arWrap(st.say);
      box.classList.remove('is-anim'); void box.offsetWidth; box.classList.add('is-anim');
      Array.prototype.forEach.call(segs.children, function (s, k) {
        s.classList.toggle('done', k < i);
        s.classList.toggle('now', k === i);
      });
      count.textContent = (i + 1) + ' / ' + KINO.length;
      u.mood('korsatadi', 1400);   // doskaga ishora qiladi — qatorlar yozilayotganda

      var next = function () { if (my === run) show((i + 1) % KINO.length, playing); };
      if (withVoice && O) {
        O.unlock();
        var ok = O.speak(st.say, {
          onStart: function () { if (my === run) u.talk(true); },
          onEnd: function () {
            if (my !== run) return;
            u.talk(false);
            if (i + 1 < KINO.length) timer = setTimeout(next, 900);
            else { stop(); u.mood('kuladi', 1600); }
          }
        });
        if (!ok) stop();
      } else if (!reduceMotion && visible && !playing) {
        timer = setTimeout(next, 6500);
      }
    }

    function stop() {
      playing = false;
      play.setAttribute('aria-pressed', 'false');
      play.setAttribute('aria-label', 'Ovoz bilan tinglash');
      u.talk(false);
      var O = Ovoz(); if (O) O.stop();
    }

    play.addEventListener('click', function () {
      if (playing) { stop(); run++; clearTimeout(timer); return; }
      playing = true;
      play.setAttribute('aria-pressed', 'true');
      play.setAttribute('aria-label', "To'xtatish");
      show(idx, true);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !playing) show(idx, false);
        else if (!visible) { clearTimeout(timer); if (playing) { stop(); run++; } }
      }, { threshold: 0.35 }).observe(box);
    }
    show(0, false);
    u.idle();
  }

  // =====================================================================
  //  HERO: ustoz salomlashadi, ko'pikka yozadi; so'z bosilsa talaffuz
  // =====================================================================
  function initHero() {
    var img = document.getElementById('hero-ustoz');
    var bubble = document.getElementById('hero-bubble');
    if (!img || !bubble) return;
    var u = Ustoz(img);
    var greeting = "Assalomu alaykum! Men — Muallim ustoz. Doskadagi so'zni bosing, talaffuzini eshitasiz.";

    setTimeout(function () {
      img.classList.remove('ustoz-enter');
      img.classList.add('is-bob');
      u.talk(true);
      typeInto(bubble, greeting, function () { u.talk(false); u.mood('tabassum'); u.idle(); });
    }, reduceMotion ? 0 : 1900);

    document.querySelectorAll('.hw').forEach(function (w) {
      w.addEventListener('click', function () {
        document.querySelectorAll('.hw.is-on').forEach(function (x) { x.classList.remove('is-on'); });
        w.classList.add('is-on');
        var ar = w.textContent.trim();
        bubble.innerHTML = '';
        var a = document.createElement('span'); a.className = 'ar'; a.lang = 'ar'; a.dir = 'rtl'; a.textContent = ar;
        bubble.append(a, document.createTextNode(' — ' + w.dataset.tl + ' — «' + w.dataset.tr + '»'));
        u.talk(true);
        speak(ar, { onEnd: function () { u.talk(false); u.mood('kuladi', 1200); } });
        if (!Ovoz()) setTimeout(function () { u.talk(false); }, 900);
      });
    });

    // Chuqurlik effekti: sichqoncha bo'yicha qatlamlar har xil siljiydi; aylantirganda rozetka buriladi
    var stage = document.getElementById('hero-stage');
    var layers = stage ? Array.prototype.slice.call(stage.querySelectorAll('[data-depth]')) : [];
    if (!layers.length || reduceMotion) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    function frame() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      var rot = Math.min(window.scrollY, 900) * 0.04;
      layers.forEach(function (l) {
        var d = +l.dataset.depth;
        var t = 'translate3d(' + (cx * d).toFixed(2) + 'px,' + (cy * d).toFixed(2) + 'px,0)';
        if (l.classList.contains('stage-rosette')) t += ' rotate(' + rot.toFixed(2) + 'deg)';
        l.style.transform = t;
      });
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(frame) : null;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    if (finePointer) {
      document.querySelector('.hero').addEventListener('pointermove', function (e) {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
        kick();
      });
    }
    window.addEventListener('scroll', function () { if (window.scrollY < 1000) { tx += 0.00001; kick(); } }, { passive: true });
  }

  // Kartalarni kursor ostida biroz egish (faqat sichqonchali qurilmada)
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .12s ease-out, box-shadow .25s, border-color .25s';
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 9).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
      });
    });
  }

  // Savollar va CTA dagi ustozlar ham ko'z qisib turadi
  function initSideUstoz() {
    document.querySelectorAll('.faq-ustoz, .cta-ustoz').forEach(function (img) { Ustoz(img).idle(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // ---------------- Mavzu (yorug'/qorong'i) ----------------
    var themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
      var lightMq = window.matchMedia('(prefers-color-scheme: light)');
      var isLight = function () {
        var t = root.getAttribute('data-theme');
        return t ? t === 'light' : lightMq.matches;
      };
      var sync = function () {
        themeBtn.setAttribute('aria-label', isLight() ? "Tungi rejimga o'tish" : "Yorug' rejimga o'tish");
      };
      themeBtn.addEventListener('click', function () {
        var next = isLight() ? 'dark' : 'light';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('muallim-theme', next); } catch (e) {}
        sync();
      });
      lightMq.addEventListener('change', sync);
      sync();
    }

    // ---------------- Mobil menyu ----------------
    var nav = document.getElementById('site-nav');
    var toggle = document.querySelector('.nav-toggle');
    var toggleLabel = toggle && toggle.querySelector('.visually-hidden');
    function setMenu(open) {
      if (!toggle || !nav) return;
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (toggleLabel) toggleLabel.textContent = open ? 'Menyuni yopish' : 'Menyuni ochish';
    }
    if (toggle && nav) {
      toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
      nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
      });
      window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });
    }

    // ---------------- Aylantirish: header, tilla ko'rsatkich, «yo'l» chizig'i ----------------
    var header = document.querySelector('.site-header');
    var path = document.querySelector('.path');
    var progress = null;
    if (document.querySelector('main section') && !reduceMotion) {
      progress = document.createElement('div');
      progress.className = 'scroll-progress';
      progress.setAttribute('aria-hidden', 'true');
      document.body.appendChild(progress);
    }

    // Paydo bo'lish: faqat ekrandan pastdagi bloklar yashiriladi; yuqorida qolganlari ham ochiladi
    var pending = [];
    if (!reduceMotion) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        if (el.getBoundingClientRect().top > window.innerHeight) {
          var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
          el.style.setProperty('--delay', (Math.min(sib, 5) * 0.08) + 's');
          el.classList.add('will-reveal');
          pending.push(el);
        }
      });
    }
    function revealCheck() {
      if (!pending.length) return;
      var limit = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); return false; }
        return true;
      });
    }
    function onScroll() {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
      revealCheck();
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ')';
      }
      if (path && !reduceMotion) {
        var r = path.getBoundingClientRect();
        var p = (window.innerHeight * 0.75 - r.top) / r.height;
        path.style.setProperty('--line-progress', Math.max(0, Math.min(1, p)).toFixed(3));
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    initHero();
    initTilt();
    initSideUstoz();

    // ---------------- «Sinab ko'ring»: so'z tarjimasi ----------------
    var reader = document.getElementById('reader');
    var pop = document.getElementById('pop');
    if (reader && pop) {
      var q = function (s) { return pop.querySelector(s); };
      var playBtn = q('.pop-play');
      var active = null;
      var HARAKAT = /[ً-ٰٟ]/g;
      var showHarakat = true;

      reader.querySelectorAll('.w').forEach(function (w) { w.dataset.full = w.textContent; });

      var esc = function (s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
      var arSpan = function (s) { return esc(s).replace(/([؀-ۿ]+(?:\s[؀-ۿ]+)*)/g, '<span class="ar" lang="ar" dir="rtl">$1</span>'); };

      var close = function () {
        pop.hidden = true;
        if (active) active.classList.remove('is-active');
        active = null;
        var O = Ovoz(); if (O) O.stop();
        playBtn.classList.remove('is-playing');
      };

      var place = function () {
        if (!active) return;
        var cr = reader.getBoundingClientRect();
        var r = active.getBoundingClientRect();
        var pw = pop.offsetWidth, ph = pop.offsetHeight;
        var left = r.left - cr.left + r.width / 2 - pw / 2;
        left = Math.max(12, Math.min(left, cr.width - pw - 12));
        var top = r.bottom - cr.top + 8;
        if (r.bottom + 8 + ph > window.innerHeight - 12 && r.top - ph - 8 > 12) top = r.top - cr.top - ph - 8;
        pop.style.left = left + 'px';
        pop.style.top = top + 'px';
        if (pop.scrollIntoView) pop.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      };

      var sayWord = function () {
        if (!active) return;
        playBtn.classList.add('is-playing');
        speak(active.dataset.full, { onEnd: function () { playBtn.classList.remove('is-playing'); } });
      };

      var open = function (w) {
        if (active === w) { close(); return; }
        if (active) active.classList.remove('is-active');
        active = w;
        w.classList.add('is-active');
        var e = LUGAT[w.dataset.id] || {};
        q('.pop-word').textContent = w.dataset.full;
        q('.pop-tl').textContent = e.tl || '';
        q('.pop-uz').textContent = e.uz || '';
        q('.pop-note').innerHTML = e.izoh ? arSpan(e.izoh) : '';
        pop.hidden = false;
        place();
        sayWord();
      };

      reader.addEventListener('click', function (ev) {
        var w = ev.target.closest('.w');
        if (w) { open(w); return; }
        if (ev.target.closest('.pop-play')) { sayWord(); return; }
        if (ev.target.closest('.pop-close')) { var a = active; close(); if (a) a.focus(); return; }
        if (!pop.contains(ev.target)) close();
      });
      document.addEventListener('click', function (ev) { if (active && !reader.contains(ev.target)) close(); });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && active) { var a = active; close(); a.focus(); } });
      window.addEventListener('resize', function () { if (active) place(); });

      var hBtn = document.getElementById('harakat');
      if (hBtn) hBtn.addEventListener('click', function () {
        showHarakat = !showHarakat;
        hBtn.setAttribute('aria-pressed', String(showHarakat));
        reader.querySelectorAll('.w').forEach(function (w) {
          w.textContent = showHarakat ? w.dataset.full : w.dataset.full.replace(HARAKAT, '');
        });
        if (active) place();
      });
    }

    initKino();

    var year = document.querySelector('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  });

  // Boshqa sahifalar (kirish, ro'yxat) ham ustozdan foydalanadi
  window.MuallimUstoz = Ustoz;
})();
