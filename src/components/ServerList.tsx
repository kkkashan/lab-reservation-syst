import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';
import { ServerData } from '@/lib/api';
import { AddServerDialog } from './AddServerDialog';
import { ExcelUploadDialog } from './ExcelUploadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UploadSimple, DownloadSimple, Trash, MagnifyingGlass, Desktop, FileXls } from '@phosphor-icons/react';
import { toast } from 'sonner';

type ServerPayload = {
  name: string;
  specifications: { cpu: string; memory: string; storage: string; gpu?: string };
  location: string;
  status?: string;
};

interface ServerListProps {
  servers: ServerData[];
  onServerAdd:    (data: ServerPayload) => Promise<unknown>;
  onServerUpdate: (id: string, data: { status?: string }) => Promise<unknown>;
  onServerDelete: (id: string) => Promise<unknown>;
  isAdmin?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  available:   'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
  booked:      'bg-blue-100  dark:bg-blue-950/30  text-blue-800  dark:text-blue-400  border-blue-200  dark:border-blue-800',
  maintenance: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  offline:     'bg-red-100   dark:bg-red-950/30   text-red-800   dark:text-red-400   border-red-200   dark:border-red-800',
};

export function ServerList({ servers, onServerAdd, onServerUpdate, onServerDelete, isAdmin }: ServerListProps) {
  const [addOpen, setAddOpen]     = useState(false);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [importing, setImporting] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const filtered = servers.filter(s => {
    const matchName   = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.specifications.cpu.toLowerCase().includes(search.toLowerCase()) ||
                        s.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchName && matchStatus;
  });

  const downloadTemplate = () => {
    const rows = [
      ['name', 'cpu', 'memory', 'storage', 'gpu', 'location', 'status'],
      ['Lab-Server-AMD-01',   'AMD EPYC 7742 64-Core',  '256GB DDR4', '2TB NVMe SSD', 'AMD Radeon Pro W6800',  'Building A Room 101', 'available'],
      ['Lab-Server-Intel-01', 'Intel Xeon Gold 6338',   '128GB DDR4', '1TB NVMe SSD', '',                      'Building B Room 202', 'available'],
      ['Lab-Server-GPU-01',   'AMD EPYC 9654',          '512GB DDR5', '4TB NVMe SSD', 'NVIDIA A100 80GB x4',   'Building C Room 303', 'available'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [22, 30, 16, 18, 24, 24, 12].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Servers');
    XLSX.writeFile(wb, 'server-import-template.xlsx');
    toast.success('Template downloaded — fill it in and re-import');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    let ok = 0, fail = 0;
    try {
      const buffer = await file.arrayBuffer();
      const wb     = XLSX.read(buffer, { type: 'array' });
      const ws     = wb.Sheets[wb.SheetNames[0]];
      const rows   = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
      if (rows.length === 0) { toast.error('Excel file is empty'); return; }

      for (const row of rows) {
        const name    = String(row.name     || row.Name     || '').trim();
        const cpu     = String(row.cpu      || row.CPU      || '').trim();
        const memory  = String(row.memory   || row.Memory   || '').trim();
        const storage = String(row.storage  || row.Storage  || '').trim();
        const gpu     = String(row.gpu      || row.GPU      || '').trim();
        const loc     = String(row.location || row.Location || '').trim();
        const status  = String(row.status   || row.Status   || 'available').trim();

        if (!name || !cpu || !memory || !storage || !loc) { fail++; continue; }
        try {
          await onServerAdd({ name, specifications: { cpu, memory, storage, ...(gpu ? { gpu } : {}) }, location: loc, status });
          ok++;
        } catch { fail++; }
      }
    } catch {
      toast.error('Could not read file. Please use the downloaded template.');
    } finally {
      setImporting(false);
      if (ok)   toast.success(`Imported ${ok} server${ok > 1 ? 's' : ''}`);
      if (fail) toast.error(`${fail} row${fail > 1 ? 's' : ''} skipped (missing required fields)`);
    }
  };

  const handleDelete = async (server: ServerData) => {
    if (!confirm(`Delete "${server.name}"? This cannot be undone.`)) return;
    try {
      await onServerDelete(server.id);
      toast.success('Server deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await onServerUpdate(id, { status }); toast.success('Status updated'); }
    catch { toast.error('Failed to update status'); }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['servers'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const stats = {
    total:       servers.length,
    available:   servers.filter(s => s.status === 'available').length,
    booked:      servers.filter(s => s.status === 'booked').length,
    maintenance: servers.filter(s => s.status === 'maintenance').length,
    offline:     servers.filter(s => s.status === 'offline').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Server List</h1>
          <p className="text-muted-foreground mt-1">{servers.length} server{servers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="flex items-center gap-2">
            <DownloadSimple size={16} /> Download Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing} className="flex items-center gap-2">
            <UploadSimple size={16} /> {importing ? 'Importing…' : 'Import Excel'}
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)} className="flex items-center gap-2">
              <FileXls size={16} className="text-green-600 dark:text-green-400" />
              <span className="text-xs">Upload to Server</span>
            </Button>
          )}
          <Button size="sm" onClick={() => setAddOpen(true)} className="flex items-center gap-2">
            <Plus size={16} /> Add Server
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {([
          { label: 'Total',       value: stats.total,       color: 'text-foreground' },
          { label: 'Available',   value: stats.available,   color: 'text-green-600 dark:text-green-400' },
          { label: 'Booked',      value: stats.booked,      color: 'text-blue-600  dark:text-blue-400'  },
          { label: 'Maintenance', value: stats.maintenance, color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Offline',     value: stats.offline,     color: 'text-red-600   dark:text-red-400'   },
        ] as const).map(stat => (
          <Card key={stat.label}>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, CPU, location…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Server Name</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>GPU</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Del</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                    <Desktop size={40} className="mx-auto mb-3 opacity-20" />
                    {servers.length === 0
                      ? 'No servers yet — click "Add Server" or "Import Excel" to get started'
                      : 'No servers match your search'}
                  </TableCell>
                </TableRow>
              ) : filtered.map(server => (
                <TableRow key={server.id}>
                  <TableCell className="font-medium">{server.name}</TableCell>
                  <TableCell className="text-sm">{server.specifications.cpu}</TableCell>
                  <TableCell className="text-sm">{server.specifications.memory}</TableCell>
                  <TableCell className="text-sm">{server.specifications.storage}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{server.specifications.gpu || '—'}</TableCell>
                  <TableCell className="text-sm">{server.location}</TableCell>
                  <TableCell>
                    <Select value={server.status} onValueChange={v => handleStatusChange(server.id, v)}>
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <Badge className={`text-xs ${STATUS_COLORS[server.status] || ''}`}>{server.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(server)}
                      disabled={server.status === 'booked'}
                      title={server.status === 'booked' ? 'Cannot delete a booked server' : 'Delete'}
                    >
                      <Trash size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        📋 Excel columns: <code className="font-mono bg-muted px-1 rounded">name, cpu, memory, storage, gpu (optional), location, status</code>
      </p>

      <AddServerDialog open={addOpen} onOpenChange={setAddOpen} onServerAdd={onServerAdd} />

      {isAdmin && (
        <ExcelUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
