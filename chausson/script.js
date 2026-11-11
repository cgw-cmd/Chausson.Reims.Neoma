/* =========================================================
   CHAUSSON REIMS — Chalkboard Decoder
   Bilingual (EN / FR) wipe-to-reveal menu

   - The wipe layer is TODAY'S REAL SLATE PHOTO (assets/board-today.jpg),
     falling back to a drawn chalkboard if the photo is missing
   - Pointer Events + coalesced events + rAF batching
     → silky wiping on iOS Safari & Android Chrome
   - HiDPI canvas (capped at 2x for performance)
   - Wipe progress tracked on a light grid (no pixel reads, so it also
     works when the page is opened straight from a folder)
   - Scratches are preserved when the screen resizes / rotates
   ========================================================= */
(function () {
    'use strict';

    /* -----------------------------------------------------
       1. DAILY CONTENT — update this block every morning
       -----------------------------------------------------
       1) Replace assets/board-today.jpg with the photo of today's slate
          (the IG story photo works; portrait photos fill the board best)
       2) Update MENU below. Codes come straight from the slate:
          'sg' = sans gluten (gluten-free), 'vg' = vegan
       3) price: number (e.g. 4.5) or null to hide it
       ----------------------------------------------------- */

    var MENU = {
        section: 'sweet',        // 'sweet' (Côté sucré) or 'savoury' (Côté salé)
        items: [
            {
                featured: true,
                price: null,
                codes: ['sg', 'vg'],
                en: {
                    name: 'The “Chausson”',
                    desc: 'Our namesake turnover — the house signature'
                },
                fr: {
                    name: 'Le « Chausson »',
                    desc: 'La pâtisserie qui a donné son nom à la maison'
                }
            },
            {
                price: null,
                codes: ['sg', 'vg'],
                en: { name: 'Cookie', desc: 'Homemade, baked every morning' },
                fr: { name: 'Cookie', desc: 'Fait maison, cuit chaque matin' }
            },
            {
                price: null,
                codes: ['sg', 'vg'],
                en: { name: 'Crumble', desc: 'Seasonal fruit under a crunchy topping' },
                fr: { name: 'Crumble', desc: 'Fruits de saison sous une pâte croustillante' }
            },
            {
                price: null,
                codes: ['vg'],
                en: { name: 'Cinnamon Rolls', desc: 'Soft, swirled, generously spiced' },
                fr: { name: 'Cinnamon rolls', desc: 'Brioches roulées à la cannelle' }
            },
            {
                price: null,
                codes: [],
                en: { name: 'Carrot Cake or Praline Cake', desc: 'Your pick — ask us which is out today' },
                fr: { name: 'Carrot cake ou cake praliné', desc: 'À vous de choisir — demandez-nous lequel est sorti' }
            }
        ],
        chefNote: {
            en: 'Gourmandise is meant to be shared!',
            fr: 'La gourmandise, ça se partage !'
        }
    };

    // Fallback drawing when no photo is available — copies the real slate's style
    var BOARD_SCRIBBLES = {
        title: 'Côté sucré',
        lines: [
            '* Cookie (SG-VG)',
            '* Crumble (SG-VG)',
            '* « Chausson » (SG-VG)',
            '* Cinnamon rolls (VG)',
            '* Carrot cake ou cake praliné'
        ]
    };

    // Interface strings
    var I18N = {
        en: {
            pageTitle: 'Chausson Reims — Chalkboard Decoder',
            eyebrow: 'Vegetarian tearoom & cantine · Reims',
            heroTitle: 'Today’s Slate',
            instruction: 'Chalked fresh every morning, in French. Wipe the slate with your finger to decode it.',
            ringText: 'WIPE ME · WIPE ME · WIPE ME · ',
            hintMain: '[ WIPE ME ]',
            hintSub: 'to decode today’s menu',
            decoded: 'Decoded!',
            revealBtn: 'Skip & reveal',
            resetBtn: 'Wipe again',
            shareBtn: 'Share the slate',
            sectionSweet: 'The Sweet Side',
            sectionSavoury: 'The Savoury Side',
            menuKicker: 'Decoded from today’s slate',
            chefPick: 'House signature',
            chefSign: 'Chausson motto',
            codeSg: 'SG · Gluten-free',
            codeVg: 'VG · Vegan',
            legendTitle: 'Slate code, decoded',
            legendSg: 'sans gluten → gluten-free',
            legendVg: 'vegan → no animal products',
            service: 'Eat in or take away',
            priceAsk: 'Ask us',
            perk1Title: '100% veggie',
            perk1Text: 'Homemade, local & seasonal',
            perk2Title: 'For everyone',
            perk2Text: 'Gluten-free & vegan options',
            perk3Title: '24h only',
            perk3Text: 'A new slate tomorrow',
            ctaTitle: 'Watch the chef chalk it live',
            igLink: '@chaussonreims on IG Stories',
            visitTitle: 'Come say bonjour',
            hours: 'Mon, Tue, Fri, Sat & Sun · 11:00–19:00',
            brunch: 'Weekend brunch · 11:00 or 13:30',
            footnote: 'Menu changes daily · Prices incl. VAT · Ask us about allergens',
            tagline: 'La gourmandise, ça se partage !',
            canvasLabel: 'Photo of today’s chalkboard, handwritten in French. Wipe to reveal the English menu.',
            shareTitle: 'Chausson Reims — today’s slate',
            shareText: 'I just decoded today’s secret menu at Chausson Reims 🧡 Can you wipe the slate too?',
            copied: 'Link copied — paste it anywhere!',
            copyFail: 'Copy this link: ',
            revealedToast: 'Bon appétit! 🌼',
            dateLocale: 'en-GB'
        },
        fr: {
            pageTitle: 'Chausson Reims — L’ardoise décodée',
            eyebrow: 'Salon de thé & cantine végétarienne · Reims',
            heroTitle: 'L’ardoise du jour',
            instruction: 'Écrite à la craie chaque matin. Effacez l’ardoise du bout du doigt pour découvrir le menu.',
            ringText: 'EFFACEZ-MOI · EFFACEZ-MOI · ',
            hintMain: '[ EFFACEZ-MOI ]',
            hintSub: 'pour découvrir le menu',
            decoded: 'Décodé !',
            revealBtn: 'Tout révéler',
            resetBtn: 'Recommencer',
            shareBtn: 'Partager l’ardoise',
            sectionSweet: 'Côté sucré',
            sectionSavoury: 'Côté salé',
            menuKicker: 'Tout droit sorti de l’ardoise',
            chefPick: 'La signature',
            chefSign: 'La devise Chausson',
            codeSg: 'SG · Sans gluten',
            codeVg: 'VG · Vegan',
            legendTitle: 'Le code de l’ardoise',
            legendSg: 'sans gluten',
            legendVg: 'vegan, 100 % végétal',
            service: 'Sur place et à emporter',
            priceAsk: 'Demandez-nous',
            perk1Title: '100% végé',
            perk1Text: 'Fait maison, local & de saison',
            perk2Title: 'Pour tous',
            perk2Text: 'Options sans gluten & vegan',
            perk3Title: '24 h seulement',
            perk3Text: 'Nouvelle ardoise demain',
            ctaTitle: 'Regardez le chef l’écrire en direct',
            igLink: '@chaussonreims en story IG',
            visitTitle: 'Passez nous dire bonjour',
            hours: 'Lun, mar, ven, sam & dim · 11h–19h',
            brunch: 'Brunch le week-end · 11h ou 13h30',
            footnote: 'Menu renouvelé chaque jour · Prix TTC · Allergènes : demandez-nous',
            tagline: 'La gourmandise, ça se partage !',
            canvasLabel: 'Photo de l’ardoise du jour, écrite à la main. Effacez-la pour révéler le menu.',
            shareTitle: 'Chausson Reims — l’ardoise du jour',
            shareText: 'Je viens de décoder le menu secret du jour chez Chausson Reims 🧡 À toi d’effacer l’ardoise !',
            copied: 'Lien copié — collez-le où vous voulez !',
            copyFail: 'Copiez ce lien : ',
            revealedToast: 'Bon appétit ! 🌼',
            dateLocale: 'fr-FR'
        }
    };

    /* -----------------------------------------------------
       2. CONFIG
       ----------------------------------------------------- */
    var CONFIG = {
        boardPhoto: 'assets/board-today.jpg',
        photoMinShare: 0.5,      // the photo fills at least 50% of the board height
        revealThreshold: 0.45,   // auto-reveal once 45% of the slate is wiped
        gridCols: 28,            // progress grid resolution
        maxDpr: 2,               // cap pixel density (3x phones = 9x the pixels)
        storageKey: 'chausson-lang'
    };

    /* -----------------------------------------------------
       3. DOM
       ----------------------------------------------------- */
    var els = {
        container: document.getElementById('scratch-container'),
        canvas: document.getElementById('scratch-canvas'),
        menu: document.getElementById('secret-menu'),
        progressBar: document.getElementById('progress-bar'),
        revealBtn: document.getElementById('reveal-btn'),
        resetBtn: document.getElementById('reset-btn'),
        shareBtn: document.getElementById('share-btn'),
        date: document.getElementById('today-date'),
        toast: document.getElementById('toast'),
        langBtns: document.querySelectorAll('.lang-btn')
    };

    if (!els.canvas || !els.container) return;

    var ctx = els.canvas.getContext('2d');

    var state = {
        lang: 'en',
        revealed: false,
        hasStarted: false
    };

    // Board photo
    var photo = new Image();
    var photoReady = false;

    // Canvas metrics (CSS pixels)
    var cssW = 0;
    var cssH = 0;
    var dpr = 1;
    var brush = 34;

    // Progress grid (normalized, survives resizes)
    var grid = null;
    var gridCols = CONFIG.gridCols;
    var gridRows = 1;
    var gridCleared = 0;

    // Pointer state
    var drawing = false;
    var activePointer = null;
    var rect = null;
    var lastDrawn = null;
    var pending = [];
    var rafId = 0;
    var toastTimer = 0;
    var expandTimer = 0;

    /* -----------------------------------------------------
       4. HELPERS
       ----------------------------------------------------- */
    function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    }

    // Seeded PRNG → identical chalk texture after a resize redraw
    function mulberry32(seed) {
        return function () {
            seed |= 0;
            seed = (seed + 0x6D2B79F5) | 0;
            var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function todaySeed() {
        var d = new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    function formatPrice(value, lang) {
        var fixed = value.toFixed(2);
        return (lang === 'fr' ? fixed.replace('.', ',') : fixed) + ' €';
    }

    function storageGet(key) {
        try { return window.localStorage.getItem(key); } catch (e) { return null; }
    }

    function storageSet(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
    }

    function detectLang() {
        var stored = storageGet(CONFIG.storageKey);
        if (stored === 'en' || stored === 'fr') return stored;
        var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
        return nav.toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en';
    }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function showToast(message) {
        els.toast.textContent = message;
        els.toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            els.toast.classList.remove('is-visible');
        }, 2600);
    }

    function vibrate(pattern) {
        if (navigator.vibrate) {
            try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
        }
    }

    /* -----------------------------------------------------
       5. MENU RENDERING (both languages, stacked in one grid cell)
       ----------------------------------------------------- */
    function buildPanel(lang) {
        var t = I18N[lang];
        var panel = el('div', 'menu-panel');
        panel.setAttribute('data-lang-panel', lang);
        panel.setAttribute('lang', lang);

        // Header
        var head = el('div', 'menu-head');
        var pie = el('img', 'menu-pie');
        pie.src = 'assets/chausson-pie.png';
        pie.alt = '';
        pie.width = 56;
        pie.height = 56;
        head.appendChild(pie);
        head.appendChild(el('h3', 'menu-heading', MENU.section === 'savoury' ? t.sectionSavoury : t.sectionSweet));
        head.appendChild(el('p', 'menu-kicker', t.menuKicker));
        panel.appendChild(head);

        // Items
        var list = el('ul', 'menu-list');
        MENU.items.forEach(function (item) {
            var copy = item[lang];
            var li = el('li', 'menu-item' + (item.featured ? ' is-featured' : ''));

            if (item.featured) {
                li.appendChild(el('span', 'featured-badge', '♥ ' + t.chefPick));
            }

            var row = el('div', 'menu-row');
            row.appendChild(el('p', 'menu-item-name', copy.name));
            if (typeof item.price === 'number') {
                row.appendChild(el('p', 'menu-item-price', formatPrice(item.price, lang)));
            }
            li.appendChild(row);

            if (copy.desc) li.appendChild(el('p', 'menu-item-desc', copy.desc));

            if (item.codes && item.codes.length) {
                var tags = el('div', 'menu-tags');
                item.codes.forEach(function (code) {
                    if (code === 'sg') tags.appendChild(el('span', 'tag tag--gf', t.codeSg));
                    if (code === 'vg') tags.appendChild(el('span', 'tag tag--vegan', t.codeVg));
                });
                li.appendChild(tags);
            }

            list.appendChild(li);
        });
        panel.appendChild(list);

        // Legend: decodes the abbreviations used on the real slate
        var legend = el('div', 'menu-legend');
        legend.appendChild(el('p', 'legend-title', t.legendTitle));
        [['SG', t.legendSg], ['VG', t.legendVg]].forEach(function (pair) {
            var row = el('p', 'legend-row');
            row.appendChild(el('span', 'legend-code', pair[0]));
            row.appendChild(el('span', null, '= ' + pair[1]));
            legend.appendChild(row);
        });
        panel.appendChild(legend);

        panel.appendChild(el('p', 'menu-service', t.service));

        if (MENU.chefNote && MENU.chefNote[lang]) {
            var note = el('p', 'chef-note', MENU.chefNote[lang]);
            note.appendChild(el('small', null, t.chefSign));
            panel.appendChild(note);
        }

        return panel;
    }

    function renderMenus() {
        els.menu.textContent = '';
        els.menu.appendChild(buildPanel('en'));
        els.menu.appendChild(buildPanel('fr'));
    }

    /* -----------------------------------------------------
       6. LANGUAGE
       ----------------------------------------------------- */
    function renderDate(lang) {
        try {
            var str = new Intl.DateTimeFormat(I18N[lang].dateLocale, {
                weekday: 'long', day: 'numeric', month: 'long'
            }).format(new Date());
            els.date.textContent = str.charAt(0).toUpperCase() + str.slice(1);
        } catch (e) {
            els.date.textContent = new Date().toDateString();
        }
    }

    function applyLanguage(lang) {
        if (!I18N[lang]) lang = 'en';
        state.lang = lang;
        var t = I18N[lang];

        document.documentElement.lang = lang;
        document.title = t.pageTitle;

        var nodes = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < nodes.length; i++) {
            var key = nodes[i].getAttribute('data-i18n');
            if (t[key] != null) nodes[i].textContent = t[key];
        }

        var panels = els.menu.querySelectorAll('.menu-panel');
        for (var p = 0; p < panels.length; p++) {
            var active = panels[p].getAttribute('data-lang-panel') === lang;
            panels[p].classList.toggle('is-active', active);
            panels[p].setAttribute('aria-hidden', active ? 'false' : 'true');
        }

        for (var b = 0; b < els.langBtns.length; b++) {
            var btn = els.langBtns[b];
            btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
        }

        els.canvas.setAttribute('aria-label', t.canvasLabel);
        renderDate(lang);
        storageSet(CONFIG.storageKey, lang);
    }

    /* -----------------------------------------------------
       7. SLATE PAINTING
       ----------------------------------------------------- */
    function paintTexture(rand, w, h) {
        // Charcoal slate, like Chausson's real board
        var base = ctx.createLinearGradient(0, 0, w, h);
        base.addColorStop(0, '#45474a');
        base.addColorStop(0.5, '#3b3d3f');
        base.addColorStop(1, '#313335');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);

        // Cloudy residue from yesterday's wiping
        for (var i = 0; i < 16; i++) {
            var cx = rand() * w;
            var cy = rand() * h;
            var r = (0.15 + rand() * 0.35) * w;
            var cloud = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            cloud.addColorStop(0, 'rgba(255,255,255,' + (0.03 + rand() * 0.05).toFixed(3) + ')');
            cloud.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = cloud;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }

        // Old eraser arcs
        ctx.lineCap = 'round';
        for (var a = 0; a < 6; a++) {
            ctx.strokeStyle = 'rgba(255,255,255,' + (0.02 + rand() * 0.03).toFixed(3) + ')';
            ctx.lineWidth = 26 + rand() * 40;
            ctx.beginPath();
            ctx.arc(rand() * w, rand() * h, 40 + rand() * w * 0.5, rand() * Math.PI * 2, rand() * Math.PI * 2);
            ctx.stroke();
        }

        // Chalk dust specks
        var specks = Math.round((w * h) / 70);
        for (var s = 0; s < specks; s++) {
            ctx.fillStyle = 'rgba(255,255,255,' + (rand() * 0.13).toFixed(3) + ')';
            ctx.fillRect(rand() * w, rand() * h, rand() < 0.92 ? 1 : 2, 1 + (rand() < 0.5 ? 1 : 0));
        }
    }

    function chalkText(text, x, y, size, color, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation || 0);
        ctx.font = '700 ' + size + 'px "Caveat", "Segoe Script", "Bradley Hand", cursive';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.shadowColor = 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 3;
        ctx.fillStyle = color;
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    // Fallback handwriting, in the style of the real slate
    function drawScribbles(rand, w, h, top) {
        var pad = w * 0.08;
        var titleSize = clamp(w * 0.12, 32, 52);
        var lineSize = clamp(w * 0.07, 20, 30);
        var y = top + titleSize * 1.2;

        // Pink chalk title + underline (like "Côté sucré" on the real board)
        chalkText(BOARD_SCRIBBLES.title, pad, y, titleSize, 'rgba(236,170,186,0.9)', -0.02);
        ctx.save();
        ctx.strokeStyle = 'rgba(236,170,186,0.75)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pad, y + 14);
        ctx.quadraticCurveTo(w * 0.3, y + 18, w * 0.62, y + 12);
        ctx.stroke();
        ctx.restore();

        var step = lineSize * 1.6;
        y += titleSize * 0.6 + step;
        for (var i = 0; i < BOARD_SCRIBBLES.lines.length; i++) {
            chalkText(BOARD_SCRIBBLES.lines[i], pad * 0.6, y, lineSize, 'rgba(246,244,238,0.82)', (rand() - 0.5) * 0.04);
            y += step;
        }
    }

    // "Sur place et à emporter" circle doodle, like the real board's corner
    function drawServiceDoodle(w, y) {
        ctx.save();
        ctx.strokeStyle = 'rgba(246,244,238,0.4)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(w * 1.02, y, w * 0.32, Math.PI * 0.62, Math.PI * 1.38);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.font = '700 ' + clamp(w * 0.05, 15, 20) + 'px "Caveat", cursive';
        ctx.fillStyle = 'rgba(246,244,238,0.6)';
        ctx.textAlign = 'right';
        ctx.fillText('SUR PLACE', w - 14, y - 14);
        ctx.fillText('et à emporter', w - 14, y + 10);
        ctx.restore();
    }

    // Draw the photo at the top, at least CONFIG.photoMinShare of the height,
    // anchored left (that's where the slate's text starts), fading into texture
    function drawPhoto(w, h) {
        var iw = photo.naturalWidth;
        var ih = photo.naturalHeight;
        var scale = Math.max(w / iw, (h * CONFIG.photoMinShare) / ih);
        var dw = iw * scale;
        var dh = ih * scale;

        if (dh >= h) {
            // Portrait photo: plain cover fill, top-left anchored
            ctx.drawImage(photo, 0, 0, dw, dh);
            return h;
        }

        // Landscape photo: draw on a buffer, feather its bottom edge
        var buf = document.createElement('canvas');
        buf.width = Math.ceil(w * dpr);
        buf.height = Math.ceil(dh * dpr);
        var bctx = buf.getContext('2d');
        bctx.scale(dpr, dpr);
        bctx.drawImage(photo, 0, 0, dw, dh);
        bctx.globalCompositeOperation = 'destination-in';
        var fade = bctx.createLinearGradient(0, dh * 0.72, 0, dh);
        fade.addColorStop(0, 'rgba(0,0,0,1)');
        fade.addColorStop(1, 'rgba(0,0,0,0)');
        bctx.fillStyle = fade;
        bctx.fillRect(0, 0, w, dh);

        ctx.drawImage(buf, 0, 0, w, dh);
        return dh;
    }

    function paintSlate() {
        var w = cssW;
        var h = cssH;
        var rand = mulberry32(todaySeed());

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        paintTexture(rand, w, h);

        if (photoReady) {
            var used = drawPhoto(w, h);
            if (used < h) drawServiceDoodle(w, used + (h - used) * 0.12);
            els.container.classList.add('has-photo');
        } else {
            drawScribbles(rand, w, h, h * 0.04);
            els.container.classList.remove('has-photo');
        }

        ctx.restore();
    }

    /* -----------------------------------------------------
       8. PROGRESS GRID
       ----------------------------------------------------- */
    function resetGrid() {
        gridRows = Math.max(1, Math.round(gridCols * (cssH / cssW)));
        grid = new Uint8Array(gridCols * gridRows);
        gridCleared = 0;
    }

    function markCircle(x, y, r) {
        if (!grid) return;
        var cw = cssW / gridCols;
        var ch = cssH / gridRows;
        var c0 = Math.max(0, Math.floor((x - r) / cw));
        var c1 = Math.min(gridCols - 1, Math.floor((x + r) / cw));
        var r0 = Math.max(0, Math.floor((y - r) / ch));
        var r1 = Math.min(gridRows - 1, Math.floor((y + r) / ch));
        var rr = r * r;
        for (var row = r0; row <= r1; row++) {
            var cy = (row + 0.5) * ch - y;
            for (var col = c0; col <= c1; col++) {
                var cx = (col + 0.5) * cw - x;
                if (cx * cx + cy * cy <= rr) {
                    var idx = row * gridCols + col;
                    if (!grid[idx]) {
                        grid[idx] = 1;
                        gridCleared++;
                    }
                }
            }
        }
    }

    function markSegment(a, b) {
        var r = brush * 0.5;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var steps = Math.max(1, Math.ceil(dist / (r * 0.5)));
        for (var i = 0; i <= steps; i++) {
            markCircle(a.x + (dx * i) / steps, a.y + (dy * i) / steps, r);
        }
    }

    function updateProgress() {
        if (!grid || state.revealed) return;
        var ratio = gridCleared / grid.length;
        var shown = clamp(ratio / CONFIG.revealThreshold, 0, 1);
        els.progressBar.style.transform = 'scaleX(' + shown.toFixed(3) + ')';
        if (ratio >= CONFIG.revealThreshold) reveal();
    }

    /* -----------------------------------------------------
       9. CANVAS SIZING (preserves scratches on resize)
       ----------------------------------------------------- */
    function sizeCanvas(force) {
        var box = els.container.getBoundingClientRect();
        var w = Math.round(box.width);
        var h = Math.round(box.height);
        if (!w || !h) return;
        if (!force && w === cssW && h === cssH) return;

        var snapshot = null;
        if (!force && cssW > 0 && state.hasStarted && !state.revealed) {
            snapshot = document.createElement('canvas');
            snapshot.width = els.canvas.width;
            snapshot.height = els.canvas.height;
            snapshot.getContext('2d').drawImage(els.canvas, 0, 0);
        }

        dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
        cssW = w;
        cssH = h;
        els.canvas.width = Math.round(w * dpr);
        els.canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        brush = clamp(w * 0.12, 32, 60);

        if (state.revealed) {
            ctx.clearRect(0, 0, w, h);
            return;
        }

        if (!snapshot) resetGrid();   // keep progress when only resizing

        paintSlate();

        if (snapshot) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(snapshot, 0, 0, els.canvas.width, els.canvas.height);
            ctx.restore();
        }
    }

    var resizeQueued = false;
    function queueResize() {
        if (resizeQueued) return;
        resizeQueued = true;
        requestAnimationFrame(function () {
            resizeQueued = false;
            if (!state.revealed) sizeCanvas(false);
        });
    }

    /* -----------------------------------------------------
       10. WIPING
       ----------------------------------------------------- */
    function toLocal(e) {
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function startScratching() {
        if (state.hasStarted) return;
        state.hasStarted = true;
        els.container.classList.add('is-scratching');
        vibrate(8);
    }

    function strokeSegment(points, from) {
        // Soft dusty edge + solid core → feels like a real felt eraser
        var passes = [
            { width: brush * 1.35, alpha: 0.35 },
            { width: brush, alpha: 1 }
        ];
        for (var p = 0; p < passes.length; p++) {
            ctx.lineWidth = passes[p].width;
            ctx.strokeStyle = 'rgba(0,0,0,' + passes[p].alpha + ')';
            ctx.beginPath();
            var start = from || points[0];
            ctx.moveTo(start.x, start.y);
            if (!from) ctx.lineTo(start.x + 0.01, start.y); // single tap → round dot
            for (var i = 0; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        }
    }

    function flush() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
        if (!pending.length) return;

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        strokeSegment(pending, lastDrawn);
        ctx.restore();

        var prev = lastDrawn || pending[0];
        for (var i = 0; i < pending.length; i++) {
            markSegment(prev, pending[i]);
            prev = pending[i];
        }

        lastDrawn = pending[pending.length - 1];
        pending.length = 0;
        updateProgress();
    }

    function scheduleFlush() {
        if (!rafId) rafId = requestAnimationFrame(flush);
    }

    function onPointerDown(e) {
        if (state.revealed || drawing) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        drawing = true;
        activePointer = e.pointerId;
        rect = els.canvas.getBoundingClientRect();
        lastDrawn = null;
        try { els.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }

        startScratching();
        pending.push(toLocal(e));
        scheduleFlush();
        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!drawing || e.pointerId !== activePointer) return;

        // Coalesced events = every touch sample between frames → no jagged gaps
        var list = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null;
        if (list && list.length) {
            for (var i = 0; i < list.length; i++) pending.push(toLocal(list[i]));
        } else {
            pending.push(toLocal(e));
        }
        scheduleFlush();
        e.preventDefault();
    }

    function onPointerUp(e) {
        if (e.pointerId !== activePointer) return;
        flush();
        drawing = false;
        activePointer = null;
        lastDrawn = null;
        try { els.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }

    /* -----------------------------------------------------
       11. REVEAL & RESET
       ----------------------------------------------------- */
    function reveal() {
        if (state.revealed) return;
        state.revealed = true;
        drawing = false;
        activePointer = null;
        pending.length = 0;

        els.progressBar.style.transform = 'scaleX(1)';
        els.container.classList.add('is-scratching', 'is-revealed');
        els.revealBtn.classList.add('is-hidden');
        els.resetBtn.classList.remove('is-hidden');

        vibrate([12, 50, 20]);
        showToast(I18N[state.lang].revealedToast);

        // Let the slate fade out, then grow the card to show the full menu
        clearTimeout(expandTimer);
        expandTimer = setTimeout(function () {
            if (!state.revealed) return;
            ctx.clearRect(0, 0, cssW, cssH);
            els.container.classList.add('is-expanded');
        }, 700);
    }

    function resetBoard() {
        clearTimeout(expandTimer);
        state.revealed = false;
        state.hasStarted = false;
        lastDrawn = null;
        pending.length = 0;

        els.container.classList.remove('is-revealed', 'is-scratching', 'is-expanded');
        els.progressBar.style.transform = 'scaleX(0)';
        els.resetBtn.classList.add('is-hidden');
        els.revealBtn.classList.remove('is-hidden');

        sizeCanvas(true);
        els.container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* -----------------------------------------------------
       12. SHARE
       ----------------------------------------------------- */
    function share() {
        var t = I18N[state.lang];
        var url = window.location.href;

        if (navigator.share) {
            navigator.share({ title: t.shareTitle, text: t.shareText, url: url })
                .catch(function () { /* user cancelled */ });
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
                .then(function () { showToast(t.copied); })
                .catch(function () { showToast(t.copyFail + url); });
            return;
        }

        showToast(t.copyFail + url);
    }

    /* -----------------------------------------------------
       13. EVENTS & INIT
       ----------------------------------------------------- */
    function bindEvents() {
        var c = els.canvas;

        if (window.PointerEvent) {
            c.addEventListener('pointerdown', onPointerDown, { passive: false });
            c.addEventListener('pointermove', onPointerMove, { passive: false });
            c.addEventListener('pointerup', onPointerUp);
            c.addEventListener('pointercancel', onPointerUp);
            c.addEventListener('lostpointercapture', onPointerUp);

            // iPhone Safari ignores `touch-action: none`, so the page would scroll while
            // wiping. Cancelling the touch events stops the scroll; pointer events still fire.
            var blockScroll = function (e) {
                if (!state.revealed && e.cancelable) e.preventDefault();
            };
            c.addEventListener('touchstart', blockScroll, { passive: false });
            c.addEventListener('touchmove', blockScroll, { passive: false });
        } else {
            // Legacy fallback (very old iOS) — map touch to the same handlers
            var wrap = function (handler) {
                return function (e) {
                    var touch = e.changedTouches[0];
                    handler({
                        pointerId: 1,
                        pointerType: 'touch',
                        button: 0,
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        preventDefault: function () { e.preventDefault(); }
                    });
                };
            };
            c.addEventListener('touchstart', wrap(onPointerDown), { passive: false });
            c.addEventListener('touchmove', wrap(onPointerMove), { passive: false });
            c.addEventListener('touchend', wrap(onPointerUp));
            c.addEventListener('touchcancel', wrap(onPointerUp));
        }

        c.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        c.addEventListener('dragstart', function (e) { e.preventDefault(); });

        els.revealBtn.addEventListener('click', reveal);
        els.resetBtn.addEventListener('click', resetBoard);
        els.shareBtn.addEventListener('click', share);

        for (var i = 0; i < els.langBtns.length; i++) {
            els.langBtns[i].addEventListener('click', function () {
                applyLanguage(this.getAttribute('data-lang'));
            });
        }

        if ('ResizeObserver' in window) {
            new ResizeObserver(queueResize).observe(els.container);
        } else {
            window.addEventListener('resize', queueResize);
        }
        window.addEventListener('orientationchange', function () {
            setTimeout(queueResize, 250);
        });
    }

    function repaintIfUntouched() {
        if (!state.hasStarted && !state.revealed) sizeCanvas(true);
    }

    function loadPhoto() {
        if (!CONFIG.boardPhoto) return;
        photo.decoding = 'async';
        photo.onload = function () {
            photoReady = photo.naturalWidth > 0;
            repaintIfUntouched();
        };
        photo.onerror = function () {
            photoReady = false;   // keep the drawn fallback slate
        };
        photo.src = CONFIG.boardPhoto;
    }

    function init() {
        renderMenus();
        applyLanguage(detectLang());
        bindEvents();
        sizeCanvas(true);
        loadPhoto();

        // Repaint once the handwriting font arrives (fallback slate only)
        if (document.fonts && document.fonts.load) {
            document.fonts.load('700 32px "Caveat"').then(repaintIfUntouched).catch(function () {});
            if (document.fonts.addEventListener) {
                document.fonts.addEventListener('loadingdone', repaintIfUntouched);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
