import { ExtendedError, Socket } from "socket.io";
import { connectionLimiter, messageLimiter } from "../rateLimiter.js";
import { parseCookies } from "../helpers.js";
import { getUserFromPayload, LOGIN_COOKIE_NAME, verifyJWT } from "./auth.js";
import { AppError } from "../error.js";

type SocketMiddlewareNextFunction = (err?: ExtendedError) => void;
type socketMiddlwareSignature = (packet: [event: string, ...args: any[]], next: (err?: ExtendedError) => void) => void;

export const socketAuthenticateMiddleware = async (socket: Socket, next: SocketMiddlewareNextFunction) => {     

    const cookies = parseCookies(socket.request.headers.cookie);
    const token = cookies[LOGIN_COOKIE_NAME];

    if (!token) 
        return next(new AppError("You're not logged in! Please login again!", 401));

    const payload = verifyJWT(token);
    if (!payload) return next(new AppError("Invalid JWT", 401));

    const user = await getUserFromPayload(payload);

    if (!user) 
        return next(new AppError("Your login session has expired. Please log in again.", 401));

    if (!connectionLimiter.isAllowed(user.email)) 
        return next(new AppError("Connection rate limit exceeded", 429));

    socket.data.user = user;
    next();
}

export const messageLimiterMiddleware = (socket: Socket): socketMiddlwareSignature => {
    return ([event, ...args], next) => {    
        if (!messageLimiter .isAllowed(socket.data.user.email)) 
            return next(new Error("Message rate limit exceeded"));
        next();
    }
} 

