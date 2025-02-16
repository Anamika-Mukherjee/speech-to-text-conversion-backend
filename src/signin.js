//import necessary modules
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

//import custom error handler
const AppError = require('../utils/AppError.js');

//connect to supabase database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

//set cookie options
const cookieOptions = {
  // secure: true,
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  // sameSite: 'None' 
};

//function to handle sign in requests
const signin = async (req, res, next)=>{
    try{
       //destructure email and password sent by user from request body 
       const {email, password} = req.body;
  
       //check if user sent all data
       if(!(email && password)){
         throw new AppError(401, 'Email and Password are required!');
       }
  
       //check if user exists in database
       let { data: user, error: readError} = await supabase
       .from('users')
       .select('email, user_uuid, password')
       .eq('email', email);
  
       //throw supabase error while reading data
       if(readError){
         throw new AppError(readError);
       }
  
       //throw error if user does not exist
       if(!user[0]){
          throw new AppError(401, 'Invalid email or password!');
       }
  
       //check if the password is correct
       const foundUser = await bcrypt.compare(password, user[0].password);
  
       //throw error if incorrect password
       if(!foundUser){
        throw new AppError(401, 'Invalid email or password!');
       }
  
       //generate authentication token and store it in cookie
       const payload = {userid: user[0].user_uuid, email: user[0].email};
       const authToken = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'});
  
       res.cookie('authToken', authToken, cookieOptions);
  
       //send token back to the frontend
       res.status(200).json({authToken});
    }
    //catch all errors and pass them to error handling middleware
    catch(err){
      next(err);
    }
  };

  //export signin module
  module.exports = signin;