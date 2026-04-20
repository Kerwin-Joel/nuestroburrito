import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
    autoRotate?: boolean;
    className?: string;
}

export default function BurritoDonkey({ autoRotate = true, className = "" }: Props) {
    const stageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        const W = stage.clientWidth;
        const H = stage.clientHeight;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x120b04, 1);
        stage.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x120b04, 12, 30);

        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);

        scene.add(new THREE.AmbientLight(0xffe8b0, 0.55));
        const sun = new THREE.DirectionalLight(0xffd080, 1.4);
        sun.position.set(3, 8, 5);
        scene.add(sun);
        const rim = new THREE.DirectionalLight(0xff6010, 0.45);
        rim.position.set(-4, 2, -4);
        scene.add(rim);

        const mb = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
        const ms = (c: number, r = 0.85) =>
            new THREE.MeshStandardMaterial({ color: c, roughness: r });
        const mk = (geo: THREE.BufferGeometry, mat: THREE.Material) =>
            new THREE.Mesh(geo, mat);
        const box = (w: number, h: number, d: number, col: number, rough = 0.85) =>
            mk(mb(w, h, d), ms(col, rough));

        const C = {
            body: 0xc9a56a, belly: 0xdebb85, dark: 0x4a2e0e, muz: 0xb8885a,
            hoof: 0x1e110a, bag: 0xd06818, bagd: 0x8a3a08, gold: 0xf5c842,
            hat: 0x5a2e08, hatd: 0x3d1e05, nose: 0xa87848, chin: 0xc09a60,
            lip: 0x8a5e30, cheek: 0xd4aa72, eye: 0x1a0800,
            ground: 0x7a5020, ground2: 0x5a3810, rock: 0x4a2c0c,
            palm: 0x4a2808, leaf: 0x2a6018,
        };

        // Ground
        const gnd = mk(mb(14, 0.12, 14), ms(C.ground, 0.97));
        gnd.position.y = -0.06;
        scene.add(gnd);
        const gnd2 = mk(mb(14, 0.04, 14), ms(C.ground2, 1));
        gnd2.position.y = 0.001;
        scene.add(gnd2);

        // Rocks
        let seed = 1;
        const rnd = () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };
        for (let i = 0; i < 20; i++) {
            const rx = (rnd() - 0.5) * 10;
            const rz = (rnd() - 0.5) * 10;
            if (Math.abs(rx) < 2 && Math.abs(rz) < 2) continue;
            const rh = 0.04 + rnd() * 0.06;
            const rock = mk(mb(0.08 + rnd() * 0.12, rh, 0.07 + rnd() * 0.1), ms(C.rock, 1));
            rock.position.set(rx, rh / 2, rz);
            scene.add(rock);
        }

        // Palms
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const pd = 3.8 + rnd() * 0.7;
            const px = Math.cos(a) * pd;
            const pz = Math.sin(a) * pd;
            const ph = 1.6 + rnd() * 1.0;
            const trunk = mk(mb(0.12, ph, 0.12), ms(C.palm, 0.9));
            trunk.position.set(px, ph / 2, pz);
            scene.add(trunk);
            for (let j = 0; j < 4; j++) {
                const la = (j / 4) * Math.PI * 2;
                const ll = 0.4 + rnd() * 0.3;
                const lf = mk(mb(ll, 0.055, 0.07), ms(C.leaf, 0.7));
                lf.position.set(px + Math.cos(la) * ll * 0.4, ph + 0.1, pz + Math.sin(la) * ll * 0.4);
                lf.rotation.y = la;
                scene.add(lf);
            }
        }

        // Stars
        interface StarData { m: THREE.Mesh; base: number; ph: number }
        const starMeshes: StarData[] = [];
        for (let i = 0; i < 60; i++) {
            const sa = rnd() * Math.PI * 2;
            const se = 0.35 + rnd() * 0.5;
            const sr = 11 + rnd() * 5;
            const sm = mk(
                mb(0.05, 0.05, 0.05),
                new THREE.MeshBasicMaterial({ color: 0xf5c842, transparent: true, opacity: rnd() * 0.6 + 0.3 })
            );
            sm.position.set(
                Math.cos(sa) * Math.cos(se) * sr,
                Math.sin(se) * sr,
                Math.sin(sa) * Math.cos(se) * sr
            );
            scene.add(sm);
            starMeshes.push({ m: sm, base: (sm.material as THREE.MeshBasicMaterial).opacity, ph: rnd() * Math.PI * 2 });
        }

        // ── DONKEY ──
        // Body faces +Z. rotateX on hips → feet swing forward/back in Z ✓
        const donkey = new THREE.Group();
        scene.add(donkey);

        // Body
        const bodyG = new THREE.Group();
        donkey.add(bodyG);
        bodyG.position.set(0, 0.76, 0);
        bodyG.add(box(0.30, 0.35, 0.56, C.body));
        const bellyM = box(0.22, 0.13, 0.57, C.belly);
        bellyM.position.y = -0.10;
        bodyG.add(bellyM);

        // Saddlebags
        [0.17, -0.17].forEach((sx) => {
            const bg = box(0.14, 0.22, 0.24, C.bag);
            bg.position.set(sx, -0.08, 0);
            bodyG.add(bg);

            const fl = box(0.016, 0.10, 0.24, C.bagd);
            fl.position.set(sx > 0 ? 0.078 : -0.078, 0.02, 0);
            bodyG.add(fl);

            const bk = box(0.022, 0.065, 0.065, C.gold);
            bk.position.set(sx > 0 ? 0.079 : -0.079, 0.02, 0);
            bodyG.add(bk);

            const st = box(0.15, 0.20, 0.022, C.gold);
            st.position.set(sx, -0.09, 0.08);
            bodyG.add(st);
        });
        const strapM = box(0.048, 0.048, 0.56, C.bagd);
        bodyG.add(strapM);

        // Neck
        const neckG = new THREE.Group();
        bodyG.add(neckG);
        neckG.position.set(0, 0.12, 0.22);
        neckG.rotation.x = -0.38;
        const neckM = box(0.18, 0.30, 0.15, C.body);
        neckM.position.y = 0.14;
        neckG.add(neckM);

        // Head
        const headG = new THREE.Group();
        neckG.add(headG);
        headG.position.set(0, 0.30, 0);
        const headM = box(0.20, 0.23, 0.25, C.body);
        headM.position.y = 0.06;
        headG.add(headM);

        // Cheeks
        [0.095, -0.095].forEach((sx) => {
            const ck = box(0.04, 0.09, 0.08, C.cheek);
            ck.position.set(sx, 0.02, 0);
            headG.add(ck);
        });

        // Eyes
        [0.085, -0.085].forEach((sx) => {
            const ey = box(0.042, 0.058, 0.058, C.eye);
            ey.position.set(sx, 0.07, 0.06);
            headG.add(ey);
            const hl = box(0.02, 0.022, 0.022, 0xffffff);
            hl.position.set(sx, 0.082, 0.079);
            headG.add(hl);
            const lid = box(0.046, 0.014, 0.062, 0x3a2008);
            lid.position.set(sx, 0.10, 0.07);
            headG.add(lid);
        });

        // Muzzle
        const muzzG = new THREE.Group();
        headG.add(muzzG);
        muzzG.position.set(0, -0.04, 0.13);
        muzzG.add(box(0.20, 0.17, 0.19, C.muz));
        const noseBr = box(0.19, 0.055, 0.07, C.nose);
        noseBr.position.set(0, 0.075, 0.08);
        muzzG.add(noseBr);
        [0.062, -0.062].forEach((sx) => {
            const nl = box(0.042, 0.038, 0.042, C.dark);
            nl.position.set(sx, -0.025, 0.083);
            muzzG.add(nl);
        });
        const lipM = box(0.19, 0.028, 0.05, C.lip);
        lipM.position.set(0, -0.068, 0.095);
        muzzG.add(lipM);
        const chinM = box(0.18, 0.055, 0.13, C.chin);
        chinM.position.set(0, -0.088, 0.03);
        muzzG.add(chinM);

        // Ears
        [0.085, -0.085].forEach((sx) => {
            const earG = new THREE.Group();
            headG.add(earG);
            earG.position.set(sx, 0.18, 0);
            earG.rotation.z = sx > 0 ? -0.08 : 0.08;
            const eb = box(0.09, 0.32, 0.08, C.body);
            eb.position.y = 0.13;
            earG.add(eb);
            const ei = box(0.06, 0.24, 0.05, C.muz);
            ei.position.y = 0.13;
            earG.add(ei);
            const et = box(0.08, 0.07, 0.07, C.dark);
            et.position.y = 0.30;
            earG.add(et);
        });

        // Mane
        const maneData: [number, number, number][] = [
            [0, 0.27, 0.12], [0, 0.18, 0.07], [0, 0.09, 0.02], [0, 0, -0.03],
        ];
        maneData.forEach(([x, y, z]) => {
            const mn = box(0.07, 0.14, 0.07, C.dark);
            mn.position.set(x, y, z);
            neckG.add(mn);
        });

        // Hat
        const hatBrim = box(0.38, 0.038, 0.44, C.hat);
        hatBrim.position.set(0, 0.22, 0);
        headG.add(hatBrim);
        const hatTop = box(0.24, 0.16, 0.25, C.hatd);
        hatTop.position.set(0, 0.30, 0);
        headG.add(hatTop);
        const hatBand = box(0.25, 0.032, 0.26, C.gold);
        hatBand.position.set(0, 0.228, 0);
        headG.add(hatBand);

        // Tail
        const tailG = new THREE.Group();
        bodyG.add(tailG);
        tailG.position.set(0, 0.02, -0.29);
        const tailB = box(0.09, 0.26, 0.09, C.body);
        tailB.position.set(0, 0, -0.05);
        tailG.add(tailB);
        const tailT = box(0.12, 0.16, 0.12, C.dark);
        tailT.position.set(0, -0.16, -0.09);
        tailG.add(tailT);

        // Legs
        interface LegData { hipG: THREE.Group; lowerG: THREE.Group; phase: number }
        const legDefs = [
            { z: 0.16, x: 0.10, phase: 0 },
            { z: 0.16, x: -0.10, phase: Math.PI },
            { z: -0.16, x: 0.10, phase: Math.PI },
            { z: -0.16, x: -0.10, phase: 0 },
        ];
        const legs: LegData[] = legDefs.map((def) => {
            const hipG = new THREE.Group();
            bodyG.add(hipG);
            hipG.position.set(def.x, -0.17, def.z);

            const upper = box(0.105, 0.26, 0.105, C.body);
            upper.position.y = -0.13;
            hipG.add(upper);

            const knee = box(0.095, 0.06, 0.095, C.dark);
            knee.position.y = -0.26;
            hipG.add(knee);

            const lowerG = new THREE.Group();
            lowerG.position.y = -0.26;
            hipG.add(lowerG);

            const shin = box(0.082, 0.24, 0.082, C.dark);
            shin.position.y = -0.12;
            lowerG.add(shin);

            const hf = box(0.105, 0.07, 0.105, C.hoof);
            hf.position.y = -0.275;
            lowerG.add(hf);

            return { hipG, lowerG, phase: def.phase };
        });

        // ── Orbit camera ──
        const orb = { th: 0.0, ph: 1.1, r: 4.2 };
        let autoRot = autoRotate;
        const drag = { on: false, x: 0, y: 0, pd: 0 };

        const updateCam = () => {
            camera.position.set(
                orb.r * Math.sin(orb.ph) * Math.sin(orb.th),
                orb.r * Math.cos(orb.ph),
                orb.r * Math.sin(orb.ph) * Math.cos(orb.th)
            );
            camera.lookAt(0, 0.85, 0);
        };
        updateCam();

        const onMouseDown = (e: MouseEvent) => {
            drag.on = true; drag.x = e.clientX; drag.y = e.clientY;
            autoRot = false; stage.style.cursor = "grabbing";
        };
        const onMouseUp = () => { drag.on = false; stage.style.cursor = "grab"; };
        const onMouseMove = (e: MouseEvent) => {
            if (!drag.on) return;
            orb.th -= (e.clientX - drag.x) * 0.009;
            orb.ph = Math.max(0.22, Math.min(1.5, orb.ph + (e.clientY - drag.y) * 0.007));
            drag.x = e.clientX; drag.y = e.clientY; updateCam();
        };
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            orb.r = Math.max(2, Math.min(9, orb.r + e.deltaY * 0.008));
            updateCam();
        };
        const onTouchStart = (e: TouchEvent) => {
            autoRot = false;
            if (e.touches.length === 1) {
                drag.on = true; drag.x = e.touches[0].clientX; drag.y = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                drag.pd = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        };
        const onTouchEnd = () => { drag.on = false; };
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 1 && drag.on) {
                orb.th -= (e.touches[0].clientX - drag.x) * 0.009;
                orb.ph = Math.max(0.22, Math.min(1.5, orb.ph + (e.touches[0].clientY - drag.y) * 0.007));
                drag.x = e.touches[0].clientX; drag.y = e.touches[0].clientY; updateCam();
            } else if (e.touches.length === 2) {
                const d = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                orb.r = Math.max(2, Math.min(9, orb.r * (drag.pd / d)));
                drag.pd = d; updateCam();
            }
        };

        stage.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("mousemove", onMouseMove);
        stage.addEventListener("wheel", onWheel, { passive: false });
        stage.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchmove", onTouchMove, { passive: true });

        // ── Animate ──
        let tick = 0;
        let rafId: number;

        const animate = () => {
            rafId = requestAnimationFrame(animate);
            tick++;

            if (autoRot) { orb.th += 0.006; updateCam(); }

            donkey.position.y = Math.sin(tick * 0.28) * 0.022;
            headG.rotation.x = Math.sin(tick * 0.14) * 0.035;
            tailG.rotation.x = 0.35 + Math.sin(tick * 0.13) * 0.28;
            tailG.rotation.z = Math.sin(tick * 0.09) * 0.12;

            legs.forEach(({ hipG, lowerG, phase }) => {
                const s = Math.sin(tick * 0.20 + phase);
                hipG.rotation.x = s * 0.40;
                lowerG.rotation.x = Math.max(0, -s) * 0.44;
            });

            starMeshes.forEach(({ m, base, ph }) => {
                (m.material as THREE.MeshBasicMaterial).opacity =
                    base * (0.5 + 0.5 * Math.sin(tick * 0.04 + ph));
            });

            renderer.render(scene, camera);
        };
        animate();

        // Resize
        const ro = new ResizeObserver(() => {
            const w = stage.clientWidth, h = stage.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });
        ro.observe(stage);

        // Cleanup
        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            stage.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("mousemove", onMouseMove);
            stage.removeEventListener("wheel", onWheel);
            stage.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchend", onTouchEnd);
            window.removeEventListener("touchmove", onTouchMove);
            renderer.dispose();
            if (stage.contains(renderer.domElement)) stage.removeChild(renderer.domElement);
        };
    }, [autoRotate]);

    return (
        <div
            ref={stageRef}
            className={className}
            style={{ width: "100%", height: "100%", cursor: "grab", borderRadius: "16px", overflow: "hidden" }}
        />
    );
}