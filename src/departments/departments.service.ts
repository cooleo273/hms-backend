import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department } from '@prisma/client';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    return this.prisma.department.create({
      data: createDepartmentDto,
    });
  }

  async findAll(): Promise<Department[]> {
    return this.prisma.department.findMany();
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        doctors: {
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
        staff: {
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
        beds: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    try {
      return await this.prisma.department.update({
        where: { id },
        data: updateDepartmentDto,
      });
    } catch (error) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Department> {
    try {
      return await this.prisma.department.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
  }

  async getDepartmentDoctors(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        doctors: {
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
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department.doctors;
  }

  async getDepartmentStaff(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        staff: {
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
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department.staff;
  }

  async getDepartmentBeds(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        beds: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department.beds;
  }

  async getDepartmentStats(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        doctors: true,
        staff: true,
        beds: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return {
      totalDoctors: department.doctors.length,
      totalStaff: department.staff.length,
      totalBeds: department.beds.length,
      occupiedBeds: department.beds.filter(bed => bed.isOccupied).length,
      availableBeds: department.beds.filter(bed => !bed.isOccupied).length,
    };
  }
} 