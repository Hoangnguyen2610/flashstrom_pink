import { Entity, Column, PrimaryColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('address_books')
export class AddressBook {
  @PrimaryColumn()
  id: string;

  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  nationality: string;

  @Column({ default: false })
  is_default: boolean;

  @Column({ name: 'created_at' })
  created_at: number;

  @Column({ name: 'updated_at' })
  updated_at: number;

  @Column()
  postal_code: number;

  @Column('jsonb')
  location: {
    lng: number;
    lat: number;
  };

  @Column()
  title: string;

  @BeforeInsert()
  generateId() {
    this.id = `FF_AB_${uuidv4()}`;
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
