import { useState, useEffect } from 'react';
import { api } from '../api';
import { generatePDF } from '../utils/pdf';
import DatePicker from '../components/DatePicker';

export default function BookingPage() {
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  
  const [form, setForm] = useState({
    centreId: '',
    nom: '',
    prenom: '',
    phone: '',
    email: '',
    date: '',
    chrono: '',
    immatriculation: '',
    vin: '',
  });

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadCentres();
  }, []);

  useEffect(() => {
    if (form.centreId) {
      loadDates();
    }
  }, [form.centreId]);

  const loadCentres = async () => {
    try {
      const data = await api.getCentres();
      setCentres(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadDates = async () => {
    try {
      console.log('Loading availability for centre:', form.centreId);
      const data = await api.getCentreAvailability(form.centreId, 30);
      console.log('Availability data received:', data);
      setAvailableDates(data);
    } catch (err) {
      console.error('Error loading dates:', err);
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCentreChange = (e) => {
    const centreId = e.target.value;
    setForm({ ...form, centreId, date: '' });
    const centre = centres.find(c => c.id === centreId);
    setSelectedCentre(centre);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const appointment = await api.createAppointment(form);
      
      // Generate and display PDF
      generatePDF(appointment, selectedCentre);
      
      setResult(appointment);
      setMessage({ type: 'success', text: 'Rendez-vous réservé ! PDF ouvert.' });
      setForm({ centreId: '', nom: '', prenom: '', phone: '', email: '', date: '', chrono: '', immatriculation: '', vin: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="card">
      <h3>📝 Prendre un rendez-vous</h3>

      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      {result ? (
        <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '8px', border: '1px solid #10b981' }}>
          <h4 style={{ color: '#059669', marginBottom: '16px' }}>✅ Rendez-vous confirmé !</h4>
          <table>
            <tbody>
              <tr><th>Référence</th><td style={{ fontWeight: 'bold' }}>{result.reference}</td></tr>
              <tr><th>Date</th><td>{new Date(result.date).toLocaleDateString('fr-FR')}</td></tr>
              <tr><th>Nom</th><td>{result.prenom} {result.nom}</td></tr>
              <tr><th>Téléphone</th><td>{result.phone}</td></tr>
            </tbody>
          </table>
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#065f46' }}>
            ℹ️ Un PDF a été ouvert avec votre confirmation. Vous pouvez l'imprimer ou le télécharger.
          </p>
          <button onClick={() => setResult(null)} style={{ marginTop: '20px' }}>Prendre un autre rendez-vous</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid">
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Dupont"
                required
              />
            </div>
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                placeholder="Jean"
                required
              />
            </div>
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Téléphone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="06 01 02 03 04"
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jean@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Centre *</label>
            <select value={form.centreId} onChange={handleCentreChange} required>
              <option value="">-- Sélectionner un centre --</option>
              {centres.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedCentre && (
            <>
              {selectedCentre.type === 'PIMO' && (
                <div className="grid">
                  <div className="form-group">
                    <label>Numéro Chrono *</label>
                    <input
                      type="text"
                      value={form.chrono}
                      onChange={(e) => setForm({ ...form, chrono: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>VIN</label>
                    <input
                      type="text"
                      value={form.vin}
                      onChange={(e) => setForm({ ...form, vin: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {selectedCentre.type === 'POST_REIMMAT' && (
                <div className="grid">
                  <div className="form-group">
                    <label>Immatriculation *</label>
                    <input
                      type="text"
                      value={form.immatriculation}
                      onChange={(e) => setForm({ ...form, immatriculation: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>VIN</label>
                    <input
                      type="text"
                      value={form.vin}
                      onChange={(e) => setForm({ ...form, vin: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Sélectionner une date *</label>
                <DatePicker 
                  availableDates={availableDates}
                  selectedDate={form.date}
                  onDateChange={(date) => setForm({ ...form, date })}
                  minDate={new Date()}
                  centreCapacity={selectedCentre.dailyCapacity}
                />
              </div>
            </>
          )}

          <button type="submit" disabled={!form.centreId || !form.date || !form.nom || !form.prenom || !form.phone}>
            ✅ Confirmer la réservation
          </button>
        </form>
      )}
    </div>
  );
}
