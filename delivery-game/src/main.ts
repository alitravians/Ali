import * as THREE from 'three';
import { Engine } from './core/Engine';
import { Input } from './core/Input';
import { AudioManager } from './core/Audio';
import { City } from './world/City';
import { TrafficSystem } from './world/TrafficAI';
import { NPC, Pedestrian } from './world/NPC';
import { Player } from './player/Player';
import { Car } from './vehicle/Car';
import { CameraRig } from './vehicle/CameraRig';
import { FuelSystem } from './gameplay/FuelSystem';
import { buildStage, type StageConfig } from './gameplay/StageManager';
import { Mission } from './gameplay/Mission';
import { MiniMap } from './ui/MiniMap';
import { HUD, DialogManager } from './ui/HUD';


type GamePhase = 'loading' | 'stage-intro' | 'walking' | 'driving' | 'gas-dialog' | 'stage-end' | 'game-over';

class Game {
  engine: Engine;
  input: Input;
  audio: AudioManager;
  hud: HUD;
  miniMap: MiniMap;
  camera: CameraRig;

  city!: City;
  traffic!: TrafficSystem;
  pedestrians: Pedestrian[] = [];
  gasAttendant!: NPC;
  player!: Player;
  car!: Car;
  fuel = new FuelSystem();
  mission!: Mission;
  stage!: StageConfig;

  money = 0;
  stageNum = 1;
  phase: GamePhase = 'loading';
  driving = false;
  headlightsOn = false;
  dayTime01 = 0.28; // start mid-morning
  lastHornTime = 0;
  activeGasStationIndex = 0;

  constructor() {
    this.engine = new Engine();
    this.input = new Input();
    this.audio = new AudioManager();
    this.hud = new HUD();
    this.miniMap = new MiniMap('minimap');
    this.camera = new CameraRig(this.engine.camera);
  }

  async init() {
    this.hud.updateLoading(0.05, 'بناء المدينة…');
    this.city = new City();
    this.engine.scene.add(this.city.root);
    this.city.forceUpdate();
    await this.nextFrame();

    this.hud.updateLoading(0.35, 'إضافة السيارات والمرور…');
    this.traffic = new TrafficSystem(this.city, 0.5);
    this.engine.scene.add(this.traffic.root);
    await this.nextFrame();

    this.hud.updateLoading(0.55, 'إضافة المارّة…');
    this.spawnPedestrians(12);
    await this.nextFrame();

    this.hud.updateLoading(0.70, 'إعداد اللاعب…');
    this.player = new Player();
    this.engine.scene.add(this.player.root);

    this.hud.updateLoading(0.85, 'إعداد السيارة الأولى…');
    this.prepareStage(1, true);

    this.hud.updateLoading(0.95, 'تهيئة الأصوات…');
    this.setupAudioOnGesture();

    this.hud.updateLoading(1.0, 'جاهز!');
    setTimeout(() => this.hud.hideLoading(), 300);

    this.setupDialogs();
    this.startLoop();
    this.showStageIntro();
  }

  private nextFrame(): Promise<void> {
    return new Promise((r) => requestAnimationFrame(() => r()));
  }

  private spawnPedestrians(n: number) {
    const halfCity = 110;
    for (let i = 0; i < n; i++) {
      const p = new Pedestrian(halfCity);
      p.root.position.set(
        (Math.random() - 0.5) * halfCity * 2,
        0,
        (Math.random() - 0.5) * halfCity * 2
      );
      this.pedestrians.push(p);
      this.engine.scene.add(p.root);
    }

    // Gas attendant (distinctive orange)
    this.gasAttendant = new NPC({ shirt: 0xff8833, pants: 0x221a0e });
    const gp = this.city.getGasPump(0);
    this.gasAttendant.root.position.set(gp.x - 1.2, 0, gp.z + 1.2);
    this.gasAttendant.root.lookAt(new THREE.Vector3(gp.x, 0, gp.z));
    this.engine.scene.add(this.gasAttendant.root);

    // Second gas attendant
    const att2 = new NPC({ shirt: 0xff8833, pants: 0x221a0e });
    const gp2 = this.city.getGasPump(1);
    att2.root.position.set(gp2.x - 1.2, 0, gp2.z + 1.2);
    this.engine.scene.add(att2.root);
  }

  private setupAudioOnGesture = () => {
    const handler = () => {
      this.audio.start();
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
  };

  private setupDialogs() {
    document.getElementById('btn-start-stage')?.addEventListener('click', () => {
      DialogManager.hide('dialog-stage-intro');
      this.phase = 'walking';
      this.hud.toast(`ابدأ بالخروج من البيت — W/A/S/D للحركة، الفأرة لتوجيه الكاميرا (انقر اللعبة لتفعيلها)، Shift للركض، E لدخول السيارة`, 'info');
    });

    document.getElementById('btn-gas-confirm')?.addEventListener('click', () => {
      const missing = this.fuel.capacity - this.fuel.level;
      const fullCost = missing * this.fuel.pricePerLiterForStage;
      if (fullCost > this.money) {
        // Partial fill — only as much as the player can afford
        const affordableLiters = this.money / this.fuel.pricePerLiterForStage;
        const spent = Math.min(this.money, affordableLiters * this.fuel.pricePerLiterForStage);
        this.fuel.level = Math.min(this.fuel.capacity, this.fuel.level + affordableLiters);
        this.money = Math.max(0, this.money - spent);
        this.hud.toast(`رصيدك لم يكفِ — تعبئة جزئية (-${Math.round(spent)} $)`, 'warn');
      } else {
        this.fuel.fillFull();
        this.money -= fullCost;
        this.hud.toast(`تعبئة كاملة — خُصم ${Math.round(fullCost)} $`, 'success');
      }
      this.audio.pump(1500);
      this.hud.setMoney(this.money);
      this.hud.setFuel(this.fuel.percent);
      DialogManager.hide('dialog-gas');
      this.phase = 'driving';
    });

    document.getElementById('btn-gas-cancel')?.addEventListener('click', () => {
      DialogManager.hide('dialog-gas');
      this.phase = 'driving';
    });

    document.getElementById('btn-next-stage')?.addEventListener('click', () => {
      DialogManager.hide('dialog-stage-end');
      this.stageNum++;
      this.prepareStage(this.stageNum, false);
      this.showStageIntro();
    });

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      DialogManager.hide('dialog-stage-end');
      this.prepareStage(this.stageNum, false);
      this.showStageIntro();
    });

    document.getElementById('btn-retry-fail')?.addEventListener('click', () => {
      DialogManager.hide('dialog-game-over');
      this.prepareStage(this.stageNum, false);
      this.showStageIntro();
    });
  }

  /** Create/reset car, mission, and fuel for the stage. */
  private prepareStage(num: number, _firstTime: boolean) {
    this.stage = buildStage(num);

    // Remove old car
    if (this.car) this.engine.scene.remove(this.car.root);
    // Clear old employees
    if (this.mission) {
      for (const e of this.mission.employees) this.engine.scene.remove(e.npc.root);
    }

    // Create new car from stage catalog
    this.car = new Car(this.stage.car);
    // Park car near office (or on a road)
    const startPos = new THREE.Vector3(-80, 0, 0);
    const nearestRoad = this.city.nearestRoadPoint(startPos.x, startPos.z);
    this.car.root.position.copy(nearestRoad);
    this.car.heading = 0;
    this.car.root.rotation.y = 0;
    this.engine.scene.add(this.car.root);

    // Place player just outside a "home" (next to the car)
    this.player.root.position.set(nearestRoad.x + 5, 0, nearestRoad.z + 4);
    this.player.root.visible = true;

    // Reset fuel
    this.fuel.reset(100);
    this.fuel.pricePerLiterForStage = this.stage.gasPricePerLiter;

    // Build mission
    this.mission = new Mission(this.city, this.stage);
    this.mission.startFuel = this.fuel.level;
    this.mission.assignEmployees(this.engine.scene as unknown as THREE.Group);

    // HUD
    this.hud.setStage(num);
    this.hud.setMoney(this.money);
    this.hud.setTimer(0);
    this.hud.setSpeed(0);
    this.hud.setFuel(1);
    this.hud.setPassengers(0, this.stage.employees);

    // Day/night
    this.dayTime01 = this.stage.night ? 0.85 : 0.28;

    // Update traffic density
    this.driving = false;
    this.camera.setMode('walk');
  }

  private showStageIntro() {
    document.getElementById('si-title')!.textContent = `المرحلة ${this.stage.num}`;
    document.getElementById('si-sub')!.textContent = this.stage.night
      ? 'مرحلة ليلية — انتبه للطريق!' : 'استعد لبدء يوم عمل جديد';
    document.getElementById('si-emp')!.textContent = String(this.stage.employees);
    document.getElementById('si-dist')!.textContent = this.stage.distanceLabel;
    document.getElementById('si-gas')!.textContent = `${this.stage.gasPricePerLiter} $ / لتر`;
    document.getElementById('si-car')!.textContent = this.stage.car.nameAr;
    this.phase = 'stage-intro';
    DialogManager.show('dialog-stage-intro');
  }

  private showStageEnd() {
    const score = this.mission.computeScore(this.fuel.level);
    document.getElementById('se-title')!.textContent = `المرحلة ${this.stage.num} مكتملة!`;
    document.getElementById('se-sub')!.textContent = 'أحسنت — إليك نتائجك';
    document.getElementById('se-stars')!.textContent = '★'.repeat(score.stars) + '☆'.repeat(5 - score.stars);
    const m = Math.floor(this.mission.elapsedTime / 60);
    const s = Math.floor(this.mission.elapsedTime % 60);
    document.getElementById('se-time')!.textContent = `${m}:${String(s).padStart(2, '0')}`;
    const fuelUsed = this.mission.startFuel - this.fuel.level;
    document.getElementById('se-fuel')!.textContent = `${Math.round(fuelUsed)} لتر`;
    document.getElementById('se-emp')!.textContent = `${this.mission.pickedCount}/${this.stage.employees}`;
    document.getElementById('se-drive')!.textContent = `${Math.round(score.driveScore)}%`;
    document.getElementById('se-reward')!.textContent = `+${score.reward} $`;
    this.money += score.reward;
    this.hud.setMoney(this.money);
    this.phase = 'stage-end';
    DialogManager.show('dialog-stage-end');
    this.audio.success();
  }

  private showGameOver(reason: string) {
    document.getElementById('go-reason')!.textContent = reason;
    this.phase = 'game-over';
    DialogManager.show('dialog-game-over');
    this.audio.warning();
  }

  private tryEnterExitVehicle() {
    if (!this.driving) {
      // Try enter
      const dist = this.player.root.position.distanceTo(this.car.root.position);
      if (dist < 3.5) {
        this.driving = true;
        this.phase = 'driving';
        this.player.root.visible = false;
        this.camera.setMode('chase');
        this.hud.toast('ركبت السيارة — انطلق!', 'success');
      } else {
        this.hud.toast('اقترب من السيارة للدخول', 'warn');
      }
    } else {
      // Exit
      const pos = this.car.getDriverSeatPos();
      this.player.root.position.copy(pos);
      this.player.root.visible = true;
      this.driving = false;
      this.phase = 'walking';
      this.camera.setMode('walk');
      // Seed the mouse-look yaw with the car's heading so the walking camera doesn't snap
      // to a different direction when the player steps out.
      this.input.mouseYaw = this.car.heading;
      this.input.mousePitch = 0.15;
      this.hud.toast('نزلت من السيارة', 'info');
    }
  }

  private showGasDialog() {
    const missing = this.fuel.capacity - this.fuel.level;
    const cost = Math.round(missing * this.fuel.pricePerLiterForStage);
    document.getElementById('gas-current')!.textContent = Math.round(this.fuel.level) + ' / ' + this.fuel.capacity + ' لتر';
    document.getElementById('gas-price')!.textContent = this.fuel.pricePerLiterForStage + ' $';
    document.getElementById('gas-total')!.textContent = cost + ' $';
    document.getElementById('gas-balance')!.textContent = Math.round(this.money) + ' $';
    this.phase = 'gas-dialog';
    DialogManager.show('dialog-gas');
  }

  private checkNearGasStation(): boolean {
    const carPos = this.car.root.position;
    const d1 = carPos.distanceTo(this.mission.gasPos);
    const d2 = carPos.distanceTo(this.mission.gasPos2);
    const near = Math.min(d1, d2);
    return near < 6 && Math.abs(this.car.speed) < 1.5;
  }

  startLoop() {
    let prev = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      this.update(dt);
      this.engine.render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  update(dt: number) {
    // Day/night (slow drift)
    this.dayTime01 = (this.dayTime01 + dt * 0.003) % 1;
    this.engine.setTimeOfDay(this.dayTime01);
    const isNight = this.dayTime01 < 0.2 || this.dayTime01 > 0.8;
    if (this.car) this.car.setHeadlights(isNight || this.stage.night);

    this.city?.update(dt);
    this.traffic?.update(dt);
    for (const ped of this.pedestrians) ped.update(dt);
    this.gasAttendant?.update(dt);

    // E behavior priority while driving: refuel > exit vehicle.
    // While walking: enter vehicle.
    const nearGas = this.driving && this.phase === 'driving' && this.checkNearGasStation();
    if (this.phase === 'walking' || this.phase === 'driving') {
      if (this.input.interactPressed && !nearGas) {
        this.tryEnterExitVehicle();
      }
      if (this.input.switchCamPressed && this.driving) {
        this.camera.cycleCarMode();
      }
    }

    if (this.driving && this.phase === 'driving') {
      this.car.update(dt, this.input, true);
      // Horn
      if (this.input.hornPressed) {
        this.audio.honk();
        this.mission.hornUses++;
      }
      // Fuel consumption
      const throttle = this.input.state.forward ? 1 : 0;
      this.fuel.consume(throttle, Math.abs(this.car.getSpeedKmh()), dt, this.car.spec.fuelConsumption * 0.02);
      if (this.fuel.isEmpty()) {
        this.showGameOver('نفد الوقود! اذهب لمحطة بنزين في المرة القادمة.');
        return;
      }

      // Audio
      this.audio.setEngineRPM(this.car.rpm01, true);

      // Update mission
      const result = this.mission.update(dt, this.car);
      if (result.pickedUpIndex !== undefined) {
        this.hud.toast(`تم اصطحاب ${this.mission.employees[result.pickedUpIndex].name}!`, 'success');
        this.hud.setPassengers(this.mission.pickedCount, this.stage.employees);
        this.audio.beep(880, 0.1);
      }
      if (result.droppedOff) {
        this.hud.toast('تم توصيل جميع الموظفين!', 'success');
        this.showStageEnd();
      }

      // Gas station proximity — E opens gas dialog instead of exiting car
      if (nearGas) {
        this.hud.showInteract(true, 'اضغط <kbd>E</kbd> للتعبئة');
        if (this.input.interactPressed) {
          this.showGasDialog();
        }
      } else {
        this.hud.showInteract(false);
      }

      // Camera
      this.camera.updateForCar(this.car, dt);
    } else if (this.phase === 'walking') {
      // Mouse-driven yaw/pitch feed both the walking camera and camera-relative WASD movement
      // so the direction the player faces always matches where the camera is looking.
      const yaw = this.input.mouseYaw;
      const pitch = this.input.mousePitch;
      this.player.update(dt, this.input, yaw, this.city.buildingColliders);
      this.camera.updateForWalk(this.player.root, dt, yaw, pitch);
      this.audio.setEngineRPM(0, false);

      // Show interact prompt when near car
      if (this.player.root.position.distanceTo(this.car.root.position) < 3.5) {
        this.hud.showInteract(true, 'اضغط <kbd>E</kbd> لدخول السيارة');
      } else {
        this.hud.showInteract(false);
      }
    }

    // Update HUD
    if (this.car) this.hud.setSpeed(this.car.getSpeedKmh());
    this.hud.setFuel(this.fuel.percent);
    if (this.mission) {
      this.hud.setTimer(this.mission.elapsedTime);
      this.hud.setPassengers(this.mission.pickedCount, this.stage.employees);
      const fuelLow = this.fuel.isLow();
      const target = this.mission.activeEmployeeIndex();
      let objective = '';
      if (fuelLow && this.mission.activeEmployeeIndex() >= 0) {
        objective = 'اذهب إلى محطة البنزين ⛽';
      } else if (target >= 0) {
        objective = `اصطحب ${this.mission.employees[target].name} من منزله`;
      } else {
        objective = 'توجه إلى مقر العمل 🏢';
      }
      this.hud.setObjective(objective);
      this.miniMap.draw(this.city, this.mission, this.car.root.position, this.car.heading, fuelLow);
    }

    this.input.endFrame();
  }
}

const game = new Game();
(window as unknown as { __game: Game }).__game = game;
game.init().catch((e) => {
  console.error('Game init failed', e);
  const status = document.getElementById('loading-status');
  if (status) status.textContent = 'خطأ في التحميل: ' + String(e);
});
