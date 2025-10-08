# 旅行割り勘精算アプリ

旅行などのグループでの支払いを簡単に精算できるWebアプリケーションです。

## 機能

- **メンバー管理**: グループメンバーを追加・削除
- **支払い記録**: 誰が何にいくら支払ったかを記録
- **精算計算**: 3つのモードで精算方法を表示
  - **最適化モード**: 取引回数を最小化した精算方法
  - **図解モード**: 収支状況と精算の流れを視覚化
  - **ガチガチ計算モード**: 各支払いごとの詳細な精算
- **データ保存**: PostgreSQLデータベースに保存してUUIDで共有可能

## 🚀 クイックスタート（Docker Compose）

**最も簡単な方法！** Docker Composeで一発起動：

```bash
# すべて起動（PostgreSQL + アプリ）
docker-compose up

# ブラウザで http://localhost:8000 にアクセス
```

詳細は [DOCKER.md](DOCKER.md) を参照してください。

## セットアップ（手動）

### 前提条件

1. Denoのインストール: https://docs.deno.com/runtime/getting_started/installation
2. PostgreSQL（データベース機能を使う場合）

### データベースのセットアップ（オプション）

データベース機能を使いたい場合：

1. PostgreSQLをインストールして起動

2. データベースを作成:
```bash
createdb warikan
```

3. 環境変数を設定:
```bash
cp .env.example .env
# .envファイルを編集して、データベース接続情報を設定
```

環境変数の例:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=warikan
```

詳細は [DATABASE_SETUP.md](DATABASE_SETUP.md) を参照してください。

### 開発サーバーの起動

```bash
deno task dev
```

ブラウザで http://localhost:8000 にアクセス

## 使い方

1. **メンバーを追加**: 旅行などのグループメンバーの名前を追加
2. **支払いを記録**: 誰が何にいくら払ったか、誰の分かを記録
3. **精算を確認**: 3つのモードから好きな方法で精算結果を確認
4. **保存して共有**: 「保存」ボタンでデータを保存し、「リンクをコピー」で他の人と共有

## 技術スタック

- **Framework**: Fresh (Deno)
- **UI**: Preact + Tailwind CSS
- **Database**: PostgreSQL
- **Language**: TypeScript

## License

MIT
