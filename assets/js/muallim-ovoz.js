/*
 * Muallim ovoz — matnni ovozli o'qish (TTS) va ovoz bilan yozish (STT).
 *
 * Ulash:   <script src="assets/js/muallim-ovoz.js"></script>
 *
 *   MuallimOvoz.unlock();                      // birinchi bosishda (iOS uchun)
 *   MuallimOvoz.speak(matn, { onStart, onEnd }); // o'zbekcha + arabcha aralash matnni o'qiydi
 *   MuallimOvoz.stop();
 *   var tinglash = MuallimOvoz.listen({ lang: 'uz-UZ', onInterim, onResult, onEnd, onError });
 *   tinglash.stop();
 *   MuallimOvoz.status();                     // { tts, stt, arabic, uzbek, uzbekFallback }
 *
 * Arabcha qismlar arabcha ovoz bilan, qolgani o'zbekcha ovoz bilan o'qiladi.
 * Qurilmada o'zbekcha ovoz bo'lmasa, turkcha (keyin ruscha) ovoz ishlatiladi.
 */
(function (global) {
  'use strict';

  var synth = global.speechSynthesis || null;
  var Utterance = global.SpeechSynthesisUtterance || null;
  var Recognition = global.SpeechRecognition || global.webkitSpeechRecognition || null;

  var ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
  var CYRILLIC = /[Ѐ-ӿ]/;
  var LETTER = /[\p{L}]/u;
  var MAX_CHUNK = 180; // Chrome uzun matnni ~15 soniyada uzib qo'yadi — bo'lib o'qiymiz

  var voices = [];
  function loadVoices() { if (synth) voices = synth.getVoices() || []; }
  if (synth) {
    loadVoices();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices);
    else synth.onvoiceschanged = loadVoices;
  }

  function findVoice(prefixes) {
    loadVoices();
    for (var i = 0; i < prefixes.length; i++) {
      var p = prefixes[i];
      var match = voices.filter(function (v) {
        return v.lang && v.lang.toLowerCase().replace('_', '-').indexOf(p) === 0;
      });
      if (match.length) {
        // Qurilmaning o'z (offline) ovozini afzal ko'ramiz — tezroq ishga tushadi
        return match.filter(function (v) { return v.localService; })[0] || match[0];
      }
    }
    return null;
  }

  var VOICE_ORDER = {
    ar: ['ar'],
    uz: ['uz', 'tr', 'ru'],      // lotin yozuvi: turkcha ovoz o'zbekchaga eng yaqin
    'uz-cyrl': ['uz', 'ru', 'kk']
  };
  var DEFAULT_LANG = { ar: 'ar-SA', uz: 'uz-UZ', 'uz-cyrl': 'uz-UZ' };

  // Ovozga keraksiz belgilarni olib tashlash: markdown, havolalar, emoji
  function clean(text) {
    return String(text || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[*_`#>|~]+/g, ' ')
      .replace(/^\s*[-•]\s+/gm, '')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
      .replace(/[«»"“”]/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  // Matnni arabcha va arabcha bo'lmagan bo'laklarga ajratish
  function segment(text) {
    var runs = [], cur = null;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var kind = ARABIC.test(ch) ? 'ar' : (LETTER.test(ch) ? (CYRILLIC.test(ch) ? 'uz-cyrl' : 'uz') : null);
      if (!cur) cur = { kind: kind || 'uz', text: '' };
      if (kind && kind !== cur.kind && /\S/.test(cur.text) && hasLetter(cur.text)) {
        runs.push(cur);
        cur = { kind: kind, text: '' };
      } else if (kind && !hasLetter(cur.text)) {
        cur.kind = kind;
      }
      cur.text += ch;
    }
    if (cur && hasLetter(cur.text)) runs.push(cur);
    else if (cur && runs.length) runs[runs.length - 1].text += cur.text;
    return runs;
  }
  function hasLetter(s) { return LETTER.test(s); }

  // Uzun bo'laklarni gaplar bo'yicha qisqartirish
  function chunk(text) {
    var parts = text.split(/(?<=[.!?؟\n])\s+/), out = [];
    parts.forEach(function (p) {
      p = p.trim();
      while (p.length > MAX_CHUNK) {
        var cut = p.lastIndexOf(' ', MAX_CHUNK);
        if (cut < 40) cut = MAX_CHUNK;
        out.push(p.slice(0, cut));
        p = p.slice(cut).trim();
      }
      if (p) out.push(p);
    });
    return out;
  }

  var token = 0;

  function stop() {
    token++;
    if (synth) synth.cancel();
  }

  function speak(text, opts) {
    opts = opts || {};
    if (!synth || !Utterance) {
      if (opts.onError) opts.onError('unsupported', "Bu brauzer matnni ovozli o'qiy olmaydi.");
      return false;
    }
    stop();
    var my = token;
    var runs = segment(clean(text));
    var queue = [];
    runs.forEach(function (r) {
      var v = findVoice(VOICE_ORDER[r.kind]);
      chunk(r.text).forEach(function (piece) {
        if (!hasLetter(piece)) return;
        var u = new Utterance(piece);
        u.lang = v ? v.lang : DEFAULT_LANG[r.kind];
        if (v) u.voice = v;
        u.rate = (r.kind === 'ar' ? 0.8 : 1) * (opts.rate || 1);
        queue.push(u);
      });
    });
    if (!queue.length) return false;

    var started = false;
    queue.forEach(function (u, i) {
      u.onstart = function () {
        if (my !== token) return;
        if (!started) { started = true; if (opts.onStart) opts.onStart(); }
      };
      u.onend = function () {
        if (my === token && i === queue.length - 1 && opts.onEnd) opts.onEnd();
      };
      u.onerror = function (e) {
        if (my !== token) return;
        if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
        if (opts.onError) opts.onError(e && e.error, "Ovozli o'qishda xatolik yuz berdi.");
        if (opts.onEnd) opts.onEnd();
      };
    });
    // Ba'zi Android brauzerlarida cancel()dan keyin darhol speak() yutilib ketadi
    setTimeout(function () {
      if (my !== token) return;
      queue.forEach(function (u) { synth.speak(u); });
    }, 30);
    return true;
  }

  // iOS Safari ovozni faqat foydalanuvchi bosgan paytda "ochadi".
  // Birinchi bosishda chaqiring — keyingi avtomatik o'qishlar ishlaydi.
  var unlocked = false;
  function unlock() {
    if (unlocked || !synth || !Utterance) return;
    unlocked = true;
    var u = new Utterance(' ');
    u.volume = 0;
    synth.speak(u);
  }

  var ERRORS = {
    'not-allowed': "Mikrofonga ruxsat berilmagan. Brauzer sozlamalarida bu sayt uchun mikrofonni yoqing.",
    'service-not-allowed': "Mikrofonga ruxsat berilmagan. Brauzer sozlamalarida bu sayt uchun mikrofonni yoqing.",
    'no-speech': "Ovoz eshitilmadi. Mikrofonga yaqinroq gapirib, qaytadan urinib ko'ring.",
    'audio-capture': "Mikrofon topilmadi.",
    'network': "Ovozni matnga aylantirish uchun internet kerak.",
    'language-not-supported': "Bu brauzer tanlangan tilda ovozni tanimaydi.",
    'unsupported': "Bu brauzer ovoz bilan yozishni qo'llamaydi. Chrome yoki Safari'dan foydalaning."
  };

  function listen(opts) {
    opts = opts || {};
    if (!Recognition) {
      if (opts.onError) opts.onError('unsupported', ERRORS.unsupported);
      if (opts.onEnd) opts.onEnd();
      return { stop: function () {} };
    }
    stop(); // AI gapirayotgan bo'lsa — to'xtatamiz, aks holda o'z ovozini eshitadi
    var rec = new Recognition();
    rec.lang = opts.lang || 'uz-UZ';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    var finalText = '';
    var ended = false;

    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      if (opts.onInterim) opts.onInterim((finalText + interim).trim());
    };
    rec.onerror = function (e) {
      if (e.error === 'aborted') return;
      if (opts.onError) opts.onError(e.error, ERRORS[e.error] || "Ovozni tanishda xatolik: " + e.error);
    };
    rec.onend = function () {
      if (ended) return;
      ended = true;
      if (finalText.trim() && opts.onResult) opts.onResult(finalText.trim());
      if (opts.onEnd) opts.onEnd();
    };
    try { rec.start(); } catch (err) {
      if (opts.onError) opts.onError('start', "Mikrofonni ishga tushirib bo'lmadi.");
      rec.onend();
    }
    return { stop: function () { try { rec.stop(); } catch (err) {} } };
  }

  function status() {
    return {
      tts: !!(synth && Utterance),
      stt: !!Recognition,
      arabic: !!findVoice(['ar']),
      uzbek: !!findVoice(['uz']),
      uzbekFallback: (function () { var v = findVoice(VOICE_ORDER.uz); return v ? v.lang : null; })(),
      voicesLoaded: voices.length > 0
    };
  }

  global.MuallimOvoz = {
    speak: speak,
    stop: stop,
    unlock: unlock,
    listen: listen,
    status: status,
    isSpeaking: function () { return !!(synth && synth.speaking); },
    _segment: function (t) { return segment(clean(t)); } // sinov uchun
  };
})(window);
