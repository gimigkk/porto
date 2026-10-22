import { useLanguage } from "@/components/providers/LanguageProvider";
import PushButton from "@/components/ui/PushButton";

export default function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="w-full flex gap-2">
      <PushButton
        variant={lang === "en" ? "dark" : "light"}
        isActive={lang === "en"}
        onClick={() => setLang("en")}
        className="flex-1"
        frontStyle={{ padding: "12px 16px", fontSize: "12px", textAlign: "center" }}
      >
        ENGLISH
      </PushButton>

      <PushButton
        variant={lang === "id" ? "dark" : "light"}
        isActive={lang === "id"}
        onClick={() => setLang("id")}
        className="flex-1"
        frontStyle={{ padding: "12px 16px", fontSize: "12px", textAlign: "center" }}
      >
        INDONESIAN
      </PushButton>
    </div>
  );
}
