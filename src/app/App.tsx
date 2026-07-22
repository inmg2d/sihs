import React, { useState } from "react";
import { Menu, Eye, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import {
  SCHOOL, P, Page, SectionId,
  AuthUser, Student, Teacher, PayrollRecord, Subject, ClassRoom, GradeRecord, AttRecord, Announcement, CouncilRemark, FeeStructure, FeePayment, ExamSequence, AppUser, StudentFeeOverride,
  SEED_SUBJECTS, SEED_CLASSES, SEED_EXAM_SEQUENCES, SEED_STUDENTS, SEED_TEACHERS, SEED_PAYROLL, SEED_GRADES, SEED_COUNCIL, SEED_ATTENDANCE, SEED_ANNOUNCEMENTS, SEED_FEES, SEED_PAYMENTS, SEED_STUDENT_FEE_OVERRIDES, DEFAULT_USERS, DATA_VERSION,
  TimetableSlot, SEED_TIMETABLE, PERIODS, DAYS,
  hashPw, checkPw, dbGet, dbSet, uid,
} from "./shared";
import { Avatar, Btn, FI, Modal, roleBadge } from "./ui";
import { LoginScreen, Sidebar, NAV } from "./pages/auth";
import { Dashboard, SectionsPage, ClassesPage, SubjectsPage, StudentsPage } from "./pages/pages1";
import { TeachersPage, AttendancePage, GradesPage, ExamsPage, ReportCardPage } from "./pages/pages2";
import { FinancePage, TimetablePage, AnnouncementsPage, UsersPage } from "./pages/pages3";
import { SessionManagementPage, AVAILABLE_YEARS } from "./pages/session";

export default function App(){
  // Wipe stale demo data when data version changes; runs once on mount
  const [_versionChecked] = useState(()=>{
    const stored = localStorage.getItem("sihs_dataVersion");
    if(stored !== DATA_VERSION){
      Object.keys(localStorage).filter(k=>k.startsWith("sihs_")&&k!=="sihs_currentYear").forEach(k=>localStorage.removeItem(k));
      localStorage.setItem("sihs_dataVersion", DATA_VERSION);
    }
    return true;
  });

  const [user,setUser]=useState<AuthUser|null>(null);
  const [page,setPage]=useState<Page>("dashboard");
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [showChangePw,setShowChangePw]=useState(false);
  const [cpForm,setCpForm]=useState({current:"",newPw:"",confirm:""});
  const [cpError,setCpError]=useState("");
  const [cpSuccess,setCpSuccess]=useState(false);
  const [currentYear,setCurrentYearState]=useState<string>(()=>localStorage.getItem("sihs_currentYear")||SCHOOL.year);
  const [showYearPicker,setShowYearPicker]=useState(false);
  function applyYear(y:string){setCurrentYearState(y);localStorage.setItem("sihs_currentYear",y);setShowYearPicker(false);}
  const [filterForm,setFilterForm]=useState("");
  const [filterSubject,setFilterSubject]=useState("");
  const [filterSection,setFilterSection]=useState<SectionId|"">("");
  const [filterSpecialty,setFilterSpecialty]=useState("");

  const SPEC_MIGRATE:Record<string,string>={
    "gen_soc":"gen_artsci","tec_gc":"tec_bc","tec_ge":"tec_elec","tec_gm":"tec_mm",
    "tec_ia":"tec_fd","tec_agr":"tec_ww","com_cg":"com_acc","com_sb":"com_acc","com_ig":"com_mkt",
  };
  const VALID_SPEC_IDS=new Set(["gen_sci","gen_arts","gen_artsci","tec_bc","tec_mm","tec_elec","tec_ww","tec_fd","com_acc","com_mkt"]);

  const [appUsers,setAppUsers]=useState<AppUser[]>(()=>{
    const stored=dbGet<AppUser[]>("appUsers",[]);
    if(stored.length===0){dbSet("appUsers",DEFAULT_USERS);return DEFAULT_USERS;}
    // If none of the default user emails exist, or hash algorithm changed, merge defaults in
    const hasAdmin=stored.some(u=>u.email==="admin@sihs-ndop.edu.cm"&&u.isActive);
    const hashOk=stored.some(u=>u.email==="admin@sihs-ndop.edu.cm"&&checkPw("Admin@2025",u.passwordHash));
    if(!hasAdmin||!hashOk){
      // Keep any non-default custom users, re-seed the defaults fresh
      const custom=stored.filter(u=>!DEFAULT_USERS.find(d=>d.email===u.email));
      const merged=[...DEFAULT_USERS,...custom];
      dbSet("appUsers",merged);return merged;
    }
    return stored;
  });
  const [students,setStudents]=useState<Student[]>(()=>{
    const raw=dbGet("students",SEED_STUDENTS);
    return raw.map((s:Student)=>({...s,specialty:SPEC_MIGRATE[s.specialty]||(VALID_SPEC_IDS.has(s.specialty)?s.specialty:"")}));
  });
  const [teachers,setTeachers]=useState<Teacher[]>(()=>dbGet("teachers",SEED_TEACHERS));
  const [subjects,setSubjects]=useState<Subject[]>(()=>{
    const stored=dbGet<Subject[]>("subjects",[]);
    return SEED_SUBJECTS.map(seed=>{const s=stored.find(x=>x.id===seed.id);return s?{...seed,...s,specialties:seed.specialties}:seed;});
  });
  const [classes,setClasses]=useState<ClassRoom[]>(()=>dbGet("classes",SEED_CLASSES));
  const [grades,setGrades]=useState<GradeRecord[]>(()=>dbGet("grades",SEED_GRADES));
  const [attendance,setAttendance]=useState<AttRecord[]>(()=>dbGet("attendance",SEED_ATTENDANCE));
  const [announcements,setAnnouncements]=useState<Announcement[]>(()=>dbGet("announcements",SEED_ANNOUNCEMENTS));
  const [council,setCouncil]=useState<CouncilRemark[]>(()=>dbGet("council",SEED_COUNCIL));
  const [payments,setPayments]=useState<FeePayment[]>(()=>dbGet("payments",SEED_PAYMENTS));
  const [fees,setFees]=useState<FeeStructure[]>(()=>{const stored=dbGet<FeeStructure[]>("fees",SEED_FEES);if(stored.length>0&&("form" in stored[0]||!("tuitionGeneral" in stored[0]))){dbSet("fees",SEED_FEES);return SEED_FEES;}return stored;});
  const [studentFeeOverrides,setStudentFeeOverrides]=useState<StudentFeeOverride[]>(()=>dbGet("studentFeeOverrides",SEED_STUDENT_FEE_OVERRIDES));
  const [examSequences,setExamSequences]=useState<ExamSequence[]>(()=>dbGet("examSeqs",SEED_EXAM_SEQUENCES));
  const [payroll,setPayroll]=useState<PayrollRecord[]>(()=>dbGet("payroll",SEED_PAYROLL));
  const [timetable,setTimetable]=useState<TimetableSlot[]>(()=>{
    const stored=dbGet<TimetableSlot[]>("timetable",[]);
    if(stored.length>0&&!("subjectName" in stored[0])){dbSet("timetable",SEED_TIMETABLE);return SEED_TIMETABLE;}
    return stored.length>0?stored:SEED_TIMETABLE;
  });

  if(!user)return<LoginScreen onLogin={setUser} appUsers={appUsers}/>;

  function navigate(p:Page,form?:string,subject?:string,section?:SectionId|"",specialty?:string){
    if(form!==undefined)setFilterForm(form);
    if(subject!==undefined)setFilterSubject(subject);
    if(section!==undefined)setFilterSection(section);
    if(specialty!==undefined)setFilterSpecialty(specialty);
    setPage(p);
  }

  const sidebarProps={page,user,onLogout:()=>{setUser(null);setPage("dashboard");},currentYear,onYearPick:()=>setShowYearPicker(true)};

  return(
    <div className="flex h-screen overflow-hidden" style={{fontFamily:"var(--font-body)",background:"#F4F2EE"}}>
      {mobileOpen&&<div className="fixed inset-0 z-40 lg:hidden" onClick={()=>setMobileOpen(false)} style={{background:"rgba(0,0,0,0.4)"}}/>}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar {...sidebarProps} setPage={p=>navigate(p,"","","")} collapsed={collapsed} setCollapsed={setCollapsed}/>
      </div>
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden transition-transform duration-200 ${mobileOpen?"translate-x-0":"-translate-x-full"}`} style={{width:224}}>
        <Sidebar {...sidebarProps} setPage={p=>{navigate(p,"","","");setMobileOpen(false);}} collapsed={false} setCollapsed={()=>{}}/>
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b shadow-sm" style={{borderColor:"rgba(139,26,26,0.08)"}}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded hover:bg-[#F3E8E8]" style={{color:P}} onClick={()=>setMobileOpen(true)}><Menu size={18}/></button>
            <div>
              <h2 className="text-sm font-bold text-[#1C1A17]" style={{fontFamily:"var(--font-display)"}}>{NAV.find(n=>n.id===page)?.label||"Dashboard"}</h2>
              <p className="text-[10px] text-[#1C1A17]/40 hidden sm:block" style={{fontFamily:"var(--font-mono)"}}>{SCHOOL.full} · {currentYear}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <Avatar name={user.name} size="sm"/>
            <div><p className="font-semibold text-[#1C1A17]">{user.name}</p></div>
            {roleBadge(user.role)}
            <button onClick={()=>setShowChangePw(true)} className="ml-1 p-1.5 rounded hover:bg-[#F3E8E8] text-[#1C1A17]/40 hover:text-[#8B1A1A] transition-colors" title="Change Password"><Eye size={14}/></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {page==="dashboard"&&<Dashboard students={students} teachers={teachers} classes={classes} subjects={subjects} attendance={attendance} announcements={announcements} payments={payments} fees={fees} setPage={p=>navigate(p)}/>}
          {page==="sections"&&<SectionsPage students={students} classes={classes} subjects={subjects} grades={grades} attendance={attendance} payments={payments} fees={fees} setPage={(p,sec?,spec?)=>navigate(p,"","",sec,spec)} setFilterForm={setFilterForm} setFilterSubject={setFilterSubject} setFilterSection={setFilterSection} filterSpecialty={filterSpecialty} setFilterSpecialty={setFilterSpecialty}/>}
          {page==="students"&&<StudentsPage students={students} setStudents={setStudents} classes={classes} filterForm={filterForm} setFilterForm={setFilterForm} filterSection={filterSection} setFilterSection={setFilterSection} filterSpecialty={filterSpecialty} setFilterSpecialty={setFilterSpecialty}/>}
          {page==="classes"&&<ClassesPage classes={classes} setClasses={setClasses} students={students} teachers={teachers} grades={grades} attendance={attendance} setPage={p=>navigate(p)} setFilterForm={setFilterForm} initSection={filterSection||undefined}/>}
          {page==="subjects"&&<SubjectsPage subjects={subjects} setSubjects={setSubjects} teachers={teachers} students={students} grades={grades} setPage={p=>navigate(p)} setFilterSubject={setFilterSubject} filterSpecialty={filterSpecialty} setFilterSpecialty={setFilterSpecialty}/>}
          {page==="teachers"&&<TeachersPage teachers={teachers} setTeachers={setTeachers} subjects={subjects} payroll={payroll} setPayroll={setPayroll} user={user}/>}
          {page==="attendance"&&<AttendancePage students={students} attendance={attendance} setAttendance={setAttendance} classes={classes} filterForm={filterForm} setFilterForm={setFilterForm} filterSpecialty={filterSpecialty} setFilterSpecialty={setFilterSpecialty}/>}
          {page==="grades"&&<GradesPage students={students} grades={grades} setGrades={setGrades} subjects={subjects} classes={classes} teachers={teachers} filterForm={filterForm} setFilterForm={setFilterForm} filterSubject={filterSubject} setFilterSubject={setFilterSubject} filterSpecialty={filterSpecialty} setFilterSpecialty={setFilterSpecialty}/>}
          {page==="exams"&&<ExamsPage sequences={examSequences} setSequences={setExamSequences} grades={grades} setGrades={setGrades} students={students} subjects={subjects} council={council} user={user} classes={classes}/>}
          {page==="reportcard"&&<ReportCardPage students={students} grades={grades} setGrades={setGrades} council={council} setCouncil={setCouncil} subjects={subjects} classes={classes} setPage={p=>navigate(p)}/>}
          {page==="finance"&&<FinancePage students={students} payments={payments} setPayments={setPayments} fees={fees} setFees={setFees} studentFeeOverrides={studentFeeOverrides} setStudentFeeOverrides={setStudentFeeOverrides} user={user} currentYear={currentYear}/>}
          {page==="timetable"&&<TimetablePage timetable={timetable} setTimetable={setTimetable} teachers={teachers} subjects={subjects} user={user} currentYear={currentYear}/>}
          {page==="announcements"&&<AnnouncementsPage announcements={announcements} setAnnouncements={setAnnouncements} user={user}/>}
          {page==="users"&&user.role==="superadmin"&&<UsersPage appUsers={appUsers} setAppUsers={setAppUsers} currentUser={user}/>}
          {page==="session"&&(user.role==="admin"||user.role==="superadmin")&&<SessionManagementPage sequences={examSequences} setSequences={setExamSequences} grades={grades} user={user} currentYear={currentYear}/>}
        </main>
      </div>

      {showYearPicker&&(<Modal title="Select Academic Year" onClose={()=>setShowYearPicker(false)}>
        <div className="space-y-4">
          <p className="text-xs text-[#1C1A17]/60">Choose the academic year to use for reports, fees, and data filters. This affects all users.</p>
          <div className="grid grid-cols-3 gap-2">
            {AVAILABLE_YEARS.map(y=>(
              <button key={y} onClick={()=>applyYear(y)} className="py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all" style={{borderColor:y===currentYear?P:"#e5e7eb",background:y===currentYear?P:"white",color:y===currentYear?"white":"#1C1A17",fontFamily:"var(--font-mono)"}}>
                {y}{y===currentYear&&<span className="block text-[9px] font-normal opacity-70 mt-0.5">active</span>}
              </button>
            ))}
          </div>
          {currentYear!==SCHOOL.year&&<div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700"><AlertTriangle size={13} className="flex-shrink-0"/>Not the default year ({SCHOOL.year}). Some seed data may not match.</div>}
          <div className="flex justify-end"><Btn variant="secondary" onClick={()=>setShowYearPicker(false)}>Close</Btn></div>
        </div>
      </Modal>)}

      {showChangePw&&(<Modal title="Change Password" onClose={()=>{setShowChangePw(false);setCpForm({current:"",newPw:"",confirm:""});setCpError("");setCpSuccess(false);}}>
        <form onSubmit={e=>{
          e.preventDefault();setCpError("");setCpSuccess(false);
          const me=appUsers.find(u=>u.id===user.id);
          if(!me){setCpError("Account not found.");return;}
          if(!checkPw(cpForm.current,me.passwordHash)){setCpError("Current password is incorrect.");return;}
          if(cpForm.newPw.length<8){setCpError("New password must be at least 8 characters.");return;}
          if(cpForm.newPw!==cpForm.confirm){setCpError("Passwords do not match.");return;}
          const updated=appUsers.map(u=>u.id===me.id?{...u,passwordHash:hashPw(cpForm.newPw)}:u);
          setAppUsers(updated);dbSet("appUsers",updated);
          setCpSuccess(true);setCpForm({current:"",newPw:"",confirm:""});
        }} className="space-y-4">
          <FI label="Current Password" value={cpForm.current} onChange={v=>setCpForm(f=>({...f,current:v}))} type="password" required placeholder="Your current password"/>
          <FI label="New Password" value={cpForm.newPw} onChange={v=>setCpForm(f=>({...f,newPw:v}))} type="password" required placeholder="Min. 8 characters"/>
          <FI label="Confirm New Password" value={cpForm.confirm} onChange={v=>setCpForm(f=>({...f,confirm:v}))} type="password" required placeholder="Repeat new password"/>
          {cpError&&<p className="text-red-600 text-xs flex items-center gap-1"><AlertCircle size={11}/>{cpError}</p>}
          {cpSuccess&&<p className="text-emerald-600 text-xs flex items-center gap-1"><CheckCircle size={11}/>Password changed successfully.</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="secondary" onClick={()=>{setShowChangePw(false);setCpError("");setCpSuccess(false);}}>Cancel</Btn>
            <Btn type="submit">Change Password</Btn>
          </div>
        </form>
      </Modal>)}
    </div>
  );
}
