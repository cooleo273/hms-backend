import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    // Check if user already has a doctor profile
    const existingDoctor = await this.prisma.doctor.findUnique({
      where: { userId },
    });

    if (existingDoctor) {
      throw new BadRequestException('User already has a doctor profile');
    }

    return this.prisma.doctor.create({
      data: {
        ...createDoctorDto,
        userId,
      },
      include: {
        department: true,
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(query?: {
    departmentId?: string;
    specialization?: string;
    search?: string;
  }): Promise<Doctor[]> {
    const where: any = {};

    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query?.specialization) {
      where.specialization = query.specialization;
    }

    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { specialization: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.doctor.findMany({
      where,
      include: {
        department: true,
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        department: true,
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        appointments: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async findByUserId(userId: string): Promise<Doctor> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      include: {
        department: true,
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with user ID ${userId} not found`);
    }

    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    try {
      return await this.prisma.doctor.update({
        where: { id },
        data: updateDoctorDto,
        include: {
          department: true,
          user: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Doctor> {
    try {
      return await this.prisma.doctor.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
  }

  async getDoctorAppointments(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: {
            dateTime: 'desc',
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor.appointments;
  }

  async getDoctorSchedule(id: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        appointments: {
          where: {
            dateTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: {
            dateTime: 'asc',
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor.appointments;
  }

  async getAvailableTimeSlots(id: string, date: Date) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        appointments: {
          where: {
            dateTime: {
              gte: new Date(date.setHours(0, 0, 0, 0)),
              lt: new Date(date.setHours(23, 59, 59, 999)),
            },
            status: {
              not: 'CANCELLED',
            },
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    // Generate all possible time slots for the day (30-minute intervals)
    const timeSlots: Date[] = [];
    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0); // Start at 9 AM
    const endTime = new Date(date);
    endTime.setHours(17, 0, 0, 0); // End at 5 PM

    while (startTime < endTime) {
      const slotTime = new Date(startTime);
      const isBooked = doctor.appointments.some(
        (appointment) =>
          new Date(appointment.dateTime).getTime() === slotTime.getTime(),
      );

      if (!isBooked) {
        timeSlots.push(new Date(slotTime));
      }

      startTime.setMinutes(startTime.getMinutes() + 30);
    }

    return timeSlots;
  }

  async getDoctorStats(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        appointments: {
          where: {
            dateTime: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
            },
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    const totalAppointments = doctor.appointments.length;
    const completedAppointments = doctor.appointments.filter(
      (appointment) => appointment.status === 'COMPLETED',
    ).length;
    const cancelledAppointments = doctor.appointments.filter(
      (appointment) => appointment.status === 'CANCELLED',
    ).length;

    return {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
    };
  }
} 