// pages/404.js

import React from 'react';
import Head from 'next/head'; // This is safe, as it only injects content into the head.

function Custom404() {
  return (
    <>
      {/* Head component is safe for meta tags/title */}
      <Head>
        <title>404 - Page Not Found</title>
      </Head>
      
      {/* Use standard HTML elements (div, h1, p) inside the body */}
      <div style={{ textAlign: 'center', paddingTop: '50px' }}>
        <h1>404</h1>
        <p>The page you are looking for does not exist.</p>
        <p>Error Code: No-Document-Import-In-Page</p> 
        {/* You can add a link back to the homepage here */}
      </div>
    </>
  );
}

export default Custom404;