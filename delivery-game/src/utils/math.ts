import * as THREE from 'three';

export const DEG = Math.PI / 180;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const randRange = (a: number, b: number) => a + Math.random() * (b - a);
export const randInt = (a: number, b: number) => Math.floor(randRange(a, b + 1));

export function distance2(a: THREE.Vector3, b: THREE.Vector3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function angleBetween(ax: number, az: number, bx: number, bz: number): number {
  return Math.atan2(bz - az, bx - ax);
}

export function smoothDampAngle(
  current: number,
  target: number,
  velocity: { v: number },
  smoothTime: number,
  dt: number
): number {
  // Normalize difference to [-PI, PI]
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  const omega = 2 / Math.max(0.0001, smoothTime);
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = delta;
  const temp = (velocity.v + omega * change) * dt;
  velocity.v = (velocity.v - omega * temp) * exp;
  return current + (change - change * exp) + temp * exp;
}
