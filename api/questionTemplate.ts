import request from '@/utils/axios';

/** 0 跌倒 1 ADL 2 营养 3 认知 */
export type QuestionnaireType = 0 | 1 | 2 | 3;

export type QuestionOptionItem = {
    desc?: string;
    sort?: number;
    score?: number;
};

export type QuestionItem = {
    /** 0 选择题 1 选择时长 2 选择时间 3 填写 4 多选题 */
    type?: number;
    question?: string;
};

export type QuestionOption = {
    options?: QuestionOptionItem[];
    questions?: QuestionItem[];
};

export type QuestionTemplate = {
    id?: number;
    templateId?: number;
    questionOption?: QuestionOption;
    type?: QuestionnaireType;
    languageType?: string;
    sort?: number;
    delFlag?: string;
};

export type QuestionTemplateListResult = {
    code?: number;
    msg?: string;
    data?: QuestionTemplate[];
};

export const getQuestionTemplateList = (type: QuestionnaireType) =>
    request.get<QuestionTemplateListResult>('/patient/questionTemplate/list', { params: { type } });

export type UserQuestionAnswer = {
    answer?: string;
};

export type UserQuestionAnswerItem = {
    templateId?: number;
    answers?: UserQuestionAnswer[];
    options?: QuestionOptionItem[];
    questions?: QuestionItem[];
};

export type UserQuestionRecord = {
    id?: number;
    userId?: number;
    type?: QuestionnaireType;
    questionsAnswer?: UserQuestionAnswerItem[];
    customerLocalDate?: string;
    comments?: string;
    score?: number;
    delFlag?: string;
    createTime?: string;
    updateTime?: string;
};

export type UserQuestionListResult = {
    code?: number;
    msg?: string;
    total?: number;
    rows?: UserQuestionRecord[];
};

export type UserQuestionListParams = {
    type?: QuestionnaireType;
    pageSize?: number;
    pageNum?: number;
};

export const getUserQuestionFrontList = (params: UserQuestionListParams) =>
    request.get<UserQuestionListResult>('/patient/userQuestion/frontList', { params });

export type UserQuestionNewListResult = {
    code?: number;
    msg?: string;
    data?: UserQuestionRecord[];
};

export const getUserQuestionNewList = () =>
    request.get<UserQuestionNewListResult>('/patient/userQuestion/newList');

export type AddUserQuestionPayload = {
    type: QuestionnaireType;
    questionsAnswer: UserQuestionAnswerItem[];
    comments?: string;
    score?: number;
};

export type AddUserQuestionResult = {
    code?: number;
    msg?: string;
    data?: UserQuestionRecord;
};

export const addUserQuestion = (data: AddUserQuestionPayload) =>
    request.post<AddUserQuestionResult>('/patient/userQuestion/add', data);

export type UserQuestionDetailResult = {
    code?: number;
    msg?: string;
    data?: UserQuestionRecord;
};

export const getUserQuestionDetail = (id: number | string) =>
    request.get<UserQuestionDetailResult>('/patient/userQuestion/detail', { params: { id } });
