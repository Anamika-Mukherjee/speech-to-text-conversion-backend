
//define custom error handler class
class AppError extends Error{
    constructor(statusCode, message){
        super();
        //set error status code and error message 
        this.statusCode = statusCode,
        this.message = message
    }
}

//export AppError module
module.exports = AppError;