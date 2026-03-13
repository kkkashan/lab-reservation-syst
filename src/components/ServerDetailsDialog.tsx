import { Server, Booking } from '@/lib/types';
import { getServerStatus, isBookingActive, formatDate } from '@/lib/booking-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database, Calendar, User } from '@phosphor-icons/react';

interface ServerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: Server | null;
  bookings: Booking[];
}

export function ServerDetailsDialog({ open, onOpenChange, server, bookings }: ServerDetailsDialogProps) {
  if (!server) return null;

  const status = getServerStatus(server, bookings);
  const activeBooking = bookings.find(booking => 
    booking.serverId === server.id && isBookingActive(booking)
  );
  
  const serverBookingHistory = bookings
    .filter(booking => booking.serverId === server.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'not_ready':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'not_ready': return 'Not Ready';
      default: return 'Unknown';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database size={20} className="text-primary" />
            {server.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(status)}>
              {getStatusText(status)}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {server.teamAssigned && <span>Team: {server.teamAssigned}</span>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Server Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Server Family</div>
                <div className="font-medium">{server.serverFamily || '—'}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Server SKU</div>
                <div className="font-medium">{server.serverSku || '—'}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">RM IP</div>
                <div className="font-medium">{server.rmIp || '—'}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Slot #</div>
                <div className="font-medium">{server.slotId || '—'}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Home Pool</div>
                <div className="font-medium">{server.homePool || '—'}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Firmware Version</div>
                <div className="font-medium">{server.firmwareVersion || '—'}</div>
              </div>
            </div>
          </div>

          {activeBooking && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Current Booking</h3>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-200">{activeBooking.userName}</span>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">({activeBooking.userEmail})</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-300 text-sm">
                    {formatDate(activeBooking.startDate)} - {formatDate(activeBooking.endDate)}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">
                    ({activeBooking.daysBooked} days)
                  </span>
                </div>
                <div className="text-blue-800 dark:text-blue-300 text-sm">
                  <strong>Purpose:</strong> {activeBooking.purpose}
                </div>
              </div>
            </div>
          )}

          {serverBookingHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Booking History</h3>
              <div className="space-y-3">
                {serverBookingHistory.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{booking.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={booking.status === 'active' ? 'default' : 'secondary'}
                        className="mb-1"
                      >
                        {booking.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {booking.daysBooked} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
