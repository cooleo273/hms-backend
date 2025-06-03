import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { NursesModule } from './nurses/nurses.module';
import { PharmacistsModule } from './pharmacists/pharmacists.module';
import { LabTechniciansModule } from './lab-technicians/lab-technicians.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { DrugsModule } from './drugs/drugs.module';
import { DrugBatchesModule } from './drug-batches/drug-batches.module';
import { LabTestCatalogModule } from './lab-test-catalog/lab-test-catalog.module';
import { LabTestOrdersModule } from './lab-test-orders/lab-test-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    DoctorsModule,
    NursesModule,
    PharmacistsModule,
    LabTechniciansModule,
    AppointmentsModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    DrugsModule,
    DrugBatchesModule,
    LabTestCatalogModule,
    LabTestOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
