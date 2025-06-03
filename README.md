# Hospital Management System

A comprehensive backend system for managing hospital operations, built with NestJS and Prisma ORM.

## Features

- Patient Management
- Doctor Management
- Appointment Scheduling
- Department Management
- User Authentication & Authorization
- Basic Billing/Invoicing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- pnpm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hospital-management-system
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file in the root directory with the following content:
```
DATABASE_URL="mongodb://localhost:27017/hospital_management"
JWT_SECRET="your-super-secret-key-change-this-in-production"
```

4. Set up the database:
```bash
# Make sure MongoDB is running on your system
# Then run migrations
pnpm prisma generate
```

## Running the Application

Development mode:
```bash
pnpm run start:dev
```

Production mode:
```bash
pnpm run build
pnpm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:
```
http://localhost:3000/api
```

## Project Structure

```
src/
├── auth/           # Authentication module
├── users/          # User management
├── patients/       # Patient management
├── doctors/        # Doctor management
├── departments/    # Department management
├── appointments/   # Appointment scheduling
├── invoices/       # Billing and invoicing
└── prisma/         # Database configuration
```

## Testing

Run unit tests:
```bash
pnpm run test
```

Run e2e tests:
```bash
pnpm run test:e2e
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
# hms-backend
