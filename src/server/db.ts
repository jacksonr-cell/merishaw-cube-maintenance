import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes } from 'node:crypto';
import path from 'node:path';

// Initialize SQLite database instance
const dbPath = path.resolve(process.cwd(), 'merishaw_system.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high reliability and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = scryptSync(password, salt, 64).toString('hex');
  return testHash === hash;
}

export function initDatabase() {
  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      identifier_code TEXT UNIQUE NOT NULL, -- Student ID or Staff ID or Admin ID
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'student', 'supervisor')),
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      phone TEXT,
      department TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      campus_zone TEXT NOT NULL,
      total_floors INTEGER NOT NULL DEFAULT 4,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      floor_number INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      block_id TEXT NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
      room_number TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 4,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cubes (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      cube_number TEXT NOT NULL, -- e.g. Cube A, Cube B, Cube C, Cube D
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'occupied' CHECK(status IN ('occupied', 'vacant', 'maintenance')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_assignments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      cube_id TEXT NOT NULL REFERENCES cubes(id) ON DELETE RESTRICT,
      academic_year TEXT NOT NULL,
      semester TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fault_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      default_priority TEXT NOT NULL DEFAULT 'medium' CHECK(default_priority IN ('low', 'medium', 'high', 'emergency')),
      sla_hours INTEGER NOT NULL DEFAULT 24,
      affected_items_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      reference_no TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      cube_id TEXT NOT NULL REFERENCES cubes(id) ON DELETE RESTRICT,
      category_id TEXT NOT NULL REFERENCES fault_categories(id) ON DELETE RESTRICT,
      affected_item TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'emergency')),
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'emergency')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN (
        'Submitted', 'Pending Review', 'Assigned', 'In Progress', 
        'Awaiting Parts', 'Awaiting Access', 'Resolved', 'Closed', 'Reopened', 'Rejected'
      )),
      assigned_to_staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      rejection_reason TEXT,
      resolution_summary TEXT,
      materials_used_summary TEXT,
      is_escalated INTEGER NOT NULL DEFAULT 0,
      escalation_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_at DATETIME,
      resolved_at DATETIME,
      closed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ticket_status_history (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      changed_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      notes TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_logs (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      staff_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      action_taken TEXT NOT NULL,
      parts_used TEXT,
      time_spent_minutes INTEGER NOT NULL DEFAULT 30,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      message TEXT NOT NULL,
      is_internal INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_tickets_student ON tickets(student_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_staff ON tickets(assigned_to_staff_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_cube ON tickets(cube_id);
    CREATE INDEX IF NOT EXISTS idx_status_history_ticket ON ticket_status_history(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_work_logs_ticket ON work_logs(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `);

  seedInitialData();
}

function seedInitialData() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) {
    return; // Already initialized
  }

  console.log('Seeding initial Merishaw Cube Maintenance System data...');

  // Default credentials
  // Admin: admin@merishaw.edu / Admin@Merishaw2026!
  // Staff 1: john.staff@merishaw.edu / Staff@Merishaw2026!
  // Staff 2: sarah.electrician@merishaw.edu / Staff@Merishaw2026!
  // Student 1: alex.student@merishaw.edu / Student@Merishaw2026!
  // Student 2: grace.student@merishaw.edu / Student@Merishaw2026!
  const adminPass = hashPassword('Admin@Merishaw2026!');
  const staffPass = hashPassword('Staff@Merishaw2026!');
  const studentPass = hashPassword('Student@Merishaw2026!');

  // Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, identifier_code, full_name, role, password_hash, salt, phone, department, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertUser.run(
    'usr_admin_01',
    'admin@merishaw.edu',
    'ADM-2026-001',
    'Dr. Evelyn Mwangi',
    'admin',
    adminPass.hash,
    adminPass.salt,
    '+254 700 112 233',
    'Directorate of Student Accommodation'
  );

  insertUser.run(
    'usr_staff_01',
    'john.staff@merishaw.edu',
    'STF-1044',
    'John Otieno',
    'staff',
    staffPass.hash,
    staffPass.salt,
    '+254 711 445 566',
    'Plumbing & General Repairs'
  );

  insertUser.run(
    'usr_staff_02',
    'sarah.electrician@merishaw.edu',
    'STF-1088',
    'Sarah Muthoni',
    'staff',
    staffPass.hash,
    staffPass.salt,
    '+254 722 778 899',
    'Electrical & Power Systems'
  );

  insertUser.run(
    'usr_student_01',
    'alex.student@merishaw.edu',
    'STD-2024-8841',
    'Alex Kiprono',
    'student',
    studentPass.hash,
    studentPass.salt,
    '+254 733 990 011',
    'School of Computing'
  );

  insertUser.run(
    'usr_student_02',
    'grace.student@merishaw.edu',
    'STD-2024-9102',
    'Grace Chebet',
    'student',
    studentPass.hash,
    studentPass.salt,
    '+254 744 223 344',
    'School of Engineering'
  );

  // Buildings
  const insertBuilding = db.prepare(`
    INSERT INTO buildings (id, name, code, campus_zone, total_floors)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertBuilding.run('bld_01', 'Mount Meru Hall', 'MMH', 'North Campus Quad', 4);
  insertBuilding.run('bld_02', 'Great Rift Residence', 'GRR', 'Central Student Village', 5);
  insertBuilding.run('bld_03', 'Kilimanjaro Complex', 'KJC', 'South Residential Hill', 3);

  // Blocks
  const insertBlock = db.prepare(`
    INSERT INTO blocks (id, building_id, name, floor_number)
    VALUES (?, ?, ?, ?)
  `);

  insertBlock.run('blk_01', 'bld_01', 'Block A (Ground Floor)', 0);
  insertBlock.run('blk_02', 'bld_01', 'Block B (Second Floor)', 2);
  insertBlock.run('blk_03', 'bld_02', 'Wing A (First Floor)', 1);
  insertBlock.run('blk_04', 'bld_02', 'Wing B (Third Floor)', 3);
  insertBlock.run('blk_05', 'bld_03', 'East Annex', 1);

  // Rooms
  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, block_id, room_number, capacity)
    VALUES (?, ?, ?, ?)
  `);

  insertRoom.run('rm_01', 'blk_02', 'Room 204', 4);
  insertRoom.run('rm_02', 'blk_02', 'Room 205', 4);
  insertRoom.run('rm_03', 'blk_03', 'Room 102', 4);
  insertRoom.run('rm_04', 'blk_03', 'Room 103', 4);
  insertRoom.run('rm_05', 'blk_01', 'Room 008', 2);

  // Cubes
  const insertCube = db.prepare(`
    INSERT INTO cubes (id, room_id, cube_number, label, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Room 204 cubes
  insertCube.run('cb_01', 'rm_01', 'Cube A', 'Cube 204-A (Window Left)', 'occupied');
  insertCube.run('cb_02', 'rm_01', 'Cube B', 'Cube 204-B (Window Right)', 'occupied');
  insertCube.run('cb_03', 'rm_01', 'Cube C', 'Cube 204-C (Door Left)', 'vacant');
  insertCube.run('cb_04', 'rm_01', 'Cube D', 'Cube 204-D (Door Right)', 'occupied');

  // Room 102 cubes
  insertCube.run('cb_05', 'rm_03', 'Cube A', 'Cube 102-A (Study Corner)', 'occupied');
  insertCube.run('cb_06', 'rm_03', 'Cube B', 'Cube 102-B (Center Bunk)', 'occupied');
  insertCube.run('cb_07', 'rm_03', 'Cube C', 'Cube 102-C (Balcony Side)', 'occupied');
  insertCube.run('cb_08', 'rm_03', 'Cube D', 'Cube 102-D (Entrance Side)', 'maintenance');

  // Student assignments
  const insertAssignment = db.prepare(`
    INSERT INTO student_assignments (id, student_id, cube_id, academic_year, semester, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  insertAssignment.run('asg_01', 'usr_student_01', 'cb_01', '2025/2026', 'Semester 1');
  insertAssignment.run('asg_02', 'usr_student_02', 'cb_07', '2025/2026', 'Semester 1');

  // Fault categories
  const categories = [
    {
      id: 'cat_elec',
      name: 'Electrical Faults',
      code: 'ELEC',
      description: 'Power sockets, switches, short circuits, tripped breakers, and wiring',
      default_priority: 'high',
      sla_hours: 12,
      affected_items: ['Wall Power Socket', 'Light Switch', 'Circuit Breaker', 'Exposed Wiring', 'Desk Power Strip']
    },
    {
      id: 'cat_light',
      name: 'Lighting & Fixtures',
      code: 'LIGHT',
      description: 'Cube study lamp, overhead ceiling tube, hallway light, and ballast',
      default_priority: 'medium',
      sla_hours: 24,
      affected_items: ['Ceiling LED Tube', 'Cube Study Lamp', 'Corridor Light', 'Bulb Holder', 'Diffuser Panel']
    },
    {
      id: 'cat_plumb',
      name: 'Plumbing & Water',
      code: 'PLUMB',
      description: 'Taps, sinks, water leaks, low water pressure, and drainage blockages',
      default_priority: 'high',
      sla_hours: 8,
      affected_items: ['Sink Tap', 'Drain Pipe Leak', 'Water Supply Line', 'Drainage Trap', 'Washbasin']
    },
    {
      id: 'cat_sanit',
      name: 'Toilets & Bathrooms',
      code: 'SANIT',
      description: 'Toilet flushing system, shower heads, bathroom locks, and drainage',
      default_priority: 'high',
      sla_hours: 6,
      affected_items: ['Toilet Flush Cistern', 'Shower Head', 'Bathroom Drain', 'Toilet Seat', 'Partition Latch']
    },
    {
      id: 'cat_doors',
      name: 'Doors & Locks',
      code: 'DOORS',
      description: 'Room entrance door, cube privacy lock, key cylinder, and hinges',
      default_priority: 'high',
      sla_hours: 12,
      affected_items: ['Cube Lock Cylinder', 'Door Handle', 'Door Hinge', 'Door Closer', 'Key Padlock Latch']
    },
    {
      id: 'cat_wind',
      name: 'Windows & Glazing',
      code: 'WIND',
      description: 'Window frame, cracked glass pane, window stays, and insect mesh',
      default_priority: 'medium',
      sla_hours: 24,
      affected_items: ['Window Handle', 'Glass Pane', 'Insect Screen Net', 'Window Stay Arm', 'Weather Seal']
    },
    {
      id: 'cat_bed',
      name: 'Beds & Mattresses',
      code: 'BED',
      description: 'Bunk frame, ladder rungs, safety rails, bed base slats, and mattress',
      default_priority: 'medium',
      sla_hours: 36,
      affected_items: ['Bunk Bed Frame', 'Bunk Ladder Rung', 'Mattress Support Slats', 'Safety Railing', 'Foam Mattress']
    },
    {
      id: 'cat_furn',
      name: 'Desks & Chairs',
      code: 'FURN',
      description: 'Study desk surface, drawers, task chair wheels, and backrest',
      default_priority: 'low',
      sla_hours: 48,
      affected_items: ['Study Desk Top', 'Desk Drawer Slider', 'Study Chair Castors', 'Chair Backrest', 'Book Rack']
    },
    {
      id: 'cat_store',
      name: 'Cupboards & Storage',
      code: 'STORE',
      description: 'Wardrobe door hinges, internal shelving, locker lock, and hanging rails',
      default_priority: 'low',
      sla_hours: 48,
      affected_items: ['Wardrobe Door Hinge', 'Locker Padlock Ear', 'Storage Shelf', 'Hanging Rail', 'Cabinet Handle']
    },
    {
      id: 'cat_struct',
      name: 'Structural & Walls',
      code: 'STRUCT',
      description: 'Wall plaster cracks, ceiling dampness, moisture stains, and paint peel',
      default_priority: 'low',
      sla_hours: 72,
      affected_items: ['Wall Plaster', 'Ceiling Dampness', 'Floor Skirting', 'Moisture Seepage', 'Ventilation Grille']
    },
    {
      id: 'cat_other',
      name: 'Other Maintenance',
      code: 'OTHER',
      description: 'Special requests, noise isolation, or unlisted accommodation issues',
      default_priority: 'low',
      sla_hours: 48,
      affected_items: ['Trash Bin', 'Notice Board', 'General Carpentry', 'Miscellaneous Hardware']
    }
  ];

  const insertCategory = db.prepare(`
    INSERT INTO fault_categories (id, name, code, description, default_priority, sla_hours, affected_items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cat of categories) {
    insertCategory.run(
      cat.id,
      cat.name,
      cat.code,
      cat.description,
      cat.default_priority,
      cat.sla_hours,
      JSON.stringify(cat.affected_items)
    );
  }

  // System bootstrap audit log entry
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, ip_address, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  insertAudit.run('aud_01', 'usr_admin_01', 'SYSTEM_INITIALIZED', 'system', 'sys_01', JSON.stringify({ note: 'Initial institutional database bootstrap complete' }), '127.0.0.1');

  console.log('Database initialization complete: institutional locations, categories, and administrative accounts provisioned.');
}
