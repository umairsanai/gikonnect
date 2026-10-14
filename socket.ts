import { Socket, Server as SocketServer } from "socket.io";
import { chatMessageHandler, disconnectEventHandler, errorEventHandler } from "./controllers/socketHandler.js";
import { messageLimiterMiddleware } from "./controllers/socketMiddleware.js";

export const socketConnectionHandler = (io: SocketServer) => {
    return (socket: Socket) => {    

        socket.join(`user:${socket.data.user.user_id}`);    
        socket.use(messageLimiterMiddleware(socket));
        
        socket.on("chat:message", chatMessageHandler(socket, io));        
        socket.on("error", errorEventHandler);
        socket.on("disconnect", disconnectEventHandler);
    }
}
