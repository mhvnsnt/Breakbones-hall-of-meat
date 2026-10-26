export type VehicleType = 'foot' | 'skateboard' | 'bmx' | 'cart';

export type RagdollPose = 
  | 'none'
  | 'cannonball'
  | 'spread_eagle'
  | 'torpedo'
  | 'judo_kick'
  | 'flying_squirrel'
  | 'meat_hook';

export interface BoneState {
  id: string;
  name: string;
  category: 'head' | 'torso' | 'arms' | 'legs';
  isBroken: boolean;
  fractureType: 'none' | 'hairline' | 'fracture' | 'compound' | 'shattered';
  damage: number; // 0 to 100
  cost: number;
  breakImpulse: number;
}

export interface StuntStats {
  score: number;
  hospitalBill: number;
  brokenBonesCount: number;
  maxAirTime: number;
  currentAirTime: number;
  maxSpeed: number;
  currentSpeed: number;
  fallDistance: number;
  multiplier: number;
  rotations: number;
  crackedBonesList: string[];
}

export interface ImpactEvent {
  id: number;
  boneName: string;
  force: number;
  bill: number;
  position: [number, number, number];
  timestamp: number;
}

export interface StuntSpot {
  id: string;
  name: string;
  tagline: string;
  difficulty: 'Easy' | 'Medium' | 'Extreme' | 'Insane';
  heightMeters: number;
  spawnPosition: [number, number, number];
  spawnRotation: number;
  description: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetBill: number;
  targetBones: number;
  targetAirtime: number;
  completed: boolean;
  rewardPoints: number;
}
