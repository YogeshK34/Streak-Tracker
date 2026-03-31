export const getTodos = async () => {
    const res = await fetch("/api/todos");

    if (!res.ok) {
        throw new Error("Failed to fetch Todos!")
    };

    return res.json();
};

export const createTodo = async (title: string, desc: string) => {
    const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, desc })
    });

    if (!res.ok) {
        throw new Error("Failed to create Todos!")
    };

    return res.json();
};