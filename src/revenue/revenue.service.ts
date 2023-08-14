import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RevenueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}
  // get total revenue by storeId
  async getRevenueByStoreId(storeId: string) {
    const redisRevenue = await this.redis.getValueAsString('totalRevenue');
    if (redisRevenue) return JSON.parse(redisRevenue);
    const revenue = await this.prisma.orders.findMany({
      where: {
        storeId,
        isPaid: true,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                price: true,
              },
            },
          },
        },
      },
    });
    const totalRevenue = revenue.reduce((total, order) => {
      const orderTotal = order.orderItems.reduce((orderSum, item) => {
        return orderSum + item.product.price.toNumber();
      }, 0);
      return total + orderTotal;
    }, 0);
    await this.redis.setValueAsString(
      'totalRevenue',
      JSON.stringify(totalRevenue),
    );
    return totalRevenue;
  }
  // get revenue by storeId and date
  async getRevenueByStoreIdAndDate(storeId: string, date: Date) {
    const dateObject = new Date(date);
    const startDate = new Date(dateObject);
    const endDate = new Date(dateObject);
    endDate.setHours(23, 59, 59, 999);
    try {
      if (
        endDate.toString() === 'Invalid Date' ||
        startDate.toString() === 'Invalid Date'
      )
        return;
      const revenue = await this.prisma.orders.findMany({
        where: {
          storeId,
          isPaid: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  price: true,
                },
              },
            },
          },
        },
      });
      const totalRevenue = revenue.reduce((total, order) => {
        const orderTotal = order.orderItems.reduce((orderSum, item) => {
          return orderSum + item.product.price.toNumber();
        }, 0);
        return total + orderTotal;
      }, 0);
      return totalRevenue;
    } catch (error) {
      console.log(error);
    }
  }
  // get revenue by storeId and current month
  async getCurrentMontRevenue(storeId: string) {
    // Calculate the start and end dates of the specified month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 to get the correct month

    const startDate = new Date(currentYear, currentMonth - 1, 1); // Months are 0-indexed
    const endDate = new Date(currentYear, currentMonth, 0);
    endDate.setHours(23, 59, 59, 999);
    const cachedRevenue = await this.redis.getValueAsString(
      'currentMonthRevenue',
    );
    if (cachedRevenue) return JSON.parse(cachedRevenue);
    const revenue = await this.prisma.orders.findMany({
      where: {
        storeId,
        isPaid: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                price: true,
              },
            },
          },
        },
      },
    });
    const totalRevenue = revenue.reduce((total, order) => {
      const orderTotal = order.orderItems.reduce((orderSum, item) => {
        return orderSum + item.product.price.toNumber();
      }, 0);
      return total + orderTotal;
    }, 0);
    await this.redis.setValueAsString(
      'currentMonthRevenue',
      JSON.stringify(totalRevenue),
    );

    return totalRevenue;
  }
  // get revenue by storeId and previous month
  async getPreviousMonthRevenue(storeId: string) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Get the first day of the previous month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    // Get the last day of the previous month
    const endDate = new Date(currentYear, currentMonth, 0);
    endDate.setHours(23, 59, 59, 999);

    const cachedRevenue = await this.redis.getValueAsString(
      'previousMonthRevenue',
    );
    if (cachedRevenue) return JSON.parse(cachedRevenue);

    const revenue = await this.prisma.orders.findMany({
      where: {
        storeId,
        isPaid: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                price: true,
              },
            },
          },
        },
      },
    });
    const totalRevenue = revenue.reduce((total, order) => {
      const orderTotal = order.orderItems.reduce((orderSum, item) => {
        return orderSum + item.product.price.toNumber();
      }, 0);
      return total + orderTotal;
    }, 0);
    await this.redis.setValueAsString(
      'previousMonthRevenue',
      JSON.stringify(totalRevenue),
    );

    return totalRevenue;
  }
}
