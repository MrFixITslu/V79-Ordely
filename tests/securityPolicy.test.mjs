import test from 'node:test';
import assert from 'node:assert/strict';
import {secretForEnvironment,validateSelfRegistration,allowDemoSeed} from '../server/securityPolicy.ts';

test('production must reject missing or known-short JWT credentials',()=>{
 for(const secret of [undefined,'','supersecret_ordely_key','12345678901234567890']) {
   assert.throws(()=>secretForEnvironment(secret,true),/JWT_SECRET/);
 }
 assert.equal(secretForEnvironment('synthetic-long-random-looking-secret-32-plus-bytes',true).length>32,true);
});
test('public registration cannot mint admin, empty-password or malformed-email accounts',()=>{
 const good={name:'Synthetic User',email:'owner@example.invalid',password:'synthetic-strong-passphrase',role:'vendor'};
 assert.equal(validateSelfRegistration(good),true);
 for(const bad of [
   {...good,role:'admin'}, {...good,password:''}, {...good,password:'password123'},
   {...good,email:'a b@example.invalid'}, {...good,email:'invalid'}, {...good,name:''}
 ])assert.equal(validateSelfRegistration(bad),false);
});
test('demo seed is opt-in outside production only',()=>{
 assert.equal(allowDemoSeed(true,'1'),false);
 assert.equal(allowDemoSeed(false,'1'),true);
 assert.equal(allowDemoSeed(false,undefined),false);
});
