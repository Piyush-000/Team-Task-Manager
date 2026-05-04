import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export type JwtPayload = {
  userId: string;
  email: string;
  role: Role;
};
