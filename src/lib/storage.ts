import { supabase } from "@/integrations/supabase/client";

const R2_CONFIGURED = !!(
  import.meta.env.VITE_R2_ENDPOINT &&
  import.meta.env.VITE_R2_ACCESS_KEY_ID &&
  import.meta.env.VITE_R2_SECRET_ACCESS_KEY &&
  import.meta.env.VITE_R2_BUCKET
);

async function getR2() {
  if (!R2_CONFIGURED) return null;
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: "auto",
    endpoint: import.meta.env.VITE_R2_ENDPOINT,
    credentials: {
      accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
    },
  });
}

const BUCKET = import.meta.env.VITE_R2_BUCKET as string | undefined;

function r2Key(bucket: string, path: string) {
  return `${bucket}/${path}`;
}

export const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File | Blob, opts?: Record<string, unknown>) {
        if (R2_CONFIGURED) {
          const { PutObjectCommand } = await import("@aws-sdk/client-s3");
          const r2 = await getR2();
          await r2!.send(new PutObjectCommand({
            Bucket: BUCKET!,
            Key: r2Key(bucket, path),
            Body: file,
            ContentType: (file as Blob).type || "application/octet-stream",
          }));
          return { error: null };
        }
        // Supabase fallback
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          contentType: (file as Blob).type || "application/octet-stream",
          upsert: (opts as any)?.upsert ?? true,
        });
        return { error };
      },

      getPublicUrl(path: string) {
        if (R2_CONFIGURED) {
          const url = `${import.meta.env.VITE_R2_ENDPOINT}/${BUCKET}/${r2Key(bucket, path)}`;
          return { data: { publicUrl: url } };
        }
        return supabase.storage.from(bucket).getPublicUrl(path);
      },

      async createSignedUrl(path: string, expiresIn: number) {
        if (R2_CONFIGURED) {
          const { GetObjectCommand } = await import("@aws-sdk/client-s3");
          const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
          const r2 = await getR2();
          const url = await getSignedUrl(
            r2!,
            new GetObjectCommand({ Bucket: BUCKET!, Key: r2Key(bucket, path) }),
            { expiresIn }
          );
          return { data: { signedUrl: url }, error: null };
        }
        return supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
      },

      async remove(paths: string[]) {
        if (R2_CONFIGURED) {
          const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
          const r2 = await getR2();
          await Promise.all(
            paths.map((p) => r2!.send(new DeleteObjectCommand({ Bucket: BUCKET!, Key: r2Key(bucket, p) })))
          );
          return { error: null };
        }
        return supabase.storage.from(bucket).remove(paths);
      },
    };
  },
};
