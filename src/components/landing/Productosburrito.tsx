import { useState, RefObject } from "react";
import React from "react";

/* ─── Tipos ─── */
interface Producto {
  id: string;
  tag: string;
  emoji: string;
  titulo: string;
  descripcion: string;
  features: string[];
  accent: string;
  accentSoft: string;
  accentBorder: string;
}

interface ProductCardProps {
  producto: Producto;
  index: number;
  quizRef: RefObject<HTMLDivElement>;
}

interface ProductosBurritoProps {
  onCTAClick: () => void;
  quizRef: RefObject<HTMLDivElement>;
}

/* ─── Data ─── */
const productosBurrito: Producto[] = [
  {
    id: "rutas",
    tag: "RUTAS BURRITO",
    emoji: "🗺️",
    titulo: "Tu itinerario en 60 segundos",
    descripcion:
      "Rutas listas para usar: playa, gastronomía, cultura o sierra. Con horarios, traslados y tips que no encuentras en Google.",
    features: [
      "Ruta Playera — Piura → Paita → 3 playas",
      "Ruta Diversión — Parques, música y mercados",
      "Ruta Sierra — Ayabaca, Aypate y Las Huaringas",
    ],
    accent: "var(--orange)",
    accentSoft: "var(--border)",
    accentBorder: "var(--border)",
  },
  {
    id: "churre",
    tag: "EL CHURRE",
    emoji: "🤝",
    titulo: "Tu guía local. No uno de TripAdvisor.",
    descripcion:
      "Chicos piuranos -  estudiantes de Turismo y voluntarios culturales - que comparten su ciudad como se la mostrarían a un amigo. Sin rutas de agencia ni lugares de relleno.",
    features: [
      "Tours personalizados medio día / día completo",
      "Alianza con UDEP, UNP y UCV Piura",
      "Conocimiento real de cada rincón piurano",
      "Experiencia auténtica, no actuada",
    ],
    accent: "var(--amber)",
    accentSoft: "var(--border)",
    accentBorder: "var(--border)",
  },
  {
    id: "ia",
    tag: "BURRITO IA",
    emoji: "🤖",
    titulo: "El bot piuranisisisiiiimo",
    descripcion:
      "Dile cuánto tiempo tienes, qué se te antoja y dónde estás. En segundos tienes tu plan. Sin buscar, sin comparar, sin volverte loco.",
    features: [
      "Filtros: tiempo, presupuesto, estado de ánimo",
      "Itinerarios con lógica de ruta y traslados",
      "Tips secretos de locales incluidos",
      "Te habla como un pata de Piura - no como un robot .",
    ],
    accent: "var(--yellow)",
    accentSoft: "var(--border)",
    accentBorder: "var(--border)",
  },
];

/* ─── Inline styles ─── */
const S = {
  section: {
    padding: "88px 48px",
    position: "relative" as const,
    zIndex: 5,
    background: "var(--bg)",
  },
  inner: { maxWidth: 1080, margin: "0 auto" },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "2.5px",
    textTransform: "uppercase" as const,
    color: "#FF5500",
    marginBottom: 14,
    display: "block",
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(30px, 4vw, 54px)",
    fontWeight: 800,
    letterSpacing: "1px",
    color: "var(--white)",
    lineHeight: 1.1,
    marginBottom: 18,
  },
  sub: {
    fontSize: 17,
    color: "var(--gray)",
    maxWidth: 540,
    lineHeight: 1.62,
    marginBottom: 52,
  },
  card: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "28px 24px 24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
    cursor: "default",
    transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
    position: "relative" as const,
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute" as const,
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: "50%",
    pointerEvents: "none" as const,
    filter: "blur(60px)",
    opacity: 0.18,
  },
  tag: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  emoji: { fontSize: 22, lineHeight: 1 },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(17px, 1.8vw, 22px)",
    fontWeight: 750,
    letterSpacing: "-0.5px",
    color: "var(--white)",
    lineHeight: 1.3,
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: "var(--gray)",
    lineHeight: 1.72,
    marginBottom: 22,
    flexGrow: 1,
  },
  divider: {
    height: 1,
    background: "rgba(255,120,30,0.1)",
    marginBottom: 18,
  },
  featureList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start" as const,
    gap: 10,
    fontSize: 13,
    color: "var(--muted)",
    lineHeight: 1.5,
  },
  checkIcon: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 1,
    flexShrink: 0,
    fontFamily: "'IBM Plex Mono', monospace",
  },
};

/* ─── Card Component ─── */
function ProductCard({ producto, index, quizRef }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  const scrollToQuiz = (e: React.MouseEvent) => {
    e.stopPropagation();
    quizRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      style={{
        ...S.card,
        borderColor: hovered ? producto.accentBorder : "var(--border)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${producto.accentBorder}`
          : "0 4px 24px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ ...S.cardGlow, background: producto.accent, opacity: hovered ? 0.22 : 0.12, transition: "opacity 0.4s ease" }} />

      <div style={{ ...S.tag, color: producto.accent }}>
        <span style={S.emoji}>{producto.emoji}</span>
        {producto.tag}
      </div>

      <h3 style={S.cardTitle}>{producto.titulo}</h3>
      <p style={S.desc}>{producto.descripcion}</p>

      <div style={{
        ...S.divider,
        background: hovered ? producto.accentBorder : "rgba(255,120,30,0.1)",
        transition: "background 0.3s",
      }} />

      <ul style={{ ...S.featureList, listStyle: "none", margin: 0, padding: 0 }}>
        {producto.features.map((f: string, i: number) => (
          <li key={i} style={S.featureItem}>
            <span style={{ ...S.checkIcon, color: producto.accent }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {producto.id === "rutas" && quizRef && (
        <button
          onClick={scrollToQuiz}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "12px 16px",
            borderRadius: 10,
            border: `1px solid ${btnHovered ? producto.accent : producto.accentBorder}`,
            background: btnHovered ? producto.accentSoft : "transparent",
            color: btnHovered ? "var(--white)" : producto.accent,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <span>🧭</span>
          ¿Qué tipo de viajero eres? →
        </button>
      )}

      <div style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        color: hovered ? producto.accent : "var(--dim)",
        fontWeight: 700,
        letterSpacing: 1,
        transition: "color 0.3s",
      }}>
        0{index + 1}
      </div>
    </div>
  );
}

/* ─── Main Section ─── */
export default function ProductosBurrito({ onCTAClick, quizRef }: ProductosBurritoProps) {
  return (
    <section style={S.section}>
      <div style={S.inner}>
        <span style={S.label}>Los productos de Burrito</span>
        <h2 style={S.title}>
          Tres maneras de<br />
          <span style={{ color: "#FF5500" }}>vivir Piura de verdad.</span>
        </h2>
        <p style={S.sub}>
          Arma tu ruta solo. <br /> Explórala con un piurano de verdad o <br /> pregúntale a la IA. <br />Tú eliges cómo vivirla
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {productosBurrito.map((p, i) => (
            <ProductCard key={p.id} producto={p} index={i} quizRef={quizRef} />
          ))}
        </div>

        {onCTAClick && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button
              onClick={onCTAClick}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#FF5500",
                color: "#fff",
                padding: "15px 30px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 8px 32px rgba(255,85,0,0.32)",
                transition: "background 0.2s, transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ff7730";
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(255,85,0,0.42)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FF5500";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(255,85,0,0.32)";
              }}
            >
              <img src="/imagotipo.png" alt="" style={{ height: '22px', width: 'auto', verticalAlign: 'middle', marginRight: '8px', display: 'inline-block' }} />
              Armar mi itinerario ahora →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}