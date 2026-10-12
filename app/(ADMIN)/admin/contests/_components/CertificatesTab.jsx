"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, FileText, Send, Mail, Loader2, AlertTriangle, CheckCircle2,
  XCircle, Eye, Save, Square, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import {
  getCertificateSetup,
  createCertificateUploadUrl,
  saveCertificateTemplate,
  saveCertificateLayout,
  previewCertificate,
  setCertificateName,
  sendCertificates,
  sendTestCertificate,
} from "@/app/actions/certificateActions";

const BATCH_SIZE = 5;

const inputClass =
  "w-full bg-black border border-white/10 text-xs font-mono text-white h-8 px-2 focus:border-red-600 outline-none rounded-none";

function base64ToUrl(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function CertificatesTab({ contest }) {
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState(null);
  const [layout, setLayout] = useState(null);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewName, setPreviewName] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);
  const [savingLayout, setSavingLayout] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testName, setTestName] = useState("");
  const [sendingIds, setSendingIds] = useState(new Set());
  const [bulk, setBulk] = useState(null); // { done, total }
  const stopRef = useRef(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const res = await getCertificateSetup(contest.id);
    if (res.error) {
      toast.error("Couldn't load certificates", { description: res.error });
      setLoading(false);
      return;
    }
    setSetup(res);
    setLayout(res.template?.layout || null);
    setLayoutDirty(false);
    setPreviewName((prev) => prev || res.recipients[0]?.printedName || "Participant Name");
    setLoading(false);
  }, [contest.id]);

  useEffect(() => { load(); }, [load]);

  // Live preview, following unsaved layout edits.
  useEffect(() => {
    if (!setup?.template || !layout) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setPreviewing(true);
      const res = await previewCertificate(contest.id, { name: previewName, layout });
      if (cancelled) return;
      setPreviewing(false);
      if (res.error) {
        toast.error("Preview failed", { description: res.error });
        return;
      }
      setPreviewNote(res.droppedChars?.length ? `Can't print: ${res.droppedChars.join(" ")}` : null);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return base64ToUrl(res.pdf);
      });
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [contest.id, setup?.template, layout, previewName]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const handleUpload = async (file) => {
    if (!file) return;
    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isSvg && !isPdf) {
      toast.error("Upload a PDF or SVG file.");
      return;
    }

    setUploading(true);
    try {
      let body = file;
      let detectedLayout = null;
      if (isSvg) {
        const { svgFileToTemplatePdf } = await import("@/lib/certificate/svgTemplate");
        const converted = await svgFileToTemplatePdf(file);
        body = new Blob([converted.pdfBytes], { type: "application/pdf" });
        detectedLayout = converted.layout;
      }

      const target = await createCertificateUploadUrl(contest.id);
      if (target.error) throw new Error(target.error);

      const { error: uploadError } = await supabase.storage
        .from("certificate-templates")
        .uploadToSignedUrl(target.path, target.token, body, { contentType: "application/pdf" });
      if (uploadError) throw new Error(uploadError.message);

      // Keep the current name position when swapping in a revised PDF of
      // the same design; an SVG brings its own from the placeholder.
      const res = await saveCertificateTemplate(contest.id, {
        path: target.path,
        sourceType: isSvg ? "svg" : "pdf",
        sourceFilename: file.name,
        layout: detectedLayout || setup?.template?.layout || null,
      });
      if (res.error) throw new Error(res.error);

      if (res.pageCount > 1) toast.warning("Only the first page of that PDF will be used.");
      if (isSvg && !detectedLayout) {
        toast.warning("No name placeholder found in the SVG", {
          description: "Set the name position below. Tip: give the placeholder text id=\"participant-name\".",
        });
      } else if (isPdf && !setup?.template) {
        toast.message("Template uploaded", { description: "Now place the name on the page below." });
      } else {
        toast.success("Template uploaded");
      }
      await load();
    } catch (e) {
      toast.error("Upload failed", { description: e.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateLayout = (key, value) => {
    setLayout((prev) => ({ ...prev, [key]: value }));
    setLayoutDirty(true);
  };

  const handleSaveLayout = async () => {
    setSavingLayout(true);
    const res = await saveCertificateLayout(contest.id, layout);
    setSavingLayout(false);
    if (res.error) return toast.error("Couldn't save", { description: res.error });
    setLayout(res.layout);
    setSetup((prev) => ({ ...prev, template: { ...prev.template, layout: res.layout } }));
    setLayoutDirty(false);
    toast.success("Name position saved");
  };

  const handleTest = async () => {
    if (layoutDirty) return toast.error("Save the name position first — test emails use the saved one.");
    setTesting(true);
    const res = await sendTestCertificate(contest.id, testName.trim() || previewName, testEmail.trim());
    setTesting(false);
    if (res.error) return toast.error("Test send failed", { description: res.error });
    toast.success(`Test certificate sent to ${res.sentTo}`);
  };

  const applyResults = (results) => {
    setSetup((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r) => {
        const hit = results.find((x) => x.userId === r.userId);
        if (!hit || hit.status === "skipped") return r;
        return { ...r, status: hit.status, error: hit.error, sentAt: hit.sentAt, sentTo: hit.sentTo };
      }),
    }));
  };

  const sendOne = async (recipient) => {
    const isResend = recipient.status === "sent";
    if (isResend && !confirm(`Send ${recipient.printedName} their certificate again?`)) return;
    setSendingIds((s) => new Set(s).add(recipient.userId));
    const res = await sendCertificates(contest.id, [recipient.userId], { resend: true });
    setSendingIds((s) => { const n = new Set(s); n.delete(recipient.userId); return n; });
    if (res.error) return toast.error("Send failed", { description: res.error });
    applyResults(res.results);
    const r = res.results[0];
    if (r?.status === "sent") toast.success(`Sent to ${r.sentTo}`);
    else toast.error("Send failed", { description: r?.error });
  };

  const sendAll = async () => {
    const queue = setup.recipients.filter((r) => r.status !== "sent").map((r) => r.userId);
    if (queue.length === 0) return;
    if (!confirm(`Email certificates to ${queue.length} participant${queue.length === 1 ? "" : "s"}? This can't be undone.`)) return;

    stopRef.current = false;
    setBulk({ done: 0, total: queue.length, failed: 0 });
    let failed = 0;
    for (let i = 0; i < queue.length; i += BATCH_SIZE) {
      if (stopRef.current) break;
      const res = await sendCertificates(contest.id, queue.slice(i, i + BATCH_SIZE));
      if (res.error) {
        toast.error("Sending stopped", { description: res.error });
        break;
      }
      applyResults(res.results);
      failed += res.results.filter((r) => r.status === "failed").length;
      setBulk({ done: Math.min(i + BATCH_SIZE, queue.length), total: queue.length, failed });
    }
    setBulk(null);
    if (stopRef.current) toast.message("Sending paused — press send again to continue where it stopped.");
    else if (failed) toast.warning(`Finished with ${failed} failed — see the list below.`);
    else toast.success("All certificates sent");
  };

  const saveName = async (recipient, value) => {
    const next = value.trim();
    const current = recipient.nameOverride ?? recipient.profileName;
    if (next === current) return;
    // Clearing the field, or typing the profile name back, removes the override.
    const override = next && next !== recipient.profileName ? next : null;
    const res = await setCertificateName(contest.id, recipient.userId, override);
    if (res.error) return toast.error("Couldn't save name", { description: res.error });
    if (res.recipient) {
      setSetup((prev) => ({
        ...prev,
        recipients: prev.recipients.map((r) => (r.userId === recipient.userId ? res.recipient : r)),
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-500 font-mono text-xs gap-2">
        <Loader2 size={14} className="animate-spin" /> Loading certificates...
      </div>
    );
  }
  if (!setup) return null;

  const { template, recipients } = setup;
  const sent = recipients.filter((r) => r.status === "sent").length;
  const failed = recipients.filter((r) => r.status === "failed").length;
  const flagged = recipients.filter((r) => r.droppedChars.length || !r.printedName).length;
  const noEmail = recipients.filter((r) => !r.email).length;
  const unsent = recipients.length - sent;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">

      {/* 1. Template */}
      <section>
        <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 flex items-center gap-2">
          <FileText size={14} /> Certificate Template
        </h3>
        <div className="border border-white/10 bg-zinc-900/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs font-mono">
            {template ? (
              <>
                <div className="text-zinc-200">{template.sourceFilename || "template"}</div>
                <div className="text-zinc-600 mt-1 uppercase text-[10px]">
                  {template.sourceType} · {Math.round(template.pageWidth)}×{Math.round(template.pageHeight)} pt
                  {template.sourceType === "svg" && " · flattened at 300 dpi"}
                </div>
              </>
            ) : (
              <div className="text-zinc-500 max-w-md leading-relaxed">
                No template yet. Upload the participant certificate as a PDF or SVG.
                In an SVG, give the placeholder name text <span className="text-zinc-300">id="participant-name"</span> and
                it's positioned automatically.
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.svg,application/pdf,image/svg+xml"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              variant="outline"
              className="h-8 rounded-none text-[10px] font-mono uppercase border-white/10 hover:bg-white/5 hover:text-white"
            >
              {uploading ? <Loader2 size={12} className="mr-2 animate-spin" /> : <Upload size={12} className="mr-2" />}
              {template ? "Replace" : "Upload"} PDF / SVG
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Name placement + preview */}
      {template && layout && (
        <section>
          <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 flex items-center gap-2">
            <Eye size={14} /> Name Placement & Preview
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
            <div className="space-y-3 border border-white/10 bg-zinc-900/20 p-4">
              <Field label="Preview name">
                <input className={inputClass} value={previewName} onChange={(e) => setPreviewName(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="X (pt)">
                  <input type="number" step="0.5" className={inputClass} value={round(layout.x)} onChange={(e) => updateLayout("x", Number(e.target.value))} />
                </Field>
                <Field label="Baseline Y (pt)">
                  <input type="number" step="0.5" className={inputClass} value={round(layout.y)} onChange={(e) => updateLayout("y", Number(e.target.value))} />
                </Field>
                <Field label="Size (pt)">
                  <input type="number" step="0.5" className={inputClass} value={round(layout.fontSize)} onChange={(e) => updateLayout("fontSize", Number(e.target.value))} />
                </Field>
                <Field label="Max width (pt)">
                  <input type="number" step="1" className={inputClass} value={round(layout.maxWidth)} onChange={(e) => updateLayout("maxWidth", Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Align (X is the)">
                <select className={inputClass} value={layout.align} onChange={(e) => updateLayout("align", e.target.value)}>
                  <option value="left">Left edge</option>
                  <option value="center">Centre</option>
                  <option value="right">Right edge</option>
                </select>
              </Field>
              <Field label="Colour">
                <div className="flex gap-2">
                  <input type="color" className="h-8 w-10 bg-black border border-white/10 rounded-none" value={layout.color} onChange={(e) => updateLayout("color", e.target.value)} />
                  <input className={inputClass} value={layout.color} onChange={(e) => updateLayout("color", e.target.value)} />
                </div>
              </Field>
              <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
                Page is {Math.round(template.pageWidth)}×{Math.round(template.pageHeight)} pt, measured from the top-left.
                Names longer than the max width shrink to fit.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={handleSaveLayout}
                  disabled={!layoutDirty || savingLayout}
                  className="h-8 rounded-none text-[10px] font-mono uppercase bg-white text-black hover:bg-zinc-200"
                >
                  {savingLayout ? <Loader2 size={12} className="mr-2 animate-spin" /> : <Save size={12} className="mr-2" />}
                  {layoutDirty ? "Save position" : "Position saved"}
                </Button>
              </div>
            </div>

            <div className="border border-white/10 bg-zinc-900/20 relative min-h-[320px]">
              {previewUrl && (
                <iframe title="Certificate preview" src={`${previewUrl}#toolbar=0&navpanes=0&view=Fit`} className="w-full h-full min-h-[420px]" />
              )}
              {previewing && (
                <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-400 flex items-center gap-1 bg-black/80 px-2 py-1">
                  <Loader2 size={10} className="animate-spin" /> rendering
                </div>
              )}
              {previewNote && (
                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-amber-400 bg-black/80 px-2 py-1">{previewNote}</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. Test email — one real email to any address, before the real send */}
      {template && (
        <section>
          <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4 flex items-center gap-2">
            <Mail size={14} /> Send a Test
          </h3>
          <div className="border border-white/10 bg-zinc-900/20 p-4 space-y-3">
            <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
              Sends one email exactly as participants will receive it, with the certificate attached.
              Doesn't count as a send and works before the contest ends. Leave the email blank to send it to yourself.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <Field label="Send to">
                <input
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !testing) handleTest(); }}
                />
              </Field>
              <Field label="Name on certificate">
                <input
                  className={inputClass}
                  placeholder={previewName || "Participant Name"}
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </Field>
              <Button
                onClick={handleTest}
                disabled={testing || layoutDirty}
                variant="outline"
                className="h-8 rounded-none text-[10px] font-mono uppercase border-white/10 hover:bg-white/5 hover:text-white"
              >
                {testing ? <Loader2 size={12} className="mr-2 animate-spin" /> : <Send size={12} className="mr-2" />}
                Send test
              </Button>
            </div>
            {layoutDirty && (
              <p className="text-[10px] font-mono text-amber-400">Save the name position first — tests use the saved one.</p>
            )}
          </div>
        </section>
      )}

      {/* 4. Recipients */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-mono text-zinc-500 uppercase flex items-center gap-2">
              <Send size={14} /> Recipients
            </h3>
            <p className="text-[10px] font-mono text-zinc-600 mt-2 flex flex-wrap gap-x-3 gap-y-1">
              <span>PARTICIPANTS: {recipients.length}</span>
              <span className="text-green-500">SENT: {sent}</span>
              {failed > 0 && <span className="text-red-500">FAILED: {failed}</span>}
              {flagged > 0 && <span className="text-amber-400">NAME CHECK: {flagged}</span>}
              {noEmail > 0 && <span className="text-red-500">NO EMAIL: {noEmail}</span>}
            </p>
            <p className="text-[10px] font-mono text-zinc-600 mt-1">
              Project owners and collaborators who accepted their invite. Pending invites are not included.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            {bulk ? (
              <Button
                onClick={() => { stopRef.current = true; }}
                variant="outline"
                className="h-8 rounded-none text-[10px] font-mono uppercase border-red-900 text-red-500 hover:bg-red-900/20"
              >
                <Square size={12} className="mr-2" /> Stop · {bulk.done}/{bulk.total}
              </Button>
            ) : (
              <Button
                onClick={sendAll}
                disabled={!template || !setup.contest.hasEnded || layoutDirty || unsent === 0}
                className="h-8 rounded-none text-[10px] font-mono uppercase bg-red-600 text-white hover:bg-red-700"
              >
                <Send size={12} className="mr-2" />
                {unsent === 0 && recipients.length ? "All sent" : `Send to ${sent ? "remaining " : "all "}${unsent}`}
              </Button>
            )}
            {!setup.contest.hasEnded && (
              <span className="text-[10px] font-mono text-zinc-600">
                Unlocks when the contest ends · {formatDate(setup.contest.endsAt)}
              </span>
            )}
            {layoutDirty && setup.contest.hasEnded && (
              <span className="text-[10px] font-mono text-amber-400">Save the name position first</span>
            )}
          </div>
        </div>

        <div className="border border-white/10 bg-zinc-900/20 divide-y divide-white/5">
          {recipients.map((r) => (
            <RecipientRow
              key={r.userId}
              recipient={r}
              canSend={!!template && setup.contest.hasEnded && !bulk && !layoutDirty}
              sending={sendingIds.has(r.userId)}
              onSend={() => sendOne(r)}
              onPreview={() => setPreviewName(r.printedName)}
              onSaveName={(v) => saveName(r, v)}
              canPreview={!!template}
            />
          ))}
          {recipients.length === 0 && (
            <div className="p-4 text-center text-zinc-600 text-xs font-mono">No submitted projects yet.</div>
          )}
        </div>

        <div className="flex justify-end mt-2">
          <button onClick={load} className="text-[10px] font-mono text-zinc-600 hover:text-zinc-300 flex items-center gap-1">
            <RefreshCw size={10} /> Refresh list
          </button>
        </div>
      </section>
    </div>
  );
}

function round(n) {
  return Math.round(Number(n) * 10) / 10;
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-[9px] font-mono text-zinc-500 uppercase">{label}</span>
      {children}
    </label>
  );
}

function RecipientRow({ recipient: r, canSend, sending, onSend, onPreview, onSaveName, canPreview }) {
  const [value, setValue] = useState(r.nameOverride ?? r.profileName);
  useEffect(() => { setValue(r.nameOverride ?? r.profileName); }, [r.nameOverride, r.profileName]);

  const needsCheck = r.droppedChars.length > 0 || !r.printedName;

  return (
    <div className="p-3 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0 space-y-1">
        <input
          className={`${inputClass} ${needsCheck ? "border-amber-600/60" : ""} ${r.nameOverride ? "text-blue-300" : ""}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => onSaveName(value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          title={r.nameOverride ? `Edited · profile name: ${r.profileName}` : "Name printed on the certificate"}
        />
        <div className="text-[10px] font-mono text-zinc-600 truncate">
          @{r.username || "unknown"} · {r.email || <span className="text-red-500">no email</span>} ·{" "}
          <span className="uppercase">{r.role}</span> · {r.projects.join(", ")}
        </div>
        {needsCheck && (
          <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
            <AlertTriangle size={10} />
            {r.printedName
              ? <>Prints as "{r.printedName}" — can't draw {r.droppedChars.join(" ")}</>
              : "Nothing printable — type the name to use"}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:w-[260px] md:justify-end shrink-0">
        <Status recipient={r} />
        <button
          onClick={onPreview}
          disabled={!canPreview}
          className="h-7 w-7 flex items-center justify-center border border-white/10 text-zinc-500 hover:text-white disabled:opacity-30"
          title="Show in preview"
        >
          <Eye size={12} />
        </button>
        <Button
          onClick={onSend}
          disabled={!canSend || sending || !r.email || !r.printedName}
          variant="outline"
          className="h-7 rounded-none text-[10px] font-mono uppercase border-white/10 hover:bg-white/5 hover:text-white"
        >
          {sending ? <Loader2 size={12} className="animate-spin" /> : r.status === "sent" ? "Resend" : "Send"}
        </Button>
      </div>
    </div>
  );
}

function Status({ recipient: r }) {
  if (r.status === "sent") {
    return (
      <span className="text-[9px] font-mono uppercase text-green-500 flex items-center gap-1" title={`${r.sentTo} · ${formatDate(r.sentAt)}`}>
        <CheckCircle2 size={10} /> Sent
      </span>
    );
  }
  if (r.status === "failed") {
    return (
      <span className="text-[9px] font-mono uppercase text-red-500 flex items-center gap-1" title={r.error || ""}>
        <XCircle size={10} /> Failed
      </span>
    );
  }
  return <span className="text-[9px] font-mono uppercase text-zinc-600">Not sent</span>;
}
