import { useState, useEffect } from 'react';
import { api } from '../api';

export function PhotosModal({ appointmentId, reference, onClose }) {
  const [photos, setPhotos]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [zoom, setZoom]       = useState(null); // 'recto' | 'verso'

  useEffect(() => {
    api.getAppointmentPhotos(appointmentId)
      .then(setPhotos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: '12px', padding: '24px',
          maxWidth: zoom ? '90vw' : '600px', width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>📷 Photos carte grise</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{reference}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}
          >✕</button>
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>⏳ Chargement...</p>}
        {error   && <p style={{ textAlign: 'center', color: '#ef4444', padding: '24px' }}>❌ {error}</p>}

        {photos && !loading && (
          <>
            {!photos.photoRecto && !photos.photoVerso && (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                Aucune photo fournie pour ce rendez-vous.
              </p>
            )}

            {zoom ? (
              // Vue zoomée
              <div>
                <button
                  onClick={() => setZoom(null)}
                  style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', marginBottom: '12px', fontSize: '13px' }}
                >
                  ← Retour
                </button>
                <img
                  src={zoom === 'recto' ? photos.photoRecto : photos.photoVerso}
                  alt={zoom}
                  style={{ width: '100%', borderRadius: '8px', display: 'block' }}
                />
              </div>
            ) : (
              // Vue 2 colonnes
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { key: 'recto', label: 'Recto', src: photos.photoRecto },
                  { key: 'verso', label: 'Verso', src: photos.photoVerso },
                ].map(({ key, label, src }) => (
                  <div key={key}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {label}
                    </p>
                    {src ? (
                      <div style={{ position: 'relative', cursor: 'zoom-in' }} onClick={() => setZoom(key)}>
                        <img
                          src={src}
                          alt={`carte grise ${label}`}
                          style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                        >
                          <span style={{ background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', opacity: 0.9 }}>
                            🔍 Agrandir
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        height: '120px', border: '2px dashed #e2e8f0', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#94a3b8', fontSize: '13px',
                      }}>
                        Non fourni
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
