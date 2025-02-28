class HandleError extends Error{
    constructor(
        statusCode,
        message = "Somthing went wrong",
        errors = [],
        stack = ""
    ){
            super(message)
            this.statusCode = statusCode
            this.datat = null
            this,message = message
            this.success = false
            this.erorrs = errors

            if(stack){
                this.stack = stack
            }else{
                Error.captureStackTrace(this, this.constructor)
            }
        }
    }

    export {HandleError}
    