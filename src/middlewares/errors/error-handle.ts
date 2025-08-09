import {NextFunction, Request, Response} from "express";

export class HttpError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = "HttpError";
        Error.captureStackTrace(this, this.constructor);
    }
}


export const errorHandler = (
    err: HttpError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    console.error(`[Error] ${status} - ${message}`);
    res.status(status).json({ message });
};