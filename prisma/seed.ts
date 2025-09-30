import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash("Subin@2055", 12);

  // Create default admin user
  const admin = await prisma.user.upsert({
    where: { email: "admins@wpm.com" },
    update: {},
    create: {
      email: "admins@wpm.com",
      name: "Admin User",
      role: "ADMIN",
      password: hashedPassword,
    },
  });

  // Create a sample property
  const property = await prisma.property.upsert({
    where: { id: "sample-property-1" },
    update: {},
    create: {
      id: "sample-property-1",
      name: "Sample Property",
      address: "123 Main Street, City, State 12345",
      description: "A sample property for testing purposes",
      createdById: admin.id,
    },
  });

  // Create a sample room
  const room = await prisma.room.upsert({
    where: { id: "sample-room-1" },
    update: {},
    create: {
      id: "sample-room-1",
      name: "Sample Room",
      propertyId: property.id,
      description: "A sample room for testing purposes",
      createdById: admin.id,
    },
  });

  // Create a sample tenant user
  const tenant = await prisma.user.upsert({
    where: { email: "tenant1@whm.com" },
    update: {},
    create: {
      email: "tenant1@whm.com",
      name: "Sample Tenant",
      role: "TENANT",
      password: hashedPassword,
    },
  });

  // Create tenant profile
  const tenantProfile = await prisma.tenantProfile.upsert({
    where: { id: "sample-tenant-profile-1" },
    update: {},
    create: {
      id: "sample-tenant-profile-1",
      userId: tenant.id,
      propertyId: property.id,
      roomId: room.id,
      monthlyRent: 1200.0,
      rentDueDay: 1,
      depositAmount: 1200.0,
      securityDeposit: 600.0,
      emergencyContact: "Emergency Contact",
      emergencyPhone: "+1234567890",
      moveInDate: new Date("2024-01-01"),
      leaseStartDate: new Date("2024-01-01"),
      leaseEndDate: new Date("2024-12-31"),
      remarks: "Sample tenant for testing",
      notes: "Created during seeding",
    },
  });

  // Create a sample task
  const task = await prisma.task.upsert({
    where: { id: "sample-task-1" },
    update: {},
    create: {
      id: "sample-task-1",
      title: "Weekly Cleaning",
      description: "Clean the common areas and maintain cleanliness",
      propertyId: property.id,
      roomId: room.id,
      frequency: "WEEKLY",
      estimatedDuration: 60,
      priority: 2,
      assignToAll: false,
      maxAssignments: 2,
      createdById: admin.id,
    },
  });

  // Create a task assignment
  const taskAssignment = await prisma.taskAssignment.upsert({
    where: { id: "sample-assignment-1" },
    update: {},
    create: {
      id: "sample-assignment-1",
      taskId: task.id,
      userId: tenant.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: "PENDING",
      notes: "Sample task assignment",
    },
  });

  // Create a sample payment
  const payment = await prisma.payment.upsert({
    where: { id: "sample-payment-1" },
    update: {},
    create: {
      id: "sample-payment-1",
      userId: tenant.id,
      amount: 1200.0,
      paymentType: "rent",
      status: "PENDING",
      dueDate: new Date("2024-02-01"),
      notes: "Monthly rent payment",
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("👤 Admin user:", admin.email);
  console.log("🏠 Property:", property.name);
  console.log("🏠 Room:", room.name);
  console.log("👤 Tenant:", tenant.email);
  console.log("📋 Task:", task.title);
  console.log("💰 Payment:", payment.amount);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(() => {
    disconnect()
      .then(() => {
        console.log("✅ Database disconnected successfully!");
      })
      .catch((e) => {
        console.error("❌ Error disconnecting database:", e);
      });
    return void 1;
  });

const disconnect = async () => {
  await prisma.$disconnect();
  console.log("✅ Database disconnected successfully!");
};
