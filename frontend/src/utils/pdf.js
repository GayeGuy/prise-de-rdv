export function generatePDF(appointment, centre) {

  const LOGO_EMUCI = "data:image/jpeg;base64,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M8vVx+cfu8AoGvrKqvq31dZPJPPIcue85JX4LJqtol7NzAMEfIanqeKvwUYa7eSnE/ny6IiIsxXkRERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERF+tLPPS1DKimmfDNGcsex2HNPkVpumtpNHU0fY9WUjZzH77JxEHh7m8xlvc7wI5enVZaiuUldNSOvGcjqOB+Cr1FLHUCzx8eKuGtteXLUBfSwb1FbunCa73pB9c9/p09eqp6IoaiolqHl8puV3FCyFuFgsEREUKlREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREX//Z";
  const LOGO_ICON  = "data:image/png;base64,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";

  const dateStr = new Date(appointment.date).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const now = new Date();
  const generatedDate = now.toLocaleDateString('fr-FR');
  const generatedTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const qrData = encodeURIComponent(`${appointment.reference}|${appointment.date}|${appointment.nom}|${appointment.prenom}`);
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=000000&bgcolor=ffffff&data=${qrData}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>MonRDVPlaque — ${appointment.reference}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background: #F8FAFC; color: #374151; padding: 20px; }
    .page { max-width: 680px; margin: 0 auto; background: white; }
    .top-band { background: #2563EB; height: 6px; border-radius: 4px 4px 0 0; }
    .bottom-band { background: #2563EB; height: 4px; border-radius: 0 0 4px 4px; }

    /* Header */
    .header { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E5E7EB; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .logo-full img { height: 48px; width: auto; display: block; }
    .header-divider { width: 1px; height: 40px; background: #E5E7EB; }
    .header-titles .app-name { font-family: 'Montserrat', sans-serif; font-size: 19px; font-weight: 700; color: #111827; line-height: 1; }
    .header-titles .app-name span { color: #2563EB; }
    .header-titles .app-sub  { font-size: 11px; color: #6B7280; margin-top: 3px; }
    .header-titles .app-sub2 { font-size: 10px; color: #9CA3AF; margin-top: 1px; }
    .header-icon-box { width: 44px; height: 44px; background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .header-icon-box img { width: 26px; height: 26px; object-fit: contain; }

    /* Référence */
    .ref-section { margin: 14px 24px; border: 1.5px solid #E5E7EB; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .ref-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; margin-bottom: 4px; }
    .ref-value { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700; color: #111827; letter-spacing: 1.5px; }
    .ref-status { display: flex; align-items: center; gap: 6px; background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 20px; padding: 5px 12px; font-size: 11px; font-weight: 700; color: #15803D; }
    .ref-status .dot { width: 8px; height: 8px; background: #22C55E; border-radius: 50%; }

    /* Grille 2 col */
    .two-col { margin: 0 24px 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    /* Cartes */
    .card { border: 1.5px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
    .card-full { margin: 0 24px 14px; border: 1.5px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
    .card-header { background: #F9FAFB; border-bottom: 1px solid #E5E7EB; padding: 8px 12px; display: flex; align-items: center; gap: 7px; }
    .card-header i { font-size: 11px; color: #2563EB; width: 14px; text-align: center; }
    .card-title { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #374151; }
    .card-body { padding: 12px; }
    .field { margin-bottom: 8px; }
    .field:last-child { margin-bottom: 0; }
    .field-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: #9CA3AF; margin-bottom: 2px; }
    .field-value { font-size: 12px; font-weight: 600; color: #111827; }

    /* Détails */
    .detail-grid { padding: 12px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
    .detail-item { display: flex; align-items: flex-start; gap: 8px; }
    .detail-item i { font-size: 11px; color: #60A5FA; margin-top: 3px; width: 14px; text-align: center; }
    .d-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: #9CA3AF; margin-bottom: 2px; }
    .d-value { font-size: 12px; font-weight: 600; color: #111827; }

    /* Documents */
    .docs-list { padding: 10px 14px; }
    .doc-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 12px; color: #374151; border-bottom: 1px solid #F3F4F6; }
    .doc-item:last-child { border-bottom: none; }
    .doc-item i { font-size: 11px; color: #2563EB; }

    /* Important */
    .important-box { margin: 0 24px 14px; border: 1.5px solid #FDE68A; border-radius: 8px; overflow: hidden; }
    .important-header { background: #FFFBEB; border-bottom: 1px solid #FDE68A; padding: 8px 12px; display: flex; align-items: center; gap: 7px; }
    .important-header i { font-size: 11px; color: #F59E0B; }
    .important-title { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #92400E; }
    .important-body { padding: 10px 14px; }
    .important-body p { font-size: 11px; color: #78350F; line-height: 1.7; margin-bottom: 4px; }
    .important-body p:last-child { margin-bottom: 0; }

    /* Footer */
    .footer { margin: 0 24px 20px; border: 1.5px solid #E5E7EB; border-radius: 8px; overflow: hidden; display: grid; grid-template-columns: auto 1fr; }
    .footer-qr { padding: 14px; border-right: 1px solid #E5E7EB; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .qr-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280; text-align: center; }
    .footer-info { padding: 14px 16px; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
    .footer-row { font-size: 11px; color: #374151; display: flex; align-items: center; gap: 6px; }
    .footer-row i { font-size: 11px; color: #60A5FA; width: 14px; }
    .footer-copy { margin-top: 6px; padding-top: 6px; border-top: 1px solid #F3F4F6; font-size: 10px; color: #9CA3AF; }

    @media print { body { background: white; padding: 0; } .page { box-shadow: none; } }
  </style>
</head>
<body>
<div class="page">
  <div class="top-band"></div>

  <div class="header">
    <div class="header-left">
      <div class="logo-full"><img src="${LOGO_EMUCI}" alt="EXPRESS MULTISERVICES CI" /></div>
      <div class="header-divider"></div>
      <div class="header-titles">
        <div class="app-name">Mon<span>RDV</span>Plaque</div>
        <div class="app-sub">Confirmation de Rendez-vous</div>
        <div class="app-sub2">Plaques d'immatriculation</div>
      </div>
    </div>
    <div class="header-icon-box">
      <img src="${LOGO_ICON}" alt="icon" />
    </div>
  </div>

  <div class="ref-section">
    <div>
      <div class="ref-label">Référence du rendez-vous</div>
      <div class="ref-value">${appointment.reference}</div>
    </div>
    <div class="ref-status"><div class="dot"></div>RÉSERVÉ</div>
  </div>

  <div class="two-col">
    <div class="card">
      <div class="card-header"><i class="fa-solid fa-building"></i><span class="card-title">Centre</span></div>
      <div class="card-body">
        <div class="field"><div class="field-value" style="font-size:13px;">${centre?.name || '—'}</div></div>
        <div class="field"><div class="field-label">Région</div><div class="field-value">${centre?.region || '—'}</div></div>
        <div class="field"><div class="field-label">Adresse</div><div class="field-value">${centre?.address || '—'}</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><i class="fa-solid fa-user"></i><span class="card-title">Informations client</span></div>
      <div class="card-body">
        <div class="field"><div class="field-label">Nom</div><div class="field-value">${appointment.nom} ${appointment.prenom}</div></div>
        <div class="field"><div class="field-label">Téléphone</div><div class="field-value">${appointment.phone}</div></div>
        <div class="field"><div class="field-label">Email</div><div class="field-value">${appointment.email || 'Non fourni'}</div></div>
      </div>
    </div>
  </div>

  <div class="card-full">
    <div class="card-header"><i class="fa-solid fa-calendar-days"></i><span class="card-title">Détails du rendez-vous</span></div>
    <div class="detail-grid">
      <div class="detail-item"><i class="fa-regular fa-calendar"></i><div><div class="d-label">Date</div><div class="d-value">${dateFormatted}</div></div></div>
      ${appointment.chrono ? `<div class="detail-item"><i class="fa-solid fa-bookmark"></i><div><div class="d-label">Numéro Chrono</div><div class="d-value">${appointment.chrono}</div></div></div>` : ''}
      ${appointment.vin ? `<div class="detail-item"><i class="fa-solid fa-car"></i><div><div class="d-label">VIN</div><div class="d-value">${appointment.vin}</div></div></div>` : ''}
      ${appointment.immatriculation ? `<div class="detail-item"><i class="fa-solid fa-hashtag"></i><div><div class="d-label">Immatriculation</div><div class="d-value">${appointment.immatriculation}</div></div></div>` : ''}
    </div>
  </div>

  <div class="card-full">
    <div class="card-header"><i class="fa-solid fa-file-lines"></i><span class="card-title">Documents à présenter</span></div>
    <div class="docs-list">
      <div class="doc-item"><i class="fa-solid fa-square-check"></i> Carte Nationale d'Identité</div>
      <div class="doc-item"><i class="fa-solid fa-square-check"></i> Carte grise ou attestation</div>
      <div class="doc-item"><i class="fa-solid fa-square-check"></i> Reçu de paiement</div>
      <div class="doc-item"><i class="fa-solid fa-square-check"></i> Présence physique du véhicule (si requis)</div>
    </div>
  </div>

  <div class="important-box">
    <div class="important-header"><i class="fa-solid fa-triangle-exclamation"></i><span class="important-title">Important</span></div>
    <div class="important-body">
      <p>Veuillez vous présenter <strong>15 minutes avant</strong> l'heure prévue avec les documents requis.</p>
      <p>En cas d'empêchement, merci d'annuler votre rendez-vous au moins <strong>24 heures à l'avance</strong> en utilisant votre numéro de référence.</p>
    </div>
  </div>

  <div class="footer">
    <div class="footer-qr">
      <div class="qr-label">QR Code de contrôle</div>
      <img src="${qrUrl}" width="90" height="90" alt="QR Code" />
    </div>
    <div class="footer-info">
      <div class="footer-row"><i class="fa-regular fa-clock"></i> Généré le : ${generatedDate} à ${generatedTime}</div>
      <div class="footer-row"><i class="fa-solid fa-shield-halved"></i> ${appointment.reference}</div>
      <div class="footer-copy">MonRDVPlaque © ${new Date().getFullYear()} &nbsp;·&nbsp; Solution EMUCI<br>Conservez ce document. Vous en aurez besoin le jour de votre rendez-vous.</div>
    </div>
  </div>

  <div class="bottom-band"></div>
</div>
<script>document.title = 'MonRDVPlaque — ${appointment.reference}';</script>
</body>
</html>\`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
