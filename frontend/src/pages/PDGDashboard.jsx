import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function PDGDashboard() {
  const [stats, setStats] = useState(null);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortBy, setSortBy] = useState('occupation');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, centresData] = await Promise.all([
        api.getPDGStats(),
        api.getCentres()
      ]);
      setStats(statsData);
      setCentres(centresData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await api.exportPDGData();
    } catch (err) {
      alert('Erreur lors de l\'export');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  const regions = [...new Set(centres.map(c => c.region))];
  
  const filteredCentres = selectedRegion === 'all' 
    ? stats?.byCentre || [] 
    : (stats?.byCentre || []).filter(c => {
        const centre = centres.find(x => x.id === c.centreId);
        return centre?.region === selectedRegion;
      });

  const sortedCentres = [...filteredCentres].sort((a, b) => {
    if (sortBy === 'occupation') {
      const rateA = a.total > 0 ? (a.reserved / a.total) * 100 : 0;
      const rateB = b.total > 0 ? (b.reserved / b.total) * 100 : 0;
      return rateB - rateA;
    } else if (sortBy === 'total') {
      return b.total - a.total;
    } else if (sortBy === 'completed') {
      return b.completed - a.completed;
    }
    return 0;
  });

  const getOccupationColor = (rate) => {
    if (rate >= 90) return '#dc2626'; // Rouge vif
    if (rate >= 70) return '#f59e0b'; // Orange
    if (rate >= 50) return '#3b82f6'; // Bleu
    return '#10b981'; // Vert
  };

  const getOccupationStatus = (rate) => {
    if (rate >= 90) return 'Critique';
    if (rate >= 70) return 'Élevé';
    if (rate >= 50) return 'Moyen';
    return 'Faible';
  };

  const totalRate = stats?.totalAppointments > 0 
    ? Math.round((stats?.reserved / stats?.totalAppointments) * 100)
    : 0;

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
          📊 Tableau de Bord Directeur
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Vue complète de tous les centres de pose de plaques
        </p>
      </div>

      {/* KPI Cards - Principales Métriques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '30px'
      }}>
        {/* Total RDV */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
        }}>
          <p style={{ fontSize: '12px', opacity: '0.9', marginBottom: '8px' }}>Total Rendez-vous</p>
          <h3 style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 8px 0' }}>
            {stats?.totalAppointments || 0}
          </h3>
          <p style={{ fontSize: '12px', opacity: '0.8', margin: '0' }}>
            Réservations en cours : <strong>{stats?.reserved || 0}</strong>
          </p>
        </div>

        {/* Réalisés */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
        }}>
          <p style={{ fontSize: '12px', opacity: '0.9', marginBottom: '8px' }}>Réalisés</p>
          <h3 style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 8px 0' }}>
            {stats?.completed || 0}
          </h3>
          <p style={{ fontSize: '12px', opacity: '0.8', margin: '0' }}>
            Taux : <strong>
              {stats?.totalAppointments > 0 
                ? Math.round((stats?.completed / stats?.totalAppointments) * 100)
                : 0}%
            </strong>
          </p>
        </div>

        {/* Absents */}
        <div style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
        }}>
          <p style={{ fontSize: '12px', opacity: '0.9', marginBottom: '8px' }}>Absents</p>
          <h3 style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 8px 0' }}>
            {stats?.absent || 0}
          </h3>
          <p style={{ fontSize: '12px', opacity: '0.8', margin: '0' }}>
            Taux : <strong>
              {stats?.totalAppointments > 0 
                ? Math.round((stats?.absent / stats?.totalAppointments) * 100)
                : 0}%
            </strong>
          </p>
        </div>

        {/* Occupation Générale */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
        }}>
          <p style={{ fontSize: '12px', opacity: '0.9', marginBottom: '8px' }}>Taux d\'Occupation</p>
          <h3 style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 8px 0' }}>
            {totalRate}%
          </h3>
          <p style={{ fontSize: '12px', opacity: '0.8', margin: '0' }}>
            Tous les centres : <strong>{getOccupationStatus(totalRate)}</strong>
          </p>
        </div>
      </div>

      {/* Filtres et Tri */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Filtrer par région</label>
          <select 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              marginTop: '4px'
            }}
          >
            <option value="all">Tous les centres</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Trier par</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              marginTop: '4px'
            }}
          >
            <option value="occupation">Taux d'occupation (↓)</option>
            <option value="total">Total RDV (↓)</option>
            <option value="completed">Réalisés (↓)</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            marginTop: '20px'
          }}
        >
          📥 Exporter les données
        </button>
      </div>

      {/* Tableau Détaillé par Centre */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
            Détails par Centre ({sortedCentres.length})
          </h3>
        </div>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Centre</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>Total</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>Réservés</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>Réalisés</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>Absents</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>Annulés</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>Occupation</th>
            </tr>
          </thead>
          <tbody>
            {sortedCentres.map((centre, idx) => {
              const total = centre.total || 0;
              const occupationRate = total > 0 ? Math.round((centre.reserved / total) * 100) : 0;
              const centreInfo = centres.find(c => c.id === centre.centreId);
              
              return (
                <tr 
                  key={idx}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                >
                  <td style={{ padding: '16px' }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>{centre.centreName}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        {centreInfo?.type === 'PIMO' ? '🏍️ PIMO' : '🚗 Immatriculation'}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '16px', color: '#3b82f6' }}>{total}</strong>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#3b82f6' }}>
                    {centre.reserved}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#10b981' }}>
                    <strong>{centre.completed}</strong>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#ef4444' }}>
                    {centre.absent}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                    {centre.cancelled}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        width: '100px',
                        height: '24px'
                      }}>
                        <div style={{
                          background: getOccupationColor(occupationRate),
                          width: `${occupationRate}%`,
                          height: '100%',
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0f172a',
                        minWidth: '40px'
                      }}>
                        {occupationRate}%
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedCentres.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Aucun centre trouvé pour cette région
          </div>
        )}
      </div>

      {/* Alertes */}
      {sortedCentres.some(c => {
        const rate = c.total > 0 ? (c.reserved / c.total) * 100 : 0;
        return rate >= 80;
      }) && (
        <div style={{
          marginTop: '30px',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#92400e' }}>⚠️ Alertes Capacité</h4>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#78350f' }}>
            {sortedCentres.map((centre, idx) => {
              const rate = centre.total > 0 ? (centre.reserved / centre.total) * 100 : 0;
              if (rate >= 80) {
                return (
                  <li key={idx} style={{ marginBottom: '8px' }}>
                    <strong>{centre.centreName}</strong> est à {Math.round(rate)}% de capacité
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      )}

      {/* Statistiques Supplémentaires */}
      <div style={{
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>Centres Actifs</p>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0' }}>
            {centres.length}
          </h3>
        </div>

        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>Taux de Réussite</p>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#10b981', margin: '0' }}>
            {stats?.totalAppointments > 0 
              ? Math.round((stats?.completed / stats?.totalAppointments) * 100)
              : 0}%
          </h3>
        </div>

        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>Moyenne RDV/Centre</p>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6', margin: '0' }}>
            {centres.length > 0 
              ? Math.round((stats?.totalAppointments || 0) / centres.length)
              : 0}
          </h3>
        </div>
      </div>
    </div>
  );
}
