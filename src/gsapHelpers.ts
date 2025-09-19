import { gsap } from 'gsap';

// Animate panel height between auto and a minimized fixed height.
export function animatePanelHeight(wrapper: HTMLElement, minimized: boolean, headerHeight = 42) {
  const current = wrapper.getBoundingClientRect().height;
  if (minimized) {
    gsap.to(wrapper, { height: headerHeight, duration: 0.32, ease: 'power2.inOut' });
  } else {
    // Measure natural height by setting to auto temporarily.
    wrapper.style.height = 'auto';
    const target = wrapper.getBoundingClientRect().height;
    wrapper.style.height = current + 'px';
    gsap.to(wrapper, { height: target, duration: 0.42, ease: 'power2.out', onComplete: () => { wrapper.style.height = 'auto'; } });
  }
}

// Generic stagger-in for concept detail elements.
export function staggerIn(elements: HTMLElement[]) {
  if (!elements.length) return;
  gsap.from(elements, { opacity: 0, y: 14, duration: 0.55, ease: 'power3.out', stagger: 0.06 });
}

// Pulse numeric metric value on significant change.
export function pulseMetric(el: HTMLElement) {
  gsap.fromTo(el, { scale: 1 }, { scale: 1.18, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 });
}

// Placeholder camera tween hook (to be wired with Three.js scene objects when needed).
export function tweenVector(object: { position: { x: number; y: number; z: number } }, to: { x: number; y: number; z: number }, duration = 1.1) {
  gsap.to(object.position, { x: to.x, y: to.y, z: to.z, ease: 'power3.inOut', duration });
}
