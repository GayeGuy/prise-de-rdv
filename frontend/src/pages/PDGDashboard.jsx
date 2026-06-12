import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PDGAppointmentsTab } from '../components/PDGAppointmentsTab';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function PDGDashboard() {
  const [stats, setStats]               = useState(null);
  const [centres, setCentres]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortBy, setSortBy]             = useState('occupation');
  const [activeTab, setActiveTab]       = useState('stats');
  const isMobile                        = useIsMobile();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsData, centresData] = await Promise.all([
        api.getPDGStats(),
        api.getCentres(),
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
    try { await api.exportPDGData(); }
    catch { alert("Erreur lors de l'export"); }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  const regions = [...new Set(centres.map(c => c.region).filter(Boolean))];

  // ← correction : byCenter (pas byCentre)
  const filteredCentres = selectedRegion === 'all'
    ? stats?.byCenter || []
    : (stats?.byCenter || []).filter(c => {
        const info = centres.find(x => x.id === c.centreId);
        return info?.region === selectedRegion;
      });

  const sortedCentres = [...filteredCentres].sort((a, b) => {
    if (sortBy === 'occupation') {
      const rA = a.total > 0 ? (a.reserved / a.total) * 100 : 0;
      const rB = b.total > 0 ? (b.reserved / b.total) * 100 : 0;
      return rB - rA;
    }
    if (sortBy === 'total')     return b.total - a.total;
    if (sortBy === 'completed') return b.completed - a.completed;
    return 0;
  });

  const getOccupationColor = (rate) => {
    if (rate >= 90) return '#dc2626';
    if (rate >= 70) return '#f59e0b';
    if (rate >= 50) return '#3b82f6';
    return '#10b981';
  };

  const getOccupationStatus = (rate) => {
    if (rate >= 90) return 'Critique';
    if (rate >= 70) return 'Élevé';
    if (rate >= 50) return 'Moyen';
    return 'Faible';
  };

  const totalRate = stats?.totalAppointments > 0
    ? Math.round((stats.reserved / stats.totalAppointments) * 100)
    : 0;

  return (
    <div style={{ padding: isMobile ? '12px' : '20px' }}>

      {/* Onglets */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>
          📊 Statistiques
        </button>
        <button className={activeTab === 'enregistrements' ? 'active' : ''} onClick={() => setActiveTab('enregistrements')}>
          📋 Enregistrements
        </button>
      </div>

      {activeTab === 'enregistrements' && (
        <PDGAppointmentsTab centres={centres} />
      )}

      {activeTab === 'stats' && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
              📊 Tableau de Bord Directeur
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Vue complète de tous les centres
            </p>
          </div>

          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}>
            {[
              {
                label: 'Total Rendez-vous',
                value: stats?.totalAppointments || 0,
                sub: `Réservations en cours : ${stats?.reserved || 0}`,
                bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                shadow: 'rgba(59,130,246,0.2)',
              },
              {
                label: 'Réalisés',
                value: stats?.completed || 0,
                sub: `Taux : ${stats?.totalAppointments > 0 ? Math.round((stats.completed / stats.totalAppointments) * 100) : 0}%`,
                bg: 'linear-gradient(135deg, #10b981, #059669)',
                shadow: 'rgba(16,185,129,0.2)',
              },
              {
                label: 'Absents',
                value: stats?.absent || 0,
                sub: `Taux : ${stats?.totalAppointments > 0 ? Math.round((stats.absent / stats.totalAppointments) * 100) : 0}%`,
                bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
                shadow: 'rgba(239,68,68,0.2)',
              },
              {
                label: "Taux d'Occupation",
                value: `${totalRate}%`,
                sub: `Tous les centres : ${getOccupationStatus(totalRate)}`,
                bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                shadow: 'rgba(139,92,246,0.2)',
              },
            ].map(({ label, value, sub, bg, shadow }) => (
              <div key={label} style={{
                background: bg, padding: isMobile ? '16px' : '24px',
                borderRadius: '12px', color: 'white',
                boxShadow: `0 4px 12px ${shadow}`,
              }}>
                <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '6px', margin: '0 0 6px 0' }}>{label}</p>
                <h3 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '700', margin: '0 0 6px 0' }}>{value}</h3>
                <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Filtrer par région</label>
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="all">Tous les centres</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Trier par</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="occupation">Taux d'occupation (↓)</option>
                <option value="total">Total RDV (↓)</option>
                <option value="completed">Réalisés (↓)</option>
              </select>
            </div>
            <button
              onClick={handleExport}
              style={{
                padding: '8px 16px', background: '#3b82f6', color: 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px',
              }}
            >📥 Exporter les données</button>
          </div>

          {/* Détails par Centre */}
          <div style={{
            background: 'white', borderRadius: '12px',
            border: '1px solid #e2e8f0', overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                Détails par Centre ({sortedCentres.length})
              </h3>
            </div>

            {sortedCentres.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Aucun centre trouvé pour cette région
              </div>
            ) : isMobile ? (
              /* ── MOBILE : cards par centre ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e2e8f0' }}>
                {sortedCentres.map((centre, idx) => {
                  const total          = centre.total || 0;
                  const occupationRate = total > 0 ? Math.round((centre.reserved / total) * 100) : 0;
                  const centreInfo     = centres.find(c => c.id === centre.centreId);
                  const color          = getOccupationColor(occupationRate);
                  return (
                    <div key={idx} style={{ background: 'white', padding: '16px' }}>
                      {/* Nom + type */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <strong style={{ fontSize: '15px', color: '#0f172a' }}>{centre.centreName}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {centreInfo?.type === 'PIMO' ? '🏍️ PIMO' : '🚗 Immatriculation'}
                          </div>
                        </div>
                        {/* Barre d'occupation */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '700', color }}>{occupationRate}%</span>
                          <div style={{ background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', width: '80px', height: '8px' }}>
                            <div style={{ background: color, width: `${occupationRate}%`, height: '100%' }} />
                          </div>
                        </div>
                      </div>
                      {/* Stats en grille 4 colonnes */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {[
                          ['Total',    total,            '#3b82f6'],
                          ['Réservés', centre.reserved,  '#1e40af'],
                          ['Réalisés', centre.completed, '#15803d'],
                          ['Absents',  centre.absent,    '#991b1b'],
                        ].map(([label, val, color]) => (
                          <div key={label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: '6px', padding: '8px 4px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color }}>{val}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── DESKTOP : tableau ── */
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Centre','Total','Réservés','Réalisés','Absents','Annulés','Occupation'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Centre' ? 'left' : 'center', fontWeight: '600', color: '#64748b' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCentres.map((centre, idx) => {
                    const total          = centre.total || 0;
                    const occupationRate = total > 0 ? Math.round((centre.reserved / total) * 100) : 0;
                    const centreInfo     = centres.find(c => c.id === centre.centreId);
                    const color          = getOccupationColor(occupationRate);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <strong style={{ color: '#0f172a' }}>{centre.centreName}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {centreInfo?.type === 'PIMO' ? '🏍️ PIMO' : '🚗 Immatriculation'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <strong style={{ fontSize: '16px', color: '#3b82f6' }}>{total}</strong>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#1e40af' }}>{centre.reserved}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#15803d' }}><strong>{centre.completed}</strong></td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#ef4444' }}>{centre.absent}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#6b7280' }}>{centre.cancelled}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div style={{ background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', width: '80px', height: '20px' }}>
                              <div style={{ background: color, width: `${occupationRate}%`, height: '100%' }} />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', minWidth: '36px' }}>{occupationRate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Alertes capacité */}
          {sortedCentres.some(c => c.total > 0 && (c.reserved / c.total) * 100 >= 80) && (
            <div style={{ marginTop: '24px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#92400e' }}>⚠️ Alertes Capacité</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f' }}>
                {sortedCentres.map((c, idx) => {
                  const rate = c.total > 0 ? (c.reserved / c.total) * 100 : 0;
                  return rate >= 80 ? (
                    <li key={idx} style={{ marginBottom: '6px' }}>
                      <strong>{c.centreName}</strong> — {Math.round(rate)}% de capacité
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}

          {/* Stats supplémentaires */}
          <div style={{
            marginTop: '24px',
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            {[
              ['Centres Actifs',     centres.length,                                                                              '#0f172a'],
              ['Taux de Réussite',   `${stats?.totalAppointments > 0 ? Math.round((stats.completed / stats.totalAppointments) * 100) : 0}%`, '#10b981'],
              ['Moyenne RDV/Centre', centres.length > 0 ? Math.round((stats?.totalAppointments || 0) / centres.length) : 0,     '#3b82f6'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: isMobile ? '14px' : '20px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0' }}>{label}</p>
                <h3 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color, margin: 0 }}>{value}</h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
