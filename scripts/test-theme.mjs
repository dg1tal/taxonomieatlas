import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../dist/theme.js',import.meta.url),'utf8');
function setup({saved=null,dark=false,blocked=false}={}){
 const events={},media={matches:dark,addEventListener:(name,fn)=>events.media=fn},buttons=['system','light','dark'].map(value=>({dataset:{themeChoice:value},attrs:{},setAttribute(name,value){this.attrs[name]=value;},addEventListener(name,fn){events[value]=fn;}})),root={dataset:{}},meta={};let stored=saved;
 const context={document:{documentElement:root,querySelector:()=>meta,querySelectorAll:()=>buttons,addEventListener:(name,fn)=>events.ready=fn},window:{matchMedia:()=>media,addEventListener:(name,fn)=>events.storage=fn},localStorage:{getItem(){if(blocked)throw Error('blocked');return stored;},setItem(k,v){if(blocked)throw Error('blocked');stored=v;}}};
 vm.runInNewContext(source,context);return {events,media,buttons,root,meta,stored:()=>stored};
}
let s=setup({dark:true});assert.equal(s.root.dataset.theme,'dark');s.events.ready();assert.equal(s.buttons[0].attrs['aria-pressed'],'true');s.media.matches=false;s.events.media();assert.equal(s.root.dataset.theme,'light');s.events.dark();assert.equal(s.stored(),'dark');s.events.media();assert.equal(s.root.dataset.theme,'dark');assert.equal(s.meta.content,'#141c18');
s=setup({saved:'light',dark:true});assert.equal(s.root.dataset.theme,'light');s.events.storage({key:'taxonomy-theme',newValue:'dark'});assert.equal(s.root.dataset.theme,'dark');s.events.storage({key:null,newValue:null});assert.equal(s.root.dataset.themePreference,'system');
s=setup({saved:'invalid',dark:false});assert.equal(s.root.dataset.theme,'light');s=setup({blocked:true,dark:true});s.events.ready();s.events.light();assert.equal(s.root.dataset.theme,'light');
assert.deepEqual(s.buttons.map(b=>b.attrs['aria-pressed']),['false','true','false']);
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert.ok(!html.includes('theme-select'));
for(const label of ['System','Hell','Dunkel'])assert.ok(html.includes(`aria-label="${label}"`));
const luminance=hex=>{const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const bg of ['#141c18','#1c2821','#243329','#304938'])for(const fg of ['#e1eae0','#b2c1b5'])assert.ok(ratio(bg,fg)>=4.5,`${fg} on ${bg}`);
assert.ok(ratio('#f2fff4','#37664c')>=4.5);
console.log('PASS: System theme, early initialization, explicit overrides, persistent selection, OS change, cross-tab sync, invalid preferences, blocked storage, primary/secondary text contrast >= 4.5:1.');
