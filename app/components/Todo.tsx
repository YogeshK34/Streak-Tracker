"use client";
import { useEffect, useState } from "react";
import { createTodo, getTodos } from "../services/todo";
import { TodoItem } from "../types/Todo";


export function Todo() {
    const [title, setTitle] = useState<string>("");
    const [desc, setDesc] = useState<string>("");
    const [todos, setTodos] = useState<TodoItem[]>([]);

    useEffect(() => {
        getTodos().then((res) => {
            setTodos(res.data);
        });
    }, []);

    const handleAdd = async () => {
        if (!title || !desc)
            return alert("Title and description both are required");

        const res = await createTodo(title, desc);
        setTodos((prev) => [...prev, res.data]);

        // clear the inputs 
        setTitle("");
        setDesc("");
    };

    return (
        <section className="mx-auto w-full max-w-4xl px-4 pb-12 md:px-8">
            <div className="surface-panel mb-6 rounded-3xl p-6 md:p-8">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Focus System</p>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Ship Your Best Day</h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-600 md:text-base">Capture high-impact tasks and keep momentum with a clean, modern workflow.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-200/80 bg-cyan-50/90 px-4 py-2 text-sm font-medium text-cyan-700 md:self-auto">
                        <span className="h-2 w-2 rounded-full bg-cyan-500" />
                        {todos.length} Active {todos.length === 1 ? "Task" : "Tasks"}
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <label className="group block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Title</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Launch sprint planning"
                            className="w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/40"
                        />
                    </label>

                    <label className="group block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</span>
                        <input
                            type="text"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Lock agenda and prep notes"
                            className="w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/40"
                        />
                    </label>

                    <button
                        onClick={handleAdd}
                        className="mt-[1.65rem] inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                        Add Task
                    </button>
                </div>
            </div>

            {todos.length === 0 ? (
                <div className="surface-panel rounded-3xl p-10 text-center">
                    <p className="text-lg font-medium text-slate-800">No tasks yet</p>
                    <p className="mt-2 text-sm text-slate-600">Add your first todo and start shaping your day.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {todos.map((todo) => (
                        <article key={todo.id} className="surface-card rounded-3xl p-5">
                            <div className="mb-3 inline-flex rounded-full border border-slate-300/70 bg-slate-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Task #{todo.id}
                            </div>
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{todo.title}</h2>
                            <p className="mt-2 text-slate-600">{todo.desc}</p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}