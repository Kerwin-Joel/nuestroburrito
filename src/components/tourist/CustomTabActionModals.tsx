import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../stores/useUIStore'
import ItineraryWizardModal from './ItineraryWizardModal'
import QRScannerModal from '../../pages/verify/QRScannerModal'
import EmergenciasModal from './EmergenciasModal'

/**
 * Monta las 3 acciones del botón flotante configurable (armar día con IA,
 * escanear QR, emergencias — ver lib/customTabs.ts) a nivel de TouristLayout,
 * para que funcionen desde cualquier pantalla sin navegar a ningún lado,
 * igual que en CustomTab.kt (route = null).
 */
export default function CustomTabActionModals() {
  const { modalOpen, closeModal } = useUIStore()
  const navigate = useNavigate()

  return (
    <>
      <ItineraryWizardModal isOpen={modalOpen === 'wizard'} onClose={closeModal} />
      <QRScannerModal
        isOpen={modalOpen === 'qr-scan'}
        onClose={closeModal}
        onScan={code => {
          closeModal()
          // Mismo flujo que un link de QR compartido: VerifyPage ya sabe
          // resolver el código contra el itinerario activo.
          navigate(`/app/verify?code=${encodeURIComponent(code)}`)
        }}
      />
      <EmergenciasModal isOpen={modalOpen === 'emergencias'} onClose={closeModal} />
    </>
  )
}
