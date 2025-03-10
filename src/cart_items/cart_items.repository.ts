import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from './entities/cart_item.entity';
import { CreateCartItemDto } from './dto/create-cart_item.dto';
import { UpdateCartItemDto } from './dto/update-cart_item.dto';

@Injectable()
export class CartItemsRepository {
  constructor(
    @InjectRepository(CartItem)
    private repository: Repository<CartItem>
  ) {}

  async create(createDto: CreateCartItemDto): Promise<CartItem> {
    const cartItem = this.repository.create(createDto);
    return await this.repository.save(cartItem);
  }

  async findAll(query: Record<string, any> = {}): Promise<CartItem[]> {
    return await this.repository.find({ where: query });
  }

  async findById(id: string): Promise<CartItem> {
    return await this.repository.findOne({ where: { id } });
  }

  async findOne(query: Record<string, any>): Promise<CartItem> {
    return await this.repository.findOne({ where: query });
  }

  async update(id: string, updateDto: UpdateCartItemDto): Promise<CartItem> {
    await this.repository.update(id, {
      ...updateDto,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return await this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}
