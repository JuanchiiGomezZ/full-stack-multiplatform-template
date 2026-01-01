# Backend: File Storage

<!-- AUTO-GENERATED: START -->

## Stack

- **Provider:** AWS S3
- **SDK:** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- **Upload:** Multipart form-data via NestJS
- **Location:** `backend/src/shared/storage/`

## Configuration

**Environment variables:**
```bash
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

**File:** `backend/src/core/config/aws.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
  },
}));
```

## Storage Service

**File:** `backend/src/shared/storage/storage.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId'),
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey'),
      },
    });
    this.bucket = this.configService.get<string>('aws.s3.bucket');
  }

  async upload(file: Express.Multer.File, folder: string = 'uploads') {
    const key = `${folder}/${uuidv4()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    });

    await this.s3Client.send(command);

    return {
      key,
      url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
    };
  }

  async getSignedUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async delete(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }
}
```

## Upload Controller

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('upload')
export class UploadController {
  constructor(private storageService: StorageService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File too large');
    }

    const result = await this.storageService.upload(file, 'images');

    return {
      key: result.key,
      url: result.url,
    };
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    const result = await this.storageService.upload(file, 'documents');

    return result;
  }
}
```

## File Validation

**Custom file filter:**

```typescript
import { BadRequestException } from '@nestjs/common';

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
    return callback(
      new BadRequestException('Only image files are allowed'),
      false,
    );
  }
  callback(null, true);
};

// Usage
@Post('avatar')
@UseInterceptors(
  FileInterceptor('file', {
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }),
)
async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  return this.storageService.upload(file, 'avatars');
}
```

## Multiple File Upload

```typescript
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFiles } from '@nestjs/common';

@Post('multiple')
@UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
  if (!files || files.length === 0) {
    throw new BadRequestException('No files provided');
  }

  const results = await Promise.all(
    files.map((file) => this.storageService.upload(file, 'gallery')),
  );

  return results;
}
```

## Presigned URLs

Generate temporary URLs for private files:

```typescript
@Get('download/:key')
async getDownloadUrl(@Param('key') key: string) {
  const signedUrl = await this.storageService.getSignedUrl(key, 300); // 5 minutes

  return { url: signedUrl };
}
```

**Frontend usage:**
```typescript
// Get signed URL from API
const { url } = await api.get(`/upload/download/${fileKey}`);

// Use URL directly
window.open(url, '_blank');
```

## Delete Files

```typescript
@Delete(':key')
async deleteFile(@Param('key') key: string) {
  await this.storageService.delete(key);

  return { message: 'File deleted successfully' };
}
```

## File Metadata in Database

Store file references in database:

```prisma
model File {
  id         String   @id @default(uuid())
  key        String   @unique
  filename   String
  mimetype   String
  size       Int
  url        String
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id])
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("files")
}
```

**Service:**
```typescript
async uploadWithMetadata(
  file: Express.Multer.File,
  userId: string,
) {
  // Upload to S3
  const { key, url } = await this.storageService.upload(file, 'uploads');

  // Save metadata
  const fileRecord = await this.prisma.file.create({
    data: {
      key,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
      userId,
    },
  });

  return fileRecord;
}
```

## Multipart Upload (Large Files)

For files > 100MB, use multipart upload:

```typescript
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';

async uploadLargeFile(file: Express.Multer.File) {
  const key = `large/${uuidv4()}-${file.originalname}`;

  // 1. Initiate multipart upload
  const multipart = await this.s3Client.send(
    new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
    }),
  );

  // 2. Upload parts (simplified example)
  const partSize = 10 * 1024 * 1024; // 10MB parts
  const parts = [];

  for (let i = 0; i < Math.ceil(file.size / partSize); i++) {
    const start = i * partSize;
    const end = Math.min(start + partSize, file.size);

    const uploadPart = await this.s3Client.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: multipart.UploadId,
        PartNumber: i + 1,
        Body: file.buffer.slice(start, end),
      }),
    );

    parts.push({
      ETag: uploadPart.ETag,
      PartNumber: i + 1,
    });
  }

  // 3. Complete upload
  await this.s3Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: multipart.UploadId,
      MultipartUpload: { Parts: parts },
    }),
  );

  return { key, url: `https://${this.bucket}.s3.amazonaws.com/${key}` };
}
```

## Best Practices

### ✅ DO

- Validate file types and sizes
- Use UUIDs in filenames to prevent collisions
- Store file metadata in database
- Use presigned URLs for private files
- Implement file size limits
- Organize files in folders
- Delete orphaned files
- Use CDN for public files

### ❌ DON'T

- Trust user-provided filenames
- Allow unlimited file sizes
- Store files on application server
- Make all S3 objects public
- Skip file type validation
- Use sequential filenames

## S3 Bucket Configuration

**CORS configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:4000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

**Bucket policy (example for private bucket):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

<!-- AUTO-GENERATED: END -->
