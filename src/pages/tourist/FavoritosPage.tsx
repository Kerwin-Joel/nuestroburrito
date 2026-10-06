import { useEffect, useMemo } from 'react'
import { Heart } from 'lucide-react'
import SpotCard from '../../components/tourist/SpotCard'
import SpotBottomSheet from '../../components/tourist/SpotBottomSheet'
import { useSpots } from '../../hooks/useSpots'
import { useFavoritesStore } from '../../stores/useFavoritesStore'
import { PageHeader, EmptyBlock } from '../../components/tourist/ExtrasHeader'

/** Espejo de FavoritesScreen (PassportFavorites.kt): los spots guardados con el corazón. */
export default function FavoritosPage() {
  const { spots, selectSpot, load } = useSpots()
  const ids = useFavoritesStore(s => s.ids)
  const saved = useMemo(() => spots.filter(s => ids.has(s.id)), [spots, ids])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '110px' }}>
      <PageHeader icon={<Heart size={16} color="var(--orange)" />} eyebrow="Tus favoritos" title={<>Tus<br /><span style={{ color: 'var(--orange)' }}>favoritos</span></>} subtitle="Los spots que guardaste para no perderles la pista." />

      <div className="page-container">
        {saved.length === 0 ? (
          <EmptyBlock emoji="🤍" title="Aún no guardas spots" subtitle='Toca el corazón en cualquier spot y lo tendrás a mano aquí.' />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {saved.map(spot => <SpotCard key={spot.id} spot={spot} onClick={() => selectSpot(spot)} />)}
          </div>
        )}
      </div>
      <SpotBottomSheet />
    </div>
  )
}
