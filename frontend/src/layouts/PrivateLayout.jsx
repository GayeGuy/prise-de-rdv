import { useState } from 'react';
import AgentDashboard from '../pages/AgentDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import PDGDashboard from '../pages/PDGDashboard';

const icons = {
  agent: '👤 Agent',
  admin: '⚙️ Admin',
  pdg: '📊 Directeur',
};

export default function PrivateLayout({ user, onLogout }) {
  const [page, setPage] = useState(user.role === 'agent' ? 'dashboard' : 'dashboard');

  const renderPage = () => {
    if (user.role === 'agent') return <AgentDashboard />;
    if (user.role === 'admin') return <AdminDashboard />;
    if (user.role === 'pdg') return <PDGDashboard />;
    return null;
  };

  return (
    <>
      <nav>
        <div className="container">
          <h1>🗓️ Gestion - Plaques</h1>
          <div className="nav-right">
            <div className="user-info">
              {icons[user.role]} · {user.name || user.username}
            </div>
            <button onClick={onLogout} style={{ background: 'rgba(239, 68, 68, 0.4)' }}>
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {renderPage()}
      </div>
    </>
  );
}
