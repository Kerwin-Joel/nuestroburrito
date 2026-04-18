import { Star } from 'lucide-react'
import Sidebar from '../../components/churre/Sidebar'
import Topbar from '../../components/churre/Topbar'
import RatingChart from '../../components/churre/RatingChart'
import ReviewCard from '../../components/churre/ReviewCard'
import { MOCK_REVIEWS } from '../../lib/mockData'

export default function ResenasPage() {
  const avgRating = 4.9
  const total = 32

  return (
    <div style={{ flex: 1 }}>
        <Topbar title="Reseñas" />

        <div style={{ padding: '28px 32px' }}>
          {/* Rating header */}
          <div className="card" style={{ padding: '28px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '72px',
                fontWeight: 800,
                color: 'var(--yellow)',
                letterSpacing: '-4px',
                lineHeight: 1,
              }}>
                {avgRating}
              </p>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '8px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="var(--yellow)" color="var(--yellow)" />
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', marginTop: '6px' }}>
                ({total} reseñas)
              </p>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <RatingChart />
            </div>
          </div>

          {/* Reviews list */}
          <p className="section-label" style={{ marginBottom: '16px' }}>RESEÑAS DE TURISTAS</p>
          {MOCK_REVIEWS.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
    </div>
  )
}
