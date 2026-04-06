export type TodoItem = {
    id: number;
    title: string;
    desc: string;
};

export type TodoPayload = {
    title: string;
    desc: string;
};

export type TodoEditPayload = {
    title?: string;
    desc?: string
}