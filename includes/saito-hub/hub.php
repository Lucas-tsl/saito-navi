<?php
/**
 * Saito Hub — menu « Saito » commun aux plugins Saito.
 *
 * - Saito > Tableau de bord : les plugins Saito, installés ou non.
 * - Un sous-menu par plugin, ajouté par le plugin lui-même sous
 *   saito_hub_menu_slug() (sur admin_menu, priorité par défaut).
 * - Saito > Documentation : dépôts GitHub, documentations, pages WordPress.org.
 *
 * Un plugin se déclare via le filtre saito_hub_plugins :
 *
 *   add_filter( 'saito_hub_plugins', function ( $plugins ) {
 *       $plugins['navi'] = array(
 *           'version'      => '0.8.0',
 *           'settings_url' => admin_url( 'admin.php?page=navi-main' ),
 *           'menu_slugs'   => array( 'navi-main' ), // Ses sous-menus, pour l'ordre du menu.
 *       );
 *       return $plugins;
 *   } );
 *
 * Nom, description et liens viennent du catalogue saito_hub_catalog() : un
 * plugin absent du site y figure quand même (tableau de bord, documentation).
 *
 * @package SaitoHub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SAITO_HUB_MENU', 'saito' );
define( 'SAITO_HUB_DOCS_PAGE', 'saito-docs' );
// Anciens réglages de la page Outils (CSS et JavaScript additionnels), retirée
// en 1.4.0 : les règles des plugins de WordPress.org n'autorisent plus
// l'enregistrement de code libre. Lus une dernière fois pour la reprise
// (voir saito_hub_migrate_custom_code()).
define( 'SAITO_HUB_CSS_OPTION', 'saito_hub_custom_css' );
define( 'SAITO_HUB_JS_OPTION', 'saito_hub_custom_js' );

/**
 * Slug du menu parent « Saito », pour add_submenu_page() et show_in_menu.
 *
 * @return string
 */
function saito_hub_menu_slug() {
	return SAITO_HUB_MENU;
}

/**
 * URL d'un fichier du hub.
 *
 * @param string $path Chemin relatif au dossier du hub.
 * @return string
 */
function saito_hub_url( $path ) {
	return plugins_url( $path, SAITO_HUB_DIR . 'hub.php' );
}

/**
 * Tous les plugins Saito connus, dans l'ordre d'affichage.
 *
 * @return array<string,array>
 */
function saito_hub_catalog() {
	$catalog = array(
		'navi'           => array(
			'name'        => 'Saito Navi',
			'description' => __( 'Bouton flottant : consentement cookies (Google Consent Mode V2), panier flottant, accessibilité et stories produit.', 'saito-navi' ),
			'github'      => 'https://github.com/Lucas-tsl/saito-navi',
			'docs'        => 'https://lucas-tsl.github.io/saito-navi/',
			'notion'      => 'https://www.notion.so/3ff1a86510698123ae10fa7ebb485a6f',
			'wporg'       => 'https://wordpress.org/plugins/saito-navi/',
		),
		'faq'            => array(
			'name'        => 'Saito FAQ',
			'description' => __( 'Questions/réponses sur les articles, pages, produits et catégories de produits, avec schéma FAQPage.', 'saito-navi' ),
			'github'      => 'https://github.com/Lucas-tsl/saito-faq',
			'docs'        => 'https://lucas-tsl.github.io/saito-faq/',
			'notion'      => 'https://rectangular-tiara-ce3.notion.site/Navi-FAQ-Documentation-3c61e90fa69a81df9caad08c42242bf7',
			'wporg'       => 'https://wordpress.org/plugins/saito-faq/',
		),
		'calendar-event' => array(
			'name'        => 'Saito Calendar Event',
			'description' => __( 'Calendrier de l\'Avent (ou tout calendrier à cases) relié aux produits et codes promo WooCommerce.', 'saito-navi' ),
			'github'      => 'https://github.com/Lucas-tsl/saito-calendar-event',
			'docs'        => '',
			'notion'      => 'https://www.notion.so/3ff1a8651069815eadd6ec0d4d518d1d',
			'wporg'       => 'https://wordpress.org/plugins/saito-calendar-event/',
		),
		'store-locator'  => array(
			'name'        => 'Saito Store Locator',
			'description' => __( 'Carte des points de vente avec recherche, fiches magasin indexables, import CSV et synchronisation Google Sheets.', 'saito-navi' ),
			'github'      => 'https://github.com/Lucas-tsl/saito-store-locator',
			'docs'        => '',
			'notion'      => 'https://www.notion.so/3ff1a86510698181bb3ec3c787c94fb2',
			'wporg'       => '',
		),
		'swatches'       => array(
			'name'        => 'Saito Swatches',
			'description' => __( 'Swatches image, couleur ou icône pour les variations WooCommerce, prix à l\'unité et badge de rupture de stock.', 'saito-navi' ),
			'github'      => 'https://github.com/Lucas-tsl/saito-swatches',
			'docs'        => '',
			'notion'      => '',
			'wporg'       => '',
		),
		'mini-cart'      => array(
			'name'        => 'Saito Mini Cart',
			'description' => __( 'Mini-panier WooCommerce : barre de livraison gratuite, produits recommandés et boutons personnalisés.', 'saito-navi' ),
			'github'      => 'https://github.com/Lucas-tsl/saito-mini-cart',
			'docs'        => '',
			'notion'      => '',
			'wporg'       => '',
		),
	);

	$active = apply_filters( 'saito_hub_plugins', array() );
	foreach ( (array) $active as $id => $info ) {
		$base           = isset( $catalog[ $id ] ) ? $catalog[ $id ] : array( 'name' => $id, 'description' => '', 'github' => '', 'docs' => '', 'notion' => '', 'wporg' => '' );
		$catalog[ $id ] = array_merge( $base, (array) $info, array( 'active' => true ) );
	}
	return $catalog;
}

/* -------------------------------------------------------------------------
 * Menu
 * ---------------------------------------------------------------------- */

add_action( 'admin_menu', 'saito_hub_register_menu', 9 );
/**
 * Menu « Saito » et son tableau de bord, avant les sous-menus des plugins.
 */
function saito_hub_register_menu() {
	add_menu_page( 'Saito', 'Saito', 'manage_options', SAITO_HUB_MENU, 'saito_hub_render_dashboard', saito_hub_url( 'assets/menu-icon.png' ), 58 );
	add_submenu_page( SAITO_HUB_MENU, __( 'Tableau de bord', 'saito-navi' ), __( 'Tableau de bord', 'saito-navi' ), 'manage_options', SAITO_HUB_MENU, 'saito_hub_render_dashboard' );
}

add_action( 'admin_menu', 'saito_hub_register_menu_tail', 99 );
/**
 * Documentation, après les sous-menus des plugins.
 */
function saito_hub_register_menu_tail() {
	add_submenu_page( SAITO_HUB_MENU, __( 'Documentation', 'saito-navi' ), __( 'Documentation', 'saito-navi' ), 'manage_options', SAITO_HUB_DOCS_PAGE, 'saito_hub_render_docs' );
}

add_action( 'admin_menu', 'saito_hub_sort_submenu', 100 );
/**
 * Ordre du menu Saito : tableau de bord, plugins dans l'ordre du catalogue,
 * puis Documentation. Sans cela, les types de contenu (ex.
 * Calendriers) passent avant les pages, ajoutées plus tard par WordPress.
 */
function saito_hub_sort_submenu() {
	global $submenu;
	if ( empty( $submenu[ SAITO_HUB_MENU ] ) ) {
		return;
	}
	$weights = array( SAITO_HUB_MENU => 0 );
	$weight  = 1;
	foreach ( saito_hub_catalog() as $plugin ) {
		foreach ( isset( $plugin['menu_slugs'] ) ? (array) $plugin['menu_slugs'] : array() as $slug ) {
			$weights[ $slug ] = $weight++;
		}
	}
	$weights[ SAITO_HUB_DOCS_PAGE ] = 1001;

	$items = $submenu[ SAITO_HUB_MENU ];
	$keys  = array_keys( $items );
	usort(
		$keys,
		function ( $a, $b ) use ( $items, $weights ) {
			$wa = isset( $weights[ $items[ $a ][2] ] ) ? $weights[ $items[ $a ][2] ] : 999;
			$wb = isset( $weights[ $items[ $b ][2] ] ) ? $weights[ $items[ $b ][2] ] : 999;
			return $wa === $wb ? $a - $b : $wa - $wb;
		}
	);
	$sorted = array();
	foreach ( $keys as $key ) {
		$sorted[] = $items[ $key ];
	}
	$submenu[ SAITO_HUB_MENU ] = $sorted; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- réordonne seulement le sous-menu Saito.
}

add_action( 'admin_enqueue_scripts', 'saito_hub_admin_assets' );
/**
 * Styles du hub (icône du menu partout, pages du hub uniquement pour le reste).
 *
 * @param string $hook Écran courant.
 */
function saito_hub_admin_assets( $hook ) {
	wp_add_inline_style( 'common', '#toplevel_page_saito .wp-menu-image img { padding: 6px 0 0; width: 20px; height: 20px; }' );

	$pages = array( 'toplevel_page_' . SAITO_HUB_MENU, 'saito_page_' . SAITO_HUB_DOCS_PAGE );
	if ( ! in_array( $hook, $pages, true ) ) {
		return;
	}
	wp_enqueue_style( 'saito-hub', saito_hub_url( 'assets/hub.css' ), array(), SAITO_HUB_VERSION );
}

/**
 * En-tête commun des pages du hub.
 *
 * @param string $title Titre de la page.
 */
function saito_hub_page_header( $title ) {
	?>
	<div class="saito-hub-header">
		<img src="<?php echo esc_url( saito_hub_url( 'assets/logo.png' ) ); ?>" alt="" width="40" height="40">
		<h1><?php echo esc_html( $title ); ?></h1>
	</div>
	<?php
}

/* -------------------------------------------------------------------------
 * Tableau de bord
 * ---------------------------------------------------------------------- */

/**
 * Saito > Tableau de bord.
 */
function saito_hub_render_dashboard() {
	?>
	<div class="wrap saito-hub">
		<?php saito_hub_page_header( 'Saito' ); ?>
		<p class="saito-hub-intro"><?php esc_html_e( 'Les plugins Saito installés sur ce site, et ceux qui peuvent l\'être.', 'saito-navi' ); ?></p>
		<div class="saito-hub-cards">
			<?php foreach ( saito_hub_catalog() as $plugin ) : ?>
				<?php $active = ! empty( $plugin['active'] ); ?>
				<div class="saito-hub-card<?php echo $active ? ' is-active' : ''; ?>">
					<h2><?php echo esc_html( $plugin['name'] ); ?></h2>
					<p class="saito-hub-status">
						<?php
						if ( $active ) {
							/* translators: %s: numéro de version. */
							echo esc_html( sprintf( __( 'Actif — version %s', 'saito-navi' ), isset( $plugin['version'] ) ? $plugin['version'] : '?' ) );
						} else {
							esc_html_e( 'Non installé ou inactif', 'saito-navi' );
						}
						?>
					</p>
					<p><?php echo esc_html( $plugin['description'] ); ?></p>
					<p class="saito-hub-actions">
						<?php if ( $active && ! empty( $plugin['settings_url'] ) ) : ?>
							<a class="button button-primary" href="<?php echo esc_url( $plugin['settings_url'] ); ?>"><?php esc_html_e( 'Réglages', 'saito-navi' ); ?></a>
						<?php elseif ( ! $active && ! empty( $plugin['wporg'] ) ) : ?>
							<a class="button" href="<?php echo esc_url( $plugin['wporg'] ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Voir sur WordPress.org', 'saito-navi' ); ?></a>
						<?php endif; ?>
					</p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
	<?php
}

/* -------------------------------------------------------------------------
 * Reprise des anciens CSS et JavaScript additionnels (page Outils retirée)
 * ---------------------------------------------------------------------- */

add_action( 'admin_init', 'saito_hub_migrate_custom_code' );
/**
 * Une seule fois : le CSS additionnel de l'ancienne page Saito > Outils passe
 * dans le CSS additionnel de WordPress (Personnaliser > CSS additionnel, ou
 * Éditeur > Styles), qui l'affiche sur le site à sa place. Le JavaScript ne peut
 * pas être repris automatiquement : il reste enregistré, sans plus être affiché
 * sur le site, le temps que l'administrateur le recopie ailleurs (voir
 * saito_hub_custom_js_notice()).
 */
function saito_hub_migrate_custom_code() {
	if ( ! current_user_can( 'edit_css' ) ) {
		return;
	}
	$css = trim( (string) get_option( SAITO_HUB_CSS_OPTION, '' ) );
	if ( '' === $css ) {
		return;
	}
	$existing = (string) wp_get_custom_css();
	$result   = wp_update_custom_css_post( trim( $existing . "\n\n/* Repris de Saito > Outils */\n" . $css ) );
	if ( ! is_wp_error( $result ) ) {
		delete_option( SAITO_HUB_CSS_OPTION );
		set_transient( 'saito_hub_css_migrated', 1, DAY_IN_SECONDS );
	}
}

add_action( 'admin_notices', 'saito_hub_custom_code_notices' );
/**
 * Avis aux administrateurs : CSS repris dans WordPress, JavaScript à recopier.
 */
function saito_hub_custom_code_notices() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( get_transient( 'saito_hub_css_migrated' ) ) {
		delete_transient( 'saito_hub_css_migrated' );
		printf(
			'<div class="notice notice-success is-dismissible"><p>%s</p></div>',
			esc_html__( 'Saito : le CSS additionnel de l\'ancienne page Saito > Outils a été déplacé dans le CSS additionnel de WordPress (Apparence > Personnaliser > CSS additionnel, ou Éditeur > Styles).', 'saito-navi' )
		);
	}
	$js = trim( (string) get_option( SAITO_HUB_JS_OPTION, '' ) );
	if ( '' === $js ) {
		return;
	}
	$dismiss = wp_nonce_url( admin_url( 'admin-post.php?action=saito_hub_forget_js' ), 'saito_hub_forget_js' );
	?>
	<div class="notice notice-warning">
		<p><strong><?php esc_html_e( 'Saito : le JavaScript additionnel n\'est plus ajouté à votre site.', 'saito-navi' ); ?></strong> <?php esc_html_e( 'La page Saito > Outils a été retirée : les règles de WordPress.org n\'autorisent plus les plugins à enregistrer du code libre. Recopiez ce code là où vous gérez vos scripts (thème enfant, Google Tag Manager, extension dédiée), puis supprimez-le d\'ici.', 'saito-navi' ); ?></p>
		<p><textarea class="large-text code" rows="6" readonly aria-label="<?php esc_attr_e( 'Ancien JavaScript additionnel', 'saito-navi' ); ?>"><?php echo esc_textarea( $js ); ?></textarea></p>
		<p><a class="button" href="<?php echo esc_url( $dismiss ); ?>"><?php esc_html_e( 'Je l\'ai recopié : le supprimer', 'saito-navi' ); ?></a></p>
	</div>
	<?php
}

add_action( 'admin_post_saito_hub_forget_js', 'saito_hub_forget_js' );
/**
 * Supprime l'ancien JavaScript additionnel, une fois recopié ailleurs.
 */
function saito_hub_forget_js() {
	check_admin_referer( 'saito_hub_forget_js' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Action non autorisée.', 'saito-navi' ) );
	}
	delete_option( SAITO_HUB_JS_OPTION );
	wp_safe_redirect( wp_get_referer() ? wp_get_referer() : admin_url() );
	exit;
}

/* -------------------------------------------------------------------------
 * Documentation
 * ---------------------------------------------------------------------- */

/**
 * Lien externe de la page Documentation, ou tiret s'il n'existe pas encore.
 *
 * @param string $url   Adresse.
 * @param string $label Texte du lien.
 */
function saito_hub_doc_link( $url, $label ) {
	if ( '' === $url ) {
		echo '<span class="saito-hub-muted">—</span>';
		return;
	}
	printf( '<a href="%1$s" target="_blank" rel="noopener noreferrer">%2$s</a>', esc_url( $url ), esc_html( $label ) );
}

/**
 * Saito > Documentation.
 */
function saito_hub_render_docs() {
	?>
	<div class="wrap saito-hub">
		<?php saito_hub_page_header( __( 'Documentation', 'saito-navi' ) ); ?>
		<table class="widefat striped saito-hub-docs">
			<thead>
				<tr>
					<th><?php esc_html_e( 'Plugin', 'saito-navi' ); ?></th>
					<th><?php esc_html_e( 'Code source', 'saito-navi' ); ?></th>
					<th><?php esc_html_e( 'Documentation', 'saito-navi' ); ?></th>
					<th><?php esc_html_e( 'Notion', 'saito-navi' ); ?></th>
					<th><?php esc_html_e( 'WordPress.org', 'saito-navi' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( saito_hub_catalog() as $plugin ) : ?>
					<tr>
						<td><strong><?php echo esc_html( $plugin['name'] ); ?></strong><br><span class="saito-hub-muted"><?php echo esc_html( ! empty( $plugin['active'] ) ? __( 'Actif sur ce site', 'saito-navi' ) : __( 'Non installé', 'saito-navi' ) ); ?></span></td>
						<td><?php saito_hub_doc_link( $plugin['github'], 'GitHub' ); ?></td>
						<td><?php saito_hub_doc_link( $plugin['docs'], __( 'Site de documentation', 'saito-navi' ) ); ?></td>
						<td><?php saito_hub_doc_link( $plugin['notion'], 'Notion' ); ?></td>
						<td><?php saito_hub_doc_link( $plugin['wporg'], __( 'Page du plugin', 'saito-navi' ) ); ?></td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php
}
