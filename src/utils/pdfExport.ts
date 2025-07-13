import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import WSJFPDFDocument from './WSJFPDFDocument';
import React from 'react';

export interface RankedInitiative {
  id: string;
  createdAt: string;
  name: string;
  uv: number;
  tc: number;
  rr: number;
  cr: number;
  jobSize: number;
  costOfDelay: number;
  wsjf: number;
}

export interface WeightSettings {
  uv: number;
  tc: number;
  rr: number;
  cr: number;
}

export interface ExportValidation {
  isValid: boolean;
  message?: string;
}

export const validateExportData = (
  initiatives: RankedInitiative[],
  weights: WeightSettings
): ExportValidation => {
  if (!initiatives || initiatives.length === 0) {
    return {
      isValid: false,
      message: 'No initiatives available to export. Please add at least one initiative.',
    };
  }

  if (!weights || typeof weights !== 'object') {
    return {
      isValid: false,
      message: 'Invalid weight settings for export.',
    };
  }

  return { isValid: true };
};

export const exportToPDF = async (
  initiatives: RankedInitiative[],
  weights: WeightSettings
): Promise<void> => {
  try {
    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `wsjf-prioritization-${timestamp}.pdf`;

    // Create PDF document
    const document = React.createElement(WSJFPDFDocument, {
      initiatives,
      weights,
      timestamp: new Date().toLocaleString(),
    });

    // Generate PDF blob
    const blob = await pdf(document).toBlob();

    // Save the PDF file
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};
