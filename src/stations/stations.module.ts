import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';

@Module({
  imports: [HttpModule],
  controllers: [StationsController],
  providers: [StationsService],
})
export class StationsModule {}
