export const config = {
  i18n: {
    locales: {
      en: {
        label: "English",
        numberFormats: {
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
    },
    defaultLocale: "en",
    defaultCurrency: "USD",
    cookieName: "NUXT_LOCALE",
  },
  auth: {
    redirectAfterLogout: "/",
  },
  mailing: {
    from: "hello@your-domain.com",
  },
  teams: {
    avatarColors: ["#4E6DF5", "#E5A158", "#9DBEE5", "#CED3D9"],
  },
} as const satisfies Config;

export type Config = {
  i18n: {
    locales: {
      [locale: string]: {
        label: string;
        numberFormats: {
          currency: { style: string; currency: string; notation: string };
          number: { style: string; maximumFractionDigits: number };
          percent: { style: string; useGrouping: boolean };
        };
      };
    };
    defaultLocale: string;
    defaultCurrency: string;
    cookieName: string;
  };
  auth: { redirectAfterLogout: string };
  mailing: {
    from: string;
  };
  teams: {
    avatarColors: string[];
  };
};

export type Locale = keyof (typeof config)["i18n"]["locales"];
