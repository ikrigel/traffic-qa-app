import { DrivingTutor } from '@/components/tutor';

export const metadata = {
  title: 'מדריך דיני תעבורה | Traffic Laws Q&A',
  description: 'שיחה עם מדריך דיני תעבורה בחכם המופעל ב-AI',
};

export default function TutorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <DrivingTutor />
    </div>
  );
}
