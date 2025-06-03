import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDispensedDrugDto } from './dto/create-dispensed-drug.dto';
import { UpdateDispensedDrugDto } from './dto/update-dispensed-drug.dto';

@Injectable()
export class DispensedDrugsService {
  constructor(private prisma: PrismaService) {}

  async create(createDispensedDrugDto: CreateDispensedDrugDto) {
    // Verify prescription exists and is valid
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: createDispensedDrugDto.prescriptionId },
      include: {
        prescriptionItems: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException(
        `Prescription with ID ${createDispensedDrugDto.prescriptionId} not found`,
      );
    }

    // Verify drug batch exists and has sufficient quantity
    const drugBatch = await this.prisma.drugBatch.findUnique({
      where: { id: createDispensedDrugDto.drugBatchId },
    });

    if (!drugBatch) {
      throw new NotFoundException(
        `Drug batch with ID ${createDispensedDrugDto.drugBatchId} not found`,
      );
    }

    if (drugBatch.remainingQuantity < createDispensedDrugDto.quantity) {
      throw new BadRequestException('Insufficient drug quantity in batch');
    }

    // Verify prescription item exists for this drug
    const prescriptionItem = prescription.prescriptionItems.find(
      item => item.drugId === drugBatch.drugId,
    );

    if (!prescriptionItem) {
      throw new BadRequestException('Drug not prescribed in this prescription');
    }

    // Create dispensed drug record
    const dispensedDrug = await this.prisma.dispensedDrug.create({
      data: {
        ...createDispensedDrugDto,
        drugId: drugBatch.drugId,
      },
      include: {
        prescription: {
          include: {
            patient: true,
            doctor: true,
          },
        },
        drugBatch: {
          include: {
            drug: true,
          },
        },
        dispensedBy: true,
      },
    });

    // Update drug batch quantity
    await this.prisma.drugBatch.update({
      where: { id: drugBatch.id },
      data: {
        remainingQuantity: drugBatch.remainingQuantity - createDispensedDrugDto.quantity,
      },
    });

    return dispensedDrug;
  }

  async findAll(
    prescriptionId?: string,
    drugId?: string,
    startDate?: Date,
    endDate?: Date,
    sortBy?: 'dispensedAt' | 'quantity',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where = {
      ...(prescriptionId && { prescriptionId }),
      ...(drugId && { drugId }),
      ...(startDate && endDate && {
        dispensedAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'desc' } : undefined;

    return this.prisma.dispensedDrug.findMany({
      where,
      orderBy,
      include: {
        prescription: {
          include: {
            patient: true,
            doctor: true,
          },
        },
        drugBatch: {
          include: {
            drug: true,
          },
        },
        dispensedBy: true,
      },
    });
  }

  async findOne(id: string) {
    const dispensedDrug = await this.prisma.dispensedDrug.findUnique({
      where: { id },
      include: {
        prescription: {
          include: {
            patient: true,
            doctor: true,
          },
        },
        drugBatch: {
          include: {
            drug: true,
          },
        },
        dispensedBy: true,
      },
    });

    if (!dispensedDrug) {
      throw new NotFoundException(`Dispensed drug with ID ${id} not found`);
    }

    return dispensedDrug;
  }

  async update(id: string, updateDispensedDrugDto: UpdateDispensedDrugDto) {
    try {
      const dispensedDrug = await this.prisma.dispensedDrug.update({
        where: { id },
        data: updateDispensedDrugDto,
        include: {
          prescription: {
            include: {
              patient: true,
              doctor: true,
            },
          },
          drugBatch: {
            include: {
              drug: true,
            },
          },
          dispensedBy: true,
        },
      });

      // If quantity is updated, adjust drug batch quantity
      if (updateDispensedDrugDto.quantity) {
        const originalDispensedDrug = await this.prisma.dispensedDrug.findUnique({
          where: { id },
        });

        const quantityDifference = updateDispensedDrugDto.quantity - originalDispensedDrug.quantity;

        await this.prisma.drugBatch.update({
          where: { id: dispensedDrug.drugBatchId },
          data: {
            remainingQuantity: {
              decrement: quantityDifference,
            },
          },
        });
      }

      return dispensedDrug;
    } catch (error) {
      throw new NotFoundException(`Dispensed drug with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const dispensedDrug = await this.prisma.dispensedDrug.findUnique({
        where: { id },
      });

      // Restore drug batch quantity
      await this.prisma.drugBatch.update({
        where: { id: dispensedDrug.drugBatchId },
        data: {
          remainingQuantity: {
            increment: dispensedDrug.quantity,
          },
        },
      });

      return this.prisma.dispensedDrug.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Dispensed drug with ID ${id} not found`);
    }
  }

  async getDispensedDrugStats() {
    const totalDispensed = await this.prisma.dispensedDrug.count();
    const drugStats = await this.prisma.dispensedDrug.groupBy({
      by: ['drugId'],
      _count: true,
      _sum: {
        quantity: true,
      },
    });

    const recentDispensed = await this.prisma.dispensedDrug.findMany({
      take: 5,
      orderBy: { dispensedAt: 'desc' },
      include: {
        prescription: {
          include: {
            patient: true,
          },
        },
        drugBatch: {
          include: {
            drug: true,
          },
        },
      },
    });

    return {
      totalDispensed,
      drugStats: await Promise.all(
        drugStats.map(async stat => {
          const drug = await this.prisma.drug.findUnique({
            where: { id: stat.drugId },
          });
          return {
            drug,
            count: stat._count,
            totalQuantity: stat._sum.quantity,
          };
        }),
      ),
      recentDispensed,
    };
  }

  async getPrescriptionDispensedDrugs(prescriptionId: string) {
    return this.prisma.dispensedDrug.findMany({
      where: { prescriptionId },
      include: {
        drugBatch: {
          include: {
            drug: true,
          },
        },
        dispensedBy: true,
      },
    });
  }

  async getPatientDispensedDrugs(patientId: string) {
    return this.prisma.dispensedDrug.findMany({
      where: {
        prescription: {
          patientId,
        },
      },
      include: {
        prescription: {
          include: {
            doctor: true,
          },
        },
        drugBatch: {
          include: {
            drug: true,
          },
        },
        dispensedBy: true,
      },
    });
  }
} 