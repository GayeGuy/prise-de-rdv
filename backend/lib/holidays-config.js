/**
 * Configuration des jours ouvrables par centre
 * Supports: L,M,M,J,V,S,D + JF (Jour Férié)
 */

// Structure pour un centre
const CENTRE_WORKDAYS_CONFIG = {
  // Jours ouvrables normaux : L,M,M,J,V,S,D (septet français)
  workDays: ["L", "M", "M", "J", "V"],  // Lundi à Vendredi par défaut
  
  // Inclure les jours fériés ? (true = JF considéré comme fermé)
  includeHolidays: true,
  
  // Jours exceptionnellement ouverts (override les fermetures)
  exceptionallyOpen: [
    // Format : "YYYY-MM-DD"
    // Exemple : "2026-06-02"  (ouvert même si JF ou non-workday)
  ],
  
  // Jours exceptionnellement fermés (override les ouvertures)
  exceptionallyClosed: [
    // Format : "YYYY-MM-DD"
    // Exemple : "2026-06-05"  (fermé même si normal workday)
  ]
};

/**
 * Vérifier si un jour est ouvrable
 */
function isDayOpen(dateStr, centreConfig, holidays) {
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = date.getUTCDay();
  const dayLetter = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][dayOfWeek];
  
  // 1. Vérifier les jours exceptionnellement fermés (priority max)
  if (centreConfig.exceptionallyClosed?.includes(dateStr)) {
    return false;
  }
  
  // 2. Vérifier les jours exceptionnellement ouverts (priority élevée)
  if (centreConfig.exceptionallyOpen?.includes(dateStr)) {
    return true;
  }
  
  // 3. Vérifier si c'est un jour férié
  if (centreConfig.includeHolidays && holidays?.includes(dateStr)) {
    return false;
  }
  
  // 4. Vérifier les jours ouvrables normaux
  return centreConfig.workDays.includes(dayLetter);
}

export {
  CENTRE_WORKDAYS_CONFIG,
  isDayOpen
};
