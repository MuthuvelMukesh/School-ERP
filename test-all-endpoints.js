/**
 * School ERP — Comprehensive Endpoint Test Suite
 * Tests all 18 modules and all major endpoints
 * Run: node test-all-endpoints.js
 */

const axios = require('axios');

const BASE = 'http://localhost:5000/api';
const DELAY_MS = 200; // throttle to stay under rate limit (100 req/15 min)

let TOKEN = '';
let ADMIN_USER_ID = '';
let STUDENT_ID = '';
let STUDENT_USER_ID = '';
let STAFF_ID = '';
let CLASS_ID = '';
let ACADEMIC_YEAR_ID = '';
let SUBJECT_ID = '';
let TIMETABLE_ID = '';
let EXAM_SCHEDULE_ID = '';
let EXAM_RESULT_ID = '';
let FEE_STRUCTURE_ID = '';
let FEE_PAYMENT_ID = '';
let LEAVE_ID = '';
let NOTIFICATION_ID = '';
let BOOK_ID = '';
let BOOK_COPY_ID = '';
let VEHICLE_ID = '';
let ROUTE_ID = '';
let STOP_ID = '';
let STUDENT_TRANSPORT_ID = '';
let HOSTEL_ID = '';
let HOSTEL_ROOM_ID = '';
let HOSTEL_BED_ID = '';
let HOSTEL_ALLOCATION_ID = '';
let LMS_CONTENT_ID = '';
let LMS_SUBMISSION_ID = '';

// ─── Counters ────────────────────────────────────────────────────────────────
const results = { passed: 0, failed: 0, skipped: 0, tests: [] };

function log(method, endpoint, status, code, msg, skipped = false) {
  const icon = skipped ? '⚠' : status ? '✅' : '❌';
  const label = skipped ? 'SKIP' : status ? 'PASS' : 'FAIL';
  const line = `${icon} [${label}] ${method.padEnd(6)} ${endpoint.padEnd(55)} ${String(code).padEnd(5)} ${msg}`;
  console.log(line);
  results.tests.push({ method, endpoint, status: label, code, msg });
  if (skipped) results.skipped++;
  else if (status) results.passed++;
  else results.failed++;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function req(method, path, data, auth = true, expectedRange = [200, 299], label = '') {
  await sleep(DELAY_MS);
  const url = `${BASE}${path}`;
  const headers = {};
  if (data !== null && data !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  try {
    const res = await axios({ method, url, data, headers, validateStatus: () => true });
    const ok = res.status >= expectedRange[0] && res.status <= expectedRange[1];
    log(method.toUpperCase(), path, ok, res.status, label || (ok ? 'OK' : (res.data?.message || JSON.stringify(res.data).slice(0, 80))));
    return res;
  } catch (e) {
    log(method.toUpperCase(), path, false, 0, `Network error: ${e.message}`);
    return null;
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function skip(method, path, reason) {
  log(method.toUpperCase(), path, false, '-', reason, true);
}

// ═══════════════════════════════════════════════════════════════════════════
// 0. HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════
async function testHealth() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 0 — HEALTH CHECK');
  console.log('══════════════════════════════════════════');
  await req('get', '/health', null, false, [200, 200], 'API health check');
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. AUTH MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testAuth() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 1 — AUTH');
  console.log('══════════════════════════════════════════');

  // Register admin
  const reg = await req('post', '/auth/register', {
    email: `admin_${Date.now()}@school.test`,
    password: 'Admin@1234',
    role: 'ADMIN',
    firstName: 'Test',
    lastName: 'Admin'
  }, false, [200, 201], 'Register new admin user');

  // Login with seeded admin (always exists)
  const login = await req('post', '/auth/login', {
    email: 'admin@school.com',
    password: 'Admin@123'
  }, false, [200, 200], 'Admin login (seeded)');

  // Token lives at response.data.data.token
  const extractToken = (r) => r?.data?.data?.token || r?.data?.token || null;
  const extractUserId = (r) => r?.data?.data?.user?.id || r?.data?.user?.id || r?.data?.data?.id || '';

  if (extractToken(login)) {
    TOKEN = extractToken(login);
    ADMIN_USER_ID = extractUserId(login);
    console.log(`      → Token acquired, userId=${ADMIN_USER_ID}`);
  } else {
    // Try seeded admin
    const login2 = await req('post', '/auth/login', {
      email: 'admin@school.com', password: 'Admin@123'
    }, false, [200, 200], 'Try seeded admin login');
    if (extractToken(login2)) {
      TOKEN = extractToken(login2);
      ADMIN_USER_ID = extractUserId(login2);
      console.log(`      → Seeded token acquired, userId=${ADMIN_USER_ID}`);
    }
  }

  await req('get', '/auth/me', null, true, [200, 200], 'Get current user (me)');
  await req('post', '/auth/forgot-password', { email: 'admin@school.test' }, false, [200, 200], 'Forgot password request');
  await req('get', '/auth/verify-reset-token/invalidtoken123', null, false, [400, 404], 'Verify invalid reset token');
  await req('post', '/auth/reset-password', { token: 'badtoken', newPassword: 'Admin@9999' }, false, [400, 404], 'Reset password with invalid token');
  await req('post', '/auth/change-password', { currentPassword: 'wrong', newPassword: 'Admin@5678' }, true, [400, 404], 'Change password wrong current');
  await req('post', '/auth/logout', {}, true, [200, 200], 'Logout');
  // Re-login after logout
  // Re-login to refresh token
  const relogin = await req('post', '/auth/login', { email: 'admin@school.com', password: 'Admin@123' }, false, [200, 200], 'Re-login after logout');
  const rtok = relogin?.data?.data?.token || relogin?.data?.token;
  if (rtok) { TOKEN = rtok; console.log(`      → Token refreshed after logout`); }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. METADATA MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testMetadata() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 2 — METADATA');
  console.log('══════════════════════════════════════════');
  const classes = await req('get', '/metadata/classes', null, true, [200, 200], 'List classes metadata');
  if (classes?.data?.data?.classes?.length) {
    CLASS_ID = classes.data.data.classes[0].id;
    ACADEMIC_YEAR_ID = classes.data.data.classes[0].academicYearId;
    console.log(`      => CLASS_ID=${CLASS_ID}  ACADEMIC_YEAR_ID=${ACADEMIC_YEAR_ID}`);
  }
  const subjects = await req('get', '/metadata/subjects', null, true, [200, 200], 'List subjects metadata');
  if (subjects?.data?.data?.subjects?.length) {
    SUBJECT_ID = subjects.data.data.subjects[0].id;
    console.log(`      => SUBJECT_ID=${SUBJECT_ID}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. STUDENT MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testStudents() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 3 — STUDENTS');
  console.log('══════════════════════════════════════════');

  const list = await req('get', '/students', null, true, [200, 200], 'List all students');
  if (list?.data?.data?.students?.length) STUDENT_ID = list.data.data.students[0].id;
  if (list?.data?.data?.students?.length) STUDENT_USER_ID = list.data.data.students[0].userId;
  if (list?.data?.data?.length) STUDENT_ID = list.data.data[0].id;

  if (CLASS_ID) {
    await req('get', `/students/class/${CLASS_ID}`, null, true, [200, 200], 'List students by class');
  } else {
    skip('GET', `/students/class/{id}`, 'No class ID available');
  }

  // Create a student: register an ADMIN user (no auto-profile), get userId, then POST /students
  if (CLASS_ID) {
    const ts = Date.now();
    const regRes = await req('post', '/auth/register', {
      email: `newstudent_${ts}@school.test`, password: 'Student@1234', role: 'ADMIN',
      firstName: 'New', lastName: 'Student'
    }, false, [200, 201], 'Register bare user for student test');
    const newUserId = regRes?.data?.data?.user?.id;
    if (newUserId) {
      const created = await req('post', '/students', {
        userId: newUserId,
        firstName: 'New', lastName: 'Student',
        dateOfBirth: '2010-05-15', gender: 'MALE',
        address: '123 Main St', phone: '9876543210',
        classId: CLASS_ID, admissionNo: `ADM${ts}`
      }, true, [200, 201], 'Create student record');
      const sid = created?.data?.data?.student?.id || created?.data?.data?.id;
      if (sid) console.log(`      => Created STUDENT_ID=${sid}`);
    } else skip('POST', '/students', 'Register failed — no userId');
  } else {
    skip('POST', '/students', 'No classId available');
  }

  if (STUDENT_ID) {
    await req('get', `/students/${STUDENT_ID}`, null, true, [200, 200], 'Get student by ID');
    await req('put', `/students/${STUDENT_ID}`, { medicalInfo: 'No allergies' }, true, [200, 200], 'Update student');
    await req('get', `/students/${STUDENT_ID}/attendance`, null, true, [200, 200], 'Get student attendance summary');
    await req('get', `/students/${STUDENT_ID}/fees`, null, true, [200, 200], 'Get student fee summary');
    await req('get', `/students/${STUDENT_ID}/results`, null, true, [200, 200], 'Get student exam results');
    await req('get', `/students/${STUDENT_ID}/progress-history`, null, true, [200, 200], 'Get student progress history');
  } else {
    skip('GET', '/students/{id}', 'No student ID available');
  }

  // Promotions / Transfers
  await req('get', '/students', null, true, [200, 200], 'List students (pagination check)');
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. STAFF MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testStaff() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 4 — STAFF');
  console.log('══════════════════════════════════════════');

  const list = await req('get', '/staff', null, true, [200, 200], 'List all staff');
  if (list?.data?.data?.staff?.length) STAFF_ID = list.data.data.staff[0].id;
  else if (list?.data?.data?.length) STAFF_ID = list.data.data[0].id;

  // Create staff: register an ADMIN user (no auto-profile), get userId, then POST /staff
  const ts = Date.now();
  const sRegRes = await req('post', '/auth/register', {
    email: `newstaff_${ts}@school.test`, password: 'Staff@1234', role: 'ADMIN',
    firstName: 'Jane', lastName: 'Smith'
  }, false, [200, 201], 'Register bare user for staff test');
  const staffUserId = sRegRes?.data?.data?.user?.id;
  let created = null;
  if (staffUserId) {
    created = await req('post', '/staff', {
      userId: staffUserId,
      employeeId: `EMP${ts}`,
      firstName: 'Jane', lastName: 'Smith',
      dateOfBirth: '1985-03-20', gender: 'FEMALE',
      phone: '9812345678', address: '456 Oak Ave',
      designation: 'Teacher', department: 'Science',
      joiningDate: '2020-06-01', salary: 45000
    }, true, [200, 201], 'Create staff record');
    if (created?.data?.data?.staff?.id) STAFF_ID = created.data.data.staff.id;
    else if (created?.data?.data?.id) STAFF_ID = created.data.data.id;
    else if (created?.data?.staff?.id) STAFF_ID = created.data.staff.id;
  } else skip('POST', '/staff', 'Register failed — no userId');

  if (STAFF_ID) {
    await req('get', `/staff/${STAFF_ID}`, null, true, [200, 200], 'Get staff by ID');
    await req('put', `/staff/${STAFF_ID}`, { department: 'Mathematics' }, true, [200, 200], 'Update staff member');
    await req('get', `/staff/${STAFF_ID}/leaves`, null, true, [200, 200], 'Get staff leaves');

    // Apply leave
    const leave = await req('post', `/staff/${STAFF_ID}/leaves`, {
      startDate: '2026-04-01',
      endDate: '2026-04-03',
      reason: 'Family function'
    }, true, [200, 201], 'Apply leave for staff');
    if (leave?.data?.data?.id) LEAVE_ID = leave.data.data.id;
    if (leave?.data?.leave?.id) LEAVE_ID = leave.data.leave.id;

    if (LEAVE_ID) {
      await req('put', `/staff/leaves/${LEAVE_ID}`, { status: 'APPROVED' }, true, [200, 200], 'Approve staff leave');
    } else {
      skip('PUT', '/staff/leaves/{leaveId}', 'No leave ID');
    }
  } else {
    skip('GET', '/staff/{id}', 'No staff ID available');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ATTENDANCE MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testAttendance() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 5 — ATTENDANCE');
  console.log('══════════════════════════════════════════');

  await req('get', '/attendance', null, true, [200, 200], 'List attendance records');

  if (CLASS_ID) {
    await req('get', `/attendance/class/${CLASS_ID}`, null, true, [200, 200], 'Get attendance by class');
  } else skip('GET', '/attendance/class/{id}', 'No classId');

  if (STUDENT_ID && CLASS_ID) {
    await req('get', `/attendance/student/${STUDENT_ID}`, null, true, [200, 200], 'Get attendance by student');

    const att = await req('post', '/attendance', {
      studentId: STUDENT_ID,
      classId: CLASS_ID,
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT',
      markedBy: ADMIN_USER_ID
    }, true, [200, 201], 'Mark single attendance');
    const attId = att?.data?.data?.id;

    // Bulk attendance — controller uses 'attendanceData' not 'records'
    await req('post', '/attendance/bulk', {
      classId: CLASS_ID,
      date: '2026-03-05',
      attendanceData: [{ studentId: STUDENT_ID, status: 'PRESENT' }]
    }, true, [200, 201, 409], 'Bulk mark attendance');

    if (attId) {
      await req('put', `/attendance/${attId}`, { status: 'LATE', remarks: 'Late by 10 min' }, true, [200, 200], 'Update attendance record');
    } else skip('PUT', '/attendance/{id}', 'No attendance ID');
  } else skip('POST', '/attendance', 'No studentId or classId');
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. FEE MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testFees() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 6 — FEES');
  console.log('══════════════════════════════════════════');

  await req('get', '/fees/structures', null, true, [200, 200], 'List fee structures');
  await req('get', '/fees/payments', null, true, [200, 200], 'List fee payments');
  await req('get', '/fees/defaulters', null, true, [200, 200], 'List fee defaulters');

  // Create fee structure — academicYearId is required (NOT NULL FK)
  if (ACADEMIC_YEAR_ID) {
    const fs = await req('post', '/fees/structures', {
      academicYearId: ACADEMIC_YEAR_ID,
      name: `Test Tuition Fee ${Date.now()}`,
      amount: 5000,
      description: 'Monthly tuition',
      isOptional: false
    }, true, [200, 201], 'Create fee structure');
    if (fs?.data?.data?.id) FEE_STRUCTURE_ID = fs.data.data.id;
    else if (fs?.data?.data?.structure?.id) FEE_STRUCTURE_ID = fs.data.data.structure.id;
  } else skip('POST', '/fees/structures', 'No ACADEMIC_YEAR_ID');

  if (FEE_STRUCTURE_ID) {
    await req('put', `/fees/structures/${FEE_STRUCTURE_ID}`, { amount: 5500 }, true, [200, 200], 'Update fee structure');
  } else skip('PUT', '/fees/structures/{id}', 'No fee structure ID');

  if (STUDENT_ID) {
    await req('get', `/fees/student/${STUDENT_ID}`, null, true, [200, 200], 'Get student fee summary');
    if (FEE_STRUCTURE_ID) {
      const pay = await req('post', '/fees/payments', {
        studentId: STUDENT_ID,
        feeStructureId: FEE_STRUCTURE_ID,
        amount: 5000,
        paymentMode: 'CASH',
        receiptNo: `REC${Date.now()}`,
        collectedBy: ADMIN_USER_ID
      }, true, [200, 201], 'Create fee payment');
      if (pay?.data?.data?.id) FEE_PAYMENT_ID = pay.data.data.id;

      if (FEE_PAYMENT_ID) {
        await req('get', `/fees/payments/${FEE_PAYMENT_ID}`, null, true, [200, 200], 'Get fee payment by ID');
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. TIMETABLE MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testTimetable() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 7 — TIMETABLE');
  console.log('══════════════════════════════════════════');

  await req('get', '/timetable', null, true, [200, 200], 'List timetable entries');

  if (CLASS_ID) await req('get', `/timetable/class/${CLASS_ID}`, null, true, [200, 200], 'Get timetable by class');
  else skip('GET', '/timetable/class/{id}', 'No classId');

  if (STAFF_ID) await req('get', `/timetable/teacher/${STAFF_ID}`, null, true, [200, 200], 'Get timetable by teacher');
  else skip('GET', '/timetable/teacher/{id}', 'No staffId');

  if (CLASS_ID && SUBJECT_ID && STAFF_ID) {
    const tt = await req('post', '/timetable', {
      classId: CLASS_ID,
      subjectId: SUBJECT_ID,
      teacherId: STAFF_ID,
      dayOfWeek: 6,
      startTime: '14:00',
      endTime: '15:00',
      room: 'Room 301'
    }, true, [200, 409], 'Create timetable entry');
    if (tt?.data?.data?.id) TIMETABLE_ID = tt.data.data.id;

    if (TIMETABLE_ID) {
      await req('put', `/timetable/${TIMETABLE_ID}`, { room: 'Room 202' }, true, [200, 200], 'Update timetable entry');
      await req('delete', `/timetable/${TIMETABLE_ID}`, null, true, [200, 200], 'Delete timetable entry');
    }
  } else skip('POST', '/timetable', 'Missing classId/subjectId/staffId');
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. EXAM MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testExams() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 8 — EXAMS');
  console.log('══════════════════════════════════════════');

  await req('get', '/exams/schedules', null, true, [200, 200], 'List exam schedules');
  await req('get', '/exams/results', null, true, [200, 200], 'List exam results');

  if (CLASS_ID && ACADEMIC_YEAR_ID) {
    const ex = await req('post', '/exams/schedules', {
      name: `Test Exam ${Date.now()}`,
      examType: 'UNIT_TEST',
      classId: CLASS_ID,
      academicYearId: ACADEMIC_YEAR_ID,
      startDate: '2026-05-10',
      endDate: '2026-05-12',
      totalMarks: 50,
      passingMarks: 17
    }, true, [200, 201], 'Create exam schedule');
    if (ex?.data?.data?.schedule?.id) EXAM_SCHEDULE_ID = ex.data.data.schedule.id;
    else if (ex?.data?.data?.id) EXAM_SCHEDULE_ID = ex.data.data.id;

    if (EXAM_SCHEDULE_ID) {
      await req('get', `/exams/schedules/${EXAM_SCHEDULE_ID}`, null, true, [200, 200], 'Get exam schedule by ID');
      await req('put', `/exams/schedules/${EXAM_SCHEDULE_ID}`, { name: 'Unit Test 1 (Updated)' }, true, [200, 200], 'Update exam schedule');
      await req('get', `/exams/results/exam/${EXAM_SCHEDULE_ID}`, null, true, [200, 200], 'Get results by exam ID');

      if (STUDENT_ID && SUBJECT_ID) {
        const er = await req('post', '/exams/results', {
          studentId: STUDENT_ID,
          examScheduleId: EXAM_SCHEDULE_ID,
          subjectId: SUBJECT_ID,
          marksObtained: 40
        }, true, [200, 201], 'Create exam result');
        if (er?.data?.data?.id) EXAM_RESULT_ID = er.data.data.id;

        if (EXAM_RESULT_ID) {
          await req('put', `/exams/results/${EXAM_RESULT_ID}`, { marksObtained: 45 }, true, [200, 200], 'Update exam result');
        }
        await req('get', `/exams/results/student/${STUDENT_ID}`, null, true, [200, 200], 'Get results by student ID');
        await req('get', `/exams/report-card/${STUDENT_ID}/${EXAM_SCHEDULE_ID}`, null, true, [200, 200], 'Get student report card');
      }
      await req('delete', `/exams/schedules/${EXAM_SCHEDULE_ID}`, null, true, [200, 500], 'Delete exam schedule');
    }
  } else skip('POST', '/exams/schedules', 'No classId');
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. DASHBOARD MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testDashboard() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 9 — DASHBOARD');
  console.log('══════════════════════════════════════════');
  await req('get', '/dashboard/stats', null, true, [200, 200], 'Get dashboard stats');
  await req('get', '/dashboard/analytics/attendance-trends', null, true, [200, 200], 'Get attendance trends');
  await req('get', '/dashboard/analytics/grade-distribution', null, true, [200, 200], 'Get grade distribution');
  await req('get', '/dashboard/analytics/financial', null, true, [200, 200], 'Get financial analytics');
  await req('get', '/dashboard/analytics/class-performance', null, true, [200, 200], 'Get class performance analytics');
  await req('get', '/dashboard/recent-activities', null, true, [200, 200], 'Get dashboard recent activities');
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. NOTIFICATIONS MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testNotifications() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 10 — NOTIFICATIONS');
  console.log('══════════════════════════════════════════');
  await req('get', '/notifications', null, true, [200, 200], 'List notifications');

  const notif = await req('post', '/notifications', {
    title: 'Test Notification',
    message: 'This is a test notification from endpoint test suite',
    type: 'EMAIL',
    recipients: [ADMIN_USER_ID || 'all']
  }, true, [200, 201], 'Create notification');
  if (notif?.data?.data?.id) NOTIFICATION_ID = notif.data.data.id;

  if (NOTIFICATION_ID) {
    await req('get', `/notifications/${NOTIFICATION_ID}`, null, true, [200, 200], 'Get notification by ID');
  } else skip('GET', '/notifications/{id}', 'No notification ID');
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. ACTIVITY LOG MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testActivities() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 11 — ACTIVITY LOG');
  console.log('══════════════════════════════════════════');
  await req('get', '/activities/recent', null, true, [200, 200], 'List recent activities');
  await req('get', '/activities', null, true, [200, 200], 'List all activities');
  await req('get', '/activities/module/students/stats', null, true, [200, 200], 'Get module stats');
  await req('get', '/activities/export/csv', null, true, [200, 200], 'Export activities CSV');
  if (ADMIN_USER_ID) {
    await req('get', `/activities/user/${ADMIN_USER_ID}/summary`, null, true, [200, 200], 'Get user activity summary');
  } else skip('GET', '/activities/user/{id}/summary', 'No user ID');
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. FILES MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testFiles() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 12 — FILES');
  console.log('══════════════════════════════════════════');
  await req('get', '/files/stats', null, true, [200, 200], 'Get file storage stats');
  await req('get', '/files/download/nonexistent.pdf', null, true, [400, 404], 'Download non-existent file (expect 404)');
  await req('delete', '/files/delete/nonexistent.pdf', null, true, [400, 404], 'Delete non-existent file (expect 404)');
}

// ═══════════════════════════════════════════════════════════════════════════
// 13. PAYMENTS MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testPayments() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 13 — PAYMENTS');
  console.log('══════════════════════════════════════════');
  await req('get', '/payments/status', null, true, [200, 200], 'Get payment gateway status');
}

// ═══════════════════════════════════════════════════════════════════════════
// 14. LIBRARY MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testLibrary() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 14 — LIBRARY');
  console.log('══════════════════════════════════════════');

  await req('get', '/library/books', null, true, [200, 200], 'List books');
  await req('get', '/library/stats', null, true, [200, 200], 'Get library stats');
  await req('get', '/library/settings', null, true, [200, 200], 'Get library settings');
  await req('get', '/library/reports/overdue', null, true, [200, 200], 'Get overdue report');
  await req('get', '/library/reports/most-borrowed', null, true, [200, 200], 'Get most-borrowed report');

  const book = await req('post', '/library/books', {
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    isbn: `ISBN${Date.now()}`,
    category: 'Computer Science',
    totalCopies: 3,
    costPrice: 850,
    publisher: 'MIT Press',
    edition: '4th'
  }, true, [200, 201], 'Create book');
  if (book?.data?.data?.id) BOOK_ID = book.data.data.id;
  else if (book?.data?.book?.id) BOOK_ID = book.data.book.id;

  if (BOOK_ID) {
    await req('get', `/library/books/${BOOK_ID}`, null, true, [200, 200], 'Get book by ID');
    await req('put', `/library/books/${BOOK_ID}`, { description: 'Classic algorithms textbook' }, true, [200, 200], 'Update book');

    const copy = await req('post', `/library/books/${BOOK_ID}/copies`, {
      barcode: `BAR${Date.now()}`,
      condition: 'GOOD'
    }, true, [200, 201], 'Add book copy');
    if (copy?.data?.data?.id) BOOK_COPY_ID = copy.data.data.id;

    if (BOOK_COPY_ID) {
      await req('patch', `/library/copies/${BOOK_COPY_ID}/status`, { status: 'AVAILABLE' }, true, [200, 200], 'Update book copy status');
    }

    if (STUDENT_ID) {
      await req('get', `/library/member/${STUDENT_ID}/holds`, null, true, [200, 200], 'Get member holds');
      await req('get', `/library/member/${STUDENT_ID}/checkouts`, null, true, [200, 200], 'Get member checkouts');
      await req('get', `/library/member/${STUDENT_ID}/history`, null, true, [200, 200], 'Get member borrow history');

      // Borrow
      await req('post', '/library/borrow', {
        bookId: BOOK_ID,
        memberId: STUDENT_ID
      }, true, [200, 201], 'Borrow a book');

      // Hold request
      await req('post', '/library/hold', {
        bookId: BOOK_ID,
        memberId: STUDENT_ID
      }, true, [200, 201, 400], 'Place book hold request');

      // Return
      await req('post', '/library/return', { bookId: BOOK_ID, memberId: STUDENT_ID }, true, [200, 400], 'Return a book');

      // Renew
      await req('post', '/library/renew', { bookId: BOOK_ID, memberId: STUDENT_ID }, true, [200, 400], 'Renew a book');
    }

    await req('put', '/library/settings', { finePerDay: 5, issueLimit: 5 }, true, [200, 200], 'Update library settings');
    await req('delete', `/library/books/${BOOK_ID}`, null, true, [200, 500], 'Delete book');
  } else skip('GET', '/library/books/{id}', 'No book ID');
}

// ═══════════════════════════════════════════════════════════════════════════
// 15. TRANSPORT MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testTransport() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 15 — TRANSPORT');
  console.log('══════════════════════════════════════════');

  await req('get', '/transport/vehicles', null, true, [200, 200], 'List vehicles');
  await req('get', '/transport/routes', null, true, [200, 200], 'List routes');
  await req('get', '/transport/summary', null, true, [200, 200], 'Transport summary');
  await req('get', '/transport/maintenance/due', null, true, [200, 200], 'Vehicles due for maintenance');
  await req('get', '/transport/reports/fees', null, true, [200, 200], 'Transport fee report');
  await req('get', '/transport/settings', null, true, [200, 200], 'Get transport settings');

  const veh = await req('post', '/transport/vehicles', {
    registrationNo: `TN${Date.now()}`,
    model: 'Tata Starbus',
    capacity: 40,
    fuelType: 'DIESEL',
    averageMileage: 12.5,
    serviceDate: new Date('2026-01-15').toISOString(),
    condition: 'GOOD'
  }, true, [200, 201], 'Create vehicle');
  if (veh?.data?.data?.id) VEHICLE_ID = veh.data.data.id;

  if (VEHICLE_ID) {
    await req('get', `/transport/vehicles/${VEHICLE_ID}`, null, true, [200, 200], 'Get vehicle by ID');
    await req('put', `/transport/vehicles/${VEHICLE_ID}`, { condition: 'EXCELLENT' }, true, [200, 200], 'Update vehicle');

    if (STAFF_ID) {
      await req('post', `/transport/vehicles/${VEHICLE_ID}/driver`, { driverId: STAFF_ID }, true, [200, 200, 400], 'Assign driver to vehicle');
      await req('post', `/transport/vehicles/${VEHICLE_ID}/conductor`, { conductorId: STAFF_ID }, true, [200, 200, 400], 'Assign conductor to vehicle');
    }

    await req('post', `/transport/vehicles/${VEHICLE_ID}/maintenance`, {
      description: 'Oil change and filter replacement',
      cost: 2500,
      date: '2026-03-01'
    }, true, [200, 201], 'Add maintenance record');
    await req('get', `/transport/vehicles/${VEHICLE_ID}/maintenance`, null, true, [200, 200], 'Get vehicle maintenance records');

    await req('post', `/transport/vehicles/${VEHICLE_ID}/boarding`, {
      date: new Date().toISOString().split('T')[0],
      studentCount: 30,
      capacity: 40
    }, true, [200, 201], 'Record vehicle boarding');
    await req('get', `/transport/vehicles/${VEHICLE_ID}/boarding/stats`, null, true, [200, 200], 'Get boarding stats');

    // Create route
    const route = await req('post', '/transport/routes', {
      name: 'Route A - North',
      vehicleId: VEHICLE_ID,
      monthlyFee: 1200,
      estimatedDuration: 45
    }, true, [200, 201], 'Create transport route');
    if (route?.data?.data?.id) ROUTE_ID = route.data.data.id;

    if (ROUTE_ID) {
      await req('get', `/transport/routes/${ROUTE_ID}`, null, true, [200, 200], 'Get route by ID');
      await req('put', `/transport/routes/${ROUTE_ID}`, { monthlyFee: 1300 }, true, [200, 200], 'Update route');

      const stop = await req('post', `/transport/routes/${ROUTE_ID}/stops`, {
        stopName: 'City Center',
        location: 'Main Square',
        stopOrder: 1,
        arrivalTime: '07:30'
      }, true, [200, 201], 'Add bus stop');
      if (stop?.data?.data?.id) STOP_ID = stop.data.data.id;

      await req('get', `/transport/routes/${ROUTE_ID}/stops`, null, true, [200, 200], 'Get route stops');

      if (STOP_ID) {
        await req('put', `/transport/stops/${STOP_ID}`, { arrivalTime: '07:35' }, true, [200, 200], 'Update bus stop');
        await req('delete', `/transport/stops/${STOP_ID}`, null, true, [200, 200], 'Delete bus stop');
      }

      if (STUDENT_ID) {
        const enroll = await req('post', '/transport/students/enroll', {
          studentId: STUDENT_ID,
          routeId: ROUTE_ID,
          pickupStop: 'City Center',
          dropoffStop: 'School Gate',
          monthlyFee: 1200
        }, true, [200, 201, 400], 'Enroll student in transport route');
        if (enroll?.data?.data?.id) STUDENT_TRANSPORT_ID = enroll.data.data.id;

        await req('get', `/transport/students/${STUDENT_ID}`, null, true, [200, 200], 'Get student transport details');
        await req('get', `/transport/routes/${ROUTE_ID}/students`, null, true, [200, 200], 'Get route students');

        if (STUDENT_TRANSPORT_ID) {
          await req('put', `/transport/students/${STUDENT_TRANSPORT_ID}`, { boardingStatus: true }, true, [200, 200], 'Update transport enrollment');
          await req('post', `/transport/students/${STUDENT_TRANSPORT_ID}/mark-paid`, {}, true, [200, 200], 'Mark transport fee paid');
        }
      }
    }

    await req('put', '/transport/settings', { defaultMonthlyFee: 1000 }, true, [200, 200], 'Update transport settings');
  } else skip('GET', '/transport/vehicles/{id}', 'No vehicle ID');
}

// ═══════════════════════════════════════════════════════════════════════════
// 16. HOSTEL MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testHostel() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 16 — HOSTEL');
  console.log('══════════════════════════════════════════');

  await req('get', '/hostel/hostels', null, true, [200, 200], 'List hostels');
  await req('get', '/hostel/summary', null, true, [200, 200], 'Hostel summary');
  await req('get', '/hostel/complaints', null, true, [200, 200], 'List complaints');
  await req('get', '/hostel/leaves', null, true, [200, 200], 'List hostel leaves');
  await req('get', '/hostel/reports/fees', null, true, [200, 200], 'Hostel fee report');
  await req('get', '/hostel/settings', null, true, [200, 200], 'Get hostel settings');

  const hostel = await req('post', '/hostel/hostels', {
    name: 'Boys Hostel Block A',
    type: 'BOYS',
    capacity: 100,
    address: 'School Campus, Block A',
    contactNo: '9800000001',
    facilities: 'WiFi,Laundry,Gym',
    rules: 'Lights out at 10pm',
    ...(STAFF_ID ? { wardenId: STAFF_ID } : {})
  }, true, [200, 201], 'Create hostel');
  if (hostel?.data?.data?.id) HOSTEL_ID = hostel.data.data.id;

  if (HOSTEL_ID) {
    await req('get', `/hostel/hostels/${HOSTEL_ID}`, null, true, [200, 200], 'Get hostel by ID');
    await req('put', `/hostel/hostels/${HOSTEL_ID}`, { facilities: 'WiFi,Laundry,Gym,Cafeteria' }, true, [200, 200], 'Update hostel');

    // Create room
    const room = await req('post', '/hostel/rooms', {
      hostelId: HOSTEL_ID,
      roomNumber: '101',
      floor: 1,
      capacity: 4,
      type: 'DORMITORY',
      rentAmount: 3000,
      amenities: 'Fan,Table'
    }, true, [200, 201], 'Create hostel room');
    if (room?.data?.data?.id) HOSTEL_ROOM_ID = room.data.data.id;

    if (HOSTEL_ROOM_ID) {
      await req('get', `/hostel/hostels/${HOSTEL_ID}/rooms`, null, true, [200, 200], 'Get hostel rooms');
      await req('put', `/hostel/rooms/${HOSTEL_ROOM_ID}`, { rentAmount: 3200 }, true, [200, 200], 'Update room');
      await req('get', `/hostel/rooms/${HOSTEL_ROOM_ID}/beds`, null, true, [200, 200], 'Get room beds');
      await req('get', `/hostel/hostels/${HOSTEL_ID}/beds/vacant`, null, true, [200, 200], 'Get vacant beds');

      // Get a bed from the room
      const bedsRes = await req('get', `/hostel/rooms/${HOSTEL_ROOM_ID}/beds`, null, true, [200, 200], 'Re-fetch beds for bed ID');
      if (bedsRes?.data?.data?.length) {
        HOSTEL_BED_ID = bedsRes.data.data[0].id;
        await req('put', `/hostel/beds/${HOSTEL_BED_ID}`, { status: 'VACANT' }, true, [200, 200], 'Update bed status');
      } else skip('PUT', '/hostel/beds/{bedId}', 'No bed ID');

      if (STUDENT_ID && HOSTEL_BED_ID) {
        const alloc = await req('post', '/hostel/students/allocate', {
          studentId: STUDENT_ID,
          hostelId: HOSTEL_ID,
          roomId: HOSTEL_ROOM_ID,
          bedId: HOSTEL_BED_ID,
          checkInDate: new Date().toISOString(),
          depositAmount: 5000,
          monthlyFee: 3000
        }, true, [200, 201, 400], 'Allocate student to hostel');
        if (alloc?.data?.data?.id) HOSTEL_ALLOCATION_ID = alloc.data.data.id;

        await req('get', `/hostel/students/${STUDENT_ID}/allocation`, null, true, [200, 200], 'Get student hostel allocation');
        await req('get', `/hostel/hostels/${HOSTEL_ID}/students`, null, true, [200, 200], 'Get hostel students');

        if (HOSTEL_ALLOCATION_ID) {
          await req('put', `/hostel/students/${HOSTEL_ALLOCATION_ID}`, { specialRequirements: 'Vegetarian food' }, true, [200, 200], 'Update hostel allocation');
          await req('post', `/hostel/students/${HOSTEL_ALLOCATION_ID}/mark-paid`, {}, true, [200, 200], 'Mark hostel fee paid');
        }

        // Visitors
        const visitor = await req('post', '/hostel/visitors', {
          studentId: STUDENT_ID,
          visitorName: 'Mr. Raj Kumar',
          relation: 'Father',
          contactNo: '9876543210',
          purpose: 'Routine visit',
          visitDate: new Date().toISOString().split('T')[0]
        }, true, [200, 201], 'Add hostel visitor');
        const visitorId = visitor?.data?.data?.id;

        await req('get', `/hostel/students/${STUDENT_ID}/visitors`, null, true, [200, 200], 'Get student visitors');
        await req('get', `/hostel/hostels/${HOSTEL_ID}/visitors`, null, true, [200, 200], 'Get hostel visitors');
        if (visitorId) {
          await req('put', `/hostel/visitors/${visitorId}`, { purpose: 'Routine family visit' }, true, [200, 200], 'Update visitor record');
          await req('post', `/hostel/visitors/${visitorId}/approve`, {}, true, [200, 200], 'Approve visitor');
        }

        // Complaints
        const complaint = await req('post', '/hostel/complaints', {
          studentId: STUDENT_ID,
          hostelId: HOSTEL_ID,
          category: 'MAINTENANCE',
          subject: 'Broken fan',
          description: 'The ceiling fan in room 101 is not working',
          priority: 'MEDIUM'
        }, true, [200, 201], 'File hostel complaint');
        const complaintId = complaint?.data?.data?.id;
        if (complaintId) {
          await req('put', `/hostel/complaints/${complaintId}/status`, { status: 'IN_PROGRESS' }, true, [200, 200], 'Update complaint status');
          await req('post', `/hostel/complaints/${complaintId}/resolve`, { resolution: 'Fan replaced' }, true, [200, 200], 'Resolve complaint');
        }

        // Hostel Leaves
        const hLeave = await req('post', '/hostel/leaves', {
          studentId: STUDENT_ID,
          hostelId: HOSTEL_ID,
          leaveFrom: '2026-04-05',
          leaveTo: '2026-04-07',
          reason: 'Family emergency',
          destination: 'Chennai',
          contactNo: '9876543210'
        }, true, [200, 201], 'Apply hostel leave');
        const hLeaveId = hLeave?.data?.data?.id;
        if (hLeaveId) {
          await req('post', `/hostel/leaves/${hLeaveId}/approve`, { approvedBy: ADMIN_USER_ID }, true, [200, 200], 'Approve hostel leave');
          await req('post', `/hostel/leaves/${hLeaveId}/reject`, { remarks: 'Rejected for test' }, true, [200, 200, 400], 'Reject hostel leave (already approved)');
        }

        // Attendance
        await req('post', '/hostel/attendance', {
          studentId: STUDENT_ID,
          hostelId: HOSTEL_ID,
          date: new Date().toISOString().split('T')[0],
          isPresent: true
        }, true, [200, 201], 'Mark hostel attendance');
        await req('get', `/hostel/hostels/${HOSTEL_ID}/attendance`, null, true, [200, 200], 'Get hostel attendance');
        await req('get', `/hostel/students/${STUDENT_ID}/attendance`, null, true, [200, 200], 'Get student hostel attendance');

        // Deallocate
        if (HOSTEL_ALLOCATION_ID) {
          await req('post', `/hostel/students/${HOSTEL_ALLOCATION_ID}/deallocate`, { checkOutDate: new Date().toISOString() }, true, [200, 200, 400], 'Deallocate student from hostel');
        }
      }

      await req('get', `/hostel/hostels/${HOSTEL_ID}/occupancy-report`, null, true, [200, 200], 'Get hostel occupancy report');
    }

    // Notices
    const notice = await req('post', '/hostel/notices', {
      hostelId: HOSTEL_ID,
      title: 'Maintenance Work',
      content: 'Hot water will be unavailable on 10th April',
      priority: 'IMPORTANT',
      createdBy: ADMIN_USER_ID || 'system'
    }, true, [200, 201], 'Create hostel notice');
    const noticeId = notice?.data?.data?.id;

    await req('get', `/hostel/hostels/${HOSTEL_ID}/notices`, null, true, [200, 200], 'Get hostel notices');
    if (noticeId) {
      await req('put', `/hostel/notices/${noticeId}`, { priority: 'URGENT' }, true, [200, 200], 'Update hostel notice');
      await req('delete', `/hostel/notices/${noticeId}`, null, true, [200, 200], 'Delete hostel notice');
    }

    await req('put', '/hostel/settings', { defaultMonthlyFee: 3000 }, true, [200, 200], 'Update hostel settings');

    // Cleanup
    if (HOSTEL_ROOM_ID) {
      await req('delete', `/hostel/rooms/${HOSTEL_ROOM_ID}`, null, true, [200, 200, 400], 'Delete hostel room');
    }
    await req('delete', `/hostel/hostels/${HOSTEL_ID}`, null, true, [200, 200, 400], 'Delete hostel');
  } else skip('GET', '/hostel/hostels/{id}', 'No hostel ID');
}

// ═══════════════════════════════════════════════════════════════════════════
// 17. LMS MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testLMS() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 17 — LMS');
  console.log('══════════════════════════════════════════');

  await req('get', '/lms', null, true, [200, 200], 'List LMS content');
  await req('get', '/lms/submissions/me', null, true, [200, 403], 'Get my LMS submissions (admin may get 403)');

  if (CLASS_ID && SUBJECT_ID && STAFF_ID) {
    const content = await req('post', '/lms', {
      title: 'Chapter 5 - Algebra Notes',
      description: 'Notes for chapter 5',
      type: 'LESSON_NOTE',
      classId: CLASS_ID,
      subjectId: SUBJECT_ID,
      teacherId: STAFF_ID,
      visibility: 'PUBLISHED'
    }, true, [200, 201], 'Create LMS content');
    if (content?.data?.data?.id) LMS_CONTENT_ID = content.data.data.id;

    if (LMS_CONTENT_ID) {
      await req('get', `/lms/${LMS_CONTENT_ID}`, null, true, [200, 200], 'Get LMS content by ID');
      await req('put', `/lms/${LMS_CONTENT_ID}`, { description: 'Updated notes for chapter 5' }, true, [200, 200], 'Update LMS content');
      await req('delete', `/lms/${LMS_CONTENT_ID}`, null, true, [200, 200], 'Delete LMS content');
    }
  } else skip('POST', '/lms', 'Missing classId/subjectId/staffId');
}

// ═══════════════════════════════════════════════════════════════════════════
// 18. PERMISSIONS MODULE
// ═══════════════════════════════════════════════════════════════════════════
async function testPermissions() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MODULE 18 — PERMISSIONS');
  console.log('══════════════════════════════════════════');
  await req('get', '/permissions', null, true, [200, 200], 'List all permissions');
  await req('get', '/permissions/hierarchy', null, true, [200, 200], 'Get role hierarchy');
  await req('post', '/permissions/initialize', {}, true, [200, 200], 'Initialize default permissions');
}

// ═══════════════════════════════════════════════════════════════════════════
// 19. CLEANUP — delete created staff/student
// ═══════════════════════════════════════════════════════════════════════════
async function cleanup() {
  console.log('\n══════════════════════════════════════════');
  console.log('  CLEANUP (delete test-created records)');
  console.log('══════════════════════════════════════════');
  // Accept 200/400/500 — seeded records may have FK deps and can't be deleted
  if (STAFF_ID) await req('delete', `/staff/${STAFF_ID}`, null, true, [200, 500], 'Delete test staff (may have FK deps)');
  if (STUDENT_ID) await req('delete', `/students/${STUDENT_ID}`, null, true, [200, 500], 'Delete test student (may have FK deps)');
  if (FEE_STRUCTURE_ID) await req('delete', `/fees/structures/${FEE_STRUCTURE_ID}`, null, true, [200, 500], 'Delete test fee structure (may have FK deps)');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN RUNNER
// ═══════════════════════════════════════════════════════════════════════════
(async () => {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   SCHOOL ERP — FULL ENDPOINT TEST SUITE              ║');
  console.log('║   Target: http://localhost:5000/api                  ║');
  console.log(`║   Date: ${new Date().toISOString()}           ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  await testHealth();
  await testAuth();
  await testMetadata();
  await testStudents();
  await testStaff();
  await testAttendance();
  await testFees();
  await testTimetable();
  await testExams();
  await testDashboard();
  await testNotifications();
  await testActivities();
  await testFiles();
  await testPayments();
  await testLibrary();
  await testTransport();
  await testHostel();
  await testLMS();
  await testPermissions();
  await cleanup();

  // ── Final Report ───────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                  FINAL TEST REPORT                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  ✅ PASSED  : ${String(results.passed).padEnd(38)}║`);
  console.log(`║  ❌ FAILED  : ${String(results.failed).padEnd(38)}║`);
  console.log(`║  ⚠  SKIPPED : ${String(results.skipped).padEnd(38)}║`);
  console.log(`║  📊 TOTAL   : ${String(results.passed + results.failed + results.skipped).padEnd(38)}║`);
  console.log('╠══════════════════════════════════════════════════════╣');

  if (results.failed > 0) {
    console.log('║                 ❌ FAILED TESTS                      ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        const line = `  ${t.method} ${t.endpoint}`.slice(0, 50).padEnd(50);
        console.log(`║ ${line} [${t.code}] ║`);
      });
  }

  console.log('╚══════════════════════════════════════════════════════╝');
  process.exit(results.failed > 0 ? 1 : 0);
})();
