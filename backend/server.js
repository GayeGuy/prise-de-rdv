import express from 'express';
import store from './lib/store.js';
import { getHolidaysForYear, isHoliday } from './lib/holidays-ci.js';

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });

  const token = authHeader.replace('Bearer ', '');
  try {
    const user = JSON.parse(Buffer.from(token, 'base64').toString());
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ===== AUTH =====
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const user = store.authenticate(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = Buffer.from(JSON.stringify(user)).toString('base64');
  res.json({ token, user });
});

// ===== CENTRES =====
app.get('/api/centres', (req, res) => {
  res.json(store.getCentres());
});

app.get('/api/centres/:id/availability', (req, res) => {
  const daysAhead = parseInt(req.query.daysAhead) || 30;
  const centre = store.getCentre(req.params.id);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });

  const availability = [];
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const dayLetter = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][dayOfWeek];

    // Check if closed
    const isClosed = store.getClosures().some(c => c.date === dateStr);
    
    // Check if it's a working day
    const isWorkDay = centre.workDays.includes(dayLetter);
    
    // Get capacity (exceptional or default)
    let capacity = centre.dailyCapacity;
    const exceptionalCap = store.getExceptionalCapacityForDate(centre.id, dateStr);
    if (exceptionalCap) {
      capacity = exceptionalCap.capacity;
    }
    
    // Count appointments
    const count = store.data.appointments.filter(a => a.centreId === centre.id && a.date === dateStr && a.status === 'reserved').length;
    const available = isWorkDay && !isClosed && count < capacity;

    availability.push({
      date: dateStr,
      available,
      count,
      capacity,
      free: capacity - count,
    });
  }
  res.json(availability);
});

app.post('/api/admin/centres', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const centre = store.createCentre(req.body);
  res.json(centre);
});

app.put('/api/admin/centres/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const centre = store.updateCentre(req.params.id, req.body);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });
  res.json(centre);
});

// ===== APPOINTMENTS =====
app.post('/api/appointments', (req, res) => {
  const { nom, prenom, phone, email, date, centreId, chrono, immatriculation, vin } = req.body;
  
  if (!nom || !prenom || !phone || !date || !centreId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const centre = store.getCentre(centreId);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });

  if (centre.type === 'PIMO' && !chrono) {
    return res.status(400).json({ error: 'Chrono required for PIMO' });
  }
  if (centre.type === 'POST_REIMMAT' && !immatriculation) {
    return res.status(400).json({ error: 'Immatriculation required' });
  }

  // Check uniqueness
  if (chrono && store.data.appointments.some(a => a.chrono === chrono && a.status === 'reserved')) {
    return res.status(400).json({ error: 'Chrono already booked' });
  }
  if (immatriculation && store.data.appointments.some(a => a.immatriculation === immatriculation && a.status === 'reserved')) {
    return res.status(400).json({ error: 'Immatriculation already booked' });
  }

  const appointment = store.createAppointment({
    nom,
    prenom,
    phone: phone.replace(/\s/g, ''),
    email: email || '',
    date,
    centreId,
    chrono: chrono || '',
    immatriculation: immatriculation || '',
    vin: vin || '',
  });

  res.json(appointment);
});

app.get('/api/appointments/:reference', (req, res) => {
  const appointment = store.getAppointment(req.params.reference);
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json(appointment);
});

app.get('/api/appointments/search/:value', (req, res) => {
  const value = req.params.value;
  let appointments = [];

  if (/^\d{7,}$/.test(value.replace(/\s/g, ''))) {
    appointments = store.searchAppointmentsByPhone(value);
  } else if (/^RDV-/.test(value)) {
    const appt = store.getAppointment(value);
    appointments = appt ? [appt] : [];
  }

  res.json(appointments);
});

app.get('/api/appointments/search/chrono/:chrono', (req, res) => {
  const appointments = store.searchAppointmentsByChrono(req.params.chrono);
  res.json(appointments);
});

app.get('/api/appointments/search/vin/:vin', (req, res) => {
  const appointments = store.searchAppointmentsByVIN(req.params.vin);
  res.json(appointments);
});

app.get('/api/appointments/search/immatriculation/:immatriculation', (req, res) => {
  const appointments = store.searchAppointmentsByImmatriculation(req.params.immatriculation);
  res.json(appointments);
});

app.delete('/api/appointments/:reference', (req, res) => {
  const appointment = store.cancelAppointment(req.params.reference);
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json(appointment);
});

app.patch('/api/appointments/:id', (req, res) => {
  const { nom, prenom, phone, email, date } = req.body;
  if (!nom || !prenom || !phone || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const appointment = store.updateAppointment(req.params.id, { nom, prenom, phone, email, date });
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json(appointment);
});

// ===== AGENT =====
app.get('/api/agent/appointments', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'agent') {
    return res.status(403).json({ error: 'Agent only' });
  }

  const period = req.query.period || 'all';
  const appointments = store.getAgentAppointments(req.user.id, period);
  res.json(appointments);
});

app.patch('/api/agent/appointments/:id/status', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'agent') {
    return res.status(403).json({ error: 'Agent only' });
  }

  const { status } = req.body;
  const appointment = store.updateAppointmentStatus(req.params.id, status);
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json(appointment);
});

// ===== ADMIN =====
app.post('/api/admin/agents', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { username, password, name, email, centreId } = req.body;
  if (!username || !password || !name || !centreId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const agent = store.createAgent({ username, password, name, email, centreId });
  res.json(agent);
});

app.get('/api/admin/agents', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(store.getAgents());
});

app.patch('/api/admin/agents/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const agent = store.updateAgent(req.params.id, req.body);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

app.delete('/api/admin/agents/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  store.deleteAgent(req.params.id);
  res.json({ deleted: true });
});

app.get('/api/admin/stats', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(store.getStats());
});

app.get('/api/admin/closures', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(store.getClosures());
});

app.post('/api/admin/closures', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Missing date' });

  const closure = store.addClosure({ date });
  res.json(closure);
});

app.delete('/api/admin/closures/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  store.deleteClosure(req.params.id);
  res.json({ deleted: true });
});

// ===== PDG =====
app.get('/api/pdg/stats', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'pdg') {
    return res.status(403).json({ error: 'PDG only' });
  }

  res.json(store.getPDGStats());
});

app.get('/api/pdg/export', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'pdg') {
    return res.status(403).json({ error: 'PDG only' });
  }

  res.json(store.data.appointments);
});

// Update closure
app.patch('/api/admin/closures/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const closure = store.updateClosure(req.params.id, req.body);
  if (!closure) return res.status(404).json({ error: 'Closure not found' });
  res.json(closure);
});

// Holidays
app.get('/api/admin/holidays', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(store.getHolidays());
});

app.post('/api/admin/holidays', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { date, name } = req.body;
  if (!date || !name) return res.status(400).json({ error: 'Missing date or name' });

  const holiday = store.addHoliday({ date, name });
  res.json(holiday);
});

app.delete('/api/admin/holidays/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  store.deleteHoliday(req.params.id);
  res.json({ deleted: true });
});

// Exceptional Capacities
app.get('/api/admin/exceptional-capacities', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(store.getExceptionalCapacities());
});

app.post('/api/admin/exceptional-capacities', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { centreId, capacity, type } = req.body;
  
  // Validation selon le type
  if (!centreId || !capacity || !type) {
    return res.status(400).json({ error: 'Missing required fields: centreId, capacity, type' });
  }

  let data = { centreId, capacity: parseInt(capacity), type };

  // Validations spécifiques au type
  if (type === 'date') {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date required for type "date"' });
    }
    data.date = date;
  } else if (type === 'period') {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required for type "period"' });
    }
    data.startDate = startDate;
    data.endDate = endDate;
  } else if (type === 'weekday') {
    const { weekday } = req.body;
    if (!weekday) {
      return res.status(400).json({ error: 'weekday required for type "weekday"' });
    }
    data.weekday = weekday;
  }

  const ec = store.addExceptionalCapacity(data);
  res.json(ec);
});

app.patch('/api/admin/exceptional-capacities/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const updated = store.updateExceptionalCapacity(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

app.delete('/api/admin/exceptional-capacities/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  store.deleteExceptionalCapacity(req.params.id);
  res.json({ deleted: true });
});

// ===== JOURS FÉRIÉS =====
app.get('/api/holidays', (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const holidays = getHolidaysForYear(year);
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/exceptional-days/open', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { centreId, date, reason } = req.body;
  if (!centreId || !date) {
    return res.status(400).json({ error: 'centreId et date requis' });
  }
  const entry = store.addExceptionallyOpen(centreId, date, reason);
  res.json(entry);
});

app.post('/api/admin/exceptional-days/closed', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { centreId, date, reason } = req.body;
  if (!centreId || !date) {
    return res.status(400).json({ error: 'centreId et date requis' });
  }
  const entry = store.addExceptionallyClosed(centreId, date, reason);
  res.json(entry);
});

app.delete('/api/admin/exceptional-days/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { id } = req.params;
  const isOpen = store.data.exceptionallyOpen.some(e => e.id === id);
  
  if (isOpen) {
    store.removeExceptionallyOpen(id);
  } else {
    store.removeExceptionallyClosed(id);
  }
  
  res.json({ success: true });
});

app.get('/api/admin/centres/:centreId/exceptions', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { centreId } = req.params;
  const exceptions = store.getExceptionalDaysForCentre(centreId);
  res.json(exceptions);
});

// Start server
// ── Base véhicules ────────────────────────────────────────────────────────

// Lookup public (utilisé par le formulaire de RDV)
app.get('/api/vehicles/lookup', (req, res) => {
  const { immatriculation } = req.query;
  if (!immatriculation) return res.status(400).json({ error: 'immatriculation requis' });
  const vehicle = store.lookupVehicle(immatriculation);
  if (!vehicle) return res.status(404).json({ error: 'Véhicule non trouvé' });
  res.json(vehicle);
});

// Import CSV (admin uniquement)
app.post('/api/admin/vehicles/import', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Données invalides' });
  }
  const result = store.importVehicles(rows);
  res.json(result);
});

// Liste véhicules (admin)
app.get('/api/admin/vehicles', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  const vehicles = store.getVehicles();
  res.json(vehicles);
});

// Supprimer tous les véhicules (admin)
app.delete('/api/admin/vehicles', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  store.deleteAllVehicles();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 API: http://localhost:${PORT}`);
});
