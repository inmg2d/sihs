import React,{useState} from "react";
import {Edit2,Lock,LockOpen,Save} from "lucide-react";
import {P,TERMS,SEQ_META,ExamSequence,GradeRecord,AuthUser,dbSet,fmtDate} from "../shared";
import {Btn,FI,Modal} from "../ui";

export const AVAILABLE_YEARS=["2022/23","2023/24","2024/25","2025/26","2026/27","2027/28"] as const;

export function SessionManagementPage({sequences,setSequences,grades,user,currentYear}:{sequences:ExamSequence[];setSequences:(s:ExamSequence[])=>void;grades:GradeRecord[];user:AuthUser;currentYear:string}){
  const [selectedYear,setSelectedYear]=useState(currentYear);
  const [editSeq,setEditSeq]=useState<ExamSequence|null>(null);
  const [seqForm,setSeqForm]=useState<Partial<ExamSequence>>({});
  const [showEdit,setShowEdit]=useState(false);
  const [lockTarget,setLockTarget]=useState<ExamSequence|null>(null);
  const [unlockReason,setUnlockReason]=useState("");

  const TC=["#8B1A1A","#1d4ed8","#15803d"];
  const TERM_BG=["bg-red-50 border-red-100","bg-blue-50 border-blue-100","bg-emerald-50 border-emerald-100"];

  const yearSeqs=sequences;
  const isAdmin=user.role==="admin"||user.role==="superadmin";

  function openEdit(s:ExamSequence){setEditSeq(s);setSeqForm({...s});setShowEdit(true);}
  function saveSeq(e:React.FormEvent){e.preventDefault();const u=sequences.map(s=>s.id===editSeq!.id?{...s,...seqForm}as ExamSequence:s);setSequences(u);dbSet("examSeqs",u);setShowEdit(false);}
  function requestToggleLock(seq:ExamSequence){setLockTarget(seq);setUnlockReason("");}
  function confirmLock(){if(!lockTarget)return;const u=sequences.map(s=>s.id===lockTarget.id?{...s,isLocked:!s.isLocked}:s);setSequences(u);dbSet("examSeqs",u);setLockTarget(null);}
  function toggleActive(id:string){const u=sequences.map(s=>s.id===id?{...s,isActive:!s.isActive}:s.isActive?{...s,isActive:false}:s);setSequences(u);dbSet("examSeqs",u);}
  function lockAll(){const u=sequences.map(s=>({...s,isLocked:true}));setSequences(u);dbSet("examSeqs",u);}
  function unlockAll(){const u=sequences.map(s=>({...s,isLocked:false}));setSequences(u);dbSet("examSeqs",u);}

  const totalGradeRecords=grades.length;
  const lockedCount=sequences.filter(s=>s.isLocked).length;
  const activeSeq=sequences.find(s=>s.isActive);

  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{color:P,fontFamily:"var(--font-display)"}}>Session Management</h1>
          <p className="text-sm text-[#1C1A17]/50">Manage academic years, exam sequences, and mark entry windows</p>
        </div>
        {isAdmin&&<div className="flex gap-2">
          <Btn variant="secondary" onClick={unlockAll}><LockOpen size={13}/>Unlock All</Btn>
          <Btn onClick={lockAll}><Lock size={13}/>Lock All</Btn>
        </div>}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#8B1A1A]/08">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-3" style={{fontFamily:"var(--font-mono)"}}>Academic Year</p>
        <div className="flex gap-2 flex-wrap">
          {AVAILABLE_YEARS.map(y=>(
            <button key={y} onClick={()=>setSelectedYear(y)} className="px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all" style={{borderColor:y===selectedYear?P:y===currentYear?"#C8960C":"#e5e7eb",background:y===selectedYear?P:"white",color:y===selectedYear?"white":y===currentYear?"#b45309":"#6b7280",fontFamily:"var(--font-mono)"}}>
              {y}{y===currentYear&&<span className="ml-1.5 text-[9px] font-normal opacity-80">(active)</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Active Sequence",value:activeSeq?SEQ_META.find(m=>m.seqNo===activeSeq.seqNo)?.short||"—":"None",color:"#15803d"},
          {label:"Locked Sequences",value:`${lockedCount} / 6`,color:"#dc2626"},
          {label:"Open Sequences",value:`${6-lockedCount} / 6`,color:"#0369a1"},
          {label:"Grade Records",value:totalGradeRecords,color:P},
        ].map(({label,value,color})=>(
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-[#8B1A1A]/08">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1C1A17]/40 mb-1" style={{fontFamily:"var(--font-mono)"}}>{label}</p>
            <p className="text-xl font-black" style={{color,fontFamily:"var(--font-display)"}}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {TERMS.map((t,ti)=>{
          const termSeqs=yearSeqs.filter(s=>s.term===t).sort((a,b)=>a.seqNo-b.seqNo);
          const seqPair=ti===0?"Seq 1 & 2":ti===1?"Seq 3 & 4":"Seq 5 & 6";
          const termGrades=grades.filter(g=>g.term===t).length;
          return(
            <div key={t} className={`rounded-xl border-2 overflow-hidden shadow-sm ${TERM_BG[ti]}`}>
              <div className="px-5 py-3.5 flex items-center justify-between" style={{background:TC[ti]}}>
                <div>
                  <p className="text-white font-black text-sm" style={{fontFamily:"var(--font-display)"}}>Term {t}</p>
                  <p className="text-white/60 text-[10px]" style={{fontFamily:"var(--font-mono)"}}>{seqPair} · {termGrades} records</p>
                </div>
                <span className="text-white/50 text-[10px]">{termSeqs.some(s=>s.isActive)?"● ONGOING":"○ Scheduled"}</span>
              </div>
              <div className="p-4 space-y-3">
                {termSeqs.map(seq=>{
                  const sm=SEQ_META.find(m=>m.seqNo===seq.seqNo)!;
                  const gradeCount=grades.filter(g=>g.term===t&&(seq.seqInTerm===1?g.seq1!==null:g.seq2!==null)).length;
                  return(
                    <div key={seq.id} className={`bg-white rounded-xl p-4 border-2 shadow-sm transition-all ${seq.isActive?"border-opacity-100":"border-transparent"}`} style={{borderColor:seq.isActive?TC[ti]:"transparent"}}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-black text-sm" style={{color:TC[ti],fontFamily:"var(--font-display)"}}>{sm.label}</p>
                          <p className="text-[10px] text-[#1C1A17]/40 mt-0.5" style={{fontFamily:"var(--font-mono)"}}>{seq.startDate?`${fmtDate(seq.startDate)} → ${fmtDate(seq.endDate)}`:"Dates not set"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {seq.isActive&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:TC[ti]}}>ACTIVE</span>}
                          {seq.isLocked
                            ?<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-0.5"><Lock size={7}/>LOCKED</span>
                            :<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-0.5"><LockOpen size={7}/>OPEN</span>}
                        </div>
                      </div>
                      {seq.notes&&<p className="text-[10px] text-[#1C1A17]/50 italic mb-2">{seq.notes}</p>}
                      <div className="flex items-center justify-between pt-2 border-t border-[#1C1A17]/06">
                        <span className="text-[10px] text-[#1C1A17]/40" style={{fontFamily:"var(--font-mono)"}}>{gradeCount} records</span>
                        {isAdmin&&<div className="flex gap-1">
                          <button onClick={()=>toggleActive(seq.id)} className="text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors" style={{borderColor:TC[ti],color:seq.isActive?"white":TC[ti],background:seq.isActive?TC[ti]:"transparent"}}>{seq.isActive?"Deactivate":"Set Active"}</button>
                          <button onClick={()=>requestToggleLock(seq)} className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${seq.isLocked?"bg-red-100 text-red-700 border-red-300 hover:bg-red-200":"bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>{seq.isLocked?<><LockOpen size={8}/>Unlock</>:<><Lock size={8}/>Lock</>}</button>
                          <button onClick={()=>openEdit(seq)} className="text-[10px] font-bold px-2 py-1 rounded-lg border text-[#1C1A17]/50 border-[#1C1A17]/20 hover:bg-gray-50"><Edit2 size={8} className="inline mr-0.5"/>Edit</button>
                        </div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-[#8B1A1A]/08">
        <h3 className="text-sm font-bold mb-4" style={{color:P,fontFamily:"var(--font-display)"}}>Academic Calendar Overview — {selectedYear}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{fontFamily:"var(--font-mono)"}}>
            <thead>
              <tr style={{background:"#FDF5F5"}}>
                {["Sequence","Term","Period","Status","Lock","Grade Records","Actions"].map(h=>(
                  <th key={h} className="text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[#1C1A17]/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B1A1A]/05">
              {[...yearSeqs].sort((a,b)=>a.seqNo-b.seqNo).map(seq=>{
                const sm=SEQ_META.find(m=>m.seqNo===seq.seqNo)!;
                const gradeCount=grades.filter(g=>g.term===seq.term&&(seq.seqInTerm===1?g.seq1!==null:g.seq2!==null)).length;
                const tc=TC[Number(seq.term)-1];
                return(
                  <tr key={seq.id} className="hover:bg-[#FDF5F5]/60">
                    <td className="px-3 py-2.5 font-black" style={{color:tc}}>{sm.label}</td>
                    <td className="px-3 py-2.5"><span className="font-semibold" style={{color:tc}}>Term {seq.term}</span></td>
                    <td className="px-3 py-2.5 text-[#1C1A17]/60">{seq.startDate?`${fmtDate(seq.startDate)} – ${fmtDate(seq.endDate)}`:"—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${seq.isActive?"bg-green-100 text-green-700 border-green-200":seq.isLocked?"bg-red-100 text-red-700 border-red-200":"bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {seq.isActive?"ACTIVE":seq.isLocked?"LOCKED":"OPEN"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {seq.isLocked
                        ?<span className="flex items-center gap-1 text-red-600"><Lock size={10}/><span className="text-[9px] font-bold">Locked</span></span>
                        :<span className="flex items-center gap-1 text-emerald-600"><LockOpen size={10}/><span className="text-[9px] font-bold">Open</span></span>}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-[#1C1A17]/70">{gradeCount}</td>
                    <td className="px-3 py-2.5">
                      {isAdmin&&<div className="flex gap-1">
                        <button onClick={()=>requestToggleLock(seq)} className={`text-[9px] font-bold px-2 py-0.5 rounded border ${seq.isLocked?"bg-amber-50 text-amber-700 border-amber-200":"bg-gray-50 text-gray-600 border-gray-200"}`}>{seq.isLocked?"Unlock":"Lock"}</button>
                        <button onClick={()=>openEdit(seq)} className="text-[9px] font-bold px-2 py-0.5 rounded border text-[#1C1A17]/50 border-[#1C1A17]/20"><Edit2 size={8} className="inline mr-0.5"/>Edit</button>
                      </div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {lockTarget&&(<Modal title={lockTarget.isLocked?"Unlock Sequence":"Lock Sequence"} onClose={()=>setLockTarget(null)}>
        <div className="space-y-4">
          {lockTarget.isLocked?(
            <>
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <LockOpen size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Unlock {SEQ_META.find(m=>m.seqNo===lockTarget.seqNo)?.label}?</p>
                  <p className="text-xs text-amber-700 mt-0.5">Teachers will be able to enter or edit marks for this sequence again.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1.5" style={{fontFamily:"var(--font-mono)"}}>Reason (optional)</label>
                <input value={unlockReason} onChange={e=>setUnlockReason(e.target.value)} placeholder="e.g. Mark correction approved by HOD" className="w-full px-3 py-2 rounded-lg bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none"/>
              </div>
            </>
          ):(
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Lock size={16} className="text-red-600 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-semibold text-red-800">Lock {SEQ_META.find(m=>m.seqNo===lockTarget.seqNo)?.label}?</p>
                <p className="text-xs text-red-700 mt-0.5">Teachers will no longer be able to enter or change marks. Only admins can override.</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={()=>setLockTarget(null)}>Cancel</Btn>
            <Btn onClick={confirmLock}>{lockTarget.isLocked?<><LockOpen size={13}/>Confirm Unlock</>:<><Lock size={13}/>Confirm Lock</>}</Btn>
          </div>
        </div>
      </Modal>)}

      {showEdit&&editSeq&&(<Modal title={`Edit — ${SEQ_META.find(m=>m.seqNo===editSeq.seqNo)?.label}`} onClose={()=>setShowEdit(false)}>
        <form onSubmit={saveSeq} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FI label="Start Date" value={seqForm.startDate||""} onChange={v=>setSeqForm(f=>({...f,startDate:v}))} type="date"/>
            <FI label="End Date" value={seqForm.endDate||""} onChange={v=>setSeqForm(f=>({...f,endDate:v}))} type="date"/>
          </div>
          <div><label className="block text-xs font-semibold uppercase tracking-widest text-[#1C1A17]/50 mb-1" style={{fontFamily:"var(--font-mono)"}}>Notes</label><textarea value={seqForm.notes||""} onChange={e=>setSeqForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full px-3 py-2 rounded bg-[#ECEAE4] border border-[#8B1A1A]/10 text-sm focus:outline-none resize-none" style={{fontFamily:"var(--font-body)"}}/></div>
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={seqForm.isActive??false} onChange={e=>setSeqForm(f=>({...f,isActive:e.target.checked}))} className="w-4 h-4"/><span className="text-sm text-[#1C1A17]">Active / Ongoing</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={seqForm.isLocked??false} onChange={e=>setSeqForm(f=>({...f,isLocked:e.target.checked}))} className="w-4 h-4"/><span className="text-sm text-[#1C1A17]">Lock Grade Entry</span></label>
          </div>
          <div className="flex justify-end gap-2 pt-1"><Btn variant="secondary" onClick={()=>setShowEdit(false)}>Cancel</Btn><Btn type="submit"><Save size={13}/>Save</Btn></div>
        </form>
      </Modal>)}
    </div>
  );
}
