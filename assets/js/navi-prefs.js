/*
 * Consentement cookies (bannière + modale de préférences).
 *
 * Nom de fichier volontairement neutre (navi-prefs.js, et non cookie-consent.js) :
 * les bloqueurs de bannières cookies (NordVPN Threat Protection, AdGuard,
 * uBlock/Brave avec listes "Annoyances"...) bloquent les scripts d'après leur
 * nom. Bloqué, l'ancien fichier laissait une bannière affichée mais aux
 * boutons inertes (constaté sur Mac avec NordVPN : réponse 204 vide).
 *
 * Robustesse :
 * - C'est CE script qui affiche la bannière (elle est cachée par défaut en
 *   CSS, assets/css/navi-prefs.css). Si un bloqueur l'empêche de se charger, le
 *   visiteur ne voit donc pas de bannière inutilisable ; Consent Mode reste
 *   à "denied" par défaut (script en ligne dans le <head>, public-display.php).
 * - Démarrage immédiat si DOMContentLoaded est déjà passé (sinon les boutons
 *   ne recevaient jamais leurs écouteurs, sans aucune erreur).
 * - Clics délégués sur document : fonctionnent même si le HTML de la
 *   bannière/modale est inséré ou remplacé après ce script.
 */
(function () {
    if (window.__naviConsentInit) return;
    window.__naviConsentInit = true;

    const consentVersion = (typeof naviCookieConfig !== "undefined" && naviCookieConfig.consentVersion)
        ? String(naviCookieConfig.consentVersion)
        : "1";

    function getBanner() { return document.getElementById("navi-cookie-banner"); }
    function getModal() { return document.getElementById("navi-cookie-modal-overlay"); }
    function getModalBox() {
        const modal = getModal();
        return modal ? modal.querySelector(".navi-cookie-modal") : null;
    }
    function showBanner(show) {
        const banner = getBanner();
        if (banner) banner.style.display = show ? "block" : "none";
    }

    // Choix déjà fait ET pour la version de consentement en cours
    // (NAVI_COOKIE_CONSENT_VERSION, includes/modules/cookie-consent/module.php).
    function hasConsent() {
        const m = document.cookie.match(/(?:^|; )navi_consent_version=([^;]*)/);
        return document.cookie.indexOf("navi_consent_all=") !== -1 && m !== null && m[1] === consentVersion;
    }

    // Affichage initial, tout de suite : ce script est imprimé dans le footer
    // APRÈS le HTML de la bannière (wp_print_footer_scripts, priorité 20 de
    // wp_footer, contre 10 pour navi_cookie_afficher_banniere), elle existe donc
    // déjà, et on tranche avant le premier rendu — pas de flash.
    function initialDisplay() {
        if (!hasConsent()) showBanner(true);
    }
    if (getBanner()) {
        initialDisplay();
    } else {
        document.addEventListener("DOMContentLoaded", initialDisplay);
    }

    function naviConsentInit() {
        let lastFocusedElement = null;

        function getFocusableModalElements() {
            const modalBox = getModalBox();
            return modalBox ? modalBox.querySelectorAll('button, input:not([disabled]), a[href]') : [];
        }

        function handleModalKeydown(event) {
            if (event.key === "Escape") {
                closeModal();
                return;
            }
            if (event.key !== "Tab") return;
            const focusable = getFocusableModalElements();
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        function openModal(trigger) {
            const modal = getModal();
            const modalBox = getModalBox();
            if (!modal || !modalBox) return;
            lastFocusedElement = trigger || document.activeElement;
            function apply() {
                modal.classList.add("navi-cookie-modal-overlay-open");
                document.addEventListener("keydown", handleModalKeydown);
            }
            if (window.navi) {
                // Le focus est déposé par le noyau (assets/js/core.js,
                // navi.showDetail) sur #navi-cookie-modal-overlay (tabindex="-1").
                window.navi.showDetail("cookie-consent", apply);
            } else {
                apply();
                modalBox.focus();
            }
        }

        // Fermeture manuelle (croix, "Annuler") : revient au choix des icônes
        // (état 2), voir assets/js/core.js.
        function closeModal() {
            const modal = getModal();
            if (!modal) return;
            function apply() {
                modal.classList.remove("navi-cookie-modal-overlay-open");
                document.removeEventListener("keydown", handleModalKeydown);
                if (lastFocusedElement && document.contains(lastFocusedElement)) {
                    lastFocusedElement.focus();
                }
            }
            if (window.navi) {
                window.navi.backToMenu("cookie-consent", apply);
            } else {
                apply();
            }
        }

        function setConsent(stats, mkt) {
            const expires = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toUTCString();
            // "secure" uniquement en HTTPS, sinon le cookie n'est jamais posé en HTTP.
            const secureFlag = window.location.protocol === "https:" ? "; secure" : "";
            document.cookie = `navi_consent_stats=${stats}; expires=${expires}; path=/; samesite=strict${secureFlag}`;
            document.cookie = `navi_consent_mkt=${mkt}; expires=${expires}; path=/; samesite=strict${secureFlag}`;
            document.cookie = `navi_consent_version=${consentVersion}; expires=${expires}; path=/; samesite=strict${secureFlag}`;
            document.cookie = `navi_consent_all=1; expires=${expires}; path=/; samesite=strict${secureFlag}`;

            const statsStatus = stats === 1 ? "granted" : "denied";
            const mktStatus = mkt === 1 ? "granted" : "denied";

            // Un souci côté Google ne doit jamais empêcher la fermeture de la bannière.
            try {
                if (typeof gtag === "function") {
                    gtag("consent", "update", {
                        "ad_storage": mktStatus,
                        "ad_user_data": mktStatus,
                        "ad_personalization": mktStatus,
                        "analytics_storage": statsStatus
                    });
                }
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({ "event": "navi_cookie_consent_updated" });
            } catch (e) {
                console.warn("[navi-prefs] gtag/dataLayer :", e);
            }

            showBanner(false);
            closeModal();
            showSavedToast();
        }

        // Confirmation brève après un choix enregistré.
        function showSavedToast() {
            const savedText = (typeof naviCookieConfig !== "undefined" && naviCookieConfig.savedText)
                ? naviCookieConfig.savedText
                : "Préférences enregistrées";
            const toast = document.createElement("div");
            toast.className = "navi-cookie-toast";
            toast.setAttribute("role", "status");
            toast.textContent = savedText;
            document.body.appendChild(toast);
            window.requestAnimationFrame(function () {
                toast.classList.add("navi-cookie-toast-visible");
            });
            setTimeout(function () {
                toast.classList.remove("navi-cookie-toast-visible");
                setTimeout(function () { toast.remove(); }, 300);
            }, 2200);
        }

        // --- Clics délégués (phase de capture sur document) -------------------
        // Un seul écouteur pour tous les boutons. La phase de capture permet
        // aussi, pour "Personnaliser" et le lien du footer, d'arrêter le clic
        // AVANT le gestionnaire "clic en dehors" du noyau (assets/js/core.js),
        // qui refermerait sinon la modale dans le clic même qui l'ouvre.
        document.addEventListener("click", function (event) {
            const target = event.target;
            if (!target || !target.closest) return;

            const el = target.closest(
                "#navi-cookie-btn-accepter, #navi-cookie-btn-refuser, #navi-cookie-btn-prefs, " +
                "#navi-cookie-btn-save-prefs, #navi-cookie-btn-close-modal, " +
                "#navi-cookie-modal-overlay .navi-cookie-modal-close, .navi-cookie-preferences-link"
            );
            if (!el) return;

            if (el.id === "navi-cookie-btn-accepter") {
                setConsent(1, 1);

            } else if (el.id === "navi-cookie-btn-refuser") {
                setConsent(0, 0);

            } else if (el.id === "navi-cookie-btn-prefs") {
                event.stopPropagation();
                showBanner(false);
                openModal(el);

            } else if (el.id === "navi-cookie-btn-save-prefs") {
                const chkStats = document.getElementById("navi-cookie-chk-stats");
                const chkMkt = document.getElementById("navi-cookie-chk-mkt");
                setConsent(chkStats && chkStats.checked ? 1 : 0, chkMkt && chkMkt.checked ? 1 : 0);

            } else if (el.id === "navi-cookie-btn-close-modal" || el.classList.contains("navi-cookie-modal-close")) {
                if (!hasConsent()) showBanner(true);
                closeModal();

            } else if (el.classList.contains("navi-cookie-preferences-link")) {
                // Lien [navi_cookie_preferences_link] posé dans le footer.
                event.preventDefault();
                event.stopPropagation();
                showBanner(false);
                openModal(el);
            }
        }, true);

        // Réouverture de la modale depuis l'icône 🍪 du bouton flottant (hub)
        document.addEventListener("navi:action", function (event) {
            if (event.detail && event.detail.action === "open-cookie-modal") {
                showBanner(false);
                openModal();
            }
        });

        // Le hub s'est refermé entièrement pendant que ce panneau était actif :
        // on remet à jour notre état sans redéclencher de fermeture.
        document.addEventListener("navi:closed", function (event) {
            if (event.detail && event.detail.id === "cookie-consent") {
                const modal = getModal();
                if (modal) modal.classList.remove("navi-cookie-modal-overlay-open");
                document.removeEventListener("keydown", handleModalKeydown);
            }
        });
    }

    // Démarre tout de suite si le DOM est déjà prêt, sinon à DOMContentLoaded.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", naviConsentInit);
    } else {
        naviConsentInit();
    }
})();
