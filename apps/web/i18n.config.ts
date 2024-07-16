/**
 * Global i18n configuration.
 * The currency setting (e.g. "USD") only works with Stripe for now.
 * For LemonSqueezy, we need to set the currency in the LemonSqueezy dashboard
 * and there can only be one.
 */
export default defineI18nConfig(() => ({
  legacy: false,
  // availableLocales: ["en", "de", "es"],
  availableLocales: ["en"],
  locale: "en",
  fallbackLocale: "en",
  numberFormats: {
    de: {
      currency: {
        style: "currency",
        currency: "USD",
        notation: "standard",
      },
      number: {
        style: "decimal",
        maximumFractionDigits: 0,
      },
      percent: {
        style: "percent",
        useGrouping: false,
      },
    },
    en: {
      currency: {
        style: "currency",
        currency: "USD",
        notation: "standard",
      },
      number: {
        style: "decimal",
        maximumFractionDigits: 0,
      },
      percent: {
        style: "percent",
        useGrouping: false,
      },
    },
    es: {
      currency: {
        style: "currency",
        currency: "USD",
        notation: "standard",
      },
      number: {
        style: "decimal",
        maximumFractionDigits: 0,
      },
      percent: {
        style: "percent",
        useGrouping: false,
      },
    },
  },
}));
