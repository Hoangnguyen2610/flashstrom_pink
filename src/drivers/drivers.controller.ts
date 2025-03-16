import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Patch,
  Delete
} from '@nestjs/common';
import { DriversService } from './drivers.service'; // Corrected to use DriversService
import { CreateDriverDto } from './dto/create-driver.dto'; // Corrected to use CreateDriverDto
import { UpdateDriverDto } from './dto/update-driver.dto'; // Corrected to use UpdateDriverDto

@Controller('drivers') // Updated route to 'drivers'
export class DriversController {
  constructor(private readonly driversService: DriversService) {} // Corrected service to DriversService

  @Post()
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto); // Corrected service method to use driversService
  }

  @Get()
  findAll() {
    console.log('co lot vao');

    return this.driversService.findAll(); // Corrected service method to use driversService
  }

  @Get(':id')
  findDriverById(@Param('id') id: string) {
    return this.driversService.findDriverById(id); // Corrected service method to use driversService
  }

  @Get(':field/:value')
  findOne(@Param('field') field: string, @Param('value') value: string) {
    return this.driversService.findOne({ [field]: value }); // Corrected service method to use driversService
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto // Corrected DTO to UpdateDriverDto
  ) {
    return this.driversService.update(id, updateDriverDto); // Corrected service method to use driversService
  }

  @Patch(':id/availability')
  setAvailability(@Param('id') id: string) {
    return this.driversService.setAvailability(id); // Call service with the id
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driversService.remove(id); // Corrected service method to use driversService
  }
}
