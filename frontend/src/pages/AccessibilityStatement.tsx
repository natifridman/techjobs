import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Accessibility, Mail, MessageCircle, Languages } from "lucide-react";

// Configuration: Update this date when the accessibility statement is reviewed
// TODO: Remember to update these dates whenever accessibility features are modified
const ACCESSIBILITY_STATEMENT_LAST_UPDATED = {
  en: "January 13, 2026",
  he: "13 בינואר 2026"
} as const;

type Language = 'en' | 'he';

const content = {
  en: {
    title: "Accessibility Statement",
    subtitle: "TechJobsIL is committed to making our website accessible to people with disabilities",
    generalTitle: "General Statement",
    generalText1: "TechJobsIL places great emphasis on providing equal service to all its users, including people with disabilities. We work to make the site accessible in accordance with the Israeli Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adjustments), 2013 and in accordance with Israeli Standard 5568, which is based on WCAG 2.1 Level AA.",
    generalText2: "As part of our commitment to accessibility, we invest significant resources to make it as easy as possible to use the site for people with disabilities, and to improve the browsing experience for all users.",
    featuresTitle: "Accessibility Features on the Site",
    features: [
      "Keyboard-only navigation - All site functions are accessible via keyboard",
      '"Skip to main content" link - Allows quick navigation to the main content on every page',
      "Proper semantic structure - Use of semantic HTML tags for easy navigation with screen readers",
      "Alternative text for images - All images contain text descriptions",
      "Color contrast - Maintaining a minimum contrast ratio of 4.5:1 for regular text",
      "Clear focus indicators - Visible indication of the selected element",
      "ARIA labels - Use of accessibility labels for all interactive elements",
      "Live announcements - Dynamic updates are announced to screen readers",
      "Screen reader support - The site has been tested and supports common screen readers",
    ],
    keyboardTitle: "Keyboard Navigation",
    keyboardKeys: [
      { key: "Tab", desc: "Move to next element" },
      { key: "Shift + Tab", desc: "Move to previous element" },
      { key: "Enter", desc: "Activate link/button" },
      { key: "Escape", desc: "Close popup/menu" },
      { key: "Arrows", desc: "Navigate menus and lists" },
      { key: "Space", desc: "Select option" },
    ],
    browsersTitle: "Browsers and Assistive Technologies",
    browsersIntro: "The site has been tested and is compatible with:",
    browsers: [
      "Browsers: Chrome, Firefox, Safari, Edge (latest versions)",
      "Screen readers: NVDA, JAWS, VoiceOver",
      "Operating systems: Windows, macOS, iOS, Android",
    ],
    contactTitle: "Contact Us About Accessibility",
    contactText: "If you encounter an accessibility issue on the site, or if you have suggestions for improving accessibility, please contact us and we will make every effort to address your inquiry as soon as possible.",
    contactNote: "Please include the page URL and description of the issue in your message",
    contactEmailLabel: "Send email about accessibility",
    standardsTitle: "Standards and Regulations",
    standardsIntro: "The site complies with the following standards:",
    standards: [
      "WCAG 2.1 Level AA (Web Content Accessibility Guidelines)",
      "Israeli Standard SI 5568 - Web Content Accessibility",
      "Equal Rights for Persons with Disabilities Act, 1998",
      "Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adjustments), 2013",
    ],
    lastUpdate: "This accessibility statement was last updated on:",
    backHome: "Back to Home",
    langSwitch: "עברית",
  },
  he: {
    title: "הצהרת נגישות",
    subtitle: "TechJobsIL מחויבת להנגשת האתר לאנשים עם מוגבלויות",
    generalTitle: "הצהרה כללית",
    generalText1: 'אתר TechJobsIL שם דגש רב על מתן שירות שוויוני לכל לקוחותיו, לרבות אנשים עם מוגבלות. אנו פועלים להנגשת האתר בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013 ובהתאם לתקן הישראלי ת"י 5568 המבוסס על תקן WCAG 2.1 ברמה AA.',
    generalText2: "במסגרת מחויבותנו לנגישות, אנו משקיעים משאבים רבים בכדי להקל ככל הניתן על השימוש באתר עבור אנשים עם מוגבלות, ובשיפור חוויית הגלישה באתר עבור כלל המשתמשים.",
    featuresTitle: "התאמות הנגישות באתר",
    features: [
      "ניווט באמצעות מקלדת בלבד - כל פונקציות האתר נגישות באמצעות מקלדת",
      'קישור "דלג לתוכן הראשי" - מאפשר דילוג מהיר לתוכן המרכזי בכל עמוד',
      "מבנה סמנטי תקין - שימוש בתגיות HTML סמנטיות לניווט קל עם קוראי מסך",
      "טקסט חלופי לתמונות - כל התמונות מכילות תיאור טקסטואלי",
      "ניגודיות צבעים - שמירה על יחס ניגודיות מינימלי של 4.5:1 לטקסט רגיל",
      "מיקוד (Focus) ברור - אינדיקציה ויזואלית ברורה לאלמנט הנבחר",
      "תוויות ARIA - שימוש בתוויות נגישות לכל האלמנטים האינטראקטיביים",
      "הודעות חיות - עדכונים דינמיים מוכרזים לקוראי מסך",
      "תמיכה בקוראי מסך - האתר נבדק ותומך בקוראי מסך נפוצים",
    ],
    keyboardTitle: "ניווט במקלדת",
    keyboardKeys: [
      { key: "Tab", desc: "מעבר לאלמנט הבא" },
      { key: "Shift + Tab", desc: "מעבר לאלמנט הקודם" },
      { key: "Enter", desc: "הפעלת קישור/כפתור" },
      { key: "Escape", desc: "סגירת חלון קופץ/תפריט" },
      { key: "חצים", desc: "ניווט בתפריטים ורשימות" },
      { key: "Space", desc: "בחירת אפשרות" },
    ],
    browsersTitle: "דפדפנים וטכנולוגיות מסייעות",
    browsersIntro: "האתר נבדק ותואם לשימוש עם:",
    browsers: [
      "דפדפנים: Chrome, Firefox, Safari, Edge (גרסאות עדכניות)",
      "קוראי מסך: NVDA, JAWS, VoiceOver",
      "מערכות הפעלה: Windows, macOS, iOS, Android",
    ],
    contactTitle: "יצירת קשר בנושא נגישות",
    contactText: "אם נתקלתם בבעיית נגישות באתר, או שיש לכם הצעות לשיפור הנגישות, אנא פנו אלינו ואנו נעשה כל מאמץ לטפל בפנייתכם בהקדם האפשרי.",
    contactNote: "בכל פניה נא לציין את כתובת העמוד ותיאור הבעיה",
    contactEmailLabel: "שלח אימייל לנושא נגישות",
    standardsTitle: "תקנים ורגולציה",
    standardsIntro: "האתר פועל בהתאם לתקנים הבאים:",
    standards: [
      "תקן WCAG 2.1 ברמה AA (Web Content Accessibility Guidelines)",
      'תקן ישראלי ת"י 5568 - נגישות תכנים באינטרנט',
      'חוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998',
      'תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013',
    ],
    lastUpdate: "הצהרת נגישות זו עודכנה לאחרונה בתאריך:",
    backHome: "חזרה לדף הבית",
    langSwitch: "English",
  },
};

export default function AccessibilityStatement() {
  const [lang, setLang] = useState<Language>('en');
  const t = content[lang];
  const isRTL = lang === 'he';

  // Update document lang attribute for screen readers
  useEffect(() => {
    const originalLang = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = originalLang;
    };
  }, [lang]);

  const lastUpdatedDate = ACCESSIBILITY_STATEMENT_LAST_UPDATED[lang];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-warm-50 to-iris-50/30 ${isRTL ? 'direction-rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <main>
        {/* Hero Section */}
        <header className="bg-gradient-to-r from-iris-700 via-iris-800 to-iris-900 text-white">
          <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur">
                  <Accessibility className="w-8 h-8" aria-hidden="true" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">{t.title}</h1>
              </div>
              {/* Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white gap-2"
                aria-label={`Switch to ${lang === 'en' ? 'Hebrew' : 'English'}`}
              >
                <Languages className="w-4 h-4" aria-hidden="true" />
                {t.langSwitch}
              </Button>
            </div>
            <p className="text-lg text-iris-100">
              {t.subtitle}
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 space-y-8">
          
          {/* General Statement */}
          <section aria-labelledby="general-statement">
            <h2 id="general-statement" className="text-2xl font-bold text-warm-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-iris-600 rounded-full"></span>
              {t.generalTitle}
            </h2>
            <div className="prose prose-warm max-w-none text-warm-700 leading-relaxed space-y-4">
              <p>{t.generalText1}</p>
              <p>{t.generalText2}</p>
            </div>
          </section>

          {/* Accessibility Features */}
          <section aria-labelledby="accessibility-features">
            <h2 id="accessibility-features" className="text-2xl font-bold text-warm-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-iris-600 rounded-full"></span>
              {t.featuresTitle}
            </h2>
            <ul className="space-y-3 text-warm-700" role="list">
              {t.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-iris-500 rounded-full mt-2 shrink-0"></span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Keyboard Navigation */}
          <section aria-labelledby="keyboard-nav">
            <h2 id="keyboard-nav" className="text-2xl font-bold text-warm-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-iris-600 rounded-full"></span>
              {t.keyboardTitle}
            </h2>
            <div className="bg-warm-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-warm-700">
                {t.keyboardKeys.map(({ key, desc }, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <kbd className="px-3 py-1 bg-white rounded-lg shadow text-sm font-mono">{key}</kbd>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Browsers and Assistive Tech */}
          <section aria-labelledby="browsers-tech">
            <h2 id="browsers-tech" className="text-2xl font-bold text-warm-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-iris-600 rounded-full"></span>
              {t.browsersTitle}
            </h2>
            <div className="text-warm-700 space-y-4">
              <p>{t.browsersIntro}</p>
              <ul className="space-y-2" role="list">
                {t.browsers.map((browser, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-copper-500 rounded-full mt-2 shrink-0"></span>
                    <span>{browser}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section aria-labelledby="contact-section" className="bg-iris-50 rounded-xl p-6">
            <h2 id="contact-section" className="text-2xl font-bold text-warm-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-iris-600 rounded-full"></span>
              {t.contactTitle}
            </h2>
            <div className="text-warm-700 space-y-4">
              <p>{t.contactText}</p>
              <div className="flex flex-col gap-3">
                <a 
                  href="mailto:techjobsil@googlegroups.com" 
                  className="flex items-center gap-2 text-iris-600 hover:text-iris-700 transition-colors"
                  aria-label={t.contactEmailLabel}
                >
                  <Mail className="w-5 h-5" />
                  <span>techjobsil@googlegroups.com</span>
                </a>
                <div className="flex items-center gap-2 text-warm-600">
                  <MessageCircle className="w-5 h-5" />
                  <span>{t.contactNote}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Standard Compliance */}
          <section aria-labelledby="compliance">
            <h2 id="compliance" className="text-2xl font-bold text-warm-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-iris-600 rounded-full"></span>
              {t.standardsTitle}
            </h2>
            <div className="text-warm-700 space-y-4">
              <p>{t.standardsIntro}</p>
              <ul className="space-y-2" role="list">
                {t.standards.map((standard, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0"></span>
                    <span>{standard}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Last Update */}
          <div className="text-center pt-6 border-t border-warm-200">
            <p className="text-warm-500 text-sm">
              {t.lastUpdate} {lastUpdatedDate}
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline" size="lg" className="gap-2 rounded-xl">
            <Link to={createPageUrl("Home")}>
              {isRTL ? <ArrowRight className="w-4 h-4" aria-hidden="true" /> : <ArrowLeft className="w-4 h-4" aria-hidden="true" />}
              {t.backHome}
            </Link>
          </Button>
        </div>
      </div>
      </main>
    </div>
  );
}
