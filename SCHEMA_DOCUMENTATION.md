# Chores App Database Schema Documentation

## Overview

This schema provides a comprehensive solution for managing a chores/tenant management application with the following key features:

- **Admin and Tenant Role Management**: Role-based access control
- **Property and Room Management**: Multi-property support with room/area tracking
- **Task Management**: Repetitive and one-time tasks with flexible assignment
- **Tenant Management**: Complete tenant profiles with rent tracking and requests
- **Monitoring and Reporting**: Task completion tracking and tenant monitoring

## Core Models

### 1. User Management

#### User Model

- **Role-based authentication** with `ADMIN` and `TENANT` roles
- **NextAuth.js integration** for secure authentication
- **Comprehensive user profile** with contact information

#### TenantProfile Model

- **Rent management**: Monthly rent, due dates, deposits
- **Lease tracking**: Start/end dates, move-in dates
- **Emergency contacts** and additional notes
- **Property and room associations**

### 2. Property Management

#### Property Model

- **Multi-property support** for managing multiple buildings
- **Address and description** tracking
- **Admin ownership** with creation tracking

#### Room Model

- **Room/Area management** within properties
- **Flexible room assignment** for tenants
- **Task association** for room-specific chores

### 3. Task Management System

#### Task Model (Template)

- **Flexible frequency options**:
  - `ONCE`: One-time tasks
  - `DAILY`: Daily recurring tasks
  - `WEEKLY`: Weekly recurring tasks
  - `MONTHLY`: Monthly recurring tasks
  - `CUSTOM`: Custom intervals (e.g., every 3 days)

- **Assignment configuration**:
  - `assignToAll`: Assign to all tenants in property/room
  - `maxAssignments`: Limit concurrent workers
  - Priority levels (1-5 scale)

#### TaskAssignment Model

- **Individual task assignments** to specific tenants
- **Due date tracking** with status management
- **Recurrence support** for repetitive tasks
- **Assignment notes** and tracking

#### TaskCompletion Model

- **Completion verification** with photos
- **Admin verification** system
- **Completion notes** and timestamps
- **Status tracking** (PENDING, COMPLETED, OVERDUE, etc.)

### 4. Tenant Management

#### Payment Model

- **Rent tracking** with due dates
- **Multiple payment types** (rent, deposit, fees)
- **Payment status** (PENDING, PAID, OVERDUE, PARTIAL)
- **Payment methods** and reference tracking

#### TenantRequest Model

- **Request system** for maintenance, complaints, general requests
- **Priority levels** and status tracking
- **Admin response** system with resolution tracking
- **Request categorization**

### 5. Monitoring and Analytics

#### TaskRecurrence Model

- **Recurring task management** for automatic assignment
- **Next due date tracking** for scheduling
- **Active/inactive** recurrence control

## Key Features Implementation

### ✅ Admin Capabilities

1. **Create Tenants and Rooms/Areas**
   - Admins can create properties and rooms
   - Assign tenants to specific rooms
   - Manage tenant profiles and information

2. **Task Assignment**
   - Create tasks with flexible frequencies
   - Assign tasks to individual tenants or all tenants
   - Set priorities and estimated durations
   - Configure custom intervals for recurring tasks

3. **Tenant Details Management**
   - Set rent amounts and due dates
   - Track deposits and security deposits
   - Manage lease information
   - Add remarks and notes

4. **Monitoring and Summary**
   - Track task completion rates
   - Monitor tenant performance
   - View payment status and history
   - Manage tenant requests and responses

### ✅ Tenant Capabilities

1. **Task Management**
   - View assigned tasks with due dates
   - Mark tasks as completed
   - Add completion notes and photos
   - Track task status and progress

2. **Payment Tracking**
   - View rent due dates
   - Track payment history
   - Monitor payment status

3. **Request System**
   - Submit maintenance requests
   - Report issues and complaints
   - Track request status and responses

## Database Relationships

### Core Relationships

- **User ↔ TenantProfile**: One-to-one relationship for tenant-specific data
- **Property ↔ Room**: One-to-many for property structure
- **Property ↔ Tenant**: One-to-many for tenant assignment
- **Task ↔ TaskAssignment**: One-to-many for task distribution
- **TaskAssignment ↔ TaskCompletion**: One-to-many for completion tracking

### Indexes for Performance

- **User queries**: Email, role-based filtering
- **Task queries**: Property, room, frequency, status filtering
- **Assignment queries**: User, due date, status filtering
- **Payment queries**: User, due date, status filtering

## Usage Examples

### Creating a Repetitive Task for All Tenants

```typescript
// Admin creates a weekly cleaning task
const task = await prisma.task.create({
  data: {
    title: "Weekly Kitchen Cleaning",
    description: "Clean kitchen counters, sink, and appliances",
    frequency: "WEEKLY",
    assignToAll: true,
    propertyId: "property-id",
    roomId: "kitchen-room-id",
    createdById: "admin-user-id",
  },
});
```

### Assigning Tasks to Specific Tenants

```typescript
// Create assignments for specific tenants
const assignments = await prisma.taskAssignment.createMany({
  data: tenants.map((tenant) => ({
    taskId: task.id,
    userId: tenant.id,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  })),
});
```

### Tracking Task Completion

```typescript
// Tenant marks task as completed
const completion = await prisma.taskCompletion.create({
  data: {
    taskId: task.id,
    assignmentId: assignment.id,
    userId: tenant.id,
    completedAt: new Date(),
    completionNotes: "Kitchen cleaned thoroughly",
    photos: ["photo-url-1", "photo-url-2"],
  },
});
```

## Security Considerations

1. **Role-based Access**: Admin vs Tenant permissions
2. **Data Isolation**: Tenant data separated by property/room
3. **Audit Trail**: Creation and modification timestamps
4. **Verification System**: Admin verification for task completion

## Scalability Features

1. **Efficient Indexing**: Optimized queries for large datasets
2. **Flexible Assignment**: Support for various assignment patterns
3. **Recurrence Management**: Automated recurring task generation
4. **Status Tracking**: Comprehensive status management across all entities

This schema provides a robust foundation for a comprehensive chores management application that scales with your needs while maintaining data integrity and performance.
