import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';

const OUTPUT_DIR = './build/static-site';
const SERVER_PORT = '8080';
const BASE_URL = `http://localhost:${SERVER_PORT}`;

interface CrawlResult {
  url: string;
  content: string;
  links: string[];
}

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    // Directory might already exist, ignore error
    console.log(`Directory ${dirPath} already exists or error creating it`);
  }
}

async function startServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['build/index.js'], {
      stdio: 'pipe',
      env: { ...process.env, PORT: SERVER_PORT },
    });

    server.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('server is up and running')) {
        console.log('✅ Server started');
        resolve(server);
      }
    });

    server.stderr?.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    server.on('error', reject);

    setTimeout(() => reject(new Error('Server start timeout')), 10000);
  });
}

async function waitForServer(): Promise<void> {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(BASE_URL);
      return;
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('Server failed to respond');
}

function normalizeUrl(url: string, baseUrl: string): string | null {
  try {
    // Handle relative URLs
    if (url.startsWith('/')) {
      return baseUrl + url;
    }
    // Handle absolute URLs on same domain
    if (url.startsWith(baseUrl)) {
      return url;
    }
    // Handle query params and fragments
    if (url.startsWith('?') || url.startsWith('#')) {
      return baseUrl + url;
    }
    // Ignore external URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

function extractLinks(html: string, baseUrl: string): string[] {
  const dom = new JSDOM(html);
  const links = Array.from(dom.window.document.querySelectorAll('a[href]'))
    .map((link) => link.getAttribute('href'))
    .filter((href) => href !== null)
    .map((href) => normalizeUrl(href!, baseUrl))
    .filter(
      (url) =>
        url !== null && !url.includes('mailto:') && !url.includes('tel:'),
    )
    .map((url) => url!.split('?')[0].split('#')[0]) // Remove query params and fragments for crawling
    .filter((url, index, arr) => arr.indexOf(url) === index); // Remove duplicates

  return links;
}

async function crawlPage(url: string): Promise<CrawlResult> {
  try {
    const response = await axios.get(url);
    const links = extractLinks(response.data, BASE_URL);

    return {
      url,
      content: response.data,
      links,
    };
  } catch (err) {
    console.error(
      `Failed to crawl ${url}:`,
      err instanceof Error ? err.message : err,
    );
    return {
      url,
      content: '',
      links: [],
    };
  }
}

function urlToFilePath(url: string): string {
  let path = url.replace(BASE_URL, '');

  if (path === '' || path === '/') {
    return `${OUTPUT_DIR}/index.html`;
  }

  // Remove leading slash
  if (path.startsWith('/')) {
    path = path.substring(1);
  }

  // Add .html if no extension
  if (!path.includes('.') || path.endsWith('/')) {
    path = path.replace(/\/$/, '') + '.html';
  }

  return `${OUTPUT_DIR}/${path}`;
}

async function savePageContent(url: string, content: string): Promise<void> {
  if (!content) return;

  const filePath = urlToFilePath(url);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
  console.log(`✓ ${url} → ${filePath}`);
}

async function copyStaticAssets(): Promise<void> {
  const staticSrc = './src/static';
  const staticDest = `${OUTPUT_DIR}/static`;
  await fs.cp(staticSrc, staticDest, { recursive: true });
  console.log('📁 Copied static assets');
}

async function crawlSite(): Promise<void> {
  const visited = new Set<string>();
  const toVisit = [BASE_URL];

  console.log('🕷️  Starting site crawl...');

  while (toVisit.length > 0) {
    const url = toVisit.shift()!;

    if (visited.has(url)) {
      continue;
    }

    visited.add(url);

    const result = await crawlPage(url);

    if (result.content) {
      await savePageContent(url, result.content);

      // Add new links to visit queue
      for (const link of result.links) {
        if (!visited.has(link) && !toVisit.includes(link)) {
          toVisit.push(link);
        }
      }
    }

    // Small delay to be nice to the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`📊 Crawled ${visited.size} pages`);
}

async function main() {
  console.log('🏗️  Starting static site generation...');

  // Clean and create output directory
  try {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  } catch (err) {
    // Directory might not exist, ignore error
    console.log('No existing build directory to clean');
  }
  await ensureDir(OUTPUT_DIR);

  // Copy static assets
  await copyStaticAssets();

  // Start the server
  console.log('🚀 Starting local server...');
  const server = await startServer();

  try {
    await waitForServer();
    await crawlSite();

    console.log('✅ Static site generation complete!');
    console.log(`📦 Output directory: ${OUTPUT_DIR}`);
  } finally {
    console.log('🛑 Stopping local server...');
    server.kill();
  }
}

main().catch(console.error);
