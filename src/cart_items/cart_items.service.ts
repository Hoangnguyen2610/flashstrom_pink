import { Injectable } from '@nestjs/common';
import { CreateCartItemDto } from './dto/create-cart_item.dto';
import { UpdateCartItemDto } from './dto/update-cart_item.dto';
import { CartItem } from './entities/cart_item.entity';
import { createResponse } from 'src/utils/createResponse';
import { CartItemsRepository } from './cart_items.repository';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { CustomersRepository } from 'src/customers/customers.repository';
import { MenuItemsRepository } from 'src/menu_items/menu_items.repository';
import { MenuItemVariantsRepository } from 'src/menu_item_variants/menu_item_variants.repository';

@Injectable()
export class CartItemsService {
  constructor(
    private readonly cartItemsRepository: CartItemsRepository,
    private readonly restaurantRepository: RestaurantsRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly menuItemsRepository: MenuItemsRepository,
    private readonly menuItemVariantsRepository: MenuItemVariantsRepository
  ) {}

  async create(createCartItemDto: CreateCartItemDto): Promise<any> {
    try {
      const { variants, item_id, customer_id } = createCartItemDto;

      if (!item_id || !customer_id) {
        return createResponse(
          'MissingInput',
          null,
          'Item ID and Customer ID are required'
        );
      }

      // Validate menu item and customer
      const [menuItem, customer] = await Promise.all([
        this.menuItemsRepository.findById(item_id),
        this.customersRepository.findById(customer_id)
      ]);

      if (!menuItem || !customer) {
        return createResponse(
          'NotFound',
          null,
          'MenuItem or Customer not found'
        );
      }

      // Check existing cart item
      const existingCartItem = await this.cartItemsRepository.findOne({
        customer_id,
        item_id
      });

      if (existingCartItem) {
        // Update existing cart item
        const updatedVariants = await this.updateExistingCartItemVariants(
          existingCartItem,
          variants
        );

        const updated = await this.cartItemsRepository.update(
          existingCartItem.id,
          {
            variants: updatedVariants,
            updated_at: Math.floor(Date.now() / 1000),
            item_id: existingCartItem.item_id,
            customer_id: existingCartItem.customer_id,
            restaurant_id: existingCartItem.restaurant_id
          }
        );

        return createResponse('OK', updated, 'Cart item updated successfully');
      }

      // Create new cart item
      const populatedVariants = await this.populateVariants(variants);
      const newCartItem = await this.cartItemsRepository.create({
        ...createCartItemDto,
        variants: populatedVariants
      });

      return createResponse(
        'OK',
        newCartItem,
        'Cart item created successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Failed to create cart item');
    }
  }

  async update(id: string, updateCartItemDto: UpdateCartItemDto): Promise<any> {
    const { variants, item_id, customer_id, ...updateData } = updateCartItemDto;

    try {
      // Check if MenuItem exists
      if (item_id) {
        const menuItem = await this.menuItemsRepository.findById(item_id);
        if (!menuItem) {
          return createResponse(
            'NotFound',
            null,
            `MenuItem with ID ${item_id} not found`
          );
        }
      }

      // Check if Customer exists
      if (customer_id) {
        const customer = await this.customersRepository.findById(customer_id);
        if (!customer) {
          return createResponse(
            'NotFound',
            null,
            `Customer with ID ${customer_id} not found`
          );
        }
      }

      if (variants) {
        // Populate variants
        const populatedVariants = await Promise.all(
          variants.map(async variant => {
            const variantDetails =
              await this.menuItemVariantsRepository.findById(
                variant.variant_id
              );
            if (!variantDetails) {
              return createResponse(
                'NotFound',
                null,
                `Variant with ID ${variant.variant_id} not found`
              );
            }
            return {
              ...variant,
              variant_name: variantDetails.variant
            };
          })
        );
        (updateData as any).variants = populatedVariants;
      }
      console.log('check update data', updateData);

      // Update the cart item
      const existingCartItem = await this.cartItemsRepository.findById(id);
      const updatedCartItem = await this.cartItemsRepository.update(id, {
        ...updateData,
        updated_at: Math.floor(Date.now() / 1000),
        item_id: existingCartItem.item_id,
        customer_id: existingCartItem.customer_id,
        variants: existingCartItem.variants
      });

      if (!updatedCartItem) {
        return createResponse(
          'NotFound',
          null,
          `Cart item with ID ${id} not found`
        );
      }

      return createResponse(
        'OK',
        { variants, item_id, customer_id, ...updateData },
        'Cart item updated successfully'
      );
    } catch (error) {
      console.log('error', error);
      return createResponse('ServerError', null, 'Failed to update cart item');
    }
  }

  async findAll(query: Record<string, any> = {}): Promise<any> {
    // Use the query parameter in the find operation
    const cartItems = await this.cartItemsRepository.findAll(query);

    // Populate variant names for all cart items
    const populatedCartItems = await Promise.all(
      cartItems.map(async cartItem => {
        // Convert the cart item document to a plain object
        const cartItemObj = cartItem;

        // Map over the variants and populate their names
        const populatedVariants = await Promise.all(
          cartItemObj.variants.map(async variant => {
            const variantDetails =
              await this.menuItemVariantsRepository.findById(
                variant.variant_id
              );
            return {
              ...variant,
              variant_name: variantDetails ? variantDetails.variant : 'Unknown'
            };
          })
        );

        // Replace the variants with populated ones
        cartItemObj.variants = populatedVariants;

        return cartItemObj;
      })
    );

    // Transform the cart items to add the item_id as item
    const transformedCartItems = populatedCartItems.map(cartItem => {
      const { item_id, ...rest } = cartItem;
      return {
        ...rest,
        item: item_id // Adding item_id as item
      };
    });

    // Fetch restaurant details for each cart item and include them inside the item
    const finalResult = await Promise.all(
      transformedCartItems.map(async item => {
        // Fetch the item object using the item_id (which is the item reference)
        const menuItem = await this.menuItemsRepository.findById(item.item);

        if (!menuItem) {
          return createResponse('NotFound', null, 'Menu item not found');
        }

        const itemObj = menuItem as { restaurant_id: string };
        const restaurantDetails = await this.restaurantRepository.findById(
          itemObj.restaurant_id
        );

        return {
          ...item,
          item: {
            ...menuItem, // Now spread the full item object here
            restaurantDetails // Add restaurantDetails inside the item object
          }
        };
      })
    );

    return createResponse('OK', finalResult, 'Cart items fetched successfully');
  }

  // Get a cart item by ID
  async findById(id: string): Promise<any> {
    try {
      const cartItem = await this.cartItemsRepository.findById(id);

      if (!cartItem) {
        return createResponse('NotFound', null, 'Cart item not found');
      }

      return createResponse('OK', cartItem, 'Fetched cart item successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching the cart item'
      );
    }
  }

  async findOne(query: Record<string, any>): Promise<any> {
    try {
      const cartItem = await this.cartItemsRepository.findOne(query);

      if (!cartItem) {
        return createResponse('NotFound', null, 'Cart item not found');
      }

      return createResponse('OK', cartItem, 'Fetched cart item successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while fetching the cart item'
      );
    }
  }

  // Delete a cart item by ID
  async remove(id: string): Promise<any> {
    const deletedCartItem = await this.cartItemsRepository.remove(id);

    if (!deletedCartItem) {
      return createResponse('NotFound', null, 'Cart item not found');
    }

    try {
      return createResponse('OK', null, 'Cart item deleted successfully');
    } catch (error) {
      console.log('error', error);
      return createResponse(
        'ServerError',
        null,
        'An error occurred while deleting the cart item'
      );
    }
  }

  private async populateVariants(variants: any[]) {
    return Promise.all(
      variants.map(async variant => {
        const variantDetails = await this.menuItemVariantsRepository.findById(
          variant.variant_id
        );
        return {
          variant_id: variant.variant_id,
          variant_name: variantDetails.variant,
          variant_price_at_time_of_addition: variantDetails.price,
          quantity: variant.quantity
        };
      })
    );
  }

  private async updateExistingCartItemVariants(
    existingCartItem: CartItem,
    newVariants: any[]
  ) {
    const updatedVariants = [...existingCartItem.variants];

    for (const newVariant of newVariants) {
      const existingVariantIndex = updatedVariants.findIndex(
        v => v.variant_id === newVariant.variant_id
      );

      if (existingVariantIndex > -1) {
        updatedVariants[existingVariantIndex].quantity += newVariant.quantity;
      } else {
        const variantDetails = await this.menuItemVariantsRepository.findById(
          newVariant.variant_id
        );
        updatedVariants.push({
          variant_id: newVariant.variant_id,
          variant_name: variantDetails.variant,
          variant_price_at_time_of_addition: variantDetails.price,
          quantity: newVariant.quantity
        });
      }
    }

    return updatedVariants;
  }
}
