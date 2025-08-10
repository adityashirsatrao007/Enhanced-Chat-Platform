import React from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  BoltIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

/**
 * Home Page Component
 * Landing page with authentication options and feature highlights
 */
const HomePage = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect if already signed in
  React.useEffect(() => {
    if (isSignedIn) {
      navigate("/chat");
    }
  }, [isSignedIn, navigate]);

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Real-time Messaging",
      description:
        "Instant messaging with live typing indicators and message delivery status.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure Authentication",
      description:
        "Protected by Clerk authentication with enterprise-grade security.",
    },
    {
      icon: BoltIcon,
      title: "Lightning Fast",
      description:
        "Optimized for performance with instant message delivery and smooth interactions.",
    },
    {
      icon: UserGroupIcon,
      title: "Group Chats",
      description:
        "Create and manage group conversations with multiple participants.",
    },
    {
      icon: DevicePhoneMobileIcon,
      title: "Responsive Design",
      description:
        "Perfect experience across all devices - desktop, tablet, and mobile.",
    },
    {
      icon: GlobeAltIcon,
      title: "Global Reach",
      description:
        "Connect with users worldwide with our scalable cloud infrastructure.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Enhanced Chat Platform
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <SignInButton mode="modal">
                <button className="btn-ghost">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary">Get Started</button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Connect, Chat, and
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}
                Collaborate
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of communication with our modern chat
              platform. Built with cutting-edge technology for seamless
              real-time conversations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal">
                <button className="btn-primary text-lg px-8 py-4">
                  Start Chatting Now
                </button>
              </SignUpButton>
              <button className="btn-secondary text-lg px-8 py-4">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse-subtle"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need for modern communication
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to enhance your chatting experience and
              keep you connected with what matters most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to transform your communication?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who are already experiencing the future of
            chat.
          </p>
          <SignUpButton mode="modal">
            <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200">
              Get Started for Free
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">
                Enhanced Chat Platform
              </span>
            </div>

            <div className="flex space-x-6 text-gray-400">
              <a
                href="#"
                className="hover:text-white transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-200"
              >
                Support
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 Enhanced Chat Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
