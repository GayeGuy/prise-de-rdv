import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export function VehiclesImportTab() {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState(null);
  const [message, setMessage]     = useState(null);
  const [search, setSearch]       = useState('');
  const fileRef = useRef(null);

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.getVehicles();
      setVehicles(data || []);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally { setLoading(false); }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Détecter le séparateur (virgule ou point-virgule)
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase()
      .replace(/['"]/g, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // supprimer accents
    );

    // Mapping flexible des colonnes
    const idx = {
      chrono:        headers.findIndex(h => h.includes('chrono')),
      chassis:       headers.findIndex(h => h.includes('chassis') || h.includes('vin')),
      immatriculation: headers.findIndex(h => h.includes('immat')),
    };

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.every(c => !c)) continue;
      rows.push({
        chrono:          idx.chrono >= 0        ? cols[idx.chrono] || ''        : '',
        chassis:         idx.chassis >= 0       ? cols[idx.chassis] || ''       : '',
        immatriculation: idx.immatriculation >= 0 ? cols[idx.immatriculation] || '' : '',
      });
    }
    return rows;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null);
    setMessage(null);
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        if (rows.length === 0) {
          setMessage({ type: 'error', text: 'Fichier vide ou format incorrect' });
          setImporting(false);
          return;
        }
        const res = await api.importVehicles(rows);
        setResult(res);
        setMessage({ type: 'success', text: `Import terminé : ${res.added} ajoutés, ${res.updated} mis à jour` });
        loadVehicles();
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setImporting(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Supprimer toute la base véhicules ? Cette action est irréversible.')) return;
    try {
      await api.deleteAllVehicles();
      setVehicles([]);
      setMessage({ type: 'success', text: 'Base véhicules vidée' });
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const filtered = vehicles.filter(v =>
    !search ||
    v.immatriculation?.includes(search.toUpperCase()) ||
    v.chrono?.includes(search.toUpperCase()) ||
    v.chassis?.includes(search.toUpperCase())
  );

  return (
    <div className="card">
      <h3>🚗 Base véhicules — Import CSV</h3>

      {message && (
        <div className={`alert ${message.type}`} style={{ marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      {/* Zone import */}
      <div style={{
        border: '2px dashed #cbd5e1', borderRadius: '10px',
        padding: '24px', textAlign: 'center', marginBottom: '20px',
        background: '#f8fafc',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>
          Fichier CSV avec les colonnes : <strong>chrono</strong>, <strong>chassis</strong>, <strong>immatriculation</strong>
        </p>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>
          Séparateur virgule ou point-virgule — encodage UTF-8
        </p>
        <label style={{
          display: 'inline-block', padding: '10px 24px',
          background: '#3b82f6', color: 'white', borderRadius: '8px',
          cursor: 'pointer', fontWeight: '600', fontSize: '14px',
        }}>
          {importing ? '⏳ Import en cours...' : '📤 Choisir un fichier CSV'}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            disabled={importing}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Résultat import */}
      {result && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
          textAlign: 'center',
        }}>
          {[
            ['Total', result.total, '#3b82f6'],
            ['Ajoutés', result.added, '#10b981'],
            ['Mis à jour', result.updated, '#f59e0b'],
            ['Erreurs', result.errors, '#ef4444'],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize: '22px', fontWeight: '700', color }}>{val}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Barre recherche + compteur + supprimer */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
        <input
          type="text"
          placeholder="Rechercher immat, chrono, chassis..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
        />
        <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
          {filtered.length} / {vehicles.length} véhicules
        </span>
        {vehicles.length > 0 && (
          <button
            onClick={handleDeleteAll}
            style={{ background: '#ef4444', padding: '8px 14px', fontSize: '12px', flexShrink: 0 }}
          >
            🗑 Vider
          </button>
        )}
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="loading">Chargement...</div>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
          {vehicles.length === 0 ? 'Aucun véhicule importé' : 'Aucun résultat'}
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Immatriculation</th>
                <th>Chrono</th>
                <th>Chassis (VIN)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: '600' }}>{v.immatriculation || '—'}</td>
                  <td>{v.chrono || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{v.chassis || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
              Affichage limité aux 200 premiers résultats
            </p>
          )}
        </div>
      )}

      {/* Modèle CSV téléchargeable */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
        <button
          onClick={() => {
            const csv = 'chrono,chassis,immatriculation\nABC123,VF3AB123CD456789,AA-123-XX\nDEF456,WBA1234567890,BB-456-YY';
            const link = document.createElement('a');
            link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
            link.download = 'modele_import_vehicules.csv';
            link.click();
          }}
          style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', fontSize: '13px' }}
        >
          📥 Télécharger le modèle CSV
        </button>
      </div>
    </div>
  );
}
