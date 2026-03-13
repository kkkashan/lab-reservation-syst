import { Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

/**
 * POST /api/admin/upload-excel
 * Admin-only: upload an Excel file to bulk-upsert server allocation data.
 *
 * Supported columns (case-insensitive):
 *   Team Assigned, User, Server Family, Server SKU, Server Name,
 *   Status, Date Allocated, Duration, RM IP, Slot #, Home Pool, Firmware Version
 *
 * Logic:
 *   - If a server with the given *name* already exists, it is **updated**.
 *   - If it does not exist, it is **created**.
 */
export const uploadExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded. Please attach an .xlsx or .csv file.');
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new AppError(400, 'Excel file has no sheets');

    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    if (rows.length === 0) throw new AppError(400, 'Excel sheet is empty');

    let serversCreated = 0;
    let serversUpdated = 0;
    let rowsSkipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-based, header is row 1

      // Helper to read a column value case-insensitively
      const col = (keys: string[]): string => {
        for (const k of keys) {
          for (const rk of Object.keys(row)) {
            if (rk.toLowerCase().replace(/[\s_#-]/g, '') === k.toLowerCase().replace(/[\s_#-]/g, '')) {
              return String(row[rk] ?? '').trim();
            }
          }
        }
        return '';
      };

      const name           = col(['servername', 'server_name', 'server name', 'name', 'server']);
      const teamAssigned   = col(['teamassigned', 'team_assigned', 'team assigned', 'team']);
      const assignedUser   = col(['user', 'assigneduser', 'assigned_user', 'assigned user']);
      const serverFamily   = col(['serverfamily', 'server_family', 'server family', 'family']);
      const serverSku      = col(['serversku', 'server_sku', 'server sku', 'sku']);
      const statusRaw      = col(['status', 'serverstatus', 'server_status']);
      const dateAllocated  = col(['dateallocated', 'date_allocated', 'date allocated', 'date']);
      const duration       = col(['duration', 'durationdays', 'duration_days']);
      const rmIp           = col(['rmip', 'rm_ip', 'rm ip', 'rscmip', 'rscm_ip', 'ip']);
      const slotId         = col(['slotid', 'slot_id', 'slot', 'slot#']);
      const homePool       = col(['homepool', 'home_pool', 'home pool', 'pool']);
      const firmwareVersion = col(['firmwareversion', 'firmware_version', 'firmware version', 'firmware', 'fwversion', 'fw_version']);

      if (!name) {
        errors.push(`Row ${rowNum}: missing server name — skipped`);
        rowsSkipped++;
        continue;
      }

      try {
        // Normalize status
        const normalizedStatus = statusRaw.toLowerCase().replace(/[\s_-]/g, '');
        const status: 'ready' | 'not_ready' = normalizedStatus === 'notready' ? 'not_ready' : 'ready';

        // Parse date
        let parsedDate: Date | null = null;
        if (dateAllocated) {
          if (!isNaN(Number(dateAllocated))) {
            parsedDate = excelDateToJS(Number(dateAllocated));
          } else {
            parsedDate = new Date(dateAllocated);
          }
          if (isNaN(parsedDate.getTime())) parsedDate = null;
        }

        const serverData = {
          teamAssigned: teamAssigned || null,
          assignedUser: assignedUser || null,
          serverFamily: serverFamily || null,
          serverSku: serverSku || null,
          status,
          dateAllocated: parsedDate,
          duration: duration || null,
          rmIp: rmIp || null,
          slotId: slotId || null,
          homePool: homePool || null,
          firmwareVersion: firmwareVersion || null,
        };

        const existing = await prisma.server.findUnique({ where: { name } });

        if (existing) {
          await prisma.server.update({
            where: { name },
            data: serverData,
          });
          serversUpdated++;
        } else {
          await prisma.server.create({
            data: { name, ...serverData },
          });
          serversCreated++;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${rowNum}: ${msg}`);
        rowsSkipped++;
      }
    }

    logger.info(`Excel upload: ${serversCreated} created, ${serversUpdated} updated, ${rowsSkipped} skipped`);

    res.json({
      status: 'success',
      data: {
        serversCreated,
        serversUpdated,
        rowsSkipped,
        totalRows: rows.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/export-excel
 * Admin-only: export all servers as Excel file
 */
export const exportExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { name: 'asc' },
    });

    const rows = servers.map(s => ({
      'Team Assigned': s.teamAssigned || '',
      'User': s.assignedUser || '',
      'Server Family': s.serverFamily || '',
      'Server SKU': s.serverSku || '',
      'Server Name': s.name,
      'Status': s.status === 'ready' ? 'Ready' : 'Not Ready',
      'Date Allocated': s.dateAllocated ? new Date(s.dateAllocated).toISOString().split('T')[0] : '',
      'Duration': s.duration || '',
      'RM IP': s.rmIp || '',
      'Slot #': s.slotId || '',
      'Home Pool': s.homePool || '',
      'Firmware Version': s.firmwareVersion || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Server Allocations');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=server-allocations.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/** Convert Excel serial date number to JavaScript Date */
function excelDateToJS(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}
