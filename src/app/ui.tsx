import React from "react";
import { X } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import schoolLogo from "@/imports/logo.jpeg";
import { Role, inits, P } from "./shared";

export function SchoolLogo({size=48,className=""}:{size?:number;className?:string}){
  return <ImageWithFallback src={schoolLogo} alt="St. Isidore High School Logo" style={{width:size,height:size,objectFit:"contain"}} className={`rounded-full flex-shrink-0 ${className}`}/>;
}

const AVCOLORS=["bg-red-800","bg-rose-700","bg-red-700","bg-pink-800","bg-red-900","bg-rose-800","bg-fuchsia-800"];
export function Avatar({name,size="md"}:{name:string;size?:"sm"|"md"|"lg"}){
  const sz=size==="sm"?"w-7 h-7 text-[10px]":size==="lg"?"w-12 h-12 text-base":"w-9 h-9 text-sm";
  return(<div className={`${sz} ${AVCOLORS[name.charCodeAt(0)%AVCOLORS.length]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`} style={{fontFamily:"var(--font-display)"}}>{inits(name)}</div>);
}

export function Bdg({status}:{status:string}){
  const m:Record<string,string>={active:"bg-emerald-100 text-emerald-800 border-emerald-200",inactive:"bg-gray-100 text-gray-600 border-gray-200",present:"bg-green-100 text-green-800 border-green-200",absent:"bg-red-100 text-red-700 border-red-200",late:"bg-amber-100 text-amber-800 border-amber-200",paid:"bg-emerald-100 text-emerald-800 border-emerald-200",partial:"bg-amber-100 text-amber-800 border-amber-200",unpaid:"bg-red-100 text-red-700 border-red-200"};
  return(<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${m[status]??"bg-gray-100 text-gray-600 border-gray-200"}`} style={{fontFamily:"var(--font-mono)"}}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>);
}

export function Btn({children,onClick,variant="primary",size="md",type="button",disabled=false,className=""}:{children:React.ReactNode;onClick?:()=>void;variant?:"primary"|"secondary"|"ghost"|"danger";size?:"sm"|"md";type?:"button"|"submit";disabled?:boolean;className?:string}){
  const sz=size==="sm"?"px-3 py-1.5 text-xs":"px-4 py-2 text-sm";
  const v:Record<string,string>={primary:`bg-[${P}] text-white hover:opacity-90`,secondary:`bg-[#F3E8E8] text-[${P}] hover:bg-[#EDD8D8] border border-[${P}]/15`,ghost:`bg-transparent text-[${P}] hover:bg-[#F3E8E8]`,danger:"bg-red-600 text-white hover:bg-red-700"};
  return(<button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 font-semibold rounded transition-all duration-150 disabled:opacity-50 ${sz} ${v[variant]} ${className}`} style={{fontFamily:"var(--font-body)"}}>{children}</button>);
}

export function FI({label,value,onChange,type="text",placeholder,required,disabled}:{label?:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string;required?:boolean;disabled?:boolean}){
  return(<label className="flex flex-col gap-1">{label&&<span className="text-xs font-semibold text-[#1C1A17]/70 uppercase tracking-wide" style={{fontFamily:"var(--font-mono)"}}>{label}</span>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-[#1C1A17] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20" style={{fontFamily:"var(--font-body)"}}/></label>);
}

export function FS({label,value,onChange,options,required}:{label?:string;value:string;onChange:(v:string)=>void;options:string[];required?:boolean}){
  return(<label className="flex flex-col gap-1">{label&&<span className="text-xs font-semibold text-[#1C1A17]/70 uppercase tracking-wide" style={{fontFamily:"var(--font-mono)"}}>{label}</span>}<select value={value} onChange={e=>onChange(e.target.value)} required={required} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-[#1C1A17] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20" style={{fontFamily:"var(--font-body)"}}><option value="">— Select —</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></label>);
}

export function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}){
  return(<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(139,26,26,0.35)"}}><div className={`bg-white rounded-xl shadow-2xl w-full ${wide?"max-w-3xl":"max-w-xl"} max-h-[90vh] flex flex-col`}><div className="flex items-center justify-between px-6 py-4 border-b border-[#8B1A1A]/10"><h2 className="text-lg font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>{title}</h2><button onClick={onClose} className="p-1 rounded hover:bg-[#F3E8E8]" style={{color:P}}><X size={18}/></button></div><div className="overflow-y-auto flex-1 px-6 py-5">{children}</div></div></div>);
}

export function StatCard({label,value,icon:Icon,sub,color="crimson",onClick}:{label:string;value:string|number;icon:any;sub?:string;color?:string;onClick?:()=>void}){
  const cols:Record<string,string>={crimson:"bg-[#8B1A1A] text-white",gold:"bg-[#C8960C] text-white",slate:"bg-slate-700 text-white",teal:"bg-teal-700 text-white",red:"bg-red-600 text-white"};
  return(<div onClick={onClick} className={`bg-white rounded-xl p-5 flex items-start justify-between shadow-sm border border-[#8B1A1A]/08 ${onClick?"cursor-pointer hover:shadow-md hover:border-[#8B1A1A]/20 transition-all":""}`}><div><p className="text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>{label}</p><p className="text-3xl font-bold text-[#1C1A17]" style={{fontFamily:"var(--font-display)"}}>{value}</p>{sub&&<p className="text-xs text-[#1C1A17]/40 mt-1">{sub}</p>}</div><div className={`w-11 h-11 rounded-lg flex items-center justify-center ${cols[color]}`}><Icon size={20}/></div></div>);
}

export function roleBadge(role:Role){
  const cfg={superadmin:{label:"Super Admin",bg:"#7c3aed",text:"white"},admin:{label:"Admin",bg:P,text:"white"},teacher:{label:"Teacher",bg:"#0369a1",text:"white"}};
  const c=cfg[role];
  return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:c.bg,color:c.text,fontFamily:"var(--font-mono)"}}>{c.label}</span>;
}
