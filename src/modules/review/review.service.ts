import prisma from "../../config/database";
import { AppError } from "../../utils/error";

interface CreateReviewData {
  providerId: string;
  rating: number;
  comment?: string;
}

export class ReviewService {
  async createReview(customerId: string, data: CreateReviewData) {
    const { providerId, rating, comment } = data;

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    // Check if customer has ordered from this provider
    const hasOrdered = await prisma.order.findFirst({
      where: {
        customerId,
        providerId,
        status: "DELIVERED",
      },
    });

    if (!hasOrdered) {
      throw new AppError(
        "You can only review providers you have ordered from",
        403
      );
    }

    // Check if customer already reviewed this provider
    const existingReview = await prisma.review.findFirst({
      where: {
        customerId,
        providerId,
      },
    });

    if (existingReview) {
      throw new AppError("You have already reviewed this provider", 409);
    }

    const review = await prisma.review.create({
      data: {
        customerId,
        providerId,
        rating,
        comment,
      },
      include: {
        customer: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        provider: {
          select: {
            shopName: true,
          },
        },
      },
    });

    return review;
  }

  async getProviderReviews(providerId: string) {
    const reviews = await prisma.review.findMany({
      where: { providerId },
      include: {
        customer: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      reviews,
      averageRating: Number(avgRating.toFixed(1)),
      totalReviews: reviews.length,
    };
  }

  async getCustomerReviews(customerId: string) {
    const reviews = await prisma.review.findMany({
      where: { customerId },
      include: {
        provider: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return reviews;
  }

  async updateReview(id: string, customerId: string, data: Partial<CreateReviewData>) {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    if (review.customerId !== customerId) {
      throw new AppError("You can only update your own reviews", 403);
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data,
      include: {
        provider: {
          select: {
            shopName: true,
          },
        },
      },
    });

    return updatedReview;
  }

  async deleteReview(id: string, customerId: string) {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    if (review.customerId !== customerId) {
      throw new AppError("You can only delete your own reviews", 403);
    }

    await prisma.review.delete({
      where: { id },
    });

    return { message: "Review deleted successfully" };
  }
}