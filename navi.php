<?php
/**
 * Plugin Name: Saito Navi
 * Description: Floating engagement hub for WordPress/WooCommerce: cookie consent (Google Consent Mode V2), sticky add-to-cart on the product page, accessibility (language, text size, contrast, cursor, underlined links), all driven from a single button.
 * Version: 0.9.3
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Troteseil Lucas
 * Author URI: https://github.com/Lucas-tsl
 * Text Domain: saito-navi
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Requires Plugins: woocommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Sécurité : empêche l'accès direct au fichier
}

define( 'NAVI_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'NAVI_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'NAVI_VERSION', '0.9.3' );

// Pas d'appel à load_plugin_textdomain() : discouraged depuis WP 4.6 pour
// les plugins hébergés sur WordPress.org, qui chargent automatiquement les
// traductions du slug. N'affecte pas includes/core/i18n.php (interception
// gettext indépendante, pas basée sur des fichiers .mo).

// Les modules panier (sticky-cart) et stories dépendent de WooCommerce
// (classes Product, hooks woocommerce_*) — le noyau et les modules cookies/
// accessibilité restent utilisables sans, mais on avertit clairement plutôt
// que de laisser échouer silencieusement les deux autres. L'en-tête
// "Requires Plugins" ci-dessus empêche déjà l'activation sans WooCommerce
// sur WordPress 6.5+, cette notice couvre le cas où WooCommerce serait
// désactivé APRÈS coup.
add_action( 'admin_notices', 'navi_notice_woocommerce_manquant' );
function navi_notice_woocommerce_manquant() {
    if ( class_exists( 'WooCommerce' ) ) {
        return;
    }
    ?>
    <div class="notice notice-warning">
        <p><?php esc_html_e( 'Navi : WooCommerce est inactif. Les modules "Panier automatique" et "Stories" ne fonctionneront pas tant que WooCommerce ne sera pas réactivé.', 'saito-navi' ); ?></p>
    </div>
    <?php
}

// Menu « Saito » commun aux plugins Saito (Outils, Documentation) : voir
// includes/saito-hub/hub.php. Navi y apparaît en sous-menu.
require_once NAVI_PLUGIN_DIR . 'includes/saito-hub/load.php';
add_filter( 'saito_hub_plugins', 'navi_register_in_saito_hub' );
function navi_register_in_saito_hub( $plugins ) {
    $plugins['navi'] = array(
        'version'      => NAVI_VERSION,
        'settings_url' => admin_url( 'admin.php?page=navi-main' ),
        'menu_slugs'   => array( 'navi-main' ),
    );
    return $plugins;
}

// Noyau : registre de modules, helpers, menu admin, bouton flottant (FAB)
require_once NAVI_PLUGIN_DIR . 'includes/core/class-navi-module-registry.php';
require_once NAVI_PLUGIN_DIR . 'includes/core/helpers.php';
require_once NAVI_PLUGIN_DIR . 'includes/core/i18n.php';
require_once NAVI_PLUGIN_DIR . 'includes/core/onboarding.php';
require_once NAVI_PLUGIN_DIR . 'includes/core/admin-menu.php';
require_once NAVI_PLUGIN_DIR . 'includes/core/frontend.php';

// Modules : chacun s'enregistre auprès du noyau puis charge son propre code
// s'il est actif. Un futur module suit exactement ce même schéma (voir README).
require_once NAVI_PLUGIN_DIR . 'includes/modules/cookie-consent/module.php';
require_once NAVI_PLUGIN_DIR . 'includes/modules/accessibility/module.php';
require_once NAVI_PLUGIN_DIR . 'includes/modules/sticky-cart/module.php';
require_once NAVI_PLUGIN_DIR . 'includes/modules/stories/module.php';
require_once NAVI_PLUGIN_DIR . 'includes/modules/calendar/module.php';
