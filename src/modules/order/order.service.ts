import prisma from "../../config/database";
import { AppError } from "../../utils/error";
import { OrderStatus } from "@prisma/client";

interface OrderItem {
  menuId: string;
  quantity: number;
}

interface CreateOrderData {
  vendorId: string;
  items: OrderItem[];
  deliveryAddress: string;
  specialNotes?: string;
}

export class OrderService {
  async createOrder(customerId: string, data: CreateOrderData) {
    const { vendorId, items, deliveryAddress, specialNotes } = data;

    // Verify vendor exists and is approved
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new AppError("Vendor not found", 404);
    }

    if (!vendor.isApproved) {
      throw new AppError("This vendor is not yet approved", 403);
    }

    // Verify all menu items exist and belong to the vendor
    const menuIds = items.map((item) => item.menuId);
    const menus = await prisma.menu.findMany({
      where: {
        id: { in: menuIds },
        vendorId,
        isAvailable: true,
      },
    });

    if (menus.length !== items.length) {
      throw new AppError("Some menu items are not available", 400);
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = items.map((item) => {
      const menu = menus.find((m) => m.id === item.menuId)!;
      const itemTotal = menu.price * item.quantity;
      totalAmount += itemTotal;

      return {
        menuId: item.menuId,
        quantity: item.quantity,
        price: menu.price,
      };
    });

    // Create order with items
    const order = await prisma.order.create({
      data: {
        customerId,
        vendorId,
        totalAmount,
        deliveryAddress,
        specialNotes,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            menu: true,
          },
        },
        vendor: {
          select: {
            id: true,
            shopName: true,
            address: true,
          },
        },
        customer: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return order;
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            menu: true,
          },
        },
        vendor: {
          select: {
            id: true,
            shopName: true,
            address: true,
            user: {
              select: {
                phone: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    return order;
  }

  async getCustomerOrders(customerId: string) {
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        orderItems: {
          include: {
            menu: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
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

    return orders;
  }

  async getVendorOrders(vendorId: string, status?: OrderStatus) {
    const where: any = { vendorId };

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            menu: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders;
  }

  

  
}