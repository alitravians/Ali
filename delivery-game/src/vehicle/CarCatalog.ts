export interface CarSpec {
  id: string;
  name: string;
  nameAr: string;
  color: number;
  bodyW: number;  // width (X)
  bodyH: number;  // height (Y)
  bodyL: number;  // length (Z)
  wheelBase: number; // distance between front and rear axles
  wheelRadius: number;
  wheelWidth: number;
  maxSpeedKmh: number;
  accel: number;        // m/s^2
  brake: number;        // m/s^2
  turnRate: number;     // rad/s
  fuelConsumption: number; // fuel units per second at full throttle
  cabinColor?: number;
  capacity: number;     // passengers
}

export const CAR_CATALOG: CarSpec[] = [
  {
    id: 'hatch',
    name: 'City Hatch',
    nameAr: 'سيارة صغيرة',
    color: 0xff5544,
    bodyW: 1.8, bodyH: 1.25, bodyL: 3.6,
    wheelBase: 2.3, wheelRadius: 0.35, wheelWidth: 0.3,
    maxSpeedKmh: 110, accel: 6.0, brake: 16.0, turnRate: 1.4,
    fuelConsumption: 0.9, capacity: 2,
  },
  {
    id: 'sedan',
    name: 'Family Sedan',
    nameAr: 'سيارة سيدان',
    color: 0x336bc8,
    bodyW: 1.95, bodyH: 1.35, bodyL: 4.5,
    wheelBase: 2.7, wheelRadius: 0.38, wheelWidth: 0.32,
    maxSpeedKmh: 140, accel: 7.5, brake: 18.0, turnRate: 1.25,
    fuelConsumption: 1.2, capacity: 3,
  },
  {
    id: 'suv',
    name: 'Urban SUV',
    nameAr: 'سيارة دفع رباعي',
    color: 0x2f3e46,
    bodyW: 2.15, bodyH: 1.75, bodyL: 4.8,
    wheelBase: 2.85, wheelRadius: 0.42, wheelWidth: 0.36,
    maxSpeedKmh: 130, accel: 7.0, brake: 17.0, turnRate: 1.15,
    fuelConsumption: 1.6, capacity: 4,
  },
  {
    id: 'minivan',
    name: 'Minivan',
    nameAr: 'عائلية (ميني فان)',
    color: 0xd8d4c6,
    bodyW: 2.15, bodyH: 1.85, bodyL: 5.1,
    wheelBase: 3.0, wheelRadius: 0.4, wheelWidth: 0.34,
    maxSpeedKmh: 120, accel: 6.5, brake: 17.0, turnRate: 1.1,
    fuelConsumption: 1.8, capacity: 5,
  },
  {
    id: 'minibus',
    name: 'Mini Bus',
    nameAr: 'ميني باص',
    color: 0xf0b040,
    bodyW: 2.3, bodyH: 2.1, bodyL: 6.0,
    wheelBase: 3.4, wheelRadius: 0.45, wheelWidth: 0.4,
    maxSpeedKmh: 115, accel: 5.5, brake: 16.0, turnRate: 0.95,
    fuelConsumption: 2.2, capacity: 6,
  },
  {
    id: 'pickup',
    name: 'Pickup Pro',
    nameAr: 'بيك أب متطور',
    color: 0x333333,
    bodyW: 2.2, bodyH: 1.9, bodyL: 5.4,
    wheelBase: 3.1, wheelRadius: 0.44, wheelWidth: 0.4,
    maxSpeedKmh: 145, accel: 8.5, brake: 19.0, turnRate: 1.2,
    fuelConsumption: 2.0, capacity: 4,
  },
];

export function pickCarForStage(stage: number): CarSpec {
  // Stages 1-2 hatch, 3-4 sedan, 5-6 suv, 7-8 minivan, 9 minibus, 10+ pickup
  if (stage <= 2) return CAR_CATALOG[0];
  if (stage <= 4) return CAR_CATALOG[1];
  if (stage <= 6) return CAR_CATALOG[2];
  if (stage <= 8) return CAR_CATALOG[3];
  if (stage === 9) return CAR_CATALOG[4];
  return CAR_CATALOG[5];
}
