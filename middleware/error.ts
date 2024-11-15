import {NextFunction, Request, Response} from 'express';
import ErrorHandler from '../utils/ErrorHandler';

export const ErrorMiddleware = (err:any, req: Request, res: Response, next: NextFunction) => { 
    if (res.headersSent) {
        return next(err);
    }
    
    err.statusCode = res.statusCode || 500
    err.message = err.message || 'Internal Server Error'

    if(err.name === 'CastError') {
        const message = `Resource not found. Invalid: ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    if(err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`
        err = new ErrorHandler(message, 400)
    }

    // wrong jwt token error
    if(err.name === 'JsonWebTokenError') {
        const message = 'JSON Web Token is invalid. Try again!'
        err = new ErrorHandler(message, 400)
    }

    // expired jwt token error
    if(err.name === 'TokenExpiredError') {
        const message = 'JSON Web Token is expired. Try again!'
        err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
 }
