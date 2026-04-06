import { todosArray } from "@/app/utils/todos";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // params validation
        const { id } = await params;
        const todoId = Number(id);

        if (Number.isNaN(todoId)) {
            return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
        }

        // request body validation
        const body = await request.json();
        const todo = todosArray.find((item) => item.id === todoId);

        if (!todo) {
            return NextResponse.json({ error: `Todo with id ${id} not found` }, { status: 404 });
        }

        const { title, desc } = body;
        if (!title && !desc) {
            return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
        }

        if (title) todo.title = title;
        if (desc) todo.desc = desc;

        return NextResponse.json({ data: todo }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update Todo!" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const todoId = Number(id);

        if (Number.isNaN(todoId)) {
            return NextResponse.json({ error: "Invalid Todo Id!" }, { status: 400 })
        };

        const body = await request.json();
        const todo = todosArray.find((item) => item.id === todoId);

        if (!todo) {
            return NextResponse.json({ error: `Todo with id ${id} not found` }, { status: 404 });
        }





    } catch (error) {

    }

}
