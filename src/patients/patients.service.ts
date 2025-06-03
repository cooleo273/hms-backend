import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient, Gender } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPatientDto: CreatePatientDto): Promise<Patient> {
    return this.prisma.patient.create({
      data: {
        userId,
        dateOfBirth: createPatientDto.dateOfBirth,
        address: createPatientDto.address,
        insuranceInfo: createPatientDto.insuranceInfo,
        allergies: createPatientDto.allergies || [],
        bloodType: createPatientDto.bloodType,
        emergencyContactName: createPatientDto.emergencyContactName,
        emergencyContactPhone: createPatientDto.emergencyContactPhone,
        gender: createPatientDto.gender,
      },
      include: {
        user: true,
      },
    });
  }

  async findAll(): Promise<Patient[]> {
    return this.prisma.patient.findMany({
      include: {
        user: true,
      },
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: true,
        appointments: {
          include: {
            doctor: {
              include: {
                user: true,
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
        user: true,
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
        data: {
          dateOfBirth: updatePatientDto.dateOfBirth,
          address: updatePatientDto.address,
          insuranceInfo: updatePatientDto.insuranceInfo,
          allergies: updatePatientDto.allergies,
          bloodType: updatePatientDto.bloodType,
          emergencyContactName: updatePatientDto.emergencyContactName,
          emergencyContactPhone: updatePatientDto.emergencyContactPhone,
          gender: updatePatientDto.gender,
        },
        include: {
          user: true,
        },
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
              include: {
                user: true,
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