import React,{useState,useRef,useMemo,useEffect} from "react";
import {Edit2,Trash2,Save,Search,Plus,Eye,Download,Printer,CheckCircle,X,AlertTriangle,AlertCircle} from "lucide-react";
import * as XLSX from "xlsx";
import schoolLogo from "@/imports/logo.jpeg";
import {
  SCHOOL,P,SUBJECT_CATS,SECTION_META,SPECIALTIES,SEQ_META,MONTHS,CUR_MONTH,CUR_YEAR,FORMS,TERMS,CAT_COLORS,
  Teacher,PayrollRecord,AuthUser,Subject,Gender,Student,GradeRecord,AttRecord,ClassRoom,CouncilRemark,ExamSequence,Term,AttSt,Page,
  dbSet,uid,canAccess,fmtDate,fmtCfa,getSubjectCoef,termAvg,totalMks,remarkFor,remColor,
  exportAttendanceExcel,exportGradesExcel,exportReportCardPDF,exportAnnualReportPDF,
} from "../shared";
import {Avatar,Btn,FI,FS,Modal,Bdg,roleBadge} from "../ui";

// ─── Teachers / Payroll ───────────────────────────────────────────────────────
export function TeachersPage({teachers,setTeachers,subjects,payroll,setPayroll,user}:{teachers:Teacher[];setTeachers:(t:Teacher[])=>void;subjects:Subject[];payroll:PayrollRecord[];setPayroll:(p:PayrollRecord[])=>void;user:AuthUser}){
  const [tab,setTab]=useState<"staff"|"payroll">("staff");
  const [search,setSearch]=useState("");
  const [showM,setShowM]=useState(false);
  const [editing,setEditing]=useState<Teacher|null>(null);
  const [form,setForm]=useState<Partial<Teacher>>({});
  const [prMonth,setPrMonth]=useState(CUR_MONTH);
  const [prYear,setPrYear]=useState(CUR_YEAR);
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [bulkEdit,setBulkEdit]=useState(false);
  const [bulkForm,setBulkForm]=useState<Partial<PayrollRecord>>({});
  const [editingPr,setEditingPr]=useState<PayrollRecord|null>(null);
  const [prForm,setPrForm]=useState<Partial<PayrollRecord>>({});
  const [showPrModal,setShowPrModal]=useState(false);
  const [prSearch,setPrSearch]=useState("");
  const [slipPreview,setSlipPreview]=useState<PayrollRecord|null>(null);
  const slipRef=useRef<HTMLDivElement>(null);
  const filtered=teachers.filter(t=>{const q=search.toLowerCase();return!q||t.name.toLowerCase().includes(q)||t.subjects.some(s=>s.toLowerCase().includes(q));});
  function save(e:React.FormEvent){e.preventDefault();if(editing){const u=teachers.map(t=>t.id===editing.id?{...t,...form}as Teacher:t);setTeachers(u);dbSet("teachers",u);}else{const n:Teacher={...form as Teacher,id:"t"+uid(),staffId:`SIHS/STF/${String(teachers.length+1).padStart(3,"0")}`,joinedDate:new Date().toISOString().slice(0,10)};const u=[...teachers,n];setTeachers(u);dbSet("teachers",u);}setShowM(false);}
  function remove(id:string){if(!confirm("Remove staff?"))return;const u=teachers.filter(t=>t.id!==id);setTeachers(u);dbSet("teachers",u);}
  function getOrCreatePr(teacherId:string):PayrollRecord{const ex=payroll.find(p=>p.teacherId===teacherId&&p.month===prMonth&&p.year===prYear);if(ex)return ex;return{id:"pr"+uid(),teacherId,month:prMonth,year:prYear,baseSalary:85000,housingAllowance:20000,transportAllowance:15000,researchAllowance:10000,otherAllowances:0,incomeTax:0,socialSecurity:0,otherDeductions:0,isPaid:false,paidDate:"",notes:""};}
  function grossPay(p:PayrollRecord){return p.baseSalary+p.housingAllowance+p.transportAllowance+p.researchAllowance+p.otherAllowances;}
  function totalDed(p:PayrollRecord){return p.incomeTax+p.socialSecurity+p.otherDeductions;}
  function netPay(p:PayrollRecord){return grossPay(p)-totalDed(p);}
  function fmtXAF(n:number){return n.toLocaleString("fr-CM")+" XAF";}
  const prRows=teachers.filter(t=>!prSearch||t.name.toLowerCase().includes(prSearch.toLowerCase())).map(t=>({teacher:t,pr:getOrCreatePr(t.id)}));
  function savePrRecord(pr:PayrollRecord){const exists=payroll.find(p=>p.id===pr.id);const u=exists?payroll.map(p=>p.id===pr.id?pr:p):[...payroll,pr];setPayroll(u);dbSet("payroll",u);}
  function openEditPr(pr:PayrollRecord){setEditingPr(pr);setPrForm({...pr});setShowPrModal(true);}
  function savePrModal(e:React.FormEvent){e.preventDefault();const updated={...editingPr!,...prForm}as PayrollRecord;savePrRecord(updated);setShowPrModal(false);}
  function toggleSelect(tid:string){setSelected(s=>{const n=new Set(s);n.has(tid)?n.delete(tid):n.add(tid);return n;});}
  function selectAll(){setSelected(new Set(prRows.map(r=>r.teacher.id)));}
  function clearSel(){setSelected(new Set());}
  function applyBulkEdit(){const changed=payroll.map(p=>{if(!selected.has(p.teacherId)||p.month!==prMonth||p.year!==prYear)return p;const patch:Partial<PayrollRecord>={};if(bulkForm.baseSalary!==undefined)patch.baseSalary=Number(bulkForm.baseSalary);if(bulkForm.housingAllowance!==undefined)patch.housingAllowance=Number(bulkForm.housingAllowance);if(bulkForm.transportAllowance!==undefined)patch.transportAllowance=Number(bulkForm.transportAllowance);if(bulkForm.researchAllowance!==undefined)patch.researchAllowance=Number(bulkForm.researchAllowance);if(bulkForm.incomeTax!==undefined)patch.incomeTax=Number(bulkForm.incomeTax);if(bulkForm.socialSecurity!==undefined)patch.socialSecurity=Number(bulkForm.socialSecurity);return{...p,...patch};});const newRecs:PayrollRecord[]=[];selected.forEach(tid=>{if(!payroll.find(p=>p.teacherId===tid&&p.month===prMonth&&p.year===prYear)){const base=getOrCreatePr(tid);const patch:Partial<PayrollRecord>={};if(bulkForm.baseSalary!==undefined)patch.baseSalary=Number(bulkForm.baseSalary);if(bulkForm.housingAllowance!==undefined)patch.housingAllowance=Number(bulkForm.housingAllowance);if(bulkForm.transportAllowance!==undefined)patch.transportAllowance=Number(bulkForm.transportAllowance);if(bulkForm.researchAllowance!==undefined)patch.researchAllowance=Number(bulkForm.researchAllowance);if(bulkForm.incomeTax!==undefined)patch.incomeTax=Number(bulkForm.incomeTax);if(bulkForm.socialSecurity!==undefined)patch.socialSecurity=Number(bulkForm.socialSecurity);newRecs.push({...base,...patch,id:"pr"+uid()});}});const u=[...changed,...newRecs];setPayroll(u);dbSet("payroll",u);setBulkEdit(false);setBulkForm({});}
  function markPaid(tids:string[]){const today=new Date().toISOString().slice(0,10);let u=[...payroll];tids.forEach(tid=>{const idx=u.findIndex(p=>p.teacherId===tid&&p.month===prMonth&&p.year===prYear);if(idx>=0){u[idx]={...u[idx],isPaid:true,paidDate:today};}else{u.push({...getOrCreatePr(tid),isPaid:true,paidDate:today});}});setPayroll(u);dbSet("payroll",u);}
  function payslipHtml(pr:PayrollRecord,teacher:Teacher):string{const gross=grossPay(pr);const ded=totalDed(pr);const net=netPay(pr);return`<div style="border:2px solid #8B1A1A;border-radius:8px;padding:16px;margin-bottom:10px;max-width:580px"><div style="text-align:center;margin-bottom:10px"><div style="font-size:17px;font-weight:bold;color:#8B1A1A">${SCHOOL.full}</div><div style="font-size:11px">${SCHOOL.address}</div><div style="margin-top:6px;font-size:14px;font-weight:bold;background:#f0f0f0;padding:3px 12px;display:inline-block">PAYSLIP — ${pr.month.toUpperCase()} ${pr.year}</div></div><table style="margin-bottom:8px;width:100%"><tbody><tr><td style="font-weight:bold;font-size:11px;width:120px">Name:</td><td style="font-size:11px">${teacher.name}</td><td style="font-weight:bold;font-size:11px;width:100px">Staff ID:</td><td style="font-size:11px">${teacher.staffId}</td></tr><tr><td style="font-weight:bold;font-size:11px">Status:</td><td colspan="3" style="font-size:11px;color:${pr.isPaid?"#15803d":"#dc2626"};font-weight:bold">${pr.isPaid?"PAID — "+pr.paidDate:"PENDING"}</td></tr></tbody></table><table style="border-collapse:collapse;width:100%;margin-bottom:8px"><thead><tr style="background:#8B1A1A;color:#fff"><th style="padding:4px 8px;text-align:left;font-size:10px">EARNINGS</th><th style="padding:4px 8px;text-align:right;font-size:10px">AMOUNT (XAF)</th><th style="padding:4px 8px;text-align:left;font-size:10px">DEDUCTIONS</th><th style="padding:4px 8px;text-align:right;font-size:10px">AMOUNT (XAF)</th></tr></thead><tbody><tr><td style="padding:3px 8px;font-size:10px;border:1px solid #ddd">Basic Salary</td><td style="padding:3px 8px;font-size:10px;text-align:right;border:1px solid #ddd">${pr.baseSalary.toLocaleString("fr-CM")}</td><td style="padding:3px 8px;font-size:10px;border:1px solid #ddd">Income Tax</td><td style="padding:3px 8px;font-size:10px;text-align:right;border:1px solid #ddd">${pr.incomeTax.toLocaleString("fr-CM")}</td></tr><tr><td style="padding:3px 8px;font-size:10px;border:1px solid #ddd">Housing Allowance</td><td style="padding:3px 8px;font-size:10px;text-align:right;border:1px solid #ddd">${pr.housingAllowance.toLocaleString("fr-CM")}</td><td style="padding:3px 8px;font-size:10px;border:1px solid #ddd">Social Security</td><td style="padding:3px 8px;font-size:10px;text-align:right;border:1px solid #ddd">${pr.socialSecurity.toLocaleString("fr-CM")}</td></tr><tr><td style="padding:3px 8px;font-size:10px;border:1px solid #ddd">Transport Allowance</td><td style="padding:3px 8px;font-size:10px;text-align:right;border:1px solid #ddd">${pr.transportAllowance.toLocaleString("fr-CM")}</td><td style="padding:3px 8px;font-size:10px;border:1px solid #ddd">Other Deductions</td><td style="padding:3px 8px;font-size:10px;text-align:right;border:1px solid #ddd">${pr.otherDeductions.toLocaleString("fr-CM")}</td></tr><tr><td style="padding:3px 8px;font-size:10px;border:1px solid #ddd">Research Allowance</td><td style="padding:3px 8px;font-size:10px;text-align:right;border:1px solid #ddd">${pr.researchAllowance.toLocaleString("fr-CM")}</td><td style="border:1px solid #ddd"></td><td style="border:1px solid #ddd"></td></tr></tbody><tfoot><tr style="background:#f5f5f5;font-weight:bold"><td style="padding:4px 8px;font-size:11px;border:2px solid #999">GROSS PAY</td><td style="padding:4px 8px;font-size:11px;text-align:right;border:2px solid #999">${gross.toLocaleString("fr-CM")}</td><td style="padding:4px 8px;font-size:11px;border:2px solid #999">TOTAL DEDUCTIONS</td><td style="padding:4px 8px;font-size:11px;text-align:right;border:2px solid #999">${ded.toLocaleString("fr-CM")}</td></tr><tr style="background:#8B1A1A;color:#fff;font-weight:bold"><td colspan="2" style="padding:5px 8px;font-size:13px">NET PAY</td><td colspan="2" style="padding:5px 8px;font-size:15px;text-align:right">${net.toLocaleString("fr-CM")} XAF</td></tr></tfoot></table></div>`;}
  function printSlip(pr:PayrollRecord,teacher:Teacher){const w=window.open("","_blank","width=700,height=900");if(!w)return;w.document.write(`<!DOCTYPE html><html><head><style>body{margin:16px;font-family:Arial}</style></head><body>${payslipHtml(pr,teacher)}</body></html>`);w.document.close();setTimeout(()=>w.print(),500);}
  function printAllSlips(){const rows=prRows.filter(r=>selected.size===0||selected.has(r.teacher.id));const html=rows.map(({teacher,pr})=>payslipHtml(pr,teacher)).join('<div style="page-break-after:always"></div>');const w=window.open("","_blank","width=700,height=900");if(!w)return;w.document.write(`<!DOCTYPE html><html><head><style>body{margin:10px;font-family:Arial}</style></head><body>${html}</body></html>`);w.document.close();setTimeout(()=>w.print(),500);}
  function exportPayrollExcel(){const rows=prRows.map(({teacher,pr})=>[teacher.staffId,teacher.name,teacher.qualification,pr.month,pr.year,pr.baseSalary,pr.housingAllowance,pr.transportAllowance,pr.researchAllowance,pr.otherAllowances,grossPay(pr),pr.incomeTax,pr.socialSecurity,pr.otherDeductions,totalDed(pr),netPay(pr),pr.isPaid?"PAID":"PENDING",pr.paidDate||"",pr.notes]);const header=["Staff ID","Name","Qualification","Month","Year","Basic Salary","Housing Allow.","Transport Allow.","Research Allow.","Other Allow.","Gross Pay","Income Tax","Social Security","Other Deductions","Total Deductions","Net Pay","Status","Paid Date","Notes"];const ws=XLSX.utils.aoa_to_sheet([header,...rows]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Payroll");XLSX.writeFile(wb,`Payroll_${prMonth}_${prYear}.xlsx`);}
  const totalNetPayroll=prRows.reduce((s,r)=>s+netPay(r.pr),0);
  const totalPaid=prRows.filter(r=>r.pr.isPaid).length;
  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Staff & Payroll</h1><p className="text-sm text-[#1C1A17]/50">{teachers.length} staff members</p></div>{tab==="staff"&&<Btn onClick={()=>{setEditing(null);setForm({gender:"M",subjects:[]});setShowM(true);}}><Plus size={15}/>Add Staff</Btn>}</div>
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#8B1A1A]/08 shadow-sm w-fit">{([["staff","Staff Directory"],["payroll","Payroll"]] as const).map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} className="px-5 py-2 rounded-lg text-sm font-semibold transition-all" style={tab===id?{background:P,color:"#fff"}:{color:"#1C1A17",opacity:0.5}}>{label}</button>))}</div>
      {tab==="staff"&&<>
        <div className="relative max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1A17]/40"/><input placeholder="Search name or subject…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none"/></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map(t=>{const assignedSubs=subjects.filter(s=>s.teacherId===t.id);const pr=getOrCreatePr(t.id);return(<div key={t.id} className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08"><div className="flex items-start justify-between mb-3"><div className="flex items-center gap-3"><Avatar name={t.name}/><div><p className="font-bold text-[#1C1A17]">{t.name}</p><p className="text-[10px] text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>{t.staffId}</p></div></div><div className="flex gap-1"><button onClick={()=>{setEditing(t);setForm({...t,subjects:[...t.subjects]});setShowM(true);}} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Edit2 size={12}/></button><button onClick={()=>remove(t.id)} className="p-1.5 rounded hover:bg-red-50 text-red-300"><Trash2 size={12}/></button></div></div><div className="flex flex-wrap gap-1 mb-3">{assignedSubs.map(s=><span key={s.id} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CAT_COLORS[s.category]||""}`}>{s.name}</span>)}{assignedSubs.length===0&&t.subjects.map(s=><span key={s} className="px-2 py-0.5 rounded-full bg-[#F3E8E8] text-[10px] font-semibold" style={{color:P}}>{s}</span>)}</div><div className="text-xs text-[#1C1A17]/60 border-t border-[#8B1A1A]/06 pt-3 space-y-0.5"><p>{t.email}</p><p>{t.phone}</p><p className="text-[10px] text-[#1C1A17]/40">{t.qualification}</p></div><div className="mt-3 pt-2 border-t border-[#8B1A1A]/06 flex items-center justify-between"><div><p className="text-[10px] text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>Net Pay {prMonth}</p><p className="text-sm font-bold" style={{color:P}}>{fmtXAF(netPay(pr))}</p></div><div className="flex gap-1.5"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${pr.isPaid?"bg-green-100 text-green-700 border-green-200":"bg-amber-50 text-amber-700 border-amber-200"}`}>{pr.isPaid?"PAID":"PENDING"}</span><button onClick={()=>{setSlipPreview(pr);}} className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{color:P,borderColor:P+"44"}}>Payslip</button></div></div></div>);})}</div>
      </>}
      {tab==="payroll"&&canAccess(user,"admin")&&<div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[{label:"Total Net",val:fmtXAF(totalNetPayroll),color:P},{label:"Staff Count",val:String(teachers.length),color:"#1d4ed8"},{label:"Paid",val:`${totalPaid}/${teachers.length}`,color:"#15803d"},{label:"Pending",val:String(teachers.length-totalPaid),color:"#b45309"}].map(c=>(<div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-[#8B1A1A]/08"><p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-1" style={{fontFamily:"var(--font-mono)"}}>{c.label}</p><p className="text-lg font-bold" style={{color:c.color}}>{c.val}</p></div>))}</div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#8B1A1A]/08"><div className="flex flex-wrap gap-3 items-end">
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-2" style={{fontFamily:"var(--font-mono)"}}>Month</p><div className="flex gap-1 flex-wrap">{MONTHS.map(m=><button key={m} onClick={()=>setPrMonth(m)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border-2 transition-all" style={{borderColor:prMonth===m?P:"#e5e7eb",background:prMonth===m?P:"white",color:prMonth===m?"white":"#6b7280"}}>{m.slice(0,3)}</button>)}</div></div>
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-2" style={{fontFamily:"var(--font-mono)"}}>Year</p><div className="flex gap-1">{["2024","2025","2026"].map(y=><button key={y} onClick={()=>setPrYear(y)} className="px-3 py-1 rounded-lg text-[10px] font-bold border-2 transition-all" style={{borderColor:prYear===y?P:"#e5e7eb",background:prYear===y?P:"white",color:prYear===y?"white":"#6b7280"}}>{y}</button>)}</div></div>
          <div className="relative min-w-36"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1C1A17]/30"/><input value={prSearch} onChange={e=>setPrSearch(e.target.value)} placeholder="Name…" className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 focus:outline-none"/></div>
          <div className="flex gap-2 ml-auto flex-wrap">{selected.size>0&&<Btn onClick={()=>markPaid([...selected])}><CheckCircle size={13}/>Mark {selected.size} Paid</Btn>}{selected.size>0&&<Btn variant="secondary" onClick={()=>setBulkEdit(v=>!v)}><Edit2 size={13}/>Bulk Edit</Btn>}<Btn variant="secondary" onClick={exportPayrollExcel}><Download size={13}/>Excel</Btn><Btn variant="secondary" onClick={printAllSlips}><Printer size={13}/>Print Payslips</Btn></div>
        </div>
        {bulkEdit&&selected.size>0&&<div className="mt-4 pt-4 border-t border-[#8B1A1A]/06"><p className="text-xs font-bold mb-3" style={{color:P}}>Bulk Edit — {selected.size} staff selected</p><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{[["Basic Salary","baseSalary"],["Housing","housingAllowance"],["Transport","transportAllowance"],["Research","researchAllowance"],["Income Tax","incomeTax"],["Social Sec.","socialSecurity"]].map(([label,key])=>(<div key={key}><label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-1" style={{fontFamily:"var(--font-mono)"}}>{label}</label><input type="number" min={0} placeholder="—" value={(bulkForm as any)[key]??""} onChange={e=>setBulkForm(f=>({...f,[key]:e.target.value===""?undefined:Number(e.target.value)}))} className="w-full px-2 py-1.5 text-xs rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 focus:outline-none" style={{fontFamily:"var(--font-mono)"}}/></div>))}</div><div className="flex gap-2 mt-3"><Btn onClick={applyBulkEdit}><Save size={13}/>Apply</Btn><Btn variant="secondary" onClick={()=>setBulkEdit(false)}>Cancel</Btn></div></div>}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-xs border-collapse" style={{fontFamily:"var(--font-mono)"}}><thead><tr style={{background:"#1C1A17"}}><th className="px-3 py-3 text-center" style={{width:36}}><input type="checkbox" checked={selected.size===prRows.length&&prRows.length>0} onChange={e=>e.target.checked?selectAll():clearSel()} className="w-3.5 h-3.5"/></th>{["Staff","Basic","Allowances","Gross","Deductions","Net","Status","Actions"].map(h=><th key={h} className="px-3 py-3 text-left text-white font-bold" style={{fontSize:9}}>{h}</th>)}</tr></thead><tbody>{prRows.map(({teacher,pr},ri)=>{const gross=grossPay(pr);const ded=totalDed(pr);const net=netPay(pr);const isSel=selected.has(teacher.id);return(<tr key={teacher.id} className="border-b border-[#8B1A1A]/05 hover:bg-[#FDF5F5]/60" style={isSel?{background:"rgba(139,26,26,0.04)"}:{background:ri%2===0?"#fff":"#fafafa"}}><td className="px-3 py-3 text-center"><input type="checkbox" checked={isSel} onChange={()=>toggleSelect(teacher.id)} className="w-3.5 h-3.5"/></td><td className="px-3 py-3"><div className="flex items-center gap-2"><Avatar name={teacher.name} size="sm"/><div><p className="font-semibold text-[11px]">{teacher.name}</p><p className="text-[9px] text-[#1C1A17]/40">{teacher.staffId}</p></div></div></td><td className="px-3 py-3 text-[#1C1A17]/70">{pr.baseSalary.toLocaleString("fr-CM")}</td><td className="px-3 py-3 text-[#1C1A17]/70">{(pr.housingAllowance+pr.transportAllowance+pr.researchAllowance+pr.otherAllowances).toLocaleString("fr-CM")}</td><td className="px-3 py-3 font-semibold">{gross.toLocaleString("fr-CM")}</td><td className="px-3 py-3 text-red-600">{ded>0?"-"+ded.toLocaleString("fr-CM"):"—"}</td><td className="px-3 py-3 font-bold" style={{color:P}}>{net.toLocaleString("fr-CM")}</td><td className="px-3 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${pr.isPaid?"bg-green-100 text-green-700 border-green-200":"bg-amber-50 text-amber-700 border-amber-200"}`}>{pr.isPaid?"PAID":"PENDING"}</span></td><td className="px-3 py-3"><div className="flex gap-1"><button onClick={()=>openEditPr(pr)} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Edit2 size={12}/></button><button onClick={()=>setSlipPreview(pr)} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Eye size={12}/></button><button onClick={()=>printSlip(pr,teacher)} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Printer size={12}/></button>{!pr.isPaid&&<button onClick={()=>markPaid([teacher.id])} className="p-1.5 rounded hover:bg-green-50 text-green-600"><CheckCircle size={12}/></button>}</div></td></tr>);})}  </tbody><tfoot><tr style={{background:"#FDF5F5",borderTop:"2px solid #8B1A1A22"}}><td colSpan={3} className="px-3 py-2.5 font-bold text-[10px]" style={{color:P}}>TOTALS</td><td className="px-3 py-2.5 font-bold text-[10px]">{prRows.reduce((s,r)=>s+r.pr.housingAllowance+r.pr.transportAllowance+r.pr.researchAllowance+r.pr.otherAllowances,0).toLocaleString("fr-CM")}</td><td className="px-3 py-2.5 font-bold text-[10px]">{prRows.reduce((s,r)=>s+grossPay(r.pr),0).toLocaleString("fr-CM")}</td><td className="px-3 py-2.5 font-bold text-[10px] text-red-600">{prRows.reduce((s,r)=>s+totalDed(r.pr),0).toLocaleString("fr-CM")}</td><td className="px-3 py-2.5 font-bold text-[11px]" style={{color:P}}>{fmtXAF(totalNetPayroll)}</td><td colSpan={2} className="px-3 py-2.5 text-[10px] text-[#1C1A17]/50">{totalPaid}/{teachers.length} paid</td></tr></tfoot></table></div></div>
      </div>}
      {showPrModal&&editingPr&&<Modal title={`Edit Payroll — ${teachers.find(t=>t.id===editingPr.teacherId)?.name||""}`} onClose={()=>setShowPrModal(false)}><form onSubmit={savePrModal} className="space-y-4"><div className="grid grid-cols-2 gap-3">{([["Basic Salary","baseSalary"],["Housing Allowance","housingAllowance"],["Transport Allowance","transportAllowance"],["Research Allowance","researchAllowance"],["Other Allowances","otherAllowances"],["Income Tax","incomeTax"],["Social Security","socialSecurity"],["Other Deductions","otherDeductions"]] as [string,keyof PayrollRecord][]).map(([label,key])=>(<div key={key}><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>{label} (XAF)</label><input type="number" min={0} value={(prForm as any)[key]??0} onChange={e=>setPrForm(f=>({...f,[key]:Number(e.target.value)}))} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none" style={{fontFamily:"var(--font-mono)"}}/></div>))}</div>{(()=>{const tmp={...editingPr,...prForm}as PayrollRecord;return(<div className="rounded-xl p-3 border border-[#8B1A1A]/10 bg-[#FDF5F5] grid grid-cols-3 gap-3 text-center"><div><p className="text-[10px] text-[#1C1A17]/40 font-bold uppercase" style={{fontFamily:"var(--font-mono)"}}>Gross</p><p className="font-bold text-sm text-[#1C1A17]">{fmtXAF(grossPay(tmp))}</p></div><div><p className="text-[10px] text-red-500 font-bold uppercase" style={{fontFamily:"var(--font-mono)"}}>Deductions</p><p className="font-bold text-sm text-red-600">-{fmtXAF(totalDed(tmp))}</p></div><div><p className="text-[10px] font-bold uppercase" style={{color:P,fontFamily:"var(--font-mono)"}}>Net Pay</p><p className="font-bold text-base" style={{color:P}}>{fmtXAF(netPay(tmp))}</p></div></div>);})()}<div className="grid grid-cols-2 gap-3"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={prForm.isPaid??editingPr.isPaid} onChange={e=>setPrForm(f=>({...f,isPaid:e.target.checked,paidDate:e.target.checked?new Date().toISOString().slice(0,10):""}))} className="w-4 h-4"/><span className="text-sm">Mark as Paid</span></label>{(prForm.isPaid??editingPr.isPaid)&&<FI label="Paid Date" value={prForm.paidDate??editingPr.paidDate} onChange={v=>setPrForm(f=>({...f,paidDate:v}))} type="date"/>}</div><div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Notes</label><textarea value={prForm.notes??editingPr.notes} onChange={e=>setPrForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none resize-none"/></div><div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setShowPrModal(false)}>Cancel</Btn><Btn type="submit"><Save size={13}/>Save</Btn></div></form></Modal>}
      {slipPreview&&(()=>{const teacher=teachers.find(t=>t.id===slipPreview.teacherId)!;return(<Modal title={`Payslip — ${teacher?.name||""}`} onClose={()=>setSlipPreview(null)}><div className="space-y-3"><div ref={slipRef} dangerouslySetInnerHTML={{__html:payslipHtml(slipPreview,teacher)}}/><div className="flex gap-2 justify-end"><Btn variant="secondary" onClick={()=>openEditPr(slipPreview)}><Edit2 size={13}/>Edit</Btn><Btn onClick={()=>printSlip(slipPreview,teacher)}><Printer size={14}/>Print</Btn></div></div></Modal>);})()}
      {showM&&<Modal title={editing?"Edit Staff":"Add Staff"} onClose={()=>setShowM(false)}><form onSubmit={save} className="space-y-3"><FI label="Full Name" value={form.name||""} onChange={v=>setForm(f=>({...f,name:v}))} required/><div className="grid grid-cols-2 gap-3"><FS label="Gender" value={form.gender||""} onChange={v=>setForm(f=>({...f,gender:v as Gender}))} options={["M","F"]}/><FI label="Phone" value={form.phone||""} onChange={v=>setForm(f=>({...f,phone:v}))}/></div><FI label="Email" value={form.email||""} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/><FI label="Qualification" value={form.qualification||""} onChange={v=>setForm(f=>({...f,qualification:v}))}/><div className="flex justify-end gap-2 pt-2"><Btn variant="secondary" onClick={()=>setShowM(false)}>Cancel</Btn><Btn type="submit"><Save size={13}/>{editing?"Save":"Add Staff"}</Btn></div></form></Modal>}
    </div>
  );
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export function AttendancePage({students,attendance,setAttendance,classes,filterForm,setFilterForm,filterSpecialty,setFilterSpecialty}:{students:Student[];attendance:AttRecord[];setAttendance:(a:AttRecord[])=>void;classes:ClassRoom[];filterForm:string;setFilterForm:(f:string)=>void;filterSpecialty:string;setFilterSpecialty:(s:string)=>void}){
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [marks,setMarks]=useState<Record<string,AttSt>>({});
  const [saved,setSaved]=useState(false);
  const ff=filterForm||"Form 1";
  const classStudents=students.filter(s=>s.form===ff&&s.status==="active"&&(!filterSpecialty||s.specialty===filterSpecialty));
  const activeForms=[...new Set(classes.filter(c=>c.isActive).map(c=>c.form))];
  const ex=attendance.filter(a=>a.date===date&&a.form===ff);
  const initMarks:Record<string,AttSt>={};ex.forEach(a=>{initMarks[a.studentId]=a.status;});
  useState(()=>setMarks(initMarks));
  function mark(id:string,st:AttSt){setMarks(m=>({...m,[id]:st}));setSaved(false);}
  function markAll(st:AttSt){const all:Record<string,AttSt>={};classStudents.forEach(s=>{all[s.id]=st;});setMarks(all);setSaved(false);}
  function saveAtt(){const without=attendance.filter(a=>!(a.date===date&&a.form===ff));const recs:AttRecord[]=Object.entries(marks).map(([sid,st])=>({id:"a"+uid(),studentId:sid,date,status:st,form:ff}));const u=[...without,...recs];setAttendance(u);dbSet("attendance",u);setSaved(true);}
  const sum={present:Object.values(marks).filter(m=>m==="present").length,absent:Object.values(marks).filter(m=>m==="absent").length,late:Object.values(marks).filter(m=>m==="late").length};
  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Attendance Register</h1><p className="text-sm text-[#1C1A17]/50">Mark daily attendance by class</p></div><Btn variant="secondary" onClick={()=>exportAttendanceExcel(ff,students,attendance)}><Download size={13}/>Export Excel</Btn></div>
      <div className="flex flex-wrap items-end gap-4">
        <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Date</label><input type="date" value={date} onChange={e=>{setDate(e.target.value);setSaved(false);}} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none"/></div>
        <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Class</label><select value={ff} onChange={e=>setFilterForm(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none">{(activeForms.length>0?activeForms:FORMS).map(f=><option key={f} value={f}>{f}</option>)}</select></div>
        <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Specialty</label><select value={filterSpecialty} onChange={e=>setFilterSpecialty(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none"><option value="">All</option>{SPECIALTIES.map(sp=><option key={sp.id} value={sp.id}>{sp.short}</option>)}</select></div>
        <div className="flex gap-2"><Btn variant="secondary" size="sm" onClick={()=>markAll("present")}><CheckCircle size={12}/>All Present</Btn><Btn variant="secondary" size="sm" onClick={()=>markAll("absent")}><X size={12}/>All Absent</Btn></div>
      </div>
      <div className="flex gap-3 flex-wrap text-xs" style={{fontFamily:"var(--font-mono)"}}>{[{l:"Present",c:sum.present,cl:"text-green-700 bg-green-100 border-green-200"},{l:"Absent",c:sum.absent,cl:"text-red-700 bg-red-100 border-red-200"},{l:"Late",c:sum.late,cl:"text-amber-700 bg-amber-100 border-amber-200"},{l:"Unmarked",c:classStudents.length-Object.keys(marks).length,cl:"text-gray-600 bg-gray-100 border-gray-200"}].map(({l,c,cl})=><span key={l} className={`px-2.5 py-1 rounded-lg border font-semibold ${cl}`}>{c} {l}</span>)}</div>
      <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-[#FDF5F5] border-b border-[#8B1A1A]/08">{["Student","Present","Absent","Late"].map(h=><th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{h}</th>)}</tr></thead><tbody className="divide-y divide-[#8B1A1A]/05">{classStudents.length===0?<tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[#1C1A17]/40">No active students in {ff}.</td></tr>:classStudents.map(s=>{const st=marks[s.id];return(<tr key={s.id} className={`hover:bg-[#FDF5F5]/60 ${st?"":"bg-amber-50/30"}`}><td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={s.name} size="sm"/><span className="font-semibold">{s.name}</span></div></td>{(["present","absent","late"] as AttSt[]).map(a=><td key={a} className="px-4 py-3"><button onClick={()=>mark(s.id,a)} className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${st===a?a==="present"?"bg-green-500 border-green-500 text-white":a==="absent"?"bg-red-500 border-red-500 text-white":"bg-amber-500 border-amber-500 text-white":"border-gray-300 hover:border-gray-400"}`}>{st===a&&<CheckCircle size={10}/>}</button></td>)}</tr>);})}</tbody></table></div>
      <div className="flex items-center gap-3"><Btn onClick={saveAtt}><Save size={14}/>Save Attendance</Btn>{saved&&<span className="text-sm text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={14}/>Saved</span>}</div>
    </div>
  );
}

// ─── Grade Entry ──────────────────────────────────────────────────────────────
export function GradesPage({students,grades,setGrades,subjects,classes,teachers,filterForm,setFilterForm,filterSubject,setFilterSubject,filterSpecialty,setFilterSpecialty}:{students:Student[];grades:GradeRecord[];setGrades:(g:GradeRecord[])=>void;subjects:Subject[];classes:ClassRoom[];teachers:Teacher[];filterForm:string;setFilterForm:(f:string)=>void;filterSubject:string;setFilterSubject:(s:string)=>void;filterSpecialty:string;setFilterSpecialty:(s:string)=>void}){
  const initCat=useMemo(()=>{if(!filterSubject)return"lang";const cat=SUBJECT_CATS.find(c=>c.subs.some(s=>s.n===filterSubject));return cat?cat.id:"lang";},[filterSubject]);
  const [ft,setFt]=useState<Term>("1");
  const [fc,setFc]=useState(initCat);
  const [showM,setShowM]=useState(false);
  const [editG,setEditG]=useState<GradeRecord|null>(null);
  const [form,setForm]=useState<Partial<GradeRecord>>({});
  const [selSt,setSelSt]=useState<Student|null>(null);
  const [selSub,setSelSub]=useState<{n:string;c:number}|null>(null);
  useEffect(()=>{if(filterSubject){const cat=SUBJECT_CATS.find(c=>c.subs.some(s=>s.n===filterSubject));if(cat)setFc(cat.id);}},[filterSubject]);
  const ff=filterForm||"Form 1";
  const activeForms=[...new Set(classes.filter(c=>c.isActive).map(c=>c.form))];
  const cat=SUBJECT_CATS.find(c=>c.id===fc)!;
  const activeSubsInCat=cat?cat.subs.filter(s=>{const subRec=subjects.find(x=>x.name===s.n);return subRec?subRec.isActive:true;}):[];
  const classStudents=students.filter(s=>s.form===ff&&s.status==="active"&&(!filterSpecialty||s.specialty===filterSpecialty));
  const gMap=useMemo(()=>{const m:Record<string,Record<string,GradeRecord>>={};grades.filter(g=>g.form===ff&&g.term===ft).forEach(g=>{if(!m[g.studentId])m[g.studentId]={};m[g.studentId][g.subject]=g;});return m;},[grades,ff,ft]);
  function openEntry(s:Student,sub:{n:string;c:number}){setSelSt(s);setSelSub(sub);const coef=getSubjectCoef(sub.n,ff,subjects);const ex=gMap[s.id]?.[sub.n];if(ex){setEditG(ex);setForm({...ex});}else{setEditG(null);setForm({studentId:s.id,subject:sub.n,term:ft,form:ff,year:SCHOOL.year,coef,seq1:null,seq2:null,teacherName:"",remark:""});}setShowM(true);}
  function save(e:React.FormEvent){e.preventDefault();const seq1=form.seq1??null;const seq2=form.seq2??null;const coef=getSubjectCoef(selSub?.n||"",ff,subjects);const remark=form.remark||remarkFor((seq1!==null&&seq2!==null)?((seq1+seq2)/2):null);if(editG){const u=grades.map(g=>g.id===editG.id?{...g,...form,seq1,seq2,coef,remark}as GradeRecord:g);setGrades(u);dbSet("grades",u);}else{const n:GradeRecord={...form as GradeRecord,id:"g"+uid(),seq1,seq2,coef,remark};const u=[...grades,n];setGrades(u);dbSet("grades",u);}setShowM(false);}
  const s1=form.seq1??null;const s2=form.seq2??null;
  const pAvg=(s1!==null&&s2!==null)?Math.round(((s1+s2)/2)*10)/10:null;
  const pCoef=selSub?getSubjectCoef(selSub.n,ff,subjects):0;
  const pTot=pAvg!==null?Math.round(pAvg*pCoef*10)/10:null;
  const subjectT=subjects.find(s=>s.name===selSub?.n);
  const assignedTeacher=subjectT?teachers.find(t=>t.id===subjectT.teacherId):null;
  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Grade Entry</h1><p className="text-sm text-[#1C1A17]/50">Sequence 1 &amp; 2 scores /20</p></div><Btn variant="secondary" onClick={()=>exportGradesExcel(ff,ft,SCHOOL.year,students,grades,subjects)}><Download size={13}/>Export Excel</Btn></div>
      <div className="flex flex-wrap gap-3">
        <select value={ff} onChange={e=>setFilterForm(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none">{(activeForms.length>0?activeForms:FORMS).map(f=><option key={f} value={f}>{f}</option>)}</select>
        <select value={ft} onChange={e=>setFt(e.target.value as Term)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none">{TERMS.map(t=><option key={t} value={t}>Term {t}</option>)}</select>
        <select value={fc} onChange={e=>setFc(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none">{SUBJECT_CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <select value={filterSpecialty} onChange={e=>setFilterSpecialty(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none"><option value="">All Specialties</option>{SPECIALTIES.map(sp=><option key={sp.id} value={sp.id}>{sp.short}</option>)}</select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden"><div className="px-5 py-3 flex items-center justify-between" style={{background:P}}><h3 className="text-white font-bold text-sm">{ff} · {cat?.label} · Term {ft}</h3><span className="text-white/50 text-xs">{classStudents.length} students</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-[#FDF5F5] border-b border-[#8B1A1A]/08"><th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50 sticky left-0 bg-[#FDF5F5]" style={{fontFamily:"var(--font-mono)"}}>Student</th>{activeSubsInCat.map(sub=>{const coef=getSubjectCoef(sub.n,ff,subjects);return(<th key={sub.n} className="text-center px-2 py-3 text-[10px] font-bold text-[#1C1A17]/50 min-w-[90px]" style={{fontFamily:"var(--font-mono)"}}><div className="text-[9px]">{sub.n.slice(0,14)}</div><div className="text-[#C8960C]">Coef {coef}</div></th>);})}</tr></thead><tbody className="divide-y divide-[#8B1A1A]/05">{classStudents.length===0?<tr><td colSpan={activeSubsInCat.length+1} className="px-4 py-8 text-center text-sm text-[#1C1A17]/40">No students in {ff}.</td></tr>:classStudents.map(s=>(<tr key={s.id} className="hover:bg-[#FDF5F5]/60"><td className="px-4 py-2.5 sticky left-0 bg-white border-r border-[#8B1A1A]/06"><div className="flex items-center gap-2"><Avatar name={s.name} size="sm"/><span className="font-semibold text-xs">{s.name}</span></div></td>{activeSubsInCat.map(sub=>{const g=gMap[s.id]?.[sub.n];const avg=g?termAvg(g):null;return(<td key={sub.n} className="px-2 py-2 text-center"><button onClick={()=>openEntry(s,sub)} className="w-full px-2 py-1.5 rounded-lg hover:bg-[#F3E8E8] transition-colors group">{g&&avg!==null?<div><span className="font-bold text-sm" style={{fontFamily:"var(--font-mono)",color:remColor(g.remark)}}>{avg.toFixed(1)}</span><div className="text-[9px] text-[#1C1A17]/40">{g.remark.slice(0,10)}</div></div>:<span className="text-[#1C1A17]/20 text-lg group-hover:opacity-60" style={{color:P}}>+</span>}</button></td>);})}</tr>))}</tbody></table></div></div>
      {showM&&selSt&&selSub&&<Modal title="Enter Grade" onClose={()=>setShowM(false)}><form onSubmit={save} className="space-y-4"><div className="flex items-center gap-3 p-3 rounded-lg" style={{background:"#FDF5F5"}}><Avatar name={selSt.name} size="sm"/><div><p className="text-sm font-bold" style={{color:P}}>{selSt.name}</p><p className="text-xs text-[#1C1A17]/60">{selSub.n} · Term {ft} · Coef {pCoef}{assignedTeacher&&` · ${assignedTeacher.name}`}</p></div></div><div className="grid grid-cols-2 gap-4">{[["Sequence 1 /20","seq1"],["Sequence 2 /20","seq2"]].map(([lbl,key])=><div key={key}><label className="block text-xs font-bold uppercase tracking-widest text-[#1C1A17]/50 mb-1.5" style={{fontFamily:"var(--font-mono)"}}>{lbl}</label><input type="number" min={0} max={20} step={0.5} value={(form as any)[key]??""} onChange={e=>setForm(f=>({...f,[key]:e.target.value===''?null:Number(e.target.value)}))} className="w-full px-3 py-2.5 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-lg font-bold focus:outline-none text-center" style={{fontFamily:"var(--font-mono)"}}/></div>)}</div><div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg text-center" style={{background:"#FDF5F5"}}><div><p className="text-[10px] opacity-60 mb-0.5" style={{fontFamily:"var(--font-mono)",color:P}}>Term Avg</p><p className="text-xl font-bold" style={{color:remColor(remarkFor(pAvg))}}>{pAvg?.toFixed(1)||"—"}</p></div><div><p className="text-[10px] opacity-60 mb-0.5" style={{fontFamily:"var(--font-mono)",color:P}}>Total</p><p className="text-xl font-bold" style={{color:P}}>{pTot?.toFixed(1)||"—"}</p></div><div><p className="text-[10px] opacity-60 mb-0.5" style={{fontFamily:"var(--font-mono)",color:P}}>Remark</p><p className="text-xs font-bold" style={{color:remColor(remarkFor(pAvg))}}>{remarkFor(pAvg)||"—"}</p></div></div><FI label="Teacher Name" value={form.teacherName||assignedTeacher?.name||""} onChange={v=>setForm(f=>({...f,teacherName:v}))}/><div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setShowM(false)}>Cancel</Btn><Btn type="submit"><Save size={13}/>Save Grade</Btn></div></form></Modal>}
    </div>
  );
}

// ─── Annual Report Print ──────────────────────────────────────────────────────
function AnnualReportPrint({student,grades,council,year,students,subjects}:{student:Student;grades:GradeRecord[];council:CouncilRemark[];year:string;students:Student[];subjects:Subject[]}){
  const b="1px solid #000";
  const td:React.CSSProperties={border:b,padding:"2px 5px",fontSize:10};
  const th:React.CSSProperties={border:b,padding:"3px 5px",fontSize:10,fontWeight:"bold",background:"#e8e8e8",textAlign:"center"};
  const specialty=SPECIALTIES.find(s=>s.id===student.specialty);

  // Only include subjects this student has grades for in this year
  const takenSubs=new Set(grades.filter(g=>g.studentId===student.id&&g.year===year).map(g=>g.subject));

  let grandAnnual=0,grandCoef=0;
  const catRows=SUBJECT_CATS.map(cat=>{
    const rows=cat.subs
      .filter(sub=>takenSubs.has(sub.n))
      .map(sub=>{
        const termAvgs:Array<number|null>=["1","2","3"].map(t=>{
          const g=grades.find(g=>g.studentId===student.id&&g.subject===sub.n&&g.term===t as Term&&g.year===year);
          return g?termAvg(g):null;
        });
        const coef=getSubjectCoef(sub.n,student.form,subjects);
        const defined=termAvgs.filter((a):a is number=>a!==null);
        const annualAvg=defined.length>0?Math.round((defined.reduce((a,b)=>a+b,0)/defined.length)*100)/100:null;
        const annualTot=annualAvg!==null?Math.round(annualAvg*coef*100)/100:null;
        if(annualTot!==null){grandAnnual+=annualTot;grandCoef+=coef;}
        return{name:sub.n,t1:termAvgs[0],t2:termAvgs[1],t3:termAvgs[2],coef,annualAvg,annualTot};
      });
    return{cat:cat.label,catShort:cat.short,rows};
  }).filter(c=>c.rows.length>0); // skip categories with no grades

  const annualGrandAvg=grandCoef>0?Math.round((grandAnnual/grandCoef)*100)/100:null;
  const classTotals=students.filter(s=>s.form===student.form&&s.status==="active").map(s=>{
    let tot=0,coef=0;
    ["1","2","3"].forEach(t=>{grades.filter(g=>g.studentId===s.id&&g.term===t as Term&&g.year===year).forEach(g=>{const a=termAvg(g);if(a!==null){tot+=a*g.coef;coef+=g.coef;}});});
    return{id:s.id,avg:coef>0?tot/coef:0};
  }).sort((a,b)=>b.avg-a.avg);
  const pos=classTotals.findIndex(c=>c.id===student.id)+1;
  const annualCouncil=council.find(c=>c.studentId===student.id&&c.term==="3"&&c.year===year)||council.find(c=>c.studentId===student.id&&c.year===year);

  return(
    <div style={{fontFamily:"Arial,sans-serif",maxWidth:750,margin:"0 auto",padding:"8px",fontSize:11,color:"#000"}}>
      {/* Header */}
      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:5}}><tbody><tr>
        <td style={{width:64,textAlign:"center",verticalAlign:"middle"}}><img src={schoolLogo} alt="SIHS" style={{width:56,height:56,objectFit:"contain",borderRadius:"50%"}}/></td>
        <td style={{textAlign:"center",verticalAlign:"middle"}}>
          <div style={{fontSize:17,fontWeight:"bold",color:"#8B1A1A"}}>{SCHOOL.full}</div>
          <div style={{fontSize:10,color:"#555"}}>{SCHOOL.address} | {SCHOOL.email}</div>
          <div style={{fontSize:13,fontWeight:"bold",background:"#ccc",padding:"2px 10px",marginTop:3,display:"inline-block"}}>ANNUAL EXAMINATION REPORT — {year}</div>
        </td>
      </tr></tbody></table>

      {/* Student info */}
      <table style={{width:"100%",borderCollapse:"collapse",border:b,marginBottom:4,fontSize:10}}>
        <tbody>
          <tr>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>STUDENT:</td>
            <td style={{...td,fontWeight:"bold",fontSize:13,width:"40%"}}>{student.name.toUpperCase()}</td>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>FORM:</td>
            <td style={{...td,width:"30%"}}>{student.form}</td>
          </tr>
          <tr>
            <td style={td}>SECTION:</td>
            <td style={td}>{SECTION_META.find(s=>s.id===student.section)?.label||""}{specialty?` — ${specialty.label}`:""}</td>
            <td style={td}>REPEATER:</td>
            <td style={td}>{student.repeater?"Yes":"No"}</td>
          </tr>
        </tbody>
      </table>

      {/* Marks table — 9 columns: [sidebar][Subject][T1][T2][T3][Coef][Ann.Avg][Total][Remark] */}
      {catRows.length===0
        ?<div style={{padding:"20px",textAlign:"center",border:b,color:"#999",fontStyle:"italic"}}>No grades recorded for this student in {year}.</div>
        :<table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr>
              <th style={{...th,width:14,padding:0}}></th>{/* sidebar */}
              <th style={{...th,textAlign:"left",paddingLeft:5,width:"24%"}}>SUBJECTS</th>
              <th style={{...th,width:"9%",color:"#8B1A1A"}}>Term 1</th>
              <th style={{...th,width:"9%",color:"#1d4ed8"}}>Term 2</th>
              <th style={{...th,width:"9%",color:"#15803d"}}>Term 3</th>
              <th style={{...th,width:"6%"}}>Coef</th>
              <th style={{...th,width:"10%"}}>Annual Avg</th>
              <th style={{...th,width:"9%"}}>Total</th>
              <th style={{...th,width:"12%"}}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {catRows.map(cat=>(
              <React.Fragment key={cat.cat}>
                {cat.rows.map((row,si)=>{
                  const rc=row.annualAvg!==null&&row.annualAvg<10?"#dc2626":"#000";
                  return(
                    <tr key={row.name}>
                      {si===0&&<td rowSpan={cat.rows.length} style={{border:b,width:14,padding:0,textAlign:"center",background:"#f4f4f4"}}>
                        <div style={{writingMode:"vertical-rl",transform:"rotate(180deg)",fontWeight:"bold",fontSize:8,padding:"4px 2px",letterSpacing:1,color:"#8B1A1A"}}>{cat.catShort}</div>
                      </td>}
                      <td style={{...td,paddingLeft:6}}>{row.name}</td>
                      <td style={{...td,textAlign:"center",color:"#8B1A1A"}}>{row.t1!=null?row.t1.toFixed(2):"—"}</td>
                      <td style={{...td,textAlign:"center",color:"#1d4ed8"}}>{row.t2!=null?row.t2.toFixed(2):"—"}</td>
                      <td style={{...td,textAlign:"center",color:"#15803d"}}>{row.t3!=null?row.t3.toFixed(2):"—"}</td>
                      <td style={{...td,textAlign:"center"}}>{row.coef}</td>
                      <td style={{...td,textAlign:"center",fontWeight:"bold",color:rc}}>{row.annualAvg!=null?row.annualAvg.toFixed(2):"—"}</td>
                      <td style={{...td,textAlign:"center",color:rc}}>{row.annualTot!=null?row.annualTot.toFixed(2):"—"}</td>
                      <td style={{...td,fontSize:9,color:rc}}>{row.annualAvg!=null?remarkFor(row.annualAvg):""}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            {/* Totals — colSpans sum to 9 */}
            <tr style={{background:"#ffe8e8"}}>
              <td colSpan={2} style={{...td,fontWeight:"bold"}}>TOTALS</td>
              <td colSpan={3} style={td}></td>
              <td style={{...td,textAlign:"center",fontWeight:"bold"}}>{grandCoef||""}</td>
              <td style={{...td,textAlign:"center",fontWeight:"bold",color:"#8B1A1A"}}>{annualGrandAvg?.toFixed(2)||"—"}</td>
              <td style={{...td,textAlign:"center",fontWeight:"bold"}}>{Math.round(grandAnnual)||""}</td>
              <td style={td}></td>
            </tr>
          </tbody>
        </table>}

      {/* Summary */}
      <table style={{width:"100%",borderCollapse:"collapse",marginTop:0}}>
        <tbody>
          <tr style={{background:"#ffe8e8"}}>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>ANNUAL AVG</td>
            <td style={{...td,textAlign:"center",fontWeight:"bold",fontSize:14,color:"#8B1A1A",width:"15%"}}>{annualGrandAvg?.toFixed(2)||"—"}</td>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>GRAND TOTAL</td>
            <td style={{...td,textAlign:"center",fontWeight:"bold",width:"15%"}}>{Math.round(grandAnnual)||"—"}</td>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>POSITION</td>
            <td style={{...td,textAlign:"center",fontWeight:"bold",width:"10%"}}>{pos>0?`${pos}/${classTotals.length}`:"—"}</td>
            <td style={{...td,fontWeight:"bold",color:annualGrandAvg!==null&&annualGrandAvg>=10?"#16a34a":"#dc2626",width:"15%"}}>{annualGrandAvg!==null?(annualGrandAvg>=10?"PROMOTED":"REPEATED"):"PENDING"}</td>
          </tr>
        </tbody>
      </table>

      {/* Council remarks */}
      <table style={{width:"100%",borderCollapse:"collapse",marginTop:3}}>
        <thead><tr><th colSpan={4} style={{...th,background:"#8B1A1A",color:"#fff",textAlign:"center",fontSize:11}}>ANNUAL COUNCIL REMARKS</th></tr></thead>
        <tbody>
          <tr>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>Attitude:</td>
            <td style={{...td,width:"35%",fontStyle:"italic"}}>{annualCouncil?.attitude||"—"}</td>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>Conduct:</td>
            <td style={{...td,fontStyle:"italic"}}>{annualCouncil?.conduct||"—"}</td>
          </tr>
          <tr>
            <td style={{...td,fontWeight:"bold"}}>Principal's Remark:</td>
            <td colSpan={3} style={{...td,fontStyle:"italic"}}>{annualCouncil?.principalRemark||""}</td>
          </tr>
          <tr>
            <td style={{...td,fontWeight:"bold"}}>Decision:</td>
            <td colSpan={3} style={{...td,fontWeight:"bold",fontSize:13,color:annualGrandAvg!==null&&annualGrandAvg>=10?"#16a34a":"#dc2626"}}>{annualCouncil?.decision||"PENDING"}</td>
          </tr>
          <tr>
            <td style={{...td,fontWeight:"bold"}}>Signature:</td>
            <td style={{...td,minHeight:28}}></td>
            <td style={{...td,fontWeight:"bold"}}>Date:</td>
            <td style={td}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Report Card Print ────────────────────────────────────────────────────────
function ReportCardPrint({student,grades,council,term,year,students,subjects}:{student:Student;grades:GradeRecord[];council:CouncilRemark|undefined;term:Term;year:string;students:Student[];subjects:Subject[]}){
  const gMap:Record<string,GradeRecord>={};
  grades.filter(g=>g.studentId===student.id&&g.term===term&&g.year===year).forEach(g=>{gMap[g.subject]=g;});

  // Only count subjects with actual entries
  const subjectRows=SUBJECT_CATS.flatMap(cat=>cat.subs.map(sub=>{
    const g=gMap[sub.n];
    const avg=g?termAvg(g):null;
    const tot=g?totalMks(g):null;
    const coef=getSubjectCoef(sub.n,student.form,subjects);
    const rem=g?.remark||"";
    return{cat:cat.id,catShort:cat.short,catLabel:cat.label,subName:sub.n,g,avg,tot,coef,rem};
  }));

  let grandTotal=0,grandCoef=0;
  subjectRows.forEach(r=>{if(r.tot!==null){grandTotal+=r.tot;grandCoef+=r.coef;}});
  const termAvgOverall=grandCoef>0?Math.round((grandTotal/grandCoef)*10)/10:null;
  const passed=termAvgOverall!==null&&termAvgOverall>=10;

  const classTotals=students.filter(s=>s.form===student.form&&s.status==="active").map(s=>{
    let tot=0,coef=0;
    grades.filter(g=>g.studentId===s.id&&g.term===term&&g.year===year).forEach(g=>{const t=totalMks(g);if(t!==null){tot+=t;coef+=g.coef;}});
    return{id:s.id,avg:coef>0?tot/coef:0};
  }).sort((a,b)=>b.avg-a.avg);
  const position=classTotals.findIndex(c=>c.id===student.id)+1;

  // Table styles
  const b="1px solid #000";
  const td:React.CSSProperties={border:b,padding:"2px 5px",fontSize:10};
  const th:React.CSSProperties={border:b,padding:"3px 5px",fontSize:10,fontWeight:"bold",background:"#e8e8e8",textAlign:"center"};
  // 9 columns: [sidebar] [Subject] [Seq1] [Seq2] [Avg] [Coef] [Total] [Remark] [Teacher]

  // Group by category for sidebar rowspan
  const cats=SUBJECT_CATS.map(cat=>({...cat,rows:subjectRows.filter(r=>r.cat===cat.id)}));

  return(
    <div style={{fontFamily:"Arial,sans-serif",maxWidth:760,margin:"0 auto",padding:"8px",fontSize:11,color:"#000"}}>
      {/* Header */}
      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:5}}><tbody><tr>
        <td style={{width:64,textAlign:"center",verticalAlign:"middle"}}><img src={schoolLogo} alt="SIHS" style={{width:56,height:56,objectFit:"contain",borderRadius:"50%"}}/></td>
        <td style={{textAlign:"center",verticalAlign:"middle"}}>
          <div style={{fontSize:17,fontWeight:"bold",letterSpacing:1,color:"#8B1A1A"}}>{SCHOOL.full}</div>
          <div style={{fontSize:10,color:"#555"}}>{SCHOOL.address} · {SCHOOL.email}</div>
          <div style={{fontSize:10,fontStyle:"italic",color:"#777"}}>{SCHOOL.motto}</div>
          <div style={{fontSize:13,fontWeight:"bold",background:"#ccc",padding:"2px 10px",marginTop:3,display:"inline-block"}}>ACADEMIC REPORT — TERM {term} — {year}</div>
        </td>
      </tr></tbody></table>

      {/* Student info */}
      <table style={{width:"100%",borderCollapse:"collapse",border:b,marginBottom:4,fontSize:10}}>
        <tbody>
          <tr>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>STUDENT:</td>
            <td style={{...td,fontWeight:"bold",fontSize:12,width:"35%"}}>{student.name.toUpperCase()}</td>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>FORM:</td>
            <td style={{...td,width:"35%"}}>{student.form}</td>
          </tr>
          <tr>
            <td style={td}>SECTION:</td>
            <td style={td}>{SECTION_META.find(s=>s.id===student.section)?.label||""}{SPECIALTIES.find(x=>x.id===student.specialty)?` — ${SPECIALTIES.find(x=>x.id===student.specialty)!.label}`:""}</td>
            <td style={td}>REPEATER:</td>
            <td style={td}>{student.repeater?"Yes":"No"}</td>
          </tr>
          <tr>
            <td style={td}>DOB:</td>
            <td style={td}>{fmtDate(student.dob)}</td>
            <td style={td}>POSITION:</td>
            <td style={{...td,fontWeight:"bold"}}>{position>0?`${position} / ${classTotals.length}`:"—"}</td>
          </tr>
        </tbody>
      </table>

      {/* Marks table — 9 columns */}
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr>
            <th style={{...th,width:14,padding:0}}></th>{/* sidebar */}
            <th style={{...th,textAlign:"left",paddingLeft:5,width:"22%"}}>SUBJECTS</th>
            <th style={{...th,width:"7%"}}>Seq 1</th>
            <th style={{...th,width:"7%"}}>Seq 2</th>
            <th style={{...th,width:"8%"}}>Term Avg</th>
            <th style={{...th,width:"5%"}}>Coef</th>
            <th style={{...th,width:"8%"}}>Total</th>
            <th style={{...th,width:"10%"}}>Remark</th>
            <th style={{...th,width:"13%"}}>Teacher</th>
          </tr>
        </thead>
        <tbody>
          {cats.map(cat=>(<React.Fragment key={cat.id}>
            {cat.rows.map((row,si)=>{
              const rc=row.avg!==null&&row.avg<10?"#dc2626":"#000";
              const rowBg=row.g?"#fff":"#fafafa";
              return(
                <tr key={row.subName} style={{background:rowBg}}>
                  {si===0&&<td rowSpan={cat.rows.length} style={{border:b,width:14,padding:0,textAlign:"center",background:"#f4f4f4"}}>
                    <div style={{writingMode:"vertical-rl",transform:"rotate(180deg)",fontWeight:"bold",fontSize:8,padding:"4px 2px",letterSpacing:1,color:"#8B1A1A"}}>{cat.short}</div>
                  </td>}
                  <td style={{...td,paddingLeft:6,fontSize:10}}>{row.subName}</td>
                  <td style={{...td,textAlign:"center",color:rc}}>{row.g&&row.g.seq1!=null?Number(row.g.seq1).toFixed(1):"—"}</td>
                  <td style={{...td,textAlign:"center",color:rc}}>{row.g&&row.g.seq2!=null?Number(row.g.seq2).toFixed(1):"—"}</td>
                  <td style={{...td,textAlign:"center",fontWeight:"bold",color:rc}}>{row.avg!=null?row.avg.toFixed(1):"—"}</td>
                  <td style={{...td,textAlign:"center"}}>{row.g?row.coef:"—"}</td>
                  <td style={{...td,textAlign:"center",color:rc}}>{row.tot!=null?row.tot.toFixed(1):"—"}</td>
                  <td style={{...td,textAlign:"center",fontSize:9,color:rc}}>{row.rem}</td>
                  <td style={{...td,fontSize:9}}>{row.g?.teacherName||""}</td>
                </tr>
              );
            })}
          </React.Fragment>))}
          {/* Totals row — colSpans must sum to 9 */}
          <tr style={{background:"#ffe8e8"}}>
            <td style={{...td,fontWeight:"bold",fontSize:10}} colSpan={2}>TERM TOTALS</td>
            <td colSpan={3} style={td}></td>
            <td style={{...td,textAlign:"center",fontWeight:"bold"}}>{grandCoef||""}</td>
            <td style={{...td,textAlign:"center",fontWeight:"bold",color:"#8B1A1A"}}>{Math.round(grandTotal)||""}</td>
            <td colSpan={2} style={td}></td>
          </tr>
        </tbody>
      </table>

      {/* Summary */}
      <table style={{width:"100%",borderCollapse:"collapse",marginTop:0}}>
        <tbody>
          <tr style={{background:"#f0f0f0"}}>
            <td style={{...td,fontWeight:"bold",width:"20%"}}>Term Average</td>
            <td style={{...td,textAlign:"center",fontWeight:"bold",fontSize:14,color:"#8B1A1A",width:"15%"}}>{termAvgOverall?.toFixed(1)||"—"}/20</td>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>Grand Total</td>
            <td style={{...td,textAlign:"center",fontWeight:"bold",width:"15%"}}>{Math.round(grandTotal)||"—"}</td>
            <td style={{...td,fontWeight:"bold",width:"10%"}}>Decision</td>
            <td style={{...td,fontWeight:"bold",color:passed?"#16a34a":"#dc2626",width:"25%"}}>{council?.decision||"PENDING"}</td>
          </tr>
        </tbody>
      </table>

      {/* Council remarks */}
      <table style={{width:"100%",borderCollapse:"collapse",marginTop:3}}>
        <thead><tr><th colSpan={4} style={{...th,background:"#8B1A1A",color:"#fff",textAlign:"center",fontSize:11}}>CLASS COUNCIL REMARKS</th></tr></thead>
        <tbody>
          <tr>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>Attitude:</td>
            <td style={{...td,width:"35%",fontStyle:"italic"}}>{council?.attitude||"—"}</td>
            <td style={{...td,fontWeight:"bold",width:"15%"}}>Conduct:</td>
            <td style={{...td,fontStyle:"italic"}}>{council?.conduct||"—"}</td>
          </tr>
          <tr>
            <td style={{...td,fontWeight:"bold"}}>Principal's Remark:</td>
            <td colSpan={3} style={{...td,fontStyle:"italic",minHeight:32}}>{council?.principalRemark||""}</td>
          </tr>
          <tr>
            <td style={{...td,fontWeight:"bold"}}>Signature:</td>
            <td style={td}></td>
            <td style={{...td,fontWeight:"bold"}}>Date:</td>
            <td style={td}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Report Card Page ─────────────────────────────────────────────────────────
export function ReportCardPage({students,grades,setGrades,council,setCouncil,subjects,classes,setPage}:{students:Student[];grades:GradeRecord[];setGrades:(g:GradeRecord[])=>void;council:CouncilRemark[];setCouncil:(c:CouncilRemark[])=>void;subjects:Subject[];classes:ClassRoom[];setPage:(p:Page)=>void}){
  const [selId,setSelId]=useState(students[0]?.id||"");
  const [selTerm,setSelTerm]=useState<Term>("1");
  const [selYear,setSelYear]=useState(SCHOOL.year);
  const [showC,setShowC]=useState(false);
  const [cf,setCf]=useState<Partial<CouncilRemark>>({});
  const printRef=useRef<HTMLDivElement>(null);
  const student=students.find(s=>s.id===selId);
  const rc=council.find(c=>c.studentId===selId&&c.term===selTerm&&c.year===selYear);
  function openCouncil(){setCf(rc?{...rc}:{studentId:selId,term:selTerm,year:selYear,attitude:"Good",conduct:"Good",principalRemark:"",decision:"PASSED"});setShowC(true);}
  function saveCouncil(e:React.FormEvent){e.preventDefault();const ex=council.find(c=>c.studentId===selId&&c.term===selTerm&&c.year===selYear);const u=ex?council.map(c=>c.id===ex.id?{...c,...cf}as CouncilRemark:c):[...council,{...cf as CouncilRemark,id:"cc"+uid()}];setCouncil(u);dbSet("council",u);setShowC(false);}
  function printCard(){if(!printRef.current)return;const w=window.open("","_blank","width=820,height=900");if(!w)return;w.document.write(`<!DOCTYPE html><html><head><style>body{margin:12px;font-family:Arial}@media print{@page{size:A4;margin:10mm}}</style></head><body>${printRef.current.innerHTML}</body></html>`);w.document.close();setTimeout(()=>w.print(),500);}
  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Report Cards</h1><p className="text-sm text-[#1C1A17]/50">Generate, print &amp; export official SIHS academic reports</p></div><div className="flex flex-wrap gap-2"><Btn variant="secondary" onClick={openCouncil}><Edit2 size={13}/>Council Remarks</Btn><Btn variant="secondary" onClick={()=>student&&exportReportCardPDF(student,grades,rc,selTerm,selYear,students,subjects)}><Download size={13}/>PDF</Btn><Btn onClick={printCard}><Printer size={14}/>Print</Btn></div></div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#8B1A1A]/08 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48"><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Student</label><select value={selId} onChange={e=>setSelId(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 focus:outline-none">{students.filter(s=>s.status==="active").map(s=><option key={s.id} value={s.id}>{s.name} ({s.form})</option>)}</select></div>
        <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Term</label><select value={selTerm} onChange={e=>setSelTerm(e.target.value as Term)} className="px-3 py-2 text-sm rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 focus:outline-none">{TERMS.map(t=><option key={t} value={t}>Term {t}</option>)}</select></div>
        <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Year</label><select value={selYear} onChange={e=>setSelYear(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 focus:outline-none"><option value={SCHOOL.year}>{SCHOOL.year}</option><option value="2024/25">2024/25</option></select></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {rc?<div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700"><CheckCircle size={14}/>Council recorded — <strong>{rc.decision}</strong></div>:<div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700"><AlertTriangle size={14}/>No council remarks. <button className="underline font-semibold" onClick={openCouncil}>Add now →</button></div>}
        {student&&grades.filter(g=>g.studentId===selId&&g.term===selTerm&&g.year===selYear).length===0&&<div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700"><AlertCircle size={14}/>No grades for this term. <button className="underline font-semibold ml-1" onClick={()=>setPage("grades")}>Go to Grade Entry →</button></div>}
      </div>
      {student&&<div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden"><div className="px-4 py-2.5 border-b border-[#8B1A1A]/08" style={{background:"#FDF5F5"}}><span className="text-xs font-semibold text-[#1C1A17]/60" style={{fontFamily:"var(--font-mono)"}}>PREVIEW — {student.name.toUpperCase()} · TERM {selTerm}</span></div><div className="overflow-x-auto p-4"><div ref={printRef}><ReportCardPrint student={student} grades={grades} council={rc} term={selTerm} year={selYear} students={students} subjects={subjects}/></div></div></div>}
      {showC&&student&&<Modal title="Class Council Remarks" onClose={()=>setShowC(false)}><form onSubmit={saveCouncil} className="space-y-4"><div className="flex items-center gap-3 p-3 rounded-lg" style={{background:"#FDF5F5"}}><Avatar name={student.name} size="sm"/><p className="text-sm font-bold" style={{color:P}}>{student.name} · {student.form} · Term {selTerm}</p></div><FS label="Attitude" value={cf.attitude||"Good"} onChange={v=>setCf(f=>({...f,attitude:v}))} options={["Excellent","Very Good","Good","Fair","Poor"]}/><FS label="Conduct" value={cf.conduct||"Good"} onChange={v=>setCf(f=>({...f,conduct:v}))} options={["Excellent","Very Good","Good","Fair","Poor"]}/><div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Principal's Remark</label><textarea value={cf.principalRemark||""} onChange={e=>setCf(f=>({...f,principalRemark:e.target.value}))} rows={3} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none resize-none"/></div><FS label="Decision" value={cf.decision||"PASSED"} onChange={v=>setCf(f=>({...f,decision:v}))} options={["PASSED","PROMOTED","REPEATED","WITHDRAWN","PENDING"]}/><div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setShowC(false)}>Cancel</Btn><Btn type="submit"><Save size={13}/>Save</Btn></div></form></Modal>}
    </div>
  );
}

// ─── Exams Page ───────────────────────────────────────────────────────────────
export function ExamsPage({sequences,setSequences,grades,setGrades,students,subjects,council,user,classes}:{sequences:ExamSequence[];setSequences:(s:ExamSequence[])=>void;grades:GradeRecord[];setGrades:(g:GradeRecord[])=>void;students:Student[];subjects:Subject[];council:CouncilRemark[];user:AuthUser;classes:ClassRoom[]}){
  const [tab,setTab]=useState<"schedule"|"marksheet"|"annual">("schedule");
  const [editSeq,setEditSeq]=useState<ExamSequence|null>(null);
  const [seqForm,setSeqForm]=useState<Partial<ExamSequence>>({});
  const [showEdit,setShowEdit]=useState(false);
  const [annualSt,setAnnualSt]=useState(students[0]?.id||"");
  const [annualYear,setAnnualYear]=useState(SCHOOL.year);
  const [showAnnual,setShowAnnual]=useState(false);
  const annualRef=useRef<HTMLDivElement>(null);
  const [msSeqNo,setMsSeqNo]=useState<number>(1);
  const [msForm,setMsForm]=useState(classes[0]?.form||"Form 1");
  const [msSaving,setMsSaving]=useState(false);
  const [draft,setDraft]=useState<Record<string,string>>({});
  const [msSearchSub,setMsSearchSub]=useState("");
  const TC=["#8B1A1A","#1d4ed8","#15803d"];
  const TERM_BG=["bg-red-50 border-red-100","bg-blue-50 border-blue-100","bg-emerald-50 border-emerald-100"];
  function openEdit(s:ExamSequence){setEditSeq(s);setSeqForm({...s});setShowEdit(true);}
  function saveSeq(e:React.FormEvent){e.preventDefault();const u=sequences.map(s=>s.id===editSeq!.id?{...s,...seqForm}as ExamSequence:s);setSequences(u);dbSet("examSeqs",u);setShowEdit(false);}
  function toggleLock(id:string){const u=sequences.map(s=>s.id===id?{...s,isLocked:!s.isLocked}:s);setSequences(u);dbSet("examSeqs",u);}
  function toggleActive(id:string){const u=sequences.map(s=>s.id===id?{...s,isActive:!s.isActive}:s.isActive?{...s,isActive:false}:s);setSequences(u);dbSet("examSeqs",u);}
  const annualStudent=students.find(s=>s.id===annualSt);
  function studentAnnualAvg(sid:string):number|null{let tot=0,coef=0;["1","2","3"].forEach(t=>{grades.filter(g=>g.studentId===sid&&g.term===t as Term&&g.year===annualYear).forEach(g=>{const a=termAvg(g);if(a!==null){tot+=a*g.coef;coef+=g.coef;}});});return coef>0?Math.round((tot/coef)*100)/100:null;}
  const classRanking=annualStudent?students.filter(s=>s.form===annualStudent.form&&s.status==="active").map(s=>({...s,avg:studentAnnualAvg(s.id)})).filter(s=>s.avg!==null).sort((a,b)=>(b.avg??0)-(a.avg??0)):[];
  function printAnnual(){if(!annualRef.current)return;const w=window.open("","_blank","width=820,height=900");if(!w)return;w.document.write(`<!DOCTYPE html><html><head><style>body{margin:12px;font-family:Arial}@media print{@page{size:A4;margin:10mm}}</style></head><body>${annualRef.current.innerHTML}</body></html>`);w.document.close();setTimeout(()=>w.print(),500);}
  const msSeq=sequences.find(s=>s.seqNo===msSeqNo)!;
  const msTerm=(msSeq?.term||"1") as Term;
  const msSlot=msSeq?.seqInTerm===1?"seq1":"seq2";
  const msStudents=students.filter(s=>s.form===msForm&&s.status==="active").sort((a,b)=>a.name.localeCompare(b.name));
  const msSubjects=subjects.filter(s=>s.isActive).filter(s=>msSearchSub?s.name.toLowerCase().includes(msSearchSub.toLowerCase()):true);
  const uniqueForms=[...new Set(classes.filter(c=>c.isActive).map(c=>c.form))].sort();
  const isLocked=msSeq?.isLocked&&user.role!=="admin";
  function draftKey(sid:string,subName:string){return `${sid}:${subName}`;}
  function initDraft(){const d:Record<string,string>={};msStudents.forEach(st=>{msSubjects.forEach(sub=>{const g=grades.find(gr=>gr.studentId===st.id&&gr.subject===sub.name&&gr.term===msTerm&&gr.year===SCHOOL.year);const val=g?.[msSlot as keyof GradeRecord];d[draftKey(st.id,sub.name)]=val!=null?String(val):"";});});return d;}
  const draftKey2=`${msSeqNo}:${msForm}`;
  const prevKey=useRef(draftKey2);
  if(prevKey.current!==draftKey2){prevKey.current=draftKey2;setDraft(initDraft());}
  const didInit=useRef(false);
  if(!didInit.current){didInit.current=true;setDraft(initDraft());}
  function setScore(sid:string,subName:string,val:string){const num=parseFloat(val);if(val!==""&&(isNaN(num)||num<0||num>20))return;setDraft(d=>({...d,[draftKey(sid,subName)]:val}));}
  function saveMarksheet(){if(isLocked){alert("This sequence is locked.");return;}setMsSaving(true);let updated=[...grades];msStudents.forEach(st=>{msSubjects.forEach(sub=>{const rawVal=draft[draftKey(st.id,sub.name)];const score=rawVal===""||rawVal===undefined?null:parseFloat(rawVal);const coef=getSubjectCoef(sub.name,st.form,subjects);const idx=updated.findIndex(g=>g.studentId===st.id&&g.subject===sub.name&&g.term===msTerm&&g.year===SCHOOL.year);if(idx>=0){updated[idx]={...updated[idx],[msSlot]:score,coef};}else if(score!==null){updated.push({id:"g"+uid(),studentId:st.id,subject:sub.name,term:msTerm,year:SCHOOL.year,seq1:msSlot==="seq1"?score:null,seq2:msSlot==="seq2"?score:null,coef,remark:""});}});});setGrades(updated);dbSet("grades",updated);setTimeout(()=>setMsSaving(false),600);}
  function exportMarksheetExcel(){const seqLabel=SEQ_META.find(m=>m.seqNo===msSeqNo)?.label||"Seq";const subNames=msSubjects.map(s=>s.name);const header=["#","Student Name","Form",...subNames,"Average"];const rows=msStudents.map((st,i)=>{const scores=subNames.map(sn=>{const v=draft[draftKey(st.id,sn)];return v!==""&&v!==undefined?parseFloat(v):null;});const defined=scores.filter((s):s is number=>s!==null);const avg=defined.length>0?Math.round((defined.reduce((a,b)=>a+b,0)/defined.length)*100)/100:null;return[i+1,st.name,st.form,...scores.map(s=>s??""),avg??""]});const ws=XLSX.utils.aoa_to_sheet([header,...rows]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,seqLabel);XLSX.writeFile(wb,`Marksheet_${seqLabel.replace(/ /g,"_")}_${msForm.replace(/ /g,"_")}.xlsx`);}
  function printMarksheet(){const seqLabel=SEQ_META.find(m=>m.seqNo===msSeqNo)?.label||"Seq";const subNames=msSubjects.map(s=>s.name);const rows=msStudents.map((st,i)=>{const scores=subNames.map(sn=>{const v=draft[draftKey(st.id,sn)];return v!==""&&v!==undefined?parseFloat(v):null;});const defined=scores.filter((s):s is number=>s!==null);const avg=defined.length>0?Math.round((defined.reduce((a,b)=>a+b,0)/defined.length)*100)/100:null;return{num:i+1,name:st.name,scores,avg};});const thStyle="border:1px solid #999;padding:3px 5px;background:#f0f0f0;font-size:9px;font-weight:bold;text-align:center;";const tdStyle="border:1px solid #ccc;padding:3px 5px;font-size:9px;text-align:center;";const html=`<!DOCTYPE html><html><head><title>Marksheet</title><style>body{margin:10px;font-family:Arial}table{border-collapse:collapse;width:100%}@media print{@page{size:A4 landscape;margin:8mm}}</style></head><body><div style="text-align:center;margin-bottom:8px"><div style="font-size:15px;font-weight:bold;color:#8B1A1A">${SCHOOL.full}</div><div style="font-size:11px;font-weight:bold">${seqLabel} MARKSHEET — ${msForm}</div></div><table><thead><tr><th style="${thStyle}">#</th><th style="${thStyle};text-align:left">Student</th>${subNames.map(s=>`<th style="${thStyle}">${s}</th>`).join("")}<th style="${thStyle}">Avg</th></tr></thead><tbody>${rows.map(r=>`<tr><td style="${tdStyle}">${r.num}</td><td style="${tdStyle};text-align:left">${r.name}</td>${r.scores.map(s=>`<td style="${tdStyle};color:${s!==null&&s<10?"#dc2626":"#000"}">${s??""}</td>`).join("")}<td style="${tdStyle};font-weight:bold">${r.avg??""}</td></tr>`).join("")}</tbody></table></body></html>`;const w=window.open("","_blank","width=1000,height=700");if(!w)return;w.document.write(html);w.document.close();setTimeout(()=>w.print(),500);}
  const TABS=[{id:"schedule",label:"Schedule"},{id:"marksheet",label:"Marksheet"},{id:"annual",label:"Annual Report"}] as const;
  // unused variable cleanup
  const annualGrandAvg=0;
  return(
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Exams & Sequences</h1><p className="text-sm text-[#1C1A17]/50">Schedule · Marksheet · Annual reports · {SCHOOL.year}</p></div>
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#8B1A1A]/08 shadow-sm w-fit">{TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className="px-5 py-2 rounded-lg text-sm font-semibold transition-all" style={tab===t.id?{background:P,color:"#fff"}:{color:"#1C1A17",opacity:0.5}}>{t.label}</button>))}</div>
      {tab==="schedule"&&<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">{TERMS.map((t,ti)=>{const termSeqs=sequences.filter(s=>s.term===t).sort((a,b)=>a.seqNo-b.seqNo);return(<div key={t} className={`rounded-xl border-2 overflow-hidden shadow-sm ${TERM_BG[ti]}`}><div className="px-5 py-3" style={{background:TC[ti]}}><p className="text-white font-bold">Term {t}</p></div><div className="p-4 space-y-3">{termSeqs.map(seq=>{const sm=SEQ_META.find(m=>m.seqNo===seq.seqNo)!;return(<div key={seq.id} className="bg-white rounded-xl p-4 border-2 shadow-sm" style={{borderColor:seq.isActive?TC[ti]:"transparent"}}><div className="flex items-start justify-between mb-2"><div><p className="font-bold text-sm" style={{color:TC[ti]}}>{sm?.label}</p><p className="text-[10px] text-[#1C1A17]/40">{seq.startDate?`${fmtDate(seq.startDate)} → ${fmtDate(seq.endDate)}`:"Date not set"}</p></div><div className="flex gap-1.5">{seq.isActive&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:TC[ti]}}>ACTIVE</span>}{seq.isLocked&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">LOCKED</span>}</div></div><div className="flex gap-1.5 flex-wrap pt-2 border-t border-[#1C1A17]/06"><button onClick={()=>{setMsSeqNo(seq.seqNo);setTab("marksheet");}} className="text-[10px] font-bold px-2 py-1 rounded-lg border border-[#8B1A1A]/20 text-[#8B1A1A] hover:bg-[#FDF5F5]">Open Marksheet</button>{user.role==="admin"&&<><button onClick={()=>toggleActive(seq.id)} className="text-[10px] font-bold px-2 py-1 rounded-lg border" style={{borderColor:TC[ti],color:seq.isActive?"white":TC[ti],background:seq.isActive?TC[ti]:"transparent"}}>{seq.isActive?"Deactivate":"Set Active"}</button><button onClick={()=>toggleLock(seq.id)} className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${seq.isLocked?"bg-red-100 text-red-700 border-red-300":"bg-gray-50 text-gray-600 border-gray-200"}`}>{seq.isLocked?"Unlock":"Lock"}</button><button onClick={()=>openEdit(seq)} className="text-[10px] font-bold px-2 py-1 rounded-lg border text-[#1C1A17]/50 border-[#1C1A17]/20"><Edit2 size={9} className="inline mr-0.5"/>Edit</button></>}</div></div>);})}</div></div>);})}</div>}
      {tab==="marksheet"&&<div className="space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#8B1A1A]/08">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-2" style={{fontFamily:"var(--font-mono)"}}>Sequence</p>
              <div className="flex gap-1 flex-wrap">{sequences.sort((a,b)=>a.seqNo-b.seqNo).map(seq=>{const tc=TC[Number(seq.term)-1];const active=seq.seqNo===msSeqNo;return(<button key={seq.id} onClick={()=>setMsSeqNo(seq.seqNo)} className="px-3 py-1.5 rounded-lg text-xs font-bold border-2" style={{borderColor:active?tc:"#e5e7eb",background:active?tc:"white",color:active?"white":"#6b7280"}}>Seq {seq.seqNo}{seq.isLocked?<span className="ml-1">🔒</span>:""}</button>);})}</div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-2" style={{fontFamily:"var(--font-mono)"}}>Class</p>
              <div className="flex gap-1 flex-wrap">{uniqueForms.map(f=>(<button key={f} onClick={()=>setMsForm(f)} className="px-3 py-1.5 rounded-lg text-xs font-bold border-2" style={{borderColor:msForm===f?P:"#e5e7eb",background:msForm===f?P:"white",color:msForm===f?"white":"#6b7280"}}>{f}</button>))}</div>
            </div>
            <div className="relative min-w-36"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1C1A17]/30"/><input value={msSearchSub} onChange={e=>setMsSearchSub(e.target.value)} placeholder="Filter subject…" className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 focus:outline-none"/></div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Btn variant="secondary" onClick={exportMarksheetExcel}><Download size={13}/>Excel</Btn>
              <Btn variant="secondary" onClick={printMarksheet}><Printer size={13}/>Print</Btn>
              {canAccess(user,"admin")&&msSeq&&(
                <button onClick={()=>toggleLock(msSeq.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${msSeq.isLocked?"border-red-300 bg-red-50 text-red-700 hover:bg-red-100":"border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                  {msSeq.isLocked?<><AlertTriangle size={12}/>Unlock Sequence</>:<><CheckCircle size={12}/>Lock Sequence</>}
                </button>
              )}
              <Btn onClick={saveMarksheet} disabled={isLocked}><Save size={13}/>{msSaving?"Saved ✓":"Save Marks"}</Btn>
            </div>
          </div>
        </div>

        {/* Locked banner */}
        {msSeq?.isLocked&&<div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 ${canAccess(user,"admin")?"border-amber-300 bg-amber-50":"border-red-300 bg-red-50"}`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className={canAccess(user,"admin")?"text-amber-600":"text-red-600"}/>
            <div>
              <p className={`text-sm font-bold ${canAccess(user,"admin")?"text-amber-800":"text-red-800"}`}>{SEQ_META.find(m=>m.seqNo===msSeqNo)?.label} is locked</p>
              <p className={`text-xs ${canAccess(user,"admin")?"text-amber-700":"text-red-700"}`}>{canAccess(user,"admin")?"Click \"Unlock Sequence\" above to allow mark entry.":"Contact an administrator to unlock this sequence."}</p>
            </div>
          </div>
          {canAccess(user,"admin")&&<button onClick={()=>toggleLock(msSeq.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"><AlertTriangle size={11}/>Unlock Now</button>}
        </div>}

        {msStudents.length===0
          ?<div className="bg-white rounded-xl p-10 text-center text-sm text-[#1C1A17]/40 border border-[#8B1A1A]/08">No active students in {msForm}.</div>
          :<div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse" style={{fontFamily:"var(--font-mono)",minWidth:600}}>
                <thead>
                  <tr style={{background:"#1C1A17",position:"sticky",top:0,zIndex:10}}>
                    <th className="text-left px-3 py-3 text-white font-bold sticky left-0 bg-[#1C1A17]" style={{minWidth:170,fontSize:10}}>STUDENT</th>
                    {msSubjects.map(sub=>(<th key={sub.id} className="px-2 py-3 text-center text-white font-bold" style={{minWidth:72,fontSize:9}}>{sub.name.slice(0,13)}<div className="text-white/40 font-normal text-[8px]">Coef {sub.formCoefs?.[msForm]??sub.defaultCoef}</div></th>))}
                    <th className="px-3 py-3 text-center text-white font-bold" style={{minWidth:50,fontSize:9}}>Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {msStudents.map((st,ri)=>{
                    const scores=msSubjects.map(sub=>{const v=draft[draftKey(st.id,sub.name)];return v!==""&&v!==undefined?parseFloat(v):null;});
                    const defined=scores.filter((s):s is number=>s!==null&&!isNaN(s));
                    const avg=defined.length>0?Math.round((defined.reduce((a,b)=>a+b,0)/defined.length)*100)/100:null;
                    const rowBg=ri%2===0?"#ffffff":"#fafafa";
                    return(<tr key={st.id} style={{background:rowBg}}>
                      <td className="px-3 py-1.5 sticky left-0 border-r border-[#8B1A1A]/05 font-semibold text-[11px]" style={{background:rowBg,minWidth:170}}>{ri+1}. {st.name}</td>
                      {msSubjects.map((sub)=>{const val=draft[draftKey(st.id,sub.name)]??"";const num=val!==""?parseFloat(val):null;const low=num!==null&&!isNaN(num)&&num<10;return(<td key={sub.id} className="px-1 py-1 text-center"><input type="number" min={0} max={20} step={0.25} value={val} disabled={isLocked} onChange={e=>setScore(st.id,sub.name,e.target.value)} placeholder="—" className="w-14 text-center rounded px-1 py-1 text-xs font-bold border focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed" style={{borderColor:low?"#fca5a5":val?"#86efac":"#e5e7eb",background:low?"#fff5f5":val?"#f0fdf4":"#f9f9f9",color:low?"#dc2626":val?"#15803d":"#1C1A17"}}/></td>);})}
                      <td className="px-3 py-1.5 text-center font-bold border-l border-[#8B1A1A]/08" style={{color:avg!==null&&avg<10?"#dc2626":avg!==null?"#15803d":"#1C1A17"}}>{avg!==null?avg.toFixed(1):"—"}</td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-[#8B1A1A]/05 flex items-center justify-between">
              {msSeq?.isLocked
                ?<span className="text-xs text-amber-700 font-semibold flex items-center gap-1"><AlertTriangle size={11}/>Sequence locked — {canAccess(user,"admin")?"unlock above to save":"contact admin"}</span>
                :<span className="text-xs text-emerald-700 font-semibold flex items-center gap-1"><CheckCircle size={11}/>Sequence unlocked — marks editable</span>}
              <Btn onClick={saveMarksheet} disabled={isLocked}><Save size={12}/>{msSaving?"Saved!":"Save All Marks"}</Btn>
            </div>
          </div>}
      </div>}
      {tab==="annual"&&<div className="space-y-4"><div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08"><div className="flex flex-wrap gap-3 items-end"><div className="flex-1 min-w-48"><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Student</label><select value={annualSt} onChange={e=>setAnnualSt(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 focus:outline-none">{students.filter(s=>s.status==="active").map(s=><option key={s.id} value={s.id}>{s.name} ({s.form})</option>)}</select></div><div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Year</label><select value={annualYear} onChange={e=>setAnnualYear(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 focus:outline-none"><option value={SCHOOL.year}>{SCHOOL.year}</option><option value="2024/25">2024/25</option></select></div><Btn variant="secondary" onClick={()=>setShowAnnual(v=>!v)}><Eye size={13}/>{showAnnual?"Hide":"Preview"}</Btn><Btn variant="secondary" onClick={()=>annualStudent&&exportAnnualReportPDF(annualStudent,grades,council,annualYear,students,subjects)}><Download size={13}/>PDF</Btn><Btn onClick={printAnnual}><Printer size={14}/>Print</Btn></div>{annualStudent&&<div className="mt-4 pt-4 border-t border-[#8B1A1A]/06"><p className="text-xs font-bold mb-2" style={{color:P}}>{annualStudent.form} Rankings</p><div className="flex flex-wrap gap-2">{classRanking.slice(0,10).map((s,i)=><div key={s.id} className={`text-[10px] px-2 py-1 rounded-lg border ${s.id===annualSt?"border-amber-400 bg-amber-50 font-bold text-amber-700":"border-gray-200 text-gray-600"}`}>{i+1}. {s.name} — <span style={{fontFamily:"var(--font-mono)"}}>{s.avg?.toFixed(1)}</span></div>)}</div></div>}</div>
      {showAnnual&&annualStudent&&<div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden"><div className="overflow-x-auto p-4"><div ref={annualRef}><AnnualReportPrint student={annualStudent} grades={grades} council={council} year={annualYear} students={students} subjects={subjects}/></div></div></div>}
      </div>}
      {showEdit&&editSeq&&<Modal title={`Edit — ${SEQ_META.find(m=>m.seqNo===editSeq.seqNo)?.label}`} onClose={()=>setShowEdit(false)}><form onSubmit={saveSeq} className="space-y-3"><div className="grid grid-cols-2 gap-3"><FI label="Start Date" value={seqForm.startDate||""} onChange={v=>setSeqForm(f=>({...f,startDate:v}))} type="date"/><FI label="End Date" value={seqForm.endDate||""} onChange={v=>setSeqForm(f=>({...f,endDate:v}))} type="date"/></div><div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Notes</label><textarea value={seqForm.notes||""} onChange={e=>setSeqForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none resize-none"/></div><div className="flex gap-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={seqForm.isActive??false} onChange={e=>setSeqForm(f=>({...f,isActive:e.target.checked}))} className="w-4 h-4"/><span className="text-sm">Active</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={seqForm.isLocked??false} onChange={e=>setSeqForm(f=>({...f,isLocked:e.target.checked}))} className="w-4 h-4"/><span className="text-sm">Locked</span></label></div><div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setShowEdit(false)}>Cancel</Btn><Btn type="submit"><Save size={13}/>Save</Btn></div></form></Modal>}
    </div>
  );
}
