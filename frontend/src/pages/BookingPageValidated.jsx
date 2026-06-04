import { useState } from 'react';
import { api } from '../api';
import { generatePDF } from '../utils/pdf';
import DatePicker from '../components/DatePicker';
import { useForm } from '../hooks/useForm';
import { useAPI } from '../hooks/useAPI';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { FormField } from '../ui/FormField';
import { validateForm } from '../utils/validation';

export default function BookingPageValidated() {
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [result, setResult] = useState(null);
  const [showAlert, setShowAlert] = useState(null);

  const { data: centres, loading: centresLoading, error: centresError } = useAPI(
    () => api.getCentres(),
    {
      onSuccess: (data) => console.log('Centres loaded:', data.length),
      onError: (err) => console.error('Failed to load centres:', err)
    }
  );

  const {
    formData,
    setFormData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit: originalHandleSubmit,
    reset
  } = useForm(
    {
      centreId: '',
      nom: '',
      prenom: '',
      phone: '',
      email: '',
      date: '',
      chrono: '',
      immatriculation: '',
      vin: ''
    },
    async (data) => {
      try {
        const appointment = await api.createAppointment(data);
        generatePDF(appointment, selectedCentre);
        setResult(appointment);
        setShowAlert({ type: 'success', text: 'Rendez-vous réservé avec succès !' });
        reset();
      } catch (err) {
        setShowAlert({ type: 'error', text: err.message });
      }
    },
    validateForm
  );

  const handleCentreChange = (e) => {
    const centreId = e.target.value;
    const centre = centres?.find(c => c.id === centreId);
    setFormData(prev => ({ ...prev, centreId }));
    setSelectedCentre(centre);
    setAvailableDates([]);

    if (centreId) {
      api.getCentreAvailability(centreId, 30)
        .then(data => setAvailableDates(data))
        .catch(() => setShowAlert({ type: 'error', text: 'Erreur chargement calendrier' }));
    }
  };

  const handleSubmit = async (e) => {
    await originalHandleSubmit(e);
  };

  if (centresLoading) {
    return (
      <div className="container">
        <Card><div className="loading">Chargement des centres...</div></Card>
      </div>
    );
  }

  if (centresError) {
    return (
      <div className="container">
        <Alert type="error" onClose={() => window.location.reload()}>
          Impossible de charger les centres : {centresError.message}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container">
      {showAlert && (
        <Alert type={showAlert.type} onClose={() => setShowAlert(null)}>
          {showAlert.text}
        </Alert>
      )}

      {result ? (
        <Card>
          <CardHeader>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: '#10b981' }}>Rendez-vous Confirmé !</h2>
          </CardHeader>
          <CardBody>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Référence</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold' }}>{result.reference}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Date</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{new Date(result.date).toLocaleDateString('fr-FR')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Nom</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{result.prenom} {result.nom}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Téléphone</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{result.phone}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: '24px', color: '#475569', fontSize: '14px' }}>
              Un PDF de confirmation a été ouvert. Vous pouvez l'imprimer ou le télécharger.
            </p>
          </CardBody>
          <CardFooter>
            <Button variant="primary" onClick={() => { setResult(null); setSelectedCentre(null); }}>
              Nouveau Rendez-vous
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2>📝 Prendre un Rendez-vous</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <FormField
                  label="Nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.nom}
                  touched={touched.nom}
                  required
                  placeholder="DUPONT"
                />
                <FormField
                  label="Prénom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.prenom}
                  touched={touched.prenom}
                  required
                  placeholder="JEAN"
                />
              </div>

              <div className="grid-2">
                <FormField
                  label="Téléphone (10 chiffres)"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.phone}
                  touched={touched.phone}
                  required
                  placeholder="0601020304"
                  maxLength={10}
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.email}
                  touched={touched.email}
                  placeholder="jean@example.com"
                />
              </div>

              <FormField label="Centre" name="centreId">
                <select
                  name="centreId"
                  value={formData.centreId}
                  onChange={handleCentreChange}
                  onBlur={handleBlur}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: errors.centreId && touched.centreId ? '2px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Sélectionner un centre --</option>
                  {centres?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FormField>

              {selectedCentre?.type === 'PIMO' && (
                <>
                  <div className="grid-2">
                    <FormField
                      label="Numéro Chrono (chiffres et lettres)"
                      name="chrono"
                      value={formData.chrono}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.chrono}
                      touched={touched.chrono}
                      required
                      placeholder="ABC123"
                    />
                    <FormField
                      label="VIN (chiffres et lettres)"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.vin}
                      touched={touched.vin}
                      placeholder="VF3AB123CD456789"
                      maxLength={17}
                    />
                  </div>
                  <FormField
                    label="Immatriculation"
                    name="immatriculation"
                    value={formData.immatriculation}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.immatriculation}
                    touched={touched.immatriculation}
                    required
                    placeholder="AA-123-XX"
                  />
                </>
              )}

              {selectedCentre && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', color: '#1e293b' }}>
                    Sélectionner une date *
                  </label>
                  <DatePicker
                    availableDates={availableDates}
                    selectedDate={formData.date}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
                    minDate={new Date()}
                    centreCapacity={selectedCentre.dailyCapacity}
                  />
                  {errors.date && touched.date && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{errors.date}</p>
                  )}
                </div>
              )}

              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                fontSize: '13px',
                color: '#1e40af'
              }}>
                ℹ️ <strong>Format des champs (appliqué automatiquement à la saisie) :</strong><br/>
                • Téléphone : 10 chiffres uniquement<br/>
                • Nom / Prénom : MAJUSCULES, lettres et tirets<br/>
                • Chrono &amp; VIN : MAJUSCULES, chiffres et lettres (VIN max 17 caractères)<br/>
                • Email : minuscules<br/>
                • Immatriculation : MAJUSCULES, chiffres, lettres et tirets
              </div>

              <Button
                variant="primary"
                type="submit"
                disabled={!formData.centreId || !formData.date || !formData.nom || !formData.prenom || !formData.phone || isSubmitting}
                loading={isSubmitting}
                style={{ width: '100%', marginTop: '24px' }}
              >
                ✅ Confirmer la Réservation
              </Button>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
