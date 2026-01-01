# Modules

## Module Structure

Each feature module follows this structure:

```
src/modules/[feature]/
├── [feature].controller.ts    # HTTP endpoints
├── [feature].service.ts       # Business logic
├── [feature].module.ts        # NestJS module definition
├── dto/                       # Data Transfer Objects
│   └── [feature].dto.ts
├── guards/                    # (optional) Feature-specific guards
├── strategies/                # (optional) Auth strategies
└── index.ts                   # Public API exports
```

## Creating a New Module

### Step 1: Create the Module Files

```bash
# Using NestJS CLI (recommended)
nest generate module modules/products
nest generate controller modules/products
nest generate service modules/products
```

Or create manually:

```
src/modules/products/
├── products.controller.ts
├── products.service.ts
├── products.module.ts
├── dto/
│   └── product.dto.ts
└── index.ts
```

### Step 2: Define DTOs with Zod

```typescript
// dto/product.dto.ts
import { z } from "zod";
import { createZodDto } from "nestjs-zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
});

export class CreateProductDto extends createZodDto(createProductSchema) {}

export const updateProductSchema = createProductSchema.partial();
export class UpdateProductDto extends createZodDto(updateProductSchema) {}
```

### Step 3: Create the Service

```typescript
// products.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/core/database";
import { createPaginatedResult, PaginationDto } from "@/common/dto";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto, userId: string) {
    return this.prisma.product.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  async findAll(pagination: PaginationDto) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
        where: { deletedAt: null },
      }),
      this.prisma.product.count({ where: { deletedAt: null } }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    await this.findOne(id); // Verify exists

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id); // Verify exists

    // Soft delete
    return this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }
}
```

### Step 4: Create the Controller

```typescript
// products.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";
import { paginationSchema } from "@/common/dto";
import { CurrentUser } from "@/common/decorators";
import { Roles } from "@/common/decorators";
import { Role } from "@prisma/client";

@ApiTags("Products")
@ApiBearerAuth()
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Create a new product" })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: { id: string }) {
    return this.productsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all products with pagination" })
  findAll(@Query() query: Record<string, string>) {
    const pagination = paginationSchema.parse(query);
    return this.productsService.findAll(pagination);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(":id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Update product" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: { id: string }
  ) {
    return this.productsService.update(id, dto, user.id);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Delete product (soft delete)" })
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.productsService.remove(id, user.id);
  }
}
```

### Step 5: Wire Up the Module

```typescript
// products.module.ts
import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // Export if other modules need it
})
export class ProductsModule {}
```

### Step 6: Create Public API

```typescript
// index.ts
export * from "./products.module";
export * from "./products.service";
export * from "./dto/product.dto";
```

### Step 7: Register in AppModule

```typescript
// app.module.ts
import { ProductsModule } from "./modules/products";

@Module({
  imports: [
    // ... other imports
    ProductsModule,
  ],
})
export class AppModule {}
```

## Common Decorators

### @Public()

Mark route as public (no authentication required):

```typescript
import { Public } from '@/common/decorators';

@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

### @Roles()

Restrict route to specific roles:

```typescript
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Delete(':id')
remove(@Param('id') id: string) { }
```

### @CurrentUser()

Get current authenticated user:

```typescript
import { CurrentUser } from '@/common/decorators';

@Get('me')
getProfile(@CurrentUser() user: { id: string; email: string }) {
  return this.usersService.findOne(user.id);
}

// Get specific field
@Get('my-email')
getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

## Swagger Documentation

Always document endpoints:

```typescript
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("Products") // Group in Swagger UI
@ApiBearerAuth() // Show auth required
@Controller("products")
export class ProductsController {
  @Post()
  @ApiOperation({ summary: "Create a new product" })
  @ApiResponse({ status: 201, description: "Product created" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 409, description: "Product already exists" })
  create(@Body() dto: CreateProductDto) {}
}
```
