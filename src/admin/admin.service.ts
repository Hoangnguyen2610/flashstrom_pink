import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin } from './admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { createResponse } from 'src/utils/createResponse';
import { User } from 'src/user/user.schema';
import {
  AdminRole,
  RolePermissions,
  AdminPermission,
} from 'src/utils/types/admin';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    const { user_id, role, permissions } = createAdminDto;

    // Validate permissions based on role
    const allowedPermissions = RolePermissions[role];
    const hasInvalidPermissions = permissions.some(
      (permission) => !allowedPermissions.includes(permission),
    );

    if (hasInvalidPermissions) {
      return createResponse(
        'Forbidden',
        null,
        'Invalid permissions for the given role',
      );
    }

    // Check if user exists
    const user = await this.userModel.findById(user_id).exec();
    if (!user) {
      return createResponse('NotFound', null, 'User not found');
    }

    // Check if admin already exists for this user
    const existingAdmin = await this.adminModel.findOne({ user_id }).exec();
    if (existingAdmin) {
      return createResponse(
        'DuplicatedRecord',
        null,
        'Admin already exists for this user',
      );
    }

    const newAdmin = new this.adminModel({
      ...createAdminDto,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    });

    await newAdmin.save();
    return createResponse('OK', newAdmin, 'Admin created successfully');
  }

  async findAll() {
    const admins = await this.adminModel
      .find()
      .populate('user_id', '-password')
      .exec();
    return createResponse('OK', admins, 'Admins fetched successfully');
  }

  async findOne(id: string) {
    const admin = await this.adminModel
      .findById(id)
      .populate('user_id', '-password')
      .exec();
    if (!admin) {
      return createResponse('NotFound', null, 'Admin not found');
    }
    return createResponse('OK', admin, 'Admin fetched successfully');
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminModel.findById(id).exec();
    if (!admin) {
      return createResponse('NotFound', null, 'Admin not found');
    }

    // If role or permissions are being updated, validate permissions
    if (updateAdminDto.role || updateAdminDto.permissions) {
      const role = updateAdminDto.role || admin.role;
      const newPermissions = updateAdminDto.permissions || admin.permissions;

      const allowedPermissions = RolePermissions[role];
      const hasInvalidPermissions = newPermissions.some(
        (permission) => !allowedPermissions.includes(permission as AdminPermission),
      );

      if (hasInvalidPermissions) {
        return createResponse(
          'Forbidden',
          null,
          'Invalid permissions for the given role',
        );
      }
    }

    const updatedAdmin = await this.adminModel
      .findByIdAndUpdate(
        id,
        { ...updateAdminDto, updated_at: Math.floor(Date.now() / 1000) },
        { new: true },
      )
      .exec();

    return createResponse('OK', updatedAdmin, 'Admin updated successfully');
  }

  async remove(id: string) {
    const admin = await this.adminModel.findById(id).exec();
    if (!admin) {
      return createResponse('NotFound', null, 'Admin not found');
    }

    await this.adminModel.findByIdAndDelete(id).exec();
    return createResponse('OK', null, 'Admin deleted successfully');
  }
}


