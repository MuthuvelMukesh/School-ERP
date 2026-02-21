import axios, { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check if we are in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Student API
export const studentAPI = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  promote: (data: { studentIds: string[]; toClassId: string; reason?: string; remarks?: string }) =>
    api.post('/students/promotions', data),
  detain: (data: { studentIds: string[]; reason?: string; remarks?: string }) =>
    api.post('/students/detentions', data),
  transfer: (data: {
    studentId: string;
    transferType: 'INTERNAL' | 'EXTERNAL';
    toClassId?: string;
    toSchoolName?: string;
    toSchoolAddress?: string;
    transferDate?: string;
    reason?: string;
    remarks?: string;
  }) => api.post('/students/transfers', data),
  getProgressHistory: (id: string) => api.get(`/students/${id}/progress-history`),
  getByClass: (classId: string) => api.get(`/students/class/${classId}`),
  getAttendance: (id: string, params?: any) =>
    api.get(`/students/${id}/attendance`, { params }),
  getFees: (id: string) => api.get(`/students/${id}/fees`),
  getResults: (id: string) => api.get(`/students/${id}/results`),
};

// Staff API
export const staffAPI = {
  getAll: (params?: any) => api.get('/staff', { params }),
  getById: (id: string) => api.get(`/staff/${id}`),
  create: (data: any) => api.post('/staff', data),
  update: (id: string, data: any) => api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
  getLeaves: (id: string) => api.get(`/staff/${id}/leaves`),
  applyLeave: (id: string, data: any) => api.post(`/staff/${id}/leaves`, data),
  updateLeaveStatus: (leaveId: string, data: any) =>
    api.put(`/staff/leaves/${leaveId}`, data),
};

// Fee API
export const feeAPI = {
  getAllStructures: () => api.get('/fees/structures'),
  createStructure: (data: any) => api.post('/fees/structures', data),
  updateStructure: (id: string, data: any) =>
    api.put(`/fees/structures/${id}`, data),
  deleteStructure: (id: string) => api.delete(`/fees/structures/${id}`),
  getAllPayments: (params?: any) => api.get('/fees/payments', { params }),
  getPaymentById: (id: string) => api.get(`/fees/payments/${id}`),
  createPayment: (data: any) => api.post('/fees/payments', data),
  getDefaulters: () => api.get('/fees/defaulters'),
  getStudentFees: (studentId: string) => api.get(`/fees/student/${studentId}`),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params?: any) => api.get('/attendance', { params }),
  markAttendance: (data: any) => api.post('/attendance', data),
  bulkMarkAttendance: (data: any) => api.post('/attendance/bulk', data),
  getClassAttendance: (classId: string, params?: any) =>
    api.get(`/attendance/class/${classId}`, { params }),
  getStudentAttendance: (studentId: string, params?: any) =>
    api.get(`/attendance/student/${studentId}`, { params }),
  updateAttendance: (id: string, data: any) =>
    api.put(`/attendance/${id}`, data),
};

// Timetable API
export const timetableAPI = {
  getAll: () => api.get('/timetable'),
  getClassTimetable: (classId: string) =>
    api.get(`/timetable/class/${classId}`),
  getTeacherTimetable: (teacherId: string) =>
    api.get(`/timetable/teacher/${teacherId}`),
  create: (data: any) => api.post('/timetable', data),
  update: (id: string, data: any) => api.put(`/timetable/${id}`, data),
  delete: (id: string) => api.delete(`/timetable/${id}`),
};

// Exam API
export const examAPI = {
  getAllSchedules: () => api.get('/exams/schedules'),
  getScheduleById: (id: string) => api.get(`/exams/schedules/${id}`),
  createSchedule: (data: any) => api.post('/exams/schedules', data),
  updateSchedule: (id: string, data: any) =>
    api.put(`/exams/schedules/${id}`, data),
  deleteSchedule: (id: string) => api.delete(`/exams/schedules/${id}`),
  getAllResults: () => api.get('/exams/results'),
  getExamResults: (examId: string) => api.get(`/exams/results/exam/${examId}`),
  getStudentResults: (studentId: string) =>
    api.get(`/exams/results/student/${studentId}`),
  createResult: (data: any) => api.post('/exams/results', data),
  updateResult: (id: string, data: any) => api.put(`/exams/results/${id}`, data),
  getReportCard: (studentId: string, examId: string) =>
    api.get(`/exams/report-card/${studentId}/${examId}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
};

// Notification API
export const notificationAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getById: (id: string) => api.get(`/notifications/${id}`),
  send: (data: any) => api.post('/notifications', data),
};

// LMS API
export const lmsAPI = {
  getAll: (params?: any) => api.get('/lms', { params }),
  getById: (id: string) => api.get(`/lms/${id}`),
  create: (data: any) => api.post('/lms', data),
  update: (id: string, data: any) => api.put(`/lms/${id}`, data),
  delete: (id: string) => api.delete(`/lms/${id}`),
  uploadAttachments: (id: string, formData: FormData) =>
    api.post(`/lms/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteAttachment: (contentId: string, attachmentId: string) =>
    api.delete(`/lms/${contentId}/attachments/${attachmentId}`),
  getSubmissions: (contentId: string) => api.get(`/lms/${contentId}/submissions`),
  getMySubmission: (contentId: string) => api.get(`/lms/${contentId}/submissions/me`),
  getMySubmissions: () => api.get('/lms/submissions/me'),
  createSubmission: (contentId: string, formData: FormData) =>
    api.post(`/lms/${contentId}/submissions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  gradeSubmission: (contentId: string, submissionId: string, data: any) =>
    api.put(`/lms/${contentId}/submissions/${submissionId}`, data),
  getAnalytics: (contentId: string) => api.get(`/lms/${contentId}/analytics`)
};

// Metadata API
export const metadataAPI = {
  getClasses: () => api.get('/metadata/classes'),
  getSubjects: (params?: any) => api.get('/metadata/subjects', { params })
};

// Permission API
export const permissionAPI = {
  getAll: () => api.get('/permissions'),
  initialize: () => api.post('/permissions/initialize'),
  create: (data: { key: string; name: string; module: string; description?: string }) =>
    api.post('/permissions', data),
  setRolePermissions: (data: { role: string; permissions: { key: string; allowed: boolean }[] }) =>
    api.put('/permissions/roles', data),
  setUserPermissions: (data: { userId: string; permissions: { key: string; allowed: boolean }[] }) =>
    api.put('/permissions/users', data),
  getHierarchy: () => api.get('/permissions/hierarchy'),
  setHierarchy: (data: { parentRole: string; childRole: string }) =>
    api.put('/permissions/hierarchy', data)
};

// Library API
export const libraryAPI = {
  // Books
  addBook: (data: any) => api.post('/library/books', data),
  getAllBooks: (params?: any) => api.get('/library/books', { params }),
  getBookDetails: (bookId: string) => api.get(`/library/books/${bookId}`),
  updateBook: (bookId: string, data: any) => api.put(`/library/books/${bookId}`, data),
  deleteBook: (bookId: string) => api.delete(`/library/books/${bookId}`),
  // Copies
  addBookCopy: (bookId: string, data: any) => api.post(`/library/books/${bookId}/copies`, data),
  updateCopyStatus: (copyId: string, data: any) => api.patch(`/library/copies/${copyId}/status`, data),
  // Borrow & Return
  issueBook: (data: any) => api.post('/library/borrow', data),
  returnBook: (data: any) => api.post('/library/return', data),
  renewBook: (data: any) => api.post('/library/renew', data),
  getMemberCheckouts: (memberId: string) => api.get(`/library/member/${memberId}/checkouts`),
  // Holds
  createHoldRequest: (data: any) => api.post('/library/hold', data),
  getMemberHolds: (memberId: string) => api.get(`/library/member/${memberId}/holds`),
  // Reports
  getOverdueBooks: () => api.get('/library/reports/overdue'),
  getMostBorrowed: (params?: any) => api.get('/library/reports/most-borrowed', { params }),
  getMemberHistory: (memberId: string) => api.get(`/library/member/${memberId}/history`),
  getStats: () => api.get('/library/stats'),
  // Settings
  getSettings: () => api.get('/library/settings'),
  updateSettings: (data: any) => api.put('/library/settings', data),
};

// Transport API
export const transportAPI = {
  // Vehicles
  addVehicle: (data: any) => api.post('/transport/vehicles', data),
  getAllVehicles: (params?: any) => api.get('/transport/vehicles', { params }),
  getVehicleDetails: (vehicleId: string) => api.get(`/transport/vehicles/${vehicleId}`),
  updateVehicle: (vehicleId: string, data: any) => api.put(`/transport/vehicles/${vehicleId}`, data),
  assignDriver: (vehicleId: string, data: any) => api.post(`/transport/vehicles/${vehicleId}/driver`, data),
  assignConductor: (vehicleId: string, data: any) => api.post(`/transport/vehicles/${vehicleId}/conductor`, data),
  // Routes
  createRoute: (data: any) => api.post('/transport/routes', data),
  getAllRoutes: (params?: any) => api.get('/transport/routes', { params }),
  getRouteDetails: (routeId: string) => api.get(`/transport/routes/${routeId}`),
  updateRoute: (routeId: string, data: any) => api.put(`/transport/routes/${routeId}`, data),
  // Stops
  addBusStop: (routeId: string, data: any) => api.post(`/transport/routes/${routeId}/stops`, data),
  getRouteStops: (routeId: string) => api.get(`/transport/routes/${routeId}/stops`),
  updateBusStop: (stopId: string, data: any) => api.put(`/transport/stops/${stopId}`, data),
  deleteBusStop: (stopId: string) => api.delete(`/transport/stops/${stopId}`),
  // Student Transport
  enrollStudent: (data: any) => api.post('/transport/students/enroll', data),
  getStudentEnrollment: (studentId: string) => api.get(`/transport/students/${studentId}`),
  getRouteStudents: (routeId: string) => api.get(`/transport/routes/${routeId}/students`),
  updateStudentEnrollment: (enrollmentId: string, data: any) => api.put(`/transport/students/${enrollmentId}`, data),
  markTransportFeePaid: (enrollmentId: string) => api.post(`/transport/students/${enrollmentId}/mark-paid`),
  // Maintenance
  addMaintenance: (vehicleId: string, data: any) => api.post(`/transport/vehicles/${vehicleId}/maintenance`, data),
  getMaintenanceHistory: (vehicleId: string) => api.get(`/transport/vehicles/${vehicleId}/maintenance`),
  getDueMaintenance: () => api.get('/transport/maintenance/due'),
  // Boarding
  recordBoarding: (vehicleId: string, data: any) => api.post(`/transport/vehicles/${vehicleId}/boarding`, data),
  getBoardingStats: (vehicleId: string, params?: any) => api.get(`/transport/vehicles/${vehicleId}/boarding/stats`, { params }),
  // Reports
  getSummary: () => api.get('/transport/summary'),
  getFeeReport: () => api.get('/transport/reports/fees'),
  // Settings
  getSettings: () => api.get('/transport/settings'),
  updateSettings: (data: any) => api.put('/transport/settings', data),
};

// Hostel API
export const hostelAPI = {
  // Hostels
  addHostel: (data: any) => api.post('/hostel/hostels', data),
  getAllHostels: (params?: any) => api.get('/hostel/hostels', { params }),
  getHostelDetails: (hostelId: string) => api.get(`/hostel/hostels/${hostelId}`),
  updateHostel: (hostelId: string, data: any) => api.put(`/hostel/hostels/${hostelId}`, data),
  deleteHostel: (hostelId: string) => api.delete(`/hostel/hostels/${hostelId}`),
  // Rooms
  addRoom: (data: any) => api.post('/hostel/rooms', data),
  getRoomsByHostel: (hostelId: string, params?: any) => api.get(`/hostel/hostels/${hostelId}/rooms`, { params }),
  updateRoom: (roomId: string, data: any) => api.put(`/hostel/rooms/${roomId}`, data),
  deleteRoom: (roomId: string) => api.delete(`/hostel/rooms/${roomId}`),
  // Beds
  getBedsByRoom: (roomId: string) => api.get(`/hostel/rooms/${roomId}/beds`),
  getVacantBeds: (hostelId: string, params?: any) => api.get(`/hostel/hostels/${hostelId}/beds/vacant`, { params }),
  updateBedStatus: (bedId: string, data: any) => api.put(`/hostel/beds/${bedId}`, data),
  // Student Allocation
  allocateStudent: (data: any) => api.post('/hostel/students/allocate', data),
  deallocateStudent: (allocationId: string, data: any) => api.post(`/hostel/students/${allocationId}/deallocate`, data),
  getStudentAllocation: (studentId: string) => api.get(`/hostel/students/${studentId}/allocation`),
  getHostelStudents: (hostelId: string, params?: any) => api.get(`/hostel/hostels/${hostelId}/students`, { params }),
  updateStudentAllocation: (allocationId: string, data: any) => api.put(`/hostel/students/${allocationId}`, data),
  markHostelFeePaid: (allocationId: string) => api.post(`/hostel/students/${allocationId}/mark-paid`),
  // Visitors
  registerVisitor: (data: any) => api.post('/hostel/visitors', data),
  getVisitorsByStudent: (studentId: string, params?: any) => api.get(`/hostel/students/${studentId}/visitors`, { params }),
  getVisitorsByHostel: (hostelId: string, params?: any) => api.get(`/hostel/hostels/${hostelId}/visitors`, { params }),
  updateVisitor: (visitorId: string, data: any) => api.put(`/hostel/visitors/${visitorId}`, data),
  approveVisitor: (visitorId: string) => api.post(`/hostel/visitors/${visitorId}/approve`),
  // Complaints
  registerComplaint: (data: any) => api.post('/hostel/complaints', data),
  getComplaints: (params?: any) => api.get('/hostel/complaints', { params }),
  updateComplaintStatus: (complaintId: string, data: any) => api.put(`/hostel/complaints/${complaintId}/status`, data),
  resolveComplaint: (complaintId: string, data: any) => api.post(`/hostel/complaints/${complaintId}/resolve`, data),
  // Leaves
  applyLeave: (data: any) => api.post('/hostel/leaves', data),
  getLeaveRequests: (params?: any) => api.get('/hostel/leaves', { params }),
  approveLeave: (leaveId: string, data?: any) => api.post(`/hostel/leaves/${leaveId}/approve`, data),
  rejectLeave: (leaveId: string, data: any) => api.post(`/hostel/leaves/${leaveId}/reject`, data),
  // Notices
  createNotice: (data: any) => api.post('/hostel/notices', data),
  getNotices: (hostelId: string, params?: any) => api.get(`/hostel/hostels/${hostelId}/notices`, { params }),
  updateNotice: (noticeId: string, data: any) => api.put(`/hostel/notices/${noticeId}`, data),
  deleteNotice: (noticeId: string) => api.delete(`/hostel/notices/${noticeId}`),
  // Attendance
  recordAttendance: (data: any) => api.post('/hostel/attendance', data),
  getAttendanceByHostel: (hostelId: string, params?: any) => api.get(`/hostel/hostels/${hostelId}/attendance`, { params }),
  getAttendanceByStudent: (studentId: string, params?: any) => api.get(`/hostel/students/${studentId}/attendance`, { params }),
  // Reports
  getSummary: () => api.get('/hostel/summary'),
  getOccupancyReport: (hostelId: string) => api.get(`/hostel/hostels/${hostelId}/occupancy-report`),
  getFeeReport: (params?: any) => api.get('/hostel/reports/fees', { params }),
  // Settings
  getSettings: () => api.get('/hostel/settings'),
  updateSettings: (data: any) => api.put('/hostel/settings', data),
};

// Payment API
export const paymentAPI = {
  getStatus: () => api.get('/payments/status'),
  createOrder: (data: { feeId: string; studentId: string; amount: number }) =>
    api.post('/payments/create-order', data),
  verifyPayment: (data: { orderId: string; paymentId: string; signature: string; feeId: string }) =>
    api.post('/payments/verify', data),
  getHistory: (studentId: string) => api.get(`/payments/history/${studentId}`),
  refund: (data: { paymentId: string; feeId: string; amount?: number; reason?: string }) =>
    api.post('/payments/refund', data),
  getReport: () => api.get('/payments/report'),
};

// Activity API
export const activityAPI = {
  getRecent: () => api.get('/activities/recent'),
  getAll: (params?: any) => api.get('/activities', { params }),
  getUserSummary: (userId: string) => api.get(`/activities/user/${userId}/summary`),
  getModuleStats: (module: string) => api.get(`/activities/module/${module}/stats`),
  exportCsv: () => api.get('/activities/export/csv'),
  getById: (id: string) => api.get(`/activities/${id}`),
  cleanup: () => api.delete('/activities/cleanup/old'),
};

// File API
export const fileAPI = {
  uploadStudentDocument: (formData: FormData) =>
    api.post('/files/upload/student', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadStaffDocument: (formData: FormData) =>
    api.post('/files/upload/staff', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  downloadFile: (filePath: string) => api.get(`/files/download/${filePath}`, { responseType: 'blob' }),
  deleteFile: (filePath: string) => api.delete(`/files/delete/${filePath}`),
  getStats: () => api.get('/files/stats'),
  cleanup: () => api.post('/files/cleanup'),
};
