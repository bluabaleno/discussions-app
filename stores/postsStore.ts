import { action, computed, observable } from 'mobx'
import { discussions, Post } from '@novuspherejs'
import { task } from 'mobx-task'
import { BaseStore, getOrCreateStore } from 'next-mobx-wrapper'
import { CreateForm } from '@components'
import tag, { getTagStore } from '@stores/tagStore'
import { getAuthStore, getUiStore, IStores } from '@stores'
import { generateUuid, getAttachmentValue, pushToThread, sleep } from '@utils'
import { ThreadModel } from '@models/threadModel'
import FeedModel from '@models/feedModel'
import _ from 'lodash'
import PostModel from '@models/postModel'

export interface IAttachment {
    value: string
    type: string
    display: string
}

export interface IPost {
    id: number
    transaction: string
    blockApprox: number
    chain: string
    parentUuid: string
    threadUuid: string
    uuid: string
    title: string
    poster: string
    displayName: string
    pub: string
    content: string
    createdAt: Date
    sub: string
    tags: string[]
    mentions: string[]
    edit: boolean
    anonymousId: string
    anonymousSignature: string
    verifyAnonymousSignature: string
    attachment: IAttachment
    replies: any[]
    totalReplies: number
    score: number
    upvotes: number
    downvotes: number
    alreadyVoted: boolean
}

export interface IPreviewPost {
    title: string
    sub: { value: string; label: string }
    content: string
}

export default class PostsStore extends BaseStore {
    // all posts by filter
    @observable posts: Post[] = []

    @observable currentReplyContent = ''

    @observable postsPosition = {
        items: 0,
        cursorId: undefined,
    }

    @observable preview: IPreviewPost | null = null

    @observable activeThreadId = ''

    // when creating a new post
    @observable newPostData = {
        sub: null, // { value: '', label: '' }
    }

    /**
     * Manage getRepliesFromMap within a post (not opening post)
     */
    @observable replyingPostUUID = '' // which post the user is currently replying to
    @observable replyingPostContent = '' // which post the user is currently replying to

    /**
     * Manage getRepliesFromMap of the opening post
     */
    @observable openingPostReplyContent = ''

    @observable activeThread: ThreadModel

    @observable currentHighlightedPostUuid = ''

    private readonly tagsStore: IStores['tagStore'] = getTagStore()
    private readonly uiStore: IStores['uiStore'] = getUiStore()
    private readonly authStore: IStores['authStore'] = getAuthStore()

    @action.bound
    highlightPostUuid(uuid: string) {
        this.currentHighlightedPostUuid = uuid
    }

    public resetPositionAndPosts = () => {
        this.posts = []
        this.postsPosition = {
            items: 0,
            cursorId: undefined,
        }
    }

    @action.bound
    setCurrentReplyContent(content: string) {
        this.currentReplyContent = content
    }

    @computed get hasReplyContent() {
        return this.currentReplyContent !== ''
    }

    @task
    @action.bound
    async getPostsForSubs(subs = this.tagsStore.subSubscriptionStatus) {
        try {
            const { posts, cursorId } = await discussions.getPostsForSubs(
                subs,
                this.postsPosition.cursorId,
                this.postsPosition.items
            )

            this.posts = [...this.posts, ...posts]

            this.postsPosition = {
                items: this.posts.length,
                cursorId,
            }

            return this.posts
        } catch (error) {
            return error
        }
    }

    @task
    @action.bound
    async getPostsForKeys(keys) {
        try {
            const { posts, cursorId } = await discussions.getPostsForKeys(
                keys,
                this.postsPosition.cursorId,
                this.postsPosition.items
            )

            this.posts = [...this.posts, ...posts]

            this.postsPosition = {
                items: this.posts.length,
                cursorId,
            }

            return this.posts
        } catch (error) {
            return error
        }
    }

    @task
    getPostsByTag = async (tags: string[]) => {
        try {
            const { posts, cursorId } = await discussions.getPostsForTags(
                tags,
                this.postsPosition.cursorId,
                this.postsPosition.items
            )

            this.posts = [...this.posts, ...posts]
            this.postsPosition = {
                items: this.posts.length,
                cursorId: cursorId,
            }

            return this.posts
        } catch (error) {
            return error
        }
    }

    /**
     * Threads shown in the feed for an active tag/sub
     */
    @computed get feedThreads(): FeedModel[] | null {
        if (!this.posts || !this.posts.length) {
            return null
        }

        return this.posts
            .filter(post => post.parentUuid === '')
            .map(post => new FeedModel(post as any))
    }

    @task
    @action.bound
    public async getAndSetThread(id: string, isServer = false): Promise<null | ThreadModel> {
        try {
            const thread = await discussions.getThread(id, isServer)
            if (!thread) return null
            this.activeThread = new ThreadModel(thread)
            this.activeThreadId = id
            return this.activeThread
        } catch (error) {
            throw error
        }
    }

    /**
     * Get the list of users in the current thread for tagging.
     * TODO: Add users the current active user follows as well
     * @returns {id: string, value: string}[]
     */
    @computed get getPossibleUsersToTag() {
        if (!this.activeThread) return []

        return _.uniqBy(
            _.map(_.filter(this.activeThread.map, posts => posts.pub.length), posts => {
                let poster = posts.poster

                if (poster === 'eosforumanon') {
                    poster = posts.displayName
                }

                return {
                    id: posts.pub,
                    value: poster,
                    icon: posts.imageData,
                }
            }),
            option => option.id
        )
    }

    @action
    public vote = async (uuid: string, value: number) => {
        try {
            if (this.authStore.hasAccount) {
                await this.activeThread.vote(uuid, value)
            }
        } catch (error) {
            throw error
        }
    }

    @action clearPreview = () => {
        this.preview = null
    }

    @computed get getPlausibleTagOptions() {
        return this.tagsStore.subSubscriptionStatus
            .filter(tag => ['home', 'all', 'feed'].indexOf(tag) === -1)
            .map(tag => ({
                value: tag,
                label: `#${tag}`,
            }))
    }

    get subFields() {
        return {
            name: 'sub',
            label: 'Sub',
            placeholder: 'Select a sub',
            rules: 'required',
            type: 'dropdown',
            hideLabels: true,
            extra: {
                options: this.getPlausibleTagOptions,
            },
        }
    }

    get newPostForm() {
        return new CreateForm({}, [
            {
                name: 'title',
                label: `Title`,
                placeholder: 'Enter a post title',
                rules: 'required|string|min:5|max:300',
                disabled: !this.newPostData.sub,
                hideLabels: true,
            },
            {
                name: 'content',
                label: 'Content',
                hideLabels: true,
                placeholder: 'Enter your content',
                disabled: !this.newPostData.sub,
                type: 'richtext',
            },
            {
                name: 'buttons',
                type: 'button',
                hideLabels: true,
                extra: {
                    options: [
                        {
                            value: 'Preview',
                            className: 'white bg-gray',
                            title: 'Preview the post before submitting',
                            disabled: !this.newPostData.sub,
                            onClick: form => {
                                if (!form.hasError) {
                                    this.preview = form.values()
                                    this.preview.sub = this.newPostData.sub
                                }
                            },
                        },
                        {
                            value: 'Post',
                            disabled: !this.authStore.hasAccount || !this.newPostData.sub,
                            title: !this.authStore.hasAccount
                                ? 'You need to be logged in to post'
                                : 'Post as ' + this.authStore.posterName,

                            onClick: task.resolved(async form => {
                                if (!form.hasError && this.newPostData.sub.value) {
                                    const post = form.values()
                                    const uuid = generateUuid()
                                    const posterName = this.authStore.posterName

                                    let inlineTags = post.content.match(/#([^\s.,;:!?]+)/gi)
                                    let tags = [this.newPostData.sub.value]

                                    if (inlineTags && inlineTags.length) {
                                        inlineTags = inlineTags.map(tag => tag.replace('#', ''))
                                        tags = [...tags, ...inlineTags]
                                    }

                                    const newPost = {
                                        poster: null,
                                        displayName: null,
                                        title: post.title,
                                        content: post.content,
                                        sub: this.newPostData.sub.value,
                                        chain: 'eos',
                                        mentions: [],
                                        tags: tags,
                                        uuid: uuid,
                                        parentUuid: '',
                                        threadUuid: uuid,
                                        attachment: getAttachmentValue(post),
                                        createdAt: Date.now(),
                                    }

                                    if (posterName === this.authStore.displayName.bk) {
                                        newPost.poster = undefined
                                        newPost.displayName = posterName
                                    }

                                    if (posterName === this.authStore.displayName.scatter) {
                                        newPost.poster = posterName
                                        newPost.displayName = posterName
                                    }

                                    const model = new PostModel(newPost as any)
                                    const signedReply = model.sign(this.authStore.postPriv)
                                    const submittedPost = await discussions.post(signedReply as any)
                                    const isPostValid = discussions.checkIfPostIsValid(
                                        submittedPost
                                    )

                                    if (isPostValid) {
                                        // // TODO: Add check to make sure the thread is actually posted onto the chain
                                        await sleep(5000)
                                        await pushToThread(submittedPost)
                                        this.uiStore.showToast(
                                            'Your post has been created!',
                                            'success'
                                        )
                                        this.clearPreview()
                                    } else {
                                        this.uiStore.showToast(
                                            'Unable to verify post was created.!',
                                            'error'
                                        )
                                    }
                                }
                            }),
                        },
                    ],
                },
            },
        ])
    }
}

export const getPostsStore = getOrCreateStore('postsStore', PostsStore)