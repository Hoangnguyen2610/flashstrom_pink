import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param
} from '@nestjs/common';
import { AddressBookService } from './address_book.service';
import { CreateAddressBookDto } from './dto/create-address_book.dto'; // Import the DTO
import { UpdateAddressBookDto } from './dto/update-address_book.dto';

@Controller('address_books')
export class AddressBookController {
  constructor(private readonly addressBookService: AddressBookService) {}

  @Post()
  async createAddressBook(
    @Body() createAddressBookDto: CreateAddressBookDto // Use the DTO here
  ) {
    return this.addressBookService.create(createAddressBookDto);
  }

  @Get()
  async getAllAddressBooks() {
    return this.addressBookService.findAll();
  }

  @Get(':id')
  async getAddressBookById(@Param('id') id: string) {
    return this.addressBookService.findOne(id);
  }

  // Update an address book entry by ID
  @Patch(':id')
  async updateAddressBook(
    @Param('id') addressBookId: string,
    @Body() updateAddressBookDto: UpdateAddressBookDto // Use Update DTO
  ) {
    console.log(
      'check controller oaram, addressBookId:',
      addressBookId,
      'dto: ',
      updateAddressBookDto
    );

    return this.addressBookService.update(addressBookId, updateAddressBookDto);
  }

  // Delete an address book entry by ID
  @Delete(':id')
  async deleteAddressBook(@Param('id') id: string) {
    return this.addressBookService.remove(id);
  }
}
