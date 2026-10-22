"use client";

import { ChevronDown, Download } from "lucide-react";
import type { NavItem, SubLink } from "./navTypes";

interface MobileNavDrawerProps {
  navItems: NavItem[];
  mobileMenuOpen: boolean;
  gimigkkPanelOpen: boolean;
  activeAccordion: number | null;
  onToggleAccordion: (index: number | null) => void;
  onCloseMobileMenu: () => void;
  onCloseGimigkkPanel: () => void;
  onSublinkClick: (sublink: SubLink) => void;
}

const PANEL_CLASS =
  "md:hidden fixed top-11.75 inset-x-0 z-45 max-h-[calc(100svh-48px)] overflow-y-auto bg-white border-t border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-b-2xl px-4 py-4 flex flex-col gap-1";
const ROW_CLASS =
  "flex items-center justify-between w-full py-3 text-sm font-medium text-zinc-800 hover:text-zinc-950 transition-colors duration-200 tracking-tight cursor-pointer focus:outline-none";
const SUB_ROW_CLASS =
  "text-left text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors duration-200 tracking-tight py-1.5 cursor-pointer focus:outline-none";

export default function MobileNavDrawer({
  navItems,
  mobileMenuOpen,
  gimigkkPanelOpen,
  activeAccordion,
  onToggleAccordion,
  onCloseMobileMenu,
  onCloseGimigkkPanel,
  onSublinkClick,
}: MobileNavDrawerProps) {
  return (
    <>
      {/* @gimigkk mobile panel */}
      {gimigkkPanelOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onCloseGimigkkPanel}
          />
          <div className={PANEL_CLASS}>
            <div>
              <button
                type="button"
                onClick={() => onToggleAccordion(activeAccordion === 0 ? null : 0)}
                className={ROW_CLASS}
              >
                <span>Socials</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ease-out ${
                    activeAccordion === 0 ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              <div
                className="grid overflow-hidden transition-all duration-300"
                style={{
                  gridTemplateRows: activeAccordion === 0 ? "1fr" : "0fr",
                  opacity: activeAccordion === 0 ? 1 : 0,
                }}
              >
                <div className="min-h-0">
                  <div className="pb-3 pl-2 flex flex-col gap-2 pt-1">
                    {navItems[0].sublinks.map((sublink) => (
                      <button
                        key={sublink.label}
                        type="button"
                        onClick={() => {
                          onSublinkClick(sublink);
                          onCloseGimigkkPanel();
                        }}
                        className={SUB_ROW_CLASS}
                      >
                        {sublink.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hamburger mobile panel */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onCloseMobileMenu}
          />
          <div className={PANEL_CLASS}>
            {navItems.slice(1).map((item, idx) => {
              const i = idx + 1;
              const isOpen = activeAccordion === i;

              return (
                <div key={item.label} className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-label={item.label}
                    onClick={() => onToggleAccordion(isOpen ? null : i)}
                    className={ROW_CLASS}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ease-out ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </button>

                  <div
                    className="grid overflow-hidden transition-all duration-300"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="min-h-0">
                      <div className="pb-3 pl-2 flex flex-col gap-2 pt-1">
                        {item.sublinks.map((sublink) => (
                          <button
                            key={sublink.label}
                            type="button"
                            onClick={() => {
                              onSublinkClick(sublink);
                              onCloseMobileMenu();
                            }}
                            className={`flex items-center justify-between w-full ${SUB_ROW_CLASS}`}
                          >
                            <span>{sublink.label}</span>
                            {sublink.icon === "download" && <Download className="w-4 h-4 mr-2" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
