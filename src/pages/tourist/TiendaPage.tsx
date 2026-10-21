import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Minus, Plus } from 'lucide-react'
import BeneficiosPage from './BeneficiosPage'
import { MarketGridCard, MarketHeroCard, MarketProductModal, SellInviteCard } from '../../components/market/MarketParts'
import { displayTitle, marketService, type MarketProduct } from '../../services/market'

/**
 * Catálogo de la primera versión — espejo de StoreCatalog.kt / StoreScreen.kt.
 * OJO: productos y precios de EJEMPLO para validar la demanda (pedido por
 * WhatsApp, sin pasarela de pago). Cuando el catálogo se estabilice se mueve
 * a una tabla de Supabase administrable desde el panel.
 */
const STORE_WHATSAPP = ''

type Section = 'artesanos' | 'merch' | 'experiencias' | 'local' | 'cupones'

interface Product {
  id: string
  section: Exclude<Section, 'cupones' | 'artesanos'>
  emoji: string
  name: string
  price: number
  tagline: string
  description: string
  tint: string
  badge?: string
}

const SECTIONS: { id: Section; label: string; emoji: string }[] = [
  { id: 'artesanos', label: 'Artesanos', emoji: '🧑‍🎨' },
  { id: 'merch', label: 'Merch', emoji: '🧢' },
  { id: 'experiencias', label: 'Experiencias', emoji: '🧭' },
  { id: 'local', label: 'Hecho en Piura', emoji: '🏺' },
  { id: 'cupones', label: 'Cupones', emoji: '🎟️' },
]

const PRODUCTS: Product[] = [
  { id: 'polo-clasico', section: 'merch', emoji: '👕', name: 'Polo Burrito clásico', price: 49, tagline: 'Algodón peruano, el burrito en el pecho', description: 'Polo de algodón pima con el burrito bordado. Para que te reconozcan los otros churres en la ruta.', tint: '#FFE3CC', badge: 'Más pedido' },
  { id: 'gorra-churre', section: 'merch', emoji: '🧢', name: 'Gorra Churre', price: 39, tagline: 'Para el sol de Piura, que no perdona', description: 'Gorra de drill con visera curva y el isotipo de Burrito. Ajustable, talla única.', tint: '#FFEFC2' },
  { id: 'tomatodo', section: 'merch', emoji: '🥤', name: 'Tomatodo térmico', price: 45, tagline: 'Agua heladita todo el día', description: 'Tomatodo de acero de 750 ml que mantiene el frío 24 horas. Imprescindible para la ruta playera.', tint: '#DFF1EC', badge: 'Nuevo' },
  { id: 'stickers', section: 'merch', emoji: '🎨', name: 'Pack de stickers', price: 12, tagline: '8 stickers de piuranadas', description: 'Stickers resistentes al agua: el burrito, la catedral, el algarrobo, el sombrero de paja y más.', tint: '#F3E2F7' },
  { id: 'tote', section: 'merch', emoji: '👜', name: 'Tote bag Burrito', price: 29, tagline: 'Para los chifles y los recuerdos', description: 'Bolsa de tela gruesa con la frase "Piura se vive". Cabe todo lo que compres en Catacaos.', tint: '#E6EEF9' },
  { id: 'tour-centro', section: 'experiencias', emoji: '🚶', name: 'Piura centro con un churre', price: 60, tagline: 'Medio día · a pie · grupo pequeño', description: 'Recorrido por la Plaza de Armas, la Catedral, la Casa Grau y los huariques del centro, contado por un piurano de verdad.', tint: '#FFE3CC', badge: 'Más pedido' },
  { id: 'ruta-playera', section: 'experiencias', emoji: '🏖️', name: 'Ruta playera Colán–Vichayito', price: 150, tagline: 'Día completo · movilidad incluida', description: 'Salida temprano desde Piura, playas de Colán y Vichayito, almuerzo marino recomendado y regreso al atardecer.', tint: '#D9EEF7' },
  { id: 'ruta-catacaos', section: 'experiencias', emoji: '🏺', name: 'Catacaos artesanal', price: 70, tagline: 'Medio día · talleres y picantería', description: 'Visita a talleres de filigrana y paja toquilla, con parada obligada en una picantería de Catacaos.', tint: '#FFEFC2' },
  { id: 'ruta-sierra', section: 'experiencias', emoji: '🏔️', name: 'Ayabaca y Aypate', price: 220, tagline: 'Día completo · para aventureros', description: 'Sube a la sierra piurana: el complejo arqueológico de Aypate y el pueblo de Ayabaca con guía local.', tint: '#E1F0DC', badge: 'Nuevo' },
  { id: 'chifles', section: 'local', emoji: '🍌', name: 'Chifles piuranos', price: 10, tagline: 'Crocantes, con su sal justa', description: 'Chifles de plátano verde hechos en Piura, bolsa de 250 g. Se acaban antes de llegar al carro.', tint: '#FFF1C9', badge: 'Más pedido' },
  { id: 'algarrobina', section: 'local', emoji: '🍯', name: 'Algarrobina artesanal', price: 18, tagline: 'Del algarrobo piurano, 500 ml', description: 'Algarrobina pura para tu cóctel o para el desayuno, de productores del bosque seco.', tint: '#F1E1D0' },
  { id: 'natillas', section: 'local', emoji: '🍮', name: 'Natillas piuranas', price: 15, tagline: 'El dulce de la abuela', description: 'Natilla de leche de cabra y chancaca, receta tradicional piurana. Pote de 400 g.', tint: '#FFE9D6' },
  { id: 'chulucanas', section: 'local', emoji: '🏺', name: 'Cerámica de Chulucanas', price: 55, tagline: 'Pieza única, técnica de paleteado', description: 'Cerámica decorada con la técnica ancestral de Chulucanas. Cada pieza es distinta.', tint: '#EDE0D4' },
  { id: 'sombrero', section: 'local', emoji: '👒', name: 'Sombrero de paja Catacaos', price: 80, tagline: 'Tejido a mano en paja toquilla', description: 'Sombrero tejido por artesanos de Catacaos. Fresco, liviano y hecho para durar.', tint: '#FFF4D6' },
]

export default function TiendaPage() {
  const navigate = useNavigate()
  const [section, setSection] = useState<Section | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [selectedMarket, setSelectedMarket] = useState<MarketProduct | null>(null)
  const [market, setMarket] = useState<MarketProduct[]>([])

  useEffect(() => { marketService.catalog().then(setMarket).catch(() => {}) }, [])

  const onSell = () => navigate('/app/vender')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '110px' }}>
      <StoreHeader query={query} onQuery={setQuery} />

      <div className="page-container">
        <div className="scroll-row" style={{ marginBottom: '14px', gap: '8px' }}>
          <button onClick={() => setSection(null)} className={`chip ${section === null ? 'selected' : ''}`}>✨ Todo</button>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} className={`chip ${section === s.id ? 'selected' : ''}`}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={section ?? 'todo'}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {section === 'cupones' ? (
              <div style={{ margin: '-24px -20px 0' }}><BeneficiosPage /></div>
            ) : (
              <StoreGrid
                section={section} query={query.trim()} market={market}
                onOpen={setSelected} onOpenMarket={setSelectedMarket} onSell={onSell}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
      {selectedMarket && <MarketProductModal p={selectedMarket} onClose={() => setSelectedMarket(null)} />}
    </div>
  )
}

function StoreHeader({ query, onQuery }: { query: string; onQuery: (q: string) => void }) {
  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '14px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, color: 'var(--white)', letterSpacing: '-1px', lineHeight: 1.1, margin: 0 }}>
        Tienda <span style={{ color: 'var(--orange)' }}>Burrito</span>
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: '4px 0 0' }}>Lo hecho en Piura, por su gente.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '48px', marginTop: '12px', padding: '0 14px', borderRadius: '16px', background: 'var(--card2)' }}>
        <Search size={19} color="var(--muted)" />
        <input
          value={query} onChange={e => onQuery(e.target.value)} placeholder="Busca sombreros, cerámica, chifles…"
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: '14.5px' }}
        />
        {query && (
          <button onClick={() => onQuery('')} aria-label="Borrar" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <X size={17} color="var(--muted)" />
          </button>
        )}
      </div>
    </div>
  )
}

const matches = (p: Product, q: string) => {
  const t = q.toLowerCase()
  return !t || [p.name, p.tagline, p.description].some(x => x.toLowerCase().includes(t))
}
const marketMatches = (p: MarketProduct, q: string) => {
  const t = q.toLowerCase()
  return !t || [displayTitle(p), p.tagline ?? '', p.description ?? '', p.seller?.business_name ?? '', ...p.tags, ...p.materials]
    .some(x => x.toLowerCase().includes(t))
}

const GRID: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }

function Label({ children }: { children: React.ReactNode }) {
  return <p className="section-label" style={{ margin: '14px 0 10px' }}>{children}</p>
}

function StoreGrid({ section, query, market, onOpen, onOpenMarket, onSell }: {
  section: Section | null
  query: string
  market: MarketProduct[]
  onOpen: (p: Product) => void
  onOpenMarket: (p: MarketProduct) => void
  onSell: () => void
}) {
  const art = useMemo(() => market.filter(p => marketMatches(p, query)), [market, query])
  const products = PRODUCTS.filter(p => matches(p, query) && (section === null || p.section === section))

  // Portada: carrusel de artesanos + invitación a vender + secciones de la casa.
  if (section === null && !query) {
    return (
      <>
        {art.length > 0 && (
          <>
            <Label>🧑‍🎨 Hecho por artesanos de Piura</Label>
            <div className="scroll-row" style={{ paddingBottom: 6 }}>
              {art.slice(0, 10).map(p => <MarketHeroCard key={p.id} p={p} onClick={() => onOpenMarket(p)} />)}
            </div>
          </>
        )}
        <div style={{ margin: '12px 0 4px' }}><SellInviteCard onClick={onSell} /></div>
        {SECTIONS.filter(s => s.id !== 'artesanos' && s.id !== 'cupones').map(s => {
          const list = products.filter(p => p.section === s.id)
          return list.length === 0 ? null : (
            <div key={s.id}>
              <Label>{s.emoji} {s.label}</Label>
              <div style={GRID}>{list.map(p => <ProductCard key={p.id} product={p} onClick={() => onOpen(p)} />)}</div>
            </div>
          )
        })}
      </>
    )
  }

  if (section === 'artesanos') {
    return (
      <>
        <SellInviteCard onClick={onSell} />
        {art.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p style={{ fontSize: 40, margin: 0 }}>🧺</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
              {query ? `Nada coincide con "${query}"` : 'Pronto verás aquí lo que hacen los artesanos de Piura'}
            </p>
          </div>
        ) : (
          <div style={{ ...GRID, marginTop: 12 }}>{art.map(p => <MarketGridCard key={p.id} p={p} onClick={() => onOpenMarket(p)} />)}</div>
        )}
      </>
    )
  }

  // Búsqueda en "Todo": artesanos primero, luego lo de la casa.
  if (section === null) {
    return (
      <>
        {art.length > 0 && (
          <>
            <Label>🧑‍🎨 Artesanos</Label>
            <div style={GRID}>{art.map(p => <MarketGridCard key={p.id} p={p} onClick={() => onOpenMarket(p)} />)}</div>
          </>
        )}
        {products.length > 0 && (
          <>
            <Label>🫏 De Burrito</Label>
            <div style={GRID}>{products.map(p => <ProductCard key={p.id} product={p} onClick={() => onOpen(p)} />)}</div>
          </>
        )}
        {art.length === 0 && products.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', padding: '30px 0' }}>Nada coincide con "{query}"</p>
        )}
      </>
    )
  }

  return <div style={GRID}>{products.map(p => <ProductCard key={p.id} product={p} onClick={() => onOpen(p)} />)}</div>
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} className="card" style={{ textAlign: 'left', cursor: 'pointer', padding: 0, borderRadius: 20 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '0.9', background: `linear-gradient(135deg, ${product.tint}, ${product.tint}8C)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Círculo suave detrás del emoji: le da volumen sin necesitar foto. */}
        <span style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.45)' }} />
        <span style={{ fontSize: '50px', position: 'relative' }}>{product.emoji}</span>
        {product.badge && <span className="badge badge-orange" style={{ position: 'absolute', top: '8px', left: '8px' }}>{product.badge}</span>}
      </div>
      <div style={{ padding: '10px 11px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px', color: 'var(--white)', lineHeight: '17px' }}>{product.name}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.tagline}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px', color: 'var(--orange)', marginTop: '6px' }}>S/ {product.price}</div>
      </div>
    </motion.button>
  )
}

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [qty, setQty] = useState(1)
  const total = product.price * qty

  const order = () => {
    const message = `Hola Burrito 🫏 Quiero pedir:\n\n• ${qty} × ${product.name} — S/ ${total}\n\n¿Cómo coordinamos el pago y la entrega?\n\n_Generado con Burrito · La guía piurana_ 🫏`
    const url = STORE_WHATSAPP ? `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(5,4,3,0.88)', backdropFilter: 'blur(8px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{ position: 'fixed', inset: 0, zIndex: 6001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
        <div onClick={e => e.stopPropagation()} className="card" style={{ pointerEvents: 'auto', width: '100%', maxWidth: '420px', maxHeight: '86vh', overflowY: 'auto', padding: '20px', position: 'relative' }}>
          <button onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: '14px', right: '14px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
            <X size={16} color="var(--white)" />
          </button>

          <div style={{ width: '100%', height: '170px', borderRadius: '16px', background: product.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '80px' }}>{product.emoji}</span>
          </div>

          <p className="section-label" style={{ marginBottom: '4px' }}>{SECTIONS.find(s => s.id === product.section)?.label.toUpperCase()}</p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 800, color: 'var(--white)' }}>{product.name}</h3>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', color: 'var(--orange)', marginTop: '2px' }}>{product.tagline}</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginTop: '10px' }}>{product.description}</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StepperButton icon={<Minus size={15} />} disabled={qty <= 1} onClick={() => setQty(q => q - 1)} />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '16px', color: 'var(--white)', width: '20px', textAlign: 'center' }}>{qty}</span>
              <StepperButton icon={<Plus size={15} />} disabled={qty >= 20} onClick={() => setQty(q => q + 1)} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>Total</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--orange)' }}>S/ {total}</div>
            </div>
          </div>

          <button onClick={order} className="btn btn-primary" style={{ width: '100%', marginTop: '18px', justifyContent: 'center' }}>Pedir por WhatsApp</button>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '11.5px', color: 'var(--muted)', textAlign: 'center', marginTop: '8px' }}>Te respondemos por WhatsApp para coordinar pago (Yape, Plin o efectivo) y entrega.</p>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}

function StepperButton({ icon, disabled, onClick }: { icon: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '32px', height: '32px', borderRadius: '50%', background: disabled ? 'var(--card2)' : 'rgba(255,85,0,0.12)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', color: disabled ? 'var(--muted)' : 'var(--orange)' }}>
      {icon}
    </button>
  )
}
