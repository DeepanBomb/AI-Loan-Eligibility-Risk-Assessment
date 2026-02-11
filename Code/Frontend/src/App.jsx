import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, Loader2, Database,
  ArrowRight, Info, Scale, RefreshCcw, Calculator, ArrowLeft,
  User, Briefcase, Landmark, ClipboardList, Wallet, PieChart,
  History, Percent, TrendingUp
} from 'lucide-react';

// --- DATASET MAPPING ---
const DATASETS = {
  lending_rules: {
    age_limits: { min: 21, max: 60 },
    credit_bands: [
      { band: "excellent", min: 750, score: 50 },
      { band: "good", min: 700, score: 35 },
      { band: "acceptable", min: 650, score: 20 },
      { band: "reject", min: 0, score: 0 }
    ],
    emi_income_ratio: [
      { category: "safe", threshold: 0.4, score: 50 },
      { category: "review", threshold: 0.5, score: 25 },
      { category: "reject", threshold: 1.0, score: 0 }
    ]
  },
  thresholds: { approve: 70, review: [40, 70], reject: 40 },
  products: [
    { type: "Personal", max: 1500000, min_t: 12, max_t: 60 },
    { type: "Education", max: 2000000, min_t: 24, max_t: 120 },
    { type: "Housing", max: 8000000, min_t: 60, max_t: 360 },
    { type: "Vehicle", max: 1000000, min_t: 12, max_t: 84 }
  ]
};

// --- HELPER COMPONENT (Defined outside to prevent focus loss) ---
const Page = ({ children, title, subtitle, onNext, onBack, nextLabel = "Next Step", disabled = false }) => (
  <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-6 duration-500">
    <div className="mb-8">
      <h2 className="text-4xl font-black text-white tracking-tight mb-2">{title}</h2>
      <p className="text-slate-400 font-medium text-sm tracking-wide">{subtitle}</p>
      <div className="h-1.5 w-24 bg-blue-600 rounded-full mt-4 shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
    </div>
    <div className="flex-1 glass shadow-2xl rounded-[3rem] p-10 border border-white/5 mb-8">
      {children}
    </div>
    <div className="flex justify-between items-center px-4">
      {onBack ? (
        <button
          onClick={onBack}
          className="text-slate-500 font-black text-xs tracking-[0.2em] flex items-center gap-2 hover:text-white transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> PREVIOUS
        </button>
      ) : <div />}
      <button
        onClick={onNext}
        disabled={disabled}
        className="bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase flex items-center gap-3 shadow-xl shadow-blue-900/40 hover:bg-blue-500 disabled:opacity-10 transition-all hover:scale-[1.02]"
      >
        {nextLabel} <ArrowRight size={18} />
      </button>
    </div>
  </div>
);

const App = () => {
  const [stage, setStage] = useState('WELCOME');
  const [applicant, setApplicant] = useState({
    name: '', age: '', gender: 'M',
    employmentType: 'Salaried', employmentYears: '',
    income: '', creditScore: '', existingEmi: '', existingLoansCount: '',
    loanAmount: '', loanType: 'Personal', tenure: ''
  });
  const [assessment, setAssessment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // --- LOGIC ENGINE ---
  const calculateEMI = (principal, months, annualRate = 0.10) => {
    const r = annualRate / 12;
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  const runAssessment = () => {
    setIsProcessing(true);
    let score = 0;
    const steps = [];

    setTimeout(() => {
      // 1. Core Eligibility
      const ageVal = parseInt(applicant.age);
      const ageValid = ageVal >= DATASETS.lending_rules.age_limits.min && ageVal <= DATASETS.lending_rules.age_limits.max;
      steps.push({ label: 'Age Verification', status: ageValid ? 'pass' : 'fail', detail: `${ageVal} yrs (${DATASETS.lending_rules.age_limits.min}-60 required)` });

      const prod = DATASETS.products.find(p => p.type === applicant.loanType);
      const loanAmt = parseFloat(applicant.loanAmount);
      const amountValid = loanAmt <= prod.max;
      steps.push({ label: 'Amount Compliance', status: amountValid ? 'pass' : 'fail', detail: `$${loanAmt.toLocaleString()} requested (Max: $${prod.max.toLocaleString()})` });

      const tenureVal = parseInt(applicant.tenure);
      const tenureValid = tenureVal >= prod.min_t && tenureVal <= prod.max_t;
      steps.push({ label: 'Tenure Compliance', status: tenureValid ? 'pass' : 'fail', detail: `${tenureVal} months requested (${prod.min_t}-${prod.max_t} allowed)` });

      // 2. Risk Evaluation
      const cs = parseInt(applicant.creditScore);
      const band = DATASETS.lending_rules.credit_bands.find(b => cs >= b.min) || DATASETS.lending_rules.credit_bands[3];
      score += band.score;
      steps.push({ label: 'Credit Integrity', status: band.score >= 35 ? 'pass' : band.score > 0 ? 'warn' : 'fail', detail: `Score ${cs} (${band.band.toUpperCase()} band). Weight: +${band.score}` });

      // 3. Financial Capacity
      const newEmi = calculateEMI(loanAmt, tenureVal);
      const totalObligation = parseFloat(applicant.existingEmi || 0) + newEmi;
      const dti = totalObligation / parseFloat(applicant.income);
      const dtiRule = DATASETS.lending_rules.emi_income_ratio.find(r => dti <= r.threshold) || { category: 'reject', score: 0 };

      score += dtiRule.score;
      steps.push({ label: 'Debt-to-Income', status: dti <= 0.4 ? 'pass' : dti <= 0.5 ? 'warn' : 'fail', detail: `Ratio: ${(dti * 100).toFixed(1)}% (Threshold: 40%). Weight: +${dtiRule.score}` });

      // Final Decision Logic
      let decision = 'REVIEW';
      if (!ageValid || !amountValid || !tenureValid || score < DATASETS.thresholds.reject) decision = 'REJECTED';
      else if (score >= DATASETS.thresholds.approve) decision = 'APPROVED';

      setAssessment({
        decision, score, steps, dti: (dti * 100).toFixed(1),
        newEmi: newEmi.toFixed(0), totalObligation: totalObligation.toFixed(0)
      });
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 lg:p-12 font-sans flex flex-col overflow-x-hidden selection:bg-blue-500/30">
      <style>{`
        .glass { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(24px); }
        .input-base { 
            background: rgba(2, 6, 23, 0.6); 
            border: 2px solid rgba(255,255,255,0.05); 
            border-radius: 1.5rem; 
            padding-top: 1.25rem;
            padding-bottom: 1.25rem;
            padding-right: 1.5rem;
            padding-left: 1.5rem;
            width: 100%; 
            transition: all 0.2s; 
            font-size: 1.125rem; 
            font-weight: 700; 
            color: white; 
        }
        .input-base:focus { border-color: #2563eb; outline: none; background: rgba(2, 6, 23, 0.9); box-shadow: 0 0 20px rgba(37,99,235,0.1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .assessment-card { transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>

      {/* Header */}
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center mb-16">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Compliance Hub</h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.4em] uppercase mt-1">Lending Lifecycle Management</p>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          {['IDENTITY', 'FINANCIALS', 'LIABILITIES', 'REQUEST'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`text-[9px] font-black px-4 py-2 rounded-full border transition-all ${stage === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 text-slate-500'}`}>{s}</span>
              {i < 3 && <div className="w-4 h-[1px] bg-white/10" />}
            </div>
          ))}
        </div>
        <button onClick={() => window.location.reload()} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-slate-500 hover:text-white"><RefreshCcw size={20} /></button>
      </div>

      {stage === 'WELCOME' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-blue-500/10 shadow-inner">
            <Calculator className="text-blue-500" size={48} />
          </div>
          <h2 className="text-7xl font-black text-white tracking-tighter mb-4 leading-tight">Smart Loan <br /> Compliance Bot</h2>
          <p className="text-slate-400 max-w-lg text-lg mb-12 font-medium leading-relaxed">Quantify your risk and eligibility through our transparent, dataset-driven compliance engine. Pure logic, zero inference.</p>
          <button onClick={() => setStage('IDENTITY')} className="bg-blue-600 px-16 py-7 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all flex items-center gap-5">BEGIN ASSESSMENT <ArrowRight /></button>
        </div>
      )}

      {stage === 'IDENTITY' && (
        <Page
          title="Applicant Identity"
          subtitle="Define basic demographics to initiate the evaluation lifecycle."
          onNext={() => setStage('FINANCIALS')}
          disabled={!applicant.name || !applicant.age}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Applicant Legal Name</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={20} />
                <input
                  autoFocus
                  className="input-base !pl-16"
                  value={applicant.name}
                  onChange={e => setApplicant({ ...applicant, name: e.target.value })}
                  placeholder="e.g. Johnathan Doe"
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Age</label>
              <input
                type="number"
                className="input-base"
                value={applicant.age}
                onChange={e => setApplicant({ ...applicant, age: e.target.value })}
                placeholder="21 - 60"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender Identification</label>
              <select
                className="input-base appearance-none cursor-pointer"
                value={applicant.gender}
                onChange={e => setApplicant({ ...applicant, gender: e.target.value })}
              >
                <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
              </select>
            </div>
          </div>
        </Page>
      )}

      {stage === 'FINANCIALS' && (
        <Page
          title="Income & Employment"
          subtitle="Assessment of current cashflow and stability metrics."
          onBack={() => setStage('IDENTITY')}
          onNext={() => setStage('LIABILITIES')}
          disabled={!applicant.income || !applicant.employmentYears}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Employment Category</label>
              <div className="relative">
                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={20} />
                <select className="input-base !pl-16 appearance-none" value={applicant.employmentType} onChange={e => setApplicant({ ...applicant, employmentType: e.target.value })}>
                  <option value="Salaried">Salaried Employee</option><option value="Self-Employed">Self-Employed / Business</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tenure in Occupation (Years)</label>
              <input type="number" className="input-base" value={applicant.employmentYears} onChange={e => setApplicant({ ...applicant, employmentYears: e.target.value })} placeholder="e.g. 5" />
            </div>
            <div className="space-y-4 md:col-span-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Gross Revenue / Salary ($)</label>
              <div className="relative">
                <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={20} />
                <input type="number" className="input-base !pl-16 font-black" value={applicant.income} onChange={e => setApplicant({ ...applicant, income: e.target.value })} />
              </div>
            </div>
          </div>
        </Page>
      )}

      {stage === 'LIABILITIES' && (
        <Page
          title="Liability & Bureau Profile"
          subtitle="Critical checks on existing debt burden and creditworthiness."
          onBack={() => setStage('FINANCIALS')}
          onNext={() => setStage('REQUEST')}
          disabled={applicant.existingEmi === '' || applicant.existingLoansCount === '' || !applicant.creditScore}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Monthly EMI Outflow ($)</label>
              <input type="number" className="input-base" value={applicant.existingEmi} onChange={e => setApplicant({ ...applicant, existingEmi: e.target.value })} placeholder="0 if no current loans" />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Active Loan Count</label>
              <input type="number" className="input-base" value={applicant.existingLoansCount} onChange={e => setApplicant({ ...applicant, existingLoansCount: e.target.value })} placeholder="e.g. 2" />
            </div>
            <div className="space-y-4 md:col-span-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">TransUnion / Equifax Credit Score</label>
              <div className="relative">
                <Landmark className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={20} />
                <input type="number" className="input-base !pl-16" value={applicant.creditScore} onChange={e => setApplicant({ ...applicant, creditScore: e.target.value })} placeholder="300 - 850" />
              </div>
            </div>
          </div>
        </Page>
      )}

      {stage === 'REQUEST' && (
        <Page
          title="Loan Objectives"
          subtitle="Final configuration of requested product and repayment terms."
          onBack={() => setStage('LIABILITIES')}
          nextLabel="ANALYZE COMPLIANCE"
          onNext={() => { setStage('ASSESSMENT'); runAssessment(); }}
          disabled={!applicant.loanAmount || !applicant.tenure}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Product Category</label>
              <select className="input-base appearance-none" value={applicant.loanType} onChange={e => setApplicant({ ...applicant, loanType: e.target.value })}>
                {DATASETS.products.map(p => <option key={p.type} value={p.type}>{p.type} Loan</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Required Principal Sum ($)</label>
              <input type="number" className="input-base" value={applicant.loanAmount} onChange={e => setApplicant({ ...applicant, loanAmount: e.target.value })} />
            </div>
            <div className="space-y-4 md:col-span-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Repayment Tenure (Months)</label>
              <div className="relative">
                <History className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={20} />
                <input type="number" className="input-base !pl-16" value={applicant.tenure} onChange={e => setApplicant({ ...applicant, tenure: e.target.value })} placeholder="Months" />
              </div>
            </div>
          </div>
        </Page>
      )}

      {stage === 'ASSESSMENT' && (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-1000">
          {isProcessing ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative">
                <Loader2 size={80} className="text-blue-600 animate-spin mb-8" />
                <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" size={24} />
              </div>
              <h3 className="text-4xl font-black uppercase tracking-tighter">Running Risk Models</h3>
              <p className="text-slate-500 text-xs font-bold tracking-[0.4em] uppercase mt-4 animate-pulse">Checking threshold violations from LENDING_RULES.JSON</p>
            </div>
          ) : assessment && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-0">

              {/* Sidebar: Result Summary */}
              <div className="lg:col-span-4 space-y-8">
                <div className={`p-12 rounded-[4rem] border shadow-2xl flex flex-col items-center text-center transition-all duration-700 ${assessment.decision === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5' :
                  assessment.decision === 'REJECTED' ? 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/5' : 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/5'
                  }`}>
                  <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl ${assessment.decision === 'APPROVED' ? 'bg-emerald-500 shadow-emerald-500/40' :
                    assessment.decision === 'REJECTED' ? 'bg-rose-500 shadow-rose-500/40' : 'bg-amber-500 shadow-amber-500/40'
                    }`}>
                    {assessment.decision === 'APPROVED' ? <CheckCircle2 size={48} className="text-white" /> :
                      assessment.decision === 'REJECTED' ? <XCircle size={48} className="text-white" /> : <AlertCircle size={48} className="text-white" />}
                  </div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Final Policy Decision</h4>
                  <div className={`text-7xl font-black uppercase tracking-tighter ${assessment.decision === 'APPROVED' ? 'text-emerald-400' :
                    assessment.decision === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                    }`}>{assessment.decision}</div>

                  <div className="mt-12 grid grid-cols-2 gap-6 w-full">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Risk Index</div>
                      <div className="text-3xl font-black">{assessment.score}</div>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">DTI Flow</div>
                      <div className="text-3xl font-black">{assessment.dti}%</div>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-[3.5rem] p-10 border border-white/5 space-y-8 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wallet size={18} className="text-blue-500" /> Monthly Exposure</h5>
                    <Percent size={16} className="text-slate-700" />
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">Est. New EMI</span>
                      <span className="text-4xl font-black text-blue-400 leading-none">${parseInt(assessment.newEmi).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-t border-white/5">
                      <span className="text-xs text-slate-500 font-bold uppercase">Combined Load</span>
                      <span className="text-lg font-black text-white">${parseInt(assessment.totalObligation).toLocaleString()} / month</span>
                    </div>
                    <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest text-center">
                      Amortization calculated at 10% Fixed APR
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content: Deep Reasoning */}
              <div className="lg:col-span-8 flex flex-col glass rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="px-12 py-10 border-b border-white/5 bg-white/5 flex gap-12">
                  {['summary', 'details'].map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`text-xs font-black uppercase tracking-[0.3em] pb-3 border-b-2 transition-all ${activeTab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-600'
                        }`}
                    >
                      {t === 'summary' ? 'Decision Reasoning' : 'Compliance Audit Trail'}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                  {activeTab === 'summary' ? (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="p-12 bg-blue-600/5 border border-blue-500/20 rounded-[3.5rem] shadow-inner relative overflow-hidden group">
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-6 text-blue-400">
                            <Info size={28} />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Executive Compliance Log</span>
                          </div>
                          <p className="text-4xl font-black leading-[1.1] tracking-tight text-white mb-8">
                            "The system detected {assessment.decision === 'REJECTED' ? 'multiple threshold violations' : 'satisfactory risk alignment'} during logic verification."
                          </p>
                          <div className="p-8 bg-black/40 rounded-3xl border border-white/5 italic text-lg text-slate-300 leading-relaxed font-medium">
                            {assessment.decision === 'APPROVED'
                              ? "Statistical confidence in creditworthiness and debt capacity exceeds the 70% automated approval bar. Applicant demonstrates high financial resilience."
                              : assessment.decision === 'REJECTED'
                                ? "Critical safety thresholds (DTI > 40% or Age Caps) were breached. Policy prohibits automated success for this risk profile."
                                : "The profile falls within the standard manual review band (40-70%). Contradictory risk signals require human underwriter escalation."}
                          </div>
                        </div>
                        <TrendingUp className="absolute -right-16 -bottom-16 text-blue-500/5 transition-transform group-hover:scale-110" size={320} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10">
                          <h6 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-3"><PieChart size={18} className="text-indigo-400" /> Financial Liquidity</h6>
                          <div className="space-y-6">
                            <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest"><span>Existing Debt</span><span className="text-lg font-black text-white">${applicant.existingEmi}</span></div>
                            <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest"><span>New Liability</span><span className="text-lg font-black text-white">${assessment.newEmi}</span></div>
                            <div className="h-[1px] bg-white/10 my-4" />
                            <div className="flex justify-between items-center text-md font-black text-blue-400 uppercase tracking-tighter"><span>Total Burden</span><span className="text-2xl">${assessment.totalObligation}</span></div>
                          </div>
                        </div>
                        <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 flex flex-col justify-center">
                          <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest mb-5"><span>Reject &lt; 40</span><span>Approve &gt; 70</span></div>
                          <div className="h-6 bg-slate-950 rounded-full flex overflow-hidden border border-white/5 shadow-inner">
                            <div className="h-full bg-rose-500/80 transition-all duration-1000" style={{ width: '40%' }} />
                            <div className="h-full bg-amber-500/80 transition-all duration-1000" style={{ width: '30%' }} />
                            <div className="h-full bg-emerald-500/80 transition-all duration-1000" style={{ width: '30%' }} />
                          </div>
                          <div className="mt-8 text-xs font-bold text-slate-500 uppercase leading-relaxed text-center tracking-widest opacity-60">Calculated Risk Probability Matrix</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="flex items-center gap-3 mb-6 text-slate-500 font-black text-xs uppercase tracking-[0.3em]"><ClipboardList size={20} /> Compliance Checkpoints</div>
                      {assessment.steps.map((s, i) => (
                        <div key={i} className="flex items-center gap-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/[0.08] transition-all group">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${s.status === 'pass' ? 'bg-emerald-500/10 text-emerald-400' :
                            s.status === 'warn' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                            {s.status === 'pass' ? <CheckCircle2 size={28} /> :
                              s.status === 'warn' ? <AlertCircle size={28} /> : <XCircle size={28} />}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">{s.label}</div>
                            <p className="text-lg text-slate-400 font-semibold tracking-tight">{s.detail}</p>
                          </div>
                          <div className="text-[10px] font-black text-slate-700 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">POLICY_NODE_0{i + 1}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-12 py-10 bg-slate-900/60 flex justify-between items-center border-t border-white/5">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Auditor Link</span></div>
                    <div className="w-[1px] h-4 bg-white/10" />
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Trace ID: {Math.random().toString(36).substr(2, 10).toUpperCase()}</div>
                  </div>
                  <button
                    onClick={() => setStage('WELCOME')}
                    className="bg-white/10 px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-3"
                  >
                    NEW APPLICATION <ArrowRight size={16} />
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;