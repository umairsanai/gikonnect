import { JwtPayload } from "jsonwebtoken"

declare global {
  namespace Express {
    interface Request {
        user: any
        payload?: JwtPayload
    }
  }
}

export type IncomingSocketMessage = {
    type: string
}