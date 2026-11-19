import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createHash, pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { makeWorkspaceStore } from './workspace.mjs'

export const ADMIN_ID = 'central-ti-administrador'
const ADMIN_SALT = 'CentralTI-Lanobrasil-admin-v1'
const ADMIN_HASH = '0ab7169b22b1592592814ffee603df8ca3de5ed6969a9668671ec7340f40c386'
const DEFAULT_PROFILES = [
  ['ana', 'Ana Martins', 'Infraestrutura', 'AM'],
  ['bruno', 'Bruno Costa', 'Suporte', 'BC'],
  ['carla', 'Carla Souza', 'Sistemas', 'CS'],
]
const digest = value => createHash('sha256').update(value).digest('hex')
const passwordHash = (password, salt) => pbkdf2Sync(password, salt, 150000, 32, 'sha256').toString('hex')
const equalHash = (left, right) => {
  if (!left || !right || left.length !== right.length) return false
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))
}

export function openStore(file = resolve('local-data/central-ti.sqlite')) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  const firstRun = !db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='profiles'").get()
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, avatar TEXT NOT NULL,
      photo_data_url TEXT, archived INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '',
      password_salt TEXT, password_hash TEXT, setup_salt TEXT, setup_hash TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, profile_id TEXT NOT NULL, expires_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );
  `)
  if (!db.prepare('PRAGMA table_info(profiles)').all().some(column => column.name === 'deleted')) db.exec('ALTER TABLE profiles ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0')
  db.prepare('INSERT OR IGNORE INTO profiles (id,name,role,avatar,password_salt,password_hash) VALUES (?,?,?,?,?,?)').run(ADMIN_ID, 'Administrador TI', 'Administrador', 'AT', ADMIN_SALT, ADMIN_HASH)
  if (firstRun) for (const profile of DEFAULT_PROFILES) db.prepare('INSERT OR IGNORE INTO profiles (id,name,role,avatar) VALUES (?,?,?,?)').run(...profile)

  const profile = id => db.prepare('SELECT * FROM profiles WHERE id = ?').get(id)
  const publicProfile = row => ({ id: row.id, name: row.name, role: row.role, avatar: row.avatar, photoDataUrl: row.photo_data_url ?? undefined, archived: !!row.archived, deleted: !!row.deleted, passwordSet: !!row.password_hash, setupPending: !!row.setup_hash })
  const listProfiles = includeArchived => db.prepare(`SELECT * FROM profiles ${includeArchived ? '' : 'WHERE archived = 0 AND deleted = 0'} ORDER BY CASE WHEN id = ? THEN 1 ELSE 0 END, name`).all(ADMIN_ID).map(publicProfile)
  const createSession = id => { const token = randomBytes(32).toString('base64url'); db.prepare('INSERT INTO sessions (token_hash,profile_id,expires_at) VALUES (?,?,?)').run(digest(token), id, Date.now() + 8 * 3600_000); return token }
  const sessionProfile = token => {
    if (!token) return null
    const row = db.prepare('SELECT p.* FROM sessions s JOIN profiles p ON p.id=s.profile_id WHERE s.token_hash=? AND s.expires_at>? AND p.archived=0 AND p.deleted=0').get(digest(token), Date.now())
    return row ?? null
  }
  const setPassword = (id, password) => { const salt = randomBytes(24).toString('hex'); db.prepare('UPDATE profiles SET password_salt=?,password_hash=?,setup_salt=NULL,setup_hash=NULL WHERE id=?').run(salt, passwordHash(password, salt), id) }
  const issueSetupCode = id => { const code = randomBytes(18).toString('base64url'); const salt = randomBytes(16).toString('hex'); db.prepare('UPDATE profiles SET setup_salt=?,setup_hash=? WHERE id=?').run(salt, passwordHash(code, salt), id); return code }
  let closed = false
  const workspace = makeWorkspaceStore(db)

  return {
    ...workspace,
    close: () => { if (!closed) { closed = true; db.close() } }, profile, publicProfile, listProfiles, createSession, sessionProfile,
    destroySession: token => { if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token)) },
    login(id, password) { const row = profile(id); if (!row || row.archived || row.deleted || !row.password_hash || !equalHash(passwordHash(password, row.password_salt), row.password_hash)) return null; return createSession(id) },
    setup(id, code, password) { const row = profile(id); if (!row || row.archived || row.deleted || row.password_hash || !row.setup_hash || !equalHash(passwordHash(code, row.setup_salt), row.setup_hash)) return null; setPassword(id, password); return createSession(id) },
    notes: id => profile(id)?.notes ?? '',
    saveNotes(id, notes) { db.prepare('UPDATE profiles SET notes=? WHERE id=?').run(notes, id) },
    savePhoto(id, photo) { db.prepare('UPDATE profiles SET photo_data_url=? WHERE id=?').run(photo, id) },
    createProfile(name, role) { const id = randomUUID(); const avatar = name.split(/\s+/).slice(0, 2).map(part => part[0]?.toLocaleUpperCase('pt-BR')).join(''); db.prepare('INSERT INTO profiles (id,name,role,avatar) VALUES (?,?,?,?)').run(id, name, role, avatar); return { ...publicProfile(profile(id)), setupCode: issueSetupCode(id) } },
    issueSetupCode,
    resetPassword(id, password) { setPassword(id, password); db.prepare('DELETE FROM sessions WHERE profile_id=?').run(id) },
    deleteProfile: id => workspace.deleteProfile(id),
    archive(id) { db.prepare('UPDATE profiles SET archived=1 WHERE id=? AND id<>? AND deleted=0').run(id, ADMIN_ID); db.prepare('DELETE FROM sessions WHERE profile_id=?').run(id) },
    restore(id) { db.prepare('UPDATE profiles SET archived=0 WHERE id=? AND deleted=0').run(id) },
  }
}
