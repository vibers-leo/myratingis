// src/app/api/comments/route.ts
// 댓글 CRUD API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Helper for Strict Auth
async function validateUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token.startsWith('vf_')) {
             const { data: keyRecord } = await supabaseAdmin
                .from('api_keys')
                .select('user_id')
                .eq('api_key', token)
                .eq('is_active', true)
                .single();
             if (keyRecord) {
                 const { data: userData } = await supabaseAdmin.auth.admin.getUserById(keyRecord.user_id);
                 return { id: keyRecord.user_id, user: userData.user };
             }
        }
    }
    
    // Fallback to Session
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { id: user.id, user };

    return null;
}

// 댓글 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId가 필요합니다.' }, { status: 400 });
    }

    // [Auth] Optional for GET (to view secret comments)
    const authenticatedUser = await validateUser(request);
    const currentUserId = authenticatedUser?.id || null;

    // Get project owner ID
    const { data: projectInfo } = await (supabaseAdmin as any)
        .from('Project')
        .select('user_id')
        .eq('project_id', projectId)
        .single();
    
    const projectOwnerId = projectInfo?.user_id;

    const { data, error } = await supabaseAdmin
      .from('Comment')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '댓글 조회 실패' }, { status: 500 });
    }

    // Privacy Filter
    const filteredData = (data || []).map((comment: any) => {
      if (comment.is_secret) {
          const isAuthor = currentUserId && String(comment.user_id) === String(currentUserId);
          const isProjectOwner = currentUserId && String(projectOwnerId) === String(currentUserId);
          
          if (!isAuthor && !isProjectOwner) {
              return { ...comment, content: '🔒 비밀 댓글입니다.' };
          }
      }
      return comment;
    });

    // Enhance user info
    if (filteredData.length > 0) {
      const userIds = Array.from(new Set(filteredData.map((c: any) => c.user_id).filter(Boolean))) as string[];
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, username, avatar_url').in('id', userIds);
      
      const userMap = new Map(profiles?.map((p: any) => [p.id, { username: p.username || 'Unknown', profile_image_url: p.avatar_url || '/globe.svg' }]) || []);

      filteredData.forEach((comment: any) => {
          comment.user = userMap.get(comment.user_id) || { username: 'Unknown', profile_image_url: '/globe.svg' };
      });

      // Structure replies
      const commentMap = new Map();
      const rootComments: any[] = [];
      filteredData.forEach((comment: any) => {
        comment.replies = [];
        commentMap.set(comment.comment_id, comment);
      });
      filteredData.forEach((comment: any) => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) parent.replies.push(comment);
        } else {
          rootComments.push(comment);
        }
      });
      return NextResponse.json({ comments: rootComments });
    }

    return NextResponse.json({ comments: filteredData });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 댓글 작성
export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await validateUser(request);
    if (!authenticatedUser) {
        return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const { id: userId, user } = authenticatedUser;
    const body = await request.json();
    const { projectId, project_id, content, parentCommentId, mentionedUserId, isSecret, locationX, locationY } = body;
    const targetProjectId = projectId || project_id;

    if (!targetProjectId || !content) {
      return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
    }

    // 프로젝트 정보 조회
    const { data: projectData } = await (supabaseAdmin as any)
      .from('Project')
      .select('user_id')
      .eq('project_id', targetProjectId)
      .single();

    const { data, error } = await (supabaseAdmin as any)
      .from('Comment')
      .insert([{
          user_id: userId,
          project_id: targetProjectId,
          content,
          parent_comment_id: parentCommentId || null,
          mentioned_user_id: mentionedUserId || null,
          is_secret: isSecret || false,
          location_x: locationX || null,
          location_y: locationY || null,
      }] as any)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: `댓글 작성 실패: ${error.message}` }, { status: 500 });
    }

    // [Point System] Reward (+100) if not owner
    if (projectData && projectData.user_id !== userId) {
        try {
            const REWARD = 100;
            const { data: p } = await supabaseAdmin.from('profiles').select('points').eq('id', userId).single();
            await supabaseAdmin.from('profiles').update({ points: (p?.points || 0) + REWARD }).eq('id', userId);
            await supabaseAdmin.from('point_logs').insert({ user_id: userId, amount: REWARD, reason: '피드백 작성 보상' });
            // Notification omitted for brevity/speed but can be added
        } catch(e) {}
    }

    data.user = {
       username: user?.user_metadata?.nickname || 'Unknown',
       profile_image_url: user?.user_metadata?.profile_image_url || '/globe.svg'
    };

    return NextResponse.json({ message: '댓글 작성 완료', comment: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 댓글 삭제
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('commentId');

    if (!commentId) return NextResponse.json({ error: 'commentId 필요' }, { status: 400 });

    const authenticatedUser = await validateUser(request);
    if (!authenticatedUser) {
        return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // 댓글 조회 (작성자 확인)
    const { data: comment } = await supabaseAdmin
      .from('Comment')
      .select('user_id')
      .eq('comment_id', commentId)
      .single();

    if (!comment) return NextResponse.json({ error: '댓글 없음' }, { status: 404 });

    if (comment.user_id !== authenticatedUser.id) {
       return NextResponse.json({ error: '삭제 권한 없음' }, { status: 403 });
    }

    const { error } = await (supabaseAdmin as any)
      .from('Comment')
      .update({ is_deleted: true })
      .eq('comment_id', commentId);

    if (error) return NextResponse.json({ error: '삭제 실패' }, { status: 500 });

    return NextResponse.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
