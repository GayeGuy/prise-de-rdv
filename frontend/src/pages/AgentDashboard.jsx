import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AgentDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [period, setPeriod] = useState('today');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [period]);

  const loadAppointments = async () => {
    try {
      const data = await api.getAgentAppointments(period);
      setAppointments(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, status);
      setMessage({ type: 'success', text: 'Statut mis à jour' });
      loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <div className="tabs">
        {['today', 'upcoming', 'past'].map(p => (
          <button
            key={p}
            className={period === p ? 'active' : ''}
            onClick={() => setPeriod(p)}
          >
            {p === 'today' && "📅 Aujourd'hui"}
            {p === 'upcoming' && "🔮 À venir"}
            {p === 'past' && "📜 Passés"}
          </button>
        ))}
      </div>

      <div className="card">
        <h3>Rendez-vous</h3>
        {appointments.length === 0 ? (
          <p>Aucun rendez-vous</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 'bold', fontSize: '12px' }}>{a.reference}</td>
                  <td>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                  <td>{a.prenom} {a.nom}</td>
                  <td>{a.phone}</td>
                  <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                  <td>
                    {a.status === 'reserved' && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleStatusChange(a.id, 'completed')}
                          style={{ background: '#10b981', padding: '5px 10px', fontSize: '11px' }}
                        >
                          ✅ Réalisé
                        </button>
                        <button
                          onClick={() => handleStatusChange(a.id, 'absent')}
                          style={{ background: '#ef4444', padding: '5px 10px', fontSize: '11px' }}
                        >
                          ❌ Absent
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
