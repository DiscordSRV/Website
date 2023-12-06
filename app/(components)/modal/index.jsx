import styles from './style.module.css'

export default function Index({ title, open, close, children }) {
    return (
        <div style={{display: open ? "block" : "none"}}>
            <div className={styles.modal}>
                <div className={styles.modalWrapper}>
                    <div className={styles.modalHeader}>
                        <h2>{title}</h2>
                        <button onClick={() => close()}>&times;</button>
                    </div>
                    <div className={styles.modalContent}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
