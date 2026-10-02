const API_URL = "/api";

const helpSettings = document.getElementById("helpSettings");
/* =========================================================
   GLEZA - MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   JOKES
========================================================= */

const jokes = [
    "My wallet and I have something in common... we're both empty. 😭",
    "I told myself I would sleep early tonight. My phone said, 'Let's see about that.' 😂",
    "Why do students love group assignments? Because there is always one person doing all the work. 💀",
    "My bank account said, 'You need money.' I said, 'I know.' It said, 'No, YOU need money.' 😭",
    "I was going to be productive today... then I remembered I have Wi-Fi. 😂",
    "My bed and I are in a serious relationship. I just can't leave it. ❤️😂",
    "Teacher: Why are you late? Student: Traffic. Teacher: You walked here. Student: Human traffic. 💀",
    "I don't need a motivational speech. I need money. 😂",
    "Adulting is basically saying 'I'll do it tomorrow' until tomorrow becomes next year. 😭",
    "My phone battery lasts longer than my motivation. 💀",
    "I opened my fridge five times hoping new food would appear. It didn't. 😭",
    "Money can't buy happiness, but it can buy food... and that's pretty close. 😂",
    "Me checking my bank account after buying one thing: We need to talk. 😭",
    "I have a lot of plans. Unfortunately, my bed has other plans. 😂",
    "If overthinking was a sport, I would be a champion. 💀",
    "My alarm clock and I have a toxic relationship. It screams, I ignore it. 😂",
    "I came, I saw, I forgot what I was doing. 😭"
];


/* =========================================================
   GLOBAL DATA
========================================================= */

let allPosts = [];

let currentHomeFilter = "all";

let currentHumorFilter = "all";

let currentSearchTerm = "";


/* =========================================================
   PAGE DETECTION
========================================================= */

function getCurrentPage() {

    const path =
        window.location.pathname.toLowerCase();

    if (path.includes("trending")) {
        return "trending";
    }

    if (path.includes("upload")) {
        return "upload";
    }

    if (path.includes("liked")) {
        return "liked";
    }

    if (path.includes("profile")) {
        return "profile";
    }

    return "home";
}


/* =========================================================
   DOM ELEMENTS
========================================================= */

const makeMeLaugh =
    document.getElementById("makeMeLaugh");

const anotherJoke =
    document.getElementById("anotherJoke");

const jokeText =
    document.getElementById("jokeText");

const jokeSection =
    document.getElementById("jokeSection");

const searchBtn =
    document.querySelector(".search-btn");

const seeAllBtn =
    document.querySelector(".see-all");

const contentTitle =
    document.getElementById("contentTitle");

const contentGrid =
    document.querySelector(".content-grid");

const categoryButtons =
    document.querySelectorAll(".category");

const humorButtons =
    document.querySelectorAll(".humor-category");

const trendingFilterButtons =
    document.querySelectorAll(
        "[data-trending-filter]"
    );

const likedFilterButtons =
    document.querySelectorAll(
        "[data-liked-filter]"
    );

const profileTabs =
    document.querySelectorAll(".profile-tab");


/* =========================================================
   RANDOM JOKE
========================================================= */

async function showRandomJoke(scrollToJoke = true) {

    if (!jokeText) {
        return;
    }

    jokeText.textContent =
        "😂 Finding a fresh joke...";

    try {

        const response =
            await fetch(
                `${API_URL}/joke`
            );

        if (!response.ok) {

            throw new Error(
                `Joke request failed: ${response.status}`
            );

        }

        const data =
            await response.json();

        if (
            !data ||
            !data.joke
        ) {

            throw new Error(
                "No joke returned."
            );

        }

        jokeText.textContent =
            data.joke;

    } catch (error) {

        console.error(
            "GLEZA JOKE ERROR:",
            error
        );

        /* -------------------------
           FALLBACK TO GLEZA JOKES
        ------------------------- */

        const randomIndex =
            Math.floor(
                Math.random() *
                jokes.length
            );

        jokeText.textContent =
            jokes[randomIndex];

    }


    /* -------------------------
       SCROLL TO JOKE
    ------------------------- */

    if (
        scrollToJoke &&
        jokeSection
    ) {

        jokeSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


/* =========================================================
   MAKE ME LAUGH BUTTON
========================================================= */

if (makeMeLaugh) {

    makeMeLaugh.addEventListener(
        "click",
        function() {

            showRandomJoke(true);

        }
    );

}


/* =========================================================
   ANOTHER JOKE BUTTON
========================================================= */

if (anotherJoke) {

    anotherJoke.addEventListener(
        "click",
        function() {

            showRandomJoke(false);

        }
    );

}


/* =========================================================
   LOAD POSTS
========================================================= */

async function loadPosts() {

    if (!contentGrid) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/posts`
            );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        if (Array.isArray(data)) {

            allPosts = data;

        } else if (
            Array.isArray(data.posts)
        ) {

            allPosts =
                data.posts;

        } else {

            allPosts = [];

        }


        /*
           Save posts so Search can use them.
        */


        if (
            getCurrentPage() === "home"
        ) {

            applyHomeFilters();

        } else if (
            getCurrentPage() === "trending"
        ) {

            applyTrendingFilter();

        } else if (
            getCurrentPage() === "liked"
        ) {

            applyLikedFilter();

        } else {

            displayPosts(
                allPosts
            );

        }


        console.log(
            "Gleza posts loaded:",
            allPosts
        );


    } catch (error) {

        console.error(
            "Could not load Gleza posts:",
            error
        );


        /*
           Keep existing HTML sample cards
           if backend isn't available.
        */

        attachPostButtons();

    }

}


/* =========================================================
   DISPLAY POSTS
========================================================= */

function displayPosts(posts) {

    const contentGrid =
        document.querySelector(".content-grid");

    if (!contentGrid) {
        return;
    }

    contentGrid.innerHTML = "";

    if (!posts || posts.length === 0) {
        showEmptyPosts();
        return;
    }

    posts.forEach((post, index) => {

        const type =
            String(
                post.type ||
                post.post_type ||
                "meme"
            ).toLowerCase();

        const imageUrl =
            post.image_url ||
            post.imageUrl ||
            post.image ||
            "";

        const title =
            post.title ||
            "";

        const content =
            post.content ||
            post.text ||
            post.body ||
            "";

        const category =
            post.category ||
            post.humor_category ||
            post.humor ||
            "";

        const id =
            post.id ||
            post._id ||
            `post-${index + 1}`;

        const likes =
            Number(post.likes || post.like_count || 0);

        const comments =
            Number(
                post.comments ||
                post.comment_count ||
                0
            );

        const views =
           Number(
               post.views ||
               post.view_count ||
               0
    
            );

        /* =====================================================
           CREATE CARD
        ===================================================== */

        const card =
            document.createElement("article");

        card.className =
            `post-card post-card-${type}`;

        card.dataset.id = id;
        card.dataset.userId =post.user_id || "";
        card.dataset.type = type;
        card.dataset.image = imageUrl;
        card.dataset.title = title;
        card.dataset.content = content;
        card.dataset.humor = category;

        // Creator information
const creatorId = post.user_id || "";

const creatorHTML = creatorId
    ? `
        <div class="post-author" data-user-id="${escapeHTML(creatorId)}">
          <div class="post-author-avatar">
          <div class="gleza-avatar-logo">G</div>
         </div>
            <div class="post-author-info">
              <span class="post-author-name">
    Gleza User
</span>

<span class="post-author-username">
    @glezauser
</span>

<span class="post-author-arrow">
    ›
</span>
            </div>
        </div>
      `
    : "";

        /* =====================================================
           MEME
           IMAGE ONLY
        ===================================================== */

        if (type === "meme") {

            card.innerHTML = `

            ${creatorHTML}

                <div class="post-image">

                    ${
                        imageUrl
                            ? `
                                <img
                                    src="${escapeHTML(imageUrl)}"
                                    alt="Gleza meme"
                                    loading="lazy"
                                >
                              `
                            : `
                                <div class="post-image-placeholder">
                                    😂
                                </div>
                              `
                    }

                </div>


                <div class="post-actions">
                    
           

                    <button
                        class="like-btn"
                        type="button"
                    >
                        ❤️ ${formatNumber(likes)}
                    </button>

                    <button
                        class="comment-btn"
                        type="button"
                    >
                        💬 ${formatNumber(comments)}
                    </button>

                    <button
                        class="copy-link-btn"
                        type="button"
                    >
                        🔗 Copy
                    </button>

                    ${
                        imageUrl
                            ? `
                                <button
                                    class="download-btn"
                                    type="button"
                                >
                                    ⬇️ Download
                                </button>
                              `
                            : ""
                    }

                </div>

            `;

        }

/* =====================================================
           JOKE
           TEXT ONLY
        ===================================================== */

        else if (type === "joke") {

            const isLongJoke =
                content.length > 300;

            const previewText =
                isLongJoke
                    ? content.slice(0, 300).trim() + "..."
                    : content;

            card.innerHTML = `

                ${creatorHTML}

                <div class="post-text-card">

                    <div class="post-type">
                        🤣 JOKE
                    </div>

                    ${
                        title
                            ? `
                                <h3>
                                    ${escapeHTML(title)}
                                </h3>
                              `
                            : ""
                    }

                    <p class="post-content">
                        ${escapeHTML(previewText)}
                    </p>

                    ${
                        isLongJoke
                            ? `
                                <button
                                    class="read-more-btn"
                                    type="button"
                                >
                                    Read more ↓
                                </button>
                              `
                            : ""
                    }

                    ${
                        category
                            ? `
                                <div class="post-category">
                                    #${escapeHTML(category)}
                                </div>
                              `
                            : ""
                    }

                </div>


                <div class="post-actions">

                 

                    <button
                        class="like-btn"
                        type="button"
                    >
                        ❤️ ${formatNumber(likes)}
                    </button>

                    <button
                        class="comment-btn"
                        type="button"
                    >
                        💬 ${formatNumber(comments)}
                    </button>

                    <button
                        class="copy-link-btn"
                        type="button"
                    >
                        🔗 Copy
                    </button>

                </div>

            `;

            const readMoreButton =
                card.querySelector(
                    ".read-more-btn"
                );

            if (readMoreButton) {

                readMoreButton.addEventListener(
                    "click",
                    function(event) {

                        event.preventDefault();
                        event.stopPropagation();

                        openPostViewer(
                            card,
                            false
                        );

                    }
                );

            }

        }


        /* =====================================================
           STORY
           TEXT ONLY
        ===================================================== */

        else if (type === "story") {

            const isLongStory =
                content.length > 300;

            const previewText =
                isLongStory
                    ? content.slice(0, 300).trim() + "..."
                    : content;

            card.innerHTML = `

                ${creatorHTML}

                <div class="post-text-card">

                    <div class="post-type">
                        📝 STORY
                    </div>

                    ${
                        title
                            ? `
                                <h3>
                                    ${escapeHTML(title)}
                                </h3>
                              `
                            : ""
                    }

                    <p class="post-content">
                        ${escapeHTML(previewText)}
                    </p>

                    ${
                        isLongStory
                            ? `
                                <button
                                    class="read-more-btn"
                                    type="button"
                                >
                                    Read more ↓
                                </button>
                              `
                            : ""
                    }

                    ${
                        category
                            ? `
                                <div class="post-category">
                                    #${escapeHTML(category)}
                                </div>
                              `
                            : ""
                    }

                </div>


                <div class="post-actions">

                    <button
                        class="like-btn"
                        type="button"
                    >
                        ❤️ ${formatNumber(likes)}
                    </button>

                    <button
                        class="comment-btn"
                        type="button"
                    >
                        💬 ${formatNumber(comments)}
                    </button>

                    <button
                        class="copy-link-btn"
                        type="button"
                    >
                        🔗 Copy
                    </button>

                </div>

            `;

            const readMoreButton =
                card.querySelector(
                    ".read-more-btn"
                );

            if (readMoreButton) {

                readMoreButton.addEventListener(
                    "click",
                    function(event) {

                        event.preventDefault();
                        event.stopPropagation();

                        openPostViewer(
                            card,
                            false
                        );

                    }
                );

            }

        }

        /* =====================================================
           UNKNOWN TYPE
        ===================================================== */

        else {

            card.innerHTML = `

                ${creatorHTML}

                <div class="post-text-card">

                    <div class="post-type">
                        ${escapeHTML(type.toUpperCase())}
                    </div>

                    ${
                        title
                            ? `
                                <h3>
                                    ${escapeHTML(title)}
                                </h3>
                              `
                            : ""
                    }

                    <p class="post-content">
                        ${escapeHTML(content)}
                    </p>

                </div>


                <div class="post-actions">

                 <span class="view-count">
                      👁️ ${formatNumber(views)}
                 </span>

                    <button
                        class="like-btn"
                        type="button"
                    >
                        ❤️ ${formatNumber(likes)}
                    </button>

                    <button
                        class="comment-btn"
                        type="button"
                    >
                        💬 ${formatNumber(comments)}
                    </button>

                    <button
                        class="copy-link-btn"
                        type="button"
                    >
                        🔗 Copy
                    </button>

                </div>

            `;

        }


        contentGrid.appendChild(card);

if (creatorId) {
    fetch(`${API_URL}/users/${creatorId}/profile`)
        .then(response => response.json())
        .then(profile => {
            const authorName =
                card.querySelector(".post-author-name");

            const authorUsername =
                card.querySelector(".post-author-username");

            const authorAvatar =
                card.querySelector(".post-author-avatar");

            if (authorName) {
                authorName.textContent =
                    profile.name || "Gleza User";
            }

            if (authorUsername) {
                authorUsername.textContent =
                    profile.username
                        ? "@" + profile.username
                        : "@glezauser";
            }

            if (authorAvatar && profile.avatar_url) {
                authorAvatar.innerHTML = `
                    <img
                        src="${escapeHTML(profile.avatar_url)}"
                        alt="Profile"
                    >
                `;
            }
        })
        .catch(error => {
            console.error(
                "CREATOR PROFILE ERROR:",
                error
            );
        });
}

    });


    attachPostButtons();

 document.querySelectorAll(".post-author").forEach(author => {
    author.addEventListener("click", () => {
        const userId = author.dataset.userId;

        if (!userId) return;

        window.location.href =
            `profile.html?user=${encodeURIComponent(userId)}`;
    });
});

}


/* =========================================================
   EMPTY POSTS
========================================================= */

function showEmptyPosts() {

    const contentGrid =
        document.querySelector(".content-grid");

    if (!contentGrid) {
        return;
    }

    contentGrid.innerHTML = `

        <div class="empty-posts">

            <div class="empty-posts-icon">
                😂
            </div>

            <h3>
                Nothing here yet
            </h3>

            <p>
                Be the first person to post something!
            </p>

        </div>

    `;

}


/* =========================================================
   POST LINK
========================================================= */

function getPostLink(post) {

    const url =
        new URL(window.location.href);

    if (post?.id) {

        url.searchParams.set(
            "post",
            post.id
        );

    }

    return url.toString();

}


/* =========================================================
   COPY LINK
========================================================= */

async function copyPostLink(post, button = null) {

    const link =
        getPostLink(post);

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(link);

        } else {

            const textArea =
                document.createElement("textarea");

            textArea.value = link;

            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";

            document.body.appendChild(textArea);

            textArea.select();

            document.execCommand("copy");

            textArea.remove();

        }


        if (button) {

            const originalText =
                button.textContent;

            button.textContent =
                "✅ Copied!";

            setTimeout(() => {

                button.textContent =
                    originalText;

            }, 1500);

        }

    } catch (error) {

        alert(
            "Could not copy the link. Please try again."
        );

    }

}


/* =========================================================
   ATTACH POST BUTTONS
========================================================= */

function attachPostButtons() {

    const postCards =
        document.querySelectorAll(".post-card");


    postCards.forEach(card => {

        if (
            card.dataset.buttonsAttached === "true"
        ) {
            return;
        }

        card.dataset.buttonsAttached = "true";


        const likeBtn =
            card.querySelector(".like-btn");

        const commentBtn =
            card.querySelector(".comment-btn");

        const copyLinkBtn =
            card.querySelector(".copy-link-btn");

        const downloadBtn =
            card.querySelector(".download-btn");


/* =====================================================
   LIKE / UNLIKE POST — FAST / OPTIMISTIC
===================================================== */

if (likeBtn) {

    likeBtn.addEventListener(
        "click",
        async function(event) {

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();



            if (
                likeBtn.dataset.liking === "true"
            ) {
                return;
            }

            const postId =
                card.dataset.id;

            if (
                !postId ||
                postId.startsWith("sample-")
            ) {
                return;
            }


            /* =================================================
               SAVE CURRENT STATE
            ================================================= */

            const wasLiked =
                likeBtn.classList.contains("liked");

            const currentText =
                likeBtn.textContent;

            const currentMatch =
                currentText.match(/[\d,.]+/);

            const currentLikes =
                currentMatch
                    ? Number(
                        currentMatch[0]
                            .replace(/,/g, "")
                    )
                    : 0;


            /* =================================================
               UPDATE UI IMMEDIATELY
            ================================================= */

            const newLiked =
                !wasLiked;

            const newLikes =
                Math.max(
                    0,
                    currentLikes +
                    (newLiked ? 1 : -1)
                );

            likeBtn.textContent =
                newLiked
                    ? `❤️ ${formatNumber(newLikes)}`
                    : `♡ ${formatNumber(newLikes)}`;

            likeBtn.classList.toggle(
                "liked",
                newLiked
            );


            /* =================================================
               LOCK ONLY WHILE REQUEST IS BEING SENT
            ================================================= */

            likeBtn.dataset.liking =
                "true";


            try {

                const supabaseClient =
                    await getGlezaSupabase();


                const {
                    data: sessionData,
                    error: sessionError
                } =
                    await supabaseClient.auth.getSession();


                if (
                    sessionError ||
                    !sessionData?.session
                ) {

                    throw new Error(
                        "Please log in to like posts."
                    );

                }


                const accessToken =
                    sessionData.session.access_token;


                /* =================================================
                   SEND TO BACKEND
                ================================================= */

                const response =
                    await fetch(
                        `${API_URL}/posts/${encodeURIComponent(postId)}/like`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${accessToken}`
                            }
                        }
                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.error ||
                        "Could not update post like."
                    );

                }


                /* =================================================
                   SYNC WITH REAL SERVER COUNT
                ================================================= */

                const likes =
                    Number(
                        result.likes ??
                        result.post?.likes ??
                        newLikes
                    );


                likeBtn.textContent =
                    result.liked
                        ? `❤️ ${formatNumber(likes)}`
                        : `♡ ${formatNumber(likes)}`;


                likeBtn.classList.toggle(
                    "liked",
                    Boolean(result.liked)
                );


                console.log(
                    result.liked
                        ? "POST LIKED:"
                        : "POST UNLIKED:",
                    postId,
                    "TOTAL:",
                    likes
                );


            } catch (error) {

                console.error(
                    "GLEZA POST LIKE ERROR:",
                    error
                );


                /* =================================================
                   ROLLBACK IF SERVER FAILS
                ================================================= */

                likeBtn.textContent =
                    currentText;

                likeBtn.classList.toggle(
                    "liked",
                    wasLiked
                );


                alert(
                    error.message ||
                    "Could not update post like."
                );


            } finally {

                likeBtn.dataset.liking =
                    "false";

            }

        }
    );

}

/* =====================================================
   COPY LINK
===================================================== */

if (copyLinkBtn) {

    copyLinkBtn.addEventListener(
        "click",
        function(event) {

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const post =
                getViewerPostData(card);

            copyGlezaLink(
                post,
                copyLinkBtn
            );

        }
    );

}

        /* =====================================================
           DOWNLOAD
           MEMES ONLY
        ===================================================== */

        if (downloadBtn) {

            downloadBtn.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();

                    const post =
                        getViewerPostData(card);

                    if (
                        post.type === "meme" &&
                        post.image
                    ) {

                        downloadPostImage(post);

                    }

                }
            );

        }


        /* =====================================================
           OPEN POST
        ===================================================== */

        card.addEventListener(
            "click",
            function(event) {

                if (
                    event.target.closest(
                        ".like-btn"
                    ) ||
                    event.target.closest(
                        ".comment-btn"
                    ) ||
                    event.target.closest(
                        ".copy-link-btn"
                    ) ||
                    event.target.closest(
                        ".download-btn"
                    )
                ) {

                    return;

                }

                openPostViewer(
                    card,
                    false
                );

            }
        );

    });

}


/* =========================================================
   GET VIEWER POST DATA
========================================================= */

function getViewerPostData(card) {

    if (!card) {

      return {

       id,
       image,
       title,
       content,
       type,
       category,
       userId: card.dataset.userId || ""

      };  

    }


    const image =
        card.dataset.image ||
        card.querySelector(
            ".post-image img"
        )?.src ||
        "";


    const title =
        card.dataset.title ||
        card.querySelector("h3")
            ?.textContent
            ?.trim() ||
        "";


    const content =
        card.dataset.content ||
        card.querySelector(
            ".post-content"
        )
            ?.textContent
            ?.trim() ||
        "";


    const type =
        (
            card.dataset.type ||
            "post"
        ).toLowerCase();


    const category =
        card.dataset.humor ||
        card.querySelector(
            ".post-category"
        )
            ?.textContent
            ?.trim()
            ?.replace(/^#/, "") ||
        "";


    const id =
        card.dataset.id ||
        title ||
        content.slice(0, 40) ||
        "post";


    return {

        id,
        image,
        title,
        content,
        type,
        category

    };

}


/* =========================================================
   CREATE POST VIEWER
========================================================= */

function createPostViewer() {

    let viewer =
        document.getElementById(
            "glezaPostViewer"
        );

    if (viewer) {

        return viewer;

    }


    viewer =
        document.createElement("div");

    viewer.id =
        "glezaPostViewer";


    viewer.innerHTML = `

        <div class="gleza-viewer-backdrop"></div>


        <div
            class="gleza-viewer"
            role="dialog"
            aria-modal="true"
        >

            <button
                class="gleza-viewer-close gleza-viewer-back"
                type="button"
                aria-label="Go back"
            >
                ← Back
            </button>


            <div class="gleza-viewer-media"></div>


            <div class="gleza-viewer-info">

                <div class="gleza-viewer-type"></div>

                <h2 class="gleza-viewer-title"></h2>

                <div class="gleza-viewer-content"></div>

                <div class="gleza-viewer-category"></div>

            </div>


            <div class="gleza-viewer-actions">

                <button
                    class="viewer-like-btn"
                    type="button"
                >
                    ❤️ Like
                </button>

                <button
                    class="viewer-comment-btn"
                    type="button"
                >
                    💬 Comments
                </button>

                <button
                    class="viewer-copy-link-btn"
                    type="button"
                >
                    🔗 Copy Link
                </button>

                <button
                    class="viewer-download-btn"
                    type="button"
                    style="display:none;"
                >
                    ⬇️ Download
                </button>

            </div>


            <div class="gleza-comments">

                <h3>
                    Comments
                </h3>

                <div
                    class="gleza-comments-list"
                ></div>


                <form
                    class="gleza-comment-form"
                >

                    <input
                        type="text"
                        class="gleza-comment-input"
                        placeholder="Write a comment..."
                        maxlength="300"
                    >

                    <button
                        type="submit"
                    >
                        Post
                    </button>

                </form>

            </div>

        </div>

    `;


    document.body.appendChild(
        viewer
    );


    /* =====================================================
       CLOSE
    ===================================================== */

    const closeButton =
        viewer.querySelector(
            ".gleza-viewer-close"
        );

    const backdrop =
        viewer.querySelector(
            ".gleza-viewer-backdrop"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closePostViewer
        );

    }


    if (backdrop) {

        backdrop.addEventListener(
            "click",
            closePostViewer
        );

    }


    /* =====================================================
       VIEWER LIKE
    ===================================================== */

    const viewerLike =
        viewer.querySelector(
            ".viewer-like-btn"
        );


    if (viewerLike) {

        viewerLike.addEventListener(
            "click",
            function() {

                const currentCard =
                    viewer.currentCard;

                if (!currentCard) {
                    return;
                }


                const originalLike =
                    currentCard.querySelector(
                        ".like-btn"
                    );


                if (originalLike) {

                    originalLike.click();

                    viewerLike.classList.toggle(
                        "liked",
                        originalLike.classList.contains(
                            "liked"
                        )
                    );

                }

            }
        );

    }





    /* =====================================================
       VIEWER DOWNLOAD
       MEMES ONLY
    ===================================================== */

    const viewerDownload =
        viewer.querySelector(
            ".viewer-download-btn"
        );


    if (viewerDownload) {

        viewerDownload.addEventListener(
            "click",
            function() {

                const post =
                    viewer.currentPost;

                if (
                    post &&
                    post.type === "meme" &&
                    post.image
                ) {

                    downloadPostImage(
                        post
                    );

                }

            }
        );

    }


    return viewer;

}


/* =========================================================
   OPEN POST VIEWER
========================================================= */

function openPostViewer(
    card,
    focusComments = false
) {

    const viewer =
        createPostViewer();


    const post =
        getViewerPostData(card);


    viewer.currentCard =
        card;

    viewer.currentPost =
        post;


    viewer.dataset.postType =
        post.type;


    const media =
        viewer.querySelector(
            ".gleza-viewer-media"
        );

    const typeElement =
        viewer.querySelector(
            ".gleza-viewer-type"
        );

    const titleElement =
        viewer.querySelector(
            ".gleza-viewer-title"
        );

    const contentElement =
        viewer.querySelector(
            ".gleza-viewer-content"
        );

    const categoryElement =
        viewer.querySelector(
            ".gleza-viewer-category"
        );

    const downloadButton =
        viewer.querySelector(
            ".viewer-download-btn"
        );

    const viewerLike =
        viewer.querySelector(
            ".viewer-like-btn"
        );


    /* =====================================================
       TYPE
    ===================================================== */

    if (typeElement) {

        if (post.type === "meme") {

            typeElement.textContent =
                "😂 MEME";

        } else if (
            post.type === "joke"
        ) {

            typeElement.textContent =
                "🤣 JOKE";

        } else if (
            post.type === "story"
        ) {

            typeElement.textContent =
                "📝 STORY";

        } else {

            typeElement.textContent =
                post.type.toUpperCase();

        }

    }


    /* =====================================================
       MEDIA
    ===================================================== */

    if (media) {

        if (
            post.type === "meme" &&
            post.image
        ) {

            media.innerHTML = `

                <img
                    src="${escapeHTML(post.image)}"
                    alt="Gleza meme"
                >

            `;

            media.style.display = "";

        } else {

            /*
                JOKES AND STORIES
                HAVE NO IMAGE AREA.
            */

            media.innerHTML = "";

            media.style.display =
                "none";

        }

    }


    /* =====================================================
       TITLE
    ===================================================== */

    if (titleElement) {

        if (post.title) {

            titleElement.textContent =
                post.title;

            titleElement.style.display =
                "";

        } else {

            titleElement.textContent =
                "";

            titleElement.style.display =
                "none";

        }

    }


    /* =====================================================
       CONTENT
    ===================================================== */

    if (contentElement) {

        if (post.content) {

            contentElement.textContent =
                post.content;

            contentElement.style.display =
                "";

        } else {

            contentElement.textContent =
                "";

            contentElement.style.display =
                "none";

        }

    }


    /* =====================================================
       CATEGORY
    ===================================================== */

    if (categoryElement) {

        if (post.category) {

            categoryElement.textContent =
                `#${post.category}`;

            categoryElement.style.display =
                "";

        } else {

            categoryElement.textContent =
                "";

            categoryElement.style.display =
                "none";

        }

    }


    /* =====================================================
       DOWNLOAD
       ONLY MEMES
    ===================================================== */

    if (downloadButton) {

        if (
            post.type === "meme" &&
            post.image
        ) {

            downloadButton.style.display =
                "";

        } else {

            downloadButton.style.display =
                "none";

        }

    }


    /* =====================================================
       LIKE STATE
    ===================================================== */

    if (viewerLike) {

        const originalLike =
            card?.querySelector(
                ".like-btn"
            );


        viewerLike.classList.toggle(
            "liked",
            Boolean(
                originalLike?.classList.contains(
                    "liked"
                )
            )
        );

    }

    /* =====================================================
       SHOW VIEWER
    ===================================================== */

    viewer.classList.add(
        "active"
    );

    document.body.classList.add(
        "gleza-viewer-open"
    );


    const viewerBox =
        viewer.querySelector(
            ".gleza-viewer"
        );


    if (viewerBox) {

        viewerBox.scrollTop = 0;

    }


    /* =====================================================
       FOCUS COMMENTS
    ===================================================== */

    if (focusComments) {

        setTimeout(() => {

            const comments =
                viewer.querySelector(
                    ".gleza-comments"
                );

            const input =
                viewer.querySelector(
                    ".gleza-comment-input"
                );


            if (comments) {

                comments.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }


            if (input) {

                input.focus();

            }

        }, 250);

    }

}


/* =========================================================
   CLOSE POST VIEWER
========================================================= */

function closePostViewer() {

    const viewer =
        document.getElementById(
            "glezaPostViewer"
        );


    if (!viewer) {
        return;
    }


    viewer.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "gleza-viewer-open"
    );

}


/* =========================================================
   ESC KEY CLOSE
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closePostViewer();

        }

    }
);

/* =========================================================
   CREATE SHARE MENU
========================================================= */

function createShareMenu() {

    if (
        document.getElementById(
            "glezaShareMenu"
        )
    ) {
        return;
    }


    const menu =
        document.createElement("div");

    menu.id =
        "glezaShareMenu";

    menu.className =
        "gleza-viewer-share";


    menu.innerHTML = `

        <div class="gleza-share-card">

            <h3>
                Share this post
            </h3>

            <p>
                Share the fun with your friends 😂
            </p>

            <div class="gleza-share-actions">

                <button
                    class="gleza-share-btn native-share"
                    type="button"
                >
                    📤 Share
                </button>

                <button
                    class="gleza-share-btn copy-share"
                    type="button"
                >
                    🔗 Copy link
                </button>

            </div>

            <button
                class="gleza-share-close"
                type="button"
            >
                Cancel
            </button>

        </div>

    `;


    document.body.appendChild(menu);


    /* BACKDROP */

    menu.addEventListener(
        "click",
        function(event) {

            if (
                event.target === menu
            ) {

                closeShareMenu();

            }

        }
    );


    /* CLOSE */

    menu.querySelector(
        ".gleza-share-close"
    ).addEventListener(
        "click",
        closeShareMenu
    );


    /* NATIVE SHARE */

    menu.querySelector(
        ".native-share"
    ).addEventListener(
        "click",
        async function() {

            const post =
                menu.currentPost;

            if (!post) return;


            const shareText =
                post.title ||
                post.content ||
                "Check this out on Gleza 😂";


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share({

                        title: "Gleza",

                        text: shareText,

                        url:
                            window.location.href

                    });

                } else {

                    await copyGlezaLink();

                }

            } catch (error) {

                console.log(
                    "Share cancelled."
                );

            }

        }
    );


    /* COPY LINK */

    menu.querySelector(
        ".copy-share"
    ).addEventListener(
        "click",
        async function() {

            await copyGlezaLink();

        }
    );

}

/* =========================================================
   COPY GLEZA POST LINK
========================================================= */

async function copyGlezaLink(post = null, button = null) {

    /*
       If a specific post was supplied,
       create a link for that post.
    */

    let url = window.location.origin + window.location.pathname;

    if (post && post.id) {

        url +=
            "?post=" +
            encodeURIComponent(post.id);

    }


    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                url
            );

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                url;

            textarea.style.position =
                "fixed";

            textarea.style.left =
                "-9999px";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.focus();

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();

        }


        /*
           Show confirmation on the
           button that was clicked.
        */

        if (button) {

            const originalText =
                button.textContent;

            button.textContent =
                "✅ Copied!";

            setTimeout(
                function() {

                    button.textContent =
                        originalText;

                },
                1800
            );

        }


        console.log(
            "Gleza post link copied:",
            url
        );


        return true;

    } catch (error) {

        console.error(
            "Copy link error:",
            error
        );


        alert(
            "Could not copy the link. Please copy it manually."
        );


        return false;

    }

}

/* =========================================================
   CLOSE SHARE MENU
========================================================= */

function closeShareMenu() {

    const menu =
        document.getElementById(
            "glezaShareMenu"
        );

    if (!menu) return;

    menu.classList.remove(
        "active"
    );

}


/* =========================================================
   DOWNLOAD POST IMAGE
========================================================= */
async function downloadPostImage(post) {

    if (!post || !post.image) {

        alert(
            "This post does not have an image to download."
        );

        return;
    }


    try {

        /*
         * Load the original image
         */

        const response =
            await fetch(post.image);

        if (!response.ok) {

            throw new Error(
                "Image could not be downloaded."
            );
        }


        const blob =
            await response.blob();


        /*
         * Create an image object
         */

        const image =
            new Image();

        image.crossOrigin =
            "anonymous";


        const imageUrl =
            URL.createObjectURL(
                blob
            );


        image.onload =
            function () {

                /*
                 * Create canvas
                 */

                const canvas =
                    document.createElement(
                        "canvas"
                    );

                const ctx =
                    canvas.getContext(
                        "2d"
                    );


                canvas.width =
                    image.naturalWidth;

                canvas.height =
                    image.naturalHeight;


                /*
                 * Draw original image
                 */

                ctx.drawImage(
                    image,
                    0,
                    0
                );


                /*
                 * Create Gleza watermark
                 */

                const fontSize =
                    Math.max(
                        24,
                        Math.round(
                            canvas.width * 0.035
                        )
                    );


                const padding =
                    Math.round(
                        canvas.width * 0.025
                    );


                ctx.font =
                    "bold " +
                    fontSize +
                    "px Arial";


                ctx.textAlign =
                    "right";

                ctx.textBaseline =
                    "bottom";


                /*
                 * Add subtle background
                 * behind the watermark
                 */

                const text =
                    "Gleza";


                const textWidth =
                    ctx.measureText(
                        text
                    ).width;


                const boxWidth =
                    textWidth +
                    padding * 2;


                const boxHeight =
                    fontSize +
                    padding * 2;


                const x =
                    canvas.width -
                    padding;


                const y =
                    canvas.height -
                    padding;


                ctx.fillStyle =
                    "rgba(0, 0, 0, 0.45)";


                ctx.fillRect(
                    canvas.width -
                    boxWidth -
                    padding,
                    canvas.height -
                    boxHeight -
                    padding,
                    boxWidth,
                    boxHeight
                );


                /*
                 * Draw watermark
                 */

                ctx.fillStyle =
                    "rgba(255, 255, 255, 0.9)";


                ctx.fillText(
                    text,
                    x,
                    y
                );


                /*
                 * Convert canvas
                 * back into an image
                 */

                canvas.toBlob(
                    function (watermarkedBlob) {

                        if (!watermarkedBlob) {

                            throw new Error(
                                "Could not create download."
                            );
                        }


                        const downloadUrl =
                            URL.createObjectURL(
                                watermarkedBlob
                            );


                        const link =
                            document.createElement(
                                "a"
                            );


                        link.href =
                            downloadUrl;


                        link.download =
                            "gleza-post-" +
                            (
                                post.id ||
                                "image"
                            ) +
                            ".png";


                        document.body.appendChild(
                            link
                        );


                        link.click();


                        link.remove();


                        /*
                         * Clean up
                         */

                        URL.revokeObjectURL(
                            downloadUrl
                        );

                        URL.revokeObjectURL(
                            imageUrl
                        );

                    },
                    "image/png"
                );

            };


        image.onerror =
            function () {

                URL.revokeObjectURL(
                    imageUrl
                );

                throw new Error(
                    "Could not load image."
                );

            };


        image.src =
            imageUrl;


    } catch (error) {

        console.error(
            "Download error:",
            error
        );


        /*
         * If the image cannot be processed
         * because of an external image/CORS issue,
         * tell the user instead of silently
         * downloading an unwatermarked image.
         */

        alert(
            "This image could not be prepared for download. Please try again."
        );

    }

}

/* =========================================================
   GLEZA — CARDS MIXER
   Mixes memes, jokes and stories in the home feed
   while keeping all posts dynamic from the API.
========================================================= */

function mixGlezaPosts(posts) {

    if (!Array.isArray(posts) || posts.length <= 1) {
        return [...(posts || [])];
    }

    /* -----------------------------------------------------
       Separate posts by type
    ----------------------------------------------------- */

    const groups = {
        meme: [],
        joke: [],
        story: []
    };

    const otherPosts = [];

    posts.forEach(function (post) {

        const type =
            String(
                post.type ||
                post.post_type ||
                ""
            ).toLowerCase();

        if (groups[type]) {
            groups[type].push(post);
        } else {
            otherPosts.push(post);
        }

    });


    /* -----------------------------------------------------
       Keep newer posts toward the front of each group
    ----------------------------------------------------- */

    Object.keys(groups).forEach(function (type) {

        groups[type].sort(function (a, b) {

            const dateA =
                new Date(
                    a.created_at ||
                    a.createdAt ||
                    0
                ).getTime();

            const dateB =
                new Date(
                    b.created_at ||
                    b.createdAt ||
                    0
                ).getTime();

            return dateB - dateA;

        });

    });


    /* -----------------------------------------------------
       Create the mixed feed
    ----------------------------------------------------- */

    const mixed = [];

    let lastType = null;


    while (
        groups.meme.length ||
        groups.joke.length ||
        groups.story.length
    ) {

        const availableTypes =
            Object.keys(groups).filter(function (type) {

                return groups[type].length > 0;

            });


        if (!availableTypes.length) {
            break;
        }


        /*
           Prefer a different type from the
           previous card whenever possible.
        */

        let possibleTypes =
            availableTypes.filter(function (type) {

                return type !== lastType;

            });


        /*
           If only one type remains,
           use it.
        */

        if (!possibleTypes.length) {
            possibleTypes = availableTypes;
        }


        /*
           Prefer the type with the most
           remaining posts.

           This prevents a small category
           from controlling the entire feed.
        */

        possibleTypes.sort(function (a, b) {

            return groups[b].length -
                   groups[a].length;

        });


        const selectedType =
            possibleTypes[0];


        const nextPost =
            groups[selectedType].shift();


        if (nextPost) {

            mixed.push(nextPost);

            lastType =
                selectedType;

        }

    }


    /* -----------------------------------------------------
       Add any unknown/future post types
       at the end instead of losing them.
    ----------------------------------------------------- */

    if (otherPosts.length) {

        mixed.push(...otherPosts);

    }


    return mixed;

}

/* =========================================================
   HOME CATEGORY FILTERS
========================================================= */

categoryButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        categoryButtons.forEach(function(btn) {
            btn.classList.remove("active");
        });

        this.classList.add("active");

        currentHomeFilter =
            this.dataset.filter || "all";

        currentHumorFilter = "all";

        applyHomeFilters();

    });

});

/* =========================================================
   GLEZA — HOME FILTERS + CARDS MIXER
========================================================= */

function applyHomeFilters() {

    if (!contentGrid) {
        return;
    }


    /* Start with every post from the API */

    let filteredPosts =
        [...allPosts];


    /* -----------------------------------------------------
       TYPE FILTER
    ----------------------------------------------------- */

    if (currentHomeFilter === "meme") {

        filteredPosts =
            filteredPosts.filter(function (post) {

                return String(
                    post.type ||
                    post.post_type ||
                    ""
                ).toLowerCase() === "meme";

            });

    }


    if (currentHomeFilter === "joke") {

        filteredPosts =
            filteredPosts.filter(function (post) {

                return String(
                    post.type ||
                    post.post_type ||
                    ""
                ).toLowerCase() === "joke";

            });

    }


    if (currentHomeFilter === "story") {

        filteredPosts =
            filteredPosts.filter(function (post) {

                return String(
                    post.type ||
                    post.post_type ||
                    ""
                ).toLowerCase() === "story";

            });

    }


    /* -----------------------------------------------------
       TRENDING
       Keep trending based on views.
       DO NOT mix trending randomly.
    ----------------------------------------------------- */

    if (currentHomeFilter === "trending") {

        filteredPosts.sort(function (a, b) {

            return Number(b.views || 0) -
                   Number(a.views || 0);

        });

    }


    /* -----------------------------------------------------
       HUMOR CATEGORY FILTER
    ----------------------------------------------------- */

    if (
        currentHumorFilter &&
        currentHumorFilter !== "all"
    ) {

        filteredPosts =
            filteredPosts.filter(function (post) {

                const categories =
                    String(
                        post.category ||
                        post.humor_category ||
                        post.humor ||
                        ""
                    )
                    .toLowerCase()
                    .split(/[\s,]+/);


                return categories.includes(
                    currentHumorFilter.toLowerCase()
                );

            });

    }


    /* -----------------------------------------------------
       CARDS MIXER
       
       Only use the mixer for the general
       "For You" feed.

       Type-specific pages don't need mixing,
       and Trending keeps its view ranking.
    ----------------------------------------------------- */

    if (
        currentHomeFilter === "all" &&
        currentHumorFilter === "all"
    ) {

        filteredPosts =
            mixGlezaPosts(filteredPosts);

    }


    /* -----------------------------------------------------
       CONTENT TITLE
    ----------------------------------------------------- */

    if (contentTitle) {

        if (
            currentHomeFilter === "meme"
        ) {

            contentTitle.textContent =
                "Memes on Gleza";

        }

        else if (
            currentHomeFilter === "joke"
        ) {

            contentTitle.textContent =
                "Jokes on Gleza";

        }

        else if (
            currentHomeFilter === "story"
        ) {

            contentTitle.textContent =
                "Stories on Gleza";

        }

        else if (
            currentHomeFilter === "trending"
        ) {

            contentTitle.textContent =
                "Trending on Gleza";

        }

        else {

            contentTitle.textContent =
                "For You on Gleza";

        }

    }


    /* -----------------------------------------------------
       RENDER
    ----------------------------------------------------- */

    displayPosts(
        filteredPosts
    );

}

/* =========================================================
   HUMOR FILTER
========================================================= */

humorButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function() {

                humorButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                currentHumorFilter =
                    this.dataset.humor ||
                    "all";


                applyHomeFilters();

            }
        );

    }
);


/* =========================================================
   SEARCH SYSTEM
========================================================= */

/*
   The actual Search HTML will be added next.

   This JavaScript is already prepared for it.

   Expected elements:

   #searchInput
   #searchResults
   #searchEmpty
   #closeSearch
*/


function searchPosts(searchTerm) {

    const search =
        String(searchTerm || "")
            .toLowerCase()
            .trim();


    currentSearchTerm =
        search;


    if (!search) {

        return [];

    }


    return allPosts.filter(
        post => {

            const title =
                String(
                    post.title || ""
                ).toLowerCase();


            const content =
                String(
                    post.content || ""
                ).toLowerCase();


            const category =
                String(
                    post.category || ""
                ).toLowerCase();


            const type =
                String(
                    post.type || ""
                ).toLowerCase();


            return (
                title.includes(search) ||
                content.includes(search) ||
                category.includes(search) ||
                type.includes(search)
            );

        }
    );

}


/* =========================================================
   SEARCH INPUT
========================================================= */

function initializeSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const searchResults =
        document.getElementById(
            "searchResults"
        );


    const searchEmpty =
        document.getElementById(
            "searchEmpty"
        );


    const closeSearch =
        document.getElementById(
            "closeSearch"
        );


    if (!searchInput) {

        return;

    }


    /*
       Search while typing.
    */

    searchInput.addEventListener(
        "input",
        function() {

            const term =
                this.value.trim();


            if (!term) {

                if (searchResults) {

                    searchResults.innerHTML =
                        "";

                }


                if (searchEmpty) {

                    searchEmpty.style.display =
                        "none";

                }


                return;

            }


            const results =
                searchPosts(term);


            renderSearchResults(
                results,
                searchResults,
                searchEmpty,
                term
            );

        }
    );


    /*
       Close search button.
    */

    if (closeSearch) {

        closeSearch.addEventListener(
            "click",
            function() {

                window.history.back();

            }
        );

    }

}


/* =========================================================
   RENDER SEARCH RESULTS
========================================================= */

function renderSearchResults(
    results,
    searchResults,
    searchEmpty,
    searchTerm
) {

    if (!searchResults) {
        return;
    }


    searchResults.innerHTML =
        "";


    if (
        !results ||
        results.length === 0
    ) {

        if (searchEmpty) {

            searchEmpty.style.display =
                "";

            const emptyText =
                searchEmpty.querySelector(
                    "p"
                );


            if (emptyText) {

                emptyText.textContent =
                    `No results found for "${searchTerm}"`;

            }

        }


        return;

    }


    if (searchEmpty) {

        searchEmpty.style.display =
            "none";

    }


    results.forEach(
        post => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "post-card";


            article.dataset.type =
                post.type || "";


            article.dataset.humor =
                post.category || "";


            article.dataset.id =
                post.id || "";


            let emoji =
                "😂";


            if (
                post.type ===
                "joke"
            ) {

                emoji =
                    "🤣";

            }


            if (
                post.type ===
                "story"
            ) {

                emoji =
                    "😭😂";

            }


            article.innerHTML = `

                <div class="post-image">

                    ${
                        post.image_url

                        ? `
                            <img
                                src="${escapeHTML(
                                    post.image_url
                                )}"
                                alt="${escapeHTML(
                                    post.title ||
                                    "Gleza post"
                                )}"
                            >
                          `

                        : emoji
                    }

                </div>


                <div class="post-info">

                    <span class="post-type">
                        ${escapeHTML(
                            (
                                post.type ||
                                "POST"
                            ).toUpperCase()
                        )}
                    </span>


                    <h3>
                        ${escapeHTML(
                            post.title ||
                            ""
                        )}
                    </h3>


                    <p class="post-content">
                        ${escapeHTML(
                            post.content ||
                            ""
                        )}
                    </p>


                    <div class="post-actions">

                        <button
                            class="like-btn"
                            type="button"
                        >
                            ❤️
                            ${formatNumber(
                                post.likes ||
                                0
                            )}
                        </button>


                        <button
                            class="comment-btn"
                            type="button"
                        >
                            💬
                            ${formatNumber(
                                post.comments ||
                                0
                            )}
                        </button>


                        <button
                            class="share-btn"
                            type="button"
                        >
                            ↗️
                        </button>

                    </div>

                </div>

            `;


            searchResults.appendChild(
                article
            );

        }
    );


    /*
       Make like/comment/share work
       on search results too.
    */

    attachPostButtons();

}


/* =========================================================
   SEARCH BUTTON
========================================================= */

if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        function() {

            /*
               Search page will be search.html.
            */

            window.location.href =
                "search.html";

        }
    );

}


/* =========================================================
   SEE ALL
========================================================= */

if (seeAllBtn) {

    seeAllBtn.addEventListener(
        "click",
        function() {

            /*
               We intentionally don't prevent
               the HTML link.

               href="trending.html"
               handles navigation.
            */

            console.log(
                "Opening Trending page..."
            );

        }
    );

}


/* =========================================================
   TRENDING FILTERS
========================================================= */

trendingFilterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function() {

                trendingFilterButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                applyTrendingFilter(
                    this.dataset
                        .trendingFilter ||
                    "all"
                );

            }
        );

    }
);


/* =========================================================
   TRENDING FILTER
========================================================= */

function applyTrendingFilter(
    selectedFilter = "all"
) {

    if (!contentGrid) {
        return;
    }


    let posts =
        [...allPosts];


    if (
        selectedFilter ===
        "meme"
    ) {

        posts =
            posts.filter(
                post =>
                    post.type ===
                    "meme"
            );

    }


    if (
        selectedFilter ===
        "joke"
    ) {

        posts =
            posts.filter(
                post =>
                    post.type ===
                    "joke"
            );

    }


    if (
        selectedFilter ===
        "story"
    ) {

        posts =
            posts.filter(
                post =>
                    post.type ===
                    "story"
            );

    }


    posts.sort(
        (a, b) =>
            Number(
                b.views || 0
            ) -
            Number(
                a.views || 0
            )
    );


    displayPosts(
        posts
    );

}


/* =========================================================
   LIKED FILTERS
========================================================= */

likedFilterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function() {

                likedFilterButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                applyLikedFilter(
                    this.dataset
                        .likedFilter ||
                    "all"
                );

            }
        );

    }
);


/* =========================================================
   LIKED FILTER
========================================================= */

function applyLikedFilter(
    selectedFilter = "all"
) {

    if (!contentGrid) {
        return;
    }


    const cards =
        contentGrid.querySelectorAll(
            ".post-card"
        );


    if (
        cards.length === 0
    ) {

        return;

    }


    let visibleCount =
        0;


    cards.forEach(
        card => {

            const type =
                card.dataset
                    .likedType ||
                card.dataset.type ||
                "";


            const show =
                selectedFilter ===
                "all" ||
                type ===
                selectedFilter;


            card.style.display =
                show
                    ? ""
                    : "none";


            if (show) {

                visibleCount++;

            }

        }
    );


    const emptyState =
        document.getElementById(
            "likedEmptyState"
        );


    if (emptyState) {

        emptyState.style.display =
            visibleCount === 0
                ? ""
                : "none";

    }

}



/* =========================================================
   INITIAL CREATE FORM
========================================================= */

/* =========================================================
   CREATE BUTTON
========================================================= */

const createButton =
    document.querySelector(
        ".create-button"
    );


if (
    createButton &&
    !createButton.closest("a")
) {

    createButton.addEventListener(
        "click",
        function() {

            window.location.href =
                "upload.html";

        }
    );

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(number) {

    number =
        Number(number) || 0;


    if (
        number >=
        1000000
    ) {

        return (
            number /
            1000000
        )
        .toFixed(1)
        .replace(
            ".0",
            ""
        ) +
        "M";

    }


    if (
        number >=
        1000
    ) {

        return (
            number /
            1000
        )
        .toFixed(1)
        .replace(
            ".0",
            ""
        ) +
        "K";

    }


    return number.toString();

}


/* =========================================================
   PARSE NUMBER
========================================================= */

function parseNumber(text) {

    const value =
        String(text)
            .replace(
                "❤️",
                ""
            )
            .replace(
                "❤",
                ""
            )
            .trim()
            .toUpperCase();


    if (
        value.endsWith("K")
    ) {

        return Math.round(
            parseFloat(value) *
            1000
        );

    }


    if (
        value.endsWith("M")
    ) {

        return Math.round(
            parseFloat(value) *
            1000000
        );

    }


    return (
        parseInt(value) ||
        0
    );

}


/* =========================================================
   SECURITY
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        attachPostButtons();

        initializeSearch();

        loadPosts();


        console.log(
            "😂 Gleza is alive! Welcome to the fun."
        );

    }
);

/* =========================================================
   GLEZA HOME HUMOR MENU + SEARCH CONTROLS
========================================================= */


/* =========================================================
   HOME — MEMES / JOKES / STORIES PANELS
========================================================= */

function initializeHumorMenus() {

    const humorTypeButtons = document.querySelectorAll(
        ".humor-type-card[data-humor-type]"
    );

    const categoryPanels = document.querySelectorAll(
        ".humor-category-panel[data-category-panel]"
    );

    const closeButtons = document.querySelectorAll(
        "[data-close-panel]"
    );

    /*
        Open the correct category panel
        when Memes, Jokes or Stories is clicked.
    */

    humorTypeButtons.forEach(button => {

        button.addEventListener("click", () => {

            const type = button.dataset.humorType;

            // Hide every panel first
            categoryPanels.forEach(panel => {
                panel.hidden = true;
            });

            // Find the correct panel
            const targetPanel = document.querySelector(
                `.humor-category-panel[data-category-panel="${type}"]`
            );

            if (!targetPanel) return;

            // Show selected panel
            targetPanel.hidden = false;

            // Scroll smoothly to it
            targetPanel.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        });

    });


    /*
        Close category panels
    */

    closeButtons.forEach(button => {

        button.addEventListener("click", () => {

            const type = button.dataset.closePanel;

            const panel = document.querySelector(
                `.humor-category-panel[data-category-panel="${type}"]`
            );

            if (panel) {
                panel.hidden = true;
            }

        });

    });


    /*
        Category buttons inside the panels
    */

    const humorCategoryButtons = document.querySelectorAll(
        ".humor-category[data-humor]"
    );

    humorCategoryButtons.forEach(button => {

        button.addEventListener("click", () => {

            const category = button.dataset.humor;

            const panel = button.closest(
                ".humor-category-panel"
            );

            if (!panel) return;

            const type = panel.dataset.categoryPanel;

            /*
                Remove active state from other buttons
                in the same panel.
            */

            panel.querySelectorAll(
                ".humor-category[data-humor]"
            ).forEach(categoryButton => {

                categoryButton.classList.remove("active");

            });

            button.classList.add("active");


            /*
                Connect the selected category
                to the main content filter.
            */

            currentHomeFilter = type;
            currentHumorFilter = category;


            /*
                Update the content title.
            */

            const contentTitle = document.getElementById(
                "contentTitle"
            );

            if (contentTitle) {

                if (category === "all") {

                    contentTitle.textContent =
                        `Trending ${capitalizeFirstLetter(type)}s on Gleza`;

                } else {

                    contentTitle.textContent =
                        `${capitalizeFirstLetter(category)} ${capitalizeFirstLetter(type)}s`;

                }

            }


            /*
                Filter the posts currently available.
            */

            filterHomePosts();


            /*
                Scroll down to the content.
            */

            const contentSection = document.querySelector(
                ".content-section"
            );

            if (contentSection) {

                contentSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });

}


/* =========================================================
   HOME — FILTER POSTS
========================================================= */

function filterHomePosts() {

    const posts = document.querySelectorAll(
        ".content-grid:not(.search-results) .post-card"
    );

    if (!posts.length) return;

    posts.forEach(post => {

        const postType =
            (post.dataset.type || "").toLowerCase();

        const postHumor =
            (post.dataset.humor || "").toLowerCase();

        const typeMatch =
            currentHomeFilter === "all" ||
            currentHomeFilter === "trending" ||
            postType === currentHomeFilter;

        const humorMatch =
            currentHumorFilter === "all" ||
            postHumor.includes(currentHumorFilter);

        if (typeMatch && humorMatch) {

            post.style.display = "";

        } else {

            post.style.display = "none";

        }

    });

}


/* =========================================================
   HELPER — CAPITALIZE TEXT
========================================================= */

function capitalizeFirstLetter(text) {

    if (!text) return "";

    return text.charAt(0).toUpperCase() + text.slice(1);

}


/* =========================================================
   SEARCH PAGE — CLEAR BUTTON
========================================================= */

function initializeSearchControls() {

    const searchInput =
        document.getElementById("searchInput");

    const clearSearch =
        document.getElementById("clearSearch");

    const searchResultsHeader =
        document.getElementById("searchResultsHeader");

    const searchResultCount =
        document.getElementById("searchResultCount");

    if (!searchInput) return;


    /*
        Update the clear button visibility.
    */

    function updateClearButton() {

        if (!clearSearch) return;

        if (searchInput.value.trim()) {

            clearSearch.style.display = "flex";

        } else {

            clearSearch.style.display = "none";

        }

    }


    /*
        Clear search.
    */

    if (clearSearch) {

        clearSearch.addEventListener("click", () => {

            searchInput.value = "";

            searchInput.focus();

            updateClearButton();

            /*
                Trigger the existing search system.
            */

            searchInput.dispatchEvent(
                new Event("input", {
                    bubbles: true
                })
            );

        });

    }


    /*
        Update clear button while typing.
    */

    searchInput.addEventListener(
        "input",
        updateClearButton
    );


    /*
        Watch the search results and update
        the result count.
    */

    const resultsContainer =
        document.getElementById("searchResults");

    if (resultsContainer && searchResultsHeader) {

        const observer = new MutationObserver(() => {

            const resultCards =
                resultsContainer.querySelectorAll(".post-card");

            const count = resultCards.length;

            if (searchResultCount) {

                if (count === 1) {

                    searchResultCount.textContent =
                        "1 result";

                } else {

                    searchResultCount.textContent =
                        `${count} results`;

                }

            }

            /*
                Only show the results heading
                when the user has searched.
            */

            if (searchInput.value.trim()) {

                searchResultsHeader.style.display =
                    "flex";

            } else {

                searchResultsHeader.style.display =
                    "none";

            }

        });

        observer.observe(resultsContainer, {
            childList: true,
            subtree: true
        });

    }


    updateClearButton();

}


/* =========================================================
   SEARCH BUTTON — OPEN SEARCH PAGE
========================================================= */

function initializeHomeSearchButton() {

    const searchButton =
        document.querySelector(".search-btn");

    if (!searchButton) return;

    searchButton.addEventListener("click", () => {

        window.location.href = "search.html";

    });

}


/* =========================================================
   RUN NEW FEATURES
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeHumorMenus();

    initializeSearchControls();

    initializeHomeSearchButton();

});

/* =========================================================
   GLEZA PROFILE PAGES
   Edit Profile / Account Settings / Privacy / Help
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       PROFILE PAGE NAVIGATION
    ===================================================== */

    const editProfile = document.getElementById("editProfile");
    const accountSettings = document.getElementById("accountSettings");
    const privacySettings = document.getElementById("privacySettings");
    const helpSettings = document.getElementById("helpSettings");


    if (editProfile) {

        editProfile.onclick = () => {
            window.location.href = "edit-profile.html";
        };

    }


    if (accountSettings) {

        accountSettings.onclick = () => {
            window.location.href = "account-settings.html";
        };

    }


    if (privacySettings) {

        privacySettings.onclick = () => {
            window.location.href = "privacy.html";
        };

    }


    if (helpSettings) {

        helpSettings.onclick = () => {
            window.location.href = "help.html";
        };

    }


    /* =====================================================
       EDIT PROFILE
    ===================================================== */

    const editProfileForm =
        document.getElementById("editProfileForm");

    const profileName =
        document.getElementById("profileName");

    const profileUsername =
        document.getElementById("profileUsername");

    const profileBio =
        document.getElementById("profileBio");

    const bioCount =
        document.getElementById("bioCount");

    const changeAvatar =
        document.getElementById("changeAvatar");

    const avatarInput =
        document.getElementById("avatarInput");

    const editAvatar =
        document.querySelector(".edit-profile-avatar");


    /* BIO CHARACTER COUNT */

    function updateBioCount() {

        if (!profileBio || !bioCount) return;

        bioCount.textContent = profileBio.value.length;

    }


    if (profileBio) {

        updateBioCount();

        profileBio.addEventListener(
            "input",
            updateBioCount
        );

    }


    /* CHANGE PROFILE PHOTO */

    if (changeAvatar && avatarInput) {

        changeAvatar.addEventListener("click", () => {

            avatarInput.click();

        });

    }


    if (avatarInput) {

        avatarInput.addEventListener("change", () => {

            const file = avatarInput.files[0];

            if (!file || !editAvatar) return;

            const reader = new FileReader();

            reader.onload = (event) => {

                editAvatar.innerHTML = "";

                const image =
                    document.createElement("img");

                image.src = event.target.result;

                image.alt = "Profile photo";

                image.style.width = "100%";
                image.style.height = "100%";
                image.style.objectFit = "cover";
                image.style.borderRadius = "50%";

                editAvatar.appendChild(image);

            };

            reader.readAsDataURL(file);

        });

    }


    /* SAVE PROFILE */

    if (editProfileForm) {

        editProfileForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                const name =
                    profileName
                        ? profileName.value.trim()
                        : "";

                const username =
                    profileUsername
                        ? profileUsername.value.trim()
                        : "";

                const bio =
                    profileBio
                        ? profileBio.value.trim()
                        : "";


                /*
                    Save temporarily in the browser.

                    Later, when we add the database,
                    this will save to the user's real account.
                */

                localStorage.setItem(
                    "glezaProfileName",
                    name
                );

                localStorage.setItem(
                    "glezaProfileUsername",
                    username
                );

                localStorage.setItem(
                    "glezaProfileBio",
                    bio
                );


                alert("Profile updated successfully!");


                window.location.href =
                    "profile.html";

            }
        );

    }


    /* LOAD SAVED PROFILE */

    if (
        profileName ||
        profileUsername ||
        profileBio
    ) {

        const savedName =
            localStorage.getItem(
                "glezaProfileName"
            );

        const savedUsername =
            localStorage.getItem(
                "glezaProfileUsername"
            );

        const savedBio =
            localStorage.getItem(
                "glezaProfileBio"
            );


        if (profileName && savedName) {
            profileName.value = savedName;
        }

        if (profileUsername && savedUsername) {
            profileUsername.value = savedUsername;
        }

        if (profileBio && savedBio) {
            profileBio.value = savedBio;
            updateBioCount();
        }

    }


    /* =====================================================
       ACCOUNT SETTINGS
    ===================================================== */

    const likeNotifications =
        document.getElementById(
            "likeNotifications"
        );

    const commentNotifications =
        document.getElementById(
            "commentNotifications"
        );

    const changePassword =
        document.getElementById(
            "changePassword"
        );

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (likeNotifications) {

        likeNotifications.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "glezaLikeNotifications",
                    likeNotifications.checked
                );

            }
        );


        const savedLikeNotifications =
            localStorage.getItem(
                "glezaLikeNotifications"
            );


        if (savedLikeNotifications !== null) {

            likeNotifications.checked =
                savedLikeNotifications === "true";

        }

    }


    if (commentNotifications) {

        commentNotifications.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "glezaCommentNotifications",
                    commentNotifications.checked
                );

            }
        );


        const savedCommentNotifications =
            localStorage.getItem(
                "glezaCommentNotifications"
            );


        if (savedCommentNotifications !== null) {

            commentNotifications.checked =
                savedCommentNotifications === "true";

        }

    }


    if (changePassword) {

        changePassword.addEventListener(
            "click",
            () => {

                alert(
                    "Password changing will be connected when Gleza accounts are added."
                );

            }
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Are you sure you want to log out?"
                    );

                if (!confirmed) return;

                /*
                    There is no real login system yet,
                    so this simply clears the temporary
                    Gleza profile information.
                */

                localStorage.removeItem(
                    "glezaProfileName"
                );

                localStorage.removeItem(
                    "glezaProfileUsername"
                );

                localStorage.removeItem(
                    "glezaProfileBio"
                );


                alert("You have been logged out.");

                window.location.href =
                    "index.html";

            }
        );

    }


    /* =====================================================
       PRIVACY SETTINGS
    ===================================================== */

    const privacyControls = [

        "publicProfile",
        "allowMessages",
        "allowComments",
        "showLikedPosts"

    ];


    privacyControls.forEach(controlId => {

        const control =
            document.getElementById(controlId);

        if (!control) return;


        const storageKey =
            "glezaPrivacy_" + controlId;


        const savedValue =
            localStorage.getItem(storageKey);


        if (savedValue !== null) {

            control.checked =
                savedValue === "true";

        }


        control.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    storageKey,
                    control.checked
                );

            }
        );

    });


    /* =====================================================
       HELP — FAQ
    ===================================================== */

    const faqButtons =
        document.querySelectorAll(
            ".faq-item[data-faq]"
        );


    faqButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const faqName =
                    button.dataset.faq;

                const answer =
                    document.getElementById(
                        `faq-${faqName}`
                    );

                if (!answer) return;


                const isOpen =
                    answer.classList.contains(
                        "active"
                    );


                /*
                    Close every FAQ first.
                */

                document
                    .querySelectorAll(".faq-answer")
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });


                /*
                    Open selected FAQ.
                */

                if (!isOpen) {

                    answer.classList.add(
                        "active"
                    );

                }


                /*
                    Change + to −.
                */

                faqButtons.forEach(item => {

                    const symbol =
                        item.querySelector(
                            "span:last-child"
                        );

                    if (!symbol) return;

                    const itemFaq =
                        item.dataset.faq;

                    const itemAnswer =
                        document.getElementById(
                            `faq-${itemFaq}`
                        );

                    if (
                        itemAnswer &&
                        itemAnswer.classList.contains(
                            "active"
                        )
                    ) {

                        symbol.textContent = "−";

                    } else {

                        symbol.textContent = "+";

                    }

                });

            }
        );

    });


    /* =====================================================
       HELP — CONTACT SUPPORT
    ===================================================== */

    const contactSupport =
        document.getElementById(
            "contactSupport"
        );

    const reportProblem =
        document.getElementById(
            "reportProblem"
        );


    if (contactSupport) {

        contactSupport.addEventListener(
            "click",
            () => {

                alert(
                    "Gleza Support will be available soon."
                );

            }
        );

    }


    if (reportProblem) {

        reportProblem.addEventListener(
            "click",
            () => {

                alert(
                    "The problem reporting system will be available soon."
                );

            }
        );

    }

});

/* =========================================================
   FIX PROFILE BUTTONS
   Override old "coming soon" actions
========================================================= */

document.addEventListener("click", (event) => {

    const editProfile = event.target.closest("#editProfile");
    const accountSettings = event.target.closest("#accountSettings");
    const privacySettings = event.target.closest("#privacySettings");
    const helpSettings = event.target.closest("#helpSettings");


    if (editProfile) {

        event.preventDefault();
        event.stopImmediatePropagation();

        window.location.href = "edit-profile.html";

        return;
    }


    if (accountSettings) {

        event.preventDefault();
        event.stopImmediatePropagation();

        window.location.href = "account-settings.html";

        return;
    }


    if (privacySettings) {

        event.preventDefault();
        event.stopImmediatePropagation();

        window.location.href = "privacy.html";

        return;
    }


    if (helpSettings) {

        event.preventDefault();
        event.stopImmediatePropagation();

        window.location.href = "help.html";

        return;
    }

}, true);

/* =========================================================
   GLEZA SEARCH PATCH
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("searchInput");
    const clearSearch = document.getElementById("clearSearch");
    const searchResults = document.getElementById("searchResults");
    const searchIntro = document.getElementById("searchIntro");
    const searchResultsHeader = document.getElementById("searchResultsHeader");
    const searchResultCount = document.getElementById("searchResultCount");
    const searchEmpty = document.getElementById("searchEmpty");

    // Only run on search.html
    if (!searchInput || !searchResults) {
        return;
    }

    function runSearch() {

        const term = searchInput.value.trim().toLowerCase();

        // Nothing typed
        if (!term) {
            searchResults.innerHTML = "";

            if (searchIntro) {
                searchIntro.style.display = "block";
            }

            if (searchResultsHeader) {
                searchResultsHeader.style.display = "none";
            }

            if (searchEmpty) {
                searchEmpty.style.display = "none";
            }

            if (clearSearch) {
                clearSearch.style.display = "none";
            }

            return;
        }

        // Show clear button
        if (clearSearch) {
            clearSearch.style.display = "block";
        }

        // Hide intro
        if (searchIntro) {
            searchIntro.style.display = "none";
        }

        // Search through posts already loaded into allPosts
        const results = allPosts.filter(function (post) {

            const title = String(post.title || "").toLowerCase();
            const content = String(
                post.content || post.text || ""
            ).toLowerCase();

            const category = String(
                post.category || ""
            ).toLowerCase();

            const type = String(
                post.type || ""
            ).toLowerCase();

            const humor = String(
                post.humor || ""
            ).toLowerCase();

            return (
                title.includes(term) ||
                content.includes(term) ||
                category.includes(term) ||
                type.includes(term) ||
                humor.includes(term)
            );
        });

        // Show results header
        if (searchResultsHeader) {
            searchResultsHeader.style.display = "flex";
        }

        if (searchResultCount) {
            searchResultCount.textContent =
                `${results.length} ${
                    results.length === 1
                        ? "result"
                        : "results"
                }`;
        }

        // No results
        if (results.length === 0) {

            searchResults.innerHTML = "";

            if (searchEmpty) {
                searchEmpty.style.display = "block";
            }

            return;
        }

        // Results found
        if (searchEmpty) {
            searchEmpty.style.display = "none";
        }

        searchResults.innerHTML = results.map(function (post) {

            const id = post.id || post._id || "";
            const type = post.type || "meme";
            const title = post.title || "";
            const content = post.content || post.text || "";
            const category = post.category || post.humor || "";
            const image = post.image || post.imageUrl || "";
            const emoji = post.emoji || "😂";

            const likes = Number(post.likes) || 0;
            const comments = Number(post.comments) || 0;

            let visual = "";

            if (image) {
                visual = `
                    <div class="post-image">
                        <img
                            src="${image}"
                            alt="${title}"
                            loading="lazy"
                        >
                    </div>
                `;
            } else {
                visual = `
                    <div class="post-image meme-one">
                        ${emoji}
                    </div>
                `;
            }

            return `
                <article
                    class="post-card"
                    data-id="${id}"
                    data-type="${type}"
                    data-humor="${category}"
                >

                    ${visual}

                    <div class="post-info">

                        <span class="post-type">
                            ${String(type).toUpperCase()}
                        </span>

                        ${
                            title
                                ? `<h3>${title}</h3>`
                                : ""
                        }

                        ${
                            content
                                ? `<p>${content}</p>`
                                : ""
                        }

                        <div class="post-actions">

                            <button
                                type="button"
                                class="post-like"
                                data-action="like"
                            >
                                ❤️ ${likes}
                            </button>

                            <button
                                type="button"
                                class="post-comment"
                                data-action="comment"
                            >
                                💬 ${comments}
                            </button>

                            <button
                                type="button"
                                class="post-share"
                                data-action="share"
                            >
                                ↗️
                            </button>

                        </div>

                    </div>

                </article>
            `;

        }).join("");

        // Connect your existing like/comment/share system
        if (typeof attachPostButtons === "function") {
            attachPostButtons();
        }
    }


    // Search while typing
    searchInput.addEventListener("input", runSearch);


    // Clear search
    if (clearSearch) {

        clearSearch.addEventListener("click", function () {

            searchInput.value = "";

            runSearch();

            searchInput.focus();
        });

    }


    // Start with clear button hidden
    if (clearSearch) {
        clearSearch.style.display = "none";
    }

});

/* =========================================================
   GLEZA FINAL PROFILE OVERRIDE
   Handles Edit Profile + Profile Display
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       EDIT PROFILE — OVERRIDE SAVE
    ===================================================== */

    const editForm =
        document.getElementById("editProfileForm");

    if (editForm) {

        const nameInput =
            document.getElementById("profileName");

        const usernameInput =
            document.getElementById("profileUsername");

        const bioInput =
            document.getElementById("profileBio");

        const bioCount =
            document.getElementById("bioCount");


        /* LOAD SAVED VALUES */

        const savedName =
            localStorage.getItem("glezaProfileName");

        const savedUsername =
            localStorage.getItem("glezaProfileUsername");

        const savedBio =
            localStorage.getItem("glezaProfileBio");


        if (savedName && nameInput) {
            nameInput.value = savedName;
        }

        if (savedUsername && usernameInput) {
            usernameInput.value = savedUsername;
        }

        if (savedBio && bioInput) {
            bioInput.value = savedBio;
        }


        /* BIO COUNTER */

        function updateBioCounter() {

            if (bioInput && bioCount) {

                bioCount.textContent =
                    bioInput.value.length;

            }

        }


        updateBioCounter();


        if (bioInput) {

            bioInput.addEventListener(
                "input",
                updateBioCounter
            );

        }


        /* SAVE — CAPTURE PHASE OVERRIDE */

        editForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();
                event.stopImmediatePropagation();


                const name =
                    nameInput
                        ? nameInput.value.trim()
                        : "";


                const username =
                    usernameInput
                        ? usernameInput.value.trim()
                        : "";


                const bio =
                    bioInput
                        ? bioInput.value.trim()
                        : "";


                /* SAVE PROFILE */

                localStorage.setItem(
                    "glezaProfileName",
                    name
                );

                localStorage.setItem(
                    "glezaProfileUsername",
                    username
                );

                localStorage.setItem(
                    "glezaProfileBio",
                    bio
                );


                console.log(
                    "GLEZA PROFILE SAVED:",
                    {
                        name: name,
                        username: username,
                        bio: bio
                    }
                );


                /* GO TO PROFILE */

                window.location.href =
                    "profile.html";

            },
            true
        );

    }


    /* =====================================================
       PROFILE PAGE — SHOW SAVED INFORMATION
    ===================================================== */

    const profileName =
        document.querySelector(
            ".profile-info h1"
        );

    const profileUsername =
        document.querySelector(
            ".profile-info .username"
        );

    const profileBio =
        document.querySelector(
            ".profile-info .profile-bio"
        );


    /*
       Only run if this is actually the profile page.
    */

    if (
        profileName ||
        profileUsername ||
        profileBio
    ) {

        const savedName =
            localStorage.getItem(
                "glezaProfileName"
            );

        const savedUsername =
            localStorage.getItem(
                "glezaProfileUsername"
            );

        const savedBio =
            localStorage.getItem(
                "glezaProfileBio"
            );


        /* NAME */

        if (
            savedName &&
            profileName
        ) {

            profileName.textContent =
                savedName;

        }


        /* USERNAME */

        if (
            savedUsername &&
            profileUsername
        ) {

            const username =
                savedUsername.startsWith("@")
                    ? savedUsername
                    : "@" + savedUsername;


            profileUsername.textContent =
                username;

        }


        /* BIO */

        if (
            savedBio &&
            profileBio
        ) {

            profileBio.textContent =
                savedBio;

        }

    }

});


/* =========================================================
   GLEZA — SIMPLE SHARE OVERRIDE
========================================================= */

document.addEventListener("click", function (e) {

    const shareBtn = e.target.closest(".share-btn");

    if (!shareBtn) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const card = shareBtn.closest(".post-card");

    if (!card) return;

    const title =
        card.querySelector("h3")?.textContent.trim() ||
        "Check this out on Gleza 😂";

    /* Immediate button reaction */
    shareBtn.textContent = "📤 Sharing...";

    if (navigator.share) {

        navigator.share({
            title: "Gleza 😂",
            text: title,
            url: window.location.href
        })
        .then(() => {

            shareBtn.textContent = "✅ Shared!";

        })
        .catch(() => {

            shareBtn.textContent = "📤 Share";

        });

    } else {

        /* Don't copy anything */
        shareBtn.textContent = "📱 Share not supported";

        setTimeout(() => {
            shareBtn.textContent = "📤 Share";
        }, 1800);

    }

}, true);

/* =========================================================
   GLEZA — REAL SHARE OVERRIDE
   Does NOT depend on navigator.share()
========================================================= */

document.addEventListener("click", function (event) {

    const shareBtn = event.target.closest(".share-btn");

    if (!shareBtn) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const card = shareBtn.closest(".post-card");

    if (!card) return;

    const title =
        card.querySelector("h3")?.textContent.trim() ||
        "Check this out on Gleza 😂";

    const url = window.location.href;

    /* Remove old share box if one exists */
    const oldBox =
        document.getElementById("glezaSimpleShare");

    if (oldBox) {
        oldBox.remove();
    }

    /* Create share box */
    const box = document.createElement("div");

    box.id = "glezaSimpleShare";

    box.innerHTML = `

        <div class="gleza-simple-share-backdrop"></div>

        <div class="gleza-simple-share-card">

            <button
                class="gleza-simple-share-close"
                type="button"
            >
                ×
            </button>

            <h3>Share this post</h3>

            <p>
                Share the fun with your friends 😂
            </p>

            <div class="gleza-simple-share-buttons">

                <button
                    type="button"
                    data-share="whatsapp"
                >
                    🟢 WhatsApp
                </button>

                <button
                    type="button"
                    data-share="facebook"
                >
                    🔵 Facebook
                </button>

                <button
                    type="button"
                    data-share="x"
                >
                    𝕏 X
                </button>

                <button
                    type="button"
                    data-share="copy"
                >
                    🔗 Copy link
                </button>

            </div>

        </div>

    `;

    document.body.appendChild(box);


    /* CLOSE */

    const closeBox = () => {
        box.remove();
    };

    box.querySelector(
        ".gleza-simple-share-close"
    ).addEventListener(
        "click",
        closeBox
    );

    box.querySelector(
        ".gleza-simple-share-backdrop"
    ).addEventListener(
        "click",
        closeBox
    );


    /* SHARE OPTIONS */

    box.querySelectorAll(
        "[data-share]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            async function () {

                const type =
                    this.dataset.share;

                /* WHATSAPP */

                if (type === "whatsapp") {

                    const whatsappURL =
                        "https://wa.me/?text=" +
                        encodeURIComponent(
                            title +
                            "\n\n" +
                            url
                        );

                    window.open(
                        whatsappURL,
                        "_blank"
                    );

                    closeBox();

                    return;
                }


                /* FACEBOOK */

                if (type === "facebook") {

                    const facebookURL =
                        "https://www.facebook.com/sharer/sharer.php?u=" +
                        encodeURIComponent(url);

                    window.open(
                        facebookURL,
                        "_blank"
                    );

                    closeBox();

                    return;
                }


                /* X */

                if (type === "x") {

                    const xURL =
                        "https://twitter.com/intent/tweet?text=" +
                        encodeURIComponent(title) +
                        "&url=" +
                        encodeURIComponent(url);

                    window.open(
                        xURL,
                        "_blank"
                    );

                    closeBox();

                    return;
                }


                /* COPY */

                if (type === "copy") {

                    try {

                        await navigator.clipboard.writeText(
                            url
                        );

                        this.textContent =
                            "✅ Link copied!";

                        setTimeout(() => {
                            closeBox();
                        }, 700);

                    } catch (error) {

                        alert(
                            "Copy failed. Please try again."
                        );

                    }

                }

            }
        );

    });

}, true);

/* =========================================================
   GLEZA — FINAL SHARE SYSTEM
   No navigator.share()
   No "Share not supported"
========================================================= */

document.addEventListener("click", function (event) {

    /*
       Support both:
       .share-btn       = normal posts
       .post-share      = search results
    */

    const shareBtn =
        event.target.closest(
            ".share-btn, .post-share"
        );

    if (!shareBtn) return;


    event.preventDefault();
    event.stopImmediatePropagation();


    const card =
        shareBtn.closest(".post-card");

    if (!card) return;


    const title =
        card.querySelector("h3")
            ?.textContent
            .trim() ||
        "Check this out on Gleza 😂";


    /*
       For now this shares the current Gleza page.
       Later we can give every post its own URL.
    */

    const url =
        window.location.href;


    /*
       Remove an existing share popup.
    */

    const oldPopup =
        document.getElementById(
            "glezaSharePopup"
        );

    if (oldPopup) {
        oldPopup.remove();
    }


    /*
       Create popup.
    */

    const popup =
        document.createElement("div");

    popup.id =
        "glezaSharePopup";


    popup.innerHTML = `

        <div class="gleza-share-overlay"></div>

        <div class="gleza-share-box">

            <button
                class="gleza-share-close"
                type="button"
                aria-label="Close"
            >
                ×
            </button>


            <h2>
                Share 😂
            </h2>


            <p>
                Share this post with your friends
            </p>


            <div class="gleza-share-options">

                <button
                    type="button"
                    data-share-option="whatsapp"
                >
                    <span class="share-icon">
                        🟢
                    </span>

                    <span>
                        WhatsApp
                    </span>
                </button>


                <button
                    type="button"
                    data-share-option="facebook"
                >
                    <span class="share-icon">
                        🔵
                    </span>

                    <span>
                        Facebook
                    </span>
                </button>


                <button
                    type="button"
                    data-share-option="x"
                >
                    <span class="share-icon">
                        𝕏
                    </span>

                    <span>
                        X
                    </span>
                </button>


                <button
                    type="button"
                    data-share-option="copy"
                >
                    <span class="share-icon">
                        🔗
                    </span>

                    <span>
                        Copy Link
                    </span>
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        popup
    );


    /*
       Close popup.
    */

    const closePopup =
        () => {

            popup.remove();

        };


    popup.querySelector(
        ".gleza-share-close"
    ).addEventListener(
        "click",
        closePopup
    );


    popup.querySelector(
        ".gleza-share-overlay"
    ).addEventListener(
        "click",
        closePopup
    );


    /*
       Share options.
    */

    popup.querySelectorAll(
        "[data-share-option]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                async function () {

                    const option =
                        this.dataset
                            .shareOption;


                    /*
                       WHATSAPP
                    */

                    if (
                        option ===
                        "whatsapp"
                    ) {

                        const message =
                            title +
                            "\n\n" +
                            url;


                        window.location.href =
                            "https://wa.me/?text=" +
                            encodeURIComponent(
                                message
                            );


                        closePopup();

                        return;

                    }


                    /*
                       FACEBOOK
                    */

                    if (
                        option ===
                        "facebook"
                    ) {

                        const shareURL =
                            "https://www.facebook.com/sharer/sharer.php?u=" +
                            encodeURIComponent(
                                url
                            );


                        window.open(
                            shareURL,
                            "_blank"
                        );


                        closePopup();

                        return;

                    }


                    /*
                       X
                    */

                    if (
                        option ===
                        "x"
                    ) {

                        const shareURL =
                            "https://twitter.com/intent/tweet?text=" +
                            encodeURIComponent(
                                title
                            ) +
                            "&url=" +
                            encodeURIComponent(
                                url
                            );


                        window.open(
                            shareURL,
                            "_blank"
                        );


                        closePopup();

                        return;

                    }


                    /*
                       COPY LINK
                    */

                    if (
                        option ===
                        "copy"
                    ) {

                        try {

                            if (
                                navigator.clipboard
                            ) {

                                await navigator
                                    .clipboard
                                    .writeText(
                                        url
                                    );

                            } else {

                                const textarea =
                                    document.createElement(
                                        "textarea"
                                    );

                                textarea.value =
                                    url;

                                textarea.style.position =
                                    "fixed";

                                textarea.style.opacity =
                                    "0";

                                document.body.appendChild(
                                    textarea
                                );

                                textarea.select();

                                document.execCommand(
                                    "copy"
                                );

                                textarea.remove();

                            }


                            this.innerHTML =
                                `
                                    <span class="share-icon">
                                        ✅
                                    </span>

                                    <span>
                                        Copied!
                                    </span>
                                `;


                            setTimeout(
                                closePopup,
                                700
                            );


                        } catch (
                            error
                        ) {

                            alert(
                                "Could not copy the link."
                            );

                        }

                    }

                }
            );

        }
    );

}, true);

/* =====================================================
   GLEZA — DOUBLE TAP / DOUBLE CLICK TO LIKE
   Double-tap a post card → Like the post
===================================================== */

(function () {

    let lastTapTime = 0;
    let lastTapCard = null;

    /* =====================================================
       SHOW HEART ANIMATION
    ===================================================== */

    function showDoubleTapHeart(card) {

        const heart = document.createElement("div");

        heart.className =
            "gleza-double-tap-heart";

        heart.textContent = "❤️";

        card.appendChild(heart);

        setTimeout(function () {

            heart.remove();

        }, 700);

    }


    /* =====================================================
       LIKE POST
       Uses the EXISTING Like button system
    ===================================================== */

    function doubleTapLike(card) {

        if (!card) {
            return;
        }

        const postId =
            card.dataset.id;

        /* Ignore sample/demo posts */

        if (
            !postId ||
            postId.startsWith("sample-")
        ) {
            return;
        }


        const likeBtn =
            card.querySelector(
                ".like-btn"
            );

        if (!likeBtn) {
            return;
        }


        /*
           If already liked,
           double-tap does NOT unlike it.
        */

        if (
            likeBtn.classList.contains("liked")
        ) {
            showDoubleTapHeart(card);
            return;
        }


        /*
           Use the existing Like button.
           This means the same backend,
           optimistic update and login system
           are reused.
        */

        likeBtn.click();

        showDoubleTapHeart(card);

    }


    /* =====================================================
       DESKTOP — DOUBLE CLICK
    ===================================================== */

    document.addEventListener(
        "dblclick",
        function (event) {

            const card =
                event.target.closest(
                    ".post-card"
                );

            if (!card) {
                return;
            }


            /*
               Don't trigger double-click Like
               when double-clicking the Like button itself.
            */

            if (
                event.target.closest(
                    ".like-btn"
                )
            ) {
                return;
            }


            doubleTapLike(card);

        }
    );


    /* =====================================================
       MOBILE — DOUBLE TAP
    ===================================================== */

    document.addEventListener(
        "touchend",
        function (event) {

            const card =
                event.target.closest(
                    ".post-card"
                );

            if (!card) {
                return;
            }


            /*
               Don't count tapping the Like button
               as a card double-tap.
            */

            if (
                event.target.closest(
                    ".like-btn"
                )
            ) {
                lastTapTime = 0;
                lastTapCard = null;
                return;
            }


            const now =
                Date.now();

            const timeSinceLastTap =
                now - lastTapTime;


            /*
               Two taps on the SAME card
               within 350ms = double tap.
            */

            if (
                lastTapCard === card &&
                timeSinceLastTap > 0 &&
                timeSinceLastTap < 350
            ) {

                doubleTapLike(card);

                lastTapTime = 0;
                lastTapCard = null;

                return;

            }


            lastTapTime = now;
            lastTapCard = card;

        },
        {
            passive: true
        }
    );

})();

// =========================================================
// GLEZA SERVICE WORKER
// =========================================================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", async () => {

        try {

            const registration =
                await navigator.serviceWorker.register("/sw.js");

            console.log(
                "Gleza service worker registered:",
                registration.scope
            );

        } catch (error) {

            console.error(
                "Gleza service worker registration failed:",
                error
            );

        }

    });

}