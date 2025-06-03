import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto';
import { UpdateVitalSignsDto } from './dto/update-vital-signs.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VitalSignsService {
  constructor(private prisma: PrismaService) {}

  async create(createVitalSignsDto: CreateVitalSignsDto) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: createVitalSignsDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${createVitalSignsDto.patientId} not found`,
      );
    }

    // Create vital signs record
    return this.prisma.vitalSign.create({
      data: {
        patientId: createVitalSignsDto.patientId,
        recordedById: createVitalSignsDto.recordedBy,
        temperature: createVitalSignsDto.temperature,
        bloodPressureSystolic: createVitalSignsDto.bloodPressureSystolic,
        bloodPressureDiastolic: createVitalSignsDto.bloodPressureDiastolic,
        heartRate: createVitalSignsDto.heartRate,
        respiratoryRate: createVitalSignsDto.respiratoryRate,
        oxygenSaturation: createVitalSignsDto.oxygenSaturation,
        timestamp: createVitalSignsDto.recordedAt,
      },
      include: {
        patient: true,
        recordedBy: true,
      },
    });
  }

  async findAll(
    patientId?: string,
    startDate?: Date,
    endDate?: Date,
    sortBy?: 'timestamp' | 'temperature' | 'heartRate',
    sortOrder?: 'asc' | 'desc',
  ) {
    const where = {
      ...(patientId && { patientId }),
      ...(startDate && endDate && {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'desc' } : undefined;

    return this.prisma.vitalSign.findMany({
      where,
      orderBy,
      include: {
        patient: true,
        recordedBy: true,
      },
    });
  }

  async findOne(id: string) {
    const vitalSigns = await this.prisma.vitalSign.findUnique({
      where: { id },
      include: {
        patient: true,
        recordedBy: true,
      },
    });

    if (!vitalSigns) {
      throw new NotFoundException(`Vital signs with ID ${id} not found`);
    }

    return vitalSigns;
  }

  async update(id: string, updateVitalSignsDto: UpdateVitalSignsDto) {
    try {
      return this.prisma.vitalSign.update({
        where: { id },
        data: {
          temperature: updateVitalSignsDto.temperature,
          bloodPressureSystolic: updateVitalSignsDto.bloodPressureSystolic,
          bloodPressureDiastolic: updateVitalSignsDto.bloodPressureDiastolic,
          heartRate: updateVitalSignsDto.heartRate,
          respiratoryRate: updateVitalSignsDto.respiratoryRate,
          oxygenSaturation: updateVitalSignsDto.oxygenSaturation,
          timestamp: updateVitalSignsDto.recordedAt,
        },
        include: {
          patient: true,
          recordedBy: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Vital signs with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return this.prisma.vitalSign.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Vital signs with ID ${id} not found`);
    }
  }

  async getVitalSignsStats(patientId: string) {
    const vitalSigns = await this.prisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    if (vitalSigns.length === 0) {
      return {
        patientId,
        hasData: false,
      };
    }

    const latest = vitalSigns[0];
    const averages = {
      temperature: this.calculateAverage(vitalSigns.map(vs => vs.temperature).filter((v): v is number => v !== null)),
      heartRate: this.calculateAverage(vitalSigns.map(vs => vs.heartRate).filter((v): v is number => v !== null)),
      bloodPressureSystolic: this.calculateAverage(
        vitalSigns.map(vs => vs.bloodPressureSystolic).filter((v): v is number => v !== null),
      ),
      bloodPressureDiastolic: this.calculateAverage(
        vitalSigns.map(vs => vs.bloodPressureDiastolic).filter((v): v is number => v !== null),
      ),
      respiratoryRate: this.calculateAverage(
        vitalSigns.map(vs => vs.respiratoryRate).filter((v): v is number => v !== null),
      ),
      oxygenSaturation: this.calculateAverage(
        vitalSigns.map(vs => vs.oxygenSaturation).filter((v): v is number => v !== null),
      ),
    };

    const trends = {
      temperature: this.calculateTrend(vitalSigns.map(vs => vs.temperature).filter((v): v is number => v !== null)),
      heartRate: this.calculateTrend(vitalSigns.map(vs => vs.heartRate).filter((v): v is number => v !== null)),
      bloodPressureSystolic: this.calculateTrend(
        vitalSigns.map(vs => vs.bloodPressureSystolic).filter((v): v is number => v !== null),
      ),
      bloodPressureDiastolic: this.calculateTrend(
        vitalSigns.map(vs => vs.bloodPressureDiastolic).filter((v): v is number => v !== null),
      ),
      respiratoryRate: this.calculateTrend(
        vitalSigns.map(vs => vs.respiratoryRate).filter((v): v is number => v !== null),
      ),
      oxygenSaturation: this.calculateTrend(
        vitalSigns.map(vs => vs.oxygenSaturation).filter((v): v is number => v !== null),
      ),
    };

    return {
      patientId,
      hasData: true,
      latest,
      averages,
      trends,
      history: vitalSigns,
    };
  }

  async getPatientVitalSigns(patientId: string) {
    return this.prisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
      include: {
        recordedBy: true,
      },
    });
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    const difference = secondAvg - firstAvg;
    const threshold = 0.1; // 10% change threshold

    if (Math.abs(difference) < threshold) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }
} 