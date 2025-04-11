
export type SoundType = 
  | 'move' 
  | 'eat' 
  | 'collision' 
  | 'gameOver' 
  | 'levelComplete' 
  | 'buttonClick'
  | 'cityUnlock';

const SOUND_URLS: Record<SoundType, string> = {
  move: '/sounds/move.mp3',
  eat: '/sounds/eat.mp3',
  collision: '/sounds/collision.mp3',
  gameOver: '/sounds/game-over.mp3',
  levelComplete: '/sounds/level-complete.mp3',
  buttonClick: '/sounds/button-click.mp3', // Ensure this file exists
  cityUnlock: '/sounds/city-unlock.mp3'
};

const audioElements: Partial<Record<SoundType, HTMLAudioElement>> = {};

export const initSoundSystem = (): void => {
  Object.entries(SOUND_URLS).forEach(([type, url]) => {
    try {
      const audio = new Audio();
      audio.src = url;
      audio.preload = 'auto';
      audioElements[type as SoundType] = audio;
    } catch (error) {
      console.error(`Failed to load sound: ${type}`, error);
    }
  });
};

export const playSound = (type: SoundType, volume = 1.0): void => {
  try {
    const audio = audioElements[type];
    
    if (!audio) {
      try {
        const newAudio = new Audio(SOUND_URLS[type]);
        newAudio.volume = volume;
        
        newAudio.addEventListener('error', () => {
          console.warn(`Sound file not found: ${type}. Using fallback sound.`);
          const fallbackAudio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18AAAAAAA==');
          fallbackAudio.volume = volume * 0.5;
          fallbackAudio.play().catch(err => {
            console.warn('Failed to play fallback sound', err);
          });
        });
        
        newAudio.play().catch(error => {
          if (error.name === 'NotSupportedError' || error.name === 'NotFoundError') {
            console.warn(`Sound file not supported: ${type}. Using fallback sound.`);
            const fallbackAudio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18AAAAAAA==');
            fallbackAudio.volume = volume * 0.5;
            fallbackAudio.play().catch(err => {
              console.warn('Failed to play fallback sound', err);
            });
          } else {
            console.error(`Failed to play sound: ${type}`, error);
          }
        });
        return;
      } catch (innerError) {
        console.error(`Error creating audio element: ${type}`, innerError);
        return;
      }
    }
    
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;
    
    audio.play().catch(error => {
      if (error.name === 'NotSupportedError' || error.name === 'NotFoundError') {
        console.warn(`Sound file not supported: ${type}. Using fallback sound.`);
        const fallbackAudio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18AAAAAAA==');
        fallbackAudio.volume = volume * 0.5;
        fallbackAudio.play().catch(err => {
          console.warn('Failed to play fallback sound', err);
        });
      } else {
        console.error(`Failed to play sound: ${type}`, error);
      }
    });
  } catch (error) {
    console.error(`Error playing sound: ${type}`, error);
  }
};

export const stopSound = (type: SoundType): void => {
  const audio = audioElements[type];
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};

export const stopAllSounds = (): void => {
  Object.values(audioElements).forEach(audio => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
};

export const isSoundEnabled = (settings: { soundEnabled: boolean }): boolean => {
  return settings.soundEnabled;
};

export const playSoundIfEnabled = (
  type: SoundType, 
  settings: { soundEnabled: boolean },
  volume = 1.0
): void => {
  if (isSoundEnabled(settings)) {
    playSound(type, volume);
  }
};

export const createPlaceholderSounds = (): void => {
  console.log('Placeholder sounds need to be replaced with real sound files');
};

export default {
  initSoundSystem,
  playSound,
  stopSound,
  stopAllSounds,
  isSoundEnabled,
  playSoundIfEnabled,
  createPlaceholderSounds
};
