export function vector3_distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
export function vector3_subtract(b,a) {
    a.x = b.x - a.x;
    a.y = b.y - a.y;
    a.z = b.z - a.z;
    return a;
}
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
  }
  
  normalized() {
    const magnitude = this.magnitude();
    return new Vector3(this.x / magnitude, this.y / magnitude, this.z / magnitude);
  }
  magnitude() {
    return Math.sqrt(this.x*this.x + this.y * this.y + this.z*this.z);
  }
}
