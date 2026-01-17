import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { VerificationStatus } from '../../common/enums/verification-status.enum';
import { PartnerManagerRoleType } from '../../common/enums/partner-manager-role-type.enum';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Index({ unique: true })
  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({ type: 'text' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Tourist })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.Unverified,
  })
  verificationStatus!: VerificationStatus;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isSuspended!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  suspendedUntil!: Date | null;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  cityAssignments!: string[];

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  countryAssignments!: string[];

  @Column({ type: 'uuid', nullable: true })
  partnerId!: string | null;

  @Column({
    type: 'enum',
    enum: PartnerManagerRoleType,
    nullable: true,
  })
  managerRoleType!: PartnerManagerRoleType | null;
}


