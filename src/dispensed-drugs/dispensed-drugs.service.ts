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
        patient: true,
        prescribedBy: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException(
        `Prescription with ID ${createDispensedDrugDto.prescriptionId} not found`,
      );
    }

    // Verify drug batch exists and has sufficient quantity
    const drugBatch = await this.prisma.drugBatch.findUnique({
      where: { id: createDispensedDrugDto.batchId },
    });

    if (!drugBatch) {
      throw new NotFoundException(
        `Drug batch with ID ${createDispensedDrugDto.batchId} not found`,
      );
    }

    if (drugBatch.quantity < createDispensedDrugDto.quantityDispensed) {
      throw new BadRequestException('Insufficient drug quantity in batch');
    }

    // Create dispensed drug record
    const dispensedDrug = await this.prisma.dispensedDrug.create({
      data: {
        drugId: drugBatch.drugId,
        batchId: drugBatch.id,
        prescriptionId: prescription.id,
        patientId: prescription.patientId,
        quantityDispensed: createDispensedDrugDto.quantityDispensed,
        dispensedById: createDispensedDrugDto.dispensedById,
        notes: createDispensedDrugDto.notes,
      },
      include: {
        prescription: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
            prescribedBy: true,
          },
        },
        batch: {
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
        quantity: {
          decrement: createDispensedDrugDto.quantityDispensed,
        },
      },
    });

    return dispensedDrug;
  }

  async findAll(
    prescriptionId?: string,
    drugId?: string,
    startDate?: Date,
    endDate?: Date,
    sortBy?: 'dispenseDate' | 'quantityDispensed',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where = {
      ...(prescriptionId && { prescriptionId }),
      ...(drugId && { drugId }),
      ...(startDate && endDate && {
        dispenseDate: {
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
            patient: {
              include: {
                user: true,
              },
            },
            prescribedBy: true,
          },
        },
        batch: {
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
            patient: {
              include: {
                user: true,
              },
            },
            prescribedBy: true,
          },
        },
        batch: {
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
        data: {
          quantityDispensed: updateDispensedDrugDto.quantityDispensed,
          notes: updateDispensedDrugDto.notes,
        },
        include: {
          prescription: {
            include: {
              patient: {
                include: {
                  user: true,
                },
              },
              prescribedBy: true,
            },
          },
          batch: {
            include: {
              drug: true,
            },
          },
          dispensedBy: true,
        },
      });

      // If quantity is updated, adjust drug batch quantity
      if (updateDispensedDrugDto.quantityDispensed) {
        const originalDispensedDrug = await this.prisma.dispensedDrug.findUnique({
          where: { id },
        });

        if (!originalDispensedDrug) {
          throw new NotFoundException(`Dispensed drug with ID ${id} not found`);
        }

        const quantityDifference = updateDispensedDrugDto.quantityDispensed - originalDispensedDrug.quantityDispensed;

        if (originalDispensedDrug.batchId) {
          await this.prisma.drugBatch.update({
            where: { id: originalDispensedDrug.batchId },
            data: {
              quantity: {
                decrement: quantityDifference,
              },
            },
          });
        }
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

      if (!dispensedDrug) {
        throw new NotFoundException(`Dispensed drug with ID ${id} not found`);
      }

      // Restore drug batch quantity
      if (dispensedDrug.batchId) {
        await this.prisma.drugBatch.update({
          where: { id: dispensedDrug.batchId },
          data: {
            quantity: {
              increment: dispensedDrug.quantityDispensed,
            },
          },
        });
      }

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
        quantityDispensed: true,
      },
    });

    const recentDispensed = await this.prisma.dispensedDrug.findMany({
      take: 5,
      orderBy: { dispenseDate: 'desc' },
      include: {
        prescription: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
          },
        },
        batch: {
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
            totalDispensed: stat._sum?.quantityDispensed || 0,
            count: stat._count,
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
        batch: {
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
      where: { patientId },
      include: {
        prescription: {
          include: {
            prescribedBy: true,
          },
        },
        batch: {
          include: {
            drug: true,
          },
        },
        dispensedBy: true,
      },
    });
  }
} 