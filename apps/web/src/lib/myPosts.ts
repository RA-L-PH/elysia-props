/**
 * Local record of posts created from this device.
 *
 * A guest's Post ID is displayed exactly once at creation — saving it here
 * (a) lets the owner delete their post straight from the feed later, and
 * (b) survives a refresh so the key isn't lost to a stray tab close. Only the
 * creator's own device ever has it; nothing is sent anywhere.
 */

export interface MyPostRecord {
  id: string;
  postKey: string;
  title: string;
  category: string;
  createdAt: string;
}

const STORAGE_KEY = "pulsestage_my_posts";
const MAX_RECORDS = 50;

export const loadMyPosts = (): MyPostRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const rememberMyPost = (record: MyPostRecord): void => {
  try {
    const next = [record, ...loadMyPosts().filter((p) => p.id !== record.id)].slice(
      0,
      MAX_RECORDS
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full/blocked — the key was still shown and copied, nothing lost
  }
};

export const forgetMyPost = (id: string): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(loadMyPosts().filter((p) => p.id !== id))
    );
  } catch {
    /* ignore */
  }
};

/**
 * Copy text to the clipboard. `navigator.clipboard` needs a secure context —
 * when the app is opened over plain http on the LAN (192.168.x.x) it may be
 * unavailable, so we fall back to the classic hidden-textarea path.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
};
