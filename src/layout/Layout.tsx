import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { LayoutProvider } from './LayoutContext'

export default function Layout() {
  return (
    <LayoutProvider>
      <div className="d-flex min-vh-100" style={{ background: '#eef1f6' }}>
        <Sidebar />
        <div className="d-flex flex-column flex-grow-1 min-w-0">
          <Navbar />
          <Outlet />
        </div>
      </div>
    </LayoutProvider>
  )
}
