import showdown from 'showdown';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import config from './config';

type ExpressFunction = (
  req: express.Request,
  res: express.Response,
) => Promise<void>;

interface BlogMeta {
  slug: string;
  title: string;
  tags: string[];
  filePath: string;
  date: Date;
}

const MARKDOWN_PARENT_PATH = './build/static/markdown';
const BLOGS_PATH = `${MARKDOWN_PARENT_PATH}/blog`;
const tagMap: Map<string, BlogMeta[]> = new Map();
let allBlogs: BlogMeta[] = [];

const tagColors = [
  '#e7ceceff', // Darker pastel pink
  '#cfe6c9ff', // Darker pastel green
  '#cbe2e9ff', // Darker pastel blue
  '#dac4daff', // Darker pastel lavender
  '#e9ded6ff', // Darker pastel peach
  '#d5d8e7ff', // Darker pastel periwinkle
  '#efe4d7ff', // Darker pastel yellow
  '#c8e6dbff', // Darker pastel turquoise
  '#e4d2caff', // Darker pastel coral
  '#cee9e7ff', // Darker pastel cyan
];

function colorForTag(tag: string): string {
  let sum = 0;
  for (let i = 0; i < tag.length; i++) {
    sum += tag.charCodeAt(i);
  }
  const index = sum % tagColors.length;
  return tagColors[index];
}

function extractTags(metadata: showdown.Metadata): string[] {
  if (!metadata['tags']) return [];
  const tagsRaw = metadata['tags'];
  return tagsRaw.split(',').map((tag) => tag.trim());
}

function getTagsHtml(tags: string[]): string {
  return tags.length > 0
    ? `<div style="margin-top: 10px;">${tags
        .map(
          (tag) =>
            `<a href="/blog?tag=${encodeURIComponent(
              tag,
            )}" style="text-decoration:none; display:inline-block; background-color: ${colorForTag(
              tag,
            )}; color: #222; padding: 3px 10px; border-radius: 12px; margin-right: 6px; margin-bottom: 6px; font-size: 0.85em; user-select:none; cursor:pointer;">${tag}</a>`,
        )
        .join('')}</div>`
    : '';
}

async function convertFromMarkdown(filePath: string) {
  const converter = new showdown.Converter({ metadata: true });
  const text = (await fs.readFile(filePath)).toString();
  const htmlBody = converter.makeHtml(text);
  const meta = converter.getMetadata() as showdown.Metadata;
  const title = meta['title'];
  const description = 'viveknathani - blog';
  const tags = extractTags(meta);
  const tagsHtml = getTagsHtml(tags);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>viveknathani - ${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta charset="utf-8">
      <link rel="stylesheet" type="text/css" href="/static/theme.css">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
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
      <main>
        ${tagsHtml}
        ${htmlBody}
        <p></p>
        <a href="/"><- back to home</a>
      </main>
    </body>
    </html>
  `;
}

function serve(
  source: string,
  type: 'AS_FILE' | 'AS_MARKDOWN_STRING' | 'AS_SLUG',
  downloadable: boolean = false,
): ExpressFunction {
  return async (req: express.Request, res: express.Response) => {
    try {
      if (type === 'AS_FILE') {
        if (downloadable) {
          const downloadFilename = path.basename(source);
          res.setHeader(
            'Content-Disposition',
            `inline; filename="${downloadFilename}"`,
          );
          res.setHeader(
            'Content-Type',
            `application/${downloadFilename.split('.').pop()}`,
          );
        }
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

// Load all blog metadata and build tag map
async function loadBlogsMetadata() {
  allBlogs = [];
  tagMap.clear();
  const files = await fs.readdir(BLOGS_PATH);
  // read only .md files for blogs except index.md
  const blogFiles = files.filter((f) => f.endsWith('.md') && f !== 'index.md');

  const converter = new showdown.Converter({ metadata: true });

  for (const file of blogFiles) {
    const filePath = path.join(BLOGS_PATH, file);
    const text = (await fs.readFile(filePath)).toString();
    converter.makeHtml(text);
    const meta = converter.getMetadata() as showdown.Metadata;

    const slug = file.replace(/\.md$/, '');
    const title = meta['title'] || slug;
    const tags = extractTags(meta);
    const date = new Date(meta['date']);
    const draft = meta['draft'] === 'true';

    if (draft) continue;

    const blogMeta: BlogMeta = { slug, title, tags, filePath, date };

    allBlogs.push(blogMeta);

    // build tag mapping
    tags.forEach((tag) => {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push(blogMeta);
    });
  }
}

async function main() {
  await loadBlogsMetadata();
  const app = express();

  const honeyPotPaths = [
    '.env',
    'info.php',
    'phpinfo.php',
    'config.php',
    'wp-login.php',
    'wp-content',
    'wp-admin',
    'wp-includes',
  ];

  app.use((req, res, next) => {
    if (honeyPotPaths.some((path) => req.path.includes(path))) {
      return res.redirect(
        302,
        'https://www.youtube.com/watch?v=lyWqQ4KzlzQ&ab_channel=ModernTalking-Topic',
      );
    }
    next();
  });

  app.use('/static', express.static(path.join(__dirname, './static')));
  app.get('/', serve('./static/index.html', 'AS_FILE'));

  app.get('/blog', async (req, res) => {
    try {
      const tagList = (req.query.tag as string)?.split(',') || [];
      let blogsToRender: BlogMeta[];
      if (tagList.length > 0) {
        blogsToRender = tagList.map((tag) => tagMap.get(tag) || []).flat();
      } else {
        blogsToRender = allBlogs;
      }

      // sort blogs by date in descending order
      blogsToRender.sort((a, b) => b.date.getTime() - a.date.getTime());

      const listHtml = blogsToRender
        .map((blog) => {
          return `
            <article>
              <date>${blog.date.toISOString().split('T')[0]}</date>
              <a href="/blog/${blog.slug}">${blog.title}</a>
            </article>
          `;
        })
        .join('');

      const tagsHtml = getTagsHtml(
        tagList.length > 0 ? tagList : Array.from(tagMap.keys()),
      );

      const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>viveknathani - blog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta charset="utf-8">
        <link rel="stylesheet" type="text/css" href="/static/theme.css">
      </head>
      <body>
        <main>
          <h1>blog</h1>
          <p>Ideas. Small. Big. Mine.</p>
          ${tagsHtml}
          ${listHtml}
          <p><a href="/">&#x2190; back to home</a></p>
        </main>
      </body>
      </html>
      `;
      res.send(fullHtml);
    } catch (err) {
      console.error(err);
      res.status(500).send('Failed to load blog posts');
    }
  });

  app.get(
    '/databases',
    serve(`${MARKDOWN_PARENT_PATH}/DATABASES.md`, 'AS_MARKDOWN_STRING'),
  );
  app.get(
    '/deepcuts',
    serve(`${MARKDOWN_PARENT_PATH}/DEEPCUTS.md`, 'AS_MARKDOWN_STRING'),
  );
  app.get(
    '/math',
    serve(`${MARKDOWN_PARENT_PATH}/MATH.md`, 'AS_MARKDOWN_STRING'),
  );
  app.get(
    '/games',
    serve(`${MARKDOWN_PARENT_PATH}/GAMES.md`, 'AS_MARKDOWN_STRING'),
  );
  app.get(
    '/notes',
    serve(`${MARKDOWN_PARENT_PATH}/notes/index.md`, 'AS_MARKDOWN_STRING'),
  );
  app.get('/blog/:slug', serve(`${MARKDOWN_PARENT_PATH}/blog`, 'AS_SLUG'));
  app.get('/notes/:slug', serve(`${MARKDOWN_PARENT_PATH}/notes`, 'AS_SLUG'));
  app.get('/resume', serve('./static/VivekNathaniResume.pdf', 'AS_FILE', true));
  app.get('*', serve('./static/404.html', 'AS_FILE'));
  app.listen(config.PORT, () => {
    console.log('⚡️ server is up and running!');
  });
}

main();
