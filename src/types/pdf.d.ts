// src/types/pdf.d.ts
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
    getNumberOfPages(): number;
    setPage(page: number): void;
  }
}

declare module 'jspdf-autotable' {
  // This module extends jsPDF, no additional exports needed
}
