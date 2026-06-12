import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { PhotosModal } from './PhotosModal';

const STATUS_LABELS = {
  reserved:  'Réservé',
  completed: 'Réalisé',
  absent:    'Absent',
  cancelled: 'Annulé',
};

const STATUS_COLORS = {
  reserved:  { bg: '#dbeafe', color: '#1e40af' },
  completed: { bg: '#dcfce7', color: '#15803d' },
  absent:    { bg: '#fee2e2', color: '#991b1b' },
  cancelled: { bg: '#f3f4f6', color: '#374151' },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export function PDGAppointmentsTab({ centres }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [photosModal, setPhotosModal]   = useState(null);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCentre, setFilterCentre] = useState('all');
  const isMobile                        = useIsMobile();

  useEffect(() => {
    api.getAllAppointmentsPDG()
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        a.reference?.toLowerCase().includes(q) ||
        a.nom?.toLowerCase().includes(q) ||
        a.prenom?.toLowerCase().includes(q) ||
        a.phone?.includes(q) ||
        a.immatriculation?.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || a.status === filterStatus;
      const matchCentre = filterCentre === 'all' || a.centreId === filterCentre;
      return matchSearch && matchStatus && matchCentre;
    });
  }, [appointments, search, filterStatus, filterCentre]);

  const counts = useMemo(() => ({
    total:     appointments.length,
    reserved:  appointments.filter(a => a.status === 'reserved').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    absent:    appointments.filter(a => a.status === 'absent').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }), [appointments]);

  return (
    <div className="card">
      {photosModal && (
        <PhotosModal
          appointmentId={photosModal.id}
          reference={photosModal.reference}
          onClose={() => setPhotosModal(null)}
        />
      )}

      <h3>📋 Tous les enregistrements</h3>

      {/* Compteurs cliquables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        margin: '16px 0',
      }}>
        {[
          ['Total',    counts.total,     '#3b82f6', 'all'],
          ['Réservés', counts.reserved,  '#1e40af', 'reserved'],
          ['Réalisés', counts.completed, '#15803d', 'completed'],
          ['Absents',  counts.absent,    '#991b1b', 'absent'],
          ['Annulés',  counts.cancelled, '#374151', 'cancelled'],
        ].map(([label, val, color, key]) => (
          <div
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            style={{
              textAlign: 'center',
              padding: isMobile ? '8px 4px' : '10px 6px',
              border: `2px solid ${filterStatus === key ? color : '#e2e8f0'}`,
              borderRadius: '8px', cursor: 'pointer',
              background: filterStatus === key ? `${color}15` : 'white',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color }}>{val}</div>
            <div style={{ fontSize: isMobile ? '9px' : '11px', color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher référence, nom, téléphone, immat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '0', padding: '8px 12px',
            borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px',
          }}
        />
        <select
          value={filterCentre}
          onChange={e => setFilterCentre(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '13px',
            maxWidth: isMobile ? '100%' : '200px', width: isMobile ? '100%' : 'auto',
          }}
        >
          <option value="all">Tous les centres</option>
          {centres?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={{ fontSize: '13px', color: '#64748b', alignSelf: 'center', whiteSpace: 'nowrap' }}>
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="loading">Chargement...</div>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>Aucun enregistrement</p>
      ) : isMobile ? (
        /* ── MOBILE : cards ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(a => {
            const sc = STATUS_COLORS[a.status] || STATUS_COLORS.cancelled;
            return (
              <div key={a.id} style={{
                border: '1px solid #e2e8f0', borderRadius: '10px',
                padding: '14px', background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                {/* Référence + statut */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569', letterSpacing: '0.3px' }}>
                    {a.reference}
                  </span>
                  <span style={{
                    background: sc.bg, color: sc.color,
                    padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: '600',
                  }}>
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </div>

                {/* Nom + date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px', color: '#0f172a' }}>
                    {a.prenom} {a.nom}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(a.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {/* Téléphone + immat */}
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
                  📞 {a.phone}
                  {a.immatriculation && (
                    <span style={{ marginLeft: '10px' }}>🚗 {a.immatriculation}</span>
                  )}
                </div>

                {/* Bouton photos */}
                <button
                  onClick={() => setPhotosModal({ id: a.id, reference: a.reference })}
                  style={{
                    background: a.hasPhotos ? '#8b5cf6' : '#f1f5f9',
                    color: a.hasPhotos ? 'white' : '#94a3b8',
                    border: 'none', padding: '7px 14px', borderRadius: '7px',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  {a.hasPhotos ? '📷 Voir photos' : '📷 Aucune photo'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── DESKTOP : tableau ── */
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Immatriculation</th>
                <th>Statut</th>
                <th>Photos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const sc = STATUS_COLORS[a.status] || STATUS_COLORS.cancelled;
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '600', fontSize: '11px', whiteSpace: 'nowrap' }}>{a.reference}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                    <td>{a.prenom} {a.nom}</td>
                    <td>{a.phone}</td>
                    <td>{a.immatriculation || '—'}</td>
                    <td>
                      <span style={{
                        background: sc.bg, color: sc.color,
                        padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: '600',
                      }}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setPhotosModal({ id: a.id, reference: a.reference })}
                        style={{
                          background: a.hasPhotos ? '#8b5cf6' : '#f1f5f9',
                          color: a.hasPhotos ? 'white' : '#94a3b8',
                          border: 'none', padding: '5px 10px', borderRadius: '6px',
                          fontSize: '11px', cursor: 'pointer',
                        }}
                      >
                        {a.hasPhotos ? '📷 Voir' : '—'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
