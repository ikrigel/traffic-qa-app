import jsPDF from 'jspdf';

interface Question {
  id: number;
  question: string;
  answer: string;
  priority?: boolean;
}

export const generatePDF = (questions: Question[], courseName: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const textWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${courseName} - Study Materials`, margin, yPosition);
  yPosition += 15;

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Questions: ${questions.length}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  // Questions
  questions.forEach(q => {
    const isLastPage = yPosition > pageHeight - 40;
    if (isLastPage) {
      doc.addPage();
      yPosition = margin;
    }

    // Question number and priority badge
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const questionLabel = `Q${q.id}${q.priority ? ' ⭐ (Priority)' : ''}`;
    doc.text(questionLabel, margin, yPosition);
    yPosition += 8;

    // Question text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const questionLines = doc.splitTextToSize(q.question, textWidth) as string[];
    doc.text(questionLines, margin, yPosition);
    yPosition += questionLines.length * 6 + 5;

    // Answer section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer:', margin, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    const answerLines = doc.splitTextToSize(q.answer, textWidth) as string[];
    doc.text(answerLines, margin, yPosition);
    yPosition += answerLines.length * 5 + 10;

    // Separator line
    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  });

  return doc;
};

export const downloadPDF = (questions: Question[], courseName: string) => {
  const doc = generatePDF(questions, courseName);
  const filename = `${courseName.replace(/\s+/g, '_')}_Study_Guide.pdf`;
  doc.save(filename);
};
