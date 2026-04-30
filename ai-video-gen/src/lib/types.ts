export type Duration = 5 | 10 | 15;

export interface VideoStyle {
  id: string;
  label: string;
  prompt: string;
}

export interface FrameData {
  url: string;
  index: number;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  duration: Duration;
  style: string;
  url: string;
  createdAt: number;
}
