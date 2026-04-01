import { TodoPayload } from "../types/Todo";
// here I'll write the service files again 

// this'll only call the /api/todos endpoint  
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
