/**
 * Configuration des jours fériés de Côte d'Ivoire
 * Fixed holidays + Mobile holidays (calculated from Easter)
 */

// Jours fériés fixes
const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: "Jour de l'An" },
  { month: 5, day: 1, name: "Fête du Travail" },
  { month: 8, day: 7, name: "Fête Nationale" },
  { month: 8, day: 15, name: "Assomption" },
  { month: 11, day: 1, name: "Toussaint" },
  { month: 11, day: 15, name: "Journée Nationale de la Paix" },
  { month: 12, day: 25, name: "Noël" }
];

// Calcul de la date de Pâques (algorithme Computus)
function calculateEaster(year) {
  let a = year % 19;
  let b = Math.floor(year / 100);
  let c = year % 100;
  let d = Math.floor(b / 4);
  let e = b % 4;
  let f = Math.floor((b + 8) / 25);
  let g = Math.floor((b - f + 1) / 3);
  let h = (19 * a + b - d - g + 15) % 30;
  let i = Math.floor(c / 4);
  let k = c % 4;
  let l = (32 + 2 * e + 2 * i - h - k) % 7;
  let m = Math.floor((a + 11 * h + 22 * l) / 451);
  let month = Math.floor((h + l - 7 * m + 114) / 31);
  let day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return { month, day };
}

// Ajouter des jours à une date
function addDays(month, day, daysToAdd) {
  const date = new Date(2000, month - 1, day);
  date.setDate(date.getDate() + daysToAdd);
  return { month: date.getMonth() + 1, day: date.getDate() };
}

// Obtenir les jours fériés mobiles pour une année
function getMobileHolidays(year) {
  const easter = calculateEaster(year);
  
  return [
    { ...addDays(easter.month, easter.day, 1), name: "Lundi de Pâques" },
    { ...addDays(easter.month, easter.day, 39), name: "Ascension" },
    { ...addDays(easter.month, easter.day, 50), name: "Lundi de Pentecôte" }
  ];
}

// Obtenir tous les jours fériés pour une année
function getHolidaysForYear(year) {
  const holidays = [];
  
  // Jours fériés fixes
  FIXED_HOLIDAYS.forEach(holiday => {
    holidays.push({
      date: `${year}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`,
      name: holiday.name,
      type: 'fixed'
    });
  });
  
  // Jours fériés mobiles
  getMobileHolidays(year).forEach(holiday => {
    const month = String(holiday.month).padStart(2, '0');
    const day = String(holiday.day).padStart(2, '0');
    holidays.push({
      date: `${year}-${month}-${day}`,
      name: holiday.name,
      type: 'mobile'
    });
  });
  
  return holidays;
}

// Vérifier si une date est un jour férié
function isHoliday(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const holidays = getHolidaysForYear(year);
  
  return holidays.some(h => h.date === dateStr);
}

// Obtenir le nom du jour férié
function getHolidayName(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const holidays = getHolidaysForYear(year);
  const holiday = holidays.find(h => h.date === dateStr);
  
  return holiday ? holiday.name : null;
}

export {
  FIXED_HOLIDAYS,
  calculateEaster,
  getMobileHolidays,
  getHolidaysForYear,
  isHoliday,
  getHolidayName
};
