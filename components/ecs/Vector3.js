export class Vector3 {
    constructor(x=0,y=0,z=0) {
        this.x=x;
        this.y=y;
        this.z=z;
    }
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
    }
}