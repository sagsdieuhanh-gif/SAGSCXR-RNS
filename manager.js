export default async function manage(R){
 const {el,esc,fmt,note,edge,shell}=R;
 const screen=shell("manage","Quản lý <em>tài khoản</em>","Cấp quyền VIEWER, gửi email mời và đặt lại mật khẩu an toàn cho nhân viên.");
 screen.innerHTML='<div class="stats"><div class="stat"><label>TỔNG TÀI KHOẢN</label><strong id="m-total">—</strong></div><div class="stat"><label>ADMIN</label><strong id="m-admin">—</strong></div><div class="stat"><label>VIEWER ĐANG DÙNG</label><strong id="m-viewer">—</strong></div><div class="stat"><label>CHỜ XÁC MINH</label><strong id="m-pending">—</strong></div></div>'+
 '<div class="columns"><div class="stack"><section class="card"><h2>Mời nhân viên mới</h2><form id="m-invite" class="form"><label>Email nhân viên</label><input type="email" id="m-email" required placeholder="nhanvien@example.com"><button class="btn primary" id="m-invite-send" type="submit">GỬI EMAIL MỜI QUA SUPABASE</button><div id="m-invite-info"></div></form><p class="hint">Dịch vụ Supabase chỉ xác nhận đã tiếp nhận yêu cầu, không xác nhận thư đã vào Inbox. Nếu không nhận được, sử dụng LINK MỜI để gửi riêng bằng email/Zalo.</p></section><section class="card"><h2>Tìm tài khoản</h2><div class="form"><input id="m-search" class="search" type="search" placeholder="Tìm theo email hoặc tên nhân viên"><select id="m-filter"><option value="">TẤT CẢ</option><option value="active">ĐANG HOẠT ĐỘNG</option><option value="pending">CHỜ XÁC MINH</option><option value="inactive">ĐÃ KHÓA</option></select><button class="btn" id="m-refresh">↻ LÀM MỚI</button></div></section></div>'+
 '<section class="card"><div class="inline"><h2>Danh sách nhân viên</h2><span class="badge push" id="m-showing">—</span></div><div id="m-list"></div></section></div>'+
 '<div id="m-link-modal" class="overlay" hidden><div class="modal"><div class="inline"><h2>LIÊN KẾT MỜI NHÂN VIÊN</h2><button class="btn sm push" id="m-link-close">ĐÓNG ×</button></div><p class="hint" id="m-link-user"></p><div class="notice">Liên kết này thay email mời và chứa mã đăng nhập một lần. Chỉ gửi riêng cho đúng nhân viên qua Zalo hoặc kênh cá nhân đáng tin cậy. Không đăng lên nhóm chung.</div><div class="form"><label>LINK XÁC MINH & TẠO MẬT KHẨU</label><textarea id="m-link-url" readonly rows="4" autocomplete="off" spellcheck="false"></textarea><button class="btn primary full" id="m-link-copy" type="button">SAO CHÉP LINK MỜI</button><button class="btn full" id="m-link-email" type="button">✉ MỞ EMAIL ĐỂ GỬI LINK MỜI</button></div><p id="m-link-note" class="hint">Mã chỉ hiển thị trong cửa sổ này và có thời hạn.</p></div></div>'+
 '<div id="m-modal" class="overlay" hidden><div class="modal"><div class="inline"><h2>ĐẶT LẠI MẬT KHẨU</h2><button class="btn sm push" id="m-close">ĐÓNG ×</button></div><p class="hint" id="m-user"></p><div class="divider"></div><p class="hint">Chọn một phương án. Hệ thống luôn yêu cầu xác nhận trước khi thực hiện.</p><div class="doc"><span class="icon">✉</span><div class="details"><strong>Gửi email đặt lại mật khẩu</strong><small>Nhân viên tự đặt mật khẩu mới theo liên kết nhận được.</small></div><button class="btn sm" id="m-email-reset">GỬI EMAIL</button></div><div class="doc"><span class="icon">🔑</span><div class="details"><strong>Cấp mật khẩu tạm</strong><small>Tạo mã ngẫu nhiên một lần; nhân viên phải đổi sau đăng nhập.</small></div><button class="btn primary sm" id="m-temp-reset">CẤP MÃ</button></div><div id="m-secret-box" hidden><label>MẬT KHẨU TẠM (CHỈ HIỂN THỊ MỘT LẦN)</label><div class="inline"><input id="m-secret" type="text" readonly><button id="m-copy" class="btn">SAO CHÉP</button></div><p class="hint">Gửi mã riêng cho đúng nhân viên, không gửi vào nhóm công khai.</p></div><div id="m-feedback"></div></div></div>';
 let users=[],target=null,acting=false,invitePending=false;
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
    (!u.email_confirmed_at&&u.invited_at?'<button class="btn primary sm" data-link="'+esc(u.id)+'">LẤY LINK MỜI</button>':'')+
    (u.email_confirmed_at&&u.role!=="admin"?'<button class="btn sm" data-access="'+esc(u.id)+'">'+(u.active?"KHÓA":"KÍCH HOẠT")+'</button>':'')+
    (u.email_confirmed_at&&u.active&&u.role==="viewer"?'<button class="btn sm" data-reset="'+esc(u.id)+'">ĐẶT LẠI MẬT KHẨU</button>':'')+
    '</div></div>';
  }).join(""):'<div class="empty">Không có tài khoản phù hợp.</div>';
  list.querySelectorAll("[data-access]").forEach(b=>b.onclick=()=>setAccess(b.dataset.access));
  list.querySelectorAll("[data-reset]").forEach(b=>b.onclick=()=>openModal(b.dataset.reset));
  list.querySelectorAll("[data-link]").forEach(b=>b.onclick=()=>makeInviteLink(b.dataset.link));
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
 let linkPending=false;
 function closeInviteLink(){
  if(linkPending)return;
  el("m-link-url").value="";
  el("m-link-user").textContent="";
  el("m-link-note").textContent="";
  el("m-link-email").disabled=true;
  el("m-link-modal").hidden=true;
 }
 async function makeInviteLink(id){
  if(linkPending)return;
  const u=users.find(x=>x.id===id);
  if(!u||u.email_confirmed_at||!u.invited_at)return;
  if(!confirm("TẠO LINK MỜI BẢO MẬT CHO\\n"+u.email+"?\\n\\nChỉ chuyển link cho đúng nhân viên; link chứa mã xác nhận đăng ký."))return;
  linkPending=true;
  try{
   const data=await edge("manage","invite_link",{user_id:u.id});
   if(!data.action_link||!data.action_link.startsWith("https://"))throw Error("Máy chủ không cung cấp link an toàn.");
   el("m-link-user").textContent=u.email;
   el("m-link-url").value=data.action_link;
   el("m-link-email").disabled=false;
   el("m-link-note").textContent="Chỉ gửi riêng cho nhân viên. Link có thời hạn và có thể bị vô hiệu khi tạo link mới.";
   el("m-link-modal").hidden=false;
  }catch(err){alert("Không tạo được link mời: "+err.message);}
  finally{linkPending=false;}
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
  e.preventDefault();
  if(invitePending)return;
  const email=el("m-email").value.trim().toLowerCase();
  if(!confirm("YÊU CẦU SUPABASE GỬI EMAIL MỜI CHO\n"+email+"?\n\nĐây là yêu cầu gửi, không phải xác nhận thư đã đến hộp thư."))return;
  invitePending=true;
  el("m-invite-send").disabled=true;
  el("m-invite-info").innerHTML=note("Đang tạo tài khoản và yêu cầu chuyển email…");
  try{
   const result=await edge("manage","invite",{email});
   await load();
   const recipient=users.find(u=>u.email?.toLowerCase()===email&&!u.email_confirmed_at&&u.invited_at);
   el("m-invite-info").innerHTML=
    note("Supabase đã TIẾP NHẬN yêu cầu mời "+email+
     ". Chưa có xác nhận email đã đến Inbox/Spam; nếu người nhận chưa thấy thư, hãy dùng liên kết bảo mật bên dưới.","ok")+
    (recipient?'<button class="btn primary" type="button" id="m-invite-get-link">LẤY LINK MỜI ĐỂ GỬI QUA EMAIL / ZALO</button>':
     '<p class="hint">Tìm tài khoản trong danh sách CHỜ XÁC MINH và chọn LẤY LINK MỜI.</p>');
   const b=el("m-invite-get-link");
   if(b)b.onclick=()=>makeInviteLink(recipient.id);
   el("m-email").value="";
  }catch(err){
   el("m-invite-info").innerHTML=note("CHƯA XÁC NHẬN GỬI ĐƯỢC: "+err.message+
    ". Nếu có tài khoản đang CHỜ XÁC MINH, hãy dùng LẤY LINK MỜI. Không thử gửi liên tục.","fail");
  }finally{invitePending=false;el("m-invite-send").disabled=false;}
 };
 el("m-search").oninput=render;el("m-filter").onchange=render;
 el("m-refresh").onclick=()=>load().catch(err=>alert(err.message));
 el("m-close").onclick=closeModal;
 el("m-link-close").onclick=closeInviteLink;
 el("m-link-modal").onclick=e=>{if(e.target===el("m-link-modal"))closeInviteLink();};
 el("m-link-copy").onclick=async()=>{
  const text=el("m-link-url").value;if(!text)return;
  try{await navigator.clipboard.writeText(text);el("m-link-note").textContent="✓ Đã sao chép. Chỉ gửi link cho đúng người nhận qua tin nhắn riêng."; }
  catch{el("m-link-url").focus();el("m-link-url").select();el("m-link-note").textContent="Vui lòng sao chép link đang bôi đen.";}
 };
 el("m-link-email").onclick=()=>{
  const url=el("m-link-url").value.trim(),email=el("m-link-user").textContent.trim();
  if(!url||!/^https:\/\//i.test(url)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return;
  if(!confirm("MỞ ỨNG DỤNG EMAIL ĐỂ GỬI LINK CHO\n"+email+"?\n\nLiên kết chứa mã bảo mật một lần; chỉ gửi riêng cho đúng nhân viên."))return;
  const subject="SAGS-CXR | Thư mời kích hoạt tài khoản RNS";
  const body="Xin chào,\n\nBạn được mời kích hoạt tài khoản SAGSCXR-RNS.\nMở liên kết bảo mật bên dưới để xác minh email và đặt mật khẩu:\n"+url+
  "\n\nLiên kết chỉ dành cho người nhận, có thời hạn và không được chuyển tiếp.\n\nSAGS-CXR";
  const mailto="mailto:"+encodeURIComponent(email)+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
  window.location.href=mailto;
  el("m-link-note").textContent="Đã mở ứng dụng email (nếu thiết bị hỗ trợ). Kiểm tra đúng người nhận và bấm GỬI trong ứng dụng email. Hệ thống không tự gửi thư từ nút này.";
 };
 el("m-email-reset").onclick=()=>reset("email_reset");
 el("m-temp-reset").onclick=()=>reset("temp_reset");
 el("m-modal").onclick=e=>{if(e.target===el("m-modal"))closeModal();};
 el("m-copy").onclick=async()=>{try{await navigator.clipboard.writeText(el("m-secret").value);el("m-feedback").innerHTML=note("Đã sao chép mật khẩu tạm.","ok");}catch{el("m-secret").select();}};
 try{await load();}catch(err){list.innerHTML=note("Không tải được tài khoản: "+err.message,"fail");}
}
