import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail } from 'lucide-react'
import confetti from 'canvas-confetti'

interface WelcomeModalProps {
    isOpen: boolean
    email: string
    name: string
    onClose: () => void
}

export default function WelcomeModal({ isOpen, email, name, onClose }: WelcomeModalProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        if (!isOpen) return

        // Create a dedicated canvas with high z-index for confetti
        const canvas = document.createElement('canvas')
        canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:10001;pointer-events:none;'
        document.body.appendChild(canvas)
        canvasRef.current = canvas

        const myConfetti = confetti.create(canvas, { resize: true, useWorker: true })
        const colors = ['#FF5500', '#FFB800', '#22c55e', '#3b82f6', '#a855f7']
        const end = Date.now() + 2500

        const frame = () => {
            myConfetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors })
            myConfetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors })
            if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()

        return () => {
            canvas.remove()
            canvasRef.current = null
        }
    }, [isOpen])

    const spring = { type: 'spring' as const, stiffness: 340, damping: 30 }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(6px)',
                            zIndex: 1000
                        }}
                    />

                    {/* Modal */}
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1001,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        pointerEvents: 'none'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.88, y: 40, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.92, y: 20, filter: 'blur(4px)' }}
                            transition={spring}
                            style={{
                                width: '100%',
                                maxWidth: '420px',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                background: '#111009',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '24px',
                                padding: '40px 24px 32px',
                                textAlign: 'center' as const,
                                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                                boxSizing: 'border-box' as const,
                                pointerEvents: 'all'
                            }}
                        >
                            {/* Close */}
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute', top: '16px', right: '16px',
                                    background: 'rgba(255,255,255,0.05)', border: 'none',
                                    borderRadius: '8px', padding: '6px', cursor: 'pointer',
                                    color: 'var(--gray)', display: 'flex'
                                }}
                            >
                                <X size={16} />
                            </button>

                            {/* Emoji */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ ...spring, delay: 0.15 }}
                                style={{ fontSize: '64px', marginBottom: '16px', lineHeight: 1 }}
                            >
                                🌮
                            </motion.div>

                            <motion.h2
                                initial={{ y: 12, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ ...spring, delay: 0.2 }}
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '28px', fontWeight: 800,
                                    color: '#ffffff', margin: '0 0 8px 0',
                                    letterSpacing: '-0.5px',
                                }}
                            >
                                ¡Bienvenido/a, {name.split(' ')[0]}!
                            </motion.h2>

                            <motion.p
                                initial={{ y: 12, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ ...spring, delay: 0.25 }}
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    color: '#a3a3a3', fontSize: '15px',
                                    marginBottom: '24px'
                                }}
                            >
                                Tu cuenta en Burrito está casi lista 🎉
                            </motion.p>

                            {/* Email box */}
                            <motion.div
                                initial={{ y: 12, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ ...spring, delay: 0.3 }}
                                style={{
                                    background: 'rgba(255,85,0,0.06)',
                                    border: '1px solid rgba(255,85,0,0.18)',
                                    borderRadius: '14px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: 'rgba(255,85,0,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Mail size={18} color="#FF5500" />
                                </div>
                                <div>
                                    <p style={{
                                        fontFamily: 'var(--font-body)', fontSize: '13px',
                                        color: '#a3a3a3', margin: '0 0 4px 0'
                                    }}>
                                        Te enviamos un correo a
                                    </p>
                                    <p style={{
                                        fontFamily: 'var(--font-mono)', fontSize: '14px',
                                        fontWeight: 700, color: '#FF5500', margin: '0 0 6px 0',
                                        wordBreak: 'break-all'
                                    }}>
                                        {email}
                                    </p>
                                    <p style={{
                                        fontFamily: 'var(--font-body)', fontSize: '13px',
                                        color: '#a3a3a3', margin: 0
                                    }}>
                                        📬 Confírmalo para activar tu cuenta completamente.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.button
                                initial={{ y: 12, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ ...spring, delay: 0.35 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onClose}
                                className="btn btn-primary"
                                style={{
                                    width: '100%', height: '52px',
                                    fontSize: '16px', justifyContent: 'center'
                                }}
                            >
                                ¡Explorar Piura! 🌶️
                            </motion.button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}