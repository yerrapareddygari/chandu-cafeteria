# GitHub Secrets Setup

Add these secrets in your GitHub repo → Settings → Secrets and variables → Actions:

| Secret Name | Value | Where to get it |
|-------------|-------|-----------------|
| `DOCKERHUB_USER` | Your DockerHub username | [docker.com](https://hub.docker.com) |
| `DOCKERHUB_TOKEN` | DockerHub access token | DockerHub → Account Settings → Security → New Access Token |

## Render Setup

After GitHub Actions pushes images to DockerHub:

1. Go to [render.com](https://render.com) → New → Web Service
2. Choose **Deploy an existing image from a registry**
3. Image URL: `docker.io/YOUR_USERNAME/chandu-cafeteria-backend:latest`
4. Set env vars on Render:
   ```
   MONGO_URI = mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/chandu-cafeteria
   ```
5. Repeat for frontend:
   ```
   Image: docker.io/YOUR_USERNAME/chandu-cafeteria-frontend:latest
   ```

## MongoDB Atlas Setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Set network access to allow connections from anywhere (0.0.0.0/0)
3. Create a database user with readWrite access
4. Copy the connection string and paste as MONGO_URI