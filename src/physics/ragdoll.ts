import * as THREE from 'three';
import { BoneState, RagdollPose, ImpactEvent, VehicleType } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

export interface RagdollNode {
  name: string;
  boneId: string;
  pos: THREE.Vector3;
  prevPos: THREE.Vector3;
  acc: THREE.Vector3;
  mass: number;
  radius: number;
  isGrounded: boolean;
}

export interface RagdollConstraint {
  nodeA: number;
  nodeB: number;
  restLength: number;
  stiffness: number;
}

export const INITIAL_BONES: BoneState[] = [
  { id: 'skull', name: 'Cranial Skull & Concussion', category: 'head', isBroken: false, fractureType: 'none', damage: 0, cost: 42000, breakImpulse: 22 },
  { id: 'cervical', name: 'Cervical Neck Vertebrae', category: 'head', isBroken: false, fractureType: 'none', damage: 0, cost: 58000, breakImpulse: 20 },
  { id: 'ribcage', name: 'Sternum & 6 Broken Ribs', category: 'torso', isBroken: false, fractureType: 'none', damage: 0, cost: 18500, breakImpulse: 16 },
  { id: 'spine', name: 'Thoracic & Lumbar Spine', category: 'torso', isBroken: false, fractureType: 'none', damage: 0, cost: 75000, breakImpulse: 24 },
  { id: 'pelvis', name: 'Pelvic Ring & Sacrum', category: 'torso', isBroken: false, fractureType: 'none', damage: 0, cost: 38000, breakImpulse: 21 },
  { id: 'l_clavicle', name: 'Left Clavicle & Humerus', category: 'arms', isBroken: false, fractureType: 'none', damage: 0, cost: 14000, breakImpulse: 14 },
  { id: 'l_radius', name: 'Left Radius & Wrist (Displaced)', category: 'arms', isBroken: false, fractureType: 'none', damage: 0, cost: 9500, breakImpulse: 12 },
  { id: 'r_clavicle', name: 'Right Clavicle & Humerus', category: 'arms', isBroken: false, fractureType: 'none', damage: 0, cost: 14000, breakImpulse: 14 },
  { id: 'r_radius', name: 'Right Radius & Ulna Shatter', category: 'arms', isBroken: false, fractureType: 'none', damage: 0, cost: 9500, breakImpulse: 12 },
  { id: 'l_femur', name: 'Left Femur (Spiral Fracture)', category: 'legs', isBroken: false, fractureType: 'none', damage: 0, cost: 32000, breakImpulse: 20 },
  { id: 'l_tibia', name: 'Left Tibia & Compound Fibula', category: 'legs', isBroken: false, fractureType: 'none', damage: 0, cost: 18000, breakImpulse: 15 },
  { id: 'r_femur', name: 'Right Femur (Compound Fracture)', category: 'legs', isBroken: false, fractureType: 'none', damage: 0, cost: 32000, breakImpulse: 20 },
  { id: 'r_tibia', name: 'Right Tibia & Ankle Dislocation', category: 'legs', isBroken: false, fractureType: 'none', damage: 0, cost: 18000, breakImpulse: 15 },
];

export class RagdollPhysics {
  public nodes: RagdollNode[] = [];
  public constraints: RagdollConstraint[] = [];
  public bones: BoneState[] = JSON.parse(JSON.stringify(INITIAL_BONES));
  public isBailed: boolean = false;
  public currentPose: RagdollPose = 'none';
  public vehicle: VehicleType = 'foot';

  // Standing / Parkour character controller state
  public characterPos: THREE.Vector3 = new THREE.Vector3(0, 5, 0);
  public characterVel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public characterHeading: number = 0; // angle in radians
  public isGrounded: boolean = false;
  public currentAirTime: number = 0;
  public totalFlightDist: number = 0;
  public bailStartPos: THREE.Vector3 = new THREE.Vector3();
  public impactEvents: ImpactEvent[] = [];
  public totalHospitalBill: number = 0;
  public bailScore: number = 0;
  public scoreMultiplier: number = 1.0;
  public bailTimer: number = 0;
  public rotationsCount: number = 0;
  private prevTorsoAngle: number = 0;

  // Visual 3D group
  public meshGroup: THREE.Group = new THREE.Group();
  private boneMeshes: { [key: string]: THREE.Mesh } = {};
  private jointSpheres: THREE.Mesh[] = [];
  private vehicleMeshGroup: THREE.Group = new THREE.Group();

  constructor() {
    this.initRagdollSkeleton();
    this.create3DVisuals();
  }

  /**
   * Defines standard humanoid anatomical nodes & distances
   * 0: Head
   * 1: Neck/Chest
   * 2: Spine/Pelvis
   * 3: L Shoulder
   * 4: L Elbow/Hand
   * 5: R Shoulder
   * 6: R Elbow/Hand
   * 7: L Hip
   * 8: L Knee/Foot
   * 9: R Hip
   * 10: R Knee/Foot
   */
  private initRagdollSkeleton() {
    this.nodes = [
      // 0: Head
      { name: 'Head', boneId: 'skull', pos: new THREE.Vector3(0, 1.75, 0), prevPos: new THREE.Vector3(0, 1.75, 0), acc: new THREE.Vector3(), mass: 4.5, radius: 0.16, isGrounded: false },
      // 1: Chest
      { name: 'Chest', boneId: 'ribcage', pos: new THREE.Vector3(0, 1.35, 0), prevPos: new THREE.Vector3(0, 1.35, 0), acc: new THREE.Vector3(), mass: 18, radius: 0.22, isGrounded: false },
      // 2: Pelvis
      { name: 'Pelvis', boneId: 'pelvis', pos: new THREE.Vector3(0, 0.95, 0), prevPos: new THREE.Vector3(0, 0.95, 0), acc: new THREE.Vector3(), mass: 16, radius: 0.20, isGrounded: false },
      // 3: L Shoulder
      { name: 'L Shoulder', boneId: 'l_clavicle', pos: new THREE.Vector3(-0.35, 1.32, 0), prevPos: new THREE.Vector3(-0.35, 1.32, 0), acc: new THREE.Vector3(), mass: 3, radius: 0.12, isGrounded: false },
      // 4: L Hand
      { name: 'L Hand', boneId: 'l_radius', pos: new THREE.Vector3(-0.65, 0.95, 0), prevPos: new THREE.Vector3(-0.65, 0.95, 0), acc: new THREE.Vector3(), mass: 2.2, radius: 0.11, isGrounded: false },
      // 5: R Shoulder
      { name: 'R Shoulder', boneId: 'r_clavicle', pos: new THREE.Vector3(0.35, 1.32, 0), prevPos: new THREE.Vector3(0.35, 1.32, 0), acc: new THREE.Vector3(), mass: 3, radius: 0.12, isGrounded: false },
      // 6: R Hand
      { name: 'R Hand', boneId: 'r_radius', pos: new THREE.Vector3(0.65, 0.95, 0), prevPos: new THREE.Vector3(0.65, 0.95, 0), acc: new THREE.Vector3(), mass: 2.2, radius: 0.11, isGrounded: false },
      // 7: L Knee
      { name: 'L Knee', boneId: 'l_femur', pos: new THREE.Vector3(-0.20, 0.52, 0), prevPos: new THREE.Vector3(-0.20, 0.52, 0), acc: new THREE.Vector3(), mass: 6.5, radius: 0.13, isGrounded: false },
      // 8: L Foot
      { name: 'L Foot', boneId: 'l_tibia', pos: new THREE.Vector3(-0.22, 0.08, 0), prevPos: new THREE.Vector3(-0.22, 0.08, 0), acc: new THREE.Vector3(), mass: 4.5, radius: 0.12, isGrounded: false },
      // 9: R Knee
      { name: 'R Knee', boneId: 'r_femur', pos: new THREE.Vector3(0.20, 0.52, 0), prevPos: new THREE.Vector3(0.20, 0.52, 0), acc: new THREE.Vector3(), mass: 6.5, radius: 0.13, isGrounded: false },
      // 10: R Foot
      { name: 'R Foot', boneId: 'r_tibia', pos: new THREE.Vector3(0.22, 0.08, 0), prevPos: new THREE.Vector3(0.22, 0.08, 0), acc: new THREE.Vector3(), mass: 4.5, radius: 0.12, isGrounded: false },
    ];

    // Distance links
    const addLink = (a: number, b: number, stiffness: number = 0.95) => {
      const dist = this.nodes[a].pos.distanceTo(this.nodes[b].pos);
      this.constraints.push({ nodeA: a, nodeB: b, restLength: dist, stiffness });
    };

    addLink(0, 1, 0.98); // Head - Chest
    addLink(1, 2, 0.98); // Chest - Pelvis (Spine)
    addLink(1, 3, 0.90); // Chest - L Shoulder
    addLink(3, 4, 0.90); // L Shoulder - L Hand
    addLink(1, 5, 0.90); // Chest - R Shoulder
    addLink(5, 6, 0.90); // R Shoulder - R Hand
    addLink(2, 7, 0.92); // Pelvis - L Knee
    addLink(7, 8, 0.92); // L Knee - L Foot
    addLink(2, 9, 0.92); // Pelvis - R Knee
    addLink(9, 10, 0.92); // R Knee - R Foot

    // Cross stabilizers for realistic torso stiffness
    addLink(3, 5, 0.85); // Clavicle across shoulders
    addLink(3, 2, 0.70); // Cross torso
    addLink(5, 2, 0.70); // Cross torso
    addLink(0, 2, 0.75); // Head to pelvis stiffness
  }

  private create3DVisuals() {
    this.meshGroup.clear();

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.4,
      metalness: 0.2,
    });

    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48, // Vibrant Hall of Meat stunt red
      roughness: 0.5,
      metalness: 0.1,
    });

    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Create limbs capsules
    this.constraints.forEach((c, idx) => {
      const geom = new THREE.CylinderGeometry(0.06, 0.06, c.restLength, 8);
      geom.translate(0, c.restLength / 2, 0);
      geom.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(geom, idx < 2 ? suitMat : skinMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.boneMeshes[`link_${idx}`] = mesh;
      this.meshGroup.add(mesh);
    });

    // Joint spheres (Head, shoulders, knees, hands)
    this.nodes.forEach((n, i) => {
      const isHead = i === 0;
      const isTorso = i === 1 || i === 2;
      const geom = new THREE.SphereGeometry(n.radius, 12, 12);
      const mat = isHead ? helmetMat : isTorso ? suitMat : skinMat;
      const sphere = new THREE.Mesh(geom, mat);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      this.jointSpheres.push(sphere);
      this.meshGroup.add(sphere);
    });

    // Add Skate/Vehicle group
    this.buildVehicleMeshes();
    this.meshGroup.add(this.vehicleMeshGroup);
  }

  private buildVehicleMeshes() {
    this.vehicleMeshGroup.clear();

    // Skateboard
    const deckGeom = new THREE.BoxGeometry(0.32, 0.04, 0.95);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const deckMesh = new THREE.Mesh(deckGeom, deckMat);
    deckMesh.position.set(0, 0.08, 0);
    deckMesh.name = 'deck';

    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Bright yellow wheels
    const wheelPositions = [
      [-0.14, 0.04, 0.35],
      [0.14, 0.04, 0.35],
      [-0.14, 0.04, -0.35],
      [0.14, 0.04, -0.35],
    ];
    wheelPositions.forEach(p => {
      const w = new THREE.Mesh(wheelGeom, wheelMat);
      w.position.set(p[0], p[1], p[2]);
      deckMesh.add(w);
    });

    this.vehicleMeshGroup.add(deckMesh);
  }

  public setVehicle(type: VehicleType) {
    this.vehicle = type;
    this.vehicleMeshGroup.visible = type !== 'foot';

    // Modify vehicle visual appearance if bike/cart
    const deck = this.vehicleMeshGroup.getObjectByName('deck') as THREE.Mesh;
    if (deck) {
      if (type === 'bmx') {
        deck.scale.set(1.2, 2.5, 1.4);
      } else if (type === 'cart') {
        deck.scale.set(2.0, 3.0, 1.8);
      } else {
        deck.scale.set(1, 1, 1);
      }
    }
  }

  /**
   * Triggers Hall of Meat Bail Mode!
   */
  public triggerBail(launchImpulse?: THREE.Vector3) {
    if (this.isBailed) return;
    this.isBailed = true;
    this.bailStartPos.copy(this.characterPos);
    this.bailTimer = 0;
    this.scoreMultiplier = 1.0;
    this.rotationsCount = 0;
    this.prevTorsoAngle = 0;

    soundEngine.playImpactThud(0.8);

    // Transfer standing velocity + impulse to all ragdoll nodes with jitter
    const baseVel = this.characterVel.clone();
    if (launchImpulse) {
      baseVel.add(launchImpulse);
    }

    const dt = 1 / 60;
    this.nodes.forEach(node => {
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3
      );
      node.prevPos.copy(node.pos).sub(baseVel.clone().add(spread).multiplyScalar(dt));
    });
  }

  /**
   * Resets character back to standing at a specific position
   */
  public resetTo(position: THREE.Vector3, heading: number = 0) {
    this.isBailed = false;
    this.currentPose = 'none';
    this.characterPos.copy(position);
    this.characterVel.set(0, 0, 0);
    this.characterHeading = heading;
    this.isGrounded = true;
    this.currentAirTime = 0;
    this.totalFlightDist = 0;
    this.bailScore = 0;
    this.totalHospitalBill = 0;
    this.scoreMultiplier = 1.0;
    this.impactEvents = [];
    this.bones = JSON.parse(JSON.stringify(INITIAL_BONES));

    // Align all nodes relative to character position
    this.nodes.forEach(n => {
      n.pos.addVectors(position, this.getInitialNodeOffset(n.name));
      n.prevPos.copy(n.pos);
      n.acc.set(0, 0, 0);
      n.isGrounded = false;
    });

    this.updateMeshTransforms();
  }

  private getInitialNodeOffset(name: string): THREE.Vector3 {
    switch (name) {
      case 'Head': return new THREE.Vector3(0, 1.75, 0);
      case 'Chest': return new THREE.Vector3(0, 1.35, 0);
      case 'Pelvis': return new THREE.Vector3(0, 0.95, 0);
      case 'L Shoulder': return new THREE.Vector3(-0.35, 1.32, 0);
      case 'L Hand': return new THREE.Vector3(-0.60, 0.95, 0);
      case 'R Shoulder': return new THREE.Vector3(0.35, 1.32, 0);
      case 'R Hand': return new THREE.Vector3(0.60, 0.95, 0);
      case 'L Knee': return new THREE.Vector3(-0.20, 0.52, 0);
      case 'L Foot': return new THREE.Vector3(-0.22, 0.08, 0);
      case 'R Knee': return new THREE.Vector3(0.20, 0.52, 0);
      case 'R Foot': return new THREE.Vector3(0.22, 0.08, 0);
      default: return new THREE.Vector3(0, 1, 0);
    }
  }

  /**
   * Set Iconic Hall of Meat mid-air pose
   */
  public setPose(pose: RagdollPose) {
    if (this.currentPose === pose) return;
    this.currentPose = pose;
    soundEngine.playPoseSwoosh();
  }

  /**
   * Main Physics Step
   */
  public update(
    dt: number,
    input: { x: number; y: number; jump: boolean; sprint: boolean },
    terrainHeightFn: (x: number, z: number) => number,
    obstacleColliders: Array<{
      type: 'box' | 'cylinder' | 'ramp' | 'destructible';
      center: THREE.Vector3;
      size: THREE.Vector3;
      onBreak?: () => void;
      isBroken?: boolean;
    }>
  ) {
    const fixedDt = Math.min(dt, 0.033);

    if (!this.isBailed) {
      // 1. STANDING / RIDING / PARKOUR STATE
      this.updateStandingState(fixedDt, input, terrainHeightFn, obstacleColliders);
    } else {
      // 2. HALL OF MEAT RAGDOLL STATE
      this.updateRagdollState(fixedDt, input, terrainHeightFn, obstacleColliders);
    }

    this.updateMeshTransforms();
  }

  private updateStandingState(
    dt: number,
    input: { x: number; y: number; jump: boolean; sprint: boolean },
    terrainHeightFn: (x: number, z: number) => number,
    obstacleColliders: Array<{ type: string; center: THREE.Vector3; size: THREE.Vector3; onBreak?: () => void }>
  ) {
    const groundY = terrainHeightFn(this.characterPos.x, this.characterPos.z);
    const speedMult = this.vehicle === 'cart' ? 2.5 : this.vehicle === 'bmx' ? 2.2 : this.vehicle === 'skateboard' ? 1.8 : 1.0;
    const baseSpeed = (input.sprint ? 14 : 8) * speedMult;

    // Heading rotation from left/right input
    if (Math.abs(input.x) > 0.05) {
      this.characterHeading -= input.x * 2.8 * dt;
    }

    // Forward/backward drive
    const forward = new THREE.Vector3(-Math.sin(this.characterHeading), 0, -Math.cos(this.characterHeading));
    const targetVelX = forward.x * input.y * baseSpeed;
    const targetVelZ = forward.z * input.y * baseSpeed;

    // Smooth acceleration
    const accel = this.isGrounded ? 12 : 3;
    this.characterVel.x += (targetVelX - this.characterVel.x) * accel * dt;
    this.characterVel.z += (targetVelZ - this.characterVel.z) * accel * dt;

    // Gravity
    this.characterVel.y -= 25 * dt;

    // Jump / Ollie
    if (input.jump && this.isGrounded) {
      const jumpPower = this.vehicle === 'bmx' ? 14 : this.vehicle === 'skateboard' ? 12 : 9.5;
      this.characterVel.y = jumpPower;
      this.isGrounded = false;
      soundEngine.playJump(this.vehicle);
    }

    // Apply movement
    this.characterPos.addScaledVector(this.characterVel, dt);

    // Ground check
    if (this.characterPos.y <= groundY) {
      this.characterPos.y = groundY;
      // High fall impact check -> automatic bail!
      if (this.characterVel.y < -16) {
        this.triggerBail();
        return;
      }
      this.characterVel.y = 0;
      this.isGrounded = true;
      this.currentAirTime = 0;
    } else {
      this.isGrounded = false;
      this.currentAirTime += dt;
    }

    // Check collision with obstacles while riding -> crash bail!
    obstacleColliders.forEach(obs => {
      const dist = this.characterPos.distanceTo(obs.center);
      if (dist < (obs.size.x + obs.size.z) * 0.35) {
        if (Math.abs(this.characterPos.y - obs.center.y) < obs.size.y) {
          if (this.characterVel.length() > 4) {
            if (obs.onBreak) obs.onBreak();
            this.triggerBail(new THREE.Vector3(0, 6, 0));
          }
        }
      }
    });

    // Sync ragdoll nodes to follow character smoothly
    const rotMat = new THREE.Matrix4().makeRotationY(this.characterHeading);
    this.nodes.forEach(n => {
      const offset = this.getInitialNodeOffset(n.name).clone().applyMatrix4(rotMat);
      n.pos.addVectors(this.characterPos, offset);
      n.prevPos.copy(n.pos);
    });
  }

  private updateRagdollState(
    dt: number,
    input: { x: number; y: number },
    terrainHeightFn: (x: number, z: number) => number,
    obstacleColliders: Array<{
      type: 'box' | 'cylinder' | 'ramp' | 'destructible';
      center: THREE.Vector3;
      size: THREE.Vector3;
      onBreak?: () => void;
      isBroken?: boolean;
    }>
  ) {
    this.bailTimer += dt;
    this.currentAirTime += dt;

    // Gravity & Air Steering Forces
    const gravity = new THREE.Vector3(0, -22, 0);
    const steerForce = new THREE.Vector3(-input.x * 12, 0, -input.y * 12);

    // Track rotations around torso
    const chestPos = this.nodes[1].pos;
    const pelvisPos = this.nodes[2].pos;
    const currentAngle = Math.atan2(chestPos.y - pelvisPos.y, chestPos.z - pelvisPos.z);
    this.rotationsCount += Math.abs(currentAngle - this.prevTorsoAngle) / (Math.PI * 2);
    this.prevTorsoAngle = currentAngle;

    // 1. Verlet Integration
    this.nodes.forEach(node => {
      node.acc.copy(gravity);
      node.acc.add(steerForce);

      // Apply air pose spring tensions
      this.applyPoseForces(node);

      const vel = node.pos.clone().sub(node.prevPos).multiplyScalar(0.985); // 0.985 air friction
      node.prevPos.copy(node.pos);
      node.pos.add(vel).addScaledVector(node.acc, dt * dt);
      node.acc.set(0, 0, 0);
    });

    // 2. Solve Constraints (Distance & Body Stiffness) - 5 iterations for stability
    for (let iter = 0; iter < 5; iter++) {
      this.constraints.forEach(c => {
        const nodeA = this.nodes[c.nodeA];
        const nodeB = this.nodes[c.nodeB];
        const delta = nodeB.pos.clone().sub(nodeA.pos);
        const dist = delta.length();
        if (dist === 0) return;

        // Target length can shift based on current pose (e.g. cannonball tucks limbs closer)
        let targetLength = c.restLength;
        if (this.currentPose === 'cannonball') {
          // Tucked
          targetLength = c.restLength * 0.65;
        } else if (this.currentPose === 'spread_eagle') {
          targetLength = c.restLength * 1.15;
        }

        const diff = (dist - targetLength) / dist;
        const totalMass = nodeA.mass + nodeB.mass;
        const factorA = (nodeB.mass / totalMass) * c.stiffness * 0.5;
        const factorB = (nodeA.mass / totalMass) * c.stiffness * 0.5;

        nodeA.pos.addScaledVector(delta, diff * factorA);
        nodeB.pos.addScaledVector(delta, -diff * factorB);
      });

      // 3. Collision with Terrain & Hard Surfaces
      this.nodes.forEach(node => {
        const groundY = terrainHeightFn(node.pos.x, node.pos.z);
        if (node.pos.y - node.radius < groundY) {
          const impactSpeed = (node.prevPos.y - node.pos.y) / dt;
          node.pos.y = groundY + node.radius;

          // Friction on contact with ground
          const vx = (node.pos.x - node.prevPos.x) * 0.75;
          const vz = (node.pos.z - node.prevPos.z) * 0.75;
          node.prevPos.x = node.pos.x - vx;
          node.prevPos.z = node.pos.z - vz;

          // Check Bone Fracture Impulse
          if (impactSpeed > 7.5) {
            this.handleBoneImpact(node, impactSpeed);
          }
          node.isGrounded = true;
        } else {
          node.isGrounded = false;
        }

        // Collision with Obstacles & Destructibles
        obstacleColliders.forEach(obs => {
          if (obs.isBroken) return;
          const dx = Math.abs(node.pos.x - obs.center.x);
          const dy = Math.abs(node.pos.y - obs.center.y);
          const dz = Math.abs(node.pos.z - obs.center.z);

          const hx = obs.size.x / 2;
          const hy = obs.size.y / 2;
          const hz = obs.size.z / 2;

          if (dx < hx + node.radius && dy < hy + node.radius && dz < hz + node.radius) {
            // Impact!
            const vel = node.pos.clone().sub(node.prevPos).divideScalar(dt);
            const speed = vel.length();

            // Destructible trigger (shatter glass, collapse scaffolding, blow barrel)
            if (obs.type === 'destructible' && obs.onBreak) {
              obs.onBreak();
              this.scoreMultiplier += 0.5;
              this.bailScore += 5000;
            }

            // Bounce impulse
            node.pos.y = obs.center.y + hy + node.radius + 0.1;
            node.prevPos.y = node.pos.y + 0.2;

            if (speed > 8) {
              this.handleBoneImpact(node, speed);
            }
          }
        });
      });
    }

    // Update center position for camera tracking
    this.characterPos.copy(this.nodes[1].pos);
    const avgVel = this.nodes[1].pos.clone().sub(this.nodes[1].prevPos).divideScalar(dt);
    this.characterVel.copy(avgVel);

    // Update flight distance & stats
    this.totalFlightDist = this.bailStartPos.distanceTo(this.characterPos);
    this.bailScore += Math.floor(avgVel.length() * 12 * this.scoreMultiplier);
  }

  private applyPoseForces(node: RagdollNode) {
    if (this.currentPose === 'cannonball') {
      // Pull hands and feet inwards toward pelvis
      const center = this.nodes[2].pos;
      const toCenter = center.clone().sub(node.pos).normalize().multiplyScalar(15);
      node.acc.add(toCenter);
    } else if (this.currentPose === 'spread_eagle') {
      // Push limbs out laterally
      if (node.name.includes('L Hand') || node.name.includes('L Foot')) {
        node.acc.x -= 20;
      } else if (node.name.includes('R Hand') || node.name.includes('R Foot')) {
        node.acc.x += 20;
      }
    } else if (this.currentPose === 'torpedo') {
      // Streamline limbs
      if (node.name.includes('Hand')) {
        node.acc.y -= 15;
      }
    } else if (this.currentPose === 'judo_kick') {
      // Front dropkick
      if (node.name.includes('R Foot')) {
        node.acc.z -= 35;
        node.acc.y += 18;
      }
    }
  }

  private handleBoneImpact(node: RagdollNode, speed: number) {
    const bone = this.bones.find(b => b.id === node.boneId);
    if (!bone) return;

    const kineticEnergy = 0.5 * node.mass * (speed * speed);
    const damageToAdd = Math.min(100, Math.floor(kineticEnergy / 18));
    bone.damage = Math.min(100, bone.damage + damageToAdd);

    if (bone.damage >= 50 && !bone.isBroken) {
      bone.isBroken = true;
      bone.fractureType = bone.damage > 85 ? 'shattered' : bone.damage > 65 ? 'compound' : 'fracture';
      this.totalHospitalBill += bone.cost;
      this.scoreMultiplier += 0.4;
      this.bailScore += bone.cost * 1.5;

      soundEngine.playBoneSnap(bone.damage > 80 ? 'shatter' : 'heavy');
      soundEngine.playKaChing();

      this.impactEvents.push({
        id: Date.now() + Math.random(),
        boneName: bone.name,
        force: Math.round(speed * 3.6), // km/h
        bill: bone.cost,
        position: [node.pos.x, node.pos.y, node.pos.z],
        timestamp: Date.now(),
      });
    } else {
      soundEngine.playImpactThud(Math.min(1, speed / 20));
    }
  }

  private updateMeshTransforms() {
    // 1. Update limb capsule orientations and lengths
    this.constraints.forEach((c, idx) => {
      const mesh = this.boneMeshes[`link_${idx}`];
      if (!mesh) return;

      const pA = this.nodes[c.nodeA].pos;
      const pB = this.nodes[c.nodeB].pos;
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      const dir = pB.clone().sub(pA);
      const len = dir.length();

      mesh.position.copy(mid);
      if (len > 0.001) {
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
        mesh.scale.set(1, 1, len / c.restLength);
      }

      // If either joint is broken, tint bone mesh with pulsating injury glow
      const boneA = this.bones.find(b => b.id === this.nodes[c.nodeA].boneId);
      const boneB = this.bones.find(b => b.id === this.nodes[c.nodeB].boneId);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if ((boneA && boneA.isBroken) || (boneB && boneB.isBroken)) {
        mat.emissive.setHex(0xdc2626);
        mat.emissiveIntensity = 0.6;
      } else {
        mat.emissive.setHex(0x000000);
      }
    });

    // 2. Update joint spheres
    this.nodes.forEach((n, idx) => {
      const sphere = this.jointSpheres[idx];
      if (sphere) {
        sphere.position.copy(n.pos);
      }
    });

    // 3. Update vehicle position
    if (!this.isBailed && this.vehicle !== 'foot') {
      this.vehicleMeshGroup.position.copy(this.characterPos);
      this.vehicleMeshGroup.rotation.y = this.characterHeading;
    } else if (this.isBailed && this.vehicle !== 'foot') {
      // Vehicle rolls away during bail
      this.vehicleMeshGroup.position.lerp(this.nodes[8].pos, 0.1);
    }
  }

  public getBrokenCount(): number {
    return this.bones.filter(b => b.isBroken).length;
  }
}
