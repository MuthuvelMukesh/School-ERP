import axios, { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined');
}

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
