import { createResponse } from 'src/utils/createResponse';
import { CreateMenuItemDto } from './dto/create-menu_item.dto';
import { UpdateMenuItemDto } from './dto/update-menu_item.dto';
import { MenuItemVariantsService } from 'src/menu_item_variants/menu_item_variants.service';
import { ApiResponse } from 'src/utils/createResponse';
import { FoodCategoriesRepository } from 'src/food_categories/food_categories.repository';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { MenuItemsRepository } from './menu_items.repository';
import { MenuItem } from './entities/menu_item.entity';
import { MenuItemVariantDto } from 'src/menu_item_variants/dto/create-menu_item_variant.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MenuItemsService {
  constructor(
    private readonly menuItemRepository: MenuItemsRepository,
    private readonly restaurantRepository: RestaurantsRepository,
    private readonly foodCategoriesRepository: FoodCategoriesRepository,
    private readonly menuItemVariantsService: MenuItemVariantsService
  ) {}

  async create(
    createMenuItemDto: CreateMenuItemDto
  ): Promise<ApiResponse<any>> {
    try {
      const validationResult =
        await this.validateMenuItemData(createMenuItemDto);
      if (validationResult !== true) {
        return validationResult;
      }

      const existingMenuItem = await this.findExistingMenuItem(
        createMenuItemDto.name,
        createMenuItemDto.restaurant_id
      );

      if (existingMenuItem) {
        return await this.handleExistingMenuItem(
          existingMenuItem,
          createMenuItemDto
        );
      }

      return await this.createNewMenuItem(createMenuItemDto);
    } catch (error) {
      return this.handleError('Error creating menu item:', error);
    }
  }

  async findAll(): Promise<ApiResponse<MenuItem[]>> {
    try {
      const menuItems = await this.menuItemRepository.findAll();
      return createResponse('OK', menuItems, 'Fetched all menu items');
    } catch (error) {
      return this.handleError('Error fetching menu items:', error);
    }
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
    try {
      const menuItem = await this.menuItemRepository.findById(id);
      if (!menuItem) {
        return createResponse('NotFound', null, 'Menu Item not found');
      }

      const menuItemVariants = await this.menuItemVariantsService.findAll();
      const filteredVariants = menuItemVariants.data.filter(
        v => v.menu_id === id
      );

      return createResponse(
        'OK',
        { menuItem, variants: filteredVariants },
        'Fetched menu item successfully'
      );
    } catch (error) {
      return this.handleError('Error fetching menu item:', error);
    }
  }

  async update(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto
  ): Promise<ApiResponse<MenuItem>> {
    try {
      const existingMenuItem = await this.menuItemRepository.findById(id);
      if (!existingMenuItem) {
        return createResponse('NotFound', null, 'Menu Item not found');
      }

      const updatedMenuItem = await this.updateExistingMenuItem(
        existingMenuItem,
        updateMenuItemDto
      );
      return createResponse(
        'OK',
        updatedMenuItem,
        'Menu Item updated successfully'
      );
    } catch (error) {
      return this.handleError('Error updating menu item:', error);
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      await this.menuItemRepository.remove(id);
      return createResponse('OK', null, 'Menu Item deleted successfully');
    } catch (error) {
      return this.handleError('Error deleting menu item:', error);
    }
  }

  async updateEntityAvatar(
    uploadResult: { url: string; public_id: string },
    menuItemId: string
  ): Promise<ApiResponse<MenuItem>> {
    try {
      const menuItem = await this.menuItemRepository.update(menuItemId, {
        avatar: { url: uploadResult.url, key: uploadResult.public_id }
      });
      return this.handleMenuItemResponse(menuItem);
    } catch (error) {
      return this.handleError('Error updating menu item avatar:', error);
    }
  }

  // Private helper methods
  private async validateMenuItemData(
    createMenuItemDto: CreateMenuItemDto
  ): Promise<true | ApiResponse<null>> {
    const { restaurant_id, category } = createMenuItemDto;

    const restaurant = await this.restaurantRepository.findById(restaurant_id);
    if (!restaurant) {
      return createResponse('NotFound', null, 'Restaurant not found');
    }

    for (const categoryId of category) {
      const foodCategory =
        await this.foodCategoriesRepository.findById(categoryId);
      if (!foodCategory) {
        return createResponse(
          'NotFound',
          null,
          `Food Category with ID ${categoryId} not found`
        );
      }
    }

    return true;
  }

  private async findExistingMenuItem(
    name: string,
    restaurantId: string
  ): Promise<MenuItem | null> {
    return this.menuItemRepository.findOne({
      name,
      restaurant_id: restaurantId
    });
  }

  private async handleExistingMenuItem(
    existingMenuItem: MenuItem,
    createMenuItemDto: CreateMenuItemDto
  ): Promise<ApiResponse<any>> {
    const variants = await Promise.all(
      createMenuItemDto.variants.map(variant =>
        this.createVariant(variant, existingMenuItem)
      )
    );

    if (createMenuItemDto.discount) {
      await this.menuItemRepository.update(existingMenuItem.id, {
        discount: createMenuItemDto.discount
      });
    }

    const updatedMenuItem = await this.menuItemRepository.findById(
      existingMenuItem.id
    );
    return createResponse(
      'OK',
      { ...updatedMenuItem, variants },
      'Menu Item and variants updated successfully'
    );
  }

  private async createNewMenuItem(
    createMenuItemDto: CreateMenuItemDto
  ): Promise<ApiResponse<any>> {
    // First create the menu item without variants
    const menuItemData = {
      ...createMenuItemDto,
      variants: [], // Initialize empty array for variants
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    };

    const newMenuItem = await this.menuItemRepository.create(menuItemData);

    // Create variants separately if they exist
    let variants = [];
    if (createMenuItemDto.variants?.length) {
      variants = await Promise.all(
        createMenuItemDto.variants.map(variant =>
          this.createVariant(variant, newMenuItem)
        )
      );
    }

    return createResponse(
      'OK',
      {
        ...newMenuItem,
        variants
      },
      'Menu Item and variants created successfully'
    );
  }

  private async updateExistingMenuItem(
    menuItem: MenuItem,
    updateData: UpdateMenuItemDto
  ): Promise<MenuItem> {
    // Update the menu item without variants
    const { variants, ...updateFields } = updateData; // Destructure to remove variants

    // Update the menu item
    const updatedMenuItem = await this.menuItemRepository.update(menuItem.id, {
      ...updateFields,
      updated_at: Math.floor(Date.now() / 1000)
    });

    // Handle variants separately if they exist
    if (variants?.length) {
      await Promise.all(
        variants.map(
          async (variantData: {
            variant_id?: string;
            price?: number;
            description?: string;
          }) => {
            // Convert to MenuItemVariantDto format
            const variantDto: MenuItemVariantDto = {
              price: variantData.price || 0, // Provide default value
              description: variantData.description || '',
              variant: variantData.description || '' // Use description as variant if not provided
            };
            return this.createVariant(variantDto, updatedMenuItem);
          }
        )
      );
    }

    return updatedMenuItem;
  }

  private async createVariant(
    variantData: MenuItemVariantDto,
    menuItem: MenuItem
  ): Promise<any> {
    const newVariantData = {
      menu_id: menuItem.id,
      variant: variantData.variant || variantData.description || '',
      price: variantData.price || 0,
      description: variantData.description || '',
      avatar: menuItem.avatar || { key: '', url: '' },
      availability: true,
      default_restaurant_notes: [],
      discount_rate: 0
    };

    const result = await this.menuItemVariantsService.create(newVariantData);
    return result.data;
  }

  private handleMenuItemResponse(
    menuItem: MenuItem | null
  ): ApiResponse<MenuItem> {
    if (!menuItem) {
      return createResponse('NotFound', null, 'Menu item not found');
    }
    return createResponse('OK', menuItem, 'Menu item retrieved successfully');
  }

  private handleError(message: string, error: any): ApiResponse<null> {
    console.error(message, error);
    return createResponse(
      'ServerError',
      null,
      'An error occurred while processing your request'
    );
  }
}
