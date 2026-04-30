import type { VideoStyle } from './types';

export const VIDEO_STYLES: VideoStyle[] = [
  { id: 'cinematic', label: 'سينمائي', prompt: 'cinematic, dramatic lighting, film grain, 35mm, depth of field' },
  { id: 'realistic', label: 'واقعي', prompt: 'photorealistic, ultra detailed, 4k, natural lighting' },
  { id: 'anime', label: 'أنيمي', prompt: 'anime style, studio ghibli, vibrant colors, detailed background' },
  { id: '3d', label: '3D', prompt: '3d render, octane, blender, soft lighting, high detail' },
  { id: 'fantasy', label: 'فانتازيا', prompt: 'fantasy art, epic, mystical atmosphere, dramatic, vivid colors' },
  { id: 'cyberpunk', label: 'سايبربانك', prompt: 'cyberpunk, neon lights, futuristic, rain, blade runner aesthetic' },
  { id: 'watercolor', label: 'ألوان مائية', prompt: 'watercolor painting, soft brush strokes, artistic, flowing' },
  { id: 'minimal', label: 'بسيط', prompt: 'minimalist, clean, simple composition, soft pastels' },
];

export const DEFAULT_STYLE = VIDEO_STYLES[0];
