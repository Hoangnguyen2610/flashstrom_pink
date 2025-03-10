import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversRepository {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    // Create a new Driver instance
    const driver = new Driver();

    // Set the initial values
    Object.assign(driver, {
      ...createDriverDto,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    });

    // Save and return the new driver
    return await this.driverRepository.save(driver);
  }

  async findAll(): Promise<Driver[]> {
    return await this.driverRepository.find({
      relations: ['user'] // Include related user data if needed
    });
  }

  async findById(id: string): Promise<Driver> {
    return await this.driverRepository.findOne({
      where: { id },
      relations: ['user']
    });
  }

  async findByUserId(userId: string): Promise<Driver> {
    return await this.driverRepository.findOne({
      where: { user_id: userId },
      relations: ['user']
    });
  }

  async findOne(conditions: FindOptionsWhere<Driver>): Promise<Driver> {
    return await this.driverRepository.findOne({
      where: conditions,
      relations: ['user']
    });
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findById(id);
    if (!driver) {
      return null;
    }

    // Update the driver instance
    Object.assign(driver, {
      ...updateDriverDto,
      updated_at: Math.floor(Date.now() / 1000)
    });

    // Save and return the updated driver
    return await this.driverRepository.save(driver);
  }

  async save(driver: Driver): Promise<Driver> {
    return await this.driverRepository.save(driver);
  }

  async remove(id: string): Promise<Driver> {
    const driver = await this.findById(id);
    if (!driver) {
      return null;
    }
    return await this.driverRepository.remove(driver);
  }

  // Helper method for updating specific fields
  async updateFields(id: string, fields: Partial<Driver>): Promise<Driver> {
    const driver = await this.findById(id);
    if (!driver) {
      return null;
    }

    // Update only the specified fields
    Object.assign(driver, {
      ...fields,
      updated_at: Math.floor(Date.now() / 1000)
    });

    return await this.driverRepository.save(driver);
  }
}
