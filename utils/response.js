
class Response {
    constructor(res) {
        this.res = res;
        this.failure = this.failure.bind(this);
        this.success = this.success.bind(this)
    }

    static failure( { res, error = {message: null}, statusCode, readMessage } ) {
        res.status(statusCode).json({
            success: false,
            message: readMessage,
            error: {
                statusCode,
                message: error.message || readMessage
            }
        })
    }

    static success({ res, message, statusCode, data }) {
        res.status(statusCode).json({
            success: true,
            message: message,
            data: {
                statusCode,
                ...data
            }
        })
    }
}



module.exports = Response;