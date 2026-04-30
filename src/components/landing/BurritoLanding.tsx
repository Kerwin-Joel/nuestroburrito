// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react';
import MapHero from './MapHero.tsx';
import ProductosBurrito from './Productosburrito.tsx';
import AlianzasBurrito from './Alianzasburrito.tsx';
import { QuizSection } from './QuizSection.tsx';
import { supabase } from "../../lib/supabase";
import WaitlistSuccess from "./WaitlistSuccess";
import BurritoDonkey from '../shared/Burritodonkey.tsx';


/* ─── Data ─── */
const TICKERS = [
  'Piura te espera', 'Tu itinerario en 60 segundos',
  'Experiencias locales reales', 'Sin planificación, sin experiencia',
  'Rutas optimizadas con IA', '100% spots locales',
];

const PHONE_ITIN = [{ time: "7:30", icon: "🌄", place: "Mirador Canchaque", tip: "Llega antes de las 8am" }, { time: "10:00", icon: "🏖️", place: "Playa Colán", tip: "La menos turística del norte" }, { time: "13:30", icon: "🍋", place: "Cebichería Don Miguel", tip: "Mero fresco — no está en guías" }, { time: "17:00", icon: "🌅", place: "Sunset Lobitos", tip: "Spot secreto de surfistas" }];
const PAIN = [["01", "Abres 12 Pestañas. Cierras 12 Pestañas.", "Sigues sin saber qué hacer."], ["02", "Google Maps te muestra 80 opciones.", "No te dice cuál elegir."], ["03", "Las guías te mandan a los mismos 3 lugares.", "Los turísticos. Los aburridos."], ["04", "Llegas al restaurante y ya cerró.", "Nadie te avisó."]];
const STEPS_D = [{ n: "01", title: "Dinos qué te gusta", desc: "Playa, gastronomía, aventura o cultura. 3 preguntas. 20 segundos." }, { n: "02", title: "Tu ruta aparece", desc: "IA + conocimiento local de Piura. Horarios y traslados entre distritos." }, { n: "03", title: "Ve y disfruta.", desc: "¿No te cuadra algo? Cámbialo en un toque. Tú mandas." }];
const COMPARE = [["Te muestra opciones. Tú decides todo.", "Te dice exactamente qué hacer y cuándo."], ["Sin horarios, sin lógica de ruta.", "Ruta optimizada, traslados calculados."], ["Mismos lugares que todos.", "Spots locales que nadie más conoce."], ["Tarda horas. O días.", "Tu itinerario en 60 segundos."], ["No sabe si llueve el sábado.", "Adapta el plan al clima y contexto real."]];
const TESTI = [{ i: "M", name: "María G.", from: "Lima · enero 2025", text: "Llegué a Piura sin ningún plan. En 2 minutos tenía todo el día organizado. Fui a un cebiche que no está en ninguna guía y fue lo mejor del viaje." }, { i: "C", name: "Carlos R.", from: "Chiclayo · semana santa", text: "Lo usé con mi familia: 'niños + playa + comida local'. Nos dio el itinerario perfecto. Sin carreras, sin perdernos." }, { i: "A", name: "Andrea T.", from: "Argentina · mochilera en Perú", text: "Llevaba 2 horas en TripAdvisor sin decidir nada. Probé Burrito y en 1 minuto tenía el día listo. Nunca más sin esto." }];
const DEMO_ROWS = [
  { time: '7:00', travel: 'Inicio', place: 'Desayuno El Chalán', desc: 'Tamalitos verdes con café de Chulucanas.', tip: 'Pide la «mañanera» — no está en el menú' },
  { time: '9:30', travel: '40 min', place: 'Playa Yacila', desc: 'La menos concurrida del norte. Agua transparente.', tip: 'Antes de las 10am para elegir mejor lugar' },
  { time: '13:00', travel: '15 min', place: 'Cebichería El Puerto · Paita', desc: 'Leche de tigre de cangrejo. El mejor del litoral.', tip: 'Pide el cebiche mixto — la joya del lugar' },
  { time: '17:30', travel: '25 min', place: 'Mirador Sunset · Talara', desc: 'El sol cae directo sobre el Pacífico desde aquí.', tip: 'Domingos hay música en vivo' },
];
const WHO_OPT = [{ id: "tourist", icon: "🧳", label: "Turista", sub: "De otra ciudad" }, { id: "local", icon: "🏠", label: "Soy de Piura", sub: "Conozco la región" }, { id: "transit", icon: "✈️", label: "De paso", sub: "Pocas horas" }];
const GROUP_OPT = [{ id: "solo", icon: "👤", label: "Solo/a" }, { id: "couple", icon: "👫", label: "En pareja" }, { id: "family", icon: "👨‍👩‍👧", label: "Familia" }, { id: "friends", icon: "👯", label: "Amigos" }];
const TIME_OPT = [{ id: "4h", icon: "⏱️", label: "Menos de 4h", sub: "Visita rápida" }, { id: "6h", icon: "🌅", label: "Medio día", sub: "4–6 horas" }, { id: "full", icon: "☀️", label: "Día completo", sub: "6+ horas" }, { id: "wknd", icon: "📅", label: "Fin de semana", sub: "2 días" }];
const BUDGET_OPT = [{ id: "low", icon: "💸", label: "Económico", sub: "Hasta S/50" }, { id: "mid", icon: "👌", label: "Moderado", sub: "S/50–S/150" }, { id: "high", icon: "✨", label: "Sin límite", sub: "Lo mejor" }];
const INTERESTS = [{ id: "beach", icon: "🏖️", label: "Playa y mar" }, { id: "food", icon: "🍽️", label: "Gastronomía" }, { id: "nature", icon: "🏔️", label: "Sierra" }, { id: "culture", icon: "🎨", label: "Arte y cultura" }, { id: "adventure", icon: "🌊", label: "Aventura" }, { id: "markets", icon: "🛍️", label: "Mercados" }, { id: "photo", icon: "📸", label: "Fotografía" }, { id: "relax", icon: "☕", label: "Café y relax" }];
const GEN_MSGS = ["Consultando con los locales…", "Calculando rutas entre distritos…", "Buscando los mejores horarios…", "Añadiendo tips secretos…", "Armando tu itinerario perfecto…"];
const STEP_LABELS = ["Tú", "Tiempo", "Intereses", "Generando", "Tu día", "Enviar"];

function generateItinerary(prefs) {
  const isFamily = prefs.group === "family", short = prefs.time === "4h" || prefs.time === "6h";
  const ix = prefs.interests || [];
  const hasBeach = ix.includes("beach"), hasFood = ix.includes("food") || !ix.length;
  const hasNature = ix.includes("nature"), hasCulture = ix.includes("culture");
  const all = [
    { time: "7:00", place: "Desayuno en El Chalán", desc: "Tamalitos verdes con café de Chulucanas.", tip: "Pide la «mañanera» — no está en el menú", type: "food" },
    { time: "9:30", place: isFamily ? "Playa Colán" : "Playa Yacila", desc: isFamily ? "Agua calmada, perfecta para niños." : "La menos concurrida. Agua transparente.", tip: isFamily ? "Llega antes de las 10am" : "Menos turistas entre semana", type: "beach" },
    { time: "13:00", place: "Cebichería El Puerto · Paita", desc: "Leche de tigre de cangrejo.", tip: "Pide el cebiche mixto — la joya del lugar", type: "food" },
    { time: "10:00", place: "Mercado Artesanal de Catacaos", desc: "Filigrana de oro y chicha de jora.", tip: "Los mejores precios antes del mediodía", type: "culture" },
    { time: "11:30", place: "Mirador de Canchaque", desc: "Vista panorámica de la sierra piurana.", tip: "Hermoso antes del mediodía", type: "nature" },
    { time: "17:30", place: "Mirador Sunset · Talara", desc: "El sol cae sobre el Pacífico.", tip: "Domingos hay música en vivo", type: "beach" },
  ];
  let sel = [];
  if (hasFood) sel.push(all[0]);
  if (hasBeach) sel.push(all[1]);
  if (hasFood) sel.push(all[2]);
  if (hasNature && !short) sel.push(all[4]);
  if (hasCulture && !short) sel.push(all[3]);
  if (hasBeach && !short) sel.push(all[5]);
  if (!sel.length) sel = all.slice(0, short ? 3 : 5);
  if (short) sel = sel.slice(0, 3);
  return sel.map((s, i) => ({ ...s, id: Date.now() + i }));
}

/* ══════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════ */
function Modal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({ who: "", group: "", time: "", budget: "", interests: [] });
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newStop, setNewStop] = useState({ time: "", place: "", tip: "" });
  const [user, setUser] = useState({ name: "", phone: "", email: "" });
  const [sent, setSent] = useState(false);
  const [genPct, setGenPct] = useState(0);
  const [genMsg, setGenMsg] = useState(0);

  useEffect(() => { if (isOpen) { setStep(0); setPrefs({ who: "", group: "", time: "", budget: "", interests: [] }); setSent(false); setGenPct(0); } }, [isOpen]);
  useEffect(() => { const fn = e => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); }, [onClose]);

  useEffect(() => {
    if (step !== 3) return;
    setGenPct(0);
    const iv = setInterval(() => setGenPct(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + 2.4; }), 65);
    const mv = setInterval(() => setGenMsg(i => (i + 1) % GEN_MSGS.length), 1100);
    return () => { clearInterval(iv); clearInterval(mv); };
  }, [step]);

  useEffect(() => {
    if (step === 3 && genPct >= 100) { const t = setTimeout(() => { setItems(generateItinerary(prefs)); setStep(4); }, 400); return () => clearTimeout(t); }
  }, [genPct, step]);

  const canNext = () => { if (step === 0) return prefs.who && prefs.group; if (step === 1) return prefs.time && prefs.budget; return true; };
  const next = () => { if (step < 5) setStep(s => s + 1); };
  const back = () => { if (step > 0 && step !== 3) setStep(s => s - 1); };
  const toggle = id => setPrefs(p => ({ ...p, interests: p.interests.includes(id) ? p.interests.filter(i => i !== id) : [...p.interests, id] }));
  const removeItem = id => setItems(p => p.filter(i => i.id !== id));
  const moveUp = idx => setItems(p => { if (!idx) return p; const a = [...p];[a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a; });
  const moveDown = idx => setItems(p => { if (idx === p.length - 1) return p; const a = [...p];[a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a; });
  const addStop = () => { if (!newStop.place) return; setItems(p => [...p, { ...newStop, id: Date.now(), desc: "" }]); setNewStop({ time: "", place: "", tip: "" }); setAdding(false); };
  const fmtItin = () => items.map(i => `${i.time} — ${i.place}${i.tip ? `\n   💡 ${i.tip}` : ""}`).join("\n");
  const sendWA = () => { if (!user.phone) return; const text = encodeURIComponent(`🫔 *Tu itinerario Burrito — Piura*\n\n${fmtItin()}\n\n_burrito.pe_`); const ph = user.phone.replace(/\D/g, ""); window.open(`https://wa.me/${ph.startsWith("51") ? ph : "51" + ph}?text=${text}`, "_blank"); setSent(true); };
  const sendEmail = () => { if (!user.email) return; const sub = encodeURIComponent("Tu itinerario en Piura — Burrito 🫔"); const body = encodeURIComponent(`Hola${user.name ? " " + user.name : ""}!\n\n${fmtItin()}\n\nDisfruta Piura 🌊\n— Burrito`); window.location.href = `mailto:${user.email}?subject=${sub}&body=${body}`; setSent(true); };

  if (!isOpen) return null;
  const pct = (step / (STEP_LABELS.length - 1)) * 100;

  return (
    <div className="m-back" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="m-panel" role="dialog" aria-modal="true">
        <div className="m-hdr">
          <div className="m-logo">burri<span>to</span></div>
          <button className="m-x" onClick={onClose}>✕</button>
        </div>
        {step !== 3 && (
          <div className="m-prog">
            <div className="m-pt"><div className="m-pf" style={{ width: `${pct}%` }} /></div>
            <div className="m-slbls">{STEP_LABELS.map((l, i) => <span key={l} className={`m-slbl${i === step ? " act" : i < step ? " dn" : ""}`}>{l}</span>)}</div>
          </div>
        )}
        <div className="m-body">

          {/* STEP 0 */}
          {step === 0 && <div className="m-step">
            <div className="m-step-title">¿Cómo llegas a Piura?</div>
            <div className="m-step-sub">Para personalizar mejor tu experiencia</div>
            <div className="m-choices">
              {WHO_OPT.map(o => <button key={o.id} className={`m-choice${prefs.who === o.id ? " sel" : ""}`} onClick={() => setPrefs(p => ({ ...p, who: o.id }))}><span className="m-cico">{o.icon}</span><div><div className="m-clbl">{o.label}</div><div className="m-csub">{o.sub}</div></div></button>)}
            </div>
            <div className="m-step-sub" style={{ marginTop: 8 }}>¿Viajes solo o acompañado?</div>
            <div className="m-choices" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
              {GROUP_OPT.map(o => <button key={o.id} className={`m-choice${prefs.group === o.id ? " sel" : ""}`} onClick={() => setPrefs(p => ({ ...p, group: o.id }))}><span className="m-cico">{o.icon}</span><div className="m-clbl" style={{ fontSize: 12 }}>{o.label}</div></button>)}
            </div>
          </div>}

          {/* STEP 1 */}
          {step === 1 && <div className="m-step">
            <div className="m-step-title">Tiempo y presupuesto</div>
            <div className="m-step-sub">Para que el plan sea realista</div>
            <div className="m-step-sub" style={{ marginBottom: 10 }}>¿Cuánto tiempo tienes?</div>
            <div className="m-choices">
              {TIME_OPT.map(o => <button key={o.id} className={`m-choice${prefs.time === o.id ? " sel" : ""}`} onClick={() => setPrefs(p => ({ ...p, time: o.id }))}><span className="m-cico">{o.icon}</span><div><div className="m-clbl">{o.label}</div><div className="m-csub">{o.sub}</div></div></button>)}
            </div>
            <div className="m-step-sub" style={{ marginTop: 14, marginBottom: 10 }}>¿Tu presupuesto?</div>
            <div className="m-choices m-c3">
              {BUDGET_OPT.map(o => <button key={o.id} className={`m-choice${prefs.budget === o.id ? " sel" : ""}`} onClick={() => setPrefs(p => ({ ...p, budget: o.id }))}><span className="m-cico">{o.icon}</span><div><div className="m-clbl">{o.label}</div><div className="m-csub">{o.sub}</div></div></button>)}
            </div>
          </div>}

          {/* STEP 2 */}
          {step === 2 && <div className="m-step">
            <div className="m-step-title">¿Qué quieres vivir?</div>
            <div className="m-step-sub">Puedes elegir varios o ninguno</div>
            <div className="m-chips">
              {INTERESTS.map(c => <button key={c.id} className={`m-chip${prefs.interests.includes(c.id) ? " sel" : ""}`} onClick={() => toggle(c.id)}><span style={{ fontSize: 16 }}>{c.icon}</span>{c.label}</button>)}
            </div>
            <button className="m-choice" style={{ width: "100%", justifyContent: "center", opacity: .65 }} onClick={() => setPrefs(p => ({ ...p, interests: [] }))}>
              <span className="m-cico">🎲</span><div className="m-clbl">Sorpréndeme — elige por mí</div>
            </button>
          </div>}

          {/* STEP 3 — burrito corriendo */}
          {step === 3 && (
            <div className="m-step">
              <div className="m-gen">
                <MapHero marginTop="-200px" transformValue="translate(-20%, 17px)" sizeLoaded={true} />
                <div className="m-gen-ov">
                  <div className="m-gen-msg">{GEN_MSGS[genMsg]}</div>

                  {/* Track del burrito */}
                  <div style={{ position: 'relative', width: '100%', margin: '16px 0 8px' }}>

                    {/* Burrito 3D corriendo */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: `calc(${Math.min(genPct, 92)}% - 40px)`,
                      width: '80px',
                      height: '80px',
                      transition: 'left 0.5s linear',
                      transform: 'scaleX(-1)',
                      filter: 'drop-shadow(0 0 12px rgba(255,85,0,0.9)) drop-shadow(0 0 24px rgba(255,85,0,0.5))',
                      pointerEvents: 'none',
                    }}>
                      <BurritoDonkey autoRotate={true} />
                    </div>

                    {/* Barra de progreso */}
                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(255,255,255,0.12)',
                      borderRadius: '99px',
                      overflow: 'hidden',
                      marginTop: '88px',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${genPct}%`,
                        background: 'linear-gradient(to right, #FF5500, #FF8C00)',
                        borderRadius: '99px',
                        transition: 'width 0.3s linear',
                        boxShadow: '0 0 8px rgba(255,85,0,0.6)',
                      }} />
                    </div>
                  </div>

                  <div className="m-gen-pct">{Math.min(100, Math.round(genPct))}%</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — edit itinerary */}
          {step === 4 && <div className="m-step">
            <div className="m-itin-hd">
              <div className="m-itin-t" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/imagotipo.png" alt="" style={{ height: '24px', width: 'auto' }} />
                Tu itinerario
              </div>
              <span className="m-itin-b">{items.length} paradas</span>
            </div>
            {items.map((item, idx) => (
              <div key={item.id} className="m-item">
                <div className="m-itime">{item.time}</div>
                <div className="m-idot" />
                <div className="m-icont">
                  <div className="m-iplace">{item.place}</div>
                  {item.desc && <div className="m-idesc">{item.desc}</div>}
                  {item.tip && <div className="m-itip">💡 {item.tip}</div>}
                </div>
                <div className="m-iacts">
                  <button className="m-ibtn" onClick={() => moveUp(idx)}>↑</button>
                  <button className="m-ibtn" onClick={() => moveDown(idx)}>↓</button>
                  <button className="m-ibtn del" onClick={() => removeItem(item.id)}>✕</button>
                </div>
              </div>
            ))}
            {!adding
              ? <button className="m-add-btn" onClick={() => setAdding(true)}>＋ Añadir parada</button>
              : <div className="m-add-form">
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--hot)", marginBottom: 4 }}>Nueva parada</div>
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10 }}>
                  <div><label className="m-ilbl">Hora</label><input className="m-inp" placeholder="14:00" value={newStop.time} onChange={e => setNewStop(p => ({ ...p, time: e.target.value }))} /></div>
                  <div><label className="m-ilbl">Lugar</label><input className="m-inp" placeholder="Mirador de Canchaque" value={newStop.place} onChange={e => setNewStop(p => ({ ...p, place: e.target.value }))} /></div>
                </div>
                <div><label className="m-ilbl">Tip (opcional)</label><input className="m-inp" placeholder="Algo que deberías saber..." value={newStop.tip} onChange={e => setNewStop(p => ({ ...p, tip: e.target.value }))} /></div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="m-back-btn" onClick={() => setAdding(false)}>Cancelar</button>
                  <button className="m-next-btn" onClick={addStop}>Añadir</button>
                </div>
              </div>
            }
          </div>}

          {/* STEP 5 — confirm */}
          {step === 5 && !sent && <div className="m-step">
            <div className="m-step-title">¡Listo! Envíate el itinerario 🎉</div>
            <div className="m-step-sub">Déjanos tus datos para enviártelo</div>
            <div className="m-prev">
              {items.map(item => <div key={item.id} className="m-prev-item"><span className="m-prev-time">{item.time}</span><span className="m-prev-place">{item.place}</span></div>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 18 }}>
              <div><label className="m-ilbl">Tu nombre (opcional)</label><input className="m-inp" placeholder="¿Cómo te llamamos?" value={user.name} onChange={e => setUser(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="m-ilbl">📱 WhatsApp</label><input className="m-inp" type="tel" placeholder="+51 999 999 999" value={user.phone} onChange={e => setUser(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><label className="m-ilbl">📧 Email</label><input className="m-inp" type="email" placeholder="tu@email.com" value={user.email} onChange={e => setUser(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <button className="m-wa" onClick={sendWA} disabled={!user.phone}>📱 Enviar a WhatsApp</button>
            <button className="m-em" onClick={sendEmail} disabled={!user.email}>📧 Enviar al correo</button>
            <div className="m-or"><span></span></div>
            {/* <div className="m-or"><span>o</span></div> */}
            {/* <button className="m-goapp" onClick={() => window.open("https://burrito.pe", "_blank")}>🚀 Ir a la app completa →</button> */}
            <p style={{ fontSize: 11, color: "#3d3628", textAlign: "center", marginTop: 12 }}>Tu información no se comparte con terceros</p>
          </div>}

          {/* SUCCESS */}
          {step === 5 && sent && <div className="m-success">
            <div style={{
              bottom: '10px',
              left: `calc(${Math.min(genPct, 92)}% - 40px)`,
              width: '80px',
              height: '80px',
              transition: 'left 0.5s linear',
              transform: 'scaleX(-1)',
              filter: 'drop-shadow(0 0 12px rgba(255,85,0,0.9)) drop-shadow(0 0 24px rgba(255,85,0,0.5))',
              pointerEvents: 'none',
            }}>
              <BurritoDonkey autoRotate={true} />
            </div>
            <div className="m-stitle">¡Listo para el viaje!</div>
            <div className="m-ssub">Tu itinerario fue enviado. Que disfrutes Piura como se merece.</div>
            <button className="m-goapp" onClick={() => window.open("https://nuestroburrito.com", "_blank")}>🚀 Abrir la app completa →</button>
          </div>}

        </div>

        {/* footer nav */}
        {step !== 3 && step !== 5 && (
          <div className="m-foot">
            {step > 0 && <button className="m-back-btn" onClick={back}>← Atrás</button>}
            {step === 2 && <button className="m-skip" onClick={() => setPrefs(p => ({ ...p, interests: [] }))}>Sorpréndeme 🎲</button>}
            {step < 3 && <button className="m-next-btn" onClick={next} disabled={!canNext()}>{step === 2 ? "Generar itinerario 🫔" : "Continuar →"}</button>}
            {step === 4 && <button className="m-next-btn" onClick={() => setStep(5)}>Confirmar y enviar →</button>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN LANDING
══════════════════════════════════════════════════ */
export default function BurritoLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const quizRef = useRef(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [wsp, setWsp] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dia, setDia] = useState("")
  const [mes, setMes] = useState("")
  const [anio, setAnio] = useState("")

  const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (!document.getElementById("b-css")) { const s = document.createElement("style"); s.id = "b-css"; s.textContent = CSS; document.head.appendChild(s); }
    document.title = "Burrito — Tu itinerario en Piura en 60 segundos";
    const sm = (n, c, p = false) => { let el = document.querySelector(p ? `meta[property="${n}"]` : `meta[name="${n}"]`); if (!el) { el = document.createElement("meta"); p ? el.setAttribute("property", n) : el.setAttribute("name", n); document.head.appendChild(el); } el.setAttribute("content", c); };
    sm("description", "Burrito crea tu itinerario personalizado en Piura en menos de 60 segundos.");
    sm("og:title", "Burrito — Tu itinerario en Piura en 60 segundos", true);
    sm("geo.region", "PE-PIU");
    if (!document.getElementById("b-ld")) { const s = document.createElement("script"); s.id = "b-ld"; s.type = "application/ld+json"; s.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Burrito", "applicationCategory": "TravelApplication", "operatingSystem": "Web" }); document.head.appendChild(s); }
  }, []);

  useEffect(() => { const fn = () => setScrolled(window.scrollY > 30); window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  useEffect(() => { const els = document.querySelectorAll("[data-rv]"); const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .1 }); els.forEach(el => io.observe(el)); return () => io.disconnect(); }, []);
  useEffect(() => { const fn = e => { if (e.clientY <= 0 && !modalOpen && !sessionStorage.getItem("bExit")) { setModalOpen(true); sessionStorage.setItem("bExit", "1"); } }; document.addEventListener("mouseleave", fn); return () => document.removeEventListener("mouseleave", fn); }, [modalOpen]);

  const open = useCallback(() => setModalOpen(true), []);
  const close = useCallback(() => setModalOpen(false), []);

  const submit = useCallback(async () => {
    if (!nombre.trim() || !email.includes("@") || wsp.length < 7) {
      setError("Completa todos los campos correctamente.");
      return;
    }
    setLoading(true);
    setError("");
    const fechaNacimiento = dia && mes && anio
      ? `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      : null
    const { error: sbError } = await supabase
      .from("waitlist")
      .insert({ nombre: nombre.trim(), email: email.trim(), whatsapp: wsp.trim(), fecha_nacimiento: fechaNacimiento || null });
    if (sbError) {
      setError(sbError.code === "23505" ? "Este email ya está registrado 👋" : "Algo salió mal, intenta de nuevo.");
    } else {
      setOk(true);
    }
    setLoading(false);
  }, [nombre, email, wsp, dia, mes, anio]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--white)", fontFamily: "'Bricolage Grotesque',sans-serif" }}>

      {/* ticker */}
      <div className="b-ticker"><div className="b-tki">{[...TICKERS, ...TICKERS].map((t, i) => <span className="b-ti" key={i}>{t}</span>)}</div></div>

      {/* nav */}
      <nav className={`b-nav${scrolled ? " sc" : ""}`}>
        <div className="b-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>burri<span>to</span></div>
        <button className="b-btn-nav" onClick={open}>Probar GRATIS →</button>
      </nav>

      {/* hero */}
      <section className="b-hero">
        <MapHero />
        <div className="b-hero-ov" />
        <div className="b-hcopy">
          <div className="b-kicker"><div className="b-kdot" /><span className="b-ktxt">BETA ABIERTA · PIURA, PERÚ</span></div>
          <h1 className="b-h1">Para de<br /><span className="b-strike">perderte</span><br />Piura de<br /><span className="b-hot">verdad.</span></h1>
          <p className="b-sub">Google Maps te dice dónde está. <strong><br />Burrito</strong> te dice <strong>a qué hora ir, qué pedir y por dónde empezar.</strong></p>
          <div className="b-actions">
            <button className="b-btn-fire" onClick={open}>Arma mi experiencia →</button>
            <a href="#demo" className="b-btn-ghost">▶ ¿Qué tipo de viajero soy?</a>
          </div>
          <div className="b-stats">
            <div><div className="b-snum">60s</div><div className="b-slbl">para tu itinerario</div></div>
            <div><div className="b-snum">100%</div><div className="b-slbl">experiencias locales</div></div>
            <div><div className="b-snum">0</div><div className="b-slbl">guías genéricas</div></div>
          </div>
          <div className="b-urg"><div className="b-kdot" /><span>Solo <strong>100 cupos</strong> de acceso anticipado gratuito</span></div>
        </div>
        <div className="b-phone-col">
          <div className="b-phone">
            <div className="b-pst"><span>9:41</span><span>🔋 98%</span></div>
            <div className="b-pan" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src="/imagotipo.png" alt="" style={{ height: '20px', width: 'auto' }} />
              Burrito · Piura
            </div>
            <div className="b-itin">
              <div className="b-ith"><span className="b-ititle">Tu día · playa + ceviche</span><span className="b-ibadge">LISTO</span></div>
              {PHONE_ITIN.map((it, i) => <div className="b-irow" key={i}><div className="b-itime">{it.time}</div><div className="b-idot" /><div><div className="b-iplace">{it.icon} {it.place}</div><div className="b-itip"><em>{it.tip}</em></div></div></div>)}
            </div>
            <div className="b-pgen"><div className="b-gdot" /> Generado en 48 segundos</div>
          </div>
        </div>
      </section>

      {/* pain */}
      <section className="b-sec b-card">
        <div className="b-si">
          <div className="b-slbl">El problema real</div>
          <h2 className="b-stitle">Cada hora planeando<br />es una hora que no<br />estás en Piura.</h2>
          <p className="b-ssub">Pestañas abiertas, reseñas contradictorias, restaurantes cerrados. El ciclo de siempre.</p>
          <div className="b-plist" data-rv>
            {PAIN.map(([n, m, s], i) => <div className="b-pitem" key={i}><span className="b-pnum">{n}</span><span className="b-ptxt">{m} <span>{s}</span></span></div>)}
          </div>
        </div>
      </section>

      {/* solution */}
      <section className="b-sec">
        <div className="b-si">
          <div className="b-slbl">La solución</div>
          <h2 className="b-stitle">Burrito organiza<br /><span className="b-hot">por ti.</span></h2>
          <div className="b-div" />
          <p className="b-ssub">No te mandamos una lista. Te armamos el día completo. Todo en menos de 1 minuto.</p>
          <div className="b-steps" data-rv>
            {STEPS_D.map((s, i) => <div className="b-step" key={i}><div className="b-stepn">{s.n}</div><h3>{s.title}</h3><p>{s.desc}</p></div>)}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}><button className="b-btn-fire" onClick={open}>Pruébalo ahora — es gratis →</button></div>
        </div>
      </section>

      {/* products */}
      <ProductosBurrito onCTAClick={open} quizRef={quizRef} />
      <div id="demo"><QuizSection quizRef={quizRef} /></div>

      {/* demo */}
      <section className="b-sec b-card">
        <div className="b-si">
          <div className="b-slbl">Ejemplo real</div>
          <h2 className="b-stitle">Esto es lo que recibes.<br /><span className="b-hot">No una lista.</span> Un día.</h2>
          <div className="b-demo" data-rv>
            <div className="b-dtop"><span className="b-dtitle">🌊 Piura · sábado · playa + ceviche</span><span className="b-dbadge">8 HRS · 4 PARADAS</span></div>
            <div className="b-dbody">
              {DEMO_ROWS.map((r, i) => <div className="b-drow" key={i}><div><div className="b-dtime">{r.time}</div><div className="b-dtravel">{r.travel}</div></div><div className="b-dbar" /><div><div className="b-dplace">{r.place}</div><div className="b-ddesc">{r.desc}</div><div className="b-dtip">💡 {r.tip}</div></div></div>)}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}><button className="b-btn-fire" onClick={open}>Generar el mío →</button></div>
        </div>
      </section>

      {/* alliance */}
      <AlianzasBurrito />

      {/* compare */}
      <section className="b-sec">
        <div className="b-si">
          <div className="b-slbl">La diferencia</div>
          <h2 className="b-stitle">Google Maps muestra.<br />Burrito <span className="b-hot">decide.</span></h2>
          <p className="b-ssub">Google Maps es buenazo para ubicarte. Burrito te recomienda qué hacer cuando llegas.</p>
          <div className="b-cmp" data-rv>
            <div className="b-ccol"><div className="b-chd b-chd-t">Google Maps / Blogs / TripAdvisor</div>{COMPARE.map(([t], i) => <div className="b-crow b-crow-t" key={i}>{t}</div>)}</div>
            <div className="b-ccol"><div className="b-chd b-chd-u" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><img src="/imagotipo.png" alt="" style={{ height: '18px', width: 'auto' }} />Burrito</div>{COMPARE.map(([, u], i) => <div className="b-crow b-crow-u" key={i}>{u}</div>)}</div>
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section className="b-sec b-card">
        <div className="b-si">
          <div className="b-slbl">Lo que dicen</div>
          <h2 className="b-stitle">Ya lo probaron.<br />Ya no vuelven atrás.</h2>
          <div className="b-tgrid" data-rv>
            {TESTI.map((t, i) => <article className="b-tc" key={i}><div className="b-tstars">★★★★★</div><p className="b-ttxt">"{t.text}"</p><div className="b-tfoot"><div className="b-tav">{t.i}</div><div><div className="b-tname">{t.name}</div><div className="b-twhere">{t.from}</div></div></div></article>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="b-sec b-cta-s">
        <div className="b-si b-cta-i">
          <div className="b-slbl" style={{ display: "flex", justifyContent: "center" }}>200 cupos · Gratis · Ya</div>
          <h2 className="b-cta-t">Tu día en Piura<br />empieza <span className="b-hot">aquí.</span></h2>
          <p className="b-cta-sub">Arma tu itinerario ahora o déjanos tu email.</p>
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <button className="b-btn-fire" onClick={open} style={{ fontSize: 16, padding: "17px 38px", display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <img src="/imagotipo.png" alt="" style={{ height: '24px', width: 'auto' }} />
              Armar mi itinerario ahora
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: 440, margin: "0 auto 22px", color: "#2a2318", fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,120,30,.12)" }} /><span>o déjanos tu email</span><div style={{ flex: 1, height: 1, background: "rgba(255,120,30,.12)" }} />
          </div>
          {!ok ? (
            <>
              <div className="b-erow" style={{ flexDirection: "column", gap: 12 }}>
                <input type="text" className="b-einput" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
                <input type="email" className="b-einput" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="tel" className="b-einput" placeholder="WhatsApp (ej: 51987654321)" value={wsp} onChange={e => setWsp(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />

                {/* Fecha de nacimiento */}
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px', gap: '8px', width: '100%', maxWidth: '440px', margin: '0 auto' }}>
                  <select className="b-einput" value={dia} onChange={e => setDia(e.target.value)}
                    style={{ colorScheme: 'dark', cursor: 'pointer', padding: '14px 8px', minWidth: 0 }}>
                    <option value="">Día</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="b-einput" value={mes} onChange={e => setMes(e.target.value)}
                    style={{ colorScheme: 'dark', cursor: 'pointer', padding: '14px 8px', minWidth: 0 }}>
                    <option value="">Mes</option>
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <select className="b-einput" value={anio} onChange={e => setAnio(e.target.value)}
                    style={{ colorScheme: 'dark', cursor: 'pointer', padding: '14px 8px', minWidth: 0 }}>
                    <option value="">Año</option>
                    {Array.from({ length: 80 }, (_, i) => currentYear - 10 - i).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {error && <p style={{ color: "#FF5500", fontSize: 13, margin: 0, textAlign: "center" }}>{error}</p>}
                <button className="b-bsend" onClick={submit} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Guardando..." : "Quiero mi acceso y regalo →"}
                </button>
              </div>
              <p className="b-cproof">Ya hay <strong>88 personas</strong> en lista de espera · Quedan 12 cupos</p>
            </>
          ) : (
            <WaitlistSuccess nombre={nombre} />
          )}
        </div>
      </section>

      {/* footer */}
      <footer className="b-foot">
        <div className="b-flogo">burri<span>to</span></div>
        <p>© 2026 Burrito · Piura, Perú 🌊</p>
        <nav className="b-flinks"><a href="#">Privacidad</a><a href="#">Instagram</a><a href="#">Contacto</a></nav>
      </footer>

      <Modal isOpen={modalOpen} onClose={close} />
    </div>
  );
}