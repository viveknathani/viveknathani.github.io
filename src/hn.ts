import axios from 'axios';
import config from './config';
import { sendNotification } from './notifications';
import { NOTIFICATION_CHANNEL } from './types';

async function getTopStoriesFromHackerNews() {
  const response = await axios.get(
    'https://hacker-news.firebaseio.com/v0/topstories.json',
  );
  return response.data as number[];
}

async function createAndSendHackerNewsDigest() {
  const stories = await getTopStoriesFromHackerNews();
  const MAX_HN_STORIES = config.MAX_HN_STORIES;
  let text = '';
  for (let i = 0; i < MAX_HN_STORIES; i++) {
    const storyId = stories[i];
    const response = await axios.get(
      `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`,
    );
    const story = response.data;
    text += `${i + 1}. ${story.title} - news.ycombinator.com/item?id=${story.id}\n`;
  }
  await sendNotification({
    channel: NOTIFICATION_CHANNEL.TELEGRAM,
    data: {
      text,
    },
  });
}

export { createAndSendHackerNewsDigest };
