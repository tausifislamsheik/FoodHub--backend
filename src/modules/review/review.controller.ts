import { Request, Response, NextFunction } from "express";
import { ReviewService } from "./review.service";
import { sendSuccess } from "../../utils/response";
import prisma from "../../config/database";
import { AppError } from "../../utils/error";

const reviewService = new ReviewService();

export class ReviewController {
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.id },
      });

      if (!customer) {
        throw new AppError("Customer profile not found", 404);
      }

      const review = await reviewService.createReview(customer.id, req.body);
      sendSuccess(res, review, "Review created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  

  

 

  
}