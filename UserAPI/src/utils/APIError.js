// Handles errors
class APIError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message) //Inherit from Error parent class
        // Compulsory built in classes
        this.statusCode = statusCode
        this.errors = errors
        this.data = null,
        this.message = message
        this.success = false;

        if (stack) {
            this.stack = stack
        }else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {APIError}