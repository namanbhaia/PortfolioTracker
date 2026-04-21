"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteAlert } from "@/lib/actions/price-alerts";

export function DeleteAlertButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteAlert(id);
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all disabled:opacity-50"
            title="Delete Alert"
        >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
    );
}
