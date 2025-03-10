import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
} from '@nestjs/common';
import { AdminService } from '../admin.service';
import { RestaurantsService } from '../../restaurants/restaurants.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
// import { CreateRestaurantDto } from '../../restaurants/dto/create-restaurant.dto';
import { UpdateRestaurantDto } from '../../restaurants/dto/update-restaurant.dto';
import { AdminRole } from 'src/utils/types/admin';
import { CreateRestaurantDto } from 'src/restaurants/dto/create-restaurant.dto';
import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';
import { CreateDriverDto } from 'src/drivers/dto/create-driver.dto';
import { CreateCustomerCareDto } from 'src/customer_cares/dto/create-customer_cares.dto';
import { CustomersService } from 'src/customers/customers.service';
import { DriversService } from 'src/drivers/drivers.service';
import { CustomerCareService } from 'src/customer_cares/customer_cares.service';

@Controller('companion-admin')
export class CompanionAdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly restaurantService: RestaurantsService,
    private readonly customerService: CustomersService,
    private readonly driverService: DriversService,
    private readonly customerCareService: CustomerCareService
  ) {}

  // Admin Management Endpoints
  @Post()
  createCompanionAdmin(@Body() createAdminDto: CreateAdminDto) {
    // Force the role to be COMPANION_ADMIN
    createAdminDto.role = AdminRole.COMPANION_ADMIN;
    return this.adminService.create(createAdminDto);
  }

  @Get()
  findAllCompanionAdmins() {
    // This should be modified in the service to filter only COMPANION_ADMIN roles
    return this.adminService.findAll();
  }

  // Restaurant Management Endpoints
  @Get('/restaurants')
  findAllRestaurants() {
    return this.restaurantService.findAll();
  }

  @Post('/restaurants')
  createRestaurant(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantService.create(createRestaurantDto);
  }

  @Get('/customers')
  findAllCustomers() {
    return this.customerService.findAll();
  }

  @Post('/customers')
  createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get('/drivers')
  findAllDrivers() {
    return this.driverService.findAll();
  }

  @Post('/drivers')
  createDriver(@Body() createDriverDto: CreateDriverDto) {
    return this.driverService.create(createDriverDto);
  }

  @Get('/customer-care')
  findAllCustomerCare() {
    return this.customerCareService.findAll();
  }

  @Post('/customer-care')
  createCustomerCare(@Body() createCustomerCareDto: CreateCustomerCareDto) {
    return this.customerCareService.create(createCustomerCareDto);
  }

  @Get('/:id')
  findOneCompanionAdmin(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Patch('/:id')
  updateCompanionAdmin(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto
  ) {
    // Ensure the role stays as COMPANION_ADMIN
    updateAdminDto.role = AdminRole.COMPANION_ADMIN;
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete('/:id')
  removeCompanionAdmin(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  @Get('restaurant/:id')
  findOneRestaurant(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }

  @Patch('restaurant/:id')
  updateRestaurant(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto
  ) {
    return this.restaurantService.update(id, updateRestaurantDto);
  }

  @Delete('restaurant/:id')
  removeRestaurant(@Param('id') id: string) {
    return this.restaurantService.remove(id);
  }
}
