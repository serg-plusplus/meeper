export const WHISPER_LANGUAGES = `Afrikaans, Arabic, Armenian, Azerbaijani, Belarusian, Bosnian, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician, German, Greek, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kannada, Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Marathi, Maori, Nepali, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Tamil, Thai, Turkish, Ukrainian, Urdu, Vietnamese, Welsh`;

export const WHISPER_LANG_CODES = `af, ar, hy, az, be, bs, bg, ca, zh, hr, cs, da, nl, en, et, fi, fr, gl, de, el, he, hi, hu, is, id, it, ja, kn, kk, ko, lv, lt, mk, ms, mr, mi, ne, no, fa, pl, pt, ro, ru, sr, sk, sl, es, sw, sv, tl, ta, th, tr, uk, ur, vi, cy`;

export const WHISPER_LANG_LIST = (() => {
  const langs = `Auto, ${WHISPER_LANGUAGES}`.split(", ");
  const codes = `auto, ${WHISPER_LANG_CODES}`.split(", ");

  return codes.map((code, i) => ({ code, name: langs[i] }));
})();

export const WHISPER_LANG_MAP = new Map(
  WHISPER_LANG_LIST.map(({ code, name }) => [code, name]),
);
