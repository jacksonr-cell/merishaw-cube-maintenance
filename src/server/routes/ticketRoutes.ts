import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, logAudit, type AuthRequest } from '../auth.ts';

export const ticketRouter = Router();

// Valid status transitions map
const VALID_TRANSITIONS: Record<string, string[]> = {
  'Submitted': ['Pending Review', 'Assigned', 'Rejected'],
  'Pending Review': ['Assigned', 'Rejected', 'Submitted', 'In Progress'],
  'Assigned': ['In Progress', 'Awaiting Parts', 'Awaiting Access', 'Pending Review'],
  'In Progress': ['Awaiting Parts', 'Awaiting Access', 'Resolved', 'Assigned'],
  'Awaiting Parts': ['In Progress', 'Assigned', 'Awaiting Access'],
  'Awaiting Access': ['In Progress', 'Assigned', 'Awaiting Parts'],
  'Resolved': ['Closed', 'Reopened'],
  'Closed': ['Reopened'],
  'Reopened': ['Assigned', 'In Progress', 'Pending Review'],
  'Rejected': ['Reopened', 'Pending Review']
};

// GET /api/tickets - List tickets with filtering & pagination
ticketRouter.get('/', authenticateToken, (req: AuthRequest, res) => {
  const { status, category, priority, building_id, staff_id, student_id, search, limit = '50', offset = '0' } = req.query;
  const user = req.user!;

  let query = `
    SELECT 
      t.id, t.reference_no, t.title, t.description, t.severity, t.priority, t.status,
      t.affected_item, t.is_escalated, t.escalation_reason, t.created_at, t.updated_at,
      t.assigned_at, t.resolved_at, t.closed_at,
      c.id as cube_id, c.cube_number, c.label as cube_label,
      r.room_number,
      blk.name as block_name,
      bld.id as building_id, bld.name as building_name, bld.code as building_code,
      cat.id as category_id, cat.name as category_name, cat.code as category_code, cat.sla_hours,
      stu.id as student_id, stu.full_name as student_name, stu.identifier_code as student_code, stu.phone as student_phone,
      stf.id as staff_id, stf.full_name as staff_name, stf.department as staff_trade
    FROM tickets t
    JOIN cubes c ON t.cube_id = c.id
    JOIN rooms r ON c.room_id = r.id
    JOIN blocks blk ON r.block_id = blk.id
    JOIN buildings bld ON blk.building_id = bld.id
    JOIN fault_categories cat ON t.category_id = cat.id
    JOIN users stu ON t.student_id = stu.id
    LEFT JOIN users stf ON t.assigned_to_staff_id = stf.id
    WHERE 1=1
  `;

  const params: any[] = [];

  // Role constraints
  if (user.role === 'student') {
    query += ` AND t.student_id = ?`;
    params.push(user.id);
  } else if (user.role === 'staff') {
    // Maintenance staff can view jobs assigned to them, or jobs unassigned/awaiting triage if filtered
    if (staff_id === 'my_jobs' || !staff_id) {
      query += ` AND (t.assigned_to_staff_id = ? OR (t.assigned_to_staff_id IS NULL AND t.status IN ('Submitted', 'Pending Review')))`;
      params.push(user.id);
    } else if (staff_id) {
      query += ` AND t.assigned_to_staff_id = ?`;
      params.push(String(staff_id));
    }
  } else if (user.role === 'admin' || user.role === 'supervisor') {
    if (staff_id) {
      if (staff_id === 'unassigned') {
        query += ` AND t.assigned_to_staff_id IS NULL`;
      } else {
        query += ` AND t.assigned_to_staff_id = ?`;
        params.push(String(staff_id));
      }
    }
    if (student_id) {
      query += ` AND t.student_id = ?`;
      params.push(String(student_id));
    }
  }

  // Common filters
  if (status && status !== 'all') {
    query += ` AND t.status = ?`;
    params.push(String(status));
  }

  if (category && category !== 'all') {
    query += ` AND (t.category_id = ? OR cat.code = ?)`;
    params.push(String(category), String(category));
  }

  if (priority && priority !== 'all') {
    query += ` AND t.priority = ?`;
    params.push(String(priority));
  }

  if (building_id && building_id !== 'all') {
    query += ` AND bld.id = ?`;
    params.push(String(building_id));
  }

  if (search) {
    const term = `%${String(search).trim()}%`;
    query += ` AND (
      t.reference_no LIKE ? OR 
      t.title LIKE ? OR 
      t.description LIKE ? OR 
      c.label LIKE ? OR
      r.room_number LIKE ? OR
      stu.full_name LIKE ?
    )`;
    params.push(term, term, term, term, term, term);
  }

  query += ` ORDER BY 
    CASE t.priority 
      WHEN 'emergency' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      WHEN 'low' THEN 4 
      ELSE 5 
    END,
    t.created_at DESC
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(String(limit), 10), parseInt(String(offset), 10));

  const tickets = db.prepare(query).all(...params);

  res.json({
    tickets,
    total: tickets.length,
    user_role: user.role
  });
});

// GET /api/tickets/:id - Full details + status history + work logs + comments
ticketRouter.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;

  const ticket = db.prepare(`
    SELECT 
      t.*,
      c.cube_number, c.label as cube_label, c.status as cube_status,
      r.room_number, r.capacity as room_capacity,
      blk.name as block_name, blk.floor_number,
      bld.id as building_id, bld.name as building_name, bld.code as building_code, bld.campus_zone,
      cat.id as category_id, cat.name as category_name, cat.code as category_code, cat.sla_hours,
      stu.id as student_id, stu.full_name as student_name, stu.identifier_code as student_code, stu.email as student_email, stu.phone as student_phone,
      stf.id as staff_id, stf.full_name as staff_name, stf.email as staff_email, stf.department as staff_department, stf.phone as staff_phone
    FROM tickets t
    JOIN cubes c ON t.cube_id = c.id
    JOIN rooms r ON c.room_id = r.id
    JOIN blocks blk ON r.block_id = blk.id
    JOIN buildings bld ON blk.building_id = bld.id
    JOIN fault_categories cat ON t.category_id = cat.id
    JOIN users stu ON t.student_id = stu.id
    LEFT JOIN users stf ON t.assigned_to_staff_id = stf.id
    WHERE t.id = ? OR t.reference_no = ?
  `).get(id, id) as any;

  if (!ticket) {
    res.status(404).json({ error: 'Maintenance ticket not found.' });
    return;
  }

  // Authorization check
  if (user.role === 'student' && ticket.student_id !== user.id) {
    res.status(403).json({ error: 'Access denied. You can only view your own submitted maintenance tickets.' });
    return;
  }

  // Fetch status history
  const statusHistory = db.prepare(`
    SELECT 
      tsh.*, 
      u.full_name as changed_by_name, 
      u.role as changed_by_role
    FROM ticket_status_history tsh
    JOIN users u ON tsh.changed_by_user_id = u.id
    WHERE tsh.ticket_id = ?
    ORDER BY tsh.timestamp ASC
  `).all(ticket.id);

  // Fetch work logs
  const workLogs = db.prepare(`
    SELECT 
      wl.*, 
      u.full_name as staff_name, 
      u.department as staff_department
    FROM work_logs wl
    JOIN users u ON wl.staff_id = u.id
    WHERE wl.ticket_id = ?
    ORDER BY wl.created_at DESC
  `).all(ticket.id);

  // Fetch comments
  const comments = db.prepare(`
    SELECT 
      tc.*, 
      u.full_name as author_name, 
      u.role as author_role
    FROM ticket_comments tc
    JOIN users u ON tc.user_id = u.id
    WHERE tc.ticket_id = ?
    ${user.role === 'student' ? 'AND tc.is_internal = 0' : ''}
    ORDER BY tc.created_at ASC
  `).all(ticket.id);

  res.json({
    ticket,
    statusHistory,
    workLogs,
    comments
  });
});

// POST /api/tickets - Create new ticket
ticketRouter.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { cube_id, category_id, affected_item, severity, title, description } = req.body;
  const user = req.user!;

  if (!cube_id || !category_id || !affected_item || !title || !description) {
    res.status(400).json({ error: 'All fields (location/cube, category, affected item, title, description) are required.' });
    return;
  }

  const validSeverities = ['low', 'medium', 'high', 'emergency'];
  const chosenSeverity = validSeverities.includes(severity) ? severity : 'medium';

  // Verify cube exists
  const cube = db.prepare(`
    SELECT c.id, c.cube_number, c.label, r.room_number, bld.name as building_name
    FROM cubes c
    JOIN rooms r ON c.room_id = r.id
    JOIN blocks b ON r.block_id = b.id
    JOIN buildings bld ON b.building_id = bld.id
    WHERE c.id = ?
  `).get(cube_id) as any;

  if (!cube) {
    res.status(400).json({ error: 'Selected accommodation cube was not found in the institutional records.' });
    return;
  }

  // Verify category exists
  const category = db.prepare('SELECT id, name, default_priority, sla_hours FROM fault_categories WHERE id = ?').get(category_id) as any;
  if (!category) {
    res.status(400).json({ error: 'Selected fault category is invalid or inactive.' });
    return;
  }

  // Generate unique ticket reference: MSH-2026-XXXX
  const year = new Date().getFullYear();
  const nextSeq = (db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number }).count + 1;
  const reference_no = `MSH-${year}-${String(nextSeq).padStart(4, '0')}`;
  const ticketId = 'tkt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  // Escalate priority if severity is emergency or category default is emergency
  const finalPriority = chosenSeverity === 'emergency' ? 'emergency' : category.default_priority;
  const isEscalated = chosenSeverity === 'emergency' ? 1 : 0;
  const escalationReason = isEscalated ? 'Reported as Emergency by student. Expedited triage assigned.' : null;

  // Insert ticket
  db.prepare(`
    INSERT INTO tickets (
      id, reference_no, student_id, cube_id, category_id, affected_item, severity,
      priority, title, description, status, is_escalated, escalation_reason, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    ticketId,
    reference_no,
    user.id,
    cube_id,
    category_id,
    affected_item.trim(),
    chosenSeverity,
    finalPriority,
    title.trim(),
    description.trim(),
    isEscalated,
    escalationReason
  );

  // Record initial status history
  const statusHistoryId = 'tsh_' + Date.now();
  db.prepare(`
    INSERT INTO ticket_status_history (id, ticket_id, previous_status, new_status, changed_by_user_id, notes, timestamp)
    VALUES (?, ?, NULL, 'Submitted', ?, 'Ticket logged by student', CURRENT_TIMESTAMP)
  `).run(statusHistoryId, ticketId, user.id);

  // Notification for student
  const studentNotifId = 'notif_' + Date.now() + '_s';
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, ticket_id, type)
    VALUES (?, ?, ?, ?, ?, 'confirmation')
  `).run(
    studentNotifId,
    user.id,
    `Maintenance Report ${reference_no} Submitted`,
    `Your request regarding "${title}" has been successfully logged. Ticket Reference: ${reference_no}.`,
    ticketId
  );

  // Notify admins
  const admins = db.prepare('SELECT id FROM users WHERE role = ? AND is_active = 1').all('admin') as any[];
  for (const adm of admins) {
    const admNotifId = 'notif_' + Date.now() + '_' + adm.id;
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, ticket_id, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      admNotifId,
      adm.id,
      `${isEscalated ? 'EMERGENCY: ' : ''}New Request: ${reference_no}`,
      `${user.full_name} submitted a report for ${cube.building_name} (${cube.label}): ${title}`,
      ticketId,
      isEscalated ? 'alert' : 'info'
    );
  }

  logAudit(user.id, 'TICKET_CREATED', 'ticket', ticketId, { reference_no, title, severity: chosenSeverity, priority: finalPriority }, req.ip);

  res.status(201).json({
    message: 'Maintenance report successfully submitted.',
    ticket: {
      id: ticketId,
      reference_no,
      title,
      status: 'Submitted',
      priority: finalPriority,
      created_at: new Date().toISOString()
    }
  });
});

// PATCH /api/tickets/:id/assign - Admin assigns staff & priority
ticketRouter.patch('/:id/assign', authenticateToken, requireRole('admin', 'supervisor'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { staff_id, priority, notes } = req.body;
  const user = req.user!;

  if (!staff_id) {
    res.status(400).json({ error: 'Please select a maintenance staff member to assign.' });
    return;
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  const staff = db.prepare('SELECT id, full_name, role, is_active FROM users WHERE id = ?').get(staff_id) as any;
  if (!staff || (staff.role !== 'staff' && staff.role !== 'supervisor')) {
    res.status(400).json({ error: 'Assigned user must be active maintenance staff or supervisor.' });
    return;
  }

  const newPriority = priority || ticket.priority;
  const previousStatus = ticket.status;
  const newStatus = previousStatus === 'Submitted' || previousStatus === 'Pending Review' ? 'Assigned' : previousStatus;

  db.prepare(`
    UPDATE tickets 
    SET assigned_to_staff_id = ?, priority = ?, status = ?, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(staff_id, newPriority, newStatus, id);

  // Status history
  db.prepare(`
    INSERT INTO ticket_status_history (id, ticket_id, previous_status, new_status, changed_by_user_id, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    'tsh_' + Date.now(),
    id,
    previousStatus,
    newStatus,
    user.id,
    notes || `Assigned to ${staff.full_name} by ${user.full_name}`
  );

  // Notify assigned staff
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, ticket_id, type)
    VALUES (?, ?, ?, ?, ?, 'assignment')
  `).run(
    'notif_' + Date.now() + '_stf',
    staff_id,
    `New Job Assignment: ${ticket.reference_no}`,
    `You have been assigned to ${ticket.title} (Priority: ${newPriority.toUpperCase()}).`,
    id
  );

  // Notify student
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, ticket_id, type)
    VALUES (?, ?, ?, ?, ?, 'update')
  `).run(
    'notif_' + Date.now() + '_stu',
    ticket.student_id,
    `Technician Assigned to Your Report`,
    `Technician ${staff.full_name} has been assigned to work on ${ticket.reference_no}.`,
    id
  );

  logAudit(user.id, 'TICKET_ASSIGNED', 'ticket', id, { staff_id, staff_name: staff.full_name, priority: newPriority }, req.ip);

  res.json({ message: 'Ticket assigned successfully.', status: newStatus, priority: newPriority });
});

// PATCH /api/tickets/:id/status - Update ticket status
ticketRouter.patch('/:id/status', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, notes, resolution_summary, materials_used_summary, rejection_reason } = req.body;
  const user = req.user!;

  if (!status) {
    res.status(400).json({ error: 'Target status is required.' });
    return;
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  // Check role authorization for this specific transition
  if (user.role === 'student') {
    // Student can only Reopen a resolved ticket or confirm Close
    if (status !== 'Reopened' && status !== 'Closed') {
      res.status(403).json({ error: 'Students may only confirm closure or request reopening of a resolved ticket.' });
      return;
    }
    if (ticket.student_id !== user.id) {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }
  }

  if (user.role === 'staff') {
    // Staff cannot reject tickets (admin function) or close directly unless authorized
    if (status === 'Rejected') {
      res.status(403).json({ error: 'Only administrative officers can reject tickets.' });
      return;
    }
  }

  // Validate state transition
  const currentStatus = ticket.status;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(status)) {
    // If admin is forcing a status change, allow with audit record
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      res.status(400).json({ 
        error: `Cannot transition status from '${currentStatus}' to '${status}'. Permitted transitions: ${allowed ? allowed.join(', ') : 'None'}.` 
      });
      return;
    }
  }

  // Specific transition requirement validations
  if (status === 'Resolved' && (!resolution_summary || resolution_summary.trim().length < 5)) {
    res.status(400).json({ error: 'A clear resolution summary detailing the repair performed is mandatory when marking a ticket as Resolved.' });
    return;
  }

  if (status === 'Rejected' && (!rejection_reason || rejection_reason.trim().length < 5)) {
    res.status(400).json({ error: 'A specific reason is required when rejecting a maintenance request.' });
    return;
  }

  let resolvedAt = ticket.resolved_at;
  let closedAt = ticket.closed_at;
  if (status === 'Resolved' && !resolvedAt) {
    resolvedAt = new Date().toISOString();
  }
  if (status === 'Closed' && !closedAt) {
    closedAt = new Date().toISOString();
  }
  if (status === 'Reopened') {
    resolvedAt = null;
    closedAt = null;
  }

  db.prepare(`
    UPDATE tickets 
    SET status = ?, 
        resolution_summary = COALESCE(?, resolution_summary),
        materials_used_summary = COALESCE(?, materials_used_summary),
        rejection_reason = COALESCE(?, rejection_reason),
        resolved_at = ?,
        closed_at = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    status,
    resolution_summary ? resolution_summary.trim() : null,
    materials_used_summary ? materials_used_summary.trim() : null,
    rejection_reason ? rejection_reason.trim() : null,
    resolvedAt,
    closedAt,
    id
  );

  // Status history record
  db.prepare(`
    INSERT INTO ticket_status_history (id, ticket_id, previous_status, new_status, changed_by_user_id, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    'tsh_' + Date.now(),
    id,
    currentStatus,
    status,
    user.id,
    notes || resolution_summary || rejection_reason || `Status changed to ${status}`
  );

  // If resolved, also log an automated completion work record if resolution summary provided
  if (status === 'Resolved' && resolution_summary) {
    db.prepare(`
      INSERT INTO work_logs (id, ticket_id, staff_id, action_taken, parts_used, time_spent_minutes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'wl_' + Date.now(),
      id,
      user.id,
      resolution_summary.trim(),
      materials_used_summary || 'Standard workshop consumables',
      30,
      'Final resolution work entry recorded upon ticket completion.'
    );
  }

  // Notify student
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, ticket_id, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'notif_' + Date.now() + '_stuchange',
    ticket.student_id,
    `Ticket ${ticket.reference_no} is now ${status}`,
    `Status updated from ${currentStatus} to ${status}. ${resolution_summary ? 'Resolution: ' + resolution_summary : ''}`,
    id,
    status === 'Resolved' ? 'success' : status === 'Rejected' ? 'alert' : 'info'
  );

  logAudit(user.id, 'TICKET_STATUS_CHANGED', 'ticket', id, { from: currentStatus, to: status, notes }, req.ip);

  res.json({ message: `Ticket status successfully changed to ${status}.`, new_status: status });
});

// POST /api/tickets/:id/work-logs - Staff adds work log
ticketRouter.post('/:id/work-logs', authenticateToken, requireRole('staff', 'admin', 'supervisor'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { action_taken, parts_used, time_spent_minutes = 30, notes } = req.body;
  const user = req.user!;

  if (!action_taken || action_taken.trim().length < 5) {
    res.status(400).json({ error: 'Please describe the maintenance action or inspection performed.' });
    return;
  }

  const ticket = db.prepare('SELECT id, reference_no, status, student_id FROM tickets WHERE id = ?').get(id) as any;
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  const workLogId = 'wl_' + Date.now();
  db.prepare(`
    INSERT INTO work_logs (id, ticket_id, staff_id, action_taken, parts_used, time_spent_minutes, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    workLogId,
    id,
    user.id,
    action_taken.trim(),
    parts_used ? parts_used.trim() : null,
    parseInt(String(time_spent_minutes), 10) || 30,
    notes ? notes.trim() : null
  );

  // If ticket was in 'Assigned', move to 'In Progress' automatically on first work log
  if (ticket.status === 'Assigned') {
    db.prepare(`UPDATE tickets SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    db.prepare(`
      INSERT INTO ticket_status_history (id, ticket_id, previous_status, new_status, changed_by_user_id, notes, timestamp)
      VALUES (?, ?, 'Assigned', 'In Progress', ?, 'Work log submitted; auto-progressed to In Progress', CURRENT_TIMESTAMP)
    `).run('tsh_' + Date.now(), id, user.id);
  }

  logAudit(user.id, 'WORK_LOG_ADDED', 'ticket', id, { action_taken, parts_used, minutes: time_spent_minutes }, req.ip);

  res.status(201).json({ message: 'Work log recorded successfully.', id: workLogId });
});

// POST /api/tickets/:id/comments - Add message / clarification
ticketRouter.post('/:id/comments', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { message, is_internal = 0 } = req.body;
  const user = req.user!;

  if (!message || message.trim().length < 2) {
    res.status(400).json({ error: 'Comment message cannot be empty.' });
    return;
  }

  const ticket = db.prepare('SELECT id, student_id, assigned_to_staff_id, reference_no FROM tickets WHERE id = ?').get(id) as any;
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  // Student can only post external comments on their own ticket
  if (user.role === 'student' && ticket.student_id !== user.id) {
    res.status(403).json({ error: 'Unauthorized.' });
    return;
  }

  const commentId = 'tc_' + Date.now();
  db.prepare(`
    INSERT INTO ticket_comments (id, ticket_id, user_id, message, is_internal)
    VALUES (?, ?, ?, ?, ?)
  `).run(commentId, id, user.id, message.trim(), user.role === 'student' ? 0 : (is_internal ? 1 : 0));

  // Notify relevant counterparty
  if (user.role === 'student' && ticket.assigned_to_staff_id) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, ticket_id, type)
      VALUES (?, ?, ?, ?, ?, 'comment')
    `).run('notif_' + Date.now() + '_c', ticket.assigned_to_staff_id, `Student Clarification on ${ticket.reference_no}`, message.substring(0, 100), id);
  } else if (user.role !== 'student' && !is_internal) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, ticket_id, type)
      VALUES (?, ?, ?, ?, ?, 'comment')
    `).run('notif_' + Date.now() + '_c', ticket.student_id, `Update on your maintenance ticket ${ticket.reference_no}`, message.substring(0, 100), id);
  }

  res.status(201).json({ message: 'Comment added successfully.', commentId });
});
