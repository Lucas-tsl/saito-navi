=== Saito Navi ===
Contributors: lucastsl
Tags: woocommerce, cookie consent, accessibility, sticky add to cart, stories
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.9.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Requires Plugins: woocommerce

One floating button for cookie consent, accessibility, sticky add-to-cart and product video stories.

== Description ==

Saito Navi gathers several customer engagement modules for WooCommerce
behind **a single floating button** (gear icon, corner of the screen):

* **Cookie consent** — GDPR banner, Google Consent Mode V2, preferences
  modal, logo auto-detected from the site identity if no URL is set.
* **Accessibility** — language switcher (WPML-compatible, falls back to
  GTranslate if WPML is absent), text size, high contrast, enlarged
  cursor, underlined links.
* **Sticky add-to-cart** — a panel that follows the visitor on the
  WooCommerce product page, works with simple and variable products, a
  keyboard-accessible swatch selector, compatible with WCBoost Variation
  Swatches, and a custom CSS selector setting for themes not covered by
  the built-in fallback chain.
* **Stories** — up to 4 video bubbles per product (YouTube or an
  uploaded MP4), a dedicated tab on the WooCommerce product page, a
  desktop panel with a pure-CSS phone mockup (no external image), and a
  mobile full-screen stories-style view. Displayed by default after the
  product gallery, or wherever you like via the `[navi_stories]`
  shortcode.
* **Calendar** — opens a [Saito Calendar Event](https://wordpress.org/plugins/saito-calendar-event/)
  calendar (advent calendar, countdown) from the floating button, on every
  page that doesn't already show it. Requires Saito Calendar Event.

The floating button adapts to the page: on product pages it is a cart
with a "+" that opens the sticky add-to-cart directly, on other pages a
calendar icon that opens the calendar directly (when the Calendar module
has one to show). The gear and its menu (back to top, cookies,
accessibility) only appear in the footer; on pages with nothing else to
show, the button stays hidden until the footer (keyboard users still
reach it with the "skip to settings" link).

Built from the ground up to welcome new modules without touching the
core: each module registers itself and talks to the central button
through a generic event, and no module knows about the others.

Everything is configurable from the Back Office (**Navi** menu): colors,
corner radius, button position, and for each module its own "Show on
desktop" / "Show on mobile" setting.

Sibling of [Navi for PrestaShop](https://github.com/Lucas-tsl/navi-prestashop)
— same name, same spirit (one hub rather than independent widgets), two
separate implementations adapted to each ecosystem.

= External services and embedded content =

* **Google Consent Mode V2**: the Cookie consent module pushes the
  visitor's choices into `window.dataLayer` (the standard Google Tag
  Manager/gtag.js mechanism). The plugin itself never sends any request
  to a Google server — the site must already have gtag.js/GTM in place
  for this signal to be used.
* **YouTube ("no-cookie" mode)**: the Stories module displays configured
  videos via `youtube-nocookie.com` in an iframe, only on product pages
  where a YouTube story has been configured by the site administrator.
  See the [YouTube privacy policy](https://policies.google.com/privacy).
* **YouTube thumbnails**: when an administrator sets a YouTube story
  without a custom preview, the plugin makes a server-side `HEAD` request
  (3s timeout, no data sent beyond the request itself, no account or API
  key involved) to `img.youtube.com` to check whether the HD thumbnail
  (`maxresdefault.jpg`) exists for that video, falling back to a lower
  resolution (`hqdefault.jpg`) if it doesn't — this avoids storing a
  broken image URL for videos (mostly YouTube Shorts) that only have the
  lower-resolution thumbnail. This request only happens when a product is
  saved with a YouTube story configured, never on a visitor's page load.

== Installation ==

1. Upload the `saito-navi` folder to `/wp-content/plugins/`, or install
   directly from **Plugins > Add New**.
2. Activate the plugin from the **Plugins** menu.
3. WooCommerce must be installed and active (required for the Sticky
   add-to-cart and Stories modules; the Cookie consent and Accessibility
   modules work without it).
4. Configure the modules from **Saito → Navi** in the Back Office (the "Saito" menu is shared by all Saito plugins).

== Frequently Asked Questions ==

= Is WooCommerce required? =

The core and the Cookie consent / Accessibility modules work without
WooCommerce. The Sticky add-to-cart and Stories modules are tied to the
WooCommerce product page and therefore require it to be active — a
notice is shown in the Back Office if WooCommerce is missing or inactive.

= Where are uploaded MP4 story videos stored? =

Story preview videos are picked or uploaded through the standard
WordPress Media Library (the same picker used everywhere else in the
admin), so they're stored like any other media file, never inside the
plugin folder — the latter can be overwritten on every plugin update,
unlike the uploads folder.

= Does the Accessibility module's language switcher work without WPML? =

Yes: if it detects the GTranslate plugin installed, it falls back to it;
otherwise the language switcher simply doesn't appear (the other
accessibility settings remain available).

= Does the sticky add-to-cart work with my theme? =

A fallback chain of CSS selectors covers standard WooCommerce markup and
the most common themes. If your theme has an unusual structure, a
"custom CSS selector" setting per field (price, name, image) is
available under Saito > Navi > Cart.

= Does the color/thumbnail picker on the sticky bar work with any swatches plugin? =

Out of the box it reads colors from WCBoost Variation Swatches if that
plugin is active. For any other theme or plugin displaying its own
per-variation thumbnails (image or color), set the "Sélecteur CSS de la
vignette de variation" field under Saito > Navi > Cart to a template such as
`#{value}` (with `{value}` replaced automatically by each variation's
value) pointing at your theme's markup — an image found inside is used
first, otherwise its background color.

= Does the sticky add-to-cart work with block themes (Site Editor)? =

Yes: WooCommerce's default block-based Single Product template still
renders the classic variations form under the hood, which the sticky
cart already detects. The one exception is WooCommerce's own
experimental "Add to Cart + Options (Beta)" block (fully JavaScript-
driven, no classic form) — not supported while it remains in beta.

= Can I place the story bubbles as a block instead of a shortcode? =

Yes: the "Navi Stories" block does the same thing as `[navi_stories]`,
with a "Product ID" field in the block settings.

= Can I control where the story bubbles are displayed? =

By default they appear right after the product gallery. Use the
`[navi_stories]` shortcode to place them anywhere else instead (post
content, a page builder, or a theme template) — add
`id="123"` to target a specific product, or leave it empty to use the
current product page. To avoid showing the bubbles twice, turn off
"Afficher automatiquement" under Saito > Navi > Stories if you use the shortcode
exclusively.

== Screenshots ==

1. Saito > Navi, General tab: floating button position, plugin language,
   appearance (colors, corner radius).
2. Cookie consent tab: banner settings, with concrete Google Tag Manager /
   Consent Mode V2 setup instructions.
3. Accessibility tab: module activation and per-device visibility.
4. Sticky add-to-cart tab: module activation and custom CSS selectors for
   themes not covered by the built-in fallback.
5. Stories tab, Bubbles: display options and a live bubble appearance
   preview.
6. Stories tab, Mockup: phone mockup colors with a live preview.
7. Stories tab on the WooCommerce product edit page: up to 4 configurable
   video stories.
8. Sticky add-to-cart panel on a variable product page, swatch selector
   (front-end).
9. Accessibility panel: text size, contrast, cursor, underlined links
   (front-end).
10. Cookie preferences modal (GDPR, Google Consent Mode V2) on the visitor
    side.
11. Story video bubble and desktop panel (phone mockup) on the product
    page.

== Changelog ==

= 0.9.3 =
* Cookie banner: works when a cookie-banner blocker is active (NordVPN
  Threat Protection, AdGuard, uBlock/Brave "Annoyances" lists...). The
  script and stylesheet now have neutral file names; previously a blocked
  script left the banner visible with buttons that did nothing.
* The banner is now shown by its own script: if a blocker still removes
  it, the banner stays hidden instead of being unusable.
* Google Consent Mode V2 defaults are now printed inline in the page head
  instead of a separate file, so a blocker can no longer prevent the
  "denied" default from being set.
* The banner state is read from the visitor's cookie in the browser,
  so it stays correct when pages are served from a page cache.
* Consent choices are now sent to Google immediately on sites using
  Google Tag Manager without gtag.js (gtag is exposed globally).

= 0.9.2 =
* The gear now only appears in the footer: on pages without a cart or
  calendar icon, the floating button stays hidden until the footer is in
  view (it still shows up on keyboard focus).
* Calendar module: by default, the most recent calendar currently
  displayed (within its publication period) is used, so a calendar
  prepared in advance no longer hides the one that is live.

= 0.9.1 =
* Outside the footer, the floating button only shows the page's own icon
  and opens it directly: the cart with a "+" on product pages, the
  calendar elsewhere. The gear and its menu (back to top, cookies,
  accessibility) only come back in the footer, and that menu no longer
  lists the cart or the calendar.
* The calendar is never offered on product pages.
* The close button of the calendar and of the sticky add-to-cart now
  closes the floating button completely instead of going back to the menu.
* Opened by a click, the sticky add-to-cart stays open while the page's
  own "Add to cart" button is in view (until closed or the footer).
* A click on the cart icon right after the page loads is no longer lost.

= 0.9.0 =
* The floating button's icon now depends on the page: a cart with a "+"
  on product pages (sticky add-to-cart active), a calendar when the
  Calendar module has a calendar to show, and the gear when the footer is
  in view (or everywhere else).
* New Calendar module: opens a Saito Calendar Event calendar inside the
  floating button (Saito > Navi > Calendar: choose the calendar, or the most
  recent one by default). Hidden on pages that already show that calendar
  and outside the calendar's publication period.
* The floating button now goes under the WooCommerce mini-cart drawer when
  it opens, instead of staying on top of it.
* Shared "Saito" menu: the dashboard cards no longer repeat the
  "Documentation" link (still at the end of the submenu).

= 0.8.0 =
* New shared "Saito" admin menu, common to all Saito plugins: "Navi" (admin.php?page=navi-main, unchanged) now
  lives under Saito, next to a dashboard of the Saito plugins, a Tools
  page (additional CSS and JavaScript for the whole site) and a
  Documentation page (source code, documentation, WordPress.org pages).
* Sticky add-to-cart: the "Add to cart" and "Out of stock" texts can now be
  customized (Navi > Cart). Empty = default text.

= 0.7.3 =
* Sticky add-to-cart: the variation color/thumbnail picker now supports a
  custom CSS selector (Navi > Cart, "Sélecteur CSS de la vignette de
  variation") for themes/plugins other than WCBoost Variation Swatches —
  reads an image if present in the matched element, otherwise its
  background color.
* Fix: module labels are now translated on first use instead of at plugin
  load (no more "_load_textdomain_just_in_time" notice, which could break
  the wp-admin login when WP_DEBUG_DISPLAY is on).
* Stories recognises the shared product panel of Saito FAQ 0.2.0.

= 0.7.2 =
* Stories now integrates with the companion Navi FAQ plugin when it's
  active: both share a single "Navi" panel on the product edit screen
  (one internal tab per feature) instead of each adding its own separate
  entry under "Product data". Without Navi FAQ, Stories keeps its own
  "Stories (Navi)" tab under "Product data" as before.

= 0.7.1 =
* WordPress.org review: replaced every inline `<script>`/`<style>` block
  with `wp_register_script()`/`wp_enqueue_script()`/`wp_localize_script()`
  and `wp_enqueue_style()`/`wp_add_inline_style()` (hash-preserving
  referer field, Google Consent Mode injection, admin dashboard tabs,
  Stories settings live preview, Stories product tab). No behavior
  change.
* Documented the `wp_remote_head()` call to `img.youtube.com` (YouTube
  HD thumbnail availability check) in the "External services and
  embedded content" section.

= 0.7.0 =
* Story preview video is now picked directly from the WordPress Media
  Library (restricted to MP4 files) instead of a raw file upload field —
  no more dedicated upload folder to manage or clean up on uninstall.
* Fixed: YouTube fallback thumbnail could stay broken for Shorts
  (vertical videos without a `maxresdefault.jpg`) — now falls back to
  `hqdefault.jpg` automatically.
* Expanded PHPUnit test suite (Stories validation, Accessibility language
  fallback, module registry).

= 0.6.0 =
* "Navi Stories" block (Gutenberg), alongside the `[navi_stories]`
  shortcode.
* Onboarding: one-time redirect to Navi > Navi after activation, "First
  steps" card on the General tab.
* Verified compatibility with WooCommerce's default block-based Single
  Product template (see FAQ).

= 0.5.0 =
* Shortcode `[navi_stories]`, configurable bubble appearance (solid or
  gradient border, size), WordPress.org submission readiness.

= 0.4.0 =
* New Stories module: product video bubbles (YouTube/MP4), desktop
  panel, mobile full-screen view, appearance settings under Navi >
  Stories.

= 0.3.0 =
* Appearance parity with Navi for PrestaShop: configurable corner
  radius, per-module visibility by device, plugin logo as the admin
  menu icon.

= 0.2.0 =
* Sticky add-to-cart module: simple and variable products, swatch
  selector, custom CSS selector settings.

= 0.1.0 =
* Initial release: core (3-state floating button), Cookie consent and
  Accessibility modules.

== Upgrade Notice ==

= 0.9.3 =
Fixes the cookie banner when visitors use a cookie-banner blocker, and keeps Consent Mode defaults set in that case.

= 0.9.2 =
The floating button is hidden outside the footer on pages without a cart or calendar icon.

= 0.9.1 =
The floating button opens the cart (product pages) or the calendar directly; its menu is only shown in the footer.

= 0.9.0 =
Contextual icon for the floating button and a new optional Calendar module (requires Saito Calendar Event). No action required.

= 0.8.0 =
The "Navi" menu moves under the new shared "Saito" menu (Saito > Navi). Settings are unchanged.

= 0.7.3 =
No action required on upgrade. New optional setting under Navi > Cart for
sites using a variation swatch other than WCBoost.

= 0.7.2 =
No action required on upgrade. Product edit screen only changes when the
Navi FAQ plugin is also active.

= 0.7.1 =
No action required on upgrade. Internal-only fixes (WordPress.org review).

= 0.7.0 =
Existing story preview videos keep working. Sites upgrading from before
0.6.0 with MP4 videos uploaded via the old form: the files remain in
their upload folder and are cleaned up on uninstall as before.

= 0.6.0 =
No action required on upgrade.
