(function($) {
     'use strict';

     const stickyI18n = window.naviStickyCartI18n || {
         addToCartText: 'Ajouter au panier - ',
         addingText: 'Ajout en cours...',
         addedText: 'Ajouté',
         outOfStockText: 'Rupture de stock',
         chooseVariationText: 'Choisir une option'
     };

     // Sélecteurs CSS personnalisés (Navi > Panier, includes/modules/sticky-cart/admin-settings.php) :
     // essayés en PREMIER, avant la chaîne de secours intégrée ci-dessous —
     // pour un thème dont le balisage n'est reconnu par aucun des sélecteurs
     // génériques déjà prévus. Chaîne vide = pas de surcharge.
     const stickyConfig = window.naviStickyCartConfig || { priceSelector: '', nameSelector: '', imageSelector: '', swatchSelector: '' };

     function withCustomSelector(customSelector, fallbackSelectors) {
         return customSelector ? [customSelector].concat(fallbackSelectors) : fallbackSelectors;
     }

     // Dernière variation confirmée par 'found_variation' (avec son
     // price_html fiable). Des évènements comme 'woocommerce_variation_has_changed'
     // ou 'updated_wc_div' redéclenchent aussi une mise à jour du prix mais
     // sans transmettre l'objet variation : sans ce cache, updateStickyPrice()
     // retombait alors sur la lecture du DOM (asynchrone, pas toujours à jour)
     // et écrasait le prix correct par l'ancienne valeur quelques centaines
     // de ms plus tard. Réinitialisée sur 'reset_data'.
     let lastFoundVariation = null;

     // Un attribut srcset liste plusieurs tailles séparées par des virgules
     // ("url1 122w, url2 768w, ..."). Prendre la première entrée revient à
     // prendre la plus PETITE par convention usuelle — d'où des images de
     // sticky bar visiblement pixelisées sur un écran rétina. On prend ici
     // la plus grande largeur déclarée, quel que soit son ordre dans la chaîne.
     function pickLargestFromSrcset(srcset) {
         if (!srcset) return '';
         let bestUrl = '';
         let bestWidth = -1;
         srcset.split(',').forEach(entry => {
             const parts = entry.trim().split(/\s+/);
             const url = parts[0];
             const width = parts[1] ? parseInt(parts[1], 10) : 0;
             if (url && width >= bestWidth) {
                 bestWidth = width;
                 bestUrl = url;
             }
         });
         return bestUrl;
     }

     // De nombreux thèmes chargent les images de galerie en lazy-loading :
     // l'attribut "src" contient alors un espace réservé (vide, ou un tout
     // petit data-URI) tant que l'image n'est pas entrée dans le viewport, et
     // la vraie URL est dans un attribut data-*. On essaie plusieurs noms
     // usuels avant de se rabattre sur "src".
     function getImgSrc($img) {
         if (!$img || !$img.length) return '';
         const candidates = [
             $img.attr('data-lazy-src'),
             pickLargestFromSrcset($img.attr('data-srcset')),
             pickLargestFromSrcset($img.attr('srcset')),
             $img.attr('data-src'),
             $img.attr('src')
         ];
         for (let i = 0; i < candidates.length; i++) {
             const value = candidates[i];
             // Ignore les placeholders data-URI (souvent un gif/svg transparent 1x1).
             if (value && value.indexOf('data:image') !== 0) {
                 return value;
             }
         }
         return '';
     }

     // Remplace le jeton littéral "{value}" d'un sélecteur personnalisé
     // (Navi > Panier) par la valeur de l'attribut de la variation, échappée
     // pour rester un sélecteur CSS valide (ex. modèle "#{value}" avec une
     // valeur "15ml" → "#15ml"). CSS.escape() est absent d'IE11 uniquement,
     // hors du périmètre de compatibilité de ce plugin.
     function resolveSwatchSelector(template, value) {
         if (!template) return '';
         const safeValue = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(value)) : String(value).replace(/["\\]/g, '\\$&');
         return template.replace(/\{value\}/g, safeValue);
     }

     // Aperçu (couleur OU image) d'une variation, avec deux sources
     // possibles par ordre de priorité :
     //
     // 1. Plugin WCBoost Variation Swatches si présent (sélecteur natif de
     //    teinte le plus courant dans l'écosystème WooCommerce) : chaque <li>
     //    porte la valeur de l'attribut dans data-value et sa couleur dans la
     //    propriété CSS inline --wcboost-swatches-item-color. Comparaison
     //    insensible à la casse : la valeur transmise par WooCommerce
     //    (variation.attributes) et celle du DOM (data-value) ne sont pas
     //    garanties d'avoir la même casse.
     // 2. Sélecteur personnalisé (Navi > Panier, "Sélecteur de vignette de
     //    variation") pour les thèmes qui affichent leurs propres vignettes
     //    hors WCBoost — un conteneur par valeur (ex. <div id="15ml">...),
     //    ciblé via un modèle contenant "{value}" (ex. "#{value}"). On y
     //    cherche d'abord une <img> (vignette-image, cas le plus courant
     //    d'un thème custom), sinon une couleur de fond CSS.
     //
     // Repli sur un objet vide (pastille neutre, voir
     // .navi-sticky-shade-swatch--empty dans assets/css/sticky-cart.css)
     // plutôt qu'un aperçu trompeur si aucune des deux sources ne matche.
     function getSwatchVisual(attrValue) {
         const target = String(attrValue).toLowerCase();
         const $wcboost = $('.wcboost-variation-swatches__item').filter(function() {
             return ($(this).attr('data-value') || '').toLowerCase() === target;
         }).first();
         if ($wcboost.length) {
             const style = $wcboost.attr('style') || '';
             const match = style.match(/--wcboost-swatches-item-color\s*:\s*(#[0-9a-fA-F]{3,8})/);
             if (match) return { color: match[1], image: '' };
         }

         const customSelector = resolveSwatchSelector(stickyConfig.swatchSelector, attrValue);
         if (customSelector) {
             let $custom;
             try {
                 $custom = $(customSelector).first();
             } catch {
                 $custom = $();
             }
             if ($custom.length) {
                 const image = getImgSrc($custom.find('img').first());
                 if (image) return { color: '', image: image };

                 const bg = $custom.css('background-color');
                 if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
                     return { color: bg, image: '' };
                 }
             }
         }

         return { color: '', image: '' };
     }

     // "#rrggbb" (ou "#rgb") → [r, g, b] : nécessaire pour teinter le fond du
     // déclencheur de teinte (rgba avec transparence) à partir d'une couleur
     // dynamique inconnue à l'avance.
     function hexToRgb(hex) {
         let clean = String(hex || '').replace('#', '');
         if (clean.length === 3) {
             clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
         }
         if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
         return [
             parseInt(clean.slice(0, 2), 16),
             parseInt(clean.slice(2, 4), 16),
             parseInt(clean.slice(4, 6), 16)
         ];
     }

     // Pour un produit simple (sans variations), WooCommerce n'expose pas de
     // stock par variation : on se base sur ce qu'il affiche déjà sur la page.
     function isSimpleProductOutOfStock() {
         if ($('body').hasClass('outofstock')) return true;
         return $('.stock.out-of-stock').not('#navi-sticky-bar *').length > 0;
     }

     // Retire complètement le bouton du DOM visible en rupture de stock (au
     // lieu d'un simple bouton désactivé) : impossible de le cliquer par
     // erreur ou de déclencher l'animation de chargement pour un produit (ou
     // une variation) indisponible. Un texte "Rupture de stock" le remplace.
     function setStickyOutOfStock($stickyBar, outOfStock) {
         const $btn = $stickyBar.find('.navi-sticky-add-to-cart');
         const $label = $stickyBar.find('.navi-sticky-out-of-stock');
         $btn.prop('disabled', outOfStock);
         if (outOfStock) {
             $btn.hide();
             $label.show();
         } else {
             $btn.show();
             $label.hide();
         }
     }

     // Confirmation brève après un ajout au panier réussi : sans elle, le
     // bouton revenait directement à son texte d'origine, sans qu'aucun
     // signal explicite ne confirme l'ajout si le mini-panier n'est pas dans
     // le champ de vision de l'utilisateur.
     function showAddedConfirmation($btn, originalText) {
         $btn.removeClass('loading').addClass('added').prop('disabled', false);
         $btn.html('<span class="added-text">✓ ' + (stickyI18n.addedText || 'Ajouté') + '</span>');
         setTimeout(function() {
             $btn.removeClass('added');
             $btn.html(originalText);
         }, 900);
     }

     // Les textes du panneau sont réglables en BO (Navi > Panier) : échappés
     // avant d'être insérés dans le gabarit HTML ci-dessous.
     function escapeHtml(text) {
         return String(text).replace(/[&<>"']/g, function(c) {
             return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
         });
     }

     // Créer le HTML du sticky bar
     function createStickyBar() {
         const stickyHTML = `
             <div class="navi-sticky-bar" id="navi-sticky-bar" tabindex="-1">
                 <button type="button" class="navi-sticky-panel-close" aria-label="Fermer">✕</button>
                 <div class="navi-sticky-panel-scroll">
                     <div class="navi-sticky-content">
                         <!-- Grille (pas d'imbrication en flex) : seule façon
                              de placer les MÊMES éléments dans la colonne du
                              titre sur desktop/tablette, et en pleine largeur
                              entre l'image et le bouton sur mobile, sans dupliquer
                              le contenu (voir grid-template-areas, assets/css/sticky-cart.css). -->
                         <div class="navi-sticky-product-image">
                             <img src="" alt="" class="navi-sticky-product-img">
                         </div>
                         <div class="navi-sticky-product-info">
                             <div class="navi-sticky-product-name"></div>
                         </div>
                         <div class="navi-sticky-variation-options">
                             <div class="navi-sticky-variation-buttons"></div>
                         </div>
                         <!-- role="status" + aria-live : le prix et le
                              passage bouton <-> rupture de stock changent
                              sans rechargement de page, un lecteur d'écran
                              a besoin d'être informé de ces mises à jour. -->
                         <div class="navi-sticky-availability" role="status" aria-live="polite">
                             <button class="navi-sticky-add-to-cart" disabled>
                                <span class="navi-sticky-button-text">${escapeHtml(stickyI18n.addToCartText)}</span> &nbsp;
                                 <span class="navi-sticky-price"></span>
                             </button>
                             <div class="navi-sticky-out-of-stock" style="display:none;">${escapeHtml(stickyI18n.outOfStockText)}</div>
                         </div>
                     </div>
                 </div>
             </div>
         `;

         // Injecté directement dans le slot partagé #navi-fab-detail (voir
         // includes/core/frontend.php, assets/css/core.css) : ce panneau
         // n'est plus un élément fixed indépendant, mais un contenu du même
         // objet visuel que l'engrenage.
         var $detailSlot = $('#navi-fab-detail');
         if ($detailSlot.length) {
             $detailSlot.append(stickyHTML);
         } else {
             $('body').append(stickyHTML);
         }
     }


     // Fonction pour mettre à jour le prix
     //
     // Sur certains thèmes (blocs Gutenberg), le DOM du prix (.price dans le
     // formulaire) n'est mis à jour qu'APRÈS le déclenchement de
     // "found_variation", de façon asynchrone et à un délai variable. Relire
     // ce DOM au moment de l'évènement donne donc parfois le prix de la
     // variation PRÉCÉDENTE. Quand l'appelant nous transmet l'objet
     // "variation" de l'évènement found_variation, on utilise en priorité
     // variation.price_html : cette valeur est déjà connue de WooCommerce au
     // moment exact de l'évènement, sans dépendre d'un DOM tiers pas encore
     // rafraîchi.
     function updateStickyPrice(variation) {
         const $variationForm = $('form.variations_form');
         const $stickyPrice = $('#navi-sticky-bar').find('.navi-sticky-price');
         const $stickyAddToCart = $('#navi-sticky-bar').find('.navi-sticky-add-to-cart');

         if (!$variationForm.length) return;

         // Récupérer la variation sélectionnée
         const selectedValue = $variationForm.find('.variations select').val();

         // Si aucune variation n'est sélectionnée, ne pas mettre à jour
         if (!selectedValue) {
             return;
         }

         let priceHTML = null;

         // À défaut de variation transmise par l'appelant (ex. déclenché par
         // 'woocommerce_variation_has_changed', qui ne fournit pas cet objet),
         // se rabattre sur la dernière variation confirmée par found_variation
         // plutôt que directement sur le DOM.
         const effectiveVariation = variation || lastFoundVariation;

         if (effectiveVariation && effectiveVariation.price_html) {
             const $fromEvent = $('<div>').html(effectiveVariation.price_html);
             let $insFromEvent = $fromEvent.find('ins').first();
             if ($insFromEvent.length) {
                 priceHTML = $insFromEvent.html();
             } else {
                 $fromEvent.find('del').remove();
                 priceHTML = $fromEvent.html();
             }

             if (priceHTML && priceHTML.trim()) {
                 $stickyPrice.html(priceHTML);
                 $stickyAddToCart.prop('disabled', false);
                 return true;
             }
         }

         // Repli : scruter le DOM (utilisé quand aucune donnée de variation
         // n'est disponible, ex. 'updated_wc_div', reset...). Le sélecteur
         // personnalisé (Navi > Panier), s'il est renseigné, est essayé
         // avant cette chaîne intégrée.
         const priceFallbackSelectors = withCustomSelector(stickyConfig.priceSelector, [
             '.price',           // dans $variationForm en priorité (cherché séparément ci-dessous)
             'p.price',
             '.summary .price',
             '.woocommerce-Price-amount.amount' // dans $variationForm puis global, cherché séparément ci-dessous
         ]);

         let $priceElement = null;
         for (let selector of priceFallbackSelectors) {
             $priceElement = $variationForm.find(selector).first();
             if (!$priceElement.length) {
                 $priceElement = $(selector).first();
             }
             if ($priceElement.length) break;
         }

         if ($priceElement && $priceElement.length) {
             const $clone = $priceElement.clone();
             $clone.find('.screen-reader-text').remove();
             $clone.find('a, button, input').remove();

             // Prioriser le prix promo (balise <ins>), sinon utiliser le prix normal
             let $ins = $clone.find('ins').first();
             if ($ins.length) {
                 priceHTML = $ins.html();
             } else {
                 $clone.find('del').remove();
                 priceHTML = $clone.html();
             }

             if (priceHTML && priceHTML.trim()) {
                 $stickyPrice.html(priceHTML);
                 $stickyAddToCart.prop('disabled', false);
                 return true;
             }
         }

         return false;
     }

     // Synchroniser les variations avec le sticky bar
     function syncVariations() {
         const $variationForm = $('form.variations_form');
         const $stickyBar = $('#navi-sticky-bar');
         const $stickyButtons = $stickyBar.find('.navi-sticky-variation-buttons');
         const $stickyAddToCart = $stickyBar.find('.navi-sticky-add-to-cart');
         const $productName = $stickyBar.find('.navi-sticky-product-name');
         const $productImg = $stickyBar.find('.navi-sticky-product-img');

         if (!$variationForm.length) return;

         // Récupérer les variations
         const variations = $variationForm.data('product_variations');
         const attributeName = $variationForm.find('.variations select').first().data('attribute_name');

         // Nettoyer le contenu existant
         $stickyButtons.empty();

         // Une seule variation par valeur d'attribut, dans l'ordre fourni par
         // WooCommerce : pas de tri alphabétique, qui casserait la
         // numérotation des teintes (ex. "N°10" se classerait avant "N°2" en
         // tri texte). L'ordre WooCommerce reflète déjà l'ordre configuré
         // dans l'admin, donc le sélecteur reste cohérent avec le reste de
         // la page (ex. les vignettes WCBoost Swatches si présentes).
         const variationsByValue = {};
         variations.forEach(variation => {
             const attrValue = variation.attributes[attributeName];
             if (!variationsByValue[attrValue]) {
                 variationsByValue[attrValue] = variation;
             }
         });
         const orderedValues = Object.keys(variationsByValue);

         // Sélecteur de teinte personnalisé (pastille + nom dans un volet
         // qui se déplie, pas un <select> natif) : un <select> ne peut pas
         // afficher la couleur de CHAQUE option (les navigateurs ignorent le
         // style des <option>), alors qu'un menu personnalisé le peut. Le
         // vrai <select> WooCommerce (.variations select, où un éventuel
         // plugin de swatches est déjà branché) reste l'unique source de
         // vérité : ce composant ne fait que le piloter (voir
         // applyVariationSelection plus bas), jamais l'inverse.
         //
         // Fermé par défaut, PAS l'attribut HTML "hidden" : ce volet doit
         // pouvoir s'animer à l'ouverture (max-height/opacity, voir
         // assets/css/sticky-cart.css), ce que "hidden" ne permet pas
         // (bascule instantanée display:none, non transitionnable). L'état
         // ouvert/fermé est donc porté uniquement par la classe
         // .navi-sticky-shade-picker--open (posée par setShadePickerOpen), le
         // volet repliable via max-height:0 + overflow:hidden au repos.
         // aria-expanded sur le déclencheur reste la source de vérité pour
         // les technologies d'assistance, complété par aria-hidden sur le
         // volet lui-même.
         const $shadePicker = $('<div class="navi-sticky-shade-picker"></div>');
         const $shadeTrigger = $(`
             <button type="button" class="navi-sticky-shade-trigger" aria-haspopup="listbox" aria-expanded="false">
                 <span class="navi-sticky-shade-trigger-swatch" aria-hidden="true"></span>
                 <span class="navi-sticky-shade-trigger-label"></span>
                 <svg class="navi-sticky-shade-trigger-arrow" aria-hidden="true" viewBox="0 0 12 8" width="12" height="8"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
             </button>
         `);
         const $shadeListbox = $('<ul class="navi-sticky-shade-listbox" role="listbox" aria-hidden="true"></ul>');

         $shadeTrigger.find('.navi-sticky-shade-trigger-label').text(stickyI18n.chooseVariationText || attributeName);

         // Nom affiché d'une valeur ("100 ml") : celui de l'option du vrai
         // <select> WooCommerce, et non l'identifiant de la variation
         // ("100-ml", slug du terme d'attribut).
         const $attributeSelect = $variationForm.find('.variations select').first();
         function valueLabel(value) {
             const $option = $attributeSelect.find('option').filter(function() {
                 return this.value === value;
             }).first();
             const label = $option.length ? $.trim($option.text()) : '';
             return label || value;
         }

         orderedValues.forEach(attrValue => {
             const visual = getSwatchVisual(attrValue);
             const $option = $('<li class="navi-sticky-shade-option" role="option" tabindex="-1" aria-selected="false"></li>')
                 .attr('data-value', attrValue)
                 // Nom complet en infobulle : la grille à 2 colonnes tronque
                 // les noms les plus longs (ellipsis, voir le CSS).
                 .attr('title', valueLabel(attrValue));
             $('<span class="navi-sticky-shade-option-swatch" aria-hidden="true"></span>')
                 .css({
                     'background-color': visual.color || 'transparent',
                     'background-image': visual.image ? `url(${visual.image})` : 'none'
                 })
                 .toggleClass('navi-sticky-shade-swatch--empty', !visual.color && !visual.image)
                 .appendTo($option);
             $('<span class="navi-sticky-shade-option-label"></span>').text(valueLabel(attrValue)).appendTo($option);
             $shadeListbox.append($option);
         });

         $shadePicker.append($shadeTrigger).append($shadeListbox);
         $stickyButtons.append($shadePicker);

         function setShadePickerOpen(open) {
             $shadeTrigger.attr('aria-expanded', open ? 'true' : 'false');
             $shadeListbox.attr('aria-hidden', open ? 'false' : 'true');
             $shadePicker.toggleClass('navi-sticky-shade-picker--open', open);
         }

         // Met à jour le déclencheur (pastille + nom affichés fermé) et l'état
         // "sélectionné" de la liste — seule mise à jour visuelle nécessaire,
         // que le choix vienne du menu, du clavier, ou d'une confirmation
         // found_variation (sélection faite ailleurs sur la page).
         function updateShadeTrigger(value) {
             const visual = getSwatchVisual(value);
             const rgb = visual.color ? hexToRgb(visual.color) : null;

             $shadeTrigger.find('.navi-sticky-shade-trigger-swatch')
                 .css({
                     'background-color': visual.color || 'transparent',
                     'background-image': visual.image ? `url(${visual.image})` : 'none'
                 })
                 .toggleClass('navi-sticky-shade-swatch--empty', !visual.color && !visual.image);
             $shadeTrigger.find('.navi-sticky-shade-trigger-label').text(value ? valueLabel(value) : (stickyI18n.chooseVariationText || attributeName));

             // Le déclencheur (état fermé) garde volontairement son cadre
             // neutre fixe (assets/css/sticky-cart.css) : la teinte de la
             // couleur choisie ne s'applique QUE dans la liste ouverte,
             // uniquement sur l'option sélectionnée ci-dessous — pas sur le
             // déclencheur. Le fond teinté (rgba) suppose une couleur hex
             // (hexToRgb renvoie null pour une image, ou pour une couleur
             // calculée type "rgb(...)" issue d'un sélecteur personnalisé) :
             // dans ces cas, seul le cadre de bordure reste appliqué.
             $shadeListbox.find('.navi-sticky-shade-option').each(function() {
                 const $opt = $(this);
                 const isSelected = $opt.data('value') === value;
                 $opt.attr('aria-selected', isSelected ? 'true' : 'false')
                     .toggleClass('navi-sticky-shade-option--selected', isSelected);

                 if (isSelected) {
                     $opt.css({
                         'border-color': visual.color || '',
                         'background-color': rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.14)` : ''
                     });
                 } else {
                     $opt.css({ 'border-color': '', 'background-color': '' });
                 }
             });
         }

         // Sur la fiche produit, choisir une teinte peut aussi changer
         // l'image mise en avant (galerie) : la sticky bar doit refléter le
         // même comportement plutôt que de garder l'image initiale.
         // variation.image (fourni par WooCommerce, aussi bien à la
         // sélection qu'à la confirmation found_variation) est la source la
         // plus fiable, plus sûre qu'une relecture du DOM de la galerie qui
         // peut ne pas avoir fini de se mettre à jour au même instant — et
         // déjà en haute résolution.
         function updateVariationImage(variation) {
             if (!variation || !variation.image) return;
             const src = variation.image.src || variation.image.full_src || variation.image.thumb_src;
             if (src) {
                 $productImg.attr('src', src);
             }
         }

         // Teinte par défaut : celle indiquée dans l'URL (convention
         // WooCommerce attribute_{nom}=valeur), sinon celle déjà présélectionnée
         // par WooCommerce sur le formulaire principal, sinon la première de
         // la liste. Calculée ici (pas seulement dans le setTimeout plus bas,
         // qui synchronise le vrai formulaire avec un délai de sécurité) pour
         // pouvoir afficher tout de suite l'image nette de cette teinte, sans
         // attendre.
         function resolveDefaultValue() {
             const params = new URLSearchParams(window.location.search);
             const urlValue = (params.get(`attribute_${attributeName}`) || '').toLowerCase();
             const currentValue = ($variationForm.find('.variations select').val() || '').toLowerCase();
             return orderedValues.find(v => v.toLowerCase() === urlValue)
                 || orderedValues.find(v => v.toLowerCase() === currentValue)
                 || orderedValues[0];
         }

         // ==========================================================
         // Récupérer le nom du produit
         // ==========================================================
         const nameFallbackSelectors = withCustomSelector(stickyConfig.nameSelector, [
             'h1.product_title',
             'h1.wp-block-post-title',
             '.product_title',
             'h1'
         ]);
         let productNameHTML = '';
         for (let selector of nameFallbackSelectors) {
             productNameHTML = $(selector).first().html();
             if (productNameHTML) break;
         }

         if (productNameHTML) {
             $productName.html(productNameHTML);
         }

         // ==========================================================
         // Récupérer l'image du produit
         // ==========================================================
         // Priorité à la vignette active d'une galerie tierce comme Iconic
         // WooThumbs si présente (reflète l'image actuellement mise en avant
         // dans la galerie), avant les sélecteurs génériques WooCommerce/
         // Gutenberg utilisés en repli si un tel plugin est absent.
         const imgFallbackSelectorsVariable = withCustomSelector(stickyConfig.imageSelector, [
             '.iconic-woothumbs-thumbnails__slide--active .iconic-woothumbs-thumbnails__image',
             '.wc-block-woocommerce-product-gallery-large-image__image',
             '.wc-block-product-gallery-large-image__image-element img',
             '.woocommerce-product-gallery__image img',
             '.woocommerce-product-gallery__wrapper img',
             '.wp-post-image'
         ]);
         let productImgSrc = '';
         for (let selector of imgFallbackSelectorsVariable) {
             productImgSrc = getImgSrc($(selector).first());
             if (productImgSrc) break;
         }

         if (productImgSrc) {
             $productImg.attr('src', productImgSrc);
         }

         // Dès que la teinte par défaut est connue, afficher tout de suite son
         // déclencheur (pastille + nom) et son image en haute résolution —
         // remplace la vignette de galerie ci-dessus par une image nette
         // (variation.image, voir updateVariationImage) sans attendre le
         // setTimeout de synchronisation avec le vrai formulaire plus bas.
         const initialValue = resolveDefaultValue();
         if (initialValue) {
             updateShadeTrigger(initialValue);
             updateVariationImage(variationsByValue[initialValue]);
         }

         // Répercute la valeur choisie sur le vrai <select> WooCommerce (un
         // éventuel plugin de swatches/galerie y est déjà branché et se
         // resynchronise lui-même), gère le scroll et la rupture de stock,
         // et met à jour la pastille de couleur.
         function applyVariationSelection(value) {
             // Signaler que le choix vient de la sticky bar
             if (typeof window.naviStickyBarSetClickFromBar === 'function') {
                 window.naviStickyBarSetClickFromBar();
             }

             // Sauvegarder la position de scroll AVANT le changement
             const savedScrollTop = $(window).scrollTop();

             // Changer la valeur du select
             const $select = $variationForm.find('.variations select');
             $select.val(value).trigger('change');

             // Restaurer la position de scroll immédiatement et après un délai
             // (WooCommerce peut essayer de scroller après le trigger)
             $(window).scrollTop(savedScrollTop);
             setTimeout(function() {
                 $(window).scrollTop(savedScrollTop);
             }, 10);
             setTimeout(function() {
                 $(window).scrollTop(savedScrollTop);
             }, 50);
             setTimeout(function() {
                 $(window).scrollTop(savedScrollTop);
             }, 100);

             // Refléter immédiatement la disponibilité de la variation choisie
             // (found_variation la confirmera juste après) plutôt que
             // d'activer le contrôle en aveugle pour une variation en rupture.
             const chosenVariation = variationsByValue[value];
             setStickyOutOfStock($stickyBar, chosenVariation ? chosenVariation.is_in_stock === false : false);
             updateShadeTrigger(value);
             updateVariationImage(chosenVariation);

             // Vider le prix affiché tout de suite : sans ça, le prix de
             // l'ANCIENNE variation reste visible le temps que WooCommerce
             // mette à jour le DOM, ce qui donne l'impression trompeuse qu'on
             // voit encore la variation précédente. Le rattrapage du nouveau
             // prix est déjà assuré par l'écouteur 'found_variation' plus bas
             // (déclenché par le trigger('change') ci-dessus), pas besoin
             // d'une seconde cascade de délais ici.
         }

         // Ouvrir/fermer le volet de teintes
         $shadeTrigger.on('click', function() {
             const willOpen = !$shadePicker.hasClass('navi-sticky-shade-picker--open');
             setShadePickerOpen(willOpen);
             if (willOpen) {
                 const $selected = $shadeListbox.find('.navi-sticky-shade-option--selected').first();
                 ($selected.length ? $selected : $shadeListbox.find('.navi-sticky-shade-option').first()).trigger('focus');
             }
         });

         // Choisir une teinte dans le menu (clic ou clavier, voir plus bas)
         $shadeListbox.on('click', '.navi-sticky-shade-option', function() {
             const value = $(this).data('value');
             setShadePickerOpen(false);
             $shadeTrigger.trigger('focus');
             applyVariationSelection(value);
         });

         // Navigation clavier dans la liste (motif WAI-ARIA listbox) : flèches
         // pour circuler, Entrée/Espace pour choisir, Échap pour fermer sans
         // choisir et revenir au déclencheur.
         $shadeListbox.on('keydown', '.navi-sticky-shade-option', function(e) {
             const $options = $shadeListbox.find('.navi-sticky-shade-option');
             const currentIndex = $options.index(this);
             if (e.key === 'ArrowDown') {
                 e.preventDefault();
                 $options.eq(Math.min(currentIndex + 1, $options.length - 1)).trigger('focus');
             } else if (e.key === 'ArrowUp') {
                 e.preventDefault();
                 $options.eq(Math.max(currentIndex - 1, 0)).trigger('focus');
             } else if (e.key === 'Enter' || e.key === ' ') {
                 e.preventDefault();
                 $(this).trigger('click');
             } else if (e.key === 'Escape') {
                 e.preventDefault();
                 setShadePickerOpen(false);
                 $shadeTrigger.trigger('focus');
             }
         });

         $shadeTrigger.on('keydown', function(e) {
             if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                 e.preventDefault();
                 setShadePickerOpen(true);
                 const $selected = $shadeListbox.find('.navi-sticky-shade-option--selected').first();
                 ($selected.length ? $selected : $shadeListbox.find('.navi-sticky-shade-option').first()).trigger('focus');
             } else if (e.key === 'Escape') {
                 setShadePickerOpen(false);
             }
         });

         // Clic en dehors du menu : le referme sans rien changer (motif usuel
         // d'un menu déroulant). Espace de nom dédié + off() avant on() : si
         // syncVariations() était rappelée, éviter d'empiler un écouteur
         // document par appel (même prudence que $stickyAddToCart.off('click')
         // plus bas dans ce fichier).
         $(document).off('click.naviStickyShadePicker').on('click.naviStickyShadePicker', function(e) {
             if (!$(e.target).closest('.navi-sticky-shade-picker').length) {
                 setShadePickerOpen(false);
             }
         });

         // Synchroniser avec les changements du formulaire principal
         $variationForm.on('found_variation', function(event, variation) {
             // On mémorise "variation" et on la transmet : son price_html est
             // déjà connu de WooCommerce à cet instant précis, contrairement
             // au DOM de la page (voir le commentaire au-dessus de
             // updateStickyPrice). Le cache sert aux évènements qui
             // redéclenchent une mise à jour sans transmettre l'objet
             // variation (ex. woocommerce_variation_has_changed ci-dessous).
             lastFoundVariation = variation;
             updateStickyPrice(variation);
             setStickyOutOfStock($stickyBar, variation.is_in_stock === false);
             updateVariationImage(variation);

             // Filet de sécurité : au cas où price_html serait absent de cet
             // évènement (thème/plugin tiers), on retente un peu plus tard en
             // scrutant le DOM, qui aura eu le temps de se mettre à jour.
             setTimeout(function() { updateStickyPrice(variation); }, 100);

             // Refléter la variation réellement confirmée par WooCommerce
             // (ex. sélection faite directement sur les vignettes de swatches
             // de la page, sans passer par notre menu de teintes).
             const selectedValue = $variationForm.find('.variations select').val();
             updateShadeTrigger(selectedValue);
         });

         $variationForm.on('reset_data', function() {
             lastFoundVariation = null;
             $stickyAddToCart.prop('disabled', true);
         });

         // Ajouter des écouteurs supplémentaires pour capturer les mises à jour de prix
         // après un ajout au panier ou une modification du formulaire
         $variationForm.on('woocommerce_variation_has_changed', function() {
             updateStickyPrice();
             setTimeout(updateStickyPrice, 100);
         });

         $(document.body).on('updated_wc_div', function() {
             updateStickyPrice();
             setTimeout(updateStickyPrice, 100);
         });

         // Vérifier le prix quand une variation est reset aussi
         $(document.body).on('woocommerce_variation_reset_data', function() {
             updateStickyPrice();
         });

         // Synchroniser le VRAI formulaire WooCommerce avec la teinte par
         // défaut déjà affichée plus haut (updateShadeTrigger/updateVariationImage
         // via resolveDefaultValue) : délai de sécurité pour laisser
         // WooCommerce/un éventuel plugin de swatches finir leur propre
         // initialisation avant de déclencher un changement dessus.
         setTimeout(function() {
             const targetValue = resolveDefaultValue();
             if (!targetValue) return;
             applyVariationSelection(targetValue);
         }, 700);

         // Gérer l'ajout au panier depuis le sticky bar
         $stickyAddToCart.off('click').on('click', function(e) {
             e.preventDefault();
             e.stopPropagation();
             e.stopImmediatePropagation();

             const $btn = $(this);

             // Empêcher les doubles clics, et par sécurité un ajout au panier
             // pour un produit en rupture (le bouton est normalement masqué
             // dans ce cas, voir setStickyOutOfStock, mais on se protège
             // aussi ici au cas où l'état n'aurait pas encore été appliqué).
             if ($btn.hasClass('loading') || $btn.prop('disabled')) {
                 return false;
             }

             // Ajouter l'état de chargement
             $btn.addClass('loading').prop('disabled', true);
             const originalText = $btn.html();
             $btn.html(`<span class="loading-text">${stickyI18n.addingText}</span>`);

             // Chercher le bouton original UNIQUEMENT dans le form.cart principal de la page
             // Exclure explicitement les boutons du mini-cart, widget, header
             const $originalBtn = $('form.cart button[type="submit"], form.cart .single_add_to_cart_button')
                 .not('.mini-cart *, .widget *, .cart-contents *, header *, .site-header *, #navi-sticky-bar *, .woocommerce-mini-cart *, .cart_list *')
                 .first();

             if ($originalBtn.length) {
                 // Utiliser un click natif pour éviter les propagations jQuery
                 $originalBtn[0].click();
             } else {
                 // Fallback: soumettre le formulaire directement
                 const $form = $('form.cart').not('.mini-cart form, .widget form, .woocommerce-mini-cart form').first();
                 if ($form.length) {
                     $form.submit();
                 }
             }

             // Attendre la fin de l'AJAX WooCommerce
             $(document.body).one('added_to_cart wc_cart_button_updated', function() {
                 showAddedConfirmation($btn, originalText);
             });

             // Timeout de sécurité (5 secondes max)
             setTimeout(function() {
                 if ($btn.hasClass('loading')) {
                     $btn.removeClass('loading').prop('disabled', false);
                     $btn.html(originalText);
                 }
             }, 5000);

             return false;
         });
     }

     // ================================================================
     // PRODUITS SIMPLES
     // ================================================================
     function syncSimpleProduct() {
         const $stickyBar = $('#navi-sticky-bar');
         const $stickyPrice = $stickyBar.find('.navi-sticky-price');
         const $stickyAddToCart = $stickyBar.find('.navi-sticky-add-to-cart');
         const $productName = $stickyBar.find('.navi-sticky-product-name');
         const $productImg = $stickyBar.find('.navi-sticky-product-img');
         const $variationOptions = $stickyBar.find('.navi-sticky-variation-options');

         // Ajouter une classe pour identifier les produits simples
         $stickyBar.addClass('simple-product');

         // Supprimer complètement le bloc des options de variation (pas juste le cacher)
         $variationOptions.remove();

         // ========================================
         // Récupérer le nom du produit
         // ========================================
         const nameFallbackSelectors = withCustomSelector(stickyConfig.nameSelector, [
             'h1.product_title',
             'h1.wp-block-post-title',
             '.product_title',
             'h1'
         ]);
         let productNameText = '';
         for (let selector of nameFallbackSelectors) {
             const $el = $(selector).first();
             if ($el.length) {
                 productNameText = $el.text().trim();
                 if (productNameText) break;
             }
         }

         if (productNameText) {
             $productName.text(productNameText);
         }

         // ========================================
         // Récupérer l'image du produit
         // ========================================
         // Priorité à la vignette active d'une galerie tierce comme Iconic
         // WooThumbs si présente (même sélecteur que syncVariations
         // ci-dessus), puis blocs Gutenberg et WooCommerce classique en repli.
         const imgFallbackSelectors = withCustomSelector(stickyConfig.imageSelector, [
             '.iconic-woothumbs-thumbnails__slide--active .iconic-woothumbs-thumbnails__image',
             '.wc-block-woocommerce-product-gallery-large-image__image',
             '.wc-block-product-gallery-large-image__image-element img',
             '.woocommerce-product-gallery__image img',
             '.wp-post-image',
             '.product .attachment-woocommerce_single img',
             '.product img.wp-post-image'
         ]);
         let productImgSrc = '';
         for (let selector of imgFallbackSelectors) {
             productImgSrc = getImgSrc($(selector).first());
             if (productImgSrc) break;
         }

         if (productImgSrc) {
             $productImg.attr('src', productImgSrc).attr('alt', productNameText);
         }

         // ========================================
         // Récupérer le prix du produit
         // ========================================
         // Ordre de priorité : sélecteur personnalisé (Navi > Panier) s'il
         // est renseigné, puis blocs Gutenberg, puis WooCommerce classique,
         // puis un thème qui n'enveloppe pas le prix dans une balise .price
         // (seulement .woocommerce-Price-amount nu, ex. certains thèmes
         // premium), puis un repli générique valable sur n'importe quel thème.
         const priceFallbackSelectors = withCustomSelector(stickyConfig.priceSelector, [
             '.wp-block-woocommerce-product-price .wc-block-components-product-price', // Blocs Gutenberg
             '.product .summary p.price',                                            // WooCommerce classique
             '.product .summary .price',
             '.entry-content .wp-block-woocommerce-product-price',
             '.entry-price-wrap .woocommerce-Price-amount.amount',                    // Thème sans wrapper .price
             '.summary .woocommerce-Price-amount.amount'                              // Repli générique
         ]);

         let priceText = '';
         let $priceElement = null;
         for (let selector of priceFallbackSelectors) {
             // Exclure EXPLICITEMENT tous les éléments du mini-cart, widget, header, sticky bar lui-même
             const $el = $(selector)
                 .not('.mini-cart *, .cart-contents *, .widget *, header *, .site-header *, #navi-sticky-bar *, .woocommerce-mini-cart *, .cart_list *, aside *, .sidebar *')
                 .filter(function() {
                     return !$(this).closest('.mini-cart, .cart-contents, .widget, header, .site-header, #navi-sticky-bar, .woocommerce-mini-cart, .cart_list, aside, .sidebar').length;
                 })
                 .first();

             if ($el.length) {
                 $priceElement = $el;
                 break;
             }
         }

         if ($priceElement && $priceElement.length) {
             // Cloner et nettoyer
             const $clone = $priceElement.clone();
             $clone.find('.screen-reader-text').remove();
             // Supprimer tous les liens et boutons pour éviter les clics accidentels
             $clone.find('a, button, input').remove();
             priceText = $clone.html();
         }

         if (priceText && priceText.trim()) {
             // Nettoyer le HTML du prix - supprimer les attributs href et onclick
             const $tempDiv = $('<div>').html(priceText);
             $tempDiv.find('a').each(function() {
                 $(this).replaceWith($(this).text());
             });
             $stickyPrice.html($tempDiv.html());
         }

         // Activer le bouton pour les produits simples, sauf rupture de stock
         setStickyOutOfStock($stickyBar, isSimpleProductOutOfStock());

         // ========================================
         // Gérer le clic sur le bouton
         // ========================================
         $stickyAddToCart.off('click').on('click', function(e) {
             e.preventDefault();
             e.stopPropagation();
             e.stopImmediatePropagation();

             const $btn = $(this);

             // Empêcher les doubles clics, et par sécurité un ajout au panier
             // pour un produit en rupture (le bouton est normalement masqué
             // dans ce cas, voir setStickyOutOfStock, mais on se protège
             // aussi ici au cas où l'état n'aurait pas encore été appliqué).
             if ($btn.hasClass('loading') || $btn.prop('disabled')) {
                 return false;
             }

             // Ajouter l'état de chargement
             $btn.addClass('loading').prop('disabled', true);
             const originalText = $btn.html();
             $btn.html(`<span class="loading-text">${stickyI18n.addingText}</span>`);

             // Chercher le bouton original UNIQUEMENT dans le form.cart principal de la page
             // Exclure explicitement les boutons du mini-cart, widget, header
             const $originalBtn = $('form.cart button[type="submit"], form.cart .single_add_to_cart_button')
                 .not('.mini-cart *, .widget *, .cart-contents *, header *, .site-header *, #navi-sticky-bar *, .woocommerce-mini-cart *, .cart_list *')
                 .first();

             if ($originalBtn.length) {
                 // Utiliser un click natif pour éviter les propagations jQuery
                 $originalBtn[0].click();
             } else {
                 // Fallback: soumettre le formulaire directement
                 const $form = $('form.cart').not('.mini-cart form, .widget form, .woocommerce-mini-cart form').first();
                 if ($form.length) {
                     $form.submit();
                 }
             }

             // Attendre la fin de l'AJAX WooCommerce
             $(document.body).one('added_to_cart wc_cart_button_updated', function() {
                 showAddedConfirmation($btn, originalText);
             });

             // Timeout de sécurité (5 secondes max)
             setTimeout(function() {
                 if ($btn.hasClass('loading')) {
                     $btn.removeClass('loading').prop('disabled', false);
                     $btn.html(originalText);
                 }
             }, 5000);

             return false;
         });
     }

     // Clic sur l'icône panier du bouton flottant avant que le panneau ne
     // soit prêt (créé 300 à 800 ms après le chargement, voir
     // initStickyBar) : retenu, puis appliqué dès la fin de
     // handleStickyVisibility() plutôt que perdu.
     let stickyReady = false;
     let pendingOpen = false;
     document.addEventListener('navi:action', function (event) {
         if (!stickyReady && event.detail && event.detail.action === 'open-sticky-cart') {
             pendingOpen = true;
         }
     });

     // Gérer l'affichage/masquage du sticky bar
    function handleStickyVisibility() {
        const $stickyBar = $('#navi-sticky-bar');
        let visibilityCheckTimeout = null;
        let isUpdating = false; // Verrouillage pendant les mises à jour WooCommerce
        let clickedFromStickyBar = false; // Indicateur si le clic vient de la sticky bar

        // Une fermeture manuelle (croix) doit rester fermée au scroll, jusqu'à
        // ce que l'utilisateur la rouvre explicitement via l'icône panier du
        // menu du bouton flottant (voir l'écouteur 'navi:action' plus bas) —
        // sinon checkVisibility() la réaffichait dès le prochain scroll,
        // rendant la fermeture inutile.
        let dismissedManually = false;

        // Ouvert d'un clic sur le bouton flottant (icône panier) : reste
        // ouvert même si le vrai bouton « Ajouter au panier » de la page est
        // à l'écran, jusqu'à la croix ou au pied de page.
        let openedManually = false;

        // Le panneau panier est le même objet visuel que l'engrenage (voir
        // assets/js/core.js) : l'afficher fait grandir #navi-fab jusqu'à
        // l'état détail. Fermeture manuelle (croix) ou automatique (scroll) :
        // le bouton se referme entièrement — le panier s'ouvre directement
        // depuis le bouton, pas depuis le menu.
        function setStickyBarVisible(visible) {
            if (!window.navi) {
                $stickyBar.toggleClass('visible', visible);
                return;
            }
            if (visible) {
                window.navi.showDetail('sticky-cart', function () {
                    $stickyBar.addClass('visible');
                });
            } else {
                window.navi.hideDetail('sticky-cart', function () {
                    $stickyBar.removeClass('visible');
                });
            }
        }

        // Le hub s'est refermé entièrement (clic extérieur, Échap, un autre
        // module affiché...) pendant que ce panneau était actif : on remet à
        // jour notre propre état d'affichage sans redéclencher de fermeture.
        document.addEventListener('navi:closed', function (event) {
            if (event.detail && event.detail.id === 'sticky-cart') {
                openedManually = false;
                $stickyBar.removeClass('visible');
            }
        });

        $stickyBar.on('click', '.navi-sticky-panel-close', function () {
            openedManually = false;
            dismissedManually = true;
            setStickyBarVisible(false);
        });

        // Icône panier du menu du bouton flottant (voir includes/modules/sticky-cart/module.php,
        // fab_action) : seule façon de rouvrir le panneau après une
        // fermeture manuelle, la réouverture au scroll restant bloquée par
        // dismissedManually ci-dessus tant qu'elle n'est pas remise à false ici.
        document.addEventListener('navi:action', function (event) {
            if (event.detail && event.detail.action === 'open-sticky-cart') {
                dismissedManually = false;
                openedManually = true;
                setStickyBarVisible(true);
            }
        });

        stickyReady = true;
        if (pendingOpen) {
            pendingOpen = false;
            dismissedManually = false;
            openedManually = true;
            setStickyBarVisible(true);
        }

        function findAddToCartBtn() {
            // Chercher le bouton d'ajout au panier dans tous les contextes possibles
            // Priorité 1: Dans le conteneur de variations
            let $btn = $('.woocommerce-variation-add-to-cart-enabled button.single_add_to_cart_button').first();
            if ($btn.length && !$btn.closest('.mini-cart, .widget, header').length) {
                return $btn;
            }

            // Priorité 2: Bouton "add-to-cart" simple
            $btn = $('button[name="add-to-cart"]').not('.mini-cart *, .widget *, header *, .woocommerce-mini-cart *').first();
            if ($btn.length) {
                return $btn;
            }

            // Priorité 3: Autres sélecteurs
            const selectors = [
                'button.single_add_to_cart_button',
                '.wc-block-components-product-add-to-cart-button',
                'form.cart button[type="submit"]'
            ];

            for (let selector of selectors) {
                $btn = $(selector).not('.mini-cart *, .widget *, header *, .woocommerce-mini-cart *').first();
                if ($btn.length) {
                    return $btn;
                }
            }

            return null;
        }

        function checkVisibility() {
            // Si on est en train de mettre à jour, ignorer cette vérification
            if (isUpdating) {
                return;
            }

            // Fermé manuellement : ne pas réafficher tout seul au scroll (voir
            // dismissedManually plus haut).
            if (dismissedManually) {
                return;
            }

            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const windowBottom = scrollTop + windowHeight;
            const docHeight = $(document).height();

            // Rechercher le bouton à chaque check
            const $addToCartBtn = findAddToCartBtn();


            // 1. Vérifier si on approche du footer - MASQUER la sticky bar
            //
            // [role="contentinfo"] en priorité (repère sémantique du VRAI
            // pied de page du site, réservé à lui par convention WordPress)
            // plutôt qu'un simple sélecteur <footer> pris seul : la balise
            // <footer> HTML5 est aussi valide pour un sous-élément (ex. le
            // bloc natif "Derniers commentaires" rend chaque commentaire
            // dans un <footer class="wp-block-latest-comments__comment-meta">)
            // — un site avec ce bloc sur sa page produit voyait le panneau
            // se masquer dès qu'on scrollait ne serait-ce qu'un peu, ce
            // <footer> de commentaire se trouvant très haut sur la page.
            // .last() en repli (pas .first()) : si aucun repère contentinfo
            // n'existe, le vrai pied de page reste plus probablement le
            // DERNIER <footer> du DOM qu'un sous-élément rencontré avant lui.
            let $footer = $('[role="contentinfo"]');
            if (!$footer.length) {
                $footer = $('footer').last();
            }
            if ($footer.length) {
                const footerTop = $footer.first().offset().top;

                // Si on chevauche le footer, masquer
                if (windowBottom >= footerTop) {
                    openedManually = false;
                    setStickyBarVisible(false);
                    return;
                }
            } else {
                // Si pas de footer, masquer les 200px avant la fin
                const nearEnd = docHeight - windowBottom <= 200;
                if (nearEnd) {
                    setStickyBarVisible(false);
                    return;
                }
            }

            // Ouvert d'un clic : pas de masquage automatique (voir openedManually).
            if (openedManually) {
                return;
            }

            // 2. Vérifier si le bouton "Ajouter au panier" réel est visible - MASQUER la sticky bar
            if ($addToCartBtn && $addToCartBtn.length) {
                const btnOffset = $addToCartBtn.offset();
                const btnTop = btnOffset.top;
                const btnHeight = $addToCartBtn.outerHeight() || 50;
                const btnBottom = btnTop + btnHeight;
                const isBtnVisible = $addToCartBtn.is(':visible');


                // Le bouton est visible si au moins une partie est dans le viewport ET visible
                const isBtnInViewport = (btnTop < windowBottom) && (btnBottom > scrollTop) && isBtnVisible;


                if (isBtnInViewport) {
                    setStickyBarVisible(false);
                    return;
                }
            }

            // 3. Sinon, AFFICHER la sticky bar
            setStickyBarVisible(true);
        }

        // Fonction debounced pour éviter les appels multiples rapides
        function debouncedCheckVisibility(delay) {
            if (visibilityCheckTimeout) {
                clearTimeout(visibilityCheckTimeout);
            }
            visibilityCheckTimeout = setTimeout(function() {
                isUpdating = false; // Débloquer après le délai
                checkVisibility();
            }, delay || 100);
        }

         // Throttle par requestAnimationFrame (même pattern que le noyau,
         // assets/js/core.js) : sans lui, checkVisibility() relit des
         // offsets/hauteurs (footer, bouton d'origine) de façon synchrone à
         // chaque évènement scroll/touchmove, ce qui peut saccader le
         // défilement sur des appareils bas de gamme.
         let stickyTicking = false;
         function throttledCheckVisibility() {
             if (stickyTicking) return;
             stickyTicking = true;
             window.requestAnimationFrame(function() {
                 if (!isUpdating) checkVisibility();
                 stickyTicking = false;
             });
         }

         // Bindé sur scroll et resize (pas de verrouillage pour le scroll)
         $(window).off('scroll.naviStickyBar resize.naviStickyBar').on('scroll.naviStickyBar resize.naviStickyBar', throttledCheckVisibility);

         // Aussi écouter les événements touch pour mobile
         $(window).off('touchmove.naviStickyBar').on('touchmove.naviStickyBar', throttledCheckVisibility);

         // Écouter les changements de variation WooCommerce avec verrouillage
         $('form.variations_form').on('found_variation reset_data woocommerce_variation_has_changed', function() {
             isUpdating = true; // Verrouiller immédiatement

             if (clickedFromStickyBar) {
                 // Le changement vient du panneau lui-même (sélecteur de
                 // teinte) : ne PAS relancer debouncedCheckVisibility ici.
                 // Cette fonction rappelle checkVisibility(), qui ne connaît
                 // pas clickedFromStickyBar — seul le masquage immédiat
                 // ci-dessous en tenait compte, mais checkVisibility()
                 // pouvait quand même refermer le panneau 500ms plus tard
                 // sur la base de sa propre évaluation générique (bouton
                 // réel visible / proximité du pied de page), potentiellement
                 // faussée par le léger réagencement de la page qu'entraîne
                 // un changement de variation (image, largeur du prix...).
                 // Résultat observé : le panneau se refermait tout seul
                 // juste après avoir choisi une teinte depuis lui-même — le
                 // prochain scroll/resize réel (throttledCheckVisibility)
                 // suffit à rétablir une évaluation fiable ensuite.
                 setTimeout(function() { isUpdating = false; }, 500);
             } else {
                 setStickyBarVisible(false); // Masquer pendant la mise à jour
                 // Utiliser un délai plus long pour laisser WooCommerce finir toutes ses mises à jour
                 debouncedCheckVisibility(500);
             }
         });

         // Écouter les clics sur les vignettes de swatches de la fiche
         // produit (sélection faite directement sur la page, pas depuis la
         // sticky bar), si un tel plugin est actif, avec le même verrouillage.
         $('.wcboost-variation-swatches__item').on('click', function() {
             isUpdating = true; // Verrouiller immédiatement
             clickedFromStickyBar = false; // Ce clic vient de la page
             setStickyBarVisible(false); // Masquer pendant la mise à jour
             debouncedCheckVisibility(500);
         });

         // Exposer la fonction pour permettre à syncVariations de l'appeler
         window.naviStickyBarSetClickFromBar = function() {
             clickedFromStickyBar = true;
             // Réinitialiser après un délai
             setTimeout(function() {
                 clickedFromStickyBar = false;
             }, 1000);
         };

         // Exécuter immédiatement
         setTimeout(function() {
             checkVisibility();
         }, 100);

         // Re-exécuter après des délais
         setTimeout(checkVisibility, 300);
         setTimeout(checkVisibility, 500);
         setTimeout(checkVisibility, 1000);
     }

     // Initialisation
     $(document).ready(function() {
         initStickyBar();
     });

     // Aussi initialiser quand la fenêtre est complètement chargée (images, etc.)
     $(window).on('load', function() {
         // Vérifier si le sticky bar n'a pas déjà été créé
         if (!$('#navi-sticky-bar').length) {
             initStickyBar();
         }
     });

     function initStickyBar() {
         // Attendre un peu que la page soit complètement chargée
         setTimeout(function() {
             // Vérifier si le sticky bar existe déjà
             if ($('#navi-sticky-bar').length) {
                 return;
             }

             // Vérifier si on est sur une page produit avec variations
             if ($('form.variations_form').length) {
                 createStickyBar();

                 // Attendre que WooCommerce charge les variations
                 setTimeout(function() {
                     syncVariations();
                     handleStickyVisibility();
                 }, 500);
             } else {
                 // Si pas de variations, vérifier pour les produits simples
                 const hasCartForm = $('form.cart').length > 0;
                 const hasWooBlock = $('.wc-block-add-to-cart-form, .wp-block-woocommerce-add-to-cart-form').length > 0;
                 const hasAddToCartButton = $('.single_add_to_cart_button, button[name="add-to-cart"]').length > 0;
                 const isProductPage = $('body').hasClass('single-product') ||
                                       $('body').hasClass('woocommerce') ||
                                       $('.product').length > 0 ||
                                       $('.wp-block-woocommerce-product-image').length > 0;


                 if ((hasCartForm || hasWooBlock || hasAddToCartButton) && isProductPage) {
                     createStickyBar();
                     syncSimpleProduct();
                     handleStickyVisibility();
                 }
             }
         }, 300);

         // Empêcher WooCommerce de remonter vers le select de variation
         $(document).on('focus', '.variations_form select', function(e) {
             e.preventDefault();
             this.blur();
         });
     }

 })(jQuery);
