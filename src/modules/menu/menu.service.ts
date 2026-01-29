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
  async createMenu(vendorId: string, data: CreateMenuData) {
    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new AppError("Vendor not found", 404);
    }

    if (!vendor.isApproved) {
      throw new AppError("Vendor is not approved yet", 403);
    }

    const menu = await prisma.menu.create({
      data: {
        ...data,
        vendorId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
    });

    return menu;
  }

  async getMenusByVendor(vendorId: string, filters?: any) {
    const where: any = { vendorId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable === "true";
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        vendor: {
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
        vendor: {
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

  async updateMenu(id: string, vendorId: string, data: Partial<CreateMenuData>) {
    // Verify menu belongs to vendor
    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new AppError("Menu item not found", 404);
    }

    if (menu.vendorId !== vendorId) {
      throw new AppError("You can only update your own menu items", 403);
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data,
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
    });

    return updatedMenu;
  }

  async deleteMenu(id: string, vendorId: string) {
    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new AppError("Menu item not found", 404);
    }

    if (menu.vendorId !== vendorId) {
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
        vendor: {
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

    // Filter only approved vendors
    return menus.filter((menu) => menu.vendor.isApproved);
  }

  async getVendorMenu(userId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new AppError("Vendor not found", 404);
    }

    return this.getMenusByVendor(vendor.id);
  }
}