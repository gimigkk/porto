import React from 'react';
import styles from './SkipIntroButton.module.css';

interface SkipIntroButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export default function SkipIntroButton({ onClick, label = 'SPACE to SKIP', className = '' }: SkipIntroButtonProps) {
  return (
    <button className={`${styles.pushable} ${className}`} onClick={onClick} aria-label="Skip Intro">
      <span className={styles.shadow}></span>
      <span className={styles.edge}></span>
      <span className={styles.front}>
        {label}
      </span>
    </button>
  );
}
