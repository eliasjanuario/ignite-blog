import Link from 'next/link';
import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.headerContainer}>
      <Link href="/">
        <a>
          <img src="/Logo.png" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
