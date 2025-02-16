//import necessary modules
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { AutomaticSpeechRecognition } = require('deepinfra');
const path = require('path');

//import custom error handler
const AppError = require('../utils/AppError.js');

//connect to supabase database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

//declare speech to text api model name
const MODEL = 'openai/whisper-large-v3';


//function to handle file audio uploads
const fileUpload = async (req, res, next)=>{    
    try{
        //extract authentication token sent with cookie
        const {authToken} = req.cookies;
  
        //throw error if token not received
        if(!authToken){
          throw new AppError(401, 'Token not available!');
        }
    
        //verify received token 
        jwt.verify(authToken, process.env.JWT_SECRET, async (error, decoded)=>{
            if(error){
               throw new AppError(401, 'Invalid or expired token!');
            }
            const {userid} = decoded;       
  
            //check if file is sent with request
            if(!req.file){
              throw new AppError(400, 'File not available!');
            }        
            console.log(req.file);
            //api request to deepinfra for speech to text conversion
            const input = {
               audio: path.join(__dirname, '../', req.file.path),
            }; 
            const client = new AutomaticSpeechRecognition(MODEL, process.env.DEEPINFRA_API_KEY);
            const transcription = await client.generate(input);
  
            //throw error if transcription not received
            if(!transcription){
               throw new AppError(500, 'Could not generate transcription!');
            }
  
            //store transcribed text in variable
            const text = transcription.text;
  
            //store transcribed text in database
            const {data, error: insertError} = await supabase
            .from('transcriptions')
            .insert([
             {user_id: userid, transcription_text: text},
            ])
            .select()
  
            //throw error while inserting
            if(insertError){
              throw new AppError(error);
            }
  
            //send transcribed text to frontend
            res.status(200).json(text);
        });
    }
    //catch all errors and pass them to error handling middleware
    catch(err){
        next(err);
    }  
  };

//export uploadFile module
module.exports = fileUpload;