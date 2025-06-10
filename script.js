document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'https://yuyuyu-made-bbs.onrender.com/api';
    const postsTableBody = document.getElementById('postsTableBody');
    const nameInput = document.getElementById('name');
    const passInput = document.getElementById('pass');
    const contentInput = document.getElementById('content');
    const submitPostButton = document.getElementById('submitPost');

    let lastPostTime = 0; // 最後に投稿した時刻 (UNIXタイムスタンプ)

    // 投稿データをAPIから取得して表示する関数
    async function fetchAndDisplayPosts() {
        try {
            const response = await fetch(apiBaseUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json(); // トップレベルのオブジェクトを取得

            // 'posts' 配列が存在するか確認
            const posts = Array.isArray(data.posts) ? data.posts : [];

            // 投稿を日時 (time) の新しい順にソート
            // timeプロパティは"YYYY/MM/DD HH:MM:SS"形式なので、Dateオブジェクトに変換して比較
            const sortedPosts = [...posts].sort((a, b) => {
                const dateA = new Date(a.time);
                const dateB = new Date(b.time);
                return dateB.getTime() - dateA.getTime(); // 降順 (新しいものが先)
            });

            postsTableBody.innerHTML = ''; // 既存の投稿をクリア

            if (sortedPosts.length === 0) {
                postsTableBody.innerHTML = '<tr><td colspan="5">まだ投稿がありません。</td></tr>';
                return;
            }

            sortedPosts.forEach(post => {
                const row = postsTableBody.insertRow();
                // 'no' プロパティがない場合も考慮 (新しい投稿にはない可能性)
                row.insertCell().textContent = post.no !== undefined ? post.no : '';
                row.insertCell().textContent = post.name || '名無し';

                // IDに@が含まれていなければ追加
                const displayId = post.id ? (post.id.startsWith('@') ? post.id : `@${post.id}`) : 'N/A';
                row.insertCell().textContent = displayId;

                row.insertCell().textContent = post.content || '';
                row.insertCell().textContent = post.time || '日時不明';
            });
        } catch (error) {
            console.error("投稿の取得中にエラーが発生しました:", error);
            postsTableBody.innerHTML = '<tr><td colspan="5" style="color: red;">投稿の読み込みに失敗しました。ネットワーク接続を確認するか、APIが利用可能か確認してください。</td></tr>';
        }
    }

    // 新しい投稿をAPIに送信する関数
    submitPostButton.addEventListener('click', async () => {
        const currentTime = Date.now();
        const oneSecond = 1000;

        if (currentTime - lastPostTime < oneSecond) {
            alert('連続投稿は1秒に1回までです。少し待ってください。');
            return;
        }

        const name = nameInput.value.trim();
        const pass = passInput.value.trim();
        const content = contentInput.value.trim();

        if (!name || !pass || !content) {
            alert('名前、パスワード、内容をすべて入力してください。');
            return;
        }

        const queryParams = new URLSearchParams({
            name: name,
            pass: pass,
            content: content
        }).toString();

        const postUrl = `${apiBaseUrl}?${queryParams}`;

        try {
            // POSTリクエストを送信
            // APIの指示に従い、POSTデータをクエリパラメータとして送信します。
            const response = await fetch(postUrl, {
                method: 'POST',
                // body: には何も入れない（データはURLに含めているため）
                // headers: {} (特にContent-Typeを設定する必要はないが、APIがJSONボディを期待する場合は設定)
            });

            if (!response.ok) {
                // HTTPステータスが200番台以外の場合
                // CORSエラーの場合は、このブロックに入る前にネットワークエラーとして処理されることが多い
                const errorText = await response.text();
                // サーバーからの具体的なエラーメッセージがあれば表示
                let errorMessage = `投稿に失敗しました: HTTPステータス ${response.status} ${response.statusText}`;
                if (errorText) {
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
                    } catch (e) {
                        errorMessage += ` - ${errorText}`;
                    }
                }
                throw new Error(errorMessage);
            }

            // APIが成功時に何を返すか不明ですが、一旦JSONとしてパースを試みます
            const result = await response.json().catch(() => ({ message: "投稿成功 (レスポンスボディなし)" })); // JSONでない場合も考慮
            console.log("投稿成功:", result);
            alert('投稿が完了しました！');

            // 投稿成功後、フォームをクリアして投稿リストを更新
            nameInput.value = '';
            passInput.value = '';
            contentInput.value = '';
            lastPostTime = currentTime; // 最後の投稿時刻を更新
            await fetchAndDisplayPosts(); // 投稿リストを再読み込み (awaitで完了を待つ)
        } catch (error) {
            console.error("投稿中にエラーが発生しました:", error);
            // CORSエラーはここで "Failed to fetch" や "Network request failed" などと表示されることが多い
            alert(`投稿中にエラーが発生しました。\n${error.message}\nブラウザの開発者ツール（F12キー）のConsoleタブで詳細を確認してください。\nCORS (クロスオリジン) の問題の可能性があります。`);
        }
    });

    // ページロード時に投稿を取得して表示
    fetchAndDisplayPosts();

    // 5秒ごとに投稿を自動更新
    setInterval(fetchAndDisplayPosts, 5000);
});
