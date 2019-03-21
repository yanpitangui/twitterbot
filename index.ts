import * as dotenv from "dotenv";
import { IRedditOptions, ITwitterOptions, TwitterBot } from "./TwitterBot";

dotenv.config(); // to load environment variables;

const redditConfig: IRedditOptions = {
    clientSecret: process.env.CLIENT_SECRET as string,
    clientId: process.env.CLIENT_ID as string,
    password: process.env.REDDIT_PASSWORD as string,
    username: process.env.REDDIT_USERNAME as string,
    userAgent: "botdoyan",
    limit: 3,
};
const twitterConfig: ITwitterOptions = {
    consumer_key: process.env.CONSUMER_KEY as string,
    consumer_secret: process.env.CONSUMER_SECRET as string,
    access_token: process.env.ACCESS_TOKEN as string,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET as string,
};

const reddit = new TwitterBot(redditConfig, twitterConfig, ["dankchristianmemes"]);
reddit.run();
