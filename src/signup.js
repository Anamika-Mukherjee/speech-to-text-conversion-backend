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
   secure: true,
   httpOnly: true,
   maxAge: 1000 * 60 * 60 * 24 * 7,
   sameSite: 'None' 
 };

//function to handle sign up requests
const signup = async (req, res, next)=>{
    try{
       //destructure email and password sent by user from request body 
       const {email, password} = req.body;
  
       //check if user sent all data
       if(!(email && password)){
        throw new AppError(401, 'Email and Password are required!');
      }
    
       //check if user already exists
       let { data: userExists, error: readError} = await supabase
        .from('users')
        .select('email')
        .eq('email', email);
     
        //throw error if user exists
        if(userExists[0]){
         throw new AppError(401, 'Email already exists!');
        }

        //throw supabase error while reading data
        if(readError){
         throw new AppError(readError);
        }
   
       //encrypt password
       const hashPassword = async (pw)=>{
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(pw, salt);
          return hash;
       }
  
       const encryptedPassword = await hashPassword(password);
    
       //store user data in supabase database
       const { data: newUser, error: insertError } = await supabase
       .from('users')
       .insert([
          {email, password: encryptedPassword},
       ])
       .select()
  
       //throw supabase error while inserting
       if(insertError){
         throw new AppError(insertError);
       }
  
       //generate authentication token and store it in cookie
       const payload = {userid: newUser[0].user_uuid, email: newUser[0].email};
       const authToken = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'});
  
       res.cookie('authToken', authToken, cookieOptions);
  
       //send userid and token to frontend
       res.status(200).json({userid: newUser[0].user_uuid, email: newUser[0].email, authToken});
    }
    //catch all errors and pass them to error handling middleware
    catch(err){  
       next(err);
    }
  };

  //export signup module
  module.exports = signup;
  


