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
            const posts = await response.json();

            // 投稿を番号の降順にソート（新しい投稿が上に来るように）
            // APIからのデータ形式が不明なため、ここでは`number`プロパティがあることを仮定
            // もしAPIが配列を返すなら、そのまま利用
            const sortedPosts = Array.isArray(posts) ? posts.sort((a, b) => b.number - a.number) : [];

            postsTableBody.innerHTML = ''; // 既存の投稿をクリア

            if (sortedPosts.length === 0) {
                postsTableBody.innerHTML = '<tr><td colspan="5">まだ投稿がありません。</td></tr>';
                return;
            }

            sortedPosts.forEach(post => {
                const row = postsTableBody.insertRow();
                // 投稿オブジェクトのプロパティ名はAPIのJSON構造に合わせてください。
                // 例: post.number, post.name, post.id, post.content, post.datetime
                // 現状のAPIレスポンスの具体的なJSON形式が不明なため、推測に基づいています。
                // スクリーンショットを元に以下を仮定: number, name, id, content, datetime
                row.insertCell().textContent = post.number || 'N/A'; // 番号
                row.insertCell().textContent = post.name || '名無し'; // 名前
                row.insertCell().textContent = post.id || 'N/A'; // ID
                row.insertCell().textContent = post.content || ''; // 内容
                row.insertCell().textContent = post.datetime || '日時不明'; // 日時
            });
        } catch (error) {
            console.error("投稿の取得中にエラーが発生しました:", error);
            postsTableBody.innerHTML = '<tr><td colspan="5" style="color: red;">投稿の読み込みに失敗しました。</td></tr>';
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
            // APIがクエリパラメータでのPOSTを受け付けているとのことなので、その形式に従います。
            // 通常のREST APIでは、POSTリクエストのデータはリクエストボディにJSON形式などで含めます。
            // しかし、指示が「name=[名前]&pass=[パスワード]&content=[内容] にPOSTリクエスト」なので、そのようにします。
            const response = await fetch(postUrl, {
                method: 'POST',
                // headers: {
                //     'Content-Type': 'application/json' // APIがJSONボディを期待する場合は必要
                // },
                // body: JSON.stringify({ // APIがJSONボディを期待する場合
                //     name: name,
                //     pass: pass,
                //     content: content
                // })
            });

            if (!response.ok) {
                // CORSエラーの場合はここで捕捉できない可能性がある
                // ネットワークエラーやサーバーからの不正なレスポンスの場合
                const errorText = await response.text();
                throw new Error(`投稿に失敗しました: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json(); // APIからのレスポンスをJSONとしてパース
            console.log("投稿成功:", result);
            alert('投稿が完了しました！');

            // 投稿成功後、フォームをクリアして投稿リストを更新
            nameInput.value = '';
            passInput.value = '';
            contentInput.value = '';
            lastPostTime = currentTime; // 最後の投稿時刻を更新
            fetchAndDisplayPosts(); // 投稿リストを再読み込み
        } catch (error) {
            console.error("投稿中にエラーが発生しました:", error);
            alert(`投稿中にエラーが発生しました。\n${error.message}\nブラウザの開発者ツール（F12キー）のConsoleタブも確認してください。`);
        }
    });

    // ページロード時に投稿を取得して表示
    fetchAndDisplayPosts();

    // 5秒ごとに投稿を自動更新（任意）
    setInterval(fetchAndDisplayPosts, 5000);
});
