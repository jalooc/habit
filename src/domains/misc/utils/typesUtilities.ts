export type GeneralizeConst<T> = T extends number ? number :
  T extends string ? string :
    T extends boolean ? boolean :
      T extends (...args: never[]) => unknown ? T :
        { [K in keyof T]: GeneralizeConst<T[K]> }
