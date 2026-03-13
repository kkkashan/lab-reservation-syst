import { Server, Booking } from './types';

export function calculateDaysBooked(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isBookingActive(booking: Booking): boolean {
  const now = new Date();
  const end = new Date(booking.endDate);
  return end >= now && booking.status === 'active';
}

export function needsRenewalNotification(booking: Booking, threshold: number = 15): boolean {
  return booking.daysBooked >= threshold && !booking.renewalNotificationSent;
}

export function getServerStatus(server: Server, bookings: Booking[]): 'ready' | 'not_ready' {
  const activeBooking = bookings.find(booking => 
    booking.serverId === server.id && isBookingActive(booking)
  );
  
  return activeBooking ? 'not_ready' : server.status;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function validateBookingDates(startDate: string, endDate: string): string | null {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (start < now) {
    return 'Start date cannot be in the past';
  }
  
  if (end <= start) {
    return 'End date must be after start date';
  }
  
  return null;
}

export function checkBookingConflict(
  serverId: string,
  startDate: string,
  endDate: string,
  bookings: Booking[],
  excludeBookingId?: string
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return bookings.some(booking => {
    if (booking.serverId !== serverId || booking.status !== 'active') {
      return false;
    }
    
    if (excludeBookingId && booking.id === excludeBookingId) {
      return false;
    }
    
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    
    return start < bookingEnd && end > bookingStart;
  });
}