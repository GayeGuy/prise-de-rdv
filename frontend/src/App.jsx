import { useState, useEffect } from 'react';
import './styles.css';
import { api } from './api';
import PublicLayout from './layouts/PublicLayout';
import PrivateLayout from './layouts/PrivateLayout';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      try {
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());
        setUser(userData);
      } catch (e) {
        api.clearToken();
      }
    }
    setLoading(false);

    // Listen for path changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    window.history.pushState({}, '', '/secured');
    setCurrentPath('/secured');
  };

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  // Secured path requires login
  if (currentPath === '/secured') {
    if (!user) {
      return (
        <>
          <nav>
            <div className="container">
              <h1>🔐 Accès Sécurisé</h1>
              <div className="nav-right"></div>
            </div>
          </nav>
          <div className="container" style={{ marginTop: '40px' }}>
            <LoginPortal onLoginSuccess={handleLogin} />
          </div>
        </>
      );
    }
    return <PrivateLayout user={user} onLogout={handleLogout} />;
  }

  // Public path
  return <PublicLayout onLogin={handleLogin} navigateTo={navigateTo} />;
}

function LoginPortal({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.login(username, password);
      api.setToken(response.token);
      onLoginSuccess(response.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 200px)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        padding: '48px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>
            🔐 Accès Sécurisé
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Agents, Administrateurs, Directeurs
          </p>
        </div>

        {error && <div className="alert error" style={{ marginBottom: '24px' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Identifiant</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="agent1, admin, pdg..."
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? '⏳ Connexion...' : '🔓 Se connecter'}
          </button>
        </form>

        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#64748b',
        }}>
          <p style={{ marginBottom: '12px', fontWeight: 600 }}>📝 Identifiants de démo :</p>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '11px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>🔑 Admin</strong><br/>
              <code>admin</code> / <code>admin123</code>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>👤 Agent</strong><br/>
              <code>agent1</code> / <code>agent123</code>
            </div>
            <div>
              <strong>📊 Directeur</strong><br/>
              <code>pdg</code> / <code>pdg123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
