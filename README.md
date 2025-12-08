# Redirect Service for Bunny Magic Containers (GitHub)

## Files Included
```
├── .github/
│   └── workflows/
│       └── build.yml    ← Auto-builds image on push
├── main.ts              ← Redirect service
├── Dockerfile           ← Container config
└── README.md
```

---

## STEP 1: Create GitHub Repository

1. Go to https://github.com/new
2. Name it `redirect-service`
3. Set to **Private** or **Public**
4. Click **Create repository**

---

## STEP 2: Upload These Files

Option A - Upload via browser:
1. Click **Add file** → **Upload files**
2. Drag all files including the `.github` folder
3. Click **Commit changes**

Option B - Git command line:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/redirect-service.git
git push -u origin main
```

---

## STEP 3: Wait for Build

1. Go to your repo → **Actions** tab
2. You'll see the workflow running
3. Wait for green checkmark (1-2 minutes)

The image will be at: `ghcr.io/YOUR_USERNAME/redirect-service:latest`

---

## STEP 4: Make Package Public (if repo is private)

1. Go to your GitHub profile
2. Click **Packages** tab
3. Click on `redirect-service`
4. Click **Package settings** (right side)
5. Scroll to **Danger Zone** → **Change visibility** → **Public**

(Or keep private and use PAT with read:packages scope)

---

## STEP 5: Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: `bunny-registry`
4. Select scopes:
   - ✅ `read:packages`
   - ✅ `read:org` (if using org)
5. Click **Generate token**
6. **COPY THE TOKEN NOW** (you won't see it again)

---

## STEP 6: Connect GitHub Registry in Bunny

1. Login to https://dash.bunny.net/
2. Go to **Magic Containers** → **Image Registries**
3. Click **Add Image Registry**
4. Registry: **Github**
5. Username: Your GitHub username
6. Personal Access Token: Paste token from Step 5
7. Click **Add Image Registry**

---

## STEP 7: Create the App

1. Go to **Magic Containers** → Click **Add App**
2. Choose **Magic deployment** or **Single region**
3. Name: `redirect-service`
4. Click **Next Step**

---

## STEP 8: Add Container

1. Click **Add Container**
2. Name: `redirect`
3. Registry: Select your GitHub registry
4. Image: `redirect-service`
5. Tag: `latest`

---

## STEP 9: Add Endpoint

1. Go to **Endpoints** tab
2. Click **Add New Endpoint**
3. Name: `main`
4. Exposure: **CDN**
5. Container Port: `8080`
6. Origin SSL: **No**
7. Click **Add Endpoint**

---

## STEP 10: Deploy

1. Click **Add Container**
2. Click **Next Step**
3. Click **Confirm and Create**

Wait for green status. Done!

---

## Updating

Just push to main branch:

```bash
git add .
git commit -m "Update"
git push
```

GitHub Actions rebuilds automatically. Then click **Redeploy** in Bunny dashboard.

---

## Your Image URL

```
ghcr.io/YOUR_USERNAME/redirect-service:latest
```

Replace `YOUR_USERNAME` with your GitHub username (lowercase).
