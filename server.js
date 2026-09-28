const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log(
    "PUBLISHABLE KEY LOADED:",
    !!process.env.SUPABASE_PUBLISHABLE_KEY
);

const app = express();
const PORT = process.env.PORT || 3007;

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* =========================================================
   SERVE GLEZA FRONTEND
========================================================= */

app.use(express.static(__dirname));

app.get("/api/config", (req, res) => {
    console.log(
    "CONFIG KEY EXISTS:",
    !!process.env.SUPABASE_PUBLISHABLE_KEY
);
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY
    });
});

// =========================================================
// GLEZA VAPID PUBLIC KEY
// =========================================================

app.get("/api/notifications/public-key", (req, res) => {

    res.json({
        publicKey:
            process.env.VAPID_PUBLIC_KEY
    });

});

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

// =========================================================
// GLEZA WEB PUSH
// =========================================================

const webpush = require("web-push");

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

console.log("WEB PUSH CONFIGURED");

// =========================================================
// SAVE PUSH SUBSCRIPTION
// =========================================================



app.post(
    "/api/notifications/subscribe",
    async (req, res) => {

        try {

            const {
                subscription,
                userId = null
            } = req.body;

            if (
                !subscription ||
                !subscription.endpoint ||
                !subscription.keys ||
                !subscription.keys.p256dh ||
                !subscription.keys.auth
            ) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid push subscription."
                });

            }

            const {
                endpoint,
                keys
            } = subscription;

            const {
                data,
                error
            } = await supabase
                .from("push_subscriptions")
                .upsert(
                    {
                        user_id: userId,
                        endpoint: endpoint,
                        p256dh: keys.p256dh,
                        auth: keys.auth
                    },
                    {
                        onConflict: "endpoint"
                    }
                )
                .select()
                .single();

            if (error) {

                console.error(
                    "SAVE PUSH SUBSCRIPTION ERROR:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    error: error.message
                });

            }

            console.log(
                "PUSH SUBSCRIPTION SAVED:",
                endpoint
            );

            res.json({
                success: true,
                message:
                    "Notifications enabled 🔔",
                subscription: data
            });

        } catch (error) {

            console.error(
                "PUSH SUBSCRIBE ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                error:
                    "Could not save notification subscription."
            });

        }

    }
);

// =========================================================
// SEND GLEZA NOTIFICATIONS
// =========================================================


app.post(
    "/api/notifications/send",
    async (req, res) => {
        // -------------------------------------------------
        // SECURITY CHECK
        // -------------------------------------------------

        const notificationSecret =
            req.headers["x-notification-secret"];

        if (
            !notificationSecret ||
            notificationSecret !==
                process.env.NOTIFICATION_SECRET
        ) {

            return res.status(401).json({
                success: false,
                error: "Unauthorized."
            });

        }

        try {

            const {
                data: subscriptions,
                error
            } = await supabase
                .from("push_subscriptions")
                .select("*");

            if (error) {

                console.error(
                    "GET PUSH SUBSCRIPTIONS ERROR:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    error: error.message
                });

            }

            if (
                !subscriptions ||
                subscriptions.length === 0
            ) {

                return res.json({
                    success: true,
                    message:
                        "No devices are subscribed yet.",
                    sent: 0
                });

            }

            let sent = 0;

            for (
                const subscription
                of subscriptions
            ) {

                const pushSubscription = {

                    endpoint:
                        subscription.endpoint,

                    keys: {

                        p256dh:
                            subscription.p256dh,

                        auth:
                            subscription.auth

                    }

                };

                const payload =
                    JSON.stringify({

                        title:
                            "Gleza 😂",

                        body:
                            "New funny stuff is waiting for you!",

                        url:
                            "/"

                    });

                try {

                    await webpush.sendNotification(
                        pushSubscription,
                        payload,
                        {
                            TTL: 60 * 60
                        }
                    );

                    sent++;

                    await supabase
                        .from("push_subscriptions")
                        .update({
                            last_sent_at:
                                new Date().toISOString()
                        })
                        .eq(
                            "id",
                            subscription.id
                        );

                } catch (pushError) {

                    console.error(
                        "PUSH SEND ERROR:",
                        pushError
                    );

                    if (
                        pushError.statusCode === 404 ||
                        pushError.statusCode === 410
                    ) {

                        await supabase
                            .from("push_subscriptions")
                            .delete()
                            .eq(
                                "id",
                                subscription.id
                            );

                    }

                }

            }

            res.json({

                success: true,

                message:
                    "Gleza notifications sent 🔔",

                sent:
                    sent

            });

        } catch (error) {

            console.error(
                "SEND NOTIFICATIONS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                error:
                    "Could not send notifications."

            });

        }

    }
);

/* =========================================================
   EXTERNAL JOKE API
   Used by "Make Me Laugh"
========================================================= */

app.get("/api/joke", async (req, res) => {

    try {

        const response = await fetch(
            "https://v2.jokeapi.dev/joke/Any?safe-mode&blacklistFlags=nsfw,religious,political,racist,sexist,explicit"
        );

        if (!response.ok) {

            throw new Error(
                `Joke API returned ${response.status}`
            );

        }

        const data =
            await response.json();

        let joke = "";

        /* -------------------------
           SINGLE-LINE JOKE
        ------------------------- */

        if (
            data.type === "single"
        ) {

            joke =
                data.joke;

        }

        /* -------------------------
           TWO-PART JOKE
        ------------------------- */

        else if (
            data.type === "twopart"
        ) {

            joke =
                `${data.setup}\n\n${data.delivery}`;

        }

        /* -------------------------
           MAKE SURE A JOKE EXISTS
        ------------------------- */

        if (
            !joke ||
            !String(joke).trim()
        ) {

            throw new Error(
                "External API returned no joke."
            );

        }

        res.json({

            success: true,

            joke:
                String(joke).trim()

        });

    } catch (error) {

        console.error(
            "GLEZA EXTERNAL JOKE ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            error:
                "Could not get a fresh joke right now."

        });

    }

});

/* =========================================================
   GET ALL POSTS
========================================================= */

app.get("/api/posts", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("GET POSTS ERROR:", error);

            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            posts: data
        });

    } catch (error) {
        console.error("GET POSTS ERROR:", error);

        res.status(500).json({
            success: false,
            error: "Could not load posts."
        });
    }
});

/* =========================================================
   CREATE A POST
   Supports:
   - meme
   - joke
   - story
========================================================= */

app.post("/api/posts", async (req, res) => {
    console.log("CREATE POST REQUEST RECEIVED");

    try {
        /* -------------------------
           GET USER FROM AUTH TOKEN
        ------------------------- */

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                error: "You must be logged in to create a post."
            });
        }

        const accessToken = authHeader.replace("Bearer ", "").trim();
        console.log("ACCESS TOKEN RECEIVED:", !!accessToken);

        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser(accessToken);

        console.log("GET USER FINISHED");
        console.log("USER EXISTS:", !!user);
        console.log("USER ERROR:", userError);

        if (userError || !user) {
            console.error("AUTH USER ERROR:", userError);

            return res.status(401).json({
                success: false,
                error: "Your login session is invalid. Please log in again."
            });
        }

        console.log("POST CREATED BY USER:", user.id);
        console.log("ACTUAL USER ID:", user.id);
        /* -------------------------
           GET POST DATA
        ------------------------- */

        const {
            type,
            content,
            image_url,
            category
        } = req.body;

        /* -------------------------
           CHECK POST TYPE
        ------------------------- */

        const allowedTypes = [
            "meme",
            "joke",
            "story"
        ];

        if (!type || !allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: "Post type must be meme, joke, or story."
            });
        }

        /* -------------------------
           MEME VALIDATION
        ------------------------- */

        if (type === "meme") {
            if (!image_url || !String(image_url).trim()) {
                return res.status(400).json({
                    success: false,
                    error: "A meme must have an image."
                });
            }
        }

        /* -------------------------
           JOKE / STORY VALIDATION
        ------------------------- */

        if (type === "joke" || type === "story") {
            if (!content || !String(content).trim()) {
                return res.status(400).json({
                    success: false,
                    error:
                        type === "joke"
                            ? "A joke must contain text."
                            : "A story must contain text."
                });
            }
        }

        /* -------------------------
           CREATE POST DATA
        ------------------------- */

        const postData = {
            user_id: user.id,

            type: type,

            content:
                type === "meme"
                    ? ""
                    : String(content || "").trim(),

            image_url:
                type === "meme"
                    ? String(image_url || "").trim()
                    : "",

            category:
                String(category || "funny").trim(),

            likes: 0,
            comments: 0,
            share: 0,
            views: 0
        };

        /* -------------------------
           SAVE TO SUPABASE
        ------------------------- */

        const {
            data,
            error
        } = await supabase
            .from("posts")
            .insert([postData])
            .select()
            .single();

        if (error) {
            console.error(
                "SUPABASE INSERT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        /* -------------------------
           SUCCESS
        ------------------------- */

        res.status(201).json({
            success: true,
            message: "Post published successfully! 🚀",
            post: data
        });

    } catch (error) {
        console.error(
            "CREATE POST ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Could not create post."
        });
    }
});

app.get("/api/users/:userId/profile", async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } =
            await supabase.auth.admin.getUserById(userId);

        if (error || !data?.user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const user = data.user;

        res.json({
            id: user.id,
            name: user.user_metadata?.name || "",
            username: user.user_metadata?.username || "",
            bio: user.user_metadata?.bio || "",
            avatar_url: user.user_metadata?.avatar_url || ""
        });

    } catch (error) {
        console.error("PUBLIC PROFILE ERROR:", error);

        res.status(500).json({
            error: "Failed to load profile"
        });
    }
});

/* =========================================================
   GET POSTS FOR A USER
========================================================= */

app.get("/api/users/:userId/posts", async (req, res) => {
    console.log(
        "USER POSTS REQUEST RECEIVED:",
        req.params.userId
    );

    try {
        const userId = req.params.userId;

        const {
            data,
            error
        } = await supabase
            .from("posts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error(
                "USER POSTS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        console.log(
            "USER POSTS LOADED:",
            data.length
        );

        res.json({
            success: true,
            posts: data
        });

    } catch (error) {
        console.error(
            "GET USER POSTS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Could not load user posts."
        });
    }
});

/* =========================================================
   FOLLOW A USER
========================================================= */

app.post("/api/users/:userId/follow", async (req, res) => {

    console.log(
        "FOLLOW REQUEST RECEIVED FOR:",
        req.params.userId
    );

    try {

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                error:
                    "You must be logged in to follow users."
            });

        }

        const accessToken =
            authHeader.replace("Bearer ", "").trim();

        const {
            data: { user },
            error: userError
        } =
            await supabase.auth.getUser(
                accessToken
            );

        if (userError || !user) {

            return res.status(401).json({
                success: false,
                error:
                    "Your login session is invalid."
            });

        }

        const followerId = user.id;
        const followingId = req.params.userId;

        /* Don't allow following yourself */

        if (followerId === followingId) {

            return res.status(400).json({
                success: false,
                error:
                    "You cannot follow yourself."
            });

        }

        /* Check whether follow already exists */

        const {
            data: existingFollow,
            error: checkError
        } =
            await supabase
                .from("follows")
                .select("id")
                .eq(
                    "follower_id",
                    followerId
                )
                .eq(
                    "following_id",
                    followingId
                )
                .maybeSingle();

        if (checkError) {

            console.error(
                "FOLLOW CHECK ERROR:",
                checkError
            );

            return res.status(500).json({
                success: false,
                error: checkError.message
            });

        }

        if (existingFollow) {

            return res.json({
                success: true,
                message:
                    "You are already following this user.",
                following: true
            });

        }

        /* Create the follow */

        const {
            data,
            error
        } =
            await supabase
                .from("follows")
                .insert([
                    {
                        follower_id:
                            followerId,

                        following_id:
                            followingId
                    }
                ])
                .select()
                .single();

        if (error) {

            console.error(
                "FOLLOW INSERT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error: error.message
            });

        }

        console.log(
            "FOLLOW CREATED:",
            data.id
        );

        res.json({
            success: true,
            message:
                "User followed successfully.",
            following: true
        });

    } catch (error) {

        console.error(
            "FOLLOW USER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                "Could not follow user."
        });

    }

});


/* =========================================================
   UNFOLLOW A USER
========================================================= */

app.delete(
    "/api/users/:userId/follow",
    async (req, res) => {

        console.log(
            "UNFOLLOW REQUEST RECEIVED FOR:",
            req.params.userId
        );

        try {

            const authHeader =
                req.headers.authorization;

            if (
                !authHeader ||
                !authHeader.startsWith("Bearer ")
            ) {

                return res.status(401).json({
                    success: false,
                    error:
                        "You must be logged in to unfollow users."
                });

            }

            const accessToken =
                authHeader
                    .replace("Bearer ", "")
                    .trim();

            const {
                data: { user },
                error: userError
            } =
                await supabase.auth.getUser(
                    accessToken
                );

            if (userError || !user) {

                return res.status(401).json({
                    success: false,
                    error:
                        "Your login session is invalid."
                });

            }

            const followerId = user.id;
            const followingId = req.params.userId;

            /* Delete the follow */

            const {
                error
            } =
                await supabase
                    .from("follows")
                    .delete()
                    .eq(
                        "follower_id",
                        followerId
                    )
                    .eq(
                        "following_id",
                        followingId
                    );

            if (error) {

                console.error(
                    "UNFOLLOW ERROR:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    error: error.message
                });

            }

            console.log(
                "USER UNFOLLOWED:",
                followingId
            );

            res.json({
                success: true,
                message:
                    "User unfollowed successfully.",
                following: false
            });

        } catch (error) {

            console.error(
                "UNFOLLOW USER ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                error:
                    "Could not unfollow user."
            });

        }

    }
);

/* =========================================================
   GET FOLLOW STATUS
========================================================= */

app.get(
    "/api/users/:userId/follow-status",
    async (req, res) => {

        try {

            const authHeader =
                req.headers.authorization;

            if (
                !authHeader ||
                !authHeader.startsWith("Bearer ")
            ) {

                return res.status(401).json({
                    success: false,
                    error:
                        "You must be logged in."
                });

            }

            const accessToken =
                authHeader
                    .replace("Bearer ", "")
                    .trim();

            const {
                data: { user },
                error: userError
            } =
                await supabase.auth.getUser(
                    accessToken
                );

            if (userError || !user) {

                return res.status(401).json({
                    success: false,
                    error:
                        "Your login session is invalid."
                });

            }

            const followerId = user.id;
            const followingId = req.params.userId;

            const {
                data,
                error
            } =
                await supabase
                    .from("follows")
                    .select("id")
                    .eq(
                        "follower_id",
                        followerId
                    )
                    .eq(
                        "following_id",
                        followingId
                    )
                    .maybeSingle();

            if (error) {

                console.error(
                    "FOLLOW STATUS ERROR:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    error: error.message
                });

            }

            res.json({
                success: true,
                following: !!data
            });

        } catch (error) {

            console.error(
                "GET FOLLOW STATUS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                error:
                    "Could not check follow status."
            });

        }

    }
);

/* =========================================================
   GET FOLLOWERS
========================================================= */

app.get(
    "/api/users/:userId/followers",
    async (req, res) => {

        console.log(
            "FOLLOWERS REQUEST RECEIVED FOR:",
            req.params.userId
        );

        try {

            const userId =
                req.params.userId;

            /* -----------------------------------------
               GET PEOPLE WHO FOLLOW THIS USER
            ----------------------------------------- */

            const {
                data: follows,
                error: followsError
            } =
                await supabase
                    .from("follows")
                    .select("follower_id")
                    .eq(
                        "following_id",
                        userId
                    );

            if (followsError) {

                console.error(
                    "GET FOLLOWERS ERROR:",
                    followsError
                );

                return res.status(500).json({
                    success: false,
                    error:
                        followsError.message
                });

            }

            /* -----------------------------------------
               GET USER DETAILS
            ----------------------------------------- */

            const users =
                await Promise.all(
                    (follows || []).map(
                        async function (follow) {

                            const {
                                data,
                                error
                            } =
                                await supabase.auth.admin.getUserById(
                                    follow.follower_id
                                );

                            if (error || !data?.user) {

                                console.error(
                                    "GET FOLLOWER USER ERROR:",
                                    error
                                );

                                return null;

                            }

                            return {
                                id:
                                    data.user.id,

                                name:
                                    data.user.user_metadata?.name ||
                                    data.user.user_metadata?.full_name ||
                                    "Gleza User"
                            };

                        }
                    )
                );


            const filteredUsers =
                users.filter(
                    function (user) {
                        return user !== null;
                    }
                );


            console.log(
                "FOLLOWERS LOADED:",
                filteredUsers.length
            );


            res.json({
                success: true,
                users: filteredUsers
            });


        } catch (error) {

            console.error(
                "FOLLOWERS ROUTE ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                error:
                    "Could not load followers."
            });

        }

    }
);


/* =========================================================
   GET FOLLOWING
========================================================= */

app.get(
    "/api/users/:userId/following",
    async (req, res) => {

        console.log(
            "FOLLOWING REQUEST RECEIVED FOR:",
            req.params.userId
        );

        try {

            const userId =
                req.params.userId;

            /* -----------------------------------------
               GET PEOPLE THIS USER FOLLOWS
            ----------------------------------------- */

            const {
                data: follows,
                error: followsError
            } =
                await supabase
                    .from("follows")
                    .select("following_id")
                    .eq(
                        "follower_id",
                        userId
                    );

            if (followsError) {

                console.error(
                    "GET FOLLOWING ERROR:",
                    followsError
                );

                return res.status(500).json({
                    success: false,
                    error:
                        followsError.message
                });

            }

            /* -----------------------------------------
               GET USER DETAILS
            ----------------------------------------- */

            const users =
                await Promise.all(
                    (follows || []).map(
                        async function (follow) {

                            const {
                                data,
                                error
                            } =
                                await supabase.auth.admin.getUserById(
                                    follow.following_id
                                );

                            if (error || !data?.user) {

                                console.error(
                                    "GET FOLLOWING USER ERROR:",
                                    error
                                );

                                return null;

                            }

                            return {
                                id:
                                    data.user.id,

                                name:
                                    data.user.user_metadata?.name ||
                                    data.user.user_metadata?.full_name ||
                                    "Gleza User"
                            };

                        }
                    )
                );


            const filteredUsers =
                users.filter(
                    function (user) {
                        return user !== null;
                    }
                );


            console.log(
                "FOLLOWING LOADED:",
                filteredUsers.length
            );


            res.json({
                success: true,
                users: filteredUsers
            });


        } catch (error) {

            console.error(
                "FOLLOWING ROUTE ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                error:
                    "Could not load following."
            });

        }

    }
);

/* =========================================================
   GET FOLLOWERS COUNT
========================================================= */

app.get("/api/users/:userId/followers-count", async (req, res) => {

    try {

        const userId = req.params.userId;

        const {
            count,
            error
        } = await supabase
            .from("follows")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq(
                "following_id",
                userId
            );

        if (error) {

            console.error(
                "FOLLOWERS COUNT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error: error.message
            });

        }

        res.json({
            success: true,
            count: count || 0
        });

    } catch (error) {

        console.error(
            "GET FOLLOWERS COUNT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                "Could not load followers count."
        });

    }

});


/* =========================================================
   GET FOLLOWING COUNT
========================================================= */

app.get("/api/users/:userId/following-count", async (req, res) => {

    try {

        const userId = req.params.userId;

        const {
            count,
            error
        } = await supabase
            .from("follows")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq(
                "follower_id",
                userId
            );

        if (error) {

            console.error(
                "FOLLOWING COUNT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error: error.message
            });

        }

        res.json({
            success: true,
            count: count || 0
        });

    } catch (error) {

        console.error(
            "GET FOLLOWING COUNT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                "Could not load following count."
        });

    }

});

/* =========================================================
   LIKE / UNLIKE A POST
========================================================= */

console.log("LIKE ROUTE REGISTERED");

app.post("/api/posts/:id/like", async (req, res) => {

    console.log(
        "LIKE REQUEST RECEIVED:",
        req.params.id
    );

    try {

        /* -------------------------
           GET USER FROM AUTH TOKEN
        ------------------------- */

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                error:
                    "You must be logged in to like posts."
            });

        }

        const accessToken =
            authHeader
                .replace("Bearer ", "")
                .trim();

        const {
            data: { user },
            error: userError
        } =
            await supabase.auth.getUser(
                accessToken
            );

        if (userError || !user) {

            return res.status(401).json({
                success: false,
                error:
                    "Your login session is invalid. Please log in again."
            });

        }

        const postId =
            req.params.id;

        const userId =
            user.id;


        /* -------------------------
           CHECK POST EXISTS
        ------------------------- */

        const {
            data: post,
            error: postError
        } =
            await supabase
                .from("posts")
                .select("id, likes")
                .eq("id", postId)
                .single();

        if (postError || !post) {

            return res.status(404).json({
                success: false,
                error:
                    "Post not found."
            });

        }


        /* -------------------------
           CHECK EXISTING LIKE
        ------------------------- */

        const {
            data: existingLike,
            error: likeCheckError
        } =
            await supabase
                .from("post_likes")
                .select("id")
                .eq(
                    "post_id",
                    postId
                )
                .eq(
                    "user_id",
                    userId
                )
                .maybeSingle();

        if (likeCheckError) {

            console.error(
                "CHECK LIKE ERROR:",
                likeCheckError
            );

            return res.status(500).json({
                success: false,
                error:
                    likeCheckError.message
            });

        }


        /* =================================================
           USER ALREADY LIKED
           → REMOVE LIKE
        ================================================= */

        if (existingLike) {

            const {
                error: deleteError
            } =
                await supabase
                    .from("post_likes")
                    .delete()
                    .eq(
                        "id",
                        existingLike.id
                    );

            if (deleteError) {

                console.error(
                    "REMOVE LIKE ERROR:",
                    deleteError
                );

                return res.status(500).json({
                    success: false,
                    error:
                        deleteError.message
                });

            }

            const currentLikes =
                Number(post.likes) || 0;

            const newLikes =
                Math.max(
                    0,
                    currentLikes - 1
                );


            const {
                data: updatedPost,
                error: updateError
            } =
                await supabase
                    .from("posts")
                    .update({
                        likes:
                            newLikes
                    })
                    .eq(
                        "id",
                        postId
                    )
                    .select()
                    .single();

            if (updateError) {

                console.error(
                    "UPDATE UNLIKE COUNT ERROR:",
                    updateError
                );

                return res.status(500).json({
                    success: false,
                    error:
                        updateError.message
                });

            }


            console.log(
                "POST UNLIKED BY USER:",
                userId
            );

            return res.json({
                success: true,
                liked: false,
                message:
                    "Post unliked.",
                post:
                    updatedPost
            });

        }


        /* =================================================
           USER HAS NOT LIKED
           → CREATE LIKE
        ================================================= */

        const {
            data: newLike,
            error: insertLikeError
        } =
            await supabase
                .from("post_likes")
                .insert([
                    {
                        post_id:
                            postId,

                        user_id:
                            userId
                    }
                ])
                .select()
                .single();

        if (insertLikeError) {

            console.error(
                "CREATE LIKE ERROR:",
                insertLikeError
            );

            return res.status(500).json({
                success: false,
                error:
                    insertLikeError.message
            });

        }


        const currentLikes =
            Number(post.likes) || 0;

        const newLikes =
            currentLikes + 1;


        const {
            data: updatedPost,
            error: updateError
        } =
            await supabase
                .from("posts")
                .update({
                    likes:
                        newLikes
                })
                .eq(
                    "id",
                    postId
                )
                .select()
                .single();

        if (updateError) {

            console.error(
                "UPDATE LIKE COUNT ERROR:",
                updateError
            );

            return res.status(500).json({
                success: false,
                error:
                    updateError.message
            });

        }


        console.log(
            "POST LIKED BY USER:",
            userId
        );

        res.json({
            success: true,
            liked: true,
            message:
                "Post liked ❤️",
            like:
                newLike,
            post:
                updatedPost
        });

    } catch (error) {

        console.error(
            "LIKE / UNLIKE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                "Could not update like."
        });

    }

});

/* =========================================================
   DELETE A POST
   Only the owner of the post can delete it.
========================================================= */

console.log("DELETE POST ROUTE REGISTERED");

app.delete("/api/posts/:id", async (req, res) => {

    console.log(
        "DELETE POST REQUEST RECEIVED:",
        req.params.id
    );

    try {

        /* =================================================
           GET USER FROM AUTH TOKEN
        ================================================= */

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                error:
                    "You must be logged in to delete posts."
            });

        }

        const accessToken =
            authHeader
                .replace("Bearer ", "")
                .trim();


        const {
            data: { user },
            error: userError
        } =
            await supabase.auth.getUser(
                accessToken
            );


        if (userError || !user) {

            return res.status(401).json({
                success: false,
                error:
                    "Your login session is invalid. Please log in again."
            });

        }


        /* =================================================
           GET POST
        ================================================= */

        const postId =
            req.params.id;


        const {
            data: post,
            error: postError
        } =
            await supabase
                .from("posts")
                .select(
                    "id, user_id, image_url, type"
                )
                .eq(
                    "id",
                    postId
                )
                .single();


        if (postError || !post) {

            console.error(
                "DELETE POST FIND ERROR:",
                postError
            );

            return res.status(404).json({
                success: false,
                error:
                    "Post not found."
            });

        }


        /* =================================================
           OWNER CHECK
           VERY IMPORTANT
        ================================================= */

        if (
            String(post.user_id) !==
            String(user.id)
        ) {

            console.log(
                "UNAUTHORIZED DELETE ATTEMPT:",
                user.id,
                "TRIED TO DELETE:",
                postId
            );

            return res.status(403).json({
                success: false,
                error:
                    "You can only delete your own posts."
            });

        }


        /* =================================================
           GET COMMENTS FOR THIS POST
           We need their IDs before deleting them.
        ================================================= */

        const {
            data: comments,
            error: commentsError
        } =
            await supabase
                .from("comments")
                .select("id")
                .eq(
                    "post_id",
                    postId
                );


        if (commentsError) {

            console.error(
                "DELETE POST COMMENTS FIND ERROR:",
                commentsError
            );

            return res.status(500).json({
                success: false,
                error:
                    commentsError.message
            });

        }


        const commentIds =
            (comments || []).map(
                function (comment) {
                    return comment.id;
                }
            );


        /* =================================================
           DELETE COMMENT LIKES
        ================================================= */

        if (commentIds.length) {

            const {
                error: commentLikesError
            } =
                await supabase
                    .from("comment_likes")
                    .delete()
                    .in(
                        "comment_id",
                        commentIds
                    );


            if (commentLikesError) {

                console.error(
                    "DELETE COMMENT LIKES ERROR:",
                    commentLikesError
                );

                return res.status(500).json({
                    success: false,
                    error:
                        commentLikesError.message
                });

            }

        }


        /* =================================================
           DELETE COMMENTS
        ================================================= */

        const {
            error: deleteCommentsError
        } =
            await supabase
                .from("comments")
                .delete()
                .eq(
                    "post_id",
                    postId
                );


        if (deleteCommentsError) {

            console.error(
                "DELETE COMMENTS ERROR:",
                deleteCommentsError
            );

            return res.status(500).json({
                success: false,
                error:
                    deleteCommentsError.message
            });

        }


        /* =================================================
           DELETE POST LIKES
        ================================================= */

        const {
            error: postLikesError
        } =
            await supabase
                .from("post_likes")
                .delete()
                .eq(
                    "post_id",
                    postId
                );


        if (postLikesError) {

            console.error(
                "DELETE POST LIKES ERROR:",
                postLikesError
            );

            return res.status(500).json({
                success: false,
                error:
                    postLikesError.message
            });

        }


        /* =================================================
           DELETE THE POST
        ================================================= */

        const {
            error: deletePostError
        } =
            await supabase
                .from("posts")
                .delete()
                .eq(
                    "id",
                    postId
                )
                .eq(
                    "user_id",
                    user.id
                );


        if (deletePostError) {

            console.error(
                "DELETE POST ERROR:",
                deletePostError
            );

            return res.status(500).json({
                success: false,
                error:
                    deletePostError.message
            });

        }


        /* =================================================
           SUCCESS
        ================================================= */

        console.log(
            "POST DELETED SUCCESSFULLY:",
            postId,
            "BY USER:",
            user.id
        );


        res.json({
            success: true,
            message:
                "Post deleted successfully."
        });


    } catch (error) {

        console.error(
            "DELETE POST ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                "Could not delete post."
        });

    }

});

/* =========================================================
   GET POSTS LIKED BY CURRENT USER
========================================================= */

console.log("LIKED POSTS ROUTE REGISTERED");
app.get("/api/users/me/liked-posts", async (req, res) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                error:
                    "You must be logged in to view liked posts."
            });

        }

        const accessToken =
            authHeader.replace("Bearer ", "").trim();

        const {
            data: { user },
            error: userError
        } =
            await supabase.auth.getUser(accessToken);

        if (userError || !user) {

            return res.status(401).json({
                success: false,
                error:
                    "Your login session is invalid."
            });

        }

        const {
            data: likes,
            error: likesError
        } =
            await supabase
                .from("post_likes")
                .select("post_id")
                .eq("user_id", user.id);

        if (likesError) {

            console.error(
                "GET LIKED POSTS ERROR:",
                likesError
            );

            return res.status(500).json({
                success: false,
                error: likesError.message
            });

        }

        const postIds =
            (likes || []).map(function (like) {
                return like.post_id;
            });

        if (!postIds.length) {

            return res.json({
                success: true,
                posts: []
            });

        }

        const {
            data: posts,
            error: postsError
        } =
            await supabase
                .from("posts")
                .select("*")
                .in("id", postIds)
                .order("created_at", {
                    ascending: false
                });

        if (postsError) {

            console.error(
                "GET LIKED POSTS DATA ERROR:",
                postsError
            );

            return res.status(500).json({
                success: false,
                error: postsError.message
            });

        }

        res.json({
            success: true,
            posts: posts || []
        });

    } catch (error) {

        console.error(
            "LIKED POSTS ROUTE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                "Could not load liked posts."
        });

    }

});

/* =========================================================
   COMMENTS
========================================================= */
/* =========================================================
   VIEW A POST
========================================================= */
console.log("VIEW ROUTE REGISTERED");

app.post("/api/posts/:id/view", async (req, res) => {
    console.log("VIEW REQUEST RECEIVED:", req.params.id);

    try {
        const postId = req.params.id;

        const { data: post, error } = await supabase
            .from("posts")
            .select("id, views")
            .eq("id", postId)
            .single();

        if (error) {
            console.error("VIEW FIND ERROR:", error);

            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        if (!post) {
            return res.status(404).json({
                success: false,
                error: "Post not found."
            });
        }

        const newViews = (Number(post.views) || 0) + 1;

        const { data: updatedPost, error: updateError } =
            await supabase
                .from("posts")
                .update({ views: newViews })
                .eq("id", postId)
                .select()
                .single();

        if (updateError) {
            console.error("VIEW UPDATE ERROR:", updateError);

            return res.status(500).json({
                success: false,
                error: updateError.message
            });
        }

        console.log("VIEW SAVED SUCCESSFULLY:", updatedPost.views);

        res.json({
            success: true,
            post: updatedPost
        });

    } catch (error) {
        console.error("VIEW ERROR:", error);

        res.status(500).json({
            success: false,
            error: "Could not record view."
        });
    }
});

/* =========================
   GET COMMENTS FOR A POST
========================= */

console.log("COMMENT GET ROUTE REGISTERED");

app.get("/api/posts/:id/comments", async (req, res) => {

    console.log(
        "COMMENT GET REQUEST RECEIVED:",
        req.params.id
    );

    try {

        const postId =
            req.params.id;


        /* =================================================
           GET COMMENTS
        ================================================= */

        const {
            data: comments,
            error: commentsError
        } =
            await supabase
                .from("comments")
                .select("*")
                .eq(
                    "post_id",
                    postId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (commentsError) {

            console.error(
                "SUPABASE COMMENTS GET ERROR:",
                commentsError
            );

            return res.status(500).json({

                success: false,

                error:
                    commentsError.message

            });

        }


        /* =================================================
           NO COMMENTS
        ================================================= */

        if (
            !comments ||
            !comments.length
        ) {

            console.log(
                "NO COMMENTS FOUND FOR POST:",
                postId
            );

            return res.json({

                success: true,

                comments: []

            });

        }


        /* =================================================
           GET COMMENT IDS
        ================================================= */

        const commentIds =
            comments.map(
                function (comment) {

                    return comment.id;

                }
            );


        /* =================================================
           GET ALL LIKES FOR THESE COMMENTS
        ================================================= */

        const {
            data: commentLikes,
            error: likesError
        } =
            await supabase
                .from("comment_likes")
                .select(
                    "comment_id, user_id"
                )
                .in(
                    "comment_id",
                    commentIds
                );


        if (likesError) {

            console.error(
                "GET COMMENT LIKES ERROR:",
                likesError
            );

            return res.status(500).json({

                success: false,

                error:
                    likesError.message

            });

        }


        /* =================================================
           COUNT LIKES FOR EACH COMMENT
        ================================================= */

        const likeCounts = {};


        (commentLikes || []).forEach(
            function (like) {

                const commentId =
                    String(
                        like.comment_id
                    );


                if (
                    !likeCounts[commentId]
                ) {

                    likeCounts[commentId] =
                        0;

                }


                likeCounts[commentId]++;

            }
        );


        /* =================================================
           GET CURRENT USER
           IF LOGGED IN
        ================================================= */

        let currentUserId = null;


        const authHeader =
            req.headers.authorization;


        if (
            authHeader &&
            authHeader.startsWith(
                "Bearer "
            )
        ) {

            const accessToken =
                authHeader
                    .replace(
                        "Bearer ",
                        ""
                    )
                    .trim();


            const {
                data: {
                    user
                }
            } =
                await supabase.auth.getUser(
                    accessToken
                );


            if (user) {

                currentUserId =
                    user.id;

            }

        }


        /* =================================================
           ADD LIKE COUNT + USER LIKE STATUS
        ================================================= */

        const commentsWithLikes =
            comments.map(
                function (comment) {

                    const commentId =
                        String(
                            comment.id
                        );


                    let liked =
                        false;


                    if (
                        currentUserId
                    ) {

                        liked =
                            (commentLikes || [])
                                .some(
                                    function (like) {

                                        return (
                                            String(
                                                like.comment_id
                                            ) ===
                                            commentId
                                            &&
                                            like.user_id ===
                                            currentUserId
                                        );

                                    }
                                );

                    }


                    return {

                        ...comment,

                        likes:
                            likeCounts[
                                commentId
                            ] || 0,

                        liked:
                            liked

                    };

                }
            );


        /* =================================================
           SUCCESS
        ================================================= */

        console.log(
            "COMMENTS LOADED SUCCESSFULLY:",
            commentsWithLikes.length
        );


        console.log(
            "COMMENT LIKES LOADED:",
            commentLikes?.length || 0
        );


        res.json({

            success: true,

            comments:
                commentsWithLikes

        });


    } catch (error) {

        console.error(
            "GET COMMENTS ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Could not load comments."

        });

    }

});


console.log("COMMENT POST ROUTE REGISTERED");

app.post("/api/posts/:id/comments", async (req, res) => {

    console.log(
        "COMMENT POST REQUEST RECEIVED:",
        req.params.id,
        req.body
    );

    try {

        const postId = req.params.id;

        const {
            content,
            author_name,
            parent_comment_id
        } = req.body;


        /* =====================================================
           CHECK CONTENT
        ===================================================== */

        if (
            !content ||
            !String(content).trim()
        ) {

            return res.status(400).json({
                success: false,
                error: "Comment cannot be empty."
            });

        }


        /* =====================================================
           PREPARE PARENT COMMENT ID
        ===================================================== */

        let parentCommentId = null;

        if (
            parent_comment_id !== null &&
            parent_comment_id !== undefined &&
            String(parent_comment_id).trim() !== ""
        ) {

            parentCommentId =
                Number(parent_comment_id);

            if (
                !Number.isInteger(parentCommentId)
            ) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid parent comment ID."
                });

            }

        }


        /* =====================================================
           IF THIS IS A REPLY, CHECK THAT PARENT EXISTS
        ===================================================== */

        if (parentCommentId !== null) {

            const {
                data: parentComment,
                error: parentError
            } =
                await supabase
                    .from("comments")
                    .select("id")
                    .eq(
                        "id",
                        parentCommentId
                    )
                    .eq(
                        "post_id",
                        postId
                    )
                    .maybeSingle();


            if (parentError) {

                console.error(
                    "PARENT COMMENT CHECK ERROR:",
                    parentError
                );

                return res.status(500).json({
                    success: false,
                    error:
                        parentError.message
                });

            }


            if (!parentComment) {

                return res.status(400).json({
                    success: false,
                    error:
                        "The comment you are replying to was not found."
                });

            }

        }


        /* =====================================================
           COMMENT DATA
        ===================================================== */

        const commentData = {

            post_id:
                postId,

            content:
                String(content).trim(),

            author_name:
                String(
                    author_name ||
                    "Gleza User"
                ).trim(),

            parent_comment_id:
                parentCommentId

        };


        console.log(
            "COMMENT DATA BEING SAVED:",
            commentData
        );


        /* =====================================================
           INSERT COMMENT
        ===================================================== */

        const {
            data,
            error
        } =
            await supabase
                .from("comments")
                .insert([
                    commentData
                ])
                .select()
                .single();


        if (error) {

            console.error(
                "SUPABASE COMMENT INSERT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    error.message
            });

        }


        /* =====================================================
           UPDATE POST COMMENT COUNT
        ===================================================== */

        const {
            data: post,
            error: postError
        } =
            await supabase
                .from("posts")
                .select("comments")
                .eq(
                    "id",
                    postId
                )
                .single();


        if (postError) {

            console.error(
                "GET POST COMMENT COUNT ERROR:",
                postError
            );

        }


        const currentComments =
            Number(
                post?.comments
            ) || 0;


        const {
            error: countError
        } =
            await supabase
                .from("posts")
                .update({

                    comments:
                        currentComments + 1

                })
                .eq(
                    "id",
                    postId
                );


        if (countError) {

            console.error(
                "UPDATE COMMENT COUNT ERROR:",
                countError
            );

        }


        console.log(
            "COMMENT SAVED SUCCESSFULLY:",
            data
        );


        /* =====================================================
           SEND RESPONSE
        ===================================================== */

        res.status(201).json({

            success: true,

            message:
                parentCommentId !== null
                    ? "Reply added! 💬"
                    : "Comment added! 💬",

            comment:
                data

        });


    } catch (error) {

        console.error(
            "ADD COMMENT ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            error:
                "Could not add comment."

        });

    }

});

/* =========================================================
   LIKE / UNLIKE A COMMENT
========================================================= */

console.log("COMMENT LIKE ROUTE REGISTERED");

app.post("/api/comments/:id/like", async (req, res) => {

    console.log(
        "COMMENT LIKE REQUEST RECEIVED:",
        req.params.id
    );

    try {

        /* -------------------------
           GET USER FROM AUTH TOKEN
        ------------------------- */

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                error:
                    "You must be logged in to like comments."
            });

        }

        const accessToken =
            authHeader
                .replace("Bearer ", "")
                .trim();

        const {
            data: { user },
            error: userError
        } =
            await supabase.auth.getUser(
                accessToken
            );

        if (userError || !user) {

            return res.status(401).json({
                success: false,
                error:
                    "Your login session is invalid. Please log in again."
            });

        }

        const commentId =
            req.params.id;

        const userId =
            user.id;


        /* -------------------------
           CHECK COMMENT EXISTS
        ------------------------- */

        const {
            data: comment,
            error: commentError
        } =
            await supabase
                .from("comments")
                .select("id")
                .eq("id", commentId)
                .single();

        if (commentError || !comment) {

            return res.status(404).json({
                success: false,
                error:
                    "Comment not found."
            });

        }


        /* -------------------------
           CHECK EXISTING LIKE
        ------------------------- */

        const {
            data: existingLike,
            error: likeCheckError
        } =
            await supabase
                .from("comment_likes")
                .select("id")
                .eq(
                    "comment_id",
                    commentId
                )
                .eq(
                    "user_id",
                    userId
                )
                .maybeSingle();

        if (likeCheckError) {

            console.error(
                "COMMENT LIKE CHECK ERROR:",
                likeCheckError
            );

            return res.status(500).json({
                success: false,
                error:
                    likeCheckError.message
            });

        }


        /* =================================================
           USER ALREADY LIKED
           → REMOVE LIKE
        ================================================= */

        if (existingLike) {

            const {
                error: deleteError
            } =
                await supabase
                    .from("comment_likes")
                    .delete()
                    .eq(
                        "id",
                        existingLike.id
                    );

            if (deleteError) {

                console.error(
                    "COMMENT UNLIKE ERROR:",
                    deleteError
                );

                return res.status(500).json({
                    success: false,
                    error:
                        deleteError.message
                });

            }


            /* -------------------------
               GET NEW LIKE COUNT
            ------------------------- */

            const {
                count,
                error: countError
            } =
                await supabase
                    .from("comment_likes")
                    .select("id", {
                        count: "exact",
                        head: true
                    })
                    .eq(
                        "comment_id",
                        commentId
                    );

            if (countError) {

                console.error(
                    "COMMENT LIKE COUNT ERROR:",
                    countError
                );

                return res.status(500).json({
                    success: false,
                    error:
                        countError.message
                });

            }


            console.log(
                "COMMENT UNLIKED:",
                commentId,
                "TOTAL:",
                count || 0
            );


            return res.json({
                success: true,
                liked: false,
                likes: count || 0
            });

        }


        /* =================================================
           USER HAS NOT LIKED
           → CREATE LIKE
        ================================================= */

        const {
            data: newLike,
            error: insertLikeError
        } =
            await supabase
                .from("comment_likes")
                .insert([
                    {
                        comment_id:
                            commentId,

                        user_id:
                            userId
                    }
                ])
                .select()
                .single();

        if (insertLikeError) {

            console.error(
                "CREATE COMMENT LIKE ERROR:",
                insertLikeError
            );

            return res.status(500).json({
                success: false,
                error:
                    insertLikeError.message
            });

        }


        /* -------------------------
           GET NEW LIKE COUNT
        ------------------------- */

        const {
            count,
            error: countError
        } =
            await supabase
                .from("comment_likes")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "comment_id",
                    commentId
                );

        if (countError) {

            console.error(
                "COMMENT LIKE COUNT ERROR:",
                countError
            );

            return res.status(500).json({
                success: false,
                error:
                    countError.message
            });

        }


        console.log(
            "COMMENT LIKED:",
            commentId,
            "TOTAL:",
            count || 0
        );


        res.json({
            success: true,
            liked: true,
            message:
                "Comment liked ❤️",
            like:
                newLike,
            likes:
                count || 0
        });


    } catch (error) {

        console.error(
            "COMMENT LIKE / UNLIKE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                "Could not update comment like."
        });

    }

});


/* =========================================================
   SUPABASE TEST
========================================================= */

app.get("/api/supabase-test", async (req, res) => {
    try {
        const {
            data,
            error
        } = await supabase
            .from("posts")
            .select("*")
            .limit(1);

        if (error) {
            return res.status(500).json({
                connected: false,
                error: error.message
            });
        }

        res.json({
            connected: true,
            message:
                "Gleza is connected to Supabase 🚀",
            data: data
        });

    } catch (error) {
        console.error(
            "SUPABASE TEST ERROR:",
            error
        );

        res.status(500).json({
            connected: false,
            error: "Supabase connection failed."
        });
    }
});

/* =========================================================
   HOME PAGE
========================================================= */

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});



/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Gleza is running at http://localhost:${PORT}`
    );
});