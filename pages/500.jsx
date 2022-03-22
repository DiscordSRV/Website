import Head from "next/head";
import styles from '../styles/error.module.css'

export default function Custom500() {
    return (
        <>
            <Head>
                <title>DiscordSRV | Error</title>
            </Head>
            <div className={styles.error}>
                <h2>Server error</h2>
                <p>Uh oh, looks like something went wrong. Please try again later</p>
            </div>
        </>
    );
}
