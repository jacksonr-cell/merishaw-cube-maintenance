import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, logAudit, type AuthRequest } from '../auth.ts';

export const categoryRouter = Router();

// GET /api/categories - List all active fault categories with affected items
categoryRouter.get('/', authenticateToken, (req, res) => {
  const categories = db.prepare(`
    SELECT * FROM fault_categories 
    WHERE is_active = 1 
    ORDER BY name ASC
  `).all() as any[];

  const parsed = categories.map(cat => ({
    ...cat,
    affected_items: JSON.parse(cat.affected_items_json || '[]')
  }));

  res.json({ categories: parsed });
});

// POST /api/categories - Admin creates fault category
categoryRouter.post('/', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { name, code, description, default_priority = 'medium', sla_hours = 24, affected_items = [] } = req.body;

  if (!name || !code) {
    res.status(400).json({ error: 'Category name and short code are required.' });
    return;
  }

  const id = 'cat_' + Date.now();
  db.prepare(`
    INSERT INTO fault_categories (id, name, code, description, default_priority, sla_hours, affected_items_json, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    name.trim(),
    code.trim().toUpperCase(),
    description?.trim() || null,
    default_priority,
    parseInt(String(sla_hours), 10) || 24,
    JSON.stringify(affected_items)
  );

  logAudit(req.user!.id, 'CATEGORY_CREATED', 'category', id, { name, code }, req.ip);

  res.status(201).json({ message: 'Fault category registered successfully.', id });
});

// PUT /api/categories/:id - Admin updates category
categoryRouter.put('/:id', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, description, default_priority, sla_hours, affected_items, is_active } = req.body;

  db.prepare(`
    UPDATE fault_categories
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        default_priority = COALESCE(?, default_priority),
        sla_hours = COALESCE(?, sla_hours),
        affected_items_json = CASE WHEN ? IS NOT NULL THEN ? ELSE affected_items_json END,
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    name?.trim() || null,
    description?.trim() || null,
    default_priority || null,
    sla_hours ? parseInt(String(sla_hours), 10) : null,
    affected_items ? 1 : null,
    affected_items ? JSON.stringify(affected_items) : null,
    is_active !== undefined ? Number(is_active) : null,
    id
  );

  logAudit(req.user!.id, 'CATEGORY_UPDATED', 'category', id, { name, sla_hours }, req.ip);

  res.json({ message: 'Fault category updated.' });
});
