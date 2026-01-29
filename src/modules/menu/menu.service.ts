import prisma from "../../config/database";
import { AppError } from "../../utils/error";

interface CreateMenuData {
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable?: boolean;
}

export class MenuService {
  async createMenu(providerId: string, data: CreateMenuData) {
    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    if (!provider.isApproved) {
      throw new AppError("Provider is not approved yet", 403);
    }

    const menu = await prisma.menu.create({
      data: {
        ...data,
        providerId,
      },
      include: {
        provider: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
    });

    return menu;
  }

  async getMenusByProvider(providerId: string, filters?: any) {
    const where: any = { providerId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable === "true";
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            shopName: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return menus;
  }

  async getMenuById(id: string) {
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            shopName: true,
            address: true,
            description: true,
          },
        },
      },
    });

    if (!menu) {
      throw new AppError("Menu item not found", 404);
    }

    return menu;
  }

  async updateMenu(id: string, providerId: string, data: Partial<CreateMenuData>) {
    // Verify menu belongs to provider
    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new AppError("Menu item not found", 404);
    }

    if (menu.providerId !== providerId) {
      throw new AppError("You can only update your own menu items", 403);
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data,
      include: {
        provider: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
    });

    return updatedMenu;
  }

  async deleteMenu(id: string, providerId: string) {
    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new AppError("Menu item not found", 404);
    }

    if (menu.providerId !== providerId) {
      throw new AppError("You can only delete your own menu items", 403);
    }

    await prisma.menu.delete({
      where: { id },
    });

    return { message: "Menu item deleted successfully" };
  }

  async getAllMenus(filters?: any) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable === "true";
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            shopName: true,
            address: true,
            isApproved: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter only approved providers
    return menus.filter((menu) => menu.provider.isApproved);
  }

  async getProviderMenu(userId: string) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    return this.getMenusByProvider(provider.id);
  }
}