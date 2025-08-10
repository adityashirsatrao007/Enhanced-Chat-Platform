const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastRead: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      allowInvites: {
        type: Boolean,
        default: true,
      },
      muteNotifications: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ type: 1 });

// Virtual for participant count
chatSchema.virtual("participantCount").get(function () {
  return this.participants.length;
});

// Pre-save middleware
chatSchema.pre("save", function (next) {
  this.lastActivity = new Date();
  next();
});

// Static method to find user's chats
chatSchema.statics.findUserChats = function (userId) {
  return this.find({
    "participants.user": userId,
    isActive: true,
  })
    .populate(
      "participants.user",
      "username firstName lastName avatar isOnline"
    )
    .populate("lastMessage")
    .sort({ lastActivity: -1 });
};

// Static method to find direct chat between two users
chatSchema.statics.findDirectChat = function (user1Id, user2Id) {
  return this.findOne({
    type: "direct",
    "participants.user": { $all: [user1Id, user2Id] },
    isActive: true,
  }).populate(
    "participants.user",
    "username firstName lastName avatar isOnline"
  );
};

// Instance method to add participant
chatSchema.methods.addParticipant = function (userId, role = "member") {
  const existingParticipant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );

  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
      lastRead: new Date(),
    });
  }

  return this.save();
};

// Instance method to remove participant
chatSchema.methods.removeParticipant = function (userId) {
  this.participants = this.participants.filter(
    (p) => p.user.toString() !== userId.toString()
  );

  return this.save();
};

// Instance method to update last read
chatSchema.methods.updateLastRead = function (userId) {
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );

  if (participant) {
    participant.lastRead = new Date();
    return this.save();
  }
};

module.exports = mongoose.model("Chat", chatSchema);
