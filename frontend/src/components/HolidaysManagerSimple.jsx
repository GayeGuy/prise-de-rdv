import React, { useState, useEffect } from 'react';

export function HolidaysManagerSimple({ centreId, onUpdate }) {
  const [holidays, setHolidays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:3001/api/holidays?year=${selectedYear}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }

      const data = await response.json();
      setHolidays(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '20px' }}>
          ✅ {success}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontWeight: '600', marginRight: '12px' }}>Année :</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
        >
          {[2024, 2025, 2026, 2027, 2028].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', fontSize: '14px' }}>⏳ Chargement...</div>
      ) : holidays.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: '14px' }}>Aucun jour férié trouvé pour {selectedYear}</div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
            📅 Jours Fériés {selectedYear} ({holidays.length})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Nom</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{h.date}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{h.name}</td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>
                    {h.type === 'mobile' ? '📍 Mobile' : '📌 Fixe'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
