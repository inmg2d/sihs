import React, { useState, useMemo } from "react";
import { Users, BookOpen, BarChart3, Calendar, Home, Plus, Search, Edit2, Trash2, ChevronRight, UserCheck, AlertTriangle, CheckCircle, Info, Eye, DollarSign, TrendingUp, Download, LayoutGrid, BookMarked, GraduationCap, Tag, ChevronDown, ChevronUp, ExternalLink, Layers, Save, Printer, FileText } from "lucide-react";
import { SCHOOL, P, Page, SectionId, Student, Teacher, ClassRoom, Subject, GradeRecord, AttRecord, Announcement, FeePayment, FeeStructure, CouncilRemark, ExamSequence, SECTION_META, SPECIALTIES, SUBJECT_CATS, ALL_SUBS, FORMS, TERMS, CAT_COLORS, dbGet, dbSet, uid, termAvg, totalMks, fmtDate, fmtCfa, inits, getSubjectCoef, exportClassesExcel, exportSubjectsExcel, Gender, computeStudentFees } from "../shared";
import { Avatar, Bdg, Btn, FI, FS, Modal, StatCard } from "../ui";

export function Dashboard({students,teachers,classes,subjects,attendance,announcements,payments,fees,setPage}:{students:Student[];teachers:Teacher[];classes:ClassRoom[];subjects:Subject[];attendance:AttRecord[];announcements:Announcement[];payments:FeePayment[];fees:FeeStructure[];setPage:(p:Page)=>void}){
  const today=new Date().toISOString().slice(0,10);
  const active=students.filter(s=>s.status==="active");
  const todayAtt=attendance.filter(a=>a.date===today);
  const totalExpected=active.reduce((s,st)=>{const f=fees.find(x=>x.year===SCHOOL.year);return s+(f?computeStudentFees(st,f).total:0);},0);
  const totalCollected=payments.filter(p=>p.year===SCHOOL.year).reduce((s,p)=>s+p.amount,0);
  const activeSubjects=subjects.filter(s=>s.isActive).length;
  const activeClasses=classes.filter(c=>c.isActive&&c.year===SCHOOL.year).length;
  const sectionStats=SECTION_META.map(sm=>({...sm,count:active.filter(s=>s.section===sm.id).length,classes:classes.filter(c=>c.section===sm.id&&c.isActive).length}));
  return(
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Dashboard</h1><p className="text-sm text-[#1C1A17]/50">{SCHOOL.full} — {SCHOOL.year}</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={active.length} icon={Users} color="crimson" sub={`${teachers.length} teaching staff`} onClick={()=>setPage("students")}/>
        <StatCard label="Classes / Forms" value={activeClasses} icon={LayoutGrid} color="gold" sub={`${activeSubjects} active subjects`} onClick={()=>setPage("classes")}/>
        <StatCard label="Present Today" value={todayAtt.filter(a=>a.status==="present").length||"—"} icon={UserCheck} color="teal" sub={todayAtt.length?`${todayAtt.length} marked today`:"No records yet"} onClick={()=>setPage("attendance")}/>
        <StatCard label="Fees Collected" value={`${Math.round(totalCollected/1000)}k`} icon={DollarSign} color="slate" sub={`of ${Math.round(totalExpected/1000)}k target`} onClick={()=>setPage("finance")}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Sections</h3><button onClick={()=>setPage("sections")} className="text-xs text-[#C8960C] hover:underline font-semibold">Details →</button></div>
          <div className="space-y-3">{sectionStats.map(sm=><div key={sm.id} className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:sm.color}}/><span className="text-xs font-semibold text-[#1C1A17]/70 flex-1">{sm.short}</span><span className="text-xs font-bold" style={{color:sm.color,fontFamily:"var(--font-mono)"}}>{sm.count} stu.</span><span className="text-[10px] text-[#1C1A17]/30" style={{fontFamily:"var(--font-mono)"}}>{sm.classes} cls</span></div>)}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Enrolment by Class</h3><button onClick={()=>setPage("classes")} className="text-xs text-[#C8960C] hover:underline font-semibold">View all →</button></div>
          <div className="space-y-2">{classes.filter(c=>c.isActive).map(c=>{const cnt=active.filter(s=>s.form===c.form).length;const pct=Math.round((cnt/c.capacity)*100);return(<div key={c.id} className="flex items-center gap-3"><span className="text-[10px] w-20 text-[#1C1A17]/60 truncate" style={{fontFamily:"var(--font-mono)"}}>{c.form}</span><div className="flex-1 h-2 rounded-full bg-[#F3E8E8] overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct}%`,background:P}}/></div><span className="text-[10px] font-bold text-[#1C1A17]/70 w-5 text-right" style={{fontFamily:"var(--font-mono)"}}>{cnt}</span></div>);})}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Subjects by Category</h3><button onClick={()=>setPage("subjects")} className="text-xs text-[#C8960C] hover:underline font-semibold">View all →</button></div>
          <div className="space-y-3">{SUBJECT_CATS.map(cat=>{const cnt=subjects.filter(s=>s.category===cat.id&&s.isActive).length;const total=cat.subs.length;return(<div key={cat.id} className="flex items-center gap-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${CAT_COLORS[cat.id]}`}>{cat.short}</span><div className="flex-1 h-1.5 rounded-full bg-[#F3E8E8] overflow-hidden"><div className="h-full rounded-full" style={{width:`${(cnt/total)*100}%`,background:P}}/></div><span className="text-[10px] font-bold" style={{fontFamily:"var(--font-mono)",color:P}}>{cnt}/{total}</span></div>);})}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Latest Notices</h3><button onClick={()=>setPage("announcements")} className="text-xs text-[#C8960C] hover:underline font-semibold">View all →</button></div>
          <div className="space-y-2.5">{announcements.slice(0,3).map(a=>{const ic={info:<Info size={12}/>,warning:<AlertTriangle size={12}/>,success:<CheckCircle size={12}/>};const cl={info:"text-blue-600 bg-blue-50 border-blue-100",warning:"text-amber-700 bg-amber-50 border-amber-100",success:"text-emerald-700 bg-emerald-50 border-emerald-100"};return(<div key={a.id} className={`flex gap-2 p-2.5 rounded-lg border ${cl[a.type]}`}><div className="mt-0.5 flex-shrink-0">{ic[a.type]}</div><div><p className="text-xs font-bold">{a.title}</p><p className="text-[10px] opacity-60 mt-0.5" style={{fontFamily:"var(--font-mono)"}}>{fmtDate(a.date)}</p></div></div>);})}</div>
        </div>
      </div>
    </div>
  );
}

export function SectionsPage({students,classes,subjects,grades,attendance,payments,fees,setPage,setFilterForm,setFilterSubject,setFilterSection,filterSpecialty,setFilterSpecialty}:{students:Student[];classes:ClassRoom[];subjects:Subject[];grades:GradeRecord[];attendance:AttRecord[];payments:FeePayment[];fees:FeeStructure[];setPage:(p:Page,sec?:SectionId|"",spec?:string)=>void;setFilterForm:(f:string)=>void;setFilterSubject:(s:string)=>void;setFilterSection:(s:SectionId|"")=>void;filterSpecialty:string;setFilterSpecialty:(s:string)=>void}){
  const [active,setActive]=useState<SectionId>("general");
  const sec=SECTION_META.find(s=>s.id===active)!;
  const secStudents=students.filter(s=>s.section===active&&s.status==="active");
  const secClasses=classes.filter(c=>c.section===active&&c.isActive);
  const secSubjects=subjects.filter(s=>s.sections.includes(active)&&s.isActive);
  const secGrades=grades.filter(g=>{const st=students.find(s=>s.id===g.studentId);return st&&st.section===active&&g.year===SCHOOL.year;});
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return d.toISOString().slice(0,10);});
  const secAtt=attendance.filter(a=>{const st=students.find(s=>s.id===a.studentId);return st&&st.section===active&&last7.includes(a.date);});
  const attRate=secAtt.length?Math.round((secAtt.filter(a=>a.status==="present").length/secAtt.length)*100):null;
  const avgs=secGrades.map(g=>termAvg(g)).filter((a):a is number=>a!==null);
  const secAvg=avgs.length>0?Math.round((avgs.reduce((a,b)=>a+b,0)/avgs.length)*10)/10:null;
  const passRate=avgs.length>0?Math.round((avgs.filter(a=>a>=10).length/avgs.length)*100):null;
  function totalFeeFor(s:Student){const f=fees.find(x=>x.year===SCHOOL.year);return f?computeStudentFees(s,f).total:0;}
  const totalExp=secStudents.reduce((t,s)=>t+totalFeeFor(s),0);
  const totalPaid=payments.filter(p=>{const st=students.find(s=>s.id===p.studentId);return st&&st.section===active&&p.year===SCHOOL.year;}).reduce((t,p)=>t+p.amount,0);
  const male=secStudents.filter(s=>s.gender==="M").length;
  const female=secStudents.filter(s=>s.gender==="F").length;
  const [sectionTab,setSectionTab]=useState<"overview"|"specialties">("overview");
  const [specDetail,setSpecDetail]=useState<string|null>(null);
  const secSpecialties=SPECIALTIES.filter(sp=>sp.section===active);
  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>School Sections</h1><p className="text-sm text-[#1C1A17]/50">Academic streams — General, Technical & Commercial · {SCHOOL.year}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SECTION_META.map(sm=>{
          const cnt=students.filter(s=>s.section===sm.id&&s.status==="active").length;
          const cls=classes.filter(c=>c.section===sm.id&&c.isActive).length;
          const specCount=SPECIALTIES.filter(sp=>sp.section===sm.id).length;
          const isActive=active===sm.id;
          return(
            <button key={sm.id} onClick={()=>{setActive(sm.id as SectionId);setSectionTab("overview");}} className={`text-left rounded-xl p-5 border-2 transition-all duration-150 shadow-sm ${isActive?"border-current shadow-md scale-[1.02]":"border-[#8B1A1A]/08 bg-white hover:border-[#8B1A1A]/20"}`} style={{borderColor:isActive?sm.color:undefined,background:isActive?sm.bg:"white"}}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:isActive?sm.color:"#F3E8E8"}}><Layers size={18} style={{color:isActive?"white":sm.color}}/></div>
                {isActive&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:sm.color,fontFamily:"var(--font-mono)"}}>ACTIVE</span>}
              </div>
              <p className="font-bold text-base" style={{color:sm.color,fontFamily:"var(--font-display)"}}>{sm.label}</p>
              <p className="text-xs text-[#1C1A17]/50 mt-0.5 mb-3 leading-snug">{sm.desc}</p>
              <div className="flex gap-3 flex-wrap">
                <span className="text-xs font-bold" style={{color:sm.color,fontFamily:"var(--font-mono)"}}>{cnt} students</span>
                <span className="text-xs text-[#1C1A17]/30">·</span>
                <span className="text-xs text-[#1C1A17]/50">{cls} classes</span>
                <span className="text-xs text-[#1C1A17]/30">·</span>
                <span className="text-xs text-[#1C1A17]/50">{specCount} specialties</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-1 border-b" style={{borderColor:sec.color+"33"}}>
        {(["overview","specialties"] as const).map(t=>(
          <button key={t} onClick={()=>setSectionTab(t)} className={`px-5 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors ${sectionTab===t?"border-current":"-mb-px border-transparent text-[#1C1A17]/40 hover:text-[#1C1A17]/70"}`} style={{color:sectionTab===t?sec.color:undefined,borderColor:sectionTab===t?sec.color:"transparent"}}>
            {t==="specialties"?`Specialties (${secSpecialties.length})`:t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {sectionTab==="overview"&&(
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {l:"Students",v:secStudents.length,sub:`${male}M / ${female}F`},
            {l:"Classes",v:secClasses.length,sub:"active this year"},
            {l:"Subjects",v:secSubjects.length,sub:"curriculum subjects"},
            {l:"Avg Grade",v:secAvg!=null?`${secAvg}/20`:"—",sub:passRate!=null?`${passRate}% passing`:"No grades yet"},
            {l:"Attendance",v:attRate!=null?`${attRate}%`:"—",sub:"last 7 days"},
          ].map(({l,v,sub})=>(
            <div key={l} className="bg-white rounded-xl p-4 border shadow-sm" style={{borderColor:sec.color+"22"}}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>{l}</p>
              <p className="text-2xl font-bold" style={{color:sec.color,fontFamily:"var(--font-display)"}}>{v}</p>
              <p className="text-[10px] text-[#1C1A17]/40 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-5 border shadow-sm" style={{borderColor:sec.color+"22"}}>
          <h3 className="text-sm font-bold mb-3" style={{color:sec.color,fontFamily:"var(--font-display)"}}>Fee Collection</h3>
          <div className="flex items-center gap-4 mb-2 flex-wrap"><span className="text-xs text-[#1C1A17]/50">Expected</span><span className="font-bold text-sm" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(totalExp)}</span><span className="text-xs text-[#1C1A17]/50 ml-4">Collected</span><span className="font-bold text-sm text-emerald-700" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(totalPaid)}</span><span className="text-xs text-[#1C1A17]/50 ml-4">Balance</span><span className="font-bold text-sm text-red-600" style={{fontFamily:"var(--font-mono)"}}>{fmtCfa(Math.max(totalExp-totalPaid,0))}</span></div>
          <div className="h-3 rounded-full overflow-hidden" style={{background:sec.color+"22"}}><div className="h-full rounded-full transition-all" style={{width:`${Math.min(totalExp>0?(totalPaid/totalExp)*100:0,100)}%`,background:sec.color}}/></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl p-5 border shadow-sm" style={{borderColor:sec.color+"22"}}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{color:sec.color,fontFamily:"var(--font-display)"}}>Classes ({secClasses.length})</h3>
              <button onClick={()=>{setFilterSection(active);setPage("classes");}} className="text-xs font-semibold hover:underline" style={{color:"#C8960C"}}>View all →</button>
            </div>
            <div className="space-y-2">{secClasses.length===0?<p className="text-xs text-[#1C1A17]/40 italic">No classes.</p>:secClasses.map(c=>{const enrolled=students.filter(s=>s.form===c.form&&s.section===c.section&&s.status==="active").length;return(<div key={c.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{background:sec.bg}}><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:sec.color}}/><span className="text-xs font-semibold text-[#1C1A17] flex-1">{c.name}</span><span className="text-[10px] font-bold" style={{color:sec.color,fontFamily:"var(--font-mono)"}}>{enrolled}/{c.capacity}</span><button onClick={()=>{setFilterForm(c.form);setPage("students");}} className="text-[10px] text-[#1C1A17]/30 hover:text-[#1C1A17]/70 ml-1"><ExternalLink size={10}/></button></div>);})}</div>
          </div>

          <div className="bg-white rounded-xl p-5 border shadow-sm" style={{borderColor:sec.color+"22"}}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{color:sec.color,fontFamily:"var(--font-display)"}}>Curriculum ({secSubjects.length})</h3>
              <button onClick={()=>setPage("subjects")} className="text-xs font-semibold hover:underline" style={{color:"#C8960C"}}>View all →</button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">{secSubjects.map(s=>(<div key={s.id} className="flex items-center gap-2"><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${CAT_COLORS[s.category]}`}>{s.code}</span><span className="text-xs text-[#1C1A17]/70 truncate">{s.name}</span><span className="ml-auto text-[10px] font-bold" style={{color:sec.color,fontFamily:"var(--font-mono)"}}>×{s.defaultCoef}</span></div>))}</div>
          </div>

          <div className="bg-white rounded-xl p-5 border shadow-sm" style={{borderColor:sec.color+"22"}}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{color:sec.color,fontFamily:"var(--font-display)"}}>Students ({secStudents.length})</h3>
              <button onClick={()=>{setFilterSection(active);setPage("students");}} className="text-xs font-semibold hover:underline" style={{color:"#C8960C"}}>View all →</button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">{secStudents.slice(0,10).map(s=>(<div key={s.id} className="flex items-center gap-2"><Avatar name={s.name} size="sm"/><span className="text-xs text-[#1C1A17] font-medium truncate">{s.name}</span><span className="ml-auto text-[10px] text-[#1C1A17]/40">{s.form}</span></div>))}{secStudents.length>10&&<p className="text-[10px] text-[#1C1A17]/30 italic text-center pt-1">+{secStudents.length-10} more</p>}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{l:"Specialties",action:()=>setSectionTab("specialties")},{l:"Grade Entry",action:()=>setPage("grades")},{l:"Attendance",action:()=>setPage("attendance")},{l:"Report Cards",action:()=>setPage("reportcard")},{l:"Finance",action:()=>setPage("finance")}].map(({l,action})=>(
            <button key={l} onClick={action} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors hover:opacity-90" style={{borderColor:sec.color,color:sec.color,background:sec.bg}}>
              <ExternalLink size={13}/>{l}
            </button>
          ))}
        </div>
      </div>
      )}

      {sectionTab==="specialties"&&(
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{color:sec.color,fontFamily:"var(--font-display)"}}>{sec.label} — Specialties</h2>
            <p className="text-xs text-[#1C1A17]/50 mt-0.5">Academic tracks within {sec.label} section. Click a specialty to see subjects and enrolled students.</p>
          </div>
        </div>

        {secSpecialties.length===0&&<p className="text-sm text-[#1C1A17]/40 italic">No specialties defined for this section.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {secSpecialties.map(sp=>{
            const spStudents=students.filter(s=>s.specialty===sp.id&&s.status==="active");
            const spSubjects=subjects.filter(s=>(s.specialties||[]).includes(sp.id)&&s.isActive);
            const spGrades=grades.filter(g=>{const st=students.find(s=>s.id===g.studentId);return st&&st.specialty===sp.id&&g.year===SCHOOL.year;});
            const avgsArr=spGrades.map(g=>termAvg(g)).filter((a):a is number=>a!==null);
            const spAvg=avgsArr.length>0?(avgsArr.reduce((a,b)=>a+b,0)/avgsArr.length):null;
            const isSelected=specDetail===sp.id;
            return(
              <div key={sp.id} className={`bg-white rounded-xl border-2 shadow-sm transition-all duration-150 ${isSelected?"shadow-lg scale-[1.01]":""}`} style={{borderColor:isSelected?sp.color:sp.color+"44"}}>
                <button className="w-full text-left p-5" onClick={()=>setSpecDetail(isSelected?null:sp.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{background:sp.color,fontFamily:"var(--font-mono)"}}>{sp.short.slice(0,2).toUpperCase()}</div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{color:sp.color,borderColor:sp.color+"44",fontFamily:"var(--font-mono)"}}>{spStudents.length} students</span>
                  </div>
                  <p className="font-bold text-sm mb-0.5" style={{color:sp.color,fontFamily:"var(--font-display)"}}>{sp.label}</p>
                  <p className="text-[10px] text-[#1C1A17]/50 mb-3">{sp.short} · {spSubjects.length} subjects</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:sp.color+"22"}}>
                      <div className="h-full rounded-full" style={{width:`${Math.min((spStudents.length/(secStudents.length||1))*100,100)}%`,background:sp.color}}/>
                    </div>
                    <span className="text-[10px] font-bold" style={{color:sp.color,fontFamily:"var(--font-mono)"}}>{spAvg!=null?`${spAvg.toFixed(1)}/20 avg`:"No grades"}</span>
                  </div>
                </button>

                {isSelected&&(
                <div className="border-t px-5 pb-5 pt-4 space-y-4" style={{borderColor:sp.color+"33"}}>
                  <div className="grid grid-cols-3 gap-2">
                    {[{l:"Students",v:spStudents.length},{l:"Subjects",v:spSubjects.length},{l:"Avg",v:spAvg!=null?`${spAvg.toFixed(1)}`:"—"}].map(({l,v})=>(
                      <div key={l} className="rounded-lg p-2.5 text-center" style={{background:sp.color+"11"}}>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5 text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>{l}</p>
                        <p className="text-lg font-bold" style={{color:sp.color,fontFamily:"var(--font-display)"}}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>Subjects</p>
                      <button onClick={()=>setPage("subjects","",sp.id)} className="text-[10px] font-semibold hover:underline" style={{color:"#C8960C"}}>Manage →</button>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {spSubjects.length===0?<p className="text-[10px] text-[#1C1A17]/30 italic">No subjects assigned.</p>:spSubjects.map(s=>(
                        <div key={s.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{background:sp.color+"08"}}>
                          <span className={`text-[8px] px-1 py-0.5 rounded font-bold border ${CAT_COLORS[s.category]}`}>{s.code}</span>
                          <span className="text-xs text-[#1C1A17]/70 flex-1 truncate">{s.name}</span>
                          <span className="text-[10px] font-bold" style={{color:sp.color,fontFamily:"var(--font-mono)"}}>×{s.defaultCoef}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>Enrolled Students</p>
                      <button onClick={()=>setPage("students",active,sp.id)} className="text-[10px] font-semibold hover:underline" style={{color:"#C8960C"}}>View all →</button>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {spStudents.length===0?<p className="text-[10px] text-[#1C1A17]/30 italic">No students enrolled.</p>:spStudents.slice(0,6).map(s=>(
                        <div key={s.id} className="flex items-center gap-2 px-2 py-1 rounded" style={{background:sp.color+"08"}}>
                          <Avatar name={s.name} size="sm"/>
                          <span className="text-xs text-[#1C1A17] flex-1 truncate">{s.name}</span>
                          <span className="text-[10px] text-[#1C1A17]/40">{s.form}</span>
                        </div>
                      ))}
                      {spStudents.length>6&&<p className="text-[10px] text-[#1C1A17]/30 italic text-center">+{spStudents.length-6} more</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[{l:"Grades",action:()=>setPage("grades",active,sp.id)},{l:"Attendance",action:()=>setPage("attendance",active,sp.id)},{l:"Report Cards",action:()=>setPage("reportcard")}].map(({l,action})=>(
                      <button key={l} onClick={action} className="text-[10px] font-semibold px-2.5 py-1 rounded border transition-colors hover:opacity-80" style={{borderColor:sp.color,color:sp.color,background:sp.color+"10"}}>{l} →</button>
                    ))}
                  </div>
                </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl p-5 border shadow-sm" style={{borderColor:sec.color+"22"}}>
          <h3 className="text-sm font-bold mb-4" style={{color:sec.color,fontFamily:"var(--font-display)"}}>Enrollment by Specialty</h3>
          <div className="space-y-2.5">
            {secSpecialties.map(sp=>{
              const cnt=students.filter(s=>s.specialty===sp.id&&s.status==="active").length;
              const pct=secStudents.length>0?Math.round((cnt/secStudents.length)*100):0;
              return(
                <div key={sp.id} className="flex items-center gap-3">
                  <span className="text-xs text-[#1C1A17]/60 w-28 shrink-0 truncate">{sp.short}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{background:sp.color+"22"}}>
                    <div className="h-full rounded-full transition-all duration-300" style={{width:`${pct}%`,background:sp.color}}/>
                  </div>
                  <span className="text-[10px] font-bold w-8 text-right" style={{color:sp.color,fontFamily:"var(--font-mono)"}}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export function ClassesPage({classes,setClasses,students,teachers,grades,attendance,setPage,setFilterForm,initSection}:{classes:ClassRoom[];setClasses:(c:ClassRoom[])=>void;students:Student[];teachers:Teacher[];grades:GradeRecord[];attendance:AttRecord[];setPage:(p:Page)=>void;setFilterForm:(f:string)=>void;initSection?:SectionId|""}){
  const [sectionFilter,setSectionFilter]=useState<""|SectionId>(initSection||"");
  const [showM,setShowM]=useState(false);
  const [editing,setEditing]=useState<ClassRoom|null>(null);
  const [form,setForm]=useState<Partial<ClassRoom>>({});
  const [view,setView]=useState<ClassRoom|null>(null);

  function openAdd(){setEditing(null);setForm({year:SCHOOL.year,isActive:true,capacity:40,section:"general"});setShowM(true);}
  function openEdit(c:ClassRoom){setEditing(c);setForm({...c});setShowM(true);}
  function save(e:React.FormEvent){
    e.preventDefault();
    if(editing){const u=classes.map(c=>c.id===editing.id?{...c,...form}as ClassRoom:c);setClasses(u);dbSet("classes",u);}
    else{const n:ClassRoom={...form as ClassRoom,id:"cls"+uid()};const u=[...classes,n];setClasses(u);dbSet("classes",u);}
    setShowM(false);
  }
  function remove(id:string){if(!confirm("Delete this class?"))return;const u=classes.filter(c=>c.id!==id);setClasses(u);dbSet("classes",u);}

  const filteredClasses=sectionFilter?classes.filter(c=>c.section===sectionFilter):classes;

  function classStats(c:ClassRoom){
    const cls=students.filter(s=>s.form===c.form&&s.section===c.section&&s.status==="active");
    const attDates=[...new Set(attendance.filter(a=>a.form===c.form).map(a=>a.date))];
    const lastAtt=attDates.length>0?attDates.sort().slice(-1)[0]:null;
    const lastAttRec=lastAtt?attendance.filter(a=>a.form===c.form&&a.date===lastAtt):[];
    const presentPct=lastAttRec.length>0?Math.round((lastAttRec.filter(a=>a.status==="present").length/lastAttRec.length)*100):null;
    const gs=grades.filter(g=>g.form===c.form&&g.year===SCHOOL.year);
    let tot=0,cnt=0;gs.forEach(g=>{const a=termAvg(g);if(a!=null){tot+=a;cnt++;}});
    const classAvg=cnt>0?Math.round((tot/cnt)*10)/10:null;
    return{enrolled:cls.length,male:cls.filter(s=>s.gender==="M").length,female:cls.filter(s=>s.gender==="F").length,presentPct,classAvg,repeaters:cls.filter(s=>s.repeater).length};
  }

  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Classes & Forms</h1><p className="text-sm text-[#1C1A17]/50">{classes.filter(c=>c.isActive).length} active classes · {SCHOOL.year}</p></div>
        <div className="flex gap-2"><Btn variant="secondary" onClick={()=>exportClassesExcel(classes,students,teachers)}><Download size={13}/>Export Excel</Btn><Btn onClick={openAdd}><Plus size={15}/>Add Class</Btn></div>
      </div>
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-[#8B1A1A]/08 w-fit">
        {[{id:"" as const,l:"All Sections"},...SECTION_META.map(s=>({id:s.id as SectionId,l:s.short}))].map(({id,l})=>(
          <button key={id} onClick={()=>setSectionFilter(id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{background:sectionFilter===id?P:"",color:sectionFilter===id?"white":"#1C1A17"}}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredClasses.map(c=>{
          const t=teachers.find(x=>x.id===c.formTeacherId);
          const st=classStats(c);
          return(
            <div key={c.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${c.isActive?"border-[#8B1A1A]/10":"border-gray-200 opacity-70"}`}>
              <div className="px-5 py-3 flex items-center justify-between" style={{background:c.isActive?P:"#9ca3af"}}>
                <div><p className="text-white font-bold" style={{fontFamily:"var(--font-display)"}}>{c.name}</p><div className="flex items-center gap-2 mt-0.5"><p className="text-white/60 text-xs" style={{fontFamily:"var(--font-mono)"}}>{c.room} · {c.year}</p><span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white/90" style={{background:"rgba(255,255,255,0.15)",fontFamily:"var(--font-mono)"}}>{SECTION_META.find(s=>s.id===c.section)?.short||c.section}</span></div></div>
                <div className="flex gap-1">
                  <button onClick={()=>setView(c)} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"><Eye size={13}/></button>
                  <button onClick={()=>openEdit(c)} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"><Edit2 size={13}/></button>
                  <button onClick={()=>remove(c.id)} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"><Trash2 size={13}/></button>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[{l:"Enrolled",v:st.enrolled},{l:"Capacity",v:c.capacity},{l:"Repeaters",v:st.repeaters}].map(({l,v})=>(
                    <div key={l} className="bg-[#FDF5F5] rounded-lg p-2"><p className="text-lg font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>{v}</p><p className="text-[10px] text-[#1C1A17]/50">{l}</p></div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#1C1A17]/60">
                  <span className="font-semibold" style={{fontFamily:"var(--font-mono)"}}>{st.male}M / {st.female}F</span>
                  {st.presentPct!=null&&<span className="ml-auto font-semibold text-emerald-700">Att: {st.presentPct}%</span>}
                  {st.classAvg!=null&&<span className="font-semibold" style={{color:P}}>Avg: {st.classAvg}</span>}
                </div>
                <div className="flex items-center gap-2.5 pt-1 border-t border-[#8B1A1A]/06">
                  <Avatar name={t?.name||"?"} size="sm"/><div><p className="text-xs font-semibold text-[#1C1A17]">{t?.name||"No form teacher"}</p><p className="text-[10px] text-[#1C1A17]/40">Form Teacher</p></div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[{l:"Students",p:"students" as Page},{l:"Attendance",p:"attendance" as Page},{l:"Grades",p:"grades" as Page}].map(({l,p})=>(
                    <button key={l} onClick={()=>{setFilterForm(c.form);setPage(p);}} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border border-[#8B1A1A]/15 text-[#8B1A1A] hover:bg-[#F3E8E8] transition-colors"><ExternalLink size={9}/>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {view&&(()=>{
        const t=teachers.find(x=>x.id===view.formTeacherId);
        const st=classStats(view);
        const classStudents=students.filter(s=>s.form===view.form&&s.status==="active");
        return(<Modal title={`${view.name} — Class Detail`} onClose={()=>setView(null)} wide>
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{l:"Enrolled",v:st.enrolled},{l:"Capacity",v:view.capacity},{l:"Male",v:st.male},{l:"Female",v:st.female},{l:"Repeaters",v:st.repeaters},{l:"Avg Attendance",v:st.presentPct!=null?`${st.presentPct}%`:"—"},{l:"Class Average",v:st.classAvg??("—" as any)},{l:"Room",v:view.room}].map(({l,v})=><div key={l} className="bg-[#FDF5F5] rounded-lg p-3 text-center"><p className="text-sm font-bold" style={{color:P}}>{v}</p><p className="text-[10px] text-[#1C1A17]/50">{l}</p></div>)}</div>
            <div className="flex items-center gap-3 p-3 bg-[#FDF5F5] rounded-lg border border-[#8B1A1A]/10"><Avatar name={t?.name||"?"}/><div><p className="font-bold text-sm" style={{color:P}}>{t?.name||"No form teacher assigned"}</p><p className="text-xs text-[#1C1A17]/50">{t?.email||""}</p></div></div>
            <div><h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:P,fontFamily:"var(--font-mono)"}}>Student Roster ({classStudents.length})</h4><div className="space-y-1 max-h-48 overflow-y-auto">{classStudents.map(s=><div key={s.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#FAFAFA] border border-[#8B1A1A]/05"><Avatar name={s.name} size="sm"/><span className="text-sm font-medium text-[#1C1A17]">{s.name}</span><span className="ml-auto text-xs text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>{s.studentId}</span></div>)}</div></div>
          </div>
        </Modal>);
      })()}

      {showM&&(<Modal title={editing?"Edit Class":"Add New Class"} onClose={()=>setShowM(false)}>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FI label="Class Name" value={form.name||""} onChange={v=>setForm(f=>({...f,name:v}))} required placeholder="e.g. Form 1A"/>
            <FS label="Form / Level" value={form.form||""} onChange={v=>setForm(f=>({...f,form:v}))} options={FORMS} required/>
          </div>
          <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1.5" style={{fontFamily:"var(--font-mono)"}}>Section / Stream</label><div className="flex gap-2">{SECTION_META.map(sm=><button key={sm.id} type="button" onClick={()=>setForm(f=>({...f,section:sm.id as SectionId}))} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all" style={{borderColor:form.section===sm.id?sm.color:"#e5e7eb",background:form.section===sm.id?sm.bg:"white",color:form.section===sm.id?sm.color:"#6b7280"}}>{sm.short}</button>)}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <FI label="Room" value={form.room||""} onChange={v=>setForm(f=>({...f,room:v}))} placeholder="e.g. Room 101"/>
            <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Capacity</label><input type="number" min={1} value={form.capacity||""} onChange={e=>setForm(f=>({...f,capacity:Number(e.target.value)}))} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none" style={{fontFamily:"var(--font-mono)"}}/></div>
          </div>
          <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Form Teacher</label><select value={form.formTeacherId||""} onChange={e=>setForm(f=>({...f,formTeacherId:e.target.value}))} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none" style={{fontFamily:"var(--font-body)"}}><option value="">— Select teacher —</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <FS label="Academic Year" value={form.year||SCHOOL.year} onChange={v=>setForm(f=>({...f,year:v}))} options={[SCHOOL.year,"2024/25","2026/27"]}/>
            <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={form.isActive??true} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} id="cls-active" className="w-4 h-4 rounded"/><label htmlFor="cls-active" className="text-sm font-medium text-[#1C1A17]">Active Class</label></div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Btn variant="secondary" onClick={()=>setShowM(false)}>Cancel</Btn><Btn type="submit"><Save size={13}/>{editing?"Save Changes":"Add Class"}</Btn></div>
        </form>
      </Modal>)}
    </div>
  );
}

export function SubjectsPage({subjects,setSubjects,teachers,students,grades,setPage,setFilterSubject,filterSpecialty,setFilterSpecialty}:{subjects:Subject[];setSubjects:(s:Subject[])=>void;teachers:Teacher[];students:Student[];grades:GradeRecord[];setPage:(p:Page)=>void;setFilterSubject:(s:string)=>void;filterSpecialty:string;setFilterSpecialty:(s:string)=>void}){
  const [search,setSearch]=useState("");
  const [catFilter,setCatFilter]=useState("");
  const [secFilter,setSecFilter]=useState<""|SectionId>("");
  const [showM,setShowM]=useState(false);
  const [editing,setEditing]=useState<Subject|null>(null);
  const [form,setForm]=useState<Partial<Subject>>({});
  const [expandedCoefs,setExpandedCoefs]=useState(false);
  const [view,setView]=useState<Subject|null>(null);

  const filtered=useMemo(()=>subjects.filter(s=>{const q=search.toLowerCase();return(!q||s.name.toLowerCase().includes(q)||s.code.toLowerCase().includes(q))&&(!catFilter||s.category===catFilter)&&(!secFilter||s.sections.includes(secFilter))&&(!filterSpecialty||(s.specialties||[]).includes(filterSpecialty));}),[subjects,search,catFilter,secFilter,filterSpecialty]);

  function openAdd(){setEditing(null);setForm({category:"lang",defaultCoef:2,formCoefs:Object.fromEntries(FORMS.map(f=>[f,2])),isActive:true,teacherId:"",sections:["general","technical","commercial"],specialties:[]});setShowM(true);}
  function openEdit(s:Subject){setEditing(s);setForm({...s,formCoefs:{...s.formCoefs}});setShowM(true);}
  function save(e:React.FormEvent){
    e.preventDefault();
    if(editing){const u=subjects.map(s=>s.id===editing.id?{...s,...form}as Subject:s);setSubjects(u);dbSet("subjects",u);}
    else{const n:Subject={...form as Subject,id:"sub"+uid()};const u=[...subjects,n];setSubjects(u);dbSet("subjects",u);}
    setShowM(false);
  }
  function toggleActive(id:string){const u=subjects.map(s=>s.id===id?{...s,isActive:!s.isActive}:s);setSubjects(u);dbSet("subjects",u);}
  function remove(id:string){if(!confirm("Delete this subject? This will not delete existing grades."))return;const u=subjects.filter(s=>s.id!==id);setSubjects(u);dbSet("subjects",u);}

  function subjectStats(s:Subject){
    const gs=grades.filter(g=>g.subject===s.name&&g.year===SCHOOL.year);
    const avgs=gs.map(g=>termAvg(g)).filter((a):a is number=>a!==null);
    const avg=avgs.length>0?Math.round((avgs.reduce((a,b)=>a+b,0)/avgs.length)*10)/10:null;
    const pass=avgs.filter(a=>a>=10).length;
    return{gradeCount:gs.length,avg,passRate:avgs.length>0?Math.round((pass/avgs.length)*100):null};
  }

  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Subjects</h1><p className="text-sm text-[#1C1A17]/50">{subjects.filter(s=>s.isActive).length} active · {subjects.filter(s=>!s.isActive).length} inactive · {subjects.length} total</p></div>
        <div className="flex gap-2"><Btn variant="secondary" onClick={()=>exportSubjectsExcel(subjects,teachers)}><Download size={13}/>Export Excel</Btn><Btn onClick={openAdd}><Plus size={15}/>Add Subject</Btn></div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1A17]/40"/><input placeholder="Search subject name or code…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none" style={{fontFamily:"var(--font-body)"}}/></div>
        <div className="flex gap-1 bg-white rounded-lg border border-[#8B1A1A]/10 p-1">
          {[{id:"" as const,l:"All Sections"},...SECTION_META.map(s=>({id:s.id as SectionId,l:s.short}))].map(({id,l})=>(
            <button key={id} onClick={()=>setSecFilter(id)} className="px-3 py-1.5 rounded text-xs font-semibold transition-all" style={{background:secFilter===id?P:"",color:secFilter===id?"white":"#6b7280"}}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-white rounded-lg border border-[#8B1A1A]/10 p-1">
          {[{id:"",l:"All"},...SUBJECT_CATS.map(c=>({id:c.id,l:c.short}))].map(({id,l})=>(
            <button key={id} onClick={()=>setCatFilter(id)} className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${catFilter===id?"text-white":"text-[#1C1A17]/50 hover:text-[#8B1A1A]"}`} style={{background:catFilter===id?P:""}}>{l}</button>
          ))}
        </div>
        <select value={filterSpecialty} onChange={e=>setFilterSpecialty(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none text-[#1C1A17]"><option value="">All Specialties</option>{SPECIALTIES.map(sp=><option key={sp.id} value={sp.id}>{sp.short}</option>)}</select>
      </div>

      {SUBJECT_CATS.filter(cat=>!catFilter||cat.id===catFilter).map(cat=>{
        const catSubs=filtered.filter(s=>s.category===cat.id);
        if(catSubs.length===0)return null;
        return(
          <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-3 border-b border-[#8B1A1A]/08" style={{background:"#FDF5F5"}}>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${CAT_COLORS[cat.id]}`}>{cat.label}</span>
              <span className="text-xs text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>{catSubs.length} subjects</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{fontFamily:"var(--font-body)"}}>
                <thead><tr className="bg-[#F9F3F3] border-b border-[#8B1A1A]/06">{["Code","Subject","Sections","Default Coef","Assigned Teacher","Grades Recorded","Pass Rate","Status",""].map(h=><th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-[#8B1A1A]/05">
                  {catSubs.map(s=>{
                    const t=teachers.find(x=>x.id===s.teacherId);
                    const st=subjectStats(s);
                    return(<tr key={s.id} className="hover:bg-[#FDF5F5]/60 transition-colors">
                      <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded" style={{background:"#F3E8E8",color:P,fontFamily:"var(--font-mono)"}}>{s.code}</span></td>
                      <td className="px-4 py-3"><p className="font-semibold text-[#1C1A17]">{s.name}</p></td>
                      <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{(s.sections||[]).map(sid=>{const sm=SECTION_META.find(x=>x.id===sid);return sm?<span key={sid} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border" style={{color:sm.color,background:sm.bg,borderColor:sm.color+"33",fontFamily:"var(--font-mono)"}}>{sm.short}</span>:null;})}</div></td>
                      <td className="px-4 py-3 text-center"><span className="text-sm font-bold" style={{color:P,fontFamily:"var(--font-mono)"}}>{s.defaultCoef}</span></td>
                      <td className="px-4 py-3">{t?<div className="flex items-center gap-2"><Avatar name={t.name} size="sm"/><span className="text-xs text-[#1C1A17]/70">{t.name}</span></div>:<span className="text-xs text-[#1C1A17]/30 italic">Unassigned</span>}</td>
                      <td className="px-4 py-3 text-center"><span className="text-sm font-bold text-[#1C1A17]/70" style={{fontFamily:"var(--font-mono)"}}>{st.gradeCount}</span></td>
                      <td className="px-4 py-3 text-center">{st.passRate!=null?<span className={`text-xs font-bold ${st.passRate>=50?"text-emerald-700":"text-red-600"}`} style={{fontFamily:"var(--font-mono)"}}>{st.passRate}%</span>:<span className="text-xs text-[#1C1A17]/30">—</span>}</td>
                      <td className="px-4 py-3"><Bdg status={s.isActive?"active":"inactive"}/></td>
                      <td className="px-4 py-3"><div className="flex gap-1">
                        <button onClick={()=>setView(s)} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Eye size={12}/></button>
                        <button onClick={()=>openEdit(s)} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Edit2 size={12}/></button>
                        <button onClick={()=>toggleActive(s.id)} className={`p-1.5 rounded text-xs font-bold ${s.isActive?"hover:bg-amber-50 text-amber-600":"hover:bg-emerald-50 text-emerald-600"}`}>{s.isActive?"✕":"✓"}</button>
                        <button onClick={()=>remove(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={12}/></button>
                      </div></td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {view&&(()=>{
        const t=teachers.find(x=>x.id===view.teacherId);
        const st=subjectStats(view);
        const cat=SUBJECT_CATS.find(c=>c.id===view.category);
        const classBreakdown=FORMS.map(f=>{const gs=grades.filter(g=>g.subject===view.name&&g.form===f&&g.year===SCHOOL.year);const avgs=gs.map(g=>termAvg(g)).filter((a):a is number=>a!==null);return{form:f,count:gs.length,avg:avgs.length>0?Math.round((avgs.reduce((a,b)=>a+b,0)/avgs.length)*10)/10:null,coef:view.formCoefs[f]??view.defaultCoef};}).filter(x=>x.count>0);
        return(<Modal title={`Subject Detail — ${view.name}`} onClose={()=>setView(null)} wide>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{background:P}}><Tag size={24} className="text-white"/></div>
              <div><h3 className="font-bold text-xl" style={{color:P,fontFamily:"var(--font-display)"}}>{view.name}</h3><p className="text-xs text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{view.code} · {cat?.label}</p><Bdg status={view.isActive?"active":"inactive"}/></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{l:"Default Coef",v:view.defaultCoef},{l:"Grade Records",v:st.gradeCount},{l:"Pass Rate",v:st.passRate!=null?st.passRate+"%":"—"},{l:"Avg Score",v:st.avg??("—" as any)}].map(({l,v})=><div key={l} className="bg-[#FDF5F5] rounded-lg p-3 text-center"><p className="text-lg font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>{v}</p><p className="text-[10px] text-[#1C1A17]/50">{l}</p></div>)}</div>
            {t&&<div className="flex items-center gap-3 p-3 bg-[#FDF5F5] rounded-lg border border-[#8B1A1A]/10"><Avatar name={t.name}/><div><p className="font-bold" style={{color:P}}>{t.name}</p><p className="text-xs text-[#1C1A17]/50">{t.email}</p></div></div>}
            {classBreakdown.length>0&&<div><h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:P,fontFamily:"var(--font-mono)"}}>Performance by Class</h4><div className="space-y-1.5">{classBreakdown.map(cb=><div key={cb.form} className="flex items-center gap-3 px-3 py-2 bg-[#FAFAFA] rounded-lg border border-[#8B1A1A]/05"><span className="text-xs font-semibold text-[#1C1A17]/70 w-24">{cb.form}</span><div className="flex-1 h-1.5 rounded-full bg-[#F3E8E8]"><div className="h-full rounded-full" style={{width:`${((cb.avg??0)/20)*100}%`,background:P}}/></div><span className="text-xs font-bold w-10 text-right" style={{color:P,fontFamily:"var(--font-mono)"}}>{cb.avg??("—" as any)}/20</span><span className="text-[10px] text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>Coef {cb.coef}</span></div>)}</div></div>}
            <div><h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:P,fontFamily:"var(--font-mono)"}}>Coefficient Per Form</h4><div className="grid grid-cols-4 gap-2">{FORMS.map(f=><div key={f} className="text-center bg-[#F9F3F3] rounded-lg p-2"><p className="font-bold" style={{color:P,fontFamily:"var(--font-mono)"}}>{view.formCoefs[f]??view.defaultCoef}</p><p className="text-[10px] text-[#1C1A17]/40">{f}</p></div>)}</div></div>
            <div className="flex gap-2"><button onClick={()=>{setFilterSubject(view.name);setView(null);setPage("grades");}} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#8B1A1A]/15 hover:bg-[#F3E8E8]" style={{color:P}}><ExternalLink size={12}/>View in Grade Entry</button></div>
          </div>
        </Modal>);
      })()}

      {showM&&(<Modal title={editing?"Edit Subject":"Add New Subject"} onClose={()=>setShowM(false)}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FI label="Subject Name" value={form.name||""} onChange={v=>setForm(f=>({...f,name:v}))} required placeholder="e.g. Mathematics"/>
            <FI label="Code" value={form.code||""} onChange={v=>setForm(f=>({...f,code:v.toUpperCase()}))} required placeholder="e.g. MATH"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FS label="Category" value={form.category||""} onChange={v=>setForm(f=>({...f,category:v as any}))} options={SUBJECT_CATS.map(c=>c.id)} required/>
            <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Default Coefficient</label><input type="number" min={1} max={10} value={form.defaultCoef||""} onChange={e=>{const v=Number(e.target.value);setForm(f=>({...f,defaultCoef:v,formCoefs:Object.fromEntries(FORMS.map(fm=>[fm,f?.formCoefs?.[fm]??v]))}));}} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none" style={{fontFamily:"var(--font-mono)"}}/></div>
          </div>
          <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Assigned Teacher</label><select value={form.teacherId||""} onChange={e=>setForm(f=>({...f,teacherId:e.target.value}))} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none" style={{fontFamily:"var(--font-body)"}}><option value="">— Unassigned —</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1.5" style={{fontFamily:"var(--font-mono)"}}>Available in Sections</label><div className="flex gap-2">{SECTION_META.map(sm=>{const on=(form.sections||[]).includes(sm.id as SectionId);return(<button key={sm.id} type="button" onClick={()=>setForm(f=>{const cur=f.sections||[];const n=on?cur.filter(x=>x!==sm.id):[...cur,sm.id as SectionId];return{...f,sections:n};})} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all" style={{borderColor:on?sm.color:"#e5e7eb",background:on?sm.bg:"white",color:on?sm.color:"#9ca3af"}}>{on?"✓ ":""}{sm.short}</button>);})}</div></div>
          <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1.5" style={{fontFamily:"var(--font-mono)"}}>Applicable Specialties</label><div className="flex flex-wrap gap-1.5">{SPECIALTIES.map(sp=>{const on=((form.specialties)||[]).includes(sp.id);return(<button key={sp.id} type="button" onClick={()=>setForm(f=>{const cur=f.specialties||[];const n=on?cur.filter(x=>x!==sp.id):[...cur,sp.id];return{...f,specialties:n};})} className="py-1 px-2.5 rounded-lg text-[10px] font-bold border-2 transition-all" style={{borderColor:on?sp.color:"#e5e7eb",background:on?sp.color+"18":"white",color:on?sp.color:"#9ca3af"}}>{on?"✓ ":""}{sp.short}</button>);})}</div></div>
          <div>
            <button type="button" onClick={()=>setExpandedCoefs(!expandedCoefs)} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-2" style={{color:P,fontFamily:"var(--font-mono)"}}>{expandedCoefs?<ChevronUp size={13}/>:<ChevronDown size={13}/>}Per-Form Coefficient Overrides</button>
            {expandedCoefs&&<div className="grid grid-cols-2 gap-2">{FORMS.map(f=><div key={f}><label className="block text-[10px] font-semibold text-[#1C1A17]/50 mb-0.5" style={{fontFamily:"var(--font-mono)"}}>{f}</label><input type="number" min={0} max={10} value={form.formCoefs?.[f]??form.defaultCoef??2} onChange={e=>setForm(x=>({...x,formCoefs:{...x.formCoefs,[f]:Number(e.target.value)}}))} className="w-full px-2 py-1.5 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none text-center" style={{fontFamily:"var(--font-mono)"}}/></div>)}</div>}
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={form.isActive??true} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} id="sub-active" className="w-4 h-4 rounded"/><label htmlFor="sub-active" className="text-sm font-medium text-[#1C1A17]">Active Subject</label></div>
          <div className="flex justify-end gap-2 pt-1"><Btn variant="secondary" onClick={()=>setShowM(false)}>Cancel</Btn><Btn type="submit"><Save size={13}/>{editing?"Save Changes":"Add Subject"}</Btn></div>
        </form>
      </Modal>)}
    </div>
  );
}

export function StudentsPage({students,setStudents,classes,filterForm,setFilterForm,filterSection,setFilterSection,filterSpecialty,setFilterSpecialty}:{students:Student[];setStudents:(s:Student[])=>void;classes:ClassRoom[];filterForm:string;setFilterForm:(f:string)=>void;filterSection:SectionId|"";setFilterSection:(s:SectionId|"")=>void;filterSpecialty:string;setFilterSpecialty:(s:string)=>void}){
  const [search,setSearch]=useState("");
  const [fs,setFs]=useState("");
  const [showM,setShowM]=useState(false);
  const [editing,setEditing]=useState<Student|null>(null);
  const [view,setView]=useState<Student|null>(null);
  const [tab,setTab]=useState<"list"|"idcards">("list");
  const [idCardStudent,setIdCardStudent]=useState<Student|null>(null);
  const [form,setForm]=useState<Partial<Student>>({});
  const filtered=useMemo(()=>students.filter(s=>{const q=search.toLowerCase();return(!q||s.name.toLowerCase().includes(q)||s.studentId.toLowerCase().includes(q)||s.parentName?.toLowerCase().includes(q))&&(!filterForm||s.form===filterForm)&&(!filterSection||s.section===filterSection)&&(!filterSpecialty||s.specialty===filterSpecialty)&&(!fs||s.status===fs);}),[students,search,filterForm,filterSection,filterSpecialty,fs]);
  function openAdd(){setEditing(null);setForm({status:"active",gender:"M",repeater:false,section:"general"});setShowM(true);}
  function openEdit(s:Student){setEditing(s);setForm({...s});setShowM(true);}
  function save(e:React.FormEvent){e.preventDefault();if(editing){const u=students.map(s=>s.id===editing.id?{...s,...form}as Student:s);setStudents(u);dbSet("students",u);}else{const n:Student={...form as Student,id:"s"+uid(),studentId:`SIHS/${new Date().getFullYear()}/${String(students.length+1).padStart(3,"0")}`,enrolledDate:new Date().toISOString().slice(0,10)};const u=[...students,n];setStudents(u);dbSet("students",u);}setShowM(false);}
  function remove(id:string){if(!confirm("Delete student?"))return;const u=students.filter(s=>s.id!==id);setStudents(u);dbSet("students",u);}
  function handlePhotoUpload(file:File,cb:(dataUrl:string)=>void){const reader=new FileReader();reader.onload=e=>{if(e.target?.result)cb(e.target.result as string);};reader.readAsDataURL(file);}
  function idCardHtml(s:Student):string{
    const spec=SPECIALTIES.find(sp=>sp.id===s.specialty);
    const sec=SECTION_META.find(x=>x.id===s.section);
    const color=spec?.color||P;
    const photoHtml=s.photo?`<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`:
      `<div style="width:100%;height:100%;background:${color};display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;color:white;border-radius:50%">${s.name.charAt(0)}</div>`;
    return`<div style="width:85mm;min-height:54mm;background:white;border-radius:12px;overflow:hidden;font-family:Arial,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,0.15);display:inline-block;margin:4px">
      <div style="background:${P};padding:8px 12px;display:flex;align-items:center;gap:8px">
        <div style="font-size:18px;font-weight:900;color:#C8960C;letter-spacing:2px">SIHS</div>
        <div style="flex:1"><div style="color:white;font-size:7.5px;font-weight:bold;letter-spacing:0.5px">SAINT ISIDORE HIGH SCHOOL NDOP</div><div style="color:#C8960C;font-size:6.5px">${SCHOOL.address}</div></div>
        <div style="width:4px;border-radius:2px;align-self:stretch;background:${color}"></div>
      </div>
      <div style="display:flex;padding:10px 12px;gap:12px;align-items:flex-start">
        <div style="width:60px;height:60px;border-radius:50%;border:3px solid ${color};overflow:hidden;flex-shrink:0">${photoHtml}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:bold;font-size:11px;color:#1C1A17;margin-bottom:2px;line-height:1.2">${s.name}</div>
          <div style="font-size:8px;color:${P};font-weight:bold;margin-bottom:6px;font-family:monospace">${s.studentId}</div>
          <table style="width:100%;font-size:7.5px;border-collapse:collapse">
            <tr><td style="color:#666;padding:1px 0">Class</td><td style="font-weight:bold;color:#1C1A17">${s.form}</td></tr>
            <tr><td style="color:#666;padding:1px 0">Section</td><td style="font-weight:bold;color:#1C1A17">${sec?.short||s.section}</td></tr>
            ${spec?`<tr><td style="color:#666;padding:1px 0">Specialty</td><td style="font-weight:bold;color:${color}">${spec.label}</td></tr>`:""}
            <tr><td style="color:#666;padding:1px 0">Acad. Year</td><td style="font-weight:bold;color:#1C1A17">${SCHOOL.year}</td></tr>
          </table>
        </div>
      </div>
      <div style="background:${color};height:3px"/>
      <div style="padding:4px 12px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:6px;color:#999">Valid for academic year ${SCHOOL.year}</span>
        ${s.registerNo?`<span style="font-size:7px;font-weight:bold;color:${P};font-family:monospace">Reg: ${s.registerNo}</span>`:""}
      </div>
    </div>`;
  }
  function printIdCard(s:Student){const w=window.open("","_blank","width=900,height=700");if(!w)return;w.document.write(`<!DOCTYPE html><html><head><title>ID Card — ${s.name}</title><style>body{margin:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:flex-start;padding:30px}@media print{body{background:white;padding:0;margin:0}}</style></head><body>${idCardHtml(s)}<script>window.onload=()=>{window.print();}<\/script></body></html>`);w.document.close();}
  function printAllIdCards(list:Student[]){const w=window.open("","_blank","width=1200,height=800");if(!w)return;const cards=list.map(s=>idCardHtml(s)).join("");w.document.write(`<!DOCTYPE html><html><head><title>Student ID Cards — SIHS Ndop</title><style>body{margin:20px;background:#f5f5f5;font-family:Arial,sans-serif}h2{color:#8B1A1A;margin-bottom:16px}.grid{display:flex;flex-wrap:wrap;gap:8px}@media print{body{background:white;margin:0;padding:8px}h2{display:none}}</style></head><body><h2>Student ID Cards — ${SCHOOL.name} · ${SCHOOL.year}</h2><div class="grid">${cards}</div><script>window.onload=()=>{window.print();}<\/script></body></html>`);w.document.close();}
  const activeForms=[...new Set(classes.filter(c=>c.isActive).map(c=>c.form))];
  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Students</h1><p className="text-sm text-[#1C1A17]/50">{students.filter(s=>s.status==="active").length} active · {students.filter(s=>s.status==="inactive").length} inactive · {SCHOOL.year}</p></div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-white rounded-lg border border-[#8B1A1A]/10 p-1">
            {([["list","Student List"],["idcards","ID Cards"]] as [typeof tab,string][]).map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} className="px-3 py-1.5 rounded text-xs font-semibold transition-all" style={{background:tab===t?P:"",color:tab===t?"white":"#6b7280"}}>{l}</button>
            ))}
          </div>
          <Btn onClick={openAdd}><Plus size={15}/>Admit Student</Btn>
        </div>
      </div>
      {tab==="list"&&(<>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1A17]/40"/><input placeholder="Search name, ID, parent…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none" style={{fontFamily:"var(--font-body)"}}/></div>
        <select value={filterSection} onChange={e=>{setFilterSection(e.target.value as SectionId|"");setFilterSpecialty("");}} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none text-[#1C1A17]"><option value="">All Sections</option>{SECTION_META.map(s=><option key={s.id} value={s.id}>{s.short}</option>)}</select>
        <select value={filterSpecialty} onChange={e=>setFilterSpecialty(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none text-[#1C1A17]"><option value="">All Specialties</option>{(filterSection?SPECIALTIES.filter(sp=>sp.section===filterSection):SPECIALTIES).map(sp=><option key={sp.id} value={sp.id}>{sp.short}</option>)}</select>
        <select value={filterForm} onChange={e=>setFilterForm(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none text-[#1C1A17]"><option value="">All Classes</option>{activeForms.map(f=><option key={f} value={f}>{f}</option>)}</select>
        <select value={fs} onChange={e=>setFs(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none text-[#1C1A17]"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-[#8B1A1A]/08 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm" style={{fontFamily:"var(--font-body)"}}>
          <thead><tr className="border-b border-[#8B1A1A]/08 bg-[#FDF5F5]">{["Student","Reg. No","Section","Class","Gender","Parent / Guardian","Status",""].map(h=><th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/50" style={{fontFamily:"var(--font-mono)"}}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#8B1A1A]/05">
            {filtered.length===0?<tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#1C1A17]/40">No students found.</td></tr>:filtered.map(s=>(
              <tr key={s.id} className="hover:bg-[#FDF5F5]/60">
                <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={s.name} size="sm"/><span className="font-semibold text-[#1C1A17]">{s.name}</span></div></td>
                <td className="px-4 py-3 text-xs text-[#1C1A17]/60" style={{fontFamily:"var(--font-mono)"}}>{s.registerNo||"—"}</td>
                <td className="px-4 py-3"><div className="space-y-0.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{color:SECTION_META.find(x=>x.id===s.section)?.color||P,background:SECTION_META.find(x=>x.id===s.section)?.bg||"#FDF5F5",borderColor:(SECTION_META.find(x=>x.id===s.section)?.color||P)+"33",fontFamily:"var(--font-mono)"}}>{SECTION_META.find(x=>x.id===s.section)?.short||s.section}</span>{s.specialty&&<div><span className="text-[9px] font-medium px-1.5 py-0 rounded-full border" style={{color:SPECIALTIES.find(x=>x.id===s.specialty)?.color||"#888",borderColor:(SPECIALTIES.find(x=>x.id===s.specialty)?.color||"#888")+"33",fontFamily:"var(--font-mono)"}}>{SPECIALTIES.find(x=>x.id===s.specialty)?.short||""}</span></div>}</div></td>
                <td className="px-4 py-3 text-xs font-medium" style={{color:P}}>{s.form}</td>
                <td className="px-4 py-3 text-xs text-[#1C1A17]/60">{s.gender==="M"?"Male":"Female"}</td>
                <td className="px-4 py-3"><p className="text-xs font-medium text-[#1C1A17]/80">{s.parentName}</p><p className="text-[10px] text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>{s.parentPhone}</p></td>
                <td className="px-4 py-3"><Bdg status={s.status}/></td>
                <td className="px-4 py-3"><div className="flex gap-1"><button onClick={()=>setView(s)} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Eye size={13}/></button><button onClick={()=>openEdit(s)} className="p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}}><Edit2 size={13}/></button><button onClick={()=>remove(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={13}/></button></div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <div className="px-4 py-2.5 border-t border-[#8B1A1A]/05 text-xs text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>Showing {filtered.length} of {students.length} records</div>
      </div>
      </>)}
      {tab==="idcards"&&(
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1A17]/40"/><input placeholder="Search student…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none"/></div>
          <select value={filterSection} onChange={e=>setFilterSection(e.target.value as SectionId|"")} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none text-[#1C1A17]"><option value="">All Sections</option>{SECTION_META.map(s=><option key={s.id} value={s.id}>{s.short}</option>)}</select>
          <select value={filterForm} onChange={e=>setFilterForm(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-white border border-[#8B1A1A]/10 focus:outline-none text-[#1C1A17]"><option value="">All Classes</option>{activeForms.map(f=><option key={f} value={f}>{f}</option>)}</select>
          <Btn variant="secondary" onClick={()=>printAllIdCards(filtered)}><Printer size={13}/>Print All ({filtered.length})</Btn>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.length===0?<p className="text-sm text-[#1C1A17]/40 col-span-full text-center py-10">No students found.</p>:filtered.map(s=>{
            const spec=SPECIALTIES.find(sp=>sp.id===s.specialty);
            const sec=SECTION_META.find(x=>x.id===s.section);
            return(
              <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-[#8B1A1A]/10 overflow-hidden flex flex-col" style={{fontFamily:"var(--font-body)"}}>
                <div className="h-2 w-full" style={{background:spec?.color||P}}/>
                <div className="p-4 flex flex-col items-center text-center gap-2 flex-1">
                  <div className="w-20 h-20 rounded-full border-4 overflow-hidden flex-shrink-0" style={{borderColor:spec?.color||P}}>
                    {s.photo?<img src={s.photo} alt={s.name} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{background:spec?.color||P}}>{s.name.charAt(0)}</div>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1C1A17] leading-tight">{s.name}</p>
                    <p className="text-[10px] font-bold mt-0.5" style={{color:P,fontFamily:"var(--font-mono)"}}>{s.studentId}</p>
                  </div>
                  <div className="w-full space-y-0.5 text-[10px] text-[#1C1A17]/60 border-t pt-2 border-dashed" style={{borderColor:"#e5e7eb"}}>
                    <p><span className="font-semibold">Class:</span> {s.form}</p>
                    <p><span className="font-semibold">Section:</span> {sec?.short||s.section}</p>
                    {spec&&<p><span className="font-semibold">Specialty:</span> {spec.label}</p>}
                    <p><span className="font-semibold">Year:</span> {SCHOOL.year}</p>
                  </div>
                  <p className="text-[9px] text-[#1C1A17]/30 mt-auto pt-1">{SCHOOL.name}</p>
                </div>
                <div className="flex border-t border-[#8B1A1A]/08">
                  <button onClick={()=>setIdCardStudent(s)} className="flex-1 py-2 text-[10px] font-semibold hover:bg-[#FDF5F5] transition-colors flex items-center justify-center gap-1" style={{color:P}}><Eye size={11}/>Preview</button>
                  <button onClick={()=>printIdCard(s)} className="flex-1 py-2 text-[10px] font-semibold hover:bg-[#FDF5F5] transition-colors flex items-center justify-center gap-1 border-l border-[#8B1A1A]/08" style={{color:P}}><Printer size={11}/>Print</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
      {idCardStudent&&(()=>{
        const s=idCardStudent;
        const spec=SPECIALTIES.find(sp=>sp.id===s.specialty);
        const sec=SECTION_META.find(x=>x.id===s.section);
        const color=spec?.color||P;
        return(
        <Modal title={`ID Card — ${s.name}`} onClose={()=>setIdCardStudent(null)}>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-2xl shadow-lg overflow-hidden" style={{width:340,fontFamily:"Arial,sans-serif",border:`2px solid ${color}33`}}>
                <div className="flex items-center gap-3 px-4 py-2.5" style={{background:P}}>
                  <div className="font-black text-xl" style={{color:"#C8960C",letterSpacing:2}}>SIHS</div>
                  <div className="flex-1"><p className="text-white font-bold text-[9px] tracking-wide uppercase">{SCHOOL.full}</p><p className="text-[8px]" style={{color:"#C8960C"}}>{SCHOOL.address}</p></div>
                  <div className="w-1 rounded-full self-stretch" style={{background:color}}/>
                </div>
                <div className="flex gap-4 p-4 bg-white">
                  <div className="w-20 h-20 rounded-full border-4 overflow-hidden flex-shrink-0" style={{borderColor:color}}>
                    {s.photo?<img src={s.photo} alt={s.name} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" style={{background:color}}>{s.name.charAt(0)}</div>}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-[#1C1A17] leading-tight">{s.name}</p>
                    <p className="text-[10px] font-bold mb-3" style={{color:P,fontFamily:"var(--font-mono)"}}>{s.studentId}</p>
                    <div className="space-y-0.5 text-[10px]">
                      {[["Class",s.form],["Section",sec?.short||s.section],["Specialty",spec?.label||"—"],["Acad. Year",SCHOOL.year],["Register No.",s.registerNo||"—"]].map(([k,v])=>(
                        <div key={k} className="flex gap-2"><span className="text-[#1C1A17]/50 w-20 shrink-0">{k}</span><span className="font-bold text-[#1C1A17]">{v}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-1.5" style={{background:color}}/>
                <div className="flex justify-between items-center px-4 py-1.5 bg-white border-t border-[#e5e7eb]">
                  <span className="text-[9px] text-[#1C1A17]/30">Valid: {SCHOOL.year}</span>
                  <span className="text-[9px] font-semibold" style={{color:P}}>{SCHOOL.motto}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={()=>{setIdCardStudent(null);openEdit(s);}}><Edit2 size={13}/>Edit Student</Btn>
              <Btn onClick={()=>printIdCard(s)}><Printer size={14}/>Print ID Card</Btn>
            </div>
          </div>
        </Modal>
        );
      })()}
      {view&&(()=>{
        const specInfo=SPECIALTIES.find(sp=>sp.id===view.specialty);
        const secInfo=SECTION_META.find(s=>s.id===view.section);
        return(
        <Modal title="Student Profile" onClose={()=>setView(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-[#8B1A1A]/08">
              <Avatar name={view.name} size="lg"/>
              <div className="flex-1">
                <h3 className="font-bold text-lg" style={{color:P,fontFamily:"var(--font-display)"}}>{view.name}</h3>
                <p className="text-xs text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>{view.studentId}</p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Bdg status={view.status}/>
                  {secInfo&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{color:secInfo.color,background:secInfo.bg,borderColor:secInfo.color+"44",fontFamily:"var(--font-mono)"}}>{secInfo.short}</span>}
                  {specInfo&&<span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:specInfo.color,fontFamily:"var(--font-mono)"}}>{specInfo.label}</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["Class / Form", view.form],["Gender", view.gender==="M"?"Male":"Female"],
                ["Date of Birth", fmtDate(view.dob)],["Enrolled", fmtDate(view.enrolledDate)],
                ["Register No.", view.registerNo||"—"],["Repeater", view.repeater?"Yes":"No"],
                ["Section", secInfo?.label||view.section],["Specialty", specInfo?.label||"—"],
                ["Parent / Guardian", view.parentName],["Parent Phone", view.parentPhone],
                ["Home Address", view.address],
              ] as [string,string][]).map(([k,v])=>(
                <div key={k} className={k==="Home Address"||k==="Parent / Guardian"?"col-span-2":""}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-0.5" style={{fontFamily:"var(--font-mono)"}}>{k}</p>
                  <p className="text-[#1C1A17] text-sm">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
        );
      })()}
      {showM&&(()=>{
        const chosenSpec=SPECIALTIES.find(sp=>sp.id===form.specialty);
        const chosenSec=SECTION_META.find(s=>s.id===form.section);
        const sectionForms=classes.filter(c=>c.isActive&&(!form.section||c.section===form.section)).map(c=>c.form);
        const formOptions=[...new Set(sectionForms.length>0?sectionForms:FORMS)];
        return(
        <Modal title={editing?"Edit Student":"New Student Admission"} onClose={()=>setShowM(false)} wide>
          <form onSubmit={save} className="space-y-5">
            <div className="rounded-xl border-2 p-4 space-y-3" style={{borderColor:chosenSpec?chosenSpec.color+"44":"#e5e7eb",background:chosenSpec?chosenSpec.color+"06":"#fafafa"}}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background:chosenSpec?chosenSpec.color:P}}>1</div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{color:chosenSpec?chosenSpec.color:P,fontFamily:"var(--font-mono)"}}>Specialty <span className="text-red-500">*</span></p>
                {chosenSpec&&chosenSec&&<span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{background:chosenSec.color+"18",color:chosenSec.color}}>→ {chosenSec.label} Section</span>}
              </div>
              {SECTION_META.map(sm=>{
                const sectionSpecs=SPECIALTIES.filter(sp=>sp.section===sm.id);
                return(
                  <div key={sm.id}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 mt-1" style={{color:sm.color,fontFamily:"var(--font-mono)"}}>{sm.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {sectionSpecs.map(sp=>{
                        const isChosen=form.specialty===sp.id;
                        return(
                          <button key={sp.id} type="button" onClick={()=>setForm(f=>({...f,specialty:sp.id,section:sp.section as SectionId,form:""}))}
                            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all"
                            style={{borderColor:isChosen?sp.color:"#e5e7eb",background:isChosen?sp.color:"white",color:isChosen?"white":"#6b7280",boxShadow:isChosen?`0 0 0 3px ${sp.color}33`:undefined}}>
                            {isChosen&&<span className="text-[10px]">✓</span>}{sp.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {!form.specialty&&<p className="text-[10px] text-amber-600 font-medium">Select a specialty to auto-assign the student to the correct section.</p>}
            </div>

            <div className="rounded-xl border p-4 space-y-3" style={{borderColor:"#e5e7eb"}}>
              <div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background:P}}>2</div><p className="text-xs font-bold uppercase tracking-widest" style={{color:P,fontFamily:"var(--font-mono)"}}>Personal Details</p></div>
              <FI label="Full Name" value={form.name||""} onChange={v=>setForm(f=>({...f,name:v}))} required placeholder="e.g. Alube Justine"/>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1.5" style={{fontFamily:"var(--font-mono)"}}>Passport Photo (optional)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed overflow-hidden flex items-center justify-center flex-shrink-0" style={{borderColor:P+"44",background:"#FDF5F5"}}>
                    {form.photo?<img src={form.photo} alt="preview" className="w-full h-full object-cover"/>:<span className="text-[10px] text-[#1C1A17]/30 text-center leading-tight px-1">No photo</span>}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*" id="photo-upload" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handlePhotoUpload(f,url=>setForm(x=>({...x,photo:url})));}}/>
                    <label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:opacity-80" style={{borderColor:P,color:P,background:"#FDF5F5"}}>Upload Photo</label>
                    {form.photo&&<button type="button" onClick={()=>setForm(f=>({...f,photo:""}))} className="ml-2 text-[10px] text-red-400 hover:text-red-600">Remove</button>}
                    <p className="text-[10px] text-[#1C1A17]/40 mt-1">JPG, PNG · max 2MB · will appear on ID card</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FS label="Gender" value={form.gender||""} onChange={v=>setForm(f=>({...f,gender:v as Gender}))} options={["M","F"]} required/>
                <FI label="Date of Birth" value={form.dob||""} onChange={v=>setForm(f=>({...f,dob:v}))} type="date"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FI label="Register No." value={form.registerNo||""} onChange={v=>setForm(f=>({...f,registerNo:v}))} placeholder="e.g. 001"/>
                <FS label="Repeater?" value={form.repeater?"Yes":"No"} onChange={v=>setForm(f=>({...f,repeater:v==="Yes"}))} options={["No","Yes"]}/>
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-3" style={{borderColor:"#e5e7eb"}}>
              <div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background:P}}>3</div><p className="text-xs font-bold uppercase tracking-widest" style={{color:P,fontFamily:"var(--font-mono)"}}>Class Placement</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1.5" style={{fontFamily:"var(--font-mono)"}}>Class / Form <span className="text-red-500">*</span></label>
                  <select value={form.form||""} onChange={e=>setForm(f=>({...f,form:e.target.value}))} required className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none" style={{fontFamily:"var(--font-body)"}}>
                    <option value="">— Select class —</option>
                    {formOptions.map(fo=><option key={fo} value={fo}>{fo}</option>)}
                  </select>
                </div>
                <FS label="Admission Status" value={form.status||"active"} onChange={v=>setForm(f=>({...f,status:v as any}))} options={["active","inactive"]}/>
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-3" style={{borderColor:"#e5e7eb"}}>
              <div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background:P}}>4</div><p className="text-xs font-bold uppercase tracking-widest" style={{color:P,fontFamily:"var(--font-mono)"}}>Parent / Guardian</p></div>
              <FI label="Full Name" value={form.parentName||""} onChange={v=>setForm(f=>({...f,parentName:v}))} placeholder="e.g. Emmanuel Alube"/>
              <div className="grid grid-cols-2 gap-3">
                <FI label="Phone Number" value={form.parentPhone||""} onChange={v=>setForm(f=>({...f,parentPhone:v}))} placeholder="+237 6XX XXX XXX"/>
                <FI label="Home Address" value={form.address||""} onChange={v=>setForm(f=>({...f,address:v}))} placeholder="e.g. Bamunka, Ndop"/>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="secondary" onClick={()=>setShowM(false)}>Cancel</Btn>
              <Btn type="submit"><Save size={13}/>{editing?"Save Changes":"Admit Student"}</Btn>
            </div>
          </form>
        </Modal>
        );
      })()}
    </div>
  );
}
