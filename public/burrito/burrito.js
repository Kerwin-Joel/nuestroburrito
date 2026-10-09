// Burrito para la app nativa (WebView). Generado a partir de design/burrito-personaje.html:
// mismo modelo, animaciones y expresiones; aquí sin isla, con fondo transparente
// y una sombra suave. Parámetros: ?v=B|C  &a=wave,idle  (acciones en secuencia; la última se repite).
import * as THREE from './three.module.min.js';

// La vista previa usaba three r128, donde los colores de las luces no se convertían
// de sRGB: con la conversión activa el sol cálido salía rojo saturado.
THREE.ColorManagement.enabled = false;

  const C = {
    fur: '#D9A46E', furD: '#B98352', furL: '#EBC08C', muzzle: '#F0D2A4', bridge: '#9C6238', dark: '#3E2213', eye: '#1E0F07',
    hat: '#7A3D1B', hatD: '#5A2A11', hatL: '#8E4B24', mane: '#4F2A16', hoof: '#2B1A10', tongue: '#D9695F', earIn: '#E8A98C',
    mouth: '#5E2019', white: '#FFFFFF', blush: '#F09A86', nostril: '#8A5230',
    orange: '#FF5500', orangeD: '#C94200', cream: '#F7E7C9', bag: '#D06818', bagD: '#8A3A08', gold: '#F2C14E',
  };

  const OPTIONS = {
    A: { chibi: false, acc: false,
      how: 'Las proporciones del burro de Minecraft: cabeza con hocico, cuello con crin de un bloque, cuerpo largo y cuatro patas rectas sin rodilla.',
      where: 'Home, splash y el mapa: se luce caminando o corriendo en pantallas grandes.',
      care: 'Es el más fiel al juego; a 40 px la cara pierde detalle y conviene la B.' },
    B: { chibi: true, acc: false,
      how: 'Como los mobs bebé del juego: cabeza grande, cuerpo corto y patas cortas. Mismo sombrero, misma piel pixelada.',
      where: 'Cargas, estados vacíos, notificaciones y stickers: se reconoce aunque sea diminuto.',
      care: 'Más tierno que épico: correr y ponerse en 2 patas se leen graciosos.' },
    C: { chibi: false, acc: true,
      how: 'El clásico con chalina naranja, manta tejida al estilo Catacaos y tus alforjas naranjas con hebillas doradas, donde guarda lo que recoge.',
      where: 'Tienda, pasaporte y beneficios: el burrito que carga tus cosas por Piura.',
      care: 'Más bloques de accesorios: a tamaño chico la manta se vuelve ruido.' },
  };

  // ── Texturas pixeladas con paleta discreta (como las skins del juego) ──
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const tone = (hex, f) => { const [r, g, b] = rgb(hex); return `rgb(${Math.min(255, r * f) | 0},${Math.min(255, g * f) | 0},${Math.min(255, b * f) | 0})`; };
  const TONES = [0.97, 1, 1, 1.03];
  function faceTex(hex, w, h, painter) {
    const cw = Math.max(1, Math.round(w)), ch = Math.max(1, Math.round(h));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      ctx.fillStyle = tone(hex, TONES[(rand() * TONES.length) | 0]);
      ctx.fillRect(x, y, 1, 1);
    }
    if (painter) painter(ctx, cw, ch);
    const t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const px = (ctx, x, y, col, w = 1, h = 1) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  // Caras de BoxGeometry: 0 +x, 1 -x, 2 +y (arriba), 3 -y (abajo), 4 +z (frente), 5 -z (atrás).
  // En las caras laterales la columna 0 del lienzo es: +x → el frente; -x → la parte de atrás.
  function box(w, h, d, color, paint) {
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    const mats = dims.map((dm, i) => new THREE.MeshStandardMaterial({ map: faceTex(color, dm[0], dm[1], paint && paint(i, dm[0], dm[1])), roughness: 0.85 }));
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  const allFaces = painter => () => painter;
  const woven = cols => (ctx, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(ctx, x, y, (x + (y % 2)) % 4 === 0 ? C.cream : cols[y % cols.length]);
  };
  const frontCol = (face, w, k) => face === 0 ? k : w - 1 - k;   // columna "k desde el frente" en caras laterales

  // ── El burrito ──
  function buildBurrito(o) {
    seed = 11;
    const K = o.chibi
      ? { legW: 3, legH: 7, body: [8, 7, 11], neck: [4, 3, 4], cran: [9, 8, 8], snout: [7, 5, 5], jaw: [6, 2, 5], ear: [2, 6, 1], brim: [14, 1, 14], crown: [8, 4, 8], neckBase: 0.2, headBase: -0.2, eye: 2 }
      : { legW: 4, legH: 13, body: [10, 10, 18], neck: [5, 11, 6], cran: [7, 7, 7], snout: [6, 5, 6], jaw: [5, 2, 6], ear: [2, 6, 1], brim: [12, 1, 13], crown: [7, 3, 7], neckBase: 0.45, headBase: -0.3, eye: 2 };
    const R = { K };
    const root = new THREE.Group(), lift = new THREE.Group(); root.add(lift);
    const legH = K.legH;
    const [bw, bh, bd] = K.body, [nw, nh, nd] = K.neck, [cw, ch, cd] = K.cran, [sw, sh, sd] = K.snout, [jw, jh, jd] = K.jaw;
    const zl = bd / 2 - K.legW / 2 - 1, lx = bw / 2 - K.legW / 2 - (o.chibi ? 0.5 : 1);

    // Pata de un solo bloque, con la pezuña y la caña más oscura pintadas.
    const legPaint = (f, w, h) => (ctx) => {
      if (f === 3) { px(ctx, 0, 0, C.hoof, w, h); return; }
      if (f === 2) return;
      for (let y = Math.round(h * 0.55); y < h; y++) for (let x = 0; x < w; x++) px(ctx, x, y, tone(C.furD, TONES[(rand() * TONES.length) | 0]));
      px(ctx, 0, h - 2, C.hoof, w, 2);
    };
    function leg(x, z, parent, y) {
      const hip = new THREE.Group(); hip.position.set(x, y, z);
      const lb = box(K.legW, legH, K.legW, C.fur, legPaint); lb.position.y = -legH / 2; hip.add(lb);
      const knee = new THREE.Group(); hip.add(knee);
      parent.add(hip); return { hip, knee };
    }
    R.bl = leg(lx, -zl, lift, legH); R.br = leg(-lx, -zl, lift, legH);

    const torso = new THREE.Group(); torso.position.set(0, legH, -zl); lift.add(torso); R.torso = torso;
    const bodyG = new THREE.Group(); bodyG.position.set(0, bh / 2 - 1, zl); torso.add(bodyG); R.body = bodyG;
    bodyG.add(box(bw, bh, bd, C.fur, (f, w, h) => (ctx) => {
      if (f === 2) { const c0 = Math.floor(w / 2) - 1; for (let y = 0; y < h; y++) px(ctx, c0, y, C.mane, 2, 1); }  // raya dorsal
      if (f === 3) for (let y = 0; y < h; y++) for (let x = 1; x < w - 1; x++) px(ctx, x, y, tone(C.furL, TONES[(rand() * TONES.length) | 0]));
      if (f === 0 || f === 1) for (let x = 0; x < w; x++) px(ctx, x, h - 1, C.furL);
    }));
    R.fl = leg(lx, 2 * zl, torso, 0); R.fr = leg(-lx, 2 * zl, torso, 0);

    // Cuello con la crin de un solo bloque, como el caballo del juego
    const neck = new THREE.Group(); neck.position.set(0, bh - 4, zl + bd / 2 - nd / 2); torso.add(neck); R.neck = neck;
    const nb = box(nw, nh, nd, C.fur); nb.position.y = nh / 2; neck.add(nb);
    const mane = box(2, nh + (o.chibi ? 1 : 2), 2, C.mane); mane.position.set(0, nh / 2 + 0.5, -nd / 2 - 1); neck.add(mane);

    // Cabeza
    const head = new THREE.Group(); head.position.set(0, nh - 1, 0.5); neck.add(head); R.head = head;
    const cz = cd / 2 - 3, zFront = cd - 3;
    // Los ojos y la boca NO van pintados en la piel: van en una capa de
    // expresión encima (ver setExpression), para que cambien según la situación.
    const cran = box(cw, ch, cd, C.fur, (f, w, h) => (ctx) => {
      if (f === 4) {                                  // mechón en la frente
        const mx = Math.floor(w / 2);
        [[mx - 2, 0], [mx - 1, 0], [mx, 0], [mx + 1, 0], [mx - 1, 1], [mx, 1], [mx - 2, 1]].forEach(([x, y]) => px(ctx, x, y, C.mane));
      }
    });
    cran.position.set(0, ch / 2 - 1, cz); head.add(cran);
    const yb = -2;
    const snoutZ = zFront - 1 + sd / 2, snoutFront = zFront - 1 + sd;
    const snout = box(sw, sh, sd, C.muzzle, (f, w, h) => (ctx) => {
      if (f === 2) { px(ctx, 0, 0, C.bridge, w, h); for (let x = 0; x < w; x++) if (rand() > 0.6) px(ctx, x, (rand() * h) | 0, tone(C.bridge, 0.88)); }
      if (f === 4) {                                  // puente y fosas nasales (la boca va en la capa de expresión)
        px(ctx, 0, 0, C.bridge, w, 2);
        // Fosas en marrón cálido, no negro: en oscuro se leían como un segundo par de ojos.
        px(ctx, 1, 2, C.nostril, 1, 1); px(ctx, w - 2, 2, C.nostril, 1, 1);
      }
      if (f === 0 || f === 1) px(ctx, 0, 0, C.bridge, w, 1);
    });
    snout.position.set(0, yb + sh / 2, snoutZ); head.add(snout);

    // Capa de expresión: un plano finísimo sobre cada costado de la cabeza
    // (ojos, ceja, cachete) y otro sobre el frente del hocico (boca).
    const decalMat = () => new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.5, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 });
    R.eyeDecals = [1, -1].map(s => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(cd, ch), decalMat());
      m.position.set(s * (cw / 2 + 0.03), ch / 2 - 1, cz); m.rotation.y = s * Math.PI / 2;
      m.userData = { face: s > 0 ? 0 : 1, w: cd, h: ch }; head.add(m); return m;
    });
    R.mouthDecal = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), decalMat());
    R.mouthDecal.position.set(0, yb + sh / 2, snoutFront + 0.03);
    R.mouthDecal.userData = { w: sw, h: sh }; head.add(R.mouthDecal);
    R.expr = null;
    const cavity = box(sw - 2, 1, sd - 2, C.mouth); cavity.position.set(0, yb + 0.4, snoutZ - 0.4); head.add(cavity);
    const jaw = new THREE.Group(); jaw.position.set(0, yb, zFront - 1); head.add(jaw); R.jaw = jaw;
    const jb = box(jw, jh, jd, C.muzzle, (f, w, h) => (ctx) => { if (f === 2) { px(ctx, 0, 0, C.mouth, w, h); px(ctx, Math.floor(w / 2) - 1, 1, C.tongue, 2, Math.max(1, h - 2)); } });
    jb.position.set(0, -jh / 2, jd / 2); jaw.add(jb);

    // Orejas: parte interna rosada y punta oscura pintadas
    const [ew, eh, ed] = K.ear;
    const earPaint = (f, w, h) => (ctx) => {
      px(ctx, 0, 0, C.dark, w, 1);
      if (f === 4) for (let y = 1; y < h - 1; y++) px(ctx, Math.floor(w / 2) - (w > 2 ? 1 : 0), y, C.earIn, w > 2 ? 2 : 1, 1);
    };
    const ears = [1, -1].map(s => {
      const p = new THREE.Group(); p.position.set(s * (cw / 2 - 1.5), ch - 1, -1.5);
      const eb = box(ew, eh, ed, C.fur, earPaint); eb.position.y = eh / 2; p.add(eb);
      head.add(p); return { g: p, side: s };
    });
    R.ears = ears;
    // Sombrero de bloques
    const hat = new THREE.Group(); hat.position.set(0, ch - 1 + 0.5, cz + 0.5); hat.rotation.z = 0.08; head.add(hat); R.hat = hat;
    const [bw2, bh2, bd2] = K.brim, [crw, crh, crd] = K.crown;
    hat.add(box(bw2, bh2, bd2, C.hat, (f, w, h) => (ctx) => { if (f === 2) { for (let x = 0; x < w; x++) { px(ctx, x, 0, C.hatL); px(ctx, x, h - 1, C.hatD); } } }));
    const band = box(crw + 0.2, 1, crd + 0.2, o.acc ? C.orange : C.hatD); band.position.set(0, bh2 / 2 + 0.5, 0.5); hat.add(band);
    const crown = box(crw, crh, crd, C.hat, (f, w, h) => (ctx) => { if (f === 2) px(ctx, 1, 1, C.hatD, w - 2, h - 2); if (f < 2 || f > 3) px(ctx, 0, 0, C.hatL, w, 1); });
    crown.position.set(0, bh2 / 2 + 1 + crh / 2, 0.5); hat.add(crown);

    // Cola con mechón
    const tail = new THREE.Group(); tail.position.set(0, bh - 3, zl - bd / 2); torso.add(tail); R.tail = tail;
    const tb = box(2, o.chibi ? 3 : 5, 2, C.fur); tb.position.set(0, -(o.chibi ? 1.5 : 2.5), -1); tail.add(tb);
    const tuftJ = new THREE.Group(); tuftJ.position.set(0, -(o.chibi ? 3 : 5), -1); tail.add(tuftJ); R.tuft = tuftJ;
    const tuft = box(3, o.chibi ? 3 : 4, 3, C.mane); tuft.position.y = -(o.chibi ? 1.5 : 2); tuftJ.add(tuft);

    if (o.acc) {
      const scarf = box(nw + 2, 2, nd + 2, C.orange, allFaces(woven([C.orange, C.orange, C.orangeD]))); scarf.position.y = 2; neck.add(scarf);
      const knot = box(2, 4, 1, C.orange, allFaces(woven([C.orange, C.orangeD]))); knot.position.set(1, -0.5, nd / 2 + 1.5); neck.add(knot); R.knot = knot;
      const blanket = box(bw + 1, 1, 10, C.orange, allFaces(woven([C.orange, C.hat, C.gold, C.orangeD]))); blanket.position.set(0, bh / 2 + 0.5, -1); bodyG.add(blanket);
      const strap = box(bw + 0.6, 1, 2, C.bagD); strap.position.set(0, -bh / 2 - 0.3, -1); bodyG.add(strap);
      R.bags = [1, -1].map(s => {
        const g = new THREE.Group(); g.position.set(s * (bw / 2 + 1.5), -1, -1); bodyG.add(g);
        g.add(box(3, 6, 7, C.bag, (f, w, h) => (ctx) => { if (f < 2) { px(ctx, 0, 0, C.bagD, w, 2); px(ctx, Math.floor(w / 2), 2, C.gold, 1, 2); px(ctx, 1, h - 1, C.bagD, w - 2, 1); } }));
        return g;
      });
    }
    R.root = root; R.lift = lift; R.o = o; R.legH = legH;
    return R;
  }

  // ── Expresiones: ojos, ceja, cachete y boca en pixeles, según la situación ──
  const EXPRESSIONS = {
    amable:   { eyes: 'open',  brow: 'soft', blush: true,  mouth: 'smile' },
    feliz:    { eyes: 'happy', brow: null,   blush: true,  mouth: 'grin' },
    emocion:  { eyes: 'wide',  brow: 'up',   blush: true,  mouth: 'grin' },
    curioso:  { eyes: 'wide',  brow: 'up',   blush: false, mouth: 'neutral' },
    sorpresa: { eyes: 'wide',  brow: 'up',   blush: false, mouth: 'o' },
    contento: { eyes: 'half',  brow: null,   blush: true,  mouth: 'smile' },
    dormido:  { eyes: 'sleep', brow: null,   blush: true,  mouth: 'neutral' },
    molesto:  { eyes: 'half',  brow: 'angry', blush: false, mouth: 'frown' },
  };
  const EXPR_LABEL = { amable: 'amable', feliz: 'feliz', emocion: 'emocionado', curioso: 'curioso', sorpresa: 'sorprendido', contento: 'contento', dormido: 'dormido', molesto: 'molesto' };
  const decalCache = new Map();
  function decalTex(key, w, h, draw) {
    if (decalCache.has(key)) return decalCache.get(key);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'));
    const t = new THREE.CanvasTexture(cv);
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
    decalCache.set(key, t); return t;
  }
  function drawEyes(ctx, face, w, h, e, eyes) {
    const col = k => face === 0 ? k : w - 1 - k;         // columna "k desde el frente"
    const ey = Math.round(h * 0.3);
    const tall = h >= 8 ? 1 : 0;                         // en la cabeza grande de la cría, ojo un pixel más alto
    const P = (k, y, c) => px(ctx, col(k), Math.max(0, y), c);
    switch (eyes) {
      case 'open': [1, 2].forEach(k => { for (let y = ey; y <= ey + 1 + tall; y++) P(k, y, C.eye); }); P(1, ey, C.white); break;
      case 'wide': [1, 2].forEach(k => { for (let y = ey - 1; y <= ey + 1 + tall; y++) P(k, y, C.eye); }); P(1, ey - 1, C.white); P(2, ey + 1 + tall, '#5A3A2C'); break;
      case 'happy': P(0, ey + 1, C.eye); P(1, ey, C.eye); P(2, ey, C.eye); P(3, ey + 1, C.eye); break;   // ^
      case 'half': [0, 1, 2, 3].forEach(k => P(k, ey, C.furD)); P(1, ey + 1, C.eye); P(2, ey + 1, C.eye); break;
      case 'sleep': [0, 1, 2].forEach(k => P(k, ey + 1, C.eye)); P(3, ey + 2, C.eye); break;
      case 'closed': P(1, ey + 1, C.eye); P(2, ey + 1, C.eye); break;
    }
    if (e.brow === 'soft') { P(1, ey - 2, C.furD); P(2, ey - 2, C.furD); }
    if (e.brow === 'up') { P(0, ey - 2, C.furD); P(1, ey - 2, C.furD); P(2, ey - 2, C.furD); }
    // Fruncida: baja hacia el frente (el entrecejo), oscura.
    if (e.brow === 'angry') { P(0, ey - 1, C.dark); P(1, ey - 1, C.dark); P(2, ey - 2, C.dark); P(3, ey - 2, C.dark); }
    if (e.blush) { P(2, ey + 3 + tall, C.blush); P(3, ey + 3 + tall, C.blush); }
  }
  function drawMouth(ctx, w, h, m) {
    const y = h - 1;
    switch (m) {
      case 'neutral': px(ctx, 1, y, C.dark, w - 2, 1); break;
      case 'smile': px(ctx, 0, y - 1, C.dark); px(ctx, w - 1, y - 1, C.dark); px(ctx, 1, y, C.dark, w - 2, 1); break;
      case 'grin': px(ctx, 0, y - 1, C.dark); px(ctx, w - 1, y - 1, C.dark); px(ctx, 1, y, C.dark); px(ctx, w - 2, y, C.dark); px(ctx, 2, y, C.tongue, w - 4, 1); break;
      case 'o': px(ctx, Math.floor(w / 2) - 1, y - 1, C.dark, 2, 2); break;
      case 'frown': px(ctx, 1, y - 1, C.dark, w - 2, 1); px(ctx, 0, y, C.dark); px(ctx, w - 1, y, C.dark); break;
    }
  }
  // Solo se cambia la textura cuando la expresión cambia de verdad.
  function applyExpression(name, blink) {
    const e = EXPRESSIONS[name];
    const eyes = blink && (e.eyes === 'open' || e.eyes === 'wide' || e.eyes === 'half') ? 'closed' : e.eyes;
    const key = name + '|' + eyes;
    if (R.expr === key) return;
    R.expr = key;
    R.eyeDecals.forEach(m => {
      const { face, w, h } = m.userData;
      m.material.map = decalTex(`e|${name}|${eyes}|${face}|${w}x${h}`, w, h, ctx => drawEyes(ctx, face, w, h, e, eyes));
      m.material.needsUpdate = true;
    });
    const { w, h } = R.mouthDecal.userData;
    R.mouthDecal.material.map = decalTex(`m|${e.mouth}|${w}x${h}`, w, h, ctx => drawMouth(ctx, w, h, e.mouth));
    R.mouthDecal.material.needsUpdate = true;
  }
  // Qué cara pone en cada situación.
  function expressionFor() {
    switch (action) {
      case 'wave': return 'feliz';
      case 'run': return 'emocion';
      case 'look': return 'curioso';
      case 'rear': { const c = ta % 4; return c < 0.7 ? 'sorpresa' : c < 2.9 ? 'emocion' : 'amable'; }
      case 'eat': return 'contento';
      case 'pick': { const c = ta % 5.4; return c < 1.1 ? 'curioso' : c < 4.5 ? 'feliz' : 'amable'; }
      case 'jump': { const c = ta % 1.7; return c > 0.2 && c < 1.1 ? 'feliz' : 'amable'; }
      case 'sleep': return ta > 0.8 ? 'dormido' : 'contento';
      case 'grumble': return 'molesto';
      default: return 'amable';
    }
  }

  // ── Objetos pixelados ──
  function spriteTex(size, draw) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    draw(cv.getContext('2d'));
    const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function tallGrass() {
    seed = 21;
    const tex = spriteTex(16, ctx => {
      const G = ['#4E8A2E', '#5FA035', '#6DB33F', '#79C043'];
      [[2, 7], [4, 12], [6, 9], [7, 14], [9, 11], [11, 13], [13, 8], [14, 6]].forEach(([x, hgt]) => {
        for (let y = 16 - hgt; y < 16; y++) px(ctx, x + (y % 3 === 0 ? (rand() > 0.5 ? 1 : 0) : 0), y, G[(rand() * 4) | 0]);
      });
      px(ctx, 7, 2, '#FFD23F'); px(ctx, 6, 3, '#FFD23F'); px(ctx, 8, 3, '#FFD23F'); px(ctx, 7, 3, '#E8542A');
    });
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
    const g = new THREE.Group();
    [Math.PI / 4, -Math.PI / 4].forEach(a => { const p = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat); p.position.y = 5; p.rotation.y = a; g.add(p); });
    return g;
  }
  function mango() {
    seed = 31;
    const g = new THREE.Group();
    const m = box(4, 4, 4, '#FF9A1F', () => (ctx, w, h) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(ctx, x, y, y === 0 ? '#F9D24A' : y === h - 1 ? '#E8542A' : (rand() > 0.5 ? '#FFB02E' : '#FF9A1F'));
    });
    m.position.y = 2; g.add(m);
    const stem = box(1, 1, 1, '#6B4423'); stem.position.y = 4.5; g.add(stem);
    const leaf = box(2, 1, 1, '#5FA035'); leaf.position.set(1.5, 4.5, 0); g.add(leaf);
    return g;
  }

  // ── Escena (fondo transparente) ──
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 600);
  // Mismas luces que la vista previa; en three moderno las intensidades van x PI.
  const PI = Math.PI;
  scene.add(new THREE.HemisphereLight(0xa9b8ff, 0x3d2a1c, 0.45 * PI));
  // Sol alto: sombras más cortas, que no se salen del cuadro al girar ni al echarse.
  const sun = new THREE.DirectionalLight(0xffc488, 1.5 * PI); sun.position.set(24, 64, 18);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 4; sun.shadow.bias = -0.001; sun.shadow.normalBias = 1.5;
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 220 });
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff6a2a, 1.1 * PI); rim.position.set(-40, 20, -45); scene.add(rim);
  const world = new THREE.Group(); scene.add(world);
  // Piso invisible que solo recibe la sombra.
  // Piso grande: el disco de 30 cortaba la sombra en seco cuando se estiraba hacia un lado.
  const shadowFloor = new THREE.Mesh(new THREE.CircleGeometry(120, 48), new THREE.ShadowMaterial({ opacity: 0.22 }));
  shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.receiveShadow = true; world.add(shadowFloor);
  const zTex = spriteTex(8, ctx => {
    const Z = ['XXXXX', '...X.', '..X..', '.X...', 'XXXXX'];
    Z.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') px(ctx, x + 2, y + 2, '#3F3F3F'); }));
    Z.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') px(ctx, x + 1, y + 1, '#FFFFFF'); }));
  });
  const zs = [0, 1, 2].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false })); world.add(s); return s; });
  const cam = { yaw: -0.62, pitch: 0.16, dist: 70, lookY: 14 };
  function frameCamera(chibi) {
    cam.dist = chibi ? 74 : 104; cam.lookY = chibi ? 15 : 22;
  }

  let R = null;
  const item = { mango: mango(), grass: tallGrass() };
  const P = {};
  const SPR = {};
  function setOption(key) {
    if (R) world.remove(R.root);
    R = buildBurrito(OPTIONS[key]);
    R.root.add(item.mango, item.grass);
    world.add(R.root);
    Object.assign(P, base());
    ['earL', 'earR', 'tailX', 'tailZ', 'tuft', 'knot'].forEach(k => SPR[k] = { v: 0, x: 0 });
    calibrate();
    frameCamera(OPTIONS[key].chibi);
  }

  // Para comer/recoger inclina el tronco y baja el cuello hasta que la boca
  // llega al pasto; la cabeza compensa para que el hocico mire abajo-adelante.
  let eatNeck = 1.2, eatHead = 0.5, reach = 18;
  const EAT = { torso: 0.18, drop: 1 };
  function calibrate() {
    const v = new THREE.Vector3();
    R.lift.position.y = -EAT.drop; R.torso.rotation.set(EAT.torso, 0, 0);
    const HEAD_WORLD = 1.25;
    const tryNeck = n => {
      R.neck.rotation.x = n; R.head.rotation.set(HEAD_WORLD - EAT.torso - n, 0, 0);
      R.root.updateMatrixWorld(true); R.jaw.getWorldPosition(v); R.root.worldToLocal(v);
    };
    let found = false;
    for (let n = 0.3; n < 2.3; n += 0.02) { tryNeck(n); eatNeck = n; if (v.y <= 5) { found = true; break; } }
    if (!found) { eatNeck = 1.9; tryNeck(eatNeck); }
    eatHead = HEAD_WORLD - EAT.torso - eatNeck;
    reach = v.z + 2;
    item.grass.position.set(0, 0, reach); item.mango.position.set(0, 0, reach);
  }
  function shouldersDown(T, k) { T.torsoX += EAT.torso * k; T.y -= EAT.drop * k; }

  // ── Pose ──
  const base = () => ({ torsoX: 0, torsoZ: 0, fl: 0, fr: 0, bl: 0, br: 0,
    neckX: R.K.neckBase, neckY: 0, headX: R.K.headBase, headY: 0, headZ: 0, jaw: 0,
    ear: 0, earSpread: 0, tailX: 0.35, tailZ: 0, blink: 1, y: 0, lie: 0, scroll: 0 });
  const LERPED = ['torsoX', 'torsoZ', 'fl', 'fr', 'bl', 'br', 'neckX', 'neckY', 'headX', 'headY', 'headZ', 'jaw', 'ear', 'earSpread', 'tailX', 'tailZ', 'lie', 'scroll'];

  let action = 'idle', ta = 0, t = 0, phase = 0;
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const S = (a, b, x) => { const k = cl((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  let mangoVisible = true;

  function targets(dt) {
    const T = base(), K = R.K;
    T.headX = K.headBase + Math.sin(t * 1.5) * 0.025;
    T.tailZ = Math.sin(t * 1.2) * 0.12;
    const flick = (t % 4.7) < 0.16 ? 1 : 0;
    item.grass.visible = action === 'eat';
    item.mango.visible = action === 'pick' && mangoVisible;

    switch (action) {
      case 'idle': {
        const glance = Math.floor(t / 3.2) % 4;
        T.headY = [0, 0.3, 0, -0.25][glance];
        T.ear = -0.35 * flick; break;
      }
      case 'wave': {
        const up = S(0, 0.4, ta);
        T.fr = (-1.35 + Math.sin(ta * 9) * 0.3) * up;
        T.headZ = 0.14 * up; T.headY = 0.25 * up; T.ear = 0.25 * up; T.jaw = 0.25 * up; T.tailZ = Math.sin(t * 6) * 0.35; break;
      }
      case 'walk': case 'run': {
        // Balanceo de patas como los mobs del juego: coseno por pares diagonales.
        const run = action === 'run';
        phase += dt * (run ? 12 : 6);
        const A = run ? 1.0 : 0.6;
        if (run) {
          T.fl = Math.cos(phase) * A; T.fr = Math.cos(phase + 0.5) * A;
          T.bl = Math.cos(phase + Math.PI) * A; T.br = Math.cos(phase + Math.PI + 0.5) * A;
          T.torsoX = Math.sin(phase) * 0.08; T.y = Math.max(0, Math.sin(phase)) * 1.8;
          T.neckX = K.neckBase + 0.2; T.ear = -0.7; T.tailX = 1.2; T.scroll = 34;
        } else {
          T.fl = Math.cos(phase) * A; T.br = Math.cos(phase) * A;
          T.fr = Math.cos(phase + Math.PI) * A; T.bl = Math.cos(phase + Math.PI) * A;
          T.headX = K.headBase + Math.sin(phase * 2) * 0.04; T.tailZ = Math.sin(phase) * 0.25; T.scroll = 10;
        }
        break;
      }
      case 'look': {
        const seq = [0, -1, -1, 0, 1, 1, 0, 0];
        const yaw = seq[Math.floor(ta / 1.05) % seq.length];
        T.neckY = yaw * 0.35; T.headY = yaw * 0.6;
        T.neckX = K.neckBase - 0.15; T.headX = K.headBase - 0.2; T.ear = 0.3; T.tailZ = Math.sin(t * 5) * 0.3; break;
      }
      case 'rear': {
        const c = ta % 4;
        const up = S(0.1, 0.7, c) * (1 - S(2.9, 3.4, c));
        T.torsoX = -1.0 * up; T.y = 0.5 * up;
        T.fl = (-1.1 + Math.sin(ta * 9) * 0.5) * up; T.fr = (-1.1 + Math.sin(ta * 9 + Math.PI) * 0.5) * up;
        T.bl = T.br = -0.2 * up;
        T.neckX = K.neckBase - 0.4 * up; T.headX = K.headBase + 0.15 * up;
        T.jaw = up > 0.85 ? 0.3 + Math.max(0, Math.sin(ta * 5)) * 0.25 : 0; T.ear = -0.5 * up; T.tailX = 0.35 + 0.6 * up; break;
      }
      case 'eat': {
        const c = ta % 6.5;
        T.neckX = eatNeck; T.headX = eatHead;
        const tug = (ta % 1.4) > 1.15 ? 1 : 0;
        T.headX -= 0.14 * tug; T.jaw = c > 0.9 && Math.sin(ta * 13) > 0 ? 0.3 : 0.04;
        item.grass.scale.set(1, Math.max(0.05, 1 - S(1, 6, c) * 0.95), 1);
        T.earSpread = 0.2; T.tailZ = Math.sin(t * 2.4) * 0.3; shouldersDown(T, 1); break;
      }
      case 'pick': pickStep(T); break;
      case 'jump': {
        const c = ta % 1.7;
        const airK = c > 0.25 && c < 0.95 ? (c - 0.25) / 0.7 : -1;
        const air = airK >= 0 ? Math.sin(airK * Math.PI) : 0;
        T.y = air * 12;
        T.fl = T.fr = -0.8 * air; T.bl = T.br = 0.8 * air;
        T.neckX = K.neckBase - 0.25 * air; T.jaw = 0.35 * air; T.ear = -0.5 * air; T.tailX = 0.35 + 0.9 * air; break;
      }
      case 'sleep': {
        // Echado como los mobs sentados del juego: patas estiradas y cuerpo al piso.
        const down = S(0, 1, ta);
        T.lie = down;
        T.fl = T.fr = -1.5 * down; T.bl = T.br = 1.5 * down;
        T.neckX = K.neckBase + 0.05 * down; T.neckY = -0.5 * down; T.headX = K.headBase + 0.35 * down; T.headZ = 0.3 * down; T.headY = -0.7 * down;
        T.earSpread = 0.5 * down; T.tailX = 0.9 * down + 0.35 * (1 - down);
        T.blink = down > 0.6 ? 0.08 : 1; break;
      }
      case 'grumble': {
        T.lie = 1;
        T.fl = T.fr = -1.5; T.bl = T.br = 1.5;
        const shake = ta < 1.3 ? Math.sin(ta * 16) * 0.28 * (1 - ta / 1.3) : 0;
        T.neckX = K.neckBase + 0.05; T.neckY = -0.35; T.headX = K.headBase + 0.15; T.headZ = 0.1; T.headY = -0.35 + shake;
        T.ear = -0.45; T.earSpread = 0.35; T.tailX = 0.6; T.tailZ = Math.sin(t * 9) * 0.35;
        T.blink = 1; break;
      }
    }
    if (action !== 'sleep' && action !== 'grumble') { const bc = t % 3.6; T.blink = bc < 0.13 ? 0.12 : 1; }
    return T;
  }

  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  const mouth = out => { R.jaw.getWorldPosition(out); R.root.worldToLocal(out); out.y -= 2.5; out.z += 1.5; return out; };
  function pickStep(T) {
    const K = R.K, c = ta % 5.4, bag = !!R.bags;
    const down = S(0.3, 1.0, c) * (1 - S(1.35, 2.1, c));
    T.neckX = K.neckBase + (eatNeck - K.neckBase) * down;
    T.headX = K.headBase + (eatHead - K.headBase) * down;
    T.jaw = c > 0.8 && c < 1.15 ? 0.42 : 0.04;
    shouldersDown(T, down);
    if (bag) {
      const turn = S(2.0, 2.6, c) * (1 - S(3.5, 4.1, c));
      T.neckY = 0.5 * turn; T.headY = 0.8 * turn; T.neckX += 0.3 * turn; T.headX += 0.35 * turn;
      if (c > 2.95 && c < 3.25) T.jaw = 0.38;
    } else {
      T.headX -= 0.55 * S(2.1, 2.45, c) * (1 - S(3.4, 3.9, c));
      if (c > 2.45 && c < 3.6) T.jaw = Math.sin(c * 28) > 0 ? 0.32 : 0.04;
    }
    const m = item.mango; mangoVisible = true;
    if (c < 1.05) { m.position.set(0, 0, reach); m.scale.setScalar(1); m.rotation.set(0, 0, 0); }
    else if (bag ? c < 3.05 : c < 2.2) { mouth(v1); m.position.copy(v1); m.rotation.x = 0.4; }
    else if (bag && c < 3.55) {
      const k = S(3.05, 3.55, c); mouth(v1); R.bags[0].getWorldPosition(v2); R.root.worldToLocal(v2); v2.y += 1.5;
      m.position.lerpVectors(v1, v2, k); m.scale.setScalar(1 - k * 0.85);
    } else if (!bag && c < 2.9) {
      const k = (c - 2.2) / 0.7; mouth(v1);
      m.position.set(v1.x, v1.y + Math.sin(k * Math.PI) * 10, v1.z); m.rotation.x = Math.round(k * 4) * Math.PI / 2;
    } else if (c < 4.5) mangoVisible = false;
    else { m.position.set(0, 0, reach); m.scale.setScalar(Math.max(0.01, S(4.5, 4.9, c))); m.rotation.set(0, 0, 0); }
  }

  function spring(s, target, dt, k = 120, c = 12) { const a = k * (target - s.x) - c * s.v; s.v += a * dt; s.x += s.v * dt; return s.x; }

  function applyPose(dt) {
    const lieDrop = P.lie * (R.legH - R.K.legW / 2);
    R.lift.position.y = P.y - lieDrop;
    R.torso.rotation.x = P.torsoX; R.torso.rotation.z = P.torsoZ;
    ['fl', 'fr', 'bl', 'br'].forEach(l => { R[l].hip.rotation.x = P[l]; });
    R.neck.rotation.x = P.neckX; R.neck.rotation.y = P.neckY;
    R.head.rotation.set(P.headX, P.headY, P.headZ);
    R.jaw.rotation.x = P.jaw;
    R.ears.forEach((e, i) => {
      const x = spring(SPR[i ? 'earR' : 'earL'], P.ear + (i ? 0.05 : -0.05), dt, 160, 16);
      e.g.rotation.x = x - 0.12; e.g.rotation.z = -e.side * (0.12 + P.earSpread);
    });
    R.tail.rotation.x = spring(SPR.tailX, P.tailX, dt, 70, 10);
    R.tail.rotation.z = spring(SPR.tailZ, P.tailZ, dt, 60, 9);
    R.tuft.rotation.x = spring(SPR.tuft, (P.tailX - 0.35) * 0.4, dt, 60, 9);
    if (R.knot) R.knot.rotation.x = spring(SPR.knot, P.torsoX * -0.3, dt, 90, 10);
    const hgt = Math.max(0, P.y);
    const s = (R.o.chibi ? 18 : 24) * (1 - cl(hgt / 30, 0, 0.5));
  }

  function resize() {
    // Del tamaño de la ventana, no del contenedor: en el WebView el body puede medir 0 de alto.
    const w = window.innerWidth, h = window.innerHeight, pr = renderer.getPixelRatio();
    if (w === 0 || h === 0) return;
    if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
      // Tamaño en pixeles (setSize también fija el estilo): en el WebView los
      // 100% / 100vh valen 0 si se midió con alto 0 al crearse, pero innerHeight es real.
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize);

  // Secuencia de acciones: cada una dura lo suyo y la última se repite.
  const DURATION = { wave: 2.6, jump: 3.4, rear: 4, look: 6.4, pick: 5.4, eat: 6.5 };
  const params = new URLSearchParams(location.search);
  const queue = (params.get('a') || 'idle').split(',').map(s => s.trim()).filter(Boolean);
  let qi = 0;
  action = queue[0];
  function play(a) { action = a; ta = 0; }
  // Interacción desde la app: arrastrar para girarlo (se nota que es 3D) y
  // tocarlo para que reaccione (p. ej. se despierta de un salto y vuelve a dormir).
  // Giro del modelo (no de la cámara): la luz queda fija y se ve cómo
  // alumbra cada cara al girar. Durmiendo gira solo, como en una vitrina;
  // con el dedo se gira a mano y, al soltar, sigue por inercia y frena.
  let turn = 0, turnVel = 0, dragVel = 0, dragging = false, resumeAt = -10, reactEnd = 0, reactBack = null;
  function spin(dx) {
    const d = dx * 0.012;
    turn += d;
    dragVel = dragVel * 0.6 + (d * 60) * 0.4;   // velocidad angular aproximada (rad/s)
    dragging = true;
  }
  function release() {
    dragging = false;
    turnVel = Math.max(-7, Math.min(7, dragVel));
    dragVel = 0;
    resumeAt = t;
  }
  // Cuánto dura cada reacción antes de volver a lo de antes (dormir).
  const REACT_DUR = { jump: 1.7, wave: 2.4, look: 3.3, rear: 3.6, eat: 3.4, pick: 5.4, run: 2.2 };
  const REACTIONS = Object.keys(REACT_DUR);
  let bag = [], lastReaction = null;
  function react(a) {
    reactBack = queue[queue.length - 1];
    play(a);
    reactEnd = t + (REACT_DUR[a] || (DURATION[a] || 1.7));
  }
  // Nunca la misma dos veces seguidas; se repiten solo al vaciarse la bolsa.
  function reactNext() {
    if (action === 'grumble') return;
    if (!bag.length) {
      bag = REACTIONS.slice().sort(() => Math.random() - 0.5);
      if (bag[0] === lastReaction) bag.push(bag.shift());
    }
    lastReaction = bag.shift();
    react(lastReaction);
  }
  // Demasiados toques: se queda echado, abre un ojo molesto, niega y se vuelve a dormir.
  function grumble() {
    reactBack = queue[queue.length - 1];
    play('grumble');
    reactEnd = t + 2.4;
  }
  window.burrito = { play, spin, release, react, reactNext, grumble };
  setOption(params.get('v') === 'C' ? 'C' : 'B');
  // Se simulan los primeros segundos antes del primer cuadro: si arranca
  // durmiendo, aparece ya dormido (no echándose frente al usuario).
  if (queue.length === 1 && queue[0] !== 'idle') for (let i = 0; i < 150; i++) step(1 / 60);

  // Dormido o en reposo el movimiento es lento: basta con 30 cuadros por
  // segundo y así el teléfono queda libre para el resto de la pantalla.
  const calm = queue.every(a => a === 'sleep' || a === 'idle');
  // Si está girando (solo o con el dedo) va a la fluidez completa del teléfono;
  // quieto en reposo basta con 30 cuadros por segundo.
  const minFrameMs = () => (calm && action !== 'sleep' && !dragging && !reactEnd && Math.abs(turnVel) < 0.01 ? 32 : 0);
  let last = performance.now(), lastDraw = 0, notified = false;
  function frame(now) {
    if (now - lastDraw < minFrameMs()) { requestAnimationFrame(frame); return; }
    lastDraw = now;
    let elapsed = Math.max(0, Math.min(2, (now - last) / 1000)); last = now;
    resize();
    while (elapsed > 1e-4) { const dt = Math.min(1 / 60, elapsed); elapsed -= dt; step(dt); }
    renderer.render(scene, camera);
    if (!notified) { notified = true; try { window.BurritoBridge && window.BurritoBridge.ready(); } catch (e) {} }
    requestAnimationFrame(frame);
  }
  function step(dt) {
    t += dt; ta += dt;
    if (qi < queue.length - 1 && ta >= (DURATION[action] || 3)) { qi++; play(queue[qi]); }
    if (reactEnd && t >= reactEnd) { reactEnd = 0; play(reactBack); }
    if (!dragging) {
      turnVel *= Math.exp(-dt * 2.2);                           // la inercia frena sola
      const auto = action === 'sleep' ? 0.4 : 0;                 // vitrina: ~16 s por vuelta
      const resume = Math.min(1, Math.max(0, (t - resumeAt - 0.4) / 1.4)); // retoma suave tras soltar
      turn += (turnVel + auto * resume) * dt;
    }
    R.root.rotation.y = turn;
    const T = targets(dt);
    const k = 1 - Math.exp(-dt * 9);
    LERPED.forEach(key => { P[key] += (T[key] - P[key]) * k; });
    P.y = T.y; P.blink = T.blink;
    applyExpression(expressionFor(), T.blink < 0.5);
    applyPose(dt);
    zs.forEach((z, i) => {
      const on = action === 'sleep' && ta > 1;
      const c = ((t * 0.45 + i / 3) % 1);
      z.visible = on;
      // Las "z" salen de la cabeza: giran junto con el modelo.
      const zx = -3 + Math.sin(c * 6 + i) * 1.5, zz = (R.o.chibi ? 8 : 14) - c * 2;
      z.position.set(zx * Math.cos(turn) + zz * Math.sin(turn), R.legH * 0.6 + 8 + c * 14, -zx * Math.sin(turn) + zz * Math.cos(turn));
      z.material.opacity = on ? Math.sin(c * Math.PI) : 0;
      const sc = 3 + c * 3; z.scale.set(sc, sc, 1);
    });
    const yaw = cam.yaw;
    camera.position.set(Math.sin(yaw) * Math.cos(cam.pitch) * cam.dist, cam.lookY + Math.sin(cam.pitch) * cam.dist, Math.cos(yaw) * Math.cos(cam.pitch) * cam.dist);
    camera.lookAt(0, cam.lookY - 3, 2);
  }
  requestAnimationFrame(frame);
