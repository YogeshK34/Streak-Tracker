import { todosArray } from "@/app/utils/todos";
import { NextRequest, NextResponse } from "next/server";

// GET route
export async function GET() {
    return NextResponse.json({ data: todosArray }, { status: 200 })
};

// POST route 
export async function POST(req: NextRequest) {
    // parsing the request body
    const body = await req.json();

    if (!body.title || !body.desc) {
        return NextResponse.json({ error: "Title and Desc are required" }, { status: 400 })
    }

    // I'll create object to send the whole to the user
    const newTodo = {
        id: Date.now(),
        ...body
    };

    // send the object to the user 
    return NextResponse.json({ data: newTodo }, { status: 201 })
};