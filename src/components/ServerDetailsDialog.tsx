import { Server, Booking } from '@/lib/types';
import { getServerStatus, isBookingActive, formatDate } from '@/lib/booking-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database, Cpu, HardDrive, Memory, MapPin, Calendar, User } from '@phosphor-icons/react';

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
      case 'available':
        return 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'booked':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'offline':
        return 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Booked';
      case 'maintenance': return 'Maintenance';
      case 'offline': return 'Offline';
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={16} />
              {server.location}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Cpu size={20} className="text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">CPU</div>
                  <div className="font-medium">{server.specifications.cpu}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Memory size={20} className="text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Memory</div>
                  <div className="font-medium">{server.specifications.memory}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <HardDrive size={20} className="text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Storage</div>
                  <div className="font-medium">{server.specifications.storage}</div>
                </div>
              </div>
              {server.specifications.gpu && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-5 h-5 rounded bg-muted-foreground/20" />
                  <div>
                    <div className="text-sm text-muted-foreground">GPU</div>
                    <div className="font-medium">{server.specifications.gpu}</div>
                  </div>
                </div>
              )}
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
