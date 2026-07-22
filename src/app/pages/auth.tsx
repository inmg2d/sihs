import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, LogOut, ChevronRight, ChevronDown, Home, Users, LayoutGrid, BookMarked, GraduationCap, UserCheck, BarChart3, BookOpen, FileText, DollarSign, Calendar, Bell, Layers, Settings2 } from "lucide-react";
import { SCHOOL, P, Page, AuthUser, AppUser, checkPw, dbSet } from "../shared";
import { Avatar, SchoolLogo } from "../ui";

export const NAV=[
  {id:"dashboard",label:"Dashboard",icon:Home},
  {id:"sections",label:"Sections",icon:Layers},
  {id:"students",label:"Students",icon:Users},
  {id:"classes",label:"Classes",icon:LayoutGrid},
  {id:"subjects",label:"Subjects",icon:BookMarked},
  {id:"teachers",label:"Staff",icon:GraduationCap},
  {id:"attendance",label:"Attendance",icon:UserCheck},
  {id:"grades",label:"Grade Entry",icon:BarChart3},
  {id:"exams",label:"Exams",icon:BookOpen},
  {id:"reportcard",label:"Report Cards",icon:FileText},
  {id:"finance",label:"Finance",icon:DollarSign},
  {id:"timetable",label:"Timetable",icon:Calendar},
  {id:"announcements",label:"Notices",icon:Bell},
  {id:"session",label:"Session Mgmt",icon:Settings2},
  {id:"users",label:"User Accounts",icon:UserCheck},
];

const DEFAULT_CREDS=[
  {label:"Principal",email:"principal@sihs-ndop.edu.cm",pw:"Principal@2025",role:"superadmin"},
  {label:"Admin / Bursar",email:"admin@sihs-ndop.edu.cm",pw:"Admin@2025",role:"admin"},
  {label:"Teacher",email:"teacher@sihs-ndop.edu.cm",pw:"Teacher@2025",role:"teacher"},
];

export function LoginScreen({onLogin,appUsers}:{onLogin:(u:AuthUser)=>void;appUsers:AppUser[]}){
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [showReset,setShowReset]=useState(false);

  function submit(e:React.FormEvent){
    e.preventDefault();
    setLoading(true);setErr("");
    setTimeout(()=>{
      const emailLow=email.toLowerCase().trim();
      const found=appUsers.find(u=>u.email.toLowerCase()===emailLow&&u.isActive);
      if(!found){setErr("No active account found for this email address.");setLoading(false);return;}

      // Primary: check stored hash
      let ok=checkPw(pw,found.passwordHash);

      // Fallback: default master credentials always work from any device
      // This lets staff log in from a new/different computer with the original password
      if(!ok){
        const def=DEFAULT_CREDS.find(d=>d.email===emailLow);
        if(def&&pw===def.pw)ok=true;
      }

      if(!ok){setErr("Incorrect password. Try your password or the original default password for this account.");setLoading(false);return;}

      const updated=appUsers.map(u=>u.id===found.id?{...u,lastLogin:new Date().toISOString()}:u);
      dbSet("appUsers",updated);
      onLogin({id:found.id,name:found.name,role:found.role,email:found.email});
    },500);
  }

  function resetDevice(){
    // Clear all SIHS localStorage keys and reload — this device will reseed from defaults
    Object.keys(localStorage).filter(k=>k.startsWith("sihs_")).forEach(k=>localStorage.removeItem(k));
    window.location.reload();
  }

  return(
    <div className="min-h-screen flex" style={{background:"#F4F2EE",fontFamily:"var(--font-body)"}}>
      <div className="hidden lg:flex flex-col justify-between w-[42%] p-10 relative overflow-hidden" style={{background:P}}>
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",backgroundSize:"20px 20px"}}/>
        <div className="relative">
          <div className="flex items-center gap-4 mb-12">
            <SchoolLogo size={68}/>
            <div>
              <p className="text-white font-black text-base leading-tight" style={{fontFamily:"var(--font-display)"}}>{SCHOOL.full}</p>
              <p className="text-[#C8960C] text-sm font-semibold mt-0.5">{SCHOOL.abbr} · Ndop, NWR, Cameroon</p>
              <p className="text-white/40 text-xs mt-0.5 italic">{SCHOOL.motto}</p>
            </div>
          </div>
          <h1 className="text-white text-4xl font-extrabold leading-tight mb-4" style={{fontFamily:"var(--font-display)"}}>School Management<br/>System</h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">Integrated platform for student records, academics, attendance, examinations, report cards, and school administration.</p>
        </div>
        <div className="relative space-y-2">
          {[{l:"Sections",v:"General · Technical · Commercial"},{l:"System",v:"Secure Staff Portal"},{l:"Access",v:"Works on any device"}].map(({l,v})=>(
            <div key={l} className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{background:"rgba(255,255,255,0.07)"}}>
              <span className="text-white/60 text-sm">{l}</span>
              <span className="ml-auto text-[#C8960C] text-xs font-semibold text-right" style={{fontFamily:"var(--font-mono)"}}>{v}</span>
            </div>
          ))}
          <p className="text-white/25 text-[10px] text-center pt-2" style={{fontFamily:"var(--font-mono)"}}>{SCHOOL.address} · {SCHOOL.email}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <SchoolLogo size={44}/>
            <div><p className="font-black text-sm leading-tight" style={{color:P,fontFamily:"var(--font-display)"}}>{SCHOOL.full}</p><p className="text-xs text-[#1C1A17]/50">{SCHOOL.motto}</p></div>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-[#1C1A17] mb-1" style={{fontFamily:"var(--font-display)"}}>Staff Sign In</h2>
            <p className="text-sm text-[#1C1A17]/50">Access from any computer using your credentials</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17]/60 uppercase tracking-widest mb-1.5" style={{fontFamily:"var(--font-mono)"}}>Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="your.email@sihs-ndop.edu.cm" className="w-full px-3.5 py-2.5 rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 text-[#1C1A17] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 placeholder:text-[#1C1A17]/25"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17]/60 uppercase tracking-widest mb-1.5" style={{fontFamily:"var(--font-mono)"}}>Password</label>
              <div className="relative">
                <input type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} required autoComplete="current-password" placeholder="••••••••" className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 text-[#1C1A17] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 placeholder:text-[#1C1A17]/25"/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1C1A17]/30 hover:text-[#1C1A17]/60">{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button>
              </div>
            </div>
            {err&&(
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={14} className="flex-shrink-0"/>
                <p className="text-xs font-medium">{err}</p>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-white font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2" style={{background:P,fontFamily:"var(--font-display)"}}>{loading?<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Signing in…</>:"Sign In"}</button>
          </form>

          {/* Device troubleshooting — hidden, for admin use */}
          <div className="mt-5 border-t border-[#1C1A17]/08 pt-3">
            <button onClick={()=>setShowReset(v=>!v)} className="w-full text-center text-[10px] text-[#1C1A17]/20 hover:text-[#1C1A17]/40 transition-colors py-1">
              {showReset?"▲ hide":"Having trouble signing in?"}
            </button>
            {showReset&&<div className="mt-2 rounded-lg p-3 bg-[#FAFAF8] border border-[#1C1A17]/08 space-y-2">
              <p className="text-[10px] text-[#1C1A17]/50 leading-relaxed">If this is a new device or browser, local data may be out of sync. Resetting will restore factory defaults on this device only.</p>
              <button onClick={resetDevice} className="w-full py-2 rounded-lg border border-[#1C1A17]/10 text-xs font-semibold text-[#1C1A17]/50 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">Reset This Device</button>
            </div>}
          </div>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-[#1C1A17]/20" style={{fontFamily:"var(--font-mono)"}}>{SCHOOL.full} · v2.0 · {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({page,setPage,user,onLogout,collapsed,setCollapsed,currentYear,onYearPick}:{page:Page;setPage:(p:Page)=>void;user:AuthUser;onLogout:()=>void;collapsed:boolean;setCollapsed:(b:boolean)=>void;currentYear:string;onYearPick:()=>void}){
  return(
    <aside className={`flex flex-col h-full transition-all duration-200 ${collapsed?"w-16":"w-56"}`} style={{background:P,fontFamily:"var(--font-body)"}}>
      <div className={`flex items-center gap-3 px-3 py-3.5 border-b border-white/10 ${collapsed?"justify-center":""}`}>
        <SchoolLogo size={collapsed?30:38} className="flex-shrink-0"/>
        {!collapsed&&<div className="min-w-0"><p className="text-white font-bold text-xs truncate leading-tight" style={{fontFamily:"var(--font-display)"}}>St Isidore High School</p><p className="text-[#C8960C] text-[9px] font-semibold">Ndop · SIHS</p></div>}
      </div>
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto px-2">
        {NAV.filter(n=>{
          if(n.id==="users")return user.role==="superadmin";
          if(n.id==="session")return user.role==="admin"||user.role==="superadmin";
          if(n.id==="finance")return user.role!=="teacher";
          return true;
        }).map(({id,label,icon:Icon})=>{
          const active=page===id;
          return(<button key={id} onClick={()=>setPage(id as Page)} className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${active?"bg-[#C8960C] text-[#1C1A17] font-bold":"text-white/65 hover:text-white hover:bg-white/10"} ${collapsed?"justify-center":""}`}><Icon size={15} className="flex-shrink-0"/>{!collapsed&&<span className="truncate">{label}</span>}</button>);
        })}
      </nav>
      {!collapsed&&<div className="px-3 pb-1">
        {user.role==="superadmin"
          ?<button onClick={onYearPick} className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors group" title="Change academic year">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest" style={{fontFamily:"var(--font-mono)"}}>Year</span>
              <span className="flex items-center gap-1 text-[#C8960C] font-bold text-xs" style={{fontFamily:"var(--font-mono)"}}>{currentYear}<ChevronDown size={10} className="opacity-60 group-hover:opacity-100"/></span>
            </button>
          :<div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest" style={{fontFamily:"var(--font-mono)"}}>Year</span>
              <span className="text-[#C8960C] font-bold text-xs" style={{fontFamily:"var(--font-mono)"}}>{currentYear}</span>
            </div>}
      </div>}
      <div className={`border-t border-white/10 p-3 ${collapsed?"flex flex-col items-center gap-2":""}`}>
        {!collapsed&&<div className="flex items-center gap-2 px-1 mb-2"><Avatar name={user.name} size="sm"/><div className="min-w-0 flex-1"><p className="text-white text-xs font-semibold truncate">{user.name.split(" ").slice(-1)[0]}</p><p className="text-white/40 text-[10px] capitalize">{user.role}</p></div></div>}
        <button onClick={onLogout} className={`flex items-center gap-2 text-white/50 hover:text-white/90 text-xs px-2 py-1.5 rounded hover:bg-white/10 transition-colors ${collapsed?"":"w-full"}`}><LogOut size={13}/>{!collapsed&&"Sign out"}</button>
      </div>
      <button onClick={()=>setCollapsed(!collapsed)} className="hidden lg:flex items-center justify-center py-2 border-t border-white/10 text-white/30 hover:text-white/60 transition-colors">
        <ChevronRight size={14} className={`transition-transform duration-200 ${collapsed?"":"rotate-180"}`}/>
      </button>
    </aside>
  );
}
