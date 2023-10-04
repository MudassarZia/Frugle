/**
 * @author 684171
 */

import Head from 'next/head'
import '../styles/global.scss'

function App({ Component, pageProps }) {
  return (
      <div id="app"> 
            <Head>
                <title>Frugle</title>
                <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png"/>
                <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png"/>
                <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png"/>
                <link rel="manifest" href="/images/site.webmanifest"/>
                <link rel="mask-icon" href="/images/safari-pinned-tab.svg" color="#5bbad5"/>
                <link rel="shortcut icon" href="/images/favicon.ico"/>
                <meta name="msapplication-TileColor" content="#da532c"/>
                <meta name="msapplication-config" content="/images/browserconfig.xml"/>
                <meta name="theme-color" content="#ffffff"/>
            </Head>
            <Component {...pageProps} />
      </div>
  )
}

export default App