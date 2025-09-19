declare module 'gsap' {
  interface GSAPTweenVars { [key:string]: unknown }
  interface GSAPTimeline { to(targets: any, vars: GSAPTweenVars, position?: any): GSAPTimeline }
  interface GSAPStatic {
    to(targets: any, vars: GSAPTweenVars): any;
    fromTo(targets:any, fromVars:GSAPTweenVars, toVars:GSAPTweenVars): any;
    set(targets:any, vars:GSAPTweenVars): void;
    timeline(vars?:GSAPTweenVars): GSAPTimeline;
  }
  export const gsap: GSAPStatic;
  export default gsap;
}