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

function stripCodeBlocks(text: string): string {
  return text.replace(/\[CODE_BLOCK:[^\]]*\]([\s\S]*?)\[\/CODE_BLOCK\]/g, "");
}

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

    const { data: notes, error } = await supabase
      .from("ds_notes")
      .select("id, ds_name, concept_name, notes, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const exportData = {
      metadata: {
        export_date: new Date().toISOString(),
        total_notes: notes?.length || 0,
      },
      notes: notes || [],
    };

    if (format === "csv") {
      let csv = "#,Data Structure,Concept,Notes,Added On,Last Updated\n";
      (notes || []).forEach((n: any, index: number) => {
        const notesStripped = stripCodeBlocks(n.notes);
        const notes_csv = `"${notesStripped.replace(/"/g, '""').replace(/\n/g, " ")}"`;
        const concept = `"${n.concept_name.replace(/"/g, '""')}"`;
        const ds = `"${n.ds_name.replace(/"/g, '""')}"`;
        csv += `${index + 1},${ds},${concept},${notes_csv},${n.created_at},${n.updated_at}\n`;
      });

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="dsnotes-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else if (format === "excel") {
      const worksheetData = [
        ["#", "Data Structure", "Concept", "Notes", "Added On", "Last Updated"],
        ...(notes || []).map((n: any, index: number) => [
          index + 1,
          n.ds_name,
          n.concept_name,
          stripCodeBlocks(n.notes),
          n.created_at,
          n.updated_at,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Freeze header row
      worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

      // Auto-fit column widths
      const colWidths = [
        { wch: 5 },
        { wch: 20 },
        { wch: 25 },
        { wch: 50 },
        { wch: 25 },
        { wch: 25 },
      ];
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "DS Notes");

      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="dsnotes-export-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    } else {
      // JSON format (default)
      return NextResponse.json(exportData, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="dsnotes-export-${new Date().toISOString().split("T")[0]}.json"`,
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
