export type Unmount = () => void | Promise<void>;

export interface TMountable<T, Args extends unknown[]> {
  mount(...args: Args): Promise<Unmount>;
  get(): T;
}

export interface TMountResult<T> {
  unmount?: Unmount;
  value: T;
}

export function mountable<T, Args extends unknown[]>(
  mount: (...args: Args) => Promise<TMountResult<T>> | TMountResult<T>,
): TMountable<T, Args> {
  let mounted: null | { unmount?: Unmount; value: T } = null;
  return {
    async mount(...args) {
      if (mounted !== null) {
        throw new Error("Already mounted");
      }
      mounted = await mount(...args);
      return async () => {
        if (mounted === null) {
          throw new Error("Not mounted");
        }
        if (mounted.unmount) {
          await mounted.unmount();
        }
        mounted = null;
      };
    },
    get() {
      if (mounted === null) {
        throw new Error("Not mounted");
      }
      return mounted.value;
    },
  };
}
