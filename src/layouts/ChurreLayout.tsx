import { Outlet } from 'react-router-dom'
import ChurreSidebar from '../components/churre/Sidebar'

export default function ChurreLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <ChurreSidebar />
      <div style={{ flex: 1, marginLeft: '240px' }} className="churre-content">
        <Outlet />
      </div>

      <style>{`
        @media (max-width: 860px) {
          .churre-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
