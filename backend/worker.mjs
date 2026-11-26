import grader from './grade.mjs';
import chat from './chat.mjs';

export default {
  fetch(request, env) {
    const bindings = {
      ...env,
      takeGradeSlot: async () => (await env.GRADE_LIMIT.limit({ key: 'shared-grader' })).success,
      takeChatSlot: async () => (await env.CHAT_LIMIT.limit({ key: 'shared-chat' })).success,
    };
    return new URL(request.url).pathname === '/chat' ? chat.fetch(request, bindings) : grader.fetch(request, bindings);
  },
};
