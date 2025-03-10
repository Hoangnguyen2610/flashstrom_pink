import { Injectable } from '@nestjs/common';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { createResponse } from 'src/utils/createResponse';
import { ApiResponse } from 'src/utils/createResponse';
import { v4 as uuidv4 } from 'uuid';
import { AdminRepository } from './admin.repository';
import { UsersService } from '../users/users.service';
import { RolePermissions } from 'src/utils/types/admin';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly usersService: UsersService
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<ApiResponse<Admin>> {
    try {
      const { user_id, role, permissions } = createAdminDto;

      // Validate permissions based on role
      const allowedPermissions = RolePermissions[role];
      const hasInvalidPermissions = permissions.some(
        permission => !allowedPermissions.includes(permission)
      );

      if (hasInvalidPermissions) {
        return createResponse(
          'Forbidden',
          null,
          'Invalid permissions for the given role'
        );
      }

      // Check if user exists
      const userResponse = await this.usersService.findByCondition({
        id: user_id as string
      });
      if (userResponse.EC === -2) {
        return createResponse('NotFound', null, 'User not found');
      }

      // Check if admin already exists for this user
      const existingAdmin = await this.adminRepository.findByUserId(user_id);
      if (existingAdmin) {
        return createResponse(
          'DuplicatedRecord',
          null,
          'Admin already exists for this user'
        );
      }

      const savedAdmin = await this.adminRepository.create({
        ...createAdminDto,
        id: `FF_ADMIN_${uuidv4()}`
      });

      return createResponse('OK', savedAdmin, 'Admin created successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error creating admin');
    }
  }

  async findAll(): Promise<ApiResponse<Admin[]>> {
    try {
      const admins = await this.adminRepository.findAll();
      return createResponse('OK', admins, 'Admins retrieved successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error fetching admins');
    }
  }

  async findOne(id: string): Promise<ApiResponse<Admin>> {
    try {
      const admin = await this.adminRepository.findById(id);
      if (!admin) {
        return createResponse('NotFound', null, 'Admin not found');
      }
      return createResponse('OK', admin, 'Admin retrieved successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error fetching admin');
    }
  }

  async update(
    id: string,
    updateAdminDto: UpdateAdminDto
  ): Promise<ApiResponse<Admin>> {
    try {
      const admin = await this.adminRepository.findById(id);
      if (!admin) {
        return createResponse('NotFound', null, 'Admin not found');
      }

      // Validate permissions if role or permissions are being updated
      if (updateAdminDto.role || updateAdminDto.permissions) {
        const role = updateAdminDto.role || admin.role;
        const newPermissions = updateAdminDto.permissions || admin.permissions;

        const allowedPermissions = RolePermissions[role];
        const hasInvalidPermissions = newPermissions.some(
          permission => !allowedPermissions.includes(permission)
        );

        if (hasInvalidPermissions) {
          return createResponse(
            'Forbidden',
            null,
            'Invalid permissions for the given role'
          );
        }
      }

      await this.adminRepository.update(id, updateAdminDto);
      const updatedAdmin = await this.adminRepository.findById(id);
      return createResponse('OK', updatedAdmin, 'Admin updated successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error updating admin');
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const result = await this.adminRepository.delete(id);
      if (result.affected === 0) {
        return createResponse('NotFound', null, 'Admin not found');
      }
      return createResponse('OK', null, 'Admin deleted successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Error deleting admin');
    }
  }
}
