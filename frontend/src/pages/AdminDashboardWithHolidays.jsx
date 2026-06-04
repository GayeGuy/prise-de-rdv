import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { HolidaysManager } from '../components/HolidaysManager';

const DAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// ===== À INTÉGRER DANS AdminDashboard EXISTANT =====

export function HolidaysTab({ centres, loading, error }) {
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [message, setMessage] = useState(null);

  const handleCentreSelect = (centreId) => {
    const centre = centres.find(c => c.id === centreId);
    setSelectedCentre(centre);
  };

  return (
    <div style={{ padding: '24px' }}>
      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '24px',
          borderRadius: '8px',
          background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: message.type === 'success' ? '#065f46' : '#7f1d1d',
          border: `1px solid ${message.type === 'success' ? '#d1fae5' : '#fee2e2'}`
        }}>
          {message.text}
        </div>
      )}

      <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
        🗓️ Gestion des Jours Fériés
      </h2>

      {!selectedCentre ? (
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
            Sélectionner un centre :
          </label>
          <select
            onChange={(e) => handleCentreSelect(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              marginBottom: '24px'
            }}
          >
            <option value="">-- Choisir un centre --</option>
            {centres?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <div style={{
            padding: '16px',
            background: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
              {selectedCentre.name}
            </h3>
            <p style={{ color: '#475569', marginBottom: '12px' }}>
              <strong>Type :</strong> {selectedCentre.type}
            </p>
            <p style={{ color: '#475569', marginBottom: '12px' }}>
              <strong>Jours ouvrables :</strong> {selectedCentre.workDays.map(d => DAYS_FULL[DAYS_FR.indexOf(d)]).join(', ')}
            </p>
            <button
              onClick={() => setSelectedCentre(null)}
              style={{
                padding: '8px 16px',
                background: '#e5e7eb',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Changer de centre
            </button>
          </div>

          <HolidaysManager
            centreId={selectedCentre.id}
            includeHolidays={selectedCentre.includeHolidays ?? true}
            onUpdate={() => {
              setMessage({ type: 'success', text: 'Mise à jour réussie !' });
              setTimeout(() => setMessage(null), 3000);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ===== INSTRUCTIONS D'INTÉGRATION =====
/*

DANS AdminDashboard.jsx :

1. Importer le composant :
   import { HolidaysTab } from './AdminDashboardWithHolidays';
   
2. Ajouter un bouton onglet :
   <button onClick={() => setTab('holidays')}>🗓️ Jours Fériés</button>
   
3. Ajouter le rendu :
   {tab === 'holidays' && (
     <HolidaysTab centres={centres} loading={centresLoading} error={centresError} />
   )}

OU copier simplement le contenu du HolidaysTab dans AdminDashboard.

*/
