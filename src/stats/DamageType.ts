export const enum DamageType {
    //max types is 31
    Generic = 0,
    Miss = 1 << 0,
    Crit = 1 << 1,
    Physical = 1 << 2, // if this bit is 0, its magical damage
}