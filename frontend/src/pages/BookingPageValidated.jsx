import { useState, useRef } from 'react';
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
  const confirmingRef = useRef(false);

  const { data: centres, loading: centresLoading, error: centresError } = useAPI(
    () => api.getCentres(),
    { onSuccess: (data) => console.log('Centres loaded:', data.length) }
  );

  const {
    formData, setFormData, errors, touched,
    isSubmitting, handleChange, handleBlur,
    validateOnly, submitNow, reset
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

  const [vehicleLookup, setVehicleLookup] = useState({ loading: false, found: false, notFound: false });

  // Handler spécial immatriculation : formate + déclenche lookup
  const handleImmatriculationChange = async (e) => {
    handleChange(e); // formatage normal
    const val = e.target.value;
    const formatted = val.toUpperCase().replace(/[^A-Z0-9\-]/g, '');

    // Reset les champs auto-remplis si l'immatriculation change
    setFormData(prev => ({ ...prev, chrono: '', vin: '' }));
    setVehicleLookup({ loading: false, found: false, notFound: false });

    // Déclencher le lookup seulement si l'immat semble complète (≥ 6 chars)
    if (formatted.replace(/-/g, '').length >= 6) {
      setVehicleLookup({ loading: true, found: false, notFound: false });
      try {
        const vehicle = await api.lookupVehicle(formatted);
        if (vehicle) {
          // PIMO : remplir chrono + chassis (vin)
          // POST_REIMMAT : remplir chassis (vin) uniquement
          setFormData(prev => ({
            ...prev,
            vin: vehicle.chassis || '',
            chrono: isPIMO ? (vehicle.chrono || '') : prev.chrono,
          }));
          setVehicleLookup({ loading: false, found: true, notFound: false });
        }
      } catch {
        setVehicleLookup({ loading: false, found: false, notFound: true });
      }
    }
  };

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
    if (confirmingRef.current) return;  // bloquer double appel
    confirmingRef.current = true;
    setShowConfirm(false);
    await submitNow();
    confirmingRef.current = false;
  };

  // L'usager clique "Non" → fermer le popup, rien d'autre
  const handleConfirmNo = () => setShowConfirm(false);

  if (centresLoading) {
    return (
      <Card>
        <div className="loading">
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <div>Chargement en cours...</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
            Le serveur peut prendre jusqu'à 60 secondes à démarrer.
          </div>
        </div>
      </Card>
    );
  }

  if (centresError) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
          <p style={{ color: '#ef4444', marginBottom: '12px' }}>{centresError.message}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px' }}>
            Réessayer
          </button>
        </div>
      </Card>
    );
  }

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
                  <FormField label="Immatriculation *" name="immatriculation" value={formData.immatriculation} onChange={handleImmatriculationChange} onBlur={handleBlur} error={errors.immatriculation} touched={touched.immatriculation} required placeholder="AA-123-XX" />
                  {vehicleLookup.loading && (
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '-12px', marginBottom: '12px' }}>
                      ⏳ Recherche du véhicule...
                    </p>
                  )}
                  {vehicleLookup.found && (
                    <p style={{ fontSize: '12px', color: '#15803d', marginTop: '-12px', marginBottom: '12px' }}>
                      ✅ Véhicule trouvé — champs remplis automatiquement
                    </p>
                  )}
                  {vehicleLookup.notFound && (
                    <p style={{ fontSize: '12px', color: '#92400e', marginTop: '-12px', marginBottom: '12px' }}>
                      ⚠️ Véhicule non trouvé — remplissez les champs manuellement
                    </p>
                  )}
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
                  !formData.prenom || !formData.phone ||
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
