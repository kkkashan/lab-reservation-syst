import { useState, useMemo } from 'react';
import { Server, Booking, User } from '@/lib/types';
import { getServerStatus, isBookingActive, formatDate } from '@/lib/booking-utils';
import { ServerCard } from './ServerCard';
import { BookingDialog } from './BookingDialog';
import { ServerDetailsDialog } from './ServerDetailsDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Database, Warning, ArrowsClockwise, Clock, TrendUp, CalendarBlank } from '@phosphor-icons/react';

interface DashboardProps {
  servers: Server[];
  bookings: Booking[];
  currentUser: User;
  onBookingCreate: (booking: Omit<Booking, 'id' | 'createdAt' | 'daysBooked'>) => void;
}

type Arch = 'all' | 'arm64' | 'intel' | 'amd';
type Gen = string;

function detectArch(cpu: string): 'arm64' | 'intel' | 'amd' | 'other' {
  const c = cpu.toLowerCase();
  if (c.includes('arm') || c.includes('neoverse') || c.includes('graviton') || c.includes('ampere') || c.includes('cobalt') || c.includes('kunpeng')) return 'arm64';
  if (c.includes('intel') || c.includes('xeon') || c.includes('core i')) return 'intel';
  if (c.includes('amd') || c.includes('epyc') || c.includes('ryzen') || c.includes('threadripper')) return 'amd';
  return 'other';
}

function detectGen(cpu: string): string {
  const c = cpu.toLowerCase();
  if (c.includes('cobalt 100') || c.includes('gen 9') || c.includes('9th gen')) return 'Gen 9 Cobalt 100';
  if (c.includes('cobalt 200') || c.includes('gen 11') || c.includes('11th gen')) return 'Gen 11 Cobalt 200';
  if (c.includes('cobalt 300') || c.includes('gen 12') || c.includes('12th gen')) return 'Gen 12 Cobalt 300';
  if (c.includes('gen 4') || c.includes('4th gen') || c.includes('genoa') || c.includes('sapphire')) return 'Gen 4';
  if (c.includes('gen 5') || c.includes('5th gen') || c.includes('emerald')) return 'Gen 5';
  return '';
}

const COLORS = { available: '#22c55e', booked: '#3b82f6', overdue: '#ef4444', maintenance: '#eab308', offline: '#6b7280' };

export function Dashboard({ servers, bookings, currentUser, onBookingCreate }: DashboardProps) {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [archFilter, setArchFilter] = useState<Arch>('all');
  const [genFilter, setGenFilter] = useState<Gen>('all');
  const [now] = useState(() => new Date());

  const stats = useMemo(() => {
    let available = 0, reserved = 0, overdue = 0, maintenance = 0;
    const overdueList: { server: Server; booking: Booking; daysOverdue: number }[] = [];

    const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'pending-renewal');
    const endingSoon = activeBookings.filter(b => {
      const d = Math.ceil((new Date(b.endDate).getTime() - now.getTime()) / 86400000);
      return d >= 0 && d <= 2;
    });

    servers.forEach(s => {
      const st = getServerStatus(s, bookings);
      if (st === 'maintenance' || s.status === 'maintenance') { maintenance++; return; }
      if (st === 'available') { available++; return; }

      const activeB = bookings.find(b => b.serverId === s.id && (b.status === 'active' || b.status === 'pending-renewal'));
      if (activeB) {
        const end = new Date(activeB.endDate);
        if (end < now) {
          overdue++;
          overdueList.push({ server: s, booking: activeB, daysOverdue: Math.ceil((now.getTime() - end.getTime()) / 86400000) });
        } else {
          reserved++;
        }
      } else {
        available++;
      }
    });

    const total = servers.length;
    const utilization = total > 0 ? Math.round(((reserved + overdue) / total) * 100) : 0;
    const avgDuration = activeBookings.length > 0
      ? Math.round(activeBookings.reduce((sum, b) => sum + b.daysBooked, 0) / activeBookings.length)
      : 0;

    return { available, reserved, overdue, maintenance, total, utilization, overdueList, endingSoon, activeBookings, avgDuration };
  }, [servers, bookings, now]);

  const availableGens = useMemo(() => {
    const gens = new Set<string>();
    servers.forEach(s => { const g = detectGen(s.specifications.cpu); if (g) gens.add(g); });
    return Array.from(gens).sort();
  }, [servers]);

  const filtered = useMemo(() => servers.filter(s => {
    if (archFilter !== 'all' && detectArch(s.specifications.cpu) !== archFilter) return false;
    if (genFilter !== 'all' && detectGen(s.specifications.cpu) !== genFilter) return false;
    return true;
  }), [servers, archFilter, genFilter]);

  const pieData = [
    { name: 'Available', value: stats.available, color: COLORS.available },
    { name: 'Reserved', value: stats.reserved, color: COLORS.booked },
    { name: 'Overdue', value: stats.overdue, color: COLORS.overdue },
  ].filter(d => d.value > 0);

  const activityData = [
    { name: 'Send', value: bookings.filter(b => b.status === 'active').length },
    { name: 'Approved', value: bookings.filter(b => b.status === 'completed').length },
    { name: 'Mark', value: bookings.filter(b => b.status === 'cancelled').length },
  ];

  const handleBook = (s: Server) => { setSelectedServer(s); setBookingDialogOpen(true); };
  const handleView = (s: Server) => { setSelectedServer(s); setDetailsDialogOpen(true); };

  return (
    <div className="space-y-6">
      {/* Architecture Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'arm64', 'intel', 'amd'] as Arch[]).map(a => (
          <button key={a} onClick={() => { setArchFilter(a); setGenFilter('all'); }}
            className={`px-3 py-1 rounded text-sm font-medium border transition-colors ${
              archFilter === a ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-accent'
            }`}
          >
            {a === 'all' ? 'All' : a.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Gen sub-filters */}
      {availableGens.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setGenFilter('all')}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
              genFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-accent'
            }`}
          >All Gens</button>
          {availableGens.map(g => (
            <button key={g} onClick={() => setGenFilter(g)}
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                genFilter === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-accent'
              }`}
            >{g}</button>
          ))}
        </div>
      )}

      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">LabOps Sentinel • Real-time infrastructure overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 px-2 py-1 border border-border rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live</span>
          <span>Updated: {now.toLocaleTimeString()}</span>
          <button className="p-1 hover:bg-accent rounded" onClick={() => window.location.reload()}>
            <ArrowsClockwise size={14} />
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Servers</p>
                <p className="text-3xl font-bold mt-1 text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">⚡ Active fleet</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                <Database size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Utilization</p>
                <p className="text-3xl font-bold mt-1 text-foreground">{stats.utilization}%</p>
                <div className="w-24 h-1.5 bg-muted rounded-full mt-2">
                  <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${stats.utilization}%` }} />
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                <TrendUp size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border shadow-sm ${stats.overdue > 0 ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20' : ''}`}>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                <p className={`text-3xl font-bold mt-1 ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{stats.overdue}</p>
                {stats.overdue > 0 && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 flex items-center gap-1"><Warning size={10} /> Action required</p>}
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.overdue > 0 ? 'bg-red-500/10 dark:bg-red-500/20' : 'bg-muted'}`}>
                <Warning size={20} className={stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Reviews</p>
                <p className="text-3xl font-bold mt-1 text-foreground">{bookings.filter(b => b.status === 'pending-renewal').length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">📋 Extension requests</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <CalendarBlank size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">✦ Server Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-6">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none">
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{stats.utilization}%</span>
                <span className="text-[10px] text-muted-foreground">Utilization</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> <span className="font-semibold text-foreground">{stats.available}</span> <span className="text-muted-foreground">Available</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> <span className="font-semibold text-foreground">{stats.reserved}</span> <span className="text-muted-foreground">Reserved</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> <span className="font-semibold text-foreground">{stats.overdue}</span> <span className="text-muted-foreground">Overdue</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">📈 Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={activityData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--foreground)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="flex items-center gap-4 py-5 px-5">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Clock size={24} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Booking Duration</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgDuration} days</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="flex items-center gap-4 py-5 px-5">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
              <Warning size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ending in 48h</p>
              <p className="text-2xl font-bold text-foreground">{stats.endingSoon.length}</p>
              <p className="text-xs text-muted-foreground">Bookings expiring soon</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="flex items-center gap-4 py-5 px-5">
            <div className="w-12 h-12 rounded-full bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center">
              <TrendUp size={24} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Bookings</p>
              <p className="text-2xl font-bold text-foreground">{stats.activeBookings.length}</p>
              <p className="text-xs text-muted-foreground">Current reservations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Servers Alert */}
      {stats.overdueList.length > 0 && (
        <Card className="border border-red-200 dark:border-red-800 shadow-sm">
          <CardContent className="pt-5 px-5 pb-4">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
              <Warning size={16} /> Overdue Servers ({stats.overdueList.length})
            </h3>
            <div className="space-y-2">
              {stats.overdueList.map(({ server, booking, daysOverdue }) => (
                <div key={server.id} className="flex items-center justify-between py-2 px-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database size={16} className="text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{server.name}</p>
                      <p className="text-xs text-muted-foreground">{booking.userName} • Ended {formatDate(booking.endDate)}</p>
                    </div>
                  </div>
                  <Badge className="bg-red-500 text-white text-xs">{daysOverdue}d overdue</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Server Allocation Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            📋 Server Allocation Overview
            {stats.activeBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{stats.activeBookings.length} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Team Assigned</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">User</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Server</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Status</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Date Allocated</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Duration (days)</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Test Harness</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">RScm IP</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Slot ID</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">FW Version</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">DS</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Pool</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.activeBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground text-sm">
                      No active bookings — all servers are available
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.activeBookings.map(booking => {
                    const srv = servers.find(s => s.id === booking.serverId);
                    const isOverdue = new Date(booking.endDate) < now;
                    return (
                      <TableRow key={booking.id} className={`text-sm ${isOverdue ? 'bg-red-50/40 dark:bg-red-950/10' : 'hover:bg-muted/50'}`}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {booking.teamAssigned || <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{booking.userName}</TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{booking.serverName}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${
                            isOverdue
                              ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                              : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
                          }`}>
                            {isOverdue ? 'Overdue' : 'In Use'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(booking.startDate)}
                        </TableCell>
                        <TableCell className="text-center">{booking.daysBooked}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {srv?.testHarness || <span className="text-muted-foreground/40">TBD</span>}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                          {srv?.rscmIp || <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {srv?.slotId != null ? srv.slotId : <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {srv?.fwVersion || <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {srv?.dsPool || <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground max-w-[200px] truncate" title={srv?.pool || ''}>
                          {srv?.pool || <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Server Grid */}
      {filtered.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-foreground">
            Servers {archFilter !== 'all' ? `(${archFilter.toUpperCase()})` : ''} — {filtered.length}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(s => (
              <ServerCard key={s.id} server={s} bookings={bookings} onBook={handleBook} onViewDetails={handleView} />
            ))}
          </div>
        </>
      )}

      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} server={selectedServer} bookings={bookings} currentUserEmail={currentUser.email} currentUserName={currentUser.name} onBookingCreate={onBookingCreate} />
      <ServerDetailsDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} server={selectedServer} bookings={bookings} />
    </div>
  );
}
