import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabTechnicianDto } from './dto/create-lab-technician.dto';
import { UpdateLabTechnicianDto } from './dto/update-lab-technician.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class LabTechniciansService {
  constructor(private prisma: PrismaService) {}

  async create(createLabTechnicianDto: CreateLabTechnicianDto) {
    // Create user account for lab technician
    const user = await this.prisma.user.create({
      data: {
        email: createLabTechnicianDto.email,
        password: createLabTechnicianDto.password,
        role: UserRole.LAB_TECHNICIAN,
        firstName: createLabTechnicianDto.firstName,
        lastName: createLabTechnicianDto.lastName,
        phoneNumber: createLabTechnicianDto.phoneNumber,
      },
    });

    // Create lab technician record
    return this.prisma.labTechnician.create({
      data: {
        userId: user.id,
        licenseNumber: createLabTechnicianDto.licenseNumber,
        specialization: createLabTechnicianDto.specialization,
        qualifications: createLabTechnicianDto.qualifications,
        departmentId: createLabTechnicianDto.departmentId,
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
    sortBy?: 'firstName' | 'lastName' | 'specialization',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where: any = {
      departmentId: departmentId || undefined,
      specialization: specialization || undefined,
    };

    if (search) {
      where.OR = [
        {
          user: {
            firstName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            lastName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const orderBy: any = sortBy
      ? { [sortBy]: sortOrder || 'asc' }
      : { user: { firstName: 'asc' } };

    return this.prisma.labTechnician.findMany({
      where,
      orderBy,
      include: {
        user: true,
        department: true,
      },
    });
  }

  async findOne(id: string) {
    const labTechnician = await this.prisma.labTechnician.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
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
        await this.prisma.user.update({
          where: { id: labTechnician.userId },
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
        data: {
          licenseNumber: updateLabTechnicianDto.licenseNumber,
          specialization: updateLabTechnicianDto.specialization,
          qualifications: updateLabTechnicianDto.qualifications,
          departmentId: updateLabTechnicianDto.departmentId,
        },
        include: {
          user: true,
          department: true,
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
      by: ['departmentId'],
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
    const testRecords = await this.prisma.labTestOrder.findMany({
      where: {
        processedById: labTechnician.userId,
        orderDate: {
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
        orderedBy: true,
        testCatalog: true,
      },
    });

    return {
      labTechnician,
      testRecords,
    };
  }
} 