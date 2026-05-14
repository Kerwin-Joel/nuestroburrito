import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, RefreshCw, Eye, EyeOff, Copy, Check, QrCode, FileText, X } from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface QREntry {
    id: string
    spot_id: string
    code: string
    active: boolean
    created_at: string
    spots: { name: string; category: string }
}

type Variant = 'clasica' | 'premium'

interface QRPrintCardProps {
    entry: QREntry | null
    visitsToday: number
    onToggleActive: (entry: QREntry) => void
    onRegenerate: (entry: QREntry) => void
}

const APP_URL = 'https://www.nuestroburrito.com'

const CATEGORY_EMOJI: Record<string, string> = {
    restaurante: '🍽️', evento: '🎵', playa: '🏖️', tour: '🗺️',
    bar: '🍻', hotel: '🏨', cultura: '🏛️', naturaleza: '🌿', default: '📍',
}
const getEmoji = (cat: string) => CATEGORY_EMOJI[cat?.toLowerCase()] ?? CATEGORY_EMOJI.default

// ─── Esquinas decorativas QR frame ───────────────────────────────────────────
const QRCorners = ({ size = 18, thickness = 2.5, color = '#FF5500' }: { size?: number; thickness?: number; color?: string }) => (
    <>
        {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
            <div key={pos} style={{
                position: 'absolute',
                width: size, height: size,
                borderStyle: 'solid', borderColor: color,
                top: pos.startsWith('t') ? '-1px' : undefined,
                bottom: pos.startsWith('b') ? '-1px' : undefined,
                left: pos.endsWith('l') ? '-1px' : undefined,
                right: pos.endsWith('r') ? '-1px' : undefined,
                borderWidth: pos === 'tl' ? `${thickness}px 0 0 ${thickness}px`
                    : pos === 'tr' ? `${thickness}px ${thickness}px 0 0`
                        : pos === 'bl' ? `0 0 ${thickness}px ${thickness}px`
                            : `0 ${thickness}px ${thickness}px 0`,
                borderRadius: pos === 'tl' ? '4px 0 0 0' : pos === 'tr' ? '0 4px 0 0'
                    : pos === 'bl' ? '0 0 0 4px' : '0 0 4px 0',
            }} />
        ))}
    </>
)

const Separator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
        <div style={{ flex: 1, height: '1px', background: '#f0ebe3' }} />
        <span style={{ fontSize: '12px' }}><img
            src="/logo burrito.png"
            alt="Logo Burrito"
            style={{ width: '22px', height: '22px', objectFit: 'contain' }}
        /></span>
        <div style={{ flex: 1, height: '1px', background: '#f0ebe3' }} />
    </div>
)

// ─── PrintCard — la tarjeta imprimible ───────────────────────────────────────
interface PrintCardProps {
    entry: QREntry
    variant: Variant
    qrSize?: number
    width?: number
    innerRef?: React.RefObject<HTMLDivElement | null>
}

const PrintCard = ({ entry, variant, qrSize = 190, width = 300, innerRef }: PrintCardProps) => {
    const qrUrl = `${APP_URL}/verify?code=${entry.code}`
    const emoji = getEmoji(entry.spots.category)

    return (
        <div ref={innerRef} style={{
            width,
            background: '#fff',
            borderRadius: '22px',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            boxShadow: variant === 'clasica'
                ? '0 0 0 1.5px #FF5500, 0 16px 48px rgba(255,85,0,0.14)'
                : '0 0 0 1px #e0dbd4, 0 16px 48px rgba(0,0,0,0.08)',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px 18px',
                position: 'relative',
                overflow: 'hidden',
                background: variant === 'clasica' ? '#FF5500' : '#1a1208',
            }}>
                {variant === 'premium' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#FF5500' }} />
                )}
                {/* círculo deco */}
                <div style={{
                    position: 'absolute', right: '-20px', top: '-20px',
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: variant === 'clasica' ? 'rgba(255,255,255,0.07)' : 'rgba(255,85,0,0.1)',
                    pointerEvents: 'none',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', position: 'relative', zIndex: 1, paddingLeft: variant === 'premium' ? '6px' : 0 }}>
                    <div style={{
                        width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: variant === 'clasica' ? 'rgba(255,255,255,0.18)' : 'rgba(255,85,0,0.15)',
                        border: variant === 'premium' ? '1px solid rgba(255,85,0,0.25)' : 'none',
                    }}>
                        <img
                            src="/logo burrito.png"
                            alt="Logo Burrito"
                            style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                        />
                    </div>
                    <div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>
                            burri<span style={{ color: variant === 'clasica' ? 'rgba(255,255,255,0.55)' : '#FF5500' }}>to</span>
                        </div>
                        <div style={{ fontSize: '7px', letterSpacing: '2px', textTransform: 'uppercase', color: variant === 'clasica' ? 'rgba(255,255,255)' : 'rgba(255,255,255)', marginTop: '1px' }}>
                            La guía piurana
                        </div>
                    </div>
                </div>
                <div style={{
                    position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 8px', borderRadius: '100px', fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase',
                    background: variant === 'clasica' ? 'rgba(255,255,255,0.18)' : 'rgba(255,85,0,0.15)',
                    color: 'rgba(255,255,255)',
                    border: variant === 'clasica' ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,85,0,0.3)',
                    marginLeft: variant === 'premium' ? '6px' : 0,
                }}>
                    {emoji} {entry.spots.category || 'Spot'}
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {/* QR frame */}
                <div style={{
                    position: 'relative', padding: '10px', borderRadius: '14px',
                    background: '#faf8f6',
                    border: variant === 'clasica' ? '1.5px solid #f0ebe3' : '1.5px dashed #e0dbd4',
                }}>
                    <QRCorners />
                    <div style={{ position: 'relative' }}>
                        <QRCodeSVG
                            value={qrUrl}
                            size={qrSize}
                            bgColor="#faf8f6"
                            fgColor={variant === 'premium' ? '#FF5500' : '#1a1208'}
                            level="H"
                            imageSettings={{
                                src: "/logo burrito.png",
                                height: 30, width: 30, excavate: true,
                            }}
                        />
                    </div>
                </div>

                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px', color: '#1a1208', textAlign: 'center', lineHeight: 1.25, letterSpacing: '-0.2px' }}>
                    {entry.spots.name}
                </div>

                <Separator />

                <div style={{
                    width: '100%', borderRadius: '10px', padding: '10px 12px', textAlign: 'center',
                    background: variant === 'clasica' ? 'rgba(255,85,0,0.05)' : '#1a1208',
                    border: variant === 'clasica' ? '1px solid rgba(255,85,0,0.1)' : '1px solid #2a2010',
                }}>
                    <div style={{ fontSize: '11px', lineHeight: 1.5, color: variant === 'clasica' ? '#999' : 'rgba(255,255,255)' }}>
                        Escanea · verifica tu visita<br />
                        y <span style={{ color: '#FF5500', fontWeight: 600 }}>obtén beneficios exclusivos</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #f0ebe3', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf8f6' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '7px', color: '#ccc', letterSpacing: '0.3px' }}>{entry.code}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '7px', color: '#FF5500' }}>nuestroburrito.com</span>
            </div>
        </div>
    )
}

// ─── HTML completo para imprimir en A4 ───────────────────────────────────────
const buildA4PrintHtml = (cardHtml: string, entry: QREntry, variant: Variant): string => {
    const emoji = getEmoji(entry.spots.category)
    const accentColor = '#FF5500'

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>QR — ${entry.spots.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      width: 210mm;
      min-height: 297mm;
      background: white;
      font-family: 'DM Sans', sans-serif;
      display: flex;
      flex-direction: column;
    }

    /* ── Franja superior ── */
    .top-bar {
      background: ${variant === 'premium' ? '#1a1208' : accentColor};
      height: 6px;
      width: 100%;
      flex-shrink: 0;
    }
    .top-bar-accent {
      background: ${accentColor};
      height: 6px;
      width: 40%;
      display: ${variant === 'premium' ? 'block' : 'none'};
    }

    /* ── Header de página ── */
    .page-header {
      padding: 28px 40px 20px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-bottom: 1.5px solid #f0ebe3;
      flex-shrink: 0;
    }

    .brand-wordmark {
      font-family: 'Syne', sans-serif;
      font-weight: 900;
      font-size: 48px;
      letter-spacing: -2px;
      color: #1a1208;
      line-height: 1;
    }
    .brand-wordmark span { color: ${accentColor}; }

    .brand-sub {
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #888;
      margin-top: 6px;
      font-weight: 500;
    }

    .header-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 100px;
      background: rgba(255,85,0,0.08);
      border: 1.5px solid rgba(255,85,0,0.25);
    }
    .header-pill-emoji {
      font-size: 16px;
    }
    .header-pill-text {
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${accentColor};
      font-weight: 700;
    }

    /* ── Contenido principal ── */
    .page-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 40px;
      gap: 28px;
    }

    /* Título del spot */
    .spot-title-block {
      text-align: center;
    }
    .spot-label {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: ${accentColor};
      margin-bottom: 10px;
      font-weight: 500;
    }
    .spot-name {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 32px;
      color: #1a1208;
      letter-spacing: -0.8px;
      line-height: 1.15;
    }
    .spot-line {
      width: 44px;
      height: 3px;
      background: ${accentColor};
      border-radius: 2px;
      margin: 12px auto 0;
    }

    /* Wrapper de la tarjeta */
    .card-wrapper {
      display: flex;
      justify-content: center;
    }

    /* ── Instrucciones ── */
    .steps {
      display: flex;
      gap: 24px;
      width: 100%;
      max-width: 520px;
    }
    .step {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
    }
    .step-num {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: ${accentColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Syne', sans-serif;
      font-weight: 900;
      font-size: 16px;
      color: white;
      flex-shrink: 0;
    }
    .step-title {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #1a1208;
      line-height: 1.3;
      margin-bottom: 2px;
    }
    .step-text {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      color: #666;
      line-height: 1.5;
    }

    /* Divisor */
    .divider {
      width: 100%;
      max-width: 520px;
      height: 1px;
      background: #e8e2d9;
    }

    /* ── Footer de página ── */
    .page-footer {
      padding: 16px 40px;
      border-top: 1.5px solid #e8e2d9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      background: #faf8f5;
    }
    .footer-url {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      color: #999;
      letter-spacing: 1px;
      font-weight: 500;
    }
    .footer-code {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      color: #aaa;
      letter-spacing: 0.8px;
    }
    .footer-dot {
      width: 24px; height: 3px;
      border-radius: 2px;
      background: ${accentColor};
    }

    /* ── Esquinas deco de la hoja ── */
    .corner-tr {
      position: fixed;
      top: 0; right: 0;
      width: 70px; height: 70px;
      background: rgba(255,85,0,0.04);
      border-bottom-left-radius: 70px;
    }
    .corner-bl {
      position: fixed;
      bottom: 0; left: 0;
      width: 50px; height: 50px;
      background: rgba(255,85,0,0.03);
      border-top-right-radius: 50px;
    }

    @media print {
      .corner-tr, .corner-bl { display: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>

  <!-- Franja superior de color -->
  <div class="top-bar">
    <div class="top-bar-accent"></div>
  </div>

  <!-- Header -->
  <div class="page-header">
    <div>
      <div class="brand-wordmark">burri<span>to</span></div>
      <div class="brand-sub">La guía piurana · Piura, Perú</div>
    </div>
    <div class="header-pill">
      <span class="header-pill-emoji">${emoji}</span>
      <span class="header-pill-text">${entry.spots.category || 'Spot'}</span>
    </div>
  </div>

  <!-- Cuerpo -->
  <div class="page-body">

    <!-- Título del spot -->
    <div class="spot-title-block">
      <div class="spot-label">Código QR oficial</div>
      <div class="spot-name">${entry.spots.name}</div>
      <div class="spot-line"></div>
    </div>

    <!-- Tarjeta centrada -->
    <div class="card-wrapper">
      ${cardHtml}
    </div>

    <!-- Pasos -->
    <div class="divider"></div>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-title">Abre tu cámara</div>
        <div class="step-text">Usa la cámara de tu celular o un lector QR</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-title">Escanea el código</div>
        <div class="step-text">Apunta al QR hasta que se active el enlace</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-title">¡Listo!</div>
        <div class="step-text">Verifica tu visita y accede a beneficios exclusivos</div>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="page-footer">
    <span class="footer-url">nuestroburrito.com</span>
    <div class="footer-dot"></div>
    <span class="footer-code">${entry.code}</span>
  </div>

</body>
</html>`
}

// ─── Modal A4 ─────────────────────────────────────────────────────────────────
interface A4ModalProps {
    entry: QREntry
    variant: Variant
    onClose: () => void
    onPrintA4: () => void
}

const A4Modal = ({ entry, variant, onClose, onPrintA4 }: A4ModalProps) => {
    const emoji = getEmoji(entry.spots.category)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                onClick={e => e.stopPropagation()}
                style={{ background: 'var(--card)', borderRadius: '20px', overflow: 'hidden', width: '100%', maxWidth: '720px', maxHeight: '94vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}
            >
                {/* Toolbar */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--card2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={14} color="var(--orange)" />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--orange)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Vista A4
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', padding: '2px 7px', borderRadius: '100px', background: 'var(--card)', border: '1px solid var(--border)' }}>
                            210 × 297 mm
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={onPrintA4}
                            style={{ padding: '7px 16px', background: '#FF5500', border: 'none', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Printer size={13} /> Imprimir A4
                        </button>
                        <button
                            onClick={onClose}
                            style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Área de preview — simula la impresora */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', background: '#1e1e1e', display: 'flex', justifyContent: 'center' }}>

                    {/* Hoja A4 simulada — 210:297 */}
                    <div style={{
                        width: '100%',
                        maxWidth: '560px',
                        aspectRatio: '210 / 297',
                        background: 'white',
                        borderRadius: '2px',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 80px rgba(0,0,0,0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'relative',
                    }}>
                        {/* Esquinas deco */}
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '70px', height: '70px', background: 'rgba(255,85,0,0.04)', borderBottomLeftRadius: '70px', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50px', height: '50px', background: 'rgba(255,85,0,0.03)', borderTopRightRadius: '50px', pointerEvents: 'none' }} />

                        {/* Franja top */}
                        <div style={{ height: '5px', background: variant === 'premium' ? '#1a1208' : '#FF5500', flexShrink: 0 }}>
                            {variant === 'premium' && <div style={{ height: '5px', width: '40%', background: '#FF5500' }} />}
                        </div>

                        {/* Header de hoja */}
                        <div style={{ padding: '18px 28px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1.5px solid #e8e2d9', flexShrink: 0 }}>
                            <div>
                                <div style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: '32px', letterSpacing: '-1.5px', color: '#1a1208', lineHeight: 1 }}>
                                    burri<span style={{ color: '#FF5500' }}>to</span>
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginTop: '5px', fontWeight: 600 }}>
                                    La guía piurana · Piura, Perú
                                </div>
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '100px', background: 'rgba(255,85,0,0.08)', border: '1.5px solid rgba(255,85,0,0.25)' }}>
                                <span style={{ fontSize: '14px' }}>{emoji}</span>
                                <span style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#FF5500', fontWeight: 700 }}>
                                    {entry.spots.category || 'Spot'}
                                </span>
                            </div>
                        </div>

                        {/* Cuerpo de hoja */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 28px', gap: '14px' }}>
                            {/* Título del spot */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#FF5500', marginBottom: '7px', fontWeight: 600 }}>
                                    Código QR oficial
                                </div>
                                <div style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: '22px', color: '#1a1208', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                                    {entry.spots.name}
                                </div>
                                <div style={{ width: '36px', height: '3px', borderRadius: '2px', background: '#FF5500', margin: '8px auto 0' }} />
                            </div>

                            {/* Tarjeta */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <PrintCard entry={entry} variant={variant} qrSize={150} width={240} />
                            </div>

                            {/* Divisor */}
                            <div style={{ width: '100%', maxWidth: '420px', height: '1px', background: '#e8e2d9' }} />

                            {/* Pasos */}
                            <div style={{ display: 'flex', gap: '14px', width: '100%', maxWidth: '420px' }}>
                                {[
                                    { n: '1', title: 'Abre tu cámara', text: 'Usa la cámara o un lector QR' },
                                    { n: '2', title: 'Escanea', text: 'Apunta al QR hasta activar el enlace' },
                                    { n: '3', title: '¡Listo!', text: 'Verifica y accede a beneficios' },
                                ].map(s => (
                                    <div key={s.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#FF5500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: '#fff', fontFamily: 'sans-serif', flexShrink: 0 }}>
                                            {s.n}
                                        </div>
                                        <span style={{ fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700, color: '#1a1208', lineHeight: 1.3 }}>{s.title}</span>
                                        <span style={{ fontFamily: 'sans-serif', fontSize: '10px', color: '#666', lineHeight: 1.4 }}>{s.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer de hoja */}
                        <div style={{ padding: '10px 28px', borderTop: '1.5px solid #e8e2d9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf8f5', flexShrink: 0 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#999', letterSpacing: '1px', fontWeight: 600 }}>nuestroburrito.com</span>
                            <div style={{ width: '20px', height: '2.5px', borderRadius: '2px', background: '#FF5500' }} />
                            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#aaa', letterSpacing: '0.5px' }}>{entry.code}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── Botón copiar ─────────────────────────────────────────────────────────────
const CopyButton = ({ url }: { url: string }) => {
    const [copied, setCopied] = useState(false)
    return (
        <button
            onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ flex: 1, padding: '8px 6px', borderRadius: '9px', background: copied ? 'rgba(34,197,94,0.06)' : 'var(--card2)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '11px', color: copied ? '#22c55e' : 'var(--muted)', border: copied ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.15s' }}
        >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado' : 'Copiar URL'}
        </button>
    )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function QRPrintCard({ entry, visitsToday, onToggleActive, onRegenerate }: QRPrintCardProps) {
    const [variant, setVariant] = useState<Variant>('clasica')
    const [previewA4, setPreviewA4] = useState(false)
    const printRef = useRef<HTMLDivElement | null>(null)

    // Imprime solo la tarjeta (página en blanco centrada)
    const handlePrint = () => {
        if (!entry || !printRef.current) return
        const win = window.open('', '_blank')
        if (!win) return
        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>QR — ${entry.spots.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@800;900&family=DM+Sans:wght@400;600&family=DM+Mono&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f0eb;padding:40px;font-family:'DM Sans',sans-serif;}@media print{body{background:white;padding:0;}}</style>
</head><body>${printRef.current.outerHTML}</body></html>`)
        win.document.close()
        setTimeout(() => win.print(), 700)
    }

    // Imprime la hoja A4 completa con diseño editorial
    const handlePrintA4 = () => {
        if (!entry || !printRef.current) return
        const win = window.open('', '_blank')
        if (!win) return
        win.document.write(buildA4PrintHtml(printRef.current.outerHTML, entry, variant))
        win.document.close()
        setTimeout(() => win.print(), 900)
    }

    if (!entry) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: 'var(--card2)', border: '2px dashed rgba(255,85,0,0.2)', borderRadius: '20px', padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={24} color="var(--muted)" />
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                    Selecciona un spot<br />para ver su QR
                </p>
            </motion.div>
        )
    }

    const qrUrl = `${APP_URL}/verify?code=${entry.code}`

    return (
        <>
            <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>

                {/* Header del panel */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', width: '8px', height: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF5500', position: 'absolute' }} />
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,85,0,0.35)', position: 'absolute', animation: 'qr-ping 1.6s ease-in-out infinite' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--white)' }}>Vista previa</span>
                    </div>
                    {visitsToday > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(255,85,0,0.08)', border: '1px solid rgba(255,85,0,0.18)' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--orange)' }}>{visitsToday}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--orange)', letterSpacing: '1px', textTransform: 'uppercase' }}>hoy</span>
                        </div>
                    )}
                </div>

                {/* Selector variante */}
                <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    {(['clasica', 'premium'] as Variant[]).map(v => (
                        <button key={v} onClick={() => setVariant(v)} style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: variant === v ? 'none' : '1px solid var(--border)', background: variant === v ? '#FF5500' : 'var(--card2)', color: variant === v ? '#fff' : 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s', fontWeight: variant === v ? 700 : 400 }}>
                            {v === 'clasica' ? 'Clásica' : 'Premium'}
                        </button>
                    ))}
                </div>

                {/* Preview tarjeta */}
                <div style={{ padding: '20px 16px', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.03)' }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={variant} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.15 }}>
                            <PrintCard entry={entry} variant={variant} innerRef={printRef} />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* URL */}
                <div style={{ padding: '0 16px 12px' }}>
                    <div style={{ padding: '10px 14px', background: 'rgba(255,85,0,0.04)', border: '1px solid rgba(255,85,0,0.12)', borderRadius: '10px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>URL del QR</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--orange)', wordBreak: 'break-all', lineHeight: 1.4 }}>{qrUrl}</div>
                    </div>
                </div>

                {/* Botones principales */}
                <div style={{ padding: '0 16px 12px', display: 'flex', gap: '8px' }}>
                    <button onClick={handlePrint}
                        style={{ flex: 1, padding: '12px', background: '#FF5500', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                        <Printer size={16} /> Imprimir
                    </button>
                    <button onClick={() => setPreviewA4(true)}
                        style={{ padding: '12px 14px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--muted)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                        <FileText size={15} /> A4
                    </button>
                </div>

                {/* Acciones secundarias */}
                <div style={{ display: 'flex', gap: '7px', padding: '0 16px 16px' }}>
                    <button onClick={() => onToggleActive(entry)}
                        style={{ flex: 1, padding: '8px 6px', border: entry.active ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border)', borderRadius: '9px', background: entry.active ? 'rgba(34,197,94,0.06)' : 'var(--card2)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '11px', color: entry.active ? '#22c55e' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.15s' }}>
                        {entry.active ? <Eye size={13} /> : <EyeOff size={13} />}
                        {entry.active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button onClick={() => onRegenerate(entry)}
                        style={{ flex: 1, padding: '8px 6px', border: '1px solid var(--border)', borderRadius: '9px', background: 'var(--card2)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--muted)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                        <RefreshCw size={13} /> Regenerar
                    </button>
                    <CopyButton url={qrUrl} />
                </div>

                <style>{`@keyframes qr-ping{0%{transform:scale(1);opacity:.6}70%{transform:scale(2.4);opacity:0}100%{transform:scale(1);opacity:0}}`}</style>
            </motion.div>

            {/* Modal A4 */}
            <AnimatePresence>
                {previewA4 && (
                    <A4Modal entry={entry} variant={variant} onClose={() => setPreviewA4(false)} onPrintA4={handlePrintA4} />
                )}
            </AnimatePresence>
        </>
    )
}