import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriverProgressStage } from './driver_progress_stages.schema';
import { CreateDriverProgressStageDto } from './dto/create-driver-progress-stage.dto';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { Order } from 'src/orders/orders.schema';
import { Driver } from 'src/drivers/drivers.schema';
import { UpdateDriverProgressStageDto } from './dto/update-driver-progress-stage.dto';

@Injectable()
export class DriverProgressStagesService {
  constructor(
    @InjectModel('DriverProgressStage')
    private readonly driverProgressStageModel: Model<DriverProgressStage>,
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Driver') private readonly driverModel: Model<Driver>
  ) {}

  async create(
    createDto: CreateDriverProgressStageDto
  ): Promise<ApiResponse<DriverProgressStage>> {
    try {
      // Initialize all 5 stages with their default states
      const initialStages = [
        'driver_ready',
        'waiting_for_pickup',
        'restaurant_pickup',
        'en_route_to_customer',
        'delivery_complete'
      ].map((state, index) => ({
        state,
        status: index === 0 ? 'in_progress' : 'pending',
        timestamp: new Date(),
        duration: 0,
        details: {
          location: null,
          estimated_time: null,
          actual_time: null,
          notes: null,
          tip: null,
          weather: null
        }
      }));
      console.log('wtf is this', {
        ...createDto,
        stages: initialStages
      });
      // Create new stage with the initialized stages
      const newStage = new this.driverProgressStageModel({
        ...createDto,
        stages: initialStages
      });

      const savedStage = await newStage.save();
      console.log('Created driver progress stage with stages:', savedStage);

      return createResponse(
        'OK',
        savedStage,
        'Driver progress stage created successfully'
      );
    } catch (err) {
      console.error('Error creating driver progress stage:', err);
      return createResponse(
        'ServerError',
        null,
        'Error creating driver progress stage'
      );
    }
  }

  async updateStage(
    stageId: string,
    updateData: UpdateDriverProgressStageDto
  ): Promise<ApiResponse<DriverProgressStage>> {
    try {
      console.log('🔍 Updating stage:', stageId, 'with data:', updateData);

      const stage = await this.driverProgressStageModel.findById(stageId);
      if (!stage) {
        return createResponse('NotFound', null, 'Progress stage not found');
      }

      // Check for maximum orders (3)
      if (updateData.order_ids && updateData.order_ids.length > 3) {
        return createResponse(
          'DRIVER_MAXIMUM_ORDER',
          null,
          'Driver cannot have more than 3 orders'
        );
      }

      // Handle adding new order_ids
      if (updateData.order_ids) {
        stage.order_ids = updateData.order_ids;
      }

      // Handle stages updates
      if (updateData.stages) {
        // Keep existing stages and append new ones
        const existingStages = stage.stages || [];
        const newStages = updateData.stages.map(newStage => ({
          ...newStage,
          details: {
            ...newStage.details,
            // Safely handle potentially undefined details/location
            location: newStage.details?.location
              ? {
                  lat: newStage.details.location.lat || null,
                  lng: newStage.details.location.lng || null
                }
              : null,
            estimated_time: newStage.details?.estimated_time || null,
            actual_time: newStage.details?.actual_time || null,
            notes: newStage.details?.notes || null,
            tip: newStage.details?.tip || null,
            weather: newStage.details?.weather || null
          }
        }));

        // Combine existing and new stages
        stage.stages = [...existingStages, ...newStages];

        console.log('Updated stages count:', stage.stages.length);
      }

      // Update current state if provided
      if (updateData.current_state) {
        stage.current_state = updateData.current_state;
      }

      const updatedStage = await stage.save();
      console.log('✅ Successfully updated stage:', updatedStage);

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
      const stage = await this.driverProgressStageModel
        .findOne({
          driver_id: driverId
        })
        .exec();

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
      const stages = await this.driverProgressStageModel.find().exec();
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
      const stage = await this.driverProgressStageModel.findById(id).exec();
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
      const result = await this.driverProgressStageModel
        .findByIdAndDelete(id)
        .exec();
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
      const stage = await this.driverProgressStageModel.findByIdAndUpdate(
        stageId,
        { stages: updatedStages },
        { new: true }
      );

      if (!stage) {
        return createResponse('NotFound', null, 'Progress stage not found');
      }

      return createResponse('OK', stage, 'Stages updated successfully');
    } catch (err) {
      console.error('Error updating stages:', err);
      return createResponse('ServerError', null, 'Error updating stages');
    }
  }
}
