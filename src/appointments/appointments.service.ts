import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const appointmentDateTime = new Date(createAppointmentDto.dateTime);
    
    // Validate appointment time is in the future
    if (appointmentDateTime < new Date()) {
      throw new BadRequestException('Cannot create appointment in the past');
    }

    // Check if the time slot is available
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: createAppointmentDto.doctorId,
        dateTime: appointmentDateTime,
        status: {
          not: AppointmentStatus.CANCELLED,
        },
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('This time slot is already booked');
    }

    // Check if doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: createAppointmentDto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createAppointmentDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.appointment.create({
      data: {
        ...createAppointmentDto,
        scheduledById: userId,
        dateTime: appointmentDateTime,
      },
      include: {
        doctor: {
          include: {
            department: true,
          },
        },
        patient: true,
        scheduledBy: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(query?: {
    doctorId?: string;
    patientId?: string;
    status?: AppointmentStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Appointment[]> {
    const where: any = {};

    if (query?.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query?.patientId) {
      where.patientId = query.patientId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      where.dateTime = {};
      if (query.startDate) {
        where.dateTime.gte = query.startDate;
      }
      if (query.endDate) {
        where.dateTime.lte = query.endDate;
      }
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          include: {
            department: true,
          },
        },
        patient: true,
        scheduledBy: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            department: true,
          },
        },
        patient: true,
        scheduledBy: {
          select: {
            email: true,
            role: true,
          },
        },
        medicalRecord: true,
        invoice: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    try {
      const data: any = { ...updateAppointmentDto };
      if (updateAppointmentDto.dateTime) {
        const newDateTime = new Date(updateAppointmentDto.dateTime);
        
        // Validate appointment time is in the future
        if (newDateTime < new Date()) {
          throw new BadRequestException('Cannot update appointment to a past time');
        }

        // Check if the new time slot is available
        const existingAppointment = await this.prisma.appointment.findFirst({
          where: {
            doctorId: updateAppointmentDto.doctorId,
            dateTime: newDateTime,
            id: { not: id },
            status: {
              not: AppointmentStatus.CANCELLED,
            },
          },
        });

        if (existingAppointment) {
          throw new BadRequestException('This time slot is already booked');
        }

        data.dateTime = newDateTime;
      }

      return await this.prisma.appointment.update({
        where: { id },
        data,
        include: {
          doctor: {
            include: {
              department: true,
            },
          },
          patient: true,
          scheduledBy: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Appointment> {
    try {
      return await this.prisma.appointment.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            department: true,
          },
        },
        scheduledBy: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  async getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: true,
        scheduledBy: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  async getUpcomingAppointments(userId: string): Promise<Appointment[]> {
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        scheduledById: userId,
        dateTime: {
          gte: now,
        },
        status: {
          not: AppointmentStatus.CANCELLED,
        },
      },
      include: {
        doctor: {
          include: {
            department: true,
          },
        },
        patient: true,
        scheduledBy: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        dateTime: 'asc',
      },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus, cancellationReason?: string): Promise<Appointment> {
    try {
      const data: any = { status };
      if (status === AppointmentStatus.CANCELLED && cancellationReason) {
        data.cancellationReason = cancellationReason;
      }

      return await this.prisma.appointment.update({
        where: { id },
        data,
        include: {
          doctor: {
            include: {
              department: true,
            },
          },
          patient: true,
          scheduledBy: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
  }

  async getAppointmentStats(doctorId: string, startDate: Date, endDate: Date) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const stats = {
      total: appointments.length,
      byStatus: {
        [AppointmentStatus.SCHEDULED]: 0,
        [AppointmentStatus.CONFIRMED]: 0,
        [AppointmentStatus.COMPLETED]: 0,
        [AppointmentStatus.CANCELLED]: 0,
        [AppointmentStatus.NO_SHOW]: 0,
        [AppointmentStatus.IN_PROGRESS]: 0,
      },
    };

    appointments.forEach((appointment) => {
      stats.byStatus[appointment.status]++;
    });

    return stats;
  }
} 