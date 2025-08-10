const { requireAuth } = require("@clerk/express");

/**
 * Middleware to protect routes requiring authentication
 * Uses Clerk's requireAuth middleware
 */
const protect = requireAuth();

/**
 * Middleware to extract user information from Clerk token
 */
const getUserFromClerk = (req, res, next) => {
  try {
    if (req.auth && req.auth.userId) {
      req.user = {
        id: req.auth.userId,
        ...req.auth,
      };
    }
    next();
  } catch (error) {
    console.error("Error extracting user from Clerk:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/**
 * Middleware to check if user is admin
 * This is a basic implementation - customize based on your needs
 */
const adminOnly = (req, res, next) => {
  try {
    // Check if user has admin role in Clerk metadata
    const userRoles = req.auth?.sessionClaims?.metadata?.roles || [];

    if (!userRoles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking permissions",
    });
  }
};

/**
 * Optional authentication middleware
 * Continues even if user is not authenticated
 */
const optionalAuth = (req, res, next) => {
  try {
    if (req.auth && req.auth.userId) {
      req.user = {
        id: req.auth.userId,
        ...req.auth,
      };
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  protect,
  getUserFromClerk,
  adminOnly,
  optionalAuth,
};
