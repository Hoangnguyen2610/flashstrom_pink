// orders.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus, OrderTrackingInfo } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private repository: Repository<Order>
  ) {}

  async create(createDto: CreateOrderDto): Promise<Order> {
    // Fix: Ép kiểu status và tracking_info cho khớp
    const orderData = {
      ...createDto,
      status: createDto.status as OrderStatus,
      tracking_info: createDto.tracking_info as OrderTrackingInfo
    };
    const order = this.repository.create(orderData);
    return await this.repository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return await this.repository.find(); // Đã đúng, không cần sửa
  }

  async findById(id: string): Promise<Order> {
    const result = await this.repository.findOne({
      where: { id },
      relations: ['restaurantAddress', 'customerAddress']
    });
    return result;
  }

  async findOne(conditions: object): Promise<Order> {
    return await this.repository.findOne({ where: conditions });
  }

  async update(id: string, updateDto: UpdateOrderDto): Promise<Order> {
    // Fix: Ép kiểu status và tracking_info nếu có
    const updateData = {
      ...updateDto,
      status: updateDto.status ? (updateDto.status as OrderStatus) : undefined,
      tracking_info: updateDto.tracking_info
        ? (updateDto.tracking_info as OrderTrackingInfo)
        : undefined,
      updated_at: Math.floor(Date.now() / 1000)
    };
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async updateStatus(
    id: string,
    {
      status,
      tracking_info
    }: { status: OrderStatus; tracking_info: OrderTrackingInfo }
  ): Promise<Order> {
    await this.repository.update(id, {
      status,
      tracking_info,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return this.findById(id);
  }

  async updateTrackingInfo(
    id: string,
    tracking_info: OrderTrackingInfo
  ): Promise<Order> {
    // Fix: Bỏ OrderTrackingInfoType, dùng thẳng OrderTrackingInfo
    await this.repository.update(id, {
      tracking_info, // Không cần ép kiểu nữa, đã là OrderTrackingInfo
      updated_at: Math.floor(Date.now() / 1000)
    });
    return this.findById(id);
  }
}
