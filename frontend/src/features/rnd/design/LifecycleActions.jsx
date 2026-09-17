/** LifecycleActions — tombol aksi sesuai status & peran (desainer vs penilai) + dialog catatan/nilai/ACC. */
import { useState } from "react";
import { Archive, CheckCircle2, Eye, GitBranch, PackageCheck, Rocket, RotateCcw, Send, Undo2 } from "lucide-react";
import { designLifecycle, designNewVersion } from "../rndApi";
import { errMsg, fmtScore, roundLabel } from "../rndMeta";
import ScoreInput from "./ScoreInput";
import ProductPicker from "./ProductPicker";

const ACTIONS = {
  submit: { label: "Ajukan untuk review", icon: Send, side: "designer", cls: "primary-button" },
  start_review: { label: "Mulai review", icon: Eye, side: "assessor", cls: "primary-button" },
  approve: { label: "Setujui (ACC)", icon: CheckCircle2, side: "assessor", cls: "primary-button", needScore: true },
  request_revision: { label: "Minta revisi", icon: RotateCcw, side: "assessor", cls: "secondary-button", needNote: true, optScore: true },
  submit_final: { label: "Serahkan berkas final", icon: PackageCheck, side: "designer", cls: "primary-button" },
  return_final: { label: "Kembalikan berkas final", icon: RotateCcw, side: "assessor", cls: "secondary-button", needNote: true },
  activate: { label: "Aktifkan untuk produksi", icon: Rocket, side: "assessor", cls: "primary-button" },
  archive: { label: "Arsipkan", icon: Archive, side: "assessor", cls: "secondary-button", needNote: true },
  reopen: { label: "Buka kembali", icon: Undo2, side: "assessor", cls: "secondary-button" },
  new_version: { label: "Buat versi baru", icon: GitBranch, side: "designer", cls: "secondary-button", needNote: true },
};

const BY_STATUS = {
  draft: ["submit", "archive"],
  revision: ["submit", "archive"],
  pending_approval: ["start_review", "approve", "request_revision", "archive"],
  in_review: ["approve", "request_revision", "archive"],
  approved: ["submit_final", "archive"],
  final_submitted: ["activate", "return_final", "archive"],
  active: ["new_version", "archive"],
  archived: ["reopen"], retired: ["reopen"],
};

export default function LifecycleActions({ design, canAssess, canEdit, minAcc = 1.5, onDone, onError }) {
  const [dlg, setDlg] = useState(null); // { action }
  const [note, setNote] = useState("");
  const [score, setScore] = useState(null);
  const [products, setProducts] = useState([]);
  const [colorCount, setColorCount] = useState(4);
  const [busy, setBusy] = useState(false);
  const status = design.status || "draft";
  const curV = (design.versions || []).find((v) => v.version === design.version) || {};
  const fin = design.final || {};

  const visible = (BY_STATUS[status] || []).filter((a) => {
    const m = ACTIONS[a];
    return m.side === "assessor" ? canAssess : canEdit;
  });

  const open = (a) => {
    setDlg({ action: a }); setNote(""); setScore(curV.score ?? null);
    setProducts(design.recommended_products || []); setColorCount(design.final_color_count || 4);
  };

  const run = async () => {
    const a = dlg.action;
    const m = ACTIONS[a];
    if (m.needNote && !note.trim()) { onError?.("Catatan wajib diisi."); return; }
    if (m.needScore && score === null) { onError?.("Beri nilai versi ini dulu (0–2)."); return; }
    setBusy(true);
    try {
      if (a === "new_version") await designNewVersion(design.id, { note });
      else {
        const body = { note, score: (m.needScore || m.optScore) ? score : undefined };
        if (a === "approve") { body.recommended_product_ids = products.map((p) => p.id); body.final_color_count = Number(colorCount); }
        await designLifecycle(design.id, a.replace(/_/g, "-"), body);
      }
      setDlg(null);
      onDone?.(`${m.label} berhasil.`);
    } catch (e) { onError?.(errMsg(e, "Aksi gagal.")); } finally { setBusy(false); }
  };

  if (!visible.length) return null;
  const A = dlg ? ACTIONS[dlg.action] : null;
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="design-lifecycle-actions">
      {visible.map((a) => {
        const m = ACTIONS[a]; const Icon = m.icon;
        return (
          <button key={a} className={`${m.cls} !py-1.5 text-[11.5px]`} onClick={() => open(a)} data-testid={`design-action-${a}`}>
            <Icon size={13} /> {m.label}
          </button>
        );
      })}
      {dlg && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/50 p-4" onClick={() => setDlg(null)} data-testid="design-action-dialog">
          <div className="max-h-[90vh] w-full max-w-[560px] space-y-3 overflow-y-auto rounded-xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-bold">{A.label} — {design.code} · {roundLabel(design.version)}</h3>
            {dlg.action === "submit" && (
              <p className="rounded-lg bg-[#F2F7FF] px-3 py-2 text-[11.5px] text-[#004099]">
                <b>{roundLabel(design.version)}</b> ({design.rounds?.find((r) => r.version === design.version)?.file_count ?? 0} berkas) akan masuk antrean
                penilai dan admin diberi notifikasi. Pastikan semua berkas ronde ini sudah diunggah.
              </p>
            )}
            {dlg.action === "request_revision" && (
              <p className="rounded-lg bg-[#FDF3F2] px-3 py-2 text-[11.5px] text-[#C62828]">
                Ronde <b>{roundLabel(design.version + 1)}</b> akan dibuka otomatis — desainer cukup mengunggah hasil revisi lalu mengajukan lagi.
              </p>
            )}
            {dlg.action === "approve" && (
              <div className="space-y-2">
                <div>
                  <p className="mb-1 text-[10.5px] font-semibold text-[#6B6B73]">Peruntukan produk (ditentukan penilai)</p>
                  <ProductPicker value={products} onChange={setProducts} testId="design-approve-products" />
                </div>
                <label className="flex items-center gap-2 text-[11.5px]">
                  Jumlah varian warna final yang wajib diunggah desainer
                  <input type="number" min={1} max={20} className="field !w-16 !py-1" value={colorCount} data-testid="design-approve-color-count"
                    onChange={(e) => setColorCount(e.target.value)} />
                </label>
              </div>
            )}
            {dlg.action === "submit_final" && (
              <p className={`rounded-lg px-3 py-2 text-[11.5px] ${fin.complete ? "bg-[#EAF7EF] text-[#1A7A3A]" : "bg-[#FDF3F2] text-[#C62828]"}`}
                data-testid="design-submit-final-check">
                Varian warna {fin.colorway_files}/{fin.colorway_required} · Mockup {fin.mockup_files}/1.
                {fin.complete ? " Lengkap — siap diserahkan." : " Belum lengkap — unggah dulu di tab Final."}
              </p>
            )}
            {dlg.action === "new_version" && (
              <p className="rounded-lg bg-[#F2F7FF] px-3 py-2 text-[11.5px] text-[#004099]">
                v{design.version} → <b>v{design.version + 1}</b>. Status kembali <b>Draf</b>; unggah berkas baru lalu ajukan lagi.
              </p>
            )}
            {(A.needScore || A.optScore) && (
              <div>
                <p className="mb-1 text-[10.5px] font-semibold text-[#6B6B73]">
                  Nilai {roundLabel(design.version)} {A.needScore ? "*" : "(opsional)"}
                  {curV.score !== null && curV.score !== undefined && <> · nilai tersimpan: <b>{fmtScore(curV.score)}</b></>}
                </p>
                <ScoreInput value={score} onChange={setScore} minAcc={minAcc} testId="design-action-score" />
              </div>
            )}
            <div>
              <p className="mb-1 text-[10.5px] font-semibold text-[#6B6B73]">
                {dlg.action === "new_version" ? "Apa yang berubah pada versi ini? *"
                  : dlg.action === "request_revision" ? "Catatan revisi untuk desainer *"
                    : dlg.action === "return_final" ? "Apa yang kurang pada berkas final? *"
                      : dlg.action === "archive" ? "Alasan pengarsipan *" : "Catatan (opsional)"}
              </p>
              <textarea className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-testid="design-action-note"
                placeholder={dlg.action === "request_revision" ? "mis. warna latar terlalu gelap, repeat belum rapi" : ""} />
            </div>
            <div className="flex justify-end gap-2">
              <button className="secondary-button" onClick={() => setDlg(null)}>Batal</button>
              <button className="primary-button" onClick={run} disabled={busy} data-testid="design-action-confirm">
                {busy ? "Memproses…" : A.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
