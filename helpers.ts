import { Response } from "express";
import { Server } from "node:http";
import { Pool } from "pg";

export const MILLISECONDS_IN_DAY = 86_400_000;
export const allowedOrigins = ["http://localhost:5174", "http://192.168.100.22:5174"];
export const userTypes = ["ALUMNUS", "STUDENT"];


export const wait = (seconds: number) => new Promise((res) => setTimeout(res, seconds*1000));

export const isString = (str: any): str is string => Object.prototype.toString.call(str) === '[object String]' && (str instanceof String || typeof str === 'string');
export const isInteger = (num: number) => Number.isInteger(num);

export const initialize = () => {
    process.env.MODE = process.env.MODE!.trim();
    process.env.DATABASE_USERNAME = process.env.DATABASE_USERNAME!.trim();
    process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD!.trim();  
}

export const getPositiveInteger = (value: any, fallback: number) => {
    const parsedValue = Number.parseInt(value, 10);
    return isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

export const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

export const gracefulShutdown = (server: Server, pool: Pool) => {
    return async () => {
        try {
            server.close();
            if (!pool.ended)    
                await pool.end();
            console.log("Gracefully shutting down....");        
        } catch (err) {
            console.log(err);
            console.log("Ungracefully shutting down....");
            process.exit(-1);
        }
    }
}    

export function sendEmptySuccessResponse(res: Response, statusCode = 200) {
    return res.status(statusCode).json({
        status: "success"
    });
}

export function parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return {};
    return cookieHeader
        .split(';')
        .reduce((cookies: Record<string, string>, cookie) => {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
            return cookies;
        }, {});
}