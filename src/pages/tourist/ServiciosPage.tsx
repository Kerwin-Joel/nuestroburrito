import { motion } from 'framer-motion'
import { Luggage, Siren, Compass, MapPin, Phone } from 'lucide-react'

/**
 * Guía de servicios por necesidad — el equivalente web de
 * ui/extras/ServicesScreen.kt en la app nativa. Los lugares concretos salen
 * de Google Maps cerca del usuario (nunca inventamos un negocio o teléfono),
 * y los consejos son generales del equipo de Burrito.
 */

type Action =
  | { type: 'nearMe'; query: string }
  | { type: 'call'; number: string }

interface ServiceItem {
  emoji: string
  title: string
  tip: string
  action: Action
}

interface ServiceGroup {
  title: string
  items: ServiceItem[]
}

const GROUPS: ServiceGroup[] = [
  {
    title: 'Moverte',
    items: [
      { emoji: '🚕', title: 'Taxi por app', tip: 'Pídelo por aplicación: el viaje y el precio quedan registrados. De noche, mejor que parar uno en la calle.', action: { type: 'nearMe', query: 'paradero de taxi' } },
      { emoji: '🛺', title: 'Mototaxi', tip: 'Ideal para tramos cortos dentro de la ciudad. Acuerda el precio antes de subir.', action: { type: 'nearMe', query: 'paradero de mototaxi' } },
      { emoji: '🚌', title: 'Terminales de bus', tip: 'Cada empresa sale de su propio terminal. En feriados compra con anticipación.', action: { type: 'nearMe', query: 'terminal de buses' } },
      { emoji: '✈️', title: 'Aeropuerto de Piura', tip: 'Aeropuerto Cap. FAP Guillermo Concha Iberico, cerca del centro. Llega con tiempo.', action: { type: 'nearMe', query: 'Aeropuerto de Piura' } },
      { emoji: '🚗', title: 'Alquiler de autos', tip: 'Para ir a las playas o a la sierra a tu ritmo. Revisa el seguro antes de firmar.', action: { type: 'nearMe', query: 'alquiler de autos' } },
    ],
  },
  {
    title: 'Dinero',
    items: [
      { emoji: '💱', title: 'Casas de cambio', tip: 'Compara el tipo de cambio y cuenta tu dinero en la ventanilla.', action: { type: 'nearMe', query: 'casa de cambio' } },
      { emoji: '🏧', title: 'Cajeros', tip: 'Prefiere cajeros dentro de agencias o centros comerciales.', action: { type: 'nearMe', query: 'cajero automático' } },
    ],
  },
  {
    title: 'Salud',
    items: [
      { emoji: '💊', title: 'Farmacias', tip: 'Muchas atienden hasta tarde; en Maps ves cuáles están abiertas ahora.', action: { type: 'nearMe', query: 'farmacia' } },
      { emoji: '🏥', title: 'Clínicas y hospitales', tip: 'Para una urgencia llama primero a los números de Emergencias de arriba.', action: { type: 'nearMe', query: 'clínica' } },
    ],
  },
  {
    title: 'Guías y tours',
    items: [
      { emoji: '🧢', title: 'Guías locales', tip: 'Churres que te muestran Piura como se la mostrarían a un amigo.', action: { type: 'nearMe', query: 'guía turístico Piura' } },
      { emoji: '🗺️', title: 'Agencias de turismo', tip: 'Para tours a playas, Catacaos o la sierra con movilidad incluida.', action: { type: 'nearMe', query: 'agencia de turismo' } },
    ],
  },
  {
    title: 'Conectividad y más',
    items: [
      { emoji: '📶', title: 'Chip y recargas', tip: 'Con tu DNI o pasaporte compras un chip prepago en las tiendas de las operadoras.', action: { type: 'nearMe', query: 'tienda de telefonía móvil' } },
      { emoji: '🧺', title: 'Lavandería', tip: 'Por kilo y suele estar listo en el día.', action: { type: 'nearMe', query: 'lavandería' } },
      { emoji: '🛒', title: 'Supermercados', tip: 'Agua, bloqueador y snacks para la ruta.', action: { type: 'nearMe', query: 'supermercado' } },
      { emoji: '🅿️', title: 'Estacionamientos', tip: 'Si vas en auto al centro, mejor en una playa de estacionamiento.', action: { type: 'nearMe', query: 'estacionamiento' } },
    ],
  },
]

const EMERGENCY_NUMBERS = [
  { emoji: '🚨', name: 'Emergencias', detail: 'Central única nacional', number: '911' },
  { emoji: '👮', name: 'Policía de Turismo', detail: 'Piura — atención al turista', number: '073321122' },
  { emoji: '🛡️', name: 'Serenazgo Piura', detail: 'Municipalidad Provincial', number: '073284600' },
  { emoji: '🚒', name: 'Bomberos', detail: 'Compañía de Piura', number: '116' },
  { emoji: '🏥', name: 'Hospital Santa Rosa', detail: 'Emergencias', number: '073324605' },
  { emoji: '🚑', name: 'SAMU', detail: 'Ambulancias', number: '106' },
  { emoji: '🧭', name: 'iPerú', detail: 'Información turística', number: '073476403' },
]

function nearMeUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} Piura`)}`
}

export default function ServiciosPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Hero Header — mismo lenguaje visual que Historia */}
      <div style={{ padding: '24px 20px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,85,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,85,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,85,0,0.3)' }}>
              <Luggage size={16} color="var(--orange)" />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--orange)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Servicios turísticos
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900, color: 'var(--white)', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '8px' }}>
            Lo que necesitas<br /><span style={{ color: 'var(--orange)' }}>para moverte por Piura</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Transporte, dinero, salud y más — cerca de ti, con un consejo del equipo de Burrito.
          </p>
        </motion.div>
      </div>

      <div className="page-container" style={{ paddingTop: '20px', paddingBottom: '48px' }}>
        {/* Accesos rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
          <EmergenciesCard />
          <a
            href={nearMeUrl('iPerú oficina de información turística')}
            target="_blank" rel="noreferrer"
            className="card"
            style={{ textDecoration: 'none', padding: '14px', display: 'block' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,85,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <Compass size={20} color="var(--orange)" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--white)' }}>iPerú</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Información turística oficial</div>
          </a>
        </div>

        {GROUPS.map((group, gi) => (
          <div key={group.title} style={{ marginBottom: '24px' }}>
            <p className="section-label" style={{ marginBottom: '10px' }}>{group.title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.items.map((item, ii) => (
                <motion.a
                  key={item.title}
                  href={item.action.type === 'nearMe' ? nearMeUrl(item.action.query) : `tel:${item.action.number}`}
                  target={item.action.type === 'nearMe' ? '_blank' : undefined}
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(gi * 0.05 + ii * 0.03, 0.4) }}
                  whileTap={{ scale: 0.98 }}
                  className="card"
                  style={{ textDecoration: 'none', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {item.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14.5px', color: 'var(--white)' }}>{item.title}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.4, marginTop: '2px' }}>{item.tip}</div>
                  </div>
                  <span className="chip" style={{ flexShrink: 0, fontSize: '11.5px', padding: '6px 12px', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> Ver cerca
                  </span>
                </motion.a>
              ))}
            </div>
          </div>
        ))}

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginTop: '8px' }}>
          Los lugares los muestra Google Maps según dónde estés. Los consejos son del equipo de Burrito.
        </p>
      </div>
    </div>
  )
}

function EmergenciesCard() {
  return (
    <details className="card" style={{ padding: '14px' }}>
      <summary style={{ listStyle: 'none', cursor: 'pointer' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,64,64,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          <Siren size={20} color="#ff4040" />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--white)', whiteSpace: 'nowrap' }}>Emergencias</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Policía, bomberos, SAMU</div>
      </summary>
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {EMERGENCY_NUMBERS.map(n => (
          <a
            key={n.name}
            href={`tel:${n.number}`}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', background: 'var(--card2)' }}
          >
            <span style={{ fontSize: '16px' }}>{n.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', color: 'var(--white)' }}>{n.name}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)' }}>{n.detail}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--orange)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={12} /> {n.number}
            </span>
          </a>
        ))}
      </div>
    </details>
  )
}
