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

  async getProviderReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId } = req.params;
      const result = await reviewService.getProviderReviews(providerId);
      sendSuccess(res, result, "Provider reviews retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.id },
      });

      if (!customer) {
        throw new AppError("Customer profile not found", 404);
      }

      const reviews = await reviewService.getCustomerReviews(customer.id);
      sendSuccess(res, reviews, "Your reviews retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.id },
      });

      if (!customer) {
        throw new AppError("Customer profile not found", 404);
      }

      const review = await reviewService.updateReview(id, customer.id, req.body);
      sendSuccess(res, review, "Review updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.id },
      });

      if (!customer) {
        throw new AppError("Customer profile not found", 404);
      }

      const result = await reviewService.deleteReview(id, customer.id);
      sendSuccess(res, result, "Review deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}