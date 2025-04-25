// app/layout.js
export const metadata = {
  title: 'Contribuinte Legal',
  description: 'Aplicativo para gestão de documentos fiscais para contribuintes'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
} 