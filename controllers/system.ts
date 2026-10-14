import { Request, Response, NextFunction } from "express";

export const getHealth = (req: Request, res: Response) => {
    res.status(200).json({
        status: "success",
        data: {
            service: "mdcatemy-api",
            uptimeSeconds: Math.floor(process.uptime())
        }
    });
};

export const unhandledRequestHandler = (req: Request, res: Response, next: NextFunction) => {
    res.status(400).json({
        status: "fail",
        message: "No such route exists!"
    });
}