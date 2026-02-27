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

  // Create users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@lab.com',
      password: hashedPassword,
      isAdmin: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@lab.com',
      password: hashedPassword,
      isAdmin: false,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@lab.com',
      password: hashedPassword,
      isAdmin: false,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Mike Johnson',
      email: 'mike@lab.com',
      password: hashedPassword,
      isAdmin: false,
    },
  });

  console.log('Created 4 users');

  // Create servers
  console.log('Creating servers...');
  
  const server1 = await prisma.server.create({
    data: {
      name: 'LAB-SERVER-001',
      cpuSpec: 'Intel Xeon E5-2680 v4 (28 cores)',
      memorySpec: '128GB DDR4',
      storageSpec: '2TB NVMe SSD',
      gpuSpec: 'NVIDIA RTX 4090 24GB',
      status: 'available',
      location: 'Building A, Floor 3, Rack 12',
      rscmIp: '192.168.1.101',
      slotId: 1,
      fwVersion: 'v2.4.1',
      dsPool: 'pool-alpha',
      testHarness: 'harness-v3',
      pool: 'production',
    },
  });

  const server2 = await prisma.server.create({
    data: {
      name: 'LAB-SERVER-002',
      cpuSpec: 'AMD EPYC 7763 (64 cores)',
      memorySpec: '256GB DDR4',
      storageSpec: '4TB NVMe SSD',
      gpuSpec: 'NVIDIA A100 80GB',
      status: 'booked',
      location: 'Building A, Floor 3, Rack 12',
      rscmIp: '192.168.1.102',
      slotId: 2,
      fwVersion: 'v2.4.1',
      dsPool: 'pool-alpha',
      testHarness: 'harness-v3',
      pool: 'production',
    },
  });

  const server3 = await prisma.server.create({
    data: {
      name: 'LAB-SERVER-003',
      cpuSpec: 'Intel Xeon Platinum 8380 (40 cores)',
      memorySpec: '512GB DDR4',
      storageSpec: '8TB NVMe SSD RAID',
      gpuSpec: '2x NVIDIA A100 80GB',
      status: 'available',
      location: 'Building A, Floor 3, Rack 13',
      rscmIp: '192.168.1.103',
      slotId: 3,
      fwVersion: 'v2.5.0',
      dsPool: 'pool-beta',
      testHarness: 'harness-v4',
      pool: 'production',
    },
  });

  const server4 = await prisma.server.create({
    data: {
      name: 'LAB-SERVER-004',
      cpuSpec: 'AMD Ryzen Threadripper PRO 5995WX (64 cores)',
      memorySpec: '128GB DDR4',
      storageSpec: '2TB NVMe SSD',
      gpuSpec: 'NVIDIA RTX 3090 24GB',
      status: 'maintenance',
      location: 'Building B, Floor 2, Rack 5',
      rscmIp: '192.168.1.104',
      slotId: 4,
      fwVersion: 'v2.3.8',
      dsPool: 'pool-gamma',
      testHarness: 'harness-v3',
      pool: 'development',
    },
  });

  const server5 = await prisma.server.create({
    data: {
      name: 'LAB-SERVER-005',
      cpuSpec: 'Intel Core i9-13900K (24 cores)',
      memorySpec: '64GB DDR5',
      storageSpec: '1TB NVMe SSD',
      gpuSpec: 'NVIDIA RTX 4080 16GB',
      status: 'available',
      location: 'Building B, Floor 2, Rack 5',
      rscmIp: '192.168.1.105',
      slotId: 5,
      fwVersion: 'v2.4.1',
      dsPool: 'pool-gamma',
      testHarness: 'harness-v3',
      pool: 'development',
    },
  });

  const server6 = await prisma.server.create({
    data: {
      name: 'LAB-SERVER-006',
      cpuSpec: 'AMD Ryzen 9 7950X (16 cores)',
      memorySpec: '64GB DDR5',
      storageSpec: '2TB NVMe SSD',
      status: 'offline',
      location: 'Building C, Floor 1, Rack 8',
      rscmIp: '192.168.1.106',
      slotId: 6,
      fwVersion: 'v2.2.5',
      dsPool: 'pool-delta',
      testHarness: 'harness-v2',
      pool: 'testing',
    },
  });

  const server7 = await prisma.server.create({
    data: {
      name: 'LAB-SERVER-007',
      cpuSpec: 'Intel Xeon W-3375 (38 cores)',
      memorySpec: '256GB DDR4',
      storageSpec: '4TB NVMe SSD',
      gpuSpec: 'NVIDIA RTX A6000 48GB',
      status: 'booked',
      location: 'Building A, Floor 3, Rack 13',
      rscmIp: '192.168.1.107',
      slotId: 7,
      fwVersion: 'v2.4.1',
      dsPool: 'pool-alpha',
      testHarness: 'harness-v4',
      pool: 'production',
    },
  });

  const server8 = await prisma.server.create({
    data: {
      name: 'LAB-SERVER-008',
      cpuSpec: 'AMD EPYC 7543 (32 cores)',
      memorySpec: '128GB DDR4',
      storageSpec: '2TB NVMe SSD',
      gpuSpec: 'NVIDIA RTX 3080 Ti 12GB',
      status: 'available',
      location: 'Building C, Floor 1, Rack 8',
      rscmIp: '192.168.1.108',
      slotId: 8,
      fwVersion: 'v2.4.0',
      dsPool: 'pool-delta',
      testHarness: 'harness-v3',
      pool: 'testing',
    },
  });

  console.log('Created 8 servers');

  // Create bookings
  console.log('Creating bookings...');
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  await prisma.booking.create({
    data: {
      serverId: server2.id,
      userId: user1.id,
      startDate: twoWeeksAgo,
      endDate: nextWeek,
      purpose: 'Machine Learning Model Training - GPT Fine-tuning',
      status: 'active',
      daysBooked: 21,
      teamAssigned: 'AI Research Team',
    },
  });

  await prisma.booking.create({
    data: {
      serverId: server7.id,
      userId: user2.id,
      startDate: lastWeek,
      endDate: nextWeek,
      purpose: 'Performance Testing - Load Testing Suite v3.2',
      status: 'active',
      daysBooked: 14,
      teamAssigned: 'QA Team',
    },
  });

  await prisma.booking.create({
    data: {
      serverId: server1.id,
      userId: user3.id,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-01-30'),
      purpose: 'Database Migration Testing',
      status: 'completed',
      daysBooked: 15,
      teamAssigned: 'Database Team',
    },
  });

  await prisma.booking.create({
    data: {
      serverId: server3.id,
      userId: user1.id,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-10'),
      purpose: 'Kubernetes Cluster Testing',
      status: 'completed',
      daysBooked: 9,
      teamAssigned: 'DevOps Team',
    },
  });

  console.log('Created 4 bookings');

  console.log('Database seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log('   Users: 4 (1 admin, 3 regular users)');
  console.log('   Servers: 8 (4 available, 2 booked, 1 maintenance, 1 offline)');
  console.log('   Bookings: 4 (2 active, 2 completed)');
  console.log('');
  console.log('Login credentials (all users):');
  console.log('   Email: admin@lab.com | Password: password123');
  console.log('   Email: john@lab.com  | Password: password123');
  console.log('   Email: jane@lab.com  | Password: password123');
  console.log('   Email: mike@lab.com  | Password: password123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
