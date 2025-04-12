
export type SoundType = 
  | 'move'
  | 'eat'
  | 'collision'
  | 'gameOver'
  | 'levelComplete'
  | 'buttonClick'
  | 'cityUnlock';

const audioCache: Record<SoundType, HTMLAudioElement> = {} as Record<SoundType, HTMLAudioElement>;

export const preloadSounds = (): void => {
  const sounds: SoundType[] = [
    'move',
    'eat',
    'collision',
    'gameOver',
    'levelComplete',
    'buttonClick',
    'cityUnlock'
  ];
  
  sounds.forEach(sound => {
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.preload = 'auto';
    audioCache[sound] = audio;
  });
};

export const playSoundIfEnabled = (
  sound: SoundType,
  settings: { soundEnabled: boolean }
): void => {
  if (!settings.soundEnabled) return;
  
  try {
    if (!audioCache[sound]) {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audioCache[sound] = audio;
    }
    
    const audioToPlay = audioCache[sound].cloneNode() as HTMLAudioElement;
    audioToPlay.volume = 0.5; // Set volume to 50%
    audioToPlay.play().catch(error => {
      console.error(`Error playing sound ${sound}:`, error);
    });
  } catch (error) {
    console.error(`Error with sound system:`, error);
  }
};

export const initSoundSystem = (): void => {
  preloadSounds();
  
  const enableAudio = () => {
    const audio = new Audio();
    audio.play().catch(() => {});
    document.removeEventListener('click', enableAudio);
  };
  
  document.addEventListener('click', enableAudio);
};
