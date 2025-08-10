import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  BellIcon,
  EyeIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

/**
 * Settings Page Component
 * Allows users to configure their preferences and privacy settings
 */
const SettingsPage = () => {
  const { user, updateProfile, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: "auto",
    notifications: {
      email: true,
      push: true,
      mentions: true,
    },
    privacy: {
      showOnlineStatus: true,
      showLastSeen: true,
    },
  });

  // Initialize preferences when user data is available
  React.useEffect(() => {
    if (user && user.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  const handleThemeChange = (theme) => {
    setPreferences((prev) => ({
      ...prev,
      theme,
    }));
  };

  const handleNotificationChange = (key) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handlePrivacyChange = (key) => {
    setPreferences((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key],
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({ preferences });
      toast.success("Settings saved successfully");
    } catch (error) {
      // Error is handled in the context
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
    { value: "auto", label: "System", icon: ComputerDesktopIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Customize your experience and manage your preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <SunIcon className="w-5 h-5 mr-2 text-gray-500" />
              Appearance
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose how the interface looks and feels
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      className={`
                        relative flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200
                        ${
                          preferences.theme === option.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }
                      `}
                    >
                      <option.icon className="w-6 h-6 text-gray-600 mb-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {option.label}
                      </span>
                      {preferences.theme === option.value && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <BellIcon className="w-5 h-5 mr-2 text-gray-500" />
              Notifications
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Control when and how you receive notifications
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive email notifications for important updates
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationChange("email")}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${
                      preferences.notifications.email
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                      transition duration-200 ease-in-out
                      ${
                        preferences.notifications.email
                          ? "translate-x-5"
                          : "translate-x-0"
                      }
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Push Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive push notifications for new messages
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationChange("push")}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${
                      preferences.notifications.push
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                      transition duration-200 ease-in-out
                      ${
                        preferences.notifications.push
                          ? "translate-x-5"
                          : "translate-x-0"
                      }
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Mention Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Get notified when someone mentions you
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationChange("mentions")}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${
                      preferences.notifications.mentions
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                      transition duration-200 ease-in-out
                      ${
                        preferences.notifications.mentions
                          ? "translate-x-5"
                          : "translate-x-0"
                      }
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2 text-gray-500" />
              Privacy & Security
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Control who can see your information and activity
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Show Online Status
                  </label>
                  <p className="text-sm text-gray-500">
                    Let others see when you're online
                  </p>
                </div>
                <button
                  onClick={() => handlePrivacyChange("showOnlineStatus")}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${
                      preferences.privacy.showOnlineStatus
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                      transition duration-200 ease-in-out
                      ${
                        preferences.privacy.showOnlineStatus
                          ? "translate-x-5"
                          : "translate-x-0"
                      }
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Show Last Seen
                  </label>
                  <p className="text-sm text-gray-500">
                    Let others see when you were last active
                  </p>
                </div>
                <button
                  onClick={() => handlePrivacyChange("showLastSeen")}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${
                      preferences.privacy.showLastSeen
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                      transition duration-200 ease-in-out
                      ${
                        preferences.privacy.showLastSeen
                          ? "translate-x-5"
                          : "translate-x-0"
                      }
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Account</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your account and data
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-3">
              <button
                onClick={() => toast.info("Export feature coming soon!")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Export my data
              </button>
              <button
                onClick={() => toast.info("Download feature coming soon!")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Download conversation history
              </button>
              <button
                onClick={() =>
                  toast.error(
                    "Account deletion must be done through your Clerk account"
                  )
                }
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </div>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
