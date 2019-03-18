import * as Reddit from "snoowrap";
import * as Twit from "twit";
import * as https from "https";
import * as fs from "fs";
import * as tmp from "tmp";

export class TwitterBot {
    public twitterClient: Twit;
    public redditClient: Reddit;
    public subreddits: [string];
    private metadata: Map<string, object>;
    constructor(redditConfig: IRedditOptions, twitterConfig: ITwitterOptions, subreddits: [string]) {
        this.twitterClient = new Twit.default(twitterConfig);
        this.redditClient = new Reddit.default(redditConfig as IRedditOptions);
        this.subreddits = subreddits;
        this.metadata = new Map<string, object>();
        this.fetchRepos(redditConfig.limit);
    }

    public run(): any {
        this.twitterClient.post("");
    }

    private fetchRepos(limit?: number): void {
        this.subreddits.forEach((subreddit) => {
            this.redditClient.getSubreddit(subreddit)
            .getHot({limit: limit ? limit : 3})
                .then((info: Reddit.Listing<Reddit.Submission>)  => {
                    info.forEach((post: Reddit.Submission) => {
                        tmp.file((err, path, fd, cleanupCallback) => {
                        const file = fs.createWriteStream(path);
                        https.get(post.url, (res) => {
                            res.pipe(file);
                        });
                    });
                    });
                }).catch((err) => {
                    throw err;
                });
        });
    }

}

export interface ITwitterOptions extends Twit.Options {
    consumer_key: string;
    consumer_secret: string;
    access_token: string;
    access_token_secret: string;
}

export interface IRedditOptions extends Reddit.SnoowrapOptions {
    limit?: number;
}
