import { DisconnectReason, Socket, Server as SocketServer } from "socket.io";
import { isInteger, isString } from "../helpers.js";
import pool from "../database.js";

export const chatMessageHandler = (socket: Socket, io: SocketServer) => {
    return async (data: {message: string, recipient_id: number}) => {

        if (!data.message || !isString(data.message) || !data.recipient_id || !isInteger(data.recipient_id) || data.message.trim() === "") {
            return socket.emit("chat:error", {
                reason: "Invalid recipient_id or message", 
                error_code: 400
            });
        }

        const rowCount = (await pool.query("INSERT INTO chats (sender_id, recipient_id, chat_message) SELECT $1, $2, $3 WHERE EXISTS (SELECT 1 FROM user_connections WHERE user_id = $1 AND connected_user_id = $2)", [socket.data.user.user_id, data.recipient_id, data.message.trim()])).rowCount;

        if (rowCount && rowCount > 0) {
            return socket.emit("chat:error", {
                reason: "You are not connected with the person you're trying to send message. Please send him/her a connection request first.", 
                error_code: 403
            });
        }

        // Response to sender
        socket.emit("chat:message:ack", { delivered: true });
        
        // Response to receiver
        io.to(`user:${data.recipient_id}`).emit("chat:message", {
            message: data.message,
            sender_id: socket.data.user.user_id
        });

    }
}
    
export const errorEventHandler = (error: Error) => {
    console.log(`Error occured: ${error.message ?? JSON.stringify(error)}`);
} 

export const disconnectEventHandler = (reason: DisconnectReason) => {}
