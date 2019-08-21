import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
import { observer } from 'mobx-react'
import classNames from 'classnames'

interface IVoteProps {
    uuid: string
    upVotes: number
    downVotes: number
    myVote: number
    className?: string
    handler: (uuid: string, value: number) => void
}

const Vote: React.FC<IVoteProps> = ({ uuid, upVotes, downVotes, myVote, handler, ...props }) => (
    <span
        className={classNames([
            'black f6 vote flex flex-column items-center disable-user-select ph1',
        ])}
        {...props}
    >
        <span onClick={async () => await handler(uuid, 1)}>
            <FontAwesomeIcon
                width={13}
                icon={faArrowUp}
                className={classNames([
                    'pointer disable-user-select',
                    {
                        'o-50 dim': myVote !== 1,
                        orange: myVote === 1,
                    },
                ])}
            />
        </span>
        <span className={classNames(['f6 b disable-user-select ph1'])}>{upVotes + downVotes}</span>
        <span onClick={async () => await handler(uuid, -1)}>
            <FontAwesomeIcon
                width={13}
                icon={faArrowDown}
                className={classNames([
                    'pointer disable-user-select',
                    {
                        'o-50 dim': myVote !== -1,
                        blue: myVote === -1,
                    },
                ])}
            />
        </span>
    </span>
)

export default observer(Vote)
