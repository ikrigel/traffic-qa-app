import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Question {
  id: number;
  question: string;
  answer: string;
  priority?: boolean;
}

export const downloadPDF = async (questions: Question[], courseName: string) => {
  // Create a temporary container with all the content
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.backgroundColor = 'white';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.direction = 'rtl';
  container.style.textAlign = 'right';

  // Add title
  const title = document.createElement('h1');
  title.textContent = `${courseName} - חומר לימודי`;
  title.style.textAlign = 'center';
  title.style.marginBottom = '20px';
  title.style.fontSize = '24px';
  title.style.fontWeight = 'bold';
  container.appendChild(title);

  // Add metadata
  const meta = document.createElement('p');
  meta.innerHTML = `<strong>סה"כ שאלות:</strong> ${questions.length}<br/><strong>תאריך יצירה:</strong> ${new Date().toLocaleDateString('he-IL')}`;
  meta.style.marginBottom = '30px';
  meta.style.fontSize = '14px';
  container.appendChild(meta);

  // Add questions
  questions.forEach(q => {
    const questionDiv = document.createElement('div');
    questionDiv.style.marginBottom = '30px';
    questionDiv.style.borderBottom = '1px solid #ddd';
    questionDiv.style.paddingBottom = '20px';

    // Question header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '10px';
    header.style.direction = 'rtl';

    const qLabel = document.createElement('strong');
    qLabel.textContent = `שאלה ${q.id}`;
    qLabel.style.fontSize = '16px';
    header.appendChild(qLabel);

    if (q.priority) {
      const badge = document.createElement('span');
      badge.textContent = '⭐ חשוב';
      badge.style.backgroundColor = '#fee2e2';
      badge.style.color = '#991b1b';
      badge.style.padding = '4px 8px';
      badge.style.borderRadius = '4px';
      badge.style.fontSize = '12px';
      header.appendChild(badge);
    }
    questionDiv.appendChild(header);

    // Question text
    const questionText = document.createElement('p');
    questionText.textContent = q.question;
    questionText.style.fontSize = '14px';
    questionText.style.marginBottom = '12px';
    questionText.style.lineHeight = '1.6';
    questionDiv.appendChild(questionText);

    // Answer label
    const answerLabel = document.createElement('strong');
    answerLabel.textContent = 'תשובה:';
    answerLabel.style.display = 'block';
    answerLabel.style.marginBottom = '8px';
    questionDiv.appendChild(answerLabel);

    // Answer text
    const answerText = document.createElement('p');
    answerText.textContent = q.answer;
    answerText.style.fontSize = '14px';
    answerText.style.marginBottom = '0';
    answerText.style.lineHeight = '1.6';
    answerText.style.color = '#333';
    questionDiv.appendChild(answerText);

    container.appendChild(questionDiv);
  });

  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPosition = 10;

    // Add images to PDF, splitting across pages
    let currentHeight = 0;
    while (currentHeight < imgHeight) {
      if (currentHeight > 0) {
        doc.addPage();
        yPosition = 10;
      }

      const remainingHeight = imgHeight - currentHeight;
      const pageRemainingHeight = pageHeight - 20;
      const drawHeight = Math.min(remainingHeight, pageRemainingHeight);

      const sourceY = (currentHeight / imgHeight) * canvas.height;
      const sourceHeight = (drawHeight / imgHeight) * canvas.height;

      // Create temporary canvas for this section
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = sourceHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        );
        const sectionImgData = tempCanvas.toDataURL('image/png');
        doc.addImage(sectionImgData, 'PNG', 10, yPosition, imgWidth, drawHeight);
      }

      currentHeight += drawHeight;
    }

    // Save PDF
    const filename = `${courseName.replace(/\s+/g, '_')}_Study_Guide.pdf`;
    doc.save(filename);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};
