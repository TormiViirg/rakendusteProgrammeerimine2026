import styles from "../page.module.css";

import Link from "next/link";

export default function AboutMe () {
  return (
    <div className={styles.page}>
      <main className={styles.main}>

        <div className={styles.ctas}>
          <a>
            About me
          </a>
          <Link href="/">
          Back to the cave
          </Link>
        </div>
      </main>
    </div>
  );
}
