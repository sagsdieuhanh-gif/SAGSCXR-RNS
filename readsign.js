export default async function readsign(R){
 const {el,esc,fmt,normal,note,rest,edge,admin,shell,safeUrl}=R;
 const screen=shell("read-sign","READ & SIGN <em>điện tử</em>","Giao văn bản, theo dõi thao tác mở từng tệp và ghi nhận xác nhận đã đọc của nhân viên.");
 screen.innerHTML='<div class="stats"><div class="stat"><label>ĐƯỢC GIAO</label><strong id="r-total">0</strong></div><div class="stat"><label>ĐÃ XÁC NHẬN</label><strong id="r-done">0</strong></div><div class="stat"><label>CHƯA XÁC NHẬN</label><strong id="r-pending">0</strong></div><div class="stat"><label>QUÁ HẠN</label><strong id="r-late">0</strong></div></div>'+
 '<div class="columns"><div class="stack">'+
 (admin()?'<section class="card"><h2>Giao văn bản READ & SIGN</h2><p class="hint">4 bước: Văn bản → Nhân viên → Thời hạn → Xác nhận.</p><div id="r-wizard"></div></section>':'')+
 '<section class="card"><div class="inline"><h2>Danh sách READ & SIGN</h2><button id="r-refresh" class="btn sm push">↻ LÀM MỚI</button></div><div id="r-list"></div></section></div><section class="card" id="r-detail"><div class="empty">Chọn đợt READ & SIGN để xem nội dung.</div></section></div>'+
 '<div class="notice">Lưu ý: thao tác mở liên kết không chứng minh đã đọc hết nội dung. Nhân viên phải chủ động xác nhận đã đọc sau khi kiểm tra các tệp được giao.</div>';
 const state={campaigns:[],files:[],targets:[],opens:[],acks:[],members:[],docs:[],selected:null,step:1};
 let creating=false;
 const mine=R.user.id;
 const files=c=>state.files.filter(f=>f.campaign_id===c.id&&f.revision===c.revision);
 const targets=c=>state.targets.filter(x=>x.campaign_id===c.id);
 const visited=(c,id)=>state.opens.filter(o=>o.campaign_id===c.id&&o.revision===c.revision&&o.user_id===id);
 const ack=(c,id)=>state.acks.find(a=>a.campaign_id===c.id&&a.revision===c.revision&&a.user_id===id);
 const late=c=>!!c.due_at&&new Date(c.due_at)<new Date();
 const label=(c,id)=>ack(c,id)?"ĐÃ XÁC NHẬN":late(c)?"QUÁ HẠN":"CHƯA XÁC NHẬN";
 const done=c=>targets(c).filter(t=>ack(c,t.user_id)).length;
 function stats(){
  const total=admin()?state.campaigns.reduce((n,c)=>n+targets(c).length,0):state.campaigns.length;
  const count=admin()?state.campaigns.reduce((n,c)=>n+done(c),0):state.campaigns.filter(c=>ack(c,mine)).length;
  const overdue=admin()?state.campaigns.reduce((n,c)=>n+(late(c)?targets(c).length-done(c):0),0):state.campaigns.filter(c=>late(c)&&!ack(c,mine)).length;
  el("r-total").textContent=total;el("r-done").textContent=count;el("r-pending").textContent=total-count;el("r-late").textContent=overdue;
 }
 function renderList(){
  const root=el("r-list");root.innerHTML=state.campaigns.length?state.campaigns.map(c=>{
   const status=admin()?done(c)+"/"+targets(c).length+" HOÀN TẤT":label(c,mine);
   return '<button class="selectable '+(state.selected===c.id?'active':'')+'" data-id="'+esc(c.id)+'"><strong>'+esc(c.title)+'</strong><small>Phiên bản '+c.revision+' · Hạn: '+esc(fmt(c.due_at))+'</small><span class="badge '+(status.includes("ĐÃ")?"ok":late(c)?"warn":"")+'">'+esc(status)+'</span></button>';
  }).join(""):'<div class="empty">Chưa có đợt READ & SIGN.</div>';
  root.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>{state.selected=b.dataset.id;renderList();detail();if(innerWidth<=900)el("r-detail").scrollIntoView({behavior:"smooth",block:"start"});});
 }
 function detail(){
  const root=el("r-detail"),c=state.campaigns.find(x=>x.id===state.selected);if(!c){root.innerHTML='<div class="empty">Chọn đợt READ & SIGN từ danh sách.</div>';return;}
  const ff=files(c),opened=new Set(visited(c,mine).map(o=>o.file_key));
  const currentAck=ack(c,mine);
  let html='<button class="btn sm" id="r-back" style="margin-bottom:14px">← QUAY LẠI DANH SÁCH</button><span class="badge">PHIÊN BẢN '+c.revision+'</span><h2 style="margin-top:11px">'+esc(c.title)+'</h2><p class="hint">Hạn: '+esc(fmt(c.due_at))+' · '+ff.length+' tài liệu</p><div class="divider"></div>';
  if(admin()){
   const count=done(c),total=targets(c).length;
   html+='<div class="inline"><strong>Đã xác nhận: '+count+'/'+total+'</strong><span class="badge">READ & SIGN</span></div><div class="progress"><span style="width:'+(total?Math.round(count/total*100):0)+'%"></span></div>';
   html+='<h2 style="margin-top:18px">Tài liệu đã giao</h2>';
   for(const f of ff)html+='<div class="doc"><span class="icon">'+(f.kind==="document"?"📄":"📎")+'</span><div class="details"><strong>'+esc(f.title)+'</strong><small>'+(f.kind==="document"?"Văn bản gốc":"Tệp đính kèm")+'</small></div><a class="btn sm" href="'+esc(safeUrl(f.drive_url))+'" target="_blank" rel="noopener noreferrer">MỞ ↗</a></div>';
   html+='<h2 style="margin-top:18px">Tiến độ nhân viên</h2><div class="tablebox"><table class="table"><thead><tr><th>NHÂN VIÊN</th><th>ĐÃ MỞ</th><th>XÁC NHẬN</th></tr></thead><tbody>';
   for(const t of targets(c)){const u=state.members.find(x=>x.id===t.user_id),open=new Set(visited(c,t.user_id).map(x=>x.file_key)),a=ack(c,t.user_id);
    html+='<tr><td>'+esc(u?.email||t.user_id)+'</td><td>'+open.size+'/'+ff.length+'</td><td>'+esc(a?fmt(a.confirmed_at):"CHƯA")+'</td></tr>';
   }html+='</tbody></table></div><div class="divider"></div><div class="inline"><button id="r-export" class="btn">XUẤT BÁO CÁO CSV</button><button id="r-revise" class="btn">CẬP NHẬT TỆP / PHIÊN BẢN</button><button id="r-archive" class="btn red">KẾT THÚC ĐỢT</button></div>';
  }else{
   html+='<div class="inline"><strong>Đã mở '+opened.size+'/'+ff.length+' liên kết</strong><span class="badge '+(currentAck?"ok":"warn")+'">'+esc(label(c,mine))+'</span></div><div class="progress"><span style="width:'+(ff.length?Math.round(opened.size/ff.length*100):0)+'%"></span></div>';
   html+='<h2 style="margin-top:19px">Tài liệu bắt buộc</h2>';
   for(const f of ff)html+='<div class="doc"><span class="icon">'+(f.kind==="document"?"📄":"📎")+'</span><div class="details"><strong>'+esc(f.title)+'</strong><small>'+(opened.has(f.file_key)?"✓ ĐÃ MỞ LIÊN KẾT":"CHƯA MỞ LIÊN KẾT")+'</small></div><button type="button" class="btn sm" data-open="'+esc(f.file_key)+'">MỞ ↗</button></div>';
   html+='<div class="divider"></div><label class="check"><input type="checkbox" id="r-attest" '+(currentAck?"checked disabled":"")+'><span>Tôi xác nhận đã mở các tài liệu được giao và đã đọc nội dung. Tôi hiểu việc xác nhận là cam kết cá nhân.</span></label><button class="btn primary full" id="r-ack" style="margin-top:13px" '+(currentAck?"disabled":"")+'>'+(currentAck?"ĐÃ XÁC NHẬN NGÀY "+esc(fmt(currentAck.confirmed_at)):"HOÀN TẤT XÁC NHẬN ĐÃ ĐỌC")+'</button><p id="r-ack-info" class="hint"></p>';
  }
  root.innerHTML=html;
  el("r-back").onclick=()=>el("r-list").scrollIntoView({behavior:"smooth",block:"start"});
  if(admin()){
   el("r-export").onclick=()=>exportCsv(c);
   el("r-revise").onclick=async()=>{if(!confirm("Tạo phiên bản mới từ văn bản chính và tệp đính kèm hiện tại? Nhân viên phải xác nhận lại."))return;try{await edge("readsign","revise",{campaign_id:c.id});await load();}catch(e){alert(e.message);}};
   el("r-archive").onclick=async()=>{if(!confirm("Kết thúc đợt READ & SIGN này?"))return;try{await edge("readsign","archive",{campaign_id:c.id});state.selected=null;await load();}catch(e){alert(e.message);}};
  }else{
   root.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openFile(c,ff.find(x=>x.file_key===b.dataset.open)));
   if(!currentAck){
    const update=()=>el("r-ack").disabled=!el("r-attest").checked||ff.length===0||opened.size<ff.length;
    el("r-attest").onchange=update;update();
    el("r-ack").onclick=async()=>{if(!el("r-attest").checked||!confirm("XÁC NHẬN ĐÃ ĐỌC TOÀN BỘ TÀI LIỆU?"))return;try{await edge("readsign","ack",{campaign_id:c.id,revision:c.revision,confirmed:true});await load();}catch(err){el("r-ack-info").textContent=err.message;}};
   }
  }
 }
 async function openFile(c,f){
  if(!f)return;const tab=window.open("about:blank","_blank");
  try{const response=await edge("readsign","open",{campaign_id:c.id,file_key:f.file_key});const url=safeUrl(response.drive_url);if(url==="#")throw Error("Đường dẫn không hợp lệ.");if(tab)tab.location.replace(url);else location.assign(url);await load();}
  catch(e){if(tab)tab.close();alert("Không mở được tệp: "+e.message);}
 }
 function exportCsv(c){
  const rows=[["Đợt READ & SIGN","Phiên bản","Hạn","Email","Tệp đã mở","Tổng tệp","Trạng thái","Xác nhận lúc"]];
  for(const t of targets(c)){const a=ack(c,t.user_id),u=state.members.find(x=>x.id===t.user_id);
   rows.push([c.title,c.revision,fmt(c.due_at),u?.email||t.user_id,new Set(visited(c,t.user_id).map(x=>x.file_key)).size,files(c).length,a?"ĐÃ XÁC NHẬN":late(c)?"QUÁ HẠN":"CHƯA XÁC NHẬN",a?fmt(a.confirmed_at):""]);
  }
  const quote=x=>{let s=String(x??"");if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const blob=new Blob(["\uFEFF"+rows.map(row=>row.map(quote).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="RNS_READ_SIGN_"+c.id.slice(0,8)+".csv";a.click();URL.revokeObjectURL(url);
 }
 async function load(){
  const data=await edge("readsign","list");
  for(const k of ["campaigns","files","targets","opens","acks","members"])state[k]=data[k]||[];
  if(!state.campaigns.some(x=>x.id===state.selected))state.selected=state.campaigns[0]?.id||null;
  stats();renderList();detail();
  if(admin())drawWizard();
 }
 async function documents(){
  if(!admin())return;
  const all=[];for(let offset=0;offset<5000;offset+=1000){const rows=await rest("sags_docs_documents","select=drive_file_id,title,group_code,folder_year&missing_from_source=eq.false&order=title.asc&limit=1000&offset="+offset);all.push(...rows);if(rows.length<1000)break;}state.docs=all;
 }
 const wizard={document:"",title:"",due:"",all:true,users:[]};
 function drawWizard(){
  const root=el("r-wizard");if(!root)return;
  let body='<div class="steps">'+["1 VĂN BẢN","2 NHÂN VIÊN","3 THỜI HẠN","4 XÁC NHẬN"].map((x,i)=>'<span class="'+(state.step===i+1?"active":state.step>i+1?"done":"")+'">'+x+'</span>').join("")+'</div><div id="r-wizard-error"></div>';
  if(state.step===1){body+='<div class="form"><label>TÌM VĂN BẢN</label><input id="r-search" class="search" placeholder="Nhập tên, hãng, từ khóa"><label>VĂN BẢN GỐC</label><select id="r-document"><option value="">Chọn văn bản</option></select><p class="hint">Tự kèm các tệp đính kèm hiện có khi giao.</p></div>';}
  if(state.step===2){body+='<div class="form"><label class="check"><input type="checkbox" id="r-all" '+(wizard.all?"checked":"")+'>Giao tất cả VIEWER đang hoạt động</label><div id="r-people" class="stafflist" '+(wizard.all?"hidden":"")+'>'+state.members.map(u=>'<label><input type="checkbox" value="'+esc(u.id)+'" '+(wizard.users.includes(u.id)?"checked":"")+'>'+esc(u.email)+'</label>').join("")+'</div><p class="hint">'+state.members.length+' tài khoản VIEWER đủ điều kiện</p></div>';}
  if(state.step===3){body+='<div class="form"><label>TÊN ĐỢT READ & SIGN</label><input id="r-title" maxlength="250" placeholder="Xác nhận đọc văn bản..." value="'+esc(wizard.title)+'"><label>HẠN HOÀN THÀNH (CÓ THỂ ĐỂ TRỐNG)</label><input type="datetime-local" id="r-due" value="'+esc(wizard.due)+'"></div>';}
  if(state.step===4){const d=state.docs.find(x=>x.drive_file_id===wizard.document),names=wizard.all?"Tất cả "+state.members.length+" VIEWER":wizard.users.length+" người";
   body+='<div class="review"><p><b>VĂN BẢN:</b> '+esc(d?.title||"—")+'</p><p><b>NGƯỜI NHẬN:</b> '+esc(names)+'</p><p><b>TÊN ĐỢT:</b> '+esc(wizard.title)+'</p><p><b>HẠN:</b> '+esc(wizard.due?fmt(wizard.due):"Không có hạn")+'</p></div><p class="hint">ADMIN cần xác nhận lần cuối để giao nhiệm vụ cho nhân viên.</p>';}
  body+='<div class="inline" style="margin-top:15px">'+(state.step>1?'<button id="r-prev" class="btn">← TRƯỚC</button>':'')+
   (state.step<4?'<button id="r-next" class="btn primary push">TIẾP TỤC →</button>':'<button id="r-create" class="btn green push">✓ XÁC NHẬN GIAO</button>')+'</div>';
  root.innerHTML=body;
  if(state.step===1){
   const select=el("r-document");for(const doc of state.docs)select.add(new Option(doc.title+" · "+doc.group_code,doc.drive_file_id));
   select.value=wizard.document;const filter=()=>{const q=normal(el("r-search").value),value=select.value;select.replaceChildren(new Option("Chọn văn bản",""));for(const d of state.docs.filter(x=>normal(x.title+" "+x.group_code).includes(q)).slice(0,180))select.add(new Option(d.title+" · "+d.group_code,d.drive_file_id));if([...select.options].some(o=>o.value===value))select.value=value;};
   el("r-search").oninput=filter;filter();if(wizard.document)select.value=wizard.document;select.onchange=()=>{wizard.document=select.value;const d=state.docs.find(x=>x.drive_file_id===wizard.document);if(d&&!wizard.title)wizard.title=("Xác nhận đọc: "+d.title).slice(0,250);};
  }
  if(state.step===2){el("r-all").onchange=()=>{wizard.all=el("r-all").checked;el("r-people").hidden=wizard.all;};el("r-people").onchange=()=>wizard.users=[...el("r-people").querySelectorAll("input:checked")].map(x=>x.value);}
  if(state.step===3){el("r-title").oninput=()=>wizard.title=el("r-title").value;el("r-due").onchange=()=>wizard.due=el("r-due").value;}
  if(el("r-prev"))el("r-prev").onclick=()=>{state.step--;drawWizard();};
  if(el("r-next"))el("r-next").onclick=()=>{
   const err=state.step===1&&!wizard.document?"Chưa chọn văn bản.":state.step===2&&!(wizard.all?state.members.length:wizard.users.length)?"Chưa có nhân viên nhận.":state.step===3&&(!wizard.title.trim()||wizard.due&&new Date(wizard.due)<=new Date())?"Vui lòng kiểm tra tên đợt hoặc hạn.":"";
   if(err){el("r-wizard-error").innerHTML=note(err,"fail");return;}
   state.step++;drawWizard();
  };
  if(el("r-create"))el("r-create").onclick=async()=>{
   if(creating||!confirm("XÁC NHẬN GIAO VĂN BẢN READ & SIGN?"))return;
   creating=true;el("r-create").disabled=true;
   try{
    const result=await edge("readsign","create",{parent_drive_file_id:wizard.document,title:wizard.title.trim(),due_at:wizard.due?new Date(wizard.due).toISOString():null,all_viewers:wizard.all,user_ids:wizard.all?[]:wizard.users});
    wizard.document="";wizard.title="";wizard.due="";wizard.all=true;wizard.users=[];state.step=1;state.selected=result.campaign_id;await load();alert("Đã giao "+result.files+" tài liệu cho "+result.recipients+" nhân viên.");
   }catch(e){el("r-wizard-error").innerHTML=note("Không giao được: "+e.message,"fail");}
   finally{creating=false;if(el("r-create"))el("r-create").disabled=false;}
  };
 }
 el("r-refresh").onclick=()=>load().catch(e=>alert(e.message));
 try{await documents();await load();}catch(err){el("r-list").innerHTML=note("Không tải được READ & SIGN: "+err.message,"fail");}
}
