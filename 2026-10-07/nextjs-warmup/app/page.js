import styles from "./page.module.css";
import Link from "next/link";
import Counter from "./components/Counter";
import ServerMessage from "./components/ServerMessage";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Deploy Now
          </a>
          <a> This is home</a>
          <Link href="/about"> This is who I have become</Link>
        </div>
        <Counter />
        <ServerMessage />
      </main>
    </div>
  );
}
