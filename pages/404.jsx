import Head from "next/head";
import Link from "next/link";
import styles from '../styles/404.module.css'

export default function Custom404() {
    return (
        <>
            <Head>
                <title>DiscordSRV | Not Found</title>
            </Head>
            <div className={styles.notFound}>
                <h2>404 Not Found</h2>
                <p>Took a wrong turn?</p>
                <Link href="/">Return to homepage</Link>
            </div>
        </>
    );
}
