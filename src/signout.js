
//function to handle signout request
const signout = async (req, res, next)=>{
    try{
      //delete the cookie containing token
      res.clearCookie('authToken');
      //send message to frontend after deletion of cookie
      res.status(200).json('Successfully Signed Out!');
    }
    //catch all errors and pass them to error handling middleware
    catch(err){
      next(err);
    }
  };
  
  module.exports = signout;