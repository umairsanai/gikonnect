import "./email.js";
import express, { Request } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import hpp from "hpp-clean";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import fallbackRouter from "./routes/fallbackRouter.js";
import chatRouter from "./routes/chatRouter.js";
import systemRouter from "./routes/systemRouter.js";
import { errorMiddleware } from "./error.js";
import { getPayloadFromJWT } from "./controllers/auth.js";
import { unhandledRequestHandler } from "./controllers/system.js";
import { allowedOrigins } from "./helpers.js";

const app = express();

// LOGGING
app.use(morgan("dev"));


// CORS
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));


// BODY PARSING
app.set('query parser', 'extended');    
app.use(express.json({limit: '20kb'}));
app.use(cookieParser());
app.use(express.urlencoded({extended: true, limit:'20kb'}));


// USER IDENTIFICATION
app.use(getPayloadFromJWT);


// RATE LIMITING
app.use(rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	limit: 180,
    message: {
        status: "fail",
        statusCode: 429,
        message: "Too many requests. Please try after some time."
    },
    keyGenerator: (req: Request) => {
        return req.payload?.email || ipKeyGenerator(req.ip ?? "192.168.100.112");
    }
}));


// SECURITY
app.use([helmet(), hpp({ whitelist: ["skills"] })]);


// ROUTERS
app.use("/api/v1/auth/", authRouter);
app.use("/api/v1/users/", userRouter);
app.use("/api/v1/chats/", chatRouter);
app.use("/api/v1/system/", systemRouter);
app.use("/api/v1/", fallbackRouter);

app.use(errorMiddleware);
app.use(unhandledRequestHandler);

export default app;