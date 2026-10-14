import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { DatabaseError } from "pg";

export class AppError extends Error {

    statusCode: number;
    isOperational = true;
    status: "fail" | "error";
    message: string;    

    constructor(errorMessage: string, statusCode?: number) {
        super(errorMessage);
        this.statusCode = statusCode ?? 500;
        this.status = String(this.statusCode).startsWith("4") ? "fail" : "error";
        this.message = errorMessage;
        Error.captureStackTrace(this, this.constructor);
    }

}

const DATABASE_UNAVAILABLE_CODES = new Set(["08000", "08001", "08003", "08004", "08006", "08007", "08P01", "53300", "53400", "57P01", "57P02", "57P03", "58000", "58030", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "ENOTFOUND", "ETIMEDOUT"]);

export function handleAsyncError(func: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res, next).catch(next);
    }
}

export function errorMiddleware(error: Error | AppError, req: Request, res: Response, next: NextFunction) {
    if (res.headersSent) return next(error);

    if (process.env.MODE === "prod") {
        sendProductionError(error, res);
    } else {
        console.error(error);
        sendDevelopementError(error, req, res);
    }
}

const isDatabaseUnavailable = (error: any) => {
    return DATABASE_UNAVAILABLE_CODES.has(error.code)
        || error.message?.includes("Connection terminated unexpectedly")
        || error.message?.includes("timeout exceeded when trying to connect");
};

function sendProductionError(error: Error | AppError, res: Response) {
    let errorObject;
    let errorStatusCode;
    if (error instanceof AppError) {
        [errorStatusCode, errorObject] = [error.statusCode, {
            status: error.status,
            message: error.message
        }];
    } else {
        if (error instanceof DatabaseError && error.code === "23505" && error.table === "users" && error.detail?.includes("email")) {
            [errorStatusCode, errorObject] = [400, {
                status: "error",
                message: "A user with this email already exists. Please signup with some other email."
            }];
        } else if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
            [errorStatusCode, errorObject] = [400, {
                status: "error",
                message: "Your image size is more than 2 MB. Please upload an image of size under 2 MB"
            }];
        } else if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
            [errorStatusCode, errorObject] = [401, {
                status: "fail",
                message: "Your login session has expired. Please log in again."
            }];
        } else if (isDatabaseUnavailable(error)) {
            [errorStatusCode, errorObject] = [503, {
                status: "error",
                message: "The service is temporarily unavailable. Please try again shortly."
            }];
        } else {
            [errorStatusCode, errorObject] = [500, {
                status: "error",
                message: "Internal Server Error. Something went wrong."
            }];
            console.error(error);
        }
    }
    console.error(`ErrorStatusCode: ${errorStatusCode}, ErrorObject: `, errorObject);
    res.status(errorStatusCode).json(errorObject);
}

function sendDevelopementError(error: Error | AppError, req: Request, res: Response) {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
            stack: error.stack
        });
    } else {
        res.status(400).json({
            status: "error",
            error
        });
    }
}
