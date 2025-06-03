import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePharmacistDto } from './dto/create-pharmacist.dto';
import { UpdatePharmacistDto } from './dto/update-pharmacist.dto';

@Injectable()
export class PharmacistsService {
  constructor(private prisma: PrismaService) {}

  async create(createPharmacistDto: CreatePharmacistDto) {
    // Create user account for pharmacist
    const user = await this.prisma.user.create({
      data: {
        email: createPharmacistDto.email,
        role: 'PHARMACIST',
        profile: {
          create: {
            firstName: createPharmacistDto.firstName,
            lastName: createPharmacistDto.lastName,
            phoneNumber: createPharmacistDto.phoneNumber,
          },
        },
      },
    });

    // Create pharmacist record
    return this.prisma.pharmacist.create({
      data: {
        ...createPharmacistDto,
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
    specialization?: string,
    sortBy?: 'firstName' | 'lastName' | 'specialization',
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
      specialization: specialization || undefined,
    };

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || 'asc' }
      : { firstName: 'asc' };

    return this.prisma.pharmacist.findMany({
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
    const pharmacist = await this.prisma.pharmacist.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
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
        await this.prisma.userProfile.update({
          where: { userId: pharmacist.userId },
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
        data: updatePharmacistDto,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
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
    const dispensingRecords = await this.prisma.dispensingRecord.findMany({
      where: {
        pharmacistId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        prescription: {
          include: {
            patient: true,
            doctor: true,
          },
        },
        drug: true,
      },
    });

    return {
      pharmacist,
      dispensingRecords,
    };
  }
} 