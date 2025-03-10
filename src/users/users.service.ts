import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from './users.repository';
import { Enum_UserType } from 'src/types/Payload';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    try {
      const existingUser = await this.userRepository.findByEmail(
        createUserDto.email
      );

      if (existingUser) {
        return createResponse('DuplicatedRecord', null, 'User already exists');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      const savedUser = await this.userRepository.create({
        ...createUserDto,
        id: `USR_${uuidv4()}`,
        password: hashedPassword,
        verification_code: null,
        user_type: createUserDto.user_type || [Enum_UserType.CUSTOMER]
      });

      return createResponse('OK', savedUser, 'User created successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error creating user');
    }
  }

  async findAll(): Promise<ApiResponse<User[]>> {
    try {
      const users = await this.userRepository.findAll();
      return createResponse('OK', users, 'Users retrieved successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error fetching users');
    }
  }

  async findById(id: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return createResponse('NotFound', null, 'User not found');
      }
      return createResponse('OK', user, 'User retrieved successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error fetching user');
    }
  }

  async findByCondition(condition: {
    [key: string]: any;
  }): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.findOne(condition);
      if (!user) {
        return createResponse('NotFound', null, 'User not found');
      }
      return createResponse('OK', user, 'User retrieved successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error fetching user');
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return createResponse('NotFound', null, 'User not found');
      }

      await this.userRepository.update(id, updateUserDto);
      const updatedUser = await this.userRepository.findById(id);
      return createResponse('OK', updatedUser, 'User updated successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error updating user');
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const result = await this.userRepository.delete(id);
      if (result.affected === 0) {
        return createResponse('NotFound', null, 'User not found');
      }
      return createResponse('OK', null, 'User deleted successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error deleting user');
    }
  }
}
