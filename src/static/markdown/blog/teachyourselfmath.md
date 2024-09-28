«««
title: indie hacking my way to thousands of math problems and puzzles for the internet
»»»

# indie hacking my way to thousands of math problems and puzzles for the internet


Earlier this year, I published a website called [teachyourselfmath.app](https://teachyourselfmath.app/). It gives you a large list of math problems of various categories along with their difficulty levels. The project got more traction than I had anticipated. In this post, I would like to share my journey of building this and talk about some updates.

### the journey

Like pretty much everybody, my exposure to this subject was through school and university. I always loved it. Though, it was only around my high school days that I started taking it more seriously. I had a small group of friends - Manav and Garvit. We used to solve a lot of problems. We were the kind of people who always did their math homework :). After we had solved a worksheet, we used to discuss our approaches and just help each other learn better. One interesting thing that used to happen because of this constant peer learning is that we were never really stressed out before a math exam. Because we had been solving problems throughout our course’s term. Doing math had become a habit for us. Later, we went on to pursure our careers in engineering and research but I really just missed the kick I used to get out of solving problems.

In a winter weekend of 2023, I was solving just another worksheet for fun. But by this time, I had acquired programming skills along the way so my brain had developed a natural inclination of trying to address the inefficiencies of my life through code. I actually ranted about this tendency in my [code for yourself blog post](https://vivekn.dev/blog/code-for-yourself). I looked at all the textbooks that I had and wondered why the problems in it are all so scattered. Why isn’t there a unification attempt to just make it available on the internet. I did some digging and found several sites offering problem lists, but most of them seemed focused on selling products. I get it; we all need to make a living in this capitalistic world, but come on! All I wanted was a simple list—like Wikipedia, which is just a vast repository of information, or Hacker News, where people share interesting links. I envisioned a minimal interface with no product cross-selling, just a straightforward exchange of information. Free. The way the internet should be.

Well, I had the right intentions and a vague idea, but I really needed to build some kind of aggregator or scraper. That’s when I came across a model by Meta called [Nougat](https://github.com/facebookresearch/nougat). It can take a PDF as input and output all the mathematical symbols in it as LaTeX, along with the surrounding text. I got super excited when I discovered this! I tested it by giving it a PDF of a worksheet, and it actually extracted all the text perfectly. All I had to do was write a program to pull out the relevant information.

So, I sat down and built a job queue-based system using BullMQ that would take the PDF, split it into smaller parts, upload those parts to the model, and retrieve the text. Then I applied some regex and heuristics to find the math problems and dump them into a database. The program worked, but it was just too slow. It turns out Nougat is computationally expensive, and even a small 5-page PDF took about 20 minutes on my M1 MacBook Pro.

I had a friend with access to powerful computing resources who generously provided me with discounted access to an NVIDIA GPU which reduced Nougat’s processing time to just a few seconds. My entire extraction pipeline was now fast—what a relief! But I knew that this approach isn’t exactly scalable. My friend cannot keep discounting it and I cannot keep paying a premium for running powerful models. But, I went along anyway and let future Vivek worry about it.

Now, I had the APIs and a database in place. I went onto build a web interface for this. I added the ability for people to comment. I was heavily inspired by the user interface of hacker news and tried to give off a similar vibe. It was during my birthday on 24th January of this year that I decided to [release this](https://news.ycombinator.com/item?id=39113879). Now, I have always worked for for-profit companies and the entire goal of engineering over here is to make stuff that generates large traction and money. I had no such intentions with this site. I figured that if I could find like 10 people who would find this website to be useful, I would feel super happy. To my surprise, the site kinda blew up. People on HN loved it. I received many warm emails and text messages from people about they find this site to be useful. This was truly overwhelming. It was truly overwhelming to realize that so many people cared about it. It felt good.

<img src="/static/images/feedback.png">

Over the next few months, in my spare time, I have worked on adding a few more features, fixing bugs, and most importantly, sourcing new problems. However, like I shared earlier, running Nougat was expensive. I needed a better way. Thankfully, LLMs have gotten much better at finding the contents of an image. If I could first convert the PDF into an image, LaTeX extraction would then be easier. And now, instead of running something that costs me a lot, I am just able to an API call and use function calling to get a JSON of extracted problems. The relevant code for this lies in the [FileProcessorService file](https://github.com/viveknathani/teachyourselfmath/blob/4c7a5228acb72741907e8b38b1bed896acc42f59/src/services/FileProcessorService.ts). And that’s it, my entire extraction pipeline is not only fast but also super light on my pocket :)

### updates

Today, I am releasing a new update. I have added over 2500 problems. And I have introduced a [new category called puzzles](https://teachyourselfmath.app/?tags=puzzles) for when you don’t want to apply any mathematical concepts and just want to indulge yourself into lightweight brainteasers. I believe the fundamental purpose of sourcing and displaying problems is now solved to a great extent. I am moving on from this project to focus my time to make some software for math tooling, which I believe is a an area that needs some attention. More on this later.

### closing thoughts

I genuinely just want to thank the internet for caring about this project and giving it some life. I’ll continue to maintain it and am reachable via email for any concerns or if you just want to share your thoughts.

Happy hacking!

Vivek
