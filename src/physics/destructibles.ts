import * as THREE from 'three';
import { soundEngine } from '../audio/soundEngine';

export interface DestructibleObject {
  id: string;
  type: 'glass' | 'wood' | 'launcher' | 'car';
  collider: {
    type: 'destructible';
    center: THREE.Vector3;
    size: THREE.Vector3;
    onBreak: () => void;
    isBroken: boolean;
  };
  mesh: THREE.Group;
  shards: THREE.Mesh[];
  shardVelocities: THREE.Vector3[];
  isBroken: boolean;
  breakTimer: number;
}

export class DestructiblesManager {
  public group: THREE.Group = new THREE.Group();
  public objects: DestructibleObject[] = [];
  public cars: { mesh: THREE.Group; pos: number; speed: number; direction: number }[] = [];

  constructor() {
    this.createAllDestructibles();
  }

  private createAllDestructibles() {
    // 1. Breakable Skylight Panels on Rooftop (at [0, 45, -30])
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 4;
      this.createGlassPanel(`glass_skylight_${i}`, new THREE.Vector3(x, 42.1, -40), new THREE.Vector3(3.2, 0.2, 5));
    }

    // 2. High-rise Office Glass Windows (at [0, 25, -20])
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = (col - 1) * 5;
        const y = 20 + row * 6;
        this.createGlassPanel(`glass_wall_${row}_${col}`, new THREE.Vector3(x, y, -22), new THREE.Vector3(4.5, 5, 0.2));
      }
    }

    // 3. Wooden Scaffolding Towers (at [15, 0, 30] and [-20, 0, 15])
    this.createWoodScaffold('wood_scaffold_1', new THREE.Vector3(15, 6, 25), new THREE.Vector3(5, 12, 5));
    this.createWoodScaffold('wood_scaffold_2', new THREE.Vector3(-18, 6, 18), new THREE.Vector3(5, 12, 5));

    // 4. Mega Springboards / Launch Barrels (at [0, 0.5, 8] and [25, 0.5, -15])
    this.createLauncher('launcher_center', new THREE.Vector3(0, 0.8, 12), 42);
    this.createLauncher('launcher_quarry', new THREE.Vector3(32, 2.5, -45), 55);

    // 5. Moving Stunt Cars on the Highway
    this.createTrafficSystem();
  }

  private createGlassPanel(id: string, center: THREE.Vector3, size: THREE.Vector3) {
    const parent = new THREE.Group();
    parent.position.copy(center);

    // Intact glass pane
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x67e8f9,
      transmission: 0.9,
      opacity: 0.6,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      reflectivity: 0.9,
    });

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });

    const pane = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), glassMat);
    pane.name = 'intact';
    parent.add(pane);

    // Subtle frame border
    const frame = new THREE.Mesh(new THREE.BoxGeometry(size.x + 0.1, size.y + 0.1, size.z + 0.1), frameMat);
    frame.scale.set(1.02, 1.02, 1.02);
    // parent.add(frame);

    // Flying Shards (pre-instanced, hidden until broken)
    const shards: THREE.Mesh[] = [];
    const shardVelocities: THREE.Vector3[] = [];
    const shardGeom = new THREE.TetrahedronGeometry(0.35, 0);

    for (let s = 0; s < 18; s++) {
      const shard = new THREE.Mesh(shardGeom, glassMat);
      shard.position.set(
        (Math.random() - 0.5) * size.x,
        (Math.random() - 0.5) * size.y,
        (Math.random() - 0.5) * size.z
      );
      shard.visible = false;
      parent.add(shard);
      shards.push(shard);
      shardVelocities.push(new THREE.Vector3());
    }

    const obj: DestructibleObject = {
      id,
      type: 'glass',
      collider: {
        type: 'destructible',
        center: center.clone(),
        size: size.clone(),
        isBroken: false,
        onBreak: () => {
          this.breakGlass(obj);
        },
      },
      mesh: parent,
      shards,
      shardVelocities,
      isBroken: false,
      breakTimer: 0,
    };

    this.objects.push(obj);
    this.group.add(parent);
  }

  private breakGlass(obj: DestructibleObject) {
    if (obj.isBroken) return;
    obj.isBroken = true;
    obj.collider.isBroken = true;

    // Hide intact pane
    const intact = obj.mesh.getObjectByName('intact');
    if (intact) intact.visible = false;

    // Scatter shards outward
    soundEngine.playGlassShatter();
    obj.shards.forEach((s, idx) => {
      s.visible = true;
      obj.shardVelocities[idx].set(
        (Math.random() - 0.5) * 14,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 14
      );
    });
  }

  private createWoodScaffold(id: string, center: THREE.Vector3, size: THREE.Vector3) {
    const parent = new THREE.Group();
    parent.position.copy(center);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Deep rich oak wood
      roughness: 0.85,
    });

    const shards: THREE.Mesh[] = [];
    const shardVelocities: THREE.Vector3[] = [];

    // Build realistic scaffold beams
    const beamGeom = new THREE.BoxGeometry(0.2, size.y, 0.2);
    const plankGeom = new THREE.BoxGeometry(size.x, 0.15, 0.8);

    // 4 vertical posts
    const postOffsets = [
      [-size.x / 2 + 0.2, 0, -size.z / 2 + 0.2],
      [size.x / 2 - 0.2, 0, -size.z / 2 + 0.2],
      [-size.x / 2 + 0.2, 0, size.z / 2 - 0.2],
      [size.x / 2 - 0.2, 0, size.z / 2 - 0.2],
    ];

    postOffsets.forEach(pos => {
      const post = new THREE.Mesh(beamGeom, woodMat);
      post.position.set(pos[0], pos[1], pos[2]);
      post.castShadow = true;
      parent.add(post);
      shards.push(post);
      shardVelocities.push(new THREE.Vector3());
    });

    // Cross planks at multiple tiers
    for (let t = -size.y / 2 + 2; t < size.y / 2; t += 3) {
      const plank = new THREE.Mesh(plankGeom, woodMat);
      plank.position.set(0, t, 0);
      plank.castShadow = true;
      parent.add(plank);
      shards.push(plank);
      shardVelocities.push(new THREE.Vector3());
    }

    const obj: DestructibleObject = {
      id,
      type: 'wood',
      collider: {
        type: 'destructible',
        center: center.clone(),
        size: size.clone(),
        isBroken: false,
        onBreak: () => {
          this.breakWood(obj);
        },
      },
      mesh: parent,
      shards,
      shardVelocities,
      isBroken: false,
      breakTimer: 0,
    };

    this.objects.push(obj);
    this.group.add(parent);
  }

  private breakWood(obj: DestructibleObject) {
    if (obj.isBroken) return;
    obj.isBroken = true;
    obj.collider.isBroken = true;

    soundEngine.playWoodSnap();
    obj.shards.forEach((s, idx) => {
      obj.shardVelocities[idx].set(
        (Math.random() - 0.5) * 16,
        Math.random() * 10 + 4,
        (Math.random() - 0.5) * 16
      );
    });
  }

  private createLauncher(id: string, center: THREE.Vector3, launchPower: number) {
    const parent = new THREE.Group();
    parent.position.copy(center);

    // Bright high-contrast stunt jump pad with hazard stripes
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber
      roughness: 0.3,
      metalness: 0.6,
    });

    const springGeom = new THREE.CylinderGeometry(1.6, 1.8, 0.6, 16);
    const padMesh = new THREE.Mesh(springGeom, padMat);
    padMesh.castShadow = true;
    parent.add(padMesh);

    // Hazard ring
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.1, 8, 24), ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.32;
    parent.add(ringMesh);

    const obj: DestructibleObject = {
      id,
      type: 'launcher',
      collider: {
        type: 'destructible',
        center: center.clone(),
        size: new THREE.Vector3(3.2, 1.2, 3.2),
        isBroken: false,
        onBreak: () => {
          soundEngine.playLauncherBlast();
        },
      },
      mesh: parent,
      shards: [],
      shardVelocities: [],
      isBroken: false,
      breakTimer: 0,
    };

    this.objects.push(obj);
    this.group.add(parent);
  }

  private createTrafficSystem() {
    const carMatColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];

    for (let i = 0; i < 5; i++) {
      const carGroup = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: carMatColors[i % carMatColors.length],
        roughness: 0.2,
        metalness: 0.8,
      });

      // Car body
      const bodyGeom = new THREE.BoxGeometry(2.2, 0.9, 4.4);
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.6;
      body.castShadow = true;
      carGroup.add(body);

      // Cabin / Roof
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.1 });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2.4), cabinMat);
      cabin.position.set(0, 1.3, -0.2);
      carGroup.add(cabin);

      // Headlights
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
      const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), lightMat);
      hlLeft.position.set(-0.7, 0.6, -2.2);
      const hlRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), lightMat);
      hlRight.position.set(0.7, 0.6, -2.2);
      carGroup.add(hlLeft);
      carGroup.add(hlRight);

      this.group.add(carGroup);

      this.cars.push({
        mesh: carGroup,
        pos: i * 40 - 80,
        speed: 16 + (i % 3) * 4,
        direction: i % 2 === 0 ? 1 : -1,
      });
    }
  }

  public update(dt: number) {
    // 1. Update broken shards physics (gravity & tumbling)
    this.objects.forEach(obj => {
      if (obj.isBroken && obj.shards.length > 0) {
        obj.breakTimer += dt;
        obj.shards.forEach((s, idx) => {
          const vel = obj.shardVelocities[idx];
          vel.y -= 25 * dt; // gravity
          s.position.addScaledVector(vel, dt);
          s.rotation.x += vel.z * dt * 2;
          s.rotation.z += vel.x * dt * 2;

          // Ground bounce/clamp
          if (s.position.y < -obj.mesh.position.y + 0.1) {
            s.position.y = -obj.mesh.position.y + 0.1;
            vel.y *= -0.3;
            vel.x *= 0.6;
            vel.z *= 0.6;
          }
        });
      }
    });

    // 2. Animate traffic cars along highway loop (X from -120 to +120, Z at 45)
    this.cars.forEach(car => {
      car.pos += car.speed * car.direction * dt;
      if (car.direction > 0 && car.pos > 120) car.pos = -120;
      if (car.direction < 0 && car.pos < -120) car.pos = 120;

      const z = car.direction > 0 ? 52 : 46;
      car.mesh.position.set(car.pos, 0, z);
      car.mesh.rotation.y = car.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
    });
  }

  public resetAll() {
    this.objects.forEach(obj => {
      obj.isBroken = false;
      obj.collider.isBroken = false;
      obj.breakTimer = 0;

      const intact = obj.mesh.getObjectByName('intact');
      if (intact) intact.visible = true;

      obj.shards.forEach(s => {
        if (obj.type === 'glass') s.visible = false;
        s.position.set(0, 0, 0);
        s.rotation.set(0, 0, 0);
      });
    });
  }
}
