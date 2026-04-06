import { TodoEditPayload, TodoPayload } from "../types/Todo";

export async function getTodos() {
    try {
        const res = await fetch("/api/todos");

        if (!res.ok) {
            throw new Error("Failed to fetch todos!")
        };

        return res.json();

    } catch (error) {
        console.error("getTodos failed:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Unexpected error while fetching todos");
    };
};


export async function createTodo(payload: TodoPayload) {
    try {
        const res = await fetch("/api/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`Failed to create todos: ${res.status}`);
        };

        return res.json();
    } catch (error) {
        console.error("createTodo failed:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Unexpected error while creating todo");
    }
}

// I have to create 2 more services now: 
// 1. PATCH service (done)
// 2. DELETE service 
// maybe I can think about adding a PUT service as well

export async function updateTodo(payload: TodoEditPayload, id: string | number) {
    try {
        const res = await fetch(`/api/todos/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`Failed to update Todo: ${res.status}`)
        };

        return res.json();
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            throw error;
        };
        throw new Error("Failed to update Todo");
    };
};