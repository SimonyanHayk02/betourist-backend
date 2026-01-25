import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { PartnerExperiencesController } from './partner-experiences.controller';
import { PartnerExperiencesService } from './partner-experiences.service';

@Module({
  imports: [PrismaModule],
  controllers: [PartnerController, PartnerExperiencesController],
  providers: [PartnerService, PartnerExperiencesService],
  exports: [PartnerService],
})
export class PartnerModule {}
