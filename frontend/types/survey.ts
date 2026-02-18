export type Answer = 'yes' | 'no' | 'depends'

export interface Survey {
    id: string
    title: string
    description: string | null
    createdAt: Date
    updatedAt: Date
}

export interface Question {
    id: string
    surveyId: string
    orderIndex: number
    text: string
    createdAt: Date
}

export interface Response {
    id: string
    surveyId: string
    nickname: string
    submittedAt: Date
}

export interface AnswerData {
    id: string
    responseId: string
    questionId: string
    value: Answer
    createdAt: Date
}

// 前端使用的型別
export interface CreateSurveyInput {
    title: string
    description?: string
    questions: string[]
}

export interface SubmitResponseInput {
    surveyId: string
    nickname: string
    answers: {
        questionId: string
        value: Answer
    }[]
}

export interface MatrixData {
    survey: Survey
    questions: Question[]
    participants: {
        id: string
        nickname: string
    }[]
    answers: Map<string, Map<string, Answer>>
}
