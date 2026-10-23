export interface ExperienceItem {
  id: string;
  role: string;
  roleMobile?: string;
  company: string;
  companyMobile?: string;
  startDate: string;
  endDate: string;
  impressiveness: number; // 1 to 10 scale
  description: string;
  image?: string;
  secondaryImage?: string;
  // Clothing rack visual properties
  apparelColor?: string;
  apparelSecondaryColor?: string;
  apparelType?: "tee" | "sweatshirt" | "hoodie";
  graphicText?: string;
  graphicSubtext?: string;
  frontImage?: string;
  sideImage?: string;
  garmentName?: string;
}
