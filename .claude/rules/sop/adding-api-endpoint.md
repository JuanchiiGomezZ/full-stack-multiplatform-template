# SOP: Adding an API Endpoint

<!-- AUTO-GENERATED: START -->

## Overview

Step-by-step guide for adding a new REST API endpoint to the backend, following the patterns established in the `users` module.

**Canonical example:** `backend/src/modules/users/`

## Steps

### 1. Create Module Structure

```bash
cd backend/src/modules

# Create new module directory
mkdir products
cd products

# Create files
touch products.controller.ts
touch products.service.ts
touch products.module.ts
mkdir dto
touch dto/product.dto.ts
```

**Result:**
```
modules/products/
├── products.controller.ts
├── products.service.ts
├── products.module.ts
└── dto/
    └── product.dto.ts
```

### 2. Define Prisma Model

**File:** `backend/prisma/schema.prisma`

```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Float
  stock       Int      @default(0)
  isActive    Boolean  @default(true) @map("is_active")

  // Multi-tenancy
  organizationId String? @map("organization_id")
  organization   Organization? @relation(fields: [organizationId], references: [id])

  // Audit
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  createdBy   String?  @map("created_by")
  updatedBy   String?  @map("updated_by")

  @@index([organizationId])
  @@map("products")
}
```

**Update Organization model:**
```prisma
model Organization {
  // ... existing fields
  products Product[]
}
```

### 3. Create Migration

```bash
cd backend
npx prisma migrate dev --name add_products
npx prisma generate
```

### 4. Create DTOs

**File:** `backend/src/modules/products/dto/product.dto.ts`

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  organizationId: z.string().uuid().optional(),
});

export class CreateProductDto extends createZodDto(createProductSchema) {}

export const updateProductSchema = createProductSchema.partial();
export class UpdateProductDto extends createZodDto(updateProductSchema) {}
```

### 5. Create Service

**File:** `backend/src/modules/products/products.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import {
  createPaginatedResult,
  PaginationDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        isActive: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  async findAll(pagination: PaginationDto, organizationId?: string) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(organizationId && { organizationId }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return createPaginatedResult(products, total, page, limit);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, updatedBy?: string) {
    await this.findOne(id); // Verify exists

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        updatedBy,
      },
    });
  }

  async remove(id: string, deletedBy?: string) {
    await this.findOne(id);

    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });
  }
}
```

### 6. Create Controller

**File:** `backend/src/modules/products/products.controller.ts`

```typescript
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { paginationSchema } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products (paginated)' })
  findAll(@Query() query: Record<string, string>) {
    const pagination = paginationSchema.parse(query);
    return this.productsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.productsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete product (soft delete)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.productsService.remove(id, user.id);
  }
}
```

### 7. Create Module

**File:** `backend/src/modules/products/products.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '../../core/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

### 8. Register Module in App

**File:** `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ProductsModule } from './modules/products/products.module';
// ... other imports

@Module({
  imports: [
    // ... other modules
    ProductsModule,
  ],
})
export class AppModule {}
```

### 9. Test Endpoints

```bash
# Start development server
npm run start:dev

# Test with Swagger UI
# Open http://localhost:3000/api/docs

# Or use curl:
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Product","price":29.99,"stock":100}'

curl http://localhost:3000/products
curl http://localhost:3000/products/{id}
```

### 10. Write Tests

**File:** `backend/src/modules/products/products.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../core/database/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a product', async () => {
    const dto = {
      name: 'Test Product',
      price: 29.99,
      stock: 100,
    };

    const mockProduct = {
      id: 'uuid',
      ...dto,
      isActive: true,
      createdAt: new Date(),
    };

    jest.spyOn(prisma.product, 'create').mockResolvedValue(mockProduct as any);

    const result = await service.create(dto);

    expect(result).toEqual(mockProduct);
  });
});
```

Run tests:
```bash
npm run test
```

## Checklist

- [ ] Create module directory and files
- [ ] Define Prisma model with audit fields
- [ ] Create and run migration
- [ ] Generate Prisma client
- [ ] Create DTOs with validation
- [ ] Implement service (CRUD operations)
- [ ] Implement controller with decorators
- [ ] Create module definition
- [ ] Register module in AppModule
- [ ] Test endpoints via Swagger/curl
- [ ] Write unit tests
- [ ] Update documentation if needed

## Common Patterns

**Multi-tenancy filtering:**
```typescript
const where = {
  deletedAt: null,
  ...(organizationId && { organizationId }),
};
```

**Soft delete:**
```typescript
await this.prisma.model.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

**Pagination:**
```typescript
const skip = (page - 1) * limit;
const [items, total] = await Promise.all([
  this.prisma.model.findMany({ skip, take: limit }),
  this.prisma.model.count(),
]);
```

<!-- AUTO-GENERATED: END -->
