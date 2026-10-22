export interface SubLink {
  label: string;
  target: string;
  href?: string;
  external?: boolean;
  icon?: string;
}

export interface NavItem {
  label: string;
  target: string;
  sublinks: SubLink[];
  isLogo?: boolean;
}
