/**
 * BuildOps AI Locale-aware Formatters
 * Formats dates, numbers, and currency matching the active i18n locale without modifying backend/API data formats.
 */

export const getLocaleCode = (lng = 'en') => {
  switch (lng) {
    case 'hi':
      return 'hi-IN';
    case 'gu':
      return 'gu-IN';
    case 'en':
    default:
      return 'en-GB';
  }
};

/**
 * Formats a date string (e.g. '2026-09-20' or Date object) into:
 * English: 20 September 2026
 * Hindi: 20 सितंबर 2026
 * Gujarati: 20 સપ્ટેમ્બર 2026
 */
export const formatLocaleDate = (dateVal, lng = 'en') => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return dateVal;

  const locale = getLocaleCode(lng);
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch (err) {
    return dateVal;
  }
};

/**
 * Formats numbers into locale-aware digits (e.g. 10,000,000 in en, hi, gu)
 */
export const formatLocaleNumber = (num, lng = 'en') => {
  if (num === undefined || num === null || isNaN(Number(num))) return num;
  const locale = getLocaleCode(lng);
  try {
    return new Intl.NumberFormat(locale).format(Number(num));
  } catch (err) {
    return num;
  }
};
