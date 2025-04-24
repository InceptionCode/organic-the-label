'use client'; // Error boundaries must be Client Components

export default function GlobalError({ error }: { error: Error & { errorMessage?: string } }) {
  console.error(error);

  return (
    // global-error must include html and body tags
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <p className="font-bold">{error.errorMessage}</p>
        <strong>Try again</strong>
      </body>
    </html>
  );
}
