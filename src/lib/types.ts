export interface Server {
  id: string;
  name: string;
  teamAssigned?: string | null;
  assignedUser?: string | null;
  serverFamily?: string | null;
  serverSku?: string | null;
  status: 'ready' | 'not_ready';
  dateAllocated?: string | null;
  duration?: string | null;
  rmIp?: string | null;
  slotId?: string | null;
  homePool?: string | null;
  firmwareVersion?: string | null;
  currentBooking?: Booking;
}

export interface Booking {
  id: string;
  serverId: string;
  serverName: string;
  userId: string;
  userEmail: string;
  userName: string;
  startDate: string;
  endDate: string;
  purpose: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending-renewal';
  createdAt: string;
  renewalNotificationSent?: boolean;
  daysBooked: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface NotificationSettings {
  renewalThreshold: number; // days
  reminderDays: number[]; // days before expiration to send reminders
}
