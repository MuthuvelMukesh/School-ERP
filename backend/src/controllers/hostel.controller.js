const hostelService = require('../utils/hostelService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

// ==================== Hostel Management ====================

exports.addHostel = async (req, res) => {
  try {
    const { name, type, capacity, wardenId, address, contactNo, facilities, rules } = req.body;
    
    if (!name || !type || !capacity) {
      return res.status(400).json({ error: 'Name, type, and capacity are required' });
    }
    
    const hostel = await hostelService.addHostel({
      name,
      type,
      capacity,
      wardenId: wardenId || null,
      address,
      contactNo,
      facilities,
      rules
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'CREATE',
        module: 'hostel',
        description: `Created hostel: ${name}`,
        resourceId: hostel.id,
        ipAddress: req.ip
      }
    });
    
    res.status(201).json({
      message: 'Hostel created successfully',
      hostel
    });
  } catch (error) {
    logger.error('Error in addHostel controller:', error);
    res.status(500).json({ error: 'Failed to create hostel', details: error.message });
  }
};

exports.getAllHostels = async (req, res) => {
  try {
    const { type, page, limit } = req.query;
    
    const result = await hostelService.getAllHostels({
      type,
      page: page || 1,
      limit: limit || 20
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getAllHostels controller:', error);
    res.status(500).json({ error: 'Failed to fetch hostels', details: error.message });
  }
};

exports.getHostelDetails = async (req, res) => {
  try {
    const { hostelId } = req.params;
    
    const hostel = await hostelService.getHostelDetails(hostelId);
    
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }
    
    res.json(hostel);
  } catch (error) {
    logger.error('Error in getHostelDetails controller:', error);
    res.status(500).json({ error: 'Failed to fetch hostel details', details: error.message });
  }
};

exports.updateHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const updateData = req.body;
    
    const hostel = await hostelService.updateHostel(hostelId, updateData);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Updated hostel: ${hostel.name}`,
        resourceId: hostelId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Hostel updated successfully',
      hostel
    });
  } catch (error) {
    logger.error('Error in updateHostel controller:', error);
    res.status(500).json({ error: 'Failed to update hostel', details: error.message });
  }
};

exports.deleteHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;
    
    const result = await hostelService.deleteHostel(hostelId);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'DELETE',
        module: 'hostel',
        description: `Deleted hostel: ${hostelId}`,
        resourceId: hostelId,
        ipAddress: req.ip
      }
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error in deleteHostel controller:', error);
    res.status(500).json({ error: 'Failed to delete hostel', details: error.message });
  }
};

// ==================== Room Management ====================

exports.addRoom = async (req, res) => {
  try {
    const { hostelId, roomNumber, floor, capacity, type, rentAmount, amenities } = req.body;
    
    if (!hostelId || !roomNumber || !capacity || !type || !rentAmount) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    const room = await hostelService.addRoom({
      hostelId,
      roomNumber,
      floor,
      capacity,
      type,
      rentAmount,
      amenities
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'CREATE',
        module: 'hostel',
        description: `Added room ${roomNumber} to hostel`,
        resourceId: room.id,
        ipAddress: req.ip
      }
    });
    
    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    logger.error('Error in addRoom controller:', error);
    res.status(500).json({ error: 'Failed to create room', details: error.message });
  }
};

exports.getRoomsByHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { type, status } = req.query;
    
    const rooms = await hostelService.getRoomsByHostel(hostelId, { type, status });
    
    res.json(rooms);
  } catch (error) {
    logger.error('Error in getRoomsByHostel controller:', error);
    res.status(500).json({ error: 'Failed to fetch rooms', details: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const updateData = req.body;
    
    const room = await hostelService.updateRoom(roomId, updateData);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Updated room ${room.roomNumber}`,
        resourceId: roomId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Room updated successfully',
      room
    });
  } catch (error) {
    logger.error('Error in updateRoom controller:', error);
    res.status(500).json({ error: 'Failed to update room', details: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const result = await hostelService.deleteRoom(roomId);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'DELETE',
        module: 'hostel',
        description: `Deleted room ${roomId}`,
        resourceId: roomId,
        ipAddress: req.ip
      }
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error in deleteRoom controller:', error);
    res.status(500).json({ error: 'Failed to delete room', details: error.message });
  }
};

// ==================== Bed Management ====================

exports.getBedsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const beds = await hostelService.getBedsByRoom(roomId);
    
    res.json(beds);
  } catch (error) {
    logger.error('Error in getBedsByRoom controller:', error);
    res.status(500).json({ error: 'Failed to fetch beds', details: error.message });
  }
};

exports.getVacantBeds = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { roomType } = req.query;
    
    const beds = await hostelService.getVacantBeds(hostelId, roomType);
    
    res.json(beds);
  } catch (error) {
    logger.error('Error in getVacantBeds controller:', error);
    res.status(500).json({ error: 'Failed to fetch vacant beds', details: error.message });
  }
};

exports.updateBedStatus = async (req, res) => {
  try {
    const { bedId } = req.params;
    const { status, studentId } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const bed = await hostelService.updateBedStatus(bedId, status, studentId);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Updated bed ${bedId} status to ${status}`,
        resourceId: bedId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Bed status updated successfully',
      bed
    });
  } catch (error) {
    logger.error('Error in updateBedStatus controller:', error);
    res.status(500).json({ error: 'Failed to update bed status', details: error.message });
  }
};

// ==================== Student Allocation ====================

exports.allocateStudent = async (req, res) => {
  try {
    const { studentId, hostelId, roomId, bedId, checkInDate, depositAmount, monthlyFee, emergencyContact, specialRequirements } = req.body;
    
    if (!studentId || !hostelId || !roomId || !bedId || !checkInDate) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    const allocation = await hostelService.allocateStudent({
      studentId,
      hostelId,
      roomId,
      bedId,
      checkInDate: new Date(checkInDate),
      depositAmount: depositAmount || 5000,
      monthlyFee: monthlyFee || 3000,
      emergencyContact,
      specialRequirements
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'CREATE',
        module: 'hostel',
        description: `Allocated student ${studentId} to hostel`,
        resourceId: allocation.id,
        ipAddress: req.ip
      }
    });
    
    res.status(201).json({
      message: 'Student allocated successfully',
      allocation
    });
  } catch (error) {
    logger.error('Error in allocateStudent controller:', error);
    res.status(500).json({ error: 'Failed to allocate student', details: error.message });
  }
};

exports.deallocateStudent = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const { checkOutDate, refundDeposit } = req.body;
    
    if (!checkOutDate) {
      return res.status(400).json({ error: 'Check-out date is required' });
    }
    
    const allocation = await hostelService.deallocateStudent(
      allocationId,
      new Date(checkOutDate),
      refundDeposit || false
    );
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Deallocated student from hostel`,
        resourceId: allocationId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Student deallocated successfully',
      allocation
    });
  } catch (error) {
    logger.error('Error in deallocateStudent controller:', error);
    res.status(500).json({ error: 'Failed to deallocate student', details: error.message });
  }
};

exports.getStudentAllocation = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const allocation = await hostelService.getStudentAllocation(studentId);
    
    if (!allocation) {
      return res.status(404).json({ error: 'No active allocation found for this student' });
    }
    
    res.json(allocation);
  } catch (error) {
    logger.error('Error in getStudentAllocation controller:', error);
    res.status(500).json({ error: 'Failed to fetch student allocation', details: error.message });
  }
};

exports.getHostelStudents = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { includeCheckedOut } = req.query;
    
    const students = await hostelService.getHostelStudents(
      hostelId,
      includeCheckedOut === 'true'
    );
    
    res.json(students);
  } catch (error) {
    logger.error('Error in getHostelStudents controller:', error);
    res.status(500).json({ error: 'Failed to fetch hostel students', details: error.message });
  }
};

exports.updateStudentAllocation = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const updateData = req.body;
    
    const allocation = await hostelService.updateStudentAllocation(allocationId, updateData);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Updated student allocation`,
        resourceId: allocationId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Student allocation updated successfully',
      allocation
    });
  } catch (error) {
    logger.error('Error in updateStudentAllocation controller:', error);
    res.status(500).json({ error: 'Failed to update student allocation', details: error.message });
  }
};

exports.markHostelFeePaid = async (req, res) => {
  try {
    const { allocationId } = req.params;
    
    const allocation = await hostelService.markHostelFeePaid(allocationId);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Marked hostel fee as paid`,
        resourceId: allocationId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Hostel fee marked as paid',
      allocation
    });
  } catch (error) {
    logger.error('Error in markHostelFeePaid controller:', error);
    res.status(500).json({ error: 'Failed to mark fee as paid', details: error.message });
  }
};

// ==================== Visitor Management ====================

exports.registerVisitor = async (req, res) => {
  try {
    const { studentId, visitorName, relation, contactNo, purpose, visitDate, inTime, outTime } = req.body;
    
    if (!studentId || !visitorName || !purpose || !visitDate) {
      return res.status(400).json({ error: 'Required fields must be provided' });
    }
    
    const visitor = await hostelService.registerVisitor({
      studentId,
      visitorName,
      relation,
      contactNo,
      purpose,
      visitDate: new Date(visitDate),
      inTime: inTime ? new Date(inTime) : null,
      outTime: outTime ? new Date(outTime) : null
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'CREATE',
        module: 'hostel',
        description: `Registered visitor ${visitorName} for student ${studentId}`,
        resourceId: visitor.id,
        ipAddress: req.ip
      }
    });
    
    res.status(201).json({
      message: 'Visitor registered successfully',
      visitor
    });
  } catch (error) {
    logger.error('Error in registerVisitor controller:', error);
    res.status(500).json({ error: 'Failed to register visitor', details: error.message });
  }
};

exports.getVisitorsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { dateFrom, dateTo } = req.query;
    
    const visitors = await hostelService.getVisitorsByStudent(studentId, { dateFrom, dateTo });
    
    res.json(visitors);
  } catch (error) {
    logger.error('Error in getVisitorsByStudent controller:', error);
    res.status(500).json({ error: 'Failed to fetch visitors', details: error.message });
  }
};

exports.getVisitorsByHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { date, approved } = req.query;
    
    const visitors = await hostelService.getVisitorsByHostel(hostelId, { date, approved });
    
    res.json(visitors);
  } catch (error) {
    logger.error('Error in getVisitorsByHostel controller:', error);
    res.status(500).json({ error: 'Failed to fetch visitors', details: error.message });
  }
};

exports.updateVisitor = async (req, res) => {
  try {
    const { visitorId } = req.params;
    const updateData = req.body;
    
    const visitor = await hostelService.updateVisitor(visitorId, updateData);
    
    res.json({
      message: 'Visitor updated successfully',
      visitor
    });
  } catch (error) {
    logger.error('Error in updateVisitor controller:', error);
    res.status(500).json({ error: 'Failed to update visitor', details: error.message });
  }
};

exports.approveVisitor = async (req, res) => {
  try {
    const { visitorId } = req.params;
    const approvedBy = req.user.userId;
    
    const visitor = await hostelService.approveVisitor(visitorId, approvedBy);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'APPROVE',
        module: 'hostel',
        description: `Approved visitor ${visitorId}`,
        resourceId: visitorId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Visitor approved successfully',
      visitor
    });
  } catch (error) {
    logger.error('Error in approveVisitor controller:', error);
    res.status(500).json({ error: 'Failed to approve visitor', details: error.message });
  }
};

// ==================== Complaint Management ====================

exports.registerComplaint = async (req, res) => {
  try {
    const { studentId, hostelId, category, subject, description, priority } = req.body;
    
    if (!studentId || !hostelId || !subject || !description) {
      return res.status(400).json({ error: 'Required fields must be provided' });
    }
    
    const complaint = await hostelService.registerComplaint({
      studentId,
      hostelId,
      category: category || 'OTHER',
      subject,
      description,
      priority: priority || 'MEDIUM'
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'CREATE',
        module: 'hostel',
        description: `Registered complaint: ${subject}`,
        resourceId: complaint.id,
        ipAddress: req.ip
      }
    });
    
    res.status(201).json({
      message: 'Complaint registered successfully',
      complaint
    });
  } catch (error) {
    logger.error('Error in registerComplaint controller:', error);
    res.status(500).json({ error: 'Failed to register complaint', details: error.message });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const { hostelId, studentId, status, category, priority, page, limit } = req.query;
    
    const result = await hostelService.getComplaints({
      hostelId,
      studentId,
      status,
      category,
      priority,
      page: page || 1,
      limit: limit || 20
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getComplaints controller:', error);
    res.status(500).json({ error: 'Failed to fetch complaints', details: error.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, assignedTo } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const complaint = await hostelService.updateComplaintStatus(complaintId, status, assignedTo);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Updated complaint ${complaintId} status to ${status}`,
        resourceId: complaintId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Complaint status updated successfully',
      complaint
    });
  } catch (error) {
    logger.error('Error in updateComplaintStatus controller:', error);
    res.status(500).json({ error: 'Failed to update complaint status', details: error.message });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { resolution } = req.body;
    
    if (!resolution) {
      return res.status(400).json({ error: 'Resolution is required' });
    }
    
    const complaint = await hostelService.resolveComplaint(complaintId, resolution);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Resolved complaint ${complaintId}`,
        resourceId: complaintId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Complaint resolved successfully',
      complaint
    });
  } catch (error) {
    logger.error('Error in resolveComplaint controller:', error);
    res.status(500).json({ error: 'Failed to resolve complaint', details: error.message });
  }
};

// ==================== Leave Management ====================

exports.applyLeave = async (req, res) => {
  try {
    const { studentId, hostelId, leaveFrom, leaveTo, reason, destination, contactNo } = req.body;
    
    if (!studentId || !hostelId || !leaveFrom || !leaveTo || !reason || !contactNo) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    const leave = await hostelService.applyLeave({
      studentId,
      hostelId,
      leaveFrom: new Date(leaveFrom),
      leaveTo: new Date(leaveTo),
      reason,
      destination,
      contactNo
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'CREATE',
        module: 'hostel',
        description: `Applied for hostel leave`,
        resourceId: leave.id,
        ipAddress: req.ip
      }
    });
    
    res.status(201).json({
      message: 'Leave application submitted successfully',
      leave
    });
  } catch (error) {
    logger.error('Error in applyLeave controller:', error);
    res.status(500).json({ error: 'Failed to apply leave', details: error.message });
  }
};

exports.getLeaveRequests = async (req, res) => {
  try {
    const { hostelId, studentId, status, page, limit } = req.query;
    
    const result = await hostelService.getLeaveRequests({
      hostelId,
      studentId,
      status,
      page: page || 1,
      limit: limit || 20
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getLeaveRequests controller:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests', details: error.message });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { remarks } = req.body;
    const approvedBy = req.user.userId;
    
    const leave = await hostelService.approveLeave(leaveId, approvedBy, remarks);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'APPROVE',
        module: 'hostel',
        description: `Approved hostel leave ${leaveId}`,
        resourceId: leaveId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Leave approved successfully',
      leave
    });
  } catch (error) {
    logger.error('Error in approveLeave controller:', error);
    res.status(500).json({ error: 'Failed to approve leave', details: error.message });
  }
};

exports.rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { remarks } = req.body;
    const approvedBy = req.user.userId;
    
    if (!remarks) {
      return res.status(400).json({ error: 'Remarks are required for rejection' });
    }
    
    const leave = await hostelService.rejectLeave(leaveId, approvedBy, remarks);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'REJECT',
        module: 'hostel',
        description: `Rejected hostel leave ${leaveId}`,
        resourceId: leaveId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Leave rejected successfully',
      leave
    });
  } catch (error) {
    logger.error('Error in rejectLeave controller:', error);
    res.status(500).json({ error: 'Failed to reject leave', details: error.message });
  }
};

// ==================== Notice Management ====================

exports.createNotice = async (req, res) => {
  try {
    const { hostelId, title, content, priority, expiryDate } = req.body;
    const createdBy = req.user.userId;
    
    if (!hostelId || !title || !content) {
      return res.status(400).json({ error: 'Hostel ID, title, and content are required' });
    }
    
    const notice = await hostelService.createNotice({
      hostelId,
      title,
      content,
      priority: priority || 'NORMAL',
      createdBy,
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'CREATE',
        module: 'hostel',
        description: `Created notice: ${title}`,
        resourceId: notice.id,
        ipAddress: req.ip
      }
    });
    
    res.status(201).json({
      message: 'Notice created successfully',
      notice
    });
  } catch (error) {
    logger.error('Error in createNotice controller:', error);
    res.status(500).json({ error: 'Failed to create notice', details: error.message });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { activeOnly } = req.query;
    
    const notices = await hostelService.getNotices(
      hostelId,
      activeOnly !== 'false'
    );
    
    res.json(notices);
  } catch (error) {
    logger.error('Error in getNotices controller:', error);
    res.status(500).json({ error: 'Failed to fetch notices', details: error.message });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const updateData = req.body;
    
    const notice = await hostelService.updateNotice(noticeId, updateData);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Updated notice ${noticeId}`,
        resourceId: noticeId,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Notice updated successfully',
      notice
    });
  } catch (error) {
    logger.error('Error in updateNotice controller:', error);
    res.status(500).json({ error: 'Failed to update notice', details: error.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    
    const result = await hostelService.deleteNotice(noticeId);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'DELETE',
        module: 'hostel',
        description: `Deleted notice ${noticeId}`,
        resourceId: noticeId,
        ipAddress: req.ip
      }
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error in deleteNotice controller:', error);
    res.status(500).json({ error: 'Failed to delete notice', details: error.message });
  }
};

// ==================== Attendance ====================

exports.recordAttendance = async (req, res) => {
  try {
    const { studentId, hostelId, date, isPresent, remarks } = req.body;
    const recordedBy = req.user.userId;
    
    if (!studentId || !hostelId || !date) {
      return res.status(400).json({ error: 'Student ID, hostel ID, and date are required' });
    }
    
    const attendance = await hostelService.recordAttendance({
      studentId,
      hostelId,
      date: new Date(date),
      isPresent: isPresent !== undefined ? isPresent : true,
      remarks,
      recordedBy
    });
    
    res.status(201).json({
      message: 'Attendance recorded successfully',
      attendance
    });
  } catch (error) {
    logger.error('Error in recordAttendance controller:', error);
    res.status(500).json({ error: 'Failed to record attendance', details: error.message });
  }
};

exports.getAttendanceByHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const attendance = await hostelService.getAttendanceByHostel(hostelId, date);
    
    res.json(attendance);
  } catch (error) {
    logger.error('Error in getAttendanceByHostel controller:', error);
    res.status(500).json({ error: 'Failed to fetch attendance', details: error.message });
  }
};

exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { dateFrom, dateTo } = req.query;
    
    const attendance = await hostelService.getAttendanceByStudent(studentId, { dateFrom, dateTo });
    
    res.json(attendance);
  } catch (error) {
    logger.error('Error in getAttendanceByStudent controller:', error);
    res.status(500).json({ error: 'Failed to fetch attendance', details: error.message });
  }
};

// ==================== Reports ====================

exports.getHostelSummary = async (req, res) => {
  try {
    const summary = await hostelService.getHostelSummary();
    
    res.json(summary);
  } catch (error) {
    logger.error('Error in getHostelSummary controller:', error);
    res.status(500).json({ error: 'Failed to generate summary', details: error.message });
  }
};

exports.getOccupancyReport = async (req, res) => {
  try {
    const { hostelId } = req.params;
    
    const report = await hostelService.getOccupancyReport(hostelId);
    
    res.json(report);
  } catch (error) {
    logger.error('Error in getOccupancyReport controller:', error);
    res.status(500).json({ error: 'Failed to generate occupancy report', details: error.message });
  }
};

exports.getFeeCollectionReport = async (req, res) => {
  try {
    const { hostelId, month, year } = req.query;
    
    const report = await hostelService.getFeeCollectionReport(
      hostelId,
      month ? parseInt(month) : null,
      year ? parseInt(year) : null
    );
    
    res.json(report);
  } catch (error) {
    logger.error('Error in getFeeCollectionReport controller:', error);
    res.status(500).json({ error: 'Failed to generate fee collection report', details: error.message });
  }
};

// ==================== Settings ====================

exports.getHostelSettings = async (req, res) => {
  try {
    const settings = await hostelService.getHostelSettings();
    
    res.json(settings);
  } catch (error) {
    logger.error('Error in getHostelSettings controller:', error);
    res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
  }
};

exports.updateHostelSettings = async (req, res) => {
  try {
    const settingsData = req.body;
    
    const settings = await hostelService.updateHostelSettings(settingsData);
    
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        module: 'hostel',
        description: `Updated hostel settings`,
        ipAddress: req.ip
      }
    });
    
    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    logger.error('Error in updateHostelSettings controller:', error);
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  }
};
