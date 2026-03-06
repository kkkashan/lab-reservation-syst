import { Server, Booking } from '@/lib/types';
import { getServerStatus, isBookingActive } from '@/lib/booking-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Cpu, HardDrive, Memory, Calendar } from '@phosphor-icons/react';

interface ServerCardProps {
  server: Server;
  bookings: Booking[];
  onBook: (server: Server) => void;
  onViewDetails: (server: Server) => void;
}

export function ServerCard({ server, bookings, onBook, onViewDetails }: ServerCardProps) {
  const status = getServerStatus(server, bookings);
  const activeBooking = bookings.find(booking => 
    booking.serverId === server.id && isBookingActive(booking)
  );

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
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Database size={20} className="text-primary" />
            {server.name}
          </CardTitle>
          <Badge className={getStatusColor(status)}>
            {getStatusText(status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground">CPU:</span>
            <span className="font-medium">{server.specifications.cpu}</span>
          </div>
          <div className="flex items-center gap-2">
            <Memory size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground">RAM:</span>
            <span className="font-medium">{server.specifications.memory}</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground">Storage:</span>
            <span className="font-medium">{server.specifications.storage}</span>
          </div>
          {server.specifications.gpu && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">GPU:</span>
              <span className="font-medium">{server.specifications.gpu}</span>
            </div>
          )}
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Location:</span>
          <span className="font-medium ml-1">{server.location}</span>
        </div>

        {activeBooking && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-300 font-medium">
                Booked by {activeBooking.userName}
              </span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Until {new Date(activeBooking.endDate).toLocaleDateString()}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={() => onViewDetails(server)} variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
          <Button onClick={() => onBook(server)} disabled={status !== 'available'} size="sm" className="flex-1">
            {status === 'available' ? 'Book Server' : 'Unavailable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
