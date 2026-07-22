import React,{useState,useMemo} from "react";
import {Plus,Search,TrendingUp,DollarSign,AlertCircle,CheckCircle,Trash2,Edit2,Download,Printer,Info,AlertTriangle,X,RotateCcw,Users,Grid,Clock,BookOpen,User} from "lucide-react";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend} from "recharts";
import {
  SCHOOL,P,FORMS,
  TimetableSlot,PERIODS,DAYS,
  Student,Teacher,Subject,FeePayment,FeeStructure,StudentFeeOverride,StudentFeeBreakdown,AuthUser,Term,Announcement,AppUser,Role,ClassRoom,
  dbSet,uid,canAccess,fmtDate,fmtCfa,hashPw,
  computeStudentFees,exportPaymentsExcel,exportOutstandingExcel,exportAccountabilityExcel,
} from "../shared";
import {Avatar,Btn,FI,FS,Modal,Bdg,StatCard,roleBadge} from "../ui";

// ─── Fee constants ─────────────────────────────────────────────────────────────
const FEE_LABELS:{key:keyof StudentFeeBreakdown;label:string}[]=[
  {key:"admission",label:"Admission"},
  {key:"tuition",label:"Tuition"},
  {key:"lab",label:"Lab Fee"},
  {key:"homeEc",label:"Home Economics"},
  {key:"health",label:"Health"},
  {key:"computer",label:"Computer"},
  {key:"idCard",label:"ID Card"},
  {key:"pta",label:"PTA"},
];
// ─── Finance ──────────────────────────────────────────────────────────────────
export function FinancePage({students=[],payments=[],setPayments=()=>{},fees=[],setFees=()=>{},studentFeeOverrides=[],setStudentFeeOverrides=()=>{},user,currentYear=""}:{students:Student[];payments:FeePayment[];setPayments:(p:FeePayment[])=>void;fees:FeeStructure[];setFees:(f:FeeStructure[])=>void;studentFeeOverrides:StudentFeeOverride[];setStudentFeeOverrides:(o:StudentFeeOverride[])=>void;user:AuthUser;currentYear:string}){
  type FTab="overview"|"collections"|"students"|"outstanding"|"report"|"fees";
  const [tab,setTab]=useState<FTab>("overview");
  const [search,setSearch]=useState("");
  const [stdSearch,setStdSearch]=useState("");
  const [stdFormF,setStdFormF]=useState("");
  const [showCollM,setShowCollM]=useState(false);
  const [editP,setEditP]=useState<FeePayment|null>(null);
  const [pform,setPform]=useState<Partial<FeePayment>>({});
  const [justSettled,setJustSettled]=useState<{name:string;collector:string}|null>(null);
  const [showFeeM,setShowFeeM]=useState(false);
  const [feeForm,setFeeForm]=useState<Partial<FeeStructure>>({});
  const [showOvM,setShowOvM]=useState(false);
  const [ovSt,setOvSt]=useState<Student|null>(null);
  type OvForm={admission?:number;tuition?:number;lab?:number;homeEc?:number;health?:number;computer?:number;idCard?:number;pta?:number;discount:number;reason:string};
  const [ovForm,setOvForm]=useState<OvForm>({discount:0,reason:""});
  const [bdSt,setBdSt]=useState<Student|null>(null);

  const yearPayments=payments.filter(p=>p.year===currentYear);
  const yearFeeStruct=fees.find(f=>f.year===currentYear);
  const yearOvs=studentFeeOverrides.filter(o=>o.year===currentYear);
  const activeStudents=students.filter(s=>s.status==="active");

  function getBd(s:Student):StudentFeeBreakdown{if(!yearFeeStruct)return{admission:0,tuition:0,lab:0,homeEc:0,health:0,computer:0,idCard:0,pta:0,discount:0,total:0};const ov=yearOvs.find(o=>o.studentId===s.id);return computeStudentFees(s,yearFeeStruct,ov);}
  function getPaid(sid:string){return yearPayments.filter(p=>p.studentId===sid).reduce((a,p)=>a+p.amount,0);}

  // Returns the name of the collector whose collection completed the full payment
  function getSettledBy(sid:string):string|null{
    const due=getBd(activeStudents.find(s=>s.id===sid)||{} as Student).total;
    if(!due)return null;
    const sorted=[...yearPayments.filter(p=>p.studentId===sid)].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
    let cum=0;
    for(const p of sorted){cum+=p.amount;if(cum>=due)return p.collectedBy||"Bursar";}
    return null;
  }

  const totalExpected=activeStudents.reduce((a,s)=>a+getBd(s).total,0);
  const totalCollected=yearPayments.reduce((a,p)=>a+p.amount,0);
  const rate=totalExpected>0?Math.round(totalCollected/totalExpected*100):0;
  const outList=activeStudents.map(s=>({student:s,bd:getBd(s),paid:getPaid(s.id)})).map(x=>({...x,balance:x.bd.total-x.paid})).filter(o=>o.balance>0).sort((a,b)=>b.balance-a.balance);
  const filtPays=yearPayments.filter(p=>{const s=students.find(st=>st.id===p.studentId);return!search||s?.name.toLowerCase().includes(search.toLowerCase());});
  const filtStds=activeStudents.filter(s=>(!stdSearch||s.name.toLowerCase().includes(stdSearch.toLowerCase()))&&(!stdFormF||s.form===stdFormF));

  const barData=FORMS.map(f=>{const ss=activeStudents.filter(s=>s.form===f);return{f:f.replace("Form ","F").replace("Lower Sixth","L6").replace("Upper Sixth","U6"),exp:ss.reduce((a,s)=>a+getBd(s).total,0),col:yearPayments.filter(p=>ss.find(s=>s.id===p.studentId)).reduce((a,p)=>a+p.amount,0)};}).filter(d=>d.exp>0||d.col>0);
  const methodData=Object.entries(yearPayments.reduce((acc,p)=>{acc[p.method]=(acc[p.method]||0)+p.amount;return acc;},{} as Record<string,number>)).map(([n,v])=>({name:n.replace(/_/g," "),value:v}));
  const PIE=["#8B1A1A","#C8960C","#2563eb","#059669","#7c3aed"];

  // ── Collection modal ─────────────────────────────────────────────────────────
  function openCollect(preStudent?:Student){
    setEditP(null);
    const sid=preStudent?.id||"";
    const bal=preStudent?Math.max(0,getBd(preStudent).total-getPaid(preStudent.id)):0;
    setPform({year:currentYear,date:new Date().toISOString().slice(0,10),method:"cash",term:"1",category:"School Fees",collectedBy:user.name,studentId:sid,amount:bal||undefined});
    setShowCollM(true);
  }
  function openEditColl(p:FeePayment){setEditP(p);setPform({...p});setShowCollM(true);}

  function saveCollection(e:React.FormEvent){
    e.preventDefault();
    const collected:FeePayment={...pform as FeePayment,id:editP?editP.id:"col"+uid()};
    const newList=editP?payments.map(p=>p.id===editP.id?collected:p):[...payments,collected];
    setPayments(newList);dbSet("payments",newList);
    // Check if this collection settled the student
    if(!editP&&collected.studentId){
      const sid=collected.studentId;
      const st=activeStudents.find(s=>s.id===sid);
      if(st){
        const due=getBd(st).total;
        const nowPaid=newList.filter(p=>p.studentId===sid&&p.year===currentYear).reduce((a,p)=>a+p.amount,0);
        const wasPaid=nowPaid-collected.amount;
        if(due>0&&wasPaid<due&&nowPaid>=due){
          setJustSettled({name:st.name,collector:collected.collectedBy||user.name});
        }
      }
    }
    setShowCollM(false);
  }

  function removeColl(id:string){if(!confirm("Delete this collection entry?"))return;const u=payments.filter(p=>p.id!==id);setPayments(u);dbSet("payments",u);}

  function openEditFeeSchedule(){setFeeForm(yearFeeStruct?{...yearFeeStruct}:{year:currentYear,admission:2500,health:1000,computer:1000,idCard:500,pta:1500,tuitionGeneral:35000,tuitionTechCom:50000,tuitionSixth:40000,labFee:15000,homeEcFee:10000});setShowFeeM(true);}
  function saveFee(e:React.FormEvent){e.preventDefault();const entry={...feeForm,year:currentYear}as FeeStructure;if(yearFeeStruct){const u=fees.map(f=>f.id===yearFeeStruct.id?{...f,...entry}:f);setFees(u);dbSet("fees",u);}else{const n:FeeStructure={...entry,id:"fs"+uid()};const u=[...fees,n];setFees(u);dbSet("fees",u);}setShowFeeM(false);}

  function openOverride(s:Student){const bd=getBd(s);const ov=yearOvs.find(o=>o.studentId===s.id);setOvSt(s);setOvForm({admission:ov?.admission??bd.admission,tuition:ov?.tuition??bd.tuition,lab:ov?.lab??bd.lab,homeEc:ov?.homeEc,health:ov?.health??bd.health,computer:ov?.computer??bd.computer,idCard:ov?.idCard??bd.idCard,pta:ov?.pta??bd.pta,discount:ov?.discount??0,reason:ov?.reason??""});setShowOvM(true);}
  function saveOverride(e:React.FormEvent){e.preventDefault();if(!ovSt)return;const existing=studentFeeOverrides.find(o=>o.studentId===ovSt.id&&o.year===currentYear);const entry:StudentFeeOverride={id:existing?.id||"ov"+uid(),studentId:ovSt.id,year:currentYear,...ovForm};const u=existing?studentFeeOverrides.map(o=>o.id===existing.id?entry:o):[...studentFeeOverrides,entry];setStudentFeeOverrides(u);dbSet("studentFeeOverrides",u);setShowOvM(false);}
  function resetOverride(sid:string){if(!confirm("Reset to schedule defaults?"))return;const u=studentFeeOverrides.filter(o=>!(o.studentId===sid&&o.year===currentYear));setStudentFeeOverrides(u);dbSet("studentFeeOverrides",u);}

  function printReport(){
    const w=window.open("","_blank","width=1050,height=780");if(!w)return;
    const ts="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10px";
    const th="border:1px solid #ddd;padding:5px 8px;background:#8B1A1A;color:#fff;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.5px";
    const td="border:1px solid #eee;padding:4px 8px";
    let html=`<div style="text-align:center;margin-bottom:14px"><div style="font-size:17px;font-weight:900;color:#8B1A1A">${SCHOOL.full}</div><div style="font-size:13px;font-weight:700;margin:3px 0">FINANCIAL ACCOUNTABILITY REPORT — ${currentYear}</div><div style="font-size:9px;color:#666">Generated: ${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})} | Prepared by: ${user.name}</div><hr style="border-color:#8B1A1A;margin:8px 0"/></div>`;
    html+=`<h3 style="color:#8B1A1A;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Financial Summary</h3><table style="${ts}"><tr><th style="${th}">Metric</th><th style="${th}">Value</th></tr><tr><td style="${td}">Academic Year</td><td style="${td}">${currentYear}</td></tr><tr><td style="${td}">Active Students</td><td style="${td}">${activeStudents.length}</td></tr><tr><td style="${td}">Total Expected</td><td style="${td}">${fmtCfa(totalExpected)}</td></tr><tr><td style="${td}">Total Collected</td><td style="${td}">${fmtCfa(totalCollected)}</td></tr><tr><td style="${td}">Outstanding</td><td style="${td}">${fmtCfa(Math.max(0,totalExpected-totalCollected))}</td></tr><tr style="background:#FDF5F5"><td style="${td};font-weight:700">Collection Rate</td><td style="${td};font-weight:700;color:#8B1A1A">${rate}%</td></tr></table>`;
    html+=`<h3 style="color:#8B1A1A;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Payment Ledger (${yearPayments.length} transactions)</h3><table style="${ts}"><tr><th style="${th}">Receipt</th><th style="${th}">Student</th><th style="${th}">Class</th><th style="${th}">Date</th><th style="${th}">Amount (FCFA)</th><th style="${th}">Method</th><th style="${th}">Term</th><th style="${th}">Collected By</th></tr>`;
    [...yearPayments].sort((a,b)=>b.date.localeCompare(a.date)).forEach((p,i)=>{const s=students.find(st=>st.id===p.studentId);html+=`<tr style="background:${i%2?"#fafafa":"#fff"}"><td style="${td};color:#8B1A1A;font-family:monospace">${p.receiptNo||"—"}</td><td style="${td};font-weight:600">${s?.name||"?"}</td><td style="${td}">${s?.form||"?"}</td><td style="${td}">${fmtDate(p.date)}</td><td style="${td};font-weight:700;color:#8B1A1A">${p.amount.toLocaleString("fr-FR")}</td><td style="${td};text-transform:capitalize">${p.method.replace(/_/g," ")}</td><td style="${td}">T${p.term}</td><td style="${td}">${p.collectedBy||"—"}</td></tr>`;});
    html+=`<tr style="background:#FDF5F5;font-weight:700"><td colspan="4" style="${td}">TOTAL COLLECTED</td><td style="${td};color:#8B1A1A">${fmtCfa(totalCollected)}</td><td colspan="3" style="${td}"></td></tr></table>`;
    if(outList.length>0){html+=`<h3 style="color:#dc2626;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Outstanding Balances (${outList.length} students)</h3><table style="${ts}"><tr><th style="${th}">Student</th><th style="${th}">Class</th><th style="${th}">Total Due</th><th style="${th}">Paid</th><th style="${th}">Balance</th><th style="${th}">Status</th></tr>`;outList.forEach((o,i)=>{html+=`<tr style="background:${i%2?"#fafafa":"#fff"}"><td style="${td};font-weight:600">${o.student.name}</td><td style="${td}">${o.student.form}</td><td style="${td}">${fmtCfa(o.bd.total)}</td><td style="${td};color:#15803d">${fmtCfa(o.paid)}</td><td style="${td};font-weight:700;color:#dc2626">${fmtCfa(o.balance)}</td><td style="${td}">${o.paid===0?"UNPAID":"PARTIAL"}</td></tr>`;});html+=`</table>`;}
    w.document.write(`<!DOCTYPE html><html><head><title>Finance ${currentYear}</title><style>body{font-family:Arial,sans-serif;color:#1C1A17;margin:16px;font-size:11px}@media print{@page{size:A4;margin:10mm}}</style></head><body>${html}</body></html>`);
    w.document.close();w.focus();setTimeout(()=>w.print(),600);
  }

  const TABS:[FTab,string][]=[["overview","Overview"],["collections","Collections"],["students","Student Fees"],["outstanding","Outstanding"],["report","Report"],["fees","Fee Schedule"]];
  const ovBd=useMemo(()=>{if(!ovSt||!yearFeeStruct)return null;const tmp:StudentFeeOverride={id:"",studentId:ovSt.id,year:currentYear,...ovForm};return computeStudentFees(ovSt,yearFeeStruct,tmp);},[ovSt,ovForm,yearFeeStruct,currentYear]);

  return(
    <div className="space-y-5">
      {/* Settlement banner */}
      {justSettled&&<div className="flex items-center justify-between gap-3 px-5 py-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 shadow-md">
        <div className="flex items-center gap-3"><CheckCircle size={20} className="text-emerald-600 flex-shrink-0"/><div><p className="font-bold text-emerald-800" style={{fontFamily:"var(--font-display)"}}>Fully Settled — {justSettled.name}</p><p className="text-sm text-emerald-700">All fees collected and recorded. <strong>Collected by: {justSettled.collector}</strong></p></div></div>
        <button onClick={()=>setJustSettled(null)} className="text-emerald-500 hover:text-emerald-700 p-1"><X size={16}/></button>
      </div>}

      <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Finance</h1><p className="text-sm text-[#1C1A17]/50">Academic year {currentYear} · Fee collection & accountability</p></div>{canAccess(user,"admin")&&<Btn onClick={()=>openCollect()}><Plus size={15}/>Collect Fee</Btn>}</div>
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#8B1A1A]/08 shadow-sm flex-wrap">{TABS.map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} className="px-4 py-2 rounded-lg text-sm font-semibold transition-all" style={tab===id?{background:P,color:"#fff"}:{color:"#1C1A17",opacity:0.5}}>{label}</button>))}</div>

      {tab==="overview"&&<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Collected" value={fmtCfa(totalCollected)} icon={DollarSign} sub={`${yearPayments.length} collection entries`} color="crimson"/>
          <StatCard label="Expected Revenue" value={fmtCfa(totalExpected)} icon={TrendingUp} sub={`${activeStudents.length} active students`} color="slate"/>
          <StatCard label="Outstanding" value={fmtCfa(Math.max(0,totalExpected-totalCollected))} icon={AlertCircle} sub={`${outList.length} students owe`} color="red"/>
          <StatCard label="Collection Rate" value={`${rate}%`} icon={CheckCircle} sub="of expected revenue" color="teal"/>
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08"><h3 className="font-bold mb-4 text-sm" style={{color:P,fontFamily:"var(--font-display)"}}>Collection by Class</h3><ResponsiveContainer width="100%" height={200}><BarChart data={barData} margin={{top:0,right:0,left:0,bottom:0}}><XAxis dataKey="f" tick={{fontSize:9}} tickLine={false}/><YAxis tick={{fontSize:9}} tickLine={false} axisLine={false} tickFormatter={(v:number)=>`${Math.round(v/1000)}k`}/><Tooltip formatter={(v:number)=>fmtCfa(v)} contentStyle={{fontSize:11}}/><Bar dataKey="exp" fill="#F3E8E8" name="Expected" radius={[4,4,0,0]}/><Bar dataKey="col" fill={P} name="Collected" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08"><h3 className="font-bold mb-4 text-sm" style={{color:P,fontFamily:"var(--font-display)"}}>Payment Methods</h3>{methodData.length===0?<div className="flex items-center justify-center h-40 text-sm text-[#1C1A17]/30">No payments recorded yet</div>:<ResponsiveContainer width="100%" height={200}><PieChart><Pie data={methodData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name} ${Math.round((percent as number)*100)}%`} labelLine={false} fontSize={9}>{methodData.map((_,i)=>(<Cell key={i} fill={PIE[i%PIE.length]}/>))}</Pie><Tooltip formatter={(v:number)=>fmtCfa(v)}/></PieChart></ResponsiveContainer>}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08"><h3 className="font-bold mb-4 text-sm" style={{color:P,fontFamily:"var(--font-display)"}}>Top Outstanding Students</h3><div className="space-y-2">{outList.slice(0,8).map(o=>(<div key={o.student.id} className="flex items-center justify-between py-2 border-b border-[#8B1A1A]/05 last:border-0"><div className="flex items-center gap-2"><Avatar name={o.student.name} size="sm"/><div><p className="text-xs font-semibold text-[#1C1A17]">{o.student.name}</p><p className="text-[10px] text-[#1C1A17]/40">{o.student.form}</p></div></div><div className="text-right"><p className="text-sm font-bold text-red-600">{fmtCfa(o.balance)}</p><p className="text-[10px] text-[#1C1A17]/40">paid {fmtCfa(o.paid)}</p></div></div>))}{outList.length===0&&<p className="text-sm text-center text-[#1C1A17]/30 py-6">All students are up to date ✓</p>}</div></div>
      </>}

      {tab==="collections"&&<div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48 max-w-xs"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1A17]/30"/><input placeholder="Search student…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none"/></div>
          <div className="flex gap-2 ml-auto"><Btn variant="secondary" onClick={()=>exportPaymentsExcel(yearPayments,students)}><Download size={13}/>Excel</Btn>{canAccess(user,"admin")&&<Btn onClick={()=>openCollect()}><Plus size={13}/>Collect Fee</Btn>}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{fontFamily:"var(--font-body)"}}>
              <thead><tr className="bg-[#FDF5F5] border-b border-[#8B1A1A]/08">{["Student","Class","Collection #","Amount","Running Total","Due","Status","Date","Method","Collected By","Actions"].map(h=><th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#8B1A1A]/05">
                {filtPays.length===0
                  ?<tr><td colSpan={11} className="px-4 py-8 text-center text-sm text-[#1C1A17]/40">No collections for {currentYear}.</td></tr>
                  :(()=>{
                    // Build rows with running totals per student
                    const sorted=[...filtPays].sort((a,b)=>b.date.localeCompare(a.date));
                    // Per-student running totals (chronological)
                    const chronoByStudent:Record<string,FeePayment[]>={};
                    for(const p of [...yearPayments].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){
                      if(!chronoByStudent[p.studentId])chronoByStudent[p.studentId]=[];
                      chronoByStudent[p.studentId].push(p);
                    }
                    return sorted.map(p=>{
                      const st=students.find(s=>s.id===p.studentId);
                      const bd=st?getBd(st):null;
                      const due=bd?.total||0;
                      const stuEntries=chronoByStudent[p.studentId]||[];
                      const idx=stuEntries.findIndex(x=>x.id===p.id);
                      const collNo=idx+1;
                      const runningTotal=stuEntries.slice(0,idx+1).reduce((a,x)=>a+x.amount,0);
                      const settled=due>0&&runningTotal>=due;
                      const wasSettledBefore=idx>0&&stuEntries.slice(0,idx).reduce((a,x)=>a+x.amount,0)>=due;
                      const settledHere=settled&&!wasSettledBefore;
                      return(
                        <tr key={p.id} className={`hover:bg-[#FDF5F5]/60 ${settledHere?"bg-emerald-50/40":""}`}>
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={st?.name||"?"} size="sm"/><span className="font-semibold text-[#1C1A17]">{st?.name||"Unknown"}</span></div></td>
                          <td className="px-4 py-3 text-[#1C1A17]/60">{st?.form||"—"}</td>
                          <td className="px-4 py-3 text-center"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B1A1A]/08 text-[#8B1A1A]">#{collNo}</span></td>
                          <td className="px-4 py-3 font-bold" style={{color:P,fontFamily:"var(--font-mono)"}}>{fmtCfa(p.amount)}</td>
                          <td className="px-4 py-3 font-semibold" style={{fontFamily:"var(--font-mono)",color:settled?"#15803d":"#1C1A17"}}>{fmtCfa(runningTotal)}</td>
                          <td className="px-4 py-3 text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{due?fmtCfa(due):"—"}</td>
                          <td className="px-4 py-3">
                            {settledHere
                              ?<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">PAID ✓</span>
                              :settled
                                ?<span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Already paid</span>
                                :runningTotal>0
                                  ?<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Collecting…</span>
                                  :<span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">Unpaid</span>}
                          </td>
                          <td className="px-4 py-3 text-[#1C1A17]/60 text-xs">{fmtDate(p.date)}</td>
                          <td className="px-4 py-3 capitalize text-[#1C1A17]/60">{p.method.replace(/_/g," ")}</td>
                          <td className="px-4 py-3 text-xs font-semibold" style={{color:settledHere?P:"#1C1A17AA"}}>{p.collectedBy||"—"}</td>
                          <td className="px-4 py-3"><div className="flex gap-1">{canAccess(user,"admin")&&<><button onClick={()=>openEditColl(p)} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Edit2 size={12}/></button><button onClick={()=>removeColl(p.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={12}/></button></>}</div></td>
                        </tr>
                      );
                    });
                  })()
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {tab==="students"&&<div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center"><div className="relative flex-1 min-w-48 max-w-xs"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1A17]/30"/><input placeholder="Search student…" value={stdSearch} onChange={e=>setStdSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none"/></div><select value={stdFormF} onChange={e=>setStdFormF(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none"><option value="">All Classes</option>{FORMS.map(f=><option key={f} value={f}>{f}</option>)}</select><p className="text-xs text-[#1C1A17]/40 ml-auto">{filtStds.length} students · {yearOvs.length} with custom fees</p></div>
        {!yearFeeStruct&&<div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm"><AlertTriangle size={15}/>No fee schedule for {currentYear}. Set one in the <strong>Fee Schedule</strong> tab.</div>}
        <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{fontFamily:"var(--font-body)"}}>
              <thead><tr className="bg-[#FDF5F5] border-b border-[#8B1A1A]/08">{["Student","Class/Section","Fee Due","Collection Progress","Balance / Status","Fee Type","Actions"].map(h=><th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#8B1A1A]/05">
                {filtStds.map(s=>{
                  const bd=getBd(s);const paid=getPaid(s.id);const balance=bd.total-paid;
                  const ov=yearOvs.find(o=>o.studentId===s.id);
                  const pct=bd.total>0?Math.min(100,Math.round(paid/bd.total*100)):0;
                  const fullyPaid=bd.total>0&&balance<=0;
                  const settledBy=fullyPaid?getSettledBy(s.id):null;
                  return(
                    <tr key={s.id} className={`hover:bg-[#FDF5F5]/60 ${fullyPaid?"bg-emerald-50/30":ov?"bg-amber-50/20":""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2"><Avatar name={s.name} size="sm"/><div><p className="font-semibold text-[#1C1A17]">{s.name}</p><p className="text-[10px] text-[#1C1A17]/40">{s.studentId}</p></div></div>
                      </td>
                      <td className="px-4 py-3"><p className="text-[#1C1A17]">{s.form}</p><p className="text-[10px] text-[#1C1A17]/40 capitalize">{s.section}</p></td>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{fontFamily:"var(--font-mono)"}}>{bd.total?fmtCfa(bd.total):"—"}</p>
                        <button onClick={()=>setBdSt(s)} className="text-[9px] text-[#1C1A17]/40 hover:text-[#8B1A1A] underline">breakdown</button>
                      </td>
                      <td className="px-4 py-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-[#8B1A1A]/10 overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:fullyPaid?"#15803d":P}}/></div>
                          <span className="text-[10px] font-bold w-7 text-right" style={{color:fullyPaid?"#15803d":P,fontFamily:"var(--font-mono)"}}>{pct}%</span>
                        </div>
                        <p className="text-[10px] text-[#1C1A17]/40 mt-0.5" style={{fontFamily:"var(--font-mono)"}}>Collected {fmtCfa(paid)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {fullyPaid
                          ?<div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">PAID ✓</span>
                              {settledBy&&<p className="text-[10px] text-emerald-700 font-semibold mt-1">by {settledBy}</p>}
                            </div>
                          :<div>
                              <p className="font-bold text-sm" style={{color:"#dc2626",fontFamily:"var(--font-mono)"}}>{fmtCfa(balance)}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${paid===0&&bd.total>0?"bg-red-100 text-red-700 border-red-200":"bg-amber-100 text-amber-700 border-amber-200"}`}>{paid===0&&bd.total>0?"UNPAID":"PARTIAL"}</span>
                            </div>}
                      </td>
                      <td className="px-4 py-3">{ov?<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Custom</span>:<span className="text-[10px] text-[#1C1A17]/30">Schedule</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {canAccess(user,"admin")&&!fullyPaid&&<button onClick={()=>openCollect(s)} className="text-[10px] font-bold px-2 py-1 rounded border hover:bg-[#F3E8E8]" style={{color:P,borderColor:P+"33"}}><Plus size={9} className="inline mr-0.5"/>Collect</button>}
                          {canAccess(user,"admin")&&<><button onClick={()=>openOverride(s)} className="text-[10px] font-bold px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-500"><Edit2 size={9} className="inline mr-0.5"/>Fees</button>{ov&&<button onClick={()=>resetOverride(s.id)} className="text-[10px] font-bold px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-500"><RotateCcw size={9} className="inline mr-0.5"/>Reset</button>}</>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {tab==="outstanding"&&<div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3"><p className="text-sm text-[#1C1A17]/60">{outList.length} students owing &nbsp;·&nbsp; Total outstanding: <strong>{fmtCfa(outList.reduce((a,o)=>a+o.balance,0))}</strong></p><Btn variant="secondary" onClick={()=>exportOutstandingExcel(activeStudents,yearPayments,fees,currentYear)}><Download size={13}/>Export Excel</Btn></div>
        <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm" style={{fontFamily:"var(--font-body)"}}><thead><tr className="bg-[#FDF5F5] border-b border-[#8B1A1A]/08">{["Student","Class","Total Fee","Paid","Balance","Status"].map(h=><th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{h}</th>)}</tr></thead><tbody className="divide-y divide-[#8B1A1A]/05">{outList.length===0?<tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-emerald-600 font-semibold">All students fully paid ✓</td></tr>:outList.map(o=>(<tr key={o.student.id} className="hover:bg-[#FDF5F5]/60"><td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={o.student.name} size="sm"/><span className="font-semibold text-[#1C1A17]">{o.student.name}</span></div></td><td className="px-4 py-3 text-[#1C1A17]/60">{o.student.form}</td><td className="px-4 py-3 text-[#1C1A17]/60" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(o.bd.total)}</td><td className="px-4 py-3 text-green-700 font-semibold" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(o.paid)}</td><td className="px-4 py-3 font-bold text-red-600" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(o.balance)}</td><td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${o.paid===0?"bg-red-100 text-red-700 border-red-200":"bg-amber-100 text-amber-700 border-amber-200"}`}>{o.paid===0?"UNPAID":"PARTIAL"}</span></td></tr>))}</tbody></table></div></div>
      </div>}

      {tab==="report"&&<div className="space-y-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5"><div><h3 className="font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Accountability Report — {currentYear}</h3><p className="text-xs text-[#1C1A17]/50">Complete financial summary for management and audit</p></div><div className="flex gap-2"><Btn variant="secondary" onClick={()=>exportAccountabilityExcel(activeStudents,yearPayments,fees,yearOvs,currentYear)}><Download size={13}/>Export Excel</Btn><Btn onClick={printReport}><Printer size={13}/>Print Report</Btn></div></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">{([["Expected Revenue",fmtCfa(totalExpected),"#1C1A17"],["Total Collected",fmtCfa(totalCollected),"#15803d"],["Outstanding",fmtCfa(Math.max(0,totalExpected-totalCollected)),"#dc2626"],["Collection Rate",`${rate}%`,P]] as [string,string,string][]).map(([l,v,c])=>(<div key={l} className="rounded-xl border border-[#8B1A1A]/08 p-4 bg-[#FAFAF8]"><p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-1" style={{fontFamily:"var(--font-mono)"}}>{l}</p><p className="text-xl font-bold" style={{color:c,fontFamily:"var(--font-display)"}}>{v}</p></div>))}</div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#1C1A17]/50 mb-2" style={{fontFamily:"var(--font-mono)"}}>Collection by Class</h4>
          <ResponsiveContainer width="100%" height={180}><BarChart data={barData} margin={{top:0,right:0,left:0,bottom:0}}><XAxis dataKey="f" tick={{fontSize:9}} tickLine={false}/><YAxis tick={{fontSize:9}} tickLine={false} axisLine={false} tickFormatter={(v:number)=>`${Math.round(v/1000)}k`}/><Tooltip formatter={(v:number)=>fmtCfa(v)} contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="exp" fill="#F3E8E8" name="Expected" radius={[3,3,0,0]}/><Bar dataKey="col" fill={P} name="Collected" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden"><div className="px-5 py-3 border-b border-[#8B1A1A]/08 flex items-center justify-between"><h4 className="font-bold text-sm" style={{color:P,fontFamily:"var(--font-display)"}}>Payment Ledger</h4><span className="text-xs text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>{yearPayments.length} transactions · {fmtCfa(totalCollected)}</span></div><div className="overflow-x-auto"><table className="w-full text-sm" style={{fontFamily:"var(--font-body)"}}><thead><tr className="bg-[#FDF5F5] border-b border-[#8B1A1A]/08">{["Receipt","Student","Class","Date","Amount","Method","Term","Collected By"].map(h=><th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{h}</th>)}</tr></thead><tbody className="divide-y divide-[#8B1A1A]/05">{yearPayments.length===0?<tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[#1C1A17]/40">No payments recorded.</td></tr>:[...yearPayments].sort((a,b)=>b.date.localeCompare(a.date)).map(p=>{const st=students.find(s=>s.id===p.studentId);return(<tr key={p.id} className="hover:bg-[#FDF5F5]/60"><td className="px-4 py-2.5 text-[10px]" style={{fontFamily:"var(--font-mono)",color:P}}>{p.receiptNo||"—"}</td><td className="px-4 py-2.5 font-semibold text-[#1C1A17]">{st?.name||"?"}</td><td className="px-4 py-2.5 text-[#1C1A17]/60">{st?.form||"?"}</td><td className="px-4 py-2.5 text-[#1C1A17]/60 text-xs">{fmtDate(p.date)}</td><td className="px-4 py-2.5 font-bold" style={{color:P,fontFamily:"var(--font-mono)"}}>{fmtCfa(p.amount)}</td><td className="px-4 py-2.5 capitalize text-[#1C1A17]/60">{p.method.replace(/_/g," ")}</td><td className="px-4 py-2.5 text-[#1C1A17]/60">T{p.term}</td><td className="px-4 py-2.5 text-[#1C1A17]/60">{p.collectedBy||"—"}</td></tr>);})}</tbody></table></div></div>
        {outList.length>0&&<div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden"><div className="px-5 py-3 border-b border-[#8B1A1A]/08"><h4 className="font-bold text-sm text-red-600" style={{fontFamily:"var(--font-display)"}}>Outstanding Balances — {outList.length} students</h4></div><div className="overflow-x-auto"><table className="w-full text-sm" style={{fontFamily:"var(--font-body)"}}><thead><tr className="bg-[#FDF5F5] border-b border-[#8B1A1A]/08">{["Student","Class","Total Due","Paid","Balance","Status"].map(h=><th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{h}</th>)}</tr></thead><tbody className="divide-y divide-[#8B1A1A]/05">{outList.map(o=>(<tr key={o.student.id} className="hover:bg-[#FDF5F5]/60"><td className="px-4 py-2.5 font-semibold text-[#1C1A17]">{o.student.name}</td><td className="px-4 py-2.5 text-[#1C1A17]/60">{o.student.form}</td><td className="px-4 py-2.5" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(o.bd.total)}</td><td className="px-4 py-2.5 text-green-700" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(o.paid)}</td><td className="px-4 py-2.5 font-bold text-red-600" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(o.balance)}</td><td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${o.paid===0?"bg-red-100 text-red-700 border-red-200":"bg-amber-100 text-amber-700 border-amber-200"}`}>{o.paid===0?"UNPAID":"PARTIAL"}</span></td></tr>))}</tbody></table></div></div>}
      </div>}

      {tab==="fees"&&<div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3"><div><p className="text-sm text-[#1C1A17]/60">Official SIHS fee schedule for {currentYear}. Fees are computed automatically per student based on their class and section.</p></div>{canAccess(user,"admin")&&<Btn onClick={openEditFeeSchedule}><Edit2 size={13}/>{yearFeeStruct?"Edit Schedule":"Set Up Schedule"}</Btn>}</div>
        {!yearFeeStruct?<div className="bg-white rounded-xl p-12 text-center border border-[#8B1A1A]/08 text-sm text-[#1C1A17]/40">No fee schedule for {currentYear}. {canAccess(user,"admin")?"Click \"Set Up Schedule\" to create one.":""}</div>:<div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-3" style={{fontFamily:"var(--font-mono)"}}>Universal Fees — All Students</p>
              <div className="space-y-2">{([["Admission",yearFeeStruct.admission],["Health Fee",yearFeeStruct.health],["Computer Fee",yearFeeStruct.computer],["ID Card",yearFeeStruct.idCard],["PTA",yearFeeStruct.pta]] as [string,number][]).map(([l,v])=>(<div key={l} className="flex items-center justify-between text-sm"><span className="text-[#1C1A17]/70">{l}</span><span className="font-bold" style={{color:P,fontFamily:"var(--font-mono)"}}>{fmtCfa(v)}</span></div>))}</div>
              <div className="mt-3 pt-3 border-t border-[#8B1A1A]/08 flex justify-between"><span className="text-xs font-bold text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>Universal subtotal</span><span className="font-bold text-sm" style={{color:P,fontFamily:"var(--font-mono)"}}>{fmtCfa(yearFeeStruct.admission+yearFeeStruct.health+yearFeeStruct.computer+yearFeeStruct.idCard+yearFeeStruct.pta)}</span></div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-3" style={{fontFamily:"var(--font-mono)"}}>Tuition — By Class & Section</p>
              <div className="space-y-3">{([["Form 1–5 · General",yearFeeStruct.tuitionGeneral,"#8B1A1A","General section"],["Form 1–5 · Technical/Com",yearFeeStruct.tuitionTechCom,"#1d4ed8","Technical & Commercial"],["Lower & Upper Sixth",yearFeeStruct.tuitionSixth,"#7c3aed","All sections"]] as [string,number,string,string][]).map(([l,v,c,sub])=>(<div key={l} className="rounded-lg p-3" style={{background:c+"0d",border:`1px solid ${c}22`}}><div className="flex justify-between items-start"><div><p className="font-bold text-xs" style={{color:c}}>{l}</p><p className="text-[10px] text-[#1C1A17]/40">{sub}</p></div><span className="font-bold text-sm" style={{color:c,fontFamily:"var(--font-mono)"}}>{fmtCfa(v)}</span></div></div>))}</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-3" style={{fontFamily:"var(--font-mono)"}}>Special Fees</p>
              <div className="space-y-3">{([["Lab Fee",yearFeeStruct.labFee,"L6/U6 Science (gen_sci specialty). Applied automatically.","#059669"],["Home Economics",yearFeeStruct.homeEcFee,"L6/U6 HE students. Set manually via student override.","#d97706"]] as [string,number,string,string][]).map(([l,v,note,c])=>(<div key={l} className="rounded-lg p-3" style={{background:c+"0d",border:`1px solid ${c}22`}}><div className="flex justify-between mb-1"><p className="font-bold text-xs" style={{color:c}}>{l}</p><span className="font-bold text-sm" style={{color:c,fontFamily:"var(--font-mono)"}}>{fmtCfa(v)}</span></div><p className="text-[10px] text-[#1C1A17]/40">{note}</p></div>))}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-3" style={{fontFamily:"var(--font-mono)"}}>Total Per Student Category (Universal + Tuition)</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{([["General F1–5",yearFeeStruct.admission+yearFeeStruct.health+yearFeeStruct.computer+yearFeeStruct.idCard+yearFeeStruct.pta+yearFeeStruct.tuitionGeneral,"#8B1A1A"],["Tech/Com F1–5",yearFeeStruct.admission+yearFeeStruct.health+yearFeeStruct.computer+yearFeeStruct.idCard+yearFeeStruct.pta+yearFeeStruct.tuitionTechCom,"#1d4ed8"],["L6/U6 Standard",yearFeeStruct.admission+yearFeeStruct.health+yearFeeStruct.computer+yearFeeStruct.idCard+yearFeeStruct.pta+yearFeeStruct.tuitionSixth,"#7c3aed"],["L6/U6 + Lab",yearFeeStruct.admission+yearFeeStruct.health+yearFeeStruct.computer+yearFeeStruct.idCard+yearFeeStruct.pta+yearFeeStruct.tuitionSixth+yearFeeStruct.labFee,"#059669"],["L6/U6 + HE",yearFeeStruct.admission+yearFeeStruct.health+yearFeeStruct.computer+yearFeeStruct.idCard+yearFeeStruct.pta+yearFeeStruct.tuitionSixth+yearFeeStruct.homeEcFee,"#d97706"]] as [string,number,string][]).map(([l,v,c])=>(<div key={l} className="rounded-xl border-2 p-3 text-center" style={{borderColor:c+"33",background:c+"06"}}><p className="text-[10px] font-bold" style={{color:c}}>{l}</p><p className="text-lg font-bold mt-1" style={{color:c,fontFamily:"var(--font-display)"}}>{fmtCfa(v)}</p></div>))}</div>
          </div>
        </div>}
      </div>}

      {showCollM&&(()=>{
        const collStudent=activeStudents.find(s=>s.id===pform.studentId)||null;
        const collBd=collStudent?getBd(collStudent):null;
        const alreadyPaid=pform.studentId?getPaid(pform.studentId):0;
        const remaining=collBd?Math.max(0,collBd.total-alreadyPaid):0;
        const enteredAmt=Number(pform.amount)||0;
        const newTotal=alreadyPaid+enteredAmt;
        const willSettle=collBd&&collBd.total>0&&newTotal>=collBd.total&&alreadyPaid<collBd.total;
        const alreadySettled=collBd&&collBd.total>0&&alreadyPaid>=collBd.total;
        const pct=collBd&&collBd.total>0?Math.min(100,Math.round(alreadyPaid/collBd.total*100)):0;
        return(
          <Modal title={editP?"Edit Collection Entry":"Collect Fee"} onClose={()=>setShowCollM(false)} wide>
            <form onSubmit={saveCollection} className="space-y-4">
              {/* Student picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Student *</label>
                <select value={pform.studentId||""} onChange={e=>{
                  const sid=e.target.value;const s=activeStudents.find(x=>x.id===sid);
                  const bd=s?getBd(s):null;const rem=sid?Math.max(0,(bd?.total||0)-getPaid(sid)):0;
                  setPform(f=>({...f,studentId:sid,amount:rem||undefined,category:"School Fees"}));
                }} required className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none text-[#1C1A17]">
                  <option value="">— Select Student —</option>
                  {activeStudents.map(s=>{const paid=getPaid(s.id);const bd=getBd(s);const bal=bd.total-paid;return(<option key={s.id} value={s.id}>{s.name} ({s.form}) — {bal<=0?"✓ Fully paid":`${fmtCfa(bal)} remaining`}</option>);})}
                </select>
              </div>

              {/* Collection status panel */}
              {collBd&&collStudent&&(
                <div className="rounded-xl border overflow-hidden" style={{borderColor:alreadySettled?"#86efac":P+"22"}}>
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{background:alreadySettled?"#f0fdf4":P+"10"}}>
                    <div><p className="text-xs font-bold" style={{color:alreadySettled?"#15803d":P,fontFamily:"var(--font-mono)"}}>{collStudent.form} · {collStudent.section}</p></div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${alreadySettled?"bg-emerald-100 text-emerald-700 border-emerald-300":alreadyPaid===0?"bg-red-100 text-red-700 border-red-200":"bg-amber-100 text-amber-700 border-amber-200"}`}>{alreadySettled?"FULLY PAID":alreadyPaid===0?"NOT YET COLLECTED":"COLLECTING…"}</span>
                  </div>
                  {/* Fee breakdown */}
                  <div className="p-3 grid grid-cols-2 gap-1.5">
                    {FEE_LABELS.filter(fl=>fl.key!=="discount"&&fl.key!=="total").map(fl=>{const v=(collBd as any)[fl.key] as number;if(!v)return null;return(<div key={fl.key} className="flex items-center justify-between px-2 py-1.5 rounded bg-white border border-[#8B1A1A]/05"><span className="text-xs text-[#1C1A17]/60">{fl.label}</span><span className="text-xs font-bold" style={{color:P,fontFamily:"var(--font-mono)"}}>{fmtCfa(v)}</span></div>);})}
                    {collBd.discount>0&&<div className="flex items-center justify-between px-2 py-1.5 rounded bg-amber-50 border border-amber-100"><span className="text-xs text-amber-700">Discount</span><span className="text-xs font-bold text-amber-700" style={{fontFamily:"var(--font-mono)"}}>−{fmtCfa(collBd.discount)}</span></div>}
                  </div>
                  {/* Progress */}
                  <div className="px-4 pt-2 pb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2.5 rounded-full bg-[#8B1A1A]/08 overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:alreadySettled?"#15803d":P}}/></div>
                      <span className="text-[10px] font-bold w-8 text-right" style={{color:alreadySettled?"#15803d":P,fontFamily:"var(--font-mono)"}}>{pct}%</span>
                    </div>
                  </div>
                  <div className="px-3 py-2 border-t border-[#8B1A1A]/08 grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-[10px] text-[#1C1A17]/40 mb-0.5" style={{fontFamily:"var(--font-mono)"}}>TOTAL DUE</p><p className="font-bold text-sm" style={{color:P,fontFamily:"var(--font-mono)"}}>{fmtCfa(collBd.total)}</p></div>
                    <div><p className="text-[10px] text-[#1C1A17]/40 mb-0.5" style={{fontFamily:"var(--font-mono)"}}>COLLECTED</p><p className="font-bold text-sm text-emerald-700" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(alreadyPaid)}</p></div>
                    <div><p className="text-[10px] text-[#1C1A17]/40 mb-0.5" style={{fontFamily:"var(--font-mono)"}}>REMAINING</p><p className="font-bold text-sm" style={{color:remaining>0?"#dc2626":"#15803d",fontFamily:"var(--font-mono)"}}>{remaining>0?fmtCfa(remaining):"SETTLED"}</p></div>
                  </div>
                </div>
              )}

              {/* Settlement preview */}
              {willSettle&&<div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border-2 border-emerald-300">
                <CheckCircle size={16} className="text-emerald-600 flex-shrink-0"/>
                <div><p className="text-sm font-bold text-emerald-800">This collection will fully settle {collStudent?.name}</p><p className="text-xs text-emerald-700">Collected by: <strong>{pform.collectedBy||user.name}</strong> — will be recorded as PAID</p></div>
              </div>}

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Amount Collected (XAF) *</label>
                <div className="flex gap-1.5">
                  <input type="number" min={1} required value={pform.amount||""} onChange={e=>setPform(f=>({...f,amount:Number(e.target.value)}))} className="flex-1 px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none" style={{fontFamily:"var(--font-mono)"}}/>
                  {remaining>0&&<button type="button" onClick={()=>setPform(f=>({...f,amount:remaining}))} className="px-2.5 py-1.5 rounded text-[10px] font-bold border whitespace-nowrap" style={{color:P,borderColor:P+"44",background:P+"0a"}}>Full balance</button>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FI label="Date *" value={pform.date||""} onChange={v=>setPform(f=>({...f,date:v}))} type="date"/>
                <FI label="Collected By *" value={pform.collectedBy||""} onChange={v=>setPform(f=>({...f,collectedBy:v}))}/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FS label="Method" value={pform.method||"cash"} onChange={v=>setPform(f=>({...f,method:v as any}))} options={["cash","mobile_money","bank"]}/>
                <FS label="Term" value={pform.term||"1"} onChange={v=>setPform(f=>({...f,term:v as Term}))} options={["1","2","3"]}/>
                <FI label="Receipt No" value={pform.receiptNo||""} onChange={v=>setPform(f=>({...f,receiptNo:v}))}/>
              </div>
              <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Notes</label><textarea value={pform.notes||""} onChange={e=>setPform(f=>({...f,notes:e.target.value}))} rows={1} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none resize-none"/></div>
              <div className="flex justify-end gap-2 pt-1">
                <Btn variant="secondary" onClick={()=>setShowCollM(false)}>Cancel</Btn>
                <Btn type="submit">{willSettle?<CheckCircle size={13}/>:<Plus size={13}/>}{editP?"Save Changes":willSettle?"Record as Fully Paid":"Add Collection"}</Btn>
              </div>
            </form>
          </Modal>
        );
      })()}

      {showFeeM&&(<Modal title={`Fee Schedule — ${currentYear}`} onClose={()=>setShowFeeM(false)} wide><form onSubmit={saveFee} className="space-y-4">
        <div className="rounded-lg p-3 bg-[#FDF5F5] border border-[#8B1A1A]/08 text-xs text-[#1C1A17]/60">Amounts in FCFA. Changes apply to all students based on their class and section.</div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-[#1C1A17]/50 mb-2" style={{fontFamily:"var(--font-mono)"}}>Universal Fees (all students)</p><div className="grid grid-cols-3 gap-3">{([["Admission","admission"],["Health Fee","health"],["Computer Fee","computer"],["ID Card","idCard"],["PTA","pta"]] as [string,keyof FeeStructure][]).map(([l,k])=><FI key={k} label={l} value={String((feeForm as any)[k]||"")} onChange={v=>setFeeForm(f=>({...f,[k]:Number(v)}))} type="number"/>)}</div></div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-[#1C1A17]/50 mb-2" style={{fontFamily:"var(--font-mono)"}}>Tuition Fees</p><div className="grid grid-cols-3 gap-3"><FI label="General F1–5" value={String(feeForm.tuitionGeneral||"")} onChange={v=>setFeeForm(f=>({...f,tuitionGeneral:Number(v)}))} type="number"/><FI label="Tech/Com F1–5" value={String(feeForm.tuitionTechCom||"")} onChange={v=>setFeeForm(f=>({...f,tuitionTechCom:Number(v)}))} type="number"/><FI label="L6 & U6 (all)" value={String(feeForm.tuitionSixth||"")} onChange={v=>setFeeForm(f=>({...f,tuitionSixth:Number(v)}))} type="number"/></div></div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-[#1C1A17]/50 mb-2" style={{fontFamily:"var(--font-mono)"}}>Special Fees</p><div className="grid grid-cols-2 gap-3"><FI label="Lab Fee (L6/U6 Science)" value={String(feeForm.labFee||"")} onChange={v=>setFeeForm(f=>({...f,labFee:Number(v)}))} type="number"/><FI label="Home Economics (L6/U6)" value={String(feeForm.homeEcFee||"")} onChange={v=>setFeeForm(f=>({...f,homeEcFee:Number(v)}))} type="number"/></div></div>
        <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setShowFeeM(false)}>Cancel</Btn><Btn type="submit"><CheckCircle size={13}/>Save Schedule</Btn></div>
      </form></Modal>)}

      {showOvM&&ovSt&&ovBd&&(<Modal title={`Individual Fee — ${ovSt.name}`} onClose={()=>setShowOvM(false)} wide><form onSubmit={saveOverride} className="space-y-4">
        <div className="rounded-lg p-3 bg-[#FDF5F5] border border-[#8B1A1A]/08 text-xs flex items-start justify-between gap-3"><div><p className="font-bold" style={{color:P}}>{ovSt.form} · {ovSt.section} · {ovSt.studentId}</p><p className="text-[#1C1A17]/60 mt-0.5">Override any fee component. Leave blank to use the schedule default.</p></div>{yearOvs.find(o=>o.studentId===ovSt.id)&&<span className="whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Has Override</span>}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{FEE_LABELS.filter(fl=>fl.key!=="discount"&&fl.key!=="total").map(fl=>{const auto=(ovBd as any)[fl.key];return(<div key={fl.key}><label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>{fl.label}<br/><span className="normal-case font-normal text-[#1C1A17]/30">auto: {fmtCfa(auto)}</span></label><input type="number" min={0} value={(ovForm as any)[fl.key]??auto} onChange={e=>setOvForm(f=>({...f,[fl.key]:Number(e.target.value)}))} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none" style={{fontFamily:"var(--font-mono)"}}/></div>);})}</div>
        <div className="grid grid-cols-2 gap-3"><FI label="Discount / Waiver (XAF)" value={String(ovForm.discount)} onChange={v=>setOvForm(f=>({...f,discount:Math.max(0,Number(v))}))} type="number"/><div className="flex items-end"><div className="rounded-lg border-2 px-3 py-2 w-full text-sm font-bold" style={{borderColor:P+"33"}}><p className="text-[10px] text-[#1C1A17]/40 mb-0.5" style={{fontFamily:"var(--font-mono)"}}>Adjusted Total</p><p style={{color:P,fontFamily:"var(--font-mono)"}}>{fmtCfa(ovBd.total)}</p></div></div></div>
        <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Reason / Notes</label><textarea value={ovForm.reason} onChange={e=>setOvForm(f=>({...f,reason:e.target.value}))} rows={2} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none resize-none" placeholder="e.g. Staff child discount, scholarship, HE fee, bursary…"/></div>
        <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={()=>setShowOvM(false)}>Cancel</Btn><Btn type="submit"><CheckCircle size={13}/>Save Override</Btn></div>
      </form></Modal>)}

      {bdSt&&<Modal title={`Fee Breakdown — ${bdSt.name}`} onClose={()=>setBdSt(null)}>{(()=>{const bd=getBd(bdSt);const paid=getPaid(bdSt.id);const ov=yearOvs.find(o=>o.studentId===bdSt.id);return(<div className="space-y-3"><div className="rounded-lg p-3 bg-[#FDF5F5] border border-[#8B1A1A]/08 text-xs"><p className="font-bold" style={{color:P}}>{bdSt.form} · {bdSt.section} section</p>{ov&&<p className="text-amber-600 mt-0.5 font-semibold">⚠ Custom override applied — {ov.reason||"no reason given"}</p>}</div><div className="space-y-1.5">{FEE_LABELS.filter(fl=>fl.key!=="discount"&&fl.key!=="total").map(fl=>{const v=(bd as any)[fl.key] as number;if(!v)return null;return(<div key={fl.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#8B1A1A]/05"><span className="text-sm text-[#1C1A17]/70">{fl.label}</span><span className="font-bold text-sm" style={{color:P,fontFamily:"var(--font-mono)"}}>{fmtCfa(v)}</span></div>);})}{bd.discount>0&&<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 border border-amber-200"><span className="text-sm text-amber-700">Discount / Waiver</span><span className="font-bold text-sm text-amber-700" style={{fontFamily:"var(--font-mono)"}}>−{fmtCfa(bd.discount)}</span></div>}</div><div className="flex items-center justify-between px-3 py-3 rounded-xl border-2 font-bold" style={{borderColor:P+"33"}}><span style={{color:P}}>Total Due</span><span style={{color:P,fontFamily:"var(--font-mono)"}}>{fmtCfa(bd.total)}</span></div><div className="grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-lg p-2 bg-[#FDF5F5]"><p className="text-[10px] text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>TOTAL DUE</p><p className="font-bold" style={{color:P}}>{fmtCfa(bd.total)}</p></div><div className="rounded-lg p-2 bg-emerald-50"><p className="text-[10px] text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>PAID</p><p className="font-bold text-emerald-700">{fmtCfa(paid)}</p></div><div className="rounded-lg p-2" style={{background:Math.max(0,bd.total-paid)>0?"#FEF2F2":"#F0FDF4"}}><p className="text-[10px] text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>BALANCE</p><p className="font-bold" style={{color:Math.max(0,bd.total-paid)>0?"#dc2626":"#15803d"}}>{fmtCfa(Math.max(0,bd.total-paid))}</p></div></div></div>);})()} </Modal>}
    </div>
  );
}

// ─── Timetable ────────────────────────────────────────────────────────────────
const SCOLS:Record<string,string>={
  Mathematics:"bg-blue-100 text-blue-800","Add. Mathematics":"bg-blue-100 text-blue-800",
  "English Language":"bg-purple-100 text-purple-800","Literatures in English":"bg-purple-100 text-purple-800",
  Biology:"bg-green-100 text-green-800","Human Biology":"bg-green-100 text-green-800",
  Chemistry:"bg-teal-100 text-teal-800",
  Physics:"bg-cyan-100 text-cyan-800",Mechanics:"bg-cyan-100 text-cyan-800",
  "French Language":"bg-orange-100 text-orange-800",
  History:"bg-amber-100 text-amber-800",Citizenship:"bg-amber-100 text-amber-800",
  Geography:"bg-lime-100 text-lime-800",Geology:"bg-lime-100 text-lime-800",
  "Computer Science / I.C.T":"bg-indigo-100 text-indigo-800",
  "Food and Nutrition":"bg-fuchsia-100 text-fuchsia-800","Home Economics":"bg-fuchsia-100 text-fuchsia-800",
  "Physical Education":"bg-emerald-100 text-emerald-800","Manual Labour":"bg-emerald-100 text-emerald-800",
  "Religious Studies":"bg-rose-100 text-rose-800","Guidance Counselling":"bg-rose-100 text-rose-800",
};
function sColor(sub:string){return SCOLS[sub]||"bg-gray-100 text-gray-700";}

export function TimetablePage({timetable=[],setTimetable=()=>{},teachers=[],subjects=[],user,currentYear=""}:{timetable:TimetableSlot[];setTimetable:(t:TimetableSlot[])=>void;teachers:Teacher[];subjects:Subject[];user:AuthUser;currentYear:string}){
  const [view,setView]=useState<"class"|"teacher">("class");
  const [selForm,setSelForm]=useState(()=>FORMS[0]||"Form 1");
  const [selTeacher,setSelTeacher]=useState(()=>teachers[0]?.id||"");
  const [showSlotM,setShowSlotM]=useState(false);
  const [editSlot,setEditSlot]=useState<TimetableSlot|null>(null);
  const [slotCell,setSlotCell]=useState<{form:string;day:string;period:number}|null>(null);
  const [slotForm,setSlotForm]=useState({subjectName:"",teacherId:"",room:""});
  const isAdmin=canAccess(user,"admin");

  function getSlot(form:string,day:string,period:number){return timetable.find(s=>s.form===form&&s.day===day&&s.period===period)||null;}
  function getTeacherName(id:string){const t=teachers.find(t=>t.id===id);return t?t.name:"Unknown";}
  function openAdd(form:string,day:string,period:number){if(!isAdmin)return;const existing=getSlot(form,day,period);if(existing){setEditSlot(existing);setSlotForm({subjectName:existing.subjectName,teacherId:existing.teacherId,room:existing.room||""});}else{setEditSlot(null);setSlotForm({subjectName:"",teacherId:teachers[0]?.id??"",room:""});}setSlotCell({form,day,period});setShowSlotM(true);}
  function saveSlot(e:React.FormEvent){e.preventDefault();if(!slotCell)return;const id=editSlot?.id||(uid());const slot:TimetableSlot={id,form:slotCell.form,day:slotCell.day,period:slotCell.period,subjectName:slotForm.subjectName,teacherId:slotForm.teacherId,room:slotForm.room||undefined};const updated=editSlot?timetable.map(s=>s.id===editSlot.id?slot:s):[...timetable,slot];setTimetable(updated);dbSet("timetable",updated);setShowSlotM(false);}
  function deleteSlot(){if(!editSlot)return;if(!confirm("Remove this slot?"))return;const updated=timetable.filter(s=>s.id!==editSlot.id);setTimetable(updated);dbSet("timetable",updated);setShowSlotM(false);}

  function printTimetable(){
    const title=view==="class"?`${selForm} — Weekly Timetable`:`${teachers.find(t=>t.id===selTeacher)?.name||"Teacher"} — Weekly Schedule`;
    const rows=PERIODS.map(p=>{
      const cells=DAYS.map(d=>{
        const s=view==="class"?getSlot(selForm,d,p.n):timetable.find(sl=>sl.teacherId===selTeacher&&sl.day===d&&sl.period===p.n);
        const content=view==="class"?(s?`<strong>${s.subjectName}</strong><br/><small>${getTeacherName(s.teacherId)}</small>`:"—"):(s?`<strong>${s.form}</strong><br/><small>${s.subjectName}</small>`:"—");
        return`<td style="border:1px solid #ddd;padding:6px 8px;font-size:10px;text-align:center;vertical-align:top">${content}</td>`;
      }).join("");
      return`<tr><td style="border:1px solid #ddd;padding:6px 8px;font-weight:bold;font-size:10px;color:#8B1A1A;white-space:nowrap">P${p.n}<br/><span style="font-weight:normal;font-size:9px;color:#666">${p.time}</span></td>${cells}</tr>`;
    }).join("");
    const breakRow=`<tr style="background:#FFF8E7"><td colspan="6" style="border:1px solid #ddd;padding:4px 8px;font-size:9px;color:#888;font-style:italic">Break 10:30–11:00 &nbsp;·&nbsp; Lunch 13:00–14:00</td></tr>`;
    const w=window.open("","_blank","width=1050,height=780");if(!w)return;
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;margin:16px;font-size:11px}table{border-collapse:collapse;width:100%}@media print{@page{size:A4 landscape;margin:8mm}}</style></head><body><div style="text-align:center;margin-bottom:12px"><div style="font-size:18px;font-weight:900;color:#8B1A1A">${SCHOOL.full}</div><div style="font-size:13px;font-weight:700;margin:3px 0">${title.toUpperCase()}</div><div style="font-size:9px;color:#888">Academic Year ${currentYear} · Generated ${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})}</div><hr style="border-color:#8B1A1A33;margin:8px 0"/></div><table><thead><tr style="background:#8B1A1A;color:#fff"><th style="border:1px solid #8B1A1A;padding:6px 10px;font-size:10px">Period / Time</th>${DAYS.map(d=>`<th style="border:1px solid #8B1A1A;padding:6px 10px;font-size:10px">${d}</th>`).join("")}</tr></thead><tbody>${rows}${breakRow}</tbody></table></body></html>`);
    w.document.close();w.focus();setTimeout(()=>w.print(),600);
  }

  // Subject summary for class view
  const formSlots=timetable.filter(s=>s.form===selForm);
  const subjectCounts=formSlots.reduce((acc,s)=>{acc[s.subjectName]=(acc[s.subjectName]||0)+1;return acc;},{} as Record<string,number>);

  // Teacher weekly slots
  const teacherSlots=timetable.filter(s=>s.teacherId===selTeacher);
  const teacherForms=[...new Set(teacherSlots.map(s=>s.form))];

  return(
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Timetable</h1>
          <p className="text-sm text-[#1C1A17]/50">Academic Year {currentYear} · Weekly schedule</p>
        </div>
        <div className="flex gap-2">
          <button onClick={printTimetable} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all hover:bg-[#F3E8E8]" style={{color:P,borderColor:P+"44"}}><Printer size={14}/>Print</button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#8B1A1A]/08 shadow-sm w-fit">
        {([["class","Class Schedule",Grid],["teacher","Teacher Schedule",User]] as [string,string,React.ElementType][]).map(([id,label,Icon])=>(
          <button key={id} onClick={()=>setView(id as any)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all" style={view===id?{background:P,color:"#fff"}:{color:"#1C1A17",opacity:0.55}}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {view==="class"&&<>
        {/* Form selector */}
        <div className="flex gap-1.5 flex-wrap">
          {FORMS.map(f=>(
            <button key={f} onClick={()=>setSelForm(f)} className="px-3.5 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all" style={{borderColor:selForm===f?P:"#e5e7eb",background:selForm===f?P:"white",color:selForm===f?"white":"#6b7280"}}>
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-3" style={{background:P}}>
            <Grid size={15} className="text-white/70"/>
            <h3 className="text-white font-bold" style={{fontFamily:"var(--font-display)"}}>{selForm} — Weekly Schedule</h3>
            {isAdmin&&<span className="ml-auto text-white/60 text-xs">Click any cell to edit</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{fontFamily:"var(--font-body)"}}>
              <thead>
                <tr style={{background:"#1C1A17"}}>
                  <th className="px-4 py-3 text-left text-white font-bold text-[10px] uppercase tracking-widest" style={{fontFamily:"var(--font-mono)",minWidth:110}}>Period</th>
                  {DAYS.map(d=><th key={d} className="px-3 py-3 text-center text-white font-bold text-[10px] uppercase tracking-widest" style={{fontFamily:"var(--font-mono)",minWidth:140}}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p,ri)=>{
                  const isBreakAfter=p.n===3;
                  return(
                    <React.Fragment key={p.n}>
                      <tr style={{background:ri%2===0?"#fff":"#fafafa"}}>
                        <td className="px-4 py-3 border-r border-[#8B1A1A]/05">
                          <div className="font-bold text-[11px]" style={{color:P,fontFamily:"var(--font-mono)"}}>P{p.n}</div>
                          <div className="text-[10px] text-[#1C1A17]/40 flex items-center gap-0.5 mt-0.5"><Clock size={9}/>{p.time}</div>
                        </td>
                        {DAYS.map(d=>{
                          const slot=getSlot(selForm,d,p.n);
                          return(
                            <td key={d} className="px-2 py-2 text-center align-top border-r border-[#8B1A1A]/05 last:border-r-0">
                              {slot?(
                                <div className="group relative inline-block w-full">
                                  <span className={`block px-2 py-1.5 rounded-lg text-[10px] font-semibold leading-tight ${sColor(slot.subjectName)}`}>
                                    {slot.subjectName}
                                  </span>
                                  <span className="block text-[9px] text-[#1C1A17]/40 mt-0.5 truncate" style={{fontFamily:"var(--font-mono)"}}>{getTeacherName(slot.teacherId)}</span>
                                  {isAdmin&&<button onClick={()=>openAdd(selForm,d,p.n)} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-white/80 shadow-sm transition-opacity" style={{color:P}}><Edit2 size={9}/></button>}
                                </div>
                              ):(
                                isAdmin?(
                                  <button onClick={()=>openAdd(selForm,d,p.n)} className="w-full h-10 rounded-lg border-2 border-dashed border-[#8B1A1A]/15 text-[#8B1A1A]/30 hover:border-[#8B1A1A]/40 hover:text-[#8B1A1A]/60 hover:bg-[#FDF5F5] transition-all flex items-center justify-center">
                                    <Plus size={12}/>
                                  </button>
                                ):<span className="text-[#1C1A17]/15 text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {isBreakAfter&&(
                        <tr>
                          <td colSpan={6} className="px-4 py-1.5 text-[9px] text-[#1C1A17]/40 text-center italic" style={{background:"#FFF8E7",fontFamily:"var(--font-mono)"}}>
                            — BREAK 10:30–11:00 —
                          </td>
                        </tr>
                      )}
                      {p.n===5&&(
                        <tr>
                          <td colSpan={6} className="px-4 py-1.5 text-[9px] text-[#1C1A17]/40 text-center italic" style={{background:"#FFF8E7",fontFamily:"var(--font-mono)"}}>
                            — LUNCH 13:00–14:00 —
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject summary */}
        {Object.keys(subjectCounts).length>0&&(
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{color:P,fontFamily:"var(--font-display)"}}><BookOpen size={14}/>Subjects this week — {selForm}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(subjectCounts).sort((a,b)=>b[1]-a[1]).map(([sub,count])=>(
                <span key={sub} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${sColor(sub)}`}>
                  {sub} <span className="opacity-60">·{count}p</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </>}

      {view==="teacher"&&<>
        {/* Teacher selector */}
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>Teacher:</label>
          <select value={selTeacher} onChange={e=>setSelTeacher(e.target.value)} className="px-3 py-2 rounded-lg bg-white border border-[#8B1A1A]/10 text-sm focus:outline-none" style={{fontFamily:"var(--font-body)"}}>
            {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Teacher grid */}
        <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-3" style={{background:P}}>
            <User size={15} className="text-white/70"/>
            <h3 className="text-white font-bold" style={{fontFamily:"var(--font-display)"}}>{teachers.find(t=>t.id===selTeacher)?.name||"Teacher"} — Weekly Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{fontFamily:"var(--font-body)"}}>
              <thead>
                <tr style={{background:"#1C1A17"}}>
                  <th className="px-4 py-3 text-left text-white font-bold text-[10px] uppercase tracking-widest" style={{fontFamily:"var(--font-mono)",minWidth:110}}>Period</th>
                  {DAYS.map(d=><th key={d} className="px-3 py-3 text-center text-white font-bold text-[10px] uppercase tracking-widest" style={{fontFamily:"var(--font-mono)",minWidth:140}}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p,ri)=>(
                  <React.Fragment key={p.n}>
                    <tr style={{background:ri%2===0?"#fff":"#fafafa"}}>
                      <td className="px-4 py-3 border-r border-[#8B1A1A]/05">
                        <div className="font-bold text-[11px]" style={{color:P,fontFamily:"var(--font-mono)"}}>P{p.n}</div>
                        <div className="text-[10px] text-[#1C1A17]/40 flex items-center gap-0.5 mt-0.5"><Clock size={9}/>{p.time}</div>
                      </td>
                      {DAYS.map(d=>{
                        const slot=timetable.find(s=>s.teacherId===selTeacher&&s.day===d&&s.period===p.n)||null;
                        return(
                          <td key={d} className="px-2 py-2 text-center align-top border-r border-[#8B1A1A]/05 last:border-r-0">
                            {slot?(
                              <div className="inline-block w-full">
                                <span className="block px-2 py-1.5 rounded-lg text-[10px] font-bold bg-[#FDF5F5] text-[#8B1A1A]">{slot.form}</span>
                                <span className={`block px-2 py-1 rounded mt-0.5 text-[9px] font-semibold ${sColor(slot.subjectName)}`}>{slot.subjectName}</span>
                              </div>
                            ):<span className="text-[#1C1A17]/15 text-xs">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                    {p.n===3&&<tr><td colSpan={6} className="px-4 py-1.5 text-[9px] text-[#1C1A17]/40 text-center italic" style={{background:"#FFF8E7",fontFamily:"var(--font-mono)"}}>— BREAK 10:30–11:00 —</td></tr>}
                    {p.n===5&&<tr><td colSpan={6} className="px-4 py-1.5 text-[9px] text-[#1C1A17]/40 text-center italic" style={{background:"#FFF8E7",fontFamily:"var(--font-mono)"}}>— LUNCH 13:00–14:00 —</td></tr>}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teacher summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{color:P,fontFamily:"var(--font-display)"}}><BookOpen size={14}/>Week Summary</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex flex-col"><span className="text-[10px] text-[#1C1A17]/40 uppercase tracking-widest" style={{fontFamily:"var(--font-mono)"}}>Total periods</span><span className="font-bold text-lg" style={{color:P}}>{teacherSlots.length}</span></div>
            <div className="flex flex-col"><span className="text-[10px] text-[#1C1A17]/40 uppercase tracking-widest" style={{fontFamily:"var(--font-mono)"}}>Classes taught</span><span className="font-bold text-lg" style={{color:P}}>{teacherForms.length}</span></div>
          </div>
          {teacherForms.length>0&&<div className="mt-3 flex flex-wrap gap-1.5">{teacherForms.map(f=><span key={f} className="px-3 py-1 rounded-lg text-[10px] font-bold bg-[#FDF5F5] text-[#8B1A1A] border border-[#8B1A1A]/10">{f}</span>)}</div>}
        </div>
      </>}

      {/* Slot Modal */}
      {showSlotM&&slotCell&&(
        <Modal title={editSlot?`Edit — ${slotCell.form} ${slotCell.day} P${slotCell.period}`:`Add Slot — ${slotCell.form} ${slotCell.day} P${slotCell.period}`} onClose={()=>setShowSlotM(false)}>
          <form onSubmit={saveSlot} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Subject</label>
              <input list="subj-list" value={slotForm.subjectName} onChange={e=>setSlotForm(f=>({...f,subjectName:e.target.value}))} required placeholder="Subject name…" className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none"/>
              <datalist id="subj-list">{subjects.map(s=><option key={s.id} value={s.name}/>)}</datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Teacher</label>
              <select value={slotForm.teacherId} onChange={e=>setSlotForm(f=>({...f,teacherId:e.target.value}))} required className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none">
                <option value="">— Select Teacher —</option>
                {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Room (optional)</label>
              <input value={slotForm.room} onChange={e=>setSlotForm(f=>({...f,room:e.target.value}))} placeholder="e.g. Lab 1, Room 4A…" className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none"/>
            </div>
            <div className="flex justify-between items-center gap-2 pt-1">
              <div>{editSlot&&<button type="button" onClick={deleteSlot} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded hover:bg-red-50"><Trash2 size={12}/>Remove</button>}</div>
              <div className="flex gap-2"><Btn variant="secondary" onClick={()=>setShowSlotM(false)}>Cancel</Btn><Btn type="submit"><CheckCircle size={13}/>{editSlot?"Save Changes":"Add Slot"}</Btn></div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Announcements ────────────────────────────────────────────────────────────
export function AnnouncementsPage({announcements=[],setAnnouncements=()=>{},user}:{announcements:Announcement[];setAnnouncements:(a:Announcement[])=>void;user:AuthUser}){
  const [showM,setShowM]=useState(false);
  const [form,setForm]=useState<Partial<Announcement>>({});
  const typeIcon={info:<Info size={15} className="text-blue-500"/>,warning:<AlertTriangle size={15} className="text-amber-500"/>,urgent:<AlertCircle size={15} className="text-red-500"/>,success:<CheckCircle size={15} className="text-green-500"/>};
  const typeStyle={info:"bg-blue-50 border-blue-200",warning:"bg-amber-50 border-amber-200",urgent:"bg-red-50 border-red-200",success:"bg-emerald-50 border-emerald-200"};
  function save(e:React.FormEvent){e.preventDefault();const n:Announcement={...form as Announcement,id:"ann"+uid(),date:new Date().toISOString().slice(0,10),author:user.name};const u=[n,...announcements];setAnnouncements(u);dbSet("announcements",u);setShowM(false);}
  function remove(id:string){const u=announcements.filter(a=>a.id!==id);setAnnouncements(u);dbSet("announcements",u);}
  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Announcements</h1><p className="text-sm text-[#1C1A17]/50">{announcements.length} announcements</p></div>{canAccess(user,"admin")&&<Btn onClick={()=>{setForm({type:"info",audience:"all"});setShowM(true);}}><Plus size={15}/>New Announcement</Btn>}</div>
      <div className="space-y-3">{announcements.length===0&&<div className="bg-white rounded-xl p-12 text-center border border-[#8B1A1A]/08 shadow-sm"><Info size={32} className="mx-auto mb-3 text-[#1C1A17]/20"/><p className="text-sm text-[#1C1A17]/40">No announcements yet.</p></div>}{announcements.sort((a,b)=>b.date.localeCompare(a.date)).map(a=>(<div key={a.id} className={`rounded-xl p-4 border shadow-sm ${typeStyle[a.type]||typeStyle.info}`}><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3 flex-1"><div className="mt-0.5 flex-shrink-0">{(typeIcon as any)[a.type]||typeIcon.info}</div><div className="flex-1"><div className="flex items-center gap-2 flex-wrap mb-1"><h3 className="font-bold text-[#1C1A17]" style={{fontFamily:"var(--font-display)"}}>{a.title}</h3><span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-[#1C1A17]/60 border border-[#1C1A17]/10 uppercase">{a.type}</span><span className="text-[9px] text-[#1C1A17]/40 capitalize">{a.audience}</span></div><p className="text-sm text-[#1C1A17]/70" style={{fontFamily:"var(--font-body)"}}>{a.content}</p><p className="text-[10px] text-[#1C1A17]/40 mt-2" style={{fontFamily:"var(--font-mono)"}}>{fmtDate(a.date)} · {a.author}</p></div></div>{canAccess(user,"admin")&&<button onClick={()=>remove(a.id)} className="p-1.5 rounded hover:bg-red-100 text-red-400 flex-shrink-0"><Trash2 size={13}/></button>}</div></div>))}</div>
      {showM&&<Modal title="New Announcement" onClose={()=>setShowM(false)}><form onSubmit={save} className="space-y-3"><FI label="Title" value={form.title||""} onChange={v=>setForm(f=>({...f,title:v}))} required/><div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Content</label><textarea value={form.content||""} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={4} required className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none resize-none" style={{fontFamily:"var(--font-body)"}}/></div><div className="grid grid-cols-2 gap-3"><FS label="Type" value={form.type||"info"} onChange={v=>setForm(f=>({...f,type:v as any}))} options={["info","warning","urgent","success"]}/><FS label="Audience" value={form.audience||"all"} onChange={v=>setForm(f=>({...f,audience:v as any}))} options={["all","teachers","students","parents"]}/></div><div className="flex justify-end gap-2 pt-1"><Btn variant="secondary" onClick={()=>setShowM(false)}>Cancel</Btn><Btn type="submit"><Plus size={13}/>Post</Btn></div></form></Modal>}
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function UsersPage({appUsers=[],setAppUsers=()=>{},currentUser}:{appUsers:AppUser[];setAppUsers:(u:AppUser[])=>void;currentUser:AuthUser}){
  const [search,setSearch]=useState("");
  const [showM,setShowM]=useState(false);
  const [editing,setEditing]=useState<AppUser|null>(null);
  const [form,setForm]=useState<Partial<AppUser>&{pwInput?:string}>({});
  const filtered=appUsers.filter(u=>!search||u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));
  function openAdd(){setEditing(null);setForm({role:"teacher",isActive:true,pwInput:""});setShowM(true);}
  function openEdit(u:AppUser){setEditing(u);setForm({...u,pwInput:""});setShowM(true);}
  function save(e:React.FormEvent){e.preventDefault();if(editing){const u=appUsers.map(x=>x.id===editing.id?{...x,...form,passwordHash:form.pwInput?hashPw(form.pwInput):x.passwordHash}as AppUser:x);setAppUsers(u);dbSet("appUsers",u);}else{if(!form.pwInput){alert("Password required for new user.");return;}const n:AppUser={...form as AppUser,id:"u"+uid(),passwordHash:hashPw(form.pwInput!),createdAt:new Date().toISOString()};const u=[...appUsers,n];setAppUsers(u);dbSet("appUsers",u);}setShowM(false);}
  function toggleActive(id:string){const u=appUsers.map(x=>x.id===id?{...x,isActive:!x.isActive}:x);setAppUsers(u);dbSet("appUsers",u);}
  function remove(id:string){if(id===currentUser.id){alert("Cannot delete your own account.");return;}if(!confirm("Delete this user?"))return;const u=appUsers.filter(x=>x.id!==id);setAppUsers(u);dbSet("appUsers",u);}
  const ROLE_ORDER:Record<Role,number>={superadmin:0,admin:1,teacher:2};
  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>User Accounts</h1><p className="text-sm text-[#1C1A17]/50">{appUsers.length} accounts</p></div><Btn onClick={openAdd}><Plus size={15}/>Add User</Btn></div>
      <div className="relative max-w-xs"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1A17]/30"/><input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none" style={{fontFamily:"var(--font-body)"}}/></div>
      <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden"><table className="w-full text-sm" style={{fontFamily:"var(--font-body)"}}><thead><tr className="bg-[#FDF5F5] border-b border-[#8B1A1A]/08">{["User","Role","Status","Last Login","Actions"].map(h=><th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{h}</th>)}</tr></thead><tbody className="divide-y divide-[#8B1A1A]/05">{[...filtered].sort((a,b)=>ROLE_ORDER[a.role]-ROLE_ORDER[b.role]).map(u=>(<tr key={u.id} className={`hover:bg-[#FDF5F5]/60 ${u.id===currentUser.id?"bg-amber-50/30":""}`}><td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={u.name}/><div><p className="font-semibold text-[#1C1A17]">{u.name}{u.id===currentUser.id&&<span className="ml-1.5 text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">YOU</span>}</p><p className="text-[10px] text-[#1C1A17]/40">{u.email}</p></div></div></td><td className="px-4 py-3">{roleBadge(u.role)}</td><td className="px-4 py-3"><Bdg status={u.isActive?"active":"inactive"}/></td><td className="px-4 py-3 text-[10px] text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>{u.lastLogin?fmtDate(u.lastLogin):"Never"}</td><td className="px-4 py-3"><div className="flex gap-1"><button onClick={()=>openEdit(u)} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Edit2 size={12}/></button><button onClick={()=>toggleActive(u.id)} className={`p-1.5 rounded text-xs ${u.isActive?"hover:bg-amber-50 text-amber-600":"hover:bg-green-50 text-green-600"}`}>{u.isActive?"Deactivate":"Activate"}</button>{currentUser.role==="superadmin"&&u.id!==currentUser.id&&<button onClick={()=>remove(u.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={12}/></button>}</div></td></tr>))}</tbody></table></div>
      {showM&&<Modal title={editing?"Edit User":"Add User"} onClose={()=>setShowM(false)}><form onSubmit={save} className="space-y-3"><FI label="Full Name" value={form.name||""} onChange={v=>setForm(f=>({...f,name:v}))} required/><FI label="Email" value={form.email||""} onChange={v=>setForm(f=>({...f,email:v}))} type="email" required/><FS label="Role" value={form.role||"teacher"} onChange={v=>setForm(f=>({...f,role:v as Role}))} options={currentUser.role==="superadmin"?["superadmin","admin","teacher"]:["admin","teacher"]}/>{(!editing||form.pwInput)&&<><FI label={editing?"New Password (leave blank to keep)":"Password"} value={form.pwInput||""} onChange={v=>setForm(f=>({...f,pwInput:v}))} type="password" required={!editing}/><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive??true} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} className="w-4 h-4"/><span className="text-sm text-[#1C1A17]">Account Active</span></label></>}<div className="flex justify-end gap-2 pt-2"><Btn variant="secondary" onClick={()=>setShowM(false)}>Cancel</Btn><Btn type="submit">{editing?"Save Changes":"Add User"}</Btn></div></form></Modal>}
    </div>
  );
}
