import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { useServers, useBookings } from '@/hooks/use-booking-data';
import { getServerStatus, calculateDaysBooked, formatDate } from '@/lib/booking-utils';

export function Reports() {
  const { data: servers = [] } = useServers();
  const { data: bookings = [] } = useBookings();
  const [ownerFilter, setOwnerFilter] = useState('');
  const [serverFilter, setServerFilter] = useState('');
  const [sortBy, setSortBy] = useState('endDate');

  const stats = useMemo(() => {
    const today = new Date();
    let overdue = 0;
    let totalDuration = 0;
    let activeDuration = 0;
    let activeCount = 0;

    bookings.forEach(b => {
      const end = new Date(b.endDate);
      const start = new Date(b.startDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      totalDuration += days;
      if (end < today && b.status === 'active') overdue++;
      if (b.status === 'active') { activeCount++; activeDuration += days; }
    });

    const avgDuration = bookings.length ? Math.round(totalDuration / bookings.length) : 0;
    const utilization = servers.length ? Math.round((activeCount / servers.length) * 100) : 0;

    return { total: bookings.length, overdue, avgDuration, utilization };
  }, [bookings, servers]);

  const statusDistribution = useMemo(() => {
    let available = 0, reserved = 0, overdueCount = 0;
    const today = new Date();
    servers.forEach(s => {
      const st = getServerStatus(s, bookings);
      if (st === 'ready') available++;
      else {
        const activeBooking = bookings.find(b => b.serverId === s.id && b.status === 'active');
        if (activeBooking && new Date(activeBooking.endDate) < today) overdueCount++;
        else reserved++;
      }
    });
    return [
      { name: 'Ready', value: available, color: '#22c55e' },
      { name: 'Reserved', value: reserved, color: '#3b82f6' },
      { name: 'Overdue', value: overdueCount, color: '#ef4444' },
    ];
  }, [servers, bookings]);

  const activityData = useMemo(() => {
    const actions: Record<string, number> = {};
    bookings.forEach(b => {
      const action = b.status === 'active' ? 'Booked' : b.status === 'completed' ? 'Completed' : 'Cancelled';
      actions[action] = (actions[action] || 0) + 1;
    });
    if (!actions['Booked']) actions['Booked'] = 0;
    if (!actions['Completed']) actions['Completed'] = 0;
    return Object.entries(actions).map(([name, count]) => ({ name, count }));
  }, [bookings]);

  const bookingHistory = useMemo(() => {
    let list = bookings.map(b => {
      const server = servers.find(s => s.id === b.serverId);
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      const isOverdue = end < new Date() && b.status === 'active';
      return {
        id: b.id, server: server?.name || b.serverId, owner: b.userName,
        startDate: b.startDate, endDate: b.endDate, duration,
        status: isOverdue ? 'Overdue' : b.status === 'active' ? 'Active' : b.status === 'completed' ? 'Completed' : 'Cancelled',
      };
    });
    if (ownerFilter) list = list.filter(b => b.owner.toLowerCase().includes(ownerFilter.toLowerCase()));
    if (serverFilter) list = list.filter(b => b.server.toLowerCase().includes(serverFilter.toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === 'endDate') return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      if (sortBy === 'startDate') return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      if (sortBy === 'duration') return b.duration - a.duration;
      return 0;
    });
    return list;
  }, [bookings, servers, ownerFilter, serverFilter, sortBy]);

  const activityLog = useMemo(() => {
    return bookings.slice(0, 10).map(b => {
      const server = servers.find(s => s.id === b.serverId);
      const isOverdue = new Date(b.endDate) < new Date() && b.status === 'active';
      return {
        id: b.id,
        action: isOverdue ? 'Overdue' : b.status === 'active' ? 'Booked' : 'Completed',
        detail: `${b.userName} — ${server?.name || b.serverId}`,
        time: formatDate(b.startDate),
      };
    });
  }, [bookings, servers]);

  const statusColor: Record<string, string> = {
    Active:    'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
    Overdue:   'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
    Completed: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
    Cancelled: 'bg-muted text-muted-foreground',
  };
  const logColor: Record<string, string> = {
    Booked:    'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
    Overdue:   'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
    Completed: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Track booking trends, server utilization, and activity logs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground">Total Bookings</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground">Avg Duration</p>
            <p className="text-2xl font-bold text-foreground">{stats.avgDuration}d</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground">Utilization</p>
            <p className="text-2xl font-bold text-foreground">{stats.utilization}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Server Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusDistribution} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--foreground)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              {statusDistribution.map(s => (
                <span key={s.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /> {s.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Activity by Action Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--foreground)' }} />
                <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Booking History Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Booking History</CardTitle>
          <div className="flex items-center gap-3 mt-2">
            <Input value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)} placeholder="Filter by owner..." className="h-8 text-xs w-44" />
            <Input value={serverFilter} onChange={e => setServerFilter(e.target.value)} placeholder="Filter by server..." className="h-8 text-xs w-44" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="endDate">Sort: End Date</SelectItem>
                <SelectItem value="startDate">Sort: Start Date</SelectItem>
                <SelectItem value="duration">Sort: Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Server</TableHead>
                <TableHead className="text-xs">Owner</TableHead>
                <TableHead className="text-xs">Start Date</TableHead>
                <TableHead className="text-xs">End Date</TableHead>
                <TableHead className="text-xs">Duration</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingHistory.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No bookings found.</TableCell></TableRow>
              ) : bookingHistory.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs font-medium">{b.server}</TableCell>
                  <TableCell className="text-xs">{b.owner}</TableCell>
                  <TableCell className="text-xs">{formatDate(b.startDate)}</TableCell>
                  <TableCell className="text-xs">{formatDate(b.endDate)}</TableCell>
                  <TableCell className="text-xs">{b.duration}d</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColor[b.status] || 'bg-muted text-muted-foreground'}`}>{b.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity recorded.</p>
          ) : (
            <div className="space-y-2">
              {activityLog.map((log, i) => (
                <div key={log.id + '-' + i} className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-[10px] w-20 justify-center ${logColor[log.action] || 'bg-muted text-muted-foreground'}`}>{log.action}</Badge>
                    <span className="text-xs text-foreground">{log.detail}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{log.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
