import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/index";

export interface JwtPayloadLike {
    sub: string;
    [key: string]: any;
}

export function generateToken(payload: JwtPayloadLike, expiresIn: string = "7d") {
    const secret: Secret = env.jwtSecret as unknown as Secret;
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): JwtPayloadLike {
    const secret: Secret = env.jwtSecret as unknown as Secret;
    return jwt.verify(token, secret) as JwtPayloadLike;
} 