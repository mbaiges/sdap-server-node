export default {
    // 2XX - Successful responses
    OK: {
        code: 200
    },
    CREATED: {
        code: 201
    },
    // 4XX - Client error responses
    BAD_REQUEST: {
        code: 400
    },
    NOT_FOUND: {
        code: 404
    },
    CONFLICT: {
        code: 409
    },
    // 5XX - Server error responses
    INTERNAL_SERVER_ERROR: {
        code: 500
    },
    SERVICE_UNAVAILABLE: {
        code: 503
    }
}