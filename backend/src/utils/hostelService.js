const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('./logger');

// ==================== Hostel Management ====================

/**
 * Add a new hostel
 */
async function addHostel(hostelData) {
  try {
    const hostel = await prisma.hostel.create({
      data: hostelData,
      include: {
        warden: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        }
      }
    });
    
    logger.info(`Hostel created: ${hostel.name} (ID: ${hostel.id})`);
    return hostel;
  } catch (error) {
    logger.error('Error creating hostel:', error);
    throw error;
  }
}

/**
 * Get all hostels with optional filtering
 */
async function getAllHostels(filters = {}) {
  try {
    const { type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (type) where.type = type;
    
    const [hostels, total] = await Promise.all([
      prisma.hostel.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          warden: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          _count: {
            select: {
              rooms: true,
              students: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.hostel.count({ where })
    ]);
    
    // Calculate occupancy for each hostel
    const hostelsWithOccupancy = await Promise.all(
      hostels.map(async (hostel) => {
        const occupiedBeds = await prisma.hostelBed.count({
          where: {
            room: { hostelId: hostel.id },
            status: 'OCCUPIED'
          }
        });
        
        const totalBeds = await prisma.hostelBed.count({
          where: {
            room: { hostelId: hostel.id }
          }
        });
        
        return {
          ...hostel,
          occupancy: {
            occupied: occupiedBeds,
            total: totalBeds,
            percentage: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
          }
        };
      })
    );
    
    return {
      data: hostelsWithOccupancy,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching hostels:', error);
    throw error;
  }
}

/**
 * Get detailed hostel information
 */
async function getHostelDetails(hostelId) {
  try {
    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        warden: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            designation: true
          }
        },
        rooms: {
          include: {
            beds: true,
            _count: {
              select: {
                beds: true
              }
            }
          }
        },
        students: {
          include: {
            hostel: {
              select: {
                name: true
              }
            }
          },
          where: {
            checkOutDate: null
          }
        },
        _count: {
          select: {
            rooms: true,
            students: true,
            notices: true
          }
        }
      }
    });
    
    if (!hostel) {
      throw new Error('Hostel not found');
    }
    
    // Calculate detailed occupancy
    const totalBeds = await prisma.hostelBed.count({
      where: {
        room: { hostelId }
      }
    });
    
    const occupiedBeds = await prisma.hostelBed.count({
      where: {
        room: { hostelId },
        status: 'OCCUPIED'
      }
    });
    
    const vacantBeds = await prisma.hostelBed.count({
      where: {
        room: { hostelId },
        status: 'VACANT'
      }
    });
    
    return {
      ...hostel,
      occupancy: {
        total: totalBeds,
        occupied: occupiedBeds,
        vacant: vacantBeds,
        percentage: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
      }
    };
  } catch (error) {
    logger.error('Error fetching hostel details:', error);
    throw error;
  }
}

/**
 * Update hostel information
 */
async function updateHostel(hostelId, updateData) {
  try {
    const hostel = await prisma.hostel.update({
      where: { id: hostelId },
      data: updateData,
      include: {
        warden: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    logger.info(`Hostel updated: ${hostel.name} (ID: ${hostelId})`);
    return hostel;
  } catch (error) {
    logger.error('Error updating hostel:', error);
    throw error;
  }
}

/**
 * Delete hostel (soft delete by checking dependencies)
 */
async function deleteHostel(hostelId) {
  try {
    // Check if hostel has active students
    const activeStudents = await prisma.hostelStudent.count({
      where: {
        hostelId,
        checkOutDate: null
      }
    });
    
    if (activeStudents > 0) {
      throw new Error('Cannot delete hostel with active students');
    }
    
    await prisma.hostel.delete({
      where: { id: hostelId }
    });
    
    logger.info(`Hostel deleted: ${hostelId}`);
    return { message: 'Hostel deleted successfully' };
  } catch (error) {
    logger.error('Error deleting hostel:', error);
    throw error;
  }
}

// ==================== Room Management ====================

/**
 * Add a new room to a hostel
 */
async function addRoom(roomData) {
  try {
    // Create room
    const room = await prisma.hostelRoom.create({
      data: roomData,
      include: {
        hostel: {
          select: {
            name: true
          }
        }
      }
    });
    
    // Auto-create beds based on capacity
    const beds = [];
    for (let i = 1; i <= roomData.capacity; i++) {
      beds.push({
        roomId: room.id,
        bedNo: i,
        status: 'VACANT'
      });
    }
    
    await prisma.hostelBed.createMany({
      data: beds
    });
    
    logger.info(`Room created: ${room.roomNumber} with ${roomData.capacity} beds`);
    return room;
  } catch (error) {
    logger.error('Error creating room:', error);
    throw error;
  }
}

/**
 * Get rooms by hostel
 */
async function getRoomsByHostel(hostelId, filters = {}) {
  try {
    const { type, status } = filters;
    
    const where = { hostelId };
    if (type) where.type = type;
    if (status) where.status = status;
    
    const rooms = await prisma.hostelRoom.findMany({
      where,
      include: {
        beds: true,
        _count: {
          select: {
            beds: true
          }
        }
      },
      orderBy: [
        { floor: 'asc' },
        { roomNumber: 'asc' }
      ]
    });
    
    // Add occupancy info to each room
    const roomsWithOccupancy = rooms.map(room => {
      const occupiedBeds = room.beds.filter(bed => bed.status === 'OCCUPIED').length;
      const vacantBeds = room.beds.filter(bed => bed.status === 'VACANT').length;
      
      return {
        ...room,
        occupancy: {
          occupied: occupiedBeds,
          vacant: vacantBeds,
          total: room.beds.length,
          percentage: room.beds.length > 0 ? Math.round((occupiedBeds / room.beds.length) * 100) : 0
        }
      };
    });
    
    return roomsWithOccupancy;
  } catch (error) {
    logger.error('Error fetching rooms:', error);
    throw error;
  }
}

/**
 * Update room details
 */
async function updateRoom(roomId, updateData) {
  try {
    const room = await prisma.hostelRoom.update({
      where: { id: roomId },
      data: updateData
    });
    
    logger.info(`Room updated: ${room.roomNumber}`);
    return room;
  } catch (error) {
    logger.error('Error updating room:', error);
    throw error;
  }
}

/**
 * Delete room (if no active allocations)
 */
async function deleteRoom(roomId) {
  try {
    // Check if room has occupied beds
    const occupiedBeds = await prisma.hostelBed.count({
      where: {
        roomId,
        status: 'OCCUPIED'
      }
    });
    
    if (occupiedBeds > 0) {
      throw new Error('Cannot delete room with occupied beds');
    }
    
    // Delete beds first, then room (cascade will handle this)
    await prisma.hostelRoom.delete({
      where: { id: roomId }
    });
    
    logger.info(`Room deleted: ${roomId}`);
    return { message: 'Room deleted successfully' };
  } catch (error) {
    logger.error('Error deleting room:', error);
    throw error;
  }
}

// ==================== Bed Management ====================

/**
 * Get beds by room
 */
async function getBedsByRoom(roomId) {
  try {
    const beds = await prisma.hostelBed.findMany({
      where: { roomId },
      orderBy: { bedNo: 'asc' }
    });
    
    return beds;
  } catch (error) {
    logger.error('Error fetching beds:', error);
    throw error;
  }
}

/**
 * Update bed status
 */
async function updateBedStatus(bedId, status, studentId = null) {
  try {
    const bed = await prisma.hostelBed.update({
      where: { id: bedId },
      data: {
        status,
        studentId
      }
    });
    
    logger.info(`Bed ${bedId} status updated to ${status}`);
    return bed;
  } catch (error) {
    logger.error('Error updating bed status:', error);
    throw error;
  }
}

/**
 * Find vacant beds in a hostel
 */
async function getVacantBeds(hostelId, roomType = null) {
  try {
    const where = {
      room: { hostelId },
      status: 'VACANT'
    };
    
    if (roomType) {
      where.room = {
        ...where.room,
        type: roomType
      };
    }
    
    const vacantBeds = await prisma.hostelBed.findMany({
      where,
      include: {
        room: {
          select: {
            roomNumber: true,
            type: true,
            floor: true,
            hostelId: true
          }
        }
      },
      orderBy: {
        room: {
          roomNumber: 'asc'
        }
      }
    });
    
    return vacantBeds;
  } catch (error) {
    logger.error('Error fetching vacant beds:', error);
    throw error;
  }
}

// ==================== Student Allocation ====================

/**
 * Allocate student to hostel bed
 */
async function allocateStudent(allocationData) {
  try {
    const { studentId, hostelId, roomId, bedId, checkInDate, depositAmount, monthlyFee, emergencyContact, specialRequirements } = allocationData;
    
    // Check if student already allocated to this hostel
    const existingAllocation = await prisma.hostelStudent.findFirst({
      where: {
        studentId,
        hostelId,
        checkOutDate: null
      }
    });
    
    if (existingAllocation) {
      throw new Error('Student is already allocated to this hostel');
    }
    
    // Check if bed is vacant
    const bed = await prisma.hostelBed.findUnique({
      where: { id: bedId }
    });
    
    if (!bed || bed.status !== 'VACANT') {
      throw new Error('Bed is not available');
    }
    
    // Create allocation and update bed status in transaction
    const [allocation, updatedBed] = await prisma.$transaction([
      prisma.hostelStudent.create({
        data: {
          studentId,
          hostelId,
          roomId,
          bedId,
          checkInDate,
          depositAmount,
          monthlyFee,
          emergencyContact,
          specialRequirements
        }
      }),
      prisma.hostelBed.update({
        where: { id: bedId },
        data: {
          status: 'OCCUPIED',
          studentId
        }
      })
    ]);
    
    // Update room status if full
    const room = await prisma.hostelRoom.findUnique({
      where: { id: roomId },
      include: {
        beds: true
      }
    });
    
    const allOccupied = room.beds.every(b => b.status === 'OCCUPIED');
    if (allOccupied) {
      await prisma.hostelRoom.update({
        where: { id: roomId },
        data: { status: 'FULL' }
      });
    }
    
    logger.info(`Student ${studentId} allocated to bed ${bedId}`);
    return allocation;
  } catch (error) {
    logger.error('Error allocating student:', error);
    throw error;
  }
}

/**
 * Deallocate student from hostel (check-out)
 */
async function deallocateStudent(allocationId, checkOutDate, refundDeposit = false) {
  try {
    // Get allocation details
    const allocation = await prisma.hostelStudent.findUnique({
      where: { id: allocationId }
    });
    
    if (!allocation) {
      throw new Error('Allocation not found');
    }
    
    // Update allocation and bed status in transaction
    const [updatedAllocation, updatedBed] = await prisma.$transaction([
      prisma.hostelStudent.update({
        where: { id: allocationId },
        data: {
          checkOutDate,
          depositRefunded: refundDeposit
        }
      }),
      prisma.hostelBed.update({
        where: { id: allocation.bedId },
        data: {
          status: 'VACANT',
          studentId: null
        }
      })
    ]);
    
    // Update room status if was full
    await prisma.hostelRoom.update({
      where: { id: allocation.roomId },
      data: { status: 'AVAILABLE' }
    });
    
    logger.info(`Student deallocated: ${allocationId}`);
    return updatedAllocation;
  } catch (error) {
    logger.error('Error deallocating student:', error);
    throw error;
  }
}

/**
 * Get student's hostel allocation
 */
async function getStudentAllocation(studentId) {
  try {
    const allocation = await prisma.hostelStudent.findFirst({
      where: {
        studentId,
        checkOutDate: null
      },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            type: true,
            contactNo: true,
            warden: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        }
      }
    });
    
    if (!allocation) {
      return null;
    }
    
    // Get room and bed details
    const room = await prisma.hostelRoom.findUnique({
      where: { id: allocation.roomId },
      select: {
        roomNumber: true,
        type: true,
        floor: true
      }
    });
    
    const bed = await prisma.hostelBed.findUnique({
      where: { id: allocation.bedId },
      select: {
        bedNo: true
      }
    });
    
    return {
      ...allocation,
      room,
      bed
    };
  } catch (error) {
    logger.error('Error fetching student allocation:', error);
    throw error;
  }
}

/**
 * Get all students in a hostel
 */
async function getHostelStudents(hostelId, includeCheckedOut = false) {
  try {
    const where = { hostelId };
    if (!includeCheckedOut) {
      where.checkOutDate = null;
    }
    
    const students = await prisma.hostelStudent.findMany({
      where,
      include: {
        hostel: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        checkInDate: 'desc'
      }
    });
    
    return students;
  } catch (error) {
    logger.error('Error fetching hostel students:', error);
    throw error;
  }
}

/**
 * Update student allocation details
 */
async function updateStudentAllocation(allocationId, updateData) {
  try {
    const allocation = await prisma.hostelStudent.update({
      where: { id: allocationId },
      data: updateData
    });
    
    logger.info(`Student allocation updated: ${allocationId}`);
    return allocation;
  } catch (error) {
    logger.error('Error updating student allocation:', error);
    throw error;
  }
}

/**
 * Mark hostel fee as paid
 */
async function markHostelFeePaid(allocationId) {
  try {
    const allocation = await prisma.hostelStudent.update({
      where: { id: allocationId },
      data: {
        feePaid: true,
        feePaymentDate: new Date()
      }
    });
    
    logger.info(`Hostel fee marked as paid: ${allocationId}`);
    return allocation;
  } catch (error) {
    logger.error('Error marking fee as paid:', error);
    throw error;
  }
}

// ==================== Visitor Management ====================

/**
 * Register a visitor
 */
async function registerVisitor(visitorData) {
  try {
    const visitor = await prisma.hostelVisitor.create({
      data: visitorData
    });
    
    logger.info(`Visitor registered: ${visitor.visitorName} for student ${visitor.studentId}`);
    return visitor;
  } catch (error) {
    logger.error('Error registering visitor:', error);
    throw error;
  }
}

/**
 * Get visitors by student
 */
async function getVisitorsByStudent(studentId, filters = {}) {
  try {
    const { dateFrom, dateTo } = filters;
    
    const where = { studentId };
    
    if (dateFrom || dateTo) {
      where.visitDate = {};
      if (dateFrom) where.visitDate.gte = new Date(dateFrom);
      if (dateTo) where.visitDate.lte = new Date(dateTo);
    }
    
    const visitors = await prisma.hostelVisitor.findMany({
      where,
      orderBy: {
        visitDate: 'desc'
      }
    });
    
    return visitors;
  } catch (error) {
    logger.error('Error fetching visitors:', error);
    throw error;
  }
}

/**
 * Get all visitors by hostel
 */
async function getVisitorsByHostel(hostelId, filters = {}) {
  try {
    const { date, approved } = filters;
    
    // Get students in this hostel
    const hostelStudents = await prisma.hostelStudent.findMany({
      where: {
        hostelId,
        checkOutDate: null
      },
      select: {
        studentId: true
      }
    });
    
    const studentIds = hostelStudents.map(s => s.studentId);
    
    const where = {
      studentId: {
        in: studentIds
      }
    };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.visitDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
    
    if (approved !== undefined) {
      where.approved = approved === 'true' || approved === true;
    }
    
    const visitors = await prisma.hostelVisitor.findMany({
      where,
      orderBy: {
        visitDate: 'desc'
      }
    });
    
    return visitors;
  } catch (error) {
    logger.error('Error fetching hostel visitors:', error);
    throw error;
  }
}

/**
 * Update visitor details
 */
async function updateVisitor(visitorId, updateData) {
  try {
    const visitor = await prisma.hostelVisitor.update({
      where: { id: visitorId },
      data: updateData
    });
    
    logger.info(`Visitor updated: ${visitorId}`);
    return visitor;
  } catch (error) {
    logger.error('Error updating visitor:', error);
    throw error;
  }
}

/**
 * Approve visitor
 */
async function approveVisitor(visitorId, approvedBy) {
  try {
    const visitor = await prisma.hostelVisitor.update({
      where: { id: visitorId },
      data: {
        approved: true,
        approvedBy
      }
    });
    
    logger.info(`Visitor approved: ${visitorId} by ${approvedBy}`);
    return visitor;
  } catch (error) {
    logger.error('Error approving visitor:', error);
    throw error;
  }
}

// ==================== Complaint Management ====================

/**
 * Register a complaint
 */
async function registerComplaint(complaintData) {
  try {
    const complaint = await prisma.hostelComplaint.create({
      data: complaintData
    });
    
    logger.info(`Complaint registered: ${complaint.subject} (ID: ${complaint.id})`);
    return complaint;
  } catch (error) {
    logger.error('Error registering complaint:', error);
    throw error;
  }
}

/**
 * Get complaints with filters
 */
async function getComplaints(filters = {}) {
  try {
    const { hostelId, studentId, status, category, priority, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (hostelId) where.hostelId = hostelId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    
    const [complaints, total] = await Promise.all([
      prisma.hostelComplaint.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.hostelComplaint.count({ where })
    ]);
    
    return {
      data: complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching complaints:', error);
    throw error;
  }
}

/**
 * Update complaint status
 */
async function updateComplaintStatus(complaintId, status, assignedTo = null) {
  try {
    const updateData = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    
    const complaint = await prisma.hostelComplaint.update({
      where: { id: complaintId },
      data: updateData
    });
    
    logger.info(`Complaint ${complaintId} status updated to ${status}`);
    return complaint;
  } catch (error) {
    logger.error('Error updating complaint status:', error);
    throw error;
  }
}

/**
 * Resolve complaint
 */
async function resolveComplaint(complaintId, resolution) {
  try {
    const complaint = await prisma.hostelComplaint.update({
      where: { id: complaintId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedDate: new Date()
      }
    });
    
    logger.info(`Complaint resolved: ${complaintId}`);
    return complaint;
  } catch (error) {
    logger.error('Error resolving complaint:', error);
    throw error;
  }
}

// ==================== Leave Management ====================

/**
 * Apply for hostel leave
 */
async function applyLeave(leaveData) {
  try {
    const leave = await prisma.hostelLeave.create({
      data: leaveData
    });
    
    logger.info(`Hostel leave applied: ${leave.id} for student ${leave.studentId}`);
    return leave;
  } catch (error) {
    logger.error('Error applying leave:', error);
    throw error;
  }
}

/**
 * Get leave requests
 */
async function getLeaveRequests(filters = {}) {
  try {
    const { hostelId, studentId, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (hostelId) where.hostelId = hostelId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    
    const [leaves, total] = await Promise.all([
      prisma.hostelLeave.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.hostelLeave.count({ where })
    ]);
    
    return {
      data: leaves,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching leave requests:', error);
    throw error;
  }
}

/**
 * Approve leave
 */
async function approveLeave(leaveId, approvedBy, remarks = null) {
  try {
    const leave = await prisma.hostelLeave.update({
      where: { id: leaveId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedDate: new Date(),
        remarks
      }
    });
    
    logger.info(`Leave approved: ${leaveId} by ${approvedBy}`);
    return leave;
  } catch (error) {
    logger.error('Error approving leave:', error);
    throw error;
  }
}

/**
 * Reject leave
 */
async function rejectLeave(leaveId, approvedBy, remarks) {
  try {
    const leave = await prisma.hostelLeave.update({
      where: { id: leaveId },
      data: {
        status: 'REJECTED',
        approvedBy,
        approvedDate: new Date(),
        remarks
      }
    });
    
    logger.info(`Leave rejected: ${leaveId} by ${approvedBy}`);
    return leave;
  } catch (error) {
    logger.error('Error rejecting leave:', error);
    throw error;
  }
}

// ==================== Notice Management ====================

/**
 * Create hostel notice
 */
async function createNotice(noticeData) {
  try {
    const notice = await prisma.hostelNotice.create({
      data: noticeData,
      include: {
        hostel: {
          select: {
            name: true
          }
        }
      }
    });
    
    logger.info(`Notice created for hostel ${notice.hostelId}: ${notice.title}`);
    return notice;
  } catch (error) {
    logger.error('Error creating notice:', error);
    throw error;
  }
}

/**
 * Get notices by hostel
 */
async function getNotices(hostelId, activeOnly = true) {
  try {
    const where = { hostelId };
    if (activeOnly) {
      where.isActive = true;
      where.OR = [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } }
      ];
    }
    
    const notices = await prisma.hostelNotice.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return notices;
  } catch (error) {
    logger.error('Error fetching notices:', error);
    throw error;
  }
}

/**
 * Update notice
 */
async function updateNotice(noticeId, updateData) {
  try {
    const notice = await prisma.hostelNotice.update({
      where: { id: noticeId },
      data: updateData
    });
    
    logger.info(`Notice updated: ${noticeId}`);
    return notice;
  } catch (error) {
    logger.error('Error updating notice:', error);
    throw error;
  }
}

/**
 * Delete notice
 */
async function deleteNotice(noticeId) {
  try {
    await prisma.hostelNotice.delete({
      where: { id: noticeId }
    });
    
    logger.info(`Notice deleted: ${noticeId}`);
    return { message: 'Notice deleted successfully' };
  } catch (error) {
    logger.error('Error deleting notice:', error);
    throw error;
  }
}

// ==================== Attendance Management ====================

/**
 * Record hostel attendance
 */
async function recordAttendance(attendanceData) {
  try {
    const attendance = await prisma.hostelAttendance.create({
      data: attendanceData
    });
    
    logger.info(`Attendance recorded for student ${attendance.studentId}`);
    return attendance;
  } catch (error) {
    logger.error('Error recording attendance:', error);
    throw error;
  }
}

/**
 * Get attendance by hostel
 */
async function getAttendanceByHostel(hostelId, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const attendance = await prisma.hostelAttendance.findMany({
      where: {
        hostelId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    
    return attendance;
  } catch (error) {
    logger.error('Error fetching hostel attendance:', error);
    throw error;
  }
}

/**
 * Get attendance by student
 */
async function getAttendanceByStudent(studentId, filters = {}) {
  try {
    const { dateFrom, dateTo } = filters;
    
    const where = { studentId };
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        where.date.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }
    
    const attendance = await prisma.hostelAttendance.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    });
    
    return attendance;
  } catch (error) {
    logger.error('Error fetching student attendance:', error);
    throw error;
  }
}

// ==================== Reports & Analytics ====================

/**
 * Get hostel summary statistics
 */
async function getHostelSummary() {
  try {
    const [totalHostels, totalRooms, totalBeds, occupiedBeds, activeStudents, pendingComplaints, pendingLeaves] = await Promise.all([
      prisma.hostel.count(),
      prisma.hostelRoom.count(),
      prisma.hostelBed.count(),
      prisma.hostelBed.count({ where: { status: 'OCCUPIED' } }),
      prisma.hostelStudent.count({ where: { checkOutDate: null } }),
      prisma.hostelComplaint.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.hostelLeave.count({ where: { status: 'PENDING' } })
    ]);
    
    return {
      totalHostels,
      totalRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      activeStudents,
      pendingComplaints,
      pendingLeaves
    };
  } catch (error) {
    logger.error('Error generating hostel summary:', error);
    throw error;
  }
}

/**
 * Get occupancy report by hostel
 */
async function getOccupancyReport(hostelId) {
  try {
    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      select: {
        name: true,
        capacity: true
      }
    });
    
    const [totalBeds, occupiedBeds, vacantBeds, maintenanceBeds] = await Promise.all([
      prisma.hostelBed.count({
        where: { room: { hostelId } }
      }),
      prisma.hostelBed.count({
        where: {
          room: { hostelId },
          status: 'OCCUPIED'
        }
      }),
      prisma.hostelBed.count({
        where: {
          room: { hostelId },
          status: 'VACANT'
        }
      }),
      prisma.hostelBed.count({
        where: {
          room: { hostelId },
          status: 'MAINTENANCE'
        }
      })
    ]);
    
    // Get room-wise breakdown
    const rooms = await prisma.hostelRoom.findMany({
      where: { hostelId },
      include: {
        beds: true
      }
    });
    
    const roomBreakdown = rooms.map(room => ({
      roomNumber: room.roomNumber,
      type: room.type,
      capacity: room.capacity,
      occupied: room.beds.filter(b => b.status === 'OCCUPIED').length,
      vacant: room.beds.filter(b => b.status === 'VACANT').length
    }));
    
    return {
      hostel,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      maintenanceBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      roomBreakdown
    };
  } catch (error) {
    logger.error('Error generating occupancy report:', error);
    throw error;
  }
}

/**
 * Get fee collection report
 */
async function getFeeCollectionReport(hostelId = null, month = null, year = null) {
  try {
    const where = {
      checkOutDate: null
    };
    
    if (hostelId) {
      where.hostelId = hostelId;
    }
    
    const allocations = await prisma.hostelStudent.findMany({
      where,
      select: {
        monthlyFee: true,
        feePaid: true,
        depositAmount: true,
        depositRefunded: true
      }
    });
    
    const totalStudents = allocations.length;
    const paidCount = allocations.filter(a => a.feePaid).length;
    const pendingCount = totalStudents - paidCount;
    
    const totalMonthlyFee = allocations.reduce((sum, a) => sum + a.monthlyFee, 0);
    const collectedFee = allocations.filter(a => a.feePaid).reduce((sum, a) => sum + a.monthlyFee, 0);
    const pendingFee = totalMonthlyFee - collectedFee;
    
    const totalDeposit = allocations.reduce((sum, a) => sum + a.depositAmount, 0);
    const refundedDeposit = allocations.filter(a => a.depositRefunded).reduce((sum, a) => sum + a.depositAmount, 0);
    
    return {
      totalStudents,
      paidCount,
      pendingCount,
      collectionRate: totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0,
      monthlyFee: {
        total: totalMonthlyFee,
        collected: collectedFee,
        pending: pendingFee
      },
      deposit: {
        total: totalDeposit,
        refunded: refundedDeposit,
        holding: totalDeposit - refundedDeposit
      }
    };
  } catch (error) {
    logger.error('Error generating fee collection report:', error);
    throw error;
  }
}

/**
 * Get hostel settings
 */
async function getHostelSettings() {
  try {
    let settings = await prisma.hostelSettings.findFirst();
    
    if (!settings) {
      // Create default settings if not exists
      settings = await prisma.hostelSettings.create({
        data: {}
      });
    }
    
    return settings;
  } catch (error) {
    logger.error('Error fetching hostel settings:', error);
    throw error;
  }
}

/**
 * Update hostel settings
 */
async function updateHostelSettings(settingsData) {
  try {
    let settings = await prisma.hostelSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.hostelSettings.create({
        data: settingsData
      });
    } else {
      settings = await prisma.hostelSettings.update({
        where: { id: settings.id },
        data: settingsData
      });
    }
    
    logger.info('Hostel settings updated');
    return settings;
  } catch (error) {
    logger.error('Error updating hostel settings:', error);
    throw error;
  }
}

module.exports = {
  // Hostel Management
  addHostel,
  getAllHostels,
  getHostelDetails,
  updateHostel,
  deleteHostel,
  
  // Room Management
  addRoom,
  getRoomsByHostel,
  updateRoom,
  deleteRoom,
  
  // Bed Management
  getBedsByRoom,
  updateBedStatus,
  getVacantBeds,
  
  // Student Allocation
  allocateStudent,
  deallocateStudent,
  getStudentAllocation,
  getHostelStudents,
  updateStudentAllocation,
  markHostelFeePaid,
  
  // Visitor Management
  registerVisitor,
  getVisitorsByStudent,
  getVisitorsByHostel,
  updateVisitor,
  approveVisitor,
  
  // Complaint Management
  registerComplaint,
  getComplaints,
  updateComplaintStatus,
  resolveComplaint,
  
  // Leave Management
  applyLeave,
  getLeaveRequests,
  approveLeave,
  rejectLeave,
  
  // Notice Management
  createNotice,
  getNotices,
  updateNotice,
  deleteNotice,
  
  // Attendance
  recordAttendance,
  getAttendanceByHostel,
  getAttendanceByStudent,
  
  // Reports
  getHostelSummary,
  getOccupancyReport,
  getFeeCollectionReport,
  
  // Settings
  getHostelSettings,
  updateHostelSettings
};
