export declare type Time = number;
export interface IBlueprintConfig {
    [key: string]: ConfigItemValue;
}
export declare type ConfigItemValue = BasicConfigItemValue | TableConfigItemValue | IBlueprintConfig;
export declare type TableConfigItemValue = {
    _id: string;
    [key: string]: BasicConfigItemValue;
}[];
export declare type BasicConfigItemValue = string | number | boolean | string[];
