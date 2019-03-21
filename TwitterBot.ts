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
    private metadata: ISubredditMetaData[];
    constructor(
        redditConfig: IRedditOptions,
        twitterConfig: ITwitterOptions,
        subreddits: [string],
    ) {
        this.twitterClient = new Twit.default(twitterConfig);
        this.redditClient = new Reddit.default(redditConfig as IRedditOptions);
        this.subreddits = subreddits;
        this.metadata = new Array<ISubredditMetaData>();
        this.limit = redditConfig.limit ? redditConfig.limit : -1;
    }

    public async run(): Promise<any> {
        this.fetchRepos().then(() => {
            console.log(this.metadata);
        });
    }

    private async fetchRepos(): Promise<any> {
        return Promise.all(this.subreddits.map(this.fetchSubreddit)).catch((err) => {
            throw err;
        });
    }

    private fetchSubreddit = async (subreddit: string): Promise<any> => {
        return await this.redditClient
            .getSubreddit(subreddit)
            .getHot({ limit: this.limit ? this.limit : 3 })
            .then(async (info: Reddit.Listing<Reddit.Submission>) => {
                this.metadata.push({ subreddit, posts: [] });
                return Promise.all(info.map(this.fetchPost));

            })
            .catch((err) => {
                throw err;
            });
    }

    private fetchPost = (post: Reddit.Submission) => {
        return new Promise((resolve, reject) => {
            try {
                if (
                    !post.url.match(
                        /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/g,
                    )
                ) {
                    console.log(
                        `Submission ${post.permalink} doesn't have a valid image url.`,
                    );
                    resolve();
                } else {
                    const o = tmp.fileSync({ dir: "./", postfix: `${path.extname(post.url)}` });
                    const file = fs.createWriteStream(o.name);
                    request.default({ url: post.url }).pipe(file);
                    const postInfo: IPostMetaData = { file_name: o.name, title: post.title };

                    const subidx = this.metadata.findIndex((value) => {
                        return value.subreddit === post.subreddit_name_prefixed.split("/").pop();
                    });
                    this.metadata[subidx].posts = [...this.metadata[subidx].posts, postInfo];
                    file.on("finish", resolve);
                }
            } catch (error) {
                reject(error);
            }

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

export interface ISubredditMetaData {
    subreddit: string;
    posts: IPostMetaData[];
}
