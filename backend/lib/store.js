/**
 * store.js — Couche données PostgreSQL (Neon)
 * Remplace l'ancien store JSON en mémoire.
 */
import { query } from './db.js';
import crypto from 'crypto';

function generateId()        { return crypto.randomBytes(8).toString('hex'); }
function generateReference() { return 'RDV-' + crypto.randomBytes(6).toString('hex').toUpperCase(); }

// ── Helpers ────────────────────────────────────────────────────────────────

function rowToCentre(r) {
  if (!r) return null;
  return {
    id: r.id, code: r.code, name: r.name, type: r.type,
    region: r.region, commune: r.commune, address: r.address,
    dailyCapacity: r.daily_capacity,
    workDays: r.work_days,
    includeHolidays: r.include_holidays,
    status: r.status,
  };
}

function rowToAgent(r) {
  if (!r) return null;
  return {
    id: r.id, username: r.username, password: r.password,
    name: r.name, email: r.email, role: r.role,
    centreId: r.centre_id, status: r.status,
  };
}

function rowToAppointment(r) {
  if (!r) return null;
  return {
    id: r.id, reference: r.reference,
    centreId: r.centre_id,
    nom: r.nom, prenom: r.prenom, phone: r.phone, email: r.email,
    date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
    chrono: r.chrono, immatriculation: r.immatriculation, vin: r.vin,
    status: r.status,
    photoRecto: r.photo_recto, photoVerso: r.photo_verso,
    createdAt: r.created_at,
  };
}

// ── Centres ────────────────────────────────────────────────────────────────

export async function getCentres() {
  const { rows } = await query(`SELECT * FROM centres WHERE status='active' ORDER BY name`);
  return rows.map(rowToCentre);
}

export async function getCentreById(id) {
  const { rows } = await query(`SELECT * FROM centres WHERE id=$1`, [id]);
  return rowToCentre(rows[0]);
}

export async function createCentre(data) {
  const id = generateId();
  const { rows } = await query(`
    INSERT INTO centres (id,code,name,type,region,commune,address,daily_capacity,work_days,include_holidays,status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active') RETURNING *`,
    [id, data.code, data.name, data.type||'PIMO', data.region||'', data.commune||'',
     data.address||'', data.dailyCapacity||50,
     JSON.stringify(data.workDays||['L','M','M','J','V']),
     data.includeHolidays !== false]
  );
  return rowToCentre(rows[0]);
}

export async function updateCentre(id, data) {
  const { rows } = await query(`
    UPDATE centres SET
      code=$2, name=$3, type=$4, region=$5, commune=$6, address=$7,
      daily_capacity=$8, work_days=$9, include_holidays=$10, status=$11
    WHERE id=$1 RETURNING *`,
    [id, data.code, data.name, data.type, data.region||'', data.commune||'',
     data.address||'', data.dailyCapacity||50,
     JSON.stringify(data.workDays||['L','M','M','J','V']),
     data.includeHolidays !== false, data.status||'active']
  );
  return rowToCentre(rows[0]);
}

// ── Agents ─────────────────────────────────────────────────────────────────

export async function getAgents() {
  const { rows } = await query(`SELECT * FROM agents ORDER BY name`);
  return rows.map(rowToAgent);
}

export async function getAgentByUsername(username) {
  const { rows } = await query(`SELECT * FROM agents WHERE username=$1`, [username]);
  return rowToAgent(rows[0]);
}

export async function getAgentById(id) {
  const { rows } = await query(`SELECT * FROM agents WHERE id=$1`, [id]);
  return rowToAgent(rows[0]);
}

export async function createAgent(data) {
  const id = generateId();
  const { rows } = await query(`
    INSERT INTO agents (id,username,password,name,email,role,centre_id,status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,'active') RETURNING *`,
    [id, data.username, data.password, data.name||'', data.email||'',
     data.role||'agent', data.centreId||null]
  );
  return rowToAgent(rows[0]);
}

export async function updateAgent(id, data) {
  const { rows } = await query(`
    UPDATE agents SET name=$2,email=$3,role=$4,centre_id=$5,status=$6
    WHERE id=$1 RETURNING *`,
    [id, data.name||'', data.email||'', data.role||'agent',
     data.centreId||null, data.status||'active']
  );
  return rowToAgent(rows[0]);
}

export async function deleteAgent(id) {
  await query(`DELETE FROM agents WHERE id=$1`, [id]);
}

// ── Appointments ───────────────────────────────────────────────────────────

export async function createAppointment(data) {
  const id  = generateId();
  const ref = generateReference();
  const { rows } = await query(`
    INSERT INTO appointments
      (id,reference,centre_id,nom,prenom,phone,email,date,chrono,immatriculation,vin,status,photo_recto,photo_verso)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'reserved',$12,$13) RETURNING *`,
    [id, ref, data.centreId, data.nom, data.prenom, data.phone,
     data.email||null, data.date, data.chrono||null,
     data.immatriculation||null, data.vin||null,
     data.photoRecto||null, data.photoVerso||null]
  );
  return rowToAppointment(rows[0]);
}

export async function getAppointmentByReference(reference) {
  const { rows } = await query(`SELECT * FROM appointments WHERE reference=$1`, [reference]);
  return rowToAppointment(rows[0]);
}

export async function getAppointmentById(id) {
  const { rows } = await query(`SELECT * FROM appointments WHERE id=$1`, [id]);
  return rowToAppointment(rows[0]);
}

export async function searchByPhone(phone) {
  const { rows } = await query(`SELECT * FROM appointments WHERE phone LIKE $1 ORDER BY date DESC`, [`%${phone}%`]);
  return rows.map(rowToAppointment);
}

export async function searchByChrono(chrono) {
  const { rows } = await query(`SELECT * FROM appointments WHERE chrono ILIKE $1`, [`%${chrono}%`]);
  return rows.map(rowToAppointment);
}

export async function searchByVIN(vin) {
  const { rows } = await query(`SELECT * FROM appointments WHERE vin ILIKE $1`, [`%${vin}%`]);
  return rows.map(rowToAppointment);
}

export async function searchByImmatriculation(immat) {
  const { rows } = await query(`SELECT * FROM appointments WHERE immatriculation ILIKE $1`, [`%${immat}%`]);
  return rows.map(rowToAppointment);
}

export async function updateAppointment(id, data) {
  const { rows } = await query(`
    UPDATE appointments SET nom=$2,prenom=$3,phone=$4,email=$5,date=$6
    WHERE id=$1 RETURNING *`,
    [id, data.nom, data.prenom, data.phone, data.email||null, data.date]
  );
  return rowToAppointment(rows[0]);
}

export async function updateAppointmentStatus(id, status) {
  const { rows } = await query(`
    UPDATE appointments SET status=$2 WHERE id=$1 RETURNING *`, [id, status]);
  return rowToAppointment(rows[0]);
}

export async function cancelAppointment(reference) {
  await query(`UPDATE appointments SET status='cancelled' WHERE reference=$1`, [reference]);
}

export async function getAppointmentsByPeriod(period, centreId) {
  const today = new Date().toISOString().split('T')[0];
  let condition = '';
  if (period === 'today')    condition = `AND date::date = '${today}'`;
  if (period === 'upcoming') condition = `AND date::date > '${today}'`;
  if (period === 'past')     condition = `AND date::date < '${today}'`;

  const centreFilter = centreId ? `AND centre_id='${centreId}'` : '';
  const { rows } = await query(
    `SELECT * FROM appointments WHERE status != 'cancelled' ${condition} ${centreFilter} ORDER BY date ASC`
  );
  return rows.map(rowToAppointment);
}

export async function getAllAppointments() {
  const { rows } = await query(`SELECT * FROM appointments ORDER BY created_at DESC`);
  return rows.map(r => ({
    ...rowToAppointment(r),
    hasPhotos: !!(r.photo_recto || r.photo_verso),
  }));
}

export async function getAppointmentPhotos(id) {
  const { rows } = await query(`SELECT photo_recto, photo_verso FROM appointments WHERE id=$1`, [id]);
  if (!rows[0]) return null;
  return { photoRecto: rows[0].photo_recto, photoVerso: rows[0].photo_verso };
}

// ── Fermetures ─────────────────────────────────────────────────────────────

export async function getClosures() {
  const { rows } = await query(`SELECT * FROM closures ORDER BY date`);
  return rows.map(r => ({ id: r.id, centreId: r.centre_id, date: r.date, reason: r.reason }));
}

export async function addClosure(data) {
  const id = generateId();
  const { rows } = await query(
    `INSERT INTO closures (id,centre_id,date,reason) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, data.centreId||null, data.date, data.reason||'']
  );
  return { id: rows[0].id, centreId: rows[0].centre_id, date: rows[0].date, reason: rows[0].reason };
}

export async function deleteClosure(id) {
  await query(`DELETE FROM closures WHERE id=$1`, [id]);
}

export async function updateClosure(id, data) {
  const { rows } = await query(
    `UPDATE closures SET centre_id=$2,date=$3,reason=$4 WHERE id=$1 RETURNING *`,
    [id, data.centreId||null, data.date, data.reason||'']
  );
  return { id: rows[0].id, centreId: rows[0].centre_id, date: rows[0].date, reason: rows[0].reason };
}

// ── Jours fériés ───────────────────────────────────────────────────────────

export async function getHolidays(year) {
  const { rows } = await query(`SELECT * FROM holidays WHERE year=$1 ORDER BY date`, [year]);
  return rows.map(r => ({ id: r.id, name: r.name, date: r.date, year: r.year, isFixed: r.is_fixed }));
}

export async function addHoliday(data) {
  const id   = generateId();
  const year = new Date(data.date).getFullYear();
  const { rows } = await query(
    `INSERT INTO holidays (id,name,date,year,is_fixed) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, data.name, data.date, year, data.isFixed||false]
  );
  return rows[0];
}

export async function deleteHoliday(id) {
  await query(`DELETE FROM holidays WHERE id=$1`, [id]);
}

// ── Capacités exceptionnelles ──────────────────────────────────────────────

export async function getExceptionalCapacities() {
  const { rows } = await query(`SELECT * FROM exceptional_capacities ORDER BY date`);
  return rows.map(r => ({ id: r.id, centreId: r.centre_id, date: r.date, capacity: r.capacity }));
}

export async function addExceptionalCapacity(data) {
  const id = generateId();
  const { rows } = await query(
    `INSERT INTO exceptional_capacities (id,centre_id,date,capacity) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, data.centreId, data.date, data.capacity]
  );
  return { id: rows[0].id, centreId: rows[0].centre_id, date: rows[0].date, capacity: rows[0].capacity };
}

export async function updateExceptionalCapacity(id, data) {
  const { rows } = await query(
    `UPDATE exceptional_capacities SET capacity=$2 WHERE id=$1 RETURNING *`,
    [id, data.capacity]
  );
  return { id: rows[0].id, centreId: rows[0].centre_id, date: rows[0].date, capacity: rows[0].capacity };
}

export async function deleteExceptionalCapacity(id) {
  await query(`DELETE FROM exceptional_capacities WHERE id=$1`, [id]);
}

// ── Jours exceptionnels ────────────────────────────────────────────────────

export async function getExceptionalDays(centreId) {
  const { rows } = await query(
    `SELECT * FROM exceptional_days WHERE centre_id=$1 ORDER BY date`, [centreId]);
  return {
    open:   rows.filter(r => r.type === 'open')  .map(r => ({ id: r.id, centreId: r.centre_id, date: r.date, reason: r.reason })),
    closed: rows.filter(r => r.type === 'closed').map(r => ({ id: r.id, centreId: r.centre_id, date: r.date, reason: r.reason })),
  };
}

export async function addExceptionallyOpen(data) {
  const id = generateId();
  await query(`INSERT INTO exceptional_days (id,centre_id,date,type,reason) VALUES ($1,$2,$3,'open',$4)`,
    [id, data.centreId, data.date, data.reason||'']);
}

export async function addExceptionallyClosed(data) {
  const id = generateId();
  await query(`INSERT INTO exceptional_days (id,centre_id,date,type,reason) VALUES ($1,$2,$3,'closed',$4)`,
    [id, data.centreId, data.date, data.reason||'']);
}

export async function deleteExceptionalDay(id) {
  await query(`DELETE FROM exceptional_days WHERE id=$1`, [id]);
}

// ── Véhicules ──────────────────────────────────────────────────────────────

export async function getVehicles() {
  const { rows } = await query(`SELECT * FROM vehicles ORDER BY immatriculation`);
  return rows.map(r => ({ id: r.id, immatriculation: r.immatriculation, chassis: r.chassis, chrono: r.chrono }));
}

export async function lookupVehicle(immatriculation) {
  const key = immatriculation.toUpperCase().replace(/\s/g, '');
  const { rows } = await query(
    `SELECT * FROM vehicles WHERE REPLACE(UPPER(immatriculation),' ','')=$1`, [key]);
  if (!rows[0]) return null;
  return { id: rows[0].id, immatriculation: rows[0].immatriculation, chassis: rows[0].chassis, chrono: rows[0].chrono };
}

export async function importVehicles(rows_data) {
  let added = 0, updated = 0, errors = 0;
  for (const row of rows_data) {
    const immat   = (row.immatriculation||'').trim().toUpperCase();
    const chassis = (row.chassis||'').trim().toUpperCase();
    const chrono  = (row.chrono||'').trim().toUpperCase();
    if (!immat) { errors++; continue; }
    try {
      const id = generateId();
      await query(`
        INSERT INTO vehicles (id,immatriculation,chassis,chrono) VALUES ($1,$2,$3,$4)
        ON CONFLICT (immatriculation) DO UPDATE SET chassis=EXCLUDED.chassis, chrono=EXCLUDED.chrono`,
        [id, immat, chassis, chrono]
      );
      added++;
    } catch { errors++; }
  }
  return { added, updated, errors, total: rows_data.length };
}

export async function deleteAllVehicles() {
  await query(`DELETE FROM vehicles`);
}

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getStats() {
  const { rows: apptRows } = await query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status='reserved')  AS reserved,
      COUNT(*) FILTER (WHERE status='completed') AS completed,
      COUNT(*) FILTER (WHERE status='absent')    AS absent,
      COUNT(*) FILTER (WHERE status='cancelled') AS cancelled
    FROM appointments
  `);
  const a = apptRows[0];

  const { rows: centreRows } = await query(`
    SELECT c.id, c.name,
      COUNT(a.id) AS total,
      COUNT(a.id) FILTER (WHERE a.status='reserved')  AS reserved,
      COUNT(a.id) FILTER (WHERE a.status='completed') AS completed,
      COUNT(a.id) FILTER (WHERE a.status='absent')    AS absent
    FROM centres c
    LEFT JOIN appointments a ON a.centre_id = c.id
    GROUP BY c.id, c.name
  `);

  return {
    totalAppointments: parseInt(a.total),
    reserved:  parseInt(a.reserved),
    completed: parseInt(a.completed),
    absent:    parseInt(a.absent),
    cancelled: parseInt(a.cancelled),
    byCenter: centreRows.map(r => ({
      centreId: r.id, centreName: r.name,
      total: parseInt(r.total), reserved: parseInt(r.reserved),
      completed: parseInt(r.completed), absent: parseInt(r.absent),
    })),
  };
}

export async function getPDGStats() {
  return getStats();
}

export async function exportData() {
  const { rows } = await query(`
    SELECT a.*, c.name AS centre_name
    FROM appointments a
    LEFT JOIN centres c ON c.id = a.centre_id
    ORDER BY a.created_at DESC
  `);
  return rows.map(r => ({
    ...rowToAppointment(r),
    centreName: r.centre_name,
  }));
}

// ── Disponibilité ──────────────────────────────────────────────────────────

export async function getCentreAvailability(centreId, daysAhead) {
  const centre = await getCentreById(centreId);
  if (!centre) return [];

  const today = new Date();
  const dates = [];

  // Fermetures
  const closures = await getClosures();
  const closedDates = new Set(
    closures
      .filter(c => !c.centreId || c.centreId === centreId || c.centreId === 'all')
      .map(c => new Date(c.date).toISOString().split('T')[0])
  );

  // Jours fériés
  const year = today.getFullYear();
  const holidays = await getHolidays(year);
  if (!centre.includeHolidays) {
    holidays.forEach(h => closedDates.add(new Date(h.date).toISOString().split('T')[0]));
  }

  // Jours exceptionnels
  const { open: openDays, closed: closedDays } = await getExceptionalDays(centreId);
  closedDays.forEach(d => closedDates.add(new Date(d.date).toISOString().split('T')[0]));
  const openDatesSet = new Set(openDays.map(d => new Date(d.date).toISOString().split('T')[0]));

  // Capacités exceptionnelles
  const excCaps = await getExceptionalCapacities();

  const dayMap = { 0:'D', 1:'L', 2:'M', 3:'M', 4:'J', 5:'V', 6:'S' };

  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayCode = dayMap[d.getDay()];

    if (closedDates.has(dateStr)) continue;

    const isWorkDay = centre.workDays.includes(dayCode);
    const isExceptionallyOpen = openDatesSet.has(dateStr);

    if (!isWorkDay && !isExceptionallyOpen) continue;

    // Capacité
    const excCap = excCaps.find(ec => ec.centreId === centreId && new Date(ec.date).toISOString().split('T')[0] === dateStr);
    const capacity = excCap ? excCap.capacity : centre.dailyCapacity;

    // Comptage RDV existants
    const { rows } = await query(
      `SELECT COUNT(*) AS cnt FROM appointments WHERE centre_id=$1 AND date=$2 AND status != 'cancelled'`,
      [centreId, dateStr]
    );
    const count = parseInt(rows[0].cnt);

    dates.push({ date: dateStr, available: count < capacity, count, capacity });
  }

  return dates;
}

// Export default pour compatibilité avec l'ancien code (store.xxx)
const store = {
  getCentres, getCentreById, createCentre, updateCentre,
  getAgents, getAgentByUsername, getAgentById, createAgent, updateAgent, deleteAgent,
  createAppointment, getAppointmentByReference, getAppointmentById,
  searchByPhone, searchByChrono, searchByVIN, searchByImmatriculation,
  updateAppointment, updateAppointmentStatus, cancelAppointment,
  getAppointmentsByPeriod, getAllAppointments, getAppointmentPhotos,
  getClosures, addClosure, deleteClosure, updateClosure,
  getHolidays, addHoliday, deleteHoliday,
  getExceptionalCapacities, addExceptionalCapacity, updateExceptionalCapacity, deleteExceptionalCapacity,
  getExceptionalDays, addExceptionallyOpen, addExceptionallyClosed, deleteExceptionalDay,
  getVehicles, lookupVehicle, importVehicles, deleteAllVehicles,
  getStats, getPDGStats, exportData,
  getCentreAvailability,
};

export default store;
