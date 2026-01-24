import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminExperiencesController } from './admin-experiences.controller';
import { AdminExperiencesService } from './admin-experiences.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminExperiencesController],
  providers: [AdminExperiencesService],
})
export class AdminExperiencesModule {}


