import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./shared/components/ProtectedRoute";

const CustomerLayout = React.lazy(() => import("./portals/customer/layouts/CustomerLayout"));
const Home = React.lazy(() => import("./portals/customer/pages/Home"));
const ProductDetail = React.lazy(() => import("./portals/customer/pages/ProductDetail"));
const Cart = React.lazy(() => import("./portals/customer/pages/Cart"));
const Checkout = React.lazy(() => import("./portals/customer/pages/Checkout"));
const Orders = React.lazy(() => import("./portals/customer/pages/Orders"));
const CustomerChatbot = React.lazy(() => import("./portals/customer/pages/Chatbot"));
const Profile = React.lazy(() => import("./portals/customer/pages/Profile"));

const OwnerLayout = React.lazy(() => import("./portals/owner/layouts/OwnerLayout"));
const OwnerDashboard = React.lazy(() => import("./portals/owner/pages/Dashboard"));
const OwnerProducts = React.lazy(() => import("./portals/owner/pages/Products"));
const OwnerOrders = React.lazy(() => import("./portals/owner/pages/Orders"));
const OwnerInventory = React.lazy(() => import("./portals/owner/pages/Inventory"));
const OwnerSuppliers = React.lazy(() => import("./portals/owner/pages/Suppliers"));
const OwnerForecast = React.lazy(() => import("./portals/owner/pages/DemandForecast"));
const OwnerAnomalies = React.lazy(() => import("./portals/owner/pages/AnomalyAlerts"));
const OwnerChatbot = React.lazy(() => import("./portals/owner/pages/Chatbot"));
const OwnerAnalytics = React.lazy(() => import("./portals/owner/pages/Analytics"));
const OwnerCustomers = React.lazy(() => import("./portals/owner/pages/Customers"));

const Login = React.lazy(() => import("./portals/customer/pages/Login"));
const Register = React.lazy(() => import("./portals/customer/pages/Register"));
const OwnerLogin = React.lazy(() => import("./portals/owner/pages/Login"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/owner/login" element={<OwnerLogin />} />

        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="chatbot" element={<CustomerChatbot />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <OwnerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<OwnerDashboard />} />
          <Route path="products" element={<OwnerProducts />} />
          <Route path="orders" element={<OwnerOrders />} />
          <Route path="inventory" element={<OwnerInventory />} />
          <Route path="suppliers" element={<OwnerSuppliers />} />
          <Route path="forecast" element={<OwnerForecast />} />
          <Route path="anomalies" element={<OwnerAnomalies />} />
          <Route path="analytics" element={<OwnerAnalytics />} />
          <Route path="customers" element={<OwnerCustomers />} />
          <Route path="chatbot" element={<OwnerChatbot />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}