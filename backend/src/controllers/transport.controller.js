const transportService = require('../utils/transportService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * Transport Controller - Handles all transport/bus management API endpoints
 */

// ==================== VEHICLE MANAGEMENT ====================

/**
 * Add a new vehicle
 * POST /api/transport/vehicles
 */
exports.addVehicle = async (req, res) => {
  try {
    const { registrationNo, model, capacity, serviceDate, fuelType, averageMileage, gpsDeviceId, condition, insuranceExpiry, notes } = req.body;

    if (!registrationNo || !model || !capacity || !serviceDate || !fuelType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const vehicle = await transportService.addVehicle({
      registrationNo, model, capacity, serviceDate, fuelType, averageMileage, gpsDeviceId, condition, insuranceExpiry, notes
    });

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        actionType: 'CREATE',
        module: 'transport',
        description: `Added vehicle: ${vehicle.registrationNo}`,
        resourceId: vehicle.id,
        resourceType: 'vehicle',
        ipAddress: req.ip
      }
    });

    res.status(201).json({ message: 'Vehicle added successfully', vehicle });
  } catch (error) {
    logger.error('Error adding vehicle:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all vehicles
 * GET /api/transport/vehicles
 */
exports.getAllVehicles = async (req, res) => {
  try {
    const { condition, registrationNo, page = 1, limit = 10 } = req.query;
    const vehicles = await transportService.getAllVehicles(
      { condition, registrationNo },
      parseInt(page),
      parseInt(limit)
    );
    res.json(vehicles);
  } catch (error) {
    logger.error('Error fetching vehicles:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get vehicle details
 * GET /api/transport/vehicles/:vehicleId
 */
exports.getVehicleDetails = async (req, res) => {
  try {
    const vehicle = await transportService.getVehicleDetails(req.params.vehicleId);
    res.json(vehicle);
  } catch (error) {
    logger.error('Error fetching vehicle details:', error);
    res.status(error.message === 'Vehicle not found' ? 404 : 500).json({ error: error.message });
  }
};

/**
 * Update vehicle
 * PUT /api/transport/vehicles/:vehicleId
 */
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await transportService.updateVehicle(req.params.vehicleId, req.body);

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'UPDATE',
        module: 'transport',
        description: `Updated vehicle: ${vehicle.registrationNo}`,
        resourceId: vehicle.id,
        resourceType: 'vehicle',
        changes: req.body,
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Vehicle updated successfully', vehicle });
  } catch (error) {
    logger.error('Error updating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Assign driver to vehicle
 * POST /api/transport/vehicles/:vehicleId/driver
 */
exports.assignDriver = async (req, res) => {
  try {
    const { staffId } = req.body;
    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }

    const vehicle = await transportService.assignDriver(req.params.vehicleId, staffId);

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'UPDATE',
        module: 'transport',
        description: `Assigned driver to vehicle: ${vehicle.registrationNo}`,
        resourceId: vehicle.id,
        resourceType: 'vehicle',
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Driver assigned successfully', vehicle });
  } catch (error) {
    logger.error('Error assigning driver:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Assign conductor to vehicle
 * POST /api/transport/vehicles/:vehicleId/conductor
 */
exports.assignConductor = async (req, res) => {
  try {
    const { staffId } = req.body;
    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }

    const vehicle = await transportService.assignConductor(req.params.vehicleId, staffId);

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'UPDATE',
        module: 'transport',
        description: `Assigned conductor to vehicle: ${vehicle.registrationNo}`,
        resourceId: vehicle.id,
        resourceType: 'vehicle',
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Conductor assigned successfully', vehicle });
  } catch (error) {
    logger.error('Error assigning conductor:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== ROUTE MANAGEMENT ====================

/**
 * Create a new route
 * POST /api/transport/routes
 */
exports.createRoute = async (req, res) => {
  try {
    const { name, vehicleId, monthlyFee, estimatedDuration, notes } = req.body;
    if (!name || !vehicleId || !monthlyFee) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const route = await transportService.createRoute({ name, vehicleId, monthlyFee, estimatedDuration, notes });

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        actionType: 'CREATE',
        module: 'transport',
        description: `Created route: ${route.name}`,
        resourceId: route.id,
        resourceType: 'route',
        ipAddress: req.ip
      }
    });

    res.status(201).json({ message: 'Route created successfully', route });
  } catch (error) {
    logger.error('Error creating route:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all routes
 * GET /api/transport/routes
 */
exports.getAllRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const routes = await transportService.getAllRoutes(parseInt(page), parseInt(limit));
    res.json(routes);
  } catch (error) {
    logger.error('Error fetching routes:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get route details
 * GET /api/transport/routes/:routeId
 */
exports.getRouteDetails = async (req, res) => {
  try {
    const route = await transportService.getRouteDetails(req.params.routeId);
    res.json(route);
  } catch (error) {
    logger.error('Error fetching route details:', error);
    res.status(error.message === 'Route not found' ? 404 : 500).json({ error: error.message });
  }
};

/**
 * Update route
 * PUT /api/transport/routes/:routeId
 */
exports.updateRoute = async (req, res) => {
  try {
    const route = await transportService.updateRoute(req.params.routeId, req.body);

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'UPDATE',
        module: 'transport',
        description: `Updated route: ${route.name}`,
        resourceId: route.id,
        resourceType: 'route',
        changes: req.body,
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Route updated successfully', route });
  } catch (error) {
    logger.error('Error updating route:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== BUS STOPS ====================

/**
 * Add bus stop to route
 * POST /api/transport/routes/:routeId/stops
 */
exports.addBusStop = async (req, res) => {
  try {
    const { stopName, location, latitude, longitude, stopOrder, arrivalTime, estimatedWaitTime } = req.body;
    if (!stopName || !location || stopOrder === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stop = await transportService.addBusStop(req.params.routeId, {
      stopName, location, latitude, longitude, stopOrder, arrivalTime, estimatedWaitTime
    });

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        actionType: 'CREATE',
        module: 'transport',
        description: `Added bus stop: ${stop.stopName}`,
        resourceId: stop.id,
        resourceType: 'bus_stop',
        ipAddress: req.ip
      }
    });

    res.status(201).json({ message: 'Bus stop added successfully', stop });
  } catch (error) {
    logger.error('Error adding bus stop:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get route stops
 * GET /api/transport/routes/:routeId/stops
 */
exports.getRouteStops = async (req, res) => {
  try {
    const stops = await transportService.getRouteStops(req.params.routeId);
    res.json(stops);
  } catch (error) {
    logger.error('Error fetching route stops:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update bus stop
 * PUT /api/transport/stops/:stopId
 */
exports.updateBusStop = async (req, res) => {
  try {
    const stop = await transportService.updateBusStop(req.params.stopId, req.body);
    res.json({ message: 'Bus stop updated successfully', stop });
  } catch (error) {
    logger.error('Error updating bus stop:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete bus stop
 * DELETE /api/transport/stops/:stopId
 */
exports.deleteBusStop = async (req, res) => {
  try {
    const stop = await transportService.deleteBusStop(req.params.stopId);

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        actionType: 'DELETE',
        module: 'transport',
        description: `Deleted bus stop: ${stop.stopName}`,
        resourceId: stop.id,
        resourceType: 'bus_stop',
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Bus stop deleted successfully' });
  } catch (error) {
    logger.error('Error deleting bus stop:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== STUDENT TRANSPORT ====================

/**
 * Enroll student in transport
 * POST /api/transport/students/enroll
 */
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, routeId, pickupStop, dropoffStop, monthlyFee, boardingStatus } = req.body;
    if (!studentId || !routeId || !pickupStop || !dropoffStop) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const enrollment = await transportService.enrollStudent({
      studentId, routeId, pickupStop, dropoffStop, monthlyFee, boardingStatus
    });

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        actionType: 'CREATE',
        module: 'transport',
        description: `Enrolled student in transport: ${studentId}`,
        resourceId: enrollment.id,
        resourceType: 'student_transport',
        ipAddress: req.ip
      }
    });

    res.status(201).json({ message: 'Student enrolled successfully', enrollment });
  } catch (error) {
    logger.error('Error enrolling student:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get student's transport enrollment
 * GET /api/transport/students/:studentId
 */
exports.getStudentTransportEnrollment = async (req, res) => {
  try {
    const enrollment = await transportService.getStudentTransportEnrollment(req.params.studentId);
    if (!enrollment) {
      return res.status(404).json({ error: 'Student not enrolled in any transport' });
    }
    res.json(enrollment);
  } catch (error) {
    logger.error('Error fetching student enrollment:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get route students
 * GET /api/transport/routes/:routeId/students
 */
exports.getRouteStudents = async (req, res) => {
  try {
    const students = await transportService.getRouteStudents(req.params.routeId);
    res.json({ count: students.length, students });
  } catch (error) {
    logger.error('Error fetching route students:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update student enrollment
 * PUT /api/transport/students/:enrollmentId
 */
exports.updateStudentEnrollment = async (req, res) => {
  try {
    const enrollment = await transportService.updateStudentEnrollment(req.params.enrollmentId, req.body);
    res.json({ message: 'Enrollment updated successfully', enrollment });
  } catch (error) {
    logger.error('Error updating enrollment:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark transport fee as paid
 * POST /api/transport/students/:enrollmentId/mark-paid
 */
exports.markTransportFeePaid = async (req, res) => {
  try {
    const enrollment = await transportService.markTransportFeePaid(req.params.enrollmentId);

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'PAYMENT',
        module: 'transport',
        description: `Marked transport fee as paid: ${enrollment.studentId}`,
        resourceId: enrollment.id,
        resourceType: 'student_transport',
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Fee marked as paid', enrollment });
  } catch (error) {
    logger.error('Error marking fee paid:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== MAINTENANCE ====================

/**
 * Add maintenance record
 * POST /api/transport/vehicles/:vehicleId/maintenance
 */
exports.addMaintenanceRecord = async (req, res) => {
  try {
    const { description, cost, date, nextServiceDate, parts, mechanic } = req.body;
    if (!description || !cost) {
      return res.status(400).json({ error: 'Description and cost are required' });
    }

    const record = await transportService.addMaintenanceRecord(req.params.vehicleId, {
      description, cost, date, nextServiceDate, parts, mechanic
    });

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        actionType: 'CREATE',
        module: 'transport',
        description: `Added maintenance record for vehicle`,
        resourceId: record.id,
        resourceType: 'maintenance_record',
        ipAddress: req.ip
      }
    });

    res.status(201).json({ message: 'Maintenance record added', record });
  } catch (error) {
    logger.error('Error adding maintenance record:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get vehicle maintenance history
 * GET /api/transport/vehicles/:vehicleId/maintenance
 */
exports.getVehicleMaintenanceHistory = async (req, res) => {
  try {
    const records = await transportService.getVehicleMaintenanceHistory(req.params.vehicleId);
    res.json(records);
  } catch (error) {
    logger.error('Error fetching maintenance history:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get due maintenance vehicles
 * GET /api/transport/maintenance/due
 */
exports.getDueMaintenanceVehicles = async (req, res) => {
  try {
    const settings = await prisma.transportSettings.findFirst();
    const vehicles = await transportService.getDueMaintenanceVehicles(settings);
    res.json({ count: vehicles.length, vehicles });
  } catch (error) {
    logger.error('Error fetching due maintenance vehicles:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== BOARDING RECORDS ====================

/**
 * Record vehicle boarding
 * POST /api/transport/vehicles/:vehicleId/boarding
 */
exports.recordVehicleBoarding = async (req, res) => {
  try {
    const { studentCount, capacity, remarks } = req.body;
    if (studentCount === undefined || !capacity) {
      return res.status(400).json({ error: 'Student count and capacity are required' });
    }

    const record = await transportService.recordVehicleBoarding(req.params.vehicleId, {
      studentCount, capacity, remarks
    });

    res.status(201).json({ message: 'Boarding recorded', record });
  } catch (error) {
    logger.error('Error recording boarding:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get vehicle boarding statistics
 * GET /api/transport/vehicles/:vehicleId/boarding/stats
 */
exports.getVehicleBoardingStats = async (req, res) => {
  try {
    const { daysBack = 30 } = req.query;
    const stats = await transportService.getVehicleBoardingStats(req.params.vehicleId, parseInt(daysBack));
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching boarding stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== REPORTS ====================

/**
 * Get transport summary
 * GET /api/transport/summary
 */
exports.getTransportSummary = async (req, res) => {
  try {
    const summary = await transportService.getTransportSummary();
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching transport summary:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get fee collection report
 * GET /api/transport/reports/fees
 */
exports.getFeeCollectionReport = async (req, res) => {
  try {
    const report = await transportService.getFeeCollectionReport();

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'EXPORT',
        actionType: 'EXPORT',
        module: 'transport',
        description: 'Exported fee collection report',
        ipAddress: req.ip
      }
    });

    res.json(report);
  } catch (error) {
    logger.error('Error generating fee report:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== SETTINGS ====================

/**
 * Update transport settings
 * PUT /api/transport/settings
 */
exports.updateTransportSettings = async (req, res) => {
  try {
    const { defaultMonthlyFee, lateFeePercentage, maxStudentsPerVehicle, maintenanceCheckInterval, fineForNoBoarding } = req.body;

    let settings = await prisma.transportSettings.findFirst();

    if (!settings) {
      settings = await prisma.transportSettings.create({
        data: {
          defaultMonthlyFee: defaultMonthlyFee || 1000,
          lateFeePercentage: lateFeePercentage || 10,
          maxStudentsPerVehicle: maxStudentsPerVehicle || 50,
          maintenanceCheckInterval: maintenanceCheckInterval || 30,
          fineForNoBoarding: fineForNoBoarding || 100
        }
      });
    } else {
      settings = await prisma.transportSettings.update({
        where: { id: settings.id },
        data: {
          ...(defaultMonthlyFee && { defaultMonthlyFee }),
          ...(lateFeePercentage && { lateFeePercentage }),
          ...(maxStudentsPerVehicle && { maxStudentsPerVehicle }),
          ...(maintenanceCheckInterval && { maintenanceCheckInterval }),
          ...(fineForNoBoarding && { fineForNoBoarding })
        }
      });
    }

    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get transport settings
 * GET /api/transport/settings
 */
exports.getTransportSettings = async (req, res) => {
  try {
    const settings = await prisma.transportSettings.findFirst();
    res.json(settings || {});
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
};
