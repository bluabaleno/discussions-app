import { computed, observable } from 'mobx'
import { IPost } from '@stores/postsStore'
import { getIdenticon, getThreadUrl } from '@utils'
import React from 'react'
import { TagModel } from '@models/tagModel'

interface ICreateNotification {
    type: 'mention' | 'watch'
    post: Partial<IPost>
    tag: TagModel
}

class NotificationModel {
    @observable type: 'mention' | 'watch' | null = null
    @observable post: Partial<IPost> = null
    @observable createdAt: Date | null = null
    @observable tag: TagModel = null
    @observable url = ''

    constructor(opts: ICreateNotification) {
        this.type = opts.type
        this.post = opts.post
        this.tag = opts.tag
        this.createdAt = opts.post.createdAt

        this.getThreadUrl().then((url) => {
            this.url = url
        })
    }

    async getThreadUrl() {
        let uuid = undefined

        if (!this.post.title && this.post.uuid) {
            uuid = this.post.uuid
        }

        return await getThreadUrl(this.post, uuid)
    }

    get isMentionType() {
        return this.type === 'mention'
    }

    @computed get image() {
        switch (this.type) {
            case 'mention':
                return React.createElement('img', {
                    className: 'post-icon mr2',
                    width: 30,
                    height: 30,
                    src: this.posterProfile,
                })
            case 'watch':
                return React.createElement('img', {
                    className: 'post-icon mr2',
                    width: 30,
                    height: 30,
                    src: this.tag.icon,
                })
        }
    }

    get modelCreatedAt() {
        switch (this.type) {
            case 'mention':
                return this.post.createdAt
            case 'watch':
                return new Date(Date.now())
        }
    }

    get posterProfile() {
        return getIdenticon(this.post.pub)
    }

    get poster() {
        let poster = this.post.poster

        if (poster === 'eosforumanon') {
            poster = this.post.displayName
        }

        return poster
    }

    // title of notification
    get title() {
        switch (this.type) {
            case 'mention':
                return `You have been mentioned by ${this.poster}`
            case 'watch':
                return this.post.title
        }
    }

    // content of notification
    get content() {
        switch (this.type) {
            case 'mention':
                return undefined
            case 'watch':
                return `${this.post.totalReplies} unread posts are in the thread`
        }
    }
}

export default NotificationModel
