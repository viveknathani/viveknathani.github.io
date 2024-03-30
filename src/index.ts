import showdown from 'showdown';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import config from './config';
import cron from 'node-cron';
import { createAndSendHackerNewsDigest } from './hn';

const MARKDOWN_PARENT_PATH = './build/static/markdown';

type ExpressFunction = (
  req: express.Request,
  res: express.Response,
) => Promise<void>;

async function convertFromMarkdown(filePath: string) {
  const converter = new showdown.Converter({ metadata: true });
  const text = (await fs.readFile(filePath)).toString();
  const htmlBody = converter.makeHtml(text);
  const meta = converter.getMetadata() as showdown.Metadata;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>viveknathani - ${meta['title']}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta charset="utf-8">
      <link rel="stylesheet" type="text/css" href="/static/theme.css">
    </head>

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-NJ89W10549"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-NJ89W10549');
    </script>

    <body>
      ${htmlBody}
      <p></p>
      <a href="/"><- back to home</a>
    </body>
    </html>
  `;
}

function serve(
  source: string,
  type: 'AS_FILE' | 'AS_MARKDOWN_STRING' | 'AS_SLUG',
): ExpressFunction {
  return async (req: express.Request, res: express.Response) => {
    try {
      if (type === 'AS_FILE') {
        res.sendFile(path.resolve(__dirname, source));
        return;
      }
      let sourceToUse = source;
      if (type === 'AS_SLUG') {
        sourceToUse = `${source}/${req.params['slug']}.md`;
      }
      const html = await convertFromMarkdown(sourceToUse);
      res.send(html);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: '' });
    }
  };
}

process.on('unhandledRejection', (reason, promise) => {
  console.log('unhandled rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err, origin) => {
  console.log('uncaught exception: ', err, origin);
});

async function main() {
  cron.schedule('30 1 * * *', async () => {
    await createAndSendHackerNewsDigest();
  });
  const app = express();
  app.use('/static', express.static(path.join(__dirname, './static')));
  app.get('/', serve('./static/index.html', 'AS_FILE'));
  app.get(
    '/lists',
    serve(`${MARKDOWN_PARENT_PATH}/LISTS.md`, 'AS_MARKDOWN_STRING'),
  );
  app.get(
    '/blog',
    serve(`${MARKDOWN_PARENT_PATH}/blog/index.md`, 'AS_MARKDOWN_STRING'),
  );
  app.get(
    '/notes',
    serve(`${MARKDOWN_PARENT_PATH}/notes/index.md`, 'AS_MARKDOWN_STRING'),
  );
  app.get('/blog/:slug', serve(`${MARKDOWN_PARENT_PATH}/blog`, 'AS_SLUG'));
  app.get('/notes/:slug', serve(`${MARKDOWN_PARENT_PATH}/notes`, 'AS_SLUG'));
  app.get('*', serve('./static/404.html', 'AS_FILE'));
  app.listen(config.PORT, () => {
    console.log('⚡️ server is up and running!');
  });
}

main();
