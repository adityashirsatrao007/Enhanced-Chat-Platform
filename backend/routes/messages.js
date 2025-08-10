const express = require("express");
const { protect, getUserFromClerk } = require("../middleware/auth");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");
const router = express.Router();

/**
 * @route   GET /api/messages/:chatId
 * @desc    Get messages for a specific chat
 * @access  Private
 */
router.get("/:chatId", protect, getUserFromClerk, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.auth;
    const { page = 1, limit = 50 } = req.query;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const isParticipant = chat.participants.some(
      (p) => p.user.toString() === currentUser._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get messages
    const messages = await Message.getChatMessages(
      chatId,
      parseInt(page),
      parseInt(limit)
    );

    // Update last read for the user
    await chat.updateLastRead(currentUser._id);

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving messages",
    });
  }
});

/**
 * @route   POST /api/messages/:chatId
 * @desc    Send a new message
 * @access  Private
 */
router.post("/:chatId", protect, getUserFromClerk, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.auth;
    const { content, replyTo } = req.body;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const isParticipant = chat.participants.some(
      (p) => p.user.toString() === currentUser._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate content
    if (!content || !content.text || content.text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Create message
    const message = await Message.create({
      chat: chatId,
      sender: currentUser._id,
      content: {
        text: content.text.trim(),
        type: content.type || "text",
        file: content.file || undefined,
      },
      replyTo: replyTo || undefined,
    });

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();

    // Populate message for response
    await message.populate("sender", "username firstName lastName avatar");
    if (replyTo) {
      await message.populate("replyTo", "content.text sender");
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { message },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
    });
  }
});

/**
 * @route   PUT /api/messages/:messageId
 * @desc    Edit a message
 * @access  Private
 */
router.put("/:messageId", protect, getUserFromClerk, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.auth;
    const { content } = req.body;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    // Check if message is too old to edit (24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (message.createdAt < twentyFourHoursAgo) {
      return res.status(400).json({
        success: false,
        message: "Message is too old to edit",
      });
    }

    // Validate new content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Edit message
    await message.editMessage(content.trim());

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: { message },
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({
      success: false,
      message: "Error editing message",
    });
  }
});

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete("/:messageId", protect, getUserFromClerk, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.auth;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is the sender or chat admin
    const isOwner = message.sender.toString() === currentUser._id.toString();

    // Get chat to check if user is admin
    const chat = await Chat.findById(message.chat);
    const userParticipant = chat.participants.find(
      (p) => p.user.toString() === currentUser._id.toString()
    );
    const isAdmin = userParticipant && userParticipant.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages or be a chat admin",
      });
    }

    // Soft delete message
    await message.softDelete();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting message",
    });
  }
});

/**
 * @route   POST /api/messages/:messageId/react
 * @desc    Add reaction to a message
 * @access  Private
 */
router.post(
  "/:messageId/react",
  protect,
  getUserFromClerk,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId } = req.auth;
      const { emoji } = req.body;

      // Get current user
      const currentUser = await User.findOne({ clerkId: userId });
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get message
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Validate emoji
      if (!emoji || emoji.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Emoji is required",
        });
      }

      // Add reaction
      await message.addReaction(currentUser._id, emoji.trim());

      res.status(200).json({
        success: true,
        message: "Reaction added successfully",
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({
        success: false,
        message: "Error adding reaction",
      });
    }
  }
);

/**
 * @route   DELETE /api/messages/:messageId/react
 * @desc    Remove reaction from a message
 * @access  Private
 */
router.delete(
  "/:messageId/react",
  protect,
  getUserFromClerk,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId } = req.auth;
      const { emoji } = req.body;

      // Get current user
      const currentUser = await User.findOne({ clerkId: userId });
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get message
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Remove reaction
      await message.removeReaction(currentUser._id, emoji);

      res.status(200).json({
        success: true,
        message: "Reaction removed successfully",
      });
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({
        success: false,
        message: "Error removing reaction",
      });
    }
  }
);

/**
 * @route   POST /api/messages/:messageId/read
 * @desc    Mark message as read
 * @access  Private
 */
router.post("/:messageId/read", protect, getUserFromClerk, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.auth;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Mark as read
    await message.markAsRead(currentUser._id);

    res.status(200).json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking message as read",
    });
  }
});

module.exports = router;
