# Enhanced Chat Platform

# Enhanced Chat Platform

A modern, real-time chat application built with the MERN stack, featuring Clerk authentication and optimized for Render.com deployment.

## Features

### 🔐 Authentication
- **Clerk Authentication**: Secure user authentication and management
- **Protected Routes**: Route-level authentication protection
- **User Profiles**: Complete user profile management

### 💬 Real-time Chat
- **Instant Messaging**: Real-time message delivery using Socket.IO
- **Typing Indicators**: See when users are typing
- **Message Reactions**: React to messages with emojis
- **Message Editing**: Edit and delete your own messages
- **File Sharing**: Share images and documents
- **Group Chats**: Create and manage group conversations

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes
- **Professional Interface**: Clean, modern design with Tailwind CSS
- **Accessibility**: WCAG compliant interface elements

### 🚀 Performance
- **Optimized Build**: Production-ready optimization
- **Fast Loading**: Efficient code splitting and lazy loading
- **Real-time Updates**: Instant UI updates for better UX
- **Error Handling**: Comprehensive error management

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time communication
- **Clerk** - Authentication service
- **JWT** - Token-based authentication

### Frontend
- **React.js** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **React Hot Toast** - Toast notifications
- **Heroicons** - Icon library

## Project Structure

```
Enhanced-Chat-Platform/
├── backend/
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   ├── sockets/           # Socket.IO handlers
│   ├── Dockerfile         # Docker configuration
│   ├── health-check.js    # Health check endpoint
│   └── index.js           # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── dist/              # Production build
├── render.yaml            # Render.com deployment config
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Clerk account for authentication

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Enhanced-Chat-Platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Deployment on Render.com

This application is optimized for deployment on Render.com with the included `render.yaml` configuration.

### Automatic Deployment
1. Connect your GitHub repository to Render.com
2. Render will automatically detect the `render.yaml` file
3. Set up the required environment variables
4. Deploy with one click

### Manual Deployment

#### Backend Service
1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

#### Frontend Service
1. Create a new Static Site on Render
2. Connect your repository
3. Set build command: `npm install && npm run build`
4. Set publish directory: `dist`
5. Add environment variables

### Required Environment Variables

Set these in your Render.com dashboard:

**Backend:**
- `NODE_ENV=production`
- `MONGODB_URI` (from MongoDB Atlas)
- `CLERK_SECRET_KEY` (from Clerk dashboard)
- `JWT_SECRET` (generate a secure random string)
- `CORS_ORIGIN` (your frontend URL)

**Frontend:**
- `VITE_API_URL` (your backend service URL)
- `VITE_CLERK_PUBLISHABLE_KEY` (from Clerk dashboard)

## Features in Detail

### Authentication Flow
1. Users sign up/sign in through Clerk
2. JWT tokens are issued for API authentication
3. Protected routes ensure secure access
4. Real-time socket authentication

### Chat Functionality
- **Create Chats**: Start new conversations with users
- **Group Chats**: Create group conversations
- **Real-time Messaging**: Instant message delivery
- **Message Status**: See delivery and read status
- **Typing Indicators**: Real-time typing status
- **Message Reactions**: Add emoji reactions
- **Message Editing**: Edit sent messages
- **File Sharing**: Share images and documents

### User Experience
- **Responsive Design**: Works on all device sizes
- **Real-time Updates**: Instant UI updates
- **Error Handling**: User-friendly error messages
- **Loading States**: Clear loading indicators
- **Accessibility**: Keyboard navigation and screen reader support

## API Endpoints

### Authentication
- `POST /api/auth/sync` - Sync user with database
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/search` - Search users
- `PUT /api/users/profile` - Update user profile

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get chat details
- `PUT /api/chats/:id` - Update chat
- `DELETE /api/chats/:id` - Delete chat

### Messages
- `GET /api/messages/:chatId` - Get chat messages
- `POST /api/messages/:chatId` - Send message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message
- `PUT /api/messages/:id/react` - Add/remove reaction

### WebSocket Events

#### Client to Server
- `join_chat` - Join a chat room
- `leave_chat` - Leave a chat room
- `send_message` - Send a new message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

#### Server to Client
- `message_received` - New message received
- `message_updated` - Message was updated
- `message_deleted` - Message was deleted
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing
- `user_online` - User came online
- `user_offline` - User went offline

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@enhancedchat.com or create an issue in the repository.

## Acknowledgments

- Clerk for authentication services
- Render.com for hosting platform
- MongoDB Atlas for database hosting
- Tailwind CSS for styling framework
- Socket.IO for real-time communication

## Features

- 🔐 Secure authentication with Clerk
- 💬 Real-time chat functionality
- 📱 Responsive design with TailwindCSS
- 🚀 Optimized for Render.com deployment
- 🛡️ Protected routes and middleware
- 👥 User management and profiles

## Tech Stack

- **Frontend**: React.js, TailwindCSS, Clerk React
- **Backend**: Node.js, Express.js, MongoDB, Clerk SDK
- **Database**: MongoDB Atlas
- **Authentication**: Clerk
- **Deployment**: Render.com

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string
PORT=5000

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Environment
NODE_ENV=production
```

Create a `.env` file in the frontend directory with:

```env
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
REACT_APP_API_URL=http://localhost:5000/api
```

## Installation

1. Clone the repository
2. Install dependencies: `npm run install-deps`
3. Set up environment variables
4. Start development: `npm run dev`

## Deployment

This application is optimized for Render.com deployment with separate build configurations for frontend and backend services.

## License

MIT License
