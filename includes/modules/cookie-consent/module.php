<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// Version du consentement : l'incrémenter force les visiteurs ayant déjà
// répondu (texte de bannière modifié, nouvelle finalité de tracking, etc.)
// à revalider leur choix.
define( 'NAVI_COOKIE_CONSENT_VERSION', '1' );

// Texte de bannière par défaut, partagé entre l'écran de réglages et l'affichage public
function navi_cookie_texte_par_defaut() {
    return __( "Nous utilisons des cookies pour assurer le bon fonctionnement du site, analyser notre trafic et personnaliser nos publicités. Vous pouvez choisir vos préférences ci-dessous.", 'saito-navi' );
}

// Pas de logo imposé par le plugin : à défaut d'une URL explicite dans
// Réglages > Cookies, on récupère directement le logo déjà configuré par le
// site (Apparence > Personnaliser > Identité du site), pour un rendu correct
// dès l'installation sur un nouveau site sans étape de configuration en plus.
// Si le site n'a lui-même aucun logo, on renvoie une chaîne vide :
// public-display.php masque alors proprement le bloc <img> (voir
// includes/modules/cookie-consent/public-display.php).
function navi_cookie_logo_url_par_defaut() {
    $custom_logo_id = get_theme_mod( 'custom_logo' );
    if ( $custom_logo_id ) {
        $src = wp_get_attachment_image_url( $custom_logo_id, 'medium' );
        if ( $src ) {
            return $src;
        }
    }
    return '';
}

// Valeur effectivement utilisée pour le logo de la bannière : l'URL
// explicitement renseignée dans Réglages > Cookies si elle existe, sinon le
// logo du site détecté automatiquement ci-dessus. Séparée de
// navi_cookie_logo_url_par_defaut() pour que ce dernier reste un simple
// calcul (pas de lecture de l'option), réutilisable tel quel comme texte
// indicatif dans le champ des réglages (voir admin-settings.php).
function navi_cookie_logo_url() {
    $configured = get_option( 'navi_cookie_logo_url', '' );
    return ! empty( $configured ) ? $configured : navi_cookie_logo_url_par_defaut();
}

// Libellés traduits du module, lus à la demande par le registre (voir
// 'texts', Navi_Module_Registry::register()).
function navi_cookie_module_texts() {
    return array(
        'label'       => __( 'Consentement cookies', 'saito-navi' ),
        'short_label' => __( 'Cookies', 'saito-navi' ),
        'description' => __( 'Bannière RGPD et Google Consent Mode V2, connectée au DataLayer GTM.', 'saito-navi' ),
    );
}

Navi_Module_Registry::register(
    'cookie-consent',
    array(
        'texts'           => 'navi_cookie_module_texts',
        'icon'            => '🍪',
        'icon_svg'        => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="8.5" cy="10.5" r="1" fill="currentColor" stroke="none"></circle><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"></circle><circle cx="15.5" cy="15" r="1" fill="currentColor" stroke="none"></circle><circle cx="9" cy="15.5" r="1" fill="currentColor" stroke="none"></circle></svg>',
        'option_name'     => 'navi_module_active_cookie-consent',
        'default_active'  => true,
        'fab_action'      => 'open-cookie-modal',
        'fab_condition'   => '',
        'available'       => true,
        'settings_url'    => admin_url( 'admin.php?page=navi-main#cookie-consent' ),
        'settings_panel_callback' => 'navi_cookie_render_settings_panel',
        'visibility_selector' => '#navi-cookie-banner, .navi-fab-item[data-item-id="cookie-consent"]',
    )
);

// Chargé même si le module est désactivé : sinon son onglet de réglages
// (Navi > Navi > Cookies) disparaîtrait avec lui, sans aucun moyen de le
// réactiver depuis le BO (voir navi_cookie_render_settings_panel()).
if ( is_admin() ) {
    require_once __DIR__ . '/admin-settings.php';
}

if ( Navi_Module_Registry::is_active( 'cookie-consent' ) ) {
    require_once __DIR__ . '/public-display.php';

    add_action( 'wp_enqueue_scripts', 'navi_cookie_enqueue_assets' );
    function navi_cookie_enqueue_assets() {
        // Le bouton du hub et la modale de préférences restent disponibles
        // après consentement : CSS et JS sont donc toujours nécessaires.
        // Noms de fichiers et handles volontairement neutres (sans "cookie" ni
        // "consent") : les bloqueurs de bannières cookies bloquent les
        // ressources d'après leur URL. Bloqué, l'ancien cookie-consent.js
        // laissait une bannière affichée aux boutons inertes.
        navi_enqueue_style( 'navi-prefs-css', NAVI_PLUGIN_URL . 'assets/css/navi-prefs.css', array(), NAVI_VERSION );
        navi_enqueue_script( 'navi-prefs-js', NAVI_PLUGIN_URL . 'assets/js/navi-prefs.js', array(), NAVI_VERSION, true );
        wp_localize_script(
            'navi-prefs-js',
            'naviCookieConfig',
            array(
                'consentVersion' => NAVI_COOKIE_CONSENT_VERSION,
                'savedText'      => __( 'Préférences enregistrées', 'saito-navi' ),
            )
        );
    }
}
