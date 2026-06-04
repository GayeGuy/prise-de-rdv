/**
 * Routes pour la gestion des jours fériés
 */

import { Router } from 'express';
import { getHolidaysForYear, isHoliday, getHolidayName } from './holidays-ci.js';
import store from './store.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = Router();

// Route publique : Obtenir tous les jours fériés d'une année
router.get('/holidays', (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const holidays = getHolidaysForYear(year);
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route admin : Ajouter un jour exceptionnellement ouvert
router.post('/admin/exceptional-days/open', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { centreId, date, reason } = req.body;
    if (!centreId || !date) {
      return res.status(400).json({ error: 'centreId et date requis' });
    }
    const entry = store.addExceptionallyOpen(centreId, date, reason);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route admin : Ajouter un jour exceptionnellement fermé
router.post('/admin/exceptional-days/closed', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { centreId, date, reason } = req.body;
    if (!centreId || !date) {
      return res.status(400).json({ error: 'centreId et date requis' });
    }
    const entry = store.addExceptionallyClosed(centreId, date, reason);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route admin : Supprimer une exception
router.delete('/admin/exceptional-days/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const isOpen = store.data.exceptionallyOpen.some(e => e.id === id);
    
    if (isOpen) {
      store.removeExceptionallyOpen(id);
    } else {
      store.removeExceptionallyClosed(id);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route admin : Obtenir les exceptions d'un centre
router.get('/admin/centres/:centreId/exceptions', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { centreId } = req.params;
    const exceptions = store.getExceptionalDaysForCentre(centreId);
    res.json(exceptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
