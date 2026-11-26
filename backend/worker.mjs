import grader from './grade.mjs';

export default {
  fetch(request, env) {
    return grader.fetch(request, {
      ...env,
      takeGradeSlot: async () => (await env.GRADE_LIMIT.limit({ key: 'shared-grader' })).success,
    });
  },
};
