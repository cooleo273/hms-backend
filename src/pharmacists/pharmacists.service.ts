import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePharmacistDto } from './dto/create-pharmacist.dto';
import { UpdatePharmacistDto } from './dto/update-pharmacist.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class PharmacistsService {
  constructor(private prisma: PrismaService) {}

  async create(createPharmacistDto: CreatePharmacistDto) {
    // Create user account for pharmacist
    const user = await this.prisma.user.create({
      data: {
        email: createPharmacistDto.email,
        password: createPharmacistDto.password,
        role: UserRole.PHARMACIST,
        firstName: createPharmacistDto.firstName,
        lastName: createPharmacistDto.lastName,
        phoneNumber: createPharmacistDto.phoneNumber,
      },
    });

    // Create pharmacist record
    return this.prisma.pharmacist.create({
      data: {
        licenseNumber: createPharmacistDto.licenseNumber,
        specialization: createPharmacistDto.specialization,
        qualifications: createPharmacistDto.qualifications,
        departmentId: createPharmacistDto.departmentId,
        userId: user.id,
      },
      include: {
        user: true,
        department: true,
      },
    });
  }

  async findAll(
    search?: string,
    specialization?: string,
    sortBy?: 'firstName' | 'lastName' | 'specialization',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where: any = {
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

    return this.prisma.pharmacist.findMany({
      where,
      orderBy,
      include: {
        user: true,
        department: true,
      },
    });
  }

  async findOne(id: string) {
    const pharmacist = await this.prisma.pharmacist.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
      },
    });

    if (!pharmacist) {
      throw new NotFoundException(`Pharmacist with ID ${id} not found`);
    }

    return pharmacist;
  }

  async update(id: string, updatePharmacistDto: UpdatePharmacistDto) {
    try {
      const pharmacist = await this.prisma.pharmacist.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!pharmacist) {
        throw new NotFoundException(`Pharmacist with ID ${id} not found`);
      }

      // Update user profile if name or contact info changed
      if (
        updatePharmacistDto.firstName ||
        updatePharmacistDto.lastName ||
        updatePharmacistDto.phoneNumber
      ) {
        await this.prisma.user.update({
          where: { id: pharmacist.userId },
          data: {
            firstName: updatePharmacistDto.firstName,
            lastName: updatePharmacistDto.lastName,
            phoneNumber: updatePharmacistDto.phoneNumber,
          },
        });
      }

      // Update pharmacist record
      return this.prisma.pharmacist.update({
        where: { id },
        data: {
          licenseNumber: updatePharmacistDto.licenseNumber,
          specialization: updatePharmacistDto.specialization,
          qualifications: updatePharmacistDto.qualifications,
          departmentId: updatePharmacistDto.departmentId,
        },
        include: {
          user: true,
          department: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Pharmacist with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const pharmacist = await this.prisma.pharmacist.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!pharmacist) {
        throw new NotFoundException(`Pharmacist with ID ${id} not found`);
      }

      // Delete pharmacist record
      await this.prisma.pharmacist.delete({
        where: { id },
      });

      // Delete associated user account
      await this.prisma.user.delete({
        where: { id: pharmacist.userId },
      });

      return { message: 'Pharmacist deleted successfully' };
    } catch (error) {
      throw new NotFoundException(`Pharmacist with ID ${id} not found`);
    }
  }

  async getPharmacistStats() {
    const totalPharmacists = await this.prisma.pharmacist.count();
    const specializationStats = await this.prisma.pharmacist.groupBy({
      by: ['specialization'],
      _count: true,
    });

    return {
      totalPharmacists,
      specializationStats,
    };
  }

  async getPharmacistDispensingHistory(
    pharmacistId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const pharmacist = await this.prisma.pharmacist.findUnique({
      where: { id: pharmacistId },
    });

    if (!pharmacist) {
      throw new NotFoundException(`Pharmacist with ID ${pharmacistId} not found`);
    }

    // Get pharmacist's dispensing records within date range
    const dispensingRecords = await this.prisma.dispensedDrug.findMany({
      where: {
        dispensedById: pharmacist.userId,
        dispenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        drug: true,
        prescription: {
          include: {
            medicalRecord: {
              include: {
                patient: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return dispensingRecords;
  }
} 