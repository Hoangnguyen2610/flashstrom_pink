import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DriverProgressStage } from './entities/driver_progress_stage.entity';
import { CreateDriverProgressStageDto } from './dto/create-driver-progress-stage.dto';
import { UpdateDriverProgressStageDto } from './dto/update-driver-progress-stage.dto';

@Injectable()
export class DriverProgressStagesRepository {
  constructor(
    @InjectRepository(DriverProgressStage)
    private repository: Repository<DriverProgressStage>,
    @InjectDataSource() private dataSource: DataSource
  ) {}

  async create(
    createDto: CreateDriverProgressStageDto
  ): Promise<DriverProgressStage> {
    return await this.dataSource.transaction(
      async transactionalEntityManager => {
        // First, check for any active stage (not completed) for this driver
        const existingActive = await transactionalEntityManager
          .createQueryBuilder(DriverProgressStage, 'dps')
          .where('dps.driver_id = :driverId', { driverId: createDto.driver_id })
          .andWhere('dps.current_state != :completeState', {
            completeState: 'delivery_complete'
          })
          .orderBy('dps.created_at', 'DESC')
          .setLock('pessimistic_write')
          .getOne();

        if (existingActive) {
          console.log('Found existing active stage:', existingActive.id);
          return existingActive;
        }

        // If no active stage exists, create a new one
        const stage = this.repository.create(createDto);

        try {
          const savedStage = await transactionalEntityManager.save(
            DriverProgressStage,
            stage
          );
          console.log('Created new stage:', savedStage.id);
          return savedStage;
        } catch (error) {
          console.error('Error creating stage:', error);
          // Double-check if a stage was created while we were trying to save
          const lastMinuteCheck = await this.findByDriverId(
            createDto.driver_id
          );
          if (lastMinuteCheck) {
            console.log('Found stage after save error:', lastMinuteCheck.id);
            return lastMinuteCheck;
          }
          throw error;
        }
      }
    );
  }

  async findAll(): Promise<DriverProgressStage[]> {
    return await this.repository.find();
  }

  async findById(id: string): Promise<DriverProgressStage> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByDriverId(driverId: string): Promise<DriverProgressStage> {
    return await this.repository
      .createQueryBuilder('dps')
      .where('dps.driver_id = :driverId', { driverId })
      .andWhere('dps.current_state != :completeState', {
        completeState: 'delivery_complete'
      })
      .orderBy('dps.created_at', 'DESC')
      .getOne();
  }

  async update(
    id: string,
    updateDto: UpdateDriverProgressStageDto
  ): Promise<DriverProgressStage> {
    await this.repository.update(id, {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return await this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async updateStages(id: string, stages: any[]): Promise<DriverProgressStage> {
    await this.repository.update(id, {
      stages,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return await this.findById(id);
  }
}
