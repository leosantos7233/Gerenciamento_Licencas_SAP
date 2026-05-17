import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  largura?: "sm" | "md" | "lg";
}

const tamanhos = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ aberto, onFechar, titulo, descricao, children, largura = "md" }: Props) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onFechar} />
      <div className={`relative card w-full ${tamanhos[largura]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
            {descricao && <p className="text-sm text-slate-500 mt-1">{descricao}</p>}
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
