//import necessary modules
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

//import custom error handler
const AppError = require('../utils/AppError.js');

//connect to supabase database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


//function to handle previous transcription get requests
const previousTranscription =  async(req, res, next)=>{
    try{
        //extract authentication token sent with request from cookie
        const {authToken} = req.cookies;
  
        //throw error if token not received
        if(!authToken){
          throw new AppError(401, 'Token not available!');
        }
  
        //verify authentication token
        jwt.verify(authToken, process.env.JWT_SECRET, async (error, decoded)=>{
            //throw error generated during verification
            if(error){
              throw new AppError(401, 'Invalid or expired token!');
            }
            //extract userid from the decoded data
            const {userid} = decoded;
  
            //fetch transcription text from database
            let { data: transcriptData, error: readError} = await supabase
            .from('transcriptions')
            .select('transcription_id, user_id, created_at, transcription_text')
            .eq('user_id', userid); 
  
            //throw supabase error while reading data
            if(readError){
              throw new AppError(readError);
            }
     
            //throw error if transcript data not fetched
            if(!transcriptData){
              throw new AppError(500, 'Could not fetch transcription data!');
            }
  
            //send a message if no transcriptions available
            if(!transcriptData[0]){
              throw new AppError(401, 'You don\'t have any transcriptions yet!');
            }
  
            //send transcription data to frontend
            res.status(200).json(transcriptData);
        });
    }
    //catch all errors and pass them to error handling middleware
    catch(err){
      next(err);
    }
  };

  //export previousTranscription module
  module.exports = previousTranscription;