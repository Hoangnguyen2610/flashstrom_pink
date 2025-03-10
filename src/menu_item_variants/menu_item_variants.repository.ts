import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItemVariant } from './entities/menu_item_variant.entity';

@Injectable()
export class MenuItemVariantsRepository {
  constructor(
    @InjectRepository(MenuItemVariant)
    private menuItemVariantRepository: Repository<MenuItemVariant>
  ) {}

  async create(data: Partial<MenuItemVariant>): Promise<MenuItemVariant> {
    const variant = this.menuItemVariantRepository.create(data);
    return this.menuItemVariantRepository.save(variant);
  }

  async findById(id: string): Promise<MenuItemVariant> {
    return this.menuItemVariantRepository.findOne({
      where: { id },
      relations: ['menu_item']
    });
  }

  async findByDetails(
    price: number,
    description: string,
    menu_id: string
  ): Promise<MenuItemVariant> {
    return this.menuItemVariantRepository.findOne({
      where: { price, description, menu_id }
    });
  }

  async findAll(conditions?: any): Promise<MenuItemVariant[]> {
    return this.menuItemVariantRepository.find({
      where: conditions,
      relations: ['menu_item']
    });
  }

  async update(
    id: string,
    data: Partial<MenuItemVariant>
  ): Promise<MenuItemVariant> {
    await this.menuItemVariantRepository.update(id, {
      ...data,
      updated_at: Math.floor(Date.now() / 1000)
    });
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.menuItemVariantRepository.delete(id);
  }
}
