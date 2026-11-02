<?php
/**
 * Saito Hub — chargeur.
 *
 * Chaque plugin Saito embarque une copie de ce dossier (includes/saito-hub/)
 * et fait require_once de ce fichier au chargement. Chaque copie déclare sa
 * version ; sur plugins_loaded, seule la plus récente est chargée. Le menu
 * « Saito » existe ainsi dès qu'un plugin Saito est actif, sans plugin
 * supplémentaire à installer.
 *
 * Ne pas modifier dans un plugin : la source est le dépôt saito-hub
 * (bin/sync.sh recopie ce dossier dans chaque plugin).
 *
 * @package SaitoHub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'saito_hub_register_version' ) ) {
	/**
	 * Déclare une copie du hub disponible.
	 *
	 * @param string $version Version de la copie.
	 * @param string $dir     Dossier de la copie.
	 */
	function saito_hub_register_version( $version, $dir ) {
		global $saito_hub_versions;
		if ( ! is_array( $saito_hub_versions ) ) {
			$saito_hub_versions = array();
		}
		if ( ! isset( $saito_hub_versions[ $version ] ) ) {
			$saito_hub_versions[ $version ] = $dir;
		}
	}

	/**
	 * Charge la copie la plus récente.
	 */
	function saito_hub_boot() {
		global $saito_hub_versions;
		if ( defined( 'SAITO_HUB_VERSION' ) || empty( $saito_hub_versions ) ) {
			return;
		}
		uksort( $saito_hub_versions, 'version_compare' );
		$version = array_key_last( $saito_hub_versions );
		define( 'SAITO_HUB_VERSION', $version );
		define( 'SAITO_HUB_DIR', trailingslashit( $saito_hub_versions[ $version ] ) );
		require_once SAITO_HUB_DIR . 'hub.php';
	}
	add_action( 'plugins_loaded', 'saito_hub_boot', 1 );
}

saito_hub_register_version( '1.4.0', __DIR__ );

// Plugin activé pendant la requête (écran Extensions, WP-CLI) : son fichier
// est chargé après plugins_loaded, le hub doit démarrer tout de suite.
if ( did_action( 'plugins_loaded' ) ) {
	saito_hub_boot();
}
