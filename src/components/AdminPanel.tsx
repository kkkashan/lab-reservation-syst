import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Server, Booking } from '@/lib/types';
import { getServerStatus, formatDate } from '@/lib/booking-utils';
import { AddServerDialog } from './AddServerDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Database, Gear, Trash, Users, ShieldCheck, ShieldSlash, UserPlus, Envelope, CheckCircle, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { usersApi, adminApi, type AdminUser, type EmailStatus } from '@/lib/api';

interface AdminPanelProps {
  servers: Server[];
  bookings: Booking[];
  onServerAdd: (server: Omit<Server, 'id'>) => void;
  onServerUpdate: (id: string, updates: Partial<Server>) => void;
  onServerDelete: (id: string) => void;
}

// ── Add User Dialog ───────────────────────────────────────────────
function AddUserDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', isAdmin: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await usersApi.register(form.name, form.email, form.password, form.isAdmin);
      toast.success(`User "${form.name}" created`);
      setForm({ name: '', email: '', password: '', isAdmin: false });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" required />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" required />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" required minLength={8} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isAdmin" checked={form.isAdmin} onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))} className="h-4 w-4" />
            <Label htmlFor="isAdmin">Grant Admin Privileges</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create User'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────
export function AdminPanel({ servers, bookings, onServerAdd, onServerUpdate, onServerDelete }: AdminPanelProps) {
  const [addServerOpen, setAddServerOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const queryClient = useQueryClient();

  // Email tab state
  const [digestResult, setDigestResult] = useState<{sent:number;skipped:number;errors:number}|null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const { data: emailStatus, refetch: refetchEmailStatus } = useQuery<EmailStatus>({
    queryKey: ['admin-email-status'],
    queryFn: () => adminApi.emailStatus(),
  });

  const handleSendTestEmail = async () => {
    setTestSending(true);
    try {
      const result = await adminApi.sendTestEmail();
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test email');
    } finally { setTestSending(false); }
  };

  const handleSendDigest = async () => {
    setEmailSending(true);
    setDigestResult(null);
    try {
      const result = await adminApi.sendWeeklyDigest();
      setDigestResult(result);
      toast.success(`Digest sent: ${result.sent} emails delivered`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send digest');
    } finally { setEmailSending(false); }
  };

  // Users query
  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deleted'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleAdmin(id),
    onSuccess: (updated) => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success(`${updated.name} is now ${updated.isAdmin ? 'an admin' : 'a regular user'}`); },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleStatusChange = (serverId: string, newStatus: Server['status']) => {
    onServerUpdate(serverId, { status: newStatus });
    toast.success('Server status updated');
  };

  const handleDeleteServer = (server: Server) => {
    const activeBooking = bookings.find(b => b.serverId === server.id && b.status === 'active');
    if (activeBooking) { toast.error('Cannot delete server with active booking'); return; }
    if (confirm(`Delete "${server.name}"? This cannot be undone.`)) {
      onServerDelete(server.id);
      toast.success('Server deleted');
    }
  };

  const handleDeleteUser = (user: AdminUser) => {
    if (confirm(`Delete user "${user.name}" (${user.email})? This cannot be undone.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      ready:     'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
      not_ready: 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800',
    };
    return map[status] ?? 'bg-muted text-muted-foreground border-border';
  };

  const totalServers = servers.length;
  const readyServers = servers.filter(s => s.status === 'ready').length;
  const notReadyServers = servers.filter(s => s.status === 'not_ready').length;

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage servers, users, and monitor system usage</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Servers</CardTitle><Database size={16} className="text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{totalServers}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ready</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600 dark:text-green-400">{readyServers}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Not Ready</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600 dark:text-red-400">{notReadyServers}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle><Users size={16} className="text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{users.length}</div></CardContent></Card>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="servers">
        <TabsList>
          <TabsTrigger value="servers" className="flex items-center gap-2"><Gear size={14} />Servers</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2"><Users size={14} />Users</TabsTrigger>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2"><Envelope size={14} />Email</TabsTrigger>
        </TabsList>

        {/* ── Servers Tab ── */}
        <TabsContent value="servers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddServerOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />Add Server
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>SKU / Family</TableHead>
                    <TableHead>RM IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servers.map(server => {
                    return (
                      <TableRow key={server.id}>
                        <TableCell className="font-medium">{server.name}</TableCell>
                        <TableCell>{server.teamAssigned || '—'}</TableCell>
                        <TableCell className="text-sm">
                          <div>{server.serverSku || '—'}</div>
                          <div className="text-muted-foreground">{server.serverFamily || ''}</div>
                        </TableCell>
                        <TableCell className="text-sm">{server.rmIp || '—'}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge className={getStatusColor(server.status)}>{server.status === 'ready' ? 'Ready' : 'Not Ready'}</Badge>
                            <Select value={server.status} onValueChange={v => handleStatusChange(server.id, v as Server['status'])}>
                              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="not_ready">Not Ready</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteServer(server)}>
                            <Trash size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users Tab ── */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              placeholder="Search users by name or email…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={() => setAddUserOpen(true)} className="flex items-center gap-2">
              <UserPlus size={16} />Add User
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              {usersLoading ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Loading users…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user._count?.bookings ?? 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                              onClick={() => toggleAdminMutation.mutate(user.id)}
                              disabled={toggleAdminMutation.isPending}
                            >
                              {user.isAdmin ? <ShieldSlash size={14} /> : <ShieldCheck size={14} />}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Bookings Tab ── */}
        <TabsContent value="bookings">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Server</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.serverName}</TableCell>
                      <TableCell>
                        <div>{booking.userName}</div>
                        <div className="text-sm text-muted-foreground">{booking.userEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div>{formatDate(booking.startDate)} – {formatDate(booking.endDate)}</div>
                        <div className="text-sm text-muted-foreground">{booking.daysBooked} days</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.status === 'active' ? 'default' : 'secondary'}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(booking.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Email Tab ── */}
        <TabsContent value="email" className="space-y-4">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {emailStatus?.configured
                  ? <CheckCircle size={18} className="text-green-500 dark:text-green-400" />
                  : <Warning size={18} className="text-yellow-500 dark:text-yellow-400" />}
                SMTP Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailStatus?.configured ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">SMTP Host</p>
                    <p className="font-medium text-foreground">{emailStatus.smtpHost}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Port</p>
                    <p className="font-medium text-foreground">{emailStatus.smtpPort}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Sender</p>
                    <p className="font-medium text-foreground">{emailStatus.smtpUser}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Schedule</p>
                    <p className="font-medium text-foreground">{emailStatus.schedule}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 text-sm space-y-2">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-400">SMTP not configured</p>
                  <p className="text-yellow-700 dark:text-yellow-500">Add the following variables to your backend <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">.env</code> file:</p>
                  <pre className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-3 text-xs overflow-auto text-yellow-900 dark:text-yellow-300">{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Lab Booking <you@gmail.com>`}</pre>
                  <p className="text-yellow-700 dark:text-yellow-500 text-xs">For Gmail, use an <strong>App Password</strong> (not your regular password). For Outlook use <code>smtp.office365.com</code>.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">Send Test Email</h4>
                  <p className="text-xs text-muted-foreground">Sends a single test email to your admin account to verify SMTP is working.</p>
                  <Button size="sm" variant="outline" onClick={handleSendTestEmail} disabled={testSending || !emailStatus?.configured}>
                    {testSending ? 'Sending…' : 'Send Test Email'}
                  </Button>
                </div>
                <div className="flex-1 border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">Send Weekly Digest Now</h4>
                  <p className="text-xs text-muted-foreground">Immediately send the weekly digest to all users. Normally runs every Monday at 08:00 UTC.</p>
                  <Button size="sm" onClick={handleSendDigest} disabled={emailSending || !emailStatus?.configured}>
                    {emailSending ? 'Sending…' : 'Send Digest to All Users'}
                  </Button>
                </div>
              </div>

              {digestResult && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-sm">
                  <p className="font-semibold text-green-800 dark:text-green-400 mb-2">Digest Complete</p>
                  <div className="flex gap-6 text-green-700 dark:text-green-400">
                    <span>✅ Sent: <strong>{digestResult.sent}</strong></span>
                    <span>⏭ Skipped: <strong>{digestResult.skipped}</strong></span>
                    <span>❌ Errors: <strong>{digestResult.errors}</strong></span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What's included card */}
          <Card>
            <CardHeader><CardTitle className="text-base">What's in the Weekly Email?</CardTitle></CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>📋 <strong className="text-foreground">Active bookings summary</strong> — server name, purpose, days remaining</li>
                <li>⚠ <strong className="text-foreground">Expiry alerts</strong> — highlighted when a booking expires within 7 days</li>
                <li>🖥 <strong className="text-foreground">Available servers count</strong> — shows how many servers are free to book</li>
                <li>🔗 <strong className="text-foreground">Direct link</strong> to the booking portal</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddServerDialog open={addServerOpen} onOpenChange={setAddServerOpen} onServerAdd={onServerAdd} />
      <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} onCreated={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })} />
    </div>
  );
}
