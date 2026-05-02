import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, MapPin, Lightbulb, Clock, Star } from 'lucide-react'

export interface HistoriaItem {
  id: string
  cat: string
  año: string
  emoji: string
  titulo: string
  resumen: string
  datos: string[]
  imagenes?: string[]
  descripcionLarga?: string
  sabiasQue?: string[]
  lugaresRelacionados?: { nombre: string; distancia: string; tipo: string }[]
  horario?: string
  entrada?: string
  rating?: number
}

interface Props {
  item: HistoriaItem | null
  onClose: () => void
}

function Carousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  const prev = () => setIdx(i => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setIdx(i => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--card2)' }}>
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={images[idx]}
          alt=""
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${idx + 99}/600/340` }}
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button onClick={prev} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(4px)' }}>
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(4px)' }}>
            <ChevronRight size={18} />
          </button>
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i === idx ? 'var(--orange)' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
            ))}
          </div>
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.55)', borderRadius: '10px', padding: '3px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#fff', backdropFilter: 'blur(4px)' }}>
            {idx + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ color: 'var(--orange)' }}>{icon}</div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function HistoriaDetailModal({ item, onClose }: Props) {
  if (!item) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', maxHeight: '85vh', background: 'var(--bg)', borderRadius: '28px 28px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>{item.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--orange)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>{item.año}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{item.titulo}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px' }}>
          {/* Carousel */}
          {item.imagenes && item.imagenes.length > 0 && <Carousel images={item.imagenes} />}

          {/* Descripción larga */}
          {item.descripcionLarga && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7 }}>
                {item.descripcionLarga}
              </p>
            </div>
          )}

          {/* Info rápida */}
          {(item.horario || item.entrada || item.rating) && (
            <Section icon={<Clock size={14} />} title="Información Práctica">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {item.horario && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Horario</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>{item.horario}</div>
                  </div>
                )}
                {item.entrada && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Entrada</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>{item.entrada}</div>
                  </div>
                )}
                {item.rating && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={13} color="#facc15" fill="#facc15" />
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>{item.rating}/5.0</div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Datos clave */}
          <Section icon={<Lightbulb size={14} />} title="Datos Clave">
            {item.datos.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(255,85,0,0.12)', border: '1px solid rgba(255,85,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, color: 'var(--orange)' }}>{i + 1}</div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', lineHeight: 1.5 }}>{d}</span>
              </div>
            ))}
          </Section>

          {/* Sabías que */}
          {item.sabiasQue && item.sabiasQue.length > 0 && (
            <Section icon={<Star size={14} />} title="¿Sabías que...?">
              {item.sabiasQue.map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.15)', borderRadius: '12px', padding: '10px 14px', marginBottom: '8px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', lineHeight: 1.6, margin: 0 }}>✨ {s}</p>
                </div>
              ))}
            </Section>
          )}

          {/* Lugares relacionados */}
          {item.lugaresRelacionados && item.lugaresRelacionados.length > 0 && (
            <Section icon={<MapPin size={14} />} title="Lugares para Visitar">
              {item.lugaresRelacionados.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>{l.nombre}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '2px', textTransform: 'uppercase' }}>{l.tipo}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--orange)', fontWeight: 700, background: 'rgba(255,85,0,0.1)', padding: '3px 8px', borderRadius: '8px' }}>{l.distancia}</div>
                </div>
              ))}
            </Section>
          )}

          <div style={{ height: '32px' }} />
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
