# データベースセットアップ手順

## PostgreSQLのインストールと起動

### macOS (Homebrew使用)
```bash
# PostgreSQLをインストール
brew install postgresql@16

# PostgreSQLを起動
brew services start postgresql@16
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## データベースの作成

```bash
# PostgreSQLに接続
psql postgres

# データベースを作成
CREATE DATABASE warikan;

# 確認
\l

# 終了
\q
```

## 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envを編集（必要に応じて）
# デフォルト設定で動作する場合はそのまま使用可能
```

## アプリケーションの起動

```bash
# 開発サーバーを起動
deno task dev
```

初回起動時に自動的にテーブルが作成されます。

## データベースなしで使用する場合

環境変数を設定しなければ、データベース機能なしで動作します。
この場合、データはブラウザのメモリにのみ保存され、ページをリロードすると消えます。

## トラブルシューティング

### PostgreSQLに接続できない場合

1. PostgreSQLが起動しているか確認:
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

2. 接続設定を確認:
```bash
# デフォルトのPostgreSQLユーザーでログイン
psql -U postgres -h localhost

# パスワードが必要な場合は.envで設定
```

3. データベースが存在するか確認:
```bash
psql -U postgres -h localhost -l
```
