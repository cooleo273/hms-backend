import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    // Verify invoice exists and is not paid
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: createPaymentDto.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${createPaymentDto.invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    if (createPaymentDto.amountPaid > (invoice.finalAmount || invoice.totalAmount)) {
      throw new BadRequestException('Payment amount exceeds invoice amount');
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: createPaymentDto.invoiceId,
        amountPaid: createPaymentDto.amountPaid,
        paymentMethod: createPaymentDto.paymentMethod,
        status: createPaymentDto.status || PaymentStatus.PENDING,
        transactionId: createPaymentDto.transactionId,
        notes: createPaymentDto.notes,
        receivedById: createPaymentDto.receivedById,
      },
      include: {
        invoice: {
          include: {
            patient: true,
          },
        },
        receivedBy: true,
      },
    });

    // Update invoice status based on payment
    const totalPaid = await this.prisma.payment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amountPaid: true },
    });

    const remainingAmount = (invoice.finalAmount || invoice.totalAmount) - (totalPaid._sum.amountPaid || 0);

    if (remainingAmount <= 0) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.PAID },
      });
    } else if (totalPaid._sum.amountPaid && totalPaid._sum.amountPaid > 0) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.PARTIALLY_PAID },
      });
    }

    return payment;
  }

  async findAll(
    invoiceId?: string,
    status?: PaymentStatus,
    startDate?: Date,
    endDate?: Date,
    sortBy?: 'createdAt' | 'amountPaid' | 'status',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where = {
      ...(invoiceId && { invoiceId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'desc' } : undefined;

    return this.prisma.payment.findMany({
      where,
      orderBy,
      include: {
        invoice: {
          include: {
            patient: true,
          },
        },
        receivedBy: true,
      },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            patient: true,
          },
        },
        receivedBy: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    try {
      const payment = await this.prisma.payment.update({
        where: { id },
        data: updatePaymentDto,
        include: {
          invoice: {
            include: {
              patient: true,
            },
          },
          receivedBy: true,
        },
      });

      // If payment status changed to completed, update invoice status
      if (
        updatePaymentDto.status === PaymentStatus.COMPLETED &&
        payment.invoice.status !== InvoiceStatus.PAID
      ) {
        await this.prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: { status: InvoiceStatus.PAID },
        });
      }

      return payment;
    } catch (error) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return this.prisma.payment.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
  }

  async updateStatus(id: string, status: PaymentStatus) {
    try {
      const payment = await this.prisma.payment.update({
        where: { id },
        data: { status },
        include: {
          invoice: true,
        },
      });

      // If payment is completed, update invoice status
      if (status === PaymentStatus.COMPLETED) {
        await this.prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: { status: InvoiceStatus.PAID },
        });
      }

      return payment;
    } catch (error) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
  }

  async getPaymentStats() {
    const totalPayments = await this.prisma.payment.count();
    const statusCounts = await this.prisma.payment.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        amountPaid: true,
      },
    });

    const recentPayments = await this.prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          include: {
            patient: true,
          },
        },
        receivedBy: true,
      },
    });

    return {
      totalPayments,
      totalAmount: statusCounts.reduce(
        (sum, status) => sum + (status._sum?.amountPaid || 0),
        0,
      ),
      statusBreakdown: statusCounts.map(status => ({
        status: status.status,
        count: status._count,
        amount: status._sum?.amountPaid || 0,
      })),
      recentPayments,
    };
  }

  async getInvoicePayments(invoiceId: string) {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          include: {
            patient: true,
          },
        },
        receivedBy: true,
      },
    });
  }

  async getPendingPayments() {
    return this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
      },
      include: {
        invoice: {
          include: {
            patient: true,
          },
        },
        receivedBy: true,
      },
    });
  }
} 