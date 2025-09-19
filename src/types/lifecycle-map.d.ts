declare module './components/LifecycleMap' {
  import { FC } from 'react';
  interface LifecycleMapProps { focus: string | null; onSelect?: (key:string)=>void }
  const LifecycleMap: FC<LifecycleMapProps>;
  export default LifecycleMap;
}