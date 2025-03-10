// src/transactions/dto/create-transaction.dto.ts
import { IsString, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  user_id: string; // Reference to the User's ID (who performed the transaction)

  @IsString()
  @IsNotEmpty()
  fwallet_id: string; // Reference to the FWallet involved

  @IsEnum(['DEPOSIT', 'WITHDRAW', 'PURCHASE', 'REFUND'])
  @IsNotEmpty()
  transaction_type: 'DEPOSIT' | 'WITHDRAW' | 'PURCHASE' | 'REFUND'; // Type of transaction

  @IsNumber()
  @IsNotEmpty()
  amount: number; // Amount involved in the transaction

  @IsNumber()
  @IsNotEmpty()
  balance_after: number; // Wallet balance after the transaction

  @IsEnum(['PENDING', 'CANCELLED', 'FAILED', 'COMPLETED'])
  status: 'PENDING' | 'CANCELLED' | 'FAILED' | 'COMPLETED'; // Status of the transaction

  @IsEnum(['MOMO', 'FWALLET'])
  @IsNotEmpty()
  source: 'MOMO' | 'FWALLET'; // Source of transaction (MOMO or FWALLET)

  @IsString()
  @IsNotEmpty()
  destination: string; // Can be `fwallet.id` or `users.id` depending on the transaction

  @IsEnum(['FWALLET', 'TEMPORARY_WALLET_BALANCE'])
  @IsNotEmpty()
  destination_type: 'FWALLET' | 'TEMPORARY_WALLET_BALANCE';
}
