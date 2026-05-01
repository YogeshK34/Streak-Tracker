import { supabase } from "@/lib/supabase-client";

export type DSNote = {
  id: number;
  ds_name: string;
  concept_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

async function getAuthToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) {
    console.error("❌ Auth error:", error?.message || "No session");
    throw new Error("Not authenticated");
  }
  return session.access_token;
}

export async function getDSNotes() {
  try {
    const token = await getAuthToken();
    console.log("📥 Fetching DS notes...");
    const res = await fetch("/api/dsnotes", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("❌ Fetch failed:", res.status, error);
      throw new Error(`Failed to fetch DS notes: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Fetched notes:", json.data?.length || 0);
    return json as Promise<{ data: DSNote[] }>;
  } catch (error) {
    console.error("❌ getDSNotes error:", error);
    throw error;
  }
}

export async function addDSNote(
  dsName: string,
  conceptName: string,
  notes: string
) {
  try {
    const token = await getAuthToken();
    console.log(`📤 Adding DS note: ${conceptName} in ${dsName}...`);
    const res = await fetch("/api/dsnotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ds_name: dsName,
        concept_name: conceptName,
        notes: notes,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("❌ Add failed:", res.status, error);
      throw new Error(
        `Failed to add note: ${res.status} - ${JSON.stringify(error)}`
      );
    }

    const json = await res.json();
    console.log("✅ Note added successfully:", json);
    return json;
  } catch (error) {
    console.error("❌ addDSNote error:", error);
    throw error;
  }
}

export async function deleteDSNote(id: number) {
  try {
    const token = await getAuthToken();
    console.log(`📤 Deleting DS note: ${id}...`);
    const res = await fetch(`/api/dsnotes?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("❌ Delete failed:", res.status, error);
      throw new Error(`Failed to delete note: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Note deleted successfully:", json);
    return json;
  } catch (error) {
    console.error("❌ deleteDSNote error:", error);
    throw error;
  }
}

export async function updateDSNote(
  id: number,
  dsName: string,
  conceptName: string,
  notes: string
) {
  try {
    const token = await getAuthToken();
    console.log(`📤 Updating DS note: ${id}...`);
    const res = await fetch("/api/dsnotes", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        ds_name: dsName,
        concept_name: conceptName,
        notes: notes,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("❌ Update failed:", res.status, error);
      throw new Error(`Failed to update note: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Note updated successfully:", json);
    return json;
  } catch (error) {
    console.error("❌ updateDSNote error:", error);
    throw error;
  }
}
