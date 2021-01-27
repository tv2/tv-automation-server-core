export declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export interface ObjId {
    _id: string;
}
export declare type OmitId<T> = Omit<T & ObjId, '_id'>;
export declare type UnwrapArray<T> = T extends any[] ? T[0] : never;
export declare type CombineArrayType<T, T2> = (UnwrapArray<T> & T2)[];
