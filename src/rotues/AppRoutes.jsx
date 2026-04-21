import { lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import RecruiterLayout from "../components/layout/RecruiterLayout";
import AdminLayout from "../components/layout/AdminLayout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import GuestRoute from "../components/routing/GuestRoute";

// Public pages
import Home from "../pages/Home";
import Jobs from "../pages/Jobs";
import About from "../pages/About";
import Blog from "../pages/Blog";
import Services from "../pages/Services";
import Feedback from "../pages/Feedback";

// Lazy-loaded pages
const JobDetail = lazy(() => import("../pages/JobDetail"));
const Companies = lazy(() => import("../pages/Companies"));
const CompanyJobs = lazy(() => import("../pages/CompanyJobs"));
const UserLogin = lazy(() => import("../pages/UserLogin"));
const Register = lazy(() => import("../pages/Register"));
const RecruiterLogin = lazy(() => import("../pages/RecruiterLogin"));
const RecruiterRegister = lazy(() => import("../pages/RecruiterRegister"));
const AdminLogin = lazy(() => import("../pages/AdminLogin"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const UserDashboard = lazy(() => import("../pages/UserDashboard"));
const AppliedJobs = lazy(() => import("../pages/AppliedJobs"));
const Profile = lazy(() => import("../pages/Profile"));
const RecruiterHome = lazy(() => import("../pages/recruiter/Home"));
const RecruiterDashboard = lazy(() => import("../pages/recruiter/RecruiterDashboard"));
const RecruiterPostJob = lazy(() => import("../pages/recruiter/RecruiterPostJob"));
const RecruiterManageJobs = lazy(() => import("../pages/recruiter/RecruiterManageJobs"));
const RecruiterApplications = lazy(() => import("../pages/recruiter/RecruiterApplications"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminApplications = lazy(() => import("../pages/admin/AdminApplications"));
const AdminCandidates = lazy(() => import("../pages/admin/AdminCandidates"));
const AdminCompanies = lazy(() => import("../pages/admin/AdminCompanies"));
const AdminEmployers = lazy(() => import("../pages/admin/AdminEmployers"));
const AdminJobs = lazy(() => import("../pages/admin/AdminJobs"));
const AdminJobCategories = lazy(() => import("../pages/admin/AdminJobCategories"));
const AdminBlogCategories = lazy(() => import("../pages/admin/AdminBlogCategories"));
const AdminSubAdmins = lazy(() => import("../pages/admin/AdminSubAdmins"));
const AdminFeedback = lazy(() => import("../pages/admin/AdminFeedback"));
const AdminEnquiries = lazy(() => import("../pages/admin/AdminEnquiries"));
const AdminSecurityQ = lazy(() => import("../pages/admin/AdminSecurityQ"));

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id/jobs" element={<CompanyJobs />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/feedback" element={<Feedback />} />
      </Route>

      {/* Guest only routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<UserLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recruiter/login" element={<RecruiterLogin />} />
        <Route path="/recruiter/register" element={<RecruiterRegister />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Job Seeker protected routes */}
      <Route element={<ProtectedRoute allowedRoles={["JOB_SEEKER"]} redirectTo="/login" />}>
        <Route element={<PublicLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/my-jobs" element={<AppliedJobs />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Public recruiter landing */}
      <Route element={<RecruiterLayout />}>
        <Route path="/recruiter" element={<RecruiterHome />} />
      </Route>

      {/* Recruiter protected routes */}
      <Route element={<ProtectedRoute allowedRoles={["RECRUITER"]} redirectTo="/recruiter/login" />}>
        <Route element={<RecruiterLayout />}>
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/recruiter/post-job" element={<RecruiterPostJob />} />
          <Route path="/recruiter/jobs" element={<RecruiterManageJobs />} />
          <Route path="/recruiter/applications" element={<RecruiterApplications />} />
        </Route>
      </Route>

      {/* Admin protected routes */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SUB_ADMIN"]} redirectTo="/admin/login" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/candidates" element={<AdminCandidates />} />
          <Route path="/admin/companies" element={<AdminCompanies />} />
          <Route path="/admin/employers" element={<AdminEmployers />} />
          <Route path="/admin/jobs" element={<AdminJobs />} />
          <Route path="/admin/job-categories" element={<AdminJobCategories />} />
          <Route path="/admin/blog-categories" element={<AdminBlogCategories />} />
          <Route path="/admin/sub-admins" element={<AdminSubAdmins />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/enquiries" element={<AdminEnquiries />} />
          <Route path="/admin/security-questions" element={<AdminSecurityQ />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
