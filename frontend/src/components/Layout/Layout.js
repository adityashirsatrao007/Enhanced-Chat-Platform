import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "./Navbar";
import OrbBackground from "../OrbBackground";

/**
 * Main Layout Component
 * Provides consistent layout structure for authenticated pages
 */
const Layout = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <OrbBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <main className="h-screen pt-16">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
