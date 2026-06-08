import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/db.json');

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function generateReference() {
  return 'RDV-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

class Store {
  constructor() {
    this.data = this.load();
  }

  load() {
    if (!fs.existsSync(DB_PATH)) {
      const initial = {
        users: [
          { id: '1', username: 'admin', password: 'admin123', name: 'Administrateur', role: 'admin', email: 'admin@example.com' },
          { id: '2', username: 'pdg', password: 'pdg123', name: 'Directeur', role: 'pdg', email: 'pdg@example.com' },
        ],
        agents: [
          { id: 'agent1', username: 'agent1', password: 'agent123', name: 'Agent Test', email: 'agent1@example.com', centreId: 'centre1', role: 'agent' },
        ],
        centres: [
          { id: 'centre1', code: 'C001', name: 'Centre PIMO Abidjan', type: 'PIMO', region: 'Abidjan', commune: 'Abidjan', address: '123 Rue du Port', dailyCapacity: 50, workDays: ["L", "M", "M", "J", "V"], includeHolidays: true, status: 'active' },
          { id: 'centre2', code: 'C002', name: 'Centre Immatriculation Cocody', type: 'POST_REIMMAT', region: 'Cocody', commune: 'Cocody', address: '456 Av. des Nations', dailyCapacity: 40, workDays: ["L", "M", "M", "J", "V"], includeHolidays: true, status: 'active' },
        ],
        appointments: [],
        closures: [],
        holidays: [],
        exceptionalCapacities: [],
        exceptionallyOpen: [],
        exceptionallyClosed: [],
        logs: [],
      };
      this.save();
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  }

  save() {
    try {
      if (!this.data) {
        console.error('❌ this.data is undefined!');
        return false;
      }
      const jsonStr = JSON.stringify(this.data, null, 2);
      if (!jsonStr) {
        console.error('❌ JSON.stringify returned empty!');
        return false;
      }
      fs.writeFileSync(DB_PATH, jsonStr, 'utf8');
      console.log('✅ Data saved successfully');
      return true;
    } catch (err) {
      console.error('❌ Save error:', err.message);
      return false;
    }
  }

  // Users/Auth
  getUser(username) {
    return this.data.users.find(u => u.username === username);
  }

  getAgent(username) {
    return this.data.agents.find(a => a.username === username);
  }

  authenticate(username, password) {
    const user = this.getUser(username);
    if (user && user.password === password) return user;
    
    const agent = this.getAgent(username);
    if (agent && agent.password === password) return agent;
    
    return null;
  }

  // Agents
  createAgent(data) {
    const agent = {
      id: generateId(),
      username: data.username,
      password: data.password,
      name: data.name,
      email: data.email,
      centreId: data.centreId,
      role: 'agent',
    };
    this.data.agents.push(agent);
    this.save();
    return agent;
  }

  getAgents() {
    return this.data.agents;
  }

  updateAgent(id, data) {
    const agent = this.data.agents.find(a => a.id === id);
    if (!agent) return null;
    Object.assign(agent, data);
    this.save();
    return agent;
  }

  deleteAgent(id) {
    this.data.agents = this.data.agents.filter(a => a.id !== id);
    this.save();
  }

  // Centres
  getCentres() {
    return this.data.centres;
  }

  getCentre(id) {
    return this.data.centres.find(c => c.id === id);
  }

  createCentre(data) {
    const centre = {
      id: generateId(),
      ...data,
    };
    this.data.centres.push(centre);
    this.save();
    return centre;
  }

  updateCentre(id, data) {
    const centre = this.data.centres.find(c => c.id === id);
    if (!centre) return null;
    Object.assign(centre, data);
    this.save();
    return centre;
  }

  // Appointments
  createAppointment(data) {
    const appointment = {
      id: generateId(),
      reference: generateReference(),
      ...data,
      status: 'reserved',
      createdAt: new Date().toISOString(),
    };
    this.data.appointments.push(appointment);
    this.save();
    return appointment;
  }

  getAppointment(reference) {
    return this.data.appointments.find(a => a.reference === reference);
  }

  getAppointmentById(id) {
    return this.data.appointments.find(a => a.id === id);
  }

  searchAppointmentsByPhone(phone) {
    return this.data.appointments.filter(a => a.phone.includes(phone.replace(/\s/g, '')));
  }

  searchAppointmentsByChrono(chrono) {
    return this.data.appointments.filter(a => a.chrono && a.chrono.includes(chrono));
  }

  searchAppointmentsByVIN(vin) {
    return this.data.appointments.filter(a => a.vin && a.vin.includes(vin));
  }

  searchAppointmentsByImmatriculation(immatriculation) {
    return this.data.appointments.filter(a => a.immatriculation && a.immatriculation.includes(immatriculation));
  }

  updateAppointment(id, data) {
    const appointment = this.data.appointments.find(a => a.id === id);
    if (!appointment) return null;
    Object.assign(appointment, data);
    this.save();
    return appointment;
  }

  cancelAppointment(reference) {
    const appointment = this.getAppointment(reference);
    if (!appointment) return null;
    appointment.status = 'cancelled';
    this.save();
    return appointment;
  }

  // Closures
  getClosures() {
    return this.data.closures;
  }

  addClosure(data) {
    const closure = {
      id: generateId(),
      ...data,
    };
    this.data.closures.push(closure);
    this.save();
    return closure;
  }

  deleteClosure(id) {
    this.data.closures = this.data.closures.filter(c => c.id !== id);
    this.save();
  }

  updateClosure(id, data) {
    const closure = this.data.closures.find(c => c.id === id);
    if (!closure) return null;
    Object.assign(closure, data);
    this.save();
    return closure;
  }

  // Holidays
  getHolidays() {
    return this.data.holidays || [];
  }

  addHoliday(data) {
    if (!this.data.holidays) this.data.holidays = [];
    const holiday = {
      id: generateId(),
      ...data,
    };
    this.data.holidays.push(holiday);
    this.save();
    return holiday;
  }

  deleteHoliday(id) {
    if (!this.data.holidays) this.data.holidays = [];
    this.data.holidays = this.data.holidays.filter(h => h.id !== id);
    this.save();
  }

  // Exceptional Capacities
  getExceptionalCapacities() {
    return this.data.exceptionalCapacities || [];
  }

  addExceptionalCapacity(data) {
    if (!this.data.exceptionalCapacities) this.data.exceptionalCapacities = [];
    
    // Convertir date JJ/MM/AAAA → AAAA-MM-JJ
    let dateStr = data.date;
    if (data.date && data.date.includes('/')) {
      const [day, month, year] = data.date.split('/');
      dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    const ec = {
      id: generateId(),
      centreId: data.centreId,
      capacity: parseInt(data.capacity),
      type: data.type || 'date',
      reason: data.reason || '',
      createdAt: new Date().toISOString()
    };

    // Ajouter les champs selon le type
    if (data.type === 'date' && data.date) {
      ec.date = dateStr;
    } else if (data.type === 'period' && data.startDate && data.endDate) {
      ec.startDate = data.startDate;
      ec.endDate = data.endDate;
    } else if (data.type === 'weekday' && data.weekday) {
      ec.weekday = data.weekday;
    }
    
    console.log('✅ Adding exceptional capacity:', ec);
    this.data.exceptionalCapacities.push(ec);
    this.save();
    console.log('✅ Saved. Total capacities:', this.data.exceptionalCapacities.length);
    return ec;
  }

  updateExceptionalCapacity(id, data) {
    if (!this.data.exceptionalCapacities) this.data.exceptionalCapacities = [];
    const ec = this.data.exceptionalCapacities.find(e => e.id === id);
    if (!ec) return null;
    Object.assign(ec, data);
    this.save();
    return ec;
  }

  deleteExceptionalCapacity(id) {
    if (!this.data.exceptionalCapacities) this.data.exceptionalCapacities = [];
    this.data.exceptionalCapacities = this.data.exceptionalCapacities.filter(e => e.id !== id);
    this.save();
  }

  getExceptionalCapacityForDate(centreId, dateStr) {
    if (!this.data.exceptionalCapacities) this.data.exceptionalCapacities = [];
    
    console.log(`🔍 Looking for capacity for centre=${centreId}, date=${dateStr}`);
    
    // Check specific date
    const specificDate = this.data.exceptionalCapacities.find(e => 
      e.centreId === centreId && e.type === 'date' && e.date === dateStr
    );
    if (specificDate) {
      console.log(`✅ Found DATE capacity:`, specificDate.capacity);
      return specificDate;
    }

    // Check period
    const date = new Date(dateStr);
    const periodCap = this.data.exceptionalCapacities.find(e => {
      if (e.centreId !== centreId || e.type !== 'period') return false;
      const startDate = new Date(e.startDate);
      const endDate = new Date(e.endDate);
      return startDate <= date && date <= endDate;
    });
    if (periodCap) {
      console.log(`✅ Found PERIOD capacity:`, periodCap.capacity);
      return periodCap;
    }

    // Check weekday (recurring)
    const dayOfWeek = date.getDay();
    const dayLetters = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const dayLetter = dayLetters[dayOfWeek];
    const weekdayCap = this.data.exceptionalCapacities.find(e => 
      e.centreId === centreId && e.type === 'weekday' && e.weekday === dayLetter
    );
    if (weekdayCap) {
      console.log(`✅ Found WEEKDAY capacity for ${dayLetter}:`, weekdayCap.capacity);
      return weekdayCap;
    }

    console.log(`❌ No capacity found`);
    return null;
  }

  // Stats
  getStats() {
    const appointments = this.data.appointments;
    return {
      totalAppointments: appointments.length,
      reserved: appointments.filter(a => a.status === 'reserved').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      absent: appointments.filter(a => a.status === 'absent').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };
  }

  getPDGStats() {
    const appointments = this.data.appointments;
    const statsByCentre = this.data.centres.map(centre => ({
      centreId: centre.id,
      centreName: centre.name,
      total: appointments.filter(a => a.centreId === centre.id).length,
      reserved: appointments.filter(a => a.centreId === centre.id && a.status === 'reserved').length,
      completed: appointments.filter(a => a.centreId === centre.id && a.status === 'completed').length,
      absent: appointments.filter(a => a.centreId === centre.id && a.status === 'absent').length,
      cancelled: appointments.filter(a => a.centreId === centre.id && a.status === 'cancelled').length,
    }));

    return {
      totalAppointments: appointments.length,
      reserved: appointments.filter(a => a.status === 'reserved').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      absent: appointments.filter(a => a.status === 'absent').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      byCentre: statsByCentre,
    };
  }

  getAgentAppointments(agentId, period = 'all') {
    const agent = this.data.agents.find(a => a.id === agentId);
    if (!agent) return [];

    const appointments = this.data.appointments.filter(a => a.centreId === agent.centreId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (period === 'today') {
      return appointments.filter(a => {
        const apptDate = new Date(a.date);
        apptDate.setHours(0, 0, 0, 0);
        return apptDate.getTime() === today.getTime();
      });
    } else if (period === 'upcoming') {
      return appointments.filter(a => new Date(a.date) > today);
    } else if (period === 'past') {
      return appointments.filter(a => new Date(a.date) < today);
    }

    return appointments;
  }

  updateAppointmentStatus(id, status) {
    const appointment = this.data.appointments.find(a => a.id === id);
    if (!appointment) return null;
    appointment.status = status;
    this.save();
    return appointment;
  }

  // Ajouter un jour exceptionnellement ouvert
  addExceptionallyOpen(centreId, date, reason = '') {
    const id = generateId();
    const entry = { id, centreId, date, reason, createdAt: new Date().toISOString() };
    this.data.exceptionallyOpen.push(entry);
    this.save();
    return entry;
  }

  // Ajouter un jour exceptionnellement fermé
  addExceptionallyClosed(centreId, date, reason = '') {
    const id = generateId();
    const entry = { id, centreId, date, reason, createdAt: new Date().toISOString() };
    this.data.exceptionallyClosed.push(entry);
    this.save();
    return entry;
  }

  // Supprimer un jour exceptionnellement ouvert
  removeExceptionallyOpen(id) {
    this.data.exceptionallyOpen = this.data.exceptionallyOpen.filter(e => e.id !== id);
    this.save();
  }

  // Supprimer un jour exceptionnellement fermé
  removeExceptionallyClosed(id) {
    this.data.exceptionallyClosed = this.data.exceptionallyClosed.filter(e => e.id !== id);
    this.save();
  }

  // Obtenir les jours exceptionnels d'un centre
  getExceptionalDaysForCentre(centreId) {
    return {
      open: this.data.exceptionallyOpen.filter(e => e.centreId === centreId),
      closed: this.data.exceptionallyClosed.filter(e => e.centreId === centreId)
    };
  }

  // ── Base véhicules (import CSV) ───────────────────────────────────────────

  getVehicles() {
    if (!this.data.vehicles) this.data.vehicles = [];
    return this.data.vehicles;
  }

  lookupVehicle(immatriculation) {
    if (!this.data.vehicles) return null;
    const key = immatriculation.toUpperCase().replace(/\s/g, '');
    return this.data.vehicles.find(v =>
      v.immatriculation.toUpperCase().replace(/\s/g, '') === key
    ) || null;
  }

  importVehicles(rows) {
    // rows = [{ chrono, chassis, immatriculation }]
    if (!this.data.vehicles) this.data.vehicles = [];
    let added = 0, updated = 0, errors = 0;
    for (const row of rows) {
      const immat = (row.immatriculation || '').trim().toUpperCase();
      const chassis = (row.chassis || '').trim().toUpperCase();
      const chrono = (row.chrono || '').trim().toUpperCase();
      if (!immat && !chassis) { errors++; continue; }
      const existing = this.data.vehicles.find(v => v.immatriculation === immat);
      if (existing) {
        existing.chassis = chassis;
        existing.chrono  = chrono;
        updated++;
      } else {
        this.data.vehicles.push({ id: generateId(), immatriculation: immat, chassis, chrono });
        added++;
      }
    }
    this.save();
    return { added, updated, errors, total: rows.length };
  }

  deleteAllVehicles() {
    this.data.vehicles = [];
    this.save();
  }
}

export default new Store();
