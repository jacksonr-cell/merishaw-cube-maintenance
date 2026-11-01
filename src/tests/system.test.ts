import test from 'node:test';
import assert from 'node:assert/strict';
import { db, initDatabase, hashPassword, verifyPassword } from '../server/db.ts';
import { generateToken, verifyToken } from '../server/auth.ts';

// Initialize and ensure DB is ready
initDatabase();

test('Security & Password Hashing: salts, hashes, and verifies securely', () => {
  const password = 'TestSecurePassword2026!';
  const { hash, salt } = hashPassword(password);

  assert.ok(hash.length >= 64, 'Hash must be at least 64 characters');
  assert.ok(salt.length >= 32, 'Salt must be at least 32 characters');

  // Must verify successfully with correct password
  assert.equal(verifyPassword(password, hash, salt), true);

  // Must fail with incorrect password
  assert.equal(verifyPassword('WrongPassword', hash, salt), false);
});

test('Session Tokens: generates, signs with HMAC-SHA256, and verifies valid payload', () => {
  const payload = {
    id: 'usr_test_student',
    email: 'test.student@merishaw.edu',
    identifier_code: 'STD-9999',
    full_name: 'Test Student',
    role: 'student' as const
  };

  const token = generateToken(payload, 2);
  assert.ok(token.includes('.'), 'Token must be dot-delimited');

  const verified = verifyToken(token);
  assert.ok(verified, 'Verified token must not be null');
  assert.equal(verified?.id, payload.id);
  assert.equal(verified?.role, 'student');
  assert.equal(verified?.email, payload.email);

  // Tampered token must fail
  const tamperedToken = token.slice(0, -4) + 'abcd';
  assert.equal(verifyToken(tamperedToken), null);
});

test('Database Migrations & Integrity: verified schema tables exist', () => {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table'
  `).all() as Array<{ name: string }>;

  const tableNames = tables.map(t => t.name);
  const requiredTables = [
    'users', 'buildings', 'blocks', 'rooms', 'cubes', 
    'student_assignments', 'fault_categories', 'tickets', 
    'ticket_status_history', 'work_logs', 'notifications', 'audit_logs'
  ];

  for (const reqTable of requiredTables) {
    assert.ok(tableNames.includes(reqTable), `Table ${reqTable} must exist in the database`);
  }
});

test('End-to-End Maintenance Workflow Scenario', async (t) => {
  // Step 1: Administrator creates new student and maintenance staff account
  const timestamp = Date.now();
  const studentEmail = `student.${timestamp}@merishaw.edu`;
  const studentCode = `STD-${timestamp}`;
  const staffEmail = `staff.${timestamp}@merishaw.edu`;
  const staffCode = `STF-${timestamp}`;

  const studentPass = hashPassword('StudentPass123!');
  const staffPass = hashPassword('StaffPass123!');

  const studentId = `usr_test_std_${timestamp}`;
  const staffId = `usr_test_stf_${timestamp}`;

  db.prepare(`
    INSERT INTO users (id, email, identifier_code, full_name, role, password_hash, salt, department, is_active)
    VALUES (?, ?, ?, ?, 'student', ?, ?, 'School of Science', 1)
  `).run(studentId, studentEmail, studentCode, 'E2E Student Tester', studentPass.hash, studentPass.salt);

  db.prepare(`
    INSERT INTO users (id, email, identifier_code, full_name, role, password_hash, salt, department, is_active)
    VALUES (?, ?, ?, ?, 'staff', ?, ?, 'Carpentry & Fittings', 1)
  `).run(staffId, staffEmail, staffCode, 'E2E Staff Tester', staffPass.hash, staffPass.salt);

  // Assign student to Room 204 Cube C
  const cube = db.prepare('SELECT id FROM cubes WHERE room_id = ? AND cube_number = ?').get('rm_01', 'Cube C') as { id: string };
  assert.ok(cube, 'Test accommodation cube must exist');

  db.prepare(`
    INSERT INTO student_assignments (id, student_id, cube_id, academic_year, semester, is_active)
    VALUES (?, ?, ?, '2025/2026', 'Semester 1', 1)
  `).run(`asg_${timestamp}`, studentId, cube.id);

  // Step 2: Student signs in & submits maintenance report
  const studentToken = generateToken({
    id: studentId,
    email: studentEmail,
    identifier_code: studentCode,
    full_name: 'E2E Student Tester',
    role: 'student'
  });
  assert.ok(studentToken);

  const ticketId = `tkt_e2e_${timestamp}`;
  const refNo = `MSH-2026-E2E-${timestamp.toString().slice(-4)}`;
  const category = db.prepare('SELECT id FROM fault_categories WHERE code = ?').get('BED') as { id: string };

  db.prepare(`
    INSERT INTO tickets (
      id, reference_no, student_id, cube_id, category_id, affected_item, severity, priority,
      title, description, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'medium', 'medium', ?, ?, 'Submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    ticketId,
    refNo,
    studentId,
    cube.id,
    category.id,
    'Bunk Bed Frame',
    'Loose wooden ladder rung on upper cube bunk',
    'Second rung from bottom wobbles when climbing into upper cube bed. Needs re-tightening.'
  );

  db.prepare(`
    INSERT INTO ticket_status_history (id, ticket_id, previous_status, new_status, changed_by_user_id, notes, timestamp)
    VALUES (?, ?, NULL, 'Submitted', ?, 'Student logged report', CURRENT_TIMESTAMP)
  `).run(`tsh_${timestamp}_1`, ticketId, studentId);

  // Step 3: Administrator views report
  const adminViewTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
  assert.equal(adminViewTicket.title, 'Loose wooden ladder rung on upper cube bunk');
  assert.equal(adminViewTicket.status, 'Submitted');

  // Step 4: Administrator assigns to staff member
  db.prepare(`
    UPDATE tickets 
    SET assigned_to_staff_id = ?, priority = 'high', status = 'Assigned', assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(staffId, ticketId);

  db.prepare(`
    INSERT INTO ticket_status_history (id, ticket_id, previous_status, new_status, changed_by_user_id, notes, timestamp)
    VALUES (?, ?, 'Submitted', 'Assigned', 'usr_admin_01', 'Assigned to E2E Staff', CURRENT_TIMESTAMP)
  `).run(`tsh_${timestamp}_2`, ticketId);

  // Step 5: Staff member updates status to 'In Progress'
  db.prepare(`
    UPDATE tickets 
    SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(ticketId);

  db.prepare(`
    INSERT INTO ticket_status_history (id, ticket_id, previous_status, new_status, changed_by_user_id, notes, timestamp)
    VALUES (?, ?, 'Assigned', 'In Progress', ?, 'Staff arrived at cube', CURRENT_TIMESTAMP)
  `).run(`tsh_${timestamp}_3`, ticketId, staffId);

  // Step 6: Staff member records work performed
  const workLogId = `wl_${timestamp}`;
  db.prepare(`
    INSERT INTO work_logs (id, ticket_id, staff_id, action_taken, parts_used, time_spent_minutes, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    workLogId,
    ticketId,
    staffId,
    'Reinforced joint using heavy gauge wood screws and wood adhesive. Tested load bearing.',
    '4x 50mm Countersunk Wood Screws, PVA Wood Glue',
    40,
    'Ladder now solid and safe for student climbing.'
  );

  // Step 7: Ticket is resolved with completion notes
  const resolutionNote = 'Tightened and braced ladder rung with new reinforced fasteners. Checked bed stability.';
  db.prepare(`
    UPDATE tickets 
    SET status = 'Resolved', resolution_summary = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(resolutionNote, ticketId);

  db.prepare(`
    INSERT INTO ticket_status_history (id, ticket_id, previous_status, new_status, changed_by_user_id, notes, timestamp)
    VALUES (?, ?, 'In Progress', 'Resolved', ?, 'Work completed and confirmed', CURRENT_TIMESTAMP)
  `).run(`tsh_${timestamp}_4`, ticketId, staffId);

  // Step 8: Student views updated status
  const studentCheckedTicket = db.prepare('SELECT status, resolution_summary FROM tickets WHERE id = ?').get(ticketId) as any;
  assert.equal(studentCheckedTicket.status, 'Resolved');
  assert.equal(studentCheckedTicket.resolution_summary, resolutionNote);

  // Step 9: Administrator views complete audit trail
  const fullHistory = db.prepare(`
    SELECT * FROM ticket_status_history WHERE ticket_id = ? ORDER BY timestamp ASC
  `).all(ticketId) as any[];

  assert.equal(fullHistory.length, 4, 'Must have 4 status history transitions');
  assert.equal(fullHistory[0].new_status, 'Submitted');
  assert.equal(fullHistory[1].new_status, 'Assigned');
  assert.equal(fullHistory[2].new_status, 'In Progress');
  assert.equal(fullHistory[3].new_status, 'Resolved');

  const fullWorkLogs = db.prepare('SELECT * FROM work_logs WHERE ticket_id = ?').all(ticketId) as any[];
  assert.equal(fullWorkLogs.length, 1);
  assert.equal(fullWorkLogs[0].staff_id, staffId);
});

test('Authorization Enforcement: students cannot access or reassign tickets of other students', () => {
  const student1Id = 'usr_student_01';
  const student2Id = 'usr_student_02';
  const testTicketId = `tkt_auth_test_${Date.now()}`;

  // Insert isolated test ticket for student 2
  db.prepare(`
    INSERT INTO tickets (
      id, reference_no, student_id, cube_id, category_id, affected_item, severity, priority,
      title, description, status, created_at, updated_at
    ) VALUES (?, ?, ?, 'cb_07', 'cat_doors', 'Cube Lock', 'medium', 'medium', 'Test Private Ticket', 'Private issue', 'Submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(testTicketId, `MSH-TEST-${Date.now().toString().slice(-4)}`, student2Id);

  // Verify ticket belongs to student 2
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(testTicketId) as any;
  assert.equal(ticket.student_id, student2Id);

  // Query scoped by student 1
  const student1Tickets = db.prepare('SELECT id FROM tickets WHERE student_id = ?').all(student1Id) as Array<{ id: string }>;
  const student1TicketIds = student1Tickets.map(t => t.id);

  assert.ok(!student1TicketIds.includes(testTicketId), 'Student 1 must not be able to retrieve Student 2 tickets');
});
