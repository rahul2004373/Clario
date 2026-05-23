import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
    static async signup(req: Request, res: Response) {
        try {
            const result = await AuthService.signUp(req.body);
            res.status(201).json(result);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const result = await AuthService.login(req.body);
            res.status(200).json(result);
        } catch (err: any) {
            res.status(401).json({ error: err.message });
        }
    }

    static async me(req: Request, res: Response) {
        try {
            const user = await AuthService.getMe((req as any).user.id);
            res.status(200).json(user);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
}
