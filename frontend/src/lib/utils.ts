import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarData(data: string | Date | null | undefined) {
  if (!data) return "—";
  return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
}

export function formatarDataHora(data: string | Date | null | undefined) {
  if (!data) return "—";
  return format(new Date(data), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
