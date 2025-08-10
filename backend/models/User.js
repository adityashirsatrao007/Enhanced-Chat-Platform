const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        mentions: {
          type: Boolean,
          default: true,
        },
      },
      privacy: {
        showOnlineStatus: {
          type: Boolean,
          default: true,
        },
        showLastSeen: {
          type: Boolean,
          default: true,
        },
      },
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Index for search functionality
userSchema.index({
  username: "text",
  firstName: "text",
  lastName: "text",
  email: "text",
});

// Pre-save middleware to update lastSeen
userSchema.pre("save", function (next) {
  if (this.isModified("isOnline") && this.isOnline) {
    this.lastSeen = new Date();
  }
  next();
});

// Static method to find users by search term
userSchema.statics.search = function (searchTerm, excludeIds = []) {
  return this.find({
    $and: [
      {
        $or: [
          { username: new RegExp(searchTerm, "i") },
          { firstName: new RegExp(searchTerm, "i") },
          { lastName: new RegExp(searchTerm, "i") },
          { email: new RegExp(searchTerm, "i") },
        ],
      },
      { _id: { $nin: excludeIds } },
    ],
  })
    .select("-blockedUsers")
    .limit(20);
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    avatar: this.avatar,
    bio: this.bio,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
  };
};

module.exports = mongoose.model("User", userSchema);
