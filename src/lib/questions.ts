export interface Question {
  id: number;
  hebrew: string;
  english: string;
  answer: string;
  category: string;
  important: boolean;
  examFrequency: number;
}

export interface Course {
  id: string;
  name: string;
  hebrewName: string;
  description: string;
  questions: Question[];
}

export const TRAFFIC_LAWS_QUESTIONS: Question[] = [
  {
    id: 1,
    hebrew: "נסיעה שלא בכביש",
    english: "Driving off the road",
    answer: "תקנות התעבורה מחייבות נסיעה בכביש. מותר לנסוע שלא בכביש רק בנסיבות מיוחדות כמו: חצייה של שול הדרך, הסעת תלמידים בהוראת מורה, רכב ביטחון בשעת מילוי תפקידו, ועוד. בדרך כללית, על נוהג להישאר בכביש.",
    category: "כללי",
    important: false,
    examFrequency: 2
  },
  {
    id: 2,
    hebrew: "חובת הזהירות הכללית",
    english: "General duty of care",
    answer: "כל עובר דרך חייב להתנהג בזהירות ולא יגרום נזק לאדם או רכוש. נוהג רכב לא ינהג בקלות ראש או בלא זהירות. חובה להתחשב בסוג הרכב, המטען, מצב הבלמים, אפשרות עצירה, תמרורים, אותות שוטרים, ותנועת עוברי דרך.",
    category: "כללי",
    important: false,
    examFrequency: 3
  },
  {
    id: 3,
    hebrew: "מהירות מרבית מותרת לפי סוג דרך ולפי סוגי רכב",
    english: "Maximum speed limits by road and vehicle type",
    answer: "דרך עירונית: רכב מנועי - 50 קמ״ש. דרך שאינה עירונית: 80 קמ״ש. דרך מהירה עם הפרדה: 110 קמ״ש. אוטובוס: 100 קמ״ש בדרכים מסוימות. רכב מסחרי כבד: 80-50 קמ״ש. טרקטור: 40 קמ״ש. יש גם מהירות סבירה - התאמה לתנאי הדרך.",
    category: "מהירות",
    important: true,
    examFrequency: 8
  },
  {
    id: 4,
    hebrew: "רכב בטחון",
    english: "Security vehicle",
    answer: "רכב בטחון כולל: אמבולנס, משטרה, צה״ל, כבדים, כיבוי אש. רכב בטחון רשאי: לעבור רמזור אדום (בזהירות), לעקוף, להפר מהירות, לנסוע בנתיב לתחבורה ציבורית. חייב לנהוג בזהירות ולא להפיץ אור אדום אלא בשעת ביצוע תפקידו.",
    category: "כללי",
    important: false,
    examFrequency: 3
  },
  {
    id: 5,
    hebrew: "אחריות פלילית - מי אחראי לביצוע עבירות",
    english: "Criminal liability - responsibility for violations",
    answer: 'בעל הרכב נחשב אחראי אם לא מזוהה הנהג. הגדרת "בעל": הבעל הרשום ברישיון, או המחזיק כדין. חריג: אם בעל הרכב הוכיח למי מסר את החזקת הרכב, תחול החזקה על המחזיק. אם הרכב תאגיד - קנס גבוה פי 4.',
    category: "אחריות",
    important: false,
    examFrequency: 4
  },
  {
    id: 6,
    hebrew: "עקיפה",
    english: "Overtaking",
    answer: "עקיפה נעשית מצד שמאל בלבד. מותר לעקוף מימין רק בנסיבות מיוחדות: רכב האחר נמצא בנתיב לפנייה שמאלה, הרכב מתכוון לפנות שמאלה, או בכביש דו-סטרי עם מספר נתיבים. עקיפה בצומת אסורה למעט כבישים בעלי מספר נתיבים. חייב לתת זכות קדימה בעקיפה.",
    category: "תנועה",
    important: true,
    examFrequency: 7
  },
  {
    id: 7,
    hebrew: "חגורת בטיחות",
    english: "Seatbelt",
    answer: 'ילדים עד 3 שנים: כסא בטיחות מתאים. ילדים 3-8 שנים: כסא בטיחות או כרית מגביה. מבוגרים: חגורה חובה. בעליה/ירידה: חגורה לא חובה. פטורים: רכב ביטחון בתפקידו, מונית בעיר (נהג ונוסעים), מורה נהיגה. השוטר מסוגל לפטור בעל רישיון בשל סיבות רפואיות.',
    category: "בטיחות",
    important: true,
    examFrequency: 7
  },
  {
    id: 8,
    hebrew: "אורות: נסיעה בזמן תאורה, זמן לילה, עמעום",
    english: "Lights: daytime, night time, dimming",
    answer: "זמן לילה: רבע שעה אחרי שקיעה עד רבע שעה לפני הזריחה. בזמן תאורה: פנסים חייבים להיות דולקים. בדרך עירונית מוארת: אור גבוה אסור. עמעום: מוביל לור נמוך כשהרכב קרוב. באוטובוס: פנסים חובה בתקופות מוגדרות. במנהרה: אור ירוק שעליו כתוב הדלק אורות.",
    category: "תאורה",
    important: false,
    examFrequency: 4
  },
  {
    id: 9,
    hebrew: "שמירת רווח בנסיעה בדרך שאינה עירונית",
    english: "Safe following distance on rural roads",
    answer: "חייב לשמור על רווח המאפשר עצירה בטוחה. רווח מינימלי: זמן של שנייה אחת בין הרכבים. בנסיעה בשיירה (דרך שאינה עירונית): שמור על רווח המאפשר זרימה תקינה וכניסה רכב מאחור. רכב בטחון: מינימום 100 מטר.",
    category: "מרחק",
    important: false,
    examFrequency: 3
  },
  {
    id: 10,
    hebrew: "פניות שמאלה",
    english: "Left turns",
    answer: "פנייה שמאלה: בבטחה, במהירות סבירה, ללא הפרעה, תוך מתן אות. בכביש חד-סטרי: מ-צד שמאל של הכביש. בכביש דו-סטרי: כמה שאפשר קרוב לאמצע (ללא הפרעת תנועה ממול). כניסה לאחר פנייה: לנתיב השמאלי ביותר (או לפי סימון הנתיבים).",
    category: "פניות",
    important: true,
    examFrequency: 6
  },
  {
    id: 11,
    hebrew: "נהג חדש",
    english: "New driver",
    answer: "נהג חדש: בתוקף לשנתיים מיום מתן הרישיון. תווית נהג חדש חובה. נהג צעיר (עד 24): חוב ליווי 50 שעות (20 עירונית, 15 כפרית, 15 לילה). אם נתבע או קיבל קנס בעבירה - תקופה מתארכת. עבירות מסוימות = פסילה 30-90 ימים.",
    category: "נוהגים",
    important: true,
    examFrequency: 6
  },
  {
    id: 12,
    hebrew: "נתיב לתחבורה ציבורית",
    english: "Public transport lane",
    answer: "לא ישתמשו רכבים פרטיים בנתיב לתחבורה ציבורית למעט: מי שנתן תג נכה, מכוניות לחיילים (בתמרור), פניה ימינה בצומת קרוב, אופניים בצד החוץ. סימון: קו קטעים כפול עם מעויינים צהובים או חצים צהובים.",
    category: "נתיבים",
    important: false,
    examFrequency: 3
  },
  {
    id: 13,
    hebrew: "סטייה/פנייה, פנייה ימינה, נסיעה לאחור",
    english: "Deviation, right turn, reversing",
    answer: "פנייה ימינה: מ-צד ימין של הכביש, ללא הפרעה, בבטחה. נסיעה לאחור: רק כשצורך תחבורתי, בבטחה, לאחר בדיקה סביבית. נהג לא חגור בנסיעה לאחור. באוטובוס כבד: חייב זמזם לאחור.",
    category: "תנועה",
    important: false,
    examFrequency: 3
  },
  {
    id: 14,
    hebrew: "חניה",
    english: "Parking",
    answer: "חניה: העמדת רכב זמן כלשהו, שלא לשם הסעת אנשים/פריקת מטען מיד. חניה ללא השגחה: חייב לבלום ולהוציא מפתח. בעליה: שלב להילוך אחורי, בלום, טה גלגלים לאמצע. בירידה: שלב להילוך קדמי, בלום, טה גלגלים לשפה. אסור לחנות: בצד שמאל, בצומת, במעבר חציה, על גשר, בנתיב לתחבורה ציבורית.",
    category: "חניה",
    important: false,
    examFrequency: 3
  },
  {
    id: 15,
    hebrew: "מתן זכות קדימה בצומת (מרומזר, מתומרר, ללא, מעגל תנועה)",
    english: "Right of way at intersections",
    answer: "צומת מתומרר: עקוב אחרי התמרורים (עצור, תן זכות קדימה, או רמזור). צומת ללא תמרורים: קדימה לרכב מימין. פנייה שמאלה: תן זכות קדימה לרכב ממול. כביש ראשי: קדימה לכביש משני. מעגל תנועה: תן זכות קדימה לרכב החוצה.",
    category: "קדימה",
    important: false,
    examFrequency: 3
  },
  {
    id: 16,
    hebrew: "הנהיגה בנתיב שיועד לעובר דרך מסוים, שמירה על ימין הדרך, כניסה לצמתים",
    english: "Lane restrictions, keeping right, entering intersections",
    answer: "בנתיבים מסומנים: עבור לפי החץ שסומן. שמור על ימין: הנהג חייב להשתמש בצד הימני הקיצוני של הכביש ככל האפשר. רכב מסחרי כבד: בכביש עם מספר נתיבים - רק בנתיב הימני ביותר (אלא אם תמרור אחר מורה).",
    category: "נתיבים",
    important: false,
    examFrequency: 2
  },
  {
    id: 17,
    hebrew: "פסילת רישיון נהיגה",
    english: "License suspension/disqualification",
    answer: "פסילה בפועל (בעל רישיון תקף): מ-6 חודשים עד שנה למשך מהנהוגים. פסילה (חסר רישיון): מ-3 שנים עד שנים על פי התוקף של העבירה. פסילה משניים קנס מחוזי.",
    category: "אחריות",
    important: false,
    examFrequency: 2
  },
  {
    id: 18,
    hebrew: "סדר הופעת האור ברמזור ומשמעותן",
    english: "Traffic light sequence and meanings",
    answer: "סדר: אדום → אדום-צהוב → ירוק → ירוק מהבהב → צהוב → אדום. אדום: עצור. אדום-צהוב: הכן לנסיעה. ירוק: התקדם. ירוק מהבהב: קרוב להתחלף. צהוב: עצור אם אפשר, אחרת השלם עצירה. במקרים חריגים: צהוב מהבהב (התקדם בזהירות).",
    category: "תמרורים",
    important: false,
    examFrequency: 4
  },
  {
    id: 19,
    hebrew: "מנהרה - נסיעה ואיסור נסיעה במנהרה",
    english: "Tunnel - driving and restrictions",
    answer: "בנסיעה במנהרה: הדלק אורות (אם יש תמרור). לא יעצור בנסיעה על הרכב. מהירות סבירה. בחניה במנהרה: אסור. בנסיעה לאחור: אסור. על קלנועית: אסור. לא יחצה או ילך בנסיעה בנתיב.",
    category: "דרכים",
    important: false,
    examFrequency: 3
  },
  {
    id: 20,
    hebrew: "פניית פרסה",
    english: "U-turn",
    answer: "פנייה בשביל להסתובב ולנסוע בכיוון הנגדי. אסורה אלא בנסיבות ללא הפרעה או סיכון. אסורה: בעקומה, בפסגה, בגשר, במנהרה, בצומת, בדרך עירונית (למעט בתמרור). מותרת: בצומת בו אין סימון אוסור, בנתיב לפנייה שמאלה, בכביש חד-סטרי (בתנאי מתאימים).",
    category: "פניות",
    important: true,
    examFrequency: 5
  },
  {
    id: 21,
    hebrew: "פסילת רישיון נהיגה ע״י קצין משטרה",
    english: "License suspension by police officer",
    answer: "קצין משטרה (דרגת מפקח ומעלה) רשאי לפסול את הנהג אם: גרם לתאונת דרכים שבה נהרג אדם (90 ימים), גרם לתאונה עם פגיעה/נזק (60 ימים), עבירה מן התוספת הרביעית (30 ימים). חייב לתת הודעה על הזימון. ניתן לפסול גם בהעדרות הנהג.",
    category: "אחריות",
    important: false,
    examFrequency: 2
  },
  {
    id: 22,
    hebrew: "הנסיעה בכביש חד סטרי, בדרך משולב ובאזור מיתון תנועה",
    english: "Single-lane, mixed-use streets, and traffic calming zones",
    answer: "כביש חד-סטרי: תנועה בכיוון אחד בלבד, סומן בתמרור 618. רחוב משולב: מיועד לילדים, להולכי רגל, וברכב - מהירות מרבית 30 קמ״ש, תן מקום לילדים. אזור מיתון תנועה: מהירות מרבית 30 קמ״ש, סומן בתמרור 222 (התחלה) ו-223 (סוף).",
    category: "דרכים",
    important: false,
    examFrequency: 2
  },
  {
    id: 23,
    hebrew: "הגדר טרקטור וטרקטורון",
    english: "Tractor and mini-tractor definition",
    answer: "טרקטור: רכב מנועי לגרירה/גרירה ועבודות, רישיון דרגה 1. טרקטורון: רכב קטן (עד 1500 סמ״ק), 4 גלגלים, היגוי בכידון, לשני נוסעים, מהירות עד 40 קמ״ש, בדרך לא סלולה או בתחום מושב. טרקטור: מהירות עד 40 קמ״ש. שניהם: חובת קסדה, מסגרת בטיחות.",
    category: "רכבים",
    important: false,
    examFrequency: 2
  }
];

export const getQuestionById = (id: number): Question | undefined => {
  return QUESTIONS.find(q => q.id === id);
};

export const getImportantQuestions = (): Question[] => {
  return QUESTIONS.filter(q => q.important).sort((a, b) => b.examFrequency - a.examFrequency);
};

export const getQuestionsByCategory = (category: string): Question[] => {
  return QUESTIONS.filter(q => q.category === category);
};

export const getCategories = (): string[] => {
  return [...new Set(QUESTIONS.map(q => q.category))];
};

// Courses structure
export const COURSES: Course[] = [
  {
    id: 'traffic-laws',
    name: 'Traffic Laws',
    hebrewName: 'דיני תעבורה',
    description: 'Israeli traffic laws and regulations',
    questions: TRAFFIC_LAWS_QUESTIONS,
  },
  {
    id: 'licensing-procedures',
    name: 'Licensing Procedures',
    hebrewName: 'נהלי רישוי',
    description: 'Driver licensing procedures and requirements',
    questions: [],
  },
];

// Export for QuestionCard component (for backward compatibility)
export const TRAFFIC_LAW_QUESTIONS_FORMATTED = TRAFFIC_LAWS_QUESTIONS.map(q => ({
  id: q.id,
  question: q.hebrew,
  answer: q.answer,
  priority: q.important,
}));

export const getCourseByCourseId = (courseId: string): Course | undefined => {
  return COURSES.find(c => c.id === courseId);
};

export const getCourseQuestions = (courseId: string) => {
  const course = getCourseByCourseId(courseId);
  return course ? course.questions.map(q => ({
    id: q.id,
    question: q.hebrew,
    answer: q.answer,
    priority: q.important,
  })) : [];
};
