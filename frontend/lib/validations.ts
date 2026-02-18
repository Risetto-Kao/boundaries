import { z } from 'zod'

// 基礎 Schema
export const surveyIdSchema = z.string().uuid('無效的問卷 ID')
export const nicknameSchema = z
    .string()
    .min(1, '暱稱不可空白')
    .max(50, '暱稱過長（最多 50 字）')
export const answerValueSchema = z.enum(['yes', 'no', 'depends'])

// 創建問卷
export const createSurveySchema = z.object({
    title: z
        .string()
        .min(1, '標題不可空白')
        .max(200, '標題過長（最多 200 字）'),
    description: z
        .string()
        .max(1000, '說明過長（最多 1000 字）')
        .optional()
        .or(z.literal('')),
    questions: z
        .array(z.string().min(1, '問題不可空白'))
        .min(1, '至少需要一個問題')
        .max(20, '最多 20 個問題'),
})

// 提交答案
export const submitResponseSchema = z.object({
    surveyId: surveyIdSchema,
    nickname: nicknameSchema,
    answers: z
        .array(
            z.object({
                questionId: z.string().uuid('無效的問題 ID'),
                value: answerValueSchema,
            })
        )
        .min(1, '請至少回答一個問題'),
})

// TypeScript 型別推導
export type CreateSurveyInput = z.infer<typeof createSurveySchema>
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>
