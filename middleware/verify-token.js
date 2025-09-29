// We need this to check if login tokens are valid
const jwt = require('jsonwebtoken');

// SECURITY CHECK - Make sure someone is actually logged in
// This runs before any protected routes to check authentication
function verifyToken(req, res, next) {
  try {
    // Look for the token in the request headers
    // It should be in the format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ err: 'No authorization header provided.' });
    }
    
    // Split "Bearer <token>" and grab just the token part
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ err: 'No token provided.' });
    }
    
    // Check if the token is valid using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // If it's valid, save the user info so other routes can use it
    // Now any route can access req.user to know who's logged in
    req.user = decoded.payload;
    
    // Continue to the actual route
    next();
  } catch (err) {
    // Token is fake, expired, or messed up somehow
    console.log('Token verification error:', err.message);
    res.status(401).json({ err: 'Invalid token.' });
  }
}

// Export this so our routes can use it
module.exports = verifyToken;
