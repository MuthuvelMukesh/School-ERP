const express = require('express');
const { validateToken, authorize } = require('../middleware/auth.middleware');
const transportController = require('../controllers/transport.controller');

const router = express.Router();

// All transport routes require authentication
router.use(validateToken);

// Roles that can manage transport resources
const TRANSPORT_MANAGERS = ['ADMIN', 'PRINCIPAL', 'TRANSPORT_STAFF'];
// Roles that can view transport info
const TRANSPORT_VIEWERS = ['ADMIN', 'PRINCIPAL', 'TRANSPORT_STAFF', 'TEACHER', 'STUDENT', 'PARENT'];

/**
 * Transport/Bus Management Routes
 * Base: /api/transport
 */

// ==================== VEHICLE MANAGEMENT ====================

/**
 * POST /api/transport/vehicles
 * Add a new vehicle
 * Body: { registrationNo, model, capacity, serviceDate, fuelType, averageMileage, [gpsDeviceId, condition, insuranceExpiry, notes] }
 */
router.post('/vehicles', authorize(...TRANSPORT_MANAGERS), transportController.addVehicle);

/**
 * GET /api/transport/vehicles
 * Get all vehicles with filters
 * Query: [condition, registrationNo, page, limit]
 */
router.get('/vehicles', authorize(...TRANSPORT_VIEWERS), transportController.getAllVehicles);

/**
 * GET /api/transport/vehicles/:vehicleId
 * Get vehicle details with route and assignments
 */
router.get('/vehicles/:vehicleId', authorize(...TRANSPORT_VIEWERS), transportController.getVehicleDetails);

/**
 * PUT /api/transport/vehicles/:vehicleId
 * Update vehicle information
 * Body: { [driverId, conductorId, currentMileage, condition, insuranceExpiry, notes, maintenanceDate] }
 */
router.put('/vehicles/:vehicleId', authorize(...TRANSPORT_MANAGERS), transportController.updateVehicle);

/**
 * POST /api/transport/vehicles/:vehicleId/driver
 * Assign driver to vehicle
 * Body: { staffId }
 */
router.post('/vehicles/:vehicleId/driver', authorize(...TRANSPORT_MANAGERS), transportController.assignDriver);

/**
 * POST /api/transport/vehicles/:vehicleId/conductor
 * Assign conductor to vehicle
 * Body: { staffId }
 */
router.post('/vehicles/:vehicleId/conductor', authorize(...TRANSPORT_MANAGERS), transportController.assignConductor);

// ==================== ROUTE MANAGEMENT ====================

/**
 * POST /api/transport/routes
 * Create a new transport route
 * Body: { name, vehicleId, monthlyFee, [estimatedDuration, notes] }
 */
router.post('/routes', validateToken, transportController.createRoute);

/**
 * GET /api/transport/routes
 * Get all routes with details
 * Query: [page, limit]
 */
router.get('/routes', authorize(...TRANSPORT_VIEWERS), transportController.getAllRoutes);

/**
 * GET /api/transport/routes/:routeId
 * Get route details with stops and students
 */
router.get('/routes/:routeId', authorize(...TRANSPORT_VIEWERS), transportController.getRouteDetails);

/**
 * PUT /api/transport/routes/:routeId
 * Update route
 * Body: { [name, monthlyFee, estimatedDuration, notes] }
 */
router.put('/routes/:routeId', authorize(...TRANSPORT_MANAGERS), transportController.updateRoute);

// ==================== BUS STOPS ====================

/**
 * POST /api/transport/routes/:routeId/stops
 * Add bus stop to route
 * Body: { stopName, location, stopOrder, [latitude, longitude, arrivalTime, estimatedWaitTime] }
 */
router.post('/routes/:routeId/stops', authorize(...TRANSPORT_MANAGERS), transportController.addBusStop);

/**
 * GET /api/transport/routes/:routeId/stops
 * Get all stops for a route
 */
router.get('/routes/:routeId/stops', authorize(...TRANSPORT_VIEWERS), transportController.getRouteStops);

/**
 * PUT /api/transport/stops/:stopId
 * Update bus stop
 * Body: { [stopName, location, latitude, longitude, arrivalTime, estimatedWaitTime] }
 */
router.put('/stops/:stopId', authorize(...TRANSPORT_MANAGERS), transportController.updateBusStop);

/**
 * DELETE /api/transport/stops/:stopId
 * Delete bus stop
 */
router.delete('/stops/:stopId', authorize(...TRANSPORT_MANAGERS), transportController.deleteBusStop);

// ==================== STUDENT TRANSPORT ====================

/**
 * POST /api/transport/students/enroll
 * Enroll student in transport route
 * Body: { studentId, routeId, pickupStop, dropoffStop, [monthlyFee, boardingStatus] }
 */
router.post('/students/enroll', authorize(...TRANSPORT_MANAGERS), transportController.enrollStudent);

/**
 * GET /api/transport/students/:studentId
 * Get student's transport enrollment
 */
router.get('/students/:studentId', authorize(...TRANSPORT_VIEWERS), transportController.getStudentTransportEnrollment);

/**
 * GET /api/transport/routes/:routeId/students
 * Get all students enrolled in a route
 */
router.get('/routes/:routeId/students', authorize(...TRANSPORT_MANAGERS), transportController.getRouteStudents);

/**
 * PUT /api/transport/students/:enrollmentId
 * Update student enrollment
 * Body: { [pickupStop, dropoffStop, monthlyFee, boardingStatus] }
 */
router.put('/students/:enrollmentId', authorize(...TRANSPORT_MANAGERS), transportController.updateStudentEnrollment);

/**
 * POST /api/transport/students/:enrollmentId/mark-paid
 * Mark transport fee as paid
 */
router.post('/students/:enrollmentId/mark-paid', authorize(...TRANSPORT_MANAGERS), transportController.markTransportFeePaid);

// ==================== MAINTENANCE ====================

/**
 * POST /api/transport/vehicles/:vehicleId/maintenance
 * Add maintenance record
 * Body: { description, cost, [date, nextServiceDate, parts, mechanic] }
 */
router.post('/vehicles/:vehicleId/maintenance', authorize(...TRANSPORT_MANAGERS), transportController.addMaintenanceRecord);

/**
 * GET /api/transport/vehicles/:vehicleId/maintenance
 * Get vehicle maintenance history
 */
router.get('/vehicles/:vehicleId/maintenance', authorize(...TRANSPORT_MANAGERS), transportController.getVehicleMaintenanceHistory);

/**
 * GET /api/transport/maintenance/due
 * Get vehicles due for maintenance
 */
router.get('/maintenance/due', authorize(...TRANSPORT_MANAGERS), transportController.getDueMaintenanceVehicles);

// ==================== BOARDING RECORDS ====================

/**
 * POST /api/transport/vehicles/:vehicleId/boarding
 * Record vehicle boarding
 * Body: { studentCount, capacity, [remarks] }
 */
router.post('/vehicles/:vehicleId/boarding', authorize(...TRANSPORT_MANAGERS), transportController.recordVehicleBoarding);

/**
 * GET /api/transport/vehicles/:vehicleId/boarding/stats
 * Get vehicle boarding statistics
 * Query: [daysBack]
 */
router.get('/vehicles/:vehicleId/boarding/stats', authorize(...TRANSPORT_MANAGERS), transportController.getVehicleBoardingStats);

// ==================== REPORTS ====================

/**
 * GET /api/transport/summary
 * Get transport summary statistics
 */
router.get('/summary', authorize(...TRANSPORT_MANAGERS), transportController.getTransportSummary);

/**
 * GET /api/transport/reports/fees
 * Get fee collection report
 */
router.get('/reports/fees', authorize(...TRANSPORT_MANAGERS), transportController.getFeeCollectionReport);

// ==================== SETTINGS ====================

/**
 * PUT /api/transport/settings
 * Update transport settings
 * Body: { [defaultMonthlyFee, lateFeePercentage, maxStudentsPerVehicle, maintenanceCheckInterval, fineForNoBoarding] }
 */
router.put('/settings', authorize('ADMIN', 'TRANSPORT_STAFF'), transportController.updateTransportSettings);

/**
 * GET /api/transport/settings
 * Get transport settings
 */
router.get('/settings', authorize(...TRANSPORT_MANAGERS), transportController.getTransportSettings);

module.exports = router;
