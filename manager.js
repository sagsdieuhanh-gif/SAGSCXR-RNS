export default async function manage(R){
 const {el,esc,fmt,note,edge,shell}=R;
 const screen=shell("manage","Quản lý <em>tài khoản</em>","Cấp quyền VIEWER, gửi email mời và đặt lại mật khẩu an toàn cho nhân viên.");
 screen.innerHTML='<div class="stats"><div class="stat"><label>TỔNG TÀI KHOẢN</label><strong id="m-total">—</strong></div><div class="stat"><label>ADMIN</label><strong id="m-admin">—</strong></div><div class="stat"><label>VIEWER ĐANG DÙNG</label><strong id="m-viewer">—</strong></div><div class="stat"><label>CHỜ XÁC MINH</label><strong id="m-pending">—</strong></div></div>'+
 '<div class="columns"><div class="stack"><section class="card"><h2>Mời nhân viên mới</h2><form id="m-invite" class="form"><label>Email nhân viên</label><input type="email" id="m-email" required placeholder="nhanvien@example.com"><button class="btn primary" type="submit">GỬI EMAIL MỜI</button><div id="m-invite-info"></div></form><p class="hint">Nhân viên nhận email mời, tạo mật khẩu, sau đó ADMIN kích hoạt quyền truy cập.</p></section><section class="card"><h2>Tìm tài khoản</h2><div class="form"><input id="m-search" class="search" type="search" placeholder="Tìm theo email hoặc tên nhân viên"><select id="m-filter"><option value="">TẤT CẢ</option><option value="active">ĐANG HOẠT ĐỘNG</option><option value="pending">CHỜ XÁC MINH</option><option value="inactive">ĐÃ KHÓA</option></select><button class="btn" id="m-refresh">↻ LÀM MỚI</button></div></section></div>'+
 '<section class="card"><div class="inline"><h2>Danh sách nhân viên</h2><span class="badge push" id="m-showing">—</span></div><div id="m-list"></div></section></div>'+
 '<div id="m-modal" class="overlay" hidden><div class="modal"><div class="inline"><h2>ĐẶT LẠI MẬT KHẨU</h2><button class="btn sm push" id="m-close">ĐÓNG ×</button></div><p class="hint" id="m-user"></p><div class="divider"></div><p class="hint">Chọn một phương án. Hệ thống luôn yêu cầu xác nhận trước khi thực hiện.</p><div class="doc"><span class="icon">✉</span><div class="details"><strong>Gửi email đặt lại mật khẩu</strong><small>Nhân viên tự đặt mật khẩu mới theo liên kết nhận được.</small></div><button class="btn sm" id="m-email-reset">GỬI EMAIL</button></div><div class="doc"><span class="icon">🔑</span><div class="details"><strong>Cấp mật khẩu tạm</strong><small>Tạo mã ngẫu nhiên một lần; nhân viên phải đổi sau đăng nhập.</small></div><button class="btn primary sm" id="m-temp-reset">CẤP MÃ</button></div><div id="m-secret-box" hidden><label>MẬT KHẨU TẠM (CHỈ HIỂN THỊ MỘT LẦN)</label><div class="inline"><input id="m-secret" type="text" readonly><button id="m-copy" class="btn">SAO CHÉP</button></div><p class="hint">Gửi mã riêng cho đúng nhân viên, không gửi vào nhóm công khai.</p></div><div id="m-feedback"></div></div></div>';
 let users=[],target=null,acting=false;
 const list=el("m-list");
 function stats(){
  el("m-total").textContent=users.length;
  el("m-admin").textContent=users.filter(x=>x.role==="admin"&&x.active).length;
  el("m-viewer").textContent=users.filter(x=>x.role==="viewer"&&x.active).length;
  el("m-pending").textContent=users.filter(x=>!x.email_confirmed_at).length;
 }
 function render(){
  const q=R.normal(el("m-search").value),f=el("m-filter").value;
  const matches=users.filter(u=>(!q||R.normal((u.email||"")+" "+(u.display_name||"")).includes(q))&&(!f||f==="active"&&u.email_confirmed_at&&u.active||f==="pending"&&!u.email_confirmed_at||f==="inactive"&&u.email_confirmed_at&&!u.active));
  el("m-showing").textContent=matches.length+" / "+users.length;
  list.innerHTML=matches.length?matches.map(u=>{
   const state=!u.email_confirmed_at?'<span class="badge warn">CHƯA XÁC MINH</span>':u.active?'<span class="badge ok">ĐANG HOẠT ĐỘNG</span>':'<span class="badge fail">ĐÃ KHÓA</span>';
   return '<div class="item"><div><strong>'+esc(u.email)+'</strong><small>'+esc(u.display_name||"")+' · '+esc((u.role||"CHƯA CẤP").toUpperCase())+' · '+esc(fmt(u.last_sign_in_at))+'</small><div style="margin-top:8px">'+state+'</div></div><div class="inline">'+
    (u.email_confirmed_at&&u.role!=="admin"?'<button class="btn sm" data-access="'+esc(u.id)+'">'+(u.active?"KHÓA":"KÍCH HOẠT")+'</button>':'')+
    (u.email_confirmed_at&&u.active&&u.role==="viewer"?'<button class="btn sm" data-reset="'+esc(u.id)+'">ĐẶT LẠI MẬT KHẨU</button>':'')+
    '</div></div>';
  }).join(""):'<div class="empty">Không có tài khoản phù hợp.</div>';
  list.querySelectorAll("[data-access]").forEach(b=>b.onclick=()=>setAccess(b.dataset.access));
  list.querySelectorAll("[data-reset]").forEach(b=>b.onclick=()=>openModal(b.dataset.reset));
 }
 async function load(){
  const result=await edge("manage","list");users=result.users||[];stats();render();
 }
 async function setAccess(id){
  const u=users.find(x=>x.id===id);if(!u)return;
  const value=!u.active;
  if(!confirm((value?"KÍCH HOẠT":"KHÓA")+" TÀI KHOẢN?\n\n"+u.email))return;
  try{await edge("manage","set_access",{user_id:u.id,active:value});await load();}
  catch(err){alert("Không thể cập nhật: "+err.message);}
 }
 function openModal(id){
  target=users.find(x=>x.id===id);if(!target)return;
  el("m-user").textContent=target.email;el("m-modal").hidden=false;el("m-secret-box").hidden=true;el("m-secret").value="";el("m-feedback").innerHTML="";
 }
 function closeModal(){if(acting)return;el("m-modal").hidden=true;target=null;el("m-secret").value="";el("m-secret-box").hidden=true;}
 async function reset(method){
  if(!target||acting)return;
  const tmp=method==="temp_reset";
  if(!confirm((tmp?"CẤP MẬT KHẨU TẠM":"GỬI EMAIL ĐẶT LẠI MẬT KHẨU")+"?\n\n"+target.email+"\n\n"+(tmp?"Mật khẩu cũ sẽ ngừng sử dụng.":"Mật khẩu hiện tại chưa bị thay đổi.")))return;
  acting=true;el("m-email-reset").disabled=true;el("m-temp-reset").disabled=true;el("m-feedback").innerHTML=note("Đang xử lý...");
  try{
   const data=await edge("password",method,{user_id:target.id,confirm:true});
   if(tmp){if(!data.temporary_password)throw Error("Máy chủ chưa trả về mật khẩu tạm.");el("m-secret").value=data.temporary_password;el("m-secret-box").hidden=false;}
   el("m-feedback").innerHTML=note(tmp?"Đã cấp mật khẩu tạm. Sao chép và chuyển riêng cho nhân viên.":"Supabase đã nhận yêu cầu gửi email đặt lại mật khẩu.","ok");
  }catch(err){el("m-feedback").innerHTML=note("Thao tác không thành công: "+err.message,"fail");}
  finally{acting=false;el("m-email-reset").disabled=false;el("m-temp-reset").disabled=false;}
 }
 el("m-invite").onsubmit=async e=>{
  e.preventDefault();const email=el("m-email").value.trim();if(!confirm("GỬI LỜI MỜI CHO\n"+email+"?"))return;
  try{await edge("manage","invite",{email});el("m-invite-info").innerHTML=note("Đã gửi yêu cầu mời tài khoản "+email,"ok");el("m-email").value="";await load();}
  catch(err){el("m-invite-info").innerHTML=note(err.message,"fail");}
 };
 el("m-search").oninput=render;el("m-filter").onchange=render;
 el("m-refresh").onclick=()=>load().catch(err=>alert(err.message));
 el("m-close").onclick=closeModal;
 el("m-email-reset").onclick=()=>reset("email_reset");
 el("m-temp-reset").onclick=()=>reset("temp_reset");
 el("m-modal").onclick=e=>{if(e.target===el("m-modal"))closeModal();};
 el("m-copy").onclick=async()=>{try{await navigator.clipboard.writeText(el("m-secret").value);el("m-feedback").innerHTML=note("Đã sao chép mật khẩu tạm.","ok");}catch{el("m-secret").select();}};
 try{await load();}catch(err){list.innerHTML=note("Không tải được tài khoản: "+err.message,"fail");}
}
