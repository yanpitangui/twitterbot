import * as fs from "fs";
import * as path from "path";
import * as request from "request-promise";
import * as Reddit from "snoowrap";
import * as tmp from "tmp-promise";
import * as Twit from "twit";

export class TwitterBot {
    private twitterClient: Twit;
    private redditClient: Reddit;
    private subreddits: [string];
    private limit: number;
    private metadata: Map<string, [IPostMetaData]>;
    constructor(
        redditConfig: IRedditOptions,
        twitterConfig: ITwitterOptions,
        subreddits: [string],
    ) {
        this.twitterClient = new Twit.default(twitterConfig);
        this.redditClient = new Reddit.default(redditConfig as IRedditOptions);
        this.subreddits = subreddits;
        this.metadata = new Map<string, [IPostMetaData]>();
        this.limit = redditConfig.limit ? redditConfig.limit : -1;
    }

    public async run(): Promise<any> {
        await this.fetchRepos();
    }

    private async fetchRepos(): Promise<any> {
        return Promise.all(this.subreddits.map(this.fetchSubreddit));
    }

    private fetchSubreddit = (subreddit: string): Promise<any> => {
        return this.redditClient
            .getSubreddit(subreddit)
            .getHot({ limit: this.limit ? this.limit : 3 })
            .then((info: Reddit.Listing<Reddit.Submission>) => {
                for (const post of info) {
                    this.fetchPost(post);
                }
            })
            .catch((err) => {
                throw err;
            });
    }

    private fetchPost = (post: Reddit.Submission) => {
        if (
            !post.url.match(
                /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g,
            )
        ) {
            console.log(
                `Submission ${post.permalink} doesn't have a valid image url.`,
            );
        } else {
            tmp.file({ dir: "./", postfix: `${path.extname(post.url)}` }).then((o) => {
                const file = fs.createWriteStream(o.path);
                request.default({ url: post.url }).pipe(file);
                const postInfo: IPostMetaData = { file_name: o.path, title: post.title };
                if (this.metadata.has(post.subreddit.name)) {
                    const posts = this.metadata.get(post.subreddit.name) as [IPostMetaData];
                    this.metadata.set(post.subreddit.name, [...posts, postInfo] as [IPostMetaData]);
                } else {
                    this.metadata.set(post.subreddit.name, [postInfo]);
                }
            });
        }
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

export interface IPostMetaData {
    file_name: string;
    title: string;
}
