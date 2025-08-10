const express = require("express");
const { protect, getUserFromClerk } = require("../middleware/auth");
const User = require("../models/User");
const router = express.Router();

/**
 * @route   POST /api/auth/sync
 * @desc    Sync user data from Clerk to MongoDB
 * @access  Private
 */
router.post("/sync", protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { email, username, firstName, lastName, avatar, bio } = req.body;

    // Check if user already exists
    let user = await User.findOne({ clerkId: userId });

    if (user) {
      // Update existing user
      user.email = email || user.email;
      user.username = username || user.username;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.avatar = avatar || user.avatar;
      user.bio = bio || user.bio;

      await user.save();
    } else {
      // Create new user
      user = await User.create({
        clerkId: userId,
        email,
        username: username || email.split("@")[0],
        firstName: firstName || "User",
        lastName: lastName || "",
        avatar: avatar || "",
        bio: bio || "",
      });
    }

    res.status(200).json({
      success: true,
      message: "User synced successfully",
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    console.error("Error syncing user:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error syncing user data",
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId } = req.auth;

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          clerkId: undefined, // Don't expose Clerk ID
        },
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving profile",
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put("/profile", protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId } = req.auth;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.clerkId;
    delete updates.email;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
});

/**
 * @route   POST /api/auth/status
 * @desc    Update user online status
 * @access  Private
 */
router.post("/status", protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { isOnline } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        isOnline: isOnline,
        lastSeen: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: {
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating status",
    });
  }
});

module.exports = router;
