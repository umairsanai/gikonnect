import "dotenv/config";
import app from "./app.js";
import pool from "./database.js";
import { createServer, Server as HTTPServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { initialize, gracefulShutdown, allowedOrigins, getPositiveInteger } from "./helpers.js";
import { socketConnectionHandler } from "./socket.js";
import { socketAuthenticateMiddleware } from "./controllers/socketMiddleware.js";

initialize();

const PORT = getPositiveInteger(process.env.PORT, 3000);;
const HOST  = "0.0.0.0";

const server: HTTPServer = createServer(app);

const io = new SocketServer(server, {
   cors: {
      origin: allowedOrigins,
      credentials: true,
   }
});

io.use(socketAuthenticateMiddleware);
io.on("connection", socketConnectionHandler(io));

server.listen(PORT, HOST, () => {
   process.env.MODE === "dev" && console.clear();
   console.log(`Server running on port ${PORT} .....`);
});

process.on('SIGTERM', gracefulShutdown(server, pool));
process.on('SIGINT', gracefulShutdown(server, pool));
