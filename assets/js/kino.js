/*
 * Muallim Kino — kino ko'rib arab tilini o'rganish.
 *
 * Kino arabcha subtitr va o'zbekcha tarjima bilan ko'rsatiladi. Foydalanuvchi bilmagan so'zlar
 * (BILADI ro'yxatida yo'qlari) o'zi «Kinodan lug'at»ga yig'iladi. Kino tugagach — shu so'zlar,
 * gaplar va iboralar bo'yicha kichik dars va quiz.
 *
 * HAQIQIY FILM ULASH: FILM.video ga video manzilini, har bir replikaga start/end (soniya) bering —
 * pleyer vaqtni <video> dan oladi, sahna animatsiyasi o'rniga video ko'rsatiladi.
 * Hozirgi namuna — animatsion sahna: ovoz brauzer orqali, vaqt — replikalar bo'yicha.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var Ovoz = function () { return window.MuallimOvoz || null; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var HARAKAT = /[ً-ٰٟ]/g;
  function arWrap(s) { return esc(s).replace(/([؀-ۿ]+(?:[\s،؟]+[؀-ۿ]+)*)/g, '<span class="ar" lang="ar" dir="rtl">$1</span>'); }

  // =====================================================================
  //  1. LUG'AT — kinodagi har bir so'z
  // =====================================================================
  var DICT = {
    salam:   { ar: 'السَّلَامُ', tl: 'as-salāmu', uz: 'tinchlik, salom', izoh: "«al-» bilan aniq shakl. س — quyosh harfi: «al-» dagi «l» o'qilmaydi." },
    alaykum: { ar: 'عَلَيْكُمْ', tl: 'ʿalaykum', uz: 'sizlarga', izoh: "عَلَى («ustida, -ga») + كُمْ («sizlar»)." },
    ya:      { ar: 'يَا', tl: 'yā', uz: 'ey (murojaat)', izoh: "Kimgadir murojaat qilganda ism oldidan keladi: يَا عَلِيُّ — «Ey Ali»." },
    awlad:   { ar: 'أَوْلَادُ', tl: 'awlādu', uz: 'bolalar', izoh: "Ko'plik. Birligi: وَلَدٌ (waladun) — bola, o'g'il bola." },
    wa:      { ar: 'وَ', tl: 'wa', uz: 'va', izoh: "Keyingi so'zga qo'shib yoziladi: وَعَلَيْكُمُ." },
    ustaz:   { ar: 'أُسْتَاذُ', tl: 'ustāzu', uz: "ustoz, o'qituvchi", izoh: "يَا أُسْتَاذُ — «Ustoz!» deb murojaat qilish." },
    ma:      { ar: 'مَا', tl: 'mā', uz: 'nima?', izoh: "Narsa haqida so'roq: مَا هَذَا؟ — «Bu nima?»." },
    ismuka:  { ar: 'اسْمُكَ', tl: 'ismuka', uz: 'isming', izoh: "اِسْمٌ («ism») + كَ («sening»)." },
    ismi:    { ar: 'اِسْمِي', tl: 'ismī', uz: 'ismim', izoh: "اِسْمٌ + ي («mening»)." },
    ali:     { ar: 'عَلِيٌّ', tl: 'ʿaliyyun', uz: 'Ali (ism)', izoh: "Murojaatda oxiri «-u» bo'ladi: يَا عَلِيُّ." },
    ahlan:   { ar: 'أَهْلًا', tl: 'ahlan', uz: 'xush kelibsiz', izoh: "Salomlashish so'zi. To'liq shakli: أَهْلًا وَسَهْلًا." },
    haza:    { ar: 'هَذَا', tl: 'hāzā', uz: 'bu (erkak jinsi)', izoh: "Muzakkar narsa uchun ko'rsatish olmoshi." },
    kitab:   { ar: 'كِتَابٌ', tl: 'kitābun', uz: 'kitob', izoh: "Ko'pligi: كُتُبٌ (kutubun)." },
    ahsanta: { ar: 'أَحْسَنْتَ', tl: 'aḥsanta', uz: 'barakalla, yaxshi qilding', izoh: "O'g'il bolaga. Qiz bolaga: أَحْسَنْتِ (aḥsanti)." },
    hazihi:  { ar: 'هَذِهِ', tl: 'hāzihi', uz: 'bu (ayol jinsi)', izoh: "Muannas narsa uchun ko'rsatish olmoshi." },
    mistara: { ar: 'مِسْطَرَةٌ', tl: 'misṭaratun', uz: "chizg'ich", izoh: "Oxiridagi ة — ayol jinsi belgisi." },
    ayna:    { ar: 'أَيْنَ', tl: 'ayna', uz: 'qayerda?', izoh: "Joy haqida so'roq." },
    qalam:   { ar: 'الْقَلَمُ', tl: 'al-qalamu', uz: 'qalam', izoh: "قَلَمٌ — qalam; «al-» bilan — «o'sha qalam»." },
    ala:     { ar: 'عَلَى', tl: 'ʿalā', uz: 'ustida', izoh: "Jarr harfi: keyingi ism kasra bilan o'qiladi." },
    maktab:  { ar: 'الْمَكْتَبِ', tl: 'al-maktabi', uz: 'stol (yozuv stoli)', izoh: "Asli الْمَكْتَبُ; عَلَى dan keyin kasra: al-maktabi." },
    uktub:   { ar: 'اُكْتُبْ', tl: 'uktub', uz: 'yoz!', izoh: "Buyruq fe'li (كَتَبَ — «yozdi»). Keyingi «al-» bilan ulanganda: اُكْتُبِ." },
    ismaka:  { ar: 'اسْمَكَ', tl: 'ismaka', uz: 'ismingni', izoh: "Tushum kelishigi: oxiri «-a»: «ismingni yoz»." },
    sabbura: { ar: 'السَّبُّورَةِ', tl: 'as-sabbūrati', uz: 'doska', izoh: "عَلَى dan keyin kasra: as-sabbūrati." },
    hasanan: { ar: 'حَسَنًا', tl: 'ḥasanan', uz: "xo'p, yaxshi", izoh: "Rozilik bildirish so'zi." },
    mumtaz:  { ar: 'مُمْتَازٌ', tl: 'mumtāzun', uz: "a'lo, zo'r", izoh: "Maqtov so'zi." },
    shukran: { ar: 'شُكْرًا', tl: 'shukran', uz: 'rahmat', izoh: "Javobi: عَفْوًا — «arzimaydi»." },
    afwan:   { ar: 'عَفْوًا', tl: 'ʿafwan', uz: 'arzimaydi', izoh: "«Rahmat»ga javob." }
  };

  // Foydalanuvchi 1-darsdan biladigan so'zlar — lug'atga yig'ilmaydi
  var BILADI_DEFAULT = ['haza', 'hazihi', 'kitab', 'mistara', 'wa', 'ya'];

  // =====================================================================
  //  2. KINO SSENARIYSI: «Sinfda birinchi kun»
  //  t: «so'z|lug'at_id» yoki tinish belgisi; shot — kamera; board — doskaga yoziladi; focus — narsa
  // =====================================================================
  var FILM = {
    title: 'Sinfda birinchi kun',
    titleAr: 'اَلْيَوْمُ الْأَوَّلُ فِي الْفَصْلِ',
    video: null,
    cues: [
      { who: 'ustoz', shot: 'wide',  t: 'السَّلَامُ|salam عَلَيْكُمْ|alaykum يَا|ya أَوْلَادُ|awlad !', uz: 'Assalomu alaykum, bolalar!', note: "Salomlashish: السَّلَامُ عَلَيْكُمْ — so'zma-so'z «sizlarga tinchlik»." },
      { who: 'ali',   shot: 'ali',   t: 'وَعَلَيْكُمُ|wa السَّلَامُ|salam يَا|ya أُسْتَاذُ|ustaz !', uz: 'Va alaykum assalom, ustoz!', note: "Javob: وَعَلَيْكُمُ السَّلَامُ — «sizlarga ham tinchlik»." },
      { who: 'ustoz', shot: 'ustoz', t: 'مَا|ma اسْمُكَ|ismuka ؟', uz: 'Isming nima?', note: "مَا + اسْمُكَ: «nima» + «isming»." },
      { who: 'ali',   shot: 'ali',   t: 'اِسْمِي|ismi عَلِيٌّ|ali .', uz: 'Ismim Ali.', note: "اِسْمِي = اِسْمٌ + ي («mening»)." },
      { who: 'ustoz', shot: 'ustoz', t: 'أَهْلًا|ahlan يَا|ya عَلِيُّ|ali . مَا|ma هَذَا|haza ؟', uz: "Xush kelibsan, Ali. Bu nima?", focus: 'kitab', note: "Murojaatda عَلِيٌّ → يَا عَلِيُّ (oxiri «-u»)." },
      { who: 'ali',   shot: 'desk',  t: 'هَذَا|haza كِتَابٌ|kitab .', uz: 'Bu kitob.', focus: 'kitab', note: "Ot gap: هَذَا (bu) + كِتَابٌ (kitob) — «-dir» kerak emas." },
      { who: 'ustoz', shot: 'ustoz', t: 'أَحْسَنْتَ|ahsanta ! وَمَا|ma هَذِهِ|hazihi ؟', uz: 'Barakalla! Bu-chi?', focus: 'mistara', note: "مِسْطَرَةٌ muannas, shuning uchun هَذِهِ." },
      { who: 'ali',   shot: 'desk',  t: 'هَذِهِ|hazihi مِسْطَرَةٌ|mistara .', uz: "Bu chizg'ich.", focus: 'mistara', note: "Muannas ot (ة) — هَذِهِ bilan." },
      { who: 'ustoz', shot: 'wide',  t: 'أَيْنَ|ayna الْقَلَمُ|qalam ؟', uz: 'Qalam qayerda?', note: "أَيْنَ — joy so'rog'i." },
      { who: 'ali',   shot: 'desk',  t: 'الْقَلَمُ|qalam عَلَى|ala الْمَكْتَبِ|maktab .', uz: 'Qalam stol ustida.', focus: 'qalam', note: "عَلَى — jarr harfi: الْمَكْتَبُ → الْمَكْتَبِ." },
      { who: 'ustoz', shot: 'board', t: 'اُكْتُبِ|uktub اسْمَكَ|ismaka عَلَى|ala السَّبُّورَةِ|sabbura .', uz: 'Ismingni doskaga yoz.', note: "Buyruq: اُكْتُبْ («yoz!»); «ismingni» — tushum kelishigi, oxiri «-a»." },
      { who: 'ali',   shot: 'board', t: 'حَسَنًا|hasanan .', uz: "Xo'p.", board: 'عَلِيٌّ', note: "Ali doskaga ismini yozdi: عَلِيٌّ." },
      { who: 'ustoz', shot: 'ustoz', t: 'مُمْتَازٌ|mumtaz ! شُكْرًا|shukran يَا|ya عَلِيُّ|ali .', uz: "A'lo! Rahmat, Ali.", note: "Maqtov va minnatdorchilik." },
      { who: 'ali',   shot: 'wide',  t: 'عَفْوًا|afwan يَا|ya أُسْتَاذُ|ustaz .', uz: 'Arzimaydi, ustoz.', note: "شُكْرًا ga javob — عَفْوًا." }
    ]
  };

  var IBORALAR = [
    { ar: 'السَّلَامُ عَلَيْكُمْ', tl: 'as-salāmu ʿalaykum', uz: 'Assalomu alaykum', izoh: "Salomlashish. Javobi: وَعَلَيْكُمُ السَّلَامُ (wa ʿalaykumu s-salām)." },
    { ar: 'مَا اسْمُكَ؟', tl: 'mā ismuka?', uz: 'Isming nima?', izoh: "Javob: اِسْمِي ... — «Ismim ...». Qiz bolaga: مَا اسْمُكِ؟ (ismuki)." },
    { ar: 'مَا هَذَا؟ / مَا هَذِهِ؟', tl: 'mā hāzā? / mā hāzihi?', uz: 'Bu nima?', izoh: "هَذَا — muzakkar narsa uchun, هَذِهِ — muannas (ة bilan tugaydigan) narsa uchun." },
    { ar: 'أَيْنَ ...؟', tl: 'ayna ...?', uz: '... qayerda?', izoh: "Masalan: أَيْنَ الْقَلَمُ؟ — «Qalam qayerda?»." },
    { ar: 'أَحْسَنْتَ!', tl: 'aḥsanta!', uz: 'Barakalla!', izoh: "O'g'il bolaga. Qiz bolaga: أَحْسَنْتِ (aḥsanti)." },
    { ar: 'شُكْرًا — عَفْوًا', tl: 'shukran — ʿafwan', uz: 'Rahmat — Arzimaydi', izoh: "Minnatdorchilik va unga javob." }
  ];

  // Replikani bo'laklarga ajratish
  FILM.cues.forEach(function (c) {
    c.tokens = c.t.split(' ').map(function (p) {
      var i = p.indexOf('|');
      return i > 0 ? { w: p.slice(0, i), id: p.slice(i + 1) } : { w: p, punct: true };
    });
    c.ar = c.tokens.map(function (k) { return k.w; }).join(' ').replace(/ ([!؟.,])/g, '$1');
  });

  // =====================================================================
  //  3. Saqlash (shu brauzerda): biladigan so'zlar
  // =====================================================================
  var KEY = 'muallim-kino-biladi';
  var biladi = (function () {
    try { var v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v)) return v; } catch (e) {}
    return BILADI_DEFAULT.slice();
  })();
  function saveBiladi() { try { localStorage.setItem(KEY, JSON.stringify(biladi)); } catch (e) {} }

  // =====================================================================
  //  4. PLEYER
  // =====================================================================
  var S = {
    idx: -1, playing: false, ended: false, sound: true, subs: 'both', harakat: true, rate: 1,
    run: 0, timers: [], lugat: [], seen: {}
  };
  var RATES = [1, 0.75, 1.25];
  var el = {};
  var ustoz = null;

  function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }
  function later(fn, ms) { var my = S.run; S.timers.push(setTimeout(function () { if (my === S.run) fn(); }, ms)); }

  function talk(who, on) {
    if (ustoz) ustoz.talk(on && who === 'ustoz');
    el.ali.classList.toggle('is-talking', !!on && who === 'ali');
  }

  function shot(name) {
    el.cam.dataset.shot = name;
  }

  function show(i) {
    var c = FILM.cues[i];
    S.idx = i;
    shot(c.shot);
    $$('.sc-obj', el.scene).forEach(function (o) { o.classList.toggle('is-focus', o.dataset.obj === c.focus); });
    if (c.board) { el.boardText.textContent = c.board; el.boardText.classList.remove('is-writing'); void el.boardText.offsetWidth; el.boardText.classList.add('is-writing'); }
    renderSubs(c);
    collect(c);
    renderProgress();
  }

  function renderSubs(c) {
    if (!c) { el.subAr.innerHTML = ''; el.subUz.textContent = ''; return; }
    el.subAr.innerHTML = c.tokens.map(function (k) {
      if (k.punct) return '<span class="sub-p">' + esc(k.w) + '</span>';
      var text = S.harakat ? k.w : k.w.replace(HARAKAT, '');
      var unknown = biladi.indexOf(k.id) < 0;
      return '<button type="button" class="sub-w' + (unknown ? ' is-new' : '') + '" data-id="' + k.id + '" data-w="' + esc(k.w) + '">' + esc(text) + '</button>';
    }).join(' ').replace(/ <span class="sub-p">/g, '<span class="sub-p">');
    el.subUz.textContent = c.uz;
    el.subs.dataset.mode = S.subs;
    el.subs.classList.remove('is-in'); void el.subs.offsetWidth; el.subs.classList.add('is-in');
  }

  // Notanish so'zlarni lug'atga o'zi qo'shadi
  function collect(c) {
    var added = [];
    c.tokens.forEach(function (k) {
      if (k.punct || biladi.indexOf(k.id) > -1 || S.lugat.indexOf(k.id) > -1) return;
      S.lugat.push(k.id);
      added.push(k.id);
      S.seen[k.id] = S.seen[k.id] || i2cue(c);
    });
    if (!added.length) return;
    renderLugat(added);
    // «+N» uchib o'tadi
    if (!reduceMotion) {
      var fly = document.createElement('span');
      fly.className = 'fly-plus';
      fly.textContent = '+' + added.length;
      el.screen.appendChild(fly);
      setTimeout(function () { fly.remove(); }, 1300);
    }
    el.count.textContent = S.lugat.length;
    el.countBadge.classList.remove('is-bump'); void el.countBadge.offsetWidth; el.countBadge.classList.add('is-bump');
  }
  function i2cue(c) { return FILM.cues.indexOf(c); }

  function renderLugat(newOnes) {
    el.lugatList.innerHTML = S.lugat.map(function (id) {
      var d = DICT[id];
      return '<li' + (newOnes && newOnes.indexOf(id) > -1 ? ' class="is-new"' : '') + '><button type="button" class="lg-item" data-id="' + id + '">'
        + '<span class="lg-ar" lang="ar" dir="rtl">' + esc(d.ar) + '</span><span class="lg-uz">' + esc(d.uz) + '</span></button></li>';
    }).join('');
    el.lugatEmpty.hidden = S.lugat.length > 0;
    el.toLesson.disabled = S.lugat.length === 0;
  }

  function renderProgress() {
    var n = FILM.cues.length;
    $$('.pb-seg', el.pbar).forEach(function (s, i) {
      s.classList.toggle('done', i < S.idx || (S.ended && i <= S.idx));
      s.classList.toggle('now', i === S.idx && !S.ended);
    });
    el.time.textContent = Math.max(0, S.idx + 1) + ' / ' + n;
  }

  function cueDuration(c) { return Math.max(2200, c.ar.length * 95) / S.rate; }

  function playCue(i) {
    S.run++; clearTimers();
    var O = Ovoz(); if (O) O.stop();
    if (i >= FILM.cues.length) { end(); return; }
    S.ended = false;
    el.endCard.hidden = true;
    show(i);
    if (!S.playing) { talk(null, false); return; }
    var c = FILM.cues[i];
    var my = S.run;
    var done = false;
    var next = function () { if (my !== S.run || done) return; done = true; talk(c.who, false); later(function () { playCue(i + 1); }, 650 / S.rate); };
    talk(c.who, true);
    if (S.sound && O && O.status().tts) {
      var ok = O.speak(c.ar, { rate: S.rate * 1.05, pitch: c.who === 'ali' ? 1.45 : 0.85, onEnd: next });
      if (!ok) later(next, cueDuration(c));
      // Ovoz kutilmaganda to'xtab qolsa ham kino davom etsin
      later(function () { next(); }, cueDuration(c) * 2.5 + 2000);
    } else {
      later(next, cueDuration(c));
    }
  }

  function setPlaying(on) {
    S.playing = on;
    el.play.setAttribute('aria-pressed', String(on));
    el.play.setAttribute('aria-label', on ? "To'xtatish" : "Ko'rish");
    el.screen.classList.toggle('is-playing', on);
    el.titleCard.classList.toggle('is-gone', on || S.idx >= 0);
    if (on) {
      if (Ovoz()) Ovoz().unlock();
      if (S.ended) { S.ended = false; playCue(0); }
      else playCue(Math.max(0, S.idx));
    } else {
      S.run++; clearTimers();
      if (Ovoz()) Ovoz().stop();
      talk(null, false);
    }
  }

  function end() {
    S.playing = false; S.ended = true;
    el.play.setAttribute('aria-pressed', 'false');
    el.screen.classList.remove('is-playing');
    talk(null, false);
    shot('wide');
    renderProgress();
    el.endCount.textContent = S.lugat.length;
    el.endCard.hidden = false;
    if (ustoz) ustoz.mood('kuladi', 2500);
    unlockLesson();
  }

  // Subtitrdagi so'z: kino to'xtaydi, so'z kartochkasi chiqadi
  function wordCard(btn) {
    var id = btn.dataset.id, d = DICT[id];
    if (!d) return;
    if (S.playing) setPlaying(false);
    var card = el.wcard;
    $('.wc-ar', card).textContent = btn.dataset.w;
    $('.wc-tl', card).textContent = d.tl;
    $('.wc-uz', card).textContent = d.uz;
    $('.wc-izoh', card).innerHTML = arWrap(d.izoh);
    card.dataset.id = id;
    syncCardButtons();
    card.hidden = false;
    $$('.sub-w.is-active').forEach(function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    say(btn.dataset.w);
  }
  function syncCardButtons() {
    var id = el.wcard.dataset.id;
    var inL = S.lugat.indexOf(id) > -1, known = biladi.indexOf(id) > -1;
    var add = $('.wc-add', el.wcard), know = $('.wc-know', el.wcard);
    add.textContent = inL ? "✓ Lug'atda" : "Lug'atga qo'shish";
    add.setAttribute('aria-pressed', String(inL));
    know.textContent = known ? '✓ Bilaman' : 'Bilaman';
    know.setAttribute('aria-pressed', String(known));
  }
  function closeCard() {
    el.wcard.hidden = true;
    $$('.sub-w.is-active').forEach(function (b) { b.classList.remove('is-active'); });
  }

  function say(text, opts) {
    var O = Ovoz();
    if (!O) return;
    O.unlock();
    O.speak(text, opts || {});
  }

  // =====================================================================
  //  5. DARS: so'zlar, gaplar, iboralar
  // =====================================================================
  function unlockLesson() {
    el.lesson.classList.remove('is-locked');
    el.lessonLock.hidden = true;
    renderLesson();
  }

  function sentenceFor(id) {
    var c = FILM.cues.find(function (x) { return x.tokens.some(function (k) { return k.id === id; }); }) || FILM.cues[0];
    return c.tokens.map(function (k) {
      if (k.punct) return esc(k.w);
      return k.id === id ? '<mark>' + esc(k.w) + '</mark>' : esc(k.w);
    }).join(' ').replace(/ ([!؟.])/g, '$1');
  }

  function renderLesson() {
    var words = S.lugat.length ? S.lugat : Object.keys(DICT).filter(function (k) { return biladi.indexOf(k) < 0; });
    $('#tab-soz-n').textContent = words.length;
    $('#ls-soz').innerHTML = words.map(function (id) {
      var d = DICT[id];
      return '<li class="ls-card"><div class="ls-top"><button type="button" class="say-btn" data-say="' + esc(d.ar) + '" aria-label="Tinglash">' + ICON_SAY + '</button>'
        + '<span class="ls-ar" lang="ar" dir="rtl">' + esc(d.ar) + '</span></div>'
        + '<p class="ls-tl">' + esc(d.tl) + '</p><p class="ls-uz">' + esc(d.uz) + '</p>'
        + '<p class="ls-ex"><span class="ls-ex-l">Kinoda:</span> <span lang="ar" dir="rtl">' + sentenceFor(id) + '</span></p>'
        + '<p class="ls-izoh">' + arWrap(d.izoh) + '</p></li>';
    }).join('');
    $('#ls-gap').innerHTML = FILM.cues.map(function (c, i) {
      return '<li class="ls-row"><button type="button" class="say-btn" data-say="' + esc(c.ar) + '" data-who="' + c.who + '" aria-label="Tinglash">' + ICON_SAY + '</button>'
        + '<div><p class="ls-ar" lang="ar" dir="rtl">' + esc(c.ar) + '</p><p class="ls-uz">' + (c.who === 'ali' ? 'Ali: ' : 'Ustoz: ') + esc(c.uz) + '</p>'
        + '<p class="ls-izoh">' + arWrap(c.note) + '</p></div></li>';
    }).join('');
    $('#ls-ibora').innerHTML = IBORALAR.map(function (b) {
      return '<li class="ls-row"><button type="button" class="say-btn" data-say="' + esc(b.ar.replace(/\.\.\./g, '').replace(' / ', '. ')) + '" aria-label="Tinglash">' + ICON_SAY + '</button>'
        + '<div><p class="ls-ar" lang="ar" dir="rtl">' + esc(b.ar) + '</p><p class="ls-tl">' + esc(b.tl) + '</p><p class="ls-uz">' + esc(b.uz) + '</p>'
        + '<p class="ls-izoh">' + arWrap(b.izoh) + '</p></div></li>';
    }).join('');
  }
  var ICON_SAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';

  // =====================================================================
  //  6. QUIZ
  // =====================================================================
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(arr, n, not) { return shuffle(arr.filter(function (x) { return not.indexOf(x) < 0; })).slice(0, n); }

  function buildQuiz() {
    var pool = S.lugat.length >= 4 ? S.lugat.slice() : Object.keys(DICT).filter(function (k) { return biladi.indexOf(k) < 0; });
    var all = Object.keys(DICT);
    var qs = [];
    var words = shuffle(pool);
    var hasTts = !!(Ovoz() && Ovoz().status().tts);
    function mcq(type, id) {
      var others = pick(all, 3, [id].concat(all.filter(function (k) { return DICT[k].uz === DICT[id].uz && k !== id; })));
      var opts = shuffle([id].concat(others));
      return { type: type, id: id, opts: opts };
    }
    words.slice(0, 3).forEach(function (id) { qs.push(mcq('ar2uz', id)); });
    words.slice(3, 5).forEach(function (id) { qs.push(mcq('uz2ar', id)); });
    if (words[5]) qs.push(mcq(hasTts ? 'listen' : 'ar2uz', words[5]));
    // Bo'shliqni to'ldirish: kinodagi gapdan bitta notanish so'z olib tashlanadi
    var gapCues = FILM.cues.filter(function (c) { return c.tokens.filter(function (k) { return !k.punct; }).length >= 2; });
    var gc = shuffle(gapCues).find(function (c) { return c.tokens.some(function (k) { return !k.punct && pool.indexOf(k.id) > -1; }); }) || gapCues[0];
    var gapTok = gc.tokens.find(function (k) { return !k.punct && pool.indexOf(k.id) > -1; }) || gc.tokens[0];
    qs.push({ type: 'gap', cue: gc, tok: gapTok, opts: shuffle([gapTok.id].concat(pick(all, 3, [gapTok.id]))) });
    // So'zlardan gap tuzish
    var oc = FILM.cues[9];
    qs.push({ type: 'order', cue: oc, words: oc.tokens.filter(function (k) { return !k.punct; }) });
    return qs;
  }

  var Q = { list: [], i: 0, score: 0, wrong: [], answered: false };

  function startQuiz(onlyWrong) {
    Q.list = onlyWrong && Q.wrong.length ? Q.wrong.slice() : buildQuiz();
    Q.i = 0; Q.score = 0; Q.wrong = []; Q.answered = false;
    el.quiz.classList.remove('is-locked');
    el.quizResult.hidden = true;
    el.quizBox.hidden = false;
    renderQ();
    el.quiz.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function renderQ() {
    var q = Q.list[Q.i];
    Q.answered = false;
    el.qNum.textContent = (Q.i + 1) + ' / ' + Q.list.length;
    el.qBar.style.width = (Q.i / Q.list.length * 100) + '%';
    el.qFeedback.textContent = ''; el.qFeedback.className = 'q-feedback';
    el.qNext.hidden = true;
    var d = q.id ? DICT[q.id] : null, html = '', prompt = '';
    if (q.type === 'ar2uz') {
      prompt = 'Bu so\'z nimani anglatadi?';
      html = '<p class="q-big" lang="ar" dir="rtl">' + esc(d.ar) + '</p>';
      html += opts(q.opts.map(function (id) { return { v: id, t: DICT[id].uz }; }));
    } else if (q.type === 'uz2ar') {
      prompt = 'Arabchasini toping:';
      html = '<p class="q-big">«' + esc(d.uz) + '»</p>';
      html += opts(q.opts.map(function (id) { return { v: id, t: DICT[id].ar, ar: true }; }));
    } else if (q.type === 'listen') {
      prompt = 'Tinglang va eshitgan so\'zingizni tanlang:';
      html = '<button type="button" class="q-listen" data-say="' + esc(d.ar) + '">' + ICON_SAY + '<span>Tinglash</span></button>';
      html += opts(q.opts.map(function (id) { return { v: id, t: DICT[id].ar, ar: true }; }));
      setTimeout(function () { say(d.ar); }, 300);
    } else if (q.type === 'gap') {
      prompt = 'Kinodagi gapni to\'ldiring:';
      html = '<p class="q-sent" lang="ar" dir="rtl">' + q.cue.tokens.map(function (k) {
        return k === q.tok ? '<span class="q-blank" aria-label="bo\'sh joy">؟</span>' : esc(k.w);
      }).join(' ').replace(/ ([!؟.])/g, '$1') + '</p><p class="q-sub">«' + esc(q.cue.uz) + '»</p>';
      html += opts(q.opts.map(function (id) { return { v: id, t: id === q.tok.id ? q.tok.w : DICT[id].ar, ar: true }; }));
    } else if (q.type === 'order') {
      prompt = 'So\'zlarni to\'g\'ri tartibda bosing:';
      html = '<p class="q-sub">«' + esc(q.cue.uz) + '»</p><div class="q-answer" lang="ar" dir="rtl" aria-live="polite"></div>'
        + '<div class="q-tiles" lang="ar" dir="rtl">' + shuffle(q.words.map(function (k, i) { return i; })).map(function (i) {
          return '<button type="button" class="q-tile" data-i="' + i + '">' + esc(q.words[i].w) + '</button>';
        }).join('') + '</div><button type="button" class="btn btn-ghost q-reset">Qaytadan</button>';
    }
    el.qPrompt.textContent = prompt;
    el.qBody.innerHTML = html;
    el.qBody.classList.remove('is-in'); void el.qBody.offsetWidth; el.qBody.classList.add('is-in');
    if (ustoz2) ustoz2.mood('oylaydi');
  }
  function opts(list) {
    return '<div class="q-opts">' + list.map(function (o) {
      return '<button type="button" class="q-opt" data-v="' + esc(o.v) + '"' + (o.ar ? ' lang="ar" dir="rtl"' : '') + '>' + esc(o.t) + '</button>';
    }).join('') + '</div>';
  }

  function answer(ok, correctText) {
    if (Q.answered) return;
    Q.answered = true;
    var q = Q.list[Q.i];
    if (ok) { Q.score++; el.qFeedback.textContent = pickOne(["To'g'ri! Barakalla!", "Ajoyib — to'g'ri!", "Zo'r, aynan shunday!"]); el.qFeedback.classList.add('is-ok'); if (ustoz2) ustoz2.mood('kuladi'); }
    else { Q.wrong.push(q); el.qFeedback.innerHTML = 'To\'g\'ri javob: ' + arWrap(correctText); el.qFeedback.classList.add('is-bad'); if (ustoz2) ustoz2.mood('xavotir'); }
    // To'g'ri topilgan so'z «o'rganildi» — keyingi kinoda lug'atga qayta yig'ilmaydi
    if (q.id && ok && biladi.indexOf(q.id) < 0) { biladi.push(q.id); saveBiladi(); }
    el.qNext.hidden = false;
    el.qNext.textContent = Q.i + 1 < Q.list.length ? 'Keyingi savol' : 'Natijani ko\'rish';
    el.qNext.focus();
  }
  function pickOne(a) { return a[Math.floor(Math.random() * a.length)]; }

  function onQuizClick(e) {
    var q = Q.list[Q.i];
    var say1 = e.target.closest('[data-say]');
    if (say1) { say(say1.dataset.say); return; }
    var o = e.target.closest('.q-opt');
    if (o && !Q.answered) {
      var right = q.type === 'gap' ? q.tok.id : q.id;
      var ok = o.dataset.v === right;
      o.classList.add(ok ? 'is-right' : 'is-wrong');
      if (!ok) $$('.q-opt', el.qBody).forEach(function (b) { if (b.dataset.v === right) b.classList.add('is-right'); });
      $$('.q-opt', el.qBody).forEach(function (b) { b.disabled = true; });
      var correctText = q.type === 'ar2uz' ? DICT[right].uz : (q.type === 'gap' ? q.cue.ar : DICT[right].ar + ' — ' + DICT[right].uz);
      answer(ok, correctText);
      if (ok && q.type !== 'ar2uz') say(q.type === 'gap' ? q.cue.ar : DICT[right].ar);
      return;
    }
    var t = e.target.closest('.q-tile');
    if (t && !Q.answered) {
      var ans = $('.q-answer', el.qBody);
      t.disabled = true;
      var b = document.createElement('span'); b.className = 'q-placed'; b.textContent = t.textContent; b.dataset.i = t.dataset.i;
      ans.appendChild(b);
      var placed = $$('.q-placed', ans).map(function (x) { return +x.dataset.i; });
      if (placed.length === q.words.length) {
        var ok2 = placed.every(function (v, i) { return v === i; });
        ans.classList.add(ok2 ? 'is-right' : 'is-wrong');
        answer(ok2, q.cue.ar);
        say(q.cue.ar);
      }
      return;
    }
    if (e.target.closest('.q-reset') && !Q.answered) {
      $('.q-answer', el.qBody).innerHTML = '';
      $$('.q-tile', el.qBody).forEach(function (x) { x.disabled = false; });
    }
  }

  function nextQ() {
    if (Q.i + 1 < Q.list.length) { Q.i++; renderQ(); return; }
    el.qBar.style.width = '100%';
    el.quizBox.hidden = true;
    el.quizResult.hidden = false;
    var n = Q.list.length, s = Q.score;
    $('#qr-score').textContent = s + ' / ' + n;
    var stars = s === n ? 3 : s >= n * 0.6 ? 2 : s > 0 ? 1 : 0;
    $$('.qr-star').forEach(function (st, i) { st.classList.toggle('is-on', i < stars); st.style.animationDelay = (i * 0.18) + 's'; });
    $('#qr-text').textContent = stars === 3 ? "Mukammal! Kinodagi hamma so'zni o'zlashtirdingiz." : stars === 2 ? "Yaxshi natija! Xato qilganlaringizni yana bir ko'rib chiqing." : "Hechqisi yo'q — kinoni yana bir ko'rib, qayta urinib ko'ring.";
    $('#qr-retry').hidden = !Q.wrong.length;
    if (ustoz2) ustoz2.mood(stars >= 2 ? 'kuladi' : 'xavotir');
  }

  var ustoz2 = null;

  // =====================================================================
  //  7. Ishga tushirish
  // =====================================================================
  document.addEventListener('DOMContentLoaded', function () {
    var root = $('#film');
    if (!root) return;
    el = {
      screen: $('#film-screen'), scene: $('#film-scene'), cam: $('#film-cam'), ali: $('#film-ali'),
      boardText: $('#film-board-text'), titleCard: $('#film-title'), endCard: $('#film-end'), endCount: $('#film-end-n'),
      subs: $('#film-subs'), subAr: $('#film-sub-ar'), subUz: $('#film-sub-uz'),
      play: $('#film-play'), pbar: $('#film-pbar'), time: $('#film-time'),
      wcard: $('#film-wcard'),
      count: $('#film-count'), countBadge: $('#film-count-badge'), lugatList: $('#film-lugat'), lugatEmpty: $('#film-lugat-empty'),
      toLesson: $('#film-to-lesson'),
      lesson: $('#dars'), lessonLock: $('#dars-lock'),
      quiz: $('#quiz'), quizBox: $('#quiz-box'), quizResult: $('#quiz-result'),
      qNum: $('#q-num'), qBar: $('#q-bar'), qPrompt: $('#q-prompt'), qBody: $('#q-body'), qFeedback: $('#q-feedback'), qNext: $('#q-next')
    };
    if (window.MuallimUstoz) {
      ustoz = window.MuallimUstoz($('#film-ustoz'));
      var u2 = $('#quiz-ustoz'); if (u2) ustoz2 = window.MuallimUstoz(u2);
    }

    // Jarayon chizig'i: har bir replika — bitta bo'lak
    el.pbar.innerHTML = FILM.cues.map(function (c, i) { return '<button type="button" class="pb-seg" data-i="' + i + '" aria-label="' + (i + 1) + '-sahna"><i></i></button>'; }).join('');
    el.pbar.addEventListener('click', function (e) { var s = e.target.closest('.pb-seg'); if (s) { closeCard(); el.titleCard.classList.add('is-gone'); playCue(+s.dataset.i); } });

    el.play.addEventListener('click', function () { closeCard(); setPlaying(!S.playing); });
    $('#film-title-play').addEventListener('click', function () { setPlaying(true); });
    el.screen.addEventListener('click', function (e) { if (e.target === el.screen || e.target.closest('#film-scene')) { closeCard(); setPlaying(!S.playing); } });
    $('#film-prev').addEventListener('click', function () { closeCard(); playCue(Math.max(0, S.idx - 1)); });
    $('#film-next').addEventListener('click', function () { closeCard(); playCue(S.idx + 1); });
    $('#film-sound').addEventListener('click', function () {
      S.sound = !S.sound;
      this.setAttribute('aria-pressed', String(!S.sound));
      this.setAttribute('aria-label', S.sound ? "Ovozni o'chirish" : 'Ovozni yoqish');
      if (S.playing) playCue(S.idx);
    });
    $('#film-subs-mode').addEventListener('click', function () {
      S.subs = { both: 'ar', ar: 'none', none: 'both' }[S.subs];
      el.subs.dataset.mode = S.subs;
      this.textContent = { both: 'AR + UZ', ar: 'Faqat AR', none: "Subtitr yo'q" }[S.subs];
    });
    $('#film-harakat').addEventListener('click', function () {
      S.harakat = !S.harakat;
      this.setAttribute('aria-pressed', String(S.harakat));
      renderSubs(FILM.cues[S.idx]);
    });
    $('#film-speed').addEventListener('click', function () {
      S.rate = RATES[(RATES.indexOf(S.rate) + 1) % RATES.length];
      this.textContent = S.rate + '×';
      if (S.playing) playCue(S.idx);
    });
    $('#film-replay').addEventListener('click', function () { el.endCard.hidden = true; S.ended = false; S.idx = 0; setPlaying(true); });
    $('#film-end-lesson').addEventListener('click', function () { el.lesson.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); });
    el.toLesson.addEventListener('click', function () { if (S.playing) setPlaying(false); unlockLesson(); el.lesson.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); });

    // Subtitrdagi so'zlar va kartochka
    el.subAr.addEventListener('click', function (e) { var b = e.target.closest('.sub-w'); if (b) wordCard(b); });
    el.wcard.addEventListener('click', function (e) {
      var id = el.wcard.dataset.id;
      if (e.target.closest('.wc-close')) { closeCard(); return; }
      if (e.target.closest('.wc-play')) { say($('.wc-ar', el.wcard).textContent); return; }
      if (e.target.closest('.wc-add')) {
        var i = S.lugat.indexOf(id);
        if (i > -1) S.lugat.splice(i, 1); else { S.lugat.push(id); S.seen[id] = S.seen[id] != null ? S.seen[id] : S.idx; var bi = biladi.indexOf(id); if (bi > -1) { biladi.splice(bi, 1); saveBiladi(); } }
        el.count.textContent = S.lugat.length; renderLugat(); syncCardButtons(); renderSubs(FILM.cues[S.idx]);
        if (!el.lesson.classList.contains('is-locked')) renderLesson();
        return;
      }
      if (e.target.closest('.wc-know')) {
        var k = biladi.indexOf(id);
        if (k > -1) biladi.splice(k, 1); else { biladi.push(id); var li = S.lugat.indexOf(id); if (li > -1) S.lugat.splice(li, 1); }
        saveBiladi();
        el.count.textContent = S.lugat.length; renderLugat(); syncCardButtons(); renderSubs(FILM.cues[S.idx]);
        if (!el.lesson.classList.contains('is-locked')) renderLesson();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.wcard.hidden) closeCard();
      if (e.key === ' ' && document.activeElement === document.body) { e.preventDefault(); setPlaying(!S.playing); }
    });
    el.lugatList.addEventListener('click', function (e) { var b = e.target.closest('.lg-item'); if (b) say(DICT[b.dataset.id].ar); });

    // Dars: yorliqlar
    $$('.ls-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.ls-tab').forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
        $$('.ls-panel').forEach(function (p) { p.hidden = p.id !== t.getAttribute('aria-controls'); });
      });
    });
    el.lesson.addEventListener('click', function (e) {
      var b = e.target.closest('[data-say]');
      if (b) say(b.dataset.say, b.dataset.who ? { pitch: b.dataset.who === 'ali' ? 1.45 : 0.85 } : {});
    });
    $('#lesson-unlock').addEventListener('click', function () { unlockLesson(); });
    $('#quiz-start').addEventListener('click', function () { startQuiz(false); });
    $('#quiz-gate').addEventListener('click', function () { if (el.lesson.classList.contains('is-locked')) unlockLesson(); startQuiz(false); });

    // Quiz
    el.qBody.addEventListener('click', onQuizClick);
    el.qNext.addEventListener('click', nextQ);
    $('#qr-again').addEventListener('click', function () { startQuiz(false); });
    $('#qr-retry').addEventListener('click', function () { startQuiz(true); });

    renderLugat();
    renderProgress();
    shot('wide');
  });

  window.MuallimKino = { FILM: FILM, DICT: DICT, state: S, quiz: Q };
})();
