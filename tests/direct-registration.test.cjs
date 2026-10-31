'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const js=fs.readFileSync('manager.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('manage.html','utf8');
for(const id of ['m-create','m-create-email','m-create-name','m-create-rns','m-create-manager',
'm-create-verified','m-create-submit','m-create-secret','m-create-copy','m-create-dismiss']){
 assert.ok(js.includes('id="'+id+'"')||js.includes('el("'+id+'")'),'Missing direct create UI '+id);
}
assert.match(js,/edge\("manage","create",\{email,display_name,rns_role,manager_unit,email_verified_by_admin:true\}\)/);
assert.ok(js.includes('clearCreatedSecret();'),'One-time password must be erasable');
assert.ok(!js.includes('option value="ADMIN"'),'Do not expose Manager ADMIN in quick create');
assert.match(app,/import\("\.\/manager\.js\?v=gh4-create"\)/);
assert.ok(html.includes('app.js?v=gh4-create'));
assert.ok(app.includes('rns_must_change_password===true'),'First login must force changing temporary password');
console.log('PASS: RNS direct account creation shares Manager Auth with scoped immediate roles and one-time credential');
