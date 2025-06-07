declare module "memoizee" {
  function memoize<T extends (...args: any[]) => any>(
    fn: T,
    options?: {
      maxAge?: number;
      promise?: boolean;
      length?: number;
      primitive?: boolean;
      normalizer?: (args: any[]) => string;
      resolvers?: Array<(value: any) => any>;
      max?: number;
    },
  ): T;

  export = memoize;
}
