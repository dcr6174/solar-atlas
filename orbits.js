// NASA JPL SSD, Approximate Positions of the Planets, Tables 2a and 2b.
// https://ssd.jpl.nasa.gov/planets/approx_pos.html
// [a (AU), eccentricity, inclination, mean longitude, perihelion, node (degrees)].
import { DAY } from './timeline.js';
export { DAY, MIN_DATE, MAX_DATE, parseDate } from './timeline.js';
const R = Math.PI / 180;
export const planets = [
 {id:'mercury',name:'Mercury',kind:'Terrestrial planet',color:'#b3a59b',radius:0.44,displayOrbit:8,diameter:4879,period:87.969,rotation:58.646,tilt:0.03,texture:'2k_mercury.jpg',description:'A small, crater-covered world that races around the Sun in just 88 Earth days.',fact:'A solar day on Mercury lasts about two of its years.',base:[.38709843,.20563661,7.00559432,252.25166724,77.45771895,48.33961819],rate:[0,.00002123,-.00590158,149472.67486623,.15940013,-.12214182]},
 {id:'venus',name:'Venus',kind:'Terrestrial planet',color:'#dbc28a',radius:.73,displayOrbit:11.5,diameter:12104,period:224.701,rotation:-243.025,tilt:2.64,texture:'2k_venus_atmosphere.jpg',description:'Wrapped in thick clouds, Venus is a rocky world with an intense greenhouse effect.',fact:'Venus spins in the opposite direction to most planets.',base:[.72332102,.00676399,3.39777545,181.97970850,131.76755713,76.67261496],rate:[-.00000026,-.00005107,.00043494,58517.81560260,.05679648,-.27274174]},
 {id:'earth',name:'Earth',kind:'Terrestrial planet',color:'#7eb7f5',radius:.77,displayOrbit:15.5,diameter:12742,period:365.256,rotation:.99727,tilt:23.44,texture:'2k_earth_daymap.jpg',description:'Our ocean-covered home. The only world currently known to support life.',fact:'Sunlight takes about 8 minutes and 20 seconds to reach Earth.',base:[1.00000018,.01673163,-.00054346,100.46691572,102.93005885,-5.11260389],rate:[-.00000003,-.00003661,-.01337178,35999.37306329,.31795260,-.24123856]},
 {id:'mars',name:'Mars',kind:'Terrestrial planet',color:'#df8266',radius:.58,displayOrbit:20.5,diameter:6779,period:686.98,rotation:1.02596,tilt:25.19,texture:'2k_mars.jpg',description:'A cold desert world with rusty-red soil, enormous volcanoes, and traces of ancient rivers.',fact:'Olympus Mons is the tallest known volcano in the solar system.',base:[1.52371243,.09336511,1.85181869,-4.56813164,-23.91744784,49.71320984],rate:[.00000097,.00009149,-.00724757,19140.29934243,.45223625,-.26852431]},
 {id:'jupiter',name:'Jupiter',kind:'Gas giant',color:'#d9b49a',radius:2.35,displayOrbit:31,diameter:139820,period:4332.59,rotation:.41354,tilt:3.13,texture:'2k_jupiter.jpg',description:'The largest planet: a swirling world of cloud bands, powerful storms, and a vast magnetic field.',fact:'Its Great Red Spot is a giant storm that has raged for centuries.',base:[5.20248019,.04853590,1.29861416,34.33479152,14.27495244,100.29282654],rate:[-.00002864,.00018026,-.00322699,3034.90371757,.18199196,.13024619],extra:[-.00012452,.06064060,-.35635438,38.35125]},
 {id:'saturn',name:'Saturn',kind:'Gas giant',color:'#dfc594',radius:1.98,displayOrbit:43,diameter:116460,period:10759.22,rotation:.444,tilt:26.73,texture:'2k_saturn.jpg',description:'A pale-gold gas giant surrounded by a spectacular system of rings made mostly of ice.',fact:'Saturn has a lower average density than water.',base:[9.54149883,.05550825,2.49424102,50.07571329,92.86136063,113.63998702],rate:[-.00003065,-.00032044,.00451969,1222.11494724,.54179478,-.25015002],extra:[.00025899,-.13434469,.87320147,38.35125]},
 {id:'uranus',name:'Uranus',kind:'Ice giant',color:'#8ecdd0',radius:1.3,displayOrbit:56,diameter:50724,period:30688.5,rotation:-.71833,tilt:82.23,texture:'2k_uranus.jpg',description:'A quiet-looking blue-green ice giant with an extreme tilt, rolling through its orbit on its side.',fact:'Its unusual tilt gives Uranus exceptionally long seasons.',base:[19.18797948,.04685740,.77298127,314.20276625,172.43404441,73.96250215],rate:[-.00020455,-.00001550,-.00180155,428.49512595,.09266985,.05739699],extra:[.00058331,-.97731848,.17689245,7.67025]},
 {id:'neptune',name:'Neptune',kind:'Ice giant',color:'#7098e8',radius:1.25,displayOrbit:70,diameter:49244,period:60182,rotation:.67125,tilt:28.32,texture:'2k_neptune.jpg',description:'A distant ice giant swept by fierce winds, orbiting at the edge of the planetary realm.',fact:'Neptune takes about 165 Earth years to travel around the Sun.',base:[30.06952752,.00895439,1.77005520,304.22289287,46.68158724,131.78635853],rate:[.00006447,.00000818,.00022400,218.46515314,.01009938,-.00606302],extra:[-.00041348,.68346318,-.10162547,7.67025]}
];
export function elements(planet, milliseconds) {
 const T = (milliseconds / DAY + 2440587.5 - 2451545) / 36525;
 const [a,e,I,L,p,N] = planet.base.map((v,i)=>v+planet.rate[i]*T);
 const [b,c,s,f] = planet.extra || [0,0,0,0];
 const m = L-p+b*T*T+c*Math.cos(f*T*R)+s*Math.sin(f*T*R);
 return {a,e,I:I*R,w:(p-N)*R,N:N*R,M:((m%360+540)%360-180)*R};
}
export function position(planet,milliseconds,eccentricAnomaly) {
 const {a,e,I,w,N,M} = elements(planet,milliseconds);
 let E = eccentricAnomaly;
 if(E===undefined){E=M;for(let k=0;k<12;k++){const delta=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=delta;if(Math.abs(delta)<1e-12)break;}}
 const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E);
 const cw=Math.cos(w),sw=Math.sin(w),cn=Math.cos(N),sn=Math.sin(N),ci=Math.cos(I),si=Math.sin(I);
 return [(cw*cn-sw*sn*ci)*x+(-sw*cn-cw*sn*ci)*y,(cw*sn+sw*cn*ci)*x+(-sw*sn+cw*cn*ci)*y,sw*si*x+cw*si*y];
}
