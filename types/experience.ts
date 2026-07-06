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
}
