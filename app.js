"use strict";
const RNS=(()=>{
const API="https://ivixjhwghprfxdtaupxc.supabase.co";
const KEY="sb_publishable_St8XpAnKgrRm9ItpWmwQXQ_micQk6zm";
const STORAGE="sagscxr_rns_session_v1";
const root=document.getElementById("app");
const page=document.body.dataset.view||"library";
let session=null,user=null,member=null,lock=false;
const el=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const fmt=x=>x?new Date(x).toLocaleString("vi-VN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"Không có hạn";
const normal=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase();
const safeUrl=x=>{try{const y=new URL(x);return y.protocol==="https:"?y.href:"#";}catch{return "#";}};
const note=(text,kind="")=>'<div class="notice '+kind+'">'+esc(text)+'</div>';
const button=(text,cls="")=>'<button type="button" class="btn '+cls+'">'+esc(text)+'</button>';
function failMessage(err){return String(err?.message||err||"Có lỗi không xác định.");}
function clean(){sessionStorage.removeItem(STORAGE);session=null;user=null;member=null;}
function isAuthError(x,status){const v=String(x?.error_code||x?.code||x?.error||"").toLowerCase(),m=String(x?.msg||x?.message||"");return status===401&&/session|jwt|token|unauthorized|login/i.test(m+" "+v)||v==="session_not_found"||/session from session_id claim in jwt does not exist/i.test(m);}
async function refresh(){
 if(!session?.access_token)throw Error("Phiên đăng nhập không tồn tại.");
 let exp=0;try{exp=JSON.parse(atob(session.access_token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))).exp*1000;}catch{}
 if(exp>Date.now()+65000)return;
 if(!session.refresh_token){clean();throw Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");}
 const response=await fetch(API+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:session.refresh_token}),cache:"no-store"});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.access_token){clean();throw Error("Phiên đăng nhập cũ không còn hợp lệ. Vui lòng đăng nhập lại.");}
 session={...session,access_token:data.access_token,refresh_token:data.refresh_token||session.refresh_token};
 sessionStorage.setItem(STORAGE,JSON.stringify(session));
}
async function request(path,{method="GET",body,headers={},needAuth=true}={}){
 if(needAuth)await refresh();
 const h={apikey:KEY,...headers};
 if(body!==undefined&&!(body instanceof Uint8Array)&&!(body instanceof ArrayBuffer))h["Content-Type"]="application/json";
 if(needAuth)h.Authorization="Bearer "+session.access_token;
 const r=await fetch(API+path,{method,headers:h,body:body===undefined?undefined:body instanceof Uint8Array||body instanceof ArrayBuffer?body:JSON.stringify(body),cache:"no-store"});
 const data=await r.json().catch(()=>({}));
 if(!r.ok){
  if(needAuth&&isAuthError(data,r.status)){clean();throw Error("Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.");}
  throw Error(data.message||data.msg||data.error_description||data.error||"Máy chủ trả về HTTP "+r.status);
 }
 return data;
}
const edge=(name,action,data={},opt={})=>request("/functions/v1/sagscxr-rns-"+name+(name==="attachments"?"?action="+encodeURIComponent(action):""),{method:"POST",body:name==="attachments"?data:{action,...data},...opt});
const rest=(table,params)=>request("/rest/v1/"+table+"?"+params);
const admin=()=>member?.active===true&&member?.role==="admin";
function nav(active){
 return '<nav class="nav"><a href="index.html" class="back">← QUAY LẠI THƯ VIỆN</a>'+
 '<a href="index.html" class="'+(active==="library"?"active":"")+'">VĂN BẢN</a>'+
 '<a href="read-sign.html" class="'+(active==="read-sign"?"active":"")+'">READ & SIGN</a>'+
 (admin()?'<a href="manage.html" class="'+(active==="manage"?"active":"")+'">QUẢN LÝ TÀI KHOẢN</a>':'')+
 '<button type="button" class="logout" id="logout">ĐĂNG XUẤT</button></nav>';
}
function shell(active,title,sub){
 root.innerHTML=nav(active)+
 '<section class="hero"><small>PHÒNG ĐIỀU HÀNH · SAGS-CXR</small><h1>'+title+'</h1><p>'+esc(sub)+'</p></section>'+
 '<div id="screen"></div><p class="footer">SAGSCXR-RNS · GITHUB PAGES · Dữ liệu lưu trên SUPABASE</p>';
 el("logout").onclick=()=>{clean();location.assign("index.html");};
 return el("screen");
}
function login(msg=""){
 root.innerHTML='<div class="auth"><section class="card"><small class="badge">BẢO MẬT TÀI KHOẢN</small><h1>Đăng nhập SAGSCXR-RNS</h1><p>Đăng nhập bằng tài khoản được ADMIN cấp. Dữ liệu nghiệp vụ được bảo vệ bởi Supabase.</p>'+
 '<form id="login" class="form"><label>Email tài khoản</label><input type="email" id="email" autocomplete="username" required placeholder="nhanvien@example.com"><label>Mật khẩu</label><input type="password" id="password" autocomplete="current-password" required><button type="submit" class="btn primary full" id="login-btn">ĐĂNG NHẬP</button><div id="login-info">'+(msg?note(msg,"fail"):"")+'</div></form>'+
 '<p class="hint">Quên mật khẩu? Liên hệ ADMIN để nhận email đặt lại hoặc mật khẩu tạm.</p></section></div>';
 el("login").onsubmit=async event=>{
  event.preventDefault();el("login-btn").disabled=true;
  try{
   const result=await request("/auth/v1/token?grant_type=password",{method:"POST",needAuth:false,body:{email:el("email").value.trim(),password:el("password").value}});
   if(!result.access_token)throw Error("Máy chủ không trả về phiên đăng nhập.");
   session={access_token:result.access_token,refresh_token:result.refresh_token,email:el("email").value.trim()};
   sessionStorage.setItem(STORAGE,JSON.stringify(session));
   await start();
  }catch(e){el("login-info").innerHTML=note(failMessage(e),"fail");}
  finally{const b=el("login-btn");if(b)b.disabled=false;}
 };
}
function changePassword(isLink=false){
 const username=user?.email||session?.email||"";
 root.innerHTML='<div class="auth"><div class="card"><span class="badge">XÁC THỰC TÀI KHOẢN</span><h1>'+(isLink?"Đặt mật khẩu qua email":"Bắt buộc đổi mật khẩu")+'</h1><p>'+esc(username)+'</p>'+
 '<p>'+(isLink?"Đặt mật khẩu mới để tiếp tục.":"ADMIN đã cấp mật khẩu tạm. Phải đặt mật khẩu cá nhân trước khi sử dụng hệ thống.")+'</p>'+
 '<form id="change" class="form"><label>Mật khẩu mới (từ 8 ký tự)</label><input type="password" id="new-pass" autocomplete="new-password" minlength="8" required><label>Nhập lại mật khẩu</label><input type="password" id="confirm-pass" autocomplete="new-password" minlength="8" required><button type="submit" id="change-btn" class="btn primary full">LƯU MẬT KHẨU MỚI</button><div id="change-msg"></div></form></div></div>';
 el("change").onsubmit=async e=>{
  e.preventDefault();
  const pw=el("new-pass").value,pwc=el("confirm-pass").value;
  if(pw.length<8||pw!==pwc){el("change-msg").innerHTML=note("Mật khẩu phải dài ít nhất 8 ký tự và hai lần nhập trùng nhau.","fail");return;}
  el("change-btn").disabled=true;
  try{
   if(!isLink&&user?.app_metadata?.rns_must_change_password)await edge("password","change",{password:pw,password_confirm:pwc});
   else await request("/auth/v1/user",{method:"PUT",body:{password:pw}});
   const email=username;
   clean();
   login("Mật khẩu đã được lưu. Vui lòng đăng nhập lại bằng mật khẩu mới.");
   el("email").value=email;
  }catch(err){el("change-msg").innerHTML=note(failMessage(err),"fail");}
  finally{const b=el("change-btn");if(b)b.disabled=false;}
 };
}
async function start(){
 try{
  user=await request("/auth/v1/user");
  if(!user?.id)throw Error("Không nhận được thông tin đăng nhập.");
  if(user.app_metadata?.rns_must_change_password===true){changePassword(false);return;}
  const rows=await rest("sags_docs_members","select=user_id,role,active,display_name&user_id=eq."+encodeURIComponent(user.id)+"&limit=1");
  member=rows[0]||null;
  if(!member?.active)throw Error("Tài khoản chưa được ADMIN kích hoạt.");
  if(page==="manage"&&!admin()){root.innerHTML=note("Chỉ ADMIN được truy cập Quản lý tài khoản.","fail")+'<a href="index.html">← QUAY LẠI</a>';return;}
  if(page==="manage")await import("./manager.js?v=gh1").then(m=>m.default(window.RNS));
  else if(page==="read-sign")await import("./readsign.js?v=gh1").then(m=>m.default(window.RNS));
  else await import("./library.js?v=gh1").then(m=>m.default(window.RNS));
 }catch(e){clean();login(failMessage(e));}
}
async function init(){
 try{
  const hash=new URLSearchParams(location.hash.slice(1));
  if(hash.has("access_token")&&hash.has("refresh_token")&&["invite","recovery"].includes(hash.get("type"))){
   session={access_token:hash.get("access_token"),refresh_token:hash.get("refresh_token"),email:""};
   sessionStorage.setItem(STORAGE,JSON.stringify(session));
   history.replaceState(null,"",location.pathname);
   user=await request("/auth/v1/user");
   changePassword(true);return;
  }
  const saved=sessionStorage.getItem(STORAGE);
  if(saved){session=JSON.parse(saved);await start();return;}
  login();
 }catch(err){clean();login(failMessage(err));}
}
const api={API,KEY,el,esc,fmt,normal,safeUrl,note,button,request,rest,edge,admin,shell,nav,login,changePassword,get user(){return user;},get member(){return member;}};
window.RNS=api;
void init();
return api;
})();
