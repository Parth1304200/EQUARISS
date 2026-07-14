/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { fileToCompressedDataUrl } from "../lib/image";
import {
  ShieldCheck,
  X,
  UploadCloud,
  Loader2,
  Trash2,
  ArrowRight,
  Hash,
  AlertCircle
} from "lucide-react";

export interface SettleProofRepay {
  fromName: string;
  toName: string;
  amount: number;
  groupName?: string;
}

interface Props {
  /** When non-null the modal is open and describes the settlement being closed. */
  repay: SettleProofRepay | null;
  onClose: () => void;
  onConfirm: (proof: { transactionId: string; proofImage: string }) => Promise<void>;
}

export const SettleProofModal: React.FC<Props> = ({ repay, onClose, onConfirm }) => {
  const { theme } = useApp();
  const dark = theme === "dark";

  const [transactionId, setTransactionId] = useState("");
  const [proofImage, setProofImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset fields every time the modal is (re)opened.
  useEffect(() => {
    if (repay) {
      setTransactionId("");
      setProofImage("");
      setFileName("");
      setError(null);
      setSubmitting(false);
      setProcessing(false);
    }
  }, [repay]);

  if (!repay) return null;

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setProofImage(dataUrl);
      setFileName(file.name);
    } catch (err: any) {
      setError(err?.message || "Could not process that image.");
    } finally {
      setProcessing(false);
    }
  };

  const canConfirm = !!transactionId.trim() && !!proofImage && !submitting && !processing;

  const handleConfirm = async () => {
    if (!transactionId.trim()) {
      setError("Please paste the payment transaction / reference ID.");
      return;
    }
    if (!proofImage) {
      setError("Please attach a screenshot of the completed payment.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm({ transactionId: transactionId.trim(), proofImage });
    } catch (err: any) {
      setError(err?.message || "Couldn't save the settlement. Please try again.");
      setSubmitting(false);
    }
  };

  const inputBase = dark
    ? "bg-slate-950/60 border-white/10 focus:border-cyan-500 text-white placeholder:text-slate-500"
    : "bg-slate-50 border-slate-200 focus:border-black text-slate-900 placeholder:text-slate-400";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 flex flex-col gap-5 shadow-2xl ${
          dark ? "bg-slate-900 border-white/10 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold tracking-tight leading-none">Confirm Settlement</h3>
              <span className={`text-[11px] mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Attach payment proof to close this balance</span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-40 ${dark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment summary */}
        <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${dark ? "bg-slate-950/50 border-white/5" : "bg-slate-50 border-slate-100"}`}>
          <div className="flex flex-col gap-1 min-w-0">
            {repay.groupName && (
              <span className="text-[10px] font-mono tracking-widest uppercase text-gray-400 truncate">{repay.groupName}</span>
            )}
            <span className="text-xs font-bold flex items-center gap-1.5 truncate">
              {repay.fromName}
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {repay.toName}
            </span>
          </div>
          <span className={`text-lg font-black font-mono shrink-0 ml-3 ${dark ? "text-white" : "text-slate-900"}`}>
            ₹{repay.amount.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Transaction ID */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[10px] font-mono tracking-widest uppercase ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Transaction / UPI Reference ID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 4162 7381 9920"
              className={`w-full text-sm py-3 pl-10 pr-4 rounded-xl border focus:outline-none transition-all font-mono ${inputBase}`}
            />
          </div>
        </div>

        {/* Screenshot upload */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[10px] font-mono tracking-widest uppercase ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Payment Screenshot <span className="text-red-500">*</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {proofImage ? (
            <div className={`rounded-xl border p-3 flex items-center gap-3 ${dark ? "bg-slate-950/50 border-white/10" : "bg-slate-50 border-slate-200"}`}>
              <img src={proofImage} alt="Payment proof" className="w-14 h-14 rounded-lg object-cover border border-black/10 shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold truncate">{fileName || "Screenshot attached"}</span>
                <span className="text-[10px] text-emerald-500 font-mono">Attached ✓</span>
              </div>
              <button
                onClick={() => { setProofImage(""); setFileName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                disabled={submitting}
                className={`p-2 rounded-lg cursor-pointer transition-colors disabled:opacity-40 ${dark ? "hover:bg-red-500/15 text-slate-400 hover:text-red-400" : "hover:bg-red-50 text-slate-500 hover:text-red-600"}`}
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className={`rounded-xl border-2 border-dashed py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                dark ? "border-white/10 hover:border-cyan-500/40 hover:bg-white/5 text-slate-400" : "border-slate-200 hover:border-black hover:bg-slate-50 text-slate-500"
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-medium">Processing image…</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-6 h-6" />
                  <span className="text-xs font-semibold">Upload payment screenshot</span>
                  <span className="text-[10px] font-mono opacity-70">PNG or JPG · the QR "payment done" screen</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className={`p-3 rounded-xl text-[11px] leading-relaxed font-mono flex items-start gap-2 ${dark ? "bg-red-500/10 border border-red-500/20 text-red-300" : "bg-red-50 border border-red-200 text-red-600"}`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={submitting}
            className={`flex-1 py-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
              dark ? "bg-transparent border-white/10 hover:bg-white/5 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              dark ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-black text-white hover:bg-slate-800"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Confirm Settlement</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
