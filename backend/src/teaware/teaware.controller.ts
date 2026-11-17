import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidatedUserId } from '../common/decorators/validated-user-id.decorator';
import { CreateTeawareDto, UpdateTeawareDto } from './dto/teaware.dto';
import { TeawareService } from './teaware.service';

@Controller('teaware')
export class TeawareController {
  constructor(private readonly teaware: TeawareService) {}

  @Get('image-data')
  imageData(@Query('url') url: string) { return this.teaware.imageData(url); }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@ValidatedUserId() userId: number) { return this.teaware.findAll(userId); }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@ValidatedUserId() userId: number, @Body() dto: CreateTeawareDto) { return this.teaware.create(userId, dto); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @ValidatedUserId() userId: number, @Body() dto: UpdateTeawareDto) { return this.teaware.update(id, userId, dto); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @ValidatedUserId() userId: number) { return this.teaware.remove(id, userId); }
}
