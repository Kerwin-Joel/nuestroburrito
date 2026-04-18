import { Outlet } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { TouristBottomTabBar } from '../components/shared/BottomTabBar'

export default function TouristLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, paddingBottom: '100px' }}>
        <Outlet />
      </main>
      
      {/* Mobile bottom nav */}
      <div className="show-mobile-nav">
        <TouristBottomTabBar />
      </div>

      <style>{`
        .show-mobile-nav { display: none; }
        @media (max-width: 860px) {
          .show-mobile-nav { display: block; }
        }
      `}</style>
    </div>
  )
}
