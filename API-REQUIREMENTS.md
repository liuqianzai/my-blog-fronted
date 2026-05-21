# 前端需要的后端接口清单

> 基础路径: `http://localhost:8080/api`
> 认证方式: `Authorization: Bearer {token}`
> 统一响应: `{ "code": 200, "message": "success", "data": ... }`

---

## 1. 认证模块

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/auth/login` | POST | 登录 | Login.vue |
| `/auth/logout` | POST | 登出 | NavBar.vue（待实现） |
| `/auth/password` | POST | 修改密码 | 后台（待实现） |

**登录请求体：**
```json
{ "username": "admin", "password": "123456" }
```

**登录响应：**
```json
{ "token": "xxx", "username": "admin", "nickname": "管理员" }
```

---

## 2. 文章模块

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/articles` | GET | 前台文章列表 | Home.vue |
| `/articles/{id}` | GET | 前台文章详情 | ArticleDetail.vue |
| `/admin/articles` | GET | 后台文章列表 | AdminArticles.vue |
| `/admin/articles/{id}` | GET | 后台文章详情 | AdminArticleForm.vue |
| `/admin/articles` | POST | 创建文章 | AdminArticleForm.vue |
| `/admin/articles/{id}` | PUT | 更新文章 | AdminArticleForm.vue |
| `/admin/articles/{id}` | DELETE | 删除文章 | AdminArticles.vue |

**文章列表参数：**
- `page` (可选，默认1)
- `size` (可选，默认10)
- `keyword` (可选，标题/摘要搜索)
- `categoryId` (可选，分类筛选)
- `tagId` (可选，标签筛选)
- `status` (可选，仅后台：true=已发布，false=草稿)

**文章详情响应：**
```json
{
  "id": 1,
  "title": "文章标题",
  "summary": "摘要",
  "content": "Markdown正文",
  "cover": "封面URL",
  "categoryId": 1,
  "viewCount": 42,
  "isTop": true,
  "status": true,
  "createTime": "2024-01-01T00:00:00",
  "updateTime": "2024-01-01T00:00:00",
  "category": { "id": 1, "name": "技术", "slug": "tech", "description": "描述", "sort": 0 },
  "tags": [{ "id": 1, "name": "Vue3", "color": "#2563EB" }]
}
```

---

## 3. 分类模块

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/categories` | GET | 分类列表 | Home.vue, Categories.vue, AdminCategories.vue |
| `/categories/{id}` | GET | 分类详情 | - |
| `/categories` | POST | 创建分类 | AdminCategories.vue |
| `/categories/{id}` | PUT | 更新分类 | AdminCategories.vue |
| `/categories/{id}` | DELETE | 删除分类 | AdminCategories.vue |

**分类响应：**
```json
[{ "id": 1, "name": "技术", "slug": "tech", "description": "描述", "sort": 0, "createTime": "...", "updateTime": "..." }]
```

---

## 4. 标签模块

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/tags` | GET | 标签列表 | Home.vue, AdminTags.vue |
| `/tags/{id}` | GET | 标签详情 | - |
| `/tags` | POST | 创建标签 | AdminTags.vue |
| `/tags/{id}` | PUT | 更新标签 | AdminTags.vue |
| `/tags/{id}` | DELETE | 删除标签 | AdminTags.vue |

**标签响应：**
```json
[{ "id": 1, "name": "Vue3", "color": "#2563EB" }]
```

---

## 5. 评论模块

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/comments` | GET | 前台评论列表（仅已审核） | ArticleDetail.vue |
| `/comments` | POST | 提交评论 | ArticleDetail.vue |
| `/admin/comments` | GET | 后台评论列表 | AdminComments.vue |
| `/admin/comments/{id}/review` | PATCH | 审核评论 | AdminComments.vue |
| `/admin/comments/{id}` | DELETE | 删除评论 | AdminComments.vue |

**评论列表参数：**
- `articleId` (可选)
- `page` (可选)
- `size` (可选)
- `approved` (可选，仅后台)

**提交评论请求体：**
```json
{ "articleId": 1, "nickname": "访客", "email": "xxx@example.com", "content": "评论内容" }
```

**审核评论请求体：**
```json
{ "approved": true }
```

---

## 6. 文件上传

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/files/images` | POST | 上传图片 | CoverUpload.vue, MarkdownEditor.vue |

**请求：** `Content-Type: multipart/form-data`，字段名 `file`

**响应：**
```json
{ "url": "/api/files/2024-01-01/xxx.jpg", "filename": "xxx.jpg" }
```

**限制：** 支持 jpg/jpeg/png/gif/webp，最大 10MB

---

## 7. 友链模块

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/friend-links` | GET | 前台友链列表（仅status=true） | PageView.vue |
| `/admin/friend-links` | GET | 后台友链列表 | AdminFriendLinks.vue |
| `/admin/friend-links/{id}` | GET | 后台友链详情 | - |
| `/admin/friend-links` | POST | 创建友链 | AdminFriendLinks.vue |
| `/admin/friend-links/{id}` | PUT | 更新友链 | AdminFriendLinks.vue |
| `/admin/friend-links/{id}` | DELETE | 删除友链 | AdminFriendLinks.vue |

---

## 8. 独立页面

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/pages/{slug}` | GET | 按slug获取页面 | PageView.vue |
| `/admin/pages` | GET | 后台页面列表 | AdminPages.vue |
| `/admin/pages/{id}` | GET | 后台页面详情 | - |
| `/admin/pages` | POST | 创建页面 | AdminPages.vue |
| `/admin/pages/{id}` | PUT | 更新页面 | AdminPages.vue |
| `/admin/pages/{id}` | DELETE | 删除页面 | AdminPages.vue |

**页面响应：**
```json
{ "id": 1, "title": "关于我", "slug": "about", "content": "Markdown内容", "status": true, "createTime": "...", "updateTime": "..." }
```

**前端需要的页面slug：**
- `about` - 关于页面（导航栏"关于"链接）
- `friends` - 友链页面（导航栏"友链"链接）

---

## 9. 配置模块

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/configs` | GET | 配置列表 | AdminConfigs.vue |
| `/configs/{key}` | GET | 配置详情 | - |
| `/configs` | POST | 保存配置 | AdminConfigs.vue |
| `/configs/{key}` | DELETE | 删除配置 | AdminConfigs.vue |

---

## 10. 归档模块

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/archives` | GET | 文章归档 | Archives.vue, Home.vue |

**响应：**
```json
[{ "month": "2024-01", "count": 5 }, { "month": "2023-12", "count": 3 }]
```

---

## 11. 仪表盘

| 接口 | 方法 | 说明 | 前端调用位置 |
|------|------|------|-------------|
| `/admin/dashboard/stats` | GET | 统计概览 | AdminDashboard.vue |

**响应：**
```json
{
  "totalArticles": 100,
  "publishedArticles": 80,
  "hiddenArticles": 20,
  "totalTags": 10,
  "totalCategories": 5,
  "totalComments": 200,
  "pendingComments": 15,
  "totalViews": 5000
}
```

---

## 后端需要初始化的数据

### 1. 独立页面
需要创建以下页面（通过 `/admin/pages` 接口）：

| slug | title | 说明 |
|------|-------|------|
| `about` | 关于我 | 导航栏"关于"链接的目标页面 |
| `friends` | 友情链接 | 导航栏"友链"链接的目标页面 |

### 2. 管理员账号
- 用户名: `admin`
- 密码: `123456`

---

## 前端路由结构

```
/                    → 首页（文章列表）
/article/:id         → 文章详情
/categories          → 分类列表
/archives            → 归档列表
/page/:slug          → 独立页面（关于、友链等）
/login               → 登录
/admin               → 后台管理
  /dashboard         → 统计概览
  /articles          → 文章管理
  /articles/create   → 新建文章
  /articles/:id/edit → 编辑文章
  /categories        → 分类管理
  /tags              → 标签管理
  /comments          → 评论审核
  /pages             → 页面管理
  /friend-links      → 友链管理
  /configs           → 配置管理
```
