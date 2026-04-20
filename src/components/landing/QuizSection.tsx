import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#0D0C0A",
  bgCard: "#161410",
  bgCardHover: "#1E1A14",
  orange: "#E8621A",
  orangeLight: "#FF7A35",
  gold: "#D4A017",
  goldLight: "#F5C842",
  text: "#F0EAE0",
  textMuted: "#8A7E6E",
  textDim: "#4A4238",
  border: "#2A241C",
};

// ——— QUIZ DATA ———
const quizSteps = [
  {
    q: "¿Cuánto tiempo tienes en Piura?",
    opts: [
      { label: "Solo unas horas", icon: "⚡", val: "hours" },
      { label: "Un día completo", icon: "☀️", val: "day" },
      { label: "2–3 días", icon: "📅", val: "weekend" },
      { label: "Una semana o más", icon: "🧳", val: "week" },
    ],
  },
  {
    q: "¿Qué te mueve el corazón?",
    opts: [
      { label: "Playa y mar", icon: "🏖️", val: "playa" },
      { label: "Cultura e historia", icon: "🏛️", val: "cultura" },
      { label: "Comer rico (todo)", icon: "🍽️", val: "gastronomia" },
      { label: "Aventura y sierra", icon: "🏔️", val: "aventura" },
    ],
  },
  {
    q: "¿Cómo viajas?",
    opts: [
      { label: "Solo/a, a mi ritmo", icon: "🚶", val: "solo" },
      { label: "En pareja", icon: "💛", val: "pareja" },
      { label: "Con amigos", icon: "🎉", val: "amigos" },
      { label: "Con familia/niños", icon: "👨‍👩‍👧", val: "familia" },
    ],
  },
];

const profiles = {
  playa_day_solo: {
    tipo: "El Solitario del Pacífico",
    emoji: "🌊",
    desc: "Amaneceres sin turistas. Olas que nadie más conoce. Tu plan perfecto existe y está a 45 minutos de Piura.",
    ruta: ["7:00 — Desayuno en el mercado", "9:30 — Playa Yacila (la menos concurrida)", "13:00 — Ceviche en Paita puerto", "17:30 — Sunset desde La Islilla"],
  },
  cultura_day_solo: {
    tipo: "El Curioso Urbano",
    emoji: "🏛️",
    desc: "Piura tiene arqueología preincaica, museos ocultos y un circuito cultural que nadie conoce. Tú sí lo vas a conocer.",
    ruta: ["8:30 — Museo Vicus (cultura preinca)", "10:30 — Museo Miguel Grau", "12:00 — Cremolada en El Chalán", "13:30 — Ceviche en La Barra del Chino"],
  },
  aventura_weekend_solo: {
    tipo: "El Explorador de Altura",
    emoji: "🏔️",
    desc: "La sierra piurana es el secreto mejor guardado del norte. Aypate, Huancabamba y las lagunas de Las Huaringas te esperan.",
    ruta: ["Día 1 — Ruta a Ayabaca (sierra)", "Día 1 tarde — Santuario y mercado local", "Día 2 — Trekking a Aypate (sitio inca)", "Día 3 — Lagunas de Las Huaringas"],
  },
  gastronomia_hours_pareja: {
    tipo: "Los Cómplices del Sabor",
    emoji: "🍽️",
    desc: "Piura tiene una gastronomía única en el norte. Seco, ceviche de caballa, cremoladas. Un tour de sabores que no termina.",
    ruta: ["9:00 — Desayuno piurano en el mercado", "11:00 — Ceviche en el centro", "13:30 — Ruta de tamales y humitas", "17:00 — Jipibar (música + tragos locales)"],
  },
};

const getProfile = (answers) => {
  const key = `${answers[1]}_${answers[0]}_${answers[2]}`;
  return (
    profiles[key] ||
    profiles[`${answers[1]}_day_solo`] ||
    profiles["cultura_day_solo"]
  );
};

const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const Reveal = ({ children, delay = 0, className = "" }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};


export const QuizSection = ({ quizRef }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const choose = (val) => {
    const newAnswers = { ...answers, [step]: val };
    setAnswers(newAnswers);
    if (step < quizSteps.length - 1) {
      setStep(step + 1);
    } else {
      setResult(getProfile(newAnswers));
    }
  };

  const reset = () => { setStep(0); setAnswers({}); setResult(null); };

  return (
    <section ref={quizRef} style={{ padding: "80px 24px", maxWidth: 680, margin: "0 auto" }}>
      <Reveal>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: COLORS.gold, textTransform: "uppercase", marginBottom: 16 }}>
          ¿Qué tipo de viajero eres?
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px,5.5vw,40px)", fontWeight: 900, color: COLORS.text, letterSpacing: -1, margin: "0 0 8px", lineHeight: 1.1 }}>
          Descúbrelo en 3 preguntas.
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: COLORS.textMuted, margin: "0 0 36px" }}>
          Burrito te arma un itinerario personalizado basado en tu perfil.
        </p>
      </Reveal>

      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: "32px 28px" }}>
        {!result ? (
          <>
            {/* Progress */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
              {quizSteps.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i <= step ? COLORS.orange : COLORS.border,
                  transition: "background 0.3s",
                }} />
              ))}
            </div>

            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              {step + 1} de {quizSteps.length}
            </div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: COLORS.text, margin: "0 0 24px", letterSpacing: -0.5 }}>
              {quizSteps[step].q}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {quizSteps[step].opts.map(opt => (
                <button key={opt.val} onClick={() => choose(opt.val)} style={{
                  background: "transparent", border: `1px solid ${COLORS.border}`,
                  borderRadius: 12, padding: "16px 16px", cursor: "pointer",
                  display: "flex", flexDirection: "column", gap: 6, textAlign: "left",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.orange; e.currentTarget.style.background = "rgba(232,98,26,0.07)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 24 }}>{opt.icon}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: COLORS.text }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{result.emoji}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: COLORS.orange, textTransform: "uppercase", marginBottom: 8 }}>
                Tu perfil de viajero
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 900, color: COLORS.text, margin: "0 0 12px" }}>{result.tipo}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: COLORS.textMuted, lineHeight: 1.65, margin: "0 auto", maxWidth: 380 }}>{result.desc}</p>
            </div>

            <div style={{ background: COLORS.bgCardHover, borderRadius: 12, padding: "20px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: COLORS.gold, textTransform: "uppercase", marginBottom: 14 }}>
                Tu ruta sugerida
              </div>
              {result.ruta.map((stop, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < result.ruta.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: COLORS.orange, minWidth: 20 }}>{i + 1}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.text }}>{stop}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={{
                flex: 1, background: COLORS.orange, color: "#fff", border: "none",
                borderRadius: 10, padding: "14px", fontFamily: "'Syne', sans-serif",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>
                🌶️ Ver mi itinerario completo
              </button>
              <button onClick={reset} style={{
                background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.border}`,
                borderRadius: 10, padding: "14px 16px", fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, cursor: "pointer",
              }}>
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};