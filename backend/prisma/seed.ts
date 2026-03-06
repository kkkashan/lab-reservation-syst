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

  // ── 24 Servers ───────────────────────────────────────────────────
  console.log('Creating servers...');

  // --- ARM64 / Cobalt family ---
  const srv01 = await prisma.server.create({ data: {
    name: 'C41431103M0902A',
    cpuSpec: 'Arm Neoverse N2 Cobalt 100 (80 cores)',
    memorySpec: '256GB DDR5',
    storageSpec: '4TB NVMe SSD',
    status: 'available',
    location: 'SCHIE/B50 Lab Rack A1',
    rscmIp: '172.29.94.21',
    slotId: 1,
    fwVersion: 'v3.1.0',
    dsPool: 'WDGExecutionDS01',
    testHarness: 'WTT',
    pool: '$\\Teams\\Core\\Base\\Perf',
  }});

  const srv02 = await prisma.server.create({ data: {
    name: 'C41431103M0903B',
    cpuSpec: 'Arm Neoverse N2 Cobalt 100 (80 cores)',
    memorySpec: '256GB DDR5',
    storageSpec: '4TB NVMe SSD',
    status: 'booked',
    location: 'SCHIE/B50 Lab Rack A1',
    rscmIp: '172.29.94.22',
    slotId: 2,
    fwVersion: 'v3.1.0',
    dsPool: 'WDGExecutionDS01',
    testHarness: 'WTT',
    pool: '$\\Teams\\Core\\Base\\Perf',
  }});

  const srv03 = await prisma.server.create({ data: {
    name: 'C41431103M1001A',
    cpuSpec: 'Arm Neoverse V2 Cobalt 200 (128 cores)',
    memorySpec: '512GB DDR5',
    storageSpec: '8TB NVMe SSD RAID',
    gpuSpec: 'NVIDIA H100 80GB',
    status: 'available',
    location: 'SCHIE/B50 Lab Rack A2',
    rscmIp: '172.29.94.23',
    slotId: 3,
    fwVersion: 'v3.2.1',
    dsPool: 'WDGExecutionDS02',
    testHarness: 'WTT',
    pool: '$\\Teams\\Core\\Base\\AI',
  }});

  const srv04 = await prisma.server.create({ data: {
    name: 'C41431103M1002B',
    cpuSpec: 'Arm Neoverse V2 Cobalt 200 (128 cores)',
    memorySpec: '512GB DDR5',
    storageSpec: '8TB NVMe SSD RAID',
    gpuSpec: 'NVIDIA H100 80GB',
    status: 'booked',
    location: 'SCHIE/B50 Lab Rack A2',
    rscmIp: '172.29.94.24',
    slotId: 4,
    fwVersion: 'v3.2.1',
    dsPool: 'WDGExecutionDS02',
    testHarness: 'TAEF',
    pool: '$\\Teams\\Core\\Base\\AI',
  }});

  const srv05 = await prisma.server.create({ data: {
    name: 'C41431103M1101A',
    cpuSpec: 'Arm Neoverse V3 Cobalt 300 (144 cores)',
    memorySpec: '1TB DDR5',
    storageSpec: '16TB NVMe SSD RAID',
    gpuSpec: '2x NVIDIA H200 141GB',
    status: 'available',
    location: 'SCHIE/B50 Lab Rack A3',
    rscmIp: '172.29.94.25',
    slotId: 5,
    fwVersion: 'v4.0.0-beta',
    dsPool: 'WDGExecutionDS03',
    testHarness: 'WTT',
    pool: '$\\Teams\\Core\\HPC',
  }});

  const srv06 = await prisma.server.create({ data: {
    name: 'C41431103M1102B',
    cpuSpec: 'Arm Neoverse V3 Cobalt 300 (144 cores)',
    memorySpec: '1TB DDR5',
    storageSpec: '16TB NVMe SSD RAID',
    status: 'maintenance',
    location: 'SCHIE/B50 Lab Rack A3',
    rscmIp: '172.29.94.26',
    slotId: 6,
    fwVersion: 'v4.0.0-beta',
    dsPool: 'WDGExecutionDS03',
    testHarness: 'WTT',
    pool: '$\\Teams\\Core\\HPC',
  }});

  const srv07 = await prisma.server.create({ data: {
    name: 'AMP-ARM-001',
    cpuSpec: 'Ampere Altra Max (128 cores)',
    memorySpec: '256GB DDR4',
    storageSpec: '4TB NVMe SSD',
    status: 'available',
    location: 'SCHIE/B51 Lab Rack B1',
    rscmIp: '172.29.95.10',
    slotId: 1,
    fwVersion: 'v2.8.3',
    dsPool: 'WDGExecutionDS01',
    testHarness: 'TAEF',
    pool: '$\\Teams\\Core\\Compat',
  }});

  const srv08 = await prisma.server.create({ data: {
    name: 'GRV-ARM-001',
    cpuSpec: 'AWS Graviton 3 (64 cores)',
    memorySpec: '128GB DDR5',
    storageSpec: '2TB NVMe SSD',
    status: 'booked',
    location: 'SCHIE/B51 Lab Rack B1',
    rscmIp: '172.29.95.11',
    slotId: 2,
    fwVersion: 'v2.9.0',
    dsPool: 'WDGExecutionDS01',
    testHarness: 'TAEF',
    pool: '$\\Teams\\Core\\Compat',
  }});

  // --- Intel family ---
  const srv09 = await prisma.server.create({ data: {
    name: 'XEON-SPR-001',
    cpuSpec: 'Intel Xeon Platinum 8490H Sapphire Rapids (60 cores)',
    memorySpec: '512GB DDR5',
    storageSpec: '8TB NVMe SSD RAID',
    gpuSpec: 'NVIDIA RTX 4090 24GB',
    status: 'available',
    location: 'SCHIE/B51 Lab Rack B2',
    rscmIp: '172.29.95.20',
    slotId: 3,
    fwVersion: 'v3.0.2',
    dsPool: 'WDGExecutionDS04',
    testHarness: 'WTT',
    pool: '$\\Teams\\OS\\Kernel',
  }});

  const srv10 = await prisma.server.create({ data: {
    name: 'XEON-SPR-002',
    cpuSpec: 'Intel Xeon Gold 6448Y Sapphire Rapids (32 cores)',
    memorySpec: '256GB DDR5',
    storageSpec: '4TB NVMe SSD',
    status: 'booked',
    location: 'SCHIE/B51 Lab Rack B2',
    rscmIp: '172.29.95.21',
    slotId: 4,
    fwVersion: 'v3.0.2',
    dsPool: 'WDGExecutionDS04',
    testHarness: 'WTT',
    pool: '$\\Teams\\OS\\Kernel',
  }});

  const srv11 = await prisma.server.create({ data: {
    name: 'XEON-EMR-001',
    cpuSpec: 'Intel Xeon Platinum 8592+ Emerald Rapids (64 cores)',
    memorySpec: '1TB DDR5',
    storageSpec: '16TB NVMe SSD RAID',
    gpuSpec: '2x NVIDIA A100 80GB',
    status: 'available',
    location: 'SCHIE/B52 Lab Rack C1',
    rscmIp: '172.29.96.10',
    slotId: 1,
    fwVersion: 'v3.3.0',
    dsPool: 'WDGExecutionDS05',
    testHarness: 'TAEF',
    pool: '$\\Teams\\OS\\Perf',
  }});

  const srv12 = await prisma.server.create({ data: {
    name: 'XEON-EMR-002',
    cpuSpec: 'Intel Xeon Gold 6538Y+ Emerald Rapids (32 cores)',
    memorySpec: '256GB DDR5',
    storageSpec: '4TB NVMe SSD',
    status: 'offline',
    location: 'SCHIE/B52 Lab Rack C1',
    rscmIp: '172.29.96.11',
    slotId: 2,
    fwVersion: 'v3.2.5',
    dsPool: 'WDGExecutionDS05',
    testHarness: 'TAEF',
    pool: '$\\Teams\\OS\\Perf',
  }});

  const srv13 = await prisma.server.create({ data: {
    name: 'XEON-ICX-001',
    cpuSpec: 'Intel Xeon Platinum 8380 Ice Lake (40 cores)',
    memorySpec: '512GB DDR4',
    storageSpec: '4TB NVMe SSD',
    gpuSpec: 'NVIDIA RTX A6000 48GB',
    status: 'available',
    location: 'SCHIE/B52 Lab Rack C2',
    rscmIp: '172.29.96.20',
    slotId: 3,
    fwVersion: 'v2.8.1',
    dsPool: 'WDGExecutionDS04',
    testHarness: 'WTT',
    pool: '$\\Teams\\Core\\Legacy',
  }});

  const srv14 = await prisma.server.create({ data: {
    name: 'XEON-ICX-002',
    cpuSpec: 'Intel Xeon Gold 6338 Ice Lake (32 cores)',
    memorySpec: '256GB DDR4',
    storageSpec: '2TB NVMe SSD',
    status: 'booked',
    location: 'SCHIE/B52 Lab Rack C2',
    rscmIp: '172.29.96.21',
    slotId: 4,
    fwVersion: 'v2.8.1',
    dsPool: 'WDGExecutionDS04',
    testHarness: 'WTT',
    pool: '$\\Teams\\Core\\Legacy',
  }});

  // --- AMD family ---
  const srv15 = await prisma.server.create({ data: {
    name: 'EPYC-GEN4-001',
    cpuSpec: 'AMD EPYC 9654 Genoa (96 cores)',
    memorySpec: '768GB DDR5',
    storageSpec: '12TB NVMe SSD RAID',
    gpuSpec: 'NVIDIA A100 80GB',
    status: 'available',
    location: 'SCHIE/B53 Lab Rack D1',
    rscmIp: '172.29.97.10',
    slotId: 1,
    fwVersion: 'v3.1.4',
    dsPool: 'WDGExecutionDS06',
    testHarness: 'TAEF',
    pool: '$\\Teams\\Cloud\\Compute',
  }});

  const srv16 = await prisma.server.create({ data: {
    name: 'EPYC-GEN4-002',
    cpuSpec: 'AMD EPYC 9554 Genoa (64 cores)',
    memorySpec: '512GB DDR5',
    storageSpec: '8TB NVMe SSD RAID',
    gpuSpec: 'NVIDIA RTX 4090 24GB',
    status: 'booked',
    location: 'SCHIE/B53 Lab Rack D1',
    rscmIp: '172.29.97.11',
    slotId: 2,
    fwVersion: 'v3.1.4',
    dsPool: 'WDGExecutionDS06',
    testHarness: 'TAEF',
    pool: '$\\Teams\\Cloud\\Compute',
  }});

  const srv17 = await prisma.server.create({ data: {
    name: 'EPYC-GEN5-001',
    cpuSpec: 'AMD EPYC 9755 Turin (128 cores)',
    memorySpec: '1TB DDR5',
    storageSpec: '16TB NVMe SSD RAID',
    gpuSpec: '2x NVIDIA H100 80GB',
    status: 'available',
    location: 'SCHIE/B53 Lab Rack D2',
    rscmIp: '172.29.97.20',
    slotId: 3,
    fwVersion: 'v4.0.0',
    dsPool: 'WDGExecutionDS07',
    testHarness: 'WTT',
    pool: '$\\Teams\\Cloud\\AI',
  }});

  const srv18 = await prisma.server.create({ data: {
    name: 'EPYC-GEN5-002',
    cpuSpec: 'AMD EPYC 9655 Turin (96 cores)',
    memorySpec: '768GB DDR5',
    storageSpec: '12TB NVMe SSD RAID',
    status: 'maintenance',
    location: 'SCHIE/B53 Lab Rack D2',
    rscmIp: '172.29.97.21',
    slotId: 4,
    fwVersion: 'v4.0.0',
    dsPool: 'WDGExecutionDS07',
    testHarness: 'WTT',
    pool: '$\\Teams\\Cloud\\AI',
  }});

  const srv19 = await prisma.server.create({ data: {
    name: 'RYZEN-WS-001',
    cpuSpec: 'AMD Ryzen Threadripper PRO 7995WX (96 cores)',
    memorySpec: '256GB DDR5',
    storageSpec: '4TB NVMe SSD',
    gpuSpec: 'NVIDIA RTX 4080 SUPER 16GB',
    status: 'available',
    location: 'SCHIE/B54 Dev Lab',
    rscmIp: '172.29.98.10',
    slotId: 1,
    fwVersion: 'v2.9.5',
    dsPool: 'WDGExecutionDS08',
    testHarness: 'TAEF',
    pool: '$\\Teams\\DevDiv\\Build',
  }});

  const srv20 = await prisma.server.create({ data: {
    name: 'RYZEN-WS-002',
    cpuSpec: 'AMD Ryzen 9 7950X (16 cores)',
    memorySpec: '128GB DDR5',
    storageSpec: '2TB NVMe SSD',
    gpuSpec: 'NVIDIA RTX 4070 Ti 12GB',
    status: 'booked',
    location: 'SCHIE/B54 Dev Lab',
    rscmIp: '172.29.98.11',
    slotId: 2,
    fwVersion: 'v2.9.5',
    dsPool: 'WDGExecutionDS08',
    testHarness: 'TAEF',
    pool: '$\\Teams\\DevDiv\\Build',
  }});

  // --- Mixed / specialty ---
  const srv21 = await prisma.server.create({ data: {
    name: 'GPU-CLUSTER-001',
    cpuSpec: 'Intel Xeon Platinum 8480+ Sapphire Rapids (56 cores)',
    memorySpec: '1TB DDR5',
    storageSpec: '24TB NVMe SSD RAID',
    gpuSpec: '8x NVIDIA H100 80GB (DGX)',
    status: 'booked',
    location: 'SCHIE/B55 GPU Farm',
    rscmIp: '172.29.99.10',
    slotId: 1,
    fwVersion: 'v4.1.0',
    dsPool: 'WDGExecutionDS09',
    testHarness: 'WTT',
    pool: '$\\Teams\\Research\\LLM',
  }});

  const srv22 = await prisma.server.create({ data: {
    name: 'GPU-CLUSTER-002',
    cpuSpec: 'AMD EPYC 9654 Genoa (96 cores)',
    memorySpec: '1TB DDR5',
    storageSpec: '24TB NVMe SSD RAID',
    gpuSpec: '8x NVIDIA H100 80GB (DGX)',
    status: 'available',
    location: 'SCHIE/B55 GPU Farm',
    rscmIp: '172.29.99.11',
    slotId: 2,
    fwVersion: 'v4.1.0',
    dsPool: 'WDGExecutionDS09',
    testHarness: 'WTT',
    pool: '$\\Teams\\Research\\LLM',
  }});

  const srv23 = await prisma.server.create({ data: {
    name: 'EDGE-IOT-001',
    cpuSpec: 'Arm Neoverse N1 Kunpeng 920 (48 cores)',
    memorySpec: '64GB DDR4',
    storageSpec: '1TB NVMe SSD',
    status: 'available',
    location: 'SCHIE/B56 Edge Lab',
    rscmIp: '172.29.100.10',
    slotId: 1,
    fwVersion: 'v2.5.0',
    dsPool: 'WDGExecutionDS10',
    testHarness: 'TAEF',
    pool: '$\\Teams\\IoT\\Edge',
  }});

  const srv24 = await prisma.server.create({ data: {
    name: 'EDGE-IOT-002',
    cpuSpec: 'Arm Neoverse N1 Kunpeng 920 (48 cores)',
    memorySpec: '64GB DDR4',
    storageSpec: '1TB NVMe SSD',
    status: 'offline',
    location: 'SCHIE/B56 Edge Lab',
    rscmIp: '172.29.100.11',
    slotId: 2,
    fwVersion: 'v2.5.0',
    dsPool: 'WDGExecutionDS10',
    testHarness: 'TAEF',
    pool: '$\\Teams\\IoT\\Edge',
  }});

  console.log('Created 24 servers');

  // ── Bookings ─────────────────────────────────────────────────────
  console.log('Creating bookings...');

  const now = new Date();
  const d = (offset: number) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt; };

  // Active bookings (8)
  await prisma.booking.create({ data: {
    serverId: srv02.id, userId: user1.id,
    startDate: d(-10), endDate: d(11),
    purpose: 'Arm64 kernel regression testing — Cobalt 100 baseline',
    status: 'active', daysBooked: 21, teamAssigned: 'OS Kernel Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv04.id, userId: user2.id,
    startDate: d(-5), endDate: d(9),
    purpose: 'LLM fine-tuning experiments on Cobalt 200 + H100',
    status: 'active', daysBooked: 14, teamAssigned: 'AI Research Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv08.id, userId: user3.id,
    startDate: d(-3), endDate: d(4),
    purpose: 'Graviton 3 compatibility validation for .NET 9',
    status: 'active', daysBooked: 7, teamAssigned: 'Platform Compat Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv10.id, userId: user4.id,
    startDate: d(-7), endDate: d(7),
    purpose: 'Sapphire Rapids AVX-512 performance benchmarks',
    status: 'active', daysBooked: 14, teamAssigned: 'Performance Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv14.id, userId: user5.id,
    startDate: d(-14), endDate: d(0),
    purpose: 'Ice Lake legacy driver validation — Windows Server 2022',
    status: 'active', daysBooked: 14, teamAssigned: 'Driver Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv16.id, userId: user6.id,
    startDate: d(-2), endDate: d(12),
    purpose: 'Genoa VM density stress testing — 500+ VMs',
    status: 'active', daysBooked: 14, teamAssigned: 'Cloud Compute Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv20.id, userId: user7.id,
    startDate: d(-1), endDate: d(6),
    purpose: 'Build pipeline benchmarking — Ryzen vs Intel comparison',
    status: 'active', daysBooked: 7, teamAssigned: 'DevDiv Build Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv21.id, userId: user1.id,
    startDate: d(-20), endDate: d(10),
    purpose: 'GPT-4 scale model pre-training — DGX H100 cluster',
    status: 'active', daysBooked: 30, teamAssigned: 'LLM Research Team',
  }});

  // Pending-renewal bookings (2) — ending very soon
  await prisma.booking.create({ data: {
    serverId: srv14.id, userId: user5.id,
    startDate: d(-14), endDate: d(1),
    purpose: 'Ice Lake driver validation — extension requested',
    status: 'pending_renewal', daysBooked: 15, teamAssigned: 'Driver Team',
    renewalNotificationSent: true,
  }});

  // Completed bookings (4)
  await prisma.booking.create({ data: {
    serverId: srv01.id, userId: user3.id,
    startDate: new Date('2026-01-10'), endDate: new Date('2026-01-25'),
    purpose: 'Cobalt 100 boot-time optimization testing',
    status: 'completed', daysBooked: 15, teamAssigned: 'Boot Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv09.id, userId: user4.id,
    startDate: new Date('2026-01-20'), endDate: new Date('2026-02-05'),
    purpose: 'Sapphire Rapids NUMA topology validation',
    status: 'completed', daysBooked: 16, teamAssigned: 'OS Kernel Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv15.id, userId: user6.id,
    startDate: new Date('2026-02-01'), endDate: new Date('2026-02-14'),
    purpose: 'EPYC Genoa memory bandwidth benchmarking',
    status: 'completed', daysBooked: 13, teamAssigned: 'Performance Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv03.id, userId: user2.id,
    startDate: new Date('2026-02-10'), endDate: new Date('2026-02-24'),
    purpose: 'Cobalt 200 inference latency testing — ONNX Runtime',
    status: 'completed', daysBooked: 14, teamAssigned: 'AI Research Team',
  }});

  // Cancelled bookings (2)
  await prisma.booking.create({ data: {
    serverId: srv17.id, userId: user1.id,
    startDate: new Date('2026-02-15'), endDate: new Date('2026-03-01'),
    purpose: 'Turin evaluation — cancelled due to firmware issue',
    status: 'cancelled', daysBooked: 14, teamAssigned: 'Cloud AI Team',
  }});

  await prisma.booking.create({ data: {
    serverId: srv23.id, userId: user7.id,
    startDate: new Date('2026-02-20'), endDate: new Date('2026-03-06'),
    purpose: 'IoT edge workload profiling — postponed',
    status: 'cancelled', daysBooked: 14, teamAssigned: 'IoT Team',
  }});

  console.log('Created 16 bookings');

  // ── Summary ──────────────────────────────────────────────────────
  console.log('');
  console.log('Database seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log('   Users:    8  (2 admins, 6 regular)');
  console.log('   Servers: 24  (12 available, 8 booked, 2 maintenance, 2 offline)');
  console.log('   Bookings: 16 (8 active, 1 pending-renewal, 4 completed, 2 cancelled)');
  console.log('');
  console.log('Architecture breakdown:');
  console.log('   ARM64:  8 servers  (Cobalt 100/200/300, Ampere, Graviton, Kunpeng)');
  console.log('   Intel:  6 servers  (Sapphire Rapids, Emerald Rapids, Ice Lake)');
  console.log('   AMD:    6 servers  (Genoa, Turin, Threadripper, Ryzen)');
  console.log('   Mixed:  4 servers  (GPU clusters, Edge)');
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
