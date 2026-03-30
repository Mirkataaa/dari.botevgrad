import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import AdminRoute from "@/components/admin/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import ActiveCampaigns from "./pages/ActiveCampaigns";
import CompletedCampaigns from "./pages/CompletedCampaigns";
import CampaignDetails from "./pages/CampaignDetails";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import OrgOrAdminRoute from "@/components/admin/OrgOrAdminRoute";
import CreateCampaign from "./pages/CreateCampaign";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminDonations from "./pages/admin/AdminDonations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminComments from "./pages/admin/AdminComments";
import AdminContacts from "./pages/admin/AdminContacts";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout><Index /></Layout>} path="/" />
            <Route element={<Layout><ActiveCampaigns /></Layout>} path="/active" />
            <Route element={<Layout><CompletedCampaigns /></Layout>} path="/completed" />
            <Route element={<Layout><CampaignDetails /></Layout>} path="/campaign/:id" />
            <Route element={<Layout><About /></Layout>} path="/about" />
            <Route element={<Layout><Profile /></Layout>} path="/profile" />
            <Route element={<OrgOrAdminRoute><Layout><CreateCampaign /></Layout></OrgOrAdminRoute>} path="/campaigns/create" />
            <Route element={<Layout><Login /></Layout>} path="/login" />
            <Route element={<Layout><Register /></Layout>} path="/register" />
            <Route element={<Layout><ResetPassword /></Layout>} path="/reset-password" />
            <Route element={<Layout><PaymentSuccess /></Layout>} path="/payment-success" />

            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="campaigns" element={<AdminCampaigns />} />
              <Route path="donations" element={<AdminDonations />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="comments" element={<AdminComments />} />
              <Route path="contacts" element={<AdminContacts />} />
            </Route>

            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
