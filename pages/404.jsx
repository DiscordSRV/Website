import Head from "next/head";
import Link from "next/link";
import styles from '../styles/error.module.css'

export default function Custom404() {
    return (
        <>
            <Head>
                <title>DiscordSRV | Not Found</title>
            </Head>
            <div className={styles.error}>
                <h2>404 Not Found</h2>
                <p>Took a wrong turn?</p>
                <Link href="/">Return to homepage</Link>
            </div>
        </>
    );
}
