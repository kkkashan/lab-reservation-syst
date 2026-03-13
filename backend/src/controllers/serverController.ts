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
      teamAssigned: server.teamAssigned,
      assignedUser: server.assignedUser,
      serverFamily: server.serverFamily,
      serverSku: server.serverSku,
      status: server.status,
      dateAllocated: server.dateAllocated,
      duration: server.duration,
      rmIp: server.rmIp,
      slotId: server.slotId,
      homePool: server.homePool,
      firmwareVersion: server.firmwareVersion,
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
    const { name, teamAssigned, assignedUser, serverFamily, serverSku, status, dateAllocated, duration, rmIp, slotId, homePool, firmwareVersion } = req.body;

    const server = await prisma.server.create({
      data: {
        name,
        teamAssigned: teamAssigned || null,
        assignedUser: assignedUser || null,
        serverFamily: serverFamily || null,
        serverSku: serverSku || null,
        status: status || 'ready',
        dateAllocated: dateAllocated ? new Date(dateAllocated) : null,
        duration: duration || null,
        rmIp: rmIp || null,
        slotId: slotId || null,
        homePool: homePool || null,
        firmwareVersion: firmwareVersion || null,
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
    const { name, teamAssigned, assignedUser, serverFamily, serverSku, status, dateAllocated, duration, rmIp, slotId, homePool, firmwareVersion } = req.body;

    const server = await prisma.server.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(teamAssigned !== undefined && { teamAssigned: teamAssigned || null }),
        ...(assignedUser !== undefined && { assignedUser: assignedUser || null }),
        ...(serverFamily !== undefined && { serverFamily: serverFamily || null }),
        ...(serverSku !== undefined && { serverSku: serverSku || null }),
        ...(status && { status }),
        ...(dateAllocated !== undefined && { dateAllocated: dateAllocated ? new Date(dateAllocated) : null }),
        ...(duration !== undefined && { duration: duration || null }),
        ...(rmIp !== undefined && { rmIp: rmIp || null }),
        ...(slotId !== undefined && { slotId: slotId || null }),
        ...(homePool !== undefined && { homePool: homePool || null }),
        ...(firmwareVersion !== undefined && { firmwareVersion: firmwareVersion || null }),
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
