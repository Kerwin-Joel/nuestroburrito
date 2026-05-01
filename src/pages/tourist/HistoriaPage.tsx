import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, ChevronDown, ChevronUp, BookOpen, MessageCircle } from 'lucide-react'
import AIChatModal from '../../components/tourist/AIChatModal'
import HistoriaDetailModal, { type HistoriaItem } from '../../components/tourist/HistoriaDetailModal'

/* ─── Mock Data ─── */
const CATEGORIAS = [
  { id: 'all', label: 'Todo', emoji: '🌊' },
  { id: 'origenes', label: 'Orígenes', emoji: '🏺' },
  { id: 'colonial', label: 'Colonial', emoji: '⛪' },
  { id: 'heroes', label: 'Héroes', emoji: '⚓' },
  { id: 'tradicion', label: 'Tradiciones', emoji: '🎶' },
  { id: 'gastronomia', label: 'Gastro', emoji: '🍽️' },
  { id: 'piuranadas', label: 'Piuranadas', emoji: '💬' },
  { id: 'naturaleza', label: 'Naturaleza', emoji: '🌵' },
]

const DATA: HistoriaItem[] = [
  {
    id: '1', cat: 'origenes', año: '~1000 a.C.', emoji: '🏺',
    titulo: 'Los Tallanes: Los Primeros Piuranos',
    resumen: 'Los Tallanes fueron el pueblo originario que habitó la costa norte del Perú. Expertos pescadores y navegantes del Pacífico, dejaron su huella en la lengua Sec y en la cerámica piurana.',
    datos: ['Primera cultura de la costa norte', 'Navegantes del Pacífico', 'Su idioma era el Sec o Tallan', 'Aliados comerciales de los Chimú'],
    imagenes: ['https://picsum.photos/seed/tallanes1/600/340','https://picsum.photos/seed/tallanes2/600/340','https://picsum.photos/seed/tallanes3/600/340'],
    descripcionLarga: 'Los Tallanes constituyeron la primera gran civilización de la costa norte del Perú, mucho antes que llegara el Imperio Inca. Su territorio abarcaba desde el actual departamento de Tumbes hasta Lambayeque, y su cultura se distinguió por una cerámica única de tonos ocres y figuras zoomorfas. Expertos navegantes, usaban balsas de madera para comerciar a lo largo de toda la costa del Pacífico.',
    sabiasQue: ['Los Tallanes construyeron complejos de adobe antes que los Incas llegaran a Piura', 'Su lengua, el Sec, aún tiene palabras que se usan en el dialecto piurano actual', 'Los conquistadores españoles los describieron como "indios pacíficos y comerciantes"'],
    lugaresRelacionados: [{nombre:'Museo de Historia Regional de Piura', distancia:'Centro', tipo:'Museo'},{nombre:'Complejo Arqueológico de Narihualá', distancia:'15 min', tipo:'Sitio Arqueológico'}],
    horario: 'Mar-Dom 9am-5pm', entrada: 'S/ 5.00', rating: 4.3,
  },
  {
    id: '2', cat: 'colonial', año: '1532', emoji: '⛪',
    titulo: 'San Miguel de Piura: La Ciudad Más Antigua del Perú',
    resumen: 'Fundada por Francisco Pizarro el 15 de agosto de 1532, Piura fue la primera ciudad española en Sudamérica. Antes que Lima, antes que Cusco colonial — Piura ya existía.',
    datos: ['Primera ciudad española de Sudamérica', 'Fundada por Pizarro en 1532', 'Cambió de ubicación 3 veces', 'Conocida como "La Ciudad del Eterno Calor"'],
    imagenes: ['https://picsum.photos/seed/piura1/600/340','https://picsum.photos/seed/piura2/600/340'],
    descripcionLarga: 'La fundación de Piura el 15 de agosto de 1532 por Francisco Pizarro la convierte en la ciudad más antigua de América del Sur con presencia española continua. A diferencia de otras ciudades coloniales, Piura cambió de ubicación hasta tres veces antes de asentarse en su lugar actual, buscando tierras más fértiles y mejor acceso al agua del río Piura.',
    sabiasQue: ['Piura se fundó 9 años antes que Lima (1541)', 'El nombre original era "San Miguel de Tangarará"', 'La Catedral de Piura guarda pinturas coloniales del siglo XVII'],
    lugaresRelacionados: [{nombre:'Catedral de Piura', distancia:'Plaza de Armas', tipo:'Iglesia Colonial'},{nombre:'Plaza de Armas de Piura', distancia:'Centro', tipo:'Plaza Histórica'},{nombre:'Museo Arqueológico de Piura', distancia:'5 min', tipo:'Museo'}],
    horario: 'Todo el día', entrada: 'Libre', rating: 4.7,
  },
  {
    id: '3', cat: 'heroes', año: '1834', emoji: '⚓',
    titulo: 'Miguel Grau: El Caballero de los Mares',
    resumen: 'Nacido en Piura el 27 de julio de 1834, Miguel Grau Seminario es el héroe naval más grande del Perú. Su valentía en el Combate de Angamos lo inmortalizó en la historia latinoamericana.',
    datos: ['Nació en Piura el 27 de julio de 1834', 'Comandó el Monitor Huáscar', 'Murió en el Combate de Angamos (1879)', 'Admirado por propios y enemigos'],
  },
  {
    id: '4', cat: 'tradicion', año: 'Cada octubre', emoji: '✝️',
    titulo: 'El Señor Cautivo de Ayabaca',
    resumen: 'La festividad religiosa más grande del norte peruano. Cada octubre, miles de peregrinos suben a Ayabaca para venerar al Señor Cautivo en una de las tradiciones más arraigadas de la fe piurana.',
    datos: ['Más de 400 años de tradición', 'Miles de peregrinos cada año', 'Festival declarado Patrimonio Cultural', 'Subida a 2,715 metros sobre el nivel del mar'],
  },
  {
    id: '5', cat: 'gastronomia', año: 'Desde siempre', emoji: '🍽️',
    titulo: 'La Chicha de Jora: El Néctar Piurano',
    resumen: 'La chicha de jora piurana no es igual a ninguna otra. Fermentada con maíz jora y preparada con técnicas ancestrales, es la bebida que acompaña toda celebración en la región.',
    datos: ['Bebida ancestral de origen pre-hispánico', 'Elaborada con maíz jora fermentado', 'Clave en fiestas y rituales', 'Cada familia tiene su propia receta'],
  },
  {
    id: '6', cat: 'gastronomia', año: 'Siglo XIX', emoji: '🐟',
    titulo: 'El Cebiche Piurano: Diferente al Limeño',
    resumen: 'El ceviche piurano tiene su propio carácter: se sirve caliente con mote y chifle. El pescado es fresquísimo, sacado del Pacífico esa misma mañana. Una experiencia que los limeños no entienden.',
    datos: ['Se sirve caliente, no frío', 'Acompañado de mote y chifle', 'Pescado fresco del Pacífico', 'Base: jugo de limón piurano y ají limo'],
  },
  {
    id: '7', cat: 'piuranadas', año: 'De siempre', emoji: '💬',
    titulo: '"Tá Peludo" y Otras Piuranadas Históricas',
    resumen: 'El lenguaje piurano es un arte. Expresiones únicas que solo en Piura tienen sentido y que forman parte del ADN cultural de la región desde tiempos inmemoriales.',
    datos: ['"Tá peludo" = está muy difícil', '"¡Churre!" = muchacho/chico', '"Bicharraco" = persona fastidiosa', '"¡Asu mare!" = expresión de sorpresa'],
  },
  {
    id: '8', cat: 'piuranadas', año: 'Costumbre viva', emoji: '🎵',
    titulo: 'La Tondero: Música que Habla de la Tierra',
    resumen: 'La tondero es la danza y ritmo musical emblema de Piura. Mezcla de influencias africanas, españolas e indígenas, cuenta historias de amor, despecho y la vida en el desierto piurano.',
    datos: ['Ritmo único del norte del Perú', 'Mezcla africana, española e indígena', 'Declarada Patrimonio Cultural', 'Se baila en fiestas patronales'],
  },
  {
    id: '9', cat: 'naturaleza', año: 'Eterno', emoji: '🌊',
    titulo: 'El Río Piura: El Que Da Vida y Se Va',
    resumen: 'El río Piura es caprichoso: en temporada seca casi desaparece, pero en Fenómeno del Niño se desborda y transforma la región. Los piuranos tienen una relación de amor y respeto con este río impredecible.',
    datos: ['Único río del mundo que cambia de dirección', 'Fuente de vida en temporada húmeda', 'Testigo del Fenómeno El Niño', 'Nace en la sierra de Ayabaca'],
  },
  {
    id: '10', cat: 'naturaleza', año: 'Millones de años', emoji: '🌵',
    titulo: 'El Bosque Seco: El Pulmón Verde del Desierto',
    resumen: 'Piura alberga uno de los bosques secos tropicales más importantes del mundo. El algarrobo, árbol símbolo de la región, sobrevive en condiciones extremas y es fuente de vida para la fauna local.',
    datos: ['Uno de los ecosistemas más raros del mundo', 'El algarrobo: árbol símbolo de Piura', 'Hogar del oso de anteojos', 'Conecta la costa con la sierra'],
  },
  {
    id: '11', cat: 'heroes', año: '1820', emoji: '🗡️',
    titulo: 'Piura y la Independencia: La Primera del Perú',
    resumen: 'El 4 de enero de 1821, Piura fue la primera ciudad del Perú en declarar su Independencia de España, meses antes que Lima. Un acto de valentía que la historia a veces olvida pero los piuranos nunca.',
    datos: ['Primera ciudad peruana en independizarse', '4 de enero de 1821', 'Meses antes que Lima (28 de julio)', 'Acto liderado por el Intendente Robledo'],
  },
  {
    id: '12', cat: 'gastronomia', año: 'Desde 1800s', emoji: '🌶️',
    titulo: 'El Seco de Cabrito: El Rey de la Mesa Piurana',
    resumen: 'El seco de cabrito con frijoles es el plato bandera de Piura. Preparado con chicha de jora y culantro, tiene un sabor que no existe en ningún otro lugar del mundo. Es identidad pura.',
    datos: ['Plato bandera de la región Piura', 'Cocinado con chicha de jora real', 'Acompañado de frijoles y arroz', 'Receta transmitida de generación en generación'],
  },
]

const PIURANADAS_RAPIDAS = [
  { frase: '¡Tá peludera la cosa!', significado: 'Está muy difícil la situación' },
  { frase: '¡Qué churre más bicharraco!', significado: 'Qué muchacho más fastidioso' },
  { frase: 'Oye compadre, ¿aonde vas?', significado: 'Oye amigo, ¿a dónde vas?' },
  { frase: 'El asunto tá capeao', significado: 'El asunto está bajo control' },
  { frase: '¡Asu mare, qué calor!', significado: '¡Dios mío, qué calor tan fuerte!' },
  { frase: 'Está como la zaranda', significado: 'Está muy animado/agitado' },
]

/* ─── Sub-componentes ─── */
function PiuranadaChip({ frase, significado }: { frase: string; significado: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.button
      onClick={() => setOpen(o => !o)}
      layout
      style={{
        background: open ? 'rgba(255,85,0,0.1)' : 'var(--card2)',
        border: `1px solid ${open ? 'rgba(255,85,0,0.4)' : 'var(--border)'}`,
        borderRadius: '12px', padding: '10px 14px', cursor: 'pointer',
        textAlign: 'left', width: '100%', transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--white)', fontWeight: 700 }}>
          "{frase}"
        </span>
        {open ? <ChevronUp size={14} color="var(--orange)" /> : <ChevronDown size={14} color="var(--muted)" />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--orange)', marginTop: '6px', overflow: 'hidden' }}
          >
            {significado}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function HistoriaCard({ item, idx, onTap }: { item: HistoriaItem; idx: number; onTap: (item: HistoriaItem) => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: idx * 0.05, duration: 0.35 }}
      layout
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '20px', overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <span style={{ fontSize: '32px', lineHeight: 1 }}>{item.emoji}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
            color: 'var(--orange)', background: 'rgba(255,85,0,0.1)',
            padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(255,85,0,0.2)',
          }}>{item.año}</span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--white)', marginBottom: '8px', letterSpacing: '-0.3px' }}>
          {item.titulo}
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
          {item.resumen}
        </p>
      </div>

      {/* Expanded datos */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 18px 0' }}>
              {item.datos.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--orange)', marginTop: '5px', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--white)', opacity: 0.85 }}>{d}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--border)', marginTop: '14px' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            flex: 1, padding: '11px 18px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', fontWeight: 600,
            transition: 'color 0.2s', borderRight: '1px solid var(--border)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--white)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          {expanded ? <><ChevronUp size={13} /> Menos</> : <><ChevronDown size={13} /> Datos</>}
        </button>
        <button
          onClick={() => onTap(item)}
          style={{
            flex: 1, padding: '11px 18px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--orange)', fontWeight: 700,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,85,0,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          Ver todo →
        </button>
      </div>
    </motion.article>
  )
}


/* ─── Página principal ─── */
export default function HistoriaPage() {
  const [query, setQuery] = useState('')
  const [catActiva, setCatActiva] = useState('all')
  const [showPiuranadas, setShowPiuranadas] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HistoriaItem | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  const filtered = useMemo(() => {
    return DATA.filter(d => {
      const matchCat = catActiva === 'all' || d.cat === catActiva
      const matchQ = !query || d.titulo.toLowerCase().includes(query.toLowerCase()) || d.resumen.toLowerCase().includes(query.toLowerCase())
      return matchCat && matchQ
    })
  }, [query, catActiva])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '120px' }}>

      {/* Hero Header */}
      <div style={{ padding: '24px 20px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,85,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,85,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,85,0,0.3)' }}>
              <BookOpen size={16} color="var(--orange)" />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--orange)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Raíces Piuranas
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900, color: 'var(--white)', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '8px' }}>
            La Biblioteca<br /><span style={{ color: 'var(--orange)' }}>del Churre</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Historia, tradiciones y piuranadas de nuestra tierra. Porque ser de aquí es saber de dónde venimos.
          </p>
        </motion.div>

        {/* AI Chat CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setAiOpen(true)}
          style={{
            marginTop: '16px', padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(255,85,0,0.12), rgba(255,170,59,0.08))',
            border: '1px solid rgba(255,85,0,0.25)', borderRadius: '16px',
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--white)', marginBottom: '2px' }}>
              Pregúntale al Burrito Sabio
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>
              IA conversacional sobre historia piurana — <span style={{ color: '#22c55e' }}>Activo</span>
            </div>
          </div>
          <MessageCircle size={18} color="var(--orange)" />
        </motion.div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Busca un hecho, personaje o tradición..."
            style={{
              width: '100%', height: '44px', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: '14px',
              padding: '0 14px 0 40px', fontFamily: 'var(--font-body)',
              fontSize: '14px', color: 'var(--white)', outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--orange)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div style={{ padding: '12px 0 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px', width: 'max-content' }}>
          {CATEGORIAS.map(cat => (
            <motion.button
              key={cat.id}
              onClick={() => setCatActiva(cat.id)}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: catActiva === cat.id ? 'var(--orange)' : 'var(--card)',
                color: catActiva === cat.id ? '#fff' : 'var(--muted)',
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                border: `1px solid ${catActiva === cat.id ? 'transparent' : 'var(--border)'}`,
                whiteSpace: 'nowrap', transition: 'all 0.2s',
                boxShadow: catActiva === cat.id ? 'var(--shadow-glow)' : 'none',
              }}
            >
              {cat.emoji} {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Piuranadas rápidas */}
      <div style={{ padding: '16px 20px 0' }}>
        <button
          onClick={() => setShowPiuranadas(s => !s)}
          style={{
            width: '100%', padding: '12px 16px', background: 'var(--card2)',
            border: '1px solid var(--border)', borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px',
            color: 'var(--white)', fontWeight: 600,
          }}
        >
          <span>💬 Diccionario Piuranadas</span>
          {showPiuranadas ? <ChevronUp size={16} color="var(--muted)" /> : <ChevronDown size={16} color="var(--muted)" />}
        </button>
        <AnimatePresence>
          {showPiuranadas && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              {PIURANADAS_RAPIDAS.map((p, i) => (
                <PiuranadaChip key={i} frase={p.frase} significado={p.significado} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results count */}
      <div style={{ padding: '16px 20px 8px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {/* Cards Grid */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? filtered.map((item, i) => (
            <HistoriaCard key={item.id} item={item} idx={i} onTap={setSelectedItem} />
          )) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '48px 20px' }}
            >
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', fontWeight: 700 }}>No encontramos nada</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginTop: '6px' }}>Prueba con otra búsqueda, churre</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modales */}
      <AnimatePresence>
        {selectedItem && <HistoriaDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>
      <AIChatModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
