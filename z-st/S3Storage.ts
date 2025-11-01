import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { IDavStorage } from "./IDavStorage"
import { Readable } from "stream";

export class S3Storage implements IDavStorage {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor() {
    if (!process.env.CLOUDFLARE_BUCKET_NAME) {
      throw new Error("CLOUDFLARE_BUCKET_NAME is not defined");
    }

    this.bucket = process.env.CLOUDFLARE_BUCKET_NAME;

    this.s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Uploads or overwrites an object at the given key.
   */
  async put(
    key: string,
    body: Buffer | Uint8Array | NodeJS.ReadableStream,
    contentType?: string
  ): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        //@ts-ignore
        Body: body,
        ContentType: contentType ?? "application/octet-stream",
      })
    );
  }

  /**
   * Retrieves an object from the given key.
   * Returns its data as a Buffer.
   */
  async get(key: string): Promise<Buffer> {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error(`Object not found at key: ${key}`);
    }

    // Convert the stream into a Buffer
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  /**
   * Deletes an object from the given key.
   */
  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async list(prefix: string): Promise<{ key: string; size: number }[]> {
    const res = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      })
    );

    return (
      res.Contents?.map((obj) => ({
        key: obj.Key!,
        size: obj.Size ?? 0,
      })) ?? []
    );
  }
}
