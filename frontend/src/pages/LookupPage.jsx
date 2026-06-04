import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { generatePDF } from '../utils/pdf';
import { makeFieldHandler, makeObjectFieldHandler, handleFieldChange } from '../utils/validation';

// Mapping mode de recherche → nom de formateur
const SEARCH_FIELD_MAP = {
  phone:         'phone',
  reference:     null,  // texte libre (format RDV-xxx)
  chrono:        'chrono',
  vin:           'vin',
  immatriculation: 'immatriculation',
};

export default function LookupPage() {
  const [searchMode, setSearchMode] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState(null);
  const [searching, setSearching] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [centres, setCentres] = useState([]);

  const statusLabels = {
    reserved: 'Réservé',
    completed: 'Réalisé',
    absent: 'Absent',
    cancelled: 'Annulé',
  };

  useEffect(() => {
    api.getCentres().then(setCentres).catch(() => {});
  }, []);

  // Réinitialiser la valeur quand le mode change
  const handleModeChange = (e) => {
    setSearchMode(e.target.value);
    setSearchValue('');
    setAppointments([]);
  };

  // Formatage dynamique du champ de recherche selon le mode
  const handleSearchValueChange = (e) => {
    const rawValue = e.target.value;
    const fieldName = SEARCH_FIELD_MAP[searchMode];
    const formatted = fieldName ? handleFieldChange(fieldName, rawValue) : rawValue;
    setSearchValue(formatted);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer une valeur' });
      return;
    }

    setSearching(true);
    try {
      let res = [];
      if (searchMode === 'phone') res = await api.searchByPhone(searchValue);
      else if (searchMode === 'reference') { const a = await api.getAppointment(searchValue); res = a ? [a] : []; }
      else if (searchMode === 'chrono') res = await api.searchByChrono(searchValue);
      else if (searchMode === 'vin') res = await api.searchByVIN(searchValue);
      else if (searchMode === 'immatriculation') res = await api.searchByImmatriculation(searchValue);

      setAppointments(res);
      if (res.length === 0) setMessage({ type: 'error', text: 'Aucun rendez-vous trouvé' });
      else setMessage({ type: 'success', text: `${res.length} rendez-vous trouvé(s)` });
    } catch (err) {
      setAppointments([]);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSearching(false);
    }
  };

  const handleCancel = async (reference) => {
    if (!window.confirm('Êtes-vous sûr ?')) return;
    try {
      await api.cancelAppointment(reference);
      setMessage({ type: 'success', text: 'Annulé avec succès' });
      setSearchValue('');
      setAppointments([]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (appointment) => {
    setEditingId(appointment.id);
    setEditForm({
      nom: appointment.nom,
      prenom: appointment.prenom,
      phone: appointment.phone,
      email: appointment.email,
      date: appointment.date,
    });
  };

  // Handler formaté pour le formulaire d'édition en ligne
  const handleEditFieldChange = makeObjectFieldHandler(setEditForm);

  const handleSaveEdit = async (id) => {
    try {
      await api.updateAppointment(id, editForm);
      setMessage({ type: 'success', text: 'Rendez-vous modifié avec succès' });
      setEditingId(null);
      setSearchValue('');
      setAppointments([]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleReprint = (appointment) => {
    const centre = centres.find(c => c.id === appointment.centreId);
    if (centre) generatePDF(appointment, centre);
  };

  const inputStyle = {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    fontFamily: 'inherit',
  };

  return (
    <div className="card">
      <h3>🔍 Consulter vos rendez-vous</h3>

      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSearch}>
        <div className="grid">
          <div className="form-group">
            <label>Rechercher par</label>
            <select value={searchMode} onChange={handleModeChange}>
              <option value="phone">Téléphone</option>
              <option value="reference">Référence (RDV-...)</option>
              <option value="chrono">Numéro Chrono</option>
              <option value="vin">VIN</option>
              <option value="immatriculation">Immatriculation</option>
            </select>
          </div>
          <div className="form-group">
            <label>Valeur</label>
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchValueChange}
              placeholder={
                searchMode === 'phone' ? '0601020304' :
                searchMode === 'reference' ? 'RDV-...' :
                searchMode === 'chrono' ? 'Numéro Chrono' :
                searchMode === 'vin' ? 'VIN' :
                'Immatriculation'
              }
              maxLength={
                searchMode === 'phone' ? 10 :
                searchMode === 'vin' ? 17 : undefined
              }
            />
          </div>
        </div>
        <button type="submit" disabled={searching}>
          {searching ? '⏳ Recherche...' : '🔍 Rechercher'}
        </button>
      </form>

      {appointments.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4>Résultats</h4>
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Nom</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 'bold', fontSize: '12px' }}>{a.reference}</td>
                  <td>
                    {editingId === a.id ? (
                      <input
                        type="date"
                        name="date"
                        value={editForm.date}
                        onChange={handleEditFieldChange}
                        style={{ ...inputStyle, width: '150px' }}
                      />
                    ) : (
                      new Date(a.date).toLocaleDateString('fr-FR')
                    )}
                  </td>
                  <td>
                    {editingId === a.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          name="prenom"
                          value={editForm.prenom}
                          onChange={handleEditFieldChange}
                          placeholder="Prénom"
                          style={{ ...inputStyle, width: '90px' }}
                        />
                        <input
                          type="text"
                          name="nom"
                          value={editForm.nom}
                          onChange={handleEditFieldChange}
                          placeholder="Nom"
                          style={{ ...inputStyle, width: '90px' }}
                        />
                      </div>
                    ) : (
                      `${a.prenom} ${a.nom}`
                    )}
                  </td>
                  <td><span className={`badge ${a.status}`}>{statusLabels[a.status]}</span></td>
                  <td>
                    {editingId === a.id ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleSaveEdit(a.id)}
                          style={{ background: '#10b981', padding: '6px 12px', fontSize: '12px' }}
                        >
                          ✅ Enregistrer
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{ background: '#ef4444', padding: '6px 12px', fontSize: '12px' }}
                        >
                          ❌ Annuler
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {a.status === 'reserved' && (
                          <>
                            <button
                              onClick={() => handleEdit(a)}
                              style={{ background: '#3b82f6', padding: '6px 12px', fontSize: '12px' }}
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => handleCancel(a.reference)}
                              style={{ background: '#ef4444', padding: '6px 12px', fontSize: '12px' }}
                            >
                              Annuler
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleReprint(a)}
                          style={{ background: '#8b5cf6', padding: '6px 12px', fontSize: '12px' }}
                        >
                          🖨️ Réimprimer
                        </button>
                      </div>
                    )}
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
