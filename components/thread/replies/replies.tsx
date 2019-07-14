import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faExclamationTriangle,
    faLink,
    faReply,
    faShare,
    faUserCircle,
} from '@fortawesome/free-solid-svg-icons'
import moment from 'moment'
import { Link } from '@router'
import { Votes, Reply } from '@components'
import ReactMarkdown from 'react-markdown'
import { Observer } from 'mobx-react'
import { Post } from '@novuspherejs/discussions/post'
import { ReplyModel } from '@models/replyModel'

interface IReplies {
    post: Post
    className?: string
    getModel: (post: Post) => ReplyModel
    voteHandler: (uuid: string, type: string, value: number) => Promise<void>
}

const Replies: React.FC<IReplies> = ({ post, voteHandler, getModel, ...props }) => {
    const replyModel = getModel(post)
    return (
        <Observer>
            {() => (
                <div className={'post-content post-reply black'} {...props}>
                    <div className={'header pb2'}>
                        <Link route={`/u/${post.poster}`}>
                            <a>
                                <FontAwesomeIcon width={13} icon={faUserCircle} className={'pr1'} />
                                <span>{post.poster}</span>
                            </a>
                        </Link>
                        <span className={'pl2 o-50 f6'}>{moment(post.createdAt).fromNow()}</span>
                    </div>
                    <ReactMarkdown className={'f6 lh-copy'} source={post.content} />
                    <div className={'footer flex items-center pt3'}>
                        <Votes
                            upVotes={post.upvotes}
                            downVotes={post.downvotes}
                            uuid={post.uuid}
                            className={'mr2'}
                            handler={voteHandler}
                        />

                        <button className={'reply mr3 pointer dim'} onClick={replyModel.toggleOpen}>
                            <FontAwesomeIcon width={13} icon={faReply} className={'pr1'} />
                            reply
                        </button>

                        <FontAwesomeIcon
                            width={13}
                            icon={faLink}
                            className={'pr2 black f6 pointer dim'}
                        />
                        <FontAwesomeIcon
                            width={13}
                            icon={faShare}
                            className={'pr2 black f6 pointer dim'}
                        />

                        <span className={'f6 black f6 pointer dim'}>
                            <FontAwesomeIcon
                                width={13}
                                icon={faExclamationTriangle}
                                className={'pr1'}
                            />
                            mark as spam
                        </span>
                    </div>

                    {replyModel.open ? (
                        <Reply
                            uid={post.uuid}
                            onContentChange={replyModel.setContent}
                            onSubmit={replyModel.onSubmit}
                        />
                    ) : null}

                    {post.replies.length
                        ? post.replies.map(postReply => (
                              <Replies
                                  post={postReply}
                                  key={postReply.uuid}
                                  getModel={getModel}
                                  className={'post-content post-reply black child'}
                                  voteHandler={voteHandler}
                              />
                          ))
                        : null}
                </div>
            )}
        </Observer>
    )
}

export default Replies
