import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { generatePDF } from '../utils/pdf';
import { makeObjectFieldHandler, handleFieldChange } from '../utils/validation';

const SEARCH_FIELD_MAP = {
  phone: 'phone',
  reference: null,
  chrono: 'chrono',
  vin: 'vin',
  immatriculation: 'immatriculation',
};

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

export default function LookupPage() {
  const [searchMode, setSearchMode]     = useState('phone');
  const [searchValue, setSearchValue]   = useState('');
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage]           = useState(null);
  const [searching, setSearching]       = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [centres, setCentres]           = useState([]);

  useEffect(() => { api.getCentres().then(setCentres).catch(() => {}); }, []);

  const handleModeChange = (e) => {
    setSearchMode(e.target.value);
    setSearchValue('');
    setAppointments([]);
    setMessage(null);
  };

  const handleSearchValueChange = (e) => {
    const raw = e.target.value;
    const field = SEARCH_FIELD_MAP[searchMode];
    setSearchValue(field ? handleFieldChange(field, raw) : raw);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) { setMessage({ type: 'error', text: 'Veuillez entrer une valeur' }); return; }
    setSearching(true);
    setMessage(null);
    try {
      let res = [];
      if (searchMode === 'phone')           res = await api.searchByPhone(searchValue);
      else if (searchMode === 'reference')  { const a = await api.getAppointment(searchValue); res = a ? [a] : []; }
      else if (searchMode === 'chrono')     res = await api.searchByChrono(searchValue);
      else if (searchMode === 'vin')        res = await api.searchByVIN(searchValue);
      else if (searchMode === 'immatriculation') res = await api.searchByImmatriculation(searchValue);
      setAppointments(res);
      setMessage(res.length === 0
        ? { type: 'error', text: 'Aucun rendez-vous trouvé' }
        : { type: 'success', text: `${res.length} rendez-vous trouvé(s)` });
    } catch (err) {
      setAppointments([]);
      setMessage({ type: 'error', text: err.message });
    } finally { setSearching(false); }
  };

  const handleCancel = async (reference) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;
    try {
      await api.cancelAppointment(reference);
      setMessage({ type: 'success', text: 'Rendez-vous annulé' });
      setAppointments([]);
      setSearchValue('');
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  };

  const handleEdit = (a) => {
    setEditingId(a.id);
    setEditForm({ nom: a.nom, prenom: a.prenom, phone: a.phone, email: a.email, date: a.date });
  };

  const handleEditFieldChange = makeObjectFieldHandler(setEditForm);

  const handleSaveEdit = async (id) => {
    try {
      await api.updateAppointment(id, editForm);
      setMessage({ type: 'success', text: 'Rendez-vous modifié' });
      setEditingId(null);
      setAppointments([]);
      setSearchValue('');
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  };

  const handleReprint = (a) => {
    const centre = centres.find(c => c.id === a.centreId);
    if (centre) generatePDF(a, centre);
  };

  // ── Carte RDV (vue mobile) ─────────────────────────────────────────────────
  const AppointmentCard = ({ a }) => {
    const isEditing = editingId === a.id;
    const sc = STATUS_COLORS[a.status] || STATUS_COLORS.cancelled;

    return (
      <div style={{
        border: '1px solid #e2e8f0', borderRadius: '10px',
        padding: '14px', marginBottom: '10px', background: 'white',
      }}>
        {/* Ligne 1 : référence + statut */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontWeight: '700', fontSize: '12px', color: '#1e40af', letterSpacing: '0.3px' }}>
            {a.reference}
          </span>
          <span style={{
            background: sc.bg, color: sc.color,
            padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
          }}>
            {STATUS_LABELS[a.status] || a.status}
          </span>
        </div>

        {isEditing ? (
          // ── Mode édition ──────────────────────────────────────────────────
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                name="prenom" value={editForm.prenom} onChange={handleEditFieldChange}
                placeholder="Prénom"
                style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
              />
              <input
                name="nom" value={editForm.nom} onChange={handleEditFieldChange}
                placeholder="Nom"
                style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>
            <input
              type="date" name="date" value={editForm.date?.split('T')[0] || editForm.date}
              onChange={handleEditFieldChange}
              style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>
        ) : (
          // ── Mode lecture ──────────────────────────────────────────────────
          <div style={{ fontSize: '14px', color: '#334155', marginBottom: '10px' }}>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Nom </span>
              <strong>{a.prenom} {a.nom}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Date </span>
              <strong>{new Date(a.date).toLocaleDateString('fr-FR')}</strong>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {isEditing ? (
            <>
              <button onClick={() => handleSaveEdit(a.id)}
                style={{ flex: 1, background: '#10b981', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: 'none' }}>
                ✅ Enregistrer
              </button>
              <button onClick={() => setEditingId(null)}
                style={{ flex: 1, background: '#ef4444', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: 'none' }}>
                ✕ Annuler
              </button>
            </>
          ) : (
            <>
              {a.status === 'reserved' && (
                <>
                  <button onClick={() => handleEdit(a)}
                    style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: 'none', minWidth: '80px' }}>
                    ✏️ Modifier
                  </button>
                  <button onClick={() => handleCancel(a.reference)}
                    style={{ flex: 1, background: '#ef4444', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: 'none', minWidth: '80px' }}>
                    🚫 Annuler
                  </button>
                </>
              )}
              <button onClick={() => handleReprint(a)}
                style={{ flex: 1, background: '#8b5cf6', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: 'none', minWidth: '80px' }}>
                🖨️ PDF
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <h3>🔍 Consulter vos rendez-vous</h3>

      {message && (
        <div className={`alert ${message.type}`} style={{ marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSearch}>
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
              searchMode === 'phone'           ? '0601020304' :
              searchMode === 'reference'       ? 'RDV-...' :
              searchMode === 'chrono'          ? 'Numéro Chrono' :
              searchMode === 'vin'             ? 'VIN' :
              'AA-123-XX'
            }
            maxLength={searchMode === 'phone' ? 10 : searchMode === 'vin' ? 17 : undefined}
          />
        </div>

        <button type="submit" disabled={searching} style={{ width: '100%' }}>
          {searching ? '⏳ Recherche...' : '🔍 Rechercher'}
        </button>
      </form>

      {appointments.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Résultats ({appointments.length})</h4>
          {appointments.map(a => <AppointmentCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
