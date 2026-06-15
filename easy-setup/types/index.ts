export type UserRole = 'user' | 'admin' | 'super_admin' | 'client';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  referralCode?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface AdminProfile {
  uid: string;
  username: string;
  email: string;
  phoneNumber?: string;
  role: 'admin' | 'super_admin' | 'client';
  status: UserStatus;
  avatarUrl?: string;
  createdAt: any;
}

export interface ChatThread {
  id: string;
  userId: string;
  username: string;
  subject: string;
  status: 'open' | 'closed' | 'pending';
  unreadAdmin: number;
  unreadUser: number;
  lastMessage: string;
  lastMessageAt: any;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: 'user' | 'admin';
  senderName: string;
  content: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  edited?: boolean;
  deletedForUser?: boolean;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: any;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetId?: string;
  targetType?: string;
  details?: string;
  createdAt: any;
}

export interface PlatformBranding {
  platformName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
}

export interface PlatformSEO {
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
}

export interface PlatformToggles {
  registrationOpen: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface EmailSettings {
  provider: 'emailjs' | 'smtp';
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromName?: string;
  fromEmail?: string;
}

export interface CloudinarySettings {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
}

export interface Session {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress?: string;
  createdAt: any;
  expiresAt: any;
  isActive: boolean;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
