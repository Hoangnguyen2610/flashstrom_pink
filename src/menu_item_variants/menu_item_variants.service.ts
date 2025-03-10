import { Injectable } from '@nestjs/common';
import { MenuItemVariant } from './entities/menu_item_variant.entity';
import { createResponse } from 'src/utils/createResponse';
import { CreateMenuItemVariantDto } from './dto/create-menu_item_variant.dto';
import { UpdateMenuItemVariantDto } from './dto/update-menu_item_variant.dto';
import { MenuItemVariantsRepository } from './menu_item_variants.repository';
import { MenuItemsRepository } from 'src/menu_items/menu_items.repository';

@Injectable()
export class MenuItemVariantsService {
  constructor(
    private readonly menuItemVariantRepository: MenuItemVariantsRepository,
    private readonly menuItemRepository: MenuItemsRepository
  ) {}

  async create(
    createMenuItemVariantDto: CreateMenuItemVariantDto
  ): Promise<any> {
    const {
      menu_id,
      variant,
      description,
      avatar,
      availability,
      default_restaurant_notes,
      price,
      discount_rate
    } = createMenuItemVariantDto;

    // Check if the menu item variant already exists
    const existingVariant = await this.menuItemVariantRepository.findByDetails(
      price,
      description,
      menu_id
    );

    if (existingVariant) {
      return createResponse(
        'DuplicatedRecord',
        null,
        'Menu Item Variant with this variant already exists for this menu'
      );
    }

    // Create the new menu item variant
    const newVariant = await this.menuItemVariantRepository.create({
      menu_id,
      variant,
      description,
      avatar,
      availability,
      default_restaurant_notes,
      price,
      discount_rate,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    });

    // Get the menu item and update its variants array
    const menuItem = await this.menuItemRepository.findById(menu_id);
    if (menuItem) {
      menuItem.variants = [...(menuItem.variants || []), newVariant];
      await this.menuItemRepository.save(menuItem);
    }

    return createResponse(
      'OK',
      newVariant,
      'Menu Item Variant created and added to the menu item successfully'
    );
  }

  async update(
    id: string,
    updateMenuItemVariantDto: UpdateMenuItemVariantDto
  ): Promise<any> {
    const updatedVariant = await this.menuItemVariantRepository.update(id, {
      ...updateMenuItemVariantDto,
      updated_at: Math.floor(Date.now() / 1000)
    });

    if (!updatedVariant) {
      return createResponse('NotFound', null, 'Menu Item Variant not found');
    }

    return createResponse(
      'OK',
      updatedVariant,
      'Menu Item Variant updated successfully'
    );
  }

  async findAll(query: Record<string, any> = {}): Promise<any> {
    const menuItemVariants =
      await this.menuItemVariantRepository.findAll(query);
    return createResponse(
      'OK',
      menuItemVariants,
      'Fetched menu item variants successfully'
    );
  }

  async findOne(id: string): Promise<any> {
    const variant = await this.menuItemVariantRepository.findById(id);
    if (!variant) {
      return createResponse('NotFound', null, 'Menu Item Variant not found');
    }

    return createResponse(
      'OK',
      variant,
      'Fetched menu item variant successfully'
    );
  }

  async findOneByDetails(
    price: number,
    description: string,
    menu_id: string
  ): Promise<MenuItemVariant> {
    return this.menuItemVariantRepository.findByDetails(
      price,
      description,
      menu_id
    );
  }

  async remove(id: string): Promise<any> {
    const variant = await this.menuItemVariantRepository.findById(id);
    if (!variant) {
      return createResponse('NotFound', null, 'Menu Item Variant not found');
    }

    // Remove the variant from the menu item's variants array
    const menuItem = await this.menuItemRepository.findById(variant.menu_id);
    if (menuItem) {
      menuItem.variants = menuItem.variants.filter(v => v.id !== id);
      await this.menuItemRepository.save(menuItem);
    }

    // Delete the variant
    await this.menuItemVariantRepository.remove(id);

    return createResponse('OK', null, 'Menu Item Variant deleted successfully');
  }
}
