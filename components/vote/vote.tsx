import * as React from 'react'

interface IVoteProps {
    votes: number
}

const Vote: React.FC<IVoteProps> = ({ votes }) => (
    <span className={'black f6 vote'}>
        <svg
            data-v-35c9ffd2=""
            aria-hidden="true"
            focusable="false"
            data-prefix="fas"
            data-icon="caret-up"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 512"
            className="svg-inline--fa fa-caret-up fa-w-10"
        >
            <path
                data-v-35c9ffd2=""
                fill="currentColor"
                d="M288.662 352H31.338c-17.818 0-26.741-21.543-14.142-34.142l128.662-128.662c7.81-7.81 20.474-7.81 28.284 0l128.662 128.662c12.6 12.599 3.676 34.142-14.142 34.142z"
            />
        </svg>
        {votes}
    </span>
)

export default Vote
