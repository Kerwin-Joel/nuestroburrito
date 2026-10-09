import { Outlet } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { TouristBottomTabBar } from '../components/shared/BottomTabBar'
import CreateRouteSheet from '../components/tourist/CreateRouteSheet'
import CustomTabActionModals from '../components/tourist/CustomTabActionModals'
import FlyToBarOverlay from '../components/tourist/FlyToBarOverlay'

export default function TouristLayout() {
  return (
    <div style={{ height: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        <Outlet />
      </main>

      <div className="show-mobile-nav">
        <TouristBottomTabBar />
      </div>

      <CreateRouteSheet />
      <CustomTabActionModals />
      <FlyToBarOverlay />

      <style>{`
        .show-mobile-nav { display: none; }
        @media (max-width: 860px) {
          .show-mobile-nav { display: block; }
        }
      `}</style>
    </div>
  )
}