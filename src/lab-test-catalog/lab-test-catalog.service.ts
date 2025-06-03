import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabTestCatalogDto } from './dto/create-lab-test-catalog.dto';
import { UpdateLabTestCatalogDto } from './dto/update-lab-test-catalog.dto';

@Injectable()
export class LabTestCatalogService {
  constructor(private prisma: PrismaService) {}

  async create(createLabTestCatalogDto: CreateLabTestCatalogDto) {
    return this.prisma.labTestCatalog.create({
      data: createLabTestCatalogDto,
    });
  }

  async findAll(
    search?: string,
    category?: string,
    isActive?: boolean,
    sortBy?: 'name' | 'price' | 'category',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where: any = {
      category: category || undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const orderBy: any = sortBy
      ? { [sortBy]: sortOrder || 'asc' }
      : undefined;

    return this.prisma.labTestCatalog.findMany({
      where,
      orderBy,
    });
  }

  async findOne(id: string) {
    const test = await this.prisma.labTestCatalog.findUnique({
      where: { id },
    });

    if (!test) {
      throw new NotFoundException(`Lab test with ID ${id} not found`);
    }

    return test;
  }

  async update(id: string, updateLabTestCatalogDto: UpdateLabTestCatalogDto) {
    try {
      return await this.prisma.labTestCatalog.update({
        where: { id },
        data: updateLabTestCatalogDto,
      });
    } catch (error) {
      throw new NotFoundException(`Lab test with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.labTestCatalog.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Lab test with ID ${id} not found`);
    }
  }

  async getCategories() {
    const tests = await this.prisma.labTestCatalog.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return tests.map(test => test.category);
  }

  async getTestStats() {
    const totalTests = await this.prisma.labTestCatalog.count();
    const activeTests = await this.prisma.labTestCatalog.count({
      where: { isActive: true },
    });
    const categories = await this.prisma.labTestCatalog.groupBy({
      by: ['category'],
      _count: true,
    });

    return {
      totalTests,
      activeTests,
      inactiveTests: totalTests - activeTests,
      categories: categories.map(cat => ({
        category: cat.category,
        count: cat._count,
      })),
    };
  }
} 