import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import JobSeekerLayout from '@/components/JobSeekerLayout';
import AdminLayout from '@/components/AdminLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import VerifyEmail from '@/pages/VerifyEmail';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import ProfileSection from '@/pages/ProfileSection';
import Jobs from '@/pages/Jobs';
import JobDetail from '@/pages/JobDetail';
import ApplicationWorkspace from '@/pages/ApplicationWorkspace';
import Resume from '@/pages/Resume';
import Applications from '@/pages/Applications';
import More from '@/pages/More';
import OrganizationConsent from '@/pages/OrganizationConsent';
import SwipePreview from '@/pages/SwipePreview';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminJobPostings from '@/pages/admin/JobPostings';
import AdminUsers from '@/pages/admin/Users';
import AdminImportJobs from '@/pages/admin/ImportJobs';
import AdminEmployerSources from '@/pages/admin/EmployerSources';
import AdminAddLocalJob from '@/pages/admin/AddLocalJob';
import AdminImportLocalJobs from '@/pages/admin/ImportLocalJobs';
import AdminSearchRuns from '@/pages/admin/SearchRuns';
import AdminSettings from '@/pages/admin/Settings';
import AdminReusableAnswers from '@/pages/admin/ReusableAnswers';
import AdminKnowledgeBase from '@/pages/admin/KnowledgeBase';
import AdminOrganizations from '@/pages/admin/Organizations';
import AdminParticipantLookup from '@/pages/admin/ParticipantLookup';
import Welcome from '@/pages/Welcome';
import OnboardingChoice from '@/pages/OnboardingChoice';
import GuestIntroduction from '@/pages/GuestIntroduction';
import EmailIdentity from '@/pages/EmailIdentity';
import EmploymentHistoryBuilder from '@/components/builder/EmploymentHistoryBuilder';
import ResumeUploadFlow from '@/components/builder/ResumeUploadFlow';
import GuestMigrationChoice from '@/pages/GuestMigrationChoice';
import OrgDashboard from '@/pages/OrgDashboard';
import OrgOutcomesReport from '@/pages/OrgOutcomesReport';
import OrgLayout from '@/components/organization/OrgLayout';
import OrgPlaceholder from '@/pages/OrgPlaceholder';
import OrgEmployers from '@/pages/OrgEmployers';
import { isGuest } from '@/lib/guestStorage';

const WorkspaceRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/workspace/${id}`} replace />;
};

const RootRedirect = () => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated && !isGuest()) return <Navigate to="/welcome" replace />;
  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/home" replace />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/onboarding" element={<OnboardingChoice />} />
      <Route path="/guest-intro" element={<GuestIntroduction />} />
      <Route path="/onboarding/email" element={<EmailIdentity />} />
      <Route path="/onboarding/build" element={<EmploymentHistoryBuilder />} />
      <Route path="/onboarding/upload" element={<ResumeUploadFlow />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Backward-compat redirects to unified workspace */}
      <Route path="/scanner/:id" element={<WorkspaceRedirect />} />
      <Route path="/prepare/:id" element={<WorkspaceRedirect />} />
      <Route path="/assistant/:id" element={<WorkspaceRedirect />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Temporary swipe card preview — not in main navigation */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/welcome" replace />} />}>
        <Route path="/swipe-preview" element={<SwipePreview />} />
      </Route>

      {/* Job seeker routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/welcome" replace />} />}>
        <Route path="/guest-migration" element={<GuestMigrationChoice />} />
        <Route element={<JobSeekerLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileSection />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/workspace/:id" element={<ApplicationWorkspace />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/more" element={<More />} />
          <Route path="/organization-consent" element={<OrganizationConsent />} />
          <Route path="/organization-consent/:orgId" element={<OrganizationConsent />} />
        </Route>
        <Route path="/resume" element={<Resume />} />
      </Route>

      {/* Organization Edition workspace. Backend functions enforce active
          OrganizationStaffAccount membership and organization scoping. */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/welcome" replace />} />}>
        <Route path="/org/:slug" element={<OrgLayout />}>
          <Route index element={<OrgDashboard />} />
          <Route path="employers" element={<OrgEmployers />} />
          <Route path="opportunities" element={<OrgPlaceholder />} />
          <Route path="outcomes" element={<OrgOutcomesReport />} />
          <Route path="staff" element={<OrgPlaceholder />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/welcome" replace />} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/jobs" element={<AdminJobPostings />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/import" element={<AdminImportJobs />} />
          <Route path="/admin/employer-sources" element={<AdminEmployerSources />} />
          <Route path="/admin/local-jobs/add" element={<AdminAddLocalJob />} />
          <Route path="/admin/local-jobs/import" element={<AdminImportLocalJobs />} />
          <Route path="/admin/search-runs" element={<AdminSearchRuns />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/reusable-answers" element={<AdminReusableAnswers />} />
          <Route path="/admin/knowledge-base" element={<AdminKnowledgeBase />} />
          <Route path="/admin/organizations" element={<AdminOrganizations />} />
          <Route path="/admin/participant-lookup" element={<AdminParticipantLookup />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App