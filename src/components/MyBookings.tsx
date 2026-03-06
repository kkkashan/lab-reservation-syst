import { useState } from 'react';
import { Booking } from '@/lib/types';
import { isBookingActive, formatDate, calculateDaysBooked } from '@/lib/booking-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Database, Warning, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface MyBookingsProps {
  bookings: Booking[];
  currentUserEmail: string;
  onExtendBooking: (bookingId: string, newEndDate: string) => void;
  onCancelBooking: (bookingId: string) => void;
}

export function MyBookings({ bookings, currentUserEmail, onExtendBooking, onCancelBooking }: MyBookingsProps) {
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newEndDate, setNewEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const userBookings = bookings
    .filter(booking => booking.userEmail === currentUserEmail)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeBookings = userBookings.filter(booking => isBookingActive(booking));
  const pastBookings = userBookings.filter(booking => !isBookingActive(booking));

  const handleExtendClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewEndDate(booking.endDate);
    setExtendDialogOpen(true);
    setError(null);
  };

  const handleExtendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    const newEnd = new Date(newEndDate);
    const originalEnd = new Date(selectedBooking.endDate);
    if (newEnd <= originalEnd) { setError('New end date must be after the current end date'); return; }
    onExtendBooking(selectedBooking.id, newEndDate);
    toast.success('Booking extended successfully!');
    setExtendDialogOpen(false);
    setSelectedBooking(null);
    setNewEndDate('');
    setError(null);
  };

  const handleCancelClick = (booking: Booking) => {
    if (confirm(`Are you sure you want to cancel the booking for ${booking.serverName}?`)) {
      onCancelBooking(booking.id);
      toast.success('Booking cancelled successfully');
    }
  };

  const getStatusColor = (booking: Booking) => {
    if (booking.status === 'cancelled') return 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
    if (booking.status === 'completed') return 'bg-muted text-muted-foreground border-border';
    if (isBookingActive(booking)) return 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
    return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
  };

  const getStatusText = (booking: Booking) => {
    if (booking.status === 'cancelled') return 'Cancelled';
    if (booking.status === 'completed') return 'Completed';
    if (isBookingActive(booking)) return 'Active';
    return 'Expired';
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const isActive = isBookingActive(booking);
    const needsRenewal = booking.daysBooked >= 15 && isActive;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Database size={18} className="text-primary" />
              {booking.serverName}
            </CardTitle>
            <Badge className={getStatusColor(booking)}>{getStatusText(booking)}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Start:</span>
              <span className="font-medium">{formatDate(booking.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">End:</span>
              <span className="font-medium">{formatDate(booking.endDate)}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Clock size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{booking.daysBooked} days</span>
            </div>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Purpose:</span>
            <p className="mt-1 text-sm">{booking.purpose}</p>
          </div>

          {needsRenewal && (
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <Warning size={16} className="text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                This booking is over 15 days. Consider extending or releasing the server.
              </AlertDescription>
            </Alert>
          )}

          {isActive && (
            <div className="flex gap-2 pt-2">
              <Button onClick={() => handleExtendClick(booking)} variant="outline" size="sm" className="flex-1">Extend</Button>
              <Button onClick={() => handleCancelClick(booking)} variant="destructive" size="sm" className="flex-1">Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage your current and past server bookings</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
          Active Bookings ({activeBookings.length})
        </h2>
        
        {activeBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Database size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No active bookings</h3>
              <p className="text-muted-foreground">You don't have any active server bookings at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        )}
      </div>

      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Past Bookings ({pastBookings.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastBookings.slice(0, 6).map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        </div>
      )}

      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Extend Booking</DialogTitle></DialogHeader>
          {selectedBooking && (
            <form onSubmit={handleExtendSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Server</Label>
                <div className="text-sm font-medium">{selectedBooking.serverName}</div>
              </div>
              <div className="space-y-2">
                <Label>Current End Date</Label>
                <div className="text-sm">{formatDate(selectedBooking.endDate)}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-end-date">New End Date</Label>
                <Input id="new-end-date" type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} min={selectedBooking.endDate} required />
              </div>
              {newEndDate && (
                <div className="text-sm text-muted-foreground">
                  New duration: {calculateDaysBooked(selectedBooking.startDate, newEndDate)} days
                </div>
              )}
              {error && (
                <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                  <Warning size={16} className="text-destructive" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setExtendDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Extend Booking</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
