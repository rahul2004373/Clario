import { Router } from "express";
import { FeedbackController } from "./feedback.controller";

export const feedbackRouter = Router();

feedbackRouter.post("/", FeedbackController.submitFeedback);
