'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const js=fs.readFileSync('manager.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('manage.html','utf8');
for(const id of ['m-create','m-create-email','m-create-name','m-create-rns','m-create-manager',
'm-create-rns-access','m-create-manager-access',
'm-create-verified','m-create-submit','m-create-secret','m-create-copy','m-create-dismiss']){
 assert.ok(js.includes('id="'+id+'"')||js.includes('el("'+id+'")'),'Missing direct create UI '+id);
}
assert.match(js,/edge\\("manage","create",\\{email,display_name,rns_role,manager_unit,rns_access,manager_access,email_verified_by_admin:true\\}\\)/);
assert.ok(js.includes('clearCreatedSecret();'),'One-time password must be erasable');
assert.ok(!js.includes('option value="ADMIN"'),'Do not expose Manager ADMIN in quick create');
assert.match(app,/import\("\.\/manager\.js\?v=gh4-create"\)/);
assert.ok(html.includes('app.js?v=gh5-independent-access'));
assert.ok(app.includes('rns_must_change_password===true'),'First login must force changing temporary password');
assert.ok(js.includes("QUYỀN 2 ỨNG DỤNG")&&js.includes("XÓA TÀI KHOẢN"),'Dual-app control and deletion UI');
assert.ok(js.includes("delete_account")&&js.includes("set_app_access"),'Both sensitive actions require backend validation');
console.log('PASS: independent grants, restricted account deletion and one-time credential');
