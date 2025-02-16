//import necessary modules
const jwt = require('jsonwebtoken');

//import custom error handler
const AppError = require('../utils/AppError.js');

//function to authenticate users after sign in
const authenticate = async (req, res, next)=>{
    try{
       //extract authentication token sent with cookie
       const {authToken} = req.cookies;
  
       //throw error if token not received
       if(!authToken){
         throw new AppError(401, 'Token not available!');
       }
    
      //verify received token and send back userid and email if token is verified
      jwt.verify(authToken, process.env.JWT_SECRET, async (error, decoded)=>{
        //throw errors generated during verification
        if(error){
          throw new AppError(401, 'Invalid or expired token!');
        }
        //extract userid and email from the decoded data and send them to frontend
        const {userid, email} = decoded;
        res.status(200).json({userid, email});       
      });
    }
    //catch all errors and pass them to error handling middleware
    catch(err){
      next(err);
    }
  };

  //export authenticate module
  module.exports = authenticate;