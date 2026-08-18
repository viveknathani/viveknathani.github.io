use pulldown_cmark::{Event, Options, Parser, Tag, html};
use serde::Serialize;
use std::{
    collections::{HashMap, HashSet},
    fs, io,
    path::{Path, PathBuf},
};

const MARKDOWN_TYPES: &[&str] = &["blog", "notes", "software", "systems", "quests", "oss"];

const TAG_COLORS: &[&str] = &[
    "#e7ceceff",
    "#cfe6c9ff",
    "#cbe2e9ff",
    "#dac4daff",
    "#e9ded6ff",
    "#d5d8e7ff",
    "#efe4d7ff",
    "#c8e6dbff",
    "#e4d2caff",
    "#cee9e7ff",
];

#[derive(Debug)]
struct Document {
    body: String,
    metadata: HashMap<String, String>,
}

#[derive(Debug, Serialize)]
struct BlogPost {
    slug: String,
    title: String,
    tags: Vec<String>,
    date: String,
}

fn main() -> io::Result<()> {
    let markdown_root = Path::new("markdown");
    let mut entries = sorted_entries(markdown_root)?;

    for path in entries.drain(..) {
        if path.is_dir() {
            let Some(markdown_type) = path.file_name().and_then(|name| name.to_str()) else {
                continue;
            };
            if !MARKDOWN_TYPES.contains(&markdown_type) {
                continue;
            }

            let markdown_files = markdown_files_in(&path)?;
            for source in &markdown_files {
                let document = parse_document(source)?;
                let output_dir = output_dir(markdown_type, source);
                write_document(markdown_type, source, &output_dir, &document)?;
            }

            if markdown_type == "blog" {
                write_blog_index(&markdown_files)?;
            }
        } else if path.extension().and_then(|extension| extension.to_str()) == Some("md") {
            let document = parse_document(&path)?;
            let output_dir = PathBuf::from(path.file_stem().expect("Markdown file has a stem"));
            write_document("blog", &path, &output_dir, &document)?;
        }
    }

    Ok(())
}

fn sorted_entries(directory: &Path) -> io::Result<Vec<PathBuf>> {
    let mut entries = fs::read_dir(directory)?
        .map(|entry| entry.map(|entry| entry.path()))
        .collect::<io::Result<Vec<_>>>()?;
    entries.sort();
    Ok(entries)
}

fn markdown_files_in(directory: &Path) -> io::Result<Vec<PathBuf>> {
    Ok(sorted_entries(directory)?
        .into_iter()
        .filter(|path| path.extension().and_then(|extension| extension.to_str()) == Some("md"))
        .collect())
}

fn output_dir(markdown_type: &str, source: &Path) -> PathBuf {
    if source.file_name().and_then(|name| name.to_str()) == Some("index.md") {
        PathBuf::from(markdown_type)
    } else {
        Path::new(markdown_type).join(source.file_stem().expect("Markdown file has a stem"))
    }
}

fn parse_document(path: &Path) -> io::Result<Document> {
    let source = fs::read_to_string(path)?;
    let (metadata, markdown) = parse_metadata(&source);

    let options = Options::ENABLE_TABLES
        | Options::ENABLE_FOOTNOTES
        | Options::ENABLE_STRIKETHROUGH
        | Options::ENABLE_TASKLISTS;
    let mut events = Parser::new_ext(markdown, options).collect::<Vec<_>>();
    add_heading_ids(&mut events);
    let mut body = String::new();
    html::push_html(&mut body, events.into_iter());

    Ok(Document { body, metadata })
}

fn add_heading_ids(events: &mut [Event<'_>]) {
    for index in 0..events.len() {
        if !matches!(events[index], Event::Start(Tag::Heading { .. })) {
            continue;
        }

        let heading_text = events[index + 1..]
            .iter()
            .take_while(|event| !matches!(event, Event::End(_)))
            .filter_map(|event| match event {
                Event::Text(text) | Event::Code(text) => Some(text.as_ref()),
                _ => None,
            })
            .collect::<String>();
        let id = heading_text
            .chars()
            .filter(|character| character.is_ascii_alphanumeric())
            .flat_map(char::to_lowercase)
            .collect::<String>();

        if let Event::Start(Tag::Heading { id: heading_id, .. }) = &mut events[index] {
            *heading_id = Some(id.into());
        }
    }
}

fn parse_metadata(source: &str) -> (HashMap<String, String>, &str) {
    let mut metadata = HashMap::new();
    let Some(after_opening) = source.strip_prefix("«««") else {
        return (metadata, source);
    };
    let Some((header, body)) = after_opening.split_once("»»»") else {
        return (metadata, source);
    };

    for line in header.lines() {
        if let Some((key, value)) = line.split_once(':') {
            metadata.insert(key.trim().to_owned(), value.trim().to_owned());
        }
    }

    (metadata, body.trim_start_matches(['\r', '\n']))
}

fn tags(document: &Document) -> Vec<String> {
    document
        .metadata
        .get("tags")
        .map(|tags| {
            tags.split(',')
                .map(str::trim)
                .filter(|tag| !tag.is_empty())
                .map(str::to_owned)
                .collect()
        })
        .unwrap_or_default()
}

fn color_for_tag(tag: &str) -> &'static str {
    let sum = tag
        .chars()
        .map(|character| character as usize)
        .sum::<usize>();
    TAG_COLORS[sum % TAG_COLORS.len()]
}

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

fn tag_html(tags: &[String]) -> String {
    if tags.is_empty() {
        return String::new();
    }

    let links = tags
        .iter()
        .map(|tag| {
            let encoded = url_encode(tag);
            format!(
                "<a href=\"/blog/?tag={encoded}\" style=\"text-decoration:none; display:inline-block; background-color: {}; color: #222; padding: 3px 10px; border-radius: 12px; margin-right: 6px; margin-bottom: 6px; font-size: 0.85em; user-select:none; cursor:pointer;\">{}</a>",
                color_for_tag(tag),
                escape_html(tag)
            )
        })
        .collect::<String>();
    format!("<div style=\"margin-top: 10px;\">{links}</div>")
}

fn url_encode(value: &str) -> String {
    value
        .bytes()
        .map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                (byte as char).to_string()
            }
            _ => format!("%{byte:02X}"),
        })
        .collect()
}

fn write_document(
    markdown_type: &str,
    source: &Path,
    output_dir: &Path,
    document: &Document,
) -> io::Result<()> {
    let title = escape_html(
        document
            .metadata
            .get("title")
            .map(String::as_str)
            .unwrap_or(""),
    );
    let tags = tag_html(&tags(document));
    let page = PAGE_TEMPLATE
        .replace("{{TITLE}}", &title)
        .replace("{{TYPE}}", markdown_type)
        .replace("{{TAGS}}", &tags)
        .replace("{{BODY}}", &document.body);

    fs::create_dir_all(output_dir)?;
    let destination = output_dir.join("index.html");
    fs::write(&destination, page)?;
    println!(
        "✅ generated {} from {}",
        destination.display(),
        source.display()
    );
    Ok(())
}

fn write_blog_index(markdown_files: &[PathBuf]) -> io::Result<()> {
    let mut posts = Vec::new();
    for source in markdown_files {
        let document = parse_document(source)?;
        if document
            .metadata
            .get("draft")
            .is_some_and(|draft| draft == "true")
        {
            continue;
        }
        posts.push(BlogPost {
            slug: source.file_stem().unwrap().to_string_lossy().into_owned(),
            title: document.metadata.get("title").cloned().unwrap_or_default(),
            tags: tags(&document),
            date: document.metadata.get("date").cloned().unwrap_or_default(),
        });
    }
    posts.sort_by(|left, right| right.date.cmp(&left.date));

    let mut seen_tags = HashSet::new();
    let all_tags = posts
        .iter()
        .flat_map(|post| post.tags.iter().cloned())
        .filter(|tag| seen_tags.insert(tag.clone()))
        .collect::<Vec<_>>();
    let page = BLOG_INDEX_TEMPLATE
        .replace(
            "{{TAG_COLORS}}",
            &serde_json::to_string(TAG_COLORS).unwrap(),
        )
        .replace("{{BLOGS}}", &serde_json::to_string(&posts).unwrap())
        .replace("{{ALL_TAGS}}", &serde_json::to_string(&all_tags).unwrap());

    fs::create_dir_all("blog")?;
    fs::write("blog/index.html", page)?;
    println!("✅ generated blog/index.html");
    Ok(())
}

const PAGE_TEMPLATE: &str = r#"<!DOCTYPE html>
<html>
<head>
  <title>viveknathani - {{TITLE}}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta charset="utf-8">
  <link rel="stylesheet" type="text/css" href="/theme.css">
  <meta property="og:title" content="{{TITLE}}">
  <meta property="og:description" content="viveknathani - {{TYPE}}">
</head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NJ89W10549"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-NJ89W10549');
</script>
<body>
  <main>
{{TAGS}}
{{BODY}}
    <p></p>
    <a href="/"><- back to home</a>
  </main>
</body>
</html>
"#;

const BLOG_INDEX_TEMPLATE: &str = r#"<!DOCTYPE html>
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
    const tagColors = {{TAG_COLORS}};
    const allBlogs = {{BLOGS}};
    const allTags = {{ALL_TAGS}};
    function colorForTag(tag) {
      let sum = 0;
      for (let i = 0; i < tag.length; i++) sum += tag.charCodeAt(i);
      return tagColors[sum % tagColors.length];
    }
    function renderTags(selectedTags = []) {
      const tagsContainer = document.getElementById('tags-container');
      const tagsToShow = selectedTags.length > 0 ? selectedTags : allTags;
      tagsContainer.innerHTML = tagsToShow.length > 0 ?
        '<div style="margin-top: 10px;">' + tagsToShow.map(tag =>
          '<span class="tag" data-tag="' + tag + '" style="text-decoration:none; display:inline-block; background-color: ' + colorForTag(tag) + '; color: #222; padding: 3px 10px; border-radius: 12px; margin-right: 6px; margin-bottom: 6px; font-size: 0.85em; user-select:none; cursor:pointer;">' + tag + '</span>'
        ).join('') + '</div>' : '';
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
      document.getElementById('blog-list').innerHTML = blogsToShow.map(blog =>
        '<article><date>' + blog.date + '</date><a href="/blog/' + blog.slug + '/">' + blog.title + '</a></article>'
      ).join('');
    }
    function filterBlogs(selectedTags = []) {
      const blogsToShow = selectedTags.length > 0
        ? allBlogs.filter(blog => selectedTags.some(tag => blog.tags.includes(tag)))
        : allBlogs;
      renderTags(selectedTags);
      renderBlogs(blogsToShow);
    }
    function selectedTagsFromUrl() {
      const tag = new URLSearchParams(window.location.search).get('tag');
      return tag ? tag.split(',') : [];
    }
    filterBlogs(selectedTagsFromUrl());
    window.addEventListener('popstate', () => filterBlogs(selectedTagsFromUrl()));
  </script>
</body>
</html>
"#;
