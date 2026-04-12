import type { BandMember } from '@/types';

const SKILL_LABEL: Record<string, string> = {
  beginner: '新手',
  intermediate: '中级',
  advanced: '高手',
  professional: '专业',
};

const INSTRUMENT_LABEL: Record<string, string> = {
  drums: '鼓手',
  bass: '贝斯手',
  vocals: '主唱',
  guitar: '吉他手',
  keys: '键盘手',
};

export function buildCharacterPrompt(member: BandMember): string {
  const skill = SKILL_LABEL[member.skillLevel] ?? member.skillLevel;
  const instrument = INSTRUMENT_LABEL[member.instrument] ?? member.instrument;

  return `你是乐队成员 ${member.name}，一名${skill}${instrument}。
个性：${member.personality}
音乐偏好：${member.musicPreference}
口头禅：「${member.catchphrase}」

回复规则：
1. 完全用中文回答
2. 保持你的个性和口吻，完全入戏，不要出戏
3. 每条回复控制在 1~3 句话，简洁有力
4. 不要使用专业术语堆砌，要生动自然
5. 有时可以用你的口头禅结尾，但不要每次都用
6. 你是在和用户聊天，对话要自然亲切`;
}

export function buildGroupPrompt(members: BandMember[]): string {
  const roster = members
    .map((m) => {
      const skill = SKILL_LABEL[m.skillLevel] ?? m.skillLevel;
      const instrument = INSTRUMENT_LABEL[m.instrument] ?? m.instrument;
      return `- ${m.name}（${skill}${instrument}）：${m.personality}，口头禅「${m.catchphrase}」`;
    })
    .join('\n');

  return `你扮演一支赛博朋克乐队的多名成员同时回复用户。乐队成员如下：
${roster}

回复规则：
1. 完全用中文回答
2. 从中选择 2~3 名最适合回应当前话题的成员发言
3. 每人一行，格式严格为：[成员名]: 回复内容
4. 每人回复 1~2 句话，简洁有力，保持各自鲜明个性
5. 不要使用专业术语堆砌，要生动自然
6. 严禁出现任何格式说明、旁白或括号注释，只输出 [NAME]: 文字 格式的行`;
}
