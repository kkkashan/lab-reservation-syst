import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data
  console.log('Cleaning up existing data...');
  await prisma.booking.deleteMany();
  await prisma.session.deleteMany();
  await prisma.server.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ────────────────────────────────────────────────────────
  console.log('Creating users...');
  const hash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({ data: { name: 'Admin User',      email: 'admin@lab.com',   password: hash, isAdmin: true  } });
  const user1 = await prisma.user.create({ data: { name: 'John Doe',        email: 'john@lab.com',    password: hash, isAdmin: false } });
  const user2 = await prisma.user.create({ data: { name: 'Jane Smith',      email: 'jane@lab.com',    password: hash, isAdmin: false } });
  const user3 = await prisma.user.create({ data: { name: 'Mike Johnson',    email: 'mike@lab.com',    password: hash, isAdmin: false } });
  const user4 = await prisma.user.create({ data: { name: 'Sarah Chen',      email: 'sarah@lab.com',   password: hash, isAdmin: false } });
  const user5 = await prisma.user.create({ data: { name: 'David Park',      email: 'david@lab.com',   password: hash, isAdmin: false } });
  const user6 = await prisma.user.create({ data: { name: 'Emily Watson',    email: 'emily@lab.com',   password: hash, isAdmin: false } });
  const user7 = await prisma.user.create({ data: { name: 'Carlos Rivera',   email: 'carlos@lab.com',  password: hash, isAdmin: true  } });

  console.log('Created 8 users (2 admins, 6 regular)');

  // ── Servers (sample of new schema) ────────────────────────────────
  console.log('Creating servers...');

  const srv01 = await prisma.server.create({ data: {
    name: 'C41431103M0902A',
    teamAssigned: 'ATP',
    serverFamily: 'ARM64',
    serverSku: 'C4143',
    status: 'ready',
    rmIp: '172.29.94.21',
    slotId: 'Slot 1',
    homePool: 'ATP Pool 1',
    firmwareVersion: 'v3.1.0',
  }});

  const srv02 = await prisma.server.create({ data: {
    name: 'C41431103M0903B',
    teamAssigned: 'CVM',
    serverFamily: 'ARM64',
    serverSku: 'C4143',
    status: 'ready',
    rmIp: '172.29.94.22',
    slotId: 'Slot 2',
    homePool: 'CVM Pool 1',
    firmwareVersion: 'v3.1.0',
  }});

  const srv03 = await prisma.server.create({ data: {
    name: 'C41421103M1001A',
    teamAssigned: 'LSG',
    serverFamily: 'ARM64',
    serverSku: 'C4142',
    status: 'ready',
    rmIp: '172.29.94.23',
    slotId: 'Slot 3',
    homePool: 'LSG Pool 1',
    firmwareVersion: 'v3.2.1',
  }});

  const srv04 = await prisma.server.create({ data: {
    name: 'C41421103M1002B',
    teamAssigned: 'Storage',
    serverFamily: 'ARM64',
    serverSku: 'C4142',
    status: 'not_ready',
    rmIp: '172.29.94.24',
    slotId: 'Slot 4',
    homePool: 'Storage Pool 1',
    firmwareVersion: 'v3.2.1',
  }});

  const srv05 = await prisma.server.create({ data: {
    name: 'C41431103M1101A',
    teamAssigned: 'EnS',
    serverFamily: 'ARM64',
    serverSku: 'C4143',
    status: 'ready',
    rmIp: '172.29.94.25',
    slotId: 'Slot 5',
    homePool: 'EnS Pool 1',
    firmwareVersion: 'v4.0.0',
  }});

  const srv06 = await prisma.server.create({ data: {
    name: 'C41421103M1102B',
    teamAssigned: 'RSVD',
    serverFamily: 'ARM64',
    serverSku: 'C4142',
    status: 'ready',
    rmIp: '172.29.94.26',
    slotId: 'Slot 6',
    homePool: 'RSVD Pool 1',
    firmwareVersion: 'v4.0.0',
  }});

  console.log('Created 6 servers');

  // ── Bookings ─────────────────────────────────────────────────────
  console.log('Creating bookings...');

  const now = new Date();
  const d = (offset: number) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt; };

  await prisma.booking.create({ data: {
    serverId: srv04.id, userId: user1.id,
    startDate: d(-10), endDate: d(11),
    purpose: 'Storage firmware validation',
    status: 'active', daysBooked: 21,
  }});

  await prisma.booking.create({ data: {
    serverId: srv01.id, userId: user2.id,
    startDate: d(-5), endDate: d(9),
    purpose: 'ATP regression testing',
    status: 'active', daysBooked: 14,
  }});

  // Completed booking
  await prisma.booking.create({ data: {
    serverId: srv03.id, userId: user3.id,
    startDate: new Date('2026-01-10'), endDate: new Date('2026-01-25'),
    purpose: 'LSG boot-time optimization',
    status: 'completed', daysBooked: 15,
  }});

  // Cancelled booking
  await prisma.booking.create({ data: {
    serverId: srv05.id, userId: user4.id,
    startDate: new Date('2026-02-15'), endDate: new Date('2026-03-01'),
    purpose: 'EnS evaluation — cancelled',
    status: 'cancelled', daysBooked: 14,
  }});

  console.log('Created 4 bookings');

  // ── Summary ──────────────────────────────────────────────────────
  console.log('');
  console.log('Database seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log('   Users:    8  (2 admins, 6 regular)');
  console.log('   Servers:  6  (5 ready, 1 not_ready)');
  console.log('   Bookings: 4  (2 active, 1 completed, 1 cancelled)');
  console.log('');
  console.log('Login credentials (all users use password123):');
  console.log('   admin@lab.com   (admin)    carlos@lab.com  (admin)');
  console.log('   john@lab.com    jane@lab.com    mike@lab.com');
  console.log('   sarah@lab.com   david@lab.com   emily@lab.com');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
