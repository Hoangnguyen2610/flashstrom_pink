import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Patch,
  Delete
} from '@nestjs/common';
import { FWalletService } from './fwallets.service'; // Service for FWallet operations
import { CreateFWalletDto } from './dto/create-fwallet.dto'; // DTO for creating FWallet
import { UpdateFwalletDto } from './dto/update-fwallet.dto'; // DTO for updating FWallet

@Controller('fwallets') // Route for FWallets
export class FWalletController {
  constructor(private readonly fWalletService: FWalletService) {} // Injecting the FWalletService

  // Endpoint to create a new FWallet
  @Post()
  create(@Body() createFWalletDto: CreateFWalletDto) {
    return this.fWalletService.create(createFWalletDto); // Use the create method in FWalletService
  }

  // Endpoint to get all FWallets
  @Get()
  findAll() {
    return this.fWalletService.findAll(); // Use the findAll method in FWalletService
  }

  @Get('history/:fwalletId')
  findHistoryTransaction(@Param('fwalletId') fwalletId: string) {
    return this.fWalletService.findHistoryTransaction(fwalletId);
  }
  @Get('search/:query')
  searchByQuery(@Param('query') query: string) {
    return this.fWalletService.findBySearchQuery(query);
  }

  // Endpoint to get a specific FWallet by ID
  @Get(':id')
  findFWalletById(@Param('id') id: string) {
    return this.fWalletService.findFWalletById(id); // Use the findFWalletById method in FWalletService
  }

  // Endpoint to find a specific FWallet by a dynamic field (e.g., user_id)
  @Get(':field/:value')
  findOne(@Param('field') field: string, @Param('value') value: string) {
    return this.fWalletService.findOne({ [field]: value }); // Dynamically find based on field and value
  }

  // Endpoint to update an existing FWallet
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFWalletDto: UpdateFwalletDto // DTO for updating FWallet
  ) {
    return this.fWalletService.update(id, updateFWalletDto); // Use the update method in FWalletService
  }

  // Endpoint to remove an FWallet by ID
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fWalletService.remove(id); // Use the remove method in FWalletService
  }
}
