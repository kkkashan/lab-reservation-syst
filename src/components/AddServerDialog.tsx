import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';

type ServerPayload = {
  name: string;
  teamAssigned?: string;
  assignedUser?: string;
  serverFamily?: string;
  serverSku?: string;
  status?: string;
  dateAllocated?: string;
  duration?: string;
  rmIp?: string;
  slotId?: string;
  homePool?: string;
  firmwareVersion?: string;
};

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerAdd: (server: ServerPayload) => Promise<unknown>;
}

export function AddServerDialog({ open, onOpenChange, onServerAdd }: AddServerDialogProps) {
  const [formData, setFormData] = useState({
    name: '', teamAssigned: '', assignedUser: '', serverFamily: '', serverSku: '', status: 'ready',
    dateAllocated: '', duration: '', rmIp: '', slotId: '', homePool: '', firmwareVersion: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '', teamAssigned: '', assignedUser: '', serverFamily: '', serverSku: '', status: 'ready',
      dateAllocated: '', duration: '', rmIp: '', slotId: '', homePool: '', firmwareVersion: '',
    });
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => { resetForm(); onOpenChange(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim())  { setError('Server name is required'); return; }
    setIsSubmitting(true);
    try {
      await onServerAdd({
        name: formData.name.trim(),
        teamAssigned: formData.teamAssigned.trim() || undefined,
        assignedUser: formData.assignedUser.trim() || undefined,
        serverFamily: formData.serverFamily.trim() || undefined,
        serverSku: formData.serverSku.trim() || undefined,
        status: formData.status,
        dateAllocated: formData.dateAllocated.trim() || undefined,
        duration: formData.duration.trim() || undefined,
        rmIp: formData.rmIp.trim() || undefined,
        slotId: formData.slotId.trim() || undefined,
        homePool: formData.homePool.trim() || undefined,
        firmwareVersion: formData.firmwareVersion.trim() || undefined,
      });
      toast.success(`Server "${formData.name}" added successfully!`);
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add server');
      setIsSubmitting(false);
    }
  };

  const set = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus size={20} className="text-primary" />
            Add New Server
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="server-name">Server Name *</Label>
              <Input id="server-name" placeholder="e.g., C41431103M0902A" value={formData.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-assigned">Team Assigned</Label>
              <Input id="team-assigned" placeholder="e.g., ATP" value={formData.teamAssigned} onChange={e => set('teamAssigned', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned-user">Assigned User</Label>
              <Input id="assigned-user" placeholder="e.g., John Doe" value={formData.assignedUser} onChange={e => set('assignedUser', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-family">Server Family</Label>
              <Input id="server-family" placeholder="e.g., ARM64" value={formData.serverFamily} onChange={e => set('serverFamily', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-sku">Server SKU</Label>
              <Input id="server-sku" placeholder="e.g., C4143" value={formData.serverSku} onChange={e => set('serverSku', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rm-ip">RM IP</Label>
              <Input id="rm-ip" placeholder="e.g., 10.93.144.206" value={formData.rmIp} onChange={e => set('rmIp', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-id">Slot #</Label>
              <Input id="slot-id" placeholder="e.g., Slot 1" value={formData.slotId} onChange={e => set('slotId', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-pool">Home Pool</Label>
              <Input id="home-pool" placeholder="e.g., MTPPool" value={formData.homePool} onChange={e => set('homePool', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fw-version">Firmware Version</Label>
              <Input id="fw-version" placeholder="e.g., 2.12.2025.0820" value={formData.firmwareVersion} onChange={e => set('firmwareVersion', e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={formData.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="not_ready">Not Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
              <Warning size={16} className="text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding…' : 'Add Server'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
