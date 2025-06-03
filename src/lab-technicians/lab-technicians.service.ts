import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabTechnicianDto } from './dto/create-lab-technician.dto';
import { UpdateLabTechnicianDto } from './dto/update-lab-technician.dto';

@Injectable()
export class LabTechniciansService {
  constructor(private prisma: PrismaService) {}

  async create(createLabTechnicianDto: CreateLabTechnicianDto) {
    // Create user account for lab technician
    const user = await this.prisma.user.create({
      data: {
        email: createLabTechnicianDto.email,
        role: 'LAB_TECHNICIAN',
        profile: {
          create: {
            firstName: createLabTechnicianDto.firstName,
            lastName: createLabTechnicianDto.lastName,
            phoneNumber: createLabTechnicianDto.phoneNumber,
          },
        },
      },
    });

    // Create lab technician record
    return this.prisma.labTechnician.create({
      data: {
        ...createLabTechnicianDto,
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

    return this.prisma.labTechnician.findMany({
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
    const labTechnician = await this.prisma.labTechnician.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!labTechnician) {
      throw new NotFoundException(`Lab Technician with ID ${id} not found`);
    }

    return labTechnician;
  }

  async update(id: string, updateLabTechnicianDto: UpdateLabTechnicianDto) {
    try {
      const labTechnician = await this.prisma.labTechnician.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!labTechnician) {
        throw new NotFoundException(`Lab Technician with ID ${id} not found`);
      }

      // Update user profile if name or contact info changed
      if (
        updateLabTechnicianDto.firstName ||
        updateLabTechnicianDto.lastName ||
        updateLabTechnicianDto.phoneNumber
      ) {
        await this.prisma.userProfile.update({
          where: { userId: labTechnician.userId },
          data: {
            firstName: updateLabTechnicianDto.firstName,
            lastName: updateLabTechnicianDto.lastName,
            phoneNumber: updateLabTechnicianDto.phoneNumber,
          },
        });
      }

      // Update lab technician record
      return this.prisma.labTechnician.update({
        where: { id },
        data: updateLabTechnicianDto,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Lab Technician with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const labTechnician = await this.prisma.labTechnician.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!labTechnician) {
        throw new NotFoundException(`Lab Technician with ID ${id} not found`);
      }

      // Delete lab technician record
      await this.prisma.labTechnician.delete({
        where: { id },
      });

      // Delete associated user account
      await this.prisma.user.delete({
        where: { id: labTechnician.userId },
      });

      return { message: 'Lab Technician deleted successfully' };
    } catch (error) {
      throw new NotFoundException(`Lab Technician with ID ${id} not found`);
    }
  }

  async getLabTechnicianStats() {
    const totalLabTechnicians = await this.prisma.labTechnician.count();
    const departmentStats = await this.prisma.labTechnician.groupBy({
      by: ['department'],
      _count: true,
    });

    const specializationStats = await this.prisma.labTechnician.groupBy({
      by: ['specialization'],
      _count: true,
    });

    return {
      totalLabTechnicians,
      departmentStats,
      specializationStats,
    };
  }

  async getLabTechnicianTestHistory(
    labTechnicianId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const labTechnician = await this.prisma.labTechnician.findUnique({
      where: { id: labTechnicianId },
    });

    if (!labTechnician) {
      throw new NotFoundException(`Lab Technician with ID ${labTechnicianId} not found`);
    }

    // Get lab technician's test records within date range
    const testRecords = await this.prisma.labTest.findMany({
      where: {
        labTechnicianId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: true,
        doctor: true,
        testType: true,
      },
    });

    return {
      labTechnician,
      testRecords,
    };
  }
} 