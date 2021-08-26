import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <div>
        <a href="/">
          <img src="/images/logo.svg" alt="logo" />
        </a>
      </div>
    </header>
  );
}
