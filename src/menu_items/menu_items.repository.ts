import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './entities/menu_item.entity';

@Injectable()
export class MenuItemsRepository {
  constructor(
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>
  ) {}

  async create(data: Partial<MenuItem>): Promise<MenuItem> {
    const menuItem = this.menuItemRepository.create(data);
    return this.menuItemRepository.save(menuItem);
  }

  async findById(id: string): Promise<MenuItem> {
    return this.menuItemRepository.findOne({
      where: { id },
      relations: ['variants']
    });
  }

  async findOne(conditions: any): Promise<MenuItem> {
    return this.menuItemRepository.findOne({ where: conditions });
  }

  async findAll(): Promise<MenuItem[]> {
    return this.menuItemRepository.find({ relations: ['variants'] });
  }

  async update(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    await this.menuItemRepository
      .createQueryBuilder()
      .update(MenuItem)
      .set(data)
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.menuItemRepository.delete(id);
  }

  async save(menuItem: MenuItem): Promise<MenuItem> {
    return this.menuItemRepository.save(menuItem);
  }
}
