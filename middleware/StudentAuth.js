const jwt = require('jsonwebtoken');
const config = require('config');

 // Middleware function to authenticate user
const auth = (req, res, next) => {
  const token = req.cookies.token; // Get token from cookie

  // Check if token exists
  if (!token) {
    return res.status(401).redirect('/student/login');
  }


  try{
    // Verify token
    const decodedToken = jwt.verify(token, config.get('jwtsecret'));
    req.user = decodedToken;
    next(); // Pass the control to the next middleware
  }
  catch(err){
    console.error(err.message);
    res.status(401).json({ msg: 'Unauthorized' });
  }
}

module.exports = auth;