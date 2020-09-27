
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
        res.status(statusCode || 200).json({
            success: true,
            message: message,
            data: {
                statusCode,
                ...data
            }
        })
    }

    static serverErrorResponse(error, res, message) {
        console.warn(error);

        return res.status(500).json({
            success: false,
            message: message || 'Internal server error',
            error: {
                message: error.message
            }
        })
    }
}



module.exports = Response;