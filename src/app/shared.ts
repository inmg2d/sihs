import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─── Data version — bump to force-clear old localStorage on next load ─────────
export const DATA_VERSION = "v5-deploy";

// ─── School ───────────────────────────────────────────────────────────────────
export const SCHOOL = { name:"St Isidore High School Ndop", abbr:"SIHS", full:"ST ISIDORE HIGH SCHOOL NDOP (SIHS)", address:"Catholic Church Street, Bamunka-Ndop, NWR", email:"info@sihs-ndop.edu.cm", phone:"+237 677 000 001", year:"2025/26", motto:"Educating the Mind and Heart" };
export const P = "#8B1A1A"; // crimson primary

// ─── Subject categories ───────────────────────────────────────────────────────
export const SUBJECT_CATS = [
  { id:"lang", label:"LANGUAGE & ARTS", short:"LANG & ARTS",
    subs:[{n:"English Language",c:4},{n:"French Language",c:4},{n:"Literatures in English",c:2},{n:"Literatures in French",c:2},{n:"Logic / Philosophy",c:2},{n:"History",c:2},{n:"Ancient Languages",c:1},{n:"National Languages",c:1}] },
  { id:"sci",  label:"SCIENCE & TECH", short:"SCI & TECH",
    subs:[{n:"Biology",c:2},{n:"Chemistry",c:2},{n:"Mathematics",c:4},{n:"Mechanics",c:2},{n:"Physics",c:2},{n:"Human Biology",c:2},{n:"Add. Mathematics",c:2},{n:"Computer Science / I.C.T",c:2}] },
  { id:"soc",  label:"SOCIAL SCIENCES", short:"SOC SCI",
    subs:[{n:"Economics",c:2},{n:"Commerce",c:2},{n:"Geography",c:2},{n:"Geology",c:2},{n:"Food and Nutrition",c:2},{n:"Citizenship",c:2},{n:"Religious Studies",c:2}] },
  { id:"oth",  label:"OTHERS", short:"OTHERS",
    subs:[{n:"Physical Education",c:1},{n:"Manual Labour",c:1},{n:"National Cultures",c:1},{n:"Guidance Counselling",c:1}] },
];
export const ALL_SUBS = SUBJECT_CATS.flatMap(c => c.subs);
export const FORMS = ["Form 1","Form 2","Form 3","Form 4","Form 5","Lower Sixth","Upper Sixth"];
export const TERMS = ["1","2","3"] as const;
export const CAT_COLORS:Record<string,string>={lang:"bg-purple-100 text-purple-800 border-purple-200",sci:"bg-blue-100 text-blue-800 border-blue-200",soc:"bg-amber-100 text-amber-800 border-amber-200",oth:"bg-emerald-100 text-emerald-800 border-emerald-200"};

// ─── Section definitions ───────────────────────────────────────────────────────
export const SECTION_META:{id:string;label:string;short:string;color:string;bg:string;desc:string}[]=[
  {id:"general",label:"General Section",short:"General",color:"#8B1A1A",bg:"#FDF5F5",desc:"Traditional academic education — Arts, Sciences and Social Sciences"},
  {id:"technical",label:"Technical Section",short:"Technical",color:"#1d4ed8",bg:"#EFF6FF",desc:"Technical & vocational education — engineering, trades and applied sciences"},
  {id:"commercial",label:"Commercial Section",short:"Commercial",color:"#b45309",bg:"#FFFBEB",desc:"Business & commerce education — accounting, economics and trade"},
];

// ─── Specialties (Cameroon secondary education streams) ───────────────────────
export const SPECIALTIES:{id:string;label:string;short:string;section:SectionId;color:string}[]=[
  // General Section
  {id:"gen_sci",   label:"Science",           short:"Science",     section:"general",    color:"#0369a1"},
  {id:"gen_arts",  label:"Arts",              short:"Arts",        section:"general",    color:"#7c3aed"},
  {id:"gen_artsci",label:"Arts and Science",  short:"Arts & Sci",  section:"general",    color:"#0891b2"},
  // Technical Section
  {id:"tec_bc",    label:"Building Construction", short:"Bldg Const",  section:"technical",  color:"#b45309"},
  {id:"tec_mm",    label:"Motor Mechanics",        short:"Motor Mech",  section:"technical",  color:"#d97706"},
  {id:"tec_elec",  label:"Electricity",            short:"Electricity", section:"technical",  color:"#c2410c"},
  {id:"tec_ww",    label:"Wood Work",              short:"Wood Work",   section:"technical",  color:"#15803d"},
  {id:"tec_fd",    label:"Fashion Design",         short:"Fashion",     section:"technical",  color:"#be185d"},
  // Commercial Section
  {id:"com_acc",   label:"Accounting",        short:"Accounting",  section:"commercial", color:"#9333ea"},
  {id:"com_mkt",   label:"Marketing",         short:"Marketing",   section:"commercial", color:"#0891b2"},
];

// ─── Exam sequence definitions ────────────────────────────────────────────────
export const SEQ_META:{seqNo:1|2|3|4|5|6;term:Term;seqInTerm:1|2;label:string;short:string}[]=[
  {seqNo:1,term:"1",seqInTerm:1,label:"Sequence 1",short:"Seq 1"},
  {seqNo:2,term:"1",seqInTerm:2,label:"Sequence 2",short:"Seq 2"},
  {seqNo:3,term:"2",seqInTerm:1,label:"Sequence 3",short:"Seq 3"},
  {seqNo:4,term:"2",seqInTerm:2,label:"Sequence 4",short:"Seq 4"},
  {seqNo:5,term:"3",seqInTerm:1,label:"Sequence 5",short:"Seq 5"},
  {seqNo:6,term:"3",seqInTerm:2,label:"Sequence 6",short:"Seq 6"},
];

// ─── Types ────────────────────────────────────────────────────────────────────
export type Role = "superadmin"|"admin"|"teacher";
export type Gender = "M"|"F";
export type AttSt = "present"|"absent"|"late";
export type Term = typeof TERMS[number];
export type Page = "dashboard"|"sections"|"students"|"classes"|"subjects"|"teachers"|"attendance"|"grades"|"exams"|"reportcard"|"finance"|"timetable"|"announcements"|"users"|"session";
export type SectionId = "general"|"technical"|"commercial";

export interface AuthUser { id:string; name:string; role:Role; email:string; }
export interface Student { id:string; studentId:string; name:string; form:string; section:SectionId; specialty:string; gender:Gender; dob:string; parentName:string; parentPhone:string; address:string; enrolledDate:string; status:"active"|"inactive"; registerNo?:string; repeater?:boolean; photo?:string; }
export interface Teacher { id:string; staffId:string; name:string; subjects:string[]; email:string; phone:string; gender:Gender; qualification:string; joinedDate:string; }
export interface PayrollRecord { id:string; teacherId:string; month:string; year:string; baseSalary:number; housingAllowance:number; transportAllowance:number; researchAllowance:number; otherAllowances:number; incomeTax:number; socialSecurity:number; otherDeductions:number; isPaid:boolean; paidDate:string; notes:string; }
export interface Subject { id:string; name:string; code:string; category:"lang"|"sci"|"soc"|"oth"; sections:SectionId[]; specialties:string[]; defaultCoef:number; formCoefs:Record<string,number>; teacherId:string; isActive:boolean; }
export interface ClassRoom { id:string; name:string; form:string; section:SectionId; formTeacherId:string; capacity:number; room:string; year:string; isActive:boolean; }
export interface GradeRecord { id:string; studentId:string; subject:string; term:Term; seq1:number|null; seq2:number|null; coef:number; form:string; year:string; teacherName:string; remark:string; }
export interface AttRecord { id:string; studentId:string; date:string; status:AttSt; form:string; }
export interface Announcement { id:string; title:string; content:string; date:string; author:string; type:"info"|"warning"|"success"; }
export interface CouncilRemark { id:string; studentId:string; term:Term; year:string; attitude:string; conduct:string; principalRemark:string; decision:string; }
export interface FeeStructure {
  id:string; year:string;
  // Universal fees — every student pays these
  admission:number;       // 2,500 FCFA
  health:number;          // 1,000 FCFA
  computer:number;        // 1,000 FCFA
  idCard:number;          // 500 FCFA
  pta:number;             // 1,500 FCFA
  // Tuition — varies by form & section
  tuitionGeneral:number;  // 35,000 FCFA — Form 1-5 General
  tuitionTechCom:number;  // 50,000 FCFA — Form 1-5 Technical/Commercial
  tuitionSixth:number;    // 40,000 FCFA — Lower & Upper Sixth (all sections)
  // Special fees
  labFee:number;          // 15,000 FCFA — L6/U6 Science (gen_sci specialty)
  homeEcFee:number;       // 10,000 FCFA — L6/U6 Home Economics (manual)
}
export interface StudentFeeBreakdown { admission:number; tuition:number; lab:number; homeEc:number; health:number; computer:number; idCard:number; pta:number; discount:number; total:number; }
export interface FeePayment { id:string; studentId:string; year:string; term:Term; amount:number; date:string; method:"cash"|"mobile_money"|"bank"; receiptNo:string; category:string; collectedBy:string; notes:string; }
export interface ExamSequence { id:string; seqNo:1|2|3|4|5|6; term:Term; seqInTerm:1|2; year:string; startDate:string; endDate:string; isActive:boolean; isLocked:boolean; notes:string; }
export interface AppUser { id:string; name:string; email:string; passwordHash:string; role:Role; isActive:boolean; createdAt:string; lastLogin:string; }
export interface StudentFeeOverride { id:string; studentId:string; year:string; admission?:number; tuition?:number; lab?:number; homeEc?:number; health?:number; computer?:number; idCard?:number; pta?:number; discount:number; reason:string; }

// ─── Teacher→Subject mapping ───────────────────────────────────────────────
const TEACHER_MAP:Record<string,string>={
  "English Language":"t1","Literatures in English":"t1","French Language":"t10","Literatures in French":"t10",
  "Mathematics":"t2","Add. Mathematics":"t2","Biology":"t3","Human Biology":"t3",
  "Chemistry":"t4","Physics":"t5","Mechanics":"t5","Computer Science / I.C.T":"t6",
  "History":"t7","Citizenship":"t7","Geography":"t8","Geology":"t8",
  "Food and Nutrition":"t9","Physical Education":"t11","Guidance Counselling":"t12",
  "Logic / Philosophy":"t7","Ancient Languages":"t10","National Languages":"t10",
  "Economics":"t8","Commerce":"t9","Religious Studies":"t12","Citizenship Education":"t12",
  "Manual Labour":"t11","National Cultures":"t11",
};

// ─── Seed: Subjects ───────────────────────────────────────────────────────────
const SUB_SECTIONS:Record<string,SectionId[]>={
  "English Language":["general","technical","commercial"],
  "French Language":["general","technical","commercial"],
  "Mathematics":["general","technical","commercial"],
  "History":["general","commercial"],
  "Geography":["general","commercial"],
  "Biology":["general"],
  "Human Biology":["general"],
  "Chemistry":["general","technical"],
  "Physics":["general","technical"],
  "Mechanics":["technical"],
  "Computer Science / I.C.T":["general","technical","commercial"],
  "Economics":["general","commercial"],
  "Commerce":["commercial"],
  "Food and Nutrition":["commercial","general"],
  "Geology":["general","technical"],
  "Add. Mathematics":["general","technical"],
  "Literatures in English":["general"],
  "Literatures in French":["general"],
  "Logic / Philosophy":["general"],
  "Ancient Languages":["general"],
  "National Languages":["general","technical","commercial"],
  "Citizenship":["general","technical","commercial"],
  "Religious Studies":["general","technical","commercial"],
  "Physical Education":["general","technical","commercial"],
  "Manual Labour":["technical","commercial"],
  "National Cultures":["general","technical","commercial"],
  "Guidance Counselling":["general","technical","commercial"],
};
const ALL_SPEC_IDS=["gen_sci","gen_arts","gen_artsci","tec_bc","tec_mm","tec_elec","tec_ww","tec_fd","com_acc","com_mkt"];
const GEN_ALL=["gen_sci","gen_arts","gen_artsci"];
const TEC_ALL=["tec_bc","tec_mm","tec_elec","tec_ww","tec_fd"];
const COM_ALL=["com_acc","com_mkt"];
const SUB_SPECIALTY_MAP:Record<string,string[]>={
  "English Language":ALL_SPEC_IDS,
  "French Language":ALL_SPEC_IDS,
  "Mathematics":ALL_SPEC_IDS,
  "History":[...GEN_ALL,...COM_ALL],
  "Geography":[...GEN_ALL,...COM_ALL],
  "Biology":["gen_sci","gen_artsci"],
  "Human Biology":["gen_sci","gen_artsci"],
  "Chemistry":["gen_sci","gen_artsci",...TEC_ALL],
  "Physics":["gen_sci","gen_artsci","tec_bc","tec_mm","tec_elec"],
  "Mechanics":["tec_bc","tec_mm","tec_elec","tec_ww"],
  "Computer Science / I.C.T":["gen_sci","gen_artsci","tec_bc","tec_elec",...COM_ALL],
  "Economics":[...GEN_ALL,...COM_ALL],
  "Commerce":COM_ALL,
  "Food and Nutrition":["gen_arts","gen_artsci","tec_fd"],
  "Geology":["gen_sci","gen_artsci","tec_bc"],
  "Add. Mathematics":["gen_sci","gen_artsci","tec_bc","tec_mm","tec_elec"],
  "Literatures in English":["gen_arts","gen_artsci"],
  "Literatures in French":["gen_arts","gen_artsci"],
  "Logic / Philosophy":GEN_ALL,
  "Ancient Languages":["gen_arts"],
  "National Languages":ALL_SPEC_IDS,
  "Citizenship":ALL_SPEC_IDS,
  "Religious Studies":ALL_SPEC_IDS,
  "Physical Education":ALL_SPEC_IDS,
  "Manual Labour":TEC_ALL,
  "National Cultures":ALL_SPEC_IDS,
  "Guidance Counselling":ALL_SPEC_IDS,
};
export const SEED_SUBJECTS: Subject[] = ALL_SUBS.map((sub,i)=>{
  const cat=SUBJECT_CATS.find(c=>c.subs.some(s=>s.n===sub.n))!;
  const words=sub.n.split(/[\s/]+/);
  const code=words.map(w=>w[0]||"").join("").toUpperCase().slice(0,5);
  const sections:SectionId[]=SUB_SECTIONS[sub.n]||["general","technical","commercial"];
  const specialties:string[]=SUB_SPECIALTY_MAP[sub.n]||[];
  return{id:`sub${String(i+1).padStart(2,"0")}`,name:sub.n,code,category:cat.id as any,sections,specialties,defaultCoef:sub.c,formCoefs:Object.fromEntries(FORMS.map(f=>[f,sub.c])),teacherId:TEACHER_MAP[sub.n]||"",isActive:true};
});

// ─── Seed: Classes ────────────────────────────────────────────────────────────
export const SEED_CLASSES: ClassRoom[] = [
  {id:"cls1",name:"Form 1 General",form:"Form 1",section:"general",formTeacherId:"t7",capacity:45,room:"Room 101",year:"2025/26",isActive:true},
  {id:"cls2",name:"Form 2 General",form:"Form 2",section:"general",formTeacherId:"t9",capacity:40,room:"Room 102",year:"2025/26",isActive:true},
  {id:"cls3",name:"Form 3 General",form:"Form 3",section:"general",formTeacherId:"t8",capacity:38,room:"Room 103",year:"2025/26",isActive:true},
  {id:"cls4",name:"Form 4 General",form:"Form 4",section:"general",formTeacherId:"t5",capacity:40,room:"Room 201",year:"2025/26",isActive:true},
  {id:"cls5",name:"Form 5 General",form:"Form 5",section:"general",formTeacherId:"t2",capacity:35,room:"Room 202",year:"2025/26",isActive:true},
  {id:"cls6",name:"Lower Sixth General",form:"Lower Sixth",section:"general",formTeacherId:"t3",capacity:30,room:"Room 203",year:"2025/26",isActive:true},
  {id:"cls7",name:"Upper Sixth General",form:"Upper Sixth",section:"general",formTeacherId:"t1",capacity:25,room:"Room 204",year:"2025/26",isActive:true},
  {id:"cls8",name:"Form 4 Technical",form:"Form 4",section:"technical",formTeacherId:"t5",capacity:35,room:"Room 301",year:"2025/26",isActive:true},
  {id:"cls9",name:"Form 5 Technical",form:"Form 5",section:"technical",formTeacherId:"t6",capacity:30,room:"Room 302",year:"2025/26",isActive:true},
  {id:"cls10",name:"Form 4 Commercial",form:"Form 4",section:"commercial",formTeacherId:"t9",capacity:35,room:"Room 401",year:"2025/26",isActive:true},
  {id:"cls11",name:"Form 5 Commercial",form:"Form 5",section:"commercial",formTeacherId:"t8",capacity:30,room:"Room 402",year:"2025/26",isActive:true},
];

// ─── Seed: Exam Sequences ─────────────────────────────────────────────────────
export const SEED_EXAM_SEQUENCES: ExamSequence[] = [
  {id:"seq1",seqNo:1,term:"1",seqInTerm:1,year:"2025/26",startDate:"2025-10-06",endDate:"2025-10-10",isActive:false,isLocked:true, notes:"First sequence completed"},
  {id:"seq2",seqNo:2,term:"1",seqInTerm:2,year:"2025/26",startDate:"2025-11-17",endDate:"2025-11-21",isActive:false,isLocked:true, notes:"Second sequence completed"},
  {id:"seq3",seqNo:3,term:"2",seqInTerm:1,year:"2025/26",startDate:"2026-02-02",endDate:"2026-02-06",isActive:false,isLocked:false,notes:""},
  {id:"seq4",seqNo:4,term:"2",seqInTerm:2,year:"2025/26",startDate:"2026-03-16",endDate:"2026-03-20",isActive:false,isLocked:false,notes:""},
  {id:"seq5",seqNo:5,term:"3",seqInTerm:1,year:"2025/26",startDate:"2026-05-04",endDate:"2026-05-08",isActive:false,isLocked:false,notes:""},
  {id:"seq6",seqNo:6,term:"3",seqInTerm:2,year:"2025/26",startDate:"2026-06-08",endDate:"2026-06-12",isActive:false,isLocked:false,notes:"Annual Exams"},
];

export const SEED_STUDENTS: Student[] = [];

export const SEED_TEACHERS: Teacher[] = [
  {id:"t1",staffId:"SIHS/STF/001",name:"Mr. Lenfon Armstrong",subjects:["English Language","Literatures in English"],email:"l.armstrong@sihs-edu.org",phone:"+237 679 111 222",gender:"M",qualification:"BA English, University of Buea",joinedDate:"2010-09-01"},
  {id:"t2",staffId:"SIHS/STF/002",name:"Mr. Njimbongweh N.",subjects:["Mathematics","Add. Mathematics"],email:"n.njimbongweh@sihs-edu.org",phone:"+237 650 222 333",gender:"M",qualification:"BSc Mathematics, University of Buea",joinedDate:"2012-09-03"},
  {id:"t3",staffId:"SIHS/STF/003",name:"Mrs. Brenda Bellefeyin",subjects:["Biology","Human Biology"],email:"b.bellefeyin@sihs-edu.org",phone:"+237 677 333 444",gender:"F",qualification:"BSc Biology, HTTC Bambili",joinedDate:"2011-01-15"},
  {id:"t4",staffId:"SIHS/STF/004",name:"Mrs. Tiquafon Valentine",subjects:["Chemistry"],email:"t.valentine@sihs-edu.org",phone:"+237 698 444 555",gender:"F",qualification:"BSc Chemistry, University of Dschang",joinedDate:"2013-09-02"},
  {id:"t5",staffId:"SIHS/STF/005",name:"Mr. Bandin Alphonsa",subjects:["Physics","Mechanics"],email:"b.alphonsa@sihs-edu.org",phone:"+237 651 555 666",gender:"M",qualification:"BSc Physics, University of Bamenda",joinedDate:"2015-09-07"},
  {id:"t6",staffId:"SIHS/STF/006",name:"Mrs. Leifeh Seraphine",subjects:["Computer Science / I.C.T"],email:"l.seraphine@sihs-edu.org",phone:"+237 675 666 777",gender:"F",qualification:"BSc Computer Science, UB",joinedDate:"2014-01-08"},
  {id:"t7",staffId:"SIHS/STF/007",name:"Mr. Vachefor Clifford",subjects:["History","Citizenship"],email:"v.clifford@sihs-edu.org",phone:"+237 670 777 888",gender:"M",qualification:"BA History, University of Ngaoundéré",joinedDate:"2016-09-05"},
  {id:"t8",staffId:"SIHS/STF/008",name:"Mr. Machamptine A.",subjects:["Geography","Geology"],email:"m.acheampong@sihs-edu.org",phone:"+237 699 888 999",gender:"M",qualification:"BA Geography, University of Buea",joinedDate:"2017-09-04"},
  {id:"t9",staffId:"SIHS/STF/009",name:"Mrs. Fiechi Jogette",subjects:["Food and Nutrition"],email:"f.jogette@sihs-edu.org",phone:"+237 652 999 000",gender:"F",qualification:"BSc Home Economics, University of Buea",joinedDate:"2018-09-03"},
  {id:"t10",staffId:"SIHS/STF/010",name:"Mr. Christopher N.",subjects:["Literatures in French","French Language"],email:"c.nkemdirim@sihs-edu.org",phone:"+237 671 000 111",gender:"M",qualification:"Licence FLLA, University of Dschang",joinedDate:"2019-09-02"},
  {id:"t11",staffId:"SIHS/STF/011",name:"Mr. Talla Polinus",subjects:["Physical Education","Manual Labour","National Cultures"],email:"t.polinus@sihs-edu.org",phone:"+237 656 111 222",gender:"M",qualification:"DIPES Physical Education, INJS Yaoundé",joinedDate:"2013-09-02"},
  {id:"t12",staffId:"SIHS/STF/012",name:"Mrs. Beri Jessica",subjects:["Guidance Counselling","Religious Studies"],email:"b.jessica@sihs-edu.org",phone:"+237 677 222 333",gender:"F",qualification:"BA Psychology, University of Bamenda",joinedDate:"2020-09-07"},
];

export const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"] as const;
export const CUR_MONTH=MONTHS[new Date().getMonth()];
export const CUR_YEAR=String(new Date().getFullYear());
export const SEED_PAYROLL: PayrollRecord[] = [];

export const SEED_GRADES: GradeRecord[] = [];

export const SEED_COUNCIL: CouncilRemark[] = [];
export const SEED_ATTENDANCE: AttRecord[] = [];
export const SEED_ANNOUNCEMENTS: Announcement[] = [];
// SIHS official fee schedule — one record per academic year
export const SEED_FEES: FeeStructure[] = [
  {
    id:"fs2526", year:"2025/26",
    // Universal (all students)
    admission:2500, health:1000, computer:1000, idCard:500, pta:1500,
    // Tuition tiers
    tuitionGeneral:35000,   // Form 1–5 General section
    tuitionTechCom:50000,   // Form 1–5 Technical & Commercial sections
    tuitionSixth:40000,     // Lower Sixth & Upper Sixth (all sections)
    // Special fees
    labFee:15000,           // L6/U6 Science students (gen_sci specialty)
    homeEcFee:10000,        // L6/U6 Home Economics students (set via override)
  },
];
export const SEED_STUDENT_FEE_OVERRIDES: StudentFeeOverride[] = [];
export const SEED_PAYMENTS: FeePayment[] = [];

export interface TimetableSlot {
  id: string;
  form: string;
  day: string;
  period: number;
  subjectName: string;
  teacherId: string;
  room?: string;
}

export const PERIODS: {n:number;time:string}[] = [
  {n:1,time:"07:30–08:30"},{n:2,time:"08:30–09:30"},{n:3,time:"09:30–10:30"},
  {n:4,time:"11:00–12:00"},{n:5,time:"12:00–13:00"},
  {n:6,time:"14:00–15:00"},{n:7,time:"15:00–16:00"},
];

export const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

export const SEED_TIMETABLE: TimetableSlot[] = [
  // ─── Form 1 ───
  {id:"tt001",form:"Form 1",day:"Monday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt002",form:"Form 1",day:"Monday",period:2,subjectName:"English Language",teacherId:"t1"},
  {id:"tt003",form:"Form 1",day:"Monday",period:3,subjectName:"Biology",teacherId:"t3"},
  {id:"tt004",form:"Form 1",day:"Monday",period:4,subjectName:"History",teacherId:"t7"},
  {id:"tt005",form:"Form 1",day:"Monday",period:5,subjectName:"Geography",teacherId:"t8"},
  {id:"tt006",form:"Form 1",day:"Tuesday",period:1,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt007",form:"Form 1",day:"Tuesday",period:2,subjectName:"Physics",teacherId:"t5"},
  {id:"tt008",form:"Form 1",day:"Tuesday",period:3,subjectName:"Citizenship",teacherId:"t7"},
  {id:"tt009",form:"Form 1",day:"Tuesday",period:4,subjectName:"Food and Nutrition",teacherId:"t9"},
  {id:"tt010",form:"Form 1",day:"Tuesday",period:5,subjectName:"French Language",teacherId:"t10"},
  {id:"tt011",form:"Form 1",day:"Wednesday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt012",form:"Form 1",day:"Wednesday",period:2,subjectName:"Literatures in English",teacherId:"t1"},
  {id:"tt013",form:"Form 1",day:"Wednesday",period:3,subjectName:"Computer Science / I.C.T",teacherId:"t6"},
  {id:"tt014",form:"Form 1",day:"Wednesday",period:4,subjectName:"Physical Education",teacherId:"t11"},
  {id:"tt015",form:"Form 1",day:"Thursday",period:1,subjectName:"English Language",teacherId:"t1"},
  {id:"tt016",form:"Form 1",day:"Thursday",period:2,subjectName:"Physics",teacherId:"t5"},
  {id:"tt017",form:"Form 1",day:"Thursday",period:3,subjectName:"Manual Labour",teacherId:"t11"},
  {id:"tt018",form:"Form 1",day:"Thursday",period:4,subjectName:"Religious Studies",teacherId:"t12"},
  {id:"tt019",form:"Form 1",day:"Thursday",period:5,subjectName:"Biology",teacherId:"t3"},
  {id:"tt020",form:"Form 1",day:"Friday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt021",form:"Form 1",day:"Friday",period:2,subjectName:"Geography",teacherId:"t8"},
  {id:"tt022",form:"Form 1",day:"Friday",period:3,subjectName:"Food and Nutrition",teacherId:"t9"},
  {id:"tt023",form:"Form 1",day:"Friday",period:4,subjectName:"History",teacherId:"t7"},
  {id:"tt024",form:"Form 1",day:"Friday",period:5,subjectName:"French Language",teacherId:"t10"},
  // ─── Form 2 ───
  {id:"tt025",form:"Form 2",day:"Monday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt026",form:"Form 2",day:"Monday",period:2,subjectName:"English Language",teacherId:"t1"},
  {id:"tt027",form:"Form 2",day:"Monday",period:3,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt028",form:"Form 2",day:"Monday",period:4,subjectName:"History",teacherId:"t7"},
  {id:"tt029",form:"Form 2",day:"Monday",period:5,subjectName:"Geography",teacherId:"t8"},
  {id:"tt030",form:"Form 2",day:"Tuesday",period:1,subjectName:"Biology",teacherId:"t3"},
  {id:"tt031",form:"Form 2",day:"Tuesday",period:2,subjectName:"Physics",teacherId:"t5"},
  {id:"tt032",form:"Form 2",day:"Tuesday",period:3,subjectName:"French Language",teacherId:"t10"},
  {id:"tt033",form:"Form 2",day:"Tuesday",period:4,subjectName:"Computer Science / I.C.T",teacherId:"t6"},
  {id:"tt034",form:"Form 2",day:"Tuesday",period:5,subjectName:"Citizenship",teacherId:"t7"},
  {id:"tt035",form:"Form 2",day:"Wednesday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt036",form:"Form 2",day:"Wednesday",period:2,subjectName:"Literatures in English",teacherId:"t1"},
  {id:"tt037",form:"Form 2",day:"Wednesday",period:3,subjectName:"Physical Education",teacherId:"t11"},
  {id:"tt038",form:"Form 2",day:"Wednesday",period:4,subjectName:"Food and Nutrition",teacherId:"t9"},
  {id:"tt039",form:"Form 2",day:"Thursday",period:1,subjectName:"English Language",teacherId:"t1"},
  {id:"tt040",form:"Form 2",day:"Thursday",period:2,subjectName:"Biology",teacherId:"t3"},
  {id:"tt041",form:"Form 2",day:"Thursday",period:3,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt042",form:"Form 2",day:"Thursday",period:4,subjectName:"Religious Studies",teacherId:"t12"},
  {id:"tt043",form:"Form 2",day:"Friday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt044",form:"Form 2",day:"Friday",period:2,subjectName:"Physics",teacherId:"t5"},
  {id:"tt045",form:"Form 2",day:"Friday",period:3,subjectName:"History",teacherId:"t7"},
  {id:"tt046",form:"Form 2",day:"Friday",period:4,subjectName:"Manual Labour",teacherId:"t11"},
  // ─── Form 3 ───
  {id:"tt047",form:"Form 3",day:"Monday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt048",form:"Form 3",day:"Monday",period:2,subjectName:"English Language",teacherId:"t1"},
  {id:"tt049",form:"Form 3",day:"Monday",period:3,subjectName:"Biology",teacherId:"t3"},
  {id:"tt050",form:"Form 3",day:"Monday",period:4,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt051",form:"Form 3",day:"Monday",period:5,subjectName:"Geography",teacherId:"t8"},
  {id:"tt052",form:"Form 3",day:"Tuesday",period:1,subjectName:"Physics",teacherId:"t5"},
  {id:"tt053",form:"Form 3",day:"Tuesday",period:2,subjectName:"French Language",teacherId:"t10"},
  {id:"tt054",form:"Form 3",day:"Tuesday",period:3,subjectName:"History",teacherId:"t7"},
  {id:"tt055",form:"Form 3",day:"Tuesday",period:4,subjectName:"Computer Science / I.C.T",teacherId:"t6"},
  {id:"tt056",form:"Form 3",day:"Wednesday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt057",form:"Form 3",day:"Wednesday",period:2,subjectName:"Literatures in English",teacherId:"t1"},
  {id:"tt058",form:"Form 3",day:"Wednesday",period:3,subjectName:"Physical Education",teacherId:"t11"},
  {id:"tt059",form:"Form 3",day:"Thursday",period:1,subjectName:"English Language",teacherId:"t1"},
  {id:"tt060",form:"Form 3",day:"Thursday",period:2,subjectName:"Biology",teacherId:"t3"},
  {id:"tt061",form:"Form 3",day:"Thursday",period:3,subjectName:"Citizenship",teacherId:"t7"},
  {id:"tt062",form:"Form 3",day:"Thursday",period:4,subjectName:"Food and Nutrition",teacherId:"t9"},
  {id:"tt063",form:"Form 3",day:"Friday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt064",form:"Form 3",day:"Friday",period:2,subjectName:"Physics",teacherId:"t5"},
  {id:"tt065",form:"Form 3",day:"Friday",period:3,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt066",form:"Form 3",day:"Friday",period:4,subjectName:"History",teacherId:"t7"},
  // ─── Form 4 ───
  {id:"tt067",form:"Form 4",day:"Monday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt068",form:"Form 4",day:"Monday",period:2,subjectName:"English Language",teacherId:"t1"},
  {id:"tt069",form:"Form 4",day:"Monday",period:3,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt070",form:"Form 4",day:"Monday",period:4,subjectName:"Biology",teacherId:"t3"},
  {id:"tt071",form:"Form 4",day:"Tuesday",period:1,subjectName:"Physics",teacherId:"t5"},
  {id:"tt072",form:"Form 4",day:"Tuesday",period:2,subjectName:"French Language",teacherId:"t10"},
  {id:"tt073",form:"Form 4",day:"Tuesday",period:3,subjectName:"Geography",teacherId:"t8"},
  {id:"tt074",form:"Form 4",day:"Tuesday",period:4,subjectName:"Computer Science / I.C.T",teacherId:"t6"},
  {id:"tt075",form:"Form 4",day:"Wednesday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt076",form:"Form 4",day:"Wednesday",period:2,subjectName:"Literatures in English",teacherId:"t1"},
  {id:"tt077",form:"Form 4",day:"Wednesday",period:3,subjectName:"History",teacherId:"t7"},
  {id:"tt078",form:"Form 4",day:"Thursday",period:1,subjectName:"English Language",teacherId:"t1"},
  {id:"tt079",form:"Form 4",day:"Thursday",period:2,subjectName:"Biology",teacherId:"t3"},
  {id:"tt080",form:"Form 4",day:"Thursday",period:3,subjectName:"Physical Education",teacherId:"t11"},
  {id:"tt081",form:"Form 4",day:"Thursday",period:4,subjectName:"Religious Studies",teacherId:"t12"},
  {id:"tt082",form:"Form 4",day:"Friday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt083",form:"Form 4",day:"Friday",period:2,subjectName:"Physics",teacherId:"t5"},
  {id:"tt084",form:"Form 4",day:"Friday",period:3,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt085",form:"Form 4",day:"Friday",period:4,subjectName:"Geography",teacherId:"t8"},
  // ─── Form 5 ───
  {id:"tt086",form:"Form 5",day:"Monday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt087",form:"Form 5",day:"Monday",period:2,subjectName:"English Language",teacherId:"t1"},
  {id:"tt088",form:"Form 5",day:"Monday",period:3,subjectName:"Biology",teacherId:"t3"},
  {id:"tt089",form:"Form 5",day:"Monday",period:4,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt090",form:"Form 5",day:"Tuesday",period:1,subjectName:"Physics",teacherId:"t5"},
  {id:"tt091",form:"Form 5",day:"Tuesday",period:2,subjectName:"French Language",teacherId:"t10"},
  {id:"tt092",form:"Form 5",day:"Tuesday",period:3,subjectName:"Geography",teacherId:"t8"},
  {id:"tt093",form:"Form 5",day:"Tuesday",period:4,subjectName:"History",teacherId:"t7"},
  {id:"tt094",form:"Form 5",day:"Wednesday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt095",form:"Form 5",day:"Wednesday",period:2,subjectName:"Literatures in English",teacherId:"t1"},
  {id:"tt096",form:"Form 5",day:"Wednesday",period:3,subjectName:"Computer Science / I.C.T",teacherId:"t6"},
  {id:"tt097",form:"Form 5",day:"Thursday",period:1,subjectName:"English Language",teacherId:"t1"},
  {id:"tt098",form:"Form 5",day:"Thursday",period:2,subjectName:"Physics",teacherId:"t5"},
  {id:"tt099",form:"Form 5",day:"Thursday",period:3,subjectName:"Biology",teacherId:"t3"},
  {id:"tt100",form:"Form 5",day:"Thursday",period:4,subjectName:"Physical Education",teacherId:"t11"},
  {id:"tt101",form:"Form 5",day:"Friday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt102",form:"Form 5",day:"Friday",period:2,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt103",form:"Form 5",day:"Friday",period:3,subjectName:"History",teacherId:"t7"},
  {id:"tt104",form:"Form 5",day:"Friday",period:4,subjectName:"Geography",teacherId:"t8"},
  // ─── Lower Sixth ───
  {id:"tt105",form:"Lower Sixth",day:"Monday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt106",form:"Lower Sixth",day:"Monday",period:2,subjectName:"English Language",teacherId:"t1"},
  {id:"tt107",form:"Lower Sixth",day:"Monday",period:3,subjectName:"Biology",teacherId:"t3"},
  {id:"tt108",form:"Lower Sixth",day:"Monday",period:4,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt109",form:"Lower Sixth",day:"Tuesday",period:1,subjectName:"Physics",teacherId:"t5"},
  {id:"tt110",form:"Lower Sixth",day:"Tuesday",period:2,subjectName:"French Language",teacherId:"t10"},
  {id:"tt111",form:"Lower Sixth",day:"Tuesday",period:3,subjectName:"Geography",teacherId:"t8"},
  {id:"tt112",form:"Lower Sixth",day:"Tuesday",period:4,subjectName:"Add. Mathematics",teacherId:"t2"},
  {id:"tt113",form:"Lower Sixth",day:"Wednesday",period:1,subjectName:"English Language",teacherId:"t1"},
  {id:"tt114",form:"Lower Sixth",day:"Wednesday",period:2,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt115",form:"Lower Sixth",day:"Wednesday",period:3,subjectName:"Computer Science / I.C.T",teacherId:"t6"},
  {id:"tt116",form:"Lower Sixth",day:"Wednesday",period:4,subjectName:"History",teacherId:"t7"},
  {id:"tt117",form:"Lower Sixth",day:"Thursday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt118",form:"Lower Sixth",day:"Thursday",period:2,subjectName:"Biology",teacherId:"t3"},
  {id:"tt119",form:"Lower Sixth",day:"Thursday",period:3,subjectName:"Literatures in English",teacherId:"t1"},
  {id:"tt120",form:"Lower Sixth",day:"Thursday",period:4,subjectName:"Physics",teacherId:"t5"},
  {id:"tt121",form:"Lower Sixth",day:"Friday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt122",form:"Lower Sixth",day:"Friday",period:2,subjectName:"Geography",teacherId:"t8"},
  {id:"tt123",form:"Lower Sixth",day:"Friday",period:3,subjectName:"Physical Education",teacherId:"t11"},
  {id:"tt124",form:"Lower Sixth",day:"Friday",period:4,subjectName:"Food and Nutrition",teacherId:"t9"},
  // ─── Upper Sixth ───
  {id:"tt125",form:"Upper Sixth",day:"Monday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt126",form:"Upper Sixth",day:"Monday",period:2,subjectName:"English Language",teacherId:"t1"},
  {id:"tt127",form:"Upper Sixth",day:"Monday",period:3,subjectName:"Biology",teacherId:"t3"},
  {id:"tt128",form:"Upper Sixth",day:"Monday",period:4,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt129",form:"Upper Sixth",day:"Tuesday",period:1,subjectName:"Physics",teacherId:"t5"},
  {id:"tt130",form:"Upper Sixth",day:"Tuesday",period:2,subjectName:"Add. Mathematics",teacherId:"t2"},
  {id:"tt131",form:"Upper Sixth",day:"Tuesday",period:3,subjectName:"Geography",teacherId:"t8"},
  {id:"tt132",form:"Upper Sixth",day:"Tuesday",period:4,subjectName:"French Language",teacherId:"t10"},
  {id:"tt133",form:"Upper Sixth",day:"Wednesday",period:1,subjectName:"English Language",teacherId:"t1"},
  {id:"tt134",form:"Upper Sixth",day:"Wednesday",period:2,subjectName:"Chemistry",teacherId:"t4"},
  {id:"tt135",form:"Upper Sixth",day:"Wednesday",period:3,subjectName:"History",teacherId:"t7"},
  {id:"tt136",form:"Upper Sixth",day:"Wednesday",period:4,subjectName:"Computer Science / I.C.T",teacherId:"t6"},
  {id:"tt137",form:"Upper Sixth",day:"Thursday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt138",form:"Upper Sixth",day:"Thursday",period:2,subjectName:"Biology",teacherId:"t3"},
  {id:"tt139",form:"Upper Sixth",day:"Thursday",period:3,subjectName:"Literatures in English",teacherId:"t1"},
  {id:"tt140",form:"Upper Sixth",day:"Thursday",period:4,subjectName:"Physics",teacherId:"t5"},
  {id:"tt141",form:"Upper Sixth",day:"Friday",period:1,subjectName:"Mathematics",teacherId:"t2"},
  {id:"tt142",form:"Upper Sixth",day:"Friday",period:2,subjectName:"Geography",teacherId:"t8"},
  {id:"tt143",form:"Upper Sixth",day:"Friday",period:3,subjectName:"Physical Education",teacherId:"t11"},
  {id:"tt144",form:"Upper Sixth",day:"Friday",period:4,subjectName:"Biology",teacherId:"t3"},
];

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export function hashPw(pw:string):string{
  let h=5381;
  for(let i=0;i<pw.length;i++){h=((h<<5)+h+pw.charCodeAt(i))&0xffffffff;}
  return(h>>>0).toString(36)+btoa(pw.slice(0,3)+":sihs").replace(/=/g,"");
}
export function checkPw(pw:string,hash:string):boolean{return hashPw(pw)===hash;}

export const DEFAULT_USERS:AppUser[]=[
  {id:"u0",name:"Rev. Fr. Principal",email:"principal@sihs-ndop.edu.cm",passwordHash:hashPw("Principal@2025"),role:"superadmin",isActive:true,createdAt:"2025-09-01",lastLogin:""},
  {id:"u1",name:"Mr. Emmanuel Fonkeng",email:"admin@sihs-ndop.edu.cm",passwordHash:hashPw("Admin@2025"),role:"admin",isActive:true,createdAt:"2025-09-01",lastLogin:""},
  {id:"u2",name:"Mr. Lenfon Armstrong",email:"teacher@sihs-ndop.edu.cm",passwordHash:hashPw("Teacher@2025"),role:"teacher",isActive:true,createdAt:"2025-09-01",lastLogin:""},
];
export function canAccess(user:AuthUser, minRole:"teacher"|"admin"|"superadmin"):boolean{
  const order:Role[]=["teacher","admin","superadmin"];
  return order.indexOf(user.role)>=order.indexOf(minRole);
}

// ─── DB & helpers ─────────────────────────────────────────────────────────────
export function dbGet<T>(k:string,seed:T):T{try{const r=localStorage.getItem("sihs_"+k);return r?JSON.parse(r):seed;}catch{return seed;}}
export function dbSet<T>(k:string,v:T){localStorage.setItem("sihs_"+k,JSON.stringify(v));}
export function uid(){return Math.random().toString(36).slice(2,10);}
export function termAvg(g:GradeRecord):number|null{if(g.seq1===null||g.seq2===null)return null;return Math.round(((g.seq1+g.seq2)/2)*10)/10;}
export function totalMks(g:GradeRecord):number|null{const a=termAvg(g);return a===null?null:Math.round(a*g.coef*10)/10;}
export function remarkFor(avg:number|null):string{if(avg===null)return"";if(avg>=16)return"Very Good";if(avg>=12)return"Good";if(avg>=10)return"Average";if(avg>=8)return"Can Do Better";return"Can Improve";}
export function remColor(rem:string):string{if(rem==="Very Good")return"#16a34a";if(rem==="Good")return"#1C1A17";if(rem==="Average")return"#92400e";return"#dc2626";}
export function fmtDate(d:string){if(!d)return"—";return new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});}
export function inits(name:string){return name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();}
export function fmtCfa(n:number){return n.toLocaleString("fr-FR")+" FCFA";}
export function getSubjectCoef(name:string,form:string,subjects:Subject[]):number{
  const s=subjects.find(x=>x.name===name);
  if(s&&s.formCoefs[form]!==undefined)return s.formCoefs[form];
  return ALL_SUBS.find(s=>s.n===name)?.c??1;
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────
export function addPdfHeader(doc:jsPDF,title:string,sub:string){
  doc.setFillColor(139,26,26);doc.rect(0,0,210,18,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(11);doc.setFont("helvetica","bold");doc.text(SCHOOL.full,14,8);
  doc.setFontSize(7);doc.setFont("helvetica","normal");doc.text(SCHOOL.address+" | "+SCHOOL.email,14,13);
  doc.setTextColor(200,150,12);doc.setFontSize(8);doc.setFont("helvetica","bold");doc.text("SIHS",196,10,{align:"right"});
  doc.setTextColor(30,30,30);doc.setFontSize(11);doc.setFont("helvetica","bold");doc.text(title,14,26);
  doc.setFontSize(8);doc.setFont("helvetica","normal");doc.setTextColor(100,100,100);doc.text(sub,14,32);
  doc.setDrawColor(200,150,12);doc.setLineWidth(0.5);doc.line(14,34,196,34);
}

export function exportReportCardPDF(student:Student,grades:GradeRecord[],council:CouncilRemark|undefined,term:Term,year:string,students:Student[],subjects:Subject[]){
  const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  addPdfHeader(doc,`ACADEMIC REPORT — TERM ${term}`,`${student.name.toUpperCase()} | ${student.form} | ${year}`);
  const info=[["Student Name",student.name],["Student ID",student.studentId],["Class/Form",student.form],["Academic Year",year],["Register No.",student.registerNo||"—"],["Repeater",student.repeater?"Yes":"No"]];
  autoTable(doc,{startY:38,margin:{left:14,right:14},styles:{fontSize:8,cellPadding:2},body:info.reduce((rows:any[],item,i)=>i%2===0?[...rows,[...item,...(info[i+1]||[])]]:rows,[]),didParseCell:(d:any)=>{if(d.column.index%2===0)d.cell.styles.fillColor=[240,240,240];}});
  const gMap:Record<string,GradeRecord>={};grades.filter(g=>g.studentId===student.id&&g.term===term&&g.year===year).forEach(g=>{gMap[g.subject]=g;});
  let grand=0,gCoef=0;const rows:any[]=[];
  SUBJECT_CATS.forEach(cat=>{
    rows.push([{content:cat.label,colSpan:8,styles:{fillColor:[245,220,220],fontStyle:"bold",textColor:[139,26,26],fontSize:8}}]);
    cat.subs.forEach(sub=>{
      const g=gMap[sub.n];const avg=g?termAvg(g):null;const tot=g?totalMks(g):null;const coef=getSubjectCoef(sub.n,student.form,subjects);
      if(tot!==null){grand+=tot;gCoef+=coef;}
      const rc=g&&(g.remark==="Can Improve"||g.remark==="Can Do Better")?[200,50,50]:[20,20,20];
      rows.push([sub.n,g?.seq1!=null?Number(g.seq1).toFixed(1):"—",g?.seq2!=null?Number(g.seq2).toFixed(1):"—",avg!=null?avg.toFixed(1):"—",g?coef:"—",tot!=null?tot.toFixed(1):"—",g?.remark||"—",g?.teacherName||"—"].map((v,i)=>i>=1&&i<=6?{content:v,styles:{textColor:rc,halign:"center"}}:{content:v,styles:{textColor:[20,20,20]}}));
    });
  });
  const tAvgOv=gCoef>0?Math.round((grand/gCoef)*10)/10:null;
  const classTotals=students.filter(s=>s.form===student.form&&s.status==="active").map(s=>{let tot=0,coef=0;grades.filter(g=>g.studentId===s.id&&g.term===term&&g.year===year).forEach(g=>{const t=totalMks(g);if(t!==null){tot+=t;coef+=g.coef;}});return{id:s.id,avg:coef>0?tot/coef:0};}).sort((a,b)=>b.avg-a.avg);
  const pos=classTotals.findIndex(c=>c.id===student.id)+1;
  const startY=(doc as any).lastAutoTable?.finalY??38;
  autoTable(doc,{startY:startY+2,margin:{left:14,right:14},head:[["Subject","Seq 1","Seq 2","Term Avg","Coef","Total","Remark","Teacher"]],body:rows,styles:{fontSize:7.5,cellPadding:2},headStyles:{fillColor:[139,26,26],textColor:[255,255,255],fontStyle:"bold"},columnStyles:{0:{cellWidth:44},1:{cellWidth:12,halign:"center"},2:{cellWidth:12,halign:"center"},3:{cellWidth:14,halign:"center"},4:{cellWidth:9,halign:"center"},5:{cellWidth:14,halign:"center"},6:{cellWidth:22,halign:"center"},7:{cellWidth:36}}});
  const y2=(doc as any).lastAutoTable?.finalY??150;
  autoTable(doc,{startY:y2+3,margin:{left:14,right:14},body:[[{content:"TERM AVERAGE",styles:{fontStyle:"bold"}},{content:tAvgOv?.toFixed(2)||"—",styles:{fontStyle:"bold",textColor:[139,26,26],halign:"center"}},{content:"TOTAL",styles:{fontStyle:"bold"}},{content:String(Math.round(grand)),styles:{halign:"center"}},{content:"POSITION",styles:{fontStyle:"bold"}},{content:pos>0?`${pos}/${classTotals.length}`:"—",styles:{halign:"center"}},{content:"DECISION",styles:{fontStyle:"bold"}},{content:council?.decision||"PENDING",styles:{fontStyle:"bold",halign:"center"}}]],styles:{fontSize:9,cellPadding:3,fillColor:[252,242,242]}});
  const y3=(doc as any).lastAutoTable?.finalY??165;
  if(council)autoTable(doc,{startY:y3+3,margin:{left:14,right:14},head:[["CLASS COUNCIL REMARKS"]],body:[["Attitude: "+council.attitude],["Conduct: "+council.conduct],["Principal: "+council.principalRemark]],headStyles:{fillColor:[139,26,26],textColor:[255,255,255]},styles:{fontSize:8,cellPadding:2.5}});
  const pg=doc.getNumberOfPages();for(let i=1;i<=pg;i++){doc.setPage(i);doc.setFontSize(7);doc.setTextColor(150);doc.text(`${SCHOOL.full} | Generated ${new Date().toLocaleDateString("en-GB")} | Page ${i}/${pg}`,105,290,{align:"center"});}
  doc.save(`Report_Card_${student.name.replace(/\s+/g,"_")}_Term${term}.pdf`);
}

export function exportAnnualReportPDF(student:Student,grades:GradeRecord[],council:CouncilRemark[],year:string,students:Student[],subjects:Subject[]){
  const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  addPdfHeader(doc,`ANNUAL EXAMINATION REPORT`,`${student.name.toUpperCase()} | ${student.form} | ${year}`);
  const rows:any[]=[];let grandAnnual=0,grandCoef=0;
  // Only show subjects the student actually has grades for in this year
  const takenSubjects=new Set(grades.filter(g=>g.studentId===student.id&&g.year===year).map(g=>g.subject));
  SUBJECT_CATS.forEach(cat=>{
    const activeSubs=cat.subs.filter(sub=>takenSubjects.has(sub.n));
    if(activeSubs.length===0)return; // skip empty categories entirely
    rows.push([{content:cat.label,colSpan:7,styles:{fillColor:[245,220,220],fontStyle:"bold",textColor:[139,26,26],fontSize:8}}]);
    activeSubs.forEach(sub=>{
      const termAvgs:Array<number|null>=["1","2","3"].map(t=>{const g=grades.find(g=>g.studentId===student.id&&g.subject===sub.n&&g.term===t as Term&&g.year===year);return g?termAvg(g):null;});
      const coef=getSubjectCoef(sub.n,student.form,subjects);
      const defined=termAvgs.filter((a):a is number=>a!==null);
      const annualAvg=defined.length>0?Math.round((defined.reduce((a,b)=>a+b,0)/defined.length)*100)/100:null;
      const annualTot=annualAvg!==null?Math.round(annualAvg*coef*100)/100:null;
      if(annualTot!==null){grandAnnual+=annualTot;grandCoef+=coef;}
      const rc=annualAvg!==null&&annualAvg<10?[200,50,50]:[20,20,20];
      rows.push([sub.n,...termAvgs.map(a=>a!=null?a.toFixed(2):"—"),coef,annualAvg!=null?annualAvg.toFixed(2):"—",annualTot!=null?annualTot.toFixed(2):"—"].map((v,i)=>i>=1?{content:v,styles:{halign:"center",textColor:rc}}:{content:v}));
    });
  });
  if(rows.length===0)rows.push([{content:"No grades recorded for this student in "+year,colSpan:7,styles:{fontStyle:"italic",textColor:[150,150,150],halign:"center"}}]);
  const annualGrandAvg=grandCoef>0?Math.round((grandAnnual/grandCoef)*100)/100:null;
  const classTotals=students.filter(s=>s.form===student.form&&s.status==="active").map(s=>{let tot=0,coef=0;["1","2","3"].forEach(t=>{grades.filter(g=>g.studentId===s.id&&g.term===t as Term&&g.year===year).forEach(g=>{const a=termAvg(g);if(a!==null){tot+=a*g.coef;coef+=g.coef;}});});return{id:s.id,avg:coef>0?tot/coef:0};}).sort((a,b)=>b.avg-a.avg);
  const pos=classTotals.findIndex(c=>c.id===student.id)+1;
  const annualCouncil=council.find(c=>c.studentId===student.id&&c.term==="3"&&c.year===year)||council.find(c=>c.studentId===student.id&&c.year===year);
  autoTable(doc,{startY:38,margin:{left:14,right:14},head:[["Subject","Term 1","Term 2","Term 3","Coef","Annual Avg","Total"]],body:rows,styles:{fontSize:8,cellPadding:2.5},headStyles:{fillColor:[139,26,26],textColor:[255,255,255],fontStyle:"bold",fontSize:8},columnStyles:{0:{cellWidth:58},1:{cellWidth:16,halign:"center"},2:{cellWidth:16,halign:"center"},3:{cellWidth:16,halign:"center"},4:{cellWidth:12,halign:"center"},5:{cellWidth:22,halign:"center"},6:{cellWidth:22,halign:"center"}}});
  const y2=(doc as any).lastAutoTable?.finalY??160;
  autoTable(doc,{startY:y2+3,margin:{left:14,right:14},body:[[{content:"ANNUAL AVERAGE",styles:{fontStyle:"bold"}},{content:annualGrandAvg?.toFixed(2)||"—",styles:{fontStyle:"bold",textColor:[139,26,26],halign:"center"}},{content:"GRAND TOTAL",styles:{fontStyle:"bold"}},{content:Math.round(grandAnnual).toString(),styles:{halign:"center"}},{content:"POSITION",styles:{fontStyle:"bold"}},{content:pos>0?`${pos}/${classTotals.length}`:"—",styles:{halign:"center"}},{content:"DECISION",styles:{fontStyle:"bold"}},{content:annualCouncil?.decision||"PENDING",styles:{fontStyle:"bold",halign:"center"}}]],styles:{fontSize:9,cellPadding:3,fillColor:[252,242,242]}});
  if(annualCouncil){const y3=(doc as any).lastAutoTable?.finalY??180;autoTable(doc,{startY:y3+3,margin:{left:14,right:14},head:[["ANNUAL COUNCIL REMARKS"]],body:[["Attitude: "+annualCouncil.attitude],["Conduct: "+annualCouncil.conduct],["Principal: "+annualCouncil.principalRemark]],headStyles:{fillColor:[139,26,26],textColor:[255,255,255]},styles:{fontSize:8,cellPadding:2.5}});}
  const pg=doc.getNumberOfPages();for(let i=1;i<=pg;i++){doc.setPage(i);doc.setFontSize(7);doc.setTextColor(150);doc.text(`${SCHOOL.full} | Annual Report ${year} | Page ${i}/${pg}`,105,290,{align:"center"});}
  doc.save(`Annual_Report_${student.name.replace(/\s+/g,"_")}_${year.replace("/","_")}.pdf`);
}

export function exportGradesExcel(form:string,term:Term,year:string,students:Student[],grades:GradeRecord[],subjects:Subject[]){
  const classStudents=students.filter(s=>s.form===form&&s.status==="active");
  const header=["Reg No","Student Name",...ALL_SUBS.map(s=>s.n+" (Avg)"),"Grand Total","Coef","Term Avg","Rank"];
  const rows=classStudents.map(s=>{
    const gMap:Record<string,GradeRecord>={};grades.filter(g=>g.studentId===s.id&&g.term===term&&g.year===year).forEach(g=>{gMap[g.subject]=g;});
    let grand=0,coef=0;
    const vals=ALL_SUBS.map(sub=>{const g=gMap[sub.n];const avg=g?termAvg(g):null;const c=getSubjectCoef(sub.n,form,subjects);if(avg!=null){grand+=avg*c;coef+=c;}return avg!=null?avg:"-";});
    return[s.registerNo||"",s.name,...vals,Math.round(grand),coef,coef>0?Math.round((grand/coef)*10)/10:"-",""];
  });
  const ranked=[...rows].map((r,i)=>({idx:i,avg:typeof r[r.length-2]==="number"?r[r.length-2]:0})).sort((a,b)=>b.avg-a.avg);
  ranked.forEach((r,pos)=>{rows[r.idx][rows[r.idx].length-1]=pos+1;});
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,`${form} T${term}`);
  XLSX.writeFile(wb,`Grades_${form.replace(/\s/g,"_")}_Term${term}.xlsx`);
}

export function exportPaymentsExcel(payments:FeePayment[],students:Student[]){
  const header=["Receipt No","Student","Class","Date","Amount (FCFA)","Method","Term","Category","Collected By","Notes"];
  const rows=[...payments].sort((a,b)=>b.date.localeCompare(a.date)).map(p=>{const s=students.find(st=>st.id===p.studentId);return[p.receiptNo,s?.name||"Unknown",s?.form||"",fmtDate(p.date),p.amount,p.method,`Term ${p.term}`,p.category,p.collectedBy,p.notes];});
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Payments");
  XLSX.writeFile(wb,`SIHS_Payments_${new Date().toISOString().slice(0,10)}.xlsx`);
}

export function exportOutstandingExcel(students:Student[],payments:FeePayment[],fees:FeeStructure[],year:string){
  const fs=fees.find(f=>f.year===year);
  function tot(s:Student){return fs?computeStudentFees(s,fs).total:0;}
  function paid(sid:string){return payments.filter(p=>p.studentId===sid&&p.year===year).reduce((s,p)=>s+p.amount,0);}
  const header=["Student","Class","Total Fees","Paid","Balance","Status"];
  const rows=students.filter(s=>s.status==="active").map(s=>{const t=tot(s);const p=paid(s.id);const b=t-p;return[s.name,s.form,t,p,Math.max(b,0),b<=0?"Paid":p>0?"Partial":"Unpaid"];}).sort((a,b)=>(b[4] as number)-(a[4] as number));
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Outstanding");
  XLSX.writeFile(wb,`SIHS_Outstanding_${year.replace("/","_")}.xlsx`);
}

// Compute per-student fee breakdown from the year's fee schedule + any override
export function computeStudentFees(student:Student,fs:FeeStructure,ov?:StudentFeeOverride):StudentFeeBreakdown{
  const isSixth=student.form==="Lower Sixth"||student.form==="Upper Sixth";
  const isTechCom=!isSixth&&(student.section==="technical"||student.section==="commercial");
  const baseTuition=isSixth?fs.tuitionSixth:isTechCom?fs.tuitionTechCom:fs.tuitionGeneral;
  const baseLab=isSixth&&student.specialty==="gen_sci"?fs.labFee:0;
  const admission=ov?.admission??fs.admission;
  const tuition=ov?.tuition??baseTuition;
  const lab=ov?.lab??baseLab;
  const homeEc=ov?.homeEc??0;
  const health=ov?.health??fs.health;
  const computer=ov?.computer??fs.computer;
  const idCard=ov?.idCard??fs.idCard;
  const pta=ov?.pta??fs.pta;
  const discount=ov?.discount??0;
  return{admission,tuition,lab,homeEc,health,computer,idCard,pta,discount,total:Math.max(0,admission+tuition+lab+homeEc+health+computer+idCard+pta-discount)};
}

export function exportAccountabilityExcel(students:Student[],payments:FeePayment[],fees:FeeStructure[],overrides:StudentFeeOverride[],year:string){
  function tot(s:Student){const fs=fees.find(f=>f.year===year);if(!fs)return 0;const ov=overrides.find(o=>o.studentId===s.id&&o.year===year);return computeStudentFees(s,fs,ov).total;}
  function paid(sid:string){return payments.filter(p=>p.studentId===sid&&p.year===year).reduce((a,p)=>a+p.amount,0);}
  const yearPays=payments.filter(p=>p.year===year);
  const active=students.filter(s=>s.status==="active");
  const totalExp=active.reduce((a,s)=>a+tot(s),0);
  const totalCol=yearPays.reduce((a,p)=>a+p.amount,0);
  const rate=totalExp>0?`${Math.round(totalCol/totalExp*100)}%`:"N/A";
  const sumRows=[["Academic Year",year],["Active Students",active.length],["Expected Revenue (FCFA)",totalExp],["Total Collected (FCFA)",totalCol],["Outstanding (FCFA)",Math.max(0,totalExp-totalCol)],["Collection Rate",rate]];
  const payRows=[...yearPays].sort((a,b)=>b.date.localeCompare(a.date)).map(p=>{const s=students.find(st=>st.id===p.studentId);return[p.receiptNo||"",s?.name||"?",s?.form||"",fmtDate(p.date),p.amount,p.method.replace("_"," "),`Term ${p.term}`,p.category||"",p.collectedBy||"",p.notes||""];});
  const outRows=active.map(s=>{const t=tot(s);const p=paid(s.id);const b=t-p;const ov=overrides.find(o=>o.studentId===s.id&&o.year===year);return[s.name,s.form,t,p,Math.max(0,b),b<=0?"Paid":p>0?"Partial":"Unpaid",ov?"Yes":"No",ov?.reason||""];}).sort((a,b)=>(b[4] as number)-(a[4] as number));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Metric","Value"],...sumRows]),"Summary");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Receipt","Student","Class","Date","Amount","Method","Term","Category","Collected By","Notes"],...payRows]),"Payments");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Student","Class","Total Due","Paid","Balance","Status","Override","Reason"],...outRows]),"Outstanding");
  XLSX.writeFile(wb,`SIHS_Finance_Accountability_${year.replace("/","_")}.xlsx`);
}

export function exportAttendanceExcel(form:string,students:Student[],attendance:AttRecord[]){
  const classStudents=students.filter(s=>s.form===form&&s.status==="active");
  const dates=[...new Set(attendance.filter(a=>a.form===form).map(a=>a.date))].sort();
  const rows=classStudents.map(s=>[s.name,...dates.map(d=>{const a=attendance.find(at=>at.studentId===s.id&&at.date===d);return a?a.status[0].toUpperCase():"—";})]);
  const ws=XLSX.utils.aoa_to_sheet([["Student Name",...dates],...rows]);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,`Att_${form}`);
  XLSX.writeFile(wb,`Attendance_${form.replace(/\s/g,"_")}.xlsx`);
}

export function exportSubjectsExcel(subjects:Subject[],teachers:Teacher[]){
  const header=["Code","Subject Name","Category","Default Coef",...FORMS.map(f=>`Coef (${f})`),"Teacher","Status"];
  const rows=subjects.map(s=>{const t=teachers.find(x=>x.id===s.teacherId);return[s.code,s.name,s.category.toUpperCase(),s.defaultCoef,...FORMS.map(f=>s.formCoefs[f]??s.defaultCoef),t?.name||"Unassigned",s.isActive?"Active":"Inactive"];});
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Subjects");
  XLSX.writeFile(wb,`SIHS_Subjects_${SCHOOL.year.replace("/","_")}.xlsx`);
}

export function exportClassesExcel(classes:ClassRoom[],students:Student[],teachers:Teacher[]){
  const header=["Class Name","Form","Room","Form Teacher","Capacity","Enrolled","Year","Status"];
  const rows=classes.map(c=>{const t=teachers.find(x=>x.id===c.formTeacherId);const enrolled=students.filter(s=>s.form===c.form&&s.status==="active").length;return[c.name,c.form,c.room,t?.name||"Unassigned",c.capacity,enrolled,c.year,c.isActive?"Active":"Inactive"];});
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Classes");
  XLSX.writeFile(wb,`SIHS_Classes_${SCHOOL.year.replace("/","_")}.xlsx`);
}
