# Muallim

Muallim platformasi uchun namuna sahifalar va ovoz kutubxonasi.

## Tarkib

| Fayl | Nima |
| --- | --- |
| `index.html` | Login'dan oldingi kirish (landing) sahifasi: doska va ustoz animatsiyasi, «Birinchi darsdan parcha» demo |
| `docs/kirish-sahifasi-tahlili.md` | Kirish sahifasi tahlili: kamchiliklar, qo'shilgan animatsiyalar, sizdan kerakli ma'lumotlar |
| `demo/soz-tarjimasi.html` | O'qish matni: so'z bosilganda ovozli talaffuz, tarjima va qisqa sharh (telefonda ham ishlaydi) |
| `demo/kino-dars.html` | **Kino-dars**: doska + ovozli ustoz + subtitr + qadamlar pleyeri; AI darsni oqim bilan yozadi, 1-qadam darhol boshlanadi |
| `demo/muallim-ai.html` | Muallim AI chati: javoblarni ovoz chiqarib o'qish va savolni ovoz bilan aytish |
| `ai/muallim-ai-prompt.md` | Batafsil dars uchun ko'rsatma (system prompt) va javob vaqtini qisqartirish bo'yicha tavsiyalar |
| `assets/js/muallim-ovoz.js` | Ovoz kutubxonasi — saytga ulash uchun |

## Muallim AI'ga ovoz ulash

```html
<script src="assets/js/muallim-ovoz.js"></script>
```

```js
// 1. Foydalanuvchi birinchi marta biror tugmani bosganda (iOS uchun shart)
MuallimOvoz.unlock();

// 2. AI javobi kelganda — ovoz chiqarib o'qish
//    O'zbekcha qism o'zbekcha (yo'q bo'lsa turkcha) ovozda, arabcha qism arabcha ovozda o'qiladi
MuallimOvoz.speak(javobMatni, {
  onStart: function () { /* tugmani "gapiryapti" holatiga o'tkazish */ },
  onEnd:   function () { /* oddiy holatga qaytarish */ }
});
MuallimOvoz.stop();

// 3. Mikrofon tugmasi — ovoz bilan yozish
var t = MuallimOvoz.listen({
  lang: 'uz-UZ',
  onInterim: function (matn) { input.value = matn; },  // gapirayotganda
  onResult:  function (matn) { yuborish(matn); },     // gap tugaganda
  onError:   function (kod, xabar) { korsat(xabar); }  // o'zbekcha xato matni
});
t.stop();

// Qurilmada qaysi ovozlar borligini bilish
MuallimOvoz.status(); // { tts, stt, arabic, uzbek, uzbekFallback, voicesLoaded }
```

Kino-dars uchun: `MuallimOvoz.speak(matn, { onPiece: function (i, bolak) { ... } })` har bir
bo'lak o'qila boshlaganda chaqiriladi — subtitrni belgilash va doskaga qator chiqarish uchun.
`MuallimOvoz.pieces(matn)` xuddi shu bo'laklar ro'yxatini qaytaradi.

To'liq ishlatilish namunasi: `demo/kino-dars.html` va `demo/muallim-ai.html`. Namunada AI serveriga ulanish
`ask()` funksiyasida — saytda u yerga Muallim AI API'si chaqiriladi.

### Cheklovlar

- Ovoz brauzerning o'zidagi Web Speech API orqali ishlaydi; sifati qurilmaga bog'liq.
  Ko'p telefonlarda o'zbekcha ovoz yo'q — u holda turkcha ovoz ishlatiladi va sahifada
  til paketini o'rnatish bo'yicha maslahat chiqadi.
- Ovoz bilan yozish (mikrofon) Chrome (Android, kompyuter) va Safari'da ishlaydi, Firefox'da yo'q.
  Sayt HTTPS orqali ochilishi va foydalanuvchi mikrofonga ruxsat berishi kerak.
- Arabcha talaffuz aniq bo'lishi muhim bo'lgan joylarda (dars matnlari) yozib olingan
  audio fayllardan foydalanish tavsiya etiladi.
