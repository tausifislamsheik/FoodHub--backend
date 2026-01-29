import bcrypt from "bcryptjs";
import prisma from "../../config/database";
import { AppError } from "../../utils/error";
import { Role } from "@prisma/client";

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: Role;
  shopName?: string;
  address?: string;
  description?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData) {
    const { email, password, name, phone, role, shopName, address, description } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with related customer/vendor
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role,
        ...(role === "CUSTOMER" && {
          customer: {
            create: {},
          },
        }),
        ...(role === "VENDOR" && {
          vendor: {
            create: {
              shopName: shopName!,
              address: address!,
              description,
            },
          },
        }),
      },
      include: {
        customer: true,
        vendor: true,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async login(data: LoginData) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customer: true,
        vendor: true,
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError("Your account has been deactivated", 403);
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: this.generateToken(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: session.token,
    };
  }

  async logout(token: string) {
    await prisma.session.delete({
      where: { token },
    });

    return { message: "Logged out successfully" };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
        vendor: {
          include: {
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
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, data: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true, vendor: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
      },
      include: {
        customer: true,
        vendor: true,
      },
    });

    // Update customer delivery address if provided
    if (user.customer && data.deliveryAddress) {
      await prisma.customer.update({
        where: { userId },
        data: { deliveryAddress: data.deliveryAddress },
      });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)
    );
  }
}