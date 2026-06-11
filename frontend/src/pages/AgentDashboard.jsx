import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { PhotosModal } from '../components/PhotosModal';

const STATUS_LABELS = {
  reserved:  'Réservé',
  completed: 'Réalisé',
  absent:    'Absent',
  cancelled: 'Annulé',
};

export default function AgentDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [period, setPeriod] = useState('today');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [photosModal, setPhotosModal] = useState(null); // { id, reference }

  useEffect(() => {
    setSearch('');   // reset recherche à chaque changement d'onglet
    loadAppointments();
  }, [period]);

  const loadAppointments = async () => {
    setLoading(true);
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
      setTimeout(() => setMessage(null), 3000);
      loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Filtrage local selon le terme de recherche
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(a =>
      a.reference?.toLowerCase().includes(q) ||
      a.nom?.toLowerCase().includes(q) ||
      a.prenom?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      a.chrono?.toLowerCase().includes(q) ||
      a.immatriculation?.toLowerCase().includes(q) ||
      a.vin?.toLowerCase().includes(q)
    );
  }, [appointments, search]);

  return (
    <div>
      {photosModal && (
        <PhotosModal
          appointmentId={photosModal.id}
          reference={photosModal.reference}
          onClose={() => setPhotosModal(null)}
        />
      )}
      {message && (
        <div className={`alert ${message.type}`} style={{ marginBottom: '12px' }}>
          {message.text}
        </div>
      )}

      {/* Onglets */}
      <div className="tabs">
        {[
          { key: 'today',    label: "📅 Aujourd'hui" },
          { key: 'upcoming', label: '🔮 À venir' },
          { key: 'past',     label: '📜 Passés' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={period === key ? 'active' : ''}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        {/* Barre de recherche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: '#94a3b8', fontSize: '15px', pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, référence, téléphone, immatriculation..."
              style={{
                width: '100%', padding: '9px 12px 9px 34px',
                border: '1px solid #e2e8f0', borderRadius: '8px',
                fontSize: '14px', boxSizing: 'border-box',
              }}
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                flexShrink: 0, boxShadow: 'none',
              }}
            >
              ✕ Effacer
            </button>
          )}
        </div>

        {/* Compteur */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0 }}>Rendez-vous</h3>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {search
              ? `${filtered.length} résultat${filtered.length > 1 ? 's' : ''} sur ${appointments.length}`
              : `${appointments.length} rendez-vous`}
          </span>
        </div>

        {loading ? (
          <div className="loading">Chargement...</div>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '14px', padding: '20px 0' }}>
            {search ? `Aucun résultat pour "${search}"` : 'Aucun rendez-vous'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap' }}>{a.reference}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                    <td>{a.prenom} {a.nom}</td>
                    <td>{a.phone}</td>
                    <td>
                      <span className={`badge ${a.status}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setPhotosModal({ id: a.id, reference: a.reference })}
                          style={{ background: '#8b5cf6', padding: '5px 10px', fontSize: '11px' }}
                        >
                          📷 Photos
                        </button>
                        {a.status === 'reserved' && (
                          <>
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
