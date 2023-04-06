export default {
    MALFORMED_MSG: {
      code: 4001,
      msg: "Invalid JSON or message does not follow the protocol syntax"
    },
    MSG_UNSUPPORTED_TYPE: {
      code: 4002,
      msg: "Message type is not valid or supported"
    },
    UPDATE_NON_EXISTING_FIELD: {
      code: 4003,
      msg: "Try to modify a field that does not exist in the summary object"
    },
    UPDATE_INVALID_FIELD_TYPE: {
      code: 4004,
      msg: "Try to modify a field of a different type than the existing one in the summary object. The new value is not valid for the given schema or violates some constraint"
    },
    AGGREGABLE_NOT_FOUND: {
      code: 4005,
      msg: "Aggregable name that does not exist or is not accessible"
    },
    AGGREGABLE_NAME_EXISTS: {
      code: 4006,
      msg: "Aggregable name already in use"
    },
    OVERLAPPING_JSON_POINTERS: {
      code: 4007,
      msg: "The update contains two or more JSON pointers that share a common root, which can’t be performed"
    },
    MISSING_REQUIRED_FIELD: {
      code: 4008,
      msg: "Missing a required field such as Aggregable name, schema, or update"
    },
    UNSUPPORTED_OPERATION: {
      code: 4009,
      msg: "Try to perform an operation that is not supported by the protocol or the server"
    },
    INTERNAL_SERVER_ERROR: {
      code: 5001,
      msg: "The server encountered an unexpected error"
    },
    SERVICE_UNAVAILABLE: {
      code: 5002,
      msg: "The server is temporarily unable to handle the request due to overload or maintenance"
    }
  }