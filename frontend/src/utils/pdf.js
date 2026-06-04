export function generatePDF(appointment, centre) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
        .header h1 { color: #3b82f6; font-size: 28px; margin-bottom: 5px; }
        .header p { color: #64748b; font-size: 14px; }
        .content { margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section h3 { color: #0f172a; font-size: 14px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-row { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .value { color: #0f172a; font-size: 16px; font-weight: 500; margin-top: 4px; }
        .reference { background: #f0f4ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .reference .label { color: #3b82f6; }
        .reference .value { color: #1e40af; font-size: 20px; font-weight: 700; font-family: monospace; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
        .status { display: inline-block; background: #ecfdf5; color: #065f46; padding: 8px 12px; border-radius: 4px; font-weight: 600; font-size: 13px; }
        @media print { 
          body { padding: 0; }
          .container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Confirmation de Rendez-vous</h1>
          <p>Plaques d'immatriculation</p>
        </div>

        <div class="reference">
          <div class="label">Numéro de Référence</div>
          <div class="value">${appointment.reference}</div>
        </div>

        <div class="content">
          <div class="section">
            <h3>Centre</h3>
            <div class="info-grid">
              <div class="info-row">
                <div class="label">Nom du centre</div>
                <div class="value">${centre.name}</div>
              </div>
              <div class="info-row">
                <div class="label">Type de service</div>
                <div class="value">Pose de plaques</div>
              </div>
              <div class="info-row">
                <div class="label">Région</div>
                <div class="value">${centre.region}</div>
              </div>
              <div class="info-row">
                <div class="label">Adresse</div>
                <div class="value">${centre.address}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Informations Personnelles</h3>
            <div class="info-grid">
              <div class="info-row">
                <div class="label">Prénom</div>
                <div class="value">${appointment.prenom}</div>
              </div>
              <div class="info-row">
                <div class="label">Nom</div>
                <div class="value">${appointment.nom}</div>
              </div>
              <div class="info-row">
                <div class="label">Téléphone</div>
                <div class="value">${appointment.phone}</div>
              </div>
              <div class="info-row">
                <div class="label">Email</div>
                <div class="value">${appointment.email || 'Non fourni'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Détails du Rendez-vous</h3>
            <div class="info-grid">
              <div class="info-row">
                <div class="label">Date</div>
                <div class="value">${new Date(appointment.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-row">
                <div class="label">Statut</div>
                <div style="margin-top: 4px;"><span class="status">✅ Réservé</span></div>
              </div>
              ${appointment.chrono ? `
              <div class="info-row">
                <div class="label">Numéro Chrono</div>
                <div class="value">${appointment.chrono}</div>
              </div>
              ` : ''}
              ${appointment.vin ? `
              <div class="info-row">
                <div class="label">VIN</div>
                <div class="value">${appointment.vin}</div>
              </div>
              ` : ''}
              ${appointment.immatriculation ? `
              <div class="info-row">
                <div class="label">Immatriculation</div>
                <div class="value">${appointment.immatriculation}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="section" style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e;">ℹ️ Important</h3>
            <p style="color: #78350f; font-size: 13px; line-height: 1.6; margin-top: 8px;">
              Veuillez arriver 15 minutes avant l'heure de votre rendez-vous avec les documents requis. 
              En cas d'empêchement, annulez votre rendez-vous au moins 24 heures à l'avance en utilisant 
              votre numéro de référence.
            </p>
          </div>
        </div>

        <div class="footer">
          <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>Conservez ce document. Vous en aurez besoin le jour de votre rendez-vous.</p>
        </div>
      </div>

      <script>
        window.print();
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}
