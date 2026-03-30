"use client"

import { useRef, useState } from "react";

type TodoItem = {
    id: number;
    title: string;
    desc: string;
}

export default function Todo() {
    const [title, setTitle] = useState<string>("");
    const [desc, setDesc] = useState<string>("");
    const [todos, setTodos] = useState<TodoItem[]>([]);

    const nextId = useRef(1);

    // I'll write the function to add todos 
    const addTodo = (e: React.SubmitEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            return alert("Title cannot be empty!");
        };

        // here I'll create a new object and add it to the Todos array 
        const newTodoItem: TodoItem = {
            id: nextId.current++,
            title: title,
            desc: desc
        };

        // todos.push(newTodoItem);

        // here I'll guess I'll have to use spread operator to add the new todo item, also to keep the 
        // existing todos intact 
        setTodos([...todos, newTodoItem]);

        // this'll clear the form fields
        setTitle("");
        setDesc("");
    };

    return (
        <>
            <div>
                <form onSubmit={addTodo}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter Todo Title here"
                    />

                    <input
                        type="text"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Enter Todo Title here"
                    />
                    <button type="submit">Add Todo</button>
                </form>
            </div>

            <div>
                {todos.length === 0 ? (
                    <p>No todos currently</p>
                ) : (
                    todos.map((todo) => (
                        <p key={todo.id}>
                            <div>{todo.id}</div>
                            <div>{todo.title}</div>
                            <div>{todo.desc}</div>
                        </p>
                    ))
                )}
            </div>
        </>
    )
}