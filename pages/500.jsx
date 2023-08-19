import styles from '../styles/error.module.css'
import CommonHead from "../components/CommonHead";

export default function Custom500() {
    return (
        <>
            <CommonHead>
                <title>DiscordSRV | Error</title>
            </CommonHead>
            <div className={styles.error}>
                <h2>Server error</h2>
                <p>Uh oh, looks like something went wrong. Please try again later</p>
            </div>
        </>
    );
}
