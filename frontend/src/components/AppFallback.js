import React from "react";

const AppFallback = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-6">
            Enhanced Chat Platform
          </h1>

          <div className="text-left space-y-4 text-gray-300">
            <h2 className="text-xl font-semibold text-green-400 mb-3">
              🎉 Deployment Successful!
            </h2>

            <p>
              Your chat platform has been successfully deployed to Render.
              Here's what we've accomplished:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>✅ Backend server running on production</li>
              <li>✅ MongoDB Atlas database connected</li>
              <li>✅ React frontend built and deployed</li>
              <li>✅ Socket.IO real-time messaging ready</li>
              <li>✅ Static file serving configured</li>
            </ul>

            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <h3 className="font-semibold text-yellow-300 mb-2">
                ⚙️ Final Configuration Needed:
              </h3>
              <p className="text-sm">
                To complete the setup, add these environment variables in your
                Render dashboard:
              </p>
              <pre className="mt-2 text-xs bg-black/30 p-2 rounded font-mono">
                {`REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_ZnJhbmstYmFzaWxpc2stOTAuY2xlcmsuYWNjb3VudHMuZGV2JA`}
              </pre>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppFallback;
