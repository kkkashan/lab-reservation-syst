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
 *   name, cpu, memory, storage, gpu, location, status,
 *   rscm_ip, slot_id, fw_version, ds_pool, test_harness, pool,
 *   team_assigned, user_email, start_date, end_date, purpose, days_booked
 *
 * Logic:
 *   - If a server with the given *name* already exists, it is **updated**.
 *   - If it does not exist, it is **created**.
 *   - If booking columns (user_email, start_date, end_date, purpose) are
 *     present for a row AND the referenced user exists, a booking is
 *     upserted for that server.
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
    let bookingsCreated = 0;
    let bookingsUpdated = 0;
    let rowsSkipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-based, header is row 1

      // Helper to read a column value case-insensitively
      const col = (keys: string[]): string => {
        for (const k of keys) {
          for (const rk of Object.keys(row)) {
            if (rk.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, '')) {
              return String(row[rk] ?? '').trim();
            }
          }
        }
        return '';
      };

      const name     = col(['name', 'servername', 'server_name', 'server']);
      const cpu      = col(['cpu', 'cpuspec', 'cpu_spec']);
      const memory   = col(['memory', 'memoryspec', 'memory_spec', 'ram']);
      const storage  = col(['storage', 'storagespec', 'storage_spec', 'disk']);
      const gpu      = col(['gpu', 'gpuspec', 'gpu_spec']);
      const location = col(['location', 'loc']);
      const status   = col(['status', 'serverstatus', 'server_status']) || 'available';
      const rscmIp   = col(['rscmip', 'rscm_ip', 'ip']);
      const slotIdRaw = col(['slotid', 'slot_id', 'slot']);
      const fwVersion = col(['fwversion', 'fw_version', 'firmware']);
      const dsPool   = col(['dspool', 'ds_pool', 'ds']);
      const testHarness = col(['testharness', 'test_harness', 'harness']);
      const pool     = col(['pool']);

      // Booking columns
      const teamAssigned = col(['teamassigned', 'team_assigned', 'team']);
      const userEmail    = col(['useremail', 'user_email', 'email', 'user']);
      const startDateRaw = col(['startdate', 'start_date', 'dateallocated', 'date_allocated', 'start']);
      const endDateRaw   = col(['enddate', 'end_date', 'end']);
      const purpose      = col(['purpose', 'description', 'reason']);
      const daysBookedRaw = col(['daysbooked', 'days_booked', 'duration', 'durationdays', 'duration_days']);

      if (!name) {
        errors.push(`Row ${rowNum}: missing server name — skipped`);
        rowsSkipped++;
        continue;
      }

      try {
        // Upsert server
        const slotId = slotIdRaw ? parseInt(slotIdRaw, 10) : null;
        const validStatuses = ['available', 'booked', 'maintenance', 'offline'];
        const serverStatus = validStatuses.includes(status.toLowerCase()) ? status.toLowerCase() : 'available';

        const serverData = {
          cpuSpec: cpu || 'N/A',
          memorySpec: memory || 'N/A',
          storageSpec: storage || 'N/A',
          gpuSpec: gpu || null,
          location: location || 'Unknown',
          status: serverStatus as 'available' | 'booked' | 'maintenance' | 'offline',
          rscmIp: rscmIp || null,
          slotId: slotId && !isNaN(slotId) ? slotId : null,
          fwVersion: fwVersion || null,
          dsPool: dsPool || null,
          testHarness: testHarness || null,
          pool: pool || null,
        };

        let server = await prisma.server.findUnique({ where: { name } });

        if (server) {
          server = await prisma.server.update({
            where: { name },
            data: serverData,
          });
          serversUpdated++;
        } else {
          server = await prisma.server.create({
            data: { name, ...serverData },
          });
          serversCreated++;
        }

        // Handle booking if user email is provided
        if (userEmail && startDateRaw) {
          const user = await prisma.user.findUnique({ where: { email: userEmail } });
          if (!user) {
            errors.push(`Row ${rowNum}: user "${userEmail}" not found — server saved but booking skipped`);
          } else {
            // Parse dates
            let startDate: Date;
            let endDate: Date;

            // Try parsing Excel serial number or string date
            if (!isNaN(Number(startDateRaw))) {
              startDate = excelDateToJS(Number(startDateRaw));
            } else {
              startDate = new Date(startDateRaw);
            }

            if (endDateRaw) {
              if (!isNaN(Number(endDateRaw))) {
                endDate = excelDateToJS(Number(endDateRaw));
              } else {
                endDate = new Date(endDateRaw);
              }
            } else {
              // Default: 14 days from start
              const days = daysBookedRaw ? parseInt(daysBookedRaw, 10) : 14;
              endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + (isNaN(days) ? 14 : days));
            }

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              errors.push(`Row ${rowNum}: invalid dates — booking skipped`);
            } else {
              const daysBooked = daysBookedRaw
                ? parseInt(daysBookedRaw, 10)
                : Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);

              // Check if there's already an active booking for this server
              const existingBooking = await prisma.booking.findFirst({
                where: {
                  serverId: server.id,
                  status: { in: ['active', 'pending_renewal'] },
                },
              });

              if (existingBooking) {
                await prisma.booking.update({
                  where: { id: existingBooking.id },
                  data: {
                    userId: user.id,
                    startDate,
                    endDate,
                    purpose: purpose || existingBooking.purpose,
                    daysBooked: isNaN(daysBooked) ? existingBooking.daysBooked : daysBooked,
                    teamAssigned: teamAssigned || existingBooking.teamAssigned,
                    status: 'active',
                  },
                });
                bookingsUpdated++;
              } else {
                await prisma.booking.create({
                  data: {
                    serverId: server.id,
                    userId: user.id,
                    startDate,
                    endDate,
                    purpose: purpose || 'Imported from Excel',
                    daysBooked: isNaN(daysBooked) ? 14 : daysBooked,
                    teamAssigned: teamAssigned || null,
                    status: 'active',
                  },
                });
                bookingsCreated++;
              }

              // Update server status to booked
              await prisma.server.update({
                where: { id: server.id },
                data: { status: 'booked' },
              });
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${rowNum}: ${msg}`);
        rowsSkipped++;
      }
    }

    logger.info(`Excel upload: ${serversCreated} created, ${serversUpdated} updated, ${bookingsCreated} bookings created, ${bookingsUpdated} bookings updated, ${rowsSkipped} skipped`);

    res.json({
      status: 'success',
      data: {
        serversCreated,
        serversUpdated,
        bookingsCreated,
        bookingsUpdated,
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
 * Admin-only: export all servers + active bookings as Excel file
 */
export const exportExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const servers = await prisma.server.findMany({
      include: {
        bookings: {
          where: { status: { in: ['active', 'pending_renewal'] } },
          include: { user: { select: { email: true, name: true } } },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    const rows = servers.map(s => {
      const b = s.bookings[0];
      return {
        name: s.name,
        cpu: s.cpuSpec,
        memory: s.memorySpec,
        storage: s.storageSpec,
        gpu: s.gpuSpec || '',
        location: s.location,
        status: s.status,
        rscm_ip: s.rscmIp || '',
        slot_id: s.slotId ?? '',
        fw_version: s.fwVersion || '',
        ds_pool: s.dsPool || '',
        test_harness: s.testHarness || '',
        pool: s.pool || '',
        team_assigned: b?.teamAssigned || '',
        user_email: b?.user?.email || '',
        start_date: b ? new Date(b.startDate).toISOString().split('T')[0] : '',
        end_date: b ? new Date(b.endDate).toISOString().split('T')[0] : '',
        days_booked: b?.daysBooked ?? '',
        purpose: b?.purpose || '',
      };
    });

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
