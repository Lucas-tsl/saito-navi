const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: ["assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        jQuery: "readonly",
        gtag: "readonly",
        CustomEvent: "readonly",
        Event: "readonly",
        URLSearchParams: "readonly",
        MutationObserver: "readonly",
        IntersectionObserver: "readonly",
        getComputedStyle: "readonly",
        naviCookieConfig: "readonly",
        naviStickyCartI18n: "readonly",
        naviStickyCartConfig: "readonly",
        naviStoriesI18n: "readonly",
        naviConfig: "readonly",
        naviStoriesSettingsData: "readonly",
        naviStoryAdminData: "readonly",
        dataLayer: "writable",
        wp: "readonly",
        CSS: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
];
