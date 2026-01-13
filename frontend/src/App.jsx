import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CompanyManagement from './pages/CompanyManagement';
import SubscriptionManagement from './pages/SubscriptionManagement';
import PermissionsManagement from './pages/PermissionsManagement';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import Followups from './pages/Followups';
import Payments from './pages/Payments';
import WhatsAppInbox from './pages/WhatsAppInbox';
import Performance from './pages/Performance';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import AddUser from './pages/AddUser';
import Targets from './pages/Targets';
import Permissions from './pages/Permissions';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import EmailTemplates from './pages/EmailTemplates';
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
import PackageTheme from './pages/PackageTheme';
import Currency from './pages/Currency';

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
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/forgot-password"
        element={
          user && user.id ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ForgotPassword />
          )
        }
      />
      <Route
        path="/reset-password"
        element={
          user && user.id ? (
            <Navigate to="/dashboard" replace />
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
        path="/itineraries"
        element={
          <ProtectedRoute>
            <Itineraries />
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
        path="/analytics"
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
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AppRoutes />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
