export type DailyTheme={readonly id:string;readonly date:string;readonly name:string;readonly emblem:string;readonly message:string};
export const DAILY_THEMES:readonly DailyTheme[];
export function dailyThemeIndex(now?:number):number;
export function previewSeconds(index:number):number;
