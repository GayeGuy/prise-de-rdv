export function generatePDF(appointment, centre) {

  // Les logos sont servis depuis /public — accessibles via URL absolue
  const origin = window.location.origin;
  const LOGO_EMUCI = `${origin}/emuci-logo.png`;
  const LOGO_ICON  = `${origin}/emuci-icon.png`;

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

    .header { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E5E7EB; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .logo-full img { height: 48px; width: auto; display: block; }
    .header-divider { width: 1px; height: 40px; background: #E5E7EB; }
    .header-titles .app-name { font-family: 'Montserrat', sans-serif; font-size: 19px; font-weight: 700; color: #111827; line-height: 1; }
    .header-titles .app-name span { color: #2563EB; }
    .header-titles .app-sub  { font-size: 11px; color: #6B7280; margin-top: 3px; }
    .header-titles .app-sub2 { font-size: 10px; color: #9CA3AF; margin-top: 1px; }
    .header-icon-box { width: 44px; height: 44px; background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .header-icon-box img { width: 30px; height: 30px; object-fit: contain; }

    .ref-section { margin: 14px 24px; border: 1.5px solid #E5E7EB; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .ref-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; margin-bottom: 4px; }
    .ref-value { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700; color: #111827; letter-spacing: 1.5px; }
    .ref-status { display: flex; align-items: center; gap: 6px; background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 20px; padding: 5px 12px; font-size: 11px; font-weight: 700; color: #15803D; }
    .ref-status .dot { width: 8px; height: 8px; background: #22C55E; border-radius: 50%; }

    .two-col { margin: 0 24px 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
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

    .detail-grid { padding: 12px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
    .detail-item { display: flex; align-items: flex-start; gap: 8px; }
    .detail-item i { font-size: 11px; color: #60A5FA; margin-top: 3px; width: 14px; text-align: center; }
    .d-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: #9CA3AF; margin-bottom: 2px; }
    .d-value { font-size: 12px; font-weight: 600; color: #111827; }

    .docs-list { padding: 10px 14px; }
    .doc-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 12px; color: #374151; border-bottom: 1px solid #F3F4F6; }
    .doc-item:last-child { border-bottom: none; }
    .doc-item i { font-size: 11px; color: #2563EB; }

    .important-box { margin: 0 24px 14px; border: 1.5px solid #FDE68A; border-radius: 8px; overflow: hidden; }
    .important-header { background: #FFFBEB; border-bottom: 1px solid #FDE68A; padding: 8px 12px; display: flex; align-items: center; gap: 7px; }
    .important-header i { font-size: 11px; color: #F59E0B; }
    .important-title { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #92400E; }
    .important-body { padding: 10px 14px; }
    .important-body p { font-size: 11px; color: #78350F; line-height: 1.7; margin-bottom: 4px; }
    .important-body p:last-child { margin-bottom: 0; }

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
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
