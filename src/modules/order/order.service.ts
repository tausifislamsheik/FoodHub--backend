import prisma from "../../config/database";
import { AppError } from "../../utils/error";
import { OrderStatus } from "@prisma/client";

interface OrderItem {
  menuId: string;
  quantity: number;
}

interface CreateOrderData {
  providerId: string;
  items: OrderItem[];
  deliveryAddress: string;
  specialNotes?: string;
}

export class OrderService {
  async createOrder(customerId: string, data: CreateOrderData) {
    const { providerId, items, deliveryAddress, specialNotes } = data;

    // Verify provider exists and is approved
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    if (!provider.isApproved) {
      throw new AppError("This provider is not yet approved", 403);
    }

    // Verify all menu items exist and belong to the provider
    const menuIds = items.map((item) => item.menuId);
    const menus = await prisma.menu.findMany({
      where: {
        id: { in: menuIds },
        providerId,
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
        providerId,
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
        provider: {
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
        provider: {
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

    return orders;
  }

  async getProviderOrders(providerId: string, status?: OrderStatus) {
    const where: any = { providerId };

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

  async updateOrderStatus(id: string, status: OrderStatus, userId: string, userRole: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        provider: true,
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Only provider can update order status
    if (userRole === "PROVIDER" && order.provider.userId !== userId) {
      throw new AppError("You can only update your own orders", 403);
    }

    // Validate status transitions
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      throw new AppError("Cannot update completed or cancelled orders", 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: {
          include: {
            menu: true,
          },
        },
        provider: {
          select: {
            shopName: true,
          },
        },
        customer: {
          select: {
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

    return updatedOrder;
  }

  async cancelOrder(id: string, customerId: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.customerId !== customerId) {
      throw new AppError("You can only cancel your own orders", 403);
    }

    // Can only cancel pending or confirmed orders
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      throw new AppError("Cannot cancel this order", 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        orderItems: {
          include: {
            menu: true,
          },
        },
        provider: {
          select: {
            shopName: true,
          },
        },
      },
    });

    return updatedOrder;
  }
}