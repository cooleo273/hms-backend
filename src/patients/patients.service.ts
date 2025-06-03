import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPatientDto: CreatePatientDto): Promise<Patient> {
    return this.prisma.patient.create({
      data: {
        ...createPatientDto,
        userId,
      },
    });
  }

  async findAll(): Promise<Patient[]> {
    return this.prisma.patient.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        appointments: {
          include: {
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                specialization: true,
              },
            },
          },
        },
        invoices: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async findByUserId(userId: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with user ID ${userId} not found`);
    }

    return patient;
  }

  async update(id: string, updatePatientDto: Partial<CreatePatientDto>): Promise<Patient> {
    try {
      return await this.prisma.patient.update({
        where: { id },
        data: updatePatientDto,
      });
    } catch (error) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Patient> {
    try {
      return await this.prisma.patient.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
  }

  async getPatientAppointments(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                specialization: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient.appointments;
  }

  async getPatientInvoices(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        invoices: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient.invoices;
  }
} 