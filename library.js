export default async function library(R){
 const {el,esc,fmt,normal,safeUrl,note,request,rest,edge,admin,shell}=R;
 const screen=shell("library","Thư viện <em>văn bản</em>","Tra cứu tài liệu Google Drive, tệp đính kèm và xác nhận READ & SIGN của nhân viên.");
 screen.innerHTML='<div class="stats"><div class="stat"><label>TỔNG VĂN BẢN</label><strong id="cnt-total">—</strong></div><div class="stat"><label>NHÓM / HÃNG</label><strong id="cnt-group">—</strong></div><div class="stat"><label>CÓ TỆP ĐÍNH KÈM</label><strong id="cnt-att">—</strong></div><div class="stat"><label>NGƯỜI DÙNG</label><strong>'+esc(R.member?.role||"VIEWER").toUpperCase()+'</strong></div></div>'+
 '<div class="columns"><div class="stack"><section class="card"><h2>Tìm kiếm văn bản</h2><div class="form"><input id="query" class="search" type="search" placeholder="Tên văn bản, số hiệu, hãng..."><select id="group"><option value="">TẤT CẢ NHÓM</option></select><select id="year"><option value="">TẤT CẢ NĂM</option></select><select id="format"><option value="">TẤT CẢ ĐỊNH DẠNG</option><option value="pdf">PDF</option><option value="word">WORD</option><option value="other">KHÁC</option></select></div><p id="result-count" class="hint"></p></section>'+
 '<section class="card"><h2>Danh sách văn bản</h2><div id="doc-list" style="max-height:620px;overflow:auto"></div><button id="more" class="btn full" hidden>HIỂN THỊ THÊM</button></section>'+
 (admin()?'<section class="card"><h2>Đồng bộ Google Drive</h2><p class="hint">ADMIN có thể cập nhật danh mục từ Drive theo quyền kết nối đã cấu hình.</p><div class="inline"><button class="btn" id="sync-status">KIỂM TRA KẾT NỐI</button><button class="btn primary" id="sync-run">ĐỒNG BỘ NGAY</button></div><div id="sync-info" class="hint"></div></section>':'')+
 '</div><div class="stack"><section class="card" id="doc-detail"><div class="empty"><strong>Chọn một văn bản</strong>Đọc thông tin, mở tài liệu và quản lý tệp đính kèm tại đây.</div></section></div></div>';
 const state={docs:[],shown:70,selected:null,attachments:[],connected:false,uploading:false};
 const type=x=>(x.mime_type||"").includes("pdf")||/\.pdf$/i.test(x.title)?"pdf":/(word|officedocument)/i.test(x.mime_type)||/\.docx?$/i.test(x.title)?"word":"other";
 const selected=()=>state.docs.find(d=>d.drive_file_id===state.selected);
 const fmtBytes=n=>n>=1048576?(n/1048576).toFixed(1)+" MB":n>=1024?Math.round(n/1024)+" KB":n+" B";
 const filters=()=>state.docs.filter(d=>{
  const q=normal(el("query").value);
  return (!q||normal([d.title,d.document_number,d.group_code,d.issuer,d.folder_path].join(" ")).includes(q))&&
   (!el("group").value||d.group_code===el("group").value)&&(!el("year").value||d.folder_year===el("year").value)&&
   (!el("format").value||type(d)===el("format").value);
 });
 function drawList(){
  const all=filters(),items=all.slice(0,state.shown);el("result-count").textContent="Hiển thị "+items.length+" / "+all.length+" văn bản phù hợp";
  el("doc-list").innerHTML=items.length?items.map(d=>'<button class="selectable '+(d.drive_file_id===state.selected?'active':'')+'" data-document="'+esc(d.drive_file_id)+'"><strong>'+esc(d.title)+'</strong><small>'+esc(d.group_code)+" · "+esc(d.folder_year)+" · "+esc(type(d).toUpperCase())+'</small></button>').join(""):'<div class="empty">Không tìm thấy văn bản phù hợp.</div>';
  el("more").hidden=items.length===all.length;
  el("doc-list").querySelectorAll("[data-document]").forEach(b=>b.onclick=()=>choose(b.dataset.document));
 }
 function renderStats(){
  el("cnt-total").textContent=state.docs.length.toLocaleString("vi-VN");
  el("cnt-group").textContent=new Set(state.docs.map(x=>x.group_code)).size;
 }
 async function attachments(){
  const id=state.selected;if(!id)return;
  const d=await rest("sags_docs_attachments","select=id,title,mime_type,size_bytes,drive_url,created_at&parent_drive_file_id=eq."+encodeURIComponent(id)+"&deleted_at=is.null&order=created_at.desc&limit=200");
  if(state.selected!==id)return;state.attachments=d;renderDetails();
 }
 function renderDetails(){
  const d=selected(),root=el("doc-detail");
  if(!d){root.innerHTML='<div class="empty">Chọn một văn bản từ danh sách.</div>';return;}
  const attachments=state.attachments;
  root.innerHTML='<span class="badge">'+esc(d.group_code)+" · "+esc(d.folder_year)+'</span><h2 style="margin-top:12px">'+esc(d.title)+'</h2>'+
  '<p class="hint">Số hiệu: '+esc(d.document_number||"—")+' · Trạng thái: '+esc(d.effective_status||"—")+'</p>'+
  '<div class="inline"><a class="btn primary" href="'+esc(safeUrl(d.drive_url))+'" target="_blank" rel="noopener noreferrer">MỞ VĂN BẢN GỐC ↗</a></div>'+
  '<div class="divider"></div><div class="inline"><h2 style="margin:0">TỆP ĐÍNH KÈM</h2><span class="badge" id="at-count">'+attachments.length+' tệp</span></div>'+
  '<div id="attachment-list">'+(attachments.length?attachments.map(a=>'<div class="doc"><span class="icon">📎</span><div class="details"><strong>'+esc(a.title)+'</strong><small>'+esc(fmtBytes(a.size_bytes))+' · '+esc(fmt(a.created_at))+'</small></div><a class="btn sm" href="'+esc(safeUrl(a.drive_url))+'" target="_blank" rel="noopener noreferrer">MỞ ↗</a>'+(admin()?'<button class="btn red sm" data-delete="'+esc(a.id)+'">XÓA</button>':'')+'</div>').join(""):'<p class="hint">Chưa có tệp đính kèm nào.</p>')+'</div>'+
  (admin()?'<div class="divider"></div><h2>ADMIN · Quản lý tệp</h2><div class="inline"><button class="btn" id="connect">KẾT NỐI GOOGLE</button><span class="badge" id="connection">'+(state.connected?"ĐÃ KẾT NỐI":"CHƯA XÁC MINH")+'</span></div><form id="upload-form" class="form" style="margin-top:14px"><label>Chọn tệp PDF, Word, Excel hoặc ảnh (tối đa 50 MB)</label><input id="upload-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" required><button type="submit" class="btn primary full" id="upload-btn">THÊM TỆP ĐÍNH KÈM</button><div id="upload-feedback" class="hint"></div><div class="progress" id="upload-progress" hidden><span id="upload-progress-fill" style="width:0"></span></div></form>':'');
  root.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>removeAttachment(b.dataset.delete));
  if(admin()){
   el("connect").onclick=async()=>{try{const d=await edge("attachments","connect",{});if(d.url)location.assign(safeUrl(d.url));else throw Error("Không nhận được đường dẫn kết nối Google.");}catch(e){alert(e.message)}};
   el("upload-form").onsubmit=upload;
  }
 }
 async function choose(id){state.selected=id;state.attachments=[];renderDetails();drawList();try{await attachments();}catch(e){el("attachment-list").innerHTML=note("Không tải được tệp: "+e.message,"fail");}}
 async function removeAttachment(id){
  const a=state.attachments.find(x=>x.id===id);if(!a)return;
  if(!confirm("XÁC NHẬN XÓA TỆP ĐÍNH KÈM?\n\n"+a.title+"\n\nTệp chuyển vào Thùng rác Google Drive; văn bản gốc giữ nguyên."))return;
  try{await edge("attachments","delete_attachment",{attachment_id:id});await attachments();alert("Đã xóa tệp đính kèm.");}
  catch(e){alert("Không thể xóa: "+e.message);}
 }
 async function upload(e){
  e.preventDefault();const f=el("upload-file")?.files?.[0];if(!f||!state.selected||state.uploading)return;
  if(f.size>52428800){alert("Tệp quá 50 MB.");return;}
  const id=state.selected;state.uploading=true;el("upload-btn").disabled=true;
  el("upload-progress").hidden=false;
  try{
   const init=await edge("attachments","init",{parent_drive_file_id:id,name:f.name,mime_type:f.type||"application/octet-stream",size_bytes:f.size});
   let offset=0;
   while(offset<f.size){
    const end=Math.min(offset+524288,f.size);
    const piece=new Uint8Array(await f.slice(offset,end).arrayBuffer());
    const out=await request("/functions/v1/sagscxr-rns-attachments?action=chunk",{method:"POST",headers:{"x-upload-id":init.upload_id,"x-chunk-offset":String(offset),"Content-Type":"application/octet-stream"},body:piece});
    offset=end;el("upload-progress-fill").style.width=Math.round(offset/f.size*100)+"%";
    el("upload-feedback").textContent="Đã tải "+Math.round(offset/f.size*100)+"%.";
    if(out.finished)break;
   }
   await attachments();el("upload-feedback").textContent="Đã tải lên thành công.";
  }catch(err){el("upload-feedback").textContent="Upload thất bại: "+err.message;}
  finally{state.uploading=false;if(el("upload-btn"))el("upload-btn").disabled=false;}
 }
 async function checkConnection(){
  if(!admin())return;
  try{const status=await edge("attachments","status",{});state.connected=status.connected===true;const b=el("connection");if(b)b.textContent=state.connected?"GOOGLE ĐÃ KẾT NỐI":"GOOGLE CHƯA KẾT NỐI";}catch{}
 }
 function options(id,arr){const select=el(id);for(const v of arr.sort())select.add(new Option(v,v));}
 try{
  const all=[];
  for(let offset=0;offset<5000;offset+=1000){
   const rows=await rest("sags_docs_documents","select=drive_file_id,title,group_code,folder_year,document_number,issuer,folder_path,mime_type,drive_url,effective_status,drive_modified_at&missing_from_source=eq.false&order=drive_modified_at.desc.nullslast&limit=1000&offset="+offset);
   all.push(...rows);if(rows.length<1000)break;
  }
  state.docs=all;renderStats();
  options("group",[...new Set(all.map(x=>x.group_code).filter(Boolean))]);options("year",[...new Set(all.map(x=>x.folder_year).filter(Boolean))]);
  ["query","group","year","format"].forEach(x=>el(x).addEventListener(x==="query"?"input":"change",()=>{state.shown=70;drawList();}));
  el("more").onclick=()=>{state.shown+=70;drawList();};
  drawList();
  if(all.length)await choose(all[0].drive_file_id);
  try{const count=await rest("sags_docs_attachments","select=id&deleted_at=is.null&limit=1000");el("cnt-att").textContent=count.length;}catch{el("cnt-att").textContent="—";}
  if(admin()){
   await checkConnection();
   el("sync-status").onclick=async()=>{try{const r=await request("/functions/v1/sagscxr-rns-sync",{method:"GET"});el("sync-info").textContent=r.configured?"Google Drive: Đã kết nối":"Google Drive: Chưa cấu hình";}catch(e){el("sync-info").textContent=e.message;}};
   el("sync-run").onclick=async()=>{if(!confirm("ĐỒNG BỘ DANH MỤC TỪ GOOGLE DRIVE?"))return;el("sync-run").disabled=true;el("sync-info").textContent="Đang đồng bộ...";try{const r=await request("/functions/v1/sagscxr-rns-sync",{method:"POST"});el("sync-info").textContent="Quét "+r.scanned+" · Mới "+r.inserted+" · Cập nhật "+r.updated+". Tải lại trang để xem.";}catch(e){el("sync-info").textContent=e.message;}finally{el("sync-run").disabled=false;}};
  }
 }catch(err){screen.innerHTML=note("Không đọc được dữ liệu văn bản: "+err.message,"fail")+'<a class="btn" href="index.html">TẢI LẠI</a>';}
}
