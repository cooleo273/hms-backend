import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { Bed } from '@prisma/client';
import { UpdateBedDto } from './dto/update-bed.dto';

@Injectable()
export class BedsService {
  constructor(private prisma: PrismaService) {}

  async create(createBedDto: CreateBedDto): Promise<Bed> {
    return this.prisma.bed.create({
      data: createBedDto,
      include: {
        department: true,
      },
    });
  }

  async findAll(query?: {
    departmentId?: string;
    isOccupied?: boolean;
    bedType?: string;
  }): Promise<Bed[]> {
    const where: any = {};

    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query?.isOccupied !== undefined) {
      where.isOccupied = query.isOccupied;
    }

    if (query?.bedType) {
      where.bedType = query.bedType;
    }

    return this.prisma.bed.findMany({
      where,
      include: {
        department: true,
      },
    });
  }

  async findOne(id: string): Promise<Bed> {
    const bed = await this.prisma.bed.findUnique({
      where: { id },
      include: {
        department: true,
        admissions: {
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bed) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }

    return bed;
  }

  async update(id: string, updateBedDto: UpdateBedDto): Promise<Bed> {
    try {
      return await this.prisma.bed.update({
        where: { id },
        data: updateBedDto,
        include: {
          department: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Bed> {
    try {
      return await this.prisma.bed.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }
  }

  async getDepartmentBeds(departmentId: string): Promise<Bed[]> {
    return this.prisma.bed.findMany({
      where: { departmentId },
      include: {
        department: true,
      },
    });
  }

  async updateBedStatus(id: string, isOccupied: boolean): Promise<Bed> {
    try {
      return await this.prisma.bed.update({
        where: { id },
        data: { isOccupied },
        include: {
          department: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }
  }

  async getBedStats() {
    const totalBeds = await this.prisma.bed.count();
    const occupiedBeds = await this.prisma.bed.count({
      where: { isOccupied: true },
    });
    const bedsByDepartment = await this.prisma.bed.groupBy({
      by: ['departmentId'],
      _count: true,
    });
    const bedsByType = await this.prisma.bed.groupBy({
      by: ['bedType'],
      _count: true,
    });

    return {
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      bedsByDepartment,
      bedsByType,
    };
  }

  async getAvailableBeds(departmentId?: string, bedType?: string): Promise<Bed[]> {
    const where: any = {
      isOccupied: false,
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (bedType) {
      where.bedType = bedType;
    }

    return this.prisma.bed.findMany({
      where,
      include: {
        department: true,
      },
    });
  }
} 