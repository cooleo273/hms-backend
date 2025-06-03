import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(createStaffDto: CreateStaffDto): Promise<Staff> {
    return this.prisma.staff.create({
      data: createStaffDto,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        department: true,
      },
    });
  }

  async findAll(query?: {
    departmentId?: string;
    jobTitle?: string;
    isActive?: boolean;
  }): Promise<Staff[]> {
    const where: any = {};

    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query?.jobTitle) {
      where.jobTitle = query.jobTitle;
    }

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.staff.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        department: true,
      },
    });
  }

  async findOne(id: string): Promise<Staff> {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        department: true,
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto): Promise<Staff> {
    try {
      return await this.prisma.staff.update({
        where: { id },
        data: updateStaffDto,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          department: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Staff> {
    try {
      return await this.prisma.staff.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
  }

  async getStaffSchedule(id: string, startDate: Date, endDate: Date) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    // Here you would typically integrate with a scheduling system
    // For now, we'll return a mock schedule
    return {
      staffId: id,
      staffName: `${staff.user.firstName} ${staff.user.lastName}`,
      shift: staff.shift,
      schedule: {
        startDate,
        endDate,
        // Add more schedule details as needed
      },
    };
  }

  async updateStaffStatus(id: string, isActive: boolean): Promise<Staff> {
    try {
      return await this.prisma.staff.update({
        where: { id },
        data: { isActive },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          department: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }
  }

  async getDepartmentStaff(departmentId: string): Promise<Staff[]> {
    return this.prisma.staff.findMany({
      where: { departmentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        department: true,
      },
    });
  }

  async getStaffStats() {
    const totalStaff = await this.prisma.staff.count();
    const activeStaff = await this.prisma.staff.count({
      where: { isActive: true },
    });
    const staffByDepartment = await this.prisma.staff.groupBy({
      by: ['departmentId'],
      _count: true,
    });
    const staffByJobTitle = await this.prisma.staff.groupBy({
      by: ['jobTitle'],
      _count: true,
    });

    return {
      totalStaff,
      activeStaff,
      inactiveStaff: totalStaff - activeStaff,
      staffByDepartment,
      staffByJobTitle,
    };
  }
} 