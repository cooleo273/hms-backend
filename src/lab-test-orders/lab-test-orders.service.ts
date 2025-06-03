import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabTestOrderDto } from './dto/create-lab-test-order.dto';
import { UpdateLabTestOrderDto } from './dto/update-lab-test-order.dto';
import { TestOrderStatus } from '@prisma/client';

@Injectable()
export class LabTestOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createLabTestOrderDto: CreateLabTestOrderDto) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createLabTestOrderDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${createLabTestOrderDto.patientId} not found`,
      );
    }

    // Verify test catalog exists
    const testCatalog = await this.prisma.labTestCatalog.findUnique({
      where: { id: createLabTestOrderDto.testCatalogId },
    });

    if (!testCatalog) {
      throw new NotFoundException(
        `Lab test with ID ${createLabTestOrderDto.testCatalogId} not found`,
      );
    }

    // Create lab test order
    return this.prisma.labTestOrder.create({
      data: {
        patientId: createLabTestOrderDto.patientId,
        medicalRecordId: createLabTestOrderDto.medicalRecordId,
        orderedById: createLabTestOrderDto.orderedById,
        testCatalogId: createLabTestOrderDto.testCatalogId,
        notes: createLabTestOrderDto.notes,
        status: TestOrderStatus.PENDING,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        medicalRecord: true,
        orderedBy: true,
        processedBy: true,
        testCatalog: true,
      },
    });
  }

  async findAll(
    patientId?: string,
    medicalRecordId?: string,
    orderedById?: string,
    processedById?: string,
    testCatalogId?: string,
    status?: TestOrderStatus,
    startDate?: Date,
    endDate?: Date,
    sortBy?: 'orderDate' | 'resultDate',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where: any = {
      patientId: patientId || undefined,
      medicalRecordId: medicalRecordId || undefined,
      orderedById: orderedById || undefined,
      processedById: processedById || undefined,
      testCatalogId: testCatalogId || undefined,
      status: status || undefined,
    };

    if (startDate && endDate) {
      where.orderDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orderBy: any = sortBy
      ? { [sortBy]: sortOrder || 'desc' }
      : { orderDate: 'desc' };

    return this.prisma.labTestOrder.findMany({
      where,
      orderBy,
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        medicalRecord: true,
        orderedBy: true,
        processedBy: true,
        testCatalog: true,
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.labTestOrder.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        medicalRecord: true,
        orderedBy: true,
        processedBy: true,
        testCatalog: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Lab test order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateLabTestOrderDto: UpdateLabTestOrderDto) {
    try {
      const order = await this.prisma.labTestOrder.findUnique({
        where: { id },
      });

      if (!order) {
        throw new NotFoundException(`Lab test order with ID ${id} not found`);
      }

      // If patient ID is being updated, verify new patient exists
      if (updateLabTestOrderDto.patientId) {
        const patient = await this.prisma.patient.findUnique({
          where: { id: updateLabTestOrderDto.patientId },
        });

        if (!patient) {
          throw new NotFoundException(
            `Patient with ID ${updateLabTestOrderDto.patientId} not found`,
          );
        }
      }

      // If test catalog ID is being updated, verify new test exists
      if (updateLabTestOrderDto.testCatalogId) {
        const testCatalog = await this.prisma.labTestCatalog.findUnique({
          where: { id: updateLabTestOrderDto.testCatalogId },
        });

        if (!testCatalog) {
          throw new NotFoundException(
            `Lab test with ID ${updateLabTestOrderDto.testCatalogId} not found`,
          );
        }
      }

      // Update lab test order
      return this.prisma.labTestOrder.update({
        where: { id },
        data: {
          patientId: updateLabTestOrderDto.patientId,
          medicalRecordId: updateLabTestOrderDto.medicalRecordId,
          orderedById: updateLabTestOrderDto.orderedById,
          processedById: updateLabTestOrderDto.processedById,
          testCatalogId: updateLabTestOrderDto.testCatalogId,
          sampleId: updateLabTestOrderDto.sampleId,
          sampleCollectedAt: updateLabTestOrderDto.sampleCollectedAt,
          result: updateLabTestOrderDto.result,
          resultDate: updateLabTestOrderDto.resultDate,
          notes: updateLabTestOrderDto.notes,
          status: updateLabTestOrderDto.status,
        },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          medicalRecord: true,
          orderedBy: true,
          processedBy: true,
          testCatalog: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Lab test order with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const order = await this.prisma.labTestOrder.findUnique({
        where: { id },
      });

      if (!order) {
        throw new NotFoundException(`Lab test order with ID ${id} not found`);
      }

      // Soft delete by updating status
      await this.prisma.labTestOrder.update({
        where: { id },
        data: { status: TestOrderStatus.CANCELLED },
      });

      return { message: 'Lab test order cancelled successfully' };
    } catch (error) {
      throw new NotFoundException(`Lab test order with ID ${id} not found`);
    }
  }

  async getPatientTestOrders(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const orders = await this.prisma.labTestOrder.findMany({
      where: {
        patientId,
        status: TestOrderStatus.PENDING,
      },
      orderBy: {
        orderDate: 'desc',
      },
      include: {
        medicalRecord: true,
        orderedBy: true,
        processedBy: true,
        testCatalog: true,
      },
    });

    return {
      patient,
      orders,
    };
  }

  async getOrdererTestOrders(orderedById: string) {
    const orderer = await this.prisma.user.findUnique({
      where: { id: orderedById },
    });

    if (!orderer) {
      throw new NotFoundException(`Orderer with ID ${orderedById} not found`);
    }

    const orders = await this.prisma.labTestOrder.findMany({
      where: {
        orderedById,
        status: TestOrderStatus.PENDING,
      },
      orderBy: {
        orderDate: 'desc',
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        medicalRecord: true,
        processedBy: true,
        testCatalog: true,
      },
    });

    return {
      orderer,
      orders,
    };
  }

  async getTestOrderStats() {
    const totalOrders = await this.prisma.labTestOrder.count();
    const statusStats = await this.prisma.labTestOrder.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      totalOrders,
      statusStats,
    };
  }
} 