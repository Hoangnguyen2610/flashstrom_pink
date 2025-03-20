import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Inject,
  UploadedFiles
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { memoryStorage } from 'multer';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { DriversService } from 'src/drivers/drivers.service';
import { CustomersService } from 'src/customers/customers.service';
import { Enum_AvatarType } from 'src/types/Payload';
import { createResponse } from 'src/utils/createResponse'; // Import createResponse
import { MenuItemsService } from 'src/menu_items/menu_items.service';

@Controller('upload')
export class UploadController {
  constructor(
    @Inject(RestaurantsService)
    private readonly restaurantService: RestaurantsService,
    private readonly uploadService: UploadService,
    private readonly driverService: DriversService,
    private readonly customerService: CustomersService,
    private readonly menuItemService: MenuItemsService
  ) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage()
    })
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body('userType') userType: Enum_AvatarType,
    @Body('entityId') entityId: string
  ) {
    if (!file) {
      return createResponse('MissingInput', null, 'No file uploaded');
    }
    console.log('cehck go this');
    console.log('cehck faile', file);

    // Upload the image to Cloudinary
    const uploadResult = await this.uploadService.uploadImage(file);

    // Dynamically handle which service to call based on the userType and entityId
    let updatedEntity;
    switch (userType) {
      case Enum_AvatarType.RESTAURANT_OWNER:
        updatedEntity = await this.restaurantService.updateEntityAvatar(
          uploadResult,
          entityId
        );
        break;
      case Enum_AvatarType.DRIVER:
        updatedEntity = await this.driverService.updateEntityAvatar(
          uploadResult,
          entityId
        );
        break;
      case Enum_AvatarType.CUSTOMER:
        updatedEntity = await this.customerService.updateEntityAvatar(
          uploadResult,
          entityId
        );
        break;
      case Enum_AvatarType.MENU_ITEM:
        updatedEntity = await this.menuItemService.updateEntityAvatar(
          uploadResult,
          entityId
        );
        break;
      default:
        return createResponse('InvalidFormatInput', null, 'Invalid user type');
    }

    return createResponse('OK', updatedEntity, 'Avatar uploaded successfully');
  }

  @Post('galleries')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage()
    })
  )
  async uploadGalleries(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('userType') userType: Enum_AvatarType,
    @Body('entityId') entityId: string
  ) {
    if (!files || files.length === 0) {
      return createResponse('MissingInput', null, 'No files uploaded');
    }

    try {
      const uploadPromises = files.map(file =>
        this.uploadService.uploadImage(file)
      );
      const uploadResults = await Promise.all(uploadPromises);

      const formattedResults = uploadResults.map(result => ({
        key: result.public_id,
        url: result.url
      }));

      let updatedEntity;
      switch (userType) {
        case Enum_AvatarType.RESTAURANT_OWNER:
          updatedEntity = await this.restaurantService.updateImageGalleries(
            // Sửa tên
            formattedResults,
            entityId
          );
          break;
        case Enum_AvatarType.DRIVER:
          updatedEntity = await this.driverService.updateVehicleImages(
            formattedResults,
            entityId
          );
          break;
        default:
          return createResponse(
            'InvalidFormatInput',
            null,
            'Invalid user type'
          );
      }

      if (
        updatedEntity &&
        'status' in updatedEntity &&
        updatedEntity.status === 'NotFound'
      ) {
        return updatedEntity;
      }

      return createResponse(
        'OK',
        updatedEntity,
        'Galleries uploaded successfully'
      );
    } catch (error) {
      console.error('Error uploading galleries:', error);
      return createResponse('ServerError', null, 'Failed to upload galleries');
    }
  }

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage()
    })
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return createResponse('MissingInput', null, 'No file uploaded');
    }

    // Upload the image to Cloudinary (no type restriction)
    const uploadResult = await this.uploadService.uploadImage(file);
    return createResponse('OK', uploadResult, 'Image uploaded successfully');
  }
}
