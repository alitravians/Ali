export type Duration = 5 | 10 | 15;

export interface VideoStyle {
  id: string;
  label: string;
  prompt: string;
}

export interface FrameData {
  url: string;
  index: number;
  prompt: string;
  seed: number;
}

/**
 * A single panel in the storyboard. Either an AI-generated frame or a
 * user-uploaded starting frame.
 *
 * For `source: 'ai'`, `url` is a Pollinations.ai URL built from `prompt`+`seed`
 * and can be re-rolled by mutating `seed`.
 *
 * For `source: 'upload'`, `url` is a `blob:` URL pointing at `localBlob`.
 * The blob must be carried alongside the URL because blob URLs are
 * document-scoped and can't be re-fetched after navigation.
 */
export interface StoryboardFrame {
  id: string;
  source: 'ai' | 'upload';
  prompt: string;
  url: string;
  seed?: number;
  /** Present only for `source: 'upload'`. */
  localBlob?: Blob;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  duration: Duration;
  style: string;
  url: string;
  createdAt: number;
}
