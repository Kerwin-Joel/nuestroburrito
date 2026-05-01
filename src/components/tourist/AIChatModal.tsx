import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, Loader2, Bot } from 'lucide-react'

/* ══════════════════════════════════════════════
   🔌 CONEXIÓN DE IA — Para conectar una API real:
   
   1. OpenAI:
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o', messages: [...history, { role: 'user', content: msg }] })
      })
      const data = await res.json()
      return data.choices[0].message.content
   
   2. Google Gemini:
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: msg }] }] })
      })
      const data = await res.json()
      return data.candidates[0].content.parts[0].text
   
   3. Anthropic Claude:
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [{ role: 'user', content: msg }] })
      })
      const data = await res.json()
      return data.content[0].text
══════════════════════════════════════════════ */

// ── Configuración de la IA ──────────────────
// const AI_API_KEY = import.meta.env.VITE_AI_API_KEY
// const AI_PROVIDER: 'openai' | 'gemini' | 'anthropic' = 'openai'

const SYSTEM_PROMPT = `Eres el "Burrito Sabio", un asistente de IA especializado en la historia, cultura, gastronomía y tradiciones de Piura, Perú. 
Respondes de forma amigable, usando palabras piuranas cuando es apropiado (churre, bicharraco, tá peludo, etc.).
Tienes conocimiento profundo sobre: Los Tallanes, Miguel Grau, la Independencia de Piura, el Señor Cautivo de Ayabaca, 
la chicha de jora, el seco de cabrito, el río Piura, el bosque seco, Catacaos y toda la historia regional.
Mantén respuestas concisas (máx 3 párrafos) pero informativas.`

const MOCK_RESPONSES: Record<string, string> = {
  default: '¡Hola churre! Soy el Burrito Sabio 🫔 Estoy aquí para contarte todo sobre la historia de Piura. Puedes preguntarme sobre los Tallanes, Miguel Grau, el Señor Cautivo, la comida piurana o cualquier tradición de nuestra tierra. ¿Qué quieres saber?',
  grau: 'Miguel Grau Seminario nació en Piura el 27 de julio de 1834. Fue el más grande marino peruano y latinoamericano. Comandó el Monitor Huáscar durante la Guerra del Pacífico y fue admirado incluso por sus enemigos por su caballerosidad. Murió heroicamente en el Combate de Angamos el 8 de octubre de 1879. ¡Un piurano de pura cepa!',
  tallanes: 'Los Tallanes fueron el pueblo originario de Piura, antes de los incas y los españoles. Expertos pescadores y navegantes del Pacífico, hablaban el idioma Sec o Tallan. Comerciaban con los Chimú y dejaron su huella en la cerámica y la arquitectura de la región costera.',
  chicha: '¡La chicha de jora piurana es única, churre! Se fermenta con maíz jora durante días usando técnicas ancestrales. Cada familia tiene su propia receta, y es la bebida infaltable en cualquier celebración piurana. Dicen que la mejor chicha se hace en Catacaos.',
  ayabaca: 'El Señor Cautivo de Ayabaca es la festividad religiosa más importante del norte del Perú. Cada octubre, miles de devotos suben a Ayabaca (a 2,715 metros) en peregrinación para venerar esta imagen milagrosa. Tiene más de 400 años de tradición y es Patrimonio Cultural de la Nación.',
  independencia: 'Piura fue la primera ciudad del Perú en declarar su independencia de España, el 4 de enero de 1821, meses antes que Lima (28 de julio). Un hecho histórico que los piuranos llevamos con orgullo pero que no siempre figura en los libros. ¡Primeros en la libertad, churre!',
}

function getMockResponse(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('grau') || lower.includes('marino') || lower.includes('huáscar')) return MOCK_RESPONSES.grau
  if (lower.includes('tallan') || lower.includes('origen') || lower.includes('prehi')) return MOCK_RESPONSES.tallanes
  if (lower.includes('chicha') || lower.includes('jora') || lower.includes('bebida')) return MOCK_RESPONSES.chicha
  if (lower.includes('ayabaca') || lower.includes('cautivo') || lower.includes('religio')) return MOCK_RESPONSES.ayabaca
  if (lower.includes('independencia') || lower.includes('españa') || lower.includes('libertad')) return MOCK_RESPONSES.independencia
  return `¡Qué buena pregunta, churre! Sobre "${msg}" puedo decirte que Piura tiene una historia riquísima que va desde los Tallanes hasta hoy. Para conectar respuestas en tiempo real, el administrador solo debe configurar la API key de IA en el panel de control. ¡Pronto estaré al 100%! 🫔`
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: Date
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

const SUGERENCIAS = [
  '¿Quién fue Miguel Grau?',
  'Cuéntame sobre el Señor Cautivo',
  '¿Qué son los Tallanes?',
  'Historia de la chicha de jora',
  '¿Cuándo se independizó Piura?',
]

export default function AIChatModal({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0', role: 'assistant',
      content: MOCK_RESPONSES.default,
      ts: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), ts: new Date() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    // ── AQUÍ VA LA LLAMADA A LA API DE IA ────────────────
    // Reemplaza getMockResponse() con tu función de API real
    // Ejemplo: const reply = await callOpenAI(text, messages, SYSTEM_PROMPT)
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600))
    const reply = getMockResponse(text)
    // ─────────────────────────────────────────────────────

    setMessages(m => [...m, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, ts: new Date() }])
    setLoading(false)
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--orange), var(--amber))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--white)' }}>Burrito Sabio</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--orange)', animation: 'pulse 2s infinite' }} />
              IA Histórica de Piura
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
            >
              {msg.role === 'assistant' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,85,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,85,0,0.3)' }}>
                  <Bot size={16} color="var(--orange)" />
                </div>
              )}
              <div style={{
                maxWidth: '78%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? 'var(--orange)' : 'var(--card)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.55,
                color: msg.role === 'user' ? '#fff' : 'var(--white)',
              }}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,85,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,85,0,0.3)' }}>
                <Bot size={16} color="var(--orange)" />
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0,1,2].map(i => <motion.div key={i} animate={{ y: [0,-5,0] }} transition={{ repeat: Infinity, delay: i*0.15, duration: 0.6 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--orange)' }} />)}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Sugerencias */}
        {messages.length < 2 && (
          <div style={{ padding: '8px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <div style={{ display: 'flex', gap: '8px', width: 'max-content' }}>
              {SUGERENCIAS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{ padding: '7px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--orange)'; e.currentTarget.style.borderColor = 'var(--orange)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '12px 16px 28px', background: 'var(--card)', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Pregúntale al Burrito Sabio..."
            style={{ flex: 1, height: '44px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '0 14px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--white)', outline: 'none' }}
          />
          <motion.button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            whileTap={{ scale: 0.92 }}
            style={{ width: '44px', height: '44px', borderRadius: '14px', background: input.trim() && !loading ? 'var(--orange)' : 'var(--card2)', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
          >
            {loading ? <Loader2 size={18} color="var(--muted)" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} color={input.trim() ? '#fff' : 'var(--muted)'} />}
          </motion.button>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
