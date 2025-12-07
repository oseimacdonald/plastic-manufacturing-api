// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ 
    error: 'Unauthorized',
    message: 'Authentication required to access this resource'
  });
};

// Authorization middleware (basic role-based)
const hasRole = (role) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // In a real application, you would check the user's role from your database
    // For this example, we'll check the email domain or other user properties
    const userEmail = req.user.emails?.[0]?.value || '';
    
    // Simple role check based on email domain
    // You can replace this with your own logic
    if (role === 'admin' && userEmail.endsWith('@admin.com')) {
      return next();
    }
    
    if (role === 'manager' && (userEmail.endsWith('@admin.com') || userEmail.endsWith('@manager.com'))) {
      return next();
    }
    
    // Default: allow access for authenticated users with any email
    // You can customize this based on your needs
    return next();
    
    // If you want to be strict:
    // res.status(403).json({ 
    //   error: 'Forbidden',
    //   message: `Role '${role}' required to access this resource`
    // });
  };
};

module.exports = {
  isAuthenticated,
  hasRole
};