import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';
import { Drug } from '@prisma/client';

@Injectable()
export class DrugsService {
  constructor(private prisma: PrismaService) {}

  async create(createDrugDto: CreateDrugDto): Promise<Drug> {
    return this.prisma.drug.create({
      data: createDrugDto,
    });
  }

  async findAll(query?: {
    search?: string;
    category?: string;
    inStock?: boolean;
  }): Promise<Drug[]> {
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { genericName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.inStock !== undefined) {
      where.stockQuantity = query.inStock ? { gt: 0 } : { equals: 0 };
    }

    return this.prisma.drug.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string): Promise<Drug> {
    const drug = await this.prisma.drug.findUnique({
      where: { id },
      include: {
        drugBatches: {
          orderBy: {
            expiryDate: 'asc',
          },
        },
      },
    });

    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }

    return drug;
  }

  async update(id: string, updateDrugDto: UpdateDrugDto): Promise<Drug> {
    try {
      return await this.prisma.drug.update({
        where: { id },
        data: updateDrugDto,
      });
    } catch (error) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Drug> {
    try {
      return await this.prisma.drug.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }
  }

  async getDrugBatches(id: string, expiringSoon?: boolean): Promise<any> {
    const drug = await this.prisma.drug.findUnique({
      where: { id },
      include: {
        drugBatches: {
          where: expiringSoon
            ? {
                expiryDate: {
                  lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                },
              }
            : undefined,
          orderBy: {
            expiryDate: 'asc',
          },
        },
      },
    });

    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }

    return drug.drugBatches;
  }

  async getInventoryStats() {
    const drugs = await this.prisma.drug.findMany({
      include: {
        drugBatches: true,
      },
    });

    const totalDrugs = drugs.length;
    const totalQuantity = drugs.reduce((acc, drug) => acc + drug.stockQuantity, 0);
    const lowStockDrugs = drugs.filter((drug) => drug.stockQuantity <= drug.reorderLevel).length;
    const outOfStockDrugs = drugs.filter((drug) => drug.stockQuantity === 0).length;

    const expiringBatches = drugs.flatMap((drug) =>
      drug.drugBatches.filter(
        (batch) =>
          batch.expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      ),
    );

    return {
      totalDrugs,
      totalQuantity,
      lowStockDrugs,
      outOfStockDrugs,
      expiringBatches: expiringBatches.length,
    };
  }

  async getDrugCategories(): Promise<string[]> {
    const drugs = await this.prisma.drug.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return drugs.map((drug) => drug.category).filter((category): category is string => category !== null);
  }

  async getLowStockDrugs(): Promise<Drug[]> {
    return this.prisma.drug.findMany({
      where: {
        stockQuantity: {
          lte: this.prisma.drug.fields.reorderLevel,
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });
  }

  async getExpiringSoonDrugs(): Promise<any[]> {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.drug.findMany({
      where: {
        drugBatches: {
          some: {
            expiryDate: {
              lte: thirtyDaysFromNow,
            },
          },
        },
      },
      include: {
        drugBatches: {
          where: {
            expiryDate: {
              lte: thirtyDaysFromNow,
            },
          },
          orderBy: {
            expiryDate: 'asc',
          },
        },
      },
    });
  }
} 