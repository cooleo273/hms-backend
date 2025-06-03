import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { Admission } from '@prisma/client';
import { UpdateAdmissionDto } from './dto/update-admission.dto';

@Injectable()
export class AdmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createAdmissionDto: CreateAdmissionDto): Promise<Admission> {
    // Check if the bed is available
    const bed = await this.prisma.bed.findUnique({
      where: { id: createAdmissionDto.bedId },
    });

    if (!bed) {
      throw new NotFoundException(`Bed with ID ${createAdmissionDto.bedId} not found`);
    }

    if (bed.isOccupied) {
      throw new BadRequestException('Bed is already occupied');
    }

    // Create admission and update bed status in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const admission = await prisma.admission.create({
        data: {
          ...createAdmissionDto,
          processedById: createAdmissionDto.processedById,
        },
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
          bed: {
            include: {
              department: true,
            },
          },
        },
      });

      await prisma.bed.update({
        where: { id: createAdmissionDto.bedId },
        data: { isOccupied: true },
      });

      return admission;
    });
  }

  async findAll(query?: {
    patientId?: string;
    bedId?: string;
    admittingDoctorId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Admission[]> {
    const where: any = {};

    if (query?.patientId) {
      where.patientId = query.patientId;
    }

    if (query?.bedId) {
      where.bedId = query.bedId;
    }

    if (query?.admittingDoctorId) {
      where.admittingDoctorId = query.admittingDoctorId;
    }

    if (query?.startDate || query?.endDate) {
      where.admissionDate = {};
      if (query.startDate) {
        where.admissionDate.gte = query.startDate;
      }
      if (query.endDate) {
        where.admissionDate.lte = query.endDate;
      }
    }

    return this.prisma.admission.findMany({
      where,
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
        bed: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        admissionDate: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Admission> {
    const admission = await this.prisma.admission.findUnique({
      where: { id },
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
        bed: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!admission) {
      throw new NotFoundException(`Admission with ID ${id} not found`);
    }

    return admission;
  }

  async update(id: string, updateAdmissionDto: UpdateAdmissionDto): Promise<Admission> {
    try {
      return await this.prisma.admission.update({
        where: { id },
        data: updateAdmissionDto,
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
          bed: {
            include: {
              department: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Admission with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Admission> {
    try {
      const admission = await this.prisma.admission.delete({
        where: { id },
      });

      // Update bed status if admission is deleted
      await this.prisma.bed.update({
        where: { id: admission.bedId },
        data: { isOccupied: false },
      });

      return admission;
    } catch (error) {
      throw new NotFoundException(`Admission with ID ${id} not found`);
    }
  }

  async getPatientAdmissions(patientId: string): Promise<Admission[]> {
    return this.prisma.admission.findMany({
      where: { patientId },
      include: {
        bed: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        admissionDate: 'desc',
      },
    });
  }

  async getBedAdmissions(bedId: string): Promise<Admission[]> {
    return this.prisma.admission.findMany({
      where: { bedId },
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
      orderBy: {
        admissionDate: 'desc',
      },
    });
  }

  async dischargePatient(
    id: string,
    dischargeDate: Date,
    dischargeReason?: string,
  ): Promise<Admission> {
    const admission = await this.prisma.admission.findUnique({
      where: { id },
    });

    if (!admission) {
      throw new NotFoundException(`Admission with ID ${id} not found`);
    }

    if (admission.dischargeDate) {
      throw new BadRequestException('Patient is already discharged');
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedAdmission = await prisma.admission.update({
        where: { id },
        data: {
          dischargeDate,
          dischargeReason,
        },
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
          bed: {
            include: {
              department: true,
            },
          },
        },
      });

      await prisma.bed.update({
        where: { id: admission.bedId },
        data: { isOccupied: false },
      });

      return updatedAdmission;
    });
  }

  async getAdmissionStats(startDate: Date, endDate: Date) {
    const admissions = await this.prisma.admission.findMany({
      where: {
        admissionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalAdmissions = admissions.length;
    const activeAdmissions = admissions.filter((a) => !a.dischargeDate).length;
    const dischargedAdmissions = admissions.filter((a) => a.dischargeDate).length;

    const averageStayDuration = dischargedAdmissions > 0
      ? admissions
          .filter((a): a is Admission & { dischargeDate: Date } => a.dischargeDate !== null)
          .reduce((acc, curr) => {
            const duration = curr.dischargeDate.getTime() - curr.admissionDate.getTime();
            return acc + duration;
          }, 0) / dischargedAdmissions
      : 0;

    return {
      totalAdmissions,
      activeAdmissions,
      dischargedAdmissions,
      averageStayDuration: Math.round(averageStayDuration / (1000 * 60 * 60 * 24)), // Convert to days
    };
  }

  async getActiveAdmissions(): Promise<Admission[]> {
    return this.prisma.admission.findMany({
      where: {
        dischargeDate: null,
      },
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
        bed: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        admissionDate: 'desc',
      },
    });
  }
} 