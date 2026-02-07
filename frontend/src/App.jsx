import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ContentProvider } from './contexts/ContentContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import { isMainDomain } from './utils/domainUtils';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminMailStatus from './pages/SuperAdminMailStatus';
import CompanyManagement from './pages/CompanyManagement';
import SubscriptionManagement from './pages/SubscriptionManagement';
import PermissionsManagement from './pages/PermissionsManagement';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import Followups from './pages/Followups';
import Payments from './pages/Payments';
import SalesReps from './pages/SalesReps';
import Notes from './pages/Notes';
import WhatsAppInbox from './pages/WhatsAppInbox';
import EmailInbox from './pages/EmailInbox';
import Performance from './pages/Performance';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import AddUser from './pages/AddUser';
import Targets from './pages/Targets';
import Permissions from './pages/Permissions';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import EmailTemplates from './pages/EmailTemplates';
import MarketingDashboard from './pages/MarketingDashboard';
import EmailCampaigns from './pages/EmailCampaigns';
import SmsCampaigns from './pages/SmsCampaigns';
import MarketingTemplates from './pages/MarketingTemplates';
import MarketingAnalytics from './pages/MarketingAnalytics';
import MarketingAutomation from './pages/MarketingAutomation';
import LandingPages from './pages/LandingPages';
import TermsConditions from './pages/TermsConditions';
import Policies from './pages/Policies';
import AccountDetails from './pages/AccountDetails';
import Logo from './pages/Logo';
import Suppliers from './pages/Suppliers';
import Hotel from './pages/Hotel';
import Activity from './pages/Activity';
import Transfer from './pages/Transfer';
import DayItinerary from './pages/DayItinerary';
import Itineraries from './pages/Itineraries';
import ItineraryDetail from './pages/ItineraryDetail';
import Destinations from './pages/Destinations';
import RoomType from './pages/RoomType';
import MealPlan from './pages/MealPlan';
import LeadSource from './pages/LeadSource';
import ExpenseType from './pages/ExpenseType';
import ClientGroups from './pages/ClientGroups';
import PackageTheme from './pages/PackageTheme';
import Currency from './pages/Currency';
import Clients from './pages/Clients';
import Agents from './pages/Agents';
import Corporate from './pages/Corporate';
import ClientDetails from './pages/ClientDetails';
import ClientReports from './pages/ClientReports';
import UserDetails from './pages/UserDetails';
import Services from './pages/Services';
import EmployeeManagement from './pages/EmployeeManagement';
import TeamManagement from './pages/TeamManagement.jsx';
import TeamReports from './pages/TeamReports';
import Reports from './pages/Reports';
import ManagementDashboard from './pages/ManagementDashboard';
import CompanyMailSettings from './pages/CompanyMailSettings';
import CompanyWhatsAppSettings from './pages/CompanyWhatsAppSettings';
import CallManagement from './pages/CallManagement';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Show loading only on initial load
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
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
            <SalesReps />
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
        element={<Navigate to="/company-settings/team-management?tab=branches" replace />}
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
            <Itineraries />
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
            <ItineraryDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mail"
        element={
          <ProtectedRoute>
            <EmailInbox />
          </ProtectedRoute>
        }
      />
      <Route
        path="/whatsapp"
        element={
          <ProtectedRoute>
            <WhatsAppInbox />
          </ProtectedRoute>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <Performance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/employee-performance"
        element={
          <ProtectedRoute>
            <Performance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/source-roi"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/destination-performance"
        element={
          <ProtectedRoute>
            <Analytics />
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
            <Targets />
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
        path="/company-settings/team-reports"
        element={
          <ProtectedRoute>
            <TeamReports />
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
            <EmployeeManagement />
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
        path="/settings/logo"
        element={
          <ProtectedRoute>
            <Logo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/suppliers"
        element={
          <ProtectedRoute>
            <Suppliers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/hotel"
        element={
          <ProtectedRoute>
            <Hotel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/activity"
        element={
          <ProtectedRoute>
            <Activity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/transfer"
        element={
          <ProtectedRoute>
            <Transfer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/day-itinerary"
        element={
          <ProtectedRoute>
            <DayItinerary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/destinations"
        element={
          <ProtectedRoute>
            <Destinations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/room-type"
        element={
          <ProtectedRoute>
            <RoomType />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/meal-plan"
        element={
          <ProtectedRoute>
            <MealPlan />
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
        path="/marketing"
        element={
          <ProtectedRoute>
            <MarketingDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/email-campaigns"
        element={
          <ProtectedRoute>
            <EmailCampaigns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/sms-campaigns"
        element={
          <ProtectedRoute>
            <SmsCampaigns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/templates"
        element={
          <ProtectedRoute>
            <MarketingTemplates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/analytics"
        element={
          <ProtectedRoute>
            <MarketingAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/automation"
        element={
          <ProtectedRoute>
            <MarketingAutomation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/landing-pages"
        element={
          <ProtectedRoute>
            <LandingPages />
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
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <ContentProvider>
            <AppRoutes />
          </ContentProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
