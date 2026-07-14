import React from 'react';
import styles from './SkipIntroButton.module.css';

interface SkipIntroButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  isActive?: boolean;
  isReady?: boolean;
}

export default function SkipIntroButton({ onClick, label = 'SPACE to SKIP', className = '', isActive = false, isReady = true }: SkipIntroButtonProps) {
  return (
    <button className={`${styles.pushable} ${isActive ? styles.simulateActive : ''} ${isReady ? styles.animateIntro : ''} ${className}`} onClick={onClick} aria-label="Skip Intro">
      <span className={styles.shadow}></span>
      <span className={styles.edge}></span>
      <span className={styles.animator}>
        <span className={styles.front}>
          {label}
        </span>
      </span>
    </button>
  );
}
