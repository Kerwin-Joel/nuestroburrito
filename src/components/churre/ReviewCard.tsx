import { Star } from 'lucide-react'
import type { Review } from '../../types/churre'
import { formatShortDate } from '../../lib/formatters'

interface Props { review: Review }

export default function ReviewCard({ review }: Props) {
  return (
    <div className="card" style={{
      padding: '20px',
      borderLeft: '3px solid var(--orange)',
      marginBottom: '12px',
    }}>
      {/* Stars */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '12px' }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < review.rating ? 'var(--yellow)' : 'transparent'} color="var(--yellow)" />
        ))}
      </div>

      {/* Comment */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '15px',
        color: 'var(--white)',
        lineHeight: 1.65,
        fontStyle: 'italic',
        marginBottom: '16px',
      }}>
        "{review.comment}"
      </p>

      {/* Tourist info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--dim) 0%, var(--gray) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--white)',
        }}>
          {review.touristAvatar}
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', color: 'var(--white)' }}>
            {review.touristName}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
            {review.tourType} · {formatShortDate(review.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
