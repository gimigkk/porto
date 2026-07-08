import { useLanguage } from "@/components/providers/LanguageProvider";
import styles from "@/components/shared/LangToggle.module.css";

export default function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="w-full flex gap-2">
      <button
        onClick={() => setLang("en")}
        className={`${styles.pushable} flex-1 ${lang === "en" ? styles.simulateActive : ""}`}
      >
        <div className={styles.animator}>
          <span className={styles.shadow}></span>
          <span className={lang === "en" ? styles.edgeDark : styles.edge}></span>
          <span className={lang === "en" ? styles.frontDark : styles.front}>
            ENGLISH
          </span>
        </div>
      </button>

      <button
        onClick={() => setLang("id")}
        className={`${styles.pushable} flex-1 ${lang === "id" ? styles.simulateActive : ""}`}
      >
        <div className={styles.animator}>
          <span className={styles.shadow}></span>
          <span className={lang === "id" ? styles.edgeDark : styles.edge}></span>
          <span className={lang === "id" ? styles.frontDark : styles.front}>
            INDONESIAN
          </span>
        </div>
      </button>
    </div>
  );
}
