import { Injectable } from '@nestjs/common';
import { DriverProgressStagesRepository } from './driver_progress_stages.repository';
import {
  CreateDriverProgressStageDto,
  StageDto
} from './dto/create-driver-progress-stage.dto';
import { UpdateDriverProgressStageDto } from './dto/update-driver-progress-stage.dto';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { DriverProgressStage } from './entities/driver_progress_stage.entity';
import { DriversRepository } from 'src/drivers/drivers.repository';
import { OrdersRepository } from 'src/orders/orders.repository';
import { DataSource, EntityManager } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';

@Injectable()
export class DriverProgressStagesService {
  constructor(
    private readonly driverProgressStagesRepository: DriverProgressStagesRepository,
    private readonly driversRepository: DriversRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly dataSource: DataSource
  ) {}
  async create(
    createDto: CreateDriverProgressStageDto,
    transactionalEntityManager?: EntityManager
  ): Promise<ApiResponse<DriverProgressStage>> {
    const manager = transactionalEntityManager || this.dataSource.manager;

    try {
      // Tạo stages cho tất cả orders
      const initialStages = this.generateStagesForOrders(createDto.orders);

      // Tạo DPS
      const dps = manager.create(DriverProgressStage, {
        ...createDto,
        stages: initialStages,
        events: [],
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000)
      });

      const savedStage = await manager.save(DriverProgressStage, dps);
      console.log(`DPS saved in driverProgressStageService: ${savedStage.id}`);

      // Thêm quan hệ vào driver_progress_orders, kiểm tra trước khi chèn
      if (createDto.orders && createDto.orders.length > 0) {
        for (const order of createDto.orders) {
          const exists = await manager
            .createQueryBuilder()
            .select('1')
            .from('driver_progress_orders', 'dpo')
            .where(
              'dpo.driver_progress_id = :dpsId AND dpo.order_id = :orderId',
              {
                dpsId: savedStage.id,
                orderId: order.id
              }
            )
            .getRawOne();

          if (!exists) {
            await manager
              .createQueryBuilder()
              .insert()
              .into('driver_progress_orders')
              .values({
                driver_progress_id: savedStage.id,
                order_id: order.id
              })
              .execute();
            console.log(
              `Saved order relation for DPS: ${savedStage.id}, order: ${order.id}`
            );
          } else {
            console.log(
              `Relation already exists for DPS: ${savedStage.id}, order: ${order.id}`
            );
          }
        }
      }

      return createResponse(
        'OK',
        savedStage,
        'Driver progress stage created successfully'
      );
    } catch (err) {
      console.error('Error creating driver progress stage:', err);
      throw err; // Đảm bảo rollback
    }
  }

  async addOrderToExistingDPS(
    dpsId: string,
    order: Order,
    transactionalEntityManager: EntityManager
  ): Promise<ApiResponse<DriverProgressStage>> {
    try {
      // Lấy DPS hiện tại
      const dps = await transactionalEntityManager
        .getRepository(DriverProgressStage)
        .findOne({
          where: { id: dpsId },
          relations: ['orders']
        });
      if (!dps) {
        throw new Error('DPS not found');
      }

      // Thêm order mới vào danh sách orders nếu chưa tồn tại
      dps.orders = dps.orders || [];
      if (!dps.orders.some(o => o.id === order.id)) {
        dps.orders.push(order);
      }

      // Mở rộng stages cho order mới
      const newStages = this.generateStagesForOrders(
        [order],
        dps.orders.length
      );
      dps.stages = [...dps.stages, ...newStages];
      dps.updated_at = Math.floor(Date.now() / 1000);

      // Lưu DPS đã cập nhật
      const updatedDPS = await transactionalEntityManager.save(
        DriverProgressStage,
        dps
      );
      console.log(`Updated DPS with new order: ${updatedDPS.id}`);

      // Kiểm tra và thêm quan hệ vào driver_progress_orders
      const exists = await transactionalEntityManager
        .createQueryBuilder()
        .select('1')
        .from('driver_progress_orders', 'dpo')
        .where('dpo.driver_progress_id = :dpsId AND dpo.order_id = :orderId', {
          dpsId: updatedDPS.id,
          orderId: order.id
        })
        .getRawOne();

      if (!exists) {
        await transactionalEntityManager
          .createQueryBuilder()
          .insert()
          .into('driver_progress_orders')
          .values({
            driver_progress_id: updatedDPS.id,
            order_id: order.id
          })
          .execute();
        console.log(
          `Saved order relation for DPS: ${updatedDPS.id}, order: ${order.id}`
        );
      } else {
        console.log(
          `Relation already exists for DPS: ${updatedDPS.id}, order: ${order.id}`
        );
      }

      return createResponse('OK', updatedDPS, 'Order added to existing DPS');
    } catch (err) {
      console.error('Error adding order to DPS:', err);
      throw err; // Đảm bảo rollback transaction nếu lỗi
    }
  }

  private generateStagesForOrders(
    orders: Order[],
    startIndex: number = 1
  ): StageDto[] {
    const baseStates = [
      'driver_ready',
      'waiting_for_pickup',
      'restaurant_pickup',
      'en_route_to_customer',
      'delivery_complete'
    ];

    const stages: StageDto[] = [];
    orders.forEach((order, index) => {
      const orderIndex = startIndex + index;
      baseStates.forEach((state, stateIndex) => {
        stages.push({
          state: `${state}_order_${orderIndex}`,
          status: stateIndex === 0 && index === 0 ? 'in_progress' : 'pending',
          timestamp: Math.floor(Date.now() / 1000),
          duration: 0,
          details: null // Hoặc { location: null, ... } nếu muốn giữ cấu trúc đầy đủ
        });
      });
    });
    return stages;
  }

  async updateStage(
    stageId: string,
    updateData: UpdateDriverProgressStageDto,
    transactionalEntityManager?: EntityManager
  ): Promise<ApiResponse<DriverProgressStage>> {
    try {
      console.log('🔍 Updating stage:', stageId, 'with data:', updateData);

      const manager = transactionalEntityManager || this.dataSource.manager; // Sửa ở đây

      const existingStage = await manager
        .getRepository(DriverProgressStage)
        .findOne({ where: { id: stageId } });
      if (!existingStage) {
        return createResponse('NotFound', null, 'Progress stage not found');
      }

      // Only update the current_state and stages array
      const updatedStage = await manager
        .getRepository(DriverProgressStage)
        .save({
          ...existingStage,
          current_state: updateData.current_state,
          stages: updateData.stages,
          updated_at: Math.floor(Date.now() / 1000)
        });

      return createResponse(
        'OK',
        updatedStage,
        'Driver progress stage updated successfully'
      );
    } catch (err) {
      console.error('Error updating driver progress stage:', err);
      return createResponse(
        'ServerError',
        null,
        'Error updating driver progress stage'
      );
    }
  }

  async getActiveStageByDriver(
    driverId: string
  ): Promise<ApiResponse<DriverProgressStage>> {
    try {
      console.log('🔍 Finding active stage for driver:', driverId);

      // First try to find any existing stage for this driver
      const stage =
        await this.driverProgressStagesRepository.findByDriverId(driverId);

      console.log('🔍 Found stage:', stage);

      if (!stage) {
        console.log('❌ No stage found for driver');
        return createResponse('NotFound', null, 'No active stage found');
      }

      return createResponse('OK', stage, 'Active stage found');
    } catch (err) {
      console.error('Error finding active stage:', err);
      return createResponse('ServerError', null, 'Error finding active stage');
    }
  }

  async findAll(): Promise<ApiResponse<DriverProgressStage[]>> {
    try {
      const stages = await this.driverProgressStagesRepository.findAll();
      return createResponse(
        'OK',
        stages,
        'Driver progress stages retrieved successfully'
      );
    } catch (err) {
      console.error('Error fetching driver progress stages:', err);
      return createResponse(
        'ServerError',
        null,
        'Error fetching driver progress stages'
      );
    }
  }

  async findById(id: string): Promise<ApiResponse<DriverProgressStage>> {
    try {
      const stage = await this.driverProgressStagesRepository.findById(id);
      if (!stage) {
        return createResponse(
          'NotFound',
          null,
          'Driver progress stage not found'
        );
      }
      return createResponse('OK', stage, 'Driver progress stage found');
    } catch (err) {
      console.error('Error fetching driver progress stage:', err);
      return createResponse(
        'ServerError',
        null,
        'Error fetching driver progress stage'
      );
    }
  }

  async remove(id: string): Promise<ApiResponse<any>> {
    try {
      const result = await this.driverProgressStagesRepository.remove(id);
      if (!result) {
        return createResponse(
          'NotFound',
          null,
          'Driver progress stage not found'
        );
      }
      return createResponse(
        'OK',
        null,
        'Driver progress stage deleted successfully'
      );
    } catch (err) {
      console.error('Error deleting driver progress stage:', err);
      return createResponse(
        'ServerError',
        null,
        'Error deleting driver progress stage'
      );
    }
  }

  async updateStages(
    stageId: string,
    updatedStages: any[]
  ): Promise<ApiResponse<DriverProgressStage>> {
    try {
      const updatedStage =
        await this.driverProgressStagesRepository.updateStages(
          stageId,
          updatedStages
        );
      return createResponse('OK', updatedStage, 'Stages updated successfully');
    } catch (err) {
      console.error('Error updating stages:', err);
      return createResponse('ServerError', null, 'Error updating stages');
    }
  }
}
