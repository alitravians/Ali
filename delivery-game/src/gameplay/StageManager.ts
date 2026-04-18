import { pickCarForStage, type CarSpec } from '../vehicle/CarCatalog';

export interface StageConfig {
  num: number;
  employees: number;
  distanceLabel: string;   // "short" / "medium" / ...
  gasPricePerLiter: number;
  car: CarSpec;
  traffic: number;         // 0..1
  pedestrians: number;     // 0..1
  timeLimit: number;       // seconds (soft — affects score)
  night: boolean;
}

export function buildStage(num: number): StageConfig {
  const pedBase = Math.min(0.5 + num * 0.05, 1);
  const trafBase = Math.min(0.3 + num * 0.08, 1);
  return {
    num,
    employees: Math.min(1 + Math.floor(num * 0.7), 6),
    distanceLabel: num <= 2 ? 'قصيرة' : num <= 4 ? 'متوسطة' : num <= 7 ? 'طويلة' : 'جداً طويلة',
    gasPricePerLiter: 10 + (num - 1) * 4,
    car: pickCarForStage(num),
    traffic: trafBase,
    pedestrians: pedBase,
    timeLimit: 150 + num * 40,
    night: num >= 6 && num % 2 === 0, // some stages at night
  };
}
