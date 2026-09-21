// ─── Backend API URL ─────────────────────────────────────────────────────────
// Development: "http://localhost:3000"
// Production:  "https://api.linkblick.com"
// Or use an env variable with Vite: import.meta.env.VITE_API_URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ─── Google OAuth Client ID ───────────────────────────────────────────────────
// Get this from https://console.cloud.google.com → APIs & Services → Credentials
// Set in your .env file as: VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
// Leave blank (or unset) to disable the Google Login button.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const ENDPOINTS = {
  register: `${API_BASE_URL}/api/auth/register`,
  login: `${API_BASE_URL}/api/auth/login`,
  googleLogin: `${API_BASE_URL}/api/auth/google`,
  refresh: `${API_BASE_URL}/api/auth/refresh`,
  logout: `${API_BASE_URL}/api/auth/logout`,
  forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
  resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
  me: `${API_BASE_URL}/api/auth/me`,
  updateMe: `${API_BASE_URL}/api/auth/me`,
  requestEmailChange: `${API_BASE_URL}/api/auth/email/request-change`,
  confirmEmailChange: `${API_BASE_URL}/api/auth/email/confirm-change`,
  requestPhoneChange: `${API_BASE_URL}/api/auth/phone/request-change`,
  confirmPhoneChange: `${API_BASE_URL}/api/auth/phone/confirm-change`,

  links: `${API_BASE_URL}/api/links`,
  link: (id) => `${API_BASE_URL}/api/links/${id}`,
  linkStats: (id) => `${API_BASE_URL}/api/links/${id}/stats`,
  linkQrCode: (id) => `${API_BASE_URL}/api/links/${id}/qrcode`,

  campaigns: `${API_BASE_URL}/api/campaigns`,
  campaign: (id) => `${API_BASE_URL}/api/campaigns/${id}`,

  myBioPage: `${API_BASE_URL}/api/bio/me`,
  publicBioPage: (username) => `${API_BASE_URL}/api/bio/${username}`,

  report: `${API_BASE_URL}/api/report`,

  posts: (query = "") => `${API_BASE_URL}/api/posts${query}`,
  post: (slug) => `${API_BASE_URL}/api/posts/${slug}`,
  adminPosts: `${API_BASE_URL}/api/posts/admin/all`,
  adminPost: (id) => `${API_BASE_URL}/api/posts/admin/${id}`,
  adminPostsCreate: `${API_BASE_URL}/api/posts/admin`,

  adminStats: `${API_BASE_URL}/api/admin/stats`,
  adminUsers: (query = "") => `${API_BASE_URL}/api/admin/users${query}`,
  adminUserStatus: (id) => `${API_BASE_URL}/api/admin/users/${id}/status`,
  adminUserRole: (id) => `${API_BASE_URL}/api/admin/users/${id}/role`,
  adminUser: (id) => `${API_BASE_URL}/api/admin/users/${id}`,
  adminLinks: (query = "") => `${API_BASE_URL}/api/admin/links${query}`,
  adminCampaigns: (query = "") => `${API_BASE_URL}/api/admin/campaigns${query}`,
};
