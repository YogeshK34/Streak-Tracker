/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const format = req.nextUrl.searchParams.get("format") || "json";

    const { data: problems, error } = await supabase
      .from("leetcode_problems")
      .select("id, problem_date, problem_name, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const exportData = {
      metadata: {
        export_date: new Date().toISOString(),
        total_problems: problems?.length || 0,
      },
      problems: problems || [],
    };

    if (format === "csv") {
      let csv = "Problem #,Problem Name,Description,Date Solved,Added On\n";
      (problems || []).forEach((p: any, index: number) => {
        const desc = p.description ? `"${p.description.replace(/"/g, '""')}"` : "";
        const name = `"${p.problem_name.replace(/"/g, '""')}"`;
        csv += `${index + 1},${name},${desc},${p.problem_date},${p.created_at}\n`;
      });

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="leetcode-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else if (format === "excel") {
      const worksheetData = [
        ["Problem #", "Problem Name", "Description", "Date Solved", "Added On"],
        ...(problems || []).map((p: any, index: number) => [
          index + 1,
          p.problem_name,
          p.description || "",
          p.problem_date,
          p.created_at,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Freeze header row
      worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

      // Auto-fit column widths
      const colWidths = [
        { wch: 10 },
        { wch: 30 },
        { wch: 40 },
        { wch: 15 },
        { wch: 25 },
      ];
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "LeetCode Problems");

      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="leetcode-export-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    } else {
      // JSON format (default)
      return NextResponse.json(exportData, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="leetcode-export-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
