class TelegramError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorMessage = message;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default TelegramError;
