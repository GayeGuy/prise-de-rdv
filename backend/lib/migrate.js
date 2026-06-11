/**
 * migrate.js — Création des tables PostgreSQL
 * Appelé au démarrage du serveur (CREATE TABLE IF NOT EXISTS)
 */
import { query } from './db.js';

export async function migrate() {
  console.log('🔄 Migration PostgreSQL...');

  await query(`
    CREATE TABLE IF NOT EXISTS centres (
      id           TEXT PRIMARY KEY,
      code         TEXT NOT NULL,
      name         TEXT NOT NULL,
      type         TEXT NOT NULL DEFAULT 'PIMO',
      region       TEXT,
      commune      TEXT,
      address      TEXT,
      daily_capacity INTEGER DEFAULT 50,
      work_days    JSONB DEFAULT '["L","M","M","J","V"]',
      include_holidays BOOLEAN DEFAULT true,
      status       TEXT DEFAULT 'active',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS agents (
      id           TEXT PRIMARY KEY,
      username     TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      name         TEXT,
      email        TEXT,
      role         TEXT DEFAULT 'agent',
      centre_id    TEXT REFERENCES centres(id),
      status       TEXT DEFAULT 'active',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id              TEXT PRIMARY KEY,
      reference       TEXT UNIQUE NOT NULL,
      centre_id       TEXT REFERENCES centres(id),
      nom             TEXT NOT NULL,
      prenom          TEXT NOT NULL,
      phone           TEXT NOT NULL,
      email           TEXT,
      date            DATE NOT NULL,
      chrono          TEXT,
      immatriculation TEXT,
      vin             TEXT,
      status          TEXT DEFAULT 'reserved',
      photo_recto     TEXT,
      photo_verso     TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS closures (
      id          TEXT PRIMARY KEY,
      centre_id   TEXT,
      date        DATE NOT NULL,
      reason      TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS holidays (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      date        DATE NOT NULL,
      year        INTEGER NOT NULL,
      is_fixed    BOOLEAN DEFAULT false,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS exceptional_capacities (
      id          TEXT PRIMARY KEY,
      centre_id   TEXT REFERENCES centres(id),
      date        DATE NOT NULL,
      capacity    INTEGER NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS exceptional_days (
      id          TEXT PRIMARY KEY,
      centre_id   TEXT REFERENCES centres(id),
      date        DATE NOT NULL,
      type        TEXT NOT NULL,
      reason      TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id              TEXT PRIMARY KEY,
      immatriculation TEXT UNIQUE NOT NULL,
      chassis         TEXT,
      chrono          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Données initiales — centres par défaut
  await query(`
    INSERT INTO centres (id, code, name, type, region, commune, address, daily_capacity, work_days, include_holidays, status)
    VALUES
      ('centre1','C001','Centre PIMO Abidjan','PIMO','Abidjan','Abidjan','123 Rue du Port',50,'["L","M","M","J","V"]',true,'active'),
      ('centre2','C002','Centre Immatriculation Cocody','POST_REIMMAT','Cocody','Cocody','456 Av. des Nations',40,'["L","M","M","J","V"]',true,'active')
    ON CONFLICT (id) DO NOTHING
  `);

  // Admin par défaut
  await query(`
    INSERT INTO agents (id, username, password, name, role, status)
    VALUES
      ('admin1','admin','admin123','Administrateur','admin','active'),
      ('pdg1','pdg','pdg123','Directeur Général','pdg','active'),
      ('agent1','agent1','agent123','Agent Test','agent','active')
    ON CONFLICT (id) DO NOTHING
  `);

  console.log('✅ Migration terminée');
}
