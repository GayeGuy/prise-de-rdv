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

function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '28px 24px',
        maxWidth: '380px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
        <h3 style={{ color: '#0f172a', marginBottom: '8px', fontSize: '17px' }}>
          Confirmer la réservation
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
          Êtes-vous certain(e) de vouloir prendre ce rendez-vous ?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px 0', borderRadius: '8px',
            background: '#3b82f6', color: 'white', border: 'none',
            fontWeight: '600', fontSize: '15px', cursor: 'pointer',
          }}>Oui</button>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 0', borderRadius: '8px',
            background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0',
            fontWeight: '600', fontSize: '15px', cursor: 'pointer',
          }}>Non</button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPageValidated() {
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [result, setResult] = useState(null);
  const [showAlert, setShowAlert] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: centres, loading: centresLoading, error: centresError } = useAPI(
    () => api.getCentres(),
    { onSuccess: (data) => console.log('Centres loaded:', data.length) }
  );

  const {
    formData, setFormData, errors, touched,
    isSubmitting, handleChange, handleBlur,
    handleSubmit: originalHandleSubmit,
    validateOnly, reset
  } = useForm(
    { centreId: '', nom: '', prenom: '', phone: '', email: '', date: '', chrono: '', immatriculation: '', vin: '' },
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

  // Étape 1 : valider le formulaire → afficher le popup si valide
  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = validateOnly();
    if (isValid) setShowConfirm(true);
  };

  // Étape 2 : l'usager clique "Oui" → soumettre réellement (enregistrement + PDF)
  const handleConfirmYes = async () => {
    setShowConfirm(false);
    await originalHandleSubmit({ preventDefault: () => {} });
  };

  // L'usager clique "Non" → fermer le popup, rien d'autre
  const handleConfirmNo = () => setShowConfirm(false);

  if (centresLoading) return <Card><div className="loading">Chargement des centres...</div></Card>;
  if (centresError) return (
    <Alert type="error" onClose={() => window.location.reload()}>
      Impossible de charger les centres : {centresError.message}
    </Alert>
  );

  const isPIMO = selectedCentre?.type === 'PIMO';

  return (
    <>
      {showConfirm && <ConfirmModal onConfirm={handleConfirmYes} onCancel={handleConfirmNo} />}

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
                {[
                  ['Référence', result.reference],
                  ['Date', new Date(result.date).toLocaleDateString('fr-FR')],
                  ['Nom', `${result.prenom} ${result.nom}`],
                  ['Téléphone', result.phone],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ padding: '12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', width: '40%' }}>{label}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: '20px', color: '#475569', fontSize: '14px' }}>
              Le PDF de confirmation est ouvert dans un nouvel onglet.
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
          <CardHeader><h2>📝 Prendre un Rendez-vous</h2></CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <FormField label="Nom" name="nom" value={formData.nom} onChange={handleChange} onBlur={handleBlur} error={errors.nom} touched={touched.nom} required placeholder="DUPONT" />
                <FormField label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} onBlur={handleBlur} error={errors.prenom} touched={touched.prenom} required placeholder="JEAN" />
              </div>
              <div className="grid-2">
                <FormField label="Téléphone (10 chiffres)" name="phone" type="tel" value={formData.phone} onChange={handleChange} onBlur={handleBlur} error={errors.phone} touched={touched.phone} required placeholder="0601020304" maxLength={10} />
                <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} placeholder="jean@example.com" />
              </div>

              <FormField label="Centre *" name="centreId">
                <select name="centreId" value={formData.centreId} onChange={handleCentreChange} onBlur={handleBlur}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: errors.centreId && touched.centreId ? '2px solid #ef4444' : '1px solid #e2e8f0', fontSize: '14px' }}>
                  <option value="">-- Sélectionner un centre --</option>
                  {centres?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>

              {isPIMO && (
                <>
                  <div className="grid-2">
                    <FormField label="Numéro Chrono *" name="chrono" value={formData.chrono} onChange={handleChange} onBlur={handleBlur} error={errors.chrono} touched={touched.chrono} required placeholder="ABC123" />
                    <FormField label="VIN *" name="vin" value={formData.vin} onChange={handleChange} onBlur={handleBlur} error={errors.vin} touched={touched.vin} required placeholder="VF3AB123CD456789" maxLength={17} />
                  </div>
                  <FormField label="Immatriculation *" name="immatriculation" value={formData.immatriculation} onChange={handleChange} onBlur={handleBlur} error={errors.immatriculation} touched={touched.immatriculation} required placeholder="AA-123-XX" />
                </>
              )}

              {selectedCentre && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>
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
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.date}</p>
                  )}
                </div>
              )}

              <Button
                variant="primary" type="submit"
                disabled={
                  !formData.centreId || !formData.date || !formData.nom ||
                  !formData.prenom || !formData.phone
 ||
                  (isPIMO && (!formData.vin || !formData.chrono || !formData.immatriculation)) ||
                  isSubmitting
                }
                loading={isSubmitting}
                style={{ width: '100%', marginTop: '8px' }}
              >
                ✅ Confirmer la Réservation
              </Button>
            </form>
          </CardBody>
        </Card>
      )}
    </>
  );
}

