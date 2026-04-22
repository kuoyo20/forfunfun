import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Copy, Check, Send, Loader2, BookmarkPlus, Trash2, Sparkles, Eye, Plus, X, RefreshCw } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { loadTemplates, saveTemplate, deleteTemplate, type InterviewTemplate } from "@/lib/templates";
import { TOPIC_PRESETS, findPreset } from "@/lib/topicPresets";
import { toast } from "sonner";
import { API } from "@/lib/config";

const DIFFICULTY_OPTIONS = [
  { value: "junior" as const, label: "初階", description: "0-2 年經驗" },
  { value: "mid" as const, label: "中階", description: "2-5 年經驗" },
  { value: "senior" as const, label: "資深", description: "5 年以上經驗" },
];

export default function CreateInterview() {
  const [position, setPosition] = useState("");
  const [difficulty, setDifficulty] = useState("mid");
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [timeLimitMin, setTimeLimitMin] = useState(15);
  const [perQuestionSec, setPerQuestionSec] = useState(180);
  const [linkValidDays, setLinkValidDays] = useState(7);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [resumeData, setResumeData] = useState<{ fileName: string; text: string } | null>(null);
  const [jdData, setJdData] = useState<{ fileName: string; text: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; token: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTpl, setShowSaveTpl] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewQs, setPreviewQs] = useState<string[] | null>(null);

  useEffect(() => { setTemplates(loadTemplates()); }, []);

  const applyTemplate = (tpl: InterviewTemplate) => {
    setPosition(tpl.position);
    setDifficulty(tpl.difficulty);
    setMaxQuestions(tpl.maxQuestions);
    setTimeLimitMin(tpl.timeLimitMin);
    setPerQuestionSec(tpl.perQuestionSec);
    setLinkValidDays(tpl.linkValidDays);
    setSelectedTopics(tpl.topics);
    if (tpl.jdText) setJdData({ fileName: "套用範本", text: tpl.jdText });
    toast.success(`已套用範本「${tpl.name}」`);
  };

  const applyPreset = (presetId: string) => {
    const preset = findPreset(presetId);
    if (!preset) return;
    setSelectedTopics(preset.topics);
    setActivePreset(presetId);
    toast.success(`已套用「${preset.label}」主題組`);
  };

  const addTopic = (topic: string) => {
    const t = topic.trim();
    if (!t) return;
    if (selectedTopics.includes(t)) return;
    setSelectedTopics([...selectedTopics, t]);
    setActivePreset(null);
  };

  const removeTopic = (topic: string) => {
    setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    setActivePreset(null);
  };

  const handleCustomTopicKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTopic(customTopic);
      setCustomTopic("");
    }
  };

  const autoExtract = async () => {
    if (!resumeData?.text && !jdData?.text) {
      toast.error("請先上傳履歷或 JD");
      return;
    }
    setExtracting(true);
    setExtracted(false);
    try {
      const res = await fetch(`${API}/api/ai/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resumeData?.text, jdText: jdData?.text }),
      });
      const data = await res.json();

      if (data.candidateName && !candidateName) setCandidateName(data.candidateName);
      if (data.candidateEmail && !candidateEmail) setCandidateEmail(data.candidateEmail);
      if (data.position && !position) setPosition(data.position);
      if (data.suggestedDifficulty) setDifficulty(data.suggestedDifficulty);
      if (data.suggestedTopics && selectedTopics.length === 0) {
        setSelectedTopics(data.suggestedTopics);
      }
      setExtracted(true);
      toast.success("AI 已自動填入資訊，請確認後調整");
    } catch {
      toast.error("抽取失敗");
    } finally {
      setExtracting(false);
    }
  };

  // 上傳後自動抽取
  useEffect(() => {
    if ((resumeData || jdData) && !extracted && !extracting && !position) {
      // 延遲觸發避免 UI 卡頓
      const t = setTimeout(() => autoExtract(), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, jdData]);

  const previewAI = async () => {
    if (!position.trim()) {
      toast.error("請先填寫職位");
      return;
    }
    setPreviewing(true);
    try {
      const res = await fetch(`${API}/api/ai/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: position.trim(),
          difficulty,
          topics: selectedTopics,
          resumeText: resumeData?.text,
          jdText: jdData?.text,
          count: 5,
        }),
      });
      const data = await res.json();
      setPreviewQs(data.questions ?? []);
    } catch {
      toast.error("預覽失敗");
    } finally {
      setPreviewing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim()) return;
    setCreating(true);

    try {
      const res = await fetch(`${API}/api/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: position.trim(),
          difficulty,
          maxQuestions,
          timeLimitMin,
          perQuestionSec,
          linkValidDays,
          topics: selectedTopics,
          candidateName: candidateName.trim() || null,
          candidateEmail: candidateEmail.trim() || null,
          resumeText: resumeData?.text || null,
          resumeFileName: resumeData?.fileName || null,
          jdText: jdData?.text || null,
          jdFileName: jdData?.fileName || null,
        }),
      });
      const data = await res.json();
      const link = `${window.location.origin}/interview/${data.token}`;
      setCreated({ id: data.id, token: data.token, link });
    } catch {
      toast.error("建立失敗");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async () => {
    if (!created) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`${API}/api/email/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: created.id }),
      });
      const data = await res.json();
      setEmailSent(true);
      if (!data.ok && data.link) {
        navigator.clipboard.writeText(data.link);
        toast.info("SMTP 未設定，已將面試連結複製到剪貼簿");
      } else {
        toast.success("邀請信已寄出");
      }
    } catch {
      toast.error("發送失敗");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !position.trim()) {
      toast.error("請先填寫職位與範本名稱");
      return;
    }
    saveTemplate({
      name: templateName.trim(),
      position: position.trim(),
      difficulty,
      topics: selectedTopics,
      maxQuestions,
      timeLimitMin,
      perQuestionSec,
      linkValidDays,
      jdText: jdData?.text,
    });
    setTemplates(loadTemplates());
    setTemplateName("");
    setShowSaveTpl(false);
    toast.success("範本已儲存");
  };

  const removeTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(loadTemplates());
  };

  // 成功畫面
  if (created) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="text-center space-y-3 py-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">面試已建立</h1>
          <p className="text-sm text-muted-foreground">複製連結或寄送 Email 給候選人</p>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">面試連結</label>
            <div className="flex gap-2">
              <input readOnly value={created.link} className="flex-1 rounded-lg border bg-muted px-3 py-2 text-sm" />
              <button onClick={copyLink} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "已複製" : "複製"}
              </button>
            </div>
          </div>
          {candidateEmail && (
            <button onClick={sendEmail} disabled={sendingEmail || emailSent}
              className={cn("w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                emailSent ? "bg-green-100 text-green-700" : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}>
              {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {emailSent ? "已寄送" : "寄送面試邀請"}
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setCreated(null); setEmailSent(false); }}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm hover:bg-accent transition-colors">
            建立另一場面試
          </button>
          <Link to="/" className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm text-center hover:bg-primary/90 transition-colors">
            回到管理頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">建立面試</h1>
          <p className="text-sm text-muted-foreground mt-1">上傳履歷與職缺說明，讓 AI 幫你抽取資訊並建立面試連結</p>
        </div>
        <Link to="/bulk" className="text-sm text-primary hover:underline whitespace-nowrap">批量建立 →</Link>
      </div>

      {/* 範本選單 */}
      {templates.length > 0 && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">套用已儲存的範本</div>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl) => (
              <div key={tpl.id} className="group inline-flex items-center gap-1 rounded-full border bg-card pl-3 pr-1 py-0.5">
                <button type="button" onClick={() => applyTemplate(tpl)} className="text-xs hover:text-primary transition-colors">
                  {tpl.name}
                </button>
                <button type="button" onClick={() => removeTemplate(tpl.id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-6">
        {/* 上傳文件 */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">上傳文件</h2>
            {(resumeData || jdData) && (
              <button
                type="button"
                onClick={autoExtract}
                disabled={extracting}
                className="flex items-center gap-1.5 rounded-lg bg-purple-100 text-purple-700 px-3 py-1.5 text-xs font-medium hover:bg-purple-200 transition-colors"
              >
                {extracting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {extracting ? "AI 分析中..." : "AI 重新抽取"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload label="履歷" onUploaded={(data) => setResumeData(data.fileName ? data : null)} />
            <FileUpload label="職位說明書 (JD)" onUploaded={(data) => setJdData(data.fileName ? data : null)} />
          </div>
          {extracted && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <Check className="h-3 w-3" />
              AI 已自動填入欄位，請確認下方內容
            </div>
          )}
        </div>

        {/* 候選人資訊 */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">候選人資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">姓名</label>
              <input type="text" placeholder="王小明" value={candidateName} onChange={(e) => setCandidateName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input type="email" placeholder="candidate@email.com" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* 面試設定 */}
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <h2 className="font-semibold">面試設定</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium">應徵職位</label>
            <input type="text" placeholder="例如：資深前端工程師" required value={position} onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">難度等級</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setDifficulty(opt.value)}
                  className={cn("rounded-lg border p-3 text-left transition-all",
                    difficulty === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/50")}>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 主題：職類預設 + 已選標籤 + 自訂輸入 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">面試主題</label>

            {/* 職類快速套用 */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground py-1 pr-1">快速套用：</span>
              {TOPIC_PRESETS.map((p) => (
                <button key={p.id} type="button" onClick={() => applyPreset(p.id)}
                  className={cn("rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                    activePreset === p.id ? "border-primary bg-primary/5" : "hover:border-primary/50")}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* 已選主題（可刪） */}
            {selectedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/30 p-2.5 min-h-[42px]">
                {selectedTopics.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs">
                    {t}
                    <button type="button" onClick={() => removeTopic(t)} className="hover:bg-white/20 rounded-full p-0.5">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 自訂主題輸入 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={handleCustomTopicKey}
                placeholder="輸入自訂主題後按 Enter（例如：抗壓性、專案管理）"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <button type="button"
                onClick={() => { addTopic(customTopic); setCustomTopic(""); }}
                disabled={!customTopic.trim()}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              沒選主題也沒關係 — AI 會根據 JD 自行判斷該問的內容
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">題數</label>
              <select value={maxQuestions} onChange={(e) => setMaxQuestions(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
                {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} 題</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">整場時間</label>
              <select value={timeLimitMin} onChange={(e) => setTimeLimitMin(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
                {[10, 15, 20, 30, 45, 60].map((n) => <option key={n} value={n}>{n} 分鐘</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">每題</label>
              <select value={perQuestionSec} onChange={(e) => setPerQuestionSec(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
                {[60, 120, 180, 240, 300, 420, 600].map((n) => <option key={n} value={n}>{n >= 60 ? `${n / 60} 分` : `${n} 秒`}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">連結有效</label>
              <select value={linkValidDays} onChange={(e) => setLinkValidDays(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
                {[1, 3, 7, 14, 30].map((n) => <option key={n} value={n}>{n} 天</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 預覽題目 */}
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">題目預覽</h2>
            <button type="button" onClick={previewAI} disabled={!position.trim() || previewing}
              className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                position.trim() ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-muted text-muted-foreground"
              )}>
              {previewing ? <Loader2 className="h-3 w-3 animate-spin" /> : previewQs ? <RefreshCw className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {previewing ? "產生中..." : previewQs ? "重新產生" : "預覽 AI 會問的 5 題"}
            </button>
          </div>
          {previewQs && previewQs.length > 0 ? (
            <ol className="space-y-2 text-sm">
              {previewQs.map((q, i) => (
                <li key={i} className="flex gap-2 rounded-lg bg-muted/40 p-3">
                  <span className="font-mono text-xs text-muted-foreground pt-0.5">{i + 1}.</span>
                  <span className="flex-1">{q}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-muted-foreground">
              按上方按鈕，AI 會根據你目前的設定產生 5 題範例。不滿意可以重新產生。
            </p>
          )}
        </div>

        {/* 送出 */}
        <div className="space-y-3">
          <button type="submit" disabled={creating || !position.trim()}
            className={cn("w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition-colors",
              position.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
            )}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "建立面試連結"}
          </button>
          <button type="button" onClick={() => setShowSaveTpl(true)}
            disabled={!position.trim() || selectedTopics.length === 0}
            className={cn("w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
              position.trim() && selectedTopics.length > 0 ? "hover:bg-accent" : "text-muted-foreground cursor-not-allowed opacity-60"
            )}>
            <BookmarkPlus className="h-4 w-4" />
            儲存為範本
          </button>
        </div>
      </form>

      {/* 儲存範本對話框 */}
      {showSaveTpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border bg-card p-6 shadow-lg max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold">儲存範本</h3>
            <input type="text" placeholder="例如：資深前端（React）" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
              autoFocus className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowSaveTpl(false); setTemplateName(""); }}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
                取消
              </button>
              <button onClick={handleSaveTemplate} disabled={!templateName.trim()}
                className={cn("rounded-lg px-4 py-2 text-sm font-medium",
                  templateName.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground"
                )}>
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
