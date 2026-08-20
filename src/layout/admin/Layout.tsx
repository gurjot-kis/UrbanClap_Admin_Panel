import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from '../Navbar';
import { LayoutProvider } from '../LayoutContext';

export default function Layout(): React.ReactElement {
  return (
    <LayoutProvider>
      <div className="d-flex min-vh-100 position-relative" style={{ background: '#f8fafc' }}>
        <Sidebar />
        <div className="d-flex flex-column flex-grow-1 min-w-0">
          <Navbar />
          <main className="flex-grow-1 p-3 p-md-4">
            <Outlet />
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}
