import { useEffect, useRef } from "react";

/* ─── Tipos ─── */
interface ColorMap {
  bg: number; ground: number; street: number; streetEdge: number;
  bldA: number; bldB: number; bldC: number; roof: number;
  win: number; winDim: number; antenna: number;
  routeCore: number; routeGlow: number;
  pinA: number; pinB: number;
  donkeyBody: number; donkeyDark: number; donkeyHoof: number;
  donkeyEye: number; donkeyBag: number;
}

interface AntennaTip {
  mesh: { material: { opacity: number } };
  phase: number;
}

interface SegMesh {
  core: any;
  glow: any;
  len: number;
  cornerDot?: any;
}

interface LegGroup {
  upper: any;
  lower: any;
  phase: number;
}

interface MapHeroProps {
  marginTop?: string;
  transformValue?: string;
  sizeLoaded?: boolean;
}

/* ─── Constantes ─── */
const C: ColorMap = {
  bg: 0x080705, ground: 0x0e0c09, street: 0x161410, streetEdge: 0x1e1b16,
  bldA: 0x141210, bldB: 0x1a1714, bldC: 0x0f0d0b, roof: 0x1c1915,
  win: 0xff8c00, winDim: 0x3a2a10, antenna: 0xff5500,
  routeCore: 0xff5500, routeGlow: 0xff8c00,
  pinA: 0xff5500, pinB: 0xffd166,
  donkeyBody: 0xc49a5a, donkeyDark: 0x8a6a3a, donkeyHoof: 0x3a2a10,
  donkeyEye: 0xfdfaf4, donkeyBag: 0xff5500,
};

const FLOOR_H = 0.10;
const CAM_SIZE = 25;
const ROUTE_Y = 1.75;
const SPEED = 0.00095;

/* ─── buildScene ─── */
function buildScene(THREE: any, container: HTMLDivElement, sizeLoaded: boolean): () => void {
  const W = container.clientWidth, H = container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  renderer.sortObjects = true;
  container.appendChild(renderer.domElement);

  const aspect = W / H;
  const cam = new THREE.OrthographicCamera(
    -CAM_SIZE * aspect, CAM_SIZE * aspect, CAM_SIZE, -CAM_SIZE, 0.1, 200
  );
  cam.position.set(12, 14, 12);
  cam.lookAt(0, 0, 0);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xfff0e0, 0.55));
  const sun = new THREE.DirectionalLight(0xffd8a0, 1.1);
  sun.position.set(8, 18, 6);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xff6600, 0.25);
  fill.position.set(-6, 4, -8);
  scene.add(fill);

  const M = (geo: any, mat: any) => new THREE.Mesh(geo, mat);
  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const mat = (col: number, opts: object = {}) => new THREE.MeshStandardMaterial({ color: col, ...opts });
  const flat = (col: number, opts: object = {}) => new THREE.MeshBasicMaterial({ color: col, ...opts });

  scene.position.x = 15;

  cam.position.set(12, 22, 12);
  cam.lookAt(115, 131.5, 100);
  cam.zoom = 0.7;
  cam.updateProjectionMatrix();

  /* Ground */
  const ground = M(box(28, 0.12, 24), mat(C.ground));
  ground.position.y = -0.06;
  scene.add(ground);
  const grid = new THREE.GridHelper(28, 28, 0x1e1b10, 0x161410);
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  grid.position.y = 0.02;
  scene.add(grid);

  /* Streets */
  const streetMat = mat(C.street);
  const edgeMat = mat(C.streetEdge);
  [
    { x: 0, z: -6, w: 28, d: 1.4 },
    { x: 0, z: 0, w: 28, d: 1.4 },
    { x: 0, z: 6, w: 28, d: 1.4 },
    { x: -8, z: 0, w: 1.4, d: 24 },
    { x: 0, z: 0, w: 1.4, d: 24 },
    { x: 8, z: 0, w: 1.4, d: 24 },
  ].forEach(({ x, z, w, d }) => {
    const s = M(box(w, 0.08, d), streetMat);
    s.position.set(x, 0.04, z);
    scene.add(s);
    const e1 = M(box(w, 0.02, 0.06), edgeMat);
    e1.position.set(x, 0.09, z - d / 2);
    scene.add(e1);
    const e2 = e1.clone();
    e2.position.set(x, 0.09, z + d / 2);
    scene.add(e2);
  });

  /* Buildings */
  const buildingDefs: [number, number, number, number, number, string][] = [
    [-10.5, 8.5, 2.2, 2.0, 5, 'A'], [-6.5, 8.5, 1.8, 2.2, 3, 'B'],
    [-3.2, 8.5, 2.4, 1.8, 4, 'C'], [-6.0, 2.8, 1.6, 1.6, 2, 'B'],
    [-3.5, 3.2, 2.0, 1.8, 5, 'A'], [-3.5, -2.8, 2.2, 2.0, 3, 'C'],
    [-6.5, -3.0, 1.8, 1.6, 4, 'A'], [-10.5, -3.0, 2.4, 2.2, 2, 'B'],
    [-10.5, 2.8, 1.8, 1.8, 3, 'C'], [3.5, 8.5, 2.0, 2.0, 4, 'A'],
    [6.5, 8.5, 1.8, 1.8, 2, 'B'], [10.5, 8.5, 2.4, 2.2, 5, 'C'],
    [3.5, 3.0, 1.6, 2.0, 3, 'B'], [6.5, 3.0, 2.2, 1.6, 5, 'A'],
    [10.5, 3.0, 1.8, 2.0, 2, 'C'], [3.5, -3.0, 2.0, 1.8, 4, 'B'],
    [6.5, -3.0, 1.6, 1.6, 3, 'A'], [10.5, -3.0, 2.4, 2.0, 5, 'C'],
    [-6.5, -8.5, 2.0, 2.0, 3, 'B'], [6.5, -8.5, 1.8, 2.2, 4, 'A'],
    [10.5, -8.5, 2.0, 1.8, 2, 'C'],
  ];

  const bldColors: Record<string, number> = { A: C.bldA, B: C.bldB, C: C.bldC };
  const antennaTips: AntennaTip[] = [];

  buildingDefs.forEach(([bx, bz, bw, bd, floors, ck]) => {
    const h = (floors as number) * FLOOR_H;
    const body = M(box(bw as number, h, bd as number), mat(bldColors[ck as string]));
    body.position.set(bx, h / 2, bz);
    scene.add(body);
    const roofCap = M(box((bw as number) + 0.1, 0.08, (bd as number) + 0.1), mat(C.roof));
    roofCap.position.set(bx, h + 0.04, bz);
    scene.add(roofCap);

    const winW = 0.22, winH = 0.18;
    const cols = Math.max(1, Math.floor((bw as number) / 0.55));
    for (let fi = 0; fi < 2; fi++) {
      const fz = (bz as number) + (fi === 0 ? (bd as number) / 2 + 0.01 : -(bd as number) / 2 - 0.01);
      for (let r = 0; r < (floors as number); r++) {
        for (let c = 0; c < cols; c++) {
          const lit = Math.random() > 0.38;
          const wm = flat(lit ? C.win : C.winDim, { transparent: true, opacity: lit ? 0.9 : 0.4 });
          const win = M(box(winW, winH, 0.04), wm);
          win.position.set(
            (bx as number) - (bw as number) / 2 + (bw as number) / (cols + 1) * (c + 1),
            FLOOR_H * (r + 0.5) + 0.06,
            fz
          );
          win.renderOrder = 1;
          scene.add(win);
        }
      }
    }

    const sc = Math.max(1, Math.floor((bd as number) / 0.55));
    for (let fi = 0; fi < 2; fi++) {
      const fx = (bx as number) + (fi === 0 ? (bw as number) / 2 + 0.01 : -(bw as number) / 2 - 0.01);
      for (let r = 0; r < (floors as number); r++) {
        for (let c = 0; c < sc; c++) {
          const lit = Math.random() > 0.45;
          const wm = flat(lit ? C.win : C.winDim, { transparent: true, opacity: lit ? 0.85 : 0.35 });
          const win = M(box(0.04, winH, winW), wm);
          win.position.set(
            fx,
            FLOOR_H * (r + 0.5) + 0.06,
            (bz as number) - (bd as number) / 2 + (bd as number) / (sc + 1) * (c + 1)
          );
          win.renderOrder = 1;
          scene.add(win);
        }
      }
    }

    if ((floors as number) >= 4) {
      const antH = 0.5 + Math.random() * 0.4;
      const pole = M(box(0.04, antH, 0.04), mat(0x2a2318));
      pole.position.set(
        (bx as number) + (Math.random() - 0.5) * 0.5,
        h + antH / 2 + 0.08,
        (bz as number) + (Math.random() - 0.5) * 0.4
      );
      scene.add(pole);
      const tip = M(new THREE.SphereGeometry(0.06, 6, 6), flat(C.antenna, { transparent: true }));
      tip.position.set(pole.position.x, pole.position.y + antH / 2 + 0.06, pole.position.z);
      scene.add(tip);
      antennaTips.push({ mesh: tip, phase: Math.random() * Math.PI * 2 });
    }
  });

  /* Route */
  const waypoints: any[] = [
    new THREE.Vector3(-10.5, ROUTE_Y, 8.5),
    new THREE.Vector3(-10.5, ROUTE_Y, 6.0),
    new THREE.Vector3(-8.0, ROUTE_Y, 6.0),
    new THREE.Vector3(-8.0, ROUTE_Y, 0.0),
    new THREE.Vector3(-0.7, ROUTE_Y, 0.0),
    new THREE.Vector3(-0.7, ROUTE_Y, -6.0),
    new THREE.Vector3(8.0, ROUTE_Y, -6.0),
    new THREE.Vector3(8.0, ROUTE_Y, -3.0),
    new THREE.Vector3(10.5, ROUTE_Y, -3.0),
  ];

  const segLengths: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const l = waypoints[i].distanceTo(waypoints[i + 1]);
    segLengths.push(l);
    totalLen += l;
  }

  const routeCoreMat = flat(C.routeCore, { depthTest: false, transparent: true, opacity: 0.95 });
  const routeGlowMat = flat(C.routeGlow, { depthTest: false, transparent: true, opacity: 0.18 });
  const segMeshes: SegMesh[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1];
    const isX = Math.abs(b.x - a.x) > Math.abs(b.z - a.z);
    const len = segLengths[i];
    const cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2;
    const core = M(isX ? box(len, 0.08, 0.12) : box(0.12, 0.08, len), routeCoreMat.clone());
    core.position.set(cx, ROUTE_Y, cz);
    core.renderOrder = 10;
    core.visible = false;
    scene.add(core);
    const glow = M(isX ? box(len, 0.08, 0.38) : box(0.38, 0.08, len), routeGlowMat.clone());
    glow.position.copy(core.position);
    glow.renderOrder = 9;
    glow.visible = false;
    scene.add(glow);
    const seg: SegMesh = { core, glow, len };
    if (i < waypoints.length - 2) {
      const dot = M(box(0.20, 0.08, 0.20), flat(C.routeCore, { depthTest: false, transparent: true, opacity: 0.95 }));
      dot.position.set(b.x, ROUTE_Y, b.z);
      dot.renderOrder = 11;
      dot.visible = false;
      scene.add(dot);
      seg.cornerDot = dot;
    }
    segMeshes.push(seg);
  }

  function getPosOnRoute(p: number) {
    let dist = p * totalLen;
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (dist <= segLengths[i]) {
        const t = dist / segLengths[i];
        return new THREE.Vector3().lerpVectors(waypoints[i], waypoints[i + 1], t);
      }
      dist -= segLengths[i];
    }
    return waypoints[waypoints.length - 1].clone();
  }

  function getDirAngle(p: number): number {
    const eps = 0.002;
    const a = getPosOnRoute(Math.max(0, p - eps));
    const b = getPosOnRoute(Math.min(1, p + eps));
    return Math.atan2(b.x - a.x, b.z - a.z);
  }

  /* Pins */
  function makePin(x: number, z: number, colorHex: number, label: string) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.add(M(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16), flat(colorHex, { transparent: true, opacity: 0.22 })));
    const pole = M(box(0.06, ROUTE_Y, 0.06), flat(colorHex, { transparent: true, opacity: 0.45 }));
    pole.position.y = ROUTE_Y / 2;
    group.add(pole);
    const spk = M(new THREE.ConeGeometry(0.12, 0.38, 8), flat(colorHex));
    spk.position.y = ROUTE_Y - 0.15;
    group.add(spk);
    const sph = M(new THREE.SphereGeometry(0.22, 12, 12), mat(colorHex, { roughness: 0.3, metalness: 0.6 }));
    sph.position.y = ROUTE_Y + 0.22;
    group.add(sph);
    const inn = M(new THREE.SphereGeometry(0.10, 8, 8), flat(0xfdfaf4, { transparent: true, opacity: 0.7 }));
    inn.position.y = ROUTE_Y + 0.22;
    group.add(inn);

    const cv = document.createElement('canvas');
    cv.width = 80; cv.height = 40;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.beginPath();
    ctx.roundRect(4, 4, 72, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#FDFAF4';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 40, 21);

    const tex = new THREE.CanvasTexture(cv);
    const lbl = M(new THREE.PlaneGeometry(0.55, 0.28), flat(0xffffff, { map: tex, transparent: true, depthTest: false }));
    lbl.position.y = ROUTE_Y + 0.60;
    lbl.renderOrder = 12;
    group.add(lbl);
    const tor = M(new THREE.TorusGeometry(0.35, 0.04, 8, 24), flat(colorHex, { transparent: true, depthTest: false }));
    tor.rotation.x = Math.PI / 2;
    tor.position.y = 0.06;
    tor.renderOrder = 13;
    group.add(tor);
    scene.add(group);
    return { group, sph, inn, tor, lbl };
  }

  const pinA = makePin(waypoints[0].x, waypoints[0].z, C.pinA, 'A');
  const pinB = makePin(waypoints[waypoints.length - 1].x, waypoints[waypoints.length - 1].z, C.pinB, 'B');

  /* Donkey */
  function makeDonkey() {
    const root = new THREE.Group();
    const bodyM = mat(C.donkeyBody, { roughness: 0.85 });
    const darkM = mat(C.donkeyDark, { roughness: 0.9 });
    const hoofM = mat(C.donkeyHoof);
    const orangeM = mat(C.donkeyBag, { roughness: 0.6 });

    const body = M(box(0.52, 0.32, 0.26), bodyM); body.position.set(0, 0.72, 0); root.add(body);
    const belly = M(box(0.54, 0.10, 0.18), mat(0xd4aa6a)); belly.position.set(0, 0.60, 0.01); root.add(belly);
    const neck = M(box(0.14, 0.26, 0.16), bodyM); neck.position.set(0.26, 0.90, 0); neck.rotation.z = -0.28; root.add(neck);
    const head = M(box(0.22, 0.20, 0.18), bodyM); head.position.set(0.40, 1.06, 0); root.add(head);
    const muz = M(box(0.14, 0.12, 0.16), mat(0xb88a50)); muz.position.set(0.50, 1.00, 0); root.add(muz);

    [-0.04, 0.04].forEach((oz: number) => {
      const n = M(box(0.04, 0.03, 0.03), darkM); n.position.set(0.555, 0.98, oz); root.add(n);
    });
    [-0.075, 0.075].forEach((oy: number) => {
      const ey = M(box(0.05, 0.05, 0.04), darkM); ey.position.set(0.43, 1.10, oy); root.add(ey);
      const hl = M(box(0.02, 0.02, 0.02), flat(0xfdfaf4, { transparent: true, opacity: 0.7 }));
      hl.position.set(0.455, 1.115, oy); root.add(hl);
    });
    [-0.07, 0.07].forEach((oz: number) => {
      const eb = M(box(0.07, 0.28, 0.07), bodyM); eb.position.set(0.32, 1.28, oz); root.add(eb);
      const ei = M(box(0.04, 0.20, 0.04), mat(0xc08060)); ei.position.set(0.32, 1.30, oz); root.add(ei);
      const et = M(box(0.06, 0.06, 0.06), darkM); et.position.set(0.32, 1.44, oz); root.add(et);
    });
    [[0.26, 1.06, 0], [0.30, 1.10, 0], [0.34, 1.12, 0], [0.38, 1.14, 0]].forEach(([mx, my, mz]: number[]) => {
      const mn = M(box(0.06, 0.12, 0.06), darkM); mn.position.set(mx, my, mz); root.add(mn);
    });

    const bagL = M(box(0.20, 0.18, 0.12), orangeM); bagL.position.set(-0.05, 0.66, 0.20); root.add(bagL);
    const bagR = M(box(0.20, 0.18, 0.12), orangeM); bagR.position.set(-0.05, 0.66, -0.20); root.add(bagR);
    const strap = M(box(0.52, 0.04, 0.04), darkM); strap.position.set(0, 0.72, 0); root.add(strap);

    const tailGroup = new THREE.Group();
    tailGroup.position.set(-0.27, 0.76, 0);
    const tb = M(box(0.08, 0.22, 0.08), bodyM); tb.position.set(-0.06, 0, 0); tailGroup.add(tb);
    const tuft = M(box(0.10, 0.14, 0.10), darkM); tuft.position.set(-0.10, -0.14, 0); tailGroup.add(tuft);
    root.add(tailGroup);

    const legDefs = [
      { lx: 0.18, lz: 0.09, phase: 0 },
      { lx: 0.18, lz: -0.09, phase: Math.PI },
      { lx: -0.18, lz: 0.09, phase: Math.PI },
      { lx: -0.18, lz: -0.09, phase: 0 },
    ];
    const legs: LegGroup[] = [];
    legDefs.forEach(({ lx, lz, phase }) => {
      const upper = new THREE.Group(); upper.position.set(lx, 0.58, lz);
      const um = M(box(0.09, 0.22, 0.09), bodyM); um.position.y = -0.11; upper.add(um);
      const lower = new THREE.Group(); lower.position.set(0, -0.22, 0);
      const lm = M(box(0.07, 0.20, 0.07), darkM); lm.position.y = -0.10; lower.add(lm);
      const hoof = M(box(0.09, 0.06, 0.09), hoofM); hoof.position.y = -0.23; lower.add(hoof);
      upper.add(lower);
      root.add(upper);
      legs.push({ upper, lower, phase });
    });
    return { root, tailGroup, legs };
  }

  const { root: donkeyRoot, tailGroup, legs } = makeDonkey();
  donkeyRoot.position.copy(waypoints[0]);
  donkeyRoot.position.y = ROUTE_Y;
  scene.add(donkeyRoot);

  /* Animation loop */
  let tick = 0, progress = 0, rafId: number;

  function animate() {
    rafId = requestAnimationFrame(animate);
    tick++;
    progress = (progress + SPEED) % 1;
    const sin = Math.sin(tick * 0.14);

    let traveled = progress * totalLen, cumLen = 0;
    segMeshes.forEach(({ core, glow, cornerDot, len }: SegMesh, i: number) => {
      const segStart = cumLen, segEnd = cumLen + len;
      if (traveled >= segEnd) {
        core.visible = glow.visible = true;
        if (cornerDot) cornerDot.visible = true;
      } else if (traveled > segStart) {
        const t = (traveled - segStart) / len;
        const a = waypoints[i], b = waypoints[i + 1];
        const isX = Math.abs(b.x - a.x) > Math.abs(b.z - a.z);
        const partLen = len * t;
        if (isX) {
          core.scale.x = t; glow.scale.x = t;
          const dir = Math.sign(b.x - a.x);
          core.position.x = a.x + dir * partLen / 2;
          glow.position.x = core.position.x;
        } else {
          core.scale.z = t; glow.scale.z = t;
          const dir = Math.sign(b.z - a.z);
          core.position.z = a.z + dir * partLen / 2;
          glow.position.z = core.position.z;
        }
        core.visible = glow.visible = true;
      } else {
        core.visible = glow.visible = false;
        core.scale.set(1, 1, 1); glow.scale.set(1, 1, 1);
        const a = waypoints[i], b = waypoints[i + 1];
        core.position.set((a.x + b.x) / 2, ROUTE_Y, (a.z + b.z) / 2);
        glow.position.copy(core.position);
        if (cornerDot) cornerDot.visible = false;
      }
      cumLen += len;
    });

    const pos = getPosOnRoute(progress);
    pos.y = ROUTE_Y + Math.sin(tick * 0.14) * 0.042;
    donkeyRoot.position.copy(pos);
    donkeyRoot.rotation.y = getDirAngle(progress);

    legs.forEach(({ upper, lower, phase }: LegGroup) => {
      const s = Math.sin(tick * 0.18 + phase);
      upper.rotation.x = s * 0.30;
      lower.rotation.x = Math.max(0, -s) * 0.38;
    });
    tailGroup.rotation.z = 0.65 + sin * 0.22;

    antennaTips.forEach(({ mesh, phase }: AntennaTip) => {
      const v = (Math.sin(tick * 0.08 + phase) + 1) / 2;
      mesh.material.opacity = 0.4 + v * 0.6;
    });

    [pinA, pinB].forEach(({ sph, tor }, pi: number) => {
      const ps = Math.sin(tick * 0.05 + pi * Math.PI);
      sph.position.y = ROUTE_Y + 0.22 + ps * 0.08;
      const ts = 0.9 + ((ps + 1) / 2) * 0.5;
      tor.scale.setScalar(ts);
      tor.material.opacity = 0.6 - ((ps + 1) / 2) * 0.45;
    });
    [pinA.lbl, pinB.lbl].forEach((lbl: any) => { lbl.quaternion.copy(cam.quaternion); });

    cam.position.x = 10 + Math.sin(tick * 0.006) * 0.55;
    cam.position.z = 20 + Math.cos(tick * 0.004) * 0.30;
    cam.lookAt(-1, 0, 0);

    renderer.render(scene, cam);
  }

  animate();

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const a = w / h;
    cam.left = -CAM_SIZE * a;
    cam.right = sizeLoaded ? CAM_SIZE : CAM_SIZE * a;
    cam.zoom = 0.7;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(container);

  return () => {
    cancelAnimationFrame(rafId);
    ro.disconnect();
    renderer.dispose();
    if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
  };
}

/* ─── Componente ─── */
export default function MapHero({ marginTop = '-1080px', transformValue, sizeLoaded = false }: MapHeroProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const THREE = (window as any).THREE;
    if (!THREE || !canvasRef.current) return;
    const cleanup = buildScene(THREE, canvasRef.current, sizeLoaded);
    return cleanup;
  }, []);

  return (
    <div
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        marginTop,
        transform: transformValue,
      }}
    />
  );
}