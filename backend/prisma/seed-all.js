/**
 * Comprehensive Database Seeding Script
 * Seeds ALL modules: Users, Classes, Subjects, Students, Staff, Parents,
 * Attendance, Fees, Exams, Timetable, Notifications, Library, LMS,
 * Transport, Hostel, Leaves, Salary Payments
 *
 * Run with: node prisma/seed-all.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper to hash passwords
const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

// Helper for random pick
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate receipt numbers
let receiptCounter = 1000;
const nextReceipt = () => `RCP-${++receiptCounter}`;

async function main() {
  console.log('\n========================================');
  console.log('  COMPREHENSIVE DATA SEEDING');
  console.log('========================================\n');

  // ===================== ACADEMIC YEAR =====================
  console.log('📅 Seeding Academic Years...');
  let academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        year: '2025-2026',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        isCurrent: true,
      },
    });
  }
  const prevYear = await prisma.academicYear.upsert({
    where: { year: '2024-2025' },
    update: {},
    create: {
      year: '2024-2025',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isCurrent: false,
    },
  });
  console.log('  ✅ Academic years ready');

  // ===================== USERS & STAFF =====================
  console.log('👤 Seeding Users & Staff...');

  const staffData = [
    { email: 'principal@school.com', password: 'Principal@123', role: 'PRINCIPAL', name: 'Dr. Rajesh Kumar', designation: 'Principal', department: 'Administration', salary: 120000, gender: 'MALE' },
    { email: 'teacher@school.com', password: 'Teacher@123', role: 'TEACHER', name: 'John Doe', designation: 'Senior Teacher', department: 'Science', salary: 55000, gender: 'MALE' },
    { email: 'teacher2@school.com', password: 'Teacher@123', role: 'TEACHER', name: 'Priya Sharma', designation: 'Teacher', department: 'Mathematics', salary: 50000, gender: 'FEMALE' },
    { email: 'teacher3@school.com', password: 'Teacher@123', role: 'TEACHER', name: 'Anita Verma', designation: 'Teacher', department: 'English', salary: 48000, gender: 'FEMALE' },
    { email: 'teacher4@school.com', password: 'Teacher@123', role: 'TEACHER', name: 'Suresh Patel', designation: 'Teacher', department: 'Social Studies', salary: 47000, gender: 'MALE' },
    { email: 'teacher5@school.com', password: 'Teacher@123', role: 'TEACHER', name: 'Kavitha Nair', designation: 'Teacher', department: 'Hindi', salary: 45000, gender: 'FEMALE' },
    { email: 'accounts@school.com', password: 'Accounts@123', role: 'ACCOUNTANT', name: 'Jane Roe', designation: 'Head Accountant', department: 'Finance', salary: 45000, gender: 'FEMALE' },
    { email: 'librarian@school.com', password: 'Library@123', role: 'LIBRARIAN', name: 'Ramesh Gupta', designation: 'Librarian', department: 'Library', salary: 35000, gender: 'MALE' },
    { email: 'transport1@school.com', password: 'Transport@123', role: 'TRANSPORT_STAFF', name: 'Ravi Singh', designation: 'Driver', department: 'Transport', salary: 25000, gender: 'MALE' },
    { email: 'transport2@school.com', password: 'Transport@123', role: 'TRANSPORT_STAFF', name: 'Manoj Yadav', designation: 'Conductor', department: 'Transport', salary: 20000, gender: 'MALE' },
    { email: 'transport3@school.com', password: 'Transport@123', role: 'TRANSPORT_STAFF', name: 'Vikram Chauhan', designation: 'Driver', department: 'Transport', salary: 25000, gender: 'MALE' },
    { email: 'warden@school.com', password: 'Warden@123', role: 'TEACHER', name: 'Deepa Menon', designation: 'Hostel Warden', department: 'Hostel', salary: 40000, gender: 'FEMALE' },
  ];

  // Ensure admin
  let adminUser = await prisma.user.findUnique({ where: { email: 'admin@school.com' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { name: 'Super Admin', email: 'admin@school.com', password: hashPassword('Admin@123'), role: 'ADMIN', status: 'ACTIVE' },
    });
  }

  const staffRecords = {};
  let empCounter = 1000;
  for (const s of staffData) {
    let user = await prisma.user.findUnique({ where: { email: s.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { name: s.name, email: s.email, password: hashPassword(s.password), role: s.role, status: 'ACTIVE' },
      });
    }
    let staff = await prisma.staff.findUnique({ where: { userId: user.id } });
    if (!staff) {
      const [firstName, ...rest] = s.name.split(' ');
      staff = await prisma.staff.create({
        data: {
          userId: user.id,
          firstName,
          lastName: rest.join(' '),
          employeeId: `EMP-${++empCounter}`,
          dateOfBirth: new Date('1985-06-15'),
          gender: s.gender,
          phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          address: `${Math.floor(1 + Math.random() * 200)}, Staff Quarters, School Campus`,
          designation: s.designation,
          department: s.department,
          joiningDate: new Date('2023-06-01'),
          salary: s.salary,
          qualification: pick(['B.Ed', 'M.Ed', 'M.Sc', 'M.A', 'Ph.D']),
          experience: Math.floor(3 + Math.random() * 15),
        },
      });
    }
    staffRecords[s.email] = staff;
  }
  console.log(`  ✅ ${Object.keys(staffRecords).length} staff members ready`);

  // ===================== CLASSES =====================
  console.log('🏫 Seeding Classes...');
  const classNames = [
    { name: 'Grade 1', section: 'A' }, { name: 'Grade 1', section: 'B' },
    { name: 'Grade 2', section: 'A' },
    { name: 'Grade 3', section: 'A' },
    { name: 'Grade 4', section: 'A' },
    { name: 'Grade 5', section: 'A' }, { name: 'Grade 5', section: 'B' },
    { name: 'Grade 6', section: 'A' },
    { name: 'Grade 7', section: 'A' },
    { name: 'Grade 8', section: 'A' },
    { name: 'Grade 9', section: 'A' }, { name: 'Grade 9', section: 'B' },
    { name: 'Grade 10', section: 'A' }, { name: 'Grade 10', section: 'B' },
  ];

  const teacherStaff = Object.values(staffRecords).filter(
    (_, i) => i >= 1 && i <= 5 // teacher indices
  );

  const classes = [];
  for (let i = 0; i < classNames.length; i++) {
    const cn = classNames[i];
    let cls = await prisma.class.findFirst({
      where: { name: cn.name, section: cn.section, academicYearId: academicYear.id },
    });
    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name: cn.name,
          section: cn.section,
          academicYearId: academicYear.id,
          classTeacherId: teacherStaff[i % teacherStaff.length]?.id,
          capacity: 40,
        },
      });
    }
    classes.push(cls);
  }
  console.log(`  ✅ ${classes.length} classes ready`);

  // ===================== SUBJECTS =====================
  console.log('📚 Seeding Subjects...');
  const subjectDefs = [
    { name: 'Mathematics', codePrefix: 'MATH' },
    { name: 'Science', codePrefix: 'SCI' },
    { name: 'English', codePrefix: 'ENG' },
    { name: 'Hindi', codePrefix: 'HIN' },
    { name: 'Social Studies', codePrefix: 'SS' },
  ];

  const subjects = [];
  for (const cls of classes) {
    for (const subDef of subjectDefs) {
      const code = `${subDef.codePrefix}-${cls.name.replace(/\s+/g, '')}-${cls.section || 'A'}`;
      let subj = await prisma.subject.findUnique({ where: { code } });
      if (!subj) {
        subj = await prisma.subject.create({
          data: {
            name: subDef.name,
            code,
            classId: cls.id,
            teacherId: teacherStaff[subjectDefs.indexOf(subDef) % teacherStaff.length]?.id,
            credits: subDef.name === 'Mathematics' || subDef.name === 'Science' ? 2 : 1,
          },
        });
      }
      subjects.push(subj);
    }
  }
  console.log(`  ✅ ${subjects.length} subjects ready`);

  // ===================== PARENTS =====================
  console.log('👨‍👩‍👧 Seeding Parents...');
  const parentNames = [
    { first: 'Rajendra', last: 'Prasad', occ: 'Engineer' },
    { first: 'Sunita', last: 'Devi', occ: 'Doctor' },
    { first: 'Mohan', last: 'Lal', occ: 'Business Owner' },
    { first: 'Geeta', last: 'Kumari', occ: 'Teacher' },
    { first: 'Arun', last: 'Mehta', occ: 'Lawyer' },
    { first: 'Savita', last: 'Joshi', occ: 'Government Officer' },
    { first: 'Vijay', last: 'Reddy', occ: 'Architect' },
    { first: 'Meena', last: 'Iyer', occ: 'Pharmacist' },
    { first: 'Prakash', last: 'Chand', occ: 'Farmer' },
    { first: 'Lakshmi', last: 'Bai', occ: 'Homemaker' },
  ];

  const parentRecords = [];
  for (let i = 0; i < parentNames.length; i++) {
    const p = parentNames[i];
    const email = `parent${i + 1}@school.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { name: `${p.first} ${p.last}`, email, password: hashPassword('Parent@123'), role: 'PARENT', status: 'ACTIVE' },
      });
    }
    let parent = await prisma.parent.findUnique({ where: { userId: user.id } });
    if (!parent) {
      parent = await prisma.parent.create({
        data: {
          userId: user.id,
          firstName: p.first,
          lastName: p.last,
          phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
          email,
          occupation: p.occ,
          address: `${Math.floor(1 + Math.random() * 500)}, Residential Area, City`,
        },
      });
    }
    parentRecords.push(parent);
  }
  console.log(`  ✅ ${parentRecords.length} parents ready`);

  // ===================== STUDENTS =====================
  console.log('🎓 Seeding Students...');
  const studentNames = [
    { first: 'Alice', last: 'Smith', gender: 'FEMALE' },
    { first: 'Bob', last: 'Johnson', gender: 'MALE' },
    { first: 'Charvi', last: 'Prasad', gender: 'FEMALE' },
    { first: 'Dev', last: 'Sharma', gender: 'MALE' },
    { first: 'Eshaan', last: 'Patel', gender: 'MALE' },
    { first: 'Fatima', last: 'Khan', gender: 'FEMALE' },
    { first: 'Gaurav', last: 'Singh', gender: 'MALE' },
    { first: 'Hina', last: 'Verma', gender: 'FEMALE' },
    { first: 'Ishaan', last: 'Mehta', gender: 'MALE' },
    { first: 'Jaya', last: 'Reddy', gender: 'FEMALE' },
    { first: 'Karthik', last: 'Nair', gender: 'MALE' },
    { first: 'Lakshmi', last: 'Iyer', gender: 'FEMALE' },
    { first: 'Manish', last: 'Gupta', gender: 'MALE' },
    { first: 'Neha', last: 'Joshi', gender: 'FEMALE' },
    { first: 'Om', last: 'Prakash', gender: 'MALE' },
    { first: 'Pallavi', last: 'Rao', gender: 'FEMALE' },
    { first: 'Rahul', last: 'Kumar', gender: 'MALE' },
    { first: 'Sneha', last: 'Pillai', gender: 'FEMALE' },
    { first: 'Tanmay', last: 'Desai', gender: 'MALE' },
    { first: 'Uma', last: 'Shankar', gender: 'FEMALE' },
    { first: 'Varun', last: 'Chopra', gender: 'MALE' },
    { first: 'Wafa', last: 'Ahmed', gender: 'FEMALE' },
    { first: 'Yash', last: 'Agarwal', gender: 'MALE' },
    { first: 'Zara', last: 'Banerjee', gender: 'FEMALE' },
    { first: 'Aarav', last: 'Trivedi', gender: 'MALE' },
    { first: 'Bhavna', last: 'Tiwari', gender: 'FEMALE' },
    { first: 'Chirag', last: 'Saxena', gender: 'MALE' },
    { first: 'Divya', last: 'Mishra', gender: 'FEMALE' },
    { first: 'Eshan', last: 'Bhat', gender: 'MALE' },
    { first: 'Falguni', last: 'Shah', gender: 'FEMALE' },
  ];

  // Assign students to higher grade classes (Grade 8-10) for meaningful exam/attendance data
  const targetClasses = classes.filter(c => ['Grade 8', 'Grade 9', 'Grade 10'].includes(c.name));

  const studentRecords = [];
  let admissionCounter = 2000;
  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const email = `student${i + 1}@school.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { name: `${s.first} ${s.last}`, email, password: hashPassword('Student@123'), role: 'STUDENT', status: 'ACTIVE' },
      });
    }
    let student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) {
      const cls = targetClasses[i % targetClasses.length];
      student = await prisma.student.create({
        data: {
          userId: user.id,
          firstName: s.first,
          lastName: s.last,
          admissionNo: `STU${++admissionCounter}`,
          dateOfBirth: new Date(`${2010 + (i % 4)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`),
          gender: s.gender,
          bloodGroup: pick(['A_POSITIVE', 'B_POSITIVE', 'O_POSITIVE', 'AB_POSITIVE']),
          phone: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
          address: `${Math.floor(1 + Math.random() * 500)}, Student Colony, City`,
          parentId: parentRecords[i % parentRecords.length].id,
          classId: cls.id,
          admissionDate: new Date('2025-04-01'),
          medicalInfo: pick([null, 'No known allergies', 'Mild asthma', 'Wears glasses']),
        },
      });
    }
    studentRecords.push(student);
  }
  console.log(`  ✅ ${studentRecords.length} students ready`);

  // ===================== ATTENDANCE =====================
  console.log('📋 Seeding Attendance (last 30 days)...');
  const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE', 'SICK_LEAVE'];
  let attendanceCount = 0;
  const today = new Date();
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

    for (const student of studentRecords.slice(0, 20)) { // 20 students for speed
      const existing = await prisma.attendance.findUnique({
        where: { studentId_date: { studentId: student.id, date } },
      });
      if (!existing) {
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            classId: student.classId,
            date,
            status: pick(statuses),
            markedBy: staffRecords['teacher@school.com'].id,
          },
        });
        attendanceCount++;
      }
    }
  }
  console.log(`  ✅ ${attendanceCount} attendance records created`);

  // ===================== FEE STRUCTURES =====================
  console.log('💰 Seeding Fee Structures...');
  const feeTypes = [
    { name: 'Tuition Fee', amount: 25000, desc: 'Annual tuition fee' },
    { name: 'Lab Fee', amount: 5000, desc: 'Science lab fee' },
    { name: 'Library Fee', amount: 2000, desc: 'Annual library fee' },
    { name: 'Sports Fee', amount: 3000, desc: 'Annual sports fee' },
    { name: 'Transport Fee', amount: 12000, desc: 'Annual transport fee', optional: true },
    { name: 'Exam Fee', amount: 1500, desc: 'Per exam fee' },
  ];

  const feeStructures = [];
  for (const ft of feeTypes) {
    const existing = await prisma.feeStructure.findFirst({
      where: { name: ft.name, academicYearId: academicYear.id },
    });
    if (existing) {
      feeStructures.push(existing);
    } else {
      const fs = await prisma.feeStructure.create({
        data: {
          academicYearId: academicYear.id,
          name: ft.name,
          amount: ft.amount,
          dueDate: new Date('2025-06-30'),
          description: ft.desc,
          isOptional: ft.optional || false,
        },
      });
      feeStructures.push(fs);
    }
  }
  console.log(`  ✅ ${feeStructures.length} fee structures ready`);

  // ===================== FEE PAYMENTS =====================
  console.log('💳 Seeding Fee Payments...');
  let paymentCount = 0;
  for (const student of studentRecords.slice(0, 20)) {
    for (const fs of feeStructures.slice(0, 3)) { // Pay first 3 fee types
      const existing = await prisma.feePayment.findFirst({
        where: { studentId: student.id, feeStructureId: fs.id },
      });
      if (!existing) {
        await prisma.feePayment.create({
          data: {
            studentId: student.id,
            feeStructureId: fs.id,
            amount: fs.amount,
            paymentDate: new Date('2025-05-15'),
            paymentMode: pick(['CASH', 'ONLINE', 'UPI', 'CARD']),
            receiptNo: nextReceipt(),
            status: 'PAID',
            collectedBy: staffRecords['accounts@school.com'].id,
          },
        });
        paymentCount++;
      }
    }
  }
  console.log(`  ✅ ${paymentCount} fee payments created`);

  // ===================== SALARY PAYMENTS =====================
  console.log('💵 Seeding Salary Payments...');
  let salaryCount = 0;
  const months = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];
  for (const staff of Object.values(staffRecords)) {
    for (const month of months) {
      const existing = await prisma.salaryPayment.findFirst({
        where: { staffId: staff.id, month },
      });
      if (!existing) {
        await prisma.salaryPayment.create({
          data: {
            staffId: staff.id,
            month,
            amount: staff.salary || 40000,
            paymentDate: new Date(`${month}-28`),
            paymentMode: pick(['ONLINE', 'CHEQUE']),
            transactionId: `SAL-${month}-${staff.employeeId}`,
          },
        });
        salaryCount++;
      }
    }
  }
  console.log(`  ✅ ${salaryCount} salary payments created`);

  // ===================== LEAVES =====================
  console.log('🏖️ Seeding Staff Leaves...');
  let leaveCount = 0;
  const leaveReasons = ['Personal work', 'Medical leave', 'Family function', 'Festival leave', 'Training program'];
  for (const staff of Object.values(staffRecords).slice(0, 6)) {
    for (let i = 0; i < 2; i++) {
      const startDate = new Date(`2025-${String(5 + i * 3).padStart(2, '0')}-${String(10 + i * 5).padStart(2, '0')}`);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + pick([1, 2, 3]));
      await prisma.leave.create({
        data: {
          staffId: staff.id,
          startDate,
          endDate,
          reason: pick(leaveReasons),
          status: pick(['APPROVED', 'PENDING', 'REJECTED']),
          approvedBy: adminUser.id,
        },
      });
      leaveCount++;
    }
  }
  console.log(`  ✅ ${leaveCount} leave records created`);

  // ===================== TIMETABLE =====================
  console.log('🕐 Seeding Timetable...');
  let ttCount = 0;
  const timeSlots = [
    { start: '09:00', end: '09:45' },
    { start: '09:45', end: '10:30' },
    { start: '10:45', end: '11:30' },
    { start: '11:30', end: '12:15' },
    { start: '13:00', end: '13:45' },
    { start: '13:45', end: '14:30' },
  ];

  for (const cls of targetClasses) {
    const classSubjects = subjects.filter(s => s.classId === cls.id);
    for (let day = 1; day <= 5; day++) { // Mon-Fri
      for (let slot = 0; slot < timeSlots.length; slot++) {
        const subj = classSubjects[slot % classSubjects.length];
        if (!subj || !subj.teacherId) continue;
        const existing = await prisma.timetable.findFirst({
          where: { classId: cls.id, dayOfWeek: day, startTime: timeSlots[slot].start },
        });
        if (!existing) {
          await prisma.timetable.create({
            data: {
              classId: cls.id,
              subjectId: subj.id,
              teacherId: subj.teacherId,
              dayOfWeek: day,
              startTime: timeSlots[slot].start,
              endTime: timeSlots[slot].end,
              room: `Room ${Math.floor(100 + Math.random() * 50)}`,
            },
          });
          ttCount++;
        }
      }
    }
  }
  console.log(`  ✅ ${ttCount} timetable entries created`);

  // ===================== EXAM SCHEDULES & RESULTS =====================
  console.log('📝 Seeding Exam Schedules & Results...');
  const examDefs = [
    { name: 'Unit Test 1', type: 'UNIT_TEST', start: '2025-06-15', end: '2025-06-20', total: 50, pass: 18 },
    { name: 'Quarterly Exam', type: 'QUARTERLY', start: '2025-08-01', end: '2025-08-10', total: 100, pass: 35 },
    { name: 'Half Yearly Exam', type: 'HALF_YEARLY', start: '2025-10-15', end: '2025-10-25', total: 100, pass: 35 },
    { name: 'Unit Test 2', type: 'UNIT_TEST', start: '2025-12-10', end: '2025-12-15', total: 50, pass: 18 },
    { name: 'Annual Exam', type: 'ANNUAL', start: '2026-03-01', end: '2026-03-15', total: 100, pass: 35 },
  ];

  let examCount = 0;
  let resultCount = 0;
  for (const cls of targetClasses) {
    for (const examDef of examDefs) {
      let exam = await prisma.examSchedule.findFirst({
        where: { name: examDef.name, classId: cls.id, academicYearId: academicYear.id },
      });
      if (!exam) {
        exam = await prisma.examSchedule.create({
          data: {
            name: examDef.name,
            examType: examDef.type,
            classId: cls.id,
            academicYearId: academicYear.id,
            startDate: new Date(examDef.start),
            endDate: new Date(examDef.end),
            totalMarks: examDef.total,
            passingMarks: examDef.pass,
          },
        });
        examCount++;
      }

      // Add results for first 3 exams (completed ones)
      if (examDefs.indexOf(examDef) < 3) {
        const classStudents = studentRecords.filter(s => s.classId === cls.id);
        const classSubjects = subjects.filter(s => s.classId === cls.id);
        for (const student of classStudents) {
          for (const subj of classSubjects) {
            const existing = await prisma.examResult.findFirst({
              where: { studentId: student.id, examScheduleId: exam.id, subjectId: subj.id },
            });
            if (!existing) {
              const maxMarks = examDef.total;
              await prisma.examResult.create({
                data: {
                  studentId: student.id,
                  examScheduleId: exam.id,
                  subjectId: subj.id,
                  marksObtained: Math.floor(examDef.pass + Math.random() * (maxMarks - examDef.pass)),
                  remarks: pick([null, 'Good', 'Excellent', 'Needs improvement', 'Average']),
                },
              });
              resultCount++;
            }
          }
        }
      }
    }
  }
  console.log(`  ✅ ${examCount} exams, ${resultCount} results created`);

  // ===================== NOTIFICATIONS =====================
  console.log('🔔 Seeding Notifications...');
  const notifications = [
    { title: 'Welcome to New Academic Year 2025-2026', message: 'Dear students and parents, welcome to the new academic year. Classes begin on April 1st.', type: 'EMAIL', recipients: ['ALL'] },
    { title: 'Parent-Teacher Meeting', message: 'A Parent-Teacher meeting is scheduled for May 15th, 2025 at 10:00 AM.', type: 'SMS', recipients: ['PARENT'] },
    { title: 'Fee Payment Reminder', message: 'Kindly pay your pending fees before June 30th to avoid late charges.', type: 'EMAIL', recipients: ['PARENT', 'STUDENT'] },
    { title: 'Annual Sports Day', message: 'Annual Sports Day will be held on February 15th, 2026. All students must participate.', type: 'PUSH', recipients: ['STUDENT'] },
    { title: 'Holiday Notice - Republic Day', message: 'School will remain closed on January 26th for Republic Day celebrations.', type: 'EMAIL', recipients: ['ALL'] },
    { title: 'Exam Schedule Released', message: 'The Half Yearly exam schedule has been released. Please check the exam section.', type: 'EMAIL', recipients: ['STUDENT', 'PARENT'] },
    { title: 'Staff Meeting', message: 'All teachers are requested to attend the staff meeting on March 5th at 3 PM.', type: 'PUSH', recipients: ['TEACHER'] },
    { title: 'Library Book Return Reminder', message: 'Please return all overdue books to the library by this Friday.', type: 'SMS', recipients: ['STUDENT'] },
  ];

  let notifCount = 0;
  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        title: n.title,
        message: n.message,
        type: n.type,
        recipients: n.recipients,
        sentBy: adminUser.id,
        status: 'SENT',
      },
    });
    notifCount++;
  }
  console.log(`  ✅ ${notifCount} notifications created`);

  // ===================== LIBRARY =====================
  console.log('📖 Seeding Library...');

  // Library Settings
  await prisma.librarySettings.upsert({
    where: { id: 'default-lib-settings' },
    update: {},
    create: {
      id: 'default-lib-settings',
      issueLimit: 5,
      issuePeriodDays: 14,
      finePerDay: 5,
      maxFineLimit: 100,
      holdRequestExpiryDays: 7,
    },
  });

  const bookData = [
    { title: 'Mathematics for Grade 10', author: 'R.D. Sharma', isbn: '978-0-1234-0001', category: 'Textbook', cost: 450 },
    { title: 'NCERT Science', author: 'NCERT', isbn: '978-0-1234-0002', category: 'Textbook', cost: 350 },
    { title: 'English Grammar and Composition', author: 'Wren & Martin', isbn: '978-0-1234-0003', category: 'Reference', cost: 500 },
    { title: 'India After Gandhi', author: 'Ramachandra Guha', isbn: '978-0-1234-0004', category: 'History', cost: 650 },
    { title: 'The Story of My Experiments with Truth', author: 'M.K. Gandhi', isbn: '978-0-1234-0005', category: 'Biography', cost: 300 },
    { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0-1234-0006', category: 'Science', cost: 550 },
    { title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '978-0-1234-0007', category: 'Biography', cost: 250 },
    { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '978-0-1234-0008', category: 'Fiction', cost: 350 },
    { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0-1234-0009', category: 'Non-Fiction', cost: 700 },
    { title: 'Physics for Competitive Exams', author: 'H.C. Verma', isbn: '978-0-1234-0010', category: 'Reference', cost: 600 },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-1234-0011', category: 'Fiction', cost: 400 },
    { title: 'The Discovery of India', author: 'Jawaharlal Nehru', isbn: '978-0-1234-0012', category: 'History', cost: 500 },
    { title: 'Computer Science Basics', author: 'Sumita Arora', isbn: '978-0-1234-0013', category: 'Technology', cost: 450 },
    { title: 'Hindi Sahitya', author: 'Premchand', isbn: '978-0-1234-0014', category: 'Literature', cost: 200 },
    { title: 'General Knowledge 2026', author: 'Arihant Publications', isbn: '978-0-1234-0015', category: 'General', cost: 180 },
  ];

  const books = [];
  for (const bd of bookData) {
    let book = await prisma.book.findUnique({ where: { isbn: bd.isbn } });
    if (!book) {
      book = await prisma.book.create({
        data: {
          title: bd.title,
          author: bd.author,
          isbn: bd.isbn,
          publisher: pick(['Penguin', 'Oxford', 'NCERT', 'S. Chand', 'Arihant']),
          category: bd.category,
          totalCopies: 5,
          costPrice: bd.cost,
          sellingPrice: bd.cost * 1.2,
        },
      });
    }
    books.push(book);
  }

  // Book copies
  let copyCount = 0;
  for (const book of books) {
    const existingCopies = await prisma.bookCopy.count({ where: { bookId: book.id } });
    for (let c = existingCopies + 1; c <= 5; c++) {
      await prisma.bookCopy.create({
        data: {
          bookId: book.id,
          barcode: `BC-${book.isbn.slice(-4)}-${String(c).padStart(3, '0')}`,
          status: c <= 3 ? 'AVAILABLE' : pick(['AVAILABLE', 'ISSUED']),
          condition: pick(['GOOD', 'GOOD', 'FAIR']),
        },
      });
      copyCount++;
    }
  }

  // Borrow records
  let borrowCount = 0;
  for (let i = 0; i < 15; i++) {
    const student = studentRecords[i % studentRecords.length];
    const book = books[i % books.length];
    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - (10 + i * 2));
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);
    await prisma.borrowRecord.create({
      data: {
        bookId: book.id,
        memberId: student.id,
        issueDate,
        dueDate,
        returnDate: i < 10 ? new Date() : null,
        fineAmount: i >= 10 ? (i - 9) * 5 : 0,
      },
    });
    borrowCount++;
  }
  console.log(`  ✅ ${books.length} books, ${copyCount} copies, ${borrowCount} borrow records`);

  // ===================== LMS =====================
  console.log('🎓 Seeding LMS Content...');
  const lmsData = [
    { title: 'Introduction to Algebra', desc: 'Basic concepts of algebraic expressions', type: 'LESSON_NOTE', vis: 'PUBLISHED' },
    { title: 'Newton\'s Laws of Motion', desc: 'Understanding the three laws of motion', type: 'VIDEO_LECTURE', vis: 'PUBLISHED' },
    { title: 'Essay Writing Techniques', desc: 'Learn how to write effective essays', type: 'LESSON_NOTE', vis: 'PUBLISHED' },
    { title: 'Math Problem Set 1', desc: 'Practice problems on quadratic equations', type: 'ASSIGNMENT', vis: 'PUBLISHED', marks: 50 },
    { title: 'Science Lab Report', desc: 'Write a report on the pendulum experiment', type: 'ASSIGNMENT', vis: 'PUBLISHED', marks: 30 },
    { title: 'Hindi Poetry Analysis', desc: 'Analyze the poem by Kabir', type: 'ASSIGNMENT', vis: 'PUBLISHED', marks: 25 },
    { title: 'Photosynthesis Explained', desc: 'Detailed notes on photosynthesis process', type: 'LESSON_NOTE', vis: 'DRAFT' },
    { title: 'French Revolution', desc: 'Video lecture on the French Revolution', type: 'VIDEO_LECTURE', vis: 'PUBLISHED' },
  ];

  let lmsCount = 0;
  const lmsContents = [];
  for (const cls of targetClasses.slice(0, 2)) {
    const classSubjects = subjects.filter(s => s.classId === cls.id);
    for (let i = 0; i < lmsData.length; i++) {
      const ld = lmsData[i];
      const subj = classSubjects[i % classSubjects.length];
      if (!subj || !subj.teacherId) continue;
      const content = await prisma.lmsContent.create({
        data: {
          title: ld.title,
          description: ld.desc,
          type: ld.type,
          visibility: ld.vis,
          classId: cls.id,
          subjectId: subj.id,
          teacherId: subj.teacherId,
          dueDate: ld.type === 'ASSIGNMENT' ? new Date('2026-03-15') : null,
          totalMarks: ld.marks || null,
          instructions: ld.type === 'ASSIGNMENT' ? 'Submit before the due date. Late submissions will be penalized.' : null,
        },
      });
      lmsContents.push(content);
      lmsCount++;
    }
  }

  // LMS Submissions
  let subCount = 0;
  const assignments = lmsContents.filter(c => c.type === 'ASSIGNMENT');
  for (const assignment of assignments) {
    const classStudents = studentRecords.filter(s => s.classId === assignment.classId);
    for (const student of classStudents.slice(0, 5)) {
      const existing = await prisma.lmsSubmission.findFirst({
        where: { contentId: assignment.id, studentId: student.id },
      });
      if (!existing) {
        await prisma.lmsSubmission.create({
          data: {
            contentId: assignment.id,
            studentId: student.id,
            status: pick(['SUBMITTED', 'GRADED']),
            grade: assignment.totalMarks ? Math.floor(assignment.totalMarks * 0.5 + Math.random() * assignment.totalMarks * 0.5) : null,
            feedback: pick([null, 'Good work', 'Excellent', 'Needs more effort', 'Well done']),
            gradedBy: assignment.teacherId,
            gradedAt: new Date(),
          },
        });
        subCount++;
      }
    }
  }
  console.log(`  ✅ ${lmsCount} LMS content, ${subCount} submissions`);

  // ===================== TRANSPORT =====================
  console.log('🚌 Seeding Transport...');

  // Transport Settings
  await prisma.transportSettings.upsert({
    where: { id: 'default-transport-settings' },
    update: {},
    create: {
      id: 'default-transport-settings',
      defaultMonthlyFee: 1000,
      lateFeePercentage: 10,
      maxStudentsPerVehicle: 50,
      maintenanceCheckInterval: 30,
      fineForNoBoarding: 100,
    },
  });

  const vehicleData = [
    { reg: 'TN-01-AB-1234', model: 'Tata Starbus', cap: 50, fuel: 'DIESEL' },
    { reg: 'TN-01-CD-5678', model: 'Ashok Leyland', cap: 45, fuel: 'DIESEL' },
    { reg: 'TN-01-EF-9012', model: 'Force Traveller', cap: 26, fuel: 'DIESEL' },
  ];

  const driverStaff = staffRecords['transport1@school.com'];
  const conductorStaff = staffRecords['transport2@school.com'];
  const driver2Staff = staffRecords['transport3@school.com'];

  const vehicles = [];
  const drivers = [driverStaff, driver2Staff, driverStaff];
  const conductors = [conductorStaff, conductorStaff, null];
  for (let i = 0; i < vehicleData.length; i++) {
    const vd = vehicleData[i];
    let vehicle = await prisma.vehicle.findUnique({ where: { registrationNo: vd.reg } });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          registrationNo: vd.reg,
          model: vd.model,
          capacity: vd.cap,
          driverId: drivers[i]?.id,
          conductorId: conductors[i]?.id,
          serviceDate: new Date('2024-01-15'),
          maintenanceDate: new Date('2025-12-01'),
          fuelType: vd.fuel,
          averageMileage: pick([8, 10, 12]),
          currentMileage: Math.floor(50000 + Math.random() * 100000),
          condition: pick(['EXCELLENT', 'GOOD']),
          insuranceExpiry: new Date('2027-01-15'),
        },
      });
    }
    vehicles.push(vehicle);
  }

  // Routes
  const routeData = [
    { name: 'Route 1 - City Center', fee: 1200, stops: ['School Gate', 'Main Road', 'Market Square', 'City Center', 'Railway Station'] },
    { name: 'Route 2 - Suburb East', fee: 1000, stops: ['School Gate', 'East Colony', 'Park Avenue', 'Green Hills', 'Suburb Terminal'] },
    { name: 'Route 3 - North Town', fee: 1500, stops: ['School Gate', 'Highway Junction', 'Industrial Area', 'North Town'] },
  ];

  const routes = [];
  for (let i = 0; i < routeData.length; i++) {
    const rd = routeData[i];
    let route = await prisma.route.findFirst({ where: { vehicleId: vehicles[i].id } });
    if (!route) {
      route = await prisma.route.create({
        data: {
          name: rd.name,
          vehicleId: vehicles[i].id,
          monthlyFee: rd.fee,
          totalStops: rd.stops.length,
          estimatedDuration: 30 + i * 10,
        },
      });

      // Bus stops
      for (let s = 0; s < rd.stops.length; s++) {
        await prisma.busStop.create({
          data: {
            routeId: route.id,
            stopName: rd.stops[s],
            location: `${rd.stops[s]}, City`,
            stopOrder: s + 1,
            arrivalTime: `${String(7 + Math.floor(s * 0.3)).padStart(2, '0')}:${String(s * 10).padStart(2, '0')}`,
          },
        });
      }
    }
    routes.push(route);
  }

  // Student Transport enrollment
  let stCount = 0;
  for (let i = 0; i < 12; i++) {
    const student = studentRecords[i];
    const route = routes[i % routes.length];
    const existing = await prisma.studentTransport.findFirst({
      where: { studentId: student.id, routeId: route.id },
    });
    if (!existing) {
      await prisma.studentTransport.create({
        data: {
          studentId: student.id,
          routeId: route.id,
          pickupStop: routeData[i % routes.length].stops[1],
          dropoffStop: routeData[i % routes.length].stops[routeData[i % routes.length].stops.length - 1],
          monthlyFee: route.monthlyFee,
          feePaid: pick([true, true, false]),
        },
      });
      stCount++;
    }
  }

  // Maintenance records
  for (const vehicle of vehicles) {
    await prisma.maintenanceRecord.create({
      data: {
        vehicleId: vehicle.id,
        description: 'Regular servicing and oil change',
        cost: pick([5000, 8000, 12000]),
        date: new Date('2025-12-01'),
        nextServiceDate: new Date('2026-03-01'),
        parts: 'Oil filter, Air filter, Brake pads',
        mechanic: 'Sharma Motors',
      },
    });
  }
  console.log(`  ✅ ${vehicles.length} vehicles, ${routes.length} routes, ${stCount} transport enrollments`);

  // ===================== HOSTEL =====================
  console.log('🏠 Seeding Hostel...');

  // Hostel Settings
  await prisma.hostelSettings.upsert({
    where: { id: 'default-hostel-settings' },
    update: {},
    create: {
      id: 'default-hostel-settings',
      defaultMonthlyFee: 3000,
      defaultDepositAmount: 5000,
      visitorTimeFrom: '09:00',
      visitorTimeTo: '18:00',
      leaveApprovalRequired: true,
      attendanceRequired: true,
    },
  });

  const wardenStaff = staffRecords['warden@school.com'];

  const hostelData = [
    { name: 'Vivekananda Boys Hostel', type: 'BOYS', capacity: 100 },
    { name: 'Sarojini Girls Hostel', type: 'GIRLS', capacity: 80 },
  ];

  const hostels = [];
  for (const hd of hostelData) {
    let hostel = await prisma.hostel.findFirst({ where: { name: hd.name } });
    if (!hostel) {
      hostel = await prisma.hostel.create({
        data: {
          name: hd.name,
          type: hd.type,
          capacity: hd.capacity,
          wardenId: wardenStaff?.id,
          address: 'School Campus',
          contactNo: '9876543210',
          facilities: 'WiFi, Hot Water, Study Room, TV Room, Mess',
          rules: 'Lights out at 10 PM. No outside food after 8 PM. Ragging is strictly prohibited.',
        },
      });
    }
    hostels.push(hostel);
  }

  // Rooms & Beds
  const roomTypes = ['DOUBLE', 'TRIPLE', 'DORMITORY'];
  for (const hostel of hostels) {
    const existingRooms = await prisma.hostelRoom.count({ where: { hostelId: hostel.id } });
    if (existingRooms === 0) {
      for (let floor = 1; floor <= 3; floor++) {
        for (let r = 1; r <= 5; r++) {
          const roomType = roomTypes[(floor * r) % roomTypes.length];
          const capacity = roomType === 'DOUBLE' ? 2 : roomType === 'TRIPLE' ? 3 : 6;
          const room = await prisma.hostelRoom.create({
            data: {
              hostelId: hostel.id,
              roomNumber: `${floor}${String(r).padStart(2, '0')}`,
              floor,
              capacity,
              type: roomType,
              rentAmount: capacity === 2 ? 4000 : capacity === 3 ? 3500 : 2500,
              amenities: 'Bed, Cupboard, Study Table, Fan',
              status: 'AVAILABLE',
            },
          });

          // Create beds
          for (let b = 1; b <= capacity; b++) {
            await prisma.hostelBed.create({
              data: {
                roomId: room.id,
                bedNo: b,
                status: 'VACANT',
              },
            });
          }
        }
      }
    }
  }

  // Hostel Students
  let hsCount = 0;
  const boysHostel = hostels[0];
  const girlsHostel = hostels[1];
  const boysRooms = await prisma.hostelRoom.findMany({ where: { hostelId: boysHostel.id }, take: 5 });
  const girlsRooms = await prisma.hostelRoom.findMany({ where: { hostelId: girlsHostel.id }, take: 5 });

  for (let i = 0; i < 10; i++) {
    const student = studentRecords[20 + i]; // Use later students for hostel
    if (!student) continue;
    const isBoy = student.gender === 'MALE';
    const hostel = isBoy ? boysHostel : girlsHostel;
    const rooms = isBoy ? boysRooms : girlsRooms;
    const room = rooms[i % rooms.length];
    if (!room) continue;

    const beds = await prisma.hostelBed.findMany({ where: { roomId: room.id, status: 'VACANT' }, take: 1 });
    if (beds.length === 0) continue;

    const existing = await prisma.hostelStudent.findFirst({
      where: { studentId: student.id, hostelId: hostel.id },
    });
    if (!existing) {
      await prisma.hostelStudent.create({
        data: {
          studentId: student.id,
          hostelId: hostel.id,
          roomId: room.id,
          bedId: beds[0].id,
          checkInDate: new Date('2025-04-05'),
          depositAmount: 5000,
          monthlyFee: 3000,
          feePaid: pick([true, false]),
          emergencyContact: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        },
      });
      await prisma.hostelBed.update({
        where: { id: beds[0].id },
        data: { status: 'OCCUPIED', studentId: student.id },
      });
      hsCount++;
    }
  }

  // Hostel Notices
  for (const hostel of hostels) {
    await prisma.hostelNotice.create({
      data: {
        hostelId: hostel.id,
        title: 'Welcome to Hostel Life',
        content: 'Welcome all new residents! Please read the hostel rules carefully and maintain discipline.',
        priority: 'IMPORTANT',
        isActive: true,
        createdBy: adminUser.id,
      },
    });
    await prisma.hostelNotice.create({
      data: {
        hostelId: hostel.id,
        title: 'Mess Menu Updated',
        content: 'New mess menu is effective from this week. Check the notice board for details.',
        priority: 'NORMAL',
        isActive: true,
        createdBy: wardenStaff?.id || adminUser.id,
      },
    });
  }

  // Hostel Complaints
  const complaintCategories = ['MAINTENANCE', 'CLEANLINESS', 'SECURITY', 'NOISE'];
  for (let i = 0; i < 5; i++) {
    const student = studentRecords[20 + i];
    if (!student) continue;
    const hostel = student.gender === 'MALE' ? boysHostel : girlsHostel;
    await prisma.hostelComplaint.create({
      data: {
        studentId: student.id,
        hostelId: hostel.id,
        category: pick(complaintCategories),
        subject: pick(['Water leakage', 'Broken fan', 'Noisy neighbors', 'Dirty bathroom', 'WiFi not working']),
        description: 'This issue has been persisting for a few days. Please look into it urgently.',
        priority: pick(['LOW', 'MEDIUM', 'HIGH']),
        status: pick(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
      },
    });
  }

  // Hostel Visitors
  for (let i = 0; i < 4; i++) {
    const student = studentRecords[20 + i];
    if (!student) continue;
    await prisma.hostelVisitor.create({
      data: {
        studentId: student.id,
        visitorName: pick(['Mr. Prasad', 'Mrs. Sharma', 'Mr. Mehta', 'Mrs. Iyer']),
        relation: pick(['Father', 'Mother', 'Uncle', 'Aunt']),
        contactNo: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        purpose: pick(['Regular visit', 'Bringing supplies', 'Health checkup', 'Birthday celebration']),
        visitDate: new Date(),
        inTime: new Date(),
        approved: true,
        approvedBy: wardenStaff?.id || adminUser.id,
      },
    });
  }

  console.log(`  ✅ ${hostels.length} hostels, ${hsCount} hostel students, rooms, beds, notices, complaints, visitors`);

  // ===================== ACTIVITY LOGS =====================
  console.log('📊 Seeding Activity Logs...');
  const activityData = [
    { action: 'USER_LOGIN', type: 'LOGIN', module: 'auth', desc: 'Admin logged in' },
    { action: 'STUDENT_CREATE', type: 'CREATE', module: 'students', desc: 'New student Alice Smith created' },
    { action: 'FEE_PAYMENT', type: 'PAYMENT', module: 'fees', desc: 'Fee payment collected for student STU2001' },
    { action: 'ATTENDANCE_MARK', type: 'ATTENDANCE_MARK', module: 'attendance', desc: 'Attendance marked for Grade 10-A' },
    { action: 'EXAM_MARK', type: 'CREATE', module: 'exams', desc: 'Exam results entered for Quarterly Exam' },
    { action: 'DOCUMENT_UPLOAD', type: 'UPLOAD', module: 'files', desc: 'Report card uploaded for student STU2001' },
    { action: 'TIMETABLE_CREATE', type: 'CREATE', module: 'timetable', desc: 'Timetable created for Grade 9-A' },
    { action: 'SETTINGS_CHANGE', type: 'UPDATE', module: 'settings', desc: 'Library settings updated' },
  ];

  for (const a of activityData) {
    await prisma.activity.create({
      data: {
        userId: adminUser.id,
        action: a.action,
        actionType: a.type,
        module: a.module,
        description: a.desc,
        ipAddress: '127.0.0.1',
        status: 'SUCCESS',
      },
    });
  }
  console.log(`  ✅ ${activityData.length} activity logs created`);

  // ===================== PERMISSIONS =====================
  console.log('🔐 Seeding Permissions...');
  const modules = ['students', 'staff', 'fees', 'attendance', 'exams', 'timetable', 'library', 'transport', 'hostel', 'lms', 'notifications', 'dashboard', 'permissions'];
  const actions = ['view', 'create', 'update', 'delete'];
  let permCount = 0;
  for (const mod of modules) {
    for (const act of actions) {
      const key = `${mod}.${act}`;
      const existing = await prisma.permission.findUnique({ where: { key } });
      if (!existing) {
        await prisma.permission.create({
          data: {
            key,
            name: `${act.charAt(0).toUpperCase() + act.slice(1)} ${mod.charAt(0).toUpperCase() + mod.slice(1)}`,
            module: mod,
            description: `Allows ${act}ing ${mod}`,
            isSystem: true,
          },
        });
        permCount++;
      }
    }
  }
  console.log(`  ✅ ${permCount} permissions created`);

  console.log('\n========================================');
  console.log('  ✅ ALL MODULES SEEDED SUCCESSFULLY!');
  console.log('========================================');
  console.log('\nLogin credentials:');
  console.log('  Admin:      admin@school.com / Admin@123');
  console.log('  Principal:  principal@school.com / Principal@123');
  console.log('  Teachers:   teacher@school.com / Teacher@123');
  console.log('              teacher2-5@school.com / Teacher@123');
  console.log('  Student:    student1-30@school.com / Student@123');
  console.log('  Accountant: accounts@school.com / Accounts@123');
  console.log('  Librarian:  librarian@school.com / Library@123');
  console.log('  Parents:    parent1-10@school.com / Parent@123');
  console.log('  Transport:  transport1-3@school.com / Transport@123');
  console.log('  Warden:     warden@school.com / Warden@123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
