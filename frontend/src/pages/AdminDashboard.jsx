import React, { useState, useEffect, useCallback } from 'react';
import { makeObjectFieldHandler } from '../utils/validation';
import { api } from '../api';
import { HolidaysManagerSimple } from '../components/HolidaysManagerSimple';

const DAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('centres');
  const [centres, setCentres] = useState([]);
  const [agents, setAgents] = useState([]);
  const [closures, setClosures] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [exceptionalCapacities, setExceptionalCapacities] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState(null);

  const [centreForm, setCentreForm] = useState({
    code: '',
    name: '',
    type: 'PIMO',
    region: '',
    commune: '',
    address: '',
    dailyCapacity: 50,
    workDays: ['L', 'M', 'M', 'J', 'V'],
    status: 'active',
  });

  const [agentForm, setAgentForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    centreId: '',
  });

  const [editingAgent, setEditingAgent] = useState(null);
  const [editingCentre, setEditingCentre] = useState(null);
  const [editingClosure, setEditingClosure] = useState(null);

  const [closureForm, setClosureForm] = useState({
    date: '',
    reason: '',
    centreId: 'all',
  });

  const [holidayForm, setHolidayForm] = useState({
    date: '',
    name: '',
  });

  const [capacityForm, setCapacityForm] = useState({
    centreId: '',
    type: 'date', // 'date', 'period', 'weekday'
    date: '',
    startDate: '',
    endDate: '',
    weekday: '', // 'L', 'M', 'J', 'V', 'S', 'D'
    capacity: '',
  });

  const [editingCapacity, setEditingCapacity] = useState(null);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    try {
      if (tab === 'agents') {
        const data = await api.getAgents();
        setAgents(data);
      } else if (tab === 'centres') {
        const data = await api.getCentres();
        setCentres(data);
      } else if (tab === 'stats') {
        const data = await api.getAdminStats();
        setStats(data);
      } else if (tab === 'closures') {
        const data = await api.getClosures();
        setClosures(data || []);
      } else if (tab === 'holidays') {
        const data = await api.getHolidays();
        setHolidays(data || []);
      } else if (tab === 'capacity') {
        const data = await api.getExceptionalCapacities();
        setExceptionalCapacities(data || []);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateCentre = async (e) => {
    e.preventDefault();
    try {
      await api.createCentre(centreForm);
      setMessage({ type: 'success', text: 'Centre créé ✅' });
      setCentreForm({ code: '', name: '', type: 'PIMO', region: '', commune: '', address: '', dailyCapacity: 50, workDays: ['L', 'M', 'M', 'J', 'V'], status: 'active' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleUpdateCentre = async (e) => {
    e.preventDefault();
    try {
      await api.updateCentre(editingCentre.id, editingCentre);
      setMessage({ type: 'success', text: 'Centre modifié ✅' });
      setEditingCentre(null);
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      await api.createAgent(agentForm);
      setMessage({ type: 'success', text: 'Agent créé ✅' });
      setAgentForm({ username: '', password: '', name: '', email: '', centreId: '' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleUpdateAgent = async (e) => {
    e.preventDefault();
    try {
      await api.updateAgent(editingAgent.id, editingAgent);
      setMessage({ type: 'success', text: 'Agent modifié ✅' });
      setEditingAgent(null);
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteAgent = async (id) => {
    if (!window.confirm('Supprimer cet agent ?')) return;
    try {
      await api.deleteAgent(id);
      setMessage({ type: 'success', text: 'Agent supprimé ✅' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleAddClosure = async (e) => {
    e.preventDefault();
    try {
      await api.addClosure(closureForm);
      setMessage({ type: 'success', text: 'Fermeture ajoutée ✅' });
      setClosureForm({ date: '', reason: '' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleUpdateClosure = async (e) => {
    e.preventDefault();
    try {
      await api.updateClosure(editingClosure.id, editingClosure);
      setMessage({ type: 'success', text: 'Fermeture modifiée ✅' });
      setEditingClosure(null);
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteClosure = async (id) => {
    if (!window.confirm('Supprimer cette fermeture ?')) return;
    try {
      await api.deleteClosure(id);
      setMessage({ type: 'success', text: 'Fermeture supprimée ✅' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await api.addHoliday(holidayForm);
      setMessage({ type: 'success', text: 'Jour férié ajouté ✅' });
      setHolidayForm({ date: '', name: '' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Supprimer ce jour férié ?')) return;
    try {
      await api.deleteHoliday(id);
      setMessage({ type: 'success', text: 'Jour férié supprimé ✅' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleAddCapacity = async (e) => {
    e.preventDefault();
    try {
      // Convert capacity to number
      const dataToSend = {
        ...capacityForm,
        capacity: parseInt(capacityForm.capacity, 10)
      };
      
      console.log('📤 Envoi des données:', dataToSend);
      const data = await api.addExceptionalCapacity(dataToSend);
      console.log('✅ Capacité ajoutée:', data);
      setMessage({ type: 'success', text: 'Capacité exceptionnelle ajoutée ✅' });
      setCapacityForm({ centreId: '', type: 'date', date: '', startDate: '', endDate: '', weekday: '', capacity: '', reason: '' });
      await loadData();
      // Hide success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      // Hide error message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleUpdateCapacity = async (e) => {
    e.preventDefault();
    try {
      await api.updateExceptionalCapacity(editingCapacity.id, editingCapacity);
      setMessage({ type: 'success', text: 'Capacité modifiée ✅' });
      setEditingCapacity(null);
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteCapacity = async (id) => {
    if (!window.confirm('Supprimer cette capacité exceptionnelle ?')) return;
    try {
      await api.deleteExceptionalCapacity(id);
      setMessage({ type: 'success', text: 'Capacité supprimée ✅' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // ── Handlers formatés (formatage instantané à la saisie) ──────────────────
  const handleCentreFormChange    = makeObjectFieldHandler(setCentreForm);
  const handleAgentFormChange     = makeObjectFieldHandler(setAgentForm);
  const handleEditingCentreChange = makeObjectFieldHandler(setEditingCentre);
  const handleEditingAgentChange  = makeObjectFieldHandler(setEditingAgent);
  // ───────────────────────────────────────────────────────────────────────────

  const toggleWorkDay = (day) => {
    const idx = DAYS_FR.indexOf(day);
    if (centreForm.workDays.includes(day)) {
      setCentreForm({ ...centreForm, workDays: centreForm.workDays.filter(d => d !== day) });
    } else {
      setCentreForm({ ...centreForm, workDays: [...centreForm.workDays, day] });
    }
  };

  const toggleEditWorkDay = (day) => {
    if (editingCentre.workDays.includes(day)) {
      setEditingCentre({ ...editingCentre, workDays: editingCentre.workDays.filter(d => d !== day) });
    } else {
      setEditingCentre({ ...editingCentre, workDays: [...editingCentre.workDays, day] });
    }
  };

  return (
    <div>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <div className="tabs">
        <button className={tab === 'centres' ? 'active' : ''} onClick={() => setTab('centres')}>🏢 Centres</button>
        <button className={tab === 'agents' ? 'active' : ''} onClick={() => setTab('agents')}>👥 Agents</button>
        <button className={tab === 'capacity' ? 'active' : ''} onClick={() => setTab('capacity')}>⚙️ Capacités</button>
        <button className={tab === 'closures' ? 'active' : ''} onClick={() => setTab('closures')}>📅 Fermetures</button>
        <button className={tab === 'holidays' ? 'active' : ''} onClick={() => setTab('holidays')}>🎉 Jours fériés</button>
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>📊 Stats</button>
      </div>

      {/* Centres */}
      {tab === 'centres' && (
        <div>
          {!editingCentre ? (
            <div className="card">
              <h3>Créer un centre</h3>
              <form onSubmit={handleCreateCentre}>
                <div className="grid">
                  <div className="form-group">
                    <label>Code *</label>
                    <input type="text" name="code" value={centreForm.code} onChange={handleCentreFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input type="text" name="name" value={centreForm.name} onChange={handleCentreFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select value={centreForm.type} onChange={(e) => setCentreForm({ ...centreForm, type: e.target.value })}>
                      <option value="PIMO">PIMO</option>
                      <option value="POST_REIMMAT">POST_REIMMAT</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Capacité *</label>
                    <input type="number" value={centreForm.dailyCapacity} onChange={(e) => setCentreForm({ ...centreForm, dailyCapacity: parseInt(e.target.value) })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Jours ouvrables *</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {DAYS_FR.map((day, idx) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkDay(day)}
                        style={{
                          padding: '8px 12px',
                          background: centreForm.workDays.includes(day) ? '#3b82f6' : '#e5e7eb',
                          color: centreForm.workDays.includes(day) ? 'white' : '#64748b',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        title={DAYS_FULL[idx]}
                      >
                        {day}
                      </button>
                    ))}
                    
                    {/* JF Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setCentreForm({
                          ...centreForm,
                          includeHolidays: !centreForm.includeHolidays
                        });
                      }}
                      style={{
                        padding: '8px 12px',
                        background: centreForm.includeHolidays ? '#ef4444' : '#e5e7eb',
                        color: centreForm.includeHolidays ? 'white' : '#64748b',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                      title="Jours Fériés (fermé)"
                    >
                      🗓️ JF
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    {centreForm.includeHolidays ? '✅ Jours fériés seront FERMÉS' : '⚠️ Jours fériés seront OUVERTS'}
                  </p>
                </div>
                <button type="submit" style={{ marginTop: '16px' }}>Créer</button>
              </form>
            </div>
          ) : (
            <div className="card">
              <h3>Modifier le centre</h3>
              <form onSubmit={handleUpdateCentre}>
                <div className="grid">
                  <div className="form-group">
                    <label>Code</label>
                    <input type="text" name="code" value={editingCentre.code} onChange={handleEditingCentreChange} />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input type="text" name="name" value={editingCentre.name} onChange={handleEditingCentreChange} />
                  </div>
                  <div className="form-group">
                    <label>Capacité</label>
                    <input type="number" value={editingCentre.dailyCapacity} onChange={(e) => setEditingCentre({ ...editingCentre, dailyCapacity: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Jours ouvrables</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {DAYS_FR.map((day, idx) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleEditWorkDay(day)}
                        style={{
                          padding: '8px 12px',
                          background: editingCentre.workDays.includes(day) ? '#3b82f6' : '#e5e7eb',
                          color: editingCentre.workDays.includes(day) ? 'white' : '#64748b',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        title={DAYS_FULL[idx]}
                      >
                        {day}
                      </button>
                    ))}
                    
                    {/* JF Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCentre({
                          ...editingCentre,
                          includeHolidays: !editingCentre.includeHolidays
                        });
                      }}
                      style={{
                        padding: '8px 12px',
                        background: editingCentre.includeHolidays ? '#ef4444' : '#e5e7eb',
                        color: editingCentre.includeHolidays ? 'white' : '#64748b',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                      title="Jours Fériés (fermé)"
                    >
                      🗓️ JF
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    {editingCentre.includeHolidays ? '✅ Jours fériés seront FERMÉS' : '⚠️ Jours fériés seront OUVERTS'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button type="submit">✅ Enregistrer</button>
                  <button type="button" onClick={() => setEditingCentre(null)} style={{ background: '#ef4444' }}>❌ Annuler</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <h3>Centres existants</h3>
            <table>
              <thead>
                <tr><th>Code</th><th>Nom</th><th>Type</th><th>Capacité</th><th>Jours</th><th>Action</th></tr>
              </thead>
              <tbody>
                {centres.map(c => (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.type}</td>
                    <td>{c.dailyCapacity}</td>
                    <td>{(c.workDays || []).join('')}</td>
                    <td>
                      <button onClick={() => setEditingCentre(c)} style={{ background: '#3b82f6', padding: '6px 12px', fontSize: '12px' }}>
                        ✏️ Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agents */}
      {tab === 'agents' && (
        <div>
          {!editingAgent ? (
            <div className="card">
              <h3>Créer un agent</h3>
              <form onSubmit={handleCreateAgent}>
                <div className="grid">
                  <div className="form-group">
                    <label>Identifiant *</label>
                    <input type="text" name="username" value={agentForm.username} onChange={handleAgentFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe *</label>
                    <input type="password" value={agentForm.password} onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input type="text" name="name" value={agentForm.name} onChange={handleAgentFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={agentForm.email} onChange={handleAgentFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Centre *</label>
                    <select value={agentForm.centreId} onChange={(e) => setAgentForm({ ...agentForm, centreId: e.target.value })} required>
                      <option value="">-- Sélectionner --</option>
                      {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit">Créer agent</button>
              </form>
            </div>
          ) : (
            <div className="card">
              <h3>Modifier l'agent</h3>
              <form onSubmit={handleUpdateAgent}>
                <div className="grid">
                  <div className="form-group">
                    <label>Nom</label>
                    <input type="text" name="name" value={editingAgent.name} onChange={handleEditingAgentChange} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={editingAgent.email} onChange={handleEditingAgentChange} />
                  </div>
                  <div className="form-group">
                    <label>Centre</label>
                    <select value={editingAgent.centreId} onChange={(e) => setEditingAgent({ ...editingAgent, centreId: e.target.value })}>
                      {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit">✅ Enregistrer</button>
                  <button type="button" onClick={() => setEditingAgent(null)} style={{ background: '#ef4444' }}>❌ Annuler</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <h3>Agents</h3>
            <table>
              <thead>
                <tr><th>Nom</th><th>Identifiant</th><th>Centre</th><th>Email</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.username}</td>
                    <td>{centres.find(c => c.id === a.centreId)?.name || 'N/A'}</td>
                    <td>{a.email || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setEditingAgent(a)} style={{ background: '#3b82f6', padding: '6px 12px', fontSize: '12px' }}>✏️ Modifier</button>
                        <button onClick={() => handleDeleteAgent(a.id)} style={{ background: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>🗑️ Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Capacités Exceptionnelles */}
      {tab === 'capacity' && (
        <div>
          {!editingCapacity ? (
            <div className="card">
              <h3>Ajouter une capacité exceptionnelle</h3>
              <form onSubmit={handleAddCapacity}>
                <div className="grid">
                  <div className="form-group">
                    <label>Centre *</label>
                    <select value={capacityForm.centreId} onChange={(e) => setCapacityForm({ ...capacityForm, centreId: e.target.value })} required>
                      <option value="">-- Sélectionner --</option>
                      {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type de configuration *</label>
                    <select value={capacityForm.type} onChange={(e) => setCapacityForm({ ...capacityForm, type: e.target.value })}>
                      <option value="date">Date précise</option>
                      <option value="period">Période (du ... au ...)</option>
                      <option value="weekday">Jour ouvrable (récurrent)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nouvelle capacité *</label>
                    <input type="number" value={capacityForm.capacity} onChange={(e) => setCapacityForm({ ...capacityForm, capacity: e.target.value })} placeholder="Ex: 30" required />
                  </div>
                </div>

                {capacityForm.type === 'date' && (
                  <div className="form-group">
                    <label>Date *</label>
                    <input type="date" value={capacityForm.date} onChange={(e) => setCapacityForm({ ...capacityForm, date: e.target.value })} required />
                  </div>
                )}

                {capacityForm.type === 'period' && (
                  <div className="grid">
                    <div className="form-group">
                      <label>Date de début *</label>
                      <input type="date" value={capacityForm.startDate} onChange={(e) => setCapacityForm({ ...capacityForm, startDate: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Date de fin *</label>
                      <input type="date" value={capacityForm.endDate} onChange={(e) => setCapacityForm({ ...capacityForm, endDate: e.target.value })} required />
                    </div>
                  </div>
                )}

                {capacityForm.type === 'weekday' && (
                  <div className="form-group">
                    <label>Jour ouvrable *</label>
                    <select value={capacityForm.weekday} onChange={(e) => setCapacityForm({ ...capacityForm, weekday: e.target.value })} required>
                      <option value="">-- Sélectionner --</option>
                      <option value="L">Lundi</option>
                      <option value="M">Mardi</option>
                      <option value="M">Mercredi</option>
                      <option value="J">Jeudi</option>
                      <option value="V">Vendredi</option>
                      <option value="S">Samedi</option>
                      <option value="D">Dimanche</option>
                    </select>
                  </div>
                )}

                <button type="submit" style={{ marginTop: '16px' }}>Ajouter</button>
              </form>
            </div>
          ) : (
            <div className="card">
              <h3>Modifier la capacité</h3>
              <form onSubmit={handleUpdateCapacity}>
                <div className="grid">
                  <div className="form-group">
                    <label>Type</label>
                    <input type="text" value={
                      editingCapacity.type === 'date' ? 'Date précise' :
                      editingCapacity.type === 'period' ? 'Période' :
                      'Jour ouvrable'
                    } disabled />
                  </div>
                  <div className="form-group">
                    <label>Capacité</label>
                    <input type="number" value={editingCapacity.capacity} onChange={(e) => setEditingCapacity({ ...editingCapacity, capacity: parseInt(e.target.value) })} />
                  </div>
                </div>
                
                {editingCapacity.type === 'date' && (
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={editingCapacity.date} onChange={(e) => setEditingCapacity({ ...editingCapacity, date: e.target.value })} />
                  </div>
                )}

                {editingCapacity.type === 'period' && (
                  <div className="grid">
                    <div className="form-group">
                      <label>Date de début</label>
                      <input type="date" value={editingCapacity.startDate} onChange={(e) => setEditingCapacity({ ...editingCapacity, startDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Date de fin</label>
                      <input type="date" value={editingCapacity.endDate} onChange={(e) => setEditingCapacity({ ...editingCapacity, endDate: e.target.value })} />
                    </div>
                  </div>
                )}

                {editingCapacity.type === 'weekday' && (
                  <div className="form-group">
                    <label>Jour</label>
                    <input type="text" value={
                      editingCapacity.weekday === 'L' ? 'Lundi' :
                      editingCapacity.weekday === 'M' ? 'Mardi/Mercredi' :
                      editingCapacity.weekday === 'J' ? 'Jeudi' :
                      editingCapacity.weekday === 'V' ? 'Vendredi' :
                      editingCapacity.weekday === 'S' ? 'Samedi' :
                      'Dimanche'
                    } disabled />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button type="submit">✅ Enregistrer</button>
                  <button type="button" onClick={() => setEditingCapacity(null)} style={{ background: '#ef4444' }}>❌ Annuler</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <h3>Capacités exceptionnelles configurées</h3>
            <table>
              <thead>
                <tr><th>Centre</th><th>Type</th><th>Configuration</th><th>Capacité</th><th>Capacité base</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {exceptionalCapacities.map(ec => {
                  const centre = centres.find(c => c.id === ec.centreId);
                  let config = '';
                  
                  if (ec.type === 'date') {
                    config = new Date(ec.date).toLocaleDateString('fr-FR');
                  } else if (ec.type === 'period') {
                    config = `${new Date(ec.startDate).toLocaleDateString('fr-FR')} → ${new Date(ec.endDate).toLocaleDateString('fr-FR')}`;
                  } else if (ec.type === 'weekday') {
                    const days = { 'L': 'Lundi', 'M': 'Mardi/Mercredi', 'J': 'Jeudi', 'V': 'Vendredi', 'S': 'Samedi', 'D': 'Dimanche' };
                    config = days[ec.weekday] || ec.weekday;
                  }

                  return (
                    <tr key={ec.id}>
                      <td><strong>{centre?.name || 'N/A'}</strong></td>
                      <td>
                        {ec.type === 'date' ? '📅 Date' :
                         ec.type === 'period' ? '📆 Période' :
                         '🔄 Récurrent'}
                      </td>
                      <td>{config}</td>
                      <td style={{ fontWeight: '600', fontSize: '16px', color: '#3b82f6' }}>{ec.capacity}</td>
                      <td>{centre?.dailyCapacity || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => setEditingCapacity(ec)} style={{ background: '#3b82f6', padding: '6px 12px', fontSize: '12px' }}>✏️ Modifier</button>
                          <button onClick={() => handleDeleteCapacity(ec.id)} style={{ background: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>🗑️ Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {exceptionalCapacities.length === 0 && (
              <p style={{ color: '#64748b', marginTop: '16px' }}>Aucune capacité exceptionnelle configurée</p>
            )}
          </div>
        </div>
      )}

      {/* Closures */}
      {tab === 'closures' && (
        <div>
          {!editingClosure ? (
            <div className="card">
              <h3>Ajouter une fermeture exceptionnelle</h3>
              <form onSubmit={handleAddClosure}>
                <div className="grid">
                  <div className="form-group">
                    <label>Site *</label>
                    <select
                      value={closureForm.centreId}
                      onChange={(e) => setClosureForm({ ...closureForm, centreId: e.target.value })}
                      required
                    >
                      <option value="all">— Tous les sites —</option>
                      {centres?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input type="date" value={closureForm.date} onChange={(e) => setClosureForm({ ...closureForm, date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Motif *</label>
                    <input type="text" value={closureForm.reason} onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })} placeholder="Ex: Jour férié, Maintenance..." required />
                  </div>
                </div>
                <button type="submit">Ajouter</button>
              </form>
            </div>
          ) : (
            <div className="card">
              <h3>Modifier la fermeture</h3>
              <form onSubmit={handleUpdateClosure}>
                <div className="grid">
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={editingClosure.date} onChange={(e) => setEditingClosure({ ...editingClosure, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Motif</label>
                    <input type="text" value={editingClosure.reason} onChange={(e) => setEditingClosure({ ...editingClosure, reason: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit">✅ Enregistrer</button>
                  <button type="button" onClick={() => setEditingClosure(null)} style={{ background: '#ef4444' }}>❌ Annuler</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <h3>Fermetures exceptionnelles</h3>
            <table>
              <thead>
                <tr><th>Site</th><th>Date</th><th>Motif</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {closures.map(c => (
                  <tr key={c.id}>
                    <td>{c.centreId === 'all' || !c.centreId ? <em style={{color:'#64748b'}}>Tous les sites</em> : (centres?.find(ct => ct.id === c.centreId)?.name || c.centreId)}</td>
                    <td>{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                    <td>{c.reason || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setEditingClosure(c)} style={{ background: '#3b82f6', padding: '6px 12px', fontSize: '12px' }}>✏️ Modifier</button>
                        <button onClick={() => handleDeleteClosure(c.id)} style={{ background: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>🗑️ Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Holidays */}
      {tab === 'holidays' && (
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>🗓️ Gestion des Jours Fériés - Côte d'Ivoire</h2>
          
          {!centres || centres.length === 0 ? (
            <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '8px', color: '#0c4a6e' }}>
              ⚠️ Aucun centre disponible. Créez d'abord un centre dans l'onglet "Centres".
            </div>
          ) : (
            <HolidaysManagerSimple 
              centreId={centres[0]?.id}
              onUpdate={() => {
                setMessage({ type: 'success', text: 'Jours fériés mis à jour !' });
                setTimeout(() => setMessage(null), 3000);
              }}
            />
          )}
        </div>
      )}

      {/* Stats */}
      {tab === 'stats' && stats && (
        <div className="card">
          <h3>📊 Statistiques globales</h3>
          <div className="grid">
            <div style={{ background: '#f0f4ff', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Total RDV</p>
              <h2 style={{ fontSize: '28px', color: '#3b82f6' }}>{stats.totalAppointments}</h2>
            </div>
            <div style={{ background: '#f0fff4', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Réalisés</p>
              <h2 style={{ fontSize: '28px', color: '#10b981' }}>{stats.completed}</h2>
            </div>
            <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Absents</p>
              <h2 style={{ fontSize: '28px', color: '#ef4444' }}>{stats.absent}</h2>
            </div>
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Annulés</p>
              <h2 style={{ fontSize: '28px', color: '#6b7280' }}>{stats.cancelled}</h2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
