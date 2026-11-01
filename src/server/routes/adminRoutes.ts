import { Router } from 'express';
import { db, hashPassword } from '../db.ts';
import { authenticateToken, requireRole, logAudit, type AuthRequest } from '../auth.ts';

export const adminRouter = Router();

// GET /api/admin/stats - Real database-calculated analytics and KPI
adminRouter.get('/stats', authenticateToken, requireRole('admin', 'supervisor'), (req, res) => {
  try {
    // Total tickets count
    const totalTickets = (db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number }).count;

    // Status breakdown
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM tickets 
      GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    const statusMap = statusCounts.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    const awaitingReview = (statusMap['Submitted'] || 0) + (statusMap['Pending Review'] || 0);
    const unassigned = (db.prepare(`SELECT COUNT(*) as count FROM tickets WHERE assigned_to_staff_id IS NULL AND status NOT IN ('Resolved', 'Closed', 'Rejected')`).get() as { count: number }).count;
    const activeJobs = (statusMap['Assigned'] || 0) + (statusMap['In Progress'] || 0) + (statusMap['Awaiting Parts'] || 0) + (statusMap['Awaiting Access'] || 0);
    const resolvedCount = (statusMap['Resolved'] || 0);
    const closedCount = (statusMap['Closed'] || 0);

    // Overdue calculation:
    // Ticket is overdue if hours elapsed > category.sla_hours AND status NOT IN ('Resolved', 'Closed', 'Rejected')
    const overdueTickets = (db.prepare(`
      SELECT COUNT(*) as count 
      FROM tickets t
      JOIN fault_categories cat ON t.category_id = cat.id
      WHERE t.status NOT IN ('Resolved', 'Closed', 'Rejected')
      AND ((julianday('now') - julianday(t.created_at)) * 24) > cat.sla_hours
    `).get() as { count: number }).count;

    // Average resolution time in hours
    const avgResRow = db.prepare(`
      SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours
      FROM tickets
      WHERE resolved_at IS NOT NULL
    `).get() as { avg_hours: number | null };
    const avgResolutionHours = avgResRow?.avg_hours ? Number(avgResRow.avg_hours.toFixed(1)) : 0;

    // Fault distribution by category
    const faultDistribution = db.prepare(`
      SELECT 
        cat.id, cat.name, cat.code, cat.sla_hours,
        COUNT(t.id) as ticket_count
      FROM fault_categories cat
      LEFT JOIN tickets t ON t.category_id = cat.id
      GROUP BY cat.id
      ORDER BY ticket_count DESC
    `).all();

    // Requests by building
    const requestsByBuilding = db.prepare(`
      SELECT 
        bld.id, bld.name, bld.code,
        COUNT(t.id) as ticket_count,
        SUM(CASE WHEN t.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_count
      FROM buildings bld
      LEFT JOIN blocks blk ON blk.building_id = bld.id
      LEFT JOIN rooms r ON r.block_id = blk.id
      LEFT JOIN cubes c ON c.room_id = r.id
      LEFT JOIN tickets t ON t.cube_id = c.id
      GROUP BY bld.id
      ORDER BY ticket_count DESC
    `).all();

    // Workload by maintenance staff
    const staffWorkload = db.prepare(`
      SELECT 
        u.id as staff_id, u.full_name as staff_name, u.department as staff_trade,
        COUNT(t.id) as total_assigned,
        SUM(CASE WHEN t.status IN ('Assigned', 'In Progress', 'Awaiting Parts', 'Awaiting Access') THEN 1 ELSE 0 END) as active_jobs,
        SUM(CASE WHEN t.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as completed_jobs
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to_staff_id = u.id
      WHERE u.role IN ('staff', 'supervisor') AND u.is_active = 1
      GROUP BY u.id
      ORDER BY active_jobs DESC, total_assigned DESC
    `).all();

    // Recent activity audit
    const recentActivities = db.prepare(`
      SELECT 
        tsh.id, tsh.previous_status, tsh.new_status, tsh.notes, tsh.timestamp,
        t.id as ticket_id, t.reference_no, t.title as ticket_title,
        u.full_name as changed_by_name, u.role as changed_by_role
      FROM ticket_status_history tsh
      JOIN tickets t ON tsh.ticket_id = t.id
      JOIN users u ON tsh.changed_by_user_id = u.id
      ORDER BY tsh.timestamp DESC
      LIMIT 8
    `).all();

    res.json({
      metrics: {
        totalTickets,
        awaitingReview,
        unassigned,
        activeJobs,
        overdueTickets,
        resolvedCount,
        closedCount,
        avgResolutionHours,
        resolutionRate: totalTickets > 0 ? Math.round(((resolvedCount + closedCount) / totalTickets) * 100) : 0
      },
      statusCounts: statusMap,
      faultDistribution,
      requestsByBuilding,
      staffWorkload,
      recentActivities
    });
  } catch (err: any) {
    console.error('Failed to calculate admin stats:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/users - User management list with filters
adminRouter.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  const { role, is_active, search } = req.query;

  let query = `
    SELECT 
      u.id, u.email, u.identifier_code, u.full_name, u.role, u.phone, u.department, u.is_active, u.created_at,
      sa.id as assignment_id,
      c.label as cube_label, c.cube_number,
      r.room_number,
      bld.name as building_name
    FROM users u
    LEFT JOIN student_assignments sa ON sa.student_id = u.id AND sa.is_active = 1
    LEFT JOIN cubes c ON sa.cube_id = c.id
    LEFT JOIN rooms r ON c.room_id = r.id
    LEFT JOIN blocks blk ON r.block_id = blk.id
    LEFT JOIN buildings bld ON blk.building_id = bld.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role && role !== 'all') {
    query += ` AND u.role = ?`;
    params.push(String(role));
  }

  if (is_active !== undefined && is_active !== 'all') {
    query += ` AND u.is_active = ?`;
    params.push(Number(is_active));
  }

  if (search) {
    const term = `%${String(search).trim()}%`;
    query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.identifier_code LIKE ? OR u.department LIKE ?)`;
    params.push(term, term, term, term);
  }

  query += ` ORDER BY u.role ASC, u.full_name ASC`;
  const users = db.prepare(query).all(...params);

  res.json({ users });
});

// POST /api/admin/users - Admin creates new user
adminRouter.post('/users', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { email, identifier_code, full_name, role, password, phone, department, cube_id } = req.body;

  if (!email || !identifier_code || !full_name || !role || !password) {
    res.status(400).json({ error: 'Email, ID code, full name, role, and temporary password are required.' });
    return;
  }

  const validRoles = ['admin', 'staff', 'student', 'supervisor'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: `Invalid role. Must be one of [${validRoles.join(', ')}].` });
    return;
  }

  const existing = db.prepare(`
    SELECT email, identifier_code FROM users 
    WHERE LOWER(email) = LOWER(?) OR LOWER(identifier_code) = LOWER(?)
  `).get(email.trim(), identifier_code.trim()) as any;

  if (existing) {
    res.status(400).json({ error: 'A user with this institutional email or ID code already exists.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  db.prepare(`
    INSERT INTO users (id, email, identifier_code, full_name, role, password_hash, salt, phone, department, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    userId,
    email.trim().toLowerCase(),
    identifier_code.trim().toUpperCase(),
    full_name.trim(),
    role,
    hash,
    salt,
    phone?.trim() || null,
    department?.trim() || (role === 'student' ? 'Undergraduate Resident' : 'Facilities Maintenance')
  );

  // If student and cube_id specified, assign immediately
  if (role === 'student' && cube_id) {
    const assignmentId = 'asg_' + Date.now();
    db.prepare(`
      INSERT INTO student_assignments (id, student_id, cube_id, academic_year, semester, is_active)
      VALUES (?, ?, ?, '2025/2026', 'Semester 1', 1)
    `).run(assignmentId, userId, cube_id);
    db.prepare(`UPDATE cubes SET status = 'occupied' WHERE id = ?`).run(cube_id);
  }

  logAudit(req.user!.id, 'USER_CREATED', 'user', userId, { email, role, identifier_code, full_name }, req.ip);

  res.status(201).json({
    message: `Account for ${full_name} (${role}) successfully created.`,
    user_id: userId
  });
});

// PUT /api/admin/users/:id - Edit user or toggle active status
adminRouter.put('/users/:id', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { full_name, phone, department, is_active, role } = req.body;

  const user = db.prepare('SELECT id, role, email FROM users WHERE id = ?').get(id) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  // Prevent admin from deactivating themselves
  if (user.id === req.user!.id && is_active === 0) {
    res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
    return;
  }

  db.prepare(`
    UPDATE users 
    SET full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        department = COALESCE(?, department),
        is_active = COALESCE(?, is_active),
        role = COALESCE(?, role),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    full_name?.trim() || null,
    phone?.trim() || null,
    department?.trim() || null,
    is_active !== undefined ? Number(is_active) : null,
    role || null,
    id
  );

  logAudit(req.user!.id, 'USER_UPDATED', 'user', id, { full_name, is_active, role }, req.ip);

  res.json({ message: 'User account details updated successfully.' });
});

// GET /api/admin/audit-logs - View audit trail
adminRouter.get('/audit-logs', authenticateToken, requireRole('admin', 'supervisor'), (req, res) => {
  const { limit = '100', offset = '0', action } = req.query;

  let query = `
    SELECT 
      a.*,
      u.full_name as user_name, u.role as user_role, u.identifier_code as user_code
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (action && action !== 'all') {
    query += ` AND a.action = ?`;
    params.push(String(action));
  }

  query += ` ORDER BY a.timestamp DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(String(limit), 10), parseInt(String(offset), 10));

  const logs = db.prepare(query).all(...params);

  res.json({ logs });
});

// GET /api/admin/export/tickets.csv - Export CSV of maintenance records
adminRouter.get('/export/tickets.csv', authenticateToken, requireRole('admin', 'supervisor'), (req, res) => {
  const tickets = db.prepare(`
    SELECT 
      t.reference_no, t.created_at, t.status, t.priority, t.severity,
      bld.name as building, blk.name as block, r.room_number, c.label as cube,
      cat.name as category, t.affected_item, t.title, t.description,
      stu.full_name as reported_by, stu.identifier_code as student_id,
      stf.full_name as assigned_technician,
      t.resolved_at, t.resolution_summary, t.materials_used_summary
    FROM tickets t
    JOIN cubes c ON t.cube_id = c.id
    JOIN rooms r ON c.room_id = r.id
    JOIN blocks blk ON r.block_id = blk.id
    JOIN buildings bld ON blk.building_id = bld.id
    JOIN fault_categories cat ON t.category_id = cat.id
    JOIN users stu ON t.student_id = stu.id
    LEFT JOIN users stf ON t.assigned_to_staff_id = stf.id
    ORDER BY t.created_at DESC
  `).all() as any[];

  // Helper to escape CSV fields
  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const headers = [
    'Reference No', 'Date Submitted', 'Status', 'Priority', 'Severity',
    'Building', 'Block/Floor', 'Room', 'Cube', 'Category',
    'Affected Item', 'Title', 'Description', 'Reported By', 'Student ID',
    'Assigned Technician', 'Date Resolved', 'Resolution Summary', 'Materials Used'
  ];

  const rows = tickets.map(t => [
    escapeCsv(t.reference_no),
    escapeCsv(t.created_at),
    escapeCsv(t.status),
    escapeCsv(t.priority),
    escapeCsv(t.severity),
    escapeCsv(t.building),
    escapeCsv(t.block),
    escapeCsv(t.room_number),
    escapeCsv(t.cube),
    escapeCsv(t.category),
    escapeCsv(t.affected_item),
    escapeCsv(t.title),
    escapeCsv(t.description),
    escapeCsv(t.reported_by),
    escapeCsv(t.student_id),
    escapeCsv(t.assigned_technician || 'Unassigned'),
    escapeCsv(t.resolved_at || 'Pending'),
    escapeCsv(t.resolution_summary || ''),
    escapeCsv(t.materials_used_summary || '')
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="merishaw-maintenance-export-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csvContent);
});
