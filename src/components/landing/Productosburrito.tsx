import { useState } from "react";

/* ─── Data ─── */
const productosBurrito = [
  {
    id: "rutas",
    tag: "RUTAS BURRITO",
    emoji: "🗺️",
    titulo: "Tu itinerario en 60 segundos",
    descripcion:
      "Planes listos para usar: cultural, playero, gastronómico, sierra. Con horarios exactos, tiempos de traslado y tips que no están en ninguna guía.",
    features: [
      "Ruta Cultural — Circuito de museos + ceviche",
      "Ruta Playera — Piura → Paita → 3 playas",
      "Ruta Diversión — Parques, música y mercados",
      "Ruta Sierra — Ayabaca, Aypate y Las Huaringas",
    ],
    accent: "#FF5500",
    accentSoft: "rgba(255,85,0,0.10)",
    accentBorder: "rgba(255,85,0,0.22)",
  },
  {
    id: "churre",
    tag: "EL CHURRE",
    emoji: "🤝",
    titulo: "Tu guía local. No uno de TripAdvisor.",
    descripcion:
      "Jóvenes piuranos — estudiantes de Turismo y voluntarios culturales — que te llevan a los lugares que solo conocen los que viven aquí.",
    features: [
      "Tours personalizados medio día / día completo",
      "Alianza con UDEP, UNP y UCV Piura",
      "Conocimiento real de cada rincón piurano",
      "Experiencia auténtica, no actuada",
    ],
    accent: "#FFAA3B",
    accentSoft: "rgba(255,170,59,0.10)",
    accentBorder: "rgba(255,170,59,0.22)",
  },
  {
    id: "ia",
    tag: "BURRITO IA",
    emoji: "🤖",
    titulo: "El bot que habla piurano",
    descripcion:
      "Dinos cuánto tiempo tienes, qué te provoca y dónde estás. En segundos tienes un plan armado. Sin scroll infinito, sin tabs abiertos.",
    features: [
      "Filtros: tiempo, presupuesto, estado de ánimo",
      "Itinerarios con lógica de ruta y traslados",
      "Tips secretos de locales incluidos",
      "Tono amigable — como hablar con un pata piurano",
    ],
    accent: "#FFD166",
    accentSoft: "rgba(255,209,102,0.10)",
    accentBorder: "rgba(255,209,102,0.22)",
  },
];

/* ─── Inline styles ─── */
const S = {
  section: {
    padding: "88px 48px",
    position: "relative",
    zIndex: 5,
    background: "#080705",
  },
  inner: { maxWidth: 1080, margin: "0 auto" },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "2.5px",
    textTransform: "uppercase",
    color: "#FF5500",
    marginBottom: 14,
    display: "block",
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(30px, 4vw, 54px)",
    fontWeight: 800,
    letterSpacing: "-2px",
    color: "#FDFAF4",
    lineHeight: 1,
    marginBottom: 18,
  },
  sub: {
    fontSize: 17,
    color: "#6b6055",
    maxWidth: 540,
    lineHeight: 1.62,
    marginBottom: 52,
  },
  card: {
    background: "#111009",
    border: "1px solid rgba(255,120,30,0.16)",
    borderRadius: 16,
    padding: "28px 24px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    cursor: "default",
    transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
    position: "relative",
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: "50%",
    pointerEvents: "none",
    filter: "blur(60px)",
    opacity: 0.18,
  },
  tag: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  emoji: { fontSize: 22, lineHeight: 1 },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(17px, 1.8vw, 22px)",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#FDFAF4",
    lineHeight: 1.1,
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: "#6b6055",
    lineHeight: 1.72,
    marginBottom: 22,
    flexGrow: 1,
  },
  divider: {
    height: 1,
    background: "rgba(255,120,30,0.1)",
    marginBottom: 18,
  },
  featureList: { display: "flex", flexDirection: "column", gap: 10 },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13,
    color: "#8a7e6a",
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
function ProductCard({ producto, index, quizRef }) {
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  const scrollToQuiz = (e) => {
    e.stopPropagation();
    quizRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      style={{
        ...S.card,
        borderColor: hovered ? producto.accentBorder : "rgba(255,120,30,0.16)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${producto.accentBorder}`
          : "0 4px 24px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* glow blob */}
      <div
        style={{
          ...S.cardGlow,
          background: producto.accent,
          opacity: hovered ? 0.22 : 0.12,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* tag */}
      <div style={{ ...S.tag, color: producto.accent }}>
        <span style={S.emoji}>{producto.emoji}</span>
        {producto.tag}
      </div>

      {/* title */}
      <h3 style={S.cardTitle}>{producto.titulo}</h3>

      {/* description */}
      <p style={S.desc}>{producto.descripcion}</p>

      {/* divider */}
      <div
        style={{
          ...S.divider,
          background: hovered ? producto.accentBorder : "rgba(255,120,30,0.1)",
          transition: "background 0.3s",
        }}
      />

      {/* features */}
      <ul style={{ ...S.featureList, listStyle: "none", margin: 0, padding: 0 }}>
        {producto.features.map((f, i) => (
          <li key={i} style={S.featureItem}>
            <span style={{ ...S.checkIcon, color: producto.accent }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* BOTÓN QUIZ — solo card "rutas" */}
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
            color: btnHovered ? "#FDFAF4" : producto.accent,
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

      {/* number badge */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: hovered ? producto.accent : "#2a2318",
          fontWeight: 700,
          letterSpacing: 1,
          transition: "color 0.3s",
        }}
      >
        0{index + 1}
      </div>
    </div>
  );
}

/* ─── Main Section ─────────────────────────────
   Props:
   · onCTAClick → abre modal de itinerario
   · quizRef    → ref del <QuizSection> para scroll
─────────────────────────────────────────────── */
export default function ProductosBurrito({ onCTAClick, quizRef }) {
  return (
    <section style={S.section}>
      <div style={S.inner}>
        <span style={S.label}>Los productos de Burrito</span>
        <h2 style={S.title}>
          Tres maneras de<br />
          <span style={{ color: "#FF5500" }}>vivir Piura de verdad.</span>
        </h2>
        <p style={S.sub}>
          Desde el itinerario automático hasta el guía que solo los locales conocen.
          Elige tu forma de explorar.
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
              🌯 Armar mi itinerario ahora →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}