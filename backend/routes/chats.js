const express = require("express");
const { protect, getUserFromClerk } = require("../middleware/auth");
const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");
const router = express.Router();

/**
 * @route   GET /api/chats
 * @desc    Get all chats for the current user
 * @access  Private
 */
router.get("/", protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId } = req.auth;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's chats
    const chats = await Chat.findUserChats(currentUser._id);

    // Format chats for response
    const formattedChats = chats.map((chat) => {
      const chatObj = chat.toObject();

      // For direct chats, set name to other participant's name
      if (chat.type === "direct") {
        const otherParticipant = chat.participants.find(
          (p) => p.user._id.toString() !== currentUser._id.toString()
        );
        if (otherParticipant) {
          chatObj.name =
            otherParticipant.user.fullName || otherParticipant.user.username;
          chatObj.avatar = otherParticipant.user.avatar;
        }
      }

      return chatObj;
    });

    res.status(200).json({
      success: true,
      data: {
        chats: formattedChats,
        count: formattedChats.length,
      },
    });
  } catch (error) {
    console.error("Error getting chats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving chats",
    });
  }
});

/**
 * @route   POST /api/chats
 * @desc    Create a new chat
 * @access  Private
 */
router.post("/", protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { type, name, description, participantIds } = req.body;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate chat type
    if (!["direct", "group"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat type",
      });
    }

    // For direct chats, check if chat already exists
    if (type === "direct") {
      if (!participantIds || participantIds.length !== 1) {
        return res.status(400).json({
          success: false,
          message: "Direct chat requires exactly one other participant",
        });
      }

      const existingChat = await Chat.findDirectChat(
        currentUser._id,
        participantIds[0]
      );
      if (existingChat) {
        return res.status(200).json({
          success: true,
          message: "Chat already exists",
          data: { chat: existingChat },
        });
      }
    }

    // Validate participants exist
    const participants = await User.find({ _id: { $in: participantIds } });
    if (participants.length !== participantIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more participants not found",
      });
    }

    // Create chat participants array
    const chatParticipants = [
      {
        user: currentUser._id,
        role: "admin",
      },
      ...participantIds.map((id) => ({
        user: id,
        role: "member",
      })),
    ];

    // Create the chat
    const chat = await Chat.create({
      type,
      name: type === "group" ? name : undefined,
      description: description || "",
      participants: chatParticipants,
      creator: currentUser._id,
    });

    // Populate the chat
    await chat.populate(
      "participants.user",
      "username firstName lastName avatar isOnline"
    );

    res.status(201).json({
      success: true,
      message: "Chat created successfully",
      data: { chat },
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({
      success: false,
      message: "Error creating chat",
    });
  }
});

/**
 * @route   GET /api/chats/:chatId
 * @desc    Get a specific chat
 * @access  Private
 */
router.get("/:chatId", protect, getUserFromClerk, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.auth;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get the chat
    const chat = await Chat.findById(chatId)
      .populate(
        "participants.user",
        "username firstName lastName avatar isOnline"
      )
      .populate("lastMessage");

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (p) => p.user._id.toString() === currentUser._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: { chat },
    });
  } catch (error) {
    console.error("Error getting chat:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving chat",
    });
  }
});

/**
 * @route   PUT /api/chats/:chatId
 * @desc    Update chat details
 * @access  Private
 */
router.put("/:chatId", protect, getUserFromClerk, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.auth;
    const { name, description, avatar } = req.body;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if user is admin of the chat
    const userParticipant = chat.participants.find(
      (p) => p.user.toString() === currentUser._id.toString()
    );

    if (!userParticipant || userParticipant.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only chat admins can update chat details",
      });
    }

    // Update chat
    if (name !== undefined) chat.name = name;
    if (description !== undefined) chat.description = description;
    if (avatar !== undefined) chat.avatar = avatar;

    await chat.save();

    res.status(200).json({
      success: true,
      message: "Chat updated successfully",
      data: { chat },
    });
  } catch (error) {
    console.error("Error updating chat:", error);
    res.status(500).json({
      success: false,
      message: "Error updating chat",
    });
  }
});

/**
 * @route   POST /api/chats/:chatId/participants
 * @desc    Add participants to a chat
 * @access  Private
 */
router.post(
  "/:chatId/participants",
  protect,
  getUserFromClerk,
  async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId } = req.auth;
      const { participantIds } = req.body;

      // Get current user
      const currentUser = await User.findOne({ clerkId: userId });
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get the chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      // Only group chats can have participants added
      if (chat.type !== "group") {
        return res.status(400).json({
          success: false,
          message: "Cannot add participants to direct chats",
        });
      }

      // Check if user has permission to add participants
      const userParticipant = chat.participants.find(
        (p) => p.user.toString() === currentUser._id.toString()
      );

      if (
        !userParticipant ||
        (!chat.settings.allowInvites && userParticipant.role !== "admin")
      ) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions to add participants",
        });
      }

      // Validate new participants
      const newParticipants = await User.find({ _id: { $in: participantIds } });
      if (newParticipants.length !== participantIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more participants not found",
        });
      }

      // Add participants
      for (const participantId of participantIds) {
        await chat.addParticipant(participantId);
      }

      // Populate and return updated chat
      await chat.populate(
        "participants.user",
        "username firstName lastName avatar isOnline"
      );

      res.status(200).json({
        success: true,
        message: "Participants added successfully",
        data: { chat },
      });
    } catch (error) {
      console.error("Error adding participants:", error);
      res.status(500).json({
        success: false,
        message: "Error adding participants",
      });
    }
  }
);

/**
 * @route   DELETE /api/chats/:chatId/participants/:participantId
 * @desc    Remove a participant from a chat
 * @access  Private
 */
router.delete(
  "/:chatId/participants/:participantId",
  protect,
  getUserFromClerk,
  async (req, res) => {
    try {
      const { chatId, participantId } = req.params;
      const { userId } = req.auth;

      // Get current user
      const currentUser = await User.findOne({ clerkId: userId });
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get the chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      // Check permissions
      const userParticipant = chat.participants.find(
        (p) => p.user.toString() === currentUser._id.toString()
      );

      const isRemovingSelf = participantId === currentUser._id.toString();
      const isAdmin = userParticipant && userParticipant.role === "admin";

      if (!isRemovingSelf && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }

      // Remove participant
      await chat.removeParticipant(participantId);

      res.status(200).json({
        success: true,
        message: "Participant removed successfully",
      });
    } catch (error) {
      console.error("Error removing participant:", error);
      res.status(500).json({
        success: false,
        message: "Error removing participant",
      });
    }
  }
);

module.exports = router;
