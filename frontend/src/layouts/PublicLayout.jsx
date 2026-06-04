import { useState } from 'react';
import BookingPage from '../pages/BookingPageValidated';
import LookupPage from '../pages/LookupPage';

export default function PublicLayout({ onLogin, navigateTo }) {
  const [page, setPage] = useState('booking');

  return (
    <>
      <nav>
        <div className="container">
          <h1>🗓️ Plaques d'immatriculation</h1>
          <div className="nav-right">
            <button 
              onClick={() => setPage('booking')}
              style={{ background: page === 'booking' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)' }}
            >
              📝 Réserver
            </button>
            <button 
              onClick={() => setPage('lookup')}
              style={{ background: page === 'lookup' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)' }}
            >
              🔍 Consulter
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {page === 'booking' && <BookingPage />}
        {page === 'lookup' && <LookupPage />}
      </div>
    </>
  );
}
