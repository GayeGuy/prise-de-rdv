export function generatePDF(appointment, centre) {

  const dateStr = new Date(appointment.date).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const now = new Date();
  const generatedAt = `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`;

  // QR code simple via API publique
  const qrData = encodeURIComponent(`MonRDVPlaque|${appointment.reference}|${appointment.date}|${appointment.nom} ${appointment.prenom}`);
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrData}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MonRDVPlaque — ${appointment.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #f0f4f8;
      padding: 24px 16px;
      color: #1e293b;
    }

    .page {
      max-width: 680px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }

    /* ── Header ── */
    .header {
      padding: 20px 28px 18px;
      border-bottom: 1px solid #e8edf2;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left { display: flex; align-items: center; gap: 14px; }

    .logo-box {
      width: 52px; height: 52px;
      background: #eef4ff;
      border: 2px solid #c7d9f8;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
    }

    .brand-name {
      font-size: 22px; font-weight: 700; color: #1e293b; line-height: 1;
    }
    .brand-name span { color: #3b82f6; }

    .brand-sub { font-size: 12px; color: #64748b; margin-top: 3px; }

    .header-icon {
      width: 48px; height: 48px;
      background: #dbeafe;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
    }

    /* ── Title section ── */
    .title-section {
      padding: 24px 28px 20px;
      border-bottom: 1px solid #e8edf2;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .title-icon {
      width: 48px; height: 48px;
      background: #f1f5f9;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .title-section h1 { font-size: 24px; font-weight: 700; color: #0f172a; }
    .title-section p  { font-size: 13px; color: #64748b; margin-top: 2px; }

    /* ── Reference box ── */
    .reference-box {
      margin: 20px 28px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ref-label { font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .ref-value { font-size: 20px; font-weight: 800; color: #0f172a; font-family: 'Courier New', monospace; letter-spacing: 1px; }

    .ref-shield {
      width: 36px; height: 36px;
      border: 2px solid #e2e8f0;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: #94a3b8;
    }

    /* ── Sections ── */
    .body { padding: 0 28px 24px; }

    .section {
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 14px;
      overflow: hidden;
    }

    .section-header {
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #e8edf2;
      background: #fafbfc;
    }

    .section-icon {
      width: 30px; height: 30px;
      background: #eef4ff;
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
    }

    .section-header h2 {
      font-size: 13px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.6px;
      color: #334155;
    }

    .section-body {
      padding: 14px 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 20px;
    }

    .section-body.single { grid-template-columns: 1fr; }

    .field-label {
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.6px;
      color: #94a3b8; margin-bottom: 3px;
    }

    .field-value {
      font-size: 14px; font-weight: 500; color: #1e293b;
    }

    /* Statut badge */
    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: #dcfce7; color: #15803d;
      padding: 4px 10px; border-radius: 6px;
      font-size: 12px; font-weight: 700;
    }

    /* ── Important ── */
    .important {
      background: #fffbeb;
      border: 1.5px solid #fde68a;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 14px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .important-icon {
      width: 28px; height: 28px;
      background: #f59e0b;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0; color: white; font-weight: 700;
    }

    .important h3 { font-size: 12px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; }
    .important p  { font-size: 12px; color: #78350f; line-height: 1.6; }

    /* ── Footer ── */
    .footer {
      padding: 14px 28px;
      border-top: 1px solid #e8edf2;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-left { display: flex; align-items: center; gap: 8px; }
    .footer-icon { font-size: 18px; color: #94a3b8; }
    .footer-text { font-size: 11px; color: #64748b; line-height: 1.5; }

    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="logo-box">🏢</div>
        <div>
          <div class="brand-name">Mon<span>RDV</span>Plaque</div>
          <div class="brand-sub">Votre rendez-vous en toute simplicité</div>
        </div>
      </div>
      <div class="header-icon">📅</div>
    </div>

    <!-- Title -->
    <div class="title-section">
      <div class="title-icon">📋</div>
      <div>
        <h1>Confirmation de Rendez-vous</h1>
        <p>Plaques d'immatriculation</p>
      </div>
    </div>

    <!-- Référence -->
    <div class="reference-box">
      <div>
        <div class="ref-label">Numéro de référence</div>
        <div class="ref-value">${appointment.reference}</div>
      </div>
      <div class="ref-shield">🛡</div>
    </div>

    <!-- Corps -->
    <div class="body">

      <!-- Centre -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🏛</div>
          <h2>Centre</h2>
        </div>
        <div class="section-body">
          <div>
            <div class="field-label">Nom du centre</div>
            <div class="field-value">${centre?.name || '—'}</div>
          </div>
          <div>
            <div class="field-label">Type de service</div>
            <div class="field-value">Pose de plaques</div>
          </div>
          <div>
            <div class="field-label">Région</div>
            <div class="field-value">${centre?.region || '—'}</div>
          </div>
          <div>
            <div class="field-label">Adresse</div>
            <div class="field-value">${centre?.address || '—'}</div>
          </div>
        </div>
      </div>

      <!-- Informations personnelles -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">👤</div>
          <h2>Informations personnelles</h2>
        </div>
        <div class="section-body">
          <div>
            <div class="field-label">Prénom</div>
            <div class="field-value">${appointment.prenom}</div>
          </div>
          <div>
            <div class="field-label">Nom</div>
            <div class="field-value">${appointment.nom}</div>
          </div>
          <div>
            <div class="field-label">Téléphone</div>
            <div class="field-value">${appointment.phone}</div>
          </div>
          <div>
            <div class="field-label">Email</div>
            <div class="field-value">${appointment.email || 'Non fourni'}</div>
          </div>
        </div>
      </div>

      <!-- Détails RDV -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📆</div>
          <h2>Détails du rendez-vous</h2>
        </div>
        <div class="section-body">
          <div>
            <div class="field-label">📅 Date</div>
            <div class="field-value">${dateStr}</div>
          </div>
          <div>
            <div class="field-label">Statut</div>
            <div class="field-value">
              <span class="status-badge">✅ Réservé</span>
            </div>
          </div>
          ${appointment.chrono ? `
          <div>
            <div class="field-label">Numéro Chrono</div>
            <div class="field-value">${appointment.chrono}</div>
          </div>` : ''}
          ${appointment.vin ? `
          <div>
            <div class="field-label">VIN</div>
            <div class="field-value">${appointment.vin}</div>
          </div>` : ''}
          ${appointment.immatriculation ? `
          <div>
            <div class="field-label">🔢 Immatriculation</div>
            <div class="field-value">${appointment.immatriculation}</div>
          </div>` : ''}
        </div>
      </div>

      <!-- Important -->
      <div class="important">
        <div class="important-icon">!</div>
        <div>
          <h3>Important</h3>
          <p>Veuillez arriver 15 minutes avant l'heure de votre rendez-vous avec les documents requis.
          En cas d'empêchement, annulez votre rendez-vous au moins 24 heures à l'avance en utilisant
          votre numéro de référence.</p>
        </div>
      </div>

    </div><!-- /body -->

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <div class="footer-icon">✅</div>
        <div class="footer-text">
          <div>Généré le ${generatedAt}</div>
          <div>Conservez ce document. Vous en aurez besoin le jour de votre rendez-vous.</div>
        </div>
      </div>
      <img src="${qrUrl}" width="80" height="80" alt="QR Code" style="border-radius:6px;" />
    </div>

  </div>

  <script>
    document.title = 'MonRDVPlaque — ${appointment.reference}';
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
