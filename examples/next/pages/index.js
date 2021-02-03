import Head from 'next/head'

const Home = () => (
  <div className="container">
    <Head>
      <title>Create Next App</title>
      <link rel="icon" href={`${process.env.STATIC_URL}/favicon.ico`} />
    </Head>

    <main>
      <h1 className="title">Welcome to Next.js!</h1>

      <p className="description">
        Get started by editing <code>pages/index.js</code>
      </p>
      <p className="description">
        The SSR app is hosted on{' '}
        <a href="https://cloud.tencent.com/product/ssr" target="_blank" rel="noopener noreferrer">
          Serverless SSR
        </a>
      </p>
    </main>
  </div>
)

export default Home
