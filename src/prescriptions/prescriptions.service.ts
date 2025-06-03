import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

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

    // Verify doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: createPrescriptionDto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${createPrescriptionDto.doctorId} not found`,
      );
    }

    // Verify all drugs exist
    for (const drugId of createPrescriptionDto.drugIds) {
      const drug = await this.prisma.drug.findUnique({
        where: { id: drugId },
      });

      if (!drug) {
        throw new NotFoundException(`Drug with ID ${drugId} not found`);
      }
    }

    // Create prescription
    return this.prisma.prescription.create({
      data: {
        ...createPrescriptionDto,
        drugs: {
          connect: createPrescriptionDto.drugIds.map((id) => ({ id })),
        },
      },
      include: {
        patient: true,
        doctor: true,
        drugs: true,
      },
    });
  }

  async findAll(
    patientId?: string,
    doctorId?: string,
    startDate?: Date,
    endDate?: Date,
    status?: 'ACTIVE' | 'FILLED' | 'CANCELLED',
    sortBy?: 'prescriptionDate' | 'createdAt',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where = {
      patientId: patientId || undefined,
      doctorId: doctorId || undefined,
      prescriptionDate: startDate && endDate
        ? {
            gte: startDate,
            lte: endDate,
          }
        : undefined,
      status: status || undefined,
    };

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || 'desc' }
      : { prescriptionDate: 'desc' };

    return this.prisma.prescription.findMany({
      where,
      orderBy,
      include: {
        patient: true,
        doctor: true,
        drugs: true,
      },
    });
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        drugs: true,
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

      // If doctor ID is being updated, verify new doctor exists
      if (updatePrescriptionDto.doctorId) {
        const doctor = await this.prisma.doctor.findUnique({
          where: { id: updatePrescriptionDto.doctorId },
        });

        if (!doctor) {
          throw new NotFoundException(
            `Doctor with ID ${updatePrescriptionDto.doctorId} not found`,
          );
        }
      }

      // If drug IDs are being updated, verify all drugs exist
      if (updatePrescriptionDto.drugIds) {
        for (const drugId of updatePrescriptionDto.drugIds) {
          const drug = await this.prisma.drug.findUnique({
            where: { id: drugId },
          });

          if (!drug) {
            throw new NotFoundException(`Drug with ID ${drugId} not found`);
          }
        }
      }

      // Update prescription
      return this.prisma.prescription.update({
        where: { id },
        data: {
          ...updatePrescriptionDto,
          drugs: updatePrescriptionDto.drugIds
            ? {
                set: updatePrescriptionDto.drugIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          patient: true,
          doctor: true,
          drugs: true,
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

      // Soft delete by updating status
      await this.prisma.prescription.update({
        where: { id },
        data: { status: 'CANCELLED' },
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
        status: 'ACTIVE',
      },
      orderBy: {
        prescriptionDate: 'desc',
      },
      include: {
        doctor: true,
        drugs: true,
      },
    });

    return {
      patient,
      prescriptions,
    };
  }

  async getDoctorPrescriptions(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        doctorId,
        status: 'ACTIVE',
      },
      orderBy: {
        prescriptionDate: 'desc',
      },
      include: {
        patient: true,
        drugs: true,
      },
    });

    return {
      doctor,
      prescriptions,
    };
  }

  async getPrescriptionStats() {
    const totalPrescriptions = await this.prisma.prescription.count();
    const activePrescriptions = await this.prisma.prescription.count({
      where: { status: 'ACTIVE' },
    });
    const filledPrescriptions = await this.prisma.prescription.count({
      where: { status: 'FILLED' },
    });

    const prescriptionsByMonth = await this.prisma.prescription.groupBy({
      by: ['prescriptionDate'],
      _count: true,
      orderBy: {
        prescriptionDate: 'asc',
      },
    });

    return {
      totalPrescriptions,
      activePrescriptions,
      filledPrescriptions,
      prescriptionsByMonth,
    };
  }
} 