import { Router } from "express";
import { PlaygroundController } from "./playground.controller";

export const playgroundRouter = Router({ mergeParams: true });

playgroundRouter.post("/session", PlaygroundController.createSession);
playgroundRouter.post("/message", PlaygroundController.sendMessage);
playgroundRouter.delete("/session", PlaygroundController.clearHistory);
