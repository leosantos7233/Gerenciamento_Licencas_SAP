// =============================================================================
// Exportação de listas para CSV (compatível com Excel pt-BR).
// Decisão: CSV com BOM UTF-8 + separador ";" — Excel BR abre sem alterar nada.
// Para .xlsx nativo precisaríamos da lib `xlsx` (peso adicional). CSV resolve.
// =============================================================================

export interface ColunaExport<T> {
  cabecalho: string;
  valor: (linha: T) => string | number | null | undefined;
}

function escapar(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  const s = String(valor);
  // Se contém ; " ou quebra de linha, envolve em aspas e escapa aspas internas
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportarCsv<T>(opts: {
  nomeArquivo: string;
  colunas: ColunaExport<T>[];
  linhas: T[];
}) {
  const cabecalho = opts.colunas.map((c) => escapar(c.cabecalho)).join(";");
  const corpo = opts.linhas
    .map((linha) => opts.colunas.map((c) => escapar(c.valor(linha))).join(";"))
    .join("\r\n");
  const conteudo = "﻿" + cabecalho + "\r\n" + corpo; // BOM + CRLF
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = opts.nomeArquivo.endsWith(".csv") ? opts.nomeArquivo : `${opts.nomeArquivo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
