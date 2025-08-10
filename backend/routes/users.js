const express = require('express');
const { protect, getUserFromClerk } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

/**
 * @route   GET /api/users/search
 * @desc    Search for users
 * @access  Private
 */
router.get('/search', protect, getUserFromClerk, async (req, res) => {
  try {
    const { q: searchTerm, limit = 20 } = req.query;
    const { userId } = req.auth;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
    }

    // Get current user to exclude from results
    const currentUser = await User.findOne({ clerkId: userId });
    const excludeIds = currentUser ? [currentUser._id] : [];

    // Search for users
    const users = await User.search(searchTerm.trim(), excludeIds)
      .limit(parseInt(limit));

    // Return public profiles only
    const publicProfiles = users.map(user => user.getPublicProfile());

    res.status(200).json({
      success: true,
      data: {
        users: publicProfiles,
        count: publicProfiles.length
      }
    });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
});

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get('/:userId', protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-blockedUsers -clerkId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user'
    });
  }
});

/**
 * @route   POST /api/users/:userId/friend
 * @desc    Add user as friend
 * @access  Private
 */
router.post('/:userId/friend', protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { userId } = req.auth;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }

    // Get target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }

    // Add to friends list (both ways)
    currentUser.friends.push(targetUserId);
    targetUser.friends.push(currentUser._id);

    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);

    res.status(200).json({
      success: true,
      message: 'Friend added successfully'
    });

  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding friend'
    });
  }
});

/**
 * @route   DELETE /api/users/:userId/friend
 * @desc    Remove user from friends
 * @access  Private
 */
router.delete('/:userId/friend', protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { userId } = req.auth;

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }

    // Get target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from friends list (both ways)
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== targetUserId
    );
    targetUser.friends = targetUser.friends.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);

    res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing friend'
    });
  }
});

/**
 * @route   GET /api/users/friends
 * @desc    Get current user's friends list
 * @access  Private
 */
router.get('/friends', protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId } = req.auth;

    const user = await User.findOne({ clerkId: userId })
      .populate('friends', 'username firstName lastName avatar isOnline lastSeen');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        friends: user.friends.map(friend => friend.getPublicProfile()),
        count: user.friends.length
      }
    });

  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving friends'
    });
  }
});

/**
 * @route   POST /api/users/:userId/block
 * @desc    Block a user
 * @access  Private
 */
router.post('/:userId/block', protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { userId } = req.auth;

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already blocked
    if (currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'User already blocked'
      });
    }

    // Add to blocked list and remove from friends if present
    currentUser.blockedUsers.push(targetUserId);
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== targetUserId
    );

    await currentUser.save();

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking user'
    });
  }
});

/**
 * @route   DELETE /api/users/:userId/block
 * @desc    Unblock a user
 * @access  Private
 */
router.delete('/:userId/block', protect, getUserFromClerk, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { userId } = req.auth;

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }

    // Remove from blocked list
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      id => id.toString() !== targetUserId
    );

    await currentUser.save();

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking user'
    });
  }
});

module.exports = router;
