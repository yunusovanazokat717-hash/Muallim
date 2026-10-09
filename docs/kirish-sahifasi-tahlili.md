# Kirish sahifasi (login'dan oldingi qism) — tahlil va o'zgarishlar

> muallim.com.uz saytining o'zi bu ishda ochilmadi (tarmoq cheklovi). Tahlil repozitoriyadagi
> `index.html` va siz yuborgan ilova skrinshotlari (o'qish sahifasi, Muallim AI, kino-dars) asosida.
> Saytdagi haqiqiy kirish sahifasini shu ro'yxat bilan solishtirib chiqing.

## 1. Asosiy muammo: sahifa boshqa mahsulot haqida edi

Eski `index.html` **o'qituvchilar malaka oshirish platformasi**ni tasvirlardi (malaka oshirish kurslari,
metodik materiallar, attestatsiya, sertifikatlar, maktab rahbarlari). Ilovaning o'zi esa —
**o'zbek tilida arab tilini o'rgatish platformasi**: harakatli arabcha matnlar, so'z tarjimasi,
rasmli lug'at, kino-dars, Muallim AI, doppili ustoz maskoti. Kirish sahifasi mahsulotni noto'g'ri
va'da qilgani uchun to'liq qayta yozildi.

## 2. Dizayn kamchiliklari va nima qilindi

| Kamchilik | Nima qilindi |
| --- | --- |
| Rang va uslub ilovaga o'xshamas edi (oq fon, umumiy ko'k) | Ilovaning qorong'i ko'k foni, doskaning qog'oz rangi, bo'r ko'k arabcha yozuv va tilla urg'u. Yorug' rejim ham bor |
| Hero'da umumiy «kurslarim» maketi — mahsulotni ko'rsatmasdi | Hero'da **doska + ustoz**: ustoz doskaga هَذَا كِتَابٌ ni yozadi, so'zni bosganda talaffuzini aytadi |
| Maskot (brendning eng tanish qismi) yo'q edi | Doppili ustoz hero'da va yakuniy chaqiriqda |
| Mahsulotni ro'yxatdan o'tmasdan sinab bo'lmasdi | **«Birinchi darsdan parcha»**: so'z bosilganda tarjima, talaffuz, sharh; «Harakat» tugmasi |
| Imkoniyatlar mahsulotga tegishli emasdi | 6 ta haqiqiy imkoniyat: kino-dars, Muallim AI, interaktiv o'qish, talaffuz, rasmli lug'at, harakatsiz o'qish mashqi |
| «3 qadam: ro'yxatdan o'ting…» — hech narsa aytmasdi | «Har bir dars 4 bosqich»: o'qing → tinglang → tushuning → so'rang, har birida misol |
| FAQ umumiy edi | Arab tiliga xos savollar: alifboni bilmasam, ovoz chiqmasa, Muallim AI nima |
| To'qima email (`info@emuallim.com.uz`) | Olib tashlandi; o'rniga «Chat bo'limiga yozing» |
| Arabcha shrift yo'q edi | Amiri (arabcha), Caveat (doska yozuvi), Onest (asosiy matn) |

## 3. Qo'shilgan animatsiyalar

| Joy | Animatsiya | Maqsad |
| --- | --- | --- |
| Hero matni | Sarlavha, matn va tugmalar ketma-ket ko'tarilib chiqadi; «tushunib» so'zi tagiga chiziq tortiladi | Birinchi taassurot, asosiy so'zga urg'u |
| Hero doskasi | Arabcha so'zlar **o'ngdan chapga yoziladi**, keyin o'qilishi va tarjimasi chiqadi, bo'r chiziq tortiladi | «Ustoz doskada tushuntiradi» degan g'oyani ko'rsatish |
| Ustoz | Paydo bo'ladi, ko'z qisadi, bosh irg'aydi; so'z aytilayotganda og'zi qimirlaydi | Jonli personaj — ishonch va iliqlik |
| Fon | Arab harflari (ا ب ت ج …) sekin suzib ko'tariladi | Mavzu muhiti, juda xira — matnga xalaqit bermaydi |
| Bo'limlar | Aylantirganda yumshoq paydo bo'ladi (kartalar navbat bilan) | Ritm; ko'rinib turgan narsa hech qachon yashirilmaydi |
| «Qanday o'rganamiz» | Bosqichlarni bog'lovchi chiziq aylantirgan sari o'sib boradi | Yo'l/progress hissi |
| Kartalar, tugmalar | Kursor kelganda ko'tariladi, ikonka buriladi; asosiy tugma «bosiladi» | Interaktivlik |
| Tarjima oynasi, FAQ | Yumshoq ochilish | — |

Hammasi `prefers-reduced-motion` sozlamasida o'chadi (harakatdan bezovta bo'ladiganlar uchun).

## 4. Sizdan kerak bo'lgan ma'lumotlar (o'zgartirish yoki qo'shish uchun)

Bular sahifaga to'qib yozilmadi — haqiqiy ma'lumot bilan to'ldirilishi kerak:

1. **Login va ro'yxatdan o'tish manzillari.** Hozir `login.html` va `register.html` — saytdagi haqiqiy yo'llar kerak.
2. **Narx/tarif.** «Ro'yxatdan o'tish bepul» deb yozildi. Bepul darslar soni, obuna narxi, sinov muddati bo'lsa — FAQ va CTA'ga qo'shish kerak.
3. **Kurs dasturi.** Nechta dars, qaysi bosqichlar (alifbo → o'qish → grammatika …), daraja (boshlang'ich/o'rta). Shundan «Dastur» bo'limi qilinadi — eng ko'p ishonch beradigan bo'lim.
4. **Raqamlar.** O'quvchilar soni, darslar soni, so'zlar soni — faqat haqiqiylari (to'qima raqamlar qo'yilmadi).
5. **Fikrlar.** Haqiqiy o'quvchi/ota-ona fikrlari (ismi va ruxsati bilan).
6. **Muallif/ustoz haqida.** Darslarni kim tuzgan, malakasi — arab tili kursida ishonch uchun muhim.
7. **Aloqa.** Telefon, Telegram kanal/bot, email, manzil — footer va «Yordam» uchun.
8. **Huquqiy hujjatlar.** Foydalanish shartlari va Maxfiylik siyosati sahifalari (havolalar hozir bo'sh `#`).
9. **Ilova.** Android/iOS ilovasi bo'lsa — do'kon havolalari.
10. **Domen.** `muallim.com.uz` va `emuallim.com.uz` — qaysi biri asosiy? Ijtimoiy tarmoq ulashish rasmi (`og:image`, 1200×630) ham kerak.
11. **Auditoriya.** «Kimlar uchun» bo'limidagi uchta guruh taxmin — maqsadli auditoriyangizni tasdiqlang (masalan, maktab o'quvchilari, kattalar, Qur'on o'qishni o'rganuvchilar).
12. **Logotip.** Hozirgi `logo.svg` — vaqtinchalik. Haqiqiy logotip va maskot fayllari (SVG) kerak.

## 5. Qo'shimcha tavsiyalar (keyingi bosqich)

- **Dastur bo'limi** (4-banddagi ma'lumot kelgach): bosqichlar xaritasi, har bosqichda nima o'rganiladi.
- **Kino-darsdan 20–30 soniyalik parcha** hero yoki «Imkoniyatlar»da (ovozli, subtitrli).
- **Ijtimoiy isbot** (raqamlar, fikrlar) — CTA'dan oldin.
- **Analitika:** «Bepul boshlash», «Darsni sinab ko'rish» va demo so'z bosishlarini o'lchash.
- **Tezlik:** shriftlar Google Fonts'dan — saytda o'zingizning serveringizga ko'chirish tavsiya etiladi.
