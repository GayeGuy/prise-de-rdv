import React, { useState, useEffect } from 'react';
import { api } from '../api';

export function HolidaysManager({ centreId, includeHolidays, onUpdate }) {
  const [holidays, setHolidays] = useState([]);
  const [exceptions, setExceptions] = useState({ exceptionallyOpen: [], exceptionallyClosed: [] });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAlert, setShowAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHolidays();
    if (centreId) {
      loadExceptions();
    }
  }, [selectedYear, centreId]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const data = await api.getHolidays(selectedYear);
      setHolidays(data);
    } catch (err) {
      setShowAlert({ type: 'error', text: 'Erreur chargement jours fériés' });
    } finally {
      setLoading(false);
    }
  };

  const loadExceptions = async () => {
    try {
      const data = await api.getCentreExceptions(centreId);
      setExceptions(data || { exceptionallyOpen: [], exceptionallyClosed: [] });
    } catch (err) {
      console.error('Error loading exceptions:', err);
    }
  };

  const makeExceptionallyOpen = async (date) => {
    try {
      const reason = prompt(`Raison de l'ouverture exceptionnelle pour ${date} :`);
      if (!reason) return;

      await api.addExceptionallyOpen(centreId, date, reason);
      setShowAlert({ type: 'success', text: `Jour ouvert exceptionnellement : ${date}` });
      loadExceptions();
      if (onUpdate) onUpdate();
    } catch (err) {
      setShowAlert({ type: 'error', text: err.message || 'Erreur lors de l\'ajout' });
    }
  };

  const makeExceptionallyClosed = async (date) => {
    try {
      const reason = prompt(`Raison de la fermeture exceptionnelle pour ${date} :`);
      if (!reason) return;

      await api.addExceptionallyClosed(centreId, date, reason);
      setShowAlert({ type: 'success', text: `Jour fermé exceptionnellement : ${date}` });
      loadExceptions();
      if (onUpdate) onUpdate();
    } catch (err) {
      setShowAlert({ type: 'error', text: err.message || 'Erreur lors de l\'ajout' });
    }
  };

  const removeException = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;

    try {
      await api.deleteExceptionalDay(id);
      loadExceptions();
      setShowAlert({ type: 'success', text: 'Exception supprimée' });
      if (onUpdate) onUpdate();
    } catch (err) {
      setShowAlert({ type: 'error', text: err.message || 'Erreur suppression' });
    }
  };

  return (
    <div style={{ marginTop: '24px' }}>
      {showAlert && (
        <Alert type={showAlert.type} onClose={() => setShowAlert(null)}>
          {showAlert.text}
        </Alert>
      )}

      {/* Sélection année */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ marginRight: '12px', fontWeight: '500' }}>
          Année :
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '14px'
          }}
        >
          {[2024, 2025, 2026, 2027, 2028].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Condition includeHolidays */}
      {!includeHolidays && (
        <Alert type="info">
          ℹ️ Les jours fériés ne sont pas appliqués pour ce centre
          (includeHolidays = false)
        </Alert>
      )}

      {/* Jours Fériés */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
          📅 Jours Fériés {selectedYear}
        </h3>

        {loading ? (
          <div style={{ color: '#64748b' }}>Chargement...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {holidays.map(h => {
              const isOpen = exceptions.exceptionallyOpen?.some(e => e.date === h.date);
              const isClosed = exceptions.exceptionallyClosed?.some(e => e.date === h.date);

              return (
                <div
                  key={h.date}
                  style={{
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: isOpen ? '#ecfdf5' : isClosed ? '#fef2f2' : '#f8fafc'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    {h.date}
                  </div>
                  <div style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>
                    {h.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    {h.type === 'mobile' ? '📍 Mobile' : '📌 Fixe'}
                  </div>

                  {!isOpen && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => makeExceptionallyOpen(h.date)}
                      style={{ width: '100%' }}
                    >
                      🔓 Ouvrir exceptionnellement
                    </Button>
                  )}

                  {isOpen && (
                    <div style={{
                      background: '#d1fae5',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#065f46'
                    }}>
                      ✅ Ouvert exceptionnellement
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exceptions Personnalisées */}
      {centreId && (
        <div>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
            ⚙️ Exceptions Personnalisées
          </h3>

          {exceptions.exceptionallyOpen.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#10b981' }}>
                ✅ Jours Ouverts Exceptionnellement
              </h4>
              {exceptions.exceptionallyOpen.map(e => (
                <div
                  key={e.id}
                  style={{
                    padding: '12px',
                    background: '#ecfdf5',
                    border: '1px solid #d1fae5',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{e.date}</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>{e.reason}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => removeException(e.id, 'open')}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}

          {exceptions.exceptionallyClosed.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#ef4444' }}>
                ❌ Jours Fermés Exceptionnellement
              </h4>
              {exceptions.exceptionallyClosed.map(e => (
                <div
                  key={e.id}
                  style={{
                    padding: '12px',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{e.date}</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>{e.reason}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => removeException(e.id, 'closed')}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}

          {exceptions.exceptionallyOpen.length === 0 && exceptions.exceptionallyClosed.length === 0 && (
            <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              Aucune exception personnalisée
            </div>
          )}
        </div>
      )}
    </div>
  );
}
