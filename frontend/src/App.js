import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ChatProvider } from "./contexts/ChatContext";

// Components
import Layout from "./components/Layout/Layout";
import LoadingScreen from "./components/LoadingScreen";
import AppFallback from "./components/AppFallback";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

// Check if Clerk publishable key exists
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_test_ZnJhbmstYmFzaWxpc2stOTAuY2xlcmsuYWNjb3VudHMuZGV2JA";

console.log("🔧 Environment:", process.env.NODE_ENV);
console.log("🔑 Clerk key available:", !!clerkPubKey);
console.log("🌐 App starting...");

/**
 * Protected Route Component
 * Ensures user is authenticated before accessing routes
 */
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

/**
 * Main App Component
 * Sets up routing, authentication, and global providers
 */
function App() {
  try {
    return (
      <ClerkProvider
        publishableKey={clerkPubKey}
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: "#3b82f6",
            colorBackground: "#ffffff",
            colorInputBackground: "#ffffff",
            colorInputText: "#1f2937",
            fontFamily: "Inter, system-ui, sans-serif",
            borderRadius: "0.5rem",
          },
          elements: {
            formButtonPrimary:
              "bg-blue-500 hover:bg-blue-600 text-sm normal-case",
            card: "shadow-lg",
            headerTitle: "text-blue-600",
            headerSubtitle: "text-gray-600",
        },
      }}
    >
      <Router>
        <div className="App">
          <Suspense fallback={<LoadingScreen />}>
            {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontSize: "14px",
                fontFamily: "Inter, system-ui, sans-serif",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />

          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />

            {/* Protected routes */}
            <Route
              path="/chat/*"
              element={
                <ProtectedRoute>
                  <AuthProvider>
                    <SocketProvider>
                      <ChatProvider>
                        <Layout>
                          <Routes>
                            <Route path="/" element={<ChatPage />} />
                            <Route path="/:chatId" element={<ChatPage />} />
                          </Routes>
                        </Layout>
                      </ChatProvider>
                    </SocketProvider>
                  </AuthProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AuthProvider>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </AuthProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AuthProvider>
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </AuthProvider>
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Page Not Found
                    </h1>
                    <p className="text-gray-600 mb-4">
                      The page you're looking for doesn't exist.
                    </p>
                    <a href="/" className="btn-primary">
                      Go Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
          </Suspense>
        </div>
      </Router>
    </ClerkProvider>
    );
  } catch (error) {
    console.error("App Error:", error);
    return <AppFallback />;
  }
}

export default App;
