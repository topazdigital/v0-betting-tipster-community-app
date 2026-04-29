// Community feed store: posts + comments + likes.
// Uses MySQL when DATABASE_URL is set, otherwise falls back to in-memory
// global state (consistent with the rest of the codebase).

import { query } from './db';
import { dispatchNotification, dispatchToMany } from './notification-dispatcher';
import { listFollowersOfTipster } from './follows-store';

export interface FeedPost {
  id: string;
  userId: number;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  matchId?: string | null;
  matchTitle?: string | null;
  pick?: string | null;
  odds?: number | null;
  imageUrl?: string | null;
  likes: number;
  liked?: boolean;
  commentCount: number;
  createdAt: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  userId: number;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
}

interface Stores {
  posts: Map<string, FeedPost>;
  comments: Map<string, FeedComment[]>; // postId -> comments
  likes: Map<string, Set<number>>; // postId -> userIds
}

const g = globalThis as { __feedStore?: Stores };
g.__feedStore = g.__feedStore || {
  posts: new Map(),
  comments: new Map(),
  likes: new Map(),
};
const s = g.__feedStore;

const hasDb = () => !!process.env.DATABASE_URL;

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── POSTS ───────────────────────────────────────
export async function listPosts(opts: { limit?: number; viewerId?: number | null } = {}): Promise<FeedPost[]> {
  const { limit = 50, viewerId = null } = opts;
  if (hasDb()) {
    try {
      const r = await query<{
        id: string; user_id: number; author_name: string; author_avatar: string | null;
        content: string; match_id: string | null; match_title: string | null;
        pick: string | null; odds: number | null; image_url: string | null;
        likes: number; comment_count: number; created_at: string;
      }>(`SELECT id, user_id, author_name, author_avatar, content,
                 match_id, match_title, pick, odds, image_url,
                 likes, comment_count, created_at
          FROM feed_posts
          ORDER BY created_at DESC LIMIT ?`,
        [limit]);
      if (r.rows.length > 0) {
        const ids = r.rows.map(p => p.id);
        let likedSet = new Set<string>();
        if (viewerId && ids.length > 0) {
          const placeholders = ids.map(() => '?').join(',');
          const lr = await query<{ post_id: string }>(
            `SELECT post_id FROM feed_post_likes WHERE user_id = ? AND post_id IN (${placeholders})`,
            [viewerId, ...ids],
          );
          likedSet = new Set(lr.rows.map(x => x.post_id));
        }
        return r.rows.map(x => ({
          id: x.id,
          userId: x.user_id,
          authorName: x.author_name,
          authorAvatar: x.author_avatar,
          content: x.content,
          matchId: x.match_id,
          matchTitle: x.match_title,
          pick: x.pick,
          odds: x.odds,
          imageUrl: x.image_url,
          likes: x.likes || 0,
          commentCount: x.comment_count || 0,
          liked: likedSet.has(x.id),
          createdAt: typeof x.created_at === 'string' ? x.created_at : new Date(x.created_at).toISOString(),
        }));
      }
    } catch (e) {
      console.warn('[feed] db read failed, falling back to memory', e);
    }
  }
  const arr = Array.from(s.posts.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  return arr.map(p => ({
    ...p,
    liked: viewerId ? !!s.likes.get(p.id)?.has(viewerId) : false,
  }));
}

export async function createPost(input: Omit<FeedPost, 'id' | 'likes' | 'commentCount' | 'createdAt'>): Promise<FeedPost> {
  const post: FeedPost = {
    id: makeId('post'),
    likes: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
    ...input,
  };
  if (hasDb()) {
    try {
      await query(
        `INSERT INTO feed_posts
          (id, user_id, author_name, author_avatar, content, match_id, match_title,
           pick, odds, image_url, likes, comment_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW())`,
        [post.id, post.userId, post.authorName, post.authorAvatar || null, post.content,
         post.matchId || null, post.matchTitle || null, post.pick || null, post.odds || null,
         post.imageUrl || null],
      );
    } catch (e) {
      console.warn('[feed] db insert failed', e);
    }
  }
  s.posts.set(post.id, post);
  s.comments.set(post.id, []);
  s.likes.set(post.id, new Set());
  // Fan-out: notify everyone who follows this author (best-effort).
  try {
    const followers = await listFollowersOfTipster(post.userId);
    if (followers.length > 0) {
      void dispatchToMany(followers, {
        type: 'tipster_post',
        title: `${post.authorName} posted`,
        content: post.content.length > 140 ? `${post.content.slice(0, 140)}…` : post.content,
        link: `/feed#${post.id}`,
      });
    }
  } catch (e) { console.warn('[feed] post fan-out failed', e); }
  return post;
}

// ─── LIKES ───────────────────────────────────────
export async function toggleLike(postId: string, userId: number, likerName?: string): Promise<{ liked: boolean; likes: number }> {
  let liked = false;
  let likes = 0;
  if (hasDb()) {
    try {
      const existing = await query<{ id: number }>(
        `SELECT id FROM feed_post_likes WHERE post_id = ? AND user_id = ? LIMIT 1`,
        [postId, userId],
      );
      if (existing.rows.length > 0) {
        await query(`DELETE FROM feed_post_likes WHERE post_id = ? AND user_id = ?`, [postId, userId]);
        await query(`UPDATE feed_posts SET likes = GREATEST(likes - 1, 0) WHERE id = ?`, [postId]);
        liked = false;
      } else {
        await query(`INSERT INTO feed_post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW()) ON CONFLICT DO NOTHING`, [postId, userId]);
        await query(`UPDATE feed_posts SET likes = likes + 1 WHERE id = ?`, [postId]);
        liked = true;
      }
      const r = await query<{ likes: number }>(`SELECT likes FROM feed_posts WHERE id = ? LIMIT 1`, [postId]);
      likes = r.rows[0]?.likes ?? 0;
    } catch (e) {
      console.warn('[feed] db toggleLike failed', e);
    }
  }
  // Memory fallback / mirror
  let set = s.likes.get(postId);
  if (!set) { set = new Set(); s.likes.set(postId, set); }
  if (set.has(userId)) {
    set.delete(userId);
    liked = false;
  } else {
    set.add(userId);
    liked = true;
  }
  const post = s.posts.get(postId);
  if (post) {
    post.likes = set.size;
    likes = post.likes;
  }
  // Notify post author when someone likes (and it's not their own).
  if (liked && post && post.userId !== userId) {
    void dispatchNotification({
      userId: post.userId,
      type: 'post_like',
      title: `${likerName || 'Someone'} liked your post`,
      content: post.content.length > 100 ? `${post.content.slice(0, 100)}…` : post.content,
      link: `/feed#${post.id}`,
    }).catch(e => console.warn('[feed] like notify failed', e));
  }
  return { liked, likes };
}

// ─── COMMENTS ────────────────────────────────────
export async function listComments(postId: string, limit = 100): Promise<FeedComment[]> {
  if (hasDb()) {
    try {
      const r = await query<{
        id: string; post_id: string; user_id: number; author_name: string;
        author_avatar: string | null; content: string; created_at: string;
      }>(`SELECT id, post_id, user_id, author_name, author_avatar, content, created_at
          FROM feed_comments WHERE post_id = ? ORDER BY created_at ASC LIMIT ?`,
        [postId, limit]);
      if (r.rows.length > 0) {
        return r.rows.map(x => ({
          id: x.id,
          postId: x.post_id,
          userId: x.user_id,
          authorName: x.author_name,
          authorAvatar: x.author_avatar,
          content: x.content,
          createdAt: typeof x.created_at === 'string' ? x.created_at : new Date(x.created_at).toISOString(),
        }));
      }
    } catch (e) {
      console.warn('[feed] db comments failed', e);
    }
  }
  return (s.comments.get(postId) || []).slice(0, limit);
}

export async function createComment(input: Omit<FeedComment, 'id' | 'createdAt'>): Promise<FeedComment> {
  const c: FeedComment = {
    id: makeId('cmt'),
    createdAt: new Date().toISOString(),
    ...input,
  };
  if (hasDb()) {
    try {
      await query(
        `INSERT INTO feed_comments (id, post_id, user_id, author_name, author_avatar, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [c.id, c.postId, c.userId, c.authorName, c.authorAvatar || null, c.content],
      );
      await query(`UPDATE feed_posts SET comment_count = comment_count + 1 WHERE id = ?`, [c.postId]);
    } catch (e) {
      console.warn('[feed] db insert comment failed', e);
    }
  }
  const arr = s.comments.get(c.postId) || [];
  arr.push(c);
  s.comments.set(c.postId, arr);
  const post = s.posts.get(c.postId);
  if (post) post.commentCount = arr.length;
  // Notify post author (if it's not their own comment).
  if (post && post.userId !== c.userId) {
    void dispatchNotification({
      userId: post.userId,
      type: 'post_comment',
      title: `${c.authorName} commented on your post`,
      content: c.content.length > 140 ? `${c.content.slice(0, 140)}…` : c.content,
      link: `/feed#${post.id}`,
    }).catch(e => console.warn('[feed] comment notify failed', e));
  }
  // Notify previous commenters (thread participants), excluding the new commenter & post author (already notified).
  const earlier = arr.slice(0, -1);
  const participants = new Set<number>();
  for (const x of earlier) {
    if (x.userId !== c.userId && (!post || x.userId !== post.userId)) participants.add(x.userId);
  }
  if (participants.size > 0) {
    void dispatchToMany(Array.from(participants), {
      type: 'comment_reply',
      title: `${c.authorName} replied in a thread you're in`,
      content: c.content.length > 140 ? `${c.content.slice(0, 140)}…` : c.content,
      link: `/feed#${c.postId}`,
    });
  }
  return c;
}

// ─── SEEDING (memory only, when DB is empty) ─────
export function seedDemoPostsIfEmpty(): void {
  if (s.posts.size > 0) return;
  const now = Date.now();
  const seeds: Array<Omit<FeedPost, 'id' | 'likes' | 'commentCount' | 'createdAt'>> = [
    {
      userId: 1001,
      authorName: 'Kev_BetMaster',
      authorAvatar: null,
      content: '🔥 Loading up on Arsenal -1 vs Brighton today. Their press has been ruthless, expect 2+ goals. Anyone else in?',
      pick: 'Arsenal -1.0',
      odds: 1.95,
      matchId: null,
      matchTitle: 'Arsenal vs Brighton',
      imageUrl: null,
    },
    {
      userId: 1002,
      authorName: 'NairobiTipsKE',
      authorAvatar: null,
      content: 'Gor Mahia at home is a different beast. KPL is criminally underrated by the bookies. Daily analysis here 🇰🇪',
      pick: 'Gor Mahia DNB',
      odds: 1.65,
      matchId: null,
      matchTitle: null,
      imageUrl: null,
    },
    {
      userId: 1003,
      authorName: 'StatsByMo',
      authorAvatar: null,
      content: 'Over 2.5 in Bayern matches has hit 9/10 of the last 10. Easy money on the Klassiker tonight 📈',
      pick: 'Over 2.5',
      odds: 1.75,
      matchId: null,
      matchTitle: 'Bayern vs Dortmund',
      imageUrl: null,
    },
    {
      userId: 1004,
      authorName: 'AccaQueen',
      authorAvatar: null,
      content: '4-fold weekend acca: Man City, Real Madrid, Inter, PSG — all home wins. ~7.50 odds. Who wants in?',
      pick: '4-fold ACCA',
      odds: 7.50,
      matchId: null,
      matchTitle: null,
      imageUrl: null,
    },
  ];
  for (const seed of seeds) {
    const id = makeId('post');
    s.posts.set(id, {
      id,
      ...seed,
      likes: Math.floor(Math.random() * 40) + 5,
      commentCount: 0,
      createdAt: new Date(now - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
    });
    s.comments.set(id, []);
    s.likes.set(id, new Set());
  }
}
