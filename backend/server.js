import express from 'express';
import store from './lib/store.js';
import { migrate } from './lib/migrate.js';
import { getHolidaysForYear, isHoliday } from './lib/holidays-ci.js';

const app = express();
app.use(express.json({ limit: '20mb' })); // augmenter la limite pour les photos base64
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const user = await store.authenticate(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = Buffer.from(JSON.stringify(user)).toString('base64');
  res.json({ token, user });
});

// ===== CENTRES =====
app.get('/api/centres', async (req, res) => {
  res.json(await store.getCentres());
});

app.get('/api/centres/:id/availability', async (req, res) => {
  const daysAhead = parseInt(req.query.daysAhead) || 30;
  const centre = await store.getCentre(req.params.id);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });

  const availability = [];
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const dayLetter = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][dayOfWeek];

    // Check if closed
    const isClosed = await store.getClosures().some(c => c.date === dateStr);
    
    // Check if it's a working day
    const isWorkDay = centre.workDays.includes(dayLetter);
    
    // Get capacity (exceptional or default)
    let capacity = centre.dailyCapacity;
    const exceptionalCap = await store.getExceptionalCapacityForDate(centre.id, dateStr);
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

app.post('/api/admin/centres', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const centre = await store.createCentre(req.body);
  res.json(centre);
});

app.put('/api/admin/centres/:id', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const centre = await store.updateCentre(req.params.id, req.body);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });
  res.json(centre);
});

// ===== APPOINTMENTS =====
app.post('/api/appointments', async (req, res) => {
  const { nom, prenom, phone, email, date, centreId, chrono, immatriculation, vin } = req.body;
  
  if (!nom || !prenom || !phone || !date || !centreId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const centre = await store.getCentre(centreId);
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

  const appointment = await store.createAppointment({
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

app.get('/api/appointments/:reference', async (req, res) => {
  const appointment = await store.getAppointment(req.params.reference);
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json(appointment);
});

app.get('/api/appointments/search/:value', async (req, res) => {
  const value = req.params.value;
  let appointments = [];

  if (/^\d{7,}$/.test(value.replace(/\s/g, ''))) {
    appointments = await store.searchAppointmentsByPhone(value);
  } else if (/^RDV-/.test(value)) {
    const appt = await store.getAppointment(value);
    appointments = appt ? [appt] : [];
  }

  res.json(appointments);
});

app.get('/api/appointments/search/chrono/:chrono', async (req, res) => {
  const appointments = await store.searchAppointmentsByChrono(req.params.chrono);
  res.json(appointments);
});

app.get('/api/appointments/search/vin/:vin', async (req, res) => {
  const appointments = await store.searchAppointmentsByVIN(req.params.vin);
  res.json(appointments);
});

app.get('/api/appointments/search/immatriculation/:immatriculation', async (req, res) => {
  const appointments = await store.searchAppointmentsByImmatriculation(req.params.immatriculation);
  res.json(appointments);
});

app.delete('/api/appointments/:reference', async (req, res) => {
  const appointment = await store.cancelAppointment(req.params.reference);
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json(appointment);
});

app.patch('/api/appointments/:id', async (req, res) => {
  const { nom, prenom, phone, email, date } = req.body;
  if (!nom || !prenom || !phone || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const appointment = await store.updateAppointment(req.params.id, { nom, prenom, phone, email, date });
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json(appointment);
});

// ===== AGENT =====
app.get('/api/agent/appointments', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'agent') {
    return res.status(403).json({ error: 'Agent only' });
  }

  const period = req.query.period || 'all';
  const appointments = await store.getAgentAppointments(req.user.id, period);
  res.json(appointments);
});

app.patch('/api/agent/appointments/:id/status', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'agent') {
    return res.status(403).json({ error: 'Agent only' });
  }

  const { status } = req.body;
  const appointment = await store.updateAppointmentStatus(req.params.id, status);
  if (!appointment) return res.status(404).json({ error: 'Not found' });
  res.json(appointment);
});

// ===== ADMIN =====
app.post('/api/admin/agents', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { username, password, name, email, centreId } = req.body;
  if (!username || !password || !name || !centreId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const agent = await store.createAgent({ username, password, name, email, centreId });
  res.json(agent);
});

app.get('/api/admin/agents', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(await store.getAgents());
});

app.patch('/api/admin/agents/:id', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const agent = await store.updateAgent(req.params.id, req.body);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

app.delete('/api/admin/agents/:id', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  await store.deleteAgent(req.params.id);
  res.json({ deleted: true });
});

app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(await store.getStats());
});

app.get('/api/admin/closures', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(await store.getClosures());
});

app.post('/api/admin/closures', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Missing date' });

  const closure = await store.addClosure({ date });
  res.json(closure);
});

app.delete('/api/admin/closures/:id', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  await store.deleteClosure(req.params.id);
  res.json({ deleted: true });
});

// ===== PDG =====
app.get('/api/pdg/appointments', authMiddleware, async (req, res) => {
  if (req.user.role !== 'pdg' && req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  const appointments = await store.getAllAppointments();
  res.json(appointments);
});

app.get('/api/pdg/stats', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'pdg') {
    return res.status(403).json({ error: 'PDG only' });
  }

  res.json(await store.getPDGStats());
});

app.get('/api/pdg/export', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'pdg') {
    return res.status(403).json({ error: 'PDG only' });
  }

  res.json(store.data.appointments);
});

// Update closure
app.patch('/api/admin/closures/:id', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const closure = await store.updateClosure(req.params.id, req.body);
  if (!closure) return res.status(404).json({ error: 'Closure not found' });
  res.json(closure);
});

// Holidays
app.get('/api/admin/holidays', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(await store.getHolidays());
});

app.post('/api/admin/holidays', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { date, name } = req.body;
  if (!date || !name) return res.status(400).json({ error: 'Missing date or name' });

  const holiday = await store.addHoliday({ date, name });
  res.json(holiday);
});

app.delete('/api/admin/holidays/:id', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  await store.deleteHoliday(req.params.id);
  res.json({ deleted: true });
});

// Exceptional Capacities
app.get('/api/admin/exceptional-capacities', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json(await store.getExceptionalCapacities());
});

app.post('/api/admin/exceptional-capacities', authMiddleware, async (req, res) => {
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

  const ec = await store.addExceptionalCapacity(data);
  res.json(ec);
});

app.patch('/api/admin/exceptional-capacities/:id', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const updated = await store.updateExceptionalCapacity(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

app.delete('/api/admin/exceptional-capacities/:id', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  await store.deleteExceptionalCapacity(req.params.id);
  res.json({ deleted: true });
});

// ===== JOURS FÉRIÉS =====
app.get('/api/holidays', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const holidays = getHolidaysForYear(year);
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/exceptional-days/open', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { centreId, date, reason } = req.body;
  if (!centreId || !date) {
    return res.status(400).json({ error: 'centreId et date requis' });
  }
  const entry = await store.addExceptionallyOpen(centreId, date, reason);
  res.json(entry);
});

app.post('/api/admin/exceptional-days/closed', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { centreId, date, reason } = req.body;
  if (!centreId || !date) {
    return res.status(400).json({ error: 'centreId et date requis' });
  }
  const entry = await store.addExceptionallyClosed(centreId, date, reason);
  res.json(entry);
});

app.delete('/api/admin/exceptional-days/:id', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { id } = req.params;
  const isOpen = store.data.exceptionallyOpen.some(e => e.id === id);
  
  if (isOpen) {
    await store.removeExceptionallyOpen(id);
  } else {
    await store.removeExceptionallyClosed(id);
  }
  
  res.json({ success: true });
});

app.get('/api/admin/centres/:centreId/exceptions', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { centreId } = req.params;
  const exceptions = await store.getExceptionalDaysForCentre(centreId);
  res.json(exceptions);
});

// Start server
// ── Photos carte grise ───────────────────────────────────────────────────

// Récupérer les photos d'un RDV (agents, admin, PDG)
app.get('/api/appointments/:id/photos', authMiddleware, async (req, res) => {
  const appointment = await store.getAppointmentById(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'RDV non trouvé' });
  res.json({
    photoRecto: appointment.photoRecto || null,
    photoVerso: appointment.photoVerso || null,
  });
});

// ── Base véhicules ────────────────────────────────────────────────────────

// Lookup public (utilisé par le formulaire de RDV)
app.get('/api/vehicles/lookup', async (req, res) => {
  const { immatriculation } = req.query;
  if (!immatriculation) return res.status(400).json({ error: 'immatriculation requis' });
  const vehicle = await store.lookupVehicle(immatriculation);
  if (!vehicle) return res.status(404).json({ error: 'Véhicule non trouvé' });
  res.json(vehicle);
});

// Import CSV (admin uniquement)
app.post('/api/admin/vehicles/import', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Données invalides' });
  }
  const result = await store.importVehicles(rows);
  res.json(result);
});

// Liste véhicules (admin)
app.get('/api/admin/vehicles', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  const vehicles = await store.getVehicles();
  res.json(vehicles);
});

// Supprimer tous les véhicules (admin)
app.delete('/api/admin/vehicles', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  await store.deleteAllVehicles();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;

// Démarrage avec migration
migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📝 API: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
