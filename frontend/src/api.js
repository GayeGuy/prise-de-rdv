const API_URL = 'http://localhost:3001/api';

export const api = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    localStorage.setItem('token', token);
  },

  clearToken() {
    localStorage.removeItem('token');
  },

  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const token = this.getToken();
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, options);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        
        // Handle JSON errors
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            throw new Error(error.error || `Erreur ${response.status}`);
          } catch (e) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          }
        }
        
        // Handle HTML errors (redirect, 500, etc)
        if (contentType && contentType.includes('text/html')) {
          if (response.status === 401 || response.status === 403) {
            this.clearToken();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return response.text();
    } catch (err) {
      console.error('❌ API Error:', err);
      throw err;
    }
  },

  // Auth
  async login(username, password) {
    return this.request('POST', '/auth/login', { username, password });
  },

  // Centres
  async getCentres() {
    return this.request('GET', '/centres');
  },

  async getCentreAvailability(centreId, daysAhead = 30) {
    return this.request('GET', `/centres/${centreId}/availability?daysAhead=${daysAhead}`);
  },

  async createCentre(data) {
    return this.request('POST', '/admin/centres', data);
  },

  async updateCentre(id, data) {
    return this.request('PUT', `/admin/centres/${id}`, data);
  },

  // Appointments
  async createAppointment(data) {
    return this.request('POST', '/appointments', data);
  },

  async getAppointment(reference) {
    return this.request('GET', `/appointments/${reference}`);
  },

  async searchByPhone(phone) {
    return this.request('GET', `/appointments/search/${phone}`);
  },

  async searchByChrono(chrono) {
    return this.request('GET', `/appointments/search/chrono/${chrono}`);
  },

  async searchByVIN(vin) {
    return this.request('GET', `/appointments/search/vin/${vin}`);
  },

  async searchByImmatriculation(immatriculation) {
    return this.request('GET', `/appointments/search/immatriculation/${immatriculation}`);
  },

  async cancelAppointment(reference) {
    return this.request('DELETE', `/appointments/${reference}`);
  },

  async updateAppointment(id, data) {
    return this.request('PATCH', `/appointments/${id}`, data);
  },

  // Agent
  async getAgentAppointments(period = 'all') {
    return this.request('GET', `/agent/appointments?period=${period}`);
  },

  async updateAppointmentStatus(id, status) {
    return this.request('PATCH', `/agent/appointments/${id}/status`, { status });
  },

  // Admin
  async getAgents() {
    return this.request('GET', '/admin/agents');
  },

  async createAgent(data) {
    return this.request('POST', '/admin/agents', data);
  },

  async updateAgent(id, data) {
    return this.request('PATCH', `/admin/agents/${id}`, data);
  },

  async deleteAgent(id) {
    return this.request('DELETE', `/admin/agents/${id}`);
  },

  async getAdminStats() {
    return this.request('GET', '/admin/stats');
  },

  async getClosures() {
    return this.request('GET', '/admin/closures');
  },

  async addClosure(data) {
    return this.request('POST', '/admin/closures', data);
  },

  async deleteClosure(id) {
    return this.request('DELETE', `/admin/closures/${id}`);
  },

  async updateClosure(id, data) {
    return this.request('PATCH', `/admin/closures/${id}`, data);
  },

  async getHolidays(year = new Date().getFullYear()) {
    return this.request('GET', `/holidays?year=${year}`);
  },

  async addExceptionallyOpen(centreId, date, reason = '') {
    return this.request('POST', '/admin/exceptional-days/open', { centreId, date, reason });
  },

  async addExceptionallyClosed(centreId, date, reason = '') {
    return this.request('POST', '/admin/exceptional-days/closed', { centreId, date, reason });
  },

  async deleteExceptionalDay(id) {
    return this.request('DELETE', `/admin/exceptional-days/${id}`);
  },

  async getCentreExceptions(centreId) {
    return this.request('GET', `/admin/centres/${centreId}/exceptions`);
  },

  async addHoliday(data) {
    return this.request('POST', '/admin/holidays', data);
  },

  async deleteHoliday(id) {
    return this.request('DELETE', `/admin/holidays/${id}`);
  },

  async getExceptionalCapacities() {
    return this.request('GET', '/admin/exceptional-capacities');
  },

  async addExceptionalCapacity(data) {
    return this.request('POST', '/admin/exceptional-capacities', data);
  },

  async updateExceptionalCapacity(id, data) {
    return this.request('PATCH', `/admin/exceptional-capacities/${id}`, data);
  },

  async deleteExceptionalCapacity(id) {
    return this.request('DELETE', `/admin/exceptional-capacities/${id}`);
  },

  // PDG
  async getPDGStats() {
    return this.request('GET', '/pdg/stats');
  },

  async exportPDGData() {
    const data = await this.request('GET', '/pdg/export');
    const csv = [
      ['Référence', 'Centre', 'Date', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Statut'],
      ...data.map(a => [a.reference, a.centreName, a.date, a.nom, a.prenom, a.phone, a.email, a.status])
    ].map(row => row.map(v => `"${v || ''}"`).join(',')).join('\n');

    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  },
};
