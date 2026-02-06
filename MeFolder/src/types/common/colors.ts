export interface ColorValue {
  hex: string;      
  rgb: {            
    r: number;      
    g: number;      
    b: number;      
  };
  hsl?: {           
    h: number;      
    s: number;    
    l: number;    
  };
}

export type SystemColorName = 
  | 'red' | 'blue' | 'green' | 'yellow' | 'purple' 
  | 'orange' | 'pink' | 'cyan' | 'gray' | 'black';


export interface ColorPalette {
  system: Record<SystemColorName, ColorValue>;
  custom: ColorValue[];
}

export interface ColorInfo extends ColorValue {
  name?: string;
  isSystem: boolean;
  systemName?: SystemColorName;
}