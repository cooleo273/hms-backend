import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(createMedicalRecordDto: CreateMedicalRecordDto) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createMedicalRecordDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${createMedicalRecordDto.patientId} not found`,
      );
    }

    // Verify doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: createMedicalRecordDto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${createMedicalRecordDto.doctorId} not found`,
      );
    }

    // Create medical record
    return this.prisma.medicalRecord.create({
      data: {
        ...createMedicalRecordDto,
        diagnosis: createMedicalRecordDto.diagnosis || [],
        allergiesAtVisit: createMedicalRecordDto.allergiesAtVisit || [],
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
        recordedBy: true,
      },
    });
  }

  async findAll(
    patientId?: string,
    doctorId?: string,
    startDate?: Date,
    endDate?: Date,
    sortBy?: 'visitDate' | 'createdAt',
    sortOrder?: Prisma.SortOrder,
  ) {
    const where = {
      ...(patientId && { patientId }),
      ...(doctorId && { doctorId }),
      ...(startDate && endDate && {
        visitDate: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const orderBy: Prisma.MedicalRecordOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder || Prisma.SortOrder.desc }
      : { visitDate: Prisma.SortOrder.desc };

    return this.prisma.medicalRecord.findMany({
      where,
      orderBy,
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
        recordedBy: true,
      },
    });
  }

  async findOne(id: string) {
    const medicalRecord = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
        recordedBy: true,
      },
    });

    if (!medicalRecord) {
      throw new NotFoundException(`Medical Record with ID ${id} not found`);
    }

    return medicalRecord;
  }

  async update(id: string, updateMedicalRecordDto: UpdateMedicalRecordDto) {
    try {
      const medicalRecord = await this.prisma.medicalRecord.findUnique({
        where: { id },
      });

      if (!medicalRecord) {
        throw new NotFoundException(`Medical Record with ID ${id} not found`);
      }

      // If patient ID is being updated, verify new patient exists
      if (updateMedicalRecordDto.patientId) {
        const patient = await this.prisma.patient.findUnique({
          where: { id: updateMedicalRecordDto.patientId },
        });

        if (!patient) {
          throw new NotFoundException(
            `Patient with ID ${updateMedicalRecordDto.patientId} not found`,
          );
        }
      }

      // If doctor ID is being updated, verify new doctor exists
      if (updateMedicalRecordDto.doctorId) {
        const doctor = await this.prisma.doctor.findUnique({
          where: { id: updateMedicalRecordDto.doctorId },
        });

        if (!doctor) {
          throw new NotFoundException(
            `Doctor with ID ${updateMedicalRecordDto.doctorId} not found`,
          );
        }
      }

      return this.prisma.medicalRecord.update({
        where: { id },
        data: {
          ...updateMedicalRecordDto,
          diagnosis: updateMedicalRecordDto.diagnosis || undefined,
          allergiesAtVisit: updateMedicalRecordDto.allergiesAtVisit || undefined,
        },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          doctor: {
            include: {
              user: true,
            },
          },
          recordedBy: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Medical Record with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const medicalRecord = await this.prisma.medicalRecord.findUnique({
        where: { id },
      });

      if (!medicalRecord) {
        throw new NotFoundException(`Medical Record with ID ${id} not found`);
      }

      return this.prisma.medicalRecord.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Medical Record with ID ${id} not found`);
    }
  }

  async getPatientMedicalHistory(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const medicalRecords = await this.prisma.medicalRecord.findMany({
      where: {
        patientId,
      },
      orderBy: {
        visitDate: 'desc',
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        recordedBy: true,
      },
    });

    return {
      patient,
      medicalRecords,
    };
  }

  async getDoctorMedicalRecords(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    const medicalRecords = await this.prisma.medicalRecord.findMany({
      where: {
        doctorId,
      },
      orderBy: {
        visitDate: 'desc',
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        recordedBy: true,
      },
    });

    return {
      doctor,
      medicalRecords,
    };
  }

  async getMedicalRecordStats() {
    const totalRecords = await this.prisma.medicalRecord.count();

    const recordsByMonth = await this.prisma.medicalRecord.groupBy({
      by: ['visitDate'],
      _count: true,
      orderBy: {
        visitDate: 'asc',
      },
    });

    return {
      totalRecords,
      recordsByMonth,
    };
  }
} 