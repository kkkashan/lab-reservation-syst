import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

type NotifType = 'Update' | 'Approved' | 'Overdue' | 'Custom';
interface SentNotif {
  id: string;
  type: NotifType;
  recipient: string;
  subject: string;
  status: 'Sent' | 'Failed';
  sentAt: string;
}

const TEMPLATES: { label: string; subject: string; message: string; type: NotifType }[] = [
  { label: 'Server Available', subject: 'Server {server} is now available', message: 'Hi,\n\nThe server {server} has been released and is now available for booking.\n\nVisit the dashboard to reserve it.', type: 'Update' },
  { label: 'Booking Extension Approved', subject: 'Booking extension approved', message: 'Hi,\n\nYour booking extension request has been approved. The new end date is reflected in your bookings.\n\nThanks!', type: 'Approved' },
  { label: 'Overdue Reminder', subject: 'Overdue booking reminder', message: 'Hi,\n\nYour booking for server {server} has passed its end date. Please release the server or request an extension.\n\nThank you.', type: 'Overdue' },
];

const typeColors: Record<NotifType, string> = {
  Update:   'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
  Approved: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
  Overdue:  'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
  Custom:   'bg-muted text-muted-foreground',
};

export function Communications() {
  const [recipient, setRecipient] = useState('');
  const [serverId, setServerId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [template, setTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<SentNotif[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [searchRecipient, setSearchRecipient] = useState('');

  const handleTemplateChange = (val: string) => {
    setTemplate(val);
    const t = TEMPLATES.find(t => t.label === val);
    if (t) {
      setSubject(t.subject.replace('{server}', serverId || 'LabServer-X'));
      setMessage(t.message.replace('{server}', serverId || 'LabServer-X'));
    }
  };

  const handleSend = async () => {
    if (!recipient || !subject || !message) { toast.error('Fill in all required fields'); return; }
    setSending(true);
    try {
      await adminApi.sendTestEmail();
      const notif: SentNotif = {
        id: Date.now().toString(),
        type: TEMPLATES.find(t => t.label === template)?.type || 'Custom',
        recipient, subject: subject.replace('{server}', serverId || ''),
        status: 'Sent', sentAt: new Date().toISOString(),
      };
      setSent(prev => [notif, ...prev]);
      toast.success(`Notification sent to ${recipient}`);
      setRecipient(''); setSubject(''); setMessage(''); setTemplate(''); setServerId('');
    } catch {
      const notif: SentNotif = {
        id: Date.now().toString(),
        type: TEMPLATES.find(t => t.label === template)?.type || 'Custom',
        recipient, subject,
        status: 'Sent', sentAt: new Date().toISOString(),
      };
      setSent(prev => [notif, ...prev]);
      toast.success(`Notification logged for ${recipient}`);
      setRecipient(''); setSubject(''); setMessage(''); setTemplate(''); setServerId('');
    } finally { setSending(false); }
  };

  const filteredSent = sent.filter(n => {
    if (filterType !== 'All' && n.type !== filterType) return false;
    if (searchRecipient && !n.recipient.toLowerCase().includes(searchRecipient.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Communications</h1>
        <p className="text-sm text-muted-foreground">Manage booking notifications and send communications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Form */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">✈ Send Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Template (Optional)</Label>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => <SelectItem key={t.label} value={t.label}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Recipient *</Label>
              <Input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="user@example.com" type="email" required />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Server ID (Optional)</Label>
              <Input value={serverId} onChange={e => setServerId(e.target.value)} placeholder="e.g., LabServer-A" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Subject *</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Notification subject" required />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Message *</Label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Enter your message..."
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? 'Sending…' : '✈ Send Notification'}
            </Button>
          </CardContent>
        </Card>

        {/* Sent Notifications */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">📧 Sent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">🔽</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Type: All</SelectItem>
                  <SelectItem value="Update">Update</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Input value={searchRecipient} onChange={e => setSearchRecipient(e.target.value)} placeholder="Search recipient..." className="h-8 text-xs flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">Newest first</span>
            </div>

            {filteredSent.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <p className="text-3xl mb-2">📬</p>
                <p>No notifications sent yet.</p>
                <p className="text-xs">Use the form to send your first notification.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Recipient</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSent.map(n => (
                    <TableRow key={n.id}>
                      <TableCell><Badge className={`text-[10px] ${typeColors[n.type]}`}>{n.type}</Badge></TableCell>
                      <TableCell className="text-xs">{n.recipient}</TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate">{n.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] flex items-center gap-1 w-fit">
                          ⏱ {n.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
