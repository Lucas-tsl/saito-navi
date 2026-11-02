# Changelog

## 0.9.3

- Menu Saito commun : la page Outils (CSS et JavaScript additionnels) est retirée, WordPress.org n'autorisant plus les plugins à enregistrer du code libre. Le CSS déjà saisi passe dans le CSS additionnel de WordPress ; le JavaScript est affiché une dernière fois dans un avis de l'admin pour être recopié ailleurs.
- Panier flottant : le sélecteur de variation affiche le nom de chaque
  valeur (« 100 ml ») au lieu de son identifiant (« 100-ml »).

## 0.9.2

- L'engrenage n'apparaît plus que dans le pied de page : sur les pages sans
  icône panier ni calendrier, le bouton flottant reste masqué jusqu'au pied
  de page (il réapparaît au focus clavier, lien « Aller aux réglages »).
- Module Calendrier : par défaut, le calendrier le plus récent en cours
  d'affichage (dans sa période de publication) — un calendrier préparé à
  l'avance ne masque plus celui qui est en ligne.

## 0.9.1

- Hors pied de page, le bouton flottant n'affiche que l'icône de la page
  et l'ouvre directement : panier + sur les fiches produit, calendrier sur
  les autres pages. L'engrenage et son menu (haut de page, cookies,
  accessibilité) ne reviennent que dans le pied de page, et ce menu ne
  propose plus le panier ni le calendrier.
- Le calendrier n'est jamais proposé sur les fiches produit.
- La croix du calendrier et du panier flottant referme entièrement le
  bouton au lieu de revenir au menu.
- Ouvert d'un clic, le panier flottant reste ouvert même si le bouton
  « Ajouter au panier » de la page est visible (jusqu'à la croix ou au
  pied de page).
- Un clic sur l'icône panier juste après le chargement de la page n'est
  plus perdu.

## 0.9.0

- Icône du bouton flottant selon la page : panier avec un « + » sur les
  fiches produit (panier flottant actif), calendrier quand le module
  Calendrier a un calendrier à proposer, engrenage dès que le pied de page
  est visible (et partout ailleurs).
- Nouveau module Calendrier : ouvre un calendrier Saito Calendar Event dans
  le bouton flottant (Saito > Navi > Calendrier : choix du calendrier, le
  plus récent par défaut). Masqué sur les pages qui l'affichent déjà et en
  dehors de sa période de publication. Échap referme la case ouverte sans
  refermer le panneau.
- Le bouton flottant passe sous le tiroir du mini-panier WooCommerce quand
  il s'ouvre.
- Menu Saito (hub 1.1.0) : les cartes du tableau de bord ne répètent plus
  le lien « Documentation », déjà en fin de sous-menu.

## 0.8.0

- Nouveau menu « Saito » commun à tous les plugins Saito : Navi passe en
  sous-menu (Saito > Navi, même adresse admin.php?page=navi-main), à côté
  d'un tableau de bord des plugins Saito, d'une page Outils (CSS et
  JavaScript additionnels du site) et d'une page Documentation.
- Panier flottant : les textes « Ajouter au panier » et « Rupture de
  stock » sont personnalisables (Navi > Panier). Vide = texte par défaut.

## 0.7.3

- Panier flottant : le sélecteur de teinte/vignette de variation accepte
  désormais un sélecteur CSS personnalisé (Navi > Panier) pour les thèmes
  ou plugins de swatches autres que WCBoost Variation Swatches — modèle
  avec `{value}` (ex. `#{value}`), une image trouvée dans l'élément ciblé
  étant utilisée en priorité, sinon sa couleur de fond.
- Les libellés des modules sont traduits à leur première lecture et non
  plus au chargement du plugin : plus de notice
  `_load_textdomain_just_in_time`, qui pouvait casser la connexion à
  wp-admin avec `WP_DEBUG_DISPLAY` (#47).
- Stories reconnaît le panneau produit partagé de Saito FAQ 0.2.0.

## 0.7.2

- Stories s'intègre au panneau "Navi" partagé du plugin compagnon Navi FAQ
  quand celui-ci est actif : les deux fonctionnalités deviennent des
  onglets internes d'un seul panneau (sous l'éditeur de description) au
  lieu d'avoir chacune sa propre entrée dans "Données produit". Sans Navi
  FAQ, Stories garde son onglet WooCommerce autonome comme avant — aucune
  dépendance dure ajoutée entre les deux plugins.

## 0.7.1

- Retour de revue WordPress.org : tous les `<script>`/`<style>` imprimés
  en dur en PHP sont remplacés par `wp_register_script()`/
  `wp_enqueue_script()`/`wp_localize_script()` et `wp_enqueue_style()`/
  `wp_add_inline_style()` (champ referer hash-preserving, injection du
  Consent Mode, onglets du dashboard admin, aperçu live des réglages
  Stories, onglet Stories de la fiche produit). Aucun changement de
  comportement.
- Documenté dans le readme l'appel `wp_remote_head()` vers
  `img.youtube.com` (vérification de disponibilité de la vignette HD
  YouTube).

## 0.7.0

- Story MP4 : la vidéo de prévisualisation se choisit désormais directement
  dans la médiathèque WordPress (`wp.media`, restreinte aux fichiers
  `video/mp4`) plutôt que via un champ fichier brut — plus besoin de gérer
  son propre dossier d'upload, la validation et le nettoyage à la
  désinstallation ; l'ancien pipeline (`navi_validate_mp4_upload()` et son
  dossier dédié) est retiré.
- Corrigé : vignette YouTube de secours qui pouvait rester cassée pour les
  Shorts (format vertical, sans `maxresdefault.jpg`) — repli automatique
  sur `hqdefault.jpg` si le format haute résolution n'existe pas.
- Suite PHPUnit étendue : fonctions de validation Stories (extraction
  d'ID YouTube, réglages d'apparence), repli de langue de l'Accessibilité
  (WPML/GTranslate), `Navi_Module_Registry` — 37 tests au total.

## 0.6.0

- Bloc Gutenberg "Navi Stories" (`navi/stories`), équivalent visuel du
  shortcode `[navi_stories]` (réglage "Product ID" dans l'inspecteur,
  aperçu en direct via ServerSideRender) — bloc dynamique, rendu toujours
  délégué à `navi_stories_shortcode()`, jamais dupliqué.
- Onboarding : redirection unique vers Navi > Navi après l'activation
  (jamais lors d'une activation groupée), carte "Premiers pas" sur
  l'onglet Général tant qu'elle n'est pas masquée.
- Compatibilité WooCommerce Blocks vérifiée empiriquement (thème FSE,
  Single Product en blocs) : le formulaire de variations classique
  persiste sous les blocs, la détection existante fonctionne sans
  changement. Seul le bloc expérimental "Add to Cart + Options (Beta)"
  de WooCommerce (entièrement piloté en JS, sans formulaire classique)
  n'est pas pris en charge — documenté dans le FAQ (readme.txt).

## 0.5.0

- Préparation à la soumission WordPress.org : `readme.txt` en anglais,
  en-tête `Saito Navi`, icônes/bannière/captures d'écran
  (`.wordpress-org/assets/`), conformité **Plugin Check** (scripts de dev
  exclus du zip, upload MP4 via `wp_handle_upload()`, en-têtes de
  compatibilité).
- Module Stories : shortcode `[navi_stories]` pour un affichage manuel en
  plus du hook automatique, réglage "Afficher automatiquement".
- Aspect des bulles Stories (Navi > Stories > Bulles, nouvel onglet) :
  taille réglable, bordure unie ou en dégradé (dégradé par défaut),
  aperçu en direct.
- Corrigé : flash de fond blanc à l'ouverture du panneau Stories ;
  libellés qui se chevauchaient dans l'onglet Stories (conflit avec le
  CSS WooCommerce) ; bandes noires en haut/bas de la vidéo (conflit
  `max-width` avec certains thèmes, dont Storefront) ; icône de menu
  admin décalée par un padding WordPress par défaut ; centrage de
  l'engrenage renforcé pour Safari/iOS ; mélange français/anglais dans le
  BO sur les sites en anglais (dictionnaire de traduction incomplet).
- BO redessiné (cartes, cases à cocher modernes, onglets en pastilles)
  plutôt que l'apparence WordPress par défaut.
- Langue du plugin réglable manuellement (Navi > Navi), indépendamment de
  la détection automatique (WPML ou langue du site).
- Réglages regroupés sur une seule page à onglets (Navi > Navi : Général,
  Cookies, Accessibilité, Panier, Stories), chaque onglet portant sa
  propre activation — remplace les anciennes sous-pages séparées.
- Sécurité : faille XSS corrigée dans le panneau plein écran Stories
  (libellé de story injecté sans échappement).
- Corrigé : bordure bleue résiduelle sur le sélecteur de couleur, logo
  Navi désormais à fond transparent, interrupteurs remplacés par des
  cases à cocher (rendu incohérent sur certaines configurations
  GPU/pilote Windows).
- Onglet Cookies : instructions concrètes pour configurer Google Tag
  Manager (Consent Mode, événement dataLayer poussé par le plugin) à la
  place d'une simple description.
- Corrigé : `Text Domain` (navi.php) et domaine de toutes les chaînes
  traduisibles alignés sur le slug WordPress.org réel (`saito-navi`,
  pas `navi`) — remonté par Plugin Check en `textdomain_mismatch`.
  Dossier de déploiement local, job de build CI et instructions SVN mis
  à jour en conséquence.

## 0.4.0

Module **Stories** natif : jusqu'à 4 bulles vidéo par produit (YouTube ou
MP4 importé), onglet dédié sur la fiche produit, panneau desktop avec
mockup de téléphone en CSS pur, plein écran mobile — mêmes
fonctionnalités que Navi PrestaShop, sans dépendance à `lst-video-story`.
Stockage en postmeta, upload validé et hors du dossier du plugin.

## 0.3.0

Parité d'apparence avec Navi PrestaShop : arrondis réglables (boutons,
image produit), visibilité par appareil par module (Navi > Cookies /
Accessibilité / Panier), logo Navi comme icône de menu admin, API JS
alignée (`window.navi`, `naviConfig`).

## 0.2.0

Module **Panier automatique** (sticky add-to-cart) : produits simples et
à variations, sélecteur de teinte accessible au clavier, compatible
WCBoost Variation Swatches, sélecteurs CSS personnalisables (Navi >
Panier) pour les thèmes non reconnus par la détection intégrée.

## 0.1.0

Version initiale : noyau (bouton flottant à 3 états), modules
Consentement cookies et Accessibilité, CI GitHub Actions.
