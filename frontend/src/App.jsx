import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "./context/LangContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CookieConsentProvider } from "./context/CookieConsentContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import CookieBanner from "./components/CookieBanner.jsx";
import "./App.css";

// Route-level code splitting — the login bundle shouldn't have to load the
// dashboard/stats/QR code, and vice versa.
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage.jsx"));
const BioLinkEditorPage = lazy(() => import("./pages/BioLinkEditorPage.jsx"));
const PublicBioPage = lazy(() => import("./pages/PublicBioPage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const BlogPage = lazy(() => import("./pages/BlogPage.jsx"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage.jsx"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage.jsx"));
const AdminPostsPage = lazy(() => import("./pages/AdminPostsPage.jsx"));
const AdminPostEditorPage = lazy(() => import("./pages/AdminPostEditorPage.jsx"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage.jsx"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage.jsx"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage.jsx"));
const AccessibilityPage = lazy(() => import("./pages/AccessibilityPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <BrowserRouter>
          <AuthProvider>
            <CookieConsentProvider>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campaigns"
                  element={
                    <ProtectedRoute>
                      <CampaignsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bio-editor"
                  element={
                    <ProtectedRoute>
                      <BioLinkEditorPage />
                    </ProtectedRoute>
                  }
                />
                {/* Public / marketing / trust pages */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/accessibility" element={<AccessibilityPage />} />

                {/* Admin-only dashboard: overview + user management */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />

                {/* Admin-only blog management */}
                <Route
                  path="/admin/posts"
                  element={
                    <AdminRoute>
                      <AdminPostsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/posts/:id"
                  element={
                    <AdminRoute>
                      <AdminPostEditorPage />
                    </AdminRoute>
                  }
                />

                <Route path="/not-found" element={<NotFoundPage />} />
                {/* Public bio page — shortened to root level, e.g. yourdomain.com/username */}
                <Route path="/:username" element={<PublicBioPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            <CookieBanner />
          </CookieConsentProvider>
        </AuthProvider>
      </BrowserRouter>
      </LangProvider>
    </ThemeProvider>
  );
}
