import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { createResponse } from 'src/utils/createResponse';
import { BasePayload, Enum_UserType } from 'src/types/Payload';
import { CartItemsService } from 'src/cart_items/cart_items.service';
import { UserRepository } from 'src/users/users.repository';
import { FWalletsRepository } from 'src/fwallets/fwallets.repository';
import { RestaurantsRepository } from 'src/restaurants/restaurants.repository';
import { CustomersRepository } from 'src/customers/customers.repository';
import { DriversRepository } from 'src/drivers/drivers.repository';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CustomerCaresRepository } from 'src/customer_cares/customer_cares.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fWalletsRepository: FWalletsRepository,
    private readonly restaurantsRepository: RestaurantsRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly driverRepository: DriversRepository,
    private readonly customerCareRepository: CustomerCaresRepository,
    private readonly jwtService: JwtService,
    private readonly cartItemService: CartItemsService
  ) {}

  async register(userData: any, type: Enum_UserType): Promise<any> {
    const { email, password, phone } = userData;

    if (!this.validateRegistrationInput(email, password)) {
      return createResponse(
        'InvalidFormatInput',
        null,
        'Email & Password cannot be empty'
      );
    }

    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      return this.handleExistingUserRegistration(existingUser, userData, type);
    }

    return this.createNewUserRegistration(userData, type, phone);
  }

  async login(
    { email, password }: { email: string; password: string },
    type: Enum_UserType
  ): Promise<any> {
    if (!this.validateLoginInput(email, password)) {
      return createResponse(
        'MissingInput',
        null,
        'Email & Password cannot be empty'
      );
    }

    const user = await this.validateUserCredentials(email, password);
    if (!user) {
      return createResponse('Unauthorized', null, 'Invalid credentials');
    }

    const basePayload = this.createBasePayload(user);
    return this.handleUserTypeLogin(user, type, basePayload);
  }

  // Private helper methods
  private async validateRegistrationInput(
    email: string,
    password: string
  ): Promise<boolean> {
    return Boolean(email && password);
  }

  private async validateLoginInput(
    email: string,
    password: string
  ): Promise<boolean> {
    return Boolean(email && password);
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  private async validateUserCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    return user;
  }

  private createBasePayload(user: User): BasePayload {
    return {
      user_id: user.id,
      email: user.email,
      user_type: user.user_type,
      first_name: user.first_name,
      last_name: user.last_name,
      app_preferences: user.app_preferences
    };
  }

  private async handleUserTypeLogin(
    user: User,
    type: Enum_UserType,
    basePayload: BasePayload
  ) {
    const loginHandlers = {
      DRIVER: () => this.handleDriverLogin(user, basePayload),
      CUSTOMER: () => this.handleCustomerLogin(user, basePayload),
      F_WALLET: () => this.handleFWalletLogin(user, basePayload),
      RESTAURANT_OWNER: () =>
        this.handleRestaurantOwnerLogin(user, basePayload),
      CUSTOMER_CARE_REPRESENTATIVE: () =>
        this.handleCustomerCareLogin(user, basePayload)
    };

    const handler = loginHandlers[type];
    if (!handler) {
      return createResponse('Unauthorized', null, 'Invalid user type');
    }

    return handler();
  }

  // Login handlers for each user type
  private async handleDriverLogin(user: User, basePayload: BasePayload) {
    const userWithRole = await this.driverRepository.findOne({
      user_id: user.id
    });
    if (!userWithRole) {
      return createResponse('NotFound', null, 'Driver not found');
    }

    const fWalletData = await this.fWalletsRepository.findByUserId(user.id);
    console.log('check user id', fWalletData);

    if (!fWalletData) {
      return createResponse('NotFound', null, 'Driver not found');
    }

    const driverPayload = {
      ...basePayload,
      id: userWithRole.id,
      logged_in_as: Enum_UserType.DRIVER,
      user_id: userWithRole.user_id,
      first_name: userWithRole.first_name,
      last_name: userWithRole.last_name,
      driver_id: userWithRole.id,
      contact_email: userWithRole.contact_email,
      contact_phone: userWithRole.contact_phone,
      vehicle: userWithRole.vehicle,
      current_location: userWithRole.current_location,
      avatar: userWithRole.avatar,
      available_for_work: userWithRole.available_for_work,
      fWallet_id: fWalletData.id,
      fWallet_balance: fWalletData.balance
    };

    const accessToken = this.jwtService.sign(driverPayload);
    return createResponse(
      'OK',
      {
        access_token: accessToken,
        user_data: userWithRole
      },
      'Login successful'
    );
  }

  private async handleCustomerLogin(user: User, basePayload: BasePayload) {
    const userWithRole = await this.customersRepository.findByUserId(user.id);
    if (!userWithRole) {
      return createResponse('NotFound', null, 'Customer not found');
    }

    const cartItems = await this.cartItemService.findAll({
      customer_id: userWithRole.id
    });

    const customerPayload = {
      ...basePayload,
      id: userWithRole.id,
      logged_in_as: Enum_UserType.CUSTOMER,
      preferred_category: userWithRole.preferred_category,
      favorite_restaurants: userWithRole.favorite_restaurants,
      favorite_items: userWithRole.favorite_items,
      user_id: user.id,
      avatar: userWithRole?.avatar,
      support_tickets: userWithRole.support_tickets,
      address: userWithRole?.address,
      cart_items: cartItems.data
    };

    const accessToken = this.jwtService.sign(customerPayload);
    return createResponse(
      'OK',
      { access_token: accessToken },
      'Login successful'
    );
  }

  private async handleFWalletLogin(user: User, basePayload: BasePayload) {
    const userWithRole = await this.fWalletsRepository.findByUserId(user.id);
    if (!userWithRole) {
      return createResponse('NotFound', null, 'FWallet not found');
    }

    const fWalletPayload = {
      ...basePayload,
      id: userWithRole.id,
      logged_in_as: Enum_UserType.F_WALLET,
      user_id: userWithRole.user_id,
      balance: userWithRole.balance,
      fWallet_id: userWithRole.id
    };

    const accessToken = this.jwtService.sign(fWalletPayload);
    return createResponse(
      'OK',
      { access_token: accessToken },
      'Login successful'
    );
  }

  private async handleRestaurantOwnerLogin(
    user: User,
    basePayload: BasePayload
  ) {
    const userWithRole = await this.restaurantsRepository.findByOwnerId(
      user.id
    );
    if (!userWithRole) {
      return createResponse('NotFound', null, 'Restaurant owner not found');
    }

    const restaurantPayload = {
      ...basePayload,
      id: userWithRole.id,
      logged_in_as: Enum_UserType.RESTAURANT_OWNER,
      owner_id: userWithRole.owner_id,
      owner_name: userWithRole.owner_name,
      restaurant_id: userWithRole.id ?? userWithRole.id,
      address: userWithRole.address,
      restaurant_name: userWithRole.restaurant_name,
      contact_email: userWithRole.contact_email,
      contact_phone: userWithRole.contact_phone,
      created_at: userWithRole.created_at,
      updated_at: userWithRole.updated_at,
      avatar: userWithRole.avatar,
      images_gallery: userWithRole.images_gallery,
      status: userWithRole.status,
      promotions: userWithRole.promotions,
      ratings: userWithRole.ratings,
      specialize_in: userWithRole.specialize_in,
      opening_hours: userWithRole.opening_hours
    };

    const accessToken = this.jwtService.sign(restaurantPayload);
    return createResponse(
      'OK',
      {
        access_token: accessToken,
        user_data: userWithRole
      },
      'Login successful'
    );
  }

  private async handleCustomerCareLogin(user: User, basePayload: BasePayload) {
    console.log('cehck user', user);
    const userWithRole = await this.customerCareRepository.findByUserId(
      user.id
    );
    console.log('check suerwithrole', userWithRole);

    if (!userWithRole) {
      return createResponse(
        'NotFound',
        null,
        'Customer Care representative not found'
      );
    }
    console.log('check user with role', userWithRole, 'user', user);
    const customerCarePayload = {
      ...basePayload,
      id: userWithRole.id,
      logged_in_as: Enum_UserType.CUSTOMER_CARE_REPRESENTATIVE,
      user_id: userWithRole.user_id,
      first_name: userWithRole.first_name,
      last_name: userWithRole.last_name,
      contact_email: userWithRole.contact_email,
      contact_phone: userWithRole.contact_phone,
      assigned_tickets: userWithRole.assigned_tickets,
      avatar: userWithRole.avatar,
      available_for_work: userWithRole.available_for_work,
      is_assigned: userWithRole.is_assigned
    };

    const accessToken = this.jwtService.sign(customerCarePayload);
    return createResponse(
      'OK',
      {
        access_token: accessToken,
        user_data: userWithRole
      },
      'Login successful'
    );
  }

  // Registration handlers
  private async handleExistingUserRegistration(
    existingUser: User,
    userData: any,
    type: Enum_UserType
  ) {
    if (existingUser && Array.isArray(existingUser.user_type)) {
      // Ensure user_type is an array and convert to strings if needed
      const userTypes = existingUser.user_type.map(t => String(t));

      console.log('Checking user types:', {
        existingTypes: userTypes,
        typeToCheck: type,
        includes: userTypes.includes(String(type))
      });

      if (userTypes.includes(String(type))) {
        return createResponse(
          'DuplicatedRecord',
          null,
          `${type} with the same email already exists`
        );
      }
    }

    let newUserWithRole;
    let fWallet;

    switch (type) {
      case Enum_UserType.CUSTOMER:
        newUserWithRole = await this.customersRepository.create({
          ...userData,
          password: existingUser.password,
          user_id: existingUser.id
        });
        break;

      case Enum_UserType.DRIVER:
        // Check if user already has an FWallet
        fWallet = await this.fWalletsRepository.findByUserId(existingUser.id);

        if (!fWallet) {
          // Create FWallet if it doesn't exist
          fWallet = await this.fWalletsRepository.create({
            ...userData,
            password: existingUser.password,
            user_id: existingUser.id,
            balance: 0
          });

          // Add F_WALLET to user_type if not present
          if (!existingUser.user_type.includes(Enum_UserType.F_WALLET)) {
            existingUser.user_type.push(Enum_UserType.F_WALLET);
          }
        }

        newUserWithRole = await this.driverRepository.create({
          user_id: existingUser.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          contact_email: [
            { title: 'Primary', is_default: true, email: userData.email }
          ],
          contact_phone: [
            { title: 'Primary', is_default: true, number: userData.phone }
          ],
          available_for_work: false,
          is_on_delivery: false,
          active_points: 0,
          current_order_id: [],
          vehicle: {
            license_plate: '',
            model: '',
            color: ''
          },
          current_location: {
            lat: 0,
            lng: 0
          },
          rating: {
            average_rating: 0,
            review_count: 0
          }
        });
        break;

      case Enum_UserType.RESTAURANT_OWNER:
        if (!userData.address_id) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Address is required'
          );
        }
        if (!userData.owner_name) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Owner name is required'
          );
        }
        if (!userData.restaurant_name) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Restaurant name is required'
          );
        }
        if (!userData.contact_email) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Contact email is required'
          );
        }
        if (!userData.contact_phone) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Contact phone is required'
          );
        }

        // Check if user already has an FWallet
        fWallet = await this.fWalletsRepository.findByUserId(existingUser.id);

        if (!fWallet) {
          // Create FWallet if it doesn't exist
          fWallet = await this.fWalletsRepository.create({
            ...userData,
            password: existingUser.password,
            user_id: existingUser.id,
            balance: 0
          });

          // Add F_WALLET to user_type if not present
          if (!existingUser.user_type.includes(Enum_UserType.F_WALLET)) {
            existingUser.user_type.push(Enum_UserType.F_WALLET);
          }
        }

        newUserWithRole = await this.restaurantsRepository.create({
          ...userData,
          password: existingUser.password,
          owner_id: existingUser.id,
          status: {
            is_open: false,
            is_active: false,
            is_accepted_orders: false
          },
          opening_hours: {
            mon: { from: 8, to: 17 },
            tue: { from: 8, to: 17 },
            wed: { from: 8, to: 17 },
            thu: { from: 8, to: 17 },
            fri: { from: 8, to: 17 },
            sat: { from: 8, to: 17 },
            sun: { from: 8, to: 17 }
          }
        });
        break;

      case Enum_UserType.F_WALLET:
        newUserWithRole = await this.fWalletsRepository.create({
          ...userData,
          password: existingUser.password,
          user_id: existingUser.id,
          balance: 0
        });
        break;

      case Enum_UserType.CUSTOMER_CARE_REPRESENTATIVE:
        newUserWithRole = await this.customerCareRepository.create({
          user_id: existingUser.id as unknown as User,
          first_name: userData.first_name,
          last_name: userData.last_name,
          contact_email: [
            { title: 'Primary', is_default: true, email: userData.email }
          ],
          contact_phone: [
            { title: 'Primary', is_default: true, number: userData.phone }
          ],
          assigned_tickets: [],
          available_for_work: false,
          is_assigned: false,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
          last_login: Math.floor(Date.now() / 1000)
        });
        break;

      default:
        return createResponse(
          'Unauthorized',
          null,
          'Invalid user type provided'
        );
    }

    switch (type) {
      case Enum_UserType.CUSTOMER:
        await this.customersRepository.update(
          newUserWithRole.id,
          newUserWithRole
        );
        break;
      case Enum_UserType.DRIVER:
        await this.driverRepository.update(newUserWithRole.id, newUserWithRole);
        break;
      case Enum_UserType.RESTAURANT_OWNER:
        await this.restaurantsRepository.update(
          newUserWithRole.id,
          newUserWithRole
        );
        break;
      case Enum_UserType.F_WALLET:
        await this.fWalletsRepository.update(
          newUserWithRole.id,
          newUserWithRole
        );
        break;
    }

    if (!existingUser.user_type.includes(type)) {
      existingUser.user_type.push(type);
      await this.userRepository.update(existingUser.id, {
        user_type: existingUser.user_type
      });
    }

    const responseData = {
      id: existingUser.id,
      user_id: existingUser.id,
      email: existingUser.email,
      first_name: existingUser.first_name,
      last_name: existingUser.last_name,
      user_type: existingUser.user_type,
      data: newUserWithRole
    };

    // Add fWallet info to response if it was created
    if (fWallet && (type === 'DRIVER' || type === 'RESTAURANT_OWNER')) {
      responseData['fWallet'] = fWallet;
    }

    return createResponse(
      'OK',
      responseData,
      `${type} created successfully with existing user`
    );
  }

  private async createNewUserRegistration(
    userData: any,
    type: Enum_UserType,
    phone: string
  ) {
    const { email, password } = userData;

    // Basic validation for all users
    if (!this.validateRegistrationInput(email, password)) {
      return createResponse(
        'InvalidFormatInput',
        null,
        'Email & Password cannot be empty'
      );
    }

    // Type-specific validation before any creation
    switch (type) {
      case Enum_UserType.CUSTOMER:
        if (!userData.first_name || !userData.last_name) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'First name and last name are required'
          );
        }
        break;

      case Enum_UserType.DRIVER:
        if (!userData.first_name) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'First name is required'
          );
        }
        if (!userData.last_name) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Last name is required'
          );
        }
        if (!userData.contact_email) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Contact email is required'
          );
        }
        if (!userData.contact_phone) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Contact phone is required'
          );
        }
        break;

      case Enum_UserType.RESTAURANT_OWNER:
        const {
          contact_email,
          contact_phone,
          opening_hours,
          owner_name,
          restaurant_name,
          status
        } = userData;
        if (
          !contact_email ||
          !contact_phone ||
          !opening_hours ||
          !owner_name ||
          !restaurant_name ||
          !status
        ) {
          console.log('fall here', opening_hours);
          return createResponse(
            'MissingInput',
            null,
            'Missing required fields: contact_email, contact_phone, opening_hours, owner_name, restaurant_name, status'
          );
        }
        if (!userData.restaurant_name) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Restaurant name is required'
          );
        }
        if (!userData.owner_name) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Owner name is required'
          );
        }
        if (!userData.address_id) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'Address is required'
          );
        }
        break;

      case Enum_UserType.F_WALLET:
        if (!userData.first_name || !userData.last_name) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'First name and last name are required'
          );
        }
        break;

      case Enum_UserType.CUSTOMER_CARE_REPRESENTATIVE:
        if (!userData.first_name || !userData.last_name) {
          return createResponse(
            'InvalidFormatInput',
            null,
            'First name and last name are required'
          );
        }
        break;

      default:
        return createResponse(
          'Unauthorized',
          null,
          'Invalid user type provided'
        );
    }

    // If validation passes, proceed with user creation
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user using repository with a generated ID
    const newUser = await this.userRepository.create({
      ...userData,
      id: `USR_${uuidv4()}`,
      phone,
      password: hashedPassword,
      verification_code: Math.floor(Math.random() * 1000000),
      is_verified: false,
      user_type: [type]
    });
    await this.userRepository.update(newUser.id, {
      user_type: newUser.user_type
    });
    let newUserWithRole;
    let fWallet;

    switch (type) {
      case Enum_UserType.CUSTOMER:
        // Create FWallet for new drivers
        fWallet = await this.fWalletsRepository.create({
          ...userData,
          password: hashedPassword,
          user_id: newUser.id,
          balance: 0
        });

        // Add F_WALLET to user_type
        newUser.user_type.push(Enum_UserType.F_WALLET);
        await this.userRepository.update(newUser.id, {
          user_type: newUser.user_type
        });
        newUserWithRole = await this.customersRepository.create({
          ...userData,
          password: hashedPassword,
          user_id: newUser.id
        });
        break;

      case Enum_UserType.DRIVER:
        // Create FWallet for new drivers
        fWallet = await this.fWalletsRepository.create({
          ...userData,
          password: hashedPassword,
          user_id: newUser.id,
          balance: 0
        });

        // Add F_WALLET to user_type
        newUser.user_type.push(Enum_UserType.F_WALLET);
        await this.userRepository.update(newUser.id, {
          user_type: newUser.user_type
        });

        newUserWithRole = await this.driverRepository.create({
          user_id: newUser.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          contact_email: [
            { title: 'Primary', is_default: true, email: userData.email }
          ],
          contact_phone: [
            { title: 'Primary', is_default: true, number: userData.phone }
          ],
          available_for_work: false,
          is_on_delivery: false,
          active_points: 0,
          current_order_id: [],
          vehicle: {
            license_plate: '',
            model: '',
            color: ''
          },
          current_location: {
            lat: 0,
            lng: 0
          },
          rating: {
            average_rating: 0,
            review_count: 0
          }
        });
        break;

      case Enum_UserType.RESTAURANT_OWNER:
        // Create FWallet for new drivers
        fWallet = await this.fWalletsRepository.create({
          ...userData,
          password: hashedPassword,
          user_id: newUser.id,
          balance: 0
        });

        // Add F_WALLET to user_type
        newUser.user_type.push(Enum_UserType.F_WALLET);
        await this.userRepository.update(newUser.id, {
          user_type: newUser.user_type
        });
        newUserWithRole = await this.restaurantsRepository.create({
          ...userData,
          password: hashedPassword,
          user_id: newUser.id,
          owner_id: newUser.id
        });
        break;

      case Enum_UserType.F_WALLET:
        newUserWithRole = await this.fWalletsRepository.create({
          ...userData,
          password: hashedPassword,
          user_id: newUser.id,
          balance: 0
        });
        break;

      case Enum_UserType.CUSTOMER_CARE_REPRESENTATIVE:
        // Create FWallet for new drivers
        fWallet = await this.fWalletsRepository.create({
          ...userData,
          password: hashedPassword,
          user_id: newUser.id,
          balance: 0
        });

        // Add F_WALLET to user_type
        newUser.user_type.push(Enum_UserType.F_WALLET);
        await this.userRepository.update(newUser.id, {
          user_type: newUser.user_type
        });
        newUserWithRole = await this.customerCareRepository.create({
          user_id: newUser.id as unknown as User,
          first_name: userData.first_name,
          last_name: userData.last_name,
          contact_email: [
            { title: 'Primary', is_default: true, email: userData.email }
          ],
          contact_phone: [
            { title: 'Primary', is_default: true, number: userData.phone }
          ],
          assigned_tickets: [],
          available_for_work: false,
          is_assigned: false,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
          last_login: Math.floor(Date.now() / 1000)
        });
        break;

      default:
        return createResponse(
          'Unauthorized',
          null,
          'Invalid user type provided'
        );
    }

    const responseData = {
      id: newUser.id,
      user_id: newUser.id,
      phone,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      user_type: newUser.user_type,
      data: newUserWithRole
    };

    // Add fWallet info to response if it was created
    if (
      fWallet &&
      (type === Enum_UserType.DRIVER || type === Enum_UserType.RESTAURANT_OWNER)
    ) {
      responseData['fWallet'] = fWallet;
    }

    return createResponse(
      'OK',
      responseData,
      `${type} registered successfully`
    );
  }

  // Utility methods
  async validateUser(payload: any): Promise<User> {
    return this.userRepository.findById(payload.userId);
  }

  async hasRole(userId: string, role: Enum_UserType): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user?.user_type.includes(role) || false;
  }
}
