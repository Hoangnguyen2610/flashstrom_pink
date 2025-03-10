import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOneBy({ email });
  }

  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.repository.create(userData);
    return this.repository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, updateData: UpdateUserDto): Promise<void> {
    // Convert UpdateUserDto to the correct type expected by TypeORM
    const sanitizedData = {
      ...updateData,
      verification_code: updateData.verification_code
        ? parseInt(updateData.verification_code)
        : undefined
    } as Partial<User>;
    await this.repository.update(id, sanitizedData);
  }

  async delete(id: string): Promise<{ affected?: number }> {
    return this.repository.delete(id);
  }

  async findOne(conditions: any): Promise<User | null> {
    // If conditions has a where clause, use it directly
    if (conditions.where) {
      return await this.repository.findOne(conditions);
    }
    // Otherwise use findOneBy for direct conditions
    return await this.repository.findOneBy(conditions);
  }
}
