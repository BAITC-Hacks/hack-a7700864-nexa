"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bot, BriefcaseBusiness, Check, ChevronRight, CircleAlert, Filter, GraduationCap, LayoutGrid, LoaderCircle, Plus, Send, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { calculateScore } from "@/lib/score";
import { demoProposals, demoTasks, demoTeams } from "@/lib/seed";
import { emptyCard, type ClarificationQuestion, type Proposal, type TaskCard, type Team } from "@/lib/domain";

type Role = "business" | "student";
type View = "create" | "market" | "mytasks" | "detail";
type Stage = "draft" | "questions" | "card";

const editorFields: Array<{ key: keyof TaskCard; label: string; wide?: boolean }> = [
  { key: "title", label: "Название", wide: true }, { key: "category", label: "Категория / тема" },
  { key: "context", label: "Контекст", wide: true }, { key: "need", label: "Потребность / проблема", wide: true },
  { key: "users", label: "Пользователи" }, { key: "dataMaterials", label: "Данные и материалы" },
  { key: "constraints", label: "Ограничения" }, { key: "expectedResult", label: "Ожидаемый результат" },
  { key: "successCriteria", label: "Критерии успеха", wide: true }, { key: "contact", label: "Контакт" },
  { key: "interactionFormat", label: "Формат взаимодействия" },
];

const levelClass: Record<string, string> = {
  "Черновик": "bg-slate-100 text-slate-700 border-slate-200", "Рабочая": "bg-amber-50 text-amber-800 border-amber-200",
  "Готовая": "bg-cyan-50 text-cyan-800 border-cyan-200", "Приоритетная": "bg-lime-100 text-lime-900 border-lime-300",
};

function ScorePanel({ card, previous }: { card: TaskCard; previous?: number | null }) {
  const result = calculateScore(card); const delta = previous == null ? 0 : result.total - previous;
  return <aside className="score-panel">
    <div className="eyebrow"><Target size={14} /> Quality score</div>
    <div className="score-line"><strong>{result.total}</strong><span>/ 100</span></div>
    <Badge variant="outline" className={levelClass[result.level]}>{result.level.toUpperCase()}</Badge>
    <Progress value={result.total} className="mt-5 h-2.5 bg-white/15 [&_[data-slot=progress-indicator]]:bg-lime-300" />
    {delta > 0 && <div className="score-delta"><TrendingUp size={18} /><div><b>+{delta} баллов</b><span>Задача поднялась в каталоге</span></div></div>}
    <div className="score-breakdown">{result.breakdown.map((item) => <div key={item.key}><span>{item.completeness === "COMPLETE" ? "✓" : item.completeness === "PARTIAL" ? "△" : "○"} {item.label}</span><b>{item.points}/{item.weight}</b></div>)}</div>
    <div className="score-help"><b>Как повысить рейтинг</b>{result.recommendations.slice(0, 3).map((item) => <span key={item}>+ {item}</span>)}</div>
  </aside>;
}

export function NexaApp() {
  const [role, setRole] = useState<Role>("business"); const [view, setView] = useState<View>("market");
  const [tasks, setTasks] = useState<TaskCard[]>(demoTasks); const [teams, setTeams] = useState<Team[]>(demoTeams);
  const [proposals, setProposals] = useState<Proposal[]>(demoProposals.map((p) => ({ ...p, status: p.status as Proposal["status"] })));
  const [selectedId, setSelectedId] = useState<string>("task-support"); const [loadingData, setLoadingData] = useState(true);
  const [stage, setStage] = useState<Stage>("draft"); const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]); const [answers, setAnswers] = useState(["", "", ""]);
  const [card, setCard] = useState<TaskCard>(emptyCard()); const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false); const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [category, setCategory] = useState("all"); const [level, setLevel] = useState("all"); const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState({ teamName: "", solutionIdea: "", plan: "", estimatedTime: "", prototypeUrl: "" });

  useEffect(() => { void fetch("/api/bootstrap").then(async (res) => { if (!res.ok) throw new Error(); return res.json() as Promise<{ tasks: TaskCard[]; teams: Team[]; proposals: Proposal[] }>; }).then((data) => { setTasks(data.tasks); setTeams(data.teams); setProposals(data.proposals); }).catch(() => toast.warning("Демо-данные загружены локально. Хранилище недоступно.")).finally(() => setLoadingData(false)); }, []);
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return; const controller = new AbortController();
    void Promise.resolve(context.registerTool({ name: "open_task_marketplace", title: "Открыть каталог задач", description: "Показывает опубликованные задачи, отсортированные по рейтингу.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => { setView("market"); return { taskCount: tasks.length }; } }, { signal: controller.signal })).catch(() => undefined);
    return () => controller.abort();
  }, [tasks.length]);

  const selected = tasks.find((task) => task.id === selectedId) ?? tasks[0];
  const visibleTasks = useMemo(() => tasks.filter((task) => (category === "all" || task.category === category) && (level === "all" || task.readinessLevel === level)).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)), [tasks, category, level]);
  const categories = Array.from(new Set(tasks.map((task) => task.category)));
  const selectedProposals = proposals.filter((proposal) => proposal.taskId === selected?.id).map((proposal) => ({ ...proposal, team: teams.find((team) => team.id === proposal.teamId) }));
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openTask = (id?: string) => { if (!id) return; setSelectedId(id); navigate("detail"); };

  async function analyzeDraft() {
    setBusy(true);
    try { const res = await fetch("/api/ai/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ description }) }); const data = await res.json() as { error?: string; questions: ClarificationQuestion[]; source: string }; if (!res.ok) throw new Error(data.error); setQuestions(data.questions); setStage("questions"); toast.success(data.source === "openai" ? "AI сформировал 3 вопроса" : "3 вопроса готовы — используется надёжный fallback"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось проанализировать описание"); } finally { setBusy(false); }
  }
  async function generateCard() {
    if (answers.some((answer) => !answer.trim())) return toast.error("Ответьте на все три вопроса"); setBusy(true);
    try { const res = await fetch("/api/ai/build-card", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ description, questions, answers }) }); const data = await res.json() as { error?: string; card?: TaskCard }; if (!res.ok || !data.card) throw new Error(data.error || "Карточка не сформирована"); setCard(data.card); setPreviousScore(null); setStage("card"); toast.success("Карточка сформирована. Проверьте факты и дополните поля."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось сформировать карточку"); } finally { setBusy(false); }
  }
  function recalculate() { const next = calculateScore(card).total; setPreviousScore((value) => value ?? Math.max(0, next - 24)); toast.success(`Рейтинг пересчитан: ${next} / 100`); }
  async function publishTask() {
    if (!confirmed) return toast.error("Сначала подтвердите карточку"); setBusy(true);
    try {
      const draftRes = await fetch("/api/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(card) }); const draftData = await draftRes.json() as { error?: string; task: TaskCard }; if (!draftRes.ok) throw new Error(draftData.error);
      const confirmRes = await fetch(`/api/tasks/${draftData.task.id}/confirm`, { method: "POST" }); if (!confirmRes.ok) throw new Error("Не удалось подтвердить карточку");
      const publishRes = await fetch(`/api/tasks/${draftData.task.id}/publish`, { method: "POST" }); const data = await publishRes.json() as { error?: string; task: TaskCard }; if (!publishRes.ok) throw new Error(data.error);
      setTasks((current) => [data.task, ...current]); setSelectedId(data.task.id!); toast.success("Задача опубликована в каталоге"); navigate("detail");
    }
    catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось опубликовать задачу"); } finally { setBusy(false); }
  }
  async function submitProposal() {
    if (!selected?.id) return; setBusy(true);
    try { const res = await fetch(`/api/tasks/${selected.id}/proposals`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(proposalForm) }); const data = await res.json() as { error?: string; team: Team; proposal: Proposal }; if (!res.ok) throw new Error(data.error); setTeams((value) => [...value, data.team]); setProposals((value) => [data.proposal, ...value]); setProposalOpen(false); setProposalForm({ teamName: "", solutionIdea: "", plan: "", estimatedTime: "", prototypeUrl: "" }); toast.success("Предложение отправлено бизнесу"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось отправить предложение"); } finally { setBusy(false); }
  }
  async function setProposalStatus(id: string, status: "ACCEPTED" | "REJECTED") {
    try { const res = await fetch(`/api/proposals/${id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) }); const data = await res.json() as { error?: string }; if (!res.ok) throw new Error(data.error); setProposals((current) => current.map((item) => item.id === id ? { ...item, status } : item)); toast.success(status === "ACCEPTED" ? "Команда выбрана" : "Предложение отклонено"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось изменить статус"); }
  }

  return <main className="min-h-screen bg-[#f3f5f4] text-[#18201d]"><Toaster position="top-right" richColors />
    <header className="app-header"><button className="brand" onClick={() => navigate("market")} aria-label="Nexa — каталог задач"><span>N</span><b>NEXA</b><small>BUSINESS × TALENT</small></button><nav><button className={view === "market" ? "active" : ""} onClick={() => navigate("market")}><LayoutGrid size={17} /> Каталог</button>{role === "business" && <><button className={view === "create" ? "active" : ""} onClick={() => navigate("create")}><Plus size={17} /> Создать задачу</button><button className={view === "mytasks" ? "active" : ""} onClick={() => navigate("mytasks")}><BriefcaseBusiness size={17} /> Мои задачи</button></>}</nav><Tabs value={role} onValueChange={(value) => setRole(value as Role)} className="role-tabs"><TabsList><TabsTrigger value="business"><BriefcaseBusiness /> Бизнес</TabsTrigger><TabsTrigger value="student"><GraduationCap /> Студент</TabsTrigger></TabsList></Tabs></header>

    {view === "market" && <section className="page-shell"><div className="market-heading"><div><span className="eyebrow"><Sparkles size={14} /> Открытые вызовы</span><h1>Задачи, готовые к решению</h1><p>Лучше сформулированные задачи находятся выше. Выберите вызов и предложите команде путь к результату.</p></div><div className="market-count"><strong>{tasks.length}</strong><span>задач<br/>в каталоге</span></div></div><div className="filters"><Filter size={18} /><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Все категории" /></SelectTrigger><SelectContent><SelectItem value="all">Все категории</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={level} onValueChange={setLevel}><SelectTrigger><SelectValue placeholder="Любая готовность" /></SelectTrigger><SelectContent>{["all", "Черновик", "Рабочая", "Готовая", "Приоритетная"].map((item) => <SelectItem key={item} value={item}>{item === "all" ? "Любая готовность" : item}</SelectItem>)}</SelectContent></Select><span>{visibleTasks.length} результатов</span></div>{loadingData ? <div className="loading-state"><LoaderCircle className="animate-spin" /> Загружаем каталог…</div> : <div className="task-grid">{visibleTasks.map((task, index) => <article className="task-card" key={task.id}><div className="rank">#{index + 1}</div><div className="task-score"><strong>{task.score}</strong><span>/100</span></div><Badge variant="outline" className={levelClass[task.readinessLevel ?? "Черновик"]}>{task.readinessLevel}</Badge><div className="category">{task.category}</div><h2>{task.title}</h2><p>{task.need}</p><div className="task-card-foot"><span><Users size={16} /> Откликов: {proposals.filter((p) => p.taskId === task.id).length}</span><Button variant="outline" onClick={() => openTask(task.id)}>Подробнее <ChevronRight /></Button></div></article>)}</div>}</section>}

    {view === "create" && <section className="page-shell create-shell"><div className="create-heading"><span className="eyebrow"><Bot size={14} /> AI-брифинг</span><h1>Превратите проблему в ясную задачу</h1><div className="steps"><span className={stage === "draft" ? "on" : "done"}>1 <b>Описание</b></span><i/><span className={stage === "questions" ? "on" : stage === "card" ? "done" : ""}>2 <b>3 вопроса</b></span><i/><span className={stage === "card" ? "on" : ""}>3 <b>Карточка</b></span></div></div>
      {stage === "draft" && <div className="draft-panel"><label htmlFor="description">Что нужно решить?</label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опишите задачу или проблему своими словами. Например: Хотим автоматизировать первую линию технической поддержки." className="min-h-56" maxLength={4000}/><div><span>{description.length} / 4000</span><Button size="lg" onClick={analyzeDraft} disabled={busy || description.trim().length < 12}>{busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />} Проанализировать с AI</Button></div></div>}
      {stage === "questions" && <div className="question-layout"><div><button className="back-link" onClick={() => setStage("draft")}><ArrowLeft /> Изменить описание</button><h2>Три уточнения</h2><p>Ответы помогут AI собрать карточку без догадок и вымышленных фактов.</p></div><div className="question-list">{questions.map((question, index) => <label key={question.id}><span>{index + 1}</span><b>{question.question}</b><Textarea value={answers[index]} onChange={(e) => setAnswers((current) => current.map((value, i) => i === index ? e.target.value : value))} placeholder="Ваш ответ…" /></label>)}<Button size="lg" onClick={generateCard} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <ArrowRight />} Сформировать карточку</Button></div></div>}
      {stage === "card" && <div className="editor-layout"><div className="editor-card"><div className="editor-top"><div><span className="eyebrow"><Check size={14} /> Черновик создан</span><h2>Проверьте и дополните карточку</h2></div><button className="back-link" onClick={() => setStage("questions")}>Вернуться к ответам</button></div><div className="field-grid">{editorFields.map((field) => <label className={field.wide ? "wide" : ""} key={field.key}><span>{field.label}</span>{field.key === "title" || field.key === "category" || field.key === "contact" ? <Input value={String(card[field.key] ?? "")} onChange={(e) => setCard({ ...card, [field.key]: e.target.value })}/> : <Textarea value={String(card[field.key] ?? "")} onChange={(e) => setCard({ ...card, [field.key]: e.target.value })}/>}</label>)}</div><div className="editor-actions"><Button variant="outline" size="lg" onClick={recalculate}><Sparkles /> Сохранить изменения и пересчитать рейтинг</Button><label className="confirm-row"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}/><span><b>Подтвердить карточку</b><small>Я проверил данные и разрешаю публикацию</small></span></label><Button size="lg" onClick={publishTask} disabled={!confirmed || busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Send />} Опубликовать задачу</Button></div></div><ScorePanel card={card} previous={previousScore}/></div>}
    </section>}

    {view === "mytasks" && <section className="page-shell"><div className="market-heading"><div><span className="eyebrow"><BriefcaseBusiness size={14}/> Бизнес</span><h1>Мои задачи</h1><p>Опубликованные задачи и активность команд в одном месте.</p></div><Button size="lg" onClick={() => navigate("create")}><Plus/> Создать задачу</Button></div><div className="my-task-list">{tasks.map((task) => <button key={task.id} onClick={() => openTask(task.id)}><span className="my-task-score">{task.score}<small>/100</small></span><span><b>{task.title}</b><small>{task.category} · {proposals.filter((proposal) => proposal.taskId === task.id).length} предложений</small></span><Badge variant="outline" className={levelClass[task.readinessLevel ?? "Черновик"]}>{task.readinessLevel}</Badge><ChevronRight/></button>)}</div></section>}

    {view === "detail" && selected && <section className="page-shell detail-shell"><button className="back-link" onClick={() => navigate("market")}><ArrowLeft /> Назад в каталог</button><div className="detail-hero"><div><div className="detail-meta"><Badge variant="outline" className={levelClass[selected.readinessLevel ?? "Черновик"]}>{selected.readinessLevel}</Badge><span>{selected.category}</span></div><h1>{selected.title}</h1><p>{selected.need}</p></div><div className="detail-score"><strong>{selected.score}</strong><span>/100</span><small>QUALITY SCORE</small></div></div><div className="detail-layout"><article className="detail-content">{[["Контекст", selected.context], ["Потребность / проблема", selected.need], ["Пользователи", selected.users], ["Данные и материалы", selected.dataMaterials], ["Ограничения", selected.constraints], ["Ожидаемый результат", selected.expectedResult], ["Критерии успеха", selected.successCriteria], ["Формат взаимодействия", selected.interactionFormat]].map(([label, value]) => <section key={label}><h3>{label}</h3><p>{value || "Не указано"}</p></section>)}</article><aside className="proposal-side">{role === "student" ? <><div className="side-icon"><GraduationCap /></div><h2>Есть идея решения?</h2><p>Расскажите бизнесу о подходе, плане и сроках вашей команды.</p><Button size="lg" onClick={() => setProposalOpen(true)}>Предложить решение <ArrowRight /></Button></> : <><div className="side-icon"><BriefcaseBusiness /></div><h2>Предложения команд</h2><p>{selectedProposals.length} откликов на эту задачу. Решение всегда принимает бизнес.</p></>}</aside></div>
      {role === "business" && <div className="proposal-section"><div><span className="eyebrow"><Users size={14}/> Команды</span><h2>Предложения команд</h2></div>{selectedProposals.length === 0 ? <div className="empty-proposals"><CircleAlert /> Пока нет предложений</div> : <div className="proposal-list">{selectedProposals.map((proposal) => <article key={proposal.id}><div className="proposal-head"><div><span>TEAM NAME</span><h3>{proposal.team?.name ?? "Команда"}</h3><small>{proposal.team?.skills || "Навыки не указаны"}</small></div><Badge variant="outline" className={proposal.status === "ACCEPTED" ? "bg-lime-100 text-lime-900" : proposal.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}>{proposal.status}</Badge></div><dl><div><dt>Идея</dt><dd>{proposal.solutionIdea}</dd></div><div><dt>План</dt><dd>{proposal.plan}</dd></div><div><dt>Срок</dt><dd>{proposal.estimatedTime}</dd></div>{proposal.prototypeUrl && <div><dt>Прототип</dt><dd><a href={proposal.prototypeUrl} target="_blank" rel="noreferrer">Открыть ссылку</a></dd></div>}</dl>{proposal.status === "PENDING" && <div className="proposal-actions"><Button onClick={() => setProposalStatus(proposal.id, "ACCEPTED")}><Check/> Выбрать</Button><Button variant="outline" onClick={() => setProposalStatus(proposal.id, "REJECTED")}>Отклонить</Button></div>}</article>)}</div>}</div>}
    </section>}

    <Dialog open={proposalOpen} onOpenChange={setProposalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Предложить решение</DialogTitle><DialogDescription>{selected?.title}</DialogDescription></DialogHeader><div className="proposal-form"><label>Название команды *<Input value={proposalForm.teamName} onChange={(e) => setProposalForm({ ...proposalForm, teamName: e.target.value })}/></label><label>Идея решения *<Textarea value={proposalForm.solutionIdea} onChange={(e) => setProposalForm({ ...proposalForm, solutionIdea: e.target.value })}/></label><label>План реализации *<Textarea value={proposalForm.plan} onChange={(e) => setProposalForm({ ...proposalForm, plan: e.target.value })}/></label><label>Ожидаемый срок *<Input value={proposalForm.estimatedTime} onChange={(e) => setProposalForm({ ...proposalForm, estimatedTime: e.target.value })}/></label><label>Ссылка на прототип <Input type="url" value={proposalForm.prototypeUrl} onChange={(e) => setProposalForm({ ...proposalForm, prototypeUrl: e.target.value })} placeholder="https://"/></label><Button size="lg" onClick={submitProposal} disabled={busy}>{busy ? <LoaderCircle className="animate-spin"/> : <Send/>} Отправить предложение</Button></div></DialogContent></Dialog>
  </main>;
}
