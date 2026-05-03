import { supabase } from "@/lib/supabase-client";

export type LeetCodeProblem = {
  id: number;
  problem_date: string;
  problem_name: string;
  description: string | null;
  data_structure: string | null;
  technique: string | null;
  created_at: string;
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

export async function getLeetCodeProblems() {
  try {
    const token = await getAuthToken();
    console.log("📥 Fetching LeetCode problems...");
    const res = await fetch("/api/leetcode", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("❌ Fetch failed:", res.status, error);
      throw new Error(`Failed to fetch LeetCode problems: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Fetched problems:", json.data?.length || 0);
    return json as Promise<{ data: LeetCodeProblem[] }>;
  } catch (error) {
    console.error("❌ getLeetCodeProblems error:", error);
    throw error;
  }
}

export async function addLeetCodeProblem(
  problemDate: string,
  problemName: string,
  description: string,
  dataStructure?: string,
  technique?: string
) {
  try {
    const token = await getAuthToken();
    console.log(`📤 Adding LeetCode problem: ${problemName} on ${problemDate}...`);
    const res = await fetch("/api/leetcode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        problem_date: problemDate,
        problem_name: problemName,
        description: description,
        data_structure: dataStructure || null,
        technique: technique || null,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("❌ Add failed:", res.status, error);
      throw new Error(
        `Failed to add problem: ${res.status} - ${JSON.stringify(error)}`
      );
    }

    const json = await res.json();
    console.log("✅ Problem added successfully:", json);
    return json;
  } catch (error) {
    console.error("❌ addLeetCodeProblem error:", error);
    throw error;
  }
}

export async function deleteLeetCodeProblem(id: number) {
  try {
    const token = await getAuthToken();
    console.log(`📤 Deleting LeetCode problem: ${id}...`);
    const res = await fetch(`/api/leetcode?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("❌ Delete failed:", res.status, error);
      throw new Error(`Failed to delete problem: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Problem deleted successfully:", json);
    return json;
  } catch (error) {
    console.error("❌ deleteLeetCodeProblem error:", error);
    throw error;
  }
}

export async function updateLeetCodeProblem(
  id: number,
  problemDate: string,
  problemName: string,
  description: string,
  dataStructure?: string,
  technique?: string
) {
  try {
    const token = await getAuthToken();
    console.log(`📤 Updating LeetCode problem: ${id}...`);
    const res = await fetch("/api/leetcode", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        problem_date: problemDate,
        problem_name: problemName,
        description: description,
        data_structure: dataStructure || null,
        technique: technique || null,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("❌ Update failed:", res.status, error);
      throw new Error(`Failed to update problem: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Problem updated successfully:", json);
    return json;
  } catch (error) {
    console.error("❌ updateLeetCodeProblem error:", error);
    throw error;
  }
}

export async function exportLeetCodeData(format: "csv" | "json" | "excel") {
  try {
    const token = await getAuthToken();
    console.log(`📥 Exporting LeetCode problems as ${format}...`);
    const res = await fetch(`/api/leetcode/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to export data: ${res.status}`);
    }

    return res;
  } catch (error) {
    console.error("❌ exportLeetCodeData error:", error);
    throw error;
  }
}
