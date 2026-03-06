import { useState, useRef } from 'react';
import { uploadApi, UploadResult } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadSimple, DownloadSimple, FileXls, CheckCircle, XCircle, Spinner } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ExcelUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExcelUploadDialog({ open, onOpenChange, onSuccess }: ExcelUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await uploadApi.uploadExcel(file);
      setResult(res);
      toast.success(`Import complete: ${res.serversCreated + res.serversUpdated} servers processed, ${res.bookingsCreated + res.bookingsUpdated} bookings processed`);
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      await uploadApi.downloadExcel();
      toast.success('Excel file downloaded');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileXls size={20} className="text-green-600 dark:text-green-400" />
            Import / Export Server Data
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file to bulk update server allocation data, or export current data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Export Section */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div>
              <p className="text-sm font-medium text-foreground">Export Current Data</p>
              <p className="text-xs text-muted-foreground">Download all servers & active bookings as Excel</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
              <DownloadSimple size={16} /> Export
            </Button>
          </div>

          {/* Upload Section */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            {file ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <FileXls size={24} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-foreground">{file.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setFile(null); setResult(null); }}>
                    Change File
                  </Button>
                  <Button size="sm" onClick={handleUpload} disabled={uploading} className="flex items-center gap-2">
                    {uploading ? <Spinner size={16} className="animate-spin" /> : <UploadSimple size={16} />}
                    {uploading ? 'Uploading...' : 'Upload & Process'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadSimple size={32} className="mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop or{' '}
                  <button onClick={() => fileRef.current?.click()} className="text-primary underline font-medium">
                    browse
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">Supports .xlsx, .xls, .csv (max 10MB)</p>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
              <p className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <CheckCircle size={16} className="text-green-600 dark:text-green-400" /> Import Results
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{result.serversCreated}</p>
                  <p className="text-xs text-muted-foreground">Servers Created</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{result.serversUpdated}</p>
                  <p className="text-xs text-muted-foreground">Servers Updated</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{result.rowsSkipped}</p>
                  <p className="text-xs text-muted-foreground">Rows Skipped</p>
                </div>
              </div>
              {(result.bookingsCreated > 0 || result.bookingsUpdated > 0) && (
                <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-border">
                  <div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{result.bookingsCreated}</p>
                    <p className="text-xs text-muted-foreground">Bookings Created</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{result.bookingsUpdated}</p>
                    <p className="text-xs text-muted-foreground">Bookings Updated</p>
                  </div>
                </div>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1">
                    <XCircle size={12} /> Errors ({result.errors.length})
                  </p>
                  <ul className="text-xs text-red-500 dark:text-red-400 space-y-0.5 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Column Reference */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <p className="font-medium mb-1 text-foreground">Expected Excel columns:</p>
            <p>
              <code className="font-mono bg-muted px-1 rounded">name</code> (required),{' '}
              <code className="font-mono bg-muted px-1 rounded">cpu</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">memory</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">storage</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">gpu</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">location</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">status</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">rscm_ip</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">slot_id</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">fw_version</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">ds_pool</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">test_harness</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">pool</code>
            </p>
            <p className="mt-1">
              <span className="font-medium text-foreground">Booking columns (optional):</span>{' '}
              <code className="font-mono bg-muted px-1 rounded">team_assigned</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">user_email</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">start_date</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">end_date</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">days_booked</code>,{' '}
              <code className="font-mono bg-muted px-1 rounded">purpose</code>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
