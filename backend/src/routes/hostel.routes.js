const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostel.controller');
const { validateToken } = require('../middleware/auth.middleware');

// Apply token validation to all routes
router.use(validateToken);

// ==================== Hostel Management Routes ====================

/**
 * @route   POST /api/hostel/hostels
 * @desc    Add a new hostel
 * @access  Private (Admin, Principal)
 * @body    { name, type, capacity, wardenId?, address?, contactNo?, facilities?, rules? }
 */
router.post('/hostels', hostelController.addHostel);

/**
 * @route   GET /api/hostel/hostels
 * @desc    Get all hostels with filters
 * @access  Private
 * @query   type?, page?, limit?
 */
router.get('/hostels', hostelController.getAllHostels);

/**
 * @route   GET /api/hostel/hostels/:hostelId
 * @desc    Get hostel details including rooms, students, occupancy
 * @access  Private
 * @params  hostelId
 */
router.get('/hostels/:hostelId', hostelController.getHostelDetails);

/**
 * @route   PUT /api/hostel/hostels/:hostelId
 * @desc    Update hostel information
 * @access  Private (Admin, Principal)
 * @params  hostelId
 * @body    { name?, type?, capacity?, wardenId?, address?, contactNo?, facilities?, rules? }
 */
router.put('/hostels/:hostelId', hostelController.updateHostel);

/**
 * @route   DELETE /api/hostel/hostels/:hostelId
 * @desc    Delete hostel (only if no active students)
 * @access  Private (Admin, Principal)
 * @params  hostelId
 */
router.delete('/hostels/:hostelId', hostelController.deleteHostel);

// ==================== Room Management Routes ====================

/**
 * @route   POST /api/hostel/rooms
 * @desc    Add a new room to a hostel
 * @access  Private (Admin, Principal, Warden)
 * @body    { hostelId, roomNumber, floor?, capacity, type, rentAmount, amenities? }
 */
router.post('/rooms', hostelController.addRoom);

/**
 * @route   GET /api/hostel/hostels/:hostelId/rooms
 * @desc    Get all rooms in a hostel
 * @access  Private
 * @params  hostelId
 * @query   type?, status?
 */
router.get('/hostels/:hostelId/rooms', hostelController.getRoomsByHostel);

/**
 * @route   PUT /api/hostel/rooms/:roomId
 * @desc    Update room details
 * @access  Private (Admin, Principal, Warden)
 * @params  roomId
 * @body    { roomNumber?, floor?, capacity?, type?, rentAmount?, amenities?, status? }
 */
router.put('/rooms/:roomId', hostelController.updateRoom);

/**
 * @route   DELETE /api/hostel/rooms/:roomId
 * @desc    Delete room (only if no occupied beds)
 * @access  Private (Admin, Principal)
 * @params  roomId
 */
router.delete('/rooms/:roomId', hostelController.deleteRoom);

// ==================== Bed Management Routes ====================

/**
 * @route   GET /api/hostel/rooms/:roomId/beds
 * @desc    Get all beds in a room
 * @access  Private
 * @params  roomId
 */
router.get('/rooms/:roomId/beds', hostelController.getBedsByRoom);

/**
 * @route   GET /api/hostel/hostels/:hostelId/beds/vacant
 * @desc    Get all vacant beds in a hostel
 * @access  Private
 * @params  hostelId
 * @query   roomType?
 */
router.get('/hostels/:hostelId/beds/vacant', hostelController.getVacantBeds);

/**
 * @route   PUT /api/hostel/beds/:bedId
 * @desc    Update bed status (OCCUPIED, VACANT, MAINTENANCE)
 * @access  Private (Admin, Warden)
 * @params  bedId
 * @body    { status, studentId? }
 */
router.put('/beds/:bedId', hostelController.updateBedStatus);

// ==================== Student Allocation Routes ====================

/**
 * @route   POST /api/hostel/students/allocate
 * @desc    Allocate student to a hostel bed
 * @access  Private (Admin, Principal, Warden)
 * @body    { studentId, hostelId, roomId, bedId, checkInDate, depositAmount?, monthlyFee?, emergencyContact?, specialRequirements? }
 */
router.post('/students/allocate', hostelController.allocateStudent);

/**
 * @route   POST /api/hostel/students/:allocationId/deallocate
 * @desc    Deallocate student from hostel (check-out)
 * @access  Private (Admin, Principal, Warden)
 * @params  allocationId
 * @body    { checkOutDate, refundDeposit? }
 */
router.post('/students/:allocationId/deallocate', hostelController.deallocateStudent);

/**
 * @route   GET /api/hostel/students/:studentId/allocation
 * @desc    Get student's current hostel allocation
 * @access  Private
 * @params  studentId
 */
router.get('/students/:studentId/allocation', hostelController.getStudentAllocation);

/**
 * @route   GET /api/hostel/hostels/:hostelId/students
 * @desc    Get all students in a hostel
 * @access  Private
 * @params  hostelId
 * @query   includeCheckedOut?
 */
router.get('/hostels/:hostelId/students', hostelController.getHostelStudents);

/**
 * @route   PUT /api/hostel/students/:allocationId
 * @desc    Update student allocation details
 * @access  Private (Admin, Warden)
 * @params  allocationId
 * @body    { monthlyFee?, emergencyContact?, specialRequirements? }
 */
router.put('/students/:allocationId', hostelController.updateStudentAllocation);

/**
 * @route   POST /api/hostel/students/:allocationId/mark-paid
 * @desc    Mark hostel fee as paid for a student
 * @access  Private (Admin, Accountant)
 * @params  allocationId
 */
router.post('/students/:allocationId/mark-paid', hostelController.markHostelFeePaid);

// ==================== Visitor Management Routes ====================

/**
 * @route   POST /api/hostel/visitors
 * @desc    Register a visitor for a student
 * @access  Private (Warden, Security)
 * @body    { studentId, visitorName, relation?, contactNo?, purpose, visitDate, inTime?, outTime? }
 */
router.post('/visitors', hostelController.registerVisitor);

/**
 * @route   GET /api/hostel/students/:studentId/visitors
 * @desc    Get all visitors for a student
 * @access  Private
 * @params  studentId
 * @query   dateFrom?, dateTo?
 */
router.get('/students/:studentId/visitors', hostelController.getVisitorsByStudent);

/**
 * @route   GET /api/hostel/hostels/:hostelId/visitors
 * @desc    Get all visitors for a hostel
 * @access  Private (Warden, Security)
 * @params  hostelId
 * @query   date?, approved?
 */
router.get('/hostels/:hostelId/visitors', hostelController.getVisitorsByHostel);

/**
 * @route   PUT /api/hostel/visitors/:visitorId
 * @desc    Update visitor details
 * @access  Private (Warden, Security)
 * @params  visitorId
 * @body    { inTime?, outTime?, remarks? }
 */
router.put('/visitors/:visitorId', hostelController.updateVisitor);

/**
 * @route   POST /api/hostel/visitors/:visitorId/approve
 * @desc    Approve visitor entry
 * @access  Private (Warden, Security)
 * @params  visitorId
 */
router.post('/visitors/:visitorId/approve', hostelController.approveVisitor);

// ==================== Complaint Management Routes ====================

/**
 * @route   POST /api/hostel/complaints
 * @desc    Register a hostel complaint
 * @access  Private (Students, Warden)
 * @body    { studentId, hostelId, category, subject, description, priority? }
 */
router.post('/complaints', hostelController.registerComplaint);

/**
 * @route   GET /api/hostel/complaints
 * @desc    Get complaints with filters
 * @access  Private
 * @query   hostelId?, studentId?, status?, category?, priority?, page?, limit?
 */
router.get('/complaints', hostelController.getComplaints);

/**
 * @route   PUT /api/hostel/complaints/:complaintId/status
 * @desc    Update complaint status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
 * @access  Private (Admin, Warden)
 * @params  complaintId
 * @body    { status, assignedTo? }
 */
router.put('/complaints/:complaintId/status', hostelController.updateComplaintStatus);

/**
 * @route   POST /api/hostel/complaints/:complaintId/resolve
 * @desc    Resolve a complaint
 * @access  Private (Admin, Warden)
 * @params  complaintId
 * @body    { resolution }
 */
router.post('/complaints/:complaintId/resolve', hostelController.resolveComplaint);

// ==================== Leave Management Routes ====================

/**
 * @route   POST /api/hostel/leaves
 * @desc    Apply for hostel leave
 * @access  Private (Students)
 * @body    { studentId, hostelId, leaveFrom, leaveTo, reason, destination?, contactNo }
 */
router.post('/leaves', hostelController.applyLeave);

/**
 * @route   GET /api/hostel/leaves
 * @desc    Get leave requests
 * @access  Private
 * @query   hostelId?, studentId?, status?, page?, limit?
 */
router.get('/leaves', hostelController.getLeaveRequests);

/**
 * @route   POST /api/hostel/leaves/:leaveId/approve
 * @desc    Approve a leave request
 * @access  Private (Warden, Principal)
 * @params  leaveId
 * @body    { remarks? }
 */
router.post('/leaves/:leaveId/approve', hostelController.approveLeave);

/**
 * @route   POST /api/hostel/leaves/:leaveId/reject
 * @desc    Reject a leave request
 * @access  Private (Warden, Principal)
 * @params  leaveId
 * @body    { remarks }
 */
router.post('/leaves/:leaveId/reject', hostelController.rejectLeave);

// ==================== Notice Management Routes ====================

/**
 * @route   POST /api/hostel/notices
 * @desc    Create a hostel notice
 * @access  Private (Admin, Warden)
 * @body    { hostelId, title, content, priority?, expiryDate? }
 */
router.post('/notices', hostelController.createNotice);

/**
 * @route   GET /api/hostel/hostels/:hostelId/notices
 * @desc    Get notices for a hostel
 * @access  Private
 * @params  hostelId
 * @query   activeOnly?
 */
router.get('/hostels/:hostelId/notices', hostelController.getNotices);

/**
 * @route   PUT /api/hostel/notices/:noticeId
 * @desc    Update a notice
 * @access  Private (Admin, Warden)
 * @params  noticeId
 * @body    { title?, content?, priority?, isActive?, expiryDate? }
 */
router.put('/notices/:noticeId', hostelController.updateNotice);

/**
 * @route   DELETE /api/hostel/notices/:noticeId
 * @desc    Delete a notice
 * @access  Private (Admin, Warden)
 * @params  noticeId
 */
router.delete('/notices/:noticeId', hostelController.deleteNotice);

// ==================== Attendance Routes ====================

/**
 * @route   POST /api/hostel/attendance
 * @desc    Record hostel attendance
 * @access  Private (Warden, Security)
 * @body    { studentId, hostelId, date, isPresent?, remarks? }
 */
router.post('/attendance', hostelController.recordAttendance);

/**
 * @route   GET /api/hostel/hostels/:hostelId/attendance
 * @desc    Get attendance by hostel for a specific date
 * @access  Private
 * @params  hostelId
 * @query   date (required)
 */
router.get('/hostels/:hostelId/attendance', hostelController.getAttendanceByHostel);

/**
 * @route   GET /api/hostel/students/:studentId/attendance
 * @desc    Get attendance history for a student
 * @access  Private
 * @params  studentId
 * @query   dateFrom?, dateTo?
 */
router.get('/students/:studentId/attendance', hostelController.getAttendanceByStudent);

// ==================== Reports Routes ====================

/**
 * @route   GET /api/hostel/summary
 * @desc    Get overall hostel system summary
 * @access  Private (Admin, Principal)
 */
router.get('/summary', hostelController.getHostelSummary);

/**
 * @route   GET /api/hostel/hostels/:hostelId/occupancy-report
 * @desc    Get occupancy report for a hostel
 * @access  Private
 * @params  hostelId
 */
router.get('/hostels/:hostelId/occupancy-report', hostelController.getOccupancyReport);

/**
 * @route   GET /api/hostel/reports/fees
 * @desc    Get fee collection report
 * @access  Private (Admin, Accountant)
 * @query   hostelId?, month?, year?
 */
router.get('/reports/fees', hostelController.getFeeCollectionReport);

// ==================== Settings Routes ====================

/**
 * @route   GET /api/hostel/settings
 * @desc    Get hostel settings
 * @access  Private (Admin)
 */
router.get('/settings', hostelController.getHostelSettings);

/**
 * @route   PUT /api/hostel/settings
 * @desc    Update hostel settings
 * @access  Private (Admin)
 * @body    { defaultMonthlyFee?, defaultDepositAmount?, visitorTimeFrom?, visitorTimeTo?, leaveApprovalRequired?, attendanceRequired? }
 */
router.put('/settings', hostelController.updateHostelSettings);

module.exports = router;
