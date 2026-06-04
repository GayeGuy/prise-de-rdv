import { useState, useEffect } from 'react';
import { api } from '../api';
import { generatePDF } from '../utils/pdf';
import DatePicker from '../components/DatePicker';
import { useForm } from '../hooks/useForm';
import { useAPI } from '../hooks/useAPI';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { FormField } from '../ui/FormField';

export default function BookingPage() {
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [result, setResult] = useState(null);
  const [showAlert, setShowAlert] = useState(null);

  // Fetch centres
  const { data: centres, loading: centresLoading, error: centresError } = useAPI(
    () => api.getCentres(),
    {
      onSuccess: (data) => console.log('Centres loaded:', data.length),
      onError: (err) => console.error('Failed to load centres:', err)
    }
  );

  // Form validation
  const validate = (data) => {
    const errors = {};
    if (!data.nom?.trim()) errors.nom = 'Le nom est requis';
    if (!data.prenom?.trim()) errors.prenom = 'Le prénom est requis';
    if (!data.phone?.trim()) errors.phone = 'Le téléphone est requis';
    if (!/^\d{10}/.test(data.phone)) errors.phone = 'Format invalide (10 chiffres)';
    if (!data.centreId) errors.centreId = 'Sélectionnez un centre';
    if (!data.date) errors.date = 'Sélectionnez une date';
    if (selectedCentre?.type === 'PIMO' && !data.chrono?.trim()) errors.chrono = 'Numéro Chrono requis';
    return errors;
  };

  // Form management
  const { 
    formData, 
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
    validate
  );

  const handleCentreChange = (e) => {
    const centreId = e.target.value;
    const centre = centres?.find(c => c.id === centreId);
    
    handleChange(e);
    setSelectedCentre(centre);
    setAvailableDates([]);

    if (centreId) {
      api.getCentreAvailability(centreId, 30)
        .then(data => {
          console.log('Availability loaded:', data.length, 'dates');
          setAvailableDates(data);
        })
        .catch(err => setShowAlert({ type: 'error', text: 'Erreur chargement calendrier' }));
    }
  };

  const handleSubmit = async (e) => {
    await originalHandleSubmit(e);
  };

  if (centresLoading) {
    return (
      <div className="container">
        <Card>
          <div className="loading">Chargement des centres...</div>
        </Card>
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
        <Alert 
          type={showAlert.type} 
          onClose={() => setShowAlert(null)}
        >
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
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold' }}>
                    {result.reference}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Date</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {new Date(result.date).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Nom</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {result.prenom} {result.nom}
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: '24px', color: '#475569', fontSize: '14px' }}>
              Un PDF de confirmation a été ouvert. Vous pouvez l'imprimer ou le télécharger.
            </p>
          </CardBody>
          <CardFooter>
            <Button 
              variant="primary" 
              onClick={() => {
                setResult(null);
                setSelectedCentre(null);
              }}
            >
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
                  placeholder="Dupont"
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
                  placeholder="Jean"
                />
              </div>

              <div className="grid-2">
                <FormField
                  label="Téléphone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.phone}
                  touched={touched.phone}
                  required
                  placeholder="06 01 02 03 04"
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

              <FormField
                label="Centre"
                name="centreId"
              >
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
                <div className="grid-2">
                  <FormField
                    label="Numéro Chrono"
                    name="chrono"
                    value={formData.chrono}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.chrono}
                    touched={touched.chrono}
                    required
                  />
                  <FormField
                    label="VIN"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
              )}

              {selectedCentre && (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '12px',
                      fontWeight: '500',
                      color: '#1e293b'
                    }}>
                      Sélectionner une date *
                    </label>
                    <DatePicker
                      availableDates={availableDates}
                      selectedDate={formData.date}
                      onDateChange={(date) => handleChange({ target: { name: 'date', value: date } })}
                      minDate={new Date()}
                      centreCapacity={selectedCentre.dailyCapacity}
                    />
                    {errors.date && touched.date && (
                      <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                        {errors.date}
                      </p>
                    )}
                  </div>

                  <FormField
                    label="Immatriculation"
                    name="immatriculation"
                    value={formData.immatriculation}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="AA-123-XX"
                  />
                </>
              )}

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
