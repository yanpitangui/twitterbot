import * as fs from "fs";
import * as path from "path";
import * as request from "request-promise";
import * as Reddit from "snoowrap";
import * as tmp from "tmp-promise";
import * as Twit from "twit";

export class TwitterBot {
    public twitterClient: Twit;
    public redditClient: Reddit;
    public subreddits: [string];
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
        this.fetchRepos(redditConfig.limit);
    }

    public run(): any {
        this.twitterClient.post("");
    }

    private fetchRepos(limit?: number): void {
        this.subreddits.forEach((subreddit) => {
            this.redditClient
                .getSubreddit(subreddit)
                .getHot({ limit: limit ? limit : 3 })
                .then((info: Reddit.Listing<Reddit.Submission>) => {
                    info.forEach((post: Reddit.Submission) => {
                        if (
                            !post.url.match(
                                /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g,
                            )
                        ) {
                            console.log(
                                `Submission ${post.permalink} doesn't have a valid image url.`,
                            );
                        } else {
                            tmp.file({ dir: "./", keep: true, postfix: `${path.extname(post.url)}` }).then((o) => {
                                const file = fs.createWriteStream(o.path);
                                request.default({ url: post.url }).pipe(file);
                                const postInfo: IPostMetaData = { file_name: o.path, title: post.title };
                                if (this.metadata.has(subreddit)) {
                                    const posts = this.metadata.get(subreddit) as [IPostMetaData];
                                    this.metadata.set(subreddit, [...posts, postInfo] as [IPostMetaData]);
                                } else {
                                    this.metadata.set(subreddit, [postInfo]);
                                }
                            });
                        }
                    });
                })
                .catch((err) => {
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

export interface IPostMetaData {
    file_name: string;
    title: string;
}
