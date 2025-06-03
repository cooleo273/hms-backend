import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { items, ...invoiceData } = createInvoiceDto;

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // Apply discount if any
    const discountAmount = invoiceData.discount
      ? (totalAmount * invoiceData.discount) / 100
      : 0;
    const finalAmount = totalAmount - discountAmount;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Set due date to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return this.prisma.invoice.create({
      data: {
        ...invoiceData,
        totalAmount,
        discountAmount,
        finalAmount,
        status: invoiceData.status || InvoiceStatus.DRAFT,
        invoiceNumber,
        dueDate,
        invoiceItems: {
          create: items.map(item => ({
            itemId: item.itemId,
            itemType: item.itemType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            description: item.description || '',
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        invoiceItems: true,
        patient: true,
        appointment: true,
      },
    });
  }

  async findAll(
    patientId?: string,
    status?: InvoiceStatus,
    startDate?: Date,
    endDate?: Date,
    sortBy?: 'createdAt' | 'finalAmount' | 'status',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where = {
      ...(patientId && { patientId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'desc' } : undefined;

    return this.prisma.invoice.findMany({
      where,
      orderBy,
      include: {
        invoiceItems: true,
        patient: true,
        appointment: true,
      },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceItems: true,
        patient: true,
        appointment: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const { items, ...invoiceData } = updateInvoiceDto;

    try {
      if (items) {
        // Delete existing items
        await this.prisma.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        // Calculate new totals
        const totalAmount = items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        );
        const discountAmount = invoiceData.discount
          ? (totalAmount * invoiceData.discount) / 100
          : 0;
        const finalAmount = totalAmount - discountAmount;

        // Update invoice with new items
        return this.prisma.invoice.update({
          where: { id },
          data: {
            ...invoiceData,
            totalAmount,
            discountAmount,
            finalAmount,
            invoiceItems: {
              create: items.map(item => ({
                itemId: item.itemId,
                itemType: item.itemType,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                description: item.description || '',
                totalPrice: item.quantity * item.unitPrice,
              })),
            },
          },
          include: {
            invoiceItems: true,
            patient: true,
            appointment: true,
          },
        });
      }

      // Update invoice without changing items
      return this.prisma.invoice.update({
        where: { id },
        data: invoiceData,
        include: {
          invoiceItems: true,
          patient: true,
          appointment: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      // Delete invoice items first
      await this.prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      return this.prisma.invoice.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    try {
      return this.prisma.invoice.update({
        where: { id },
        data: { status },
        include: {
          invoiceItems: true,
          patient: true,
          appointment: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
  }

  async getInvoiceStats() {
    const totalInvoices = await this.prisma.invoice.count();
    const statusCounts = await this.prisma.invoice.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        finalAmount: true,
      },
    });

    const recentInvoices = await this.prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        appointment: true,
      },
    });

    return {
      totalInvoices,
      totalAmount: statusCounts.reduce(
        (sum, status) => sum + (status._sum.finalAmount || 0),
        0,
      ),
      statusBreakdown: statusCounts.map(status => ({
        status: status.status,
        count: status._count,
        amount: status._sum.finalAmount,
      })),
      recentInvoices,
    };
  }

  async getPatientInvoices(patientId: string) {
    return this.prisma.invoice.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        invoiceItems: true,
        appointment: true,
      },
    });
  }

  async getUnpaidInvoices() {
    return this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.DRAFT,
      },
      include: {
        patient: true,
        appointment: true,
        invoiceItems: true,
      },
    });
  }
} 