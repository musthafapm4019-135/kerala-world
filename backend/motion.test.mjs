import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpile(readFileSync(new URL('../app/motion.ts',import.meta.url),'utf8'),{module:ts.ModuleKind.ESNext});
const {interpolate}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('remote movement advances evenly between packets and takes the short rotation path',()=>{
 const samples=[{at:0,x:0,y:0,z:0,angle:3.1},{at:200,x:4,y:10,z:8,angle:-3.1}];
 assert.equal(interpolate(samples,50).x,1);assert.equal(interpolate(samples,100).x,2);assert.equal(interpolate(samples,150).x,3);assert(Math.abs(interpolate(samples,100).angle-Math.PI)<.001);
 assert.equal(interpolate(samples,10000).x,7);assert.equal(interpolate(samples,-10).x,0);
});
