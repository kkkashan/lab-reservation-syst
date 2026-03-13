import { Server, Booking } from '@/lib/types';
import { getServerStatus, isBookingActive } from '@/lib/booking-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Calendar } from '@phosphor-icons/react';

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
          <div>
            <span className="text-muted-foreground">Team:</span>
            <span className="font-medium ml-1">{server.teamAssigned || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">SKU:</span>
            <span className="font-medium ml-1">{server.serverSku || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Family:</span>
            <span className="font-medium ml-1">{server.serverFamily || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">RM IP:</span>
            <span className="font-medium ml-1">{server.rmIp || '—'}</span>
          </div>
        </div>

        {server.homePool && (
          <div className="text-sm">
            <span className="text-muted-foreground">Home Pool:</span>
            <span className="font-medium ml-1">{server.homePool}</span>
          </div>
        )}

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
          <Button onClick={() => onBook(server)} disabled={status !== 'ready'} size="sm" className="flex-1">
            {status === 'ready' ? 'Book Server' : 'Unavailable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
