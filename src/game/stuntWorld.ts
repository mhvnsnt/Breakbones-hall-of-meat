import * as THREE from 'three';
import { StuntSpot } from '../types/game';

export const STUNT_SPOTS: StuntSpot[] = [
  {
    id: 'crane_leap',
    name: 'Apex Construction Crane',
    tagline: '75m Sky Dive into Traffic',
    difficulty: 'Insane',
    heightMeters: 75,
    spawnPosition: [0, 78, -35],
    spawnRotation: 0,
    description: 'Jump off the high crane boom directly into rooftop skylights or all the way down to the highway.',
  },
  {
    id: 'mega_spillway',
    name: 'Hydro Dam Mega Spillway',
    tagline: 'Pure Downhill Speed & Huge Air',
    difficulty: 'Extreme',
    heightMeters: 55,
    spawnPosition: [-55, 52, -10],
    spawnRotation: Math.PI / 2,
    description: 'Super-steep 55m spillway ramp. Hit maximum terminal velocity before ejecting off the lip.',
  },
  {
    id: 'el_toro_stairs',
    name: 'El Toro 50-Stair & Kinked Rail',
    tagline: 'Bone-Crushing Concrete Drops',
    difficulty: 'Medium',
    heightMeters: 18,
    spawnPosition: [28, 16.5, 0],
    spawnRotation: -Math.PI / 2,
    description: 'Iconic 50-stair set with center grind rail, trash cans, and dumpster targets at the bottom.',
  },
  {
    id: 'quarry_launch',
    name: 'Quarry Mega Cannon',
    tagline: 'Orbital Ragdoll Launch',
    difficulty: 'Extreme',
    heightMeters: 28,
    spawnPosition: [45, 26, -55],
    spawnRotation: -Math.PI * 0.75,
    description: 'Elevated launch chute aiming directly across the canyon into rock faces and scaffolding.',
  },
  {
    id: 'street_plaza',
    name: 'Downtown Street Plaza',
    tagline: 'Parkour & Highway Intercept',
    difficulty: 'Easy',
    heightMeters: 5,
    spawnPosition: [0, 1.5, 25],
    spawnRotation: 0,
    description: 'Street-level plaza with kickers, benches, rails, and direct access to moving traffic.',
  },
];

export class StuntWorld {
  public scene: THREE.Scene;
  public colliders: Array<{
    type: 'box' | 'cylinder' | 'ramp' | 'destructible';
    center: THREE.Vector3;
    size: THREE.Vector3;
    onBreak?: () => void;
    isBroken?: boolean;
  }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupLighting();
    this.setupAtmosphere();
    this.buildTerrain();
    this.buildMegaSpillway();
    this.buildDowntownSkyscraper();
    this.buildElToroStairs();
    this.buildQuarryZone();
    this.buildStreetPlaza();
  }

  private setupLighting() {
    // Warm sunset directional key light
    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    dirLight.position.set(45, 90, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 250;
    dirLight.shadow.camera.left = -90;
    dirLight.shadow.camera.right = 90;
    dirLight.shadow.camera.top = 90;
    dirLight.shadow.camera.bottom = -90;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Soft cool ambient fill light
    const ambLight = new THREE.AmbientLight(0x94a3b8, 0.7);
    this.scene.add(ambLight);

    // Warm horizon hemisphere
    const hemiLight = new THREE.HemisphereLight(0xfef08a, 0x334155, 0.4);
    this.scene.add(hemiLight);
  }

  private setupAtmosphere() {
    // Sunset orange-slate atmospheric fog
    this.scene.background = new THREE.Color(0xfb923c); // Warm dusk amber
    this.scene.fog = new THREE.FogExp2(0xf97316, 0.005);

    // Sky Dome with gradient canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#1e1b4b'); // Deep twilight navy
    grad.addColorStop(0.4, '#c026d3'); // Magenta sunset
    grad.addColorStop(0.7, '#f97316'); // Vibrant amber
    grad.addColorStop(1, '#fed7aa'); // Warm pale horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Distant sun disk
    ctx.beginPath();
    ctx.arc(256, 380, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 40;
    ctx.fill();

    const skyTex = new THREE.CanvasTexture(canvas);
    const skyGeom = new THREE.SphereGeometry(350, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false,
    });
    const skyMesh = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(skyMesh);
  }

  private buildTerrain() {
    // Asphalt Ground
    const groundGeom = new THREE.PlaneGeometry(320, 320, 32, 32);
    groundGeom.rotateX(-Math.PI / 2);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Deep asphalt slate
      roughness: 0.85,
      metalness: 0.1,
    });

    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.receiveShadow = true;
    ground.position.y = 0;
    this.scene.add(ground);

    // Highway Road markings
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const road = new THREE.Mesh(new THREE.BoxGeometry(260, 0.04, 18), roadMat);
    road.position.set(0, 0.02, 49);
    road.receiveShadow = true;
    this.scene.add(road);

    // Yellow highway center stripes
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let x = -120; x < 120; x += 12) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.4), stripeMat);
      stripe.position.set(x, 0.04, 49);
      this.scene.add(stripe);
    }

    // Concrete Highway Barriers
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const barrierGeom = new THREE.BoxGeometry(260, 0.9, 0.6);
    const barrierNorth = new THREE.Mesh(barrierGeom, barrierMat);
    barrierNorth.position.set(0, 0.45, 40);
    barrierNorth.castShadow = true;
    barrierNorth.receiveShadow = true;
    this.scene.add(barrierNorth);
    this.colliders.push({ type: 'box', center: new THREE.Vector3(0, 0.45, 40), size: new THREE.Vector3(260, 0.9, 0.6) });

    const barrierSouth = new THREE.Mesh(barrierGeom, barrierMat);
    barrierSouth.position.set(0, 0.45, 58);
    barrierSouth.castShadow = true;
    barrierSouth.receiveShadow = true;
    this.scene.add(barrierSouth);
    this.colliders.push({ type: 'box', center: new THREE.Vector3(0, 0.45, 58), size: new THREE.Vector3(260, 0.9, 0.6) });
  }

  private buildMegaSpillway() {
    // 55m high curved concrete dam spillway (at x: -60 to -20, z: -40 to 10)
    const damGroup = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.7,
      metalness: 0.1,
    });

    // The high platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(24, 4, 30), concreteMat);
    platform.position.set(-60, 50, -10);
    platform.castShadow = true;
    platform.receiveShadow = true;
    damGroup.add(platform);
    this.colliders.push({ type: 'box', center: new THREE.Vector3(-60, 50, -10), size: new THREE.Vector3(24, 4, 30) });

    // The giant steep ramp slope
    const rampGeom = new THREE.BoxGeometry(20, 2, 60);
    const ramp = new THREE.Mesh(rampGeom, concreteMat);
    ramp.position.set(-36, 26, -10);
    ramp.rotation.z = 0.75; // ~43 degrees slope!
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    damGroup.add(ramp);
    this.colliders.push({ type: 'ramp', center: new THREE.Vector3(-36, 26, -10), size: new THREE.Vector3(20, 2, 60) });

    // Spillway Kicker Lip at the bottom
    const kickerMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 });
    const kicker = new THREE.Mesh(new THREE.BoxGeometry(18, 3.5, 8), kickerMat);
    kicker.position.set(-18, 2, -10);
    kicker.rotation.z = -0.3;
    kicker.castShadow = true;
    damGroup.add(kicker);
    this.colliders.push({ type: 'box', center: new THREE.Vector3(-18, 2, -10), size: new THREE.Vector3(18, 3.5, 8) });

    // Spillway giant safety rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
    const railGeom = new THREE.CylinderGeometry(0.12, 0.12, 65, 8);
    railGeom.rotateZ(0.75);
    const leftRail = new THREE.Mesh(railGeom, railMat);
    leftRail.position.set(-36, 28, 0);
    damGroup.add(leftRail);

    const rightRail = new THREE.Mesh(railGeom, railMat);
    rightRail.position.set(-36, 28, -20);
    damGroup.add(rightRail);

    this.scene.add(damGroup);
  }

  private buildDowntownSkyscraper() {
    const buildingGroup = new THREE.Group();

    // 45m Tower (at x: 0, z: -40)
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.5,
    });

    const tower = new THREE.Mesh(new THREE.BoxGeometry(32, 45, 32), towerMat);
    tower.position.set(0, 22.5, -40);
    tower.castShadow = true;
    tower.receiveShadow = true;
    buildingGroup.add(tower);
    this.colliders.push({ type: 'box', center: new THREE.Vector3(0, 22.5, -40), size: new THREE.Vector3(32, 45, 32) });

    // Rooftop Helipad
    const heliMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const helipad = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 20), heliMat);
    helipad.position.set(0, 45.2, -40);
    buildingGroup.add(helipad);

    // High Construction Crane (Base on roof, arm extends 30m into the sky at 78m height!)
    const craneMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Industrial safety yellow
      metalness: 0.6,
      roughness: 0.3,
    });

    // Crane Mast
    const mast = new THREE.Mesh(new THREE.BoxGeometry(2.5, 32, 2.5), craneMat);
    mast.position.set(0, 61, -45);
    mast.castShadow = true;
    buildingGroup.add(mast);

    // Crane Boom / Arm
    const boom = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 40), craneMat);
    boom.position.set(0, 77, -30);
    boom.castShadow = true;
    buildingGroup.add(boom);
    this.colliders.push({ type: 'box', center: new THREE.Vector3(0, 77, -30), size: new THREE.Vector3(3, 2, 40) });

    // Diving Plank platform on tip of boom
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
    const plank = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 6), plankMat);
    plank.position.set(0, 78.2, -12);
    plank.castShadow = true;
    buildingGroup.add(plank);
    this.colliders.push({ type: 'box', center: new THREE.Vector3(0, 78.2, -12), size: new THREE.Vector3(4, 0.4, 6) });

    // Giant Billboard on side of tower
    const boardMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const billboard = new THREE.Mesh(new THREE.BoxGeometry(24, 8, 0.8), boardMat);
    billboard.position.set(0, 30, -23.5);
    buildingGroup.add(billboard);

    this.scene.add(buildingGroup);
  }

  private buildElToroStairs() {
    // 50-stair set at x: 28, z: 0
    const stairsGroup = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });

    const totalSteps = 24;
    const stepDepth = 0.8;
    const stepHeight = 0.55;

    for (let i = 0; i < totalSteps; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(10, stepHeight, stepDepth), concreteMat);
      step.position.set(28, (totalSteps - i) * stepHeight - stepHeight / 2, i * stepDepth - 6);
      step.castShadow = true;
      step.receiveShadow = true;
      stairsGroup.add(step);
      this.colliders.push({
        type: 'box',
        center: step.position.clone(),
        size: new THREE.Vector3(10, stepHeight, stepDepth),
      });
    }

    // High top landing plaza
    const topPlaza = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 14), concreteMat);
    topPlaza.position.set(28, totalSteps * stepHeight, -13);
    topPlaza.castShadow = true;
    topPlaza.receiveShadow = true;
    stairsGroup.add(topPlaza);
    this.colliders.push({
      type: 'box',
      center: new THREE.Vector3(28, totalSteps * stepHeight, -13),
      size: new THREE.Vector3(14, 1, 14),
    });

    // Famous Center Kinked Handrail
    const railGeom = new THREE.CylinderGeometry(0.08, 0.08, totalSteps * stepDepth * 1.3, 8);
    railGeom.rotateX(Math.PI / 4);
    const centerRail = new THREE.Mesh(railGeom, railMat);
    centerRail.position.set(28, (totalSteps * stepHeight) / 2 + 1.2, (totalSteps * stepDepth) / 2 - 6);
    centerRail.castShadow = true;
    stairsGroup.add(centerRail);

    // Dumpsters at the bottom of stairs
    const dumpsterMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    const dumpster = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 2.5), dumpsterMat);
    dumpster.position.set(28, 1.1, totalSteps * stepDepth + 2);
    dumpster.castShadow = true;
    stairsGroup.add(dumpster);
    this.colliders.push({
      type: 'box',
      center: dumpster.position.clone(),
      size: new THREE.Vector3(4, 2.2, 2.5),
    });

    this.scene.add(stairsGroup);
  }

  private buildQuarryZone() {
    const quarryGroup = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });

    // Quarry cliff terrace
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(40, 24, 30), rockMat);
    cliff.position.set(50, 12, -50);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    quarryGroup.add(cliff);
    this.colliders.push({ type: 'box', center: new THREE.Vector3(50, 12, -50), size: new THREE.Vector3(40, 24, 30) });

    // Steel launch chute
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 });
    const chute = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 24), chuteMat);
    chute.position.set(40, 24, -40);
    chute.rotation.x = -0.4;
    chute.rotation.y = -0.5;
    chute.castShadow = true;
    quarryGroup.add(chute);
    this.colliders.push({ type: 'box', center: chute.position.clone(), size: new THREE.Vector3(10, 1, 24) });

    this.scene.add(quarryGroup);
  }

  private buildStreetPlaza() {
    const plazaGroup = new THREE.Group();
    const ledgeMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.4 });
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });

    // Skate Bowl / Pool depression (visual rim)
    const bowlRimMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
    const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(8, 0.4, 8, 24), bowlRimMat);
    bowlRim.rotation.x = Math.PI / 2;
    bowlRim.position.set(-15, 0.2, 20);
    plazaGroup.add(bowlRim);

    // Funbox / Pyramid in center plaza
    const pyramid = new THREE.Mesh(new THREE.ConeGeometry(5, 1.8, 4), ledgeMat);
    pyramid.rotation.y = Math.PI / 4;
    pyramid.position.set(0, 0.9, 18);
    pyramid.castShadow = true;
    plazaGroup.add(pyramid);
    this.colliders.push({ type: 'box', center: new THREE.Vector3(0, 0.9, 18), size: new THREE.Vector3(4, 1.8, 4) });

    // Grindable street benches
    for (let i = 0; i < 3; i++) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(4, 0.7, 1.2), benchMat);
      bench.position.set((i - 1) * 8, 0.35, 30);
      bench.castShadow = true;
      plazaGroup.add(bench);
      this.colliders.push({ type: 'box', center: bench.position.clone(), size: new THREE.Vector3(4, 0.7, 1.2) });
    }

    this.scene.add(plazaGroup);
  }

  /**
   * Terrain height calculation function
   */
  public getTerrainHeight(x: number, z: number): number {
    // Spillway ramp
    if (x >= -60 && x <= -18 && z >= -25 && z <= 5) {
      if (x <= -48) return 52;
      const t = (x - -18) / (-48 - -18);
      return Math.max(0, t * 50);
    }

    // Top Skyscraper roof
    if (Math.abs(x) <= 16 && Math.abs(z - -40) <= 16) {
      return 45;
    }

    // Quarry cliff
    if (x >= 30 && x <= 70 && z >= -65 && z <= -35) {
      return 24;
    }

    // Default ground level
    return 0;
  }
}
