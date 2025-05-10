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
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
  set(vector) {
    this.x = vector.x;
    this.y = vector.y;
    this.z = vector.z;
  }
  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
  }
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
  }
  
  normalize() {
    const magnitude = this.magnitude();
    this.x /= magnitude;
    this.y /= magnitude;
    this.z /= magnitude;
  }
  magnitude() {
    return Math.sqrt(this.x*this.x + this.y * this.y + this.z*this.z);
  }
  isZero() {
    return this.x == 0 && this.y == 0 && this.z == 0; 
  }
  /**
   * Rotates this vector by the given quaternion.
   * @param {{ x:number, y:number, z:number, w:number }} q
   * @returns {Vector3} this
   */
  applyQuaternion(q) {
    const { x, y, z } = this;
    const { x: qx, y: qy, z: qz, w: qw } = q;

    // quaternion * vector
    const ix =  qw * x + qy * z - qz * y;
    const iy =  qw * y + qz * x - qx * z;
    const iz =  qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    // result = (quat * vec) * conj(quat)
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return this;
  }
}
