import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, Minus, Plus } from 'lucide-react'
import { catalogService, confirmationCode } from '../../services/catalog'
import { CATALOG_KIND_LABELS, displayUnit, type CatalogItem, type CatalogItemKind } from '../../types/catalog'
import type { Spot } from '../../types/spot'

/**
 * El catálogo vendible del negocio (habitaciones, platos, productos o
 * tours), dentro del detalle del spot. Si el negocio no cargó nada
 * todavía, esta sección simplemente no aparece. Espejo de
 * ui/explore/CatalogSection.kt de la app nativa.
 */
export default function CatalogSection({ spot }: { spot: Spot }) {
  const [items, setItems] = useState<CatalogItem[] | null>(null)
  const [selected, setSelected] = useState<CatalogItem | null>(null)

  useEffect(() => {
    let alive = true
    setItems(null)
    catalogService.getForSpot(spot.id).then(list => { if (alive) setItems(list) })
    return () => { alive = false }
  }, [spot.id])

  if (!items || items.length === 0) return null

  const kinds = new Set(items.map(i => i.kind))
  const title = kinds.size === 1
    ? ({ habitacion: 'Habitaciones', plato: 'Menú', tour: 'Tours', producto: 'Catálogo' } as Record<CatalogItemKind, string>)[items[0].kind]
    : 'Catálogo'

  return (
    <div style={{ marginBottom: '16px' }}>
      <p className="section-label" style={{ marginBottom: '10px' }}>{title}</p>
      <div className="scroll-row">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className="card"
            style={{
              width: '140px', padding: '10px', textAlign: 'left', cursor: 'pointer',
              border: '1px solid var(--border)', flexShrink: 0,
            }}
          >
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden',
              background: 'rgba(255,85,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '8px', position: 'relative',
            }}>
              {item.images[0]
                ? <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '38px' }}>{CATALOG_KIND_LABELS[item.kind].emoji}</span>}
              {item.stockStatus === 'agotado' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '11px' }}>Agotado</span>
                </div>
              )}
              {item.stockStatus === 'pocas_unidades' && (
                <span className="badge badge-orange" style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '9px' }}>Pocas unidades</span>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--white)', lineHeight: 1.25, marginBottom: '4px' }}>
              {item.name}
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--orange)' }}>S/ {cleanNumber(item.price)}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '10.5px', color: 'var(--muted)' }}> {displayUnit(item)}</span>
            </div>
          </button>
        ))}
      </div>

      <CatalogItemModal item={selected} spot={spot} onClose={() => setSelected(null)} />
    </div>
  )
}

/** S/ 45 se ve como "45"; S/ 45.5 se ve como "45.5" — JS ya omite ceros de más. */
function cleanNumber(n: number): string {
  return String(n)
}

/** Ficha del ítem: galería, variantes, cantidad, y el paso de pago (QR de Yape/Plin del negocio). */
function CatalogItemModal({ item, spot, onClose }: { item: CatalogItem | null; spot: Spot; onClose: () => void }) {
  const [qty, setQty] = useState(1)
  const [variantChoice, setVariantChoice] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'detail' | 'payment'>('detail')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    setQty(1)
    setStep('detail')
    setPlacing(false)
    setPlaced(false)
    setOrderId(null)
    setVariantChoice(Object.fromEntries(item.variants.map(v => [v.nombre, v.opciones[0] ?? ''])))
  }, [item?.id])

  if (!item) return null
  const total = item.price * qty
  const available = item.stockStatus !== 'agotado'

  const handlePaid = async () => {
    if (placing || placed) return
    setPlacing(true)
    const variantLabel = Object.entries(variantChoice).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ') || null
    const id = await catalogService.createOrder({
      spotId: spot.id,
      items: [{ itemId: item.id, name: item.name, qty, price: item.price, variant: variantLabel }],
      total,
    }).catch(() => null)
    setOrderId(id)
    setPlacing(false)
    setPlaced(true)

    const whatsapp = spot.socialLinks?.whatsapp?.replace(/\D/g, '')
    if (whatsapp) {
      const message = `Hola 🫏 Quiero confirmar mi pedido en ${spot.name}:\n\n` +
        `• Código: ${confirmationCode(id)}\n` +
        `• ${qty} × ${item.name}${variantLabel ? ` (${variantLabel})` : ''} — S/ ${cleanNumber(total)}\n\n` +
        `Ya realicé el pago por Yape/Plin.\n\n_Generado con Burrito · La guía piurana_ 🫏`
      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank')
    }
  }

  // Portal a document.body: SpotBottomSheet anima su contenedor con un
  // transform (GSAP), y eso convierte a ese contenedor en el "containing
  // block" de cualquier hijo `position: fixed` — sin el portal, este modal
  // quedaba atrapado y recortado dentro del bottom sheet en vez de cubrir
  // toda la pantalla.
  return createPortal(
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(5,4,3,0.88)', backdropFilter: 'blur(8px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ position: 'fixed', inset: 0, zIndex: 5001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="card"
              style={{ pointerEvents: 'auto', width: '100%', maxWidth: '420px', maxHeight: '86vh', overflowY: 'auto', padding: '20px', position: 'relative' }}
            >
              <button
                onClick={onClose} aria-label="Cerrar"
                style={{ position: 'absolute', top: '14px', right: '14px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
              >
                <X size={16} color="var(--white)" />
              </button>

              {step === 'detail' ? (
                <>
                  <div style={{
                    width: '100%', height: '170px', borderRadius: '16px', overflow: 'hidden',
                    background: 'rgba(255,85,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                  }}>
                    {item.images[0]
                      ? <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '64px' }}>{CATALOG_KIND_LABELS[item.kind].emoji}</span>}
                  </div>

                  <p className="section-label" style={{ marginBottom: '4px' }}>{CATALOG_KIND_LABELS[item.kind].label.toUpperCase()}</p>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 800, color: 'var(--white)', marginBottom: '2px' }}>{item.name}</h3>
                  {item.capacity != null && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginBottom: '6px' }}>
                      Hasta {item.capacity} {item.capacity === 1 ? 'persona' : 'personas'}
                    </p>
                  )}
                  {item.description && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginTop: '8px' }}>{item.description}</p>
                  )}

                  {item.variants.map(variant => variant.opciones.length > 0 && (
                    <div key={variant.nombre} style={{ marginTop: '14px' }}>
                      <p className="section-label" style={{ marginBottom: '6px' }}>{variant.nombre.toUpperCase()}</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {variant.opciones.map(option => (
                          <button
                            key={option}
                            onClick={() => setVariantChoice(v => ({ ...v, [variant.nombre]: option }))}
                            className={`chip ${variantChoice[variant.nombre] === option ? 'selected' : ''}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <StepperButton icon={<Minus size={15} />} disabled={qty <= 1} onClick={() => setQty(q => q - 1)} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '16px', color: 'var(--white)', width: '20px', textAlign: 'center' }}>{qty}</span>
                      <StepperButton icon={<Plus size={15} />} disabled={qty >= 20} onClick={() => setQty(q => q + 1)} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>Total</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--orange)' }}>S/ {cleanNumber(total)}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('payment')}
                    disabled={!available}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '18px', justifyContent: 'center', opacity: available ? 1 : 0.5 }}
                  >
                    {available ? 'Pagar con Yape / Plin' : 'Agotado'}
                  </button>
                </>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    {!placed && (
                      <button onClick={() => setStep('detail')} aria-label="Volver" style={{ background: 'var(--card2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <ChevronLeft size={16} color="var(--white)" />
                      </button>
                    )}
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, color: 'var(--white)' }}>Pagar con Yape / Plin</h3>
                  </div>

                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'var(--muted)' }}>{qty} × {item.name}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '26px', color: 'var(--orange)', margin: '4px 0 16px' }}>S/ {cleanNumber(total)}</p>

                  {spot.paymentQrUrl && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                      <img src={spot.paymentQrUrl} alt={`QR de Yape/Plin de ${spot.name}`} style={{ width: '200px', height: '200px', borderRadius: '16px', border: '1px solid var(--border)', objectFit: 'cover' }} />
                    </div>
                  )}
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                    {spot.paymentNote || (spot.paymentQrUrl
                      ? 'Escanea el Yape o Plin del negocio y paga el total exacto.'
                      : 'Este negocio aún no cargó su QR de Yape/Plin: toca "Ya pagué" y coordina el pago por WhatsApp.')}
                  </p>

                  {placed ? (
                    <div style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13.5px', color: '#25D366' }}>¡Listo! Guardamos tu pedido y el negocio lo va a confirmar.</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>Código: {confirmationCode(orderId)}</p>
                    </div>
                  ) : (
                    <>
                      <button onClick={handlePaid} disabled={placing} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        {placing ? 'Guardando…' : 'Ya pagué'}
                      </button>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '8px' }}>
                        Burrito no procesa el pago: solo avisa al negocio para que lo confirme.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function StepperButton({ icon, disabled, onClick }: { icon: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: disabled ? 'var(--card2)' : 'rgba(255,85,0,0.12)',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer', color: disabled ? 'var(--muted)' : 'var(--orange)',
      }}
    >
      {icon}
    </button>
  )
}

