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

  

  

 

  
}