const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostel.controller');
const {
	validateToken,
	authorize,
	requireOwnership,
	requireBodyOwnership,
	requireQueryOwnership
} = require('../middleware/auth.middleware');

// Apply token validation to all routes
router.use(validateToken);

const HOSTEL_MANAGERS = ['ADMIN', 'PRINCIPAL'];
const HOSTEL_FINANCE = ['ADMIN', 'PRINCIPAL', 'ACCOUNTANT'];
const HOSTEL_VIEWERS = [
	'ADMIN',
	'PRINCIPAL',
	'TEACHER',
	'STUDENT',
	'PARENT',
	'ACCOUNTANT',
	'LIBRARIAN',
	'TRANSPORT_STAFF'
];

// ==================== Hostel Management Routes ====================

/**
 * @route   POST /api/hostel/hostels
 * @desc    Add a new hostel
 * @access  Private (Admin, Principal)
 * @body    { name, type, capacity, wardenId?, address?, contactNo?, facilities?, rules? }
 */
router.post('/hostels', authorize(...HOSTEL_MANAGERS), hostelController.addHostel);

/**
 * @route   GET /api/hostel/hostels
 * @desc    Get all hostels with filters
 * @access  Private
 * @query   type?, page?, limit?
 */
router.get('/hostels', authorize(...HOSTEL_VIEWERS), hostelController.getAllHostels);

/**
 * @route   GET /api/hostel/hostels/:hostelId
 * @desc    Get hostel details including rooms, students, occupancy
 * @access  Private
 * @params  hostelId
 */
router.get('/hostels/:hostelId', authorize(...HOSTEL_MANAGERS), hostelController.getHostelDetails);

/**
 * @route   PUT /api/hostel/hostels/:hostelId
 * @desc    Update hostel information
 * @access  Private (Admin, Principal)
 * @params  hostelId
 * @body    { name?, type?, capacity?, wardenId?, address?, contactNo?, facilities?, rules? }
 */
router.put('/hostels/:hostelId', authorize(...HOSTEL_MANAGERS), hostelController.updateHostel);

/**
 * @route   DELETE /api/hostel/hostels/:hostelId
 * @desc    Delete hostel (only if no active students)
 * @access  Private (Admin, Principal)
 * @params  hostelId
 */
router.delete('/hostels/:hostelId', authorize(...HOSTEL_MANAGERS), hostelController.deleteHostel);

// ==================== Room Management Routes ====================

/**
 * @route   POST /api/hostel/rooms
 * @desc    Add a new room to a hostel
 * @access  Private (Admin, Principal, Warden)
 * @body    { hostelId, roomNumber, floor?, capacity, type, rentAmount, amenities? }
 */
router.post('/rooms', authorize(...HOSTEL_MANAGERS), hostelController.addRoom);

/**
 * @route   GET /api/hostel/hostels/:hostelId/rooms
 * @desc    Get all rooms in a hostel
 * @access  Private
 * @params  hostelId
 * @query   type?, status?
 */
router.get('/hostels/:hostelId/rooms', authorize(...HOSTEL_MANAGERS), hostelController.getRoomsByHostel);

/**
 * @route   PUT /api/hostel/rooms/:roomId
 * @desc    Update room details
 * @access  Private (Admin, Principal, Warden)
 * @params  roomId
 * @body    { roomNumber?, floor?, capacity?, type?, rentAmount?, amenities?, status? }
 */
router.put('/rooms/:roomId', authorize(...HOSTEL_MANAGERS), hostelController.updateRoom);

/**
 * @route   DELETE /api/hostel/rooms/:roomId
 * @desc    Delete room (only if no occupied beds)
 * @access  Private (Admin, Principal)
 * @params  roomId
 */
router.delete('/rooms/:roomId', authorize(...HOSTEL_MANAGERS), hostelController.deleteRoom);

// ==================== Bed Management Routes ====================

/**
 * @route   GET /api/hostel/rooms/:roomId/beds
 * @desc    Get all beds in a room
 * @access  Private
 * @params  roomId
 */
router.get('/rooms/:roomId/beds', authorize(...HOSTEL_MANAGERS), hostelController.getBedsByRoom);

/**
 * @route   GET /api/hostel/hostels/:hostelId/beds/vacant
 * @desc    Get all vacant beds in a hostel
 * @access  Private
 * @params  hostelId
 * @query   roomType?
 */
router.get('/hostels/:hostelId/beds/vacant', authorize(...HOSTEL_MANAGERS), hostelController.getVacantBeds);

/**
 * @route   PUT /api/hostel/beds/:bedId
 * @desc    Update bed status (OCCUPIED, VACANT, MAINTENANCE)
 * @access  Private (Admin, Warden)
 * @params  bedId
 * @body    { status, studentId? }
 */
router.put('/beds/:bedId', authorize(...HOSTEL_MANAGERS), hostelController.updateBedStatus);

// ==================== Student Allocation Routes ====================

/**
 * @route   POST /api/hostel/students/allocate
 * @desc    Allocate student to a hostel bed
 * @access  Private (Admin, Principal, Warden)
 * @body    { studentId, hostelId, roomId, bedId, checkInDate, depositAmount?, monthlyFee?, emergencyContact?, specialRequirements? }
 */
router.post('/students/allocate', authorize(...HOSTEL_MANAGERS), hostelController.allocateStudent);

/**
 * @route   POST /api/hostel/students/:allocationId/deallocate
 * @desc    Deallocate student from hostel (check-out)
 * @access  Private (Admin, Principal, Warden)
 * @params  allocationId
 * @body    { checkOutDate, refundDeposit? }
 */
router.post('/students/:allocationId/deallocate', authorize(...HOSTEL_MANAGERS), hostelController.deallocateStudent);

/**
 * @route   GET /api/hostel/students/:studentId/allocation
 * @desc    Get student's current hostel allocation
 * @access  Private
 * @params  studentId
 */
router.get('/students/:studentId/allocation', requireOwnership('studentId', ['ADMIN', 'PRINCIPAL']), hostelController.getStudentAllocation);

/**
 * @route   GET /api/hostel/hostels/:hostelId/students
 * @desc    Get all students in a hostel
 * @access  Private
 * @params  hostelId
 * @query   includeCheckedOut?
 */
router.get('/hostels/:hostelId/students', authorize(...HOSTEL_MANAGERS), hostelController.getHostelStudents);

/**
 * @route   PUT /api/hostel/students/:allocationId
 * @desc    Update student allocation details
 * @access  Private (Admin, Warden)
 * @params  allocationId
 * @body    { monthlyFee?, emergencyContact?, specialRequirements? }
 */
router.put('/students/:allocationId', authorize(...HOSTEL_MANAGERS), hostelController.updateStudentAllocation);

/**
 * @route   POST /api/hostel/students/:allocationId/mark-paid
 * @desc    Mark hostel fee as paid for a student
 * @access  Private (Admin, Accountant)
 * @params  allocationId
 */
router.post('/students/:allocationId/mark-paid', authorize(...HOSTEL_FINANCE), hostelController.markHostelFeePaid);

// ==================== Visitor Management Routes ====================

/**
 * @route   POST /api/hostel/visitors
 * @desc    Register a visitor for a student
 * @access  Private (Warden, Security)
 * @body    { studentId, visitorName, relation?, contactNo?, purpose, visitDate, inTime?, outTime? }
 */
router.post(
	'/visitors',
	authorize('STUDENT', 'PARENT', ...HOSTEL_MANAGERS),
	requireBodyOwnership('studentId', ['ADMIN', 'PRINCIPAL']),
	hostelController.registerVisitor
);

/**
 * @route   GET /api/hostel/students/:studentId/visitors
 * @desc    Get all visitors for a student
 * @access  Private
 * @params  studentId
 * @query   dateFrom?, dateTo?
 */
router.get('/students/:studentId/visitors', requireOwnership('studentId', ['ADMIN', 'PRINCIPAL']), hostelController.getVisitorsByStudent);

/**
 * @route   GET /api/hostel/hostels/:hostelId/visitors
 * @desc    Get all visitors for a hostel
 * @access  Private (Warden, Security)
 * @params  hostelId
 * @query   date?, approved?
 */
router.get('/hostels/:hostelId/visitors', authorize(...HOSTEL_MANAGERS), hostelController.getVisitorsByHostel);

/**
 * @route   PUT /api/hostel/visitors/:visitorId
 * @desc    Update visitor details
 * @access  Private (Warden, Security)
 * @params  visitorId
 * @body    { inTime?, outTime?, remarks? }
 */
router.put('/visitors/:visitorId', authorize(...HOSTEL_MANAGERS), hostelController.updateVisitor);

/**
 * @route   POST /api/hostel/visitors/:visitorId/approve
 * @desc    Approve visitor entry
 * @access  Private (Warden, Security)
 * @params  visitorId
 */
router.post('/visitors/:visitorId/approve', authorize(...HOSTEL_MANAGERS), hostelController.approveVisitor);

// ==================== Complaint Management Routes ====================

/**
 * @route   POST /api/hostel/complaints
 * @desc    Register a hostel complaint
 * @access  Private (Students, Warden)
 * @body    { studentId, hostelId, category, subject, description, priority? }
 */
router.post(
	'/complaints',
	authorize('STUDENT', 'PARENT', ...HOSTEL_MANAGERS),
	requireBodyOwnership('studentId', ['ADMIN', 'PRINCIPAL']),
	hostelController.registerComplaint
);

/**
 * @route   GET /api/hostel/complaints
 * @desc    Get complaints with filters
 * @access  Private
 * @query   hostelId?, studentId?, status?, category?, priority?, page?, limit?
 */
router.get(
	'/complaints',
	authorize('ADMIN', 'PRINCIPAL', 'STUDENT', 'PARENT'),
	requireQueryOwnership('studentId', ['ADMIN', 'PRINCIPAL']),
	hostelController.getComplaints
);

/**
 * @route   PUT /api/hostel/complaints/:complaintId/status
 * @desc    Update complaint status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
 * @access  Private (Admin, Warden)
 * @params  complaintId
 * @body    { status, assignedTo? }
 */
router.put('/complaints/:complaintId/status', authorize(...HOSTEL_MANAGERS), hostelController.updateComplaintStatus);

/**
 * @route   POST /api/hostel/complaints/:complaintId/resolve
 * @desc    Resolve a complaint
 * @access  Private (Admin, Warden)
 * @params  complaintId
 * @body    { resolution }
 */
router.post('/complaints/:complaintId/resolve', authorize(...HOSTEL_MANAGERS), hostelController.resolveComplaint);

// ==================== Leave Management Routes ====================

/**
 * @route   POST /api/hostel/leaves
 * @desc    Apply for hostel leave
 * @access  Private (Students)
 * @body    { studentId, hostelId, leaveFrom, leaveTo, reason, destination?, contactNo }
 */
router.post(
	'/leaves',
	authorize('STUDENT', 'PARENT'),
	requireBodyOwnership('studentId', ['ADMIN', 'PRINCIPAL']),
	hostelController.applyLeave
);

/**
 * @route   GET /api/hostel/leaves
 * @desc    Get leave requests
 * @access  Private
 * @query   hostelId?, studentId?, status?, page?, limit?
 */
router.get(
	'/leaves',
	authorize('ADMIN', 'PRINCIPAL', 'STUDENT', 'PARENT'),
	requireQueryOwnership('studentId', ['ADMIN', 'PRINCIPAL']),
	hostelController.getLeaveRequests
);

/**
 * @route   POST /api/hostel/leaves/:leaveId/approve
 * @desc    Approve a leave request
 * @access  Private (Warden, Principal)
 * @params  leaveId
 * @body    { remarks? }
 */
router.post('/leaves/:leaveId/approve', authorize(...HOSTEL_MANAGERS), hostelController.approveLeave);

/**
 * @route   POST /api/hostel/leaves/:leaveId/reject
 * @desc    Reject a leave request
 * @access  Private (Warden, Principal)
 * @params  leaveId
 * @body    { remarks }
 */
router.post('/leaves/:leaveId/reject', authorize(...HOSTEL_MANAGERS), hostelController.rejectLeave);

// ==================== Notice Management Routes ====================

/**
 * @route   POST /api/hostel/notices
 * @desc    Create a hostel notice
 * @access  Private (Admin, Warden)
 * @body    { hostelId, title, content, priority?, expiryDate? }
 */
router.post('/notices', authorize(...HOSTEL_MANAGERS), hostelController.createNotice);

/**
 * @route   GET /api/hostel/hostels/:hostelId/notices
 * @desc    Get notices for a hostel
 * @access  Private
 * @params  hostelId
 * @query   activeOnly?
 */
router.get('/hostels/:hostelId/notices', authorize(...HOSTEL_VIEWERS), hostelController.getNotices);

/**
 * @route   PUT /api/hostel/notices/:noticeId
 * @desc    Update a notice
 * @access  Private (Admin, Warden)
 * @params  noticeId
 * @body    { title?, content?, priority?, isActive?, expiryDate? }
 */
router.put('/notices/:noticeId', authorize(...HOSTEL_MANAGERS), hostelController.updateNotice);

/**
 * @route   DELETE /api/hostel/notices/:noticeId
 * @desc    Delete a notice
 * @access  Private (Admin, Warden)
 * @params  noticeId
 */
router.delete('/notices/:noticeId', authorize(...HOSTEL_MANAGERS), hostelController.deleteNotice);

// ==================== Attendance Routes ====================

/**
 * @route   POST /api/hostel/attendance
 * @desc    Record hostel attendance
 * @access  Private (Warden, Security)
 * @body    { studentId, hostelId, date, isPresent?, remarks? }
 */
router.post('/attendance', authorize(...HOSTEL_MANAGERS), hostelController.recordAttendance);

/**
 * @route   GET /api/hostel/hostels/:hostelId/attendance
 * @desc    Get attendance by hostel for a specific date
 * @access  Private
 * @params  hostelId
 * @query   date (required)
 */
router.get('/hostels/:hostelId/attendance', authorize(...HOSTEL_MANAGERS), hostelController.getAttendanceByHostel);

/**
 * @route   GET /api/hostel/students/:studentId/attendance
 * @desc    Get attendance history for a student
 * @access  Private
 * @params  studentId
 * @query   dateFrom?, dateTo?
 */
router.get('/students/:studentId/attendance', requireOwnership('studentId', ['ADMIN', 'PRINCIPAL']), hostelController.getAttendanceByStudent);

// ==================== Reports Routes ====================

/**
 * @route   GET /api/hostel/summary
 * @desc    Get overall hostel system summary
 * @access  Private (Admin, Principal)
 */
router.get('/summary', authorize('ADMIN', 'PRINCIPAL'), hostelController.getHostelSummary);

/**
 * @route   GET /api/hostel/hostels/:hostelId/occupancy-report
 * @desc    Get occupancy report for a hostel
 * @access  Private
 * @params  hostelId
 */
router.get('/hostels/:hostelId/occupancy-report', authorize(...HOSTEL_MANAGERS), hostelController.getOccupancyReport);

/**
 * @route   GET /api/hostel/reports/fees
 * @desc    Get fee collection report
 * @access  Private (Admin, Accountant)
 * @query   hostelId?, month?, year?
 */
router.get('/reports/fees', authorize(...HOSTEL_FINANCE), hostelController.getFeeCollectionReport);

// ==================== Settings Routes ====================

/**
 * @route   GET /api/hostel/settings
 * @desc    Get hostel settings
 * @access  Private (Admin)
 */
router.get('/settings', authorize('ADMIN'), hostelController.getHostelSettings);

/**
 * @route   PUT /api/hostel/settings
 * @desc    Update hostel settings
 * @access  Private (Admin)
 * @body    { defaultMonthlyFee?, defaultDepositAmount?, visitorTimeFrom?, visitorTimeTo?, leaveApprovalRequired?, attendanceRequired? }
 */
router.put('/settings', authorize('ADMIN'), hostelController.updateHostelSettings);

module.exports = router;
