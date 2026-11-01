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

  // Pre-seed realistic tickets
  const insertTicket = db.prepare(`
    INSERT INTO tickets (
      id, reference_no, student_id, cube_id, category_id, affected_item, severity,
      priority, title, description, status, assigned_to_staff_id, is_escalated,
      escalation_reason, created_at, updated_at, assigned_at, resolved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?), ?, ?)
  `);

  const insertStatusHistory = db.prepare(`
    INSERT INTO ticket_status_history (id, ticket_id, previous_status, new_status, changed_by_user_id, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertWorkLog = db.prepare(`
    INSERT INTO work_logs (id, ticket_id, staff_id, action_taken, parts_used, time_spent_minutes, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertComment = db.prepare(`
    INSERT INTO ticket_comments (id, ticket_id, user_id, message, is_internal, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, ticket_id, type, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  // Ticket 1: In Progress (Sarah Muthoni assigned)
  insertTicket.run(
    'tkt_01',
    'MSH-2026-0001',
    'usr_student_01',
    'cb_01',
    'cat_elec',
    'Wall Power Socket',
    'high',
    'high',
    'Desk wall socket sparks when laptop charger is plugged in',
    'The lower twin socket at Cube 204-A emits a spark and burning smell when plugging in standard power supplies. High risk of electrical short.',
    'In Progress',
    'usr_staff_02',
    0,
    null,
    '-2 days',
    '-4 hours',
    new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    null
  );

  insertStatusHistory.run('tsh_01', 'tkt_01', null, 'Submitted', 'usr_student_01', 'Report submitted via portal', '-2 days');
  insertStatusHistory.run('tsh_02', 'tkt_01', 'Submitted', 'Pending Review', 'usr_admin_01', 'Reviewed by accommodation desk', '-40 hours');
  insertStatusHistory.run('tsh_03', 'tkt_01', 'Pending Review', 'Assigned', 'usr_admin_01', 'Assigned to Sarah Muthoni (Electrical)', '-36 hours');
  insertStatusHistory.run('tsh_04', 'tkt_01', 'Assigned', 'In Progress', 'usr_staff_02', 'Inspected circuit; isolating breaker to replace backbox', '-4 hours');

  insertWorkLog.run(
    'wl_01',
    'tkt_01',
    'usr_staff_02',
    'Isolated power at DB-02. Removed damaged faceplate and discovered burnt terminal screw. Re-terminated copper conductors.',
    '13A Double Switched Socket Faceplate, heat-shrink tubing',
    45,
    'Awaiting replacement faceplate fastening screws before final re-energization.',
    '-4 hours'
  );

  insertComment.run(
    'tc_01',
    'tkt_01',
    'usr_staff_02',
    'Hi Alex, I have safely isolated the socket circuit. Please do not plug anything into the wall socket until I conclude installation this afternoon.',
    0,
    '-3 hours'
  );

  // Ticket 2: Resolved
  insertTicket.run(
    'tkt_02',
    'MSH-2026-0002',
    'usr_student_01',
    'cb_01',
    'cat_plumb',
    'Sink Tap',
    'medium',
    'medium',
    'Washbasin faucet dripping continuously',
    'The tap over the common washbasin near Cube A does not seal completely when turned off, wasting water.',
    'Resolved',
    'usr_staff_01',
    0,
    null,
    '-5 days',
    '-1 day',
    new Date(Date.now() - 4 * 86400000).toISOString(),
    new Date(Date.now() - 86400000).toISOString()
  );

  insertStatusHistory.run('tsh_05', 'tkt_02', null, 'Submitted', 'usr_student_01', 'Report submitted', '-5 days');
  insertStatusHistory.run('tsh_06', 'tkt_02', 'Submitted', 'Assigned', 'usr_admin_01', 'Assigned to John Otieno', '-4 days');
  insertStatusHistory.run('tsh_07', 'tkt_02', 'Assigned', 'In Progress', 'usr_staff_01', 'Carrying out washer replacement', '-2 days');
  insertStatusHistory.run('tsh_08', 'tkt_02', 'In Progress', 'Resolved', 'usr_staff_01', 'Replaced ceramic cartridge and tested flow', '-1 day');

  insertWorkLog.run(
    'wl_02',
    'tkt_02',
    'usr_staff_01',
    'Dismantled faucet body, removed degraded rubber O-ring and cracked ceramic disc. Installed new 1/2 inch cartridge and PTFE tape.',
    '1x 1/2" Ceramic Basin Valve, 1x PTFE thread seal tape',
    30,
    'Tested under pressure for 15 minutes. Zero leak observed.',
    '-1 day'
  );

  // Ticket 3: Awaiting Parts
  insertTicket.run(
    'tkt_03',
    'MSH-2026-0003',
    'usr_student_02',
    'cb_07',
    'cat_doors',
    'Cube Lock Cylinder',
    'high',
    'high',
    'Cube door lock cylinder seized with key difficulty',
    'The European profile cylinder lock on Cube 102-C catches and requires heavy force to turn. Student cannot reliably lock their cube.',
    'Awaiting Parts',
    'usr_staff_01',
    0,
    null,
    '-3 days',
    '-6 hours',
    new Date(Date.now() - 2 * 86400000).toISOString(),
    null
  );

  insertStatusHistory.run('tsh_09', 'tkt_03', null, 'Submitted', 'usr_student_02', 'Submitted report', '-3 days');
  insertStatusHistory.run('tsh_10', 'tkt_03', 'Submitted', 'Assigned', 'usr_admin_01', 'Assigned to John Otieno', '-2 days');
  insertStatusHistory.run('tsh_11', 'tkt_03', 'Assigned', 'In Progress', 'usr_staff_01', 'Inspected mechanism', '-1 day');
  insertStatusHistory.run('tsh_12', 'tkt_03', 'In Progress', 'Awaiting Parts', 'usr_staff_01', 'Requires 65mm Euro cylinder from central warehouse', '-6 hours');

  insertWorkLog.run(
    'wl_03',
    'tkt_03',
    'usr_staff_01',
    'Lubricated cylinder with graphite powder, but internal pin springs are broken. Requisitioned replacement cylinder #CYL-65-BRASS from stores.',
    'Graphite lubricant spray',
    20,
    'Requisition voucher #REQ-8829 submitted to procurement.',
    '-6 hours'
  );

  // Ticket 4: Pending Review (Submitted today)
  insertTicket.run(
    'tkt_04',
    'MSH-2026-0004',
    'usr_student_02',
    'cb_07',
    'cat_wind',
    'Window Handle',
    'medium',
    'medium',
    'Balcony window handle detached',
    'The aluminium casement handle came off the frame. The window is currently latched shut but cannot be opened for ventilation.',
    'Pending Review',
    null,
    0,
    null,
    '-5 hours',
    '-5 hours',
    null,
    null
  );

  insertStatusHistory.run('tsh_13', 'tkt_04', null, 'Submitted', 'usr_student_02', 'Student submitted report', '-5 hours');
  insertStatusHistory.run('tsh_14', 'tkt_04', 'Submitted', 'Pending Review', 'usr_admin_01', 'Marked for daily assignment queue', '-4 hours');

  // Notifications
  insertNotification.run('notif_01', 'usr_student_01', 'Work Started on Socket Repair', 'Technician Sarah Muthoni has begun work on ticket MSH-2026-0001.', 'tkt_01', 'progress', 0, '-4 hours');
  insertNotification.run('notif_02', 'usr_student_01', 'Tap Repaired and Resolved', 'Ticket MSH-2026-0002 has been marked as Resolved by John Otieno.', 'tkt_02', 'success', 1, '-1 day');
  insertNotification.run('notif_03', 'usr_student_02', 'Parts Requisitioned', 'Ticket MSH-2026-0003 status changed to Awaiting Parts.', 'tkt_03', 'warning', 0, '-6 hours');
  insertNotification.run('notif_04', 'usr_staff_01', 'New Job Assigned', 'You have been assigned to maintenance ticket MSH-2026-0003.', 'tkt_03', 'assignment', 0, '-2 days');
  insertNotification.run('notif_05', 'usr_staff_02', 'Urgent Electrical Job Assigned', 'Priority ticket MSH-2026-0001 in Mount Meru Hall assigned to you.', 'tkt_01', 'assignment', 1, '-36 hours');

  // Initial audit log
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, ip_address, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertAudit.run('aud_01', 'usr_admin_01', 'SYSTEM_INITIALIZED', 'system', 'sys_01', JSON.stringify({ note: 'Initial system bootstrap and seeding complete' }), '127.0.0.1', '-5 days');
  insertAudit.run('aud_02', 'usr_student_01', 'TICKET_CREATED', 'ticket', 'tkt_01', JSON.stringify({ reference: 'MSH-2026-0001', category: 'Electrical Faults' }), '192.168.1.45', '-2 days');
  insertAudit.run('aud_03', 'usr_admin_01', 'TICKET_ASSIGNED', 'ticket', 'tkt_01', JSON.stringify({ staff: 'Sarah Muthoni', priority: 'high' }), '192.168.1.10', '-36 hours');

  console.log('Database initialization and seeding successfully completed!');
}
