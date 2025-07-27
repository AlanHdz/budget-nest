import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtGuard } from '../../src/auth/guards/auth.guard';
import { GetUser } from '../../src/auth/decorators/get-user.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() createCategoryDto: CreateCategoryDto, @GetUser() user) {
    return this.categoryService.create(createCategoryDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll(@GetUser() user) {
    return this.categoryService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string, @GetUser() user) {
    return this.categoryService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @GetUser() user) {
    return this.categoryService.update(id, updateCategoryDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @GetUser() user) {
    return this.categoryService.remove(id, user);
  }
}
