// User Types
export type UserRole = 'farmer' | 'officer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Prediction Types
export type DiseaseStatus = 'healthy' | 'diseased';

export interface Prediction {
  id: string;
  userId: string;
  imageUrl: string;
  cropName: string;
  diseaseName: string;
  confidence: number;
  status: DiseaseStatus;
  treatments: Treatment;
  createdAt: string;
  isVerified: boolean;
  verifiedBy?: string;
  officerComments?: string;
}

export interface Treatment {
  organic: string[];
  chemical: string[];
  preventive: string[];
}

export interface PredictionResult {
  cropName: string;
  diseaseName: string;
  confidence: number;
  status: DiseaseStatus;
  treatments: Treatment;
}

// Officer Review Types
export interface ReviewData {
  predictionId: string;
  isCorrect: boolean;
  correctedDisease?: string;
  comments: string;
  additionalTreatments?: Treatment;
}

// Admin Types
export interface SystemMetrics {
  totalUsers: number;
  totalFarmers: number;
  totalOfficers: number;
  totalAdmins: number;
  totalPredictions: number;
  accuracyRate: number;
  verifiedPredictions: number;
  pendingReviews: number;
}

export interface UserManagement {
  users: User[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Notification Types
export type NotificationType = 'prediction_ready' | 'review_request' | 'system_alert' | 'role_change';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileFormData {
  name?: string;
  phone?: string;
  location?: string;
}

export interface Feedback {
  id: string;
  predictionId: string;
  userId: string;
  correct: boolean;
  createdAt: string;
}

export interface UploadFormData {
  image: File;
  cropType?: string;
}

// Crop Types
export interface Crop {
  id: string;
  name: string;
  diseases: Disease[];
}

export interface Disease {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  treatments: Treatment;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}
