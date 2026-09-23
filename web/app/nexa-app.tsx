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
import { calculateScore, savedScoreBaseline, scoreDelta } from "@/lib/score";
import { demoProposals, demoTasks, demoTeams } from "@/lib/seed";
import { emptyCard, type ClarificationQuestion, type Proposal, type TaskCard, type Team } from "@/lib/domain";
import { getHomeDestination, getRoleDestination, type HomeAction } from "@/lib/home-navigation";

type Role = "business" | "student";
type View = "home" | "create" | "market" | "mytasks" | "detail";
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
  const result = calculateScore(card); const change = previous == null ? null : scoreDelta(previous, result.total); const delta = change?.delta ?? 0;
  const incomplete = result.breakdown.filter((item) => item.lostPoints > 0);
  return <aside className="score-panel">
    <div className="eyebrow"><Target size={14} /> Quality score</div>
    <div className="score-line"><strong>{result.total}</strong><span>/ 100</span></div>
    <Badge variant="outline" className={levelClass[result.level]}>{result.level.toUpperCase()}</Badge>
    <Progress value={result.total} className="mt-5 h-2.5 bg-white/15 [&_[data-slot=progress-indicator]]:bg-lime-300" />
    {result.total === 100 ? <div className="score-perfect"><Check size={18}/><b>Все критерии заполнены.</b></div> : <div className="score-gap"><b>До максимума: {100 - result.total} баллов</b>{incomplete.map((item) => <span key={item.key}>{item.label}<strong>−{item.lostPoints}</strong></span>)}</div>}
    {change && <div className={`score-delta ${delta < 0 ? "negative" : delta === 0 ? "neutral" : ""}`}><TrendingUp size={18} /><div><b>{change.label}</b><span>{delta > 0 ? "Задача поднялась в каталоге" : delta < 0 ? "Проверьте потерянные баллы" : `${result.total} / 100`}</span></div></div>}
    <div className="score-breakdown">{result.breakdown.map((item) => item.completeness === "COMPLETE" ? <div className="score-criterion complete" key={item.key}><span>✓ {item.label}</span><b>{item.points} / {item.weight}</b></div> : <details className="score-criterion" key={item.key}><summary><span>{item.completeness === "PARTIAL" ? "△" : "○"} {item.label}</span><span className="criterion-points"><b>{item.points} / {item.weight}</b><em>−{item.lostPoints}</em><small>Что добавить?</small></span></summary><div className="criterion-feedback"><section><b>Что уже засчитано</b>{item.credited.length ? item.credited.map((detail) => <span key={detail}>✓ {detail}</span>) : <span>— Пока ничего</span>}</section><section><b>Чего не хватает</b>{item.missingDetails.map((detail) => <span key={detail}>○ {detail}</span>)}</section><section><b>Как повысить балл</b><p>{item.recommendation}</p></section></div></details>)}</div>
  </aside>;
}

function HomePage({ onStart }: { onStart: (action: HomeAction) => void }) {
  const steps = [
    ["01", "Опишите задачу", "Бизнес описывает потребность обычными словами."],
    ["02", "Ответьте на 3 вопроса", "AI уточняет только недостающую информацию."],
    ["03", "Получите рейтинг", "Карточка получает прозрачную оценку готовности 0–100."],
    ["04", "Опубликуйте", "Чем качественнее задача, тем выше её позиция в каталоге."],
    ["05", "Получите предложения", "Команды самостоятельно выбирают задачи и предлагают решения."],
    ["06", "Выберите команду", "Финальное решение всегда принимает бизнес."],
  ];
  return <section className="home-page">
    <div className="home-hero"><div className="home-copy"><span className="home-kicker">NEXA · BUSINESS × TALENT</span><h1>Хорошо поставленная задача находит свою команду</h1><p>Чем понятнее задача, тем выше её рейтинг и позиция в каталоге — и тем проще командам понять, подходит ли им проект.</p><div className="home-actions"><Button size="lg" onClick={() => onStart("business")}>Разместить задачу <ArrowRight/></Button><Button size="lg" variant="outline" onClick={() => onStart("student")}>Найти задачу <ArrowRight/></Button></div><small>Рейтинг готовности 0–100 · Открытый каталог · Команду выбирает бизнес</small></div><div className="home-demo" aria-label="Мини-демонстрация механики NEXA"><span>Хотим автоматизировать техподдержку</span><i>↓</i><div><b>NEXA AI</b><small>3 уточняющих вопроса</small></div><i>↓</i><div className="demo-score"><small>QUALITY SCORE</small><b>60 <em>→</em> 100</b><strong>+40</strong></div><i>↓</i><span>Опубликовано в Marketplace</span></div></div>
    <div className="home-how"><div><span className="eyebrow"><Sparkles size={14}/> Процесс</span><h2>Как работает NEXA</h2></div><div className="home-steps">{steps.map(([number, title, copy], index) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p>{index < steps.length - 1 && <i>→</i>}</article>)}</div></div>
  </section>;
}

export function NexaApp() {
  const [role, setRole] = useState<Role>("business"); const [view, setView] = useState<View>("home");
  const [tasks, setTasks] = useState<TaskCard[]>(demoTasks); const [myTasks, setMyTasks] = useState<TaskCard[]>(demoTasks); const [teams, setTeams] = useState<Team[]>(demoTeams);
  const [proposals, setProposals] = useState<Proposal[]>(demoProposals.map((p) => ({ ...p, status: p.status as Proposal["status"] })));
  const [selectedId, setSelectedId] = useState<string>("task-support"); const [loadingData, setLoadingData] = useState(true);
  const [stage, setStage] = useState<Stage>("draft"); const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]); const [answers, setAnswers] = useState(["", "", ""]);
  const [card, setCard] = useState<TaskCard>(emptyCard()); const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false); const [dirty, setDirty] = useState(true); const [previousScore, setPreviousScore] = useState<number | null>(null); const [scoreBaseline, setScoreBaseline] = useState<number | null>(null); const [aiSource, setAiSource] = useState<"openai" | "fallback" | null>(null);
  const [category, setCategory] = useState("all"); const [level, setLevel] = useState("all"); const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState({ teamName: "", solutionIdea: "", plan: "", estimatedTime: "", prototypeUrl: "" });

  useEffect(() => { void fetch("/api/bootstrap").then(async (res) => { if (!res.ok) throw new Error(); return res.json() as Promise<{ tasks: TaskCard[]; businessTasks?: TaskCard[]; teams: Team[]; proposals: Proposal[] }>; }).then((data) => { setTasks(data.tasks); setMyTasks(data.businessTasks ?? data.tasks); setTeams(data.teams); setProposals(data.proposals); }).catch(() => toast.warning("Демо-данные загружены локально. Хранилище недоступно.")).finally(() => setLoadingData(false)); }, []);
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return; const controller = new AbortController();
    void Promise.resolve(context.registerTool({ name: "open_task_marketplace", title: "Открыть каталог задач", description: "Показывает опубликованные задачи, отсортированные по рейтингу.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => { setView("market"); return { taskCount: tasks.length }; } }, { signal: controller.signal })).catch(() => undefined);
    return () => controller.abort();
  }, [tasks.length]);

  const selected = tasks.find((task) => task.id === selectedId) ?? myTasks.find((task) => task.id === selectedId) ?? tasks[0];
  const visibleTasks = useMemo(() => tasks.filter((task) => (category === "all" || task.category === category) && (level === "all" || task.readinessLevel === level)).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)), [tasks, category, level]);
  const categories = Array.from(new Set(tasks.map((task) => task.category)));
  const selectedProposals = proposals.filter((proposal) => proposal.taskId === selected?.id).map((proposal) => ({ ...proposal, team: teams.find((team) => team.id === proposal.teamId) }));
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const startHomeFlow = (action: HomeAction) => { const destination = getHomeDestination(action); setRole(destination.role); if (destination.view === "create") setStage("draft"); navigate(destination.view); };
  const switchRole = (nextRole: Role) => {
    const destination = getRoleDestination(nextRole);
    if (nextRole === role && view === destination.view) return;
    const hasUnsavedWork = view === "create" && (stage === "draft" ? description.trim().length > 0 : stage === "questions" ? description.trim().length > 0 || answers.some((answer) => answer.trim().length > 0) : dirty);
    if (hasUnsavedWork && !window.confirm("Есть несохранённые изменения. Переключить режим и потерять их?")) return;
    setRole(destination.role); navigate(destination.view);
  };
  const goHome = () => navigate("home");
  const openTask = (id?: string) => { if (!id) return; setSelectedId(id); navigate("detail"); };

  async function analyzeDraft() {
    setBusy(true);
    try { const res = await fetch("/api/ai/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ description }) }); const data = await res.json() as { error?: string; questions: ClarificationQuestion[]; source: "openai" | "fallback" }; if (!res.ok) throw new Error(data.error); setQuestions(data.questions); setAiSource(data.source); setStage("questions"); toast.success(data.source === "openai" ? "AI сформировал 3 вопроса" : "3 вопроса готовы — используется надёжный fallback"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось проанализировать описание"); } finally { setBusy(false); }
  }
  async function generateCard() {
    if (answers.some((answer) => !answer.trim())) return toast.error("Ответьте на все три вопроса"); setBusy(true);
    try { const res = await fetch("/api/ai/build-card", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ description, questions, answers }) }); const data = await res.json() as { error?: string; card?: TaskCard; source?: "openai" | "fallback" }; if (!res.ok || !data.card) throw new Error(data.error || "Карточка не сформирована"); setCard(data.card); setAiSource(data.source ?? aiSource); setDirty(true); setConfirmed(false); setPreviousScore(null); setScoreBaseline(calculateScore(data.card).total); setStage("card"); toast.success("Карточка сформирована. Проверьте факты и дополните поля."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось сформировать карточку"); } finally { setBusy(false); }
  }
  async function saveAndRecalculate() {
    setBusy(true);
    try {
      const previous = scoreBaseline ?? savedScoreBaseline(card);
      const url = card.id ? `/api/tasks/${card.id}` : "/api/tasks";
      const res = await fetch(url, { method: card.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(card) });
      const data = await res.json() as { error?: string; task?: TaskCard };
      if (!res.ok || !data.task) throw new Error(data.error || "Не удалось сохранить карточку");
      setPreviousScore(previous); setScoreBaseline(data.task.score ?? calculateScore(data.task).total); setCard(data.task); setDirty(false); setConfirmed(false); setMyTasks((current) => [data.task!, ...current.filter((task) => task.id !== data.task!.id)]);
      toast.success(`Карточка сохранена. Рейтинг: ${data.task.score} / 100`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось сохранить карточку"); }
    finally { setBusy(false); }
  }

  async function confirmTask() {
    if (!card.id || dirty) return toast.error("Сначала сохраните изменения и пересчитайте рейтинг");
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${card.id}/confirm`, { method: "POST" });
      const data = await res.json() as { error?: string; task?: TaskCard };
      if (!res.ok || !data.task) throw new Error(data.error || "Не удалось подтвердить карточку");
      setCard(data.task); setConfirmed(true); toast.success("Карточка подтверждена");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось подтвердить карточку"); }
    finally { setBusy(false); }
  }

  async function publishTask() {
    if (!card.id || dirty) return toast.error("Сначала сохраните изменения"); if (!confirmed) return toast.error("Сначала подтвердите карточку"); setBusy(true);
    try {
      const publishRes = await fetch(`/api/tasks/${card.id}/publish`, { method: "POST" }); const data = await publishRes.json() as { error?: string; task: TaskCard }; if (!publishRes.ok) throw new Error(data.error);
      setTasks((current) => [data.task, ...current.filter((task) => task.id !== data.task.id)]); setMyTasks((current) => [data.task, ...current.filter((task) => task.id !== data.task.id)]); setCard(data.task); setSelectedId(data.task.id!); toast.success("Задача опубликована в каталоге"); navigate("detail");
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
    {/* A plain anchor keeps the brand usable even before client hydration. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <header className="app-header"><a href="/" className="brand" onClick={(event) => { event.preventDefault(); goHome(); }} aria-label="NEXA — главная"><span>N</span><b>NEXA</b><small>BUSINESS × TALENT</small></a><nav><button className={view === "market" ? "active" : ""} onClick={() => navigate("market")}><LayoutGrid size={17} /> Каталог</button>{role === "business" && <><button className={view === "create" ? "active" : ""} onClick={() => navigate("create")}><Plus size={17} /> Создать задачу</button><button className={view === "mytasks" ? "active" : ""} onClick={() => navigate("mytasks")}><BriefcaseBusiness size={17} /> Мои задачи</button></>}</nav><Tabs value={role} onValueChange={(value) => switchRole(value as Role)} className="role-tabs"><TabsList><TabsTrigger value="business"><BriefcaseBusiness /> Бизнес</TabsTrigger><TabsTrigger value="student"><GraduationCap /> Студент</TabsTrigger></TabsList></Tabs></header>

    {view === "home" && <HomePage onStart={startHomeFlow}/>}

    {view === "market" && <section className="page-shell"><div className="market-heading"><div><span className="eyebrow"><Sparkles size={14} /> Открытые вызовы</span><h1>Задачи, готовые к решению</h1><p>Лучше сформулированные задачи находятся выше. Выберите вызов и предложите команде путь к результату.</p></div><div className="market-count"><strong>{tasks.length}</strong><span>задач<br/>в каталоге</span></div></div><div className="filters"><Filter size={18} /><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Все категории" /></SelectTrigger><SelectContent><SelectItem value="all">Все категории</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={level} onValueChange={setLevel}><SelectTrigger><SelectValue placeholder="Любая готовность" /></SelectTrigger><SelectContent>{["all", "Черновик", "Рабочая", "Готовая", "Приоритетная"].map((item) => <SelectItem key={item} value={item}>{item === "all" ? "Любая готовность" : item}</SelectItem>)}</SelectContent></Select><span>{visibleTasks.length} результатов</span></div>{loadingData ? <div className="loading-state"><LoaderCircle className="animate-spin" /> Загружаем каталог…</div> : <div className="task-grid">{visibleTasks.map((task, index) => <article className="task-card" key={task.id}><div className="rank">#{index + 1}</div><div className="task-score"><strong>{task.score}</strong><span>/100</span></div><Badge variant="outline" className={levelClass[task.readinessLevel ?? "Черновик"]}>{task.readinessLevel}</Badge><div className="category">{task.category}</div><h2>{task.title}</h2><p>{task.need}</p><div className="task-card-foot"><span><Users size={16} /> Откликов: {proposals.filter((p) => p.taskId === task.id).length}</span><Button variant="outline" onClick={() => openTask(task.id)}>Подробнее <ChevronRight /></Button></div></article>)}</div>}</section>}

    {view === "create" && <section className="page-shell create-shell"><div className="create-heading"><span className="eyebrow"><Bot size={14} /> AI-брифинг</span><h1>Превратите проблему в ясную задачу</h1><div className="steps"><span className={stage === "draft" ? "on" : "done"}>1 <b>Описание</b></span><i/><span className={stage === "questions" ? "on" : stage === "card" ? "done" : ""}>2 <b>3 вопроса</b></span><i/><span className={stage === "card" ? "on" : ""}>3 <b>Карточка</b></span></div></div>
      {stage === "draft" && <div className="draft-panel"><label htmlFor="description">Опишите задачу своими словами</label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Например: Хотим автоматизировать первую линию технической поддержки." className="min-h-56" maxLength={4000}/><div><span>{description.length} / 4000</span><Button size="lg" onClick={analyzeDraft} disabled={busy || description.trim().length < 12}>{busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />} Проанализировать с AI</Button></div></div>}
      {stage === "questions" && <div className="question-layout"><div><button className="back-link" onClick={() => setStage("draft")}><ArrowLeft /> Изменить описание</button><h2>Три уточнения</h2><p>Ответы помогут AI собрать карточку без догадок и вымышленных фактов.</p></div><div className="question-list">{questions.map((question, index) => <label key={question.id}><span>{index + 1}</span><b>{question.question}</b><Textarea value={answers[index]} onChange={(e) => setAnswers((current) => current.map((value, i) => i === index ? e.target.value : value))} placeholder="Ваш ответ…" /></label>)}<Button size="lg" onClick={generateCard} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <ArrowRight />} Сформировать карточку</Button></div></div>}
      {stage === "card" && <div className="editor-layout"><div className="editor-card"><div className="editor-top"><div><span className="eyebrow"><Check size={14} /> Черновик создан {aiSource === "fallback" ? "· FALLBACK" : aiSource === "openai" ? "· OPENAI" : ""}</span><h2>Проверьте и дополните карточку</h2></div><button className="back-link" onClick={() => setStage("questions")}>Вернуться к ответам</button></div><div className="field-grid">{editorFields.map((field) => <label className={field.wide ? "wide" : ""} key={field.key}><span>{field.label}</span>{field.key === "title" || field.key === "category" || field.key === "contact" ? <Input value={String(card[field.key] ?? "")} onChange={(e) => { setCard({ ...card, [field.key]: e.target.value }); setDirty(true); setConfirmed(false); setPreviousScore(null); }}/> : <Textarea value={String(card[field.key] ?? "")} onChange={(e) => { setCard({ ...card, [field.key]: e.target.value }); setDirty(true); setConfirmed(false); setPreviousScore(null); }}/>}</label>)}</div><div className="editor-actions"><Button variant="outline" size="lg" onClick={saveAndRecalculate} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />} Сохранить и пересчитать</Button><Button variant="outline" size="lg" onClick={confirmTask} disabled={busy || dirty || confirmed}><Check /> {confirmed ? "Карточка подтверждена" : "Подтвердить карточку"}</Button><Button size="lg" onClick={publishTask} disabled={!confirmed || dirty || busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Send />} Опубликовать задачу</Button></div></div><ScorePanel card={card} previous={previousScore}/></div>}
    </section>}

    {view === "mytasks" && <section className="page-shell"><div className="market-heading"><div><span className="eyebrow"><BriefcaseBusiness size={14}/> Бизнес</span><h1>Мои задачи</h1><p>Черновики, опубликованные задачи и активность команд в одном месте.</p></div><Button size="lg" onClick={() => navigate("create")}><Plus/> Создать задачу</Button></div><div className="my-task-list">{myTasks.map((task) => <button key={task.id} onClick={() => openTask(task.id)}><span className="my-task-score">{task.score}<small>/100</small></span><span><b>{task.title || "Черновик без названия"}</b><small>{task.category} · {task.published ? "Опубликована" : "Черновик"} · {proposals.filter((proposal) => proposal.taskId === task.id).length} предложений</small></span><Badge variant="outline" className={levelClass[task.readinessLevel ?? "Черновик"]}>{task.readinessLevel}</Badge><ChevronRight/></button>)}</div></section>}

    {view === "detail" && selected && <section className="page-shell detail-shell"><button className="back-link" onClick={() => navigate("market")}><ArrowLeft /> Назад в каталог</button><div className="detail-hero"><div><div className="detail-meta"><Badge variant="outline" className={levelClass[selected.readinessLevel ?? "Черновик"]}>{selected.readinessLevel}</Badge><span>{selected.category}</span></div><h1>{selected.title}</h1><p>{selected.need}</p></div><div className="detail-score"><strong>{selected.score}</strong><span>/100</span><small>QUALITY SCORE</small></div></div><div className="detail-layout"><article className="detail-content">{[["Контекст", selected.context], ["Потребность / проблема", selected.need], ["Пользователи", selected.users], ["Данные и материалы", selected.dataMaterials], ["Ограничения", selected.constraints], ["Ожидаемый результат", selected.expectedResult], ["Критерии успеха", selected.successCriteria], ["Формат взаимодействия", selected.interactionFormat]].map(([label, value]) => <section key={label}><h3>{label}</h3><p>{value || "Не указано"}</p></section>)}</article><aside className="proposal-side">{role === "student" ? <><div className="side-icon"><GraduationCap /></div><h2>Есть идея решения?</h2><p>Расскажите бизнесу о подходе, плане и сроках вашей команды.</p><Button size="lg" onClick={() => setProposalOpen(true)}>Предложить решение <ArrowRight /></Button></> : <><div className="side-icon"><BriefcaseBusiness /></div><h2>Предложения команд</h2><p>{selectedProposals.length} откликов на эту задачу. Решение всегда принимает бизнес.</p></>}</aside></div>
      {role === "business" && <div className="proposal-section"><div><span className="eyebrow"><Users size={14}/> Команды</span><h2>Предложения команд</h2></div>{selectedProposals.length === 0 ? <div className="empty-proposals"><CircleAlert /> Пока нет предложений</div> : <div className="proposal-list">{selectedProposals.map((proposal) => <article key={proposal.id}><div className="proposal-head"><div><span>TEAM NAME</span><h3>{proposal.team?.name ?? "Команда"}</h3><small>{proposal.team?.skills || "Навыки не указаны"}</small></div><Badge variant="outline" className={proposal.status === "ACCEPTED" ? "bg-lime-100 text-lime-900" : proposal.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}>{proposal.status}</Badge></div><dl><div><dt>Идея</dt><dd>{proposal.solutionIdea}</dd></div><div><dt>План</dt><dd>{proposal.plan}</dd></div><div><dt>Срок</dt><dd>{proposal.estimatedTime}</dd></div>{proposal.prototypeUrl && <div><dt>Прототип</dt><dd><a href={proposal.prototypeUrl} target="_blank" rel="noreferrer">Открыть ссылку</a></dd></div>}</dl>{proposal.status === "PENDING" && <div className="proposal-actions"><Button onClick={() => setProposalStatus(proposal.id, "ACCEPTED")}><Check/> Выбрать</Button><Button variant="outline" onClick={() => setProposalStatus(proposal.id, "REJECTED")}>Отклонить</Button></div>}</article>)}</div>}</div>}
    </section>}

    <Dialog open={proposalOpen} onOpenChange={setProposalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Предложить решение</DialogTitle><DialogDescription>{selected?.title}</DialogDescription></DialogHeader><div className="proposal-form"><label>Название команды *<Input value={proposalForm.teamName} onChange={(e) => setProposalForm({ ...proposalForm, teamName: e.target.value })}/></label><label>Идея решения *<Textarea value={proposalForm.solutionIdea} onChange={(e) => setProposalForm({ ...proposalForm, solutionIdea: e.target.value })}/></label><label>План реализации *<Textarea value={proposalForm.plan} onChange={(e) => setProposalForm({ ...proposalForm, plan: e.target.value })}/></label><label>Ожидаемый срок *<Input value={proposalForm.estimatedTime} onChange={(e) => setProposalForm({ ...proposalForm, estimatedTime: e.target.value })}/></label><label>Ссылка на прототип <Input type="url" value={proposalForm.prototypeUrl} onChange={(e) => setProposalForm({ ...proposalForm, prototypeUrl: e.target.value })} placeholder="https://"/></label><Button size="lg" onClick={submitProposal} disabled={busy}>{busy ? <LoaderCircle className="animate-spin"/> : <Send/>} Отправить предложение</Button></div></DialogContent></Dialog>
  </main>;
}
