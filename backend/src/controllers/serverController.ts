import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAllServers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const servers = await prisma.server.findMany({
      include: {
        bookings: {
          where: {
            status: 'active',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const serversWithCurrentBooking = servers.map(server => ({
      id: server.id,
      name: server.name,
      specifications: {
        cpu: server.cpuSpec,
        memory: server.memorySpec,
        storage: server.storageSpec,
        gpu: server.gpuSpec,
      },
      status: server.status,
      location: server.location,
      rscmIp: server.rscmIp,
      slotId: server.slotId,
      fwVersion: server.fwVersion,
      dsPool: server.dsPool,
      testHarness: server.testHarness,
      pool: server.pool,
      currentBooking: server.bookings[0] || null,
    }));

    res.json({ status: 'success', data: serversWithCurrentBooking });
  } catch (error) {
    next(error);
  }
};

export const getServerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!server) throw new AppError(404, 'Server not found');

    res.json({ status: 'success', data: server });
  } catch (error) {
    next(error);
  }
};

export const createServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, specifications, location, status, rscmIp, slotId, fwVersion, dsPool, testHarness, pool } = req.body;

    const server = await prisma.server.create({
      data: {
        name,
        cpuSpec: specifications.cpu,
        memorySpec: specifications.memory,
        storageSpec: specifications.storage,
        gpuSpec: specifications.gpu ?? null,
        location,
        status: status || 'available',
        rscmIp: rscmIp || null,
        slotId: slotId != null ? Number(slotId) : null,
        fwVersion: fwVersion || null,
        dsPool: dsPool || null,
        testHarness: testHarness || null,
        pool: pool || null,
      },
    });

    res.status(201).json({ status: 'success', data: server });
  } catch (error) {
    next(error);
  }
};

export const updateServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, specifications, status, location, rscmIp, slotId, fwVersion, dsPool, testHarness, pool } = req.body;

    const server = await prisma.server.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(specifications?.cpu && { cpuSpec: specifications.cpu }),
        ...(specifications?.memory && { memorySpec: specifications.memory }),
        ...(specifications?.storage && { storageSpec: specifications.storage }),
        ...(specifications?.gpu !== undefined && { gpuSpec: specifications.gpu }),
        ...(status && { status }),
        ...(location && { location }),
        ...(rscmIp !== undefined && { rscmIp: rscmIp || null }),
        ...(slotId !== undefined && { slotId: slotId != null ? Number(slotId) : null }),
        ...(fwVersion !== undefined && { fwVersion: fwVersion || null }),
        ...(dsPool !== undefined && { dsPool: dsPool || null }),
        ...(testHarness !== undefined && { testHarness: testHarness || null }),
        ...(pool !== undefined && { pool: pool || null }),
      },
    });

    res.json({ status: 'success', data: server });
  } catch (error) {
    next(error);
  }
};

export const deleteServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.server.delete({ where: { id } });
    res.json({ status: 'success', message: 'Server deleted successfully' });
  } catch (error) {
    next(error);
  }
};
