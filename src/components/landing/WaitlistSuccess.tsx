// @ts-nocheck
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
    nombre: string;
}

export default function WaitlistSuccess({ nombre }: Props) {
    const stageRef = useRef<HTMLDivElement>(null);
    const confettiRef = useRef<HTMLCanvasElement>(null);

    /* ── CONFETI 2D ── */
    useEffect(() => {
        const cvs = confettiRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext("2d")!;
        cvs.width = cvs.offsetWidth;
        cvs.height = cvs.offsetHeight;

        const COLORS = ["#FF5500", "#f5c842", "#FDFAF4", "#ff8c42", "#ffdd57", "#ff6b35"];
        const pieces = Array.from({ length: 120 }, () => ({
            x: Math.random() * cvs.width,
            y: -20 - Math.random() * 200,
            w: 6 + Math.random() * 8,
            h: 10 + Math.random() * 10,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rot: Math.random() * Math.PI * 2,
            vx: (Math.random() - 0.5) * 2.5,
            vy: 2 + Math.random() * 3.5,
            vr: (Math.random() - 0.5) * 0.18,
            opacity: 1,
        }));

        let raf: number;
        const draw = () => {
            ctx.clearRect(0, 0, cvs.width, cvs.height);
            let alive = false;
            pieces.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                p.vy *= 1.012;
                if (p.y > cvs.height - 40) p.opacity -= 0.025;
                if (p.opacity > 0) {
                    alive = true;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                }
            });
            if (alive) raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    /* ── BURRITO 3D BAILANDO ── */
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        const W = stage.clientWidth || 240;
        const H = stage.clientHeight || 240;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        stage.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
        camera.position.set(0, 1.8, 4.5);
        camera.lookAt(0, 0.85, 0);

        scene.add(new THREE.AmbientLight(0xffe8b0, 0.6));
        const sun = new THREE.DirectionalLight(0xffd080, 1.5);
        sun.position.set(3, 8, 5); scene.add(sun);
        const rim = new THREE.DirectionalLight(0xff6010, 0.5);
        rim.position.set(-4, 2, -4); scene.add(rim);

        const mb = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
        const ms = (c: number, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
        const mk = (g: THREE.BufferGeometry, m: THREE.Material) => new THREE.Mesh(g, m);
        const box = (w: number, h: number, d: number, col: number, r = 0.85) => mk(mb(w, h, d), ms(col, r));

        const C = {
            body: 0xc9a56a, belly: 0xdebb85, dark: 0x4a2e0e, muz: 0xb8885a,
            hoof: 0x1e110a, bag: 0xd06818, bagd: 0x8a3a08, gold: 0xf5c842,
            hat: 0x5a2e08, hatd: 0x3d1e05, mzn: 0xa87848, chin: 0xc09a60,
            lip: 0x8a5e30, cheek: 0xd4aa72, eye: 0x1a0800,
        };

        const donkey = new THREE.Group();
        scene.add(donkey);

        // Body
        const bodyG = new THREE.Group();
        donkey.add(bodyG);
        bodyG.position.set(0, 0.76, 0);
        bodyG.add(box(0.30, 0.35, 0.56, C.body));
        const bellyM = box(0.22, 0.13, 0.57, C.belly);
        bellyM.position.y = -0.10; bodyG.add(bellyM);

        // Bags
        [0.17, -0.17].forEach((sx) => {
            const bg = box(0.14, 0.22, 0.24, C.bag); bg.position.set(sx, -0.08, 0); bodyG.add(bg);
            const bk = box(0.022, 0.065, 0.065, C.gold); bk.position.set(sx > 0 ? 0.079 : -0.079, 0.02, 0); bodyG.add(bk);
            const st = box(0.15, 0.20, 0.022, C.gold); st.position.set(sx, -0.09, 0.08); bodyG.add(st);
        });
        bodyG.add(box(0.048, 0.048, 0.56, C.bagd));

        // Neck
        const neckG = new THREE.Group();
        bodyG.add(neckG);
        neckG.position.set(0, 0.12, 0.22);
        neckG.rotation.x = -0.38;
        const neckM = box(0.18, 0.30, 0.15, C.body);
        neckM.position.y = 0.14; neckG.add(neckM);

        // Head
        const headG = new THREE.Group();
        neckG.add(headG);
        headG.position.set(0, 0.30, 0);
        const headM = box(0.20, 0.23, 0.25, C.body);
        headM.position.y = 0.06; headG.add(headM);

        // Cheeks
        [0.095, -0.095].forEach((sx) => {
            const ck = box(0.04, 0.09, 0.08, C.cheek); ck.position.set(sx, 0.02, 0); headG.add(ck);
        });

        // Eyes
        [0.085, -0.085].forEach((sx) => {
            const ey = box(0.042, 0.058, 0.058, C.eye); ey.position.set(sx, 0.07, 0.06); headG.add(ey);
            const hl = box(0.02, 0.022, 0.022, 0xffffff); hl.position.set(sx, 0.082, 0.079); headG.add(hl);
        });

        // Muzzle
        const muzzG = new THREE.Group();
        headG.add(muzzG);
        muzzG.position.set(0, -0.04, 0.13);
        muzzG.add(box(0.20, 0.17, 0.19, C.muz));
        const noseBr = box(0.19, 0.055, 0.07, C.mzn); noseBr.position.set(0, 0.075, 0.08); muzzG.add(noseBr);
        [0.062, -0.062].forEach((sx) => {
            const nl = box(0.042, 0.038, 0.042, C.dark); nl.position.set(sx, -0.025, 0.083); muzzG.add(nl);
        });
        const lipM = box(0.19, 0.028, 0.05, C.lip); lipM.position.set(0, -0.068, 0.095); muzzG.add(lipM);
        const chinM = box(0.18, 0.055, 0.13, C.chin); chinM.position.set(0, -0.088, 0.03); muzzG.add(chinM);

        // Ears
        [0.085, -0.085].forEach((sx) => {
            const earG = new THREE.Group();
            headG.add(earG);
            earG.position.set(sx, 0.18, 0);
            earG.rotation.z = sx > 0 ? -0.08 : 0.08;
            const eb = box(0.09, 0.32, 0.08, C.body); eb.position.y = 0.13; earG.add(eb);
            const ei = box(0.06, 0.24, 0.05, C.muz); ei.position.y = 0.13; earG.add(ei);
            const et = box(0.08, 0.07, 0.07, C.dark); et.position.y = 0.30; earG.add(et);
        });

        // Mane
        [[0, 0.27, 0.12], [0, 0.18, 0.07], [0, 0.09, 0.02], [0, 0, -0.03]].forEach(([x, y, z]) => {
            const mn = box(0.07, 0.14, 0.07, C.dark); mn.position.set(x, y, z); neckG.add(mn);
        });

        // Hat
        const hatBrim = box(0.38, 0.038, 0.44, C.hat); hatBrim.position.set(0, 0.22, 0); headG.add(hatBrim);
        const hatTop = box(0.24, 0.16, 0.25, C.hatd); hatTop.position.set(0, 0.30, 0); headG.add(hatTop);
        const hatBand = box(0.25, 0.032, 0.26, C.gold); hatBand.position.set(0, 0.228, 0); headG.add(hatBand);

        // Tail
        const tailG = new THREE.Group();
        bodyG.add(tailG);
        tailG.position.set(0, 0.02, -0.29);
        const tailB = box(0.09, 0.26, 0.09, C.body); tailB.position.set(0, 0, -0.05); tailG.add(tailB);
        const tailT = box(0.12, 0.16, 0.12, C.dark); tailT.position.set(0, -0.16, -0.09); tailG.add(tailT);

        // Legs
        const legDefs = [
            { z: 0.16, x: 0.10, phase: 0 },
            { z: 0.16, x: -0.10, phase: Math.PI },
            { z: -0.16, x: 0.10, phase: Math.PI },
            { z: -0.16, x: -0.10, phase: 0 },
        ];
        const legs = legDefs.map((def) => {
            const hipG = new THREE.Group();
            bodyG.add(hipG);
            hipG.position.set(def.x, -0.17, def.z);
            const upper = box(0.105, 0.26, 0.105, C.body); upper.position.y = -0.13; hipG.add(upper);
            const knee = box(0.095, 0.06, 0.095, C.dark); knee.position.y = -0.26; hipG.add(knee);
            const lowerG = new THREE.Group(); lowerG.position.y = -0.26; hipG.add(lowerG);
            const shin = box(0.082, 0.24, 0.082, C.dark); shin.position.y = -0.12; lowerG.add(shin);
            const hf = box(0.105, 0.07, 0.105, C.hoof); hf.position.y = -0.275; lowerG.add(hf);
            return { hipG, lowerG, phase: def.phase };
        });

        // Arms raised (front legs up for celebration)
        const armL = new THREE.Group();
        armL.position.set(0.10, 0.30, 0.16);
        const armLm = box(0.09, 0.30, 0.09, C.body); armLm.position.y = 0.12; armL.add(armLm);
        bodyG.add(armL);

        const armR = new THREE.Group();
        armR.position.set(-0.10, 0.30, 0.16);
        const armRm = box(0.09, 0.30, 0.09, C.body); armRm.position.y = 0.12; armR.add(armRm);
        bodyG.add(armR);

        let tick = 0;
        let rafId: number;
        const animate = () => {
            rafId = requestAnimationFrame(animate);
            tick++;

            // Spin + bounce — fiesta dance
            donkey.rotation.y = tick * 0.04;
            donkey.position.y = Math.abs(Math.sin(tick * 0.18)) * 0.18; // hop

            // Body wiggle
            bodyG.rotation.z = Math.sin(tick * 0.22) * 0.12;

            // Head shake (happiness)
            headG.rotation.z = Math.sin(tick * 0.30) * 0.18;

            // Legs walking
            legs.forEach(({ hipG, lowerG, phase }) => {
                const s = Math.sin(tick * 0.28 + phase);
                hipG.rotation.x = s * 0.50;
                lowerG.rotation.x = Math.max(0, -s) * 0.55;
            });

            // Arms up waving
            armL.rotation.x = -1.1 + Math.sin(tick * 0.25) * 0.35;
            armR.rotation.x = -1.1 + Math.sin(tick * 0.25 + Math.PI) * 0.35;

            // Tail very happy
            tailG.rotation.x = 0.5 + Math.sin(tick * 0.25) * 0.45;
            tailG.rotation.z = Math.sin(tick * 0.20) * 0.3;

            // Hat bounce
            hatBrim.position.y = 0.22 + Math.abs(Math.sin(tick * 0.18)) * 0.04;
            hatTop.position.y = 0.30 + Math.abs(Math.sin(tick * 0.18)) * 0.04;
            hatBand.position.y = 0.228 + Math.abs(Math.sin(tick * 0.18)) * 0.04;

            renderer.render(scene, camera);
        };
        animate();

        const ro = new ResizeObserver(() => {
            const w = stage.clientWidth, h = stage.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });
        ro.observe(stage);

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            renderer.dispose();
            if (stage.contains(renderer.domElement)) stage.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div style={{ position: "relative", textAlign: "center", padding: "8px 0" }}>
            {/* Confeti canvas */}
            <canvas
                ref={confettiRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 10,
                }}
            />

            {/* Burrito 3D */}
            <div
                ref={stageRef}
                style={{ width: "220px", height: "220px", margin: "0 auto" }}
            />

            {/* Mensaje */}
            <div style={{
                fontSize: 22, fontWeight: 700, color: "#FDFAF4",
                marginBottom: 6, marginTop: 4,
            }}>
                ¡Estás dentro{nombre ? `, ${nombre.split(" ")[0]}` : ""}! 🎉
            </div>
            <div style={{ fontSize: 14, color: "#6b6055", lineHeight: 1.6 }}>
                Te avisamos por WhatsApp cuando<br />Burrito esté listo en Piura. 🌊
            </div>
        </div>
    );
}