import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Opportunities from "./pages/Opportunities";
import OpportunityDetail from "./pages/OpportunityDetail";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import SupplyChain from "./pages/SupplyChain";
import SupplyChainDetail from "./pages/SupplyChainDetail";
import Collaborations from "./pages/Collaborations";
import CollaborationDetail from "./pages/CollaborationDetail";
import AIRecommendations from "./pages/AIRecommendations";
import CompanyGrowth from "./pages/CompanyGrowth";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Mediation from "./pages/Mediation";
import GovernmentContracts from "./pages/GovernmentContracts";
import GovernmentContractDetail from "./pages/GovernmentContractDetail";
import GovernmentTenders from "./pages/GovernmentTenders";
import GovernmentTenderDetail from "./pages/GovernmentTenderDetail";
import Subscriptions from "./pages/Subscriptions";
import Requests from "./pages/Requests";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminContracts from "./pages/admin/AdminContracts";
import AdminTenders from "./pages/admin/AdminTenders";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
      <Route path="/opportunities/:id" element={<ProtectedRoute><OpportunityDetail /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
      <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
      <Route path="/supply-chain" element={<ProtectedRoute><SupplyChain /></ProtectedRoute>} />
      <Route path="/supply-chain/:id" element={<ProtectedRoute><SupplyChainDetail /></ProtectedRoute>} />
      <Route path="/collaborations" element={<ProtectedRoute><Collaborations /></ProtectedRoute>} />
      <Route path="/collaborations/:id" element={<ProtectedRoute><CollaborationDetail /></ProtectedRoute>} />
      <Route path="/ai-recommendations" element={<ProtectedRoute><AIRecommendations /></ProtectedRoute>} />
      <Route path="/company-growth" element={<ProtectedRoute><CompanyGrowth /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/mediation" element={<ProtectedRoute><Mediation /></ProtectedRoute>} />
      <Route path="/government-contracts" element={<ProtectedRoute><GovernmentContracts /></ProtectedRoute>} />
      <Route path="/government-contracts/:id" element={<ProtectedRoute><GovernmentContractDetail /></ProtectedRoute>} />
      <Route path="/government-tenders" element={<ProtectedRoute><GovernmentTenders /></ProtectedRoute>} />
      <Route path="/government-tenders/:id" element={<ProtectedRoute><GovernmentTenderDetail /></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/contracts" element={<AdminRoute><AdminContracts /></AdminRoute>} />
      <Route path="/admin/tenders" element={<AdminRoute><AdminTenders /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
