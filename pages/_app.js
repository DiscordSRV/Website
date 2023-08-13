import '../styles/global.css'
import ErrorBoundary from "../components/error_boundary";

function MyApp({ Component, pageProps }) {
  return (
      <ErrorBoundary>
          <Component {...pageProps} />
      </ErrorBoundary>
  )
}

export default MyApp
