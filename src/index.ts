import express from 'express';
import path from 'path';

type ExpressFunction = (
  req: express.Request,
  res: express.Response,
) => Promise<void>;

function serveFromPath(webPagePath: string): ExpressFunction {
  return async (req: express.Request, res: express.Response) => {
    try {
      res.sendFile(path.resolve(__dirname, webPagePath));
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: '' });
    }
  };
}

async function main() {
  const app = express();
  const port = process.env.PORT || 3000;
  app.use('/static', express.static(path.join(__dirname, './static')));
  app.get('/', serveFromPath('./static/index.html'));
  app.get('*', serveFromPath('./static/404.html'));
  app.listen(port, () => {
    console.log('⚡️ server is up and running!');
  });
}

main();
