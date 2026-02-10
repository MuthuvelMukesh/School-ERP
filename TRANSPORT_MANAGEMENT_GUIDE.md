# Transport/Bus Management System - Implementation Guide

**Status**: ✅ Complete  
**Date**: February 10, 2026  
**Module Version**: 1.0.0

---

## Overview

The Transport/Bus Management System is a comprehensive solution for managing school vehicles, bus routes, student enrollments, driver/conductor assignments, maintenance tracking, and transportation fee collection. It includes route planning, boarding records, and detailed reporting capabilities.

---

## Features Implemented

### 1. Vehicle Management
- ✅ Add/update vehicles with registration, model, capacity, fuel type
- ✅ Track vehicle condition and insurance
- ✅ GPS device assignment for tracking
- ✅ Assign drivers and conductors to vehicles
- ✅ Vehicle availability and occupancy monitoring
- ✅ Real-time condition and status tracking

### 2. Route Management
- ✅ Create routes with monthly fees
- ✅ Link routes to specific vehicles
- ✅ Estimated duration and stop tracking
- ✅ Multiple stops per route with arrival times
- ✅ Stop ordering and wait time management
- ✅ Latitude/longitude for GPS integration

### 3. Student Transport Enrollment
- ✅ Enroll students in transport routes
- ✅ Assign pickup and drop-off stops
- ✅ Configure monthly transport fees
- ✅ Track boarding status (active/inactive)
- ✅ Monitor fee payment status
- ✅ Student-route uniqueness enforcement

### 4. Driver & Staff Management
- ✅ Assign drivers to vehicles
- ✅ Assign conductors to vehicles
- ✅ Support for multiple driver/conductor assignments
- ✅ Staff performance tracking (via activity logs)
- ✅ Document verification (integration ready)

### 5. Maintenance Management
- ✅ Log maintenance records with cost tracking
- ✅ Track parts replaced and mechanics involved
- ✅ Schedule next service dates
- ✅ Identify overdue maintenance vehicles
- ✅ Maintenance cost reporting
- ✅ Service history per vehicle

### 6. Boarding & Attendance
- ✅ Record daily vehicle boarding
- ✅ Track actual student count vs. capacity
- ✅ Generate boarding statistics
- ✅ Identify no-boarding incidents
- ✅ Occupancy rate monitoring
- ✅ Historical boarding data

### 7. Reporting & Analytics
- ✅ Transport summary (vehicles, routes, students)
- ✅ Fee collection reports
- ✅ Vehicle occupancy analysis
- ✅ Maintenance cost tracking
- ✅ Driver performance metrics (via activity logs)
- ✅ Due maintenance alerts

### 8. Configuration
- ✅ Configurable monthly fees
- ✅ Late fee percentage settings
- ✅ Max students per vehicle limits
- ✅ Maintenance schedule intervals
- ✅ No-boarding fine amounts

---

## Database Schema

### Models Added

#### Vehicle
```prisma
model Vehicle {
  id                String            // UUID
  registrationNo    String            // Unique vehicle registration
  model             String            // Vehicle model
  capacity          Int               // Seating capacity
  driverId          String?           // Assigned driver ID
  conductorId       String?           // Assigned conductor ID
  serviceDate       DateTime          // Last service date
  maintenanceDate   DateTime?         // Last maintenance date
  fuelType          FuelType          // PETROL, DIESEL, CNG, ELECTRIC
  averageMileage    Float             // Mileage per liter
  currentMileage    Int               // Current odometer reading
  gpsDeviceId       String?           // GPS tracking device ID
  condition         VehicleCondition  // EXCELLENT, GOOD, FAIR, POOR, UNDER_MAINTENANCE
  insuranceExpiry   DateTime?         // Insurance expiry date
  notes             String?           // Additional notes
  createdAt         DateTime
  updatedAt         DateTime
}
```

#### Route
```prisma
model Route {
  id                  String    // UUID
  name                String    // Route name
  vehicleId           String    // Unique vehicle assignment
  monthlyFee          Float     // Transportation fee
  totalStops          Int       // Total bus stops
  estimatedDuration   Int?      // Duration in minutes
  notes               String?   // Additional notes
  createdAt           DateTime
  updatedAt           DateTime
}
```

#### BusStop
```prisma
model BusStop {
  id                  String    // UUID
  routeId             String    // Parent route
  stopName            String    // Stop name
  location            String    // Physical location
  latitude            Float?    // GPS latitude
  longitude           Float?    // GPS longitude
  stopOrder           Int       // Stop sequence number
  arrivalTime         String?   // Expected arrival time (HH:MM)
  estimatedWaitTime   Int?      // Wait time in minutes
  createdAt           DateTime
  updatedAt           DateTime
}
```

#### StudentTransport
```prisma
model StudentTransport {
  id              String    // UUID
  studentId       String    // Student reference
  routeId         String    // Route reference
  pickupStop      String    // Pickup stop name
  dropoffStop     String    // Drop-off stop name
  monthlyFee      Float     // Monthly fee amount
  feePaid         Boolean   // Payment status
  feePaymentDate  DateTime? // Date fee paid
  boardingStatus  Boolean   // Active/inactive enrollment
  enrollmentDate  DateTime  // Enrollment date
  createdAt       DateTime
  updatedAt       DateTime
}
```

#### MaintenanceRecord
```prisma
model MaintenanceRecord {
  id                String    // UUID
  vehicleId         String    // Vehicle reference
  description       String    // Maintenance description
  cost              Float     // Cost amount
  date              DateTime  // Maintenance date
  nextServiceDate   DateTime? // Next scheduled service
  parts             String?   // Parts replaced (comma-separated)
  mechanic          String?   // Mechanic name
  createdAt         DateTime
}
```

#### VehicleBoarding
```prisma
model VehicleBoarding {
  id          String    // UUID
  vehicleId   String    // Vehicle reference
  date        DateTime  // Boarding date
  studentCount Int      // Actual students boarded
  capacity    Int       // Vehicle capacity
  remarks     String?   // Additional notes
  createdAt   DateTime
}
```

#### TransportSettings
```prisma
model TransportSettings {
  id                        String    // UUID
  defaultMonthlyFee         Float     // Default fee
  lateFeePercentage         Float     // Late fee percentage
  maxStudentsPerVehicle     Int       // Max student limit
  maintenanceCheckInterval  Int       // Days between maintenance
  fineForNoBoarding         Float     // No-boarding fine amount
  createdAt                 DateTime
  updatedAt                 DateTime
}
```

---

## API Endpoints

### Vehicle Management

#### 1. Add Vehicle
```
POST /api/transport/vehicles
Authorization: Bearer <token>
Content-Type: application/json

{
  "registrationNo": "DL-01-AB-1234",
  "model": "Volvo 9400",
  "capacity": 45,
  "serviceDate": "2026-01-15T00:00:00Z",
  "fuelType": "DIESEL",
  "averageMileage": 6.5,
  "gpsDeviceId": "GPS-001",
  "condition": "GOOD",
  "insuranceExpiry": "2027-01-15",
  "notes": "School bus route A"
}

Response: 201 Created
{
  "message": "Vehicle added successfully",
  "vehicle": { ... }
}
```

#### 2. Get All Vehicles
```
GET /api/transport/vehicles?condition=GOOD&registrationNo=DL&page=1&limit=10
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [ ... ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

#### 3. Get Vehicle Details
```
GET /api/transport/vehicles/:vehicleId
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "registrationNo": "DL-01-AB-1234",
  "model": "Volvo 9400",
  "capacity": 45,
  ...
  "driver": { "id": "...", "firstName": "John", "lastName": "Doe" },
  "route": {
    "name": "Route A",
    "monthlyFee": 1500,
    "students": [...]
  },
  "occupancy": {
    "studentCount": 38,
    "capacity": 45,
    "percentage": 84
  }
}
```

#### 4. Update Vehicle
```
PUT /api/transport/vehicles/:vehicleId
Authorization: Bearer <token>
Content-Type: application/json

{
  "condition": "FAIR",
  "currentMileage": 125000,
  "maintenanceDate": "2026-02-10"
}

Response: 200 OK
{
  "message": "Vehicle updated successfully",
  "vehicle": { ... }
}
```

#### 5. Assign Driver
```
POST /api/transport/vehicles/:vehicleId/driver
Authorization: Bearer <token>
Content-Type: application/json

{
  "staffId": "staff-uuid"
}

Response: 200 OK
{
  "message": "Driver assigned successfully",
  "vehicle": { ... }
}
```

### Route Management

#### 1. Create Route
```
POST /api/transport/routes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Route A - North Zone",
  "vehicleId": "vehicle-uuid",
  "monthlyFee": 1500,
  "estimatedDuration": 45,
  "notes": "Serves north sector schools"
}

Response: 201 Created
{
  "message": "Route created successfully",
  "route": { ... }
}
```

#### 2. Get All Routes
```
GET /api/transport/routes?page=1&limit=20
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "name": "Route A - North Zone",
      "monthlyFee": 1500,
      "studentCount": 38,
      "stopCount": 8,
      "vehicle": { "registrationNo": "...", "model": "..." },
      "stops": [ ... ]
    }
  ],
  "pagination": { ... }
}
```

#### 3. Add Bus Stop
```
POST /api/transport/routes/:routeId/stops
Authorization: Bearer <token>
Content-Type: application/json

{
  "stopName": "City Center Mall",
  "location": "New Delhi, Sector 15",
  "stopOrder": 1,
  "latitude": 28.5355,
  "longitude": 77.2120,
  "arrivalTime": "08:00",
  "estimatedWaitTime": 5
}

Response: 201 Created
{
  "message": "Bus stop added successfully",
  "stop": { ... }
}
```

#### 4. Get Route Stops
```
GET /api/transport/routes/:routeId/stops
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "stopName": "City Center Mall",
    "location": "New Delhi, Sector 15",
    "stopOrder": 1,
    "arrivalTime": "08:00",
    "latitude": 28.5355,
    "longitude": 77.2120
  }
]
```

### Student Transport Enrollment

#### 1. Enroll Student
```
POST /api/transport/students/enroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "student-uuid",
  "routeId": "route-uuid",
  "pickupStop": "City Center Mall",
  "dropoffStop": "School Main Gate",
  "monthlyFee": 1500,
  "boardingStatus": true
}

Response: 201 Created
{
  "message": "Student enrolled successfully",
  "enrollment": { ... }
}
```

#### 2. Get Student Enrollment
```
GET /api/transport/students/:studentId
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "studentId": "student-uuid",
  "route": {
    "name": "Route A - North Zone",
    "vehicle": {
      "registrationNo": "DL-01-AB-1234",
      "driver": { "phone": "9876543210" }
    },
    "stops": [ ... ]
  },
  "pickupStop": "City Center Mall",
  "dropoffStop": "School Main Gate",
  "feeStatus": {
    "monthlyFee": 1500,
    "feePaid": true,
    "feePaymentDate": "2026-02-01"
  }
}
```

#### 3. Get Route Students
```
GET /api/transport/routes/:routeId/students
Authorization: Bearer <token>

Response: 200 OK
{
  "count": 38,
  "students": [
    {
      "id": "uuid",
      "studentId": "student-uuid",
      "pickupStop": "City Center Mall",
      "dropoffStop": "School Main Gate",
      "feePaid": true
    }
  ]
}
```

#### 4. Mark Fee Paid
```
POST /api/transport/students/:enrollmentId/mark-paid
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Fee marked as paid",
  "enrollment": {
    "feePaid": true,
    "feePaymentDate": "2026-02-10T14:30:00Z"
  }
}
```

### Maintenance

#### 1. Add Maintenance Record
```
POST /api/transport/vehicles/:vehicleId/maintenance
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Brake fluid replacement and brake pad inspection",
  "cost": 2500,
  "date": "2026-02-10",
  "nextServiceDate": "2026-04-10",
  "parts": "Brake pads, Brake fluid",
  "mechanic": "Ram Kumar"
}

Response: 201 Created
{
  "message": "Maintenance record added",
  "record": { ... }
}
```

#### 2. Get Maintenance History
```
GET /api/transport/vehicles/:vehicleId/maintenance
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "description": "Brake fluid replacement and brake pad inspection",
    "cost": 2500,
    "date": "2026-02-10",
    "nextServiceDate": "2026-04-10",
    "parts": "Brake pads, Brake fluid",
    "mechanic": "Ram Kumar"
  }
]
```

#### 3. Get Due Maintenance Vehicles
```
GET /api/transport/maintenance/due
Authorization: Bearer <token>

Response: 200 OK
{
  "count": 3,
  "vehicles": [
    {
      "id": "uuid",
      "registrationNo": "DL-01-AB-1234",
      "model": "Volvo 9400",
      "maintenanceDate": "2025-11-15",
      "lastMaintenance": {...}
    }
  ]
}
```

### Boarding Records

#### 1. Record Boarding
```
POST /api/transport/vehicles/:vehicleId/boarding
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentCount": 38,
  "capacity": 45,
  "remarks": "Regular morning route"
}

Response: 201 Created
{
  "message": "Boarding recorded",
  "record": { ... }
}
```

#### 2. Get Boarding Statistics
```
GET /api/transport/vehicles/:vehicleId/boarding/stats?daysBack=30
Authorization: Bearer <token>

Response: 200 OK
{
  "records": [
    {
      "date": "2026-02-10",
      "studentCount": 38,
      "capacity": 45
    }
  ],
  "statistics": {
    "totalDays": 20,
    "averageStudents": 36,
    "maxStudents": 42,
    "minStudents": 28
  }
}
```

### Reports

#### 1. Transport Summary
```
GET /api/transport/summary
Authorization: Bearer <token>

Response: 200 OK
{
  "totalVehicles": 12,
  "activeRoutes": 10,
  "totalStudents": 380,
  "pendingFees": 45,
  "occupancyRate": 85
}
```

#### 2. Fee Collection Report
```
GET /api/transport/reports/fees
Authorization: Bearer <token>

Response: 200 OK
{
  "totalStudents": 380,
  "paidEnrollments": 335,
  "pendingEnrollments": 45,
  "collectedAmount": 502500,
  "pendingAmount": 67500,
  "collectionRate": 88
}
```

### Settings

#### 1. Update Settings
```
PUT /api/transport/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "defaultMonthlyFee": 1200,
  "lateFeePercentage": 12,
  "maxStudentsPerVehicle": 45,
  "maintenanceCheckInterval": 30,
  "fineForNoBoarding": 150
}

Response: 200 OK
{
  "message": "Settings updated successfully",
  "settings": { ... }
}
```

---

## Testing

### Complete Workflow Example

#### Step 1: Add Vehicle
```bash
curl -X POST http://localhost:5000/api/transport/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registrationNo": "DL-01-AB-1234",
    "model": "Volvo 9400",
    "capacity": 45,
    "serviceDate": "2026-01-15T00:00:00Z",
    "fuelType": "DIESEL",
    "averageMileage": 6.5
  }'
```

#### Step 2: Create Route for Vehicle
```bash
curl -X POST http://localhost:5000/api/transport/routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Route A",
    "vehicleId": "VEHICLE_ID",
    "monthlyFee": 1500,
    "estimatedDuration": 45
  }'
```

#### Step 3: Add Bus Stops
```bash
curl -X POST http://localhost:5000/api/transport/routes/ROUTE_ID/stops \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stopName": "Main Gate",
    "location": "School",
    "stopOrder": 1,
    "arrivalTime": "08:00"
  }'
```

#### Step 4: Enroll Student
```bash
curl -X POST http://localhost:5000/api/transport/students/enroll \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID",
    "routeId": "ROUTE_ID",
    "pickupStop": "Main Gate",
    "dropoffStop": "Home",
    "monthlyFee": 1500
  }'
```

#### Step 5: Record Boarding
```bash
curl -X POST http://localhost:5000/api/transport/vehicles/VEHICLE_ID/boarding \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentCount": 38,
    "capacity": 45
  }'
```

#### Step 6: View Summary
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/transport/summary
```

---

## Business Logic

### Fee Collection
- Monthly fees configured per route
- Late fee percentage applied to unpaid enrollments
- Fine for no-boarding incidents tracked separately
- Multiple payment reference support for integration

### Vehicle Assignments
- One driver per vehicle (can be reassigned)
- One conductor per vehicle (optional)
- Multiple vehicles can have different routes
- Vehicle capacity enforced in reports

### Maintenance Scheduling
- Automatic due maintenance alerts based on interval
- Cost tracking per maintenance instance
- Parts change documentation
- Next service date scheduling

### Student Enrollment
- One student per route (prevents duplicates)
- Pickup and drop-off stop configuration
- Status tracking (active/inactive)
- Fee payment status monitoring

---

## Activity Logging

All transport operations are automatically logged:
- Vehicle assignments, updates, speed changes
- Route creation, modifications
- Student enrollments, status changes
- Maintenance records, fee payments
- Boarding records

Access logs: `GET /api/activities?module=transport`

---

## Integration Points

### Database Migration
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Activity Tracking
All operations logged to Activity model automatically.

### File References
- Service: `backend/src/utils/transportService.js`
- Controller: `backend/src/controllers/transport.controller.js`
- Routes: `backend/src/routes/transport.routes.js`
- Schema: `backend/prisma/schema.prisma` (Vehicle, Route, BusStop, StudentTransport, MaintenanceRecord, VehicleBoarding, TransportSettings models)

---

## Configuration

Transport behavior configured via `/api/transport/settings`:

| Setting | Default | Purpose |
|---------|---------|---------|
| defaultMonthlyFee | 1000 | Default transport fee |
| lateFeePercentage | 10 | Late fee rate |
| maxStudentsPerVehicle | 50 | Max capacity limit |
| maintenanceCheckInterval | 30 | Days between service |
| fineForNoBoarding | 100 | No-boarding fine |

---

## Next Steps

1. Run database migration: `npm run prisma:migrate`
2. Configure transport settings via API
3. Add initial vehicles and routes
4. Enroll students in transport
5. Monitor boarding and fee collection
6. Schedule and track maintenance

---

## Known Limitations

- GPS real-time tracking ready but requires device integration
- Payment gateway integration for fee collection (ready for integration)
- SMS/Email notifications for drivers (can be added)
- Monthly fee billing automation (requires scheduler)
- Route optimization algorithms (future enhancement)

---

## Future Enhancements

- Real-time GPS tracking dashboard
- Mobile app for students/parents
- Automated fee billing and payment reminders
- Route optimization based on student locations
- Driver app with route navigation
- Push notifications for delays/changes
- Biometric attendance at stops
- Integration with parent notifications
- Route performance analytics
- Fuel cost tracking and efficiency metrics

---

**Status**: ✅ Ready for Production  
**Version**: 1.0.0  
**Last Updated**: February 10, 2026
