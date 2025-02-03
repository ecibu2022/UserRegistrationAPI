// Handling failures of the requests made eg GET,POST,PUT,DELETE,PATCH
const asyncHandler = (requestHandler) => {
    return (Request, Response, next) => {
        Promise.resolve(requestHandler(Request, Response, next)).catch((error) => next(error))
    }
}

export {asyncHandler}