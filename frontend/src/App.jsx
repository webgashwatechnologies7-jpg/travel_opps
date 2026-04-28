import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ContentProvider } from './contexts/ContentContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import AdminRoute from './components/AdminRoute';
import FeatureGuard from './components/FeatureGuard';
import { isMainDomain } from './utils/domainUtils';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import SuperAdminLayout from './components/SuperAdminLayout';

// --- AUTH PAGES ---
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// --- CORE PAGES ---
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/Leads'));
const LeadDetails = lazy(() => import('./pages/LeadDetails'));
const Followups = lazy(() => import('./pages/Followups'));
const Payments = lazy(() => import('./pages/Payments'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Notes = lazy(() => import('./pages/Notes'));
const Attendance = lazy(() => import('./pages/Attendance'));
const StaffAttendance = lazy(() => import('./pages/StaffAttendance'));

// --- MODULE PAGES ---
const WhatsAppInbox = lazy(() => import('./pages/WhatsAppInbox'));
const WhatsAppWebPage = lazy(() => import('./pages/WhatsAppWebPage'));
const EmailInbox = lazy(() => import('./pages/EmailInbox'));
const CallManagement = lazy(() => import('./pages/CallManagement'));
const Itineraries = lazy(() => import('./pages/Itineraries'));
const ItineraryDetail = lazy(() => import('./pages/ItineraryDetail'));
const Services = lazy(() => import('./pages/Services'));

// --- MASTER PAGES ---
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Hotel = lazy(() => import('./pages/Hotel'));
const Activity = lazy(() => import('./pages/Activity'));
const Transfer = lazy(() => import('./pages/Transfer'));
const DayItinerary = lazy(() => import('./pages/DayItinerary'));
const Destinations = lazy(() => import('./pages/Destinations'));
const RoomType = lazy(() => import('./pages/RoomType'));
const MealPlan = lazy(() => import('./pages/MealPlan'));
const LeadSource = lazy(() => import('./pages/LeadSource'));
const ExpenseType = lazy(() => import('./pages/ExpenseType'));
const PackageTheme = lazy(() => import('./pages/PackageTheme'));
const Currency = lazy(() => import('./pages/Currency'));
const MasterPoints = lazy(() => import('./pages/MasterPoints'));

// --- SETTINGS & TEAM PAGES ---
const Settings = lazy(() => import('./pages/Settings'));
const Users = lazy(() => import('./pages/Users'));
const AddUser = lazy(() => import('./pages/AddUser'));
const Targets = lazy(() => import('./pages/Targets'));
const Permissions = lazy(() => import('./pages/Permissions'));
const TeamManagement = lazy(() => import('./pages/TeamManagement.jsx'));
const UserDetails = lazy(() => import('./pages/UserDetails'));
const MyTeam = lazy(() => import('./pages/MyTeam'));
const MyTeamDetails = lazy(() => import('./pages/MyTeamDetails'));
const CompanyMailSettings = lazy(() => import('./pages/CompanyMailSettings'));
const CompanyWhatsAppSettings = lazy(() => import('./pages/CompanyWhatsAppSettings'));
const CompanyTelephonySettings = lazy(() => import('./pages/CompanyTelephonySettings'));
const ManagementDashboard = lazy(() => import('./pages/ManagementDashboard'));
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement'));
const TeamReports = lazy(() => import('./pages/TeamReports'));
const SubscriptionDetails = lazy(() => import('./pages/SubscriptionDetails'));
const AccountDetails = lazy(() => import('./pages/AccountDetails'));

// --- MARKETING PAGES ---
const MarketingDashboard = lazy(() => import('./pages/MarketingDashboard'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const MarketingTemplates = lazy(() => import('./pages/MarketingTemplates'));
const MarketingAnalytics = lazy(() => import('./pages/MarketingAnalytics'));
const MarketingAutomation = lazy(() => import('./pages/MarketingAutomation'));
const LandingPages = lazy(() => import('./pages/LandingPages'));
const LandingPageEditor = lazy(() => import('./pages/LandingPageEditor'));
const PublicLandingPage = lazy(() => import('./pages/PublicLandingPage'));

// --- ANALYTICS & REPORTS ---
const Performance = lazy(() => import('./pages/Performance'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));
const SalesReps = lazy(() => import('./pages/SalesReps'));

// --- SUPER ADMIN ---
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const CompanyManagement = lazy(() => import('./pages/CompanyManagement'));
const SubscriptionManagement = lazy(() => import('./pages/SubscriptionManagement'));
const PermissionsManagement = lazy(() => import('./pages/PermissionsManagement'));
const SuperAdminMailStatus = lazy(() => import('./pages/SuperAdminMailStatus'));
const SuperAdminSettings = lazy(() => import('./pages/SuperAdminSettings'));
const SuperAdminTickets = lazy(() => import('./pages/SuperAdminTickets'));

// --- OTHERS ---
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetails = lazy(() => import('./pages/ClientDetails'));
const ClientReports = lazy(() => import('./pages/ClientReports'));
const Agents = lazy(() => import('./pages/Agents'));
const AgentDetails = lazy(() => import('./pages/AgentDetails'));
const Corporate = lazy(() => import('./pages/Corporate'));
const ClientGroups = lazy(() => import('./pages/ClientGroups'));
const Support = lazy(() => import('./pages/Support'));
const Policies = lazy(() => import('./pages/Policies'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const EmailTemplates = lazy(() => import('./pages/EmailTemplates'));

// --- B2B TRAVEL INTEGRATIONS ---
const FlightSearch = lazy(() => import('./pages/FlightSearch'));
const HotelSearch = lazy(() => import('./pages/HotelSearch'));

import LogoLoader from './components/LogoLoader';

// Full-screen loader for initial auth check ONLY
const InitialLoader = () => (
  <LogoLoader text="Initializing CRM..." />
);

// A subtle top progress bar for route transitions
const PageLoader = () => (
  <div className="fixed top-0 left-0 right-0 h-1 z-[10001] bg-blue-100 overflow-hidden">
    <div className="h-full bg-blue-600 animate-shimmer origin-left shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Show full-screen loading ONLY on initial application boot
  if (loading) {
    return <InitialLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public landing page - no auth required, must be before catch-all */}
        <Route path="/landing-page/:slug" element={<Suspense fallback={<PageLoader />}><PublicLandingPage /></Suspense>} />
        <Route
          path="/login"
          element={
            user && user.id ? (
              <Navigate to={user.is_super_admin ? '/super-admin' : '/dashboard'} replace />
            ) : (
              <Suspense fallback={<PageLoader />}><Login /></Suspense>
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            user && user.id ? (
              <Navigate to={user.is_super_admin ? '/super-admin' : '/dashboard'} replace />
            ) : (
              <Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>
            )
          }
        />
        <Route
          path="/reset-password"
          element={
            user && user.id ? (
              <Navigate to={user.is_super_admin ? '/super-admin' : '/dashboard'} replace />
            ) : (
              <Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>
            )
          }
        />

        {/* Protected routes with Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/call-management" element={<CallManagement />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/accounts/clients" element={<Clients />} />
          <Route path="/accounts/clients/:id" element={<ClientDetails />} />
          <Route path="/accounts/clients/:id/reports" element={<ClientReports />} />
          <Route path="/accounts/agents" element={<Agents />} />
          <Route path="/accounts/agents/:id" element={<AgentDetails />} />
          <Route path="/accounts/corporate" element={<Corporate />} />
          <Route path="/followups" element={<Followups />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/sales-reps" element={<FeatureGuard feature="analytics"><SalesReps /></FeatureGuard>} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/staff-management"
            element={<Navigate to="/staff-management/dashboard" replace />}
          />
          <Route path="/staff-management/dashboard" element={<ManagementDashboard />} />
          <Route
            path="/staff-management/users"
            element={<Navigate to="/company-settings/team-management?tab=users" replace />}
          />
          <Route
            path="/staff-management/teams"
            element={<Navigate to="/company-settings/team-management?tab=teams" replace />}
          />
          <Route
            path="/staff-management/branches"
            element={<Navigate to="/company-settings/team-management?tab=branches" replace />}
          />
          <Route
            path="/staff-management/roles"
            element={<Navigate to="/company-settings/team-management?tab=roles" replace />}
          />
          <Route path="/notes" element={<Notes />} />
          <Route path="/itineraries" element={<FeatureGuard feature="itineraries"><Itineraries /></FeatureGuard>} />
          <Route path="/services" element={<Services />} />
          <Route path="/itineraries/:id" element={<FeatureGuard feature="itineraries"><ItineraryDetail /></FeatureGuard>} />
          <Route path="/mail" element={<FeatureGuard feature="gmail_integration"><EmailInbox /></FeatureGuard>} />
          <Route path="/whatsapp" element={<FeatureGuard feature="whatsapp"><WhatsAppInbox /></FeatureGuard>} />
          <Route path="/whatsapp-web" element={<FeatureGuard feature="whatsapp"><WhatsAppWebPage /></FeatureGuard>} />
          <Route path="/performance" element={<AdminRoute allowManager={true}><FeatureGuard feature="analytics"><Performance /></FeatureGuard></AdminRoute>} />
          <Route path="/dashboard/employee-performance" element={<FeatureGuard feature="analytics"><Performance /></FeatureGuard>} />
          <Route path="/analytics" element={<AdminRoute><FeatureGuard feature="analytics"><Analytics /></FeatureGuard></AdminRoute>} />
          <Route path="/dashboard/source-roi" element={<AdminRoute><FeatureGuard feature="analytics"><Analytics /></FeatureGuard></AdminRoute>} />
          <Route path="/dashboard/destination-performance" element={<AdminRoute><FeatureGuard feature="analytics"><Analytics /></FeatureGuard></AdminRoute>} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/add" element={<AddUser />} />
          <Route path="/client-groups" element={<ClientGroups />} />
          <Route path="/targets" element={<AdminRoute><Targets /></AdminRoute>} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/settings/subscription" element={<SubscriptionDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/company-settings/team-management" element={<TeamManagement />} />
          <Route path="/my-team" element={<MyTeam />} />
          <Route path="/my-team/:id" element={<MyTeamDetails />} />
          <Route path="/support" element={<Support />} />
          <Route path="/support/tickets/:id" element={<Support />} />
          <Route path="/company-settings/team-reports" element={<AdminRoute><TeamReports /></AdminRoute>} />
          <Route path="/company-settings/users/:id" element={<UserDetails />} />
          <Route path="/management" element={<ManagementDashboard />} />
          <Route
            path="/management/*"
            element={<Navigate to="/staff-management/dashboard" replace />}
          />
          <Route path="/employee-management" element={<EmployeeManagement />} />
          <Route path="/employee-dashboard/:id" element={<AdminRoute allowManager={true}><EmployeeManagement /></AdminRoute>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/staff-attendance" element={<AdminRoute><StaffAttendance /></AdminRoute>} />
          <Route path="/settings/whatsapp" element={<CompanyWhatsAppSettings />} />
          <Route path="/settings/telephony" element={<CompanyTelephonySettings />} />
          <Route path="/settings/mail" element={<CompanyMailSettings />} />
          <Route path="/email-templates" element={<EmailTemplates />} />
          <Route path="/settings/terms-conditions" element={<TermsConditions />} />
          <Route path="/settings/policies" element={<Policies />} />
          <Route path="/settings/account-details" element={<AccountDetails />} />
          <Route path="/settings/company" element={<Settings />} />
          <Route path="/masters/suppliers" element={<FeatureGuard feature="suppliers"><Suppliers /></FeatureGuard>} />
          <Route path="/masters/hotel" element={<FeatureGuard feature="hotels"><Hotel /></FeatureGuard>} />
          <Route path="/masters/activity" element={<FeatureGuard feature="activities"><Activity /></FeatureGuard>} />
          <Route path="/masters/transfer" element={<FeatureGuard feature="transfers"><Transfer /></FeatureGuard>} />
          <Route path="/masters/day-itinerary" element={<FeatureGuard feature="day_itineraries"><DayItinerary /></FeatureGuard>} />
          <Route path="/masters/destinations" element={<FeatureGuard feature="destinations"><Destinations /></FeatureGuard>} />
          <Route path="/masters/room-type" element={<FeatureGuard feature="hotels"><RoomType /></FeatureGuard>} />
          <Route path="/masters/meal-plan" element={<FeatureGuard feature="hotels"><MealPlan /></FeatureGuard>} />
          <Route path="/masters/lead-source" element={<LeadSource />} />
          <Route path="/masters/expense-type" element={<ExpenseType />} />
          <Route path="/masters/package-theme" element={<PackageTheme />} />
          <Route path="/masters/currency" element={<Currency />} />
          <Route path="/masters/points" element={<MasterPoints />} />
          <Route path="/marketing" element={<FeatureGuard feature="campaigns"><MarketingDashboard /></FeatureGuard>} />
          <Route path="/marketing/campaigns" element={<FeatureGuard feature="campaigns"><Campaigns /></FeatureGuard>} />
          <Route path="/marketing/templates" element={<FeatureGuard feature="email_templates"><MarketingTemplates /></FeatureGuard>} />
          <Route path="/marketing/whatsapp-templates" element={<FeatureGuard feature="whatsapp"><MarketingTemplates /></FeatureGuard>} />
          <Route path="/marketing/analytics" element={<FeatureGuard feature="analytics"><MarketingAnalytics /></FeatureGuard>} />
          <Route path="/marketing/automation" element={<FeatureGuard feature="marketing_automation"><MarketingAutomation /></FeatureGuard>} />
          <Route path="/marketing/landing-pages" element={<FeatureGuard feature="landing_pages"><LandingPages /></FeatureGuard>} />
          <Route path="/marketing/landing-pages/:id/edit" element={<FeatureGuard feature="landing_pages"><LandingPageEditor /></FeatureGuard>} />
          {/* B2B Travel Search */}
          <Route path="/flight-search" element={<FlightSearch />} />
          <Route path="/hotel-search" element={<HotelSearch />} />
        </Route>

        {/* Super Admin Routes */}
        <Route element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/companies" element={<CompanyManagement />} />
          <Route path="/super-admin/subscriptions" element={<SubscriptionManagement />} />
          <Route path="/super-admin/permissions" element={<PermissionsManagement />} />
          <Route path="/super-admin/mail-status" element={<SuperAdminMailStatus />} />
          <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
          <Route path="/super-admin/tickets" element={<SuperAdminTickets />} />
          <Route path="/super-admin/tickets/:id" element={<SuperAdminTickets />} />
        </Route>
        <Route
          path="/"
          element={
            user && user.id ? (
              <Navigate to={user.is_super_admin && isMainDomain() ? '/super-admin' : '/dashboard'} replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        {/* Unknown routes (404) -> login ya dashboard/super-admin */}
        <Route
          path="*"
          element={
            user && user.id ? (
              <Navigate to={user.is_super_admin && isMainDomain() ? '/super-admin' : '/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <ContentProvider>
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              style={{ zIndex: 100001 }}
            />
          </ContentProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
