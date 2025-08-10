import React from "react";

/**
 * Typing Indicator Component
 * Shows when users are typing
 */
const TypingIndicator = ({ userIds = [] }) => {
  if (userIds.length === 0) return null;

  return (
    <div className="px-4 py-2">
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="typing-dots">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
        <span className="text-sm">
          {userIds.length === 1
            ? "Someone is typing..."
            : `${userIds.length} people are typing...`}
        </span>
      </div>

      <style jsx>{`
        .typing-dots {
          display: flex;
          align-items: center;
          space-x: 2px;
        }

        .typing-dot {
          width: 4px;
          height: 4px;
          background-color: #9ca3af;
          border-radius: 50%;
          animation: typing 1.5s infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%,
          60%,
          100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
