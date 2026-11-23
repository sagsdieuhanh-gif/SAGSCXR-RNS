import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") || "";
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || "";
const PUBLIC = Deno.env.get("SUPABASE_ANON_KEY") ||
  JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}").default || "";
const APP_URL = "https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS";
const CORS = {
  "Access-Control-Allow-Origin": "https://sagsdieuhanh-gif.github.io",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "Vary": "Origin",
};
const reply=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{
  status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...CORS}
});
const fail=(code:string,status=400,message?:string)=>reply({error:code,message},status);
const emailCheck=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidCheck=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
  if(req.method!=="POST")return fail("method_not_allowed",405);
  if(!URL||!SECRET||!PUBLIC)return fail("server_not_configured",503);
  const bearer=req.headers.get("Authorization")||"";
  const token=bearer.match(/^Bearer\s+(\S+)$/i)?.[1];
  if(!token)return fail("login_required",401);
  const admin=createClient(URL,SECRET,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  try{
    const {data:identity,error:authErr}=await admin.auth.getUser(token);
    if(authErr||!identity?.user?.id)return fail("invalid_session",401);
    if(identity.user.app_metadata?.rns_must_change_password===true)return fail("password_change_required",403);
    const requesterId=identity.user.id;
    const {data:membership,error:membershipError}=await admin.from("sags_docs_members")
       .select("role,active").eq("user_id",requesterId).maybeSingle();
    if(membershipError)return fail("permission_check_failed",500);
    if(membership?.role!=="admin"||membership.active!==true)return fail("admin_only",403);

    const body=await req.json().catch(()=>null);
    if(!body||typeof body.action!=="string")return fail("invalid_request",400);
    if(body.action==="list"){
      const users:any[]=[];
      for(let page=1;page<=20;page++){
        const {data,error}=await admin.auth.admin.listUsers({page,perPage:100});
        if(error)throw error;
        users.push(...(data?.users||[]));
        if((data?.users?.length||0)<100)break;
        if(page===20)return fail("user_limit_reached",413);
      }
      const {data:members,error:memberError}=await admin.from("sags_docs_members")
         .select("user_id,role,active,display_name,created_at").limit(5000);
      if(memberError)throw memberError;
      const memberMap=new Map((members||[]).map(m=>[m.user_id,m]));
      const records=users.map(u=>{
        const m:any=memberMap.get(u.id)||null;
        return {
          id:u.id,email:u.email||"",invited_at:u.invited_at||null,
          email_confirmed_at:u.email_confirmed_at||null,
          created_at:u.created_at||null,last_sign_in_at:u.last_sign_in_at||null,
          role:m?.role||null,active:m?.active===true,
          display_name:m?.display_name||"",
        };
      }).sort((a,b)=>(a.role==="admin"?-1:b.role==="admin"?1:0)||
         (b.created_at||"").localeCompare(a.created_at||""));
      return reply({users:records,returned:records.length});
    }
    if(body.action==="create"){
      const email=String(body.email||"").trim().toLowerCase();
      const name=String(body.display_name||"").trim();
      const rnsRole=String(body.rns_role||"viewer").trim().toLowerCase();
      const managerUnit=String(body.manager_unit||"VIEWER").trim().toUpperCase();
      const grantRns=body.rns_access===true,grantManager=body.manager_access===true;
      if(typeof body.rns_access!=="boolean"||typeof body.manager_access!=="boolean")
        return fail("access_selection_required",400,"Chọn riêng quyền RNS và quyền Báo cáo.");
      if(!grantRns&&!grantManager)return fail("no_app_selected",400);
      if(email.length>254||!emailCheck.test(email))return fail("invalid_email",400,"Email nhân viên không hợp lệ.");
      if(!name||name.length>120)return fail("invalid_name",400,"Cần nhập họ tên nhân viên (tối đa 120 ký tự).");
      if(grantRns&&!["viewer","editor"].includes(rnsRole))return fail("invalid_rns_role",403,"Không thể cấp ADMIN bằng chức năng tạo nhanh.");
      if(grantManager&&!["VIEWER","DH","KTS","PVHK","KHO","QA","IT"].includes(managerUnit))
        return fail("invalid_manager_role",403);
      if(body.email_verified_by_admin!==true)
        return fail("confirmation_required",400,"ADMIN phải kiểm tra chính xác email nhân viên.");
      // The RNS administrator may create RNS-only users; Manager access requires Manager ADMIN.
      if(grantManager){
        const {data:managerAdmin,error:managerErr}=await admin.from("ops_members")
          .select("unit,active").eq("user_id",requesterId).maybeSingle();
        if(managerErr||managerAdmin?.unit!=="ADMIN"||managerAdmin.active!==true)
          return fail("manager_admin_required",403,"Phải đồng thời là ADMIN Manager để cấp quyền nghiệp vụ Manager.");
      }
      const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
      const values:number[]=[],limit=Math.floor(256/alphabet.length)*alphabet.length;
      while(values.length<20){
        for(const b of crypto.getRandomValues(new Uint8Array(32))){
          if(b<limit){values.push(b%alphabet.length);if(values.length===20)break;}
        }
      }
      const temporaryPassword=values.map(i=>alphabet[i]).join("");
      const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(temporaryPassword));
      const tempHash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,"0")).join("");
      const {data:created,error:createError}=await admin.auth.admin.createUser({
        email,password:temporaryPassword,email_confirm:true,
        app_metadata:{rns_must_change_password:true,rns_temp_password_sha256:tempHash},
        user_metadata:{display_name:name}
      });
      if(createError){
        const reason=String(createError.message||"").toLowerCase();
        if(/already|exists|registered|duplicate|email.*taken/.test(reason))
          return fail("already_registered",409,"Email đã có tài khoản dùng chung. Chọn tài khoản hiện có để cập nhật quyền, không tạo lại.");
        console.error("RNS direct creation error",createError.status,createError.code);
        return fail("create_failed",502,"Không tạo được tài khoản Supabase Auth.");
      }
      const userId=created?.user?.id;
      if(!userId)return fail("create_missing_user_id",502);
      try{
        if(grantRns){
          const {error:rnsError}=await admin.from("sags_docs_members").insert({
            user_id:userId,role:rnsRole,active:true,display_name:name
          });
          if(rnsError)throw Error("RNS_ROLE_FAILED");
        }
        if(grantManager){
          const {error:managerError}=await admin.from("ops_members").insert({
            user_id:userId,unit:managerUnit,active:true,display_name:name
          });
          if(managerError)throw Error("MANAGER_ROLE_FAILED");
        }
      }catch(e){
        const {error:rollbackError}=await admin.auth.admin.deleteUser(userId);
        if(rollbackError)console.error("RNS shared registration rollback error",rollbackError.code);
        console.error("RNS membership setup",e instanceof Error?e.message:"unknown");
        return fail("membership_failed",500,"Không hoàn tất quyền truy cập. Kiểm tra danh sách trước khi đăng ký lại.");
      }
      const {error:auditError}=await admin.from("sags_rns_credential_events").insert({
        target_user_id:userId,admin_user_id:requesterId,event_type:"admin_created_shared_account"
      });
      if(auditError)console.error("RNS creation audit issue",auditError.code);
      return reply({success:true,email,user_id:userId,rns_access:grantRns,manager_access:grantManager,
        rns_role:grantRns?rnsRole:null,manager_unit:grantManager?managerUnit:null,
        must_change_password:true,temporary_password:temporaryPassword,
        message:"Đã tạo tài khoản chung, chỉ cấp quyền cho ứng dụng được chọn. Mật khẩu tạm chỉ trả về một lần."});
    }
    if(body.action==="invite"){
      const email=String(body.email||"").trim().toLowerCase();
      if(email.length>254||!emailCheck.test(email))return fail("invalid_email",400,"Email không hợp lệ.");
      const {data,error}=await admin.auth.admin.inviteUserByEmail(email,{
        redirectTo:APP_URL+"/secure.html"
      });
      if(error){
        const safe=String(error.message||"").slice(0,200);
        return fail("invite_failed",error.status===429?429:400,safe);
      }
      return reply({success:true,email:data?.user?.email||email,message:"Yêu cầu gửi email mời đã được Supabase tiếp nhận."});
    }
    if(body.action==="invite_link"){
      const userId=String(body.user_id||"").trim();
      if(!uuidCheck.test(userId)||userId===requesterId)return fail("invalid_user_id",403);
      const {data:target,error:targetErr}=await admin.auth.admin.getUserById(userId);
      if(targetErr||!target?.user?.email)return fail("user_not_found",404);
      const recipient=target.user;
      if(recipient.email_confirmed_at)return fail("already_confirmed",409,"Tài khoản đã xác minh, không tạo link mời.");
      if(!recipient.invited_at)return fail("not_invited",409,"Tài khoản chưa được mời qua hệ thống.");
      const {data:memberRow,error:memberErr}=await admin.from("sags_docs_members")
        .select("role").eq("user_id",userId).maybeSingle();
      if(memberErr)return fail("permission_check_failed",500);
      if(memberRow?.role&&memberRow.role!=="viewer")return fail("protected_role",403);
      const {data:generated,error:linkError}=await admin.auth.admin.generateLink({
        type:"invite",email:recipient.email,options:{redirectTo:APP_URL+"/secure.html"}
      });
      if(linkError){
        console.error("Generate invite link failed:",linkError.status,String(linkError.code||""));
        return fail("invite_link_failed",linkError.status===429?429:400,
          "Không tạo được link mời. Kiểm tra tài khoản và thử lại.");
      }
      const link=String(generated?.properties?.action_link||"");
      let verified:URL;
      try{verified=new globalThis.URL(link);}catch{return fail("invalid_generated_link",502);}
      if(verified.protocol!=="https:"||verified.origin!==URL||!verified.pathname.startsWith("/auth/v1/verify"))
        return fail("invalid_generated_link",502);
      if(verified.searchParams.get("redirect_to")!==APP_URL+"/secure.html")
        return fail("redirect_not_confirmed",502,"Supabase chưa cho phép URL GitHub Pages.");
      return reply({success:true,user_id:userId,action_link:link,email:recipient.email,
        message:"Liên kết bảo mật được tạo để chuyển riêng cho nhân viên. Không công khai."});
    }
    if(body.action==="set_access"){
      const userId=String(body.user_id||"").trim();
      if(!uuidCheck.test(userId))return fail("invalid_user_id",400);
      if(typeof body.active!=="boolean")return fail("invalid_status",400);
      if(userId===requesterId)return fail("cannot_change_self",403);
      const {data:target,error:targetErr}=await admin.auth.admin.getUserById(userId);
      if(targetErr||!target?.user)return fail("user_not_found",404);
      if(!target.user.email_confirmed_at)return fail("email_not_verified",409,"Nhân viên chưa xác minh email.");
      const {data:targetMember,error:tmErr}=await admin.from("sags_docs_members")
         .select("role,active").eq("user_id",userId).maybeSingle();
      if(tmErr)throw tmErr;
      if(targetMember?.role&&targetMember.role!=="viewer")
        return fail("protected_role",403,"Chỉ được thay đổi quyền truy cập của VIEWER.");
      if(targetMember){
        const {error}=await admin.from("sags_docs_members")
          .update({active:body.active}).eq("user_id",userId).eq("role","viewer");
        if(error)throw error;
      }else{
        if(!body.active)return fail("not_a_member",409);
        const displayName=String(target.user.email||"").split("@")[0].slice(0,80);
        const {error}=await admin.from("sags_docs_members")
          .insert({user_id:userId,role:"viewer",active:true,display_name:displayName});
        if(error)throw error;
      }
      return reply({success:true,user_id:userId,active:body.active,role:"viewer"});
    }
    return fail("unknown_action",400);
  }catch(err){
    const message=err instanceof Error?err.message:String(err);
    console.error("sagscxr-rns-manage:",message);
    return fail("server_error",500,"Có lỗi máy chủ. Kiểm tra Supabase Edge Function Logs.");
  }
});