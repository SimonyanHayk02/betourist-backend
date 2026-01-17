import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async createTouristUser(input: {
    email?: string;
    phone?: string;
    passwordHash: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: input.email ?? null,
      phone: input.phone ?? null,
      passwordHash: input.passwordHash,
      refreshTokenHash: null,
      role: UserRole.Tourist,
    });
    return await this.usersRepository.save(user);
  }

  async setRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    await this.usersRepository.update({ id: userId }, { refreshTokenHash });
  }
}


