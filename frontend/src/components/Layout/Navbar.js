import React from "react";
import { Link, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

/**
 * Navigation Bar Component
 * Top navigation with user menu and navigation links
 */
const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      name: "Chat",
      href: "/chat",
      icon: ChatBubbleLeftRightIcon,
      active: isActive("/chat"),
    },
    {
      name: "Profile",
      href: "/profile",
      icon: UserIcon,
      active: isActive("/profile"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Cog6ToothIcon,
      active: isActive("/settings"),
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 h-16">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link to="/chat" className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">
              Enhanced Chat
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                  ${
                    item.active
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }
                `}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.fullName || user.username}
                  </p>
                  <div className="flex items-center justify-end">
                    <div
                      className={`w-2 h-2 rounded-full mr-1 ${
                        user.isOnline ? "bg-green-400" : "bg-gray-400"
                      }`}
                    ></div>
                    <p className="text-xs text-gray-500">
                      {user.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Clerk User Button */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "shadow-lg border border-gray-200",
                  userButtonPopoverActionButton: "hover:bg-gray-100",
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-white">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex flex-col items-center py-2 px-3 rounded-lg text-xs font-medium transition-colors duration-200
                ${
                  item.active
                    ? "text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              <item.icon className="w-5 h-5 mb-1" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
