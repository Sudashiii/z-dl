export interface IDavStorage {
  /**
   * Uploads or overwrites an object at the given path.
   * @param key - The file path or object key (e.g. "images/photo.jpg").
   * @param body - The binary data to upload (Buffer, Uint8Array, or ReadableStream).
   * @param contentType - Optional MIME type (e.g. "image/jpeg").
   */
  put(key: string, body: Buffer | Uint8Array | NodeJS.ReadableStream, contentType?: string): Promise<void>;

  /**
   * Retrieves an object from the given path.
   * @param key - The file path or object key to retrieve.
   * @returns The object data as a Buffer.
   */
  get(key: string): Promise<Buffer>;

  /**
   * Deletes an object from the given path.
   * @param key - The file path or object key to delete.
   */
  delete(key: string): Promise<void>;


  list(prefix: string): Promise<{ key: string; size: number }[]>;
}
