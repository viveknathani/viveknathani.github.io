import showdown from "showdown";
import fs from "fs/promises";

enum MARKDOWN_TYPE {
  BLOG = "blog",
  NOTES = "notes",
  SOFTWARE = "software",
}

interface BlogMeta {
  slug: string;
  title: string;
  tags: string[];
  filePath: string;
  date: Date;
}

const tagColors = [
  "#e7ceceff", // Darker pastel pink
  "#cfe6c9ff", // Darker pastel green
  "#cbe2e9ff", // Darker pastel blue
  "#dac4daff", // Darker pastel lavender
  "#e9ded6ff", // Darker pastel peach
  "#d5d8e7ff", // Darker pastel periwinkle
  "#efe4d7ff", // Darker pastel yellow
  "#c8e6dbff", // Darker pastel turquoise
  "#e4d2caff", // Darker pastel coral
  "#cee9e7ff", // Darker pastel cyan
];

function colorForTag(tag: string): string {
  let sum = 0;
  for (let i = 0; i < tag.length; i++) {
    sum += tag.charCodeAt(i);
  }
  const index = sum % tagColors.length;
  return tagColors[index] || "";
}

function extractTags(metadata: showdown.Metadata): string[] {
  if (!metadata["tags"]) return [];
  const tagsRaw = metadata["tags"];
  return tagsRaw.split(",").map((tag) => tag.trim());
}

function getTagsHtml(tags: string[]): string {
  return tags.length > 0
    ? `<div style="margin-top: 10px;">${tags
        .map(
          (tag) =>
            `<a href="/blog/?tag=${encodeURIComponent(
              tag
            )}" style="text-decoration:none; display:inline-block; background-color: ${colorForTag(
              tag
            )}; color: #222; padding: 3px 10px; border-radius: 12px; margin-right: 6px; margin-bottom: 6px; font-size: 0.85em; user-select:none; cursor:pointer;">${tag}</a>`
        )
        .join("")}</div>`
    : "";
}

async function convertToHtml(markdownType: MARKDOWN_TYPE, filePath: string) {
  const converter = new showdown.Converter({ metadata: true });
  const text = (await fs.readFile(filePath)).toString();
  const htmlBody = converter.makeHtml(text);
  const meta = converter.getMetadata() as showdown.Metadata;
  const title = meta["title"];
  const description = `viveknathani - ${markdownType}`;
  const tags = extractTags(meta);
  const tagsHtml = getTagsHtml(tags);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>viveknathani - ${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta charset="utf-8">
      <link rel="stylesheet" type="text/css" href="/theme.css">
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

const markdownDirContents = await fs.readdir("./markdown");

for (const file of markdownDirContents) {
  const stats = await fs.stat(`./markdown/${file}`);

  if (
    stats.isDirectory() &&
    Object.values(MARKDOWN_TYPE).includes(file as MARKDOWN_TYPE)
  ) {
    const markdownType = file as MARKDOWN_TYPE;
    const subDirContents = await fs.readdir(`./markdown/${file}`);
    for (const subFile of subDirContents) {
      if (subFile.endsWith(".md")) {
        const filePath = `./markdown/${markdownType}/${subFile}`;
        const htmlContent = await convertToHtml(markdownType, filePath);
        const outputDir =
          subFile === "index.md"
            ? `./${markdownType}`
            : `./${markdownType}/${subFile.replace(".md", "")}`;
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(`${outputDir}/index.html`, htmlContent);
        console.log(`✅ generated ${outputDir}/index.html from ${filePath}`);
      }
    }

    if (markdownType === MARKDOWN_TYPE.BLOG) {
      const blogPosts: BlogMeta[] = [];
      for (const subFile of subDirContents) {
        if (subFile.endsWith(".md")) {
          const filePath = `./markdown/${markdownType}/${subFile}`;
          const converter = new showdown.Converter({ metadata: true });
          const text = (await fs.readFile(filePath)).toString();
          converter.makeHtml(text); // to populate metadata
          const meta = converter.getMetadata() as showdown.Metadata;
          const title = meta["title"] || "";
          const tags = extractTags(meta);
          const date = new Date(meta["date"] || "");
          const draft = meta['draft'] === 'true';

          if (draft) {
            continue;
          }

          const slug = subFile.replace(".md", "");
          blogPosts.push({ slug, title, tags, filePath, date });
        }
      }

      // Sort blogPosts by date descending
      blogPosts.sort((a, b) => b.date.getTime() - a.date.getTime());

      const blogData = blogPosts.map((blog) => ({
        slug: blog.slug,
        title: blog.title,
        tags: blog.tags,
        date: blog.date.toISOString().split("T")[0],
      }));

      const allTags = Array.from(
        new Set(blogPosts.flatMap((blog) => blog.tags))
      );

      const blogIndexHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>viveknathani - blog</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="/theme.css">
  </head>
  <body>
    <main>
      <h1>blog</h1>
      <p>Ideas. Small. Big. Mine.</p>
      <div id="tags-container"></div>
      <div id="blog-list"></div>
      <p><a href="/">&#x2190; back to home</a></p>
    </main>

    <script>
      const tagColors = ${JSON.stringify(tagColors)};
      const allBlogs = ${JSON.stringify(blogData)};
      const allTags = ${JSON.stringify(allTags)};
      
      function colorForTag(tag) {
        let sum = 0;
        for (let i = 0; i < tag.length; i++) {
          sum += tag.charCodeAt(i);
        }
        const index = sum % tagColors.length;
        return tagColors[index];
      }
      
      function renderTags(selectedTags = []) {
        const tagsContainer = document.getElementById('tags-container');
        const tagsToShow = selectedTags.length > 0 ? selectedTags : allTags;
        
        tagsContainer.innerHTML = tagsToShow.length > 0 ? 
          '<div style="margin-top: 10px;">' +
          tagsToShow.map(tag => 
            '<span class="tag" data-tag="' + tag + '" style="text-decoration:none; display:inline-block; background-color: ' + 
            colorForTag(tag) + '; color: #222; padding: 3px 10px; border-radius: 12px; margin-right: 6px; margin-bottom: 6px; font-size: 0.85em; user-select:none; cursor:pointer;">' + 
            tag + '</span>'
          ).join('') + '</div>' : '';
          
        // Add click handlers
        document.querySelectorAll('.tag').forEach(tagEl => {
          tagEl.addEventListener('click', () => {
            const tag = tagEl.getAttribute('data-tag');
            const url = new URL(window.location);
            url.searchParams.set('tag', tag);
            window.history.pushState({}, '', url);
            filterBlogs([tag]);
          });
        });
      }
      
      function renderBlogs(blogsToShow) {
        const blogList = document.getElementById('blog-list');
        blogList.innerHTML = blogsToShow.map(blog => 
          '<article>' +
          '<date>' + blog.date + '</date>' +
          '<a href="/blog/' + blog.slug + '/">' + blog.title + '</a>' +
          '</article>'
        ).join('');
      }
      
      function filterBlogs(selectedTags = []) {
        let blogsToShow = allBlogs;
        if (selectedTags.length > 0) {
          blogsToShow = allBlogs.filter(blog => 
            selectedTags.some(tag => blog.tags.includes(tag))
          );
        }
        
        renderTags(selectedTags);
        renderBlogs(blogsToShow);
      }
      
      // Initialize
      const urlParams = new URLSearchParams(window.location.search);
      const tagParam = urlParams.get('tag');
      const initialTags = tagParam ? tagParam.split(',') : [];
      
      filterBlogs(initialTags);
      
      // Handle browser back/forward buttons
      window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const tagParam = urlParams.get('tag');
        const currentTags = tagParam ? tagParam.split(',') : [];
        filterBlogs(currentTags);
      });
    </script>
  </body>
  </html>
      `;

      await fs.mkdir(`./blog`, { recursive: true });
      await fs.writeFile(`./blog/index.html`, blogIndexHtml);
      console.log(`✅ generated ./blog/index.html`);
    }
  } else if (stats.isFile() && file.endsWith(".md")) {
    const filePath = `./markdown/${file}`;
    const htmlContent = await convertToHtml(MARKDOWN_TYPE.BLOG, filePath);
    const outputDir = file.replace(".md", "");
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(`${outputDir}/index.html`, htmlContent);
    console.log(`✅ generated ${outputDir}/index.html from ${filePath}`);
  }
}
