import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNurseDto } from './dto/create-nurse.dto';
import { UpdateNurseDto } from './dto/update-nurse.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NursesService {
  constructor(private prisma: PrismaService) {}

  async create(createNurseDto: CreateNurseDto) {
    // Create user account for nurse
    const user = await this.prisma.user.create({
      data: {
        email: createNurseDto.email,
        password: createNurseDto.password,
        role: 'NURSE',
        firstName: createNurseDto.firstName,
        lastName: createNurseDto.lastName,
        phoneNumber: createNurseDto.phoneNumber,
      },
    });

    // Create nurse record
    return this.prisma.nurse.create({
      data: {
        userId: user.id,
        licenseNumber: createNurseDto.licenseNumber,
        specialization: createNurseDto.specialization,
        qualifications: createNurseDto.qualifications || [],
        departmentId: createNurseDto.departmentId,
      },
      include: {
        user: true,
        department: true,
      },
    });
  }

  async findAll(
    search?: string,
    departmentId?: string,
    specialization?: string,
    sortBy?: 'firstName' | 'lastName' | 'createdAt',
    sortOrder?: Prisma.SortOrder,
  ) {
    const where: Prisma.NurseWhereInput = {
      OR: search
        ? [
            { user: { firstName: { contains: search, mode: 'insensitive' } } },
            { user: { lastName: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ]
        : undefined,
      departmentId: departmentId || undefined,
      specialization: specialization || undefined,
    };

    const orderBy: Prisma.NurseOrderByWithRelationInput = sortBy
      ? { user: { [sortBy]: sortOrder || Prisma.SortOrder.asc } }
      : { user: { firstName: Prisma.SortOrder.asc } };

    return this.prisma.nurse.findMany({
      where,
      orderBy,
      include: {
        user: true,
        department: true,
      },
    });
  }

  async findOne(id: string) {
    const nurse = await this.prisma.nurse.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
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
        await this.prisma.user.update({
          where: { id: nurse.userId },
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
        data: {
          licenseNumber: updateNurseDto.licenseNumber,
          specialization: updateNurseDto.specialization,
          qualifications: updateNurseDto.qualifications,
          departmentId: updateNurseDto.departmentId,
        },
        include: {
          user: true,
          department: true,
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
      by: ['departmentId'],
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
      include: {
        user: true,
        department: true,
      },
    });

    if (!nurse) {
      throw new NotFoundException(`Nurse with ID ${nurseId} not found`);
    }

    // Get nurse's appointments within date range
    const appointments = await this.prisma.appointment.findMany({
      where: {
        nurseId,
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    return {
      nurse,
      appointments,
    };
  }
} 