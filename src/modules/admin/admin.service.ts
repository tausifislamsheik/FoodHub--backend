import prisma from "../../config/database";
import { AppError } from "../../utils/error";

export class AdminService {
  async getAllUsers(filters?: any) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive === "true";
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            _count: {
              select: {
                orders: true,
                reviews: true,
              },
            },
          },
        },
        provider: {
          select: {
            id: true,
            shopName: true,
            isApproved: true,
            _count: {
              select: {
                menus: true,
                orders: true,
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  }

  async getPendingProviders() {
    const providers = await prisma.provider.findMany({
      where: {
        isApproved: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return providers;
  }

  async approveProvider(providerId: string, isApproved: boolean) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: { isApproved },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedProvider;
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role === "ADMIN") {
      throw new AppError("Cannot deactivate admin users", 403);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  async getDashboardStats() {
    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      approvedProviders,
      pendingProviders,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.provider.count(),
      prisma.provider.count({ where: { isApproved: true } }),
      prisma.provider.count({ where: { isApproved: false } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        providers: totalProviders,
      },
      providers: {
        total: totalProviders,
        approved: approvedProviders,
        pending: pendingProviders,
      },
      orders: {
        total: totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
      },
    };
  }

  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role === "ADMIN") {
      throw new AppError("Cannot delete admin users", 403);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: "User deleted successfully" };
  }
}