//import dotenv package for environment variables
require('dotenv').config();

//import necessary packages
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const AppError = require('./utils/AppError.js');
const { AutomaticSpeechRecognition } = require('deepinfra');
//import route handlers for api requests
const home = require('./src/home.js');
const signup = require('./src/signup.js');
const signin = require('./src/signin.js');
const authenticate = require('./src/authenticate.js');
const signout = require('./src/signout.js');
const fileUpload = require('./src/fileUpload.js');
const previousTranscription = require('./src/previousTranscription.js');

//initialize express
const app = express();

//initialize dynamic port number and default it to 8000
const port = process.env.PORT || 8000;

//create path for uploads folder
const uploadDir = path.join(__dirname, 'uploads');

//create an uploads folder if it doesn't exist
if(!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir, {recursive: true});
}

//initialize storage location for uploaded files 
const storage = multer.diskStorage({
    destination: './uploads/audiofiles', 
    filename: (req, file, cb) => {
      return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    },
});

//function to check if the received file type is valid  
const fileFilter = (req, file, cb) =>{
    //valid file types
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/mpga', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/aac', 'audio/flac'];

    //throw error if uploaded file type is not included in the valid types
    if(!allowedTypes.includes(file.mimetype)){
      return cb(new AppError(415, 'Invalid file type!'), false);
    }
    cb(null, true);
  }

//initialize multer and define file storage and file filter
const upload = multer({storage: storage, fileFilter: fileFilter});  

//set up express, body-parser and cookie-parser middleware
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

//declare urls to be allowed by cors
const whitelist = [process.env.CORS_WHITELIST_URL];

// set cors options to allow only certain urls, headers and methods
const corsOptions = {
    credentials: true,
    origin: (origin, callback)=>{
        if(whitelist.indexOf(origin) !== -1 || !origin){
            callback(null, true);
        }
        else{
            callback(new Error('Not allowed by CORS!'));
        }
    },
    allowedHeaders: 'Content-Type',
};

//set up middleware for cors 
app.use(cors(corsOptions));
app.options('*', cors()); 

//Route handlers
//Backend server home page
app.get('/', home);

//Sign up route
app.post('/signup', signup);

//Sign in route
app.post('/signin', signin); 

//Authentication route
app.get('/authenticate', authenticate);

//Sign out route
app.get('/signout', signout);

//File upload route
app.post('/uploadfile', upload.single('speechClip'), fileUpload);

//route to access previous transcriptions
app.get('/transcription-data', previousTranscription);

//middleware to handle all errors
app.use((err, req, res, next)=>{

  //set error status code if not available
  const {statusCode = 500} = err;

  //set error message if not available
  if(!err.message){
    err.message = 'Something went wrong!';
  }  

  console.log(err.message);
  //send error status code and message to frontend
  res.status(statusCode).json({message: err.message}); 

});

//set up backend server and listen to all requests
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
})