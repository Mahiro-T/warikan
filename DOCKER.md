# 🐳 Docker Compose で起動する方法

最も簡単な方法でPostgreSQLとアプリを一緒に起動できます！

## 前提条件

- Docker Desktop または Docker Engine + Docker Compose がインストールされていること
  - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

## 🚀 起動方法

### 1. すべてを起動（PostgreSQL + アプリ）

```bash
docker-compose up
```

初回は少し時間がかかります（イメージのダウンロード＆ビルド）。

### 2. バックグラウンドで起動

```bash
docker-compose up -d
```

### 3. ブラウザでアクセス

http://localhost:8000

## 🛑 停止方法

### フォアグラウンドで起動した場合
```bash
Ctrl + C
```

### バックグラウンドで起動した場合
```bash
docker-compose down
```

### データも含めて完全に削除
```bash
docker-compose down -v
```

## 📊 データの永続化

データベースのデータは `postgres_data` という名前のDockerボリュームに保存されるため、
コンテナを停止しても消えません。

## 🔧 PostgreSQLだけ起動したい場合

ローカルでDenoを使いたい場合は、PostgreSQLだけ起動できます：

```bash
docker-compose up postgres
```

別のターミナルで：
```bash
deno task dev
```

## 📝 ログを見る

### すべてのログ
```bash
docker-compose logs -f
```

### アプリのログだけ
```bash
docker-compose logs -f app
```

### PostgreSQLのログだけ
```bash
docker-compose logs -f postgres
```

## 🐛 トラブルシューティング

### ポートが既に使用されている場合

```bash
# 既存のPostgreSQLを停止
brew services stop postgresql  # macOS
sudo systemctl stop postgresql  # Linux

# または docker-compose.yml のポートを変更
# ports:
#   - "5433:5432"  # ホスト側のポートを5433に変更
```

### コンテナを再ビルドしたい場合

```bash
docker-compose build --no-cache
docker-compose up
```

### データベースをリセットしたい場合

```bash
docker-compose down -v
docker-compose up
```

## 🎯 おすすめの使い方

### 開発時
```bash
# PostgreSQLだけDockerで起動
docker-compose up -d postgres

# アプリはローカルで起動（ホットリロードが速い）
deno task dev
```

### デモ・本番想定
```bash
# すべてDockerで起動
docker-compose up -d
```
