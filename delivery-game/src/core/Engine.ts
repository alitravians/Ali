import * as THREE from 'three';

export class Engine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public clock: THREE.Clock;
  public sun!: THREE.DirectionalLight;
  public ambient!: THREE.HemisphereLight;
  public fogNear = 80;
  public fogFar = 380;

  constructor(canvas?: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    if (!canvas) document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x88bbff);
    this.scene.fog = new THREE.Fog(0xbfd8ff, this.fogNear, this.fogFar);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 8, 14);

    this.clock = new THREE.Clock();

    this.setupLighting();
    this.setupGround();

    window.addEventListener('resize', this.onResize);
  }

  private setupLighting() {
    this.ambient = new THREE.HemisphereLight(0xbfd8ff, 0x4a4130, 0.55);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xfff2d1, 1.4);
    this.sun.position.set(80, 110, 60);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 260;
    this.sun.shadow.camera.left = -140;
    this.sun.shadow.camera.right = 140;
    this.sun.shadow.camera.top = 140;
    this.sun.shadow.camera.bottom = -140;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.05;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
  }

  private setupGround() {
    // Large flat ground (asphalt/grass mix)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5a8f4a,
      roughness: 1.0,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  /**
   * Update day/night cycle. t01 = 0 midnight, 0.25 sunrise, 0.5 noon, 0.75 sunset, 1 midnight.
   */
  setTimeOfDay(t01: number) {
    const angle = t01 * Math.PI * 2 - Math.PI / 2;
    const r = 140;
    this.sun.position.set(Math.cos(angle) * r, Math.sin(angle) * r + 30, 60);
    const daylight = Math.max(0, Math.sin(angle));
    this.sun.intensity = 0.3 + daylight * 1.2;

    const skyTop = new THREE.Color().setHSL(0.6, 0.7, 0.25 + daylight * 0.6);
    const skyHorizon = new THREE.Color().setHSL(0.1 + daylight * 0.1, 0.8, 0.45 + daylight * 0.35);

    this.scene.background = skyTop;
    (this.scene.fog as THREE.Fog).color.copy(skyHorizon);

    this.ambient.intensity = 0.2 + daylight * 0.55;
    this.ambient.color.setHSL(0.6, 0.5, 0.3 + daylight * 0.5);
    this.ambient.groundColor.setHSL(0.08, 0.3, 0.1 + daylight * 0.3);

    const sunColor = new THREE.Color().lerpColors(
      new THREE.Color(0xff7733),
      new THREE.Color(0xfff2d1),
      Math.min(1, daylight * 1.5)
    );
    this.sun.color.copy(sunColor);
  }

  onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
