import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StationsModule } from './stations/stations.module';

@Module({
  imports: [StationsModule, ConfigModule.forRoot()],
})
export class AppModule {}
