/* eslint-disable react/no-unescaped-entities */
'use client';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">🎓 מדריך שימוש</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-right">
          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">ברוכים הבאים! 👋</h3>
            <p className="text-gray-700 leading-relaxed">
              אפליקציה זו מעוצבת לעזור לך ללמוד וללמד דיני תעבורה בדרך יעילה ומעניינת.
              לפניך מדריך קצר להשתמוש בכל התכונות.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">📚 קורסים ושאלות</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
              <li>בחר קורס מהתפריט העליון (כרגע "דיני תעבורה")</li>
              <li>בכל שאלה, לחץ על "הצג תשובה" כדי לראות את התשובה הנכונה</li>
              <li>שאלות בעלות תגית "חשוב" הן השאלות החשובות ביותר לבחינה</li>
              <li>השתמש בחיפוש כדי למצוא שאלות ספציפיות</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">🧠 בחן את עצמך</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
              <li>לחץ על "בחן אותי" בכל שאלה כדי לבחון את ידיעתך</li>
              <li>הקלד את תשובתך או השתמש במיקרופון לתשובה בעל פה</li>
              <li>המערכת תדרג את תשובתך באמצעות בינה מלאכותית ותתן לך משוב</li>
              <li>כל הניסיונות שלך נשמרים וניתן לצפות בהם בפנל הניהול</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">💬 עוזר אישי</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
              <li>לחץ על "שאל את העוזר" כדי לפתוח צ'אט עם עוזר בינה מלאכותית</li>
              <li>שאל כל שאלה הקשורה לדיני תעבורה</li>
              <li>העוזר יתן לך תשובות בהסתמך על מסמכי הקורס</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">👨‍💼 פנל ניהול (למנהלים)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
              <li>אם אתה מנהל או מנהל-על, לחץ על "פאנל ניהול" בכותרת העמוד</li>
              <li>ניהול משתמשים: צפה, שנה תפקידים, מחק משתמשים</li>
              <li>מסמכי RAG: הוסף קבצים ומסמכים חדשים למערכת</li>
              <li>לוגים: צפה בלוגים ודו"חות שגיאות של המערכת</li>
              <li>הערכת RAG: בחן את איכות התשובות של המערכת</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">💡 טיפים שימושיים</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
              <li>השתמש בחיפוש כדי למצוא שאלות לפי מילות חיפוש</li>
              <li>לחץ על "שאלות חשובות" להצגת רק השאלות החשובות</li>
              <li>התשובות שלך נשמרות אוטומטית וניתן לעיין בהן מאוחר יותר</li>
              <li>השתמש בחיפוש הקולי כשאתה בתנועה או לא יכול לכתוב</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">❓ שאלות נוספות?</h3>
            <p className="text-gray-700 leading-relaxed">
              אם יש לך שאלות נוספות, תוכל להשתמש בצ'אט של העוזר או לפנות דרך הקישורים בדף "אודות".
            </p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
        >
          סגור
        </button>
      </div>
    </div>
  );
}
