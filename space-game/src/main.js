import * as THREE from 'three';
import { GameEngine } from './engine/GameEngine.js';
import { AudioManager } from './engine/AudioManager.js';
import { InputManager } from './engine/InputManager.js';
import { UIManager } from './ui/UIManager.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { PreLaunchScene } from './scenes/PreLaunchScene.js';
import { LaunchScene } from './scenes/LaunchScene.js';
import { SpaceNavigationScene } from './scenes/SpaceNavigationScene.js';
import { DockingScene } from './scenes/DockingScene.js';
import { ISSInteriorScene } from './scenes/ISSInteriorScene.js';
import { EVAScene } from './scenes/EVAScene.js';
import { ReEntryScene } from './scenes/ReEntryScene.js';
import { LandingScene } from './scenes/LandingScene.js';

const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');
const loadingScreen = document.getElementById('loading-screen');

function updateLoading(progress, text) {
  if (loadingBar) loadingBar.style.width = progress + '%';
  if (loadingText) loadingText.textContent = text;
}

async function init() {
  updateLoading(10, 'تهيئة محرك الرسومات...');

  const canvas = document.getElementById('game-canvas');
  const engine = new GameEngine(canvas);

  updateLoading(20, 'تحميل نظام الصوت...');
  const audio = new AudioManager();

  updateLoading(30, 'تهيئة نظام التحكم...');
  const input = new InputManager();

  updateLoading(40, 'تحميل واجهة المستخدم...');
  const ui = new UIManager();

  const gameState = {
    engine, audio, input, ui,
    currentScene: null,
    playerData: {
      name: 'رائد الفضاء',
      fuel: 100,
      oxygen: 100,
      energy: 100,
      health: 100,
      skills: { navigation: 1, repair: 1, research: 1, resource: 1, docking: 1 },
      completedMissions: [],
      currentMission: null,
      score: 0
    },
    missionData: {
      type: 'standard',
      objectives: [],
      timeLimit: 0
    },
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      difficulty: 'normal',
      language: 'ar'
    }
  };

  const scenes = {
    mainMenu: new MainMenuScene(gameState),
    preLaunch: new PreLaunchScene(gameState),
    launch: new LaunchScene(gameState),
    spaceNavigation: new SpaceNavigationScene(gameState),
    docking: new DockingScene(gameState),
    issInterior: new ISSInteriorScene(gameState),
    eva: new EVAScene(gameState),
    reEntry: new ReEntryScene(gameState),
    landing: new LandingScene(gameState)
  };

  gameState.scenes = scenes;

  gameState.switchScene = async (sceneName, data) => {
    if (gameState.currentScene) {
      await gameState.currentScene.cleanup();
    }
    const scene = scenes[sceneName];
    if (scene) {
      gameState.currentScene = scene;
      await scene.init(data);
    }
  };

  updateLoading(60, 'تحميل النماذج ثلاثية الأبعاد...');
  await new Promise(r => setTimeout(r, 300));

  updateLoading(80, 'تحميل المؤثرات البصرية...');
  await new Promise(r => setTimeout(r, 300));

  updateLoading(100, 'جاهز للإطلاق!');
  await new Promise(r => setTimeout(r, 500));

  loadingScreen.style.opacity = '0';
  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, 1000);

  await gameState.switchScene('mainMenu');

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (gameState.currentScene) {
      gameState.currentScene.update(delta);
      gameState.currentScene.render(engine.renderer);
    }
  }
  animate();
}

init().catch(err => {
  console.error('Game init error:', err);
  if (loadingText) loadingText.textContent = 'خطأ في التحميل: ' + err.message;
});
