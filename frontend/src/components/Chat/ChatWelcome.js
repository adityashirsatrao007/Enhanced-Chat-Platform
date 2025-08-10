import React from 'react';
import { 
  PlusIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

/**
 * Chat Welcome Component
 * Displayed when no chat is selected
 */
const ChatWelcome = ({ onNewChat, onToggleSidebar }) => {
  return (
    <div className="h-full flex flex-col">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors duration-200"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      {/* Welcome content */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          {/* Illustration */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-blue-600" />
            </div>
            
            {/* Decorative elements */}
            <div className="relative">
              <div className="absolute -top-4 -left-8 w-3 h-3 bg-blue-200 rounded-full opacity-60"></div>
              <div className="absolute -top-2 right-4 w-2 h-2 bg-purple-200 rounded-full opacity-60"></div>
              <div className="absolute top-8 -right-4 w-4 h-4 bg-green-200 rounded-full opacity-60"></div>
            </div>
          </div>

          {/* Welcome text */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Enhanced Chat
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Connect with friends, colleagues, and communities. 
            Start a conversation or join an existing one.
          </p>

          {/* Action buttons */}
          <div className="space-y-4">
            <button
              onClick={onNewChat}
              className="w-full btn-primary flex items-center justify-center py-3 text-base"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Start New Conversation
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">or</span>
              </div>
            </div>
            
            <button 
              onClick={() => {
                // For now, just trigger new chat
                // In the future, this could open a "join group" modal
                onNewChat();
              }}
              className="w-full btn-secondary flex items-center justify-center py-3 text-base"
            >
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Create Group Chat
            </button>
          </div>

          {/* Features list */}
          <div className="mt-12 text-left">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">
              What you can do:
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Send real-time messages with instant delivery
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Create group chats with multiple participants
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                React to messages and see typing indicators
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                Stay connected with online status updates
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWelcome;
