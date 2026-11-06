// Error Codes
// 1 - AppError
// 2 - DatabaseError
// 3 - TelegramError
// 4 - BybitError
// 5 - BinanceError

class DatabaseError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorMessage = message;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default DatabaseError;
