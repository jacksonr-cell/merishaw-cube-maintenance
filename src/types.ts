export type UserRole = 'admin' | 'staff' | 'student' | 'supervisor';

export type TicketStatus = 
  | 'Submitted' 
  | 'Pending Review' 
  | 'Assigned' 
  | 'In Progress' 
  | 'Awaiting Parts' 
  | 'Awaiting Access' 
  | 'Resolved' 
  | 'Closed' 
  | 'Reopened' 
  | 'Rejected';

export type Priority = 'low' | 'medium' | 'high' | 'emergency';

export interface UserAccommodation {
  assignment_id: string;
  academic_year: string;
  semester: string;
  cube_id: string;
  cube_number: string;
  cube_label: string;
  room_id: string;
  room_number: string;
  block_id: string;
  block_name: string;
  floor_number: number;
  building_id: string;
  building_name: string;
  building_code: string;
  campus_zone: string;
}

export interface User {
  id: string;
  email: string;
  identifier_code: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  department?: string | null;
  is_active: number;
  created_at?: string;
  accommodation?: UserAccommodation | null;
  cube_label?: string | null;
  building_name?: string | null;
  room_number?: string | null;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  campus_zone: string;
  total_floors: number;
  is_active: number;
  total_rooms?: number;
  total_cubes?: number;
}

export interface Block {
  id: string;
  building_id: string;
  name: string;
  floor_number: number;
  rooms?: Room[];
}

export interface Room {
  id: string;
  block_id: string;
  room_number: string;
  capacity: number;
  cubes?: Cube[];
}

export interface Cube {
  id: string;
  room_id: string;
  cube_number: string;
  label: string;
  status: 'occupied' | 'vacant' | 'maintenance';
  assignment_id?: string | null;
  occupant_name?: string | null;
  occupant_code?: string | null;
}

export interface BuildingTree extends Building {
  blocks: (Block & {
    rooms: (Room & {
      cubes: Cube[];
    })[];
  })[];
}

export interface FaultCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  default_priority: Priority;
  sla_hours: number;
  affected_items: string[];
  is_active: number;
}

export interface Ticket {
  id: string;
  reference_no: string;
  student_id: string;
  student_name?: string;
  student_code?: string;
  student_email?: string;
  student_phone?: string;
  cube_id: string;
  cube_number?: string;
  cube_label?: string;
  cube_status?: string;
  room_number?: string;
  block_name?: string;
  building_id?: string;
  building_name?: string;
  building_code?: string;
  campus_zone?: string;
  category_id: string;
  category_name?: string;
  category_code?: string;
  sla_hours?: number;
  affected_item: string;
  severity: Priority;
  priority: Priority;
  title: string;
  description: string;
  status: TicketStatus;
  assigned_to_staff_id?: string | null;
  staff_id?: string | null;
  staff_name?: string | null;
  staff_trade?: string | null;
  staff_department?: string | null;
  staff_phone?: string | null;
  rejection_reason?: string | null;
  resolution_summary?: string | null;
  materials_used_summary?: string | null;
  is_escalated: number;
  escalation_reason?: string | null;
  created_at: string;
  updated_at: string;
  assigned_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
}

export interface TicketStatusHistory {
  id: string;
  ticket_id: string;
  previous_status: TicketStatus | null;
  new_status: TicketStatus;
  changed_by_user_id: string;
  changed_by_name?: string;
  changed_by_role?: string;
  notes: string | null;
  timestamp: string;
}

export interface WorkLog {
  id: string;
  ticket_id: string;
  staff_id: string;
  staff_name?: string;
  staff_department?: string;
  action_taken: string;
  parts_used: string | null;
  time_spent_minutes: number;
  notes: string | null;
  created_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  author_name?: string;
  author_role?: string;
  message: string;
  is_internal: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  ticket_id: string | null;
  reference_no?: string | null;
  ticket_title?: string | null;
  type: string;
  is_read: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name?: string;
  user_role?: string;
  user_code?: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details_json: string | null;
  ip_address: string | null;
  timestamp: string;
}

export interface AdminMetrics {
  totalTickets: number;
  awaitingReview: number;
  unassigned: number;
  activeJobs: number;
  overdueTickets: number;
  resolvedCount: number;
  closedCount: number;
  avgResolutionHours: number;
  resolutionRate: number;
}
