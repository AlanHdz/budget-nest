import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'The category has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  create(@Body() createCategoryDto: CreateCategoryDto, @GetUser() user) {
    return this.categoryService.create(createCategoryDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get all categories by user' })
  @ApiResponse({ status: 200, description: 'Get all categories by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@GetUser() user) {
    return this.categoryService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get a category by user' })
  @ApiResponse({ status: 200, description: 'Get one category by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found category' })
  findOne(@Param('id') id: string, @GetUser() user) {
    return this.categoryService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update a category by user' })
  @ApiResponse({ status: 200, description: 'Update a category by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found category' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @GetUser() user) {
    return this.categoryService.update(id, updateCategoryDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete a category by user' })
  @ApiResponse({ status: 200, description: 'Delete a category by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found category' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  remove(@Param('id') id: string, @GetUser() user) {
    return this.categoryService.remove(id, user);
  }
}
