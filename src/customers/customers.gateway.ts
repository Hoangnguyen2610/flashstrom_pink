import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@WebSocketGateway()
export class CustomersGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly customersService: CustomersService) {}

  @SubscribeMessage('updateCustomer')
  async handleUpdateCustomer(
    @MessageBody() updateCustomerDto: UpdateCustomerDto
  ) {
    const customer = await this.customersService.update(
      updateCustomerDto.id,
      updateCustomerDto
    );
    this.server.emit('customerUpdated', customer);
    return customer;
  }
}
