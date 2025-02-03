// This is a good practice for sending back responses to the user in front end
class APIResponse {
    constructor(statusCode, data, message, success = false) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = success;
    }
}

export { APIResponse }