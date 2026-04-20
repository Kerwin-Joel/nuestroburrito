import { useState } from "react";

// ── Tipos ──
interface Alianza {
  id: string;
  emoji: string;
  tag: string;
  titulo: string;
  desc: string;
  accent: string;
}

const alianzas: Alianza[] = [
  {
    id: "universidades",
    emoji: "🎓",
    tag: "UNIVERSIDADES",
    titulo: "UDEP · UNP · UCV",
    desc: "Estudiantes de Turismo y Hotelería como Churres",
    accent: "#FFAA3B",
  },
  {
    id: "museos",
    emoji: "🏛️",
    tag: "MUSEOS & CULTURA",
    titulo: "Museo Vicus · BCR · Casa Grau",
    desc: "Contenido auténtico y accesos especiales",
    accent: "#FFAA3B",
  },
  {
    id: "gastronomia",
    emoji: "🍽️",
    tag: "GASTRONOMÍA LOCAL",
    titulo: "Restaurantes piuranos de verdad",
    desc: "Sin patrocinios. Solo los que merecen estar.",
    accent: "#FFAA3B",
  },
  {
    id: "voluntariados",
    emoji: "🌿",
    tag: "VOLUNTARIADOS",
    titulo: "Divulgación cultural piurana",
    desc: "Complemento a los Churres pagados",
    accent: "#FFAA3B",
  },
];

// ── Componente interno ──
interface AlianzaCardProps {
  alianza: Alianza;
}

function AlianzaCard({ alianza }: AlianzaCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#111009",
        border: `1px solid ${hovered ? "rgba(255,170,59,0.28)" : "rgba(255,120,30,0.14)"}`,
        borderRadius: 16,
        padding: "32px 28px 28px",
        display: "flex",
        flexDirection: "column" as const,
        gap: 0,
        transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,170,59,0.18)"
          : "0 4px 20px rgba(0,0,0,0.3)",
        position: "relative" as const,
        overflow: "hidden",
        cursor: "default",
      }}
    >
      <div style={{
        position: "absolute",
        top: -50,
        left: -50,
        width: 160,
        height: 160,
        borderRadius: "50%",
        background: "#FFAA3B",
        filter: "blur(55px)",
        opacity: hovered ? 0.1 : 0.05,
        transition: "opacity 0.4s ease",
        pointerEvents: "none",
      }} />

      <div style={{ fontSize: 36, marginBottom: 20, lineHeight: 1 }}>{alianza.emoji}</div>

      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "2px",
        textTransform: "uppercase" as const,
        color: alianza.accent,
        marginBottom: 10,
        fontFamily: "'Bricolage Grotesque', sans-serif",
      }}>
        {alianza.tag}
      </div>

      <div style={{
        fontSize: 17,
        fontWeight: 700,
        color: "#FDFAF4",
        marginBottom: 8,
        letterSpacing: "-0.2px",
        lineHeight: 1.25,
        fontFamily: "'Bricolage Grotesque', sans-serif",
      }}>
        {alianza.titulo}
      </div>

      <div style={{
        fontSize: 14,
        color: "#6b6055",
        lineHeight: 1.65,
        fontFamily: "'Bricolage Grotesque', sans-serif",
      }}>
        {alianza.desc}
      </div>
    </div>
  );
}

export default function AlianzasBurrito() {
  return (
    <section style={{
      padding: "88px 48px",
      background: "#080705",
      position: "relative" as const,
      zIndex: 5,
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "2.5px",
          textTransform: "uppercase" as const,
          color: "#FF5500",
          marginBottom: 18,
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}>
          Modelo de Alianzas
        </div>

        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(36px, 5.5vw, 72px)",
          fontWeight: 800,
          letterSpacing: "-3px",
          color: "#FDFAF4",
          lineHeight: 0.97,
          marginBottom: 22,
        }}>
          Burrito no construye<br />solo.
        </h2>

        <p style={{
          fontSize: 17,
          color: "#6b6055",
          maxWidth: 560,
          lineHeight: 1.62,
          marginBottom: 52,
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}>
          Activamos un ecosistema donde los piuranos se benefician de mostrar su propia ciudad.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {alianzas.map((a) => (
            <AlianzaCard key={a.id} alianza={a} />
          ))}
        </div>
      </div>
    </section>
  );
}