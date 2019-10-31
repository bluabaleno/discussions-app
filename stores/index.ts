import User, { getUserStore } from '@stores/user'
import UI, { getUiStore } from '@stores/ui'
import Tag, { getTagStore } from '@stores/tag'
import Posts, { getPostsStore } from '@stores/posts'
import Settings, { getSettingsStore } from '@stores/settings'
import NewAuth, { getNewAuthStore } from './newAuth'
import Notifications, { getNotificationsStore } from '@stores/notifications'

export interface IStores {
    userStore: User
    uiStore: UI
    tagStore: Tag
    newAuthStore: NewAuth
    postsStore: Posts
    settingsStore: Settings
    notificationsStore: Notifications
}

export {
    getNewAuthStore,
    getPostsStore,
    getSettingsStore,
    getTagStore,
    getUiStore,
    getUserStore,
    getNotificationsStore,
}
