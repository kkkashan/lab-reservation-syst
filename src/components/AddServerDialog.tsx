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
  specifications: { cpu: string; memory: string; storage: string; gpu?: string };
  location: string;
  status?: string;
  rscmIp?: string;
  slotId?: number;
  fwVersion?: string;
  dsPool?: string;
  testHarness?: string;
  pool?: string;
};

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerAdd: (server: ServerPayload) => Promise<unknown>;
}

export function AddServerDialog({ open, onOpenChange, onServerAdd }: AddServerDialogProps) {
  const [formData, setFormData] = useState({
    name: '', cpu: '', memory: '', storage: '', gpu: '', location: '', status: 'available',
    rscmIp: '', slotId: '', fwVersion: '', dsPool: '', testHarness: '', pool: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '', cpu: '', memory: '', storage: '', gpu: '', location: '', status: 'available',
      rscmIp: '', slotId: '', fwVersion: '', dsPool: '', testHarness: '', pool: '',
    });
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => { resetForm(); onOpenChange(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim())                                         { setError('Server name is required'); return; }
    if (!formData.cpu.trim() || !formData.memory.trim() || !formData.storage.trim()) { setError('CPU, Memory, and Storage are required'); return; }
    if (!formData.location.trim())                                     { setError('Location is required'); return; }
    setIsSubmitting(true);
    try {
      await onServerAdd({
        name: formData.name.trim(),
        specifications: {
          cpu: formData.cpu.trim(),
          memory: formData.memory.trim(),
          storage: formData.storage.trim(),
          ...(formData.gpu.trim() ? { gpu: formData.gpu.trim() } : {}),
        },
        status: formData.status,
        location: formData.location.trim(),
        ...(formData.rscmIp.trim() ? { rscmIp: formData.rscmIp.trim() } : {}),
        ...(formData.slotId.trim() ? { slotId: Number(formData.slotId) } : {}),
        ...(formData.fwVersion.trim() ? { fwVersion: formData.fwVersion.trim() } : {}),
        ...(formData.dsPool.trim() ? { dsPool: formData.dsPool.trim() } : {}),
        ...(formData.testHarness.trim() ? { testHarness: formData.testHarness.trim() } : {}),
        ...(formData.pool.trim() ? { pool: formData.pool.trim() } : {}),
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
              <Label htmlFor="cpu">CPU *</Label>
              <Input id="cpu" placeholder="e.g., Cobalt 200 / Xeon Gold 6338" value={formData.cpu} onChange={e => set('cpu', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory">Memory *</Label>
              <Input id="memory" placeholder="e.g., 128GB DDR4" value={formData.memory} onChange={e => set('memory', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage">Storage *</Label>
              <Input id="storage" placeholder="e.g., 2TB NVMe SSD" value={formData.storage} onChange={e => set('storage', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpu">GPU (Optional)</Label>
              <Input id="gpu" placeholder="e.g., NVIDIA A100 80GB" value={formData.gpu} onChange={e => set('gpu', e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" placeholder="e.g., SCHIE/B50 Lab" value={formData.location} onChange={e => set('location', e.target.value)} required />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={formData.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Infrastructure Details */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Infrastructure Details (Optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rscm-ip">RScm IP</Label>
                <Input id="rscm-ip" placeholder="e.g., 172.29.94.21" value={formData.rscmIp} onChange={e => set('rscmIp', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-id">Slot ID</Label>
                <Input id="slot-id" type="number" placeholder="e.g., 2" value={formData.slotId} onChange={e => set('slotId', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fw-version">FW Version</Label>
                <Input id="fw-version" placeholder="e.g., 1.2.3" value={formData.fwVersion} onChange={e => set('fwVersion', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-harness">Test Harness</Label>
                <Input id="test-harness" placeholder="e.g., WTT" value={formData.testHarness} onChange={e => set('testHarness', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-pool">DS</Label>
                <Input id="ds-pool" placeholder="e.g., WDGExecutionDS02" value={formData.dsPool} onChange={e => set('dsPool', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pool">Pool</Label>
                <Input id="pool" placeholder="e.g., $\Teams\Core\Base\..." value={formData.pool} onChange={e => set('pool', e.target.value)} />
              </div>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <Warning size={16} className="text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
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
