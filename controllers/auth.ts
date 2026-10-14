import { AppError, handleAsyncError } from "../error.js";
import pool from "../database.js";
import argon from "argon2";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sendAccountVerificationEmail, sendPasswordResetEmail } from "../email.js";
import { isInteger, isString, sendEmptySuccessResponse } from "../helpers.js";
import { randomBytes, createHash } from 'crypto';
import type { NextFunction, Request, Response } from "express";
import { validate as validateEmail } from "email-validator";

export const LOGIN_COOKIE_NAME = "gikonnect-login-token";

const createToken = () => randomBytes(32).toString('hex');
const hashToken = (input: string) => createHash('sha256').update(input).digest('hex');

const getLoginCookieOptions = () => ({
    httpOnly: true,
    sameSite: "strict" as const,
    path: "/",
    secure: process.env.MODE === "prod"
});

const signJwtToken = (email: string, role: string) => {
    return jwt.sign({ email, role }, process.env.JWT_SIGN_SECRET!, {
        expiresIn: "120 days"
    });
}

const signTokenAndSetInCookie = (email: string, role: string, res: Response) => {
    res.cookie(LOGIN_COOKIE_NAME, signJwtToken(email, role), {
        ...getLoginCookieOptions(),
        maxAge: 120 * 24 * 60 * 60 * 1000 // 120 days
    });
}

const clearLoginCookie = (res: Response) => {
    res.clearCookie(LOGIN_COOKIE_NAME, getLoginCookieOptions());
};

export const hashPassword = async (password: string) => {
    try {
        return (await argon.hash(password, {
            hashLength: 32,
            type: argon.argon2id,
            secret: Buffer.from(process.env.PASSWORD_HASH_SECRET!)
        }));
    } catch(err) {
        console.error("Error in hashing passwrod: \n", err);
        throw new AppError("Error in hashing passwrod", 500);
    }
}

const verifyPassword = async (actual_password: string, input_password: string) => {
    return await argon.verify(actual_password, input_password, {
        secret: Buffer.from(process.env.PASSWORD_HASH_SECRET!)
    });
}

export function restrictTo(...roles: string[]) {
    return function(req: Request, res: Response, next: NextFunction) {
        if (roles.includes(req.user.role))
            return next();
        next(new AppError("You are not authorized for this service!", 401));
    }
}

export const verifyJWT = (token: string) => {
    let payload: JwtPayload | null;

    try {
        payload = jwt.verify(token, process.env.JWT_SIGN_SECRET!) as JwtPayload;
    } catch (error) {
        return null;
    }

    return payload;
}

export const getPayloadFromJWT = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies[LOGIN_COOKIE_NAME];
    if (!token) return next();
        
    try { 
        req.payload = jwt.verify(token, process.env.JWT_SIGN_SECRET!) as JwtPayload; 
    } catch (error) {}

    next();
});

export const getUserFromPayload = async (payload: JwtPayload) => {
    return (await pool.query("SELECT users.user_id, email, role, password_changed_at, verification_token FROM users LEFT JOIN email_verification_tokens tok ON tok.user_id=users.user_id WHERE email = $1 AND password_changed_at < $2", [payload.email, (payload.iat ?? 0) * 1000])).rows[0];
};

const getSessionUser = async (req: Request, res: Response) => {
    const token = req.cookies[LOGIN_COOKIE_NAME];
    // console.log("Token: ", token);
    if (!token) return null;

    const payload = req.payload?.email ? req.payload : verifyJWT(token);
    // console.log("Payload: ", payload);
    if (!payload) return null;

    const user = await getUserFromPayload(payload);

    if (!user) {
        clearLoginCookie(res);
        return null;
    }    

    return user;
};    

export const protect = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const user = await getSessionUser(req, res);

    if (!user)
        return next(new AppError("Your login session has expired. Please log in again.", 401));

    if (typeof user.verification_token === "string")
        return next(new AppError("Your account is not verfied yet. Please click the link in the email sent to you.", 403));

    req.user = user;
    next();
});

export const signup = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {    
    let {name, headline, email, password, role, department_id, gpa, graduation_year } = req.body;

    if (!isString(name) || (headline && !isString(headline)) || !isString(email) || !validateEmail(email) || !isString(password) || !isString(role) || !isInteger(department_id) || !isInteger(graduation_year))
        return next(new AppError("Incomplete or Incorrect Data for Signup!", 400));

    if (graduation_year < 1993 || graduation_year > new Date().getFullYear() + 4)
        return next(new AppError("Incomplete or Incorrect Data for Signup!", 400));        

    if (role === "STUDENT" && typeof gpa !== "number")
        return next(new AppError("Incomplete or Incorrect Data for Signup!", 400));        

    headline ??= 'Always a GIKIan';
    password = await hashPassword(password);

    const token = createToken();
    const hashedToken = hashToken(token);

    const user = (await pool.query("INSERT INTO users (name, headline, email, password, role, department_id, gpa, graduation_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id, name, email, role", [name.trim(), headline.trim(), email.trim(), password, role, department_id, gpa, graduation_year])).rows[0];
    await pool.query("INSERT INTO email_verification_tokens(user_id, verification_token) VALUES ($1, $2)", [user.user_id, hashedToken]);
    
    try {
        await sendAccountVerificationEmail(user.email, user.name, token);
    } catch (error: any) {
        console.error("Error while sending mail: ", error.message);
        await pool.query("DELETE FROM users WHERE user_id = $1", [user.user_id]);
        throw new AppError(`Account could not be created, due to failure in verifying email: ${email}. Please try with some other email or after some time.`, 500);
    }

    signTokenAndSetInCookie(user.email, user.role, res);
    sendEmptySuccessResponse(res, 201);
});

export const verifyAccount = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {    
    const { token } = req.query;

    if (!isString(token)) return next(new AppError("Verification token is required", 400));

    const user = (await pool.query("SELECT user_id, email, role FROM users NATURAL JOIN email_verification_tokens WHERE verification_token=$1", [hashToken(token)])).rows[0];
    if (!user) throw new AppError("The account verfication link is incorrect!", 400);

    await pool.query("DELETE FROM email_verification_tokens WHERE user_id=$1", [user.user_id]);

    signTokenAndSetInCookie(user.email, user.role, res);
    sendEmptySuccessResponse(res);
});

export const forgotPassword = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new AppError("Request body is required", 400);

    const { email } = req.body;
    if (!isString(email)) return next(new AppError("Please provide the valid email to reset password for!", 400));

    const user = (await pool.query("SELECT user_id, name, email FROM users WHERE email=$1", [email])).rows[0];

    if (!user) return sendEmptySuccessResponse(res);

    const token = createToken();
    const hashedToken = hashToken(token);

    await pool.query("UPDATE users SET reset_password_token=$2, reset_password_expiry = CURRENT_TIMESTAMP + INTERVAL '10 minutes' WHERE user_id=$1", [user.user_id, hashedToken]);
    
    try {
        await sendPasswordResetEmail(user.email, user.name, token);
    } catch (error: any) {
        console.error('Full error:', error.response?.body);
        await pool.query("UPDATE users SET reset_password_token = NULL, reset_password_expiry = NULL WHERE user_id=$1", [user.user_id]);
        throw new AppError(`Email could not be sent to ${email}`, 500);
    }

    sendEmptySuccessResponse(res);
});

export const resetPassword = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new AppError("Request body is required", 400);

    const { token, password } = req.body;
    if (!isString(token) || !isString(password)) return next(new AppError("Reset token and Password are required", 400));

    const hashedToken = hashToken(token);

    let user = (await pool.query("SELECT email, role FROM users WHERE reset_password_token=$1 AND reset_password_expiry >= CURRENT_TIMESTAMP", [hashedToken])).rows[0];

    if (!user) 
        throw new AppError("The reset password link is incorrect or has been expired!", 400);

    const hashedPassword = await hashPassword(password);
    const { rowCount: updatedRowCount} = await pool.query("UPDATE users SET password = $2, password_changed_at=$3, reset_password_token = NULL, reset_password_expiry = NULL WHERE reset_password_token = $1", [hashedToken, hashedPassword, Date.now()]);

    if (updatedRowCount && updatedRowCount > 0)
        signTokenAndSetInCookie(user.email, user.role, res);
        
    sendEmptySuccessResponse(res);
});

export const login = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const {email: input_email, password: input_password} = req.body;

    if (!input_email || !input_password) 
        return next(new AppError("Please provide complete credentials", 400));

    const user = (await pool.query("SELECT name, email, password, role FROM users WHERE email=$1", [input_email])).rows[0];

    if (!user || !await verifyPassword(user.password, input_password))
        return next(new AppError("Incorrect email or password!", 401));

    signTokenAndSetInCookie(user.email, user.role, res);
    
    res.status(200).json({
        status: "success",
        data: {
            email: user.email,
            role: user.role
        }
    });
});

export const logout = (req: Request, res: Response, next: NextFunction) => {
    clearLoginCookie(res);
    sendEmptySuccessResponse(res, 204);
};