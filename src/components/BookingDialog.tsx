import { useState } from 'react';
import { Server, Booking } from '@/lib/types';
import { validateBookingDates, checkBookingConflict, calculateDaysBooked } from '@/lib/booking-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: Server | null;
  bookings: Booking[];
  currentUserEmail: string;
  currentUserName: string;
  onBookingCreate: (booking: Omit<Booking, 'id' | 'createdAt' | 'daysBooked'>) => void;
}

export function BookingDialog({ open, onOpenChange, server, bookings, currentUserEmail, currentUserName, onBookingCreate }: BookingDialogProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!server) return null;

  const resetForm = () => { setStartDate(''); setEndDate(''); setPurpose(''); setError(null); setIsSubmitting(false); };
  const handleClose = () => { resetForm(); onOpenChange(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const dateError = validateBookingDates(startDate, endDate);
    if (dateError) { setError(dateError); setIsSubmitting(false); return; }

    const hasConflict = checkBookingConflict(server.id, startDate, endDate, bookings);
    if (hasConflict) { setError('This server is already booked for the selected dates'); setIsSubmitting(false); return; }

    if (!purpose.trim()) { setError('Please provide a purpose for the booking'); setIsSubmitting(false); return; }

    try {
      const bookingData = {
        serverId: server.id,
        serverName: server.name,
        userId: currentUserEmail,
        userEmail: currentUserEmail,
        userName: currentUserName,
        startDate,
        endDate,
        purpose: purpose.trim(),
        status: 'active' as const,
      };
      onBookingCreate(bookingData);
      const days = calculateDaysBooked(startDate, endDate);
      toast.success(`Server booked successfully for ${days} days!`);
      handleClose();
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  const days = startDate && endDate ? calculateDaysBooked(startDate, endDate) : 0;
  const showRenewalWarning = days >= 15;
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Book {server.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || today} required />
            </div>
          </div>

          {days > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={16} />
              <span>Duration: {days} day{days !== 1 ? 's' : ''}</span>
            </div>
          )}

          {showRenewalWarning && (
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <Warning size={16} className="text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                Bookings longer than 15 days require renewal notifications. You'll receive an email reminder to extend or release the server.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Booking</Label>
            <Textarea id="purpose" placeholder="Describe what you'll be using this server for..." value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} required />
          </div>

          {error && (
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
              <Warning size={16} className="text-destructive" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Booking...' : 'Book Server'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
