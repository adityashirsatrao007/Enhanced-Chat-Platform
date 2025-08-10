const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

/**
 * Socket.IO connection handler
 * Manages real-time chat functionality
 */
const socketHandler = (io) => {
  const connectedUsers = new Map(); // Track online users

  io.on('connection', (socket) => {
    console.log(`🔗 User connected: ${socket.id}`);

    /**
     * User authentication and setup
     */
    socket.on('authenticate', async (data) => {
      try {
        const { userId } = data;
        
        if (!userId) {
          socket.emit('error', { message: 'User ID is required' });
          return;
        }

        // Find user by Clerk ID
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Store user info in socket
        socket.userId = user._id.toString();
        socket.clerkId = userId;

        // Add to connected users
        connectedUsers.set(socket.userId, {
          socketId: socket.id,
          userId: socket.userId,
          clerkId: userId,
          user: user
        });

        // Update user online status
        await User.findByIdAndUpdate(user._id, { 
          isOnline: true,
          lastSeen: new Date()
        });

        // Join user to their chat rooms
        const userChats = await Chat.findUserChats(user._id);
        userChats.forEach(chat => {
          socket.join(chat._id.toString());
        });

        // Notify user's friends about online status
        await notifyFriendsStatusChange(user._id, true, socket);

        socket.emit('authenticated', {
          userId: user._id,
          message: 'Successfully authenticated'
        });

        console.log(`✅ User authenticated: ${user.username} (${socket.id})`);

      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    /**
     * Join a specific chat room
     */
    socket.on('join-chat', async (data) => {
      try {
        const { chatId } = data;
        
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Verify user is participant of the chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const isParticipant = chat.participants.some(
          p => p.user.toString() === socket.userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(chatId);
        socket.emit('joined-chat', { chatId });

        console.log(`👥 User ${socket.userId} joined chat ${chatId}`);

      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    /**
     * Leave a chat room
     */
    socket.on('leave-chat', (data) => {
      const { chatId } = data;
      socket.leave(chatId);
      socket.emit('left-chat', { chatId });
      console.log(`👋 User ${socket.userId} left chat ${chatId}`);
    });

    /**
     * Send a message
     */
    socket.on('send-message', async (data) => {
      try {
        const { chatId, content, replyTo } = data;
        
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Verify chat and permissions
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const isParticipant = chat.participants.some(
          p => p.user.toString() === socket.userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create message
        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content: {
            text: content.text,
            type: content.type || 'text',
            file: content.file || undefined
          },
          replyTo: replyTo || undefined
        });

        // Update chat
        chat.lastMessage = message._id;
        chat.lastActivity = new Date();
        await chat.save();

        // Populate message
        await message.populate('sender', 'username firstName lastName avatar');
        if (replyTo) {
          await message.populate('replyTo', 'content.text sender');
        }

        // Emit to all chat participants
        io.to(chatId).emit('new-message', {
          message: message,
          chatId: chatId
        });

        console.log(`💬 Message sent in chat ${chatId} by user ${socket.userId}`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicators
     */
    socket.on('typing-start', (data) => {
      const { chatId } = data;
      if (socket.userId) {
        socket.to(chatId).emit('user-typing', {
          userId: socket.userId,
          chatId: chatId
        });
      }
    });

    socket.on('typing-stop', (data) => {
      const { chatId } = data;
      if (socket.userId) {
        socket.to(chatId).emit('user-stopped-typing', {
          userId: socket.userId,
          chatId: chatId
        });
      }
    });

    /**
     * Message reactions
     */
    socket.on('add-reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        await message.addReaction(socket.userId, emoji);

        // Notify chat participants
        io.to(message.chat.toString()).emit('reaction-added', {
          messageId: messageId,
          userId: socket.userId,
          emoji: emoji
        });

      } catch (error) {
        console.error('Add reaction error:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    /**
     * Mark messages as read
     */
    socket.on('mark-read', async (data) => {
      try {
        const { chatId } = data;
        
        if (!socket.userId) return;

        // Update last read timestamp for user in chat
        const chat = await Chat.findById(chatId);
        if (chat) {
          await chat.updateLastRead(socket.userId);
          
          // Notify other participants
          socket.to(chatId).emit('messages-read', {
            userId: socket.userId,
            chatId: chatId,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', async () => {
      try {
        if (socket.userId) {
          // Remove from connected users
          connectedUsers.delete(socket.userId);

          // Update user offline status
          await User.findByIdAndUpdate(socket.userId, { 
            isOnline: false,
            lastSeen: new Date()
          });

          // Notify user's friends about offline status
          await notifyFriendsStatusChange(socket.userId, false, socket);

          console.log(`🔌 User disconnected: ${socket.userId} (${socket.id})`);
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });

  /**
   * Helper function to notify friends about status changes
   */
  async function notifyFriendsStatusChange(userId, isOnline, socket) {
    try {
      const user = await User.findById(userId).populate('friends');
      
      if (user && user.friends) {
        user.friends.forEach(friend => {
          const friendConnection = connectedUsers.get(friend._id.toString());
          if (friendConnection) {
            socket.to(friendConnection.socketId).emit('friend-status-change', {
              userId: userId,
              isOnline: isOnline,
              lastSeen: new Date()
            });
          }
        });
      }
    } catch (error) {
      console.error('Error notifying friends:', error);
    }
  }

  return io;
};

module.exports = socketHandler;
