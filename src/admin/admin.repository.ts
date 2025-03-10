import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
// import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>
  ) {}

  async create(adminData: Partial<Admin>): Promise<Admin> {
    const newAdmin = this.adminRepository.create(adminData);
    return this.adminRepository.save(newAdmin);
  }

  async findAll(): Promise<Admin[]> {
    return this.adminRepository.find();
  }

  async findById(id: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { user_id: userId } });
  }

  async update(id: string, updateData: UpdateAdminDto): Promise<void> {
    await this.adminRepository.update(id, updateData);
  }

  async delete(id: string): Promise<{ affected?: number }> {
    return this.adminRepository.delete(id);
  }
}
