import 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

const s3 = new S3Client({
    region: env.AWS_REGION,
    credentials: { accessKeyId: env.AWS_ACCESS_KEY, secretAccessKey: env.AWS_SECRET_KEY },
});

export async function uploadToS3(file: Express.Multer.File, workspaceId: string): Promise<string> {
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'bin';
    const key = `sources/${workspaceId}/${uuidv4()}.${ext}`;
    await s3.send(new PutObjectCommand({
        Bucket: env.AWS_BUCKET, Key: key,
        Body: file.buffer, ContentType: file.mimetype,
    }));
    return key;
}

export async function fetchFromS3(key: string): Promise<Buffer> {
    const res = await s3.send(new GetObjectCommand({ Bucket: env.AWS_BUCKET, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    return Buffer.concat(chunks);
}

export async function deleteFromS3(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_BUCKET, Key: key }));
}

export async function uploadTextToS3(text: string, workspaceId: string): Promise<string> {
    const key = `sources/${workspaceId}/${uuidv4()}.txt`;
    await s3.send(new PutObjectCommand({
        Bucket: env.AWS_BUCKET,
        Key: key,
        Body: Buffer.from(text, 'utf-8'),
        ContentType: 'text/plain; charset=utf-8'
    }));
    return key;
}