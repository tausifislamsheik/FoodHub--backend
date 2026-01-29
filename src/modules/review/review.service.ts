import prisma from "../../config/database";
import { AppError } from "../../utils/error";

interface CreateReviewData {
  providerId: string;
  rating: number;
  comment?: string;
}

export class ReviewService {
  async createReview(customerId: string, data: CreateReviewData) {
    const { vendorId, rating, comment } = data;

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new AppError("Vendor not found", 404);
    }

    // Check if customer has ordered from this vendor
    const hasOrdered = await prisma.order.findFirst({
      where: {
        customerId,
        vendorId,
        status: "DELIVERED",
      },
    });

    if (!hasOrdered) {
      throw new AppError(
        "You can only review vendors you have ordered from",
        403
      );
    }

    // Check if customer already reviewed this vendor
    const existingReview = await prisma.review.findFirst({
      where: {
        customerId,
        vendorId,
      },
    });

    if (existingReview) {
      throw new AppError("You have already reviewed this vendor", 409);
    }

    const review = await prisma.review.create({
      data: {
        customerId,
        vendorId,
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
        vendor: {
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
      where: { vendorId },
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
        vendor: {
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

 

  
}