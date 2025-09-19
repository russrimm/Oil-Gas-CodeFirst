declare module 'gsap' {
  export interface GSAPCore {
    to(target: unknown, vars: Record<string, unknown>): unknown;
    from(target: unknown, vars: Record<string, unknown>): unknown;
    fromTo(target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>): unknown;
  }
  export const gsap: GSAPCore;
  export default gsap;
}