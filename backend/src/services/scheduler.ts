import cron from 'node-cron';
import prisma from '../config/database';
import { sendWeeklyDigest, isEmailConfigured } from './emailService';
import logger from '../config/logger';
import { MS_PER_DAY, EMAIL_DIGEST_CRON } from '../config/constants';

function daysRemaining(endDate: Date): number {
  return Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / MS_PER_DAY));
}

export async function runWeeklyDigest(): Promise<{ sent: number; skipped: number; errors: number }> {
  if (!isEmailConfigured()) {
    logger.warn('Weekly digest skipped: SMTP not configured');
    return { sent: 0, skipped: 0, errors: 0 };
  }

  logger.info('Starting weekly email digest...');

  // Get all users with their active bookings
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      bookings: {
        where: { status: { in: ['active', 'pending_renewal'] } },
        include: { server: true },
      },
    },
  });

  // Get available server count
  const availableCount = await prisma.server.count({ where: { status: 'ready' } });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const activeBookings = user.bookings.map(b => ({
        serverName: b.server.name,
        startDate: b.startDate,
        endDate: b.endDate,
        daysRemaining: daysRemaining(b.endDate),
        purpose: b.purpose,
        status: b.status,
      }));

      const expiringBookings = activeBookings.filter(b => b.daysRemaining <= 7);

      // Send to all users (even those with no bookings — keeps them engaged)
      await sendWeeklyDigest({
        name: user.name,
        email: user.email,
        activeBookings,
        expiringBookings,
        totalServersAvailable: availableCount,
      });

      sent++;
    } catch (err) {
      logger.error(`Failed to send digest to ${user.email}: ${(err as Error).message}`);
      errors++;
    }
  }

  skipped = users.length - sent - errors;
  logger.info(`Weekly digest complete: ${sent} sent, ${skipped} skipped, ${errors} errors`);
  return { sent, skipped, errors };
}

// Schedule: every Monday at 08:00 AM server time
export function startScheduler(): void {
  if (!isEmailConfigured()) {
    logger.warn('Email scheduler not started: SMTP_HOST, SMTP_USER, SMTP_PASS not set in environment');
    return;
  }

  // EMAIL_DIGEST_CRON = 08:00 every Monday
  cron.schedule(EMAIL_DIGEST_CRON, async () => {
    logger.info('Cron triggered: weekly digest');
    try {
      await runWeeklyDigest();
    } catch (err) {
      logger.error('Cron weekly digest failed:', err);
    }
  }, { timezone: 'UTC' });

  logger.info('Weekly email scheduler started (Mondays 08:00 UTC)');
}
