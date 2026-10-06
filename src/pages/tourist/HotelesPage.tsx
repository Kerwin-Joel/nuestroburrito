import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { QRCodeSVG } from 'qrcode.react'
import {
  Hotel, ChevronRight, MapPin, X, ChevronLeft, Minus, Plus,
  CalendarDays, Luggage,
} from 'lucide-react'
import { spotsService } from '../../services/spots'
import { catalogService, confirmationCode } from '../../services/catalog'
import type { Spot } from '../../types/spot'
import type { CatalogItem, StoreOrder, OrderStatus } from '../../types/catalog'

/* ──────────────────────────── Fechas ──────────────────────────── */

function isoDate(d: Date): string { return d.toISOString().slice(0, 10) }
function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}
function formatDate(iso: string): string {
  const s = new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function cleanNumber(n: number): string { return String(n) }

const DEFAULT_CHECKIN = '3:00 pm'
const DEFAULT_CHECKOUT = '11:00 am'

/* ──────────────────────────── Página ──────────────────────────── */

interface HotelGroup { name: string; sedes: Spot[] }

function groupHotels(spots: Spot[]): HotelGroup[] {
  const map = new Map<string, Spot[]>()
  for (const s of spots) {
    const key = s.brandName?.trim() || s.name
    map.set(key, [...(map.get(key) ?? []), s])
  }
  return [...map.entries()].map(([name, sedes]) => ({ name, sedes }))
}

export default function HotelesPage() {
  const [hotels, setHotels] = useState<Spot[] | null>(null)
  const [pickingGroup, setPickingGroup] = useState<HotelGroup | null>(null)
  const [openSede, setOpenSede] = useState<Spot | null>(null)
  const [showReservations, setShowReservations] = useState(false)

  useEffect(() => { spotsService.getHotels().then(setHotels) }, [])

  const groups = hotels ? groupHotels(hotels) : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ padding: '24px 20px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,85,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,85,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,85,0,0.3)' }}>
              <Hotel size={16} color="var(--orange)" />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--orange)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Hoteles en Piura
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900, color: 'var(--white)', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '8px' }}>
            Reserva tu<br /><span style={{ color: 'var(--orange)' }}>habitación</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Paga directo al hotel, sin comisión escondida.
          </p>
        </motion.div>
      </div>

      <div className="page-container" style={{ paddingTop: '20px', paddingBottom: '48px' }}>
        <button
          onClick={() => setShowReservations(true)}
          disabled={!hotels}
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '14px', marginBottom: '20px', cursor: hotels ? 'pointer' : 'default' }}
        >
          <Luggage size={18} color="var(--orange)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--orange)', flex: 1, textAlign: 'left' }}>Mis reservas</span>
          <ChevronRight size={16} color="var(--orange)" />
        </button>

        {!groups ? (
          <div className="skeleton" style={{ height: '180px', borderRadius: '16px' }} />
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '40px', marginBottom: '8px' }}>🏨</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--white)' }}>Todavía no hay hoteles cargados</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Muy pronto vas a poder reservar tu habitación desde aquí.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {groups.map(group => (
              <HotelCard key={group.name} group={group} onClick={() => group.sedes.length === 1 ? setOpenSede(group.sedes[0]) : setPickingGroup(group)} />
            ))}
          </div>
        )}
      </div>

      {pickingGroup && (
        <SedePickerModal group={pickingGroup} onClose={() => setPickingGroup(null)} onPick={s => { setOpenSede(s); setPickingGroup(null) }} />
      )}
      {openSede && <HotelDetailModal spot={openSede} onClose={() => setOpenSede(null)} />}
      {showReservations && hotels && <MyReservationsModal hotels={hotels} onClose={() => setShowReservations(false)} />}
    </div>
  )
}

function HotelCard({ group, onClick }: { group: HotelGroup; onClick: () => void }) {
  const cover = group.sedes[0]
  return (
    <button onClick={onClick} className="card" style={{ textAlign: 'left', cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
      <div style={{ width: '100%', height: '140px', background: 'rgba(255,85,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cover.photoUrl
          ? <img src={cover.photoUrl} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '40px' }}>🏨</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
            <MapPin size={12} color="var(--muted)" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>
              {group.sedes.length > 1 ? `${group.sedes.length} sedes en Piura` : (cover.address || 'Piura')}
            </span>
          </div>
        </div>
        <ChevronRight size={16} color="var(--orange)" />
      </div>
    </button>
  )
}

/* ──────────────────────────── Modal base (portal) ──────────────────────────── */

function ModalShell({ onClose, children, maxWidth = '440px' }: { onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(5,4,3,0.88)', backdropFilter: 'blur(8px)' }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{ position: 'fixed', inset: 0, zIndex: 6001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}
      >
        <div onClick={e => e.stopPropagation()} className="card" style={{ pointerEvents: 'auto', width: '100%', maxWidth, maxHeight: '86vh', overflowY: 'auto', padding: '20px', position: 'relative' }}>
          <button onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: '14px', right: '14px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
            <X size={16} color="var(--white)" />
          </button>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}

function SedePickerModal({ group, onClose, onPick }: { group: HotelGroup; onClose: () => void; onPick: (s: Spot) => void }) {
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '19px', color: 'var(--white)', marginBottom: '2px' }}>{group.name}</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>Elige la sede</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {group.sedes.map(sede => (
          <button key={sede.id} onClick={() => onPick(sede)} className="card" style={{ display: 'flex', alignItems: 'center', padding: '14px', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14.5px', color: 'var(--white)' }}>{sede.name}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{sede.address || 'Piura'}</div>
            </div>
            <ChevronRight size={16} color="var(--orange)" />
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

/* ──────────────────────────── Detalle de sede ──────────────────────────── */

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#FF8C00;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid rgba(255,85,0,0.4);box-shadow:0 4px 12px rgba(255,85,0,0.4);"></div>`,
  iconSize: [28, 28], iconAnchor: [14, 28],
})

function HotelDetailModal({ spot, onClose }: { spot: Spot; onClose: () => void }) {
  const [rooms, setRooms] = useState<CatalogItem[] | null>(null)
  const [booking, setBooking] = useState<CatalogItem | null>(null)
  const photos = spot.photos?.length ? spot.photos : (spot.photoUrl ? [spot.photoUrl] : [])

  useEffect(() => { catalogService.getForSpot(spot.id).then(setRooms) }, [spot.id])

  return (
    <ModalShell onClose={onClose} maxWidth="480px">
      {photos[0] && (
        <div style={{ width: 'calc(100% + 40px)', margin: '-20px -20px 16px', height: '180px', overflow: 'hidden' }}>
          <img src={photos[0]} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '21px', color: 'var(--white)', marginBottom: '4px' }}>{spot.name}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
        <MapPin size={14} color="var(--muted)" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>{spot.address || 'Piura'}</span>
      </div>
      {spot.description && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '14px' }}>{spot.description}</p>
      )}

      <div style={{ width: '100%', height: '150px', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '8px' }}>
        <MapContainer center={[spot.lat, spot.lng]} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[spot.lat, spot.lng]} icon={pinIcon} />
        </MapContainer>
      </div>
      <a href={`https://maps.google.com/?q=${spot.lat},${spot.lng}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}>
        <MapPin size={14} /> Cómo llegar
      </a>

      <p className="section-label" style={{ marginBottom: '10px' }}>Habitaciones</p>
      {!rooms ? (
        <div className="skeleton" style={{ height: '80px', borderRadius: '14px' }} />
      ) : rooms.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>Este hotel todavía no cargó sus habitaciones.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rooms.map(room => <RoomRow key={room.id} room={room} onClick={() => setBooking(room)} />)}
        </div>
      )}

      {booking && <BookingModal spot={spot} room={booking} onClose={() => setBooking(null)} />}
    </ModalShell>
  )
}

function RoomRow({ room, onClick }: { room: CatalogItem; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '14px', background: 'rgba(255,85,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        {room.images[0] ? <img src={room.images[0]} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '26px' }}>🛏️</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14.5px', color: 'var(--white)' }}>{room.name}</div>
        {room.capacity != null && <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Hasta {room.capacity} {room.capacity === 1 ? 'persona' : 'personas'}</div>}
        <div style={{ marginTop: '4px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: 'var(--orange)' }}>S/ {cleanNumber(room.price)}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)' }}> {room.unitLabel || 'por noche'}</span>
        </div>
      </div>
      {room.stockStatus === 'agotado' ? <span style={{ fontFamily: 'var(--font-body)', fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)' }}>Agotado</span> : <ChevronRight size={16} color="var(--orange)" />}
    </button>
  )
}

/* ──────────────────────────── Reserva (3 pasos) ──────────────────────────── */

type BookingStep = 'dates' | 'guest' | 'payment'

function BookingModal({ spot, room, onClose }: { spot: Spot; room: CatalogItem; onClose: () => void }) {
  const [step, setStep] = useState<BookingStep>('dates')
  const [checkIn, setCheckIn] = useState(() => addDays(isoDate(new Date()), 1))
  const [nights, setNights] = useState(1)
  const [guests, setGuests] = useState(1)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestNote, setGuestNote] = useState('')
  const [checking, setChecking] = useState(true)
  const [available, setAvailable] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const checkOut = addDays(checkIn, nights)
  const total = room.price * nights
  const maxGuests = room.capacity ?? 6
  const checkinTime = spot.checkinTime || DEFAULT_CHECKIN
  const checkoutTime = spot.checkoutTime || DEFAULT_CHECKOUT

  useEffect(() => {
    let alive = true
    setChecking(true)
    catalogService.isRoomAvailable(room.id, checkIn, checkOut).then(ok => { if (alive) { setAvailable(ok); setChecking(false) } })
    return () => { alive = false }
  }, [room.id, checkIn, nights])

  const handlePaid = async () => {
    if (placing || placed) return
    setPlacing(true)
    const variant = `${guestName} · ${guests} ${guests === 1 ? 'huésped' : 'huéspedes'} · ${formatDate(checkIn)} a ${formatDate(checkOut)}`
    const id = await catalogService.createOrder({
      spotId: spot.id,
      items: [{ itemId: room.id, name: room.name, qty: nights, price: room.price, variant, checkIn, checkOut, guestName }],
      total,
      note: [guestPhone && `WhatsApp del huésped: ${guestPhone}`, guestNote].filter(Boolean).join(' · ') || null,
    }).catch(() => null)
    setOrderId(id)
    setPlacing(false)
    setPlaced(true)

    const whatsapp = spot.socialLinks?.whatsapp?.replace(/\D/g, '')
    if (whatsapp) {
      const message = `Hola 🫏 Quiero confirmar mi reserva en ${spot.name}:\n\n` +
        `• Código: ${confirmationCode(id)}\n` +
        `• Huésped: ${guestName}${guestPhone ? ` (${guestPhone})` : ''}\n` +
        `• ${room.name}\n` +
        `• Llegada: ${formatDate(checkIn)}, desde ${checkinTime}\n` +
        `• Salida: ${formatDate(checkOut)}, hasta ${checkoutTime}\n` +
        `• ${nights} ${nights === 1 ? 'noche' : 'noches'} · ${guests} ${guests === 1 ? 'huésped' : 'huéspedes'}\n` +
        (guestNote ? `• Pedido especial: ${guestNote}\n` : '') +
        `• Total: S/ ${cleanNumber(total)}\n\nYa realicé el pago por Yape/Plin.\n\n_Generado con Burrito · La guía piurana_ 🫏`
      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank')
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <StepDots current={['dates', 'guest', 'payment'].indexOf(step)} total={3} />
      <div style={{ marginTop: '14px' }}>
        {step === 'dates' && (
          <div>
            <p className="section-label">Reserva</p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '21px', color: 'var(--white)', margin: '4px 0 2px' }}>{room.name}</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>{spot.name}</p>

            <label style={{ display: 'block', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                <CalendarDays size={13} /> LLEGADA
              </span>
              <input
                type="date" value={checkIn} min={addDays(isoDate(new Date()), 1)}
                onChange={e => e.target.value && setCheckIn(e.target.value)}
                className="input"
              />
            </label>

            <StepperRow label="Noches" value={nights} min={1} max={30} onChange={setNights} />

            <div style={{ background: 'rgba(255,85,0,0.08)', borderRadius: '14px', padding: '14px', marginTop: '14px' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13.5px', color: 'var(--white)' }}>Sales el {formatDate(checkOut)}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>Check-in desde {checkinTime} · Check-out hasta {checkoutTime}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>S/ {cleanNumber(room.price)} × {nights} {nights === 1 ? 'noche' : 'noches'}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--white)' }}>S/ {cleanNumber(total)}</span>
            </div>

            {!checking && !available && (
              <div style={{ background: 'rgba(255,64,64,0.1)', border: '1px solid rgba(255,64,64,0.25)', borderRadius: '12px', padding: '12px', marginTop: '12px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '12.5px', color: '#ff4040', lineHeight: 1.5 }}>
                  Esas fechas ya están reservadas en esta habitación. Prueba con otra fecha o cantidad de noches.
                </p>
              </div>
            )}

            <button
              onClick={() => setStep('guest')}
              disabled={room.stockStatus === 'agotado' || checking || !available}
              className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '18px', opacity: (checking || !available) ? 0.5 : 1 }}
            >
              {checking ? 'Verificando disponibilidad…' : 'Continuar'}
            </button>
          </div>
        )}

        {step === 'guest' && (
          <div>
            <StepHeader title="¿Quién se hospeda?" onBack={() => setStep('dates')} />
            <div style={{ marginTop: '14px' }}>
              <StepperRow label="Huéspedes" value={guests} min={1} max={maxGuests} onChange={setGuests} />
            </div>
            <TextField label="Nombre completo" value={guestName} onChange={setGuestName} />
            <TextField label="WhatsApp (opcional)" value={guestPhone} onChange={setGuestPhone} type="tel" />
            <TextField label="Pedido especial (opcional)" value={guestNote} onChange={setGuestNote} textarea />
            <button onClick={() => setStep('payment')} disabled={!guestName.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', opacity: guestName.trim() ? 1 : 0.5 }}>
              Continuar al pago
            </button>
            {!guestName.trim() && <p style={{ fontFamily: 'var(--font-body)', fontSize: '11.5px', color: 'var(--muted)', marginTop: '8px' }}>El hotel necesita saber a nombre de quién es la reserva.</p>}
          </div>
        )}

        {step === 'payment' && (
          <div>
            <StepHeader title="Pago" onBack={() => !placed && setStep('guest')} hideBack={placed} />
            {!placed ? (
              <>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'var(--muted)', marginTop: '12px' }}>
                  {room.name} · {formatDate(checkIn)} → {formatDate(checkOut)} · {nights} {nights === 1 ? 'noche' : 'noches'}<br />
                  {guestName} · {guests} {guests === 1 ? 'huésped' : 'huéspedes'}
                </p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '26px', color: 'var(--orange)', margin: '4px 0 16px' }}>S/ {cleanNumber(total)}</p>
                {spot.paymentQrUrl && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <img src={spot.paymentQrUrl} alt={`QR de Yape/Plin de ${spot.name}`} style={{ width: '200px', height: '200px', borderRadius: '16px', border: '1px solid var(--border)', objectFit: 'cover' }} />
                  </div>
                )}
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                  {spot.paymentNote || (spot.paymentQrUrl ? 'Escanea el Yape o Plin del negocio y paga el total exacto.' : 'Este hotel aún no cargó su QR de Yape/Plin: toca "Ya pagué" y coordina el pago por WhatsApp.')}
                </p>
                <button onClick={handlePaid} disabled={placing} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {placing ? 'Guardando…' : 'Ya pagué'}
                </button>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '8px' }}>Burrito no procesa el pago: solo avisa al hotel para que lo confirme.</p>
              </>
            ) : (
              <ReservationQrView orderId={orderId} roomName={room.name} guestName={guestName} checkIn={checkIn} checkOut={checkOut} checkinTime={checkinTime} checkoutTime={checkoutTime} showConfirmedTitle />
            )}
          </div>
        )}
      </div>
    </ModalShell>
  )
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.div key={i} animate={{ width: i === current ? 22 : 14, background: i <= current ? 'var(--orange)' : 'var(--border)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} style={{ height: '5px', borderRadius: '99px' }} />
      ))}
    </div>
  )
}

function StepHeader({ title, onBack, hideBack }: { title: string; onBack: () => void; hideBack?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {!hideBack && (
        <button onClick={onBack} aria-label="Volver" style={{ background: 'var(--card2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronLeft size={16} color="var(--white)" />
        </button>
      )}
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '17px', color: 'var(--white)' }}>{title}</h3>
    </div>
  )
}

function StepperRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: '14px', padding: '8px 14px' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--white)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <StepperButton icon={<Minus size={15} />} disabled={value <= min} onClick={() => onChange(value - 1)} />
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: 'var(--white)', width: '20px', textAlign: 'center' }}>{value}</span>
        <StepperButton icon={<Plus size={15} />} disabled={value >= max} onClick={() => onChange(value + 1)} />
      </div>
    </div>
  )
}

function StepperButton({ icon, disabled, onClick }: { icon: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '30px', height: '30px', borderRadius: '50%', background: disabled ? 'var(--card2)' : 'rgba(255,85,0,0.12)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', color: disabled ? 'var(--muted)' : 'var(--orange)' }}>
      {icon}
    </button>
  )
}

function TextField({ label, value, onChange, type = 'text', textarea }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <label style={{ display: 'block', marginTop: '10px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>{label.toUpperCase()}</span>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} className="input" rows={2} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input" />}
    </label>
  )
}

/* ──────────────────────────── QR de la reserva ──────────────────────────── */

function ReservationQrView({ orderId, roomName, guestName, checkIn, checkOut, checkinTime, checkoutTime, showConfirmedTitle }: {
  orderId: string | null; roomName: string; guestName: string; checkIn: string; checkOut: string; checkinTime: string; checkoutTime: string; showConfirmedTitle?: boolean
}) {
  const [showingCheckout, setShowingCheckout] = useState(false)
  const code = orderId ?? 'pendiente'
  const qrValue = `BURRITO-RESERVA:${code}:${showingCheckout ? 'checkout' : 'checkin'}`

  return (
    <div style={{ textAlign: 'center' }}>
      {showConfirmedTitle && <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: '#25D366' }}>¡Reserva confirmada! 🎉</p>}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)', margin: '4px 0 16px' }}>Muestra este código en la recepción del hotel.</p>

      <div style={{ display: 'inline-flex', background: 'var(--card2)', borderRadius: '99px', padding: '3px', marginBottom: '16px' }}>
        {(['checkin', 'checkout'] as const).map(mode => {
          const active = (mode === 'checkout') === showingCheckout
          return (
            <button key={mode} onClick={() => setShowingCheckout(mode === 'checkout')}
              style={{ padding: '8px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '12.5px', background: active ? 'var(--orange)' : 'transparent', color: active ? '#fff' : 'var(--white)', transition: 'all 0.2s' }}>
              {mode === 'checkin' ? 'Check-in' : 'Check-out'}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <div style={{ background: '#fff', padding: '14px', borderRadius: '16px' }}>
          <QRCodeSVG value={qrValue} size={180} level="M" />
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13.5px', color: 'var(--white)' }}>
        {!showingCheckout ? `Llegada: ${formatDate(checkIn)} · desde ${checkinTime}` : `Salida: ${formatDate(checkOut)} · hasta ${checkoutTime}`}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{guestName} · {roomName}</p>

      <div style={{ display: 'inline-block', marginTop: '10px', background: 'var(--card2)', borderRadius: '99px', padding: '5px 12px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--white)' }}>Código: {confirmationCode(orderId)}</span>
      </div>
    </div>
  )
}

/* ──────────────────────────── Mis reservas ──────────────────────────── */

function reservationStatus(status: OrderStatus): [string, string] {
  switch (status) {
    case 'confirmado': return ['Confirmada por el hotel', '#25D366']
    case 'entregado': return ['Estadía completada', 'var(--muted)']
    case 'cancelado': return ['Cancelada', '#ff4040']
    default: return ['Pagaste · esperando que el hotel confirme', 'var(--orange)']
  }
}

function MyReservationsModal({ hotels, onClose }: { hotels: Spot[]; onClose: () => void }) {
  const [orders, setOrders] = useState<StoreOrder[] | null>(null)
  const [viewing, setViewing] = useState<StoreOrder | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { catalogService.getMyOrders(hotels.map(h => h.id)).then(setOrders) }, [refreshKey])

  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--white)', marginBottom: '14px' }}>Mis reservas</h3>
      {!orders ? (
        <div className="skeleton" style={{ height: '120px', borderRadius: '14px' }} />
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <p style={{ fontSize: '32px' }}>🧳</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--white)', marginTop: '6px' }}>Aún no tienes reservas</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)', marginTop: '4px' }}>Cuando reserves una habitación, la vas a ver aquí, con tu código de check-in.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {orders.map(order => {
            const hotelName = hotels.find(h => h.id === order.spotId)?.name ?? 'Hotel'
            const room = order.items[0]
            const [statusText, statusColor] = reservationStatus(order.status)
            return (
              <button key={order.id} onClick={() => setViewing(order)} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(255,85,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '20px' }}>🏨</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14.5px', color: 'var(--white)' }}>{hotelName}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)' }}>{room?.name} · {confirmationCode(order.id)}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '11.5px', color: statusColor, marginTop: '3px' }}>{statusText}</div>
                </div>
                <ChevronRight size={16} color="var(--orange)" />
              </button>
            )
          })}
        </div>
      )}

      {viewing && (() => {
        const spot = hotels.find(h => h.id === viewing.spotId)
        return spot ? (
          <ReservationDetailModal order={viewing} spot={spot} onClose={() => setViewing(null)} onCancelled={() => setRefreshKey(k => k + 1)} />
        ) : null
      })()}
    </ModalShell>
  )
}

function ReservationDetailModal({ order, spot, onClose, onCancelled }: { order: StoreOrder; spot: Spot; onClose: () => void; onCancelled: () => void }) {
  const room = order.items[0]
  const [statusText, statusColor] = reservationStatus(order.status)
  const cancellable = order.status === 'pendiente_confirmacion' || order.status === 'confirmado'
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    if (cancelling || !order.id) return
    setCancelling(true)
    await catalogService.cancelOrder(order.id).catch(() => {})
    setCancelling(false)
    setConfirming(false)
    onCancelled()
    onClose()
  }

  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '19px', color: 'var(--white)' }}>{spot.name}</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', margin: '2px 0 8px' }}>{room?.name}</p>
      <div style={{ display: 'inline-block', background: `${statusColor}22`, borderRadius: '10px', padding: '6px 10px', marginBottom: '18px' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '12px', color: statusColor }}>{statusText}</span>
      </div>

      {room?.checkIn && room?.checkOut ? (
        <ReservationQrView orderId={order.id ?? null} roomName={room.name} guestName={room.guestName ?? ''} checkIn={room.checkIn} checkOut={room.checkOut} checkinTime={spot.checkinTime || DEFAULT_CHECKIN} checkoutTime={spot.checkoutTime || DEFAULT_CHECKOUT} />
      ) : (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>Esta reserva no tiene fechas guardadas.</p>
      )}

      {cancellable && !confirming && (
        <button onClick={() => setConfirming(true)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '20px', color: '#ff4040' }}>
          Cancelar reserva
        </button>
      )}
      {confirming && (
        <div style={{ marginTop: '20px', border: '1px solid rgba(255,64,64,0.3)', borderRadius: '14px', padding: '14px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--white)', marginBottom: '6px' }}>¿Cancelar esta reserva?</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '12px' }}>
            Avísale al hotel por WhatsApp si ya habían coordinado algo — cancelar acá no les llega un mensaje automático.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setConfirming(false)} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} disabled={cancelling}>Volver</button>
            <button onClick={handleCancel} className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: '1px solid #ff4040', color: '#ff4040' }} disabled={cancelling}>
              {cancelling ? 'Cancelando…' : 'Sí, cancelar'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}
