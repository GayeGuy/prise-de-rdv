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
  const [selectedCentre, setSelectedCentre]   = useState(null);
  const [availableDates, setAvailableDates]   = useState([]);
  const [result, setResult]                   = useState(null);
  const [showAlert, setShowAlert]             = useState(null);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [vehicleLookup, setVehicleLookup]     = useState({
    loading: false, found: false, notFound: false,
    hasChrono: false,  // true = dossier PIMO, false = dossier réimmat
  });
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
    { centreId: '', centreType: '', nom: '', prenom: '', phone: '', email: '', date: '', chrono: '', immatriculation: '', vin: '' },
    async (data) => {
      try {
        const appointment = await api.createAppointment(data);
        generatePDF(appointment, selectedCentre);
        setResult(appointment);
        setShowAlert({ type: 'success', text: 'Rendez-vous réservé avec succès !' });
        reset();
        setVehicleLookup({ loading: false, found: false, notFound: false, hasChrono: false });
        setSelectedCentre(null);
        setAvailableDates([]);
      } catch (err) {
        setShowAlert({ type: 'error', text: err.message });
      }
    },
    validateForm
  );

  // ── Lookup immatriculation ──────────────────────────────────────────────
  const handleImmatriculationChange = async (e) => {
    handleChange(e);
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');

    // Reset centre et champs auto si l'immat change
    setFormData(prev => ({ ...prev, chrono: '', vin: '', centreId: '', centreType: '' }));
    setSelectedCentre(null);
    setAvailableDates([]);
    setVehicleLookup({ loading: false, found: false, notFound: false, hasChrono: false });

    if (raw.replace(/-/g, '').length >= 6) {
      setVehicleLookup({ loading: true, found: false, notFound: false, hasChrono: false });
      try {
        const vehicle = await api.lookupVehicle(raw);
        if (vehicle) {
          const hasChrono = !!(vehicle.chrono);
          setFormData(prev => ({
            ...prev,
            vin:    vehicle.chassis || '',
            chrono: vehicle.chrono  || '',
          }));
          setVehicleLookup({ loading: false, found: true, notFound: false, hasChrono });
        }
      } catch {
        setVehicleLookup({ loading: false, found: false, notFound: true, hasChrono: false });
      }
    }
  };

  // ── Filtrage des centres selon le type de dossier ──────────────────────
  // • Véhicule trouvé avec chrono → sites PIMO uniquement
  // • Véhicule trouvé sans chrono → sites POST_REIMMAT uniquement
  // • Véhicule non trouvé → tous les sites (saisie manuelle)
  const filteredCentres = (() => {
    if (!centres) return [];
    if (!vehicleLookup.found && !vehicleLookup.notFound) return []; // pas encore cherché
    if (vehicleLookup.notFound) return centres; // tous les sites
    return centres.filter(c =>
      vehicleLookup.hasChrono ? c.type === 'PIMO' : c.type === 'POST_REIMMAT'
    );
  })();

  const handleCentreChange = (e) => {
    const centreId = e.target.value;
    const centre   = centres?.find(c => c.id === centreId);
    setFormData(prev => ({ ...prev, centreId, centreType: centre?.type || '' }));
    setSelectedCentre(centre);
    setAvailableDates([]);
    if (centreId) {
      api.getCentreAvailability(centreId, 30)
        .then(data => setAvailableDates(data))
        .catch(() => setShowAlert({ type: 'error', text: 'Erreur chargement calendrier' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateOnly()) setShowConfirm(true);
  };

  const handleConfirmYes = async () => {
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    setShowConfirm(false);
    await submitNow();
    confirmingRef.current = false;
  };

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

  const isPIMO           = selectedCentre?.type === 'PIMO';
  const isReimat         = selectedCentre?.type === 'POST_REIMMAT';
  const needsVehicleFields = vehicleLookup.found || vehicleLookup.notFound;

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
            <Button variant="primary" onClick={() => setResult(null)}>
              Nouveau Rendez-vous
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader><h2>📝 Prendre un Rendez-vous</h2></CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>

              {/* ── ÉTAPE 1 : Immatriculation ── */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '8px', padding: '14px 16px', marginBottom: '20px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Étape 1 — Identification du véhicule
                </p>
                <FormField
                  label="Immatriculation *"
                  name="immatriculation"
                  value={formData.immatriculation}
                  onChange={handleImmatriculationChange}
                  onBlur={handleBlur}
                  error={errors.immatriculation}
                  touched={touched.immatriculation}
                  required
                  placeholder="AA-123-XX"
                />
                {vehicleLookup.loading && (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '-8px 0 8px' }}>⏳ Recherche du véhicule...</p>
                )}
                {vehicleLookup.found && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 12px', margin: '-8px 0 8px' }}>
                    <p style={{ fontSize: '13px', color: '#15803d', fontWeight: '600' }}>
                      ✅ Véhicule trouvé — dossier {vehicleLookup.hasChrono ? 'primo-immatriculation' : 'réimmatriculation'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                      Seuls les sites compatibles sont proposés ci-dessous.
                    </p>
                  </div>
                )}
                {vehicleLookup.notFound && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 12px', margin: '-8px 0 8px' }}>
                    <p style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
                      ⚠️ Véhicule non trouvé — saisie manuelle requise
                    </p>
                    <p style={{ fontSize: '12px', color: '#78350f', marginTop: '2px' }}>
                      Tous les sites sont disponibles. Remplissez les champs manuellement.
                    </p>
                  </div>
                )}

                {/* Champs VIN et Chrono — affichés dès qu'on a un résultat */}
                {needsVehicleFields && (
                  <div className="grid-2" style={{ marginTop: '8px' }}>
                    <FormField
                      label="Châssis (VIN) *"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.vin}
                      touched={touched.vin}
                      required
                      placeholder="VF3AB123CD456789"
                      maxLength={17}
                      disabled={vehicleLookup.found && !!formData.vin}
                      style={vehicleLookup.found && formData.vin ? { background: '#f1f5f9', color: '#64748b' } : {}}
                    />
                    {/* Chrono : affiché pour PIMO ou si dossier avec chrono */}
                    {(vehicleLookup.hasChrono || vehicleLookup.notFound) && (
                      <FormField
                        label={vehicleLookup.notFound ? "Numéro Chrono (si primo)" : "Numéro Chrono *"}
                        name="chrono"
                        value={formData.chrono}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.chrono}
                        touched={touched.chrono}
                        required={vehicleLookup.hasChrono}
                        placeholder="ABC123"
                        disabled={vehicleLookup.found && !!formData.chrono}
                        style={vehicleLookup.found && formData.chrono ? { background: '#f1f5f9', color: '#64748b' } : {}}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* ── ÉTAPE 2 : Choix du centre (filtré) ── */}
              {(vehicleLookup.found || vehicleLookup.notFound) && (
                <div style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: '8px', padding: '14px 16px', marginBottom: '20px',
                }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Étape 2 — Choix du centre
                    {vehicleLookup.found && (
                      <span style={{ marginLeft: '8px', background: vehicleLookup.hasChrono ? '#dbeafe' : '#dcfce7', color: vehicleLookup.hasChrono ? '#1e40af' : '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {vehicleLookup.hasChrono ? 'Sites primo uniquement' : 'Sites réimmat uniquement'}
                      </span>
                    )}
                  </p>
                  <FormField label="Centre *" name="centreId">
                    <select
                      name="centreId"
                      value={formData.centreId}
                      onChange={handleCentreChange}
                      onBlur={handleBlur}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: errors.centreId && touched.centreId ? '2px solid #ef4444' : '1px solid #e2e8f0', fontSize: '14px' }}
                    >
                      <option value="">-- Sélectionner un centre --</option>
                      {filteredCentres.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              )}

              {/* ── ÉTAPE 3 : Informations personnelles + Date ── */}
              {selectedCentre && (
                <div style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: '8px', padding: '14px 16px', marginBottom: '20px',
                }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Étape 3 — Vos informations
                  </p>
                  <div className="grid-2">
                    <FormField label="Nom" name="nom" value={formData.nom} onChange={handleChange} onBlur={handleBlur} error={errors.nom} touched={touched.nom} required placeholder="DUPONT" />
                    <FormField label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} onBlur={handleBlur} error={errors.prenom} touched={touched.prenom} required placeholder="JEAN" />
                  </div>
                  <div className="grid-2">
                    <FormField label="Téléphone (10 chiffres)" name="phone" type="tel" value={formData.phone} onChange={handleChange} onBlur={handleBlur} error={errors.phone} touched={touched.phone} required placeholder="0601020304" maxLength={10} />
                    <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} placeholder="jean@example.com" />
                  </div>

                  {/* Photos carte grise */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                      📷 Photos de la carte grise
                    </p>
                    <div className="grid-2">
                      {[
                        { key: 'photoRecto', label: 'Recto *' },
                        { key: 'photoVerso', label: 'Verso *' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                            {label}
                          </label>
                          {formData[key] ? (
                            <div style={{ position: 'relative' }}>
                              <img
                                src={formData[key]}
                                alt={label}
                                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'block' }}
                              />
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, [key]: '' }))}
                                style={{
                                  position: 'absolute', top: '6px', right: '6px',
                                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                                  borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer',
                                  fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >✕</button>
                            </div>
                          ) : (
                            <label style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              height: '120px', border: '2px dashed #cbd5e1', borderRadius: '8px',
                              cursor: 'pointer', background: '#f8fafc', gap: '6px',
                            }}>
                              <span style={{ fontSize: '24px' }}>📸</span>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>Appuyer pour prendre une photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setFormData(prev => ({ ...prev, [key]: ev.target.result }));
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

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

              {selectedCentre && (
                <Button
                  variant="primary" type="submit"
                  disabled={
                    !formData.centreId || !formData.date || !formData.nom ||
                    !formData.prenom || !formData.phone || !formData.immatriculation ||
                    !formData.vin ||
                    (vehicleLookup.hasChrono && !formData.chrono) ||
                    isSubmitting
                  }
                  loading={isSubmitting}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  ✅ Confirmer la Réservation
                </Button>
              )}
            </form>
          </CardBody>
        </Card>
      )}
    </>
  );
}
