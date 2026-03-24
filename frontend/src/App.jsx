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
const Corporate = lazy(() => import('./pages/Corporate'));
const ClientGroups = lazy(() => import('./pages/ClientGroups'));
const Support = lazy(() => import('./pages/Support'));
const Policies = lazy(() => import('./pages/Policies'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const EmailTemplates = lazy(() => import('./pages/EmailTemplates'));

// --- B2B TRAVEL INTEGRATIONS ---
const FlightSearch = lazy(() => import('./pages/FlightSearch'));
const HotelSearch = lazy(() => import('./pages/HotelSearch'));

// Fallback loader
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Show loading only on initial load
  if (loading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public landing page - no auth required, must be before catch-all */}
        <Route path="/landing-page/:slug" element={<PublicLandingPage />} />
        <Route
          path="/login"
          element={
            user && user.id ? (
              <Navigate to={user.is_super_admin ? '/super-admin' : '/dashboard'} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            user && user.id ? (
              <Navigate to={user.is_super_admin ? '/super-admin' : '/dashboard'} replace />
            ) : (
              <ForgotPassword />
            )
          }
        />
        <Route
          path="/reset-password"
          element={
            user && user.id ? (
              <Navigate to={user.is_super_admin ? '/super-admin' : '/dashboard'} replace />
            ) : (
              <ResetPassword />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/call-management"
          element={
            <ProtectedRoute>
              <CallManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <Leads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads/:id"
          element={
            <ProtectedRoute>
              <LeadDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/clients/:id"
          element={
            <ProtectedRoute>
              <ClientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/clients/:id/reports"
          element={
            <ProtectedRoute>
              <ClientReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/agents"
          element={
            <ProtectedRoute>
              <Agents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/corporate"
          element={
            <ProtectedRoute>
              <Corporate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/followups"
          element={
            <ProtectedRoute>
              <Followups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-reps"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="analytics">
                <SalesReps />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-management"
          element={<Navigate to="/staff-management/dashboard" replace />}
        />
        <Route
          path="/staff-management/dashboard"
          element={
            <ProtectedRoute>
              <ManagementDashboard />
            </ProtectedRoute>
          }
        />
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
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itineraries"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="itineraries">
                <Itineraries />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itineraries/:id"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="itineraries">
                <ItineraryDetail />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mail"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="gmail_integration">
                <EmailInbox />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/whatsapp"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="whatsapp">
                <WhatsAppInbox />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/whatsapp-web"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="whatsapp">
                <WhatsAppWebPage />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <AdminRoute allowManager={true}>
                <FeatureGuard feature="analytics">
                  <Performance />
                </FeatureGuard>
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employee-performance"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="analytics">
                <Performance />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <FeatureGuard feature="analytics">
                  <Analytics />
                </FeatureGuard>
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/source-roi"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <FeatureGuard feature="analytics">
                  <Analytics />
                </FeatureGuard>
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/destination-performance"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <FeatureGuard feature="analytics">
                  <Analytics />
                </FeatureGuard>
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/add"
          element={
            <ProtectedRoute>
              <AddUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-groups"
          element={
            <ProtectedRoute>
              <ClientGroups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/targets"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <Targets />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/permissions"
          element={
            <ProtectedRoute>
              <Permissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/subscription"
          element={
            <ProtectedRoute>
              <SubscriptionDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-settings/team-management"
          element={
            <ProtectedRoute>
              <TeamManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-team"
          element={
            <ProtectedRoute>
              <MyTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-team/:id"
          element={
            <ProtectedRoute>
              <MyTeamDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support/tickets/:id"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-settings/team-reports"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <TeamReports />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-settings/users/:id"
          element={
            <ProtectedRoute>
              <UserDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/management"
          element={
            <ProtectedRoute>
              <ManagementDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/management/*"
          element={<Navigate to="/staff-management/dashboard" replace />}
        />
        <Route
          path="/employee-management"
          element={
            <ProtectedRoute>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-dashboard/:id"
          element={
            <ProtectedRoute>
              <AdminRoute allowManager={true}>
                <EmployeeManagement />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/whatsapp"
          element={
            <ProtectedRoute>
              <CompanyWhatsAppSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/telephony"
          element={
            <ProtectedRoute>
              <CompanyTelephonySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/mail"
          element={
            <ProtectedRoute>
              <CompanyMailSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/email-templates"
          element={
            <ProtectedRoute>
              <EmailTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/terms-conditions"
          element={
            <ProtectedRoute>
              <TermsConditions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/policies"
          element={
            <ProtectedRoute>
              <Policies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/account-details"
          element={
            <ProtectedRoute>
              <AccountDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/company"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/suppliers"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="suppliers">
                <Suppliers />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/hotel"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="hotels">
                <Hotel />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/activity"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="activities">
                <Activity />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/transfer"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="transfers">
                <Transfer />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/day-itinerary"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="day_itineraries">
                <DayItinerary />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/destinations"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="destinations">
                <Destinations />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/room-type"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="hotels">
                <RoomType />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/meal-plan"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="hotels">
                <MealPlan />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/lead-source"
          element={
            <ProtectedRoute>
              <LeadSource />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/expense-type"
          element={
            <ProtectedRoute>
              <ExpenseType />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/package-theme"
          element={
            <ProtectedRoute>
              <PackageTheme />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/currency"
          element={
            <ProtectedRoute>
              <Currency />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/points"
          element={
            <ProtectedRoute>
              <MasterPoints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="campaigns">
                <MarketingDashboard />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing/campaigns"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="campaigns">
                <Campaigns />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing/templates"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="email_templates">
                <MarketingTemplates />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing/whatsapp-templates"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="whatsapp">
                <MarketingTemplates />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing/analytics"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="analytics">
                <MarketingAnalytics />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing/automation"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="marketing_automation">
                <MarketingAutomation />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing/landing-pages"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="landing_pages">
                <LandingPages />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing/landing-pages/:id/edit"
          element={
            <ProtectedRoute>
              <FeatureGuard feature="landing_pages">
                <LandingPageEditor />
              </FeatureGuard>
            </ProtectedRoute>
          }
        />
        {/* B2B Travel Search */}
        <Route
          path="/flight-search"
          element={
            <ProtectedRoute>
              <FlightSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel-search"
          element={
            <ProtectedRoute>
              <HotelSearch />
            </ProtectedRoute>
          }
        />
        {/* Super Admin Routes */}
        <Route
          path="/super-admin"
          element={
            <SuperAdminRoute>
              <SuperAdminDashboard />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/super-admin/companies"
          element={
            <SuperAdminRoute>
              <CompanyManagement />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/super-admin/subscriptions"
          element={
            <SuperAdminRoute>
              <SubscriptionManagement />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/super-admin/permissions"
          element={
            <SuperAdminRoute>
              <PermissionsManagement />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/super-admin/mail-status"
          element={
            <SuperAdminRoute>
              <SuperAdminMailStatus />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/super-admin/settings"
          element={
            <SuperAdminRoute>
              <SuperAdminSettings />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/super-admin/tickets"
          element={
            <SuperAdminRoute>
              <SuperAdminTickets />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/super-admin/tickets/:id"
          element={
            <SuperAdminRoute>
              <SuperAdminTickets />
            </SuperAdminRoute>
          }
        />
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
            />
          </ContentProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
