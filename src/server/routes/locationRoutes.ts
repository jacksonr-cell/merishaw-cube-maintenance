import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, logAudit, type AuthRequest } from '../auth.ts';

export const locationRouter = Router();

// GET /api/locations/tree - Hierarchical tree of buildings, blocks, rooms, cubes
locationRouter.get('/tree', authenticateToken, (req, res) => {
  const buildings = db.prepare(`SELECT * FROM buildings WHERE is_active = 1 ORDER BY name ASC`).all() as any[];
  const blocks = db.prepare(`SELECT * FROM blocks ORDER BY floor_number ASC, name ASC`).all() as any[];
  const rooms = db.prepare(`SELECT * FROM rooms ORDER BY room_number ASC`).all() as any[];
  const cubes = db.prepare(`
    SELECT c.*, 
      sa.id as assignment_id, 
      u.full_name as occupant_name, 
      u.identifier_code as occupant_code
    FROM cubes c
    LEFT JOIN student_assignments sa ON sa.cube_id = c.id AND sa.is_active = 1
    LEFT JOIN users u ON sa.student_id = u.id
    GROUP BY c.id
    ORDER BY c.cube_number ASC
  `).all() as any[];

  // Structure tree
  const tree = buildings.map(bld => {
    const bldBlocks = blocks.filter(b => b.building_id === bld.id).map(blk => {
      const blkRooms = rooms.filter(r => r.block_id === blk.id).map(rm => {
        const rmCubes = cubes.filter(c => c.room_id === rm.id);
        return {
          ...rm,
          cubes: rmCubes
        };
      });
      return {
        ...blk,
        rooms: blkRooms
      };
    });
    return {
      ...bld,
      blocks: bldBlocks
    };
  });

  res.json({ tree });
});

// GET /api/locations/buildings - Flat buildings list
locationRouter.get('/buildings', authenticateToken, (req, res) => {
  const buildings = db.prepare(`
    SELECT b.*,
      (SELECT COUNT(DISTINCT r.id) FROM blocks blk JOIN rooms r ON r.block_id = blk.id WHERE blk.building_id = b.id) as total_rooms,
      (SELECT COUNT(DISTINCT c.id) FROM blocks blk JOIN rooms r ON r.block_id = blk.id JOIN cubes c ON c.room_id = r.id WHERE blk.building_id = b.id) as total_cubes
    FROM buildings b
    ORDER BY b.name ASC
  `).all();

  res.json({ buildings });
});

// POST /api/locations/buildings - Admin adds building
locationRouter.post('/buildings', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { name, code, campus_zone, total_floors = 4 } = req.body;
  if (!name || !code || !campus_zone) {
    res.status(400).json({ error: 'Building name, code, and campus zone are required.' });
    return;
  }

  const id = 'bld_' + Date.now();
  try {
    db.prepare(`
      INSERT INTO buildings (id, name, code, campus_zone, total_floors)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name.trim(), code.trim().toUpperCase(), campus_zone.trim(), parseInt(String(total_floors), 10));

    logAudit(req.user!.id, 'BUILDING_CREATED', 'building', id, { name, code }, req.ip);

    res.status(201).json({ message: 'Building created successfully.', id });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Building code must be unique.' });
  }
});

// POST /api/locations/cubes - Admin creates a new cube
locationRouter.post('/cubes', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { room_id, cube_number, label } = req.body;
  if (!room_id || !cube_number || !label) {
    res.status(400).json({ error: 'Room ID, Cube number (e.g. Cube E), and descriptive label are required.' });
    return;
  }

  const id = 'cb_' + Date.now();
  db.prepare(`
    INSERT INTO cubes (id, room_id, cube_number, label, status)
    VALUES (?, ?, ?, ?, 'vacant')
  `).run(id, room_id, cube_number.trim(), label.trim());

  logAudit(req.user!.id, 'CUBE_CREATED', 'cube', id, { cube_number, label }, req.ip);

  res.status(201).json({ message: 'Accommodation cube registered successfully.', id });
});

// POST /api/locations/assign-student - Admin assigns student to a cube
locationRouter.post('/assign-student', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { student_id, cube_id, academic_year = '2025/2026', semester = 'Semester 1' } = req.body;

  if (!student_id || !cube_id) {
    res.status(400).json({ error: 'Student and Cube are required.' });
    return;
  }

  // Deactivate prior assignments for this student
  db.prepare(`UPDATE student_assignments SET is_active = 0 WHERE student_id = ?`).run(student_id);

  // Mark cube as occupied
  db.prepare(`UPDATE cubes SET status = 'occupied' WHERE id = ?`).run(cube_id);

  const assignmentId = 'asg_' + Date.now();
  db.prepare(`
    INSERT INTO student_assignments (id, student_id, cube_id, academic_year, semester, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(assignmentId, student_id, cube_id, academic_year, semester);

  logAudit(req.user!.id, 'STUDENT_ASSIGNED_CUBE', 'assignment', assignmentId, { student_id, cube_id }, req.ip);

  res.json({ message: 'Accommodation cube assigned to student successfully.' });
});
