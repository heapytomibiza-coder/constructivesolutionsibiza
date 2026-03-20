import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
} from 'npm:@imagemagick/magick-wasm@0.0.30';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize WASM once at cold-start
const wasmBytes = await Deno.readFile(
  new URL('magick.wasm', import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.30'))
);
await initializeImageMagick(wasmBytes);

interface VariantSpec {
  name: string;
  maxWidth: number;
}

const VARIANTS: VariantSpec[] = [
  { name: 'thumb', maxWidth: 200 },
  { name: 'card', maxWidth: 640 },
  { name: 'large', maxWidth: 1400 },
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify the user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Parse request ---
    const body = await req.json();
    const { bucket, path: originalPath } = body;

    if (!bucket || !originalPath) {
      return new Response(JSON.stringify({ error: 'bucket and path are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure the path belongs to the user (paths start with userId/)
    if (!originalPath.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({ error: 'Access denied: path mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Download original ---
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from(bucket)
      .download(originalPath);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: 'Failed to download original image' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate size
    if (fileData.size > MAX_UPLOAD_BYTES) {
      return new Response(JSON.stringify({ error: 'Image exceeds 10 MB limit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(fileData.type)) {
      return new Response(JSON.stringify({ error: `Unsupported image type: ${fileData.type}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageBytes = new Uint8Array(await fileData.arrayBuffer());

    // --- Build derived path base ---
    // e.g. userId/1234567890.jpg → userId/derived/1234567890
    const pathParts = originalPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const derivedBase = `${user.id}/derived/${baseName}`;

    // --- Generate variants ---
    const results: Record<string, string> = {};

    for (const variant of VARIANTS) {
      const webpBytes = ImageMagick.read(imageBytes, (img): Uint8Array => {
        // Only downscale, never upscale
        if (img.width > variant.maxWidth) {
          const ratio = variant.maxWidth / img.width;
          const newHeight = Math.round(img.height * ratio);
          img.resize(variant.maxWidth, newHeight);
        }

        img.quality = 78;

        // Strip metadata
        img.strip();

        return img.write(MagickFormat.Webp, (data) => {
          return new Uint8Array(data);
        });
      });

      const derivedPath = `${derivedBase}-${variant.name}.webp`;

      const { error: uploadError } = await adminClient.storage
        .from(bucket)
        .upload(derivedPath, webpBytes, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadError) {
        console.error(`Failed to upload ${variant.name}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = adminClient.storage
        .from(bucket)
        .getPublicUrl(derivedPath);

      results[`${variant.name}_url`] = publicUrl;
    }

    return new Response(JSON.stringify({
      success: true,
      original_path: originalPath,
      variants: results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('optimize-image error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
