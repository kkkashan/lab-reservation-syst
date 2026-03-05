import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { runWeeklyDigest } from '../services/scheduler';
import { sendTestEmail, isEmailConfigured } from '../services/emailService';
import { AppError } from '../middleware/errorHandler';
import { EMAIL_DIGEST_SCHEDULE_DESC } from '../config/constants';
import { uploadExcel, exportExcel } from '../controllers/uploadController';

const router = Router();

// Multer config: accept single file in memory (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/octet-stream',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx, .xls, and .csv files are allowed'));
    }
  },
});

// GET /api/admin/email-status
router.get('/email-status', authenticate, requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({
    status: 'success',
    data: {
      configured: isEmailConfigured(),
      schedule: EMAIL_DIGEST_SCHEDULE_DESC,
    },
  });
});

// POST /api/admin/send-weekly-digest — manually trigger digest
router.post('/send-weekly-digest', authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isEmailConfigured()) throw new AppError(400, 'SMTP not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
    const result = await runWeeklyDigest();
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/send-test-email — test the SMTP connection
router.post('/send-test-email', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isEmailConfigured()) throw new AppError(400, 'SMTP not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
    const email = req.user!.email;
    await sendTestEmail(email);
    res.json({ status: 'success', data: { message: `Test email sent to ${email}` } });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/upload-excel — bulk import servers & bookings from Excel
router.post('/upload-excel', authenticate, requireAdmin, upload.single('file'), uploadExcel);

// GET /api/admin/export-excel — download all server allocation data as Excel
router.get('/export-excel', authenticate, requireAdmin, exportExcel);

export default router;
