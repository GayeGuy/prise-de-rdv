import express from 'express';
import store from './lib/store.js';
import { migrate } from './lib/migrate.js';

const app = express();
app.use(express.json({ limit: '20mb' }));
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
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    const agent = await store.getAgentByUsername(username);
    if (!agent || agent.password !== password || agent.status !== 'active') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = { id: agent.id, username: agent.username, name: agent.name, role: agent.role, centreId: agent.centreId };
    const token = Buffer.from(JSON.stringify(user)).toString('base64');
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CENTRES =====
app.get('/api/centres', async (req, res) => {
  try {
    res.json(await store.getCentres());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/centres/:id/availability', async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.daysAhead) || 60;
    const availability = await store.getCentreAvailability(req.params.id, daysAhead);
    if (!availability) return res.status(404).json({ error: 'Centre not found' });
    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/centres', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json(await store.createCentre(req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/centres/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const centre = await store.updateCentre(req.params.id, req.body);
    if (!centre) return res.status(404).json({ error: 'Centre not found' });
    res.json(centre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== VEHICLES =====

// Lookup public (formulaire de RDV)
app.get('/api/vehicles/lookup', async (req, res) => {
  try {
    const { immatriculation } = req.query;
    if (!immatriculation) return res.status(400).json({ error: 'immatriculation requis' });
    const vehicle = await store.lookupVehicle(immatriculation);
    if (!vehicle) return res.status(404).json({ error: 'Véhicule non trouvé' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import CSV (admin)
app.post('/api/admin/vehicles/import', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'Données invalides' });
    res.json(await store.importVehicles(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Liste véhicules (admin)
app.get('/api/admin/vehicles', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    res.json(await store.getVehicles());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer tous les véhicules (admin)
app.delete('/api/admin/vehicles', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    await store.deleteAllVehicles();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== APPOINTMENTS =====
app.post('/api/appointments', async (req, res) => {
  try {
    const { nom, prenom, phone, email, date, centreId, chrono, immatriculation, vin, photoRecto, photoVerso } = req.body;
    if (!nom || !prenom || !phone || !date || !centreId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const centre = await store.getCentreById(centreId);
    if (!centre) return res.status(404).json({ error: 'Centre not found' });

    const appointment = await store.createAppointment({
      nom, prenom,
      phone: phone.replace(/\s/g, ''),
      email: email || null,
      date, centreId,
      chrono: chrono || null,
      immatriculation: immatriculation || null,
      vin: vin || null,
      photoRecto: photoRecto || null,
      photoVerso: photoVerso || null,
    });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Photos d'un RDV (agent, admin, PDG) — DOIT être avant /:reference
app.get('/api/appointments/:id/photos', authMiddleware, async (req, res) => {
  try {
    const photos = await store.getAppointmentPhotos(req.params.id);
    if (!photos) return res.status(404).json({ error: 'RDV non trouvé' });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments/search/:value', async (req, res) => {
  try {
    const value = req.params.value;
    let appointments = [];
    if (/^\d{7,}$/.test(value.replace(/\s/g, ''))) {
      appointments = await store.searchByPhone(value);
    } else if (/^RDV-/i.test(value)) {
      const appt = await store.getAppointmentByReference(value);
      appointments = appt ? [appt] : [];
    }
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments/search/chrono/:chrono', async (req, res) => {
  try {
    res.json(await store.searchByChrono(req.params.chrono));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments/search/vin/:vin', async (req, res) => {
  try {
    res.json(await store.searchByVIN(req.params.vin));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments/search/immatriculation/:immatriculation', async (req, res) => {
  try {
    res.json(await store.searchByImmatriculation(req.params.immatriculation));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments/:reference', async (req, res) => {
  try {
    const appointment = await store.getAppointmentByReference(req.params.reference);
    if (!appointment) return res.status(404).json({ error: 'Not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:reference', async (req, res) => {
  try {
    await store.cancelAppointment(req.params.reference);
    res.json({ cancelled: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { nom, prenom, phone, email, date } = req.body;
    if (!nom || !prenom || !phone || !date) return res.status(400).json({ error: 'Missing required fields' });
    const appointment = await store.updateAppointment(req.params.id, { nom, prenom, phone, email, date });
    if (!appointment) return res.status(404).json({ error: 'Not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== AGENT =====
app.get('/api/agent/appointments', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agent') return res.status(403).json({ error: 'Agent only' });
    const period = req.query.period || 'today';
    const appointments = await store.getAppointmentsByPeriod(period, req.user.centreId);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/agent/appointments/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agent') return res.status(403).json({ error: 'Agent only' });
    const { status } = req.body;
    const appointment = await store.updateAppointmentStatus(req.params.id, status);
    if (!appointment) return res.status(404).json({ error: 'Not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== PDG =====
app.get('/api/pdg/appointments', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'pdg' && req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    res.json(await store.getAllAppointments());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pdg/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'pdg' && req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    res.json(await store.getPDGStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pdg/export', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'pdg' && req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    res.json(await store.exportData());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN — AGENTS =====
app.get('/api/admin/agents', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json(await store.getAgents());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/agents', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { username, password, name, email, centreId, role } = req.body;
    if (!username || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
    res.json(await store.createAgent({ username, password, name, email, centreId, role }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/agents/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const agent = await store.updateAgent(req.params.id, req.body);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/agents/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await store.deleteAgent(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json(await store.getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN — CLOSURES =====
app.get('/api/admin/closures', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json(await store.getClosures());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/closures', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { date, centreId, reason } = req.body;
    if (!date) return res.status(400).json({ error: 'Missing date' });
    res.json(await store.addClosure({ date, centreId, reason }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/closures/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const closure = await store.updateClosure(req.params.id, req.body);
    if (!closure) return res.status(404).json({ error: 'Closure not found' });
    res.json(closure);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/closures/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await store.deleteClosure(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN — HOLIDAYS =====
app.get('/api/admin/holidays', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const year = parseInt(req.query.year) || new Date().getFullYear();
    res.json(await store.getHolidays(year));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/holidays', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { date, name, isFixed } = req.body;
    if (!date || !name) return res.status(400).json({ error: 'Missing date or name' });
    res.json(await store.addHoliday({ date, name, isFixed }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/holidays/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await store.deleteHoliday(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN — EXCEPTIONAL CAPACITIES =====
app.get('/api/admin/exceptional-capacities', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json(await store.getExceptionalCapacities());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/exceptional-capacities', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { centreId, date, capacity } = req.body;
    if (!centreId || !date || !capacity) return res.status(400).json({ error: 'centreId, date et capacity requis' });
    res.json(await store.addExceptionalCapacity({ centreId, date, capacity: parseInt(capacity) }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/exceptional-capacities/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const updated = await store.updateExceptionalCapacity(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/exceptional-capacities/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await store.deleteExceptionalCapacity(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN — EXCEPTIONAL DAYS =====
app.post('/api/admin/exceptional-days/open', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { centreId, date, reason } = req.body;
    if (!centreId || !date) return res.status(400).json({ error: 'centreId et date requis' });
    await store.addExceptionallyOpen({ centreId, date, reason });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/exceptional-days/closed', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { centreId, date, reason } = req.body;
    if (!centreId || !date) return res.status(400).json({ error: 'centreId et date requis' });
    await store.addExceptionallyClosed({ centreId, date, reason });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/exceptional-days/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await store.deleteExceptionalDay(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/centres/:centreId/exceptions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json(await store.getExceptionalDays(req.params.centreId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== START =====
const PORT = process.env.PORT || 3001;

migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
