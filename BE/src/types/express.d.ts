import 'express';

declare module 'express-serve-static-core' {
    interface Request {
        user?: { sub: string;[key: string]: any };
    }
} 