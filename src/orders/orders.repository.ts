import { Injectable } from '@nestjs/common';
import { Repository, In, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus, OrderTrackingInfo } from './entities/order.entity';
import { Promotion } from 'src/promotions/entities/promotion.entity'; // Thêm import
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private repository: Repository<Order>,
    @InjectRepository(Promotion) // Thêm repo cho Promotion
    private promotionRepository: Repository<Promotion>
  ) {}

  async create(createDto: CreateOrderDto): Promise<Order> {
    // Xử lý promotions_applied nếu có
    let promotionsApplied: Promotion[] = [];
    if (createDto.promotions_applied?.length > 0) {
      promotionsApplied = await this.promotionRepository.find({
        where: {
          id: In(createDto.promotions_applied) // Query Promotion từ ID
        }
      });
    }

    // Tạo orderData với type đúng
    const orderData: DeepPartial<Order> = {
      ...createDto,
      status: createDto.status as OrderStatus,
      tracking_info: createDto.tracking_info as OrderTrackingInfo,
      promotions_applied: promotionsApplied // Gán Promotion[]
    };

    const order = this.repository.create(orderData);
    return await this.repository.save(order); // Trả về Order, không phải Order[]
  }

  async findAll(): Promise<Order[]> {
    return await this.repository.find();
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

  async update(id: string, updateDto: any): Promise<Order> {
    // Lấy order hiện tại để kiểm tra sự tồn tại
    const existingOrder = await this.findById(id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Lọc các trường đơn giản để cập nhật
    const updateData: Partial<Order> = {
      status: updateDto.status ? (updateDto.status as OrderStatus) : undefined,
      tracking_info: updateDto.tracking_info
        ? (updateDto.tracking_info as OrderTrackingInfo)
        : undefined,
      driver_id: updateDto.driver_id,
      distance: updateDto.distance,
      // driver_wage: updateDto.driver_wage,
      updated_at: Math.floor(Date.now() / 1000)
    };

    // Xóa các trường undefined để tránh ghi đè không mong muốn
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    // Cập nhật các trường đơn giản
    await this.repository
      .createQueryBuilder()
      .update(Order)
      .set(updateData)
      .where('id = :id', { id })
      .execute();

    // Nếu có promotions_applied trong updateDto, xử lý riêng
    if (updateDto.promotions_applied?.length > 0) {
      const promotionsApplied = await this.promotionRepository.find({
        where: {
          id: In(updateDto.promotions_applied)
        }
      });
      const order = await this.repository.findOne({
        where: { id },
        relations: ['promotions_applied']
      });
      order.promotions_applied = promotionsApplied;
      await this.repository.save(order);
    }

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
    await this.repository.update(id, {
      tracking_info,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return this.findById(id);
  }

  async updateDriverTips(id: string, driver_tips: number): Promise<Order> {
    await this.repository.update(id, {
      driver_tips,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return this.findById(id);
  }
}
