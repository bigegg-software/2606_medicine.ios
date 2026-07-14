import request from '@/utils/axios';

export type RankingItem = {
  id?: number;
  userId?: number;
  nickName?: string;
  tokens?: number;
  continuousDays?: number;
  avatar?: number | string;
  gender?: string | number;
  sort?: number;
};

export type RankingListResult = {
  code?: number;
  msg?: string;
  data?: RankingItem[];
};

export const getRankingList = () => request.get<RankingListResult>('/patient/ranking/list');
