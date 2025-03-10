import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, OrderTrackingInfo } from './entities/order.entity';

type OrderTrackingInfoType =
  | 'ORDER_PLACED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private repository: Repository<Order>
  ) {}

  async create(createDto: CreateOrderDto): Promise<Order> {
    const order = this.repository.create(createDto);
    return await this.repository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return await this.repository.find();
  }

  async findById(id: string): Promise<Order> {
    const result = await this.repository.findOne({ where: { id } });
    return result;
  }

  async findOne(conditions: object): Promise<Order> {
    // Thêm method này
    return await this.repository.findOne({ where: conditions });
  }

  async update(id: string, updateDto: UpdateOrderDto): Promise<Order> {
    await this.repository.update(id, {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await this.repository.update(id, {
      status,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return this.findById(id);
  }

  async updateTrackingInfo(
    id: string,
    tracking_info: OrderTrackingInfo
  ): Promise<Order> {
    await this.repository.update(id, {
      tracking_info: tracking_info as OrderTrackingInfoType,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return this.findById(id);
  }
}
