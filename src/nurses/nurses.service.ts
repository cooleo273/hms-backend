import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNurseDto } from './dto/create-nurse.dto';
import { UpdateNurseDto } from './dto/update-nurse.dto';

@Injectable()
export class NursesService {
  constructor(private prisma: PrismaService) {}

  async create(createNurseDto: CreateNurseDto) {
    // Create user account for nurse
    const user = await this.prisma.user.create({
      data: {
        email: createNurseDto.email,
        role: 'NURSE',
        profile: {
          create: {
            firstName: createNurseDto.firstName,
            lastName: createNurseDto.lastName,
            phoneNumber: createNurseDto.phoneNumber,
          },
        },
      },
    });

    // Create nurse record
    return this.prisma.nurse.create({
      data: {
        ...createNurseDto,
        userId: user.id,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async findAll(
    search?: string,
    department?: string,
    specialization?: string,
    sortBy?: 'firstName' | 'lastName' | 'department',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where = {
      OR: search
        ? [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
      department: department || undefined,
      specialization: specialization || undefined,
    };

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || 'asc' }
      : { firstName: 'asc' };

    return this.prisma.nurse.findMany({
      where,
      orderBy,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const nurse = await this.prisma.nurse.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!nurse) {
      throw new NotFoundException(`Nurse with ID ${id} not found`);
    }

    return nurse;
  }

  async update(id: string, updateNurseDto: UpdateNurseDto) {
    try {
      const nurse = await this.prisma.nurse.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!nurse) {
        throw new NotFoundException(`Nurse with ID ${id} not found`);
      }

      // Update user profile if name or contact info changed
      if (
        updateNurseDto.firstName ||
        updateNurseDto.lastName ||
        updateNurseDto.phoneNumber
      ) {
        await this.prisma.userProfile.update({
          where: { userId: nurse.userId },
          data: {
            firstName: updateNurseDto.firstName,
            lastName: updateNurseDto.lastName,
            phoneNumber: updateNurseDto.phoneNumber,
          },
        });
      }

      // Update nurse record
      return this.prisma.nurse.update({
        where: { id },
        data: updateNurseDto,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Nurse with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const nurse = await this.prisma.nurse.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!nurse) {
        throw new NotFoundException(`Nurse with ID ${id} not found`);
      }

      // Delete nurse record
      await this.prisma.nurse.delete({
        where: { id },
      });

      // Delete associated user account
      await this.prisma.user.delete({
        where: { id: nurse.userId },
      });

      return { message: 'Nurse deleted successfully' };
    } catch (error) {
      throw new NotFoundException(`Nurse with ID ${id} not found`);
    }
  }

  async getNurseStats() {
    const totalNurses = await this.prisma.nurse.count();
    const departmentStats = await this.prisma.nurse.groupBy({
      by: ['department'],
      _count: true,
    });

    const specializationStats = await this.prisma.nurse.groupBy({
      by: ['specialization'],
      _count: true,
    });

    return {
      totalNurses,
      departmentStats,
      specializationStats,
    };
  }

  async getNurseSchedule(nurseId: string, startDate: Date, endDate: Date) {
    const nurse = await this.prisma.nurse.findUnique({
      where: { id: nurseId },
    });

    if (!nurse) {
      throw new NotFoundException(`Nurse with ID ${nurseId} not found`);
    }

    // Get nurse's appointments within date range
    const appointments = await this.prisma.appointment.findMany({
      where: {
        nurseId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return {
      nurse,
      appointments,
    };
  }
} 