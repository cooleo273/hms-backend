import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSeededData() {
  try {
    // Check doctors
    const doctors = await prisma.doctor.findMany();
    console.log('Doctors:', doctors);

    // Check patients
    const patients = await prisma.patient.findMany();
    console.log('Patients:', patients);

    // Check appointments
    const appointments = await prisma.appointment.findMany();
    console.log('Appointments:', appointments);

  } catch (error) {
    console.error('Error checking seeded data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeededData(); 