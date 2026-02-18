const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('./logger');

/**
 * Transport Service - Handles all bus/transport management business logic
 */

// ==================== VEHICLE MANAGEMENT ====================

/**
 * Add a new vehicle
 */
async function addVehicle(vehicleData) {
  try {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { registrationNo: vehicleData.registrationNo }
    });

    if (existingVehicle) {
      throw new Error('Vehicle with this registration number already exists');
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNo: vehicleData.registrationNo,
        model: vehicleData.model,
        capacity: vehicleData.capacity,
        serviceDate: vehicleData.serviceDate,
        fuelType: vehicleData.fuelType,
        averageMileage: vehicleData.averageMileage,
        gpsDeviceId: vehicleData.gpsDeviceId,
        condition: vehicleData.condition || 'GOOD',
        insuranceExpiry: vehicleData.insuranceExpiry,
        notes: vehicleData.notes
      }
    });

    logger.info(`Vehicle added: ${vehicle.registrationNo} (${vehicle.model})`);
    return vehicle;
  } catch (error) {
    logger.error('Error adding vehicle:', error);
    throw error;
  }
}

/**
 * Get all vehicles with pagination and filters
 */
async function getAllVehicles(filters = {}, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const where = {};

    if (filters.condition) {
      where.condition = filters.condition;
    }

    if (filters.registrationNo) {
      where.registrationNo = { contains: filters.registrationNo, mode: 'insensitive' };
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          driver: { select: { id: true, firstName: true, lastName: true } },
          conductor: { select: { id: true, firstName: true, lastName: true } },
          route: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vehicle.count({ where })
    ]);

    return {
      data: vehicles,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    logger.error('Error fetching vehicles:', error);
    throw error;
  }
}

/**
 * Get vehicle details with route and assignments
 */
async function getVehicleDetails(vehicleId) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        driver: true,
        conductor: true,
        route: {
          include: {
            stops: { orderBy: { stopOrder: 'asc' } },
            students: { include: { route: true } }
          }
        },
        maintenanceRecords: { orderBy: { date: 'desc' }, take: 5 },
        boardingRecords: { orderBy: { date: 'desc' }, take: 10 }
      }
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const occupancy = vehicle.route
      ? {
          studentCount: vehicle.route.students.length,
          capacity: vehicle.capacity,
          percentage: Math.round((vehicle.route.students.length / vehicle.capacity) * 100)
        }
      : null;

    return { ...vehicle, occupancy };
  } catch (error) {
    logger.error('Error fetching vehicle details:', error);
    throw error;
  }
}

/**
 * Update vehicle information
 */
async function updateVehicle(vehicleId, vehicleData) {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...(vehicleData.driverId && { driverId: vehicleData.driverId }),
        ...(vehicleData.conductorId && { conductorId: vehicleData.conductorId }),
        ...(vehicleData.currentMileage && { currentMileage: vehicleData.currentMileage }),
        ...(vehicleData.condition && { condition: vehicleData.condition }),
        ...(vehicleData.insuranceExpiry && { insuranceExpiry: vehicleData.insuranceExpiry }),
        ...(vehicleData.notes !== undefined && { notes: vehicleData.notes }),
        ...(vehicleData.maintenanceDate && { maintenanceDate: vehicleData.maintenanceDate })
      }
    });

    logger.info(`Vehicle updated: ${vehicle.registrationNo}`);
    return vehicle;
  } catch (error) {
    logger.error('Error updating vehicle:', error);
    throw error;
  }
}

/**
 * Assign driver to vehicle
 */
async function assignDriver(vehicleId, staffId) {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      throw new Error('Staff member not found');
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { driverId: staffId },
      include: { driver: true }
    });

    logger.info(`Driver assigned: ${staff.firstName} ${staff.lastName} to ${vehicle.registrationNo}`);
    return vehicle;
  } catch (error) {
    logger.error('Error assigning driver:', error);
    throw error;
  }
}

/**
 * Assign conductor to vehicle
 */
async function assignConductor(vehicleId, staffId) {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      throw new Error('Staff member not found');
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { conductorId: staffId },
      include: { conductor: true }
    });

    logger.info(`Conductor assigned: ${staff.firstName} ${staff.lastName} to ${vehicle.registrationNo}`);
    return vehicle;
  } catch (error) {
    logger.error('Error assigning conductor:', error);
    throw error;
  }
}

// ==================== ROUTE MANAGEMENT ====================

/**
 * Create a new transport route
 */
async function createRoute(routeData) {
  try {
    const route = await prisma.route.create({
      data: {
        name: routeData.name,
        vehicleId: routeData.vehicleId,
        monthlyFee: routeData.monthlyFee,
        estimatedDuration: routeData.estimatedDuration,
        notes: routeData.notes
      },
      include: { vehicle: true }
    });

    logger.info(`Route created: ${route.name}`);
    return route;
  } catch (error) {
    logger.error('Error creating route:', error);
    throw error;
  }
}

/**
 * Get all routes with details
 */
async function getAllRoutes(page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        include: {
          vehicle: { select: { registrationNo: true, model: true, capacity: true } },
          stops: { select: { id: true, stopName: true, stopOrder: true } },
          students: { select: { id: true, studentId: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.route.count()
    ]);

    return {
      data: routes.map(r => ({
        ...r,
        studentCount: r.students.length,
        stopCount: r.stops.length
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    logger.error('Error fetching routes:', error);
    throw error;
  }
}

/**
 * Get route details with stops and students
 */
async function getRouteDetails(routeId) {
  try {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        vehicle: { include: { driver: true, conductor: true } },
        stops: { orderBy: { stopOrder: 'asc' } },
        students: true
      }
    });

    if (!route) {
      throw new Error('Route not found');
    }

    return route;
  } catch (error) {
    logger.error('Error fetching route details:', error);
    throw error;
  }
}

/**
 * Update route
 */
async function updateRoute(routeId, routeData) {
  try {
    const route = await prisma.route.update({
      where: { id: routeId },
      data: {
        ...(routeData.name && { name: routeData.name }),
        ...(routeData.monthlyFee && { monthlyFee: routeData.monthlyFee }),
        ...(routeData.estimatedDuration && { estimatedDuration: routeData.estimatedDuration }),
        ...(routeData.notes !== undefined && { notes: routeData.notes })
      }
    });

    logger.info(`Route updated: ${route.name}`);
    return route;
  } catch (error) {
    logger.error('Error updating route:', error);
    throw error;
  }
}

// ==================== BUS STOPS ====================

/**
 * Add a stop to a route
 */
async function addBusStop(routeId, stopData) {
  try {
    // Check if stop order already exists
    const existingStop = await prisma.busStop.findFirst({
      where: { routeId, stopOrder: stopData.stopOrder }
    });

    if (existingStop) {
      throw new Error('Stop order already exists for this route');
    }

    const stop = await prisma.busStop.create({
      data: {
        routeId,
        stopName: stopData.stopName,
        location: stopData.location,
        latitude: stopData.latitude,
        longitude: stopData.longitude,
        stopOrder: stopData.stopOrder,
        arrivalTime: stopData.arrivalTime,
        estimatedWaitTime: stopData.estimatedWaitTime
      }
    });

    // Update route stop count
    const stops = await prisma.busStop.count({ where: { routeId } });
    await prisma.route.update({
      where: { id: routeId },
      data: { totalStops: stops }
    });

    logger.info(`Bus stop added: ${stop.stopName} (Order: ${stop.stopOrder})`);
    return stop;
  } catch (error) {
    logger.error('Error adding bus stop:', error);
    throw error;
  }
}

/**
 * Get stops for a route
 */
async function getRouteStops(routeId) {
  try {
    return await prisma.busStop.findMany({
      where: { routeId },
      orderBy: { stopOrder: 'asc' }
    });
  } catch (error) {
    logger.error('Error fetching route stops:', error);
    throw error;
  }
}

/**
 * Update bus stop
 */
async function updateBusStop(stopId, stopData) {
  try {
    const stop = await prisma.busStop.update({
      where: { id: stopId },
      data: {
        ...(stopData.stopName && { stopName: stopData.stopName }),
        ...(stopData.location && { location: stopData.location }),
        ...(stopData.latitude && { latitude: stopData.latitude }),
        ...(stopData.longitude && { longitude: stopData.longitude }),
        ...(stopData.arrivalTime && { arrivalTime: stopData.arrivalTime }),
        ...(stopData.estimatedWaitTime && { estimatedWaitTime: stopData.estimatedWaitTime })
      }
    });

    logger.info(`Bus stop updated: ${stop.stopName}`);
    return stop;
  } catch (error) {
    logger.error('Error updating bus stop:', error);
    throw error;
  }
}

/**
 * Delete bus stop
 */
async function deleteBusStop(stopId) {
  try {
    const stop = await prisma.busStop.delete({
      where: { id: stopId }
    });

    logger.info(`Bus stop deleted: ${stop.stopName}`);
    return stop;
  } catch (error) {
    logger.error('Error deleting bus stop:', error);
    throw error;
  }
}

// ==================== STUDENT TRANSPORT ENROLLMENT ====================

/**
 * Enroll student in transport route
 */
async function enrollStudent(enrollmentData) {
  try {
    // Check existing enrollment
    const existingEnrollment = await prisma.studentTransport.findUnique({
      where: {
        studentId_routeId: {
          studentId: enrollmentData.studentId,
          routeId: enrollmentData.routeId
        }
      }
    });

    if (existingEnrollment) {
      throw new Error('Student already enrolled in this route');
    }

    const enrollment = await prisma.studentTransport.create({
      data: {
        studentId: enrollmentData.studentId,
        routeId: enrollmentData.routeId,
        pickupStop: enrollmentData.pickupStop,
        dropoffStop: enrollmentData.dropoffStop,
        monthlyFee: enrollmentData.monthlyFee || (await getRouteMonthlyFee(enrollmentData.routeId)),
        boardingStatus: enrollmentData.boardingStatus || true
      }
    });

    logger.info(`Student enrolled in transport: ${enrollmentData.studentId}`);
    return enrollment;
  } catch (error) {
    logger.error('Error enrolling student:', error);
    throw error;
  }
}

/**
 * Get student's transport enrollment
 */
async function getStudentTransportEnrollment(studentId) {
  try {
    return await prisma.studentTransport.findFirst({
      where: { studentId, boardingStatus: true },
      include: {
        route: {
          include: {
            vehicle: { select: { registrationNo: true, driver: { select: { phone: true } } } },
            stops: { orderBy: { stopOrder: 'asc' } }
          }
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching student transport enrollment:', error);
    throw error;
  }
}

/**
 * Get all students on a route
 */
async function getRouteStudents(routeId) {
  try {
    return await prisma.studentTransport.findMany({
      where: { routeId, boardingStatus: true },
      select: {
        id: true,
        studentId: true,
        pickupStop: true,
        dropoffStop: true,
        feePaid: true,
        feePaymentDate: true
      }
    });
  } catch (error) {
    logger.error('Error fetching route students:', error);
    throw error;
  }
}

/**
 * Update student enrollment
 */
async function updateStudentEnrollment(enrollmentId, enrollmentData) {
  try {
    const enrollment = await prisma.studentTransport.update({
      where: { id: enrollmentId },
      data: {
        ...(enrollmentData.pickupStop && { pickupStop: enrollmentData.pickupStop }),
        ...(enrollmentData.dropoffStop && { dropoffStop: enrollmentData.dropoffStop }),
        ...(enrollmentData.monthlyFee && { monthlyFee: enrollmentData.monthlyFee }),
        ...(enrollmentData.boardingStatus !== undefined && { boardingStatus: enrollmentData.boardingStatus })
      }
    });

    logger.info(`Student enrollment updated: ${enrollmentId}`);
    return enrollment;
  } catch (error) {
    logger.error('Error updating student enrollment:', error);
    throw error;
  }
}

/**
 * Mark transport fee as paid
 */
async function markTransportFeePaid(enrollmentId) {
  try {
    const enrollment = await prisma.studentTransport.update({
      where: { id: enrollmentId },
      data: {
        feePaid: true,
        feePaymentDate: new Date()
      }
    });

    logger.info(`Transport fee marked paid: ${enrollmentId}`);
    return enrollment;
  } catch (error) {
    logger.error('Error marking fee paid:', error);
    throw error;
  }
}

// ==================== MAINTENANCE ====================

/**
 * Add maintenance record
 */
async function addMaintenanceRecord(vehicleId, maintenanceData) {
  try {
    const record = await prisma.maintenanceRecord.create({
      data: {
        vehicleId,
        description: maintenanceData.description,
        cost: maintenanceData.cost,
        date: maintenanceData.date || new Date(),
        nextServiceDate: maintenanceData.nextServiceDate,
        parts: maintenanceData.parts,
        mechanic: maintenanceData.mechanic
      }
    });

    logger.info(`Maintenance record added for vehicle: ${vehicleId}`);
    return record;
  } catch (error) {
    logger.error('Error adding maintenance record:', error);
    throw error;
  }
}

/**
 * Get vehicle maintenance history
 */
async function getVehicleMaintenanceHistory(vehicleId) {
  try {
    return await prisma.maintenanceRecord.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' }
    });
  } catch (error) {
    logger.error('Error fetching maintenance history:', error);
    throw error;
  }
}

/**
 * Get due maintenance vehicles
 */
async function getDueMaintenanceVehicles(settings) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (settings?.maintenanceCheckInterval || 30));

    const vehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { maintenanceDate: { lt: cutoffDate } },
          { maintenanceDate: null }
        ]
      },
      include: {
        maintenanceRecords: { orderBy: { date: 'desc' }, take: 1 }
      }
    });

    return vehicles;
  } catch (error) {
    logger.error('Error fetching due maintenance vehicles:', error);
    throw error;
  }
}

// ==================== VEHICLE BOARDING ====================

/**
 * Record vehicle boarding
 */
async function recordVehicleBoarding(vehicleId, boardingData) {
  try {
    const boardingRecord = await prisma.vehicleBoarding.create({
      data: {
        vehicleId,
        date: boardingData.date || new Date(),
        studentCount: boardingData.studentCount,
        capacity: boardingData.capacity,
        remarks: boardingData.remarks
      }
    });

    logger.info(`Vehicle boarding recorded: ${vehicleId} on ${boardingData.date}`);
    return boardingRecord;
  } catch (error) {
    logger.error('Error recording vehicle boarding:', error);
    throw error;
  }
}

/**
 * Get vehicle boarding statistics
 */
async function getVehicleBoardingStats(vehicleId, daysBack = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const records = await prisma.vehicleBoarding.findMany({
      where: {
        vehicleId,
        date: { gte: cutoffDate }
      },
      orderBy: { date: 'asc' }
    });

    const totalRecords = records.length;
    const avgStudentCount = totalRecords > 0
      ? Math.round(records.reduce((sum, r) => sum + r.studentCount, 0) / totalRecords)
      : 0;

    return {
      records,
      statistics: {
        totalDays: totalRecords,
        averageStudents: avgStudentCount,
        maxStudents: Math.max(...records.map(r => r.studentCount), 0),
        minStudents: Math.min(...records.map(r => r.studentCount), 0)
      }
    };
  } catch (error) {
    logger.error('Error fetching boarding statistics:', error);
    throw error;
  }
}

// ==================== REPORTS & ANALYTICS ====================

/**
 * Get transport summary
 */
async function getTransportSummary() {
  try {
    const [totalVehicles, activeRoutes, totalStudents, pendingFees] = await Promise.all([
      prisma.vehicle.count(),
      prisma.route.count(),
      prisma.studentTransport.count({ where: { boardingStatus: true } }),
      prisma.studentTransport.count({ where: { feePaid: false } })
    ]);

    return {
      totalVehicles,
      activeRoutes,
      totalStudents,
      pendingFees,
      occupancyRate: totalVehicles > 0 ? Math.round((totalStudents / (totalVehicles * 50)) * 100) : 0
    };
  } catch (error) {
    logger.error('Error fetching transport summary:', error);
    throw error;
  }
}

/**
 * Get fee collection report
 */
async function getFeeCollectionReport() {
  try {
    const enrollments = await prisma.studentTransport.findMany({
      include: { route: true }
    });

    const paidAmount = enrollments
      .filter(e => e.feePaid)
      .reduce((sum, e) => sum + e.monthlyFee, 0);

    const pendingAmount = enrollments
      .filter(e => !e.feePaid)
      .reduce((sum, e) => sum + e.monthlyFee, 0);

    return {
      totalStudents: enrollments.length,
      paidEnrollments: enrollments.filter(e => e.feePaid).length,
      pendingEnrollments: enrollments.filter(e => !e.feePaid).length,
      collectedAmount: paidAmount,
      pendingAmount: pendingAmount,
      collectionRate: enrollments.length > 0
        ? Math.round((enrollments.filter(e => e.feePaid).length / enrollments.length) * 100)
        : 0
    };
  } catch (error) {
    logger.error('Error fetching fee collection report:', error);
    throw error;
  }
}

// ==================== HELPERS ====================

/**
 * Get default monthly fee for a route
 */
async function getRouteMonthlyFee(routeId) {
  try {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: { monthlyFee: true }
    });

    return route?.monthlyFee || 1000;
  } catch (error) {
    return 1000;
  }
}

module.exports = {
  addVehicle,
  getAllVehicles,
  getVehicleDetails,
  updateVehicle,
  assignDriver,
  assignConductor,
  createRoute,
  getAllRoutes,
  getRouteDetails,
  updateRoute,
  addBusStop,
  getRouteStops,
  updateBusStop,
  deleteBusStop,
  enrollStudent,
  getStudentTransportEnrollment,
  getRouteStudents,
  updateStudentEnrollment,
  markTransportFeePaid,
  addMaintenanceRecord,
  getVehicleMaintenanceHistory,
  getDueMaintenanceVehicles,
  recordVehicleBoarding,
  getVehicleBoardingStats,
  getTransportSummary,
  getFeeCollectionReport
};
