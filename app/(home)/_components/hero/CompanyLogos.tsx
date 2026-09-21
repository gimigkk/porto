export interface CompanyLogoItem {
  id: string;
  name: string;
  src: string;
  href?: string;
}

/**
 * All organizations & companies Gilang collaborated with.
 */
export const COMPANY_LOGOS: CompanyLogoItem[] = [
  {
    id: "ieee-sb-ipb",
    name: "IEEE Student Branch IPB University",
    src: "/logos/ieee-sb-ipb.svg",
    href: "https://ipb.ac.id",
  },
  {
    id: "stem-ieee",
    name: "STEM by IEEE IPB",
    src: "/logos/stem-ieee.svg",
  },
  {
    id: "nobraindev",
    name: "NoBrainDev Studio",
    src: "/logos/nobraindev.svg",
  },
  {
    id: "iwdc",
    name: "IWDC - IPB Web Dev Community",
    src: "/logos/iwdc.svg",
  },
  {
    id: "icodmi",
    name: "ICoDMI Conference",
    src: "/logos/icodmi.svg",
  },
  {
    id: "clyora",
    name: "Clyora Academic Team",
    src: "/logos/clyora.svg",
  },
];
