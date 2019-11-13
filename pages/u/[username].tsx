import * as React from 'react'
import { dummy, Post } from '@novuspherejs'
import { IStores } from '@stores'
import { inject, observer } from 'mobx-react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { computed } from 'mobx'
import { getIdenticon } from '@utils'
import { InfiniteScrollFeed, PostPreview } from '@components'

interface IUPageProps {
    userStore: IStores['userStore']
    postsStore: IStores['postsStore']
    newAuthStore: IStores['newAuthStore']
    tagStore: IStores['tagStore']
    uiStore: IStores['uiStore']

    data: any

    username: string
    pub: string
    icon: string
    posts: Post[]
}

// TO-DO: real data

@inject('userStore', 'newAuthStore', 'postsStore', 'tagStore', 'uiStore')
@observer
class U extends React.Component<IUPageProps> {
    static async getInitialProps({ query, store }) {
        const postsStore: IStores['postsStore'] = store.postsStore
        const data = await dummy.getUser(query.username)
        const [username, pub] = query.username.split('-')
        const icon = getIdenticon(pub)

        postsStore.resetPositionAndPosts()

        const posts = await postsStore.getPostsForKeys([pub])

        return {
            posts,
            icon,
            username,
            pub,
            data,
        }
    }

    componentWillMount(): void {
        this.props.tagStore.destroyActiveTag()
        this.props.uiStore.toggleSidebarStatus(false)
        this.props.uiStore.toggleBannerStatus(true)
    }

    componentDidMount(): void {
        // window.scrollTo(0, 0)
    }

    @computed get isSameUser() {
        return this.props.username === this.props.newAuthStore.getActiveDisplayName
    }

    private renderFollowingList = () => {
        if (!this.props.userStore.following.size) {
            return (
                <li className={'f6'} key={'none'}>
                    You are not following any users.
                </li>
            )
        }

        const pubs = Array.from(this.props.userStore.following.keys())
        const following = Array.from(this.props.userStore.following.values())

        return following.map((follow, index) => (
            <li className={'pa0 mb2'} key={follow}>
                <span title={pubs[index]} className={'link pr2 pointer dim'}>
                    {follow}
                </span>
                <span
                    onClick={() => this.props.userStore.toggleUserFollowing(follow, pubs[index])}
                    title={'Click to unfollow'}
                >
                    <FontAwesomeIcon
                        width={13}
                        icon={faMinusCircle}
                        className={'pointer dim'}
                        color={'red'}
                    />
                </span>
            </li>
        ))
    }

    private renderSidebarContent = () => {
        const {
            icon,
            username,
            pub,
            userStore: { toggleUserFollowing, isFollowingUser },
        } = this.props

        return (
            <>
                <div className={'flex flex-row items-center'}>
                    <img
                        width={100}
                        height={100}
                        src={`data:image/png;base64,${icon}`}
                        className={'post-icon mr2'}
                        alt={'Icon'}
                    />
                    <div className={'ml3 flex flex-column items-start justify-center'}>
                        <span className={'b black f5 mb2'}>{this.props.username}</span>
                        <span className={'b f6 mb2'}>192 Followers</span>
                        {!this.isSameUser && (
                            <button
                                title={isFollowingUser(pub) ? 'Unfollow user' : 'Follow user'}
                                className={'button-outline'}
                                onClick={() => toggleUserFollowing(username, pub)}
                            >
                                {isFollowingUser(pub) ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>
                </div>

                <div className={'mt4 flex flex-column'}>
                    <span className={'small-title mb2'}>Contacts</span>

                    <ul className={'list'}>
                        <li className={'pa0 mb2'}>@{this.props.username}</li>
                        <li className={'pa0 mb2'}>{this.props.username}</li>
                        <li className={'pa0 mb2'}>{this.props.username}</li>
                        <li className={'pa0 mb2'}>{this.props.username}.com</li>
                    </ul>
                </div>

                <div className={'mt4 flex flex-column'}>
                    <span className={'small-title mb2'}>Connected Accounts</span>

                    <ul className={'list'}>
                        <li className={'pa0 mb2'}>EOS</li>
                    </ul>
                </div>

                {this.isSameUser && (
                    <div className={'mt4 flex flex-column'}>
                        <span className={'small-title mb2'}>Following (only visible to you)</span>

                        <ul className={'list'}>{this.renderFollowingList()}</ul>
                    </div>
                )}
            </>
        )
    }

    private renderUsersPosts = () => {
        const { pub } = this.props

        const {
            getPostsForKeys,
            postsPosition: { cursorId, items },
            posts,
        } = this.props.postsStore

        return (
            <InfiniteScrollFeed
                withAnchorUid
                dataLength={items}
                hasMore={cursorId !== 0}
                next={() => getPostsForKeys([pub])}
                posts={posts}
            />
        )
    }

    public render(): React.ReactNode {
        return (
            <div className={'flex flex-row'}>
                <div className={'card w-30 mr5 pa3'}>{this.renderSidebarContent()}</div>
                <div className={'w-70'}>
                    <Tabs selectedIndex={1} onSelect={index => console.log(index)}>
                        <TabList className={'settings-tabs'}>
                            <Tab className={'settings-tab'}>Blog</Tab>
                            <Tab className={'settings-tab'}>Posts</Tab>
                            <Tab className={'settings-tab'}>Latest</Tab>
                        </TabList>

                        <TabPanel>
                            <div className={'card settings-card'}>
                                There are no blog posts from this uer.
                            </div>
                        </TabPanel>
                        <TabPanel>{this.renderUsersPosts()}</TabPanel>
                        <TabPanel>
                            <div className={'card settings-card'}>
                                There are no posts from this user.
                            </div>
                        </TabPanel>
                    </Tabs>
                </div>
            </div>
        )
    }
}


export default U
