let db = {
    screams: [
        {
            userHandle: 'user',
            body: 'this is the scream body',
            createdAt:  '2020-06-01T06:25:05.851Z',
            likeCount: 5,
            commentCount: 2
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: '9OVnjmEGCFcCZaSrGp9B',
            body: 'good comment!',
            createdAt: '2020-06-01T06:25:05.851Z'
        }
    ],
    notifications: [
        {
            recipient: 'user',
            sender: 'test',
            read: 'true | false',
            screamId: '9OVnjmEGCFcCZaSrGp9B',
            type: 'like | comment',
            createdAt: '2020-06-01T06:25:05.851Z'
        }
    ]
}

const userDetails = {
    //Redux Data
    credentials: {
        bio: "test",
        createdAt: "2020-06-01T23:17:48.933Z",
        email: "test@email.com",
        handle: "test",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/socialnet-84158.appspot.com/o/25828874888.jpeg?alt=media&token=27711e31-cf84-421d-842a-3238ff8ce902",
        location: "US, TX",
        userId: "wrwwn4NQi2TZYi1GL6JjchnXhD83",
        website: "http://user.com"
    },
    likes: [
        {
            userHandle: 'user',
            screamId: "9OVnjmEGCFcCZaSrGp9B"
        },
        {
            userHandle: 'test',
            screamId: "QIwptXU997xNpgDywBxn"
        }
    ]
}
