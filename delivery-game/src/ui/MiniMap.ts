import * as THREE from 'three';
import { City, CITY_SIZE, BLOCK, ROAD_W, GRID } from '../world/City';
import { Mission } from '../gameplay/Mission';

export class MiniMap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private size = 230;

  // World extends from -halfSize to +halfSize — we map to canvas.
  private halfWorld = CITY_SIZE / 2;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d')!;
  }

  private wx2cx(x: number): number {
    return (x + this.halfWorld) / (this.halfWorld * 2) * this.size;
  }
  private wz2cy(z: number): number {
    return (z + this.halfWorld) / (this.halfWorld * 2) * this.size;
  }

  draw(city: City, mission: Mission, carPos: THREE.Vector3, carHeading: number, fuelLow: boolean) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.size, this.size);

    // Background (grass)
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, this.size, this.size);

    // Roads (horizontal + vertical lines)
    ctx.strokeStyle = '#3a3a3f';
    const roadWidthPx = (ROAD_W / (this.halfWorld * 2)) * this.size;
    ctx.lineWidth = Math.max(2, roadWidthPx);
    for (let i = 0; i <= GRID; i++) {
      const c = -this.halfWorld + ROAD_W / 2 + i * (BLOCK + ROAD_W);
      // horizontal road at z=c
      ctx.beginPath();
      ctx.moveTo(0, this.wz2cy(c));
      ctx.lineTo(this.size, this.wz2cy(c));
      ctx.stroke();
      // vertical road at x=c
      ctx.beginPath();
      ctx.moveTo(this.wx2cx(c), 0);
      ctx.lineTo(this.wx2cx(c), this.size);
      ctx.stroke();
    }

    // Office (green square)
    const op = city.getOfficeDropoff();
    ctx.fillStyle = '#4eff8a';
    ctx.fillRect(this.wx2cx(op.x) - 4, this.wz2cy(op.z) - 4, 8, 8);
    ctx.strokeStyle = '#2a9a50';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.wx2cx(op.x) - 4, this.wz2cy(op.z) - 4, 8, 8);

    // Gas stations (orange pump icon)
    for (const g of [city.getGasPump(0), city.getGasPump(1)]) {
      ctx.fillStyle = '#ff8833';
      ctx.beginPath();
      ctx.arc(this.wx2cx(g.x), this.wz2cy(g.z), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0e1a';
      ctx.font = 'bold 7px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⛽', this.wx2cx(g.x), this.wz2cy(g.z) + 0.5);
    }

    // Employee houses (yellow triangles)
    for (const e of mission.employees) {
      if (e.picked) continue;
      const cx = this.wx2cx(e.homePos.x);
      const cy = this.wz2cy(e.homePos.z);
      ctx.fillStyle = '#ffcc33';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx + 4, cy + 4);
      ctx.lineTo(cx - 4, cy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#886600';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Player (blue circle + heading arrow)
    const pcx = this.wx2cx(carPos.x);
    const pcy = this.wz2cy(carPos.z);
    ctx.fillStyle = '#4aa8ff';
    ctx.beginPath();
    ctx.arc(pcx, pcy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0088dd';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // heading triangle
    ctx.save();
    ctx.translate(pcx, pcy);
    ctx.rotate(carHeading);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(3, -4);
    ctx.lineTo(-3, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Arrow toward current objective
    const target = mission.currentObjectivePos(carPos, fuelLow);
    const dx = target.x - carPos.x;
    const dz = target.z - carPos.z;
    const ang = Math.atan2(dx, dz);
    const dist = Math.hypot(dx, dz);
    // Place arrow at fixed radius around player on minimap
    const radius = this.size * 0.38;
    const ax = pcx + Math.sin(ang) * radius;
    const ay = pcy + Math.cos(ang) * radius;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.fillStyle = fuelLow ? '#ff8833' : (mission.activeEmployeeIndex() < 0 ? '#4eff8a' : '#ffcc33');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 6);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    // Distance label near arrow
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(dist)}m`, ax + Math.sin(ang) * 18, ay + Math.cos(ang) * 18 + 3);
  }
}
