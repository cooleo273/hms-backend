import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { DispenseStatus } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPrescriptionDto: CreatePrescriptionDto) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createPrescriptionDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${createPrescriptionDto.patientId} not found`,
      );
    }

    // Verify medical record exists
    const medicalRecord = await this.prisma.medicalRecord.findUnique({
      where: { id: createPrescriptionDto.medicalRecordId },
    });

    if (!medicalRecord) {
      throw new NotFoundException(
        `Medical record with ID ${createPrescriptionDto.medicalRecordId} not found`,
      );
    }

    // Create prescription
    return this.prisma.prescription.create({
      data: {
        medicalRecordId: createPrescriptionDto.medicalRecordId,
        patientId: createPrescriptionDto.patientId,
        prescribedById: createPrescriptionDto.prescribedById,
        medicationName: createPrescriptionDto.medicationName,
        dosage: createPrescriptionDto.dosage,
        form: createPrescriptionDto.form,
        route: createPrescriptionDto.route,
        frequency: createPrescriptionDto.frequency,
        duration: createPrescriptionDto.duration,
        instructions: createPrescriptionDto.instructions,
        dispenseStatus: DispenseStatus.PENDING,
      },
      include: {
        medicalRecord: {
          include: {
            patient: true,
          },
        },
        prescribedBy: true,
        dispensedDrugs: true,
      },
    });
  }

  async findAll(
    patientId?: string,
    medicalRecordId?: string,
    prescribedById?: string,
    startDate?: Date,
    endDate?: Date,
    dispenseStatus?: DispenseStatus,
    sortBy?: 'createdAt' | 'updatedAt',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where = {
      patientId: patientId || undefined,
      medicalRecordId: medicalRecordId || undefined,
      prescribedById: prescribedById || undefined,
      createdAt: startDate && endDate
        ? {
            gte: startDate,
            lte: endDate,
          }
        : undefined,
      dispenseStatus: dispenseStatus || undefined,
    };

    const orderBy: any = sortBy
      ? { [sortBy]: sortOrder || 'desc' }
      : { createdAt: 'desc' };

    return this.prisma.prescription.findMany({
      where,
      orderBy,
      include: {
        medicalRecord: {
          include: {
            patient: true,
          },
        },
        prescribedBy: true,
        dispensedDrugs: true,
      },
    });
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        medicalRecord: {
          include: {
            patient: true,
          },
        },
        prescribedBy: true,
        dispensedDrugs: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }

    return prescription;
  }

  async update(id: string, updatePrescriptionDto: UpdatePrescriptionDto) {
    try {
      const prescription = await this.prisma.prescription.findUnique({
        where: { id },
      });

      if (!prescription) {
        throw new NotFoundException(`Prescription with ID ${id} not found`);
      }

      // If patient ID is being updated, verify new patient exists
      if (updatePrescriptionDto.patientId) {
        const patient = await this.prisma.patient.findUnique({
          where: { id: updatePrescriptionDto.patientId },
        });

        if (!patient) {
          throw new NotFoundException(
            `Patient with ID ${updatePrescriptionDto.patientId} not found`,
          );
        }
      }

      // If medical record ID is being updated, verify new medical record exists
      if (updatePrescriptionDto.medicalRecordId) {
        const medicalRecord = await this.prisma.medicalRecord.findUnique({
          where: { id: updatePrescriptionDto.medicalRecordId },
        });

        if (!medicalRecord) {
          throw new NotFoundException(
            `Medical record with ID ${updatePrescriptionDto.medicalRecordId} not found`,
          );
        }
      }

      // Update prescription
      return this.prisma.prescription.update({
        where: { id },
        data: {
          medicalRecordId: updatePrescriptionDto.medicalRecordId,
          patientId: updatePrescriptionDto.patientId,
          prescribedById: updatePrescriptionDto.prescribedById,
          medicationName: updatePrescriptionDto.medicationName,
          dosage: updatePrescriptionDto.dosage,
          form: updatePrescriptionDto.form,
          route: updatePrescriptionDto.route,
          frequency: updatePrescriptionDto.frequency,
          duration: updatePrescriptionDto.duration,
          instructions: updatePrescriptionDto.instructions,
          dispenseStatus: updatePrescriptionDto.dispenseStatus,
        },
        include: {
          medicalRecord: {
            include: {
              patient: true,
            },
          },
          prescribedBy: true,
          dispensedDrugs: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const prescription = await this.prisma.prescription.findUnique({
        where: { id },
      });

      if (!prescription) {
        throw new NotFoundException(`Prescription with ID ${id} not found`);
      }

      // Soft delete by updating dispense status
      await this.prisma.prescription.update({
        where: { id },
        data: { dispenseStatus: DispenseStatus.CANCELLED },
      });

      return { message: 'Prescription cancelled successfully' };
    } catch (error) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }
  }

  async getPatientPrescriptions(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId,
        dispenseStatus: DispenseStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        medicalRecord: {
          include: {
            patient: true,
          },
        },
        prescribedBy: true,
        dispensedDrugs: true,
      },
    });

    return {
      patient,
      prescriptions,
    };
  }

  async getPrescriberPrescriptions(prescribedById: string) {
    const prescriber = await this.prisma.user.findUnique({
      where: { id: prescribedById },
    });

    if (!prescriber) {
      throw new NotFoundException(`Prescriber with ID ${prescribedById} not found`);
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        prescribedById,
        dispenseStatus: DispenseStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        medicalRecord: {
          include: {
            patient: true,
          },
        },
        prescribedBy: true,
        dispensedDrugs: true,
      },
    });

    return {
      prescriber,
      prescriptions,
    };
  }

  async getPrescriptionStats() {
    const totalPrescriptions = await this.prisma.prescription.count();
    const statusStats = await this.prisma.prescription.groupBy({
      by: ['dispenseStatus'],
      _count: true,
    });

    return {
      totalPrescriptions,
      statusStats,
    };
  }
} 