import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDrugBatchDto } from './dto/create-drug-batch.dto';
import { DrugBatch } from '@prisma/client';
import { UpdateDrugBatchDto } from './dto/update-drug-batch.dto';

@Injectable()
export class DrugBatchesService {
  constructor(private prisma: PrismaService) {}

  async create(createDrugBatchDto: CreateDrugBatchDto): Promise<DrugBatch> {
    // Check if the drug exists
    const drug = await this.prisma.drug.findUnique({
      where: { id: createDrugBatchDto.drugId },
    });

    if (!drug) {
      throw new NotFoundException(`Drug with ID ${createDrugBatchDto.drugId} not found`);
    }

    // Check if batch number already exists
    const existingBatch = await this.prisma.drugBatch.findUnique({
      where: { batchNumber: createDrugBatchDto.batchNumber },
    });

    if (existingBatch) {
      throw new BadRequestException(`Batch number ${createDrugBatchDto.batchNumber} already exists`);
    }

    // Create batch and update drug quantity in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const batch = await prisma.drugBatch.create({
        data: createDrugBatchDto,
        include: {
          drug: true,
        },
      });

      await prisma.drug.update({
        where: { id: createDrugBatchDto.drugId },
        data: {
          stockQuantity: {
            increment: createDrugBatchDto.quantity,
          },
        },
      });

      return batch;
    });
  }

  async findAll(query?: {
    drugId?: string;
    expiringSoon?: boolean;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    supplier?: string;
    sortBy?: 'expiryDate' | 'manufacturingDate' | 'quantity';
    sortOrder?: 'asc' | 'desc';
  }): Promise<DrugBatch[]> {
    const where: any = {};

    if (query?.drugId) {
      where.drugId = query.drugId;
    }

    if (query?.expiringSoon) {
      where.expiryDate = {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };
    }

    if (query?.startDate || query?.endDate) {
      where.manufacturingDate = {};
      if (query.startDate) {
        where.manufacturingDate.gte = query.startDate;
      }
      if (query.endDate) {
        where.manufacturingDate.lte = query.endDate;
      }
    }

    if (query?.search) {
      where.OR = [
        { batchNumber: { contains: query.search, mode: 'insensitive' } },
        { drug: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query?.supplier) {
      where.supplier = { contains: query.supplier, mode: 'insensitive' };
    }

    const orderBy: any = {};
    if (query?.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.expiryDate = 'asc';
    }

    return this.prisma.drugBatch.findMany({
      where,
      include: {
        drug: true,
        adjustments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy,
    });
  }

  async findOne(id: string): Promise<DrugBatch> {
    const batch = await this.prisma.drugBatch.findUnique({
      where: { id },
      include: {
        drug: true,
        adjustments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Drug batch with ID ${id} not found`);
    }

    return batch;
  }

  async update(id: string, updateDrugBatchDto: UpdateDrugBatchDto): Promise<DrugBatch> {
    try {
      return await this.prisma.drugBatch.update({
        where: { id },
        data: updateDrugBatchDto,
        include: {
          drug: true,
          adjustments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Drug batch with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<DrugBatch> {
    const batch = await this.prisma.drugBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new NotFoundException(`Drug batch with ID ${id} not found`);
    }

    // Delete batch and update drug quantity in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const deletedBatch = await prisma.drugBatch.delete({
        where: { id },
      });

      await prisma.drug.update({
        where: { id: batch.drugId },
        data: {
          stockQuantity: {
            decrement: batch.quantity,
          },
        },
      });

      return deletedBatch;
    });
  }

  async getExpirationStats() {
    const batches = await this.prisma.drugBatch.findMany({
      include: {
        drug: true,
      },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const expiredBatches = batches.filter((batch) => batch.expiryDate < now);
    const expiringSoonBatches = batches.filter(
      (batch) => batch.expiryDate >= now && batch.expiryDate <= thirtyDaysFromNow,
    );
    const expiringLaterBatches = batches.filter(
      (batch) => batch.expiryDate > thirtyDaysFromNow && batch.expiryDate <= ninetyDaysFromNow,
    );

    return {
      totalBatches: batches.length,
      expiredBatches: expiredBatches.length,
      expiringSoonBatches: expiringSoonBatches.length,
      expiringLaterBatches: expiringLaterBatches.length,
      totalQuantity: batches.reduce((acc, batch) => acc + batch.quantity, 0),
      expiredQuantity: expiredBatches.reduce((acc, batch) => acc + batch.quantity, 0),
      expiringSoonQuantity: expiringSoonBatches.reduce((acc, batch) => acc + batch.quantity, 0),
      byDrug: this.groupByDrug(batches),
    };
  }

  private groupByDrug(batches: DrugBatch[]) {
    const drugGroups = new Map();
    batches.forEach((batch) => {
      if (!drugGroups.has(batch.drugId)) {
        drugGroups.set(batch.drugId, {
          drugName: batch.drug.name,
          totalBatches: 0,
          totalQuantity: 0,
          expiringSoon: 0,
          expired: 0,
        });
      }
      const group = drugGroups.get(batch.drugId);
      group.totalBatches++;
      group.totalQuantity += batch.quantity;
      if (batch.expiryDate < new Date()) {
        group.expired++;
      } else if (batch.expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        group.expiringSoon++;
      }
    });
    return Array.from(drugGroups.values());
  }

  async getExpiringSoonBatches(): Promise<DrugBatch[]> {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.drugBatch.findMany({
      where: {
        expiryDate: {
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        drug: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }

  async getDrugBatchHistory(drugId: string): Promise<DrugBatch[]> {
    return this.prisma.drugBatch.findMany({
      where: {
        drugId,
      },
      include: {
        drug: true,
        adjustments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async adjustQuantity(
    id: string,
    newQuantity: number,
    reason: string,
  ): Promise<DrugBatch> {
    const batch = await this.prisma.drugBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new NotFoundException(`Drug batch with ID ${id} not found`);
    }

    if (newQuantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    const quantityDifference = newQuantity - batch.quantity;

    // Update batch quantity and drug total quantity in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const updatedBatch = await prisma.drugBatch.update({
        where: { id },
        data: {
          quantity: newQuantity,
        },
        include: {
          drug: true,
        },
      });

      await prisma.drug.update({
        where: { id: batch.drugId },
        data: {
          stockQuantity: {
            increment: quantityDifference,
          },
        },
      });

      // Log the quantity adjustment
      await prisma.drugBatchAdjustment.create({
        data: {
          drugBatchId: id,
          previousQuantity: batch.quantity,
          newQuantity,
          reason,
        },
      });

      return updatedBatch;
    });
  }

  async getLowStockBatches(): Promise<DrugBatch[]> {
    const batches = await this.prisma.drugBatch.findMany({
      include: {
        drug: true,
      },
    });

    return batches.filter((batch) => {
      const drug = batch.drug;
      return batch.quantity <= drug.reorderLevel;
    });
  }
} 