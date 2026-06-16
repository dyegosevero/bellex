import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = import.meta.env.VITE_R2_BUCKET as string;

function key(bucket: string, path: string) {
  return `${bucket}/${path}`;
}

export const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File | Blob, _opts?: Record<string, unknown>) {
        const objectKey = key(bucket, path);
        await r2.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: objectKey,
          Body: file,
          ContentType: (file as Blob).type || "application/octet-stream",
        }));
        return { error: null };
      },

      getPublicUrl(path: string) {
        const objectKey = key(bucket, path);
        const url = `${import.meta.env.VITE_R2_ENDPOINT}/${BUCKET}/${objectKey}`;
        return { data: { publicUrl: url } };
      },

      async createSignedUrl(path: string, expiresIn: number) {
        const objectKey = key(bucket, path);
        const url = await getSignedUrl(
          r2,
          new GetObjectCommand({ Bucket: BUCKET, Key: objectKey }),
          { expiresIn }
        );
        return { data: { signedUrl: url }, error: null };
      },

      async remove(paths: string[]) {
        await Promise.all(
          paths.map((path) =>
            r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key(bucket, path) }))
          )
        );
        return { error: null };
      },
    };
  },
};
