import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teaware } from './entities/teaware.entity';
import { TeawareController } from './teaware.controller';
import { TeawareService } from './teaware.service';

@Module({
  imports: [TypeOrmModule.forFeature([Teaware])],
  controllers: [TeawareController],
  providers: [TeawareService],
  exports: [TeawareService],
})
export class TeawareModule {}
