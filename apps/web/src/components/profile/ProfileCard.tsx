"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  ShieldCheck,
  BadgeCheck,
  CalendarDays,
  LogIn,
  Loader2,
  UserRound,
  Pencil,
  Save,
  X,
  AlertCircle,
  AlertTriangle,
  LifeBuoy,
  Trash2,
} from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { updateProfile, requestDeletionCode, deleteAccount } from "@/lib/api";

/** Small hard-edged chip used across the profile identity block. */
const chip =
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-black text-[10px] font-black uppercase tracking-wider";

const inputCls =
  "w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none";

const labelCls = "block text-[10px] font-black mb-1.5 uppercase tracking-wider";

/**
 * Identity card: name, email, phone, role, verification, member since — with
 * inline editing for name + phone (email is the sign-in identity and stays
 * read-only; there is no profile-edit endpoint for it by design).
 */
export function ProfileCard() {
  const router = useRouter();
  const { user, loading, refresh, signOut } = useSession();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Account deletion — max 2 prompts: (1) consequences + mail the code,
  // (2) enter the code. The API does the actual sweep.
  const [deletionStep, setDeletionStep] = useState<0 | 1 | 2>(0);
  const [deletionCode, setDeletionCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletionError, setDeletionError] = useState("");
  const [devDeleteCode, setDevDeleteCode] = useState<string | null>(null);

  const openEdit = () => {
    if (!user) return;
    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
    });
    setFormError("");
    setEditing(true);
  };

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      });
      await refresh(); // header + card pick up the new name immediately
      setEditing(false);
      toast.success("Profile updated.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const cancelDeletion = () => {
    if (sendingCode || deleting) return;
    setDeletionStep(0);
    setDeletionCode("");
    setDeletionError("");
    setDevDeleteCode(null);
  };

  /** Prompt 1 → 2: mail the confirmation code to the signed-in address. */
  const sendDeletionCode = async () => {
    setSendingCode(true);
    setDeletionError("");
    try {
      const { devCode } = await requestDeletionCode();
      if (devCode) setDevDeleteCode(devCode);
      setDeletionStep(2);
      toast.success("Deletion code sent — check your inbox.");
    } catch (err) {
      setDeletionError(err instanceof Error ? err.message : "Couldn't send the code.");
    } finally {
      setSendingCode(false);
    }
  };

  /** Prompt 2: the code authorises wiping the account and all its posts. */
  const confirmDeletion = async () => {
    if (deletionCode.trim().length !== 6) {
      setDeletionError("Enter the 6-digit deletion code.");
      return;
    }
    setDeleting(true);
    setDeletionError("");
    try {
      await deleteAccount(deletionCode.trim());
      setDeletionStep(0);
      toast.success("Your account and every post you owned have been deleted.");
      await signOut(); // cookie is already gone server-side; clears local state
      router.push("/");
      router.refresh();
    } catch (err) {
      setDeletionError(err instanceof Error ? err.message : "Account deletion failed.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4">
        <div className="h-4 w-24 rounded-lg bg-neutral-200 border-2 border-black animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-200 border-[3px] border-black animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 rounded-lg bg-neutral-200 border-2 border-black animate-pulse" />
            <div className="h-3.5 w-1/2 rounded-lg bg-neutral-200 border-2 border-black animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-5 rounded-3xl bg-[#FFF9E6] border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FFDE59] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
          <UserRound className="w-7 h-7 text-black" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black">You&apos;re browsing as a guest</h2>
          <p className="text-xs font-bold text-neutral-600 leading-relaxed">
            Sign in to see your profile details and manage your posts — applicants,
            pause intake, edits, deletions.
          </p>
        </div>
        <Link
          href="/signin?next=/profile"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <LogIn className="w-4 h-4" />
          Sign in
        </Link>
      </div>
    );
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
  const initials =
    ([user.firstName, user.lastName].filter(Boolean).join("") || user.email)
      .slice(0, 2)
      .toUpperCase();
  const memberSince = user.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="p-5 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-block px-2 py-0.5 rounded border-2 border-black bg-[#FFDE59] text-[10px] font-mono font-black uppercase tracking-wider">
          Profile
        </span>
        {!editing && (
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* ── Edit mode ─────────────────────────────────────────────────────── */}
      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="profile-firstName">
                First name <span className="text-[#FF5757]">*</span>
              </label>
              <input
                id="profile-firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="profile-lastName">
                Last name <span className="text-[#FF5757]">*</span>
              </label>
              <input
                id="profile-lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="profile-phone">
              Phone
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. +1 (555) 019-2834"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Email (sign-in identity)</label>
            <div className={`${inputCls} bg-neutral-100 text-neutral-500 flex items-center gap-1.5`}>
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          {formError && (
            <div className="p-2.5 rounded-xl bg-[#FF5757] border-2 border-black text-white text-[11px] font-black flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#7ED957] hover:bg-[#6ec947] text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-60"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Identity ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#00F0FF] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center text-xl font-black text-black">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black leading-tight break-words">{fullName}</h2>
              <p className="text-xs font-bold text-neutral-600 flex items-center gap-1.5 break-all">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {user.email}
              </p>
            </div>
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap gap-2">
            <span className={`${chip} bg-[#FFDE59]`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {user.role === "admin" ? "Administrator" : "Member"}
            </span>
            {user.verified ? (
              <span className={`${chip} bg-[#7ED957]`}>
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            ) : (
              <span className={`${chip} bg-neutral-100 text-neutral-600`}>
                Not verified
              </span>
            )}
          </div>

          {/* Detail rows */}
          <dl className="space-y-2 pt-1 border-t-2 border-black/10">
            <div className="flex items-start justify-between gap-3 pt-2">
              <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Phone
              </dt>
              <dd className="text-xs font-black text-right break-all">
                {user.phone || (
                  <span className="text-neutral-400 font-bold">Not added</span>
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3 border-t-2 border-black/10 pt-2">
              <dt className="text-[10px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Member since
              </dt>
              <dd className="text-xs font-black text-right">
                {memberSince && !Number.isNaN(memberSince.getTime())
                  ? memberSince.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </dd>
            </div>
          </dl>

          <p className="text-[11px] font-bold text-neutral-500 leading-relaxed">
            Name and phone are editable here. Your email is the sign-in identity —{" "}
            <Link
              href="/contact"
              className="text-black underline decoration-[#FF5757] decoration-2 underline-offset-2 hover:text-[#FF5757]"
            >
              contact support
            </Link>{" "}
            to change it.
          </p>

          {/* Help + danger zone */}
          <div className="pt-3 border-t-2 border-dashed border-black/20 space-y-3">
            <Link
              href="/contact"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FFDE59] hover:bg-[#ffd633] text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <LifeBuoy className="w-4 h-4" />
              Contact support
            </Link>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setDeletionStep(1);
                  setDeletionCode("");
                  setDeletionError("");
                  setDevDeleteCode(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FF5757] hover:text-white text-[#FF5757] font-black text-xs uppercase tracking-wider border-[2.5px] border-[#FF5757] shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete account
              </button>
              <p className="text-[10px] font-bold text-neutral-400 text-center leading-relaxed">
                Deletes every post you own too — you&apos;ll confirm with a code sent to your email.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Deletion prompts — max 2: consequences, then the emailed code ── */}
      {deletionStep > 0 && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete account"
          onClick={cancelDeletion}
        >
          <div
            className="w-full max-w-md bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {deletionStep === 1 ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#FF5757] border-[3px] border-black flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-black leading-tight">Delete your account?</h3>
                </div>
                <ul className="space-y-2 text-xs font-bold text-neutral-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF5757] font-black">✕</span>
                    Every post you own is deleted — with all applications on them.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF5757] font-black">✕</span>
                    Applications you sent to other posts disappear too.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF5757] font-black">✕</span>
                    This cannot be undone. Export anything you want to keep first.
                  </li>
                </ul>

                {deletionError && (
                  <div className="p-2.5 rounded-xl bg-[#FF5757] border-2 border-black text-white text-[11px] font-black flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {deletionError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={cancelDeletion}
                    disabled={sendingCode}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-60"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={sendDeletionCode}
                    disabled={sendingCode}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-60"
                  >
                    {sendingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    Send deletion code
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#FF5757] border-[3px] border-black flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-black leading-tight">Confirm deletion</h3>
                </div>
                <p className="text-xs font-bold text-neutral-700 leading-relaxed">
                  We emailed a 6-digit deletion code to{" "}
                  <strong className="font-black break-all">{user.email}</strong>. It expires in 5
                  minutes.
                </p>

                {devDeleteCode && (
                  <div className="p-2.5 rounded-xl bg-[#E0F7FA] border-2 border-black text-[11px] font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Dev mode (no Apps Script yet): your code is{" "}
                    <strong className="font-mono">{devDeleteCode}</strong>
                  </div>
                )}

                <div>
                  <label className={labelCls} htmlFor="delete-code">
                    Deletion code
                  </label>
                  <input
                    id="delete-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    pattern="\d{6}"
                    value={deletionCode}
                    onChange={(e) => setDeletionCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className={`${inputCls} text-center font-mono text-lg tracking-[0.4em] py-3`}
                  />
                </div>

                {deletionError && (
                  <div className="p-2.5 rounded-xl bg-[#FF5757] border-2 border-black text-white text-[11px] font-black flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {deletionError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={cancelDeletion}
                    disabled={deleting}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-60"
                  >
                    <X className="w-4 h-4" />
                    Keep my account
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeletion}
                    disabled={deleting || deletionCode.length !== 6}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-60"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete forever
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
