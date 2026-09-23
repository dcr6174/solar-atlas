// Calendar years use astronomical numbering internally: 1 BCE is year 0.
export const DAY=86400000;
export const MAX_AGE=4_540_000_000;
export function utcDate(year,month=1,day=1){const d=new Date(0);d.setUTCHours(0,0,0,0);d.setUTCFullYear(year,month-1,day);return d.getTime();}
export const MIN_DATE=utcDate(-9999,1,1); // 10,000 BCE
export const MAX_DATE=utcDate(10000,12,31);
export const JPL_MIN=utcDate(-2999,1,1); // 3000 BCE
export const JPL_MAX=utcDate(3000,12,31);
export const START_AGE=(Date.now()-MIN_DATE)/DAY/365.2425;
export const PIVOT=65000;
const pad=(number,width)=>String(number).padStart(width,'0');
export function formatDate(timestamp){const d=new Date(timestamp),y=d.getUTCFullYear(),era=y<=0?'BCE':'CE';return `${pad(y<=0?1-y:y,4)}-${pad(d.getUTCMonth()+1,2)}-${pad(d.getUTCDate(),2)} ${era}`;}
export function dateKey(timestamp){return formatDate(timestamp).replace(' ','-');}
export function parseDate(input){
 const match=/^(\d{1,5})-(\d{2})-(\d{2})(?:[ -](BCE|BC|CE|AD))?$/i.exec(String(input||'').trim());if(!match)return null;
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),bce=/^(BCE|BC)$/i.test(match[4]||'');
 if(year<1||year>10000||month<1||month>12||day<1||day>31)return null;
 const astronomical=bce?1-year:year,instant=utcDate(astronomical,month,day),date=new Date(instant);
 return date.getUTCFullYear()===astronomical&&date.getUTCMonth()===month-1&&date.getUTCDate()===day&&instant>=MIN_DATE&&instant<=MAX_DATE?instant:null;
}
export function formatAge(age){return age>=1e9?`${+(age/1e9).toFixed(2)} billion years ago`:age>=1e6?`${+(age/1e6).toFixed(1)} million years ago`:`${Math.round(age).toLocaleString('en-US')} years ago`;}
export function sliderToTime(position){const point=Math.max(0,Math.min(100000,Number(position)));if(point<PIVOT){const ratio=point/PIVOT;return {age:START_AGE*Math.pow(MAX_AGE/START_AGE,1-ratio),date:null};}return {age:null,date:MIN_DATE+(MAX_DATE-MIN_DATE)*(point-PIVOT)/(100000-PIVOT)};}
export function timeToSlider(date,age){if(age!==null)return Math.max(0,Math.min(PIVOT,PIVOT*(1-Math.log(age/START_AGE)/Math.log(MAX_AGE/START_AGE))));return PIVOT+(date-MIN_DATE)/(MAX_DATE-MIN_DATE)*(100000-PIVOT);}
export function eraLabel(age){if(age===null)return '';if(age>4e9)return 'Earth forms';if(age>2.5e9)return 'Early Earth';if(age>541e6)return 'Ancient oceans and life';if(age>66e6)return 'Complex life';if(age>2.6e6)return 'Life diversifies';return 'Recent Earth history';}
