/*
 * Muallim — kirish, ro'yxatdan o'tish va parolni tiklash sahifalari.
 *
 * SERVERGA ULASH: sahifada auth.js dan OLDIN manzilni bering:
 *   <script>window.MUALLIM_API_BASE = 'https://muallim.com.uz/api';</script>
 * So'rovlar: POST {base}/auth/login, /auth/register, /auth/send-code, /auth/verify-code,
 * /auth/reset-password, /auth/profile — JSON yuboriladi, JSON kutiladi.
 * Javob xatoli bo'lsa: { "message": "foydalanuvchiga ko'rsatiladigan matn" }.
 * Manzil berilmasa sahifa NAMUNA REJIMIda ishlaydi: hech narsa yuborilmaydi, SMS kod — 123456.
 */
(function () {
  'use strict';

  var BASE = window.MUALLIM_API_BASE || '';
  var DEMO = !BASE;
  var DEMO_CODE = '123456';
  var AFTER_LOGIN = window.MUALLIM_AFTER_LOGIN || 'index.html';

  // ---------------- Server bilan aloqa ----------------
  function post(path, body) {
    if (DEMO) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if ((path === '/auth/verify-code' || path === '/auth/reset-password') && body.code !== DEMO_CODE) {
            reject({ message: "Kod noto'g'ri. Namuna rejimida kod: " + DEMO_CODE });
          } else resolve({ ok: true });
        }, 700);
      });
    }
    return fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw { message: data.message || serverError(r.status) };
        return data;
      });
    }, function () {
      throw { message: "Internetga ulanib bo'lmadi. Aloqani tekshirib, qayta urinib ko'ring." };
    });
  }
  function serverError(status) {
    if (status === 401) return "Telefon raqami yoki parol noto'g'ri.";
    if (status === 409) return "Bu raqam bilan hisob allaqachon ochilgan. «Kirish» sahifasidan kiring.";
    if (status === 429) return "Juda ko'p urinish bo'ldi. Bir necha daqiqadan keyin qayta urinib ko'ring.";
    return "Serverda xatolik yuz berdi (" + status + "). Birozdan keyin qayta urinib ko'ring.";
  }

  // ---------------- Yordamchilar ----------------
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function digits(s) { return String(s || '').replace(/\D/g, ''); }

  // +998 (90) 123-45-67 — kiritayotganda formatlash
  function formatPhone(v) {
    var d = digits(v);
    if (d.indexOf('998') === 0) d = d.slice(3);
    d = d.slice(0, 9);
    var out = '+998';
    if (d.length) out += ' (' + d.slice(0, 2);
    if (d.length >= 2) out += ')';
    if (d.length > 2) out += ' ' + d.slice(2, 5);
    if (d.length > 5) out += '-' + d.slice(5, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    return out;
  }
  function phoneDigits(v) { var d = digits(v); if (d.indexOf('998') === 0) d = d.slice(3); return d; }
  function isPhone(v) { return phoneDigits(v).length === 9; }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); }

  function setError(input, msg) {
    var field = input.closest('.field');
    var err = field && $('.field-error', field);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (field) field.classList.toggle('has-error', !!msg);
    if (err) err.textContent = msg || '';
    return !msg;
  }

  function formMessage(form, text, kind) {
    var box = $('.form-msg', form);
    if (!box) return;
    box.textContent = text || '';
    box.className = 'form-msg' + (kind ? ' is-' + kind : '');
    if (text) box.focus && box.setAttribute('tabindex', '-1');
  }

  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'Kuting…'; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
    btn.disabled = on;
    btn.classList.toggle('is-busy', on);
  }

  // Ustoz: gapiradi va kayfiyatini o'zgartiradi (main.js dagi MuallimUstoz)
  var U = null;
  function say(text, mood) {
    var b = $('#auth-bubble');
    if (!b) return;
    b.classList.remove('is-new');
    void b.offsetWidth; // animatsiyani qayta boshlash
    b.textContent = text;
    b.classList.add('is-new');
    if (U) {
      U.mood(mood || 'tabassum');
      U.talk(true);
      clearTimeout(say.t);
      say.t = setTimeout(function () { U.talk(false); }, Math.min(2400, 400 + text.length * 35));
    }
  }

  // Parol qanchalik kuchli: 0..4
  function strength(pw) {
    var s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    else if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s += 0.5;
    return Math.min(4, Math.floor(s));
  }
  var STRENGTH = ['Juda kuchsiz', 'Kuchsiz', "O'rtacha", 'Yaxshi', 'Kuchli'];

  // ---------------- Umumiy: telefon, parolni ko'rsatish, kuch o'lchagich ----------------
  function wireCommon() {
    $$('input[data-phone]').forEach(function (inp) {
      inp.addEventListener('focus', function () { if (!inp.value) inp.value = '+998 '; });
      inp.addEventListener('blur', function () { if (phoneDigits(inp.value) === '') inp.value = ''; });
      inp.addEventListener('input', function () {
        var end = inp.selectionEnd === inp.value.length;
        inp.value = formatPhone(inp.value);
        if (end) inp.setSelectionRange(inp.value.length, inp.value.length);
        if (inp.getAttribute('aria-invalid') === 'true' && isPhone(inp.value)) setError(inp, '');
      });
    });

    // Login maydoni: raqam bilan boshlansa — telefon niqobi, harf bo'lsa — email
    $$('input[data-login]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var v = inp.value;
        if (/^[+\d\s()-]+$/.test(v) && digits(v).length) {
          var end = inp.selectionEnd === v.length;
          inp.value = formatPhone(v);
          inp.setAttribute('inputmode', 'tel');
          if (end) inp.setSelectionRange(inp.value.length, inp.value.length);
        } else inp.setAttribute('inputmode', 'email');
        if (inp.getAttribute('aria-invalid') === 'true') setError(inp, '');
      });
    });

    $$('.pw-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inp = btn.parentElement.querySelector('input');
        var show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Parolni yashirish' : "Parolni ko'rsatish");
        inp.focus();
      });
    });

    $$('input[data-strength]').forEach(function (inp) {
      var meter = document.getElementById(inp.dataset.strength);
      if (!meter) return;
      inp.addEventListener('input', function () {
        var s = inp.value ? strength(inp.value) : -1;
        meter.dataset.level = String(s);
        $('.meter-label', meter).textContent = s < 0 ? '' : 'Parol: ' + STRENGTH[s].toLowerCase();
      });
    });

    $$('input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        if (inp.getAttribute('aria-invalid') === 'true' && inp.type !== 'tel' && !inp.dataset.login) setError(inp, '');
      });
    });

    if (DEMO) {
      var banner = $('.demo-banner');
      if (banner) {
        banner.hidden = false;
        var c = $('[data-demo-code]', banner);
        if (c) c.textContent = DEMO_CODE;
      }
    }
  }

  // ---------------- SMS kod: 6 ta katak ----------------
  function wireOtp(container, onComplete) {
    var boxes = $$('input', container);
    function value() { return boxes.map(function (b) { return b.value; }).join(''); }
    function fill(str, from) {
      var d = digits(str).split('');
      for (var i = from; i < boxes.length && d.length; i++) boxes[i].value = d.shift();
      var next = boxes.find(function (b) { return !b.value; });
      (next || boxes[boxes.length - 1]).focus();
      check();
    }
    function check() {
      container.classList.remove('has-error');
      if (value().length === boxes.length) onComplete(value());
    }
    boxes.forEach(function (b, i) {
      b.addEventListener('input', function () {
        if (b.value.length > 1) { fill(b.value, i); return; }
        b.value = digits(b.value);
        if (b.value && boxes[i + 1]) boxes[i + 1].focus();
        check();
      });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !b.value && boxes[i - 1]) { boxes[i - 1].value = ''; boxes[i - 1].focus(); e.preventDefault(); }
        if (e.key === 'ArrowLeft' && boxes[i - 1]) boxes[i - 1].focus();
        if (e.key === 'ArrowRight' && boxes[i + 1]) boxes[i + 1].focus();
      });
      b.addEventListener('paste', function (e) {
        var t = (e.clipboardData || window.clipboardData).getData('text');
        if (t) { e.preventDefault(); fill(t, i); }
      });
      b.addEventListener('focus', function () { b.select(); });
    });
    return {
      value: value,
      clear: function () { boxes.forEach(function (b) { b.value = ''; }); boxes[0].focus(); },
      error: function () { container.classList.add('has-error'); },
      focus: function () { boxes[0].focus(); }
    };
  }

  // Qayta yuborish tugmasi: 60 soniya kutish
  function resendTimer(btn, sendFn) {
    var left = 0, t = null;
    function tick() {
      if (left <= 0) { clearInterval(t); btn.disabled = false; btn.textContent = 'Kodni qayta yuborish'; return; }
      btn.textContent = 'Qayta yuborish ' + left + ' soniyadan keyin';
      left--;
    }
    function start() { left = 60; btn.disabled = true; clearInterval(t); tick(); t = setInterval(tick, 1000); }
    btn.addEventListener('click', function () {
      busy(btn, true, 'Yuborilmoqda…');
      sendFn().then(function () { busy(btn, false); start(); }, function (e) { busy(btn, false); btn.textContent = 'Kodni qayta yuborish'; alertMsg(e); });
    });
    return { start: start };
  }
  var alertMsg = function () {};

  // ---------------- Bosqichlar (ro'yxatdan o'tish, tiklash) ----------------
  function steps(root) {
    var panes = $$('[data-step]', root);
    var dots = $$('.steps-dots li', root);
    function show(n) {
      panes.forEach(function (p) {
        var on = +p.dataset.step === n;
        p.hidden = !on;
        if (on) p.classList.add('is-entering');
      });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-done', i + 1 < n);
        d.classList.toggle('is-current', i + 1 === n);
        if (i + 1 === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
      var pane = panes.find(function (p) { return +p.dataset.step === n; });
      var focusable = pane && $('input:not([type=hidden]), button', pane);
      if (focusable) setTimeout(function () { focusable.focus(); }, 60);
    }
    return { show: show };
  }

  // ================= KIRISH =================
  function initLogin() {
    var form = $('#login-form');
    if (!form) return;
    var login = $('#login-id'), pw = $('#login-pw'), btn = $('button[type=submit]', form);
    alertMsg = function (e) { formMessage(form, e.message, 'error'); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formMessage(form, '');
      var v = login.value.trim();
      var ok = true;
      if (!v) ok = setError(login, 'Telefon raqami yoki emailni kiriting.') && ok;
      else if (/^[+\d\s()-]+$/.test(v) ? !isPhone(v) : !isEmail(v)) ok = setError(login, /^[+\d]/.test(v) ? "Telefon raqami to'liq emas: +998 (90) 123-45-67 ko'rinishida kiriting." : "Email noto'g'ri yozilgan. Masalan: ism@gmail.com") && ok;
      else setError(login, '');
      if (!pw.value) ok = setError(pw, 'Parolni kiriting.') && ok;
      else setError(pw, '');
      if (!ok) { $('[aria-invalid=true]', form).focus(); say("Bir joyini to'g'rilash kerak — qizil yozuvga qarang.", 'xavotir'); return; }

      busy(btn, true, 'Kirilmoqda…');
      say('Tekshiryapman…', 'oylaydi');
      var body = { password: pw.value, remember: $('#login-remember') ? $('#login-remember').checked : false };
      if (isPhone(v)) body.phone = '+998' + phoneDigits(v); else body.email = v;
      post('/auth/login', body).then(function () {
        say("Xush kelibsiz! Darsga o'tyapmiz…", 'kuladi');
        formMessage(form, DEMO ? "Namuna rejimi: ma'lumot hech qayerga yuborilmadi. Saytda shu yerda darslar sahifasi ochiladi." : 'Muvaffaqiyatli kirdingiz.', 'ok');
        busy(btn, false);
        if (!DEMO) location.href = AFTER_LOGIN;
      }, function (err) {
        busy(btn, false);
        formMessage(form, err.message, 'error');
        say('Hechqisi yo\'q, yana bir bor urinib ko\'ring.', 'xavotir');
        pw.select();
      });
    });
  }

  // ================= RO'YXATDAN O'TISH =================
  function initRegister() {
    var root = $('#register');
    if (!root) return;
    var S = steps(root);
    var data = {};
    var f1 = $('#reg-form-1'), f2 = $('#reg-form-2'), f3 = $('#reg-form-3');
    alertMsg = function (e) { formMessage(f2, e.message, 'error'); };

    // 1-qadam: ma'lumotlar
    f1.addEventListener('submit', function (e) {
      e.preventDefault();
      formMessage(f1, '');
      var name = $('#reg-name'), phone = $('#reg-phone'), pw = $('#reg-pw'), agree = $('#reg-agree');
      var ok = true;
      ok = setError(name, name.value.trim().length < 2 ? 'Ismingizni kiriting.' : '') && ok;
      ok = setError(phone, !isPhone(phone.value) ? "Telefon raqamini to'liq kiriting: +998 (90) 123-45-67." : '') && ok;
      ok = setError(pw, pw.value.length < 8 ? "Parol kamida 8 belgidan iborat bo'lsin." : '') && ok;
      ok = setError(agree, !agree.checked ? 'Davom etish uchun shartlarga rozilik bering.' : '') && ok;
      if (!ok) { $('[aria-invalid=true]', f1).focus(); say("Bir-ikki joyini to'g'rilaymiz — qizil yozuvga qarang.", 'xavotir'); return; }

      data.name = name.value.trim();
      data.phone = '+998' + phoneDigits(phone.value);
      data.password = pw.value;
      var btn = $('button[type=submit]', f1);
      busy(btn, true, 'Kod yuborilmoqda…');
      post('/auth/send-code', { phone: data.phone, purpose: 'register' }).then(function () {
        busy(btn, false);
        $('#reg-phone-shown').textContent = formatPhone(data.phone);
        S.show(2);
        timer.start();
        say(data.name.split(' ')[0] + ', telefoningizga 6 xonali kod yubordik.', 'korsatadi');
      }, function (err) { busy(btn, false); formMessage(f1, err.message, 'error'); });
    });

    // 2-qadam: SMS kod
    var verifying = false;
    var otp = wireOtp($('#reg-otp'), function (code) { if (!verifying) verify(code); });
    function verify(code) {
      verifying = true;
      formMessage(f2, 'Tekshirilmoqda…');
      post('/auth/verify-code', { phone: data.phone, code: code }).then(function () {
        data.code = code;
        return post('/auth/register', data);
      }).then(function () {
        verifying = false;
        formMessage(f2, '');
        S.show(3);
        say('Ajoyib! Oxirgi savol: arab tilini qanchalik bilasiz?', 'oylaydi');
      }, function (err) {
        verifying = false;
        otp.error();
        formMessage(f2, err.message, 'error');
        say('Kodni yana bir tekshirib ko\'ring.', 'hayron');
        setTimeout(otp.clear, 600);
      });
    }
    f2.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = otp.value();
      if (v.length < 6) { otp.error(); formMessage(f2, "Kodning 6 ta raqamini ham kiriting.", 'error'); return; }
      verify(v);
    });
    $('#reg-back').addEventListener('click', function () { S.show(1); say("Ma'lumotlarni tuzatib, qayta yuboring.", 'tabassum'); });
    var timer = resendTimer($('#reg-resend'), function () { return post('/auth/send-code', { phone: data.phone, purpose: 'register' }); });

    // 3-qadam: daraja va maqsad
    f3.addEventListener('submit', function (e) {
      e.preventDefault();
      var level = $('input[name=level]:checked', f3);
      if (!level) { formMessage(f3, 'Darajangizni tanlang — shunga qarab birinchi darsni tavsiya qilamiz.', 'error'); return; }
      var goals = $$('input[name=goal]:checked', f3).map(function (g) { return g.value; });
      var btn = $('button[type=submit]', f3);
      busy(btn, true, 'Saqlanmoqda…');
      post('/auth/profile', { level: level.value, goals: goals }).then(function () {
        busy(btn, false);
        var rec = { zero: "1-dars: arab alifbosi va harakatlar", alphabet: "1-dars: هَذَا كِتَابٌ — ko'rsatish olmoshlari", reader: "Grammatika: jarr harflari" }[level.value];
        $('#reg-done-name').textContent = data.name.split(' ')[0];
        $('#reg-done-rec').textContent = rec;
        S.show(4);
        var sw = $('.auth-switch', root); if (sw) sw.hidden = true;
        say('Tabriklayman! Birinchi darsga tayyormisiz?', 'kuladi');
        celebrate();
      }, function (err) { busy(btn, false); formMessage(f3, err.message, 'error'); });
    });
    $$('input[name=level]', f3).forEach(function (r) {
      r.addEventListener('change', function () {
        formMessage(f3, '');
        say({ zero: "Zo'r! Alifbodan boshlaymiz — qadamma-qadam.", alphabet: 'Yaxshi! Oddiy jumlalarni o\'qishdan boshlaymiz.', reader: 'Barakalla! Grammatika va lug\'atni chuqurlashtiramiz.' }[r.value], 'kozqisadi');
      });
    });

    var done = $('#reg-start');
    if (done) done.addEventListener('click', function (e) {
      if (DEMO) { e.preventDefault(); formMessage($('[data-step="4"]', root), "Namuna rejimi: saytda bu tugma birinchi darsni ochadi.", 'ok'); }
    });
  }

  // Tabrik: rangli qog'oz parchalari (harakat kamaytirilgan bo'lsa — yo'q)
  function celebrate() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var host = $('.auth-card');
    if (!host) return;
    var colors = ['#3b82f6', '#f2b84b', '#2dd4bf', '#f472b6', '#a78bfa'];
    for (var i = 0; i < 28; i++) {
      var c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = (5 + Math.random() * 90) + '%';
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      c.style.setProperty('--x', (Math.random() * 80 - 40) + 'px');
      c.style.animationDelay = (Math.random() * 0.35) + 's';
      host.appendChild(c);
      setTimeout(function (el) { el.remove(); }, 2200, c);
    }
  }

  // ================= PAROLNI TIKLASH =================
  function initReset() {
    var root = $('#reset');
    if (!root) return;
    var S = steps(root);
    var phone = '';
    var f1 = $('#reset-form-1'), f2 = $('#reset-form-2');
    alertMsg = function (e) { formMessage(f2, e.message, 'error'); };

    f1.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = $('#reset-phone');
      if (!setError(inp, !isPhone(inp.value) ? "Telefon raqamini to'liq kiriting: +998 (90) 123-45-67." : '')) { inp.focus(); return; }
      phone = '+998' + phoneDigits(inp.value);
      var btn = $('button[type=submit]', f1);
      busy(btn, true, 'Kod yuborilmoqda…');
      post('/auth/send-code', { phone: phone, purpose: 'reset' }).then(function () {
        busy(btn, false);
        $('#reset-phone-shown').textContent = formatPhone(phone);
        S.show(2);
        timer.start();
        say('Kodni va yangi parolni kiriting.', 'korsatadi');
      }, function (err) { busy(btn, false); formMessage(f1, err.message, 'error'); });
    });

    var otp = wireOtp($('#reset-otp'), function () { $('#reset-pw').focus(); });
    var timer = resendTimer($('#reset-resend'), function () { return post('/auth/send-code', { phone: phone, purpose: 'reset' }); });
    $('#reset-back').addEventListener('click', function () { S.show(1); });

    f2.addEventListener('submit', function (e) {
      e.preventDefault();
      formMessage(f2, '');
      var pw = $('#reset-pw'), pw2 = $('#reset-pw2');
      var code = otp.value();
      var ok = true;
      if (code.length < 6) { otp.error(); ok = false; formMessage(f2, "Kodning 6 ta raqamini ham kiriting.", 'error'); }
      ok = setError(pw, pw.value.length < 8 ? "Parol kamida 8 belgidan iborat bo'lsin." : '') && ok;
      ok = setError(pw2, pw2.value !== pw.value ? 'Parollar bir xil emas.' : '') && ok;
      if (!ok) return;
      var btn = $('button[type=submit]', f2);
      busy(btn, true, 'Saqlanmoqda…');
      post('/auth/reset-password', { phone: phone, code: code, password: pw.value }).then(function () {
        busy(btn, false);
        S.show(3);
        say('Tayyor! Endi yangi parol bilan kiring.', 'kuladi');
      }, function (err) {
        busy(btn, false);
        otp.error();
        formMessage(f2, err.message, 'error');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var img = $('#auth-ustoz');
    if (img && window.MuallimUstoz) {
      U = window.MuallimUstoz(img);
      U.idle();
      setTimeout(function () { if (img.dataset.now === 'salom') U.mood('tabassum'); }, 2600);
    }
    wireCommon();
    initLogin();
    initRegister();
    initReset();
  });

  // Sinov uchun
  window.MuallimAuth = { formatPhone: formatPhone, isPhone: isPhone, isEmail: isEmail, strength: strength, demo: DEMO };
})();
