/**
 * migrate.js — Création des tables PostgreSQL
 * Appelé au démarrage du serveur (idempotent)
 */
import { query } from './db.js';

export async function migrate() {
  console.log('🔄 Migration PostgreSQL...');

  await query(`
    CREATE TABLE IF NOT EXISTS centres (
      id               TEXT PRIMARY KEY,
      code             TEXT NOT NULL,
      name             TEXT NOT NULL,
      type             TEXT NOT NULL DEFAULT 'PIMO',
      region           TEXT NOT NULL DEFAULT '',
      commune          TEXT NOT NULL DEFAULT '',
      address          TEXT NOT NULL DEFAULT '',
      daily_capacity   INTEGER NOT NULL DEFAULT 50,
      work_days        JSONB NOT NULL DEFAULT '["L","M","M","J","V"]',
      include_holidays BOOLEAN NOT NULL DEFAULT false,
      status           TEXT NOT NULL DEFAULT 'active',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS agents (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      name       TEXT NOT NULL DEFAULT '',
      email      TEXT NOT NULL DEFAULT '',
      role       TEXT NOT NULL DEFAULT 'agent',
      centre_id  TEXT REFERENCES centres(id) ON DELETE SET NULL,
      status     TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id              TEXT PRIMARY KEY,
      reference       TEXT NOT NULL UNIQUE,
      centre_id       TEXT REFERENCES centres(id) ON DELETE SET NULL,
      nom             TEXT NOT NULL,
      prenom          TEXT NOT NULL,
      phone           TEXT NOT NULL,
      email           TEXT,
      date            DATE NOT NULL,
      chrono          TEXT,
      immatriculation TEXT,
      vin             TEXT,
      status          TEXT NOT NULL DEFAULT 'reserved',
      photo_recto     TEXT,
      photo_verso     TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS closures (
      id         TEXT PRIMARY KEY,
      centre_id  TEXT,
      date       DATE NOT NULL,
      reason     TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS holidays (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      date       DATE NOT NULL,
      year       INTEGER NOT NULL,
      is_fixed   BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS exceptional_capacities (
      id         TEXT PRIMARY KEY,
      centre_id  TEXT NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
      date       DATE NOT NULL,
      capacity   INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS exceptional_days (
      id         TEXT PRIMARY KEY,
      centre_id  TEXT NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
      date       DATE NOT NULL,
      type       TEXT NOT NULL,
      reason     TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id              TEXT PRIMARY KEY,
      immatriculation TEXT NOT NULL UNIQUE,
      chassis         TEXT,
      chrono          TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Centres par défaut — ON CONFLICT sur id (safe)
  await query(`
  INSERT INTO centres (id, code, name, type, region, commune, address, daily_capacity, work_days, include_holidays, status)
  VALUES
    ('centre1', 'C001', 'Centre PIMO Abidjan',          'PIMO',        'Abidjan', 'Abidjan', '123 Rue du Port',    50, '["L","M","M","J","V"]', false, 'active'),
    ('centre2', 'C002', 'Centre Immatriculation Cocody', 'POST_REIMMAT','Cocody',  'Cocody',  '456 Av. des Nations', 40, '["L","M","M","J","V"]', false, 'active')
  ON CONFLICT (id) DO NOTHING
`);

  // Comptes par défaut — ON CONFLICT sur username (corrigé)
  await query(`
    INSERT INTO agents (id, username, password, name, role, status)
    VALUES
      ('admin1', 'admin',  'admin123', 'Administrateur',   'admin', 'active'),
      ('pdg1',   'pdg',    'pdg123',   'Directeur Général','pdg',   'active'),
      ('agent1', 'agent1', 'agent123', 'Agent Test',       'agent', 'active')
    ON CONFLICT (username) DO NOTHING
  `);

  console.log('✅ Migration terminée');
}
